import { bot } from '../bot';

type StepResult = 'next' | 'retry' | 'done';

export interface DialogStep {
  prompt: string;
  handler: (chatId: number, text: string) => StepResult | Promise<StepResult>;
}

export interface DialogState {
  userId: number;
  step: number;
  data: Record<string, unknown>;
  steps: DialogStep[];
}

const dialogs = new Map<number, DialogState>();

export function startDialog(chatId: number, state: DialogState): void {
  dialogs.set(chatId, state);
  sendPrompt(chatId, state);
}

export function cancelDialog(chatId: number): void {
  dialogs.delete(chatId);
}

export function isInDialog(chatId: number): boolean {
  return dialogs.has(chatId);
}

export async function handleDialogInput(
  chatId: number,
  text: string,
): Promise<boolean> {
  const state = dialogs.get(chatId);
  if (!state) return false;

  const currentStep = state.steps[state.step];
  if (!currentStep) {
    dialogs.delete(chatId);
    return false;
  }

  const result = await currentStep.handler(chatId, text);

  switch (result) {
    case 'next':
      state.step++;
      if (state.step >= state.steps.length) {
        dialogs.delete(chatId);
        return true;
      }
      sendPrompt(chatId, state);
      return true;

    case 'retry':
      sendPrompt(chatId, state);
      return true;

    case 'done':
      dialogs.delete(chatId);
      return true;
  }
}

function sendPrompt(chatId: number, state: DialogState): void {
  const currentStep = state.steps[state.step];
  if (currentStep) {
    bot.api.sendMessage(chatId, currentStep.prompt);
  }
}
