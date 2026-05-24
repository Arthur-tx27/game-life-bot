# Game Life Bot

Telegram-бот для геймификации личных целей. Превращает задачи в RPG-систему с уровнями, опытом (XP) и ежедневными квестами.

## Технологии

| Слой | Технология |
|------|-----------|
| Язык | TypeScript 6 (ESM, `"type": "module"`) |
| Рантайм | Node.js |
| Бот-фреймворк | [grammy](https://grammy.dev) v1.43 |
| База данных | PostgreSQL |
| ORM | [Prisma](https://prisma.io) v7.8 с `@prisma/adapter-pg` |
| Миграции | Prisma Migrate |
| Конфигурация | `dotenv` (.env) |

**Скрипты:**

```bash
npm run dev      # tsx watch src/index.ts — разработка с hot-reload
npm run build    # tsc — компиляция TypeScript
npm run start    # node dist/index.js — продакшен
npm run lint     # eslint src/
npm run format   # prettier --write src/
```

---

## Архитектура

```
src/
├── index.ts              # Точка входа: импорт конфига, хендлеров, bot.start()
├── bot.ts                # Экземпляр grammy Bot
├── config.ts             # Загрузка .env (BOT_TOKEN, DATABASE_URL)
│
├── handlers/             # Telegram-хендлеры (side-effect регистрация)
│   ├── index.ts          # Импорт всех хендлеров в нужном порядке
│   ├── start.ts          # /start — профиль + пин сообщения
│   ├── text.ts           # Middleware: роутинг текста (диалоги vs меню)
│   ├── menu.ts           # /menu — клавиатура «Профиль» / «Цели»
│   ├── profile.ts        # Карточка профиля с уровнем и целями
│   ├── callback.ts       # Роутер inline-кнопок (callback_query:data)
│   └── goals/
│       ├── list.ts       # Список целей (inline-клавиатура)
│       ├── view.ts       # Просмотр цели + renderGoalView()
│       ├── add.ts        # Диалог создания цели (3 шага)
│       └── subtasks/
│           ├── index.ts  # Реэкспорт
│           ├── add.ts    # Диалог создания задачи (2 шага)
│           └── callbacks.ts  # Колбэки: выбор типа, переключение задачи
│
├── lib/                  # Утилиты
│   ├── prisma.ts         # Подключение PrismaClient через Pg adapter
│   ├── dialogs.ts        # Кастомная диалоговая система (in-memory)
│   ├── format.ts         # Форматирование чисел, прогресс-баров
│   └── cooldown.ts       # Расчёт кулдауна ежедневных задач (12ч)
│
└── services/             # Бизнес-логика
    ├── user.ts           # findOrCreateUser (upsert)
    ├── goal.ts           # CRUD целей и задач, XP-логика
    ├── leveling.ts       # Уровни: формулы XP → lvl
    └── profile.ts        # Сборка карточки профиля (аватар + подпись)
```

### Принцип регистрации хендлеров

Хендлеры регистрируются через **side-effect импорт**. Каждый файл в `src/handlers/` вызывает `bot.command()`, `bot.hears()`, `bot.on()`, `bot.use()` на верхнем уровне. Порядок импортов в `handlers/index.ts` важен — определяет порядок middleware.

```
handlers/index.ts:
  start.ts (команда /start)
  text.ts  (middleware: диалоги + меню)
  menu.ts  (команда /menu)
  profile.ts (hears 'Профиль')
  goals/list.ts
  goals/view.ts
  goals/add.ts
  goals/subtasks/
  callback.ts (callback_query:data)
```

---

## База данных

### Схема (Prisma)

```
User ──< Goal ──< Subtask
```

### Модели

**User** — игрок
| Поле | Тип | Описание |
|------|-----|---------|
| id | Int (PK) | Внутренний ID |
| telegramId | BigInt (unique) | Telegram user ID |
| username | String? | @username |
| firstName | String? | Имя в Telegram |
| totalXp | Int (default: 0) | Суммарный опыт |
| createdAt | DateTime | Дата регистрации |

**Goal** — цель
| Поле | Тип | Описание |
|------|-----|---------|
| id | Int (PK) | |
| userId | Int (FK → User) | Владелец |
| title | String | Название |
| description | String? | Описание |
| requiredXp | Int | XP для завершения |
| currentXp | Int (default: 0) | Накопленный XP |
| isCompleted | Boolean (default: false) | Завершена? |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Subtask** — задача внутри цели
| Поле | Тип | Описание |
|------|-----|---------|
| id | Int (PK) | |
| goalId | Int (FK → Goal, cascade delete) | Родительская цель |
| title | String | Название |
| description | String? | |
| type | SUBTASK_TYPE (default: DAILY) | Тип задачи |
| xpReward | Int | Награда XP |
| isCompleted | Boolean (default: false) | Выполнена? |
| completedAt | DateTime? | Когда выполнена (для DAILY) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Enum SUBTASK_TYPE

| Значение | Поведение |
|----------|----------|
| `DAILY` | Можно выполнять безлимитно, кулдаун **12 часов** между выполнениями |
| `MEDIUM` | Выполняется один раз, можно отменить (XP отнимется) |
| `HARD` | Выполняется один раз, можно отменить (XP отнимется) |

---

## Ключевые концепции

### Диалоговая система (`lib/dialogs.ts`)

Самописная in-memory система для многошагового ввода (замена `grammy conversations`).

```typescript
interface DialogState {
  userId: number;
  step: number;          // текущий шаг
  data: Record<string, unknown>;  // собираемые данные
  steps: DialogStep[];
}

interface DialogStep {
  prompt: string;        // текст, отправляемый пользователю
  handler: (chatId, text) => StepResult;  // обработчик ввода
}

type StepResult = 'next' | 'retry' | 'done';
```

- `startDialog(chatId, state)` — регистрирует диалог, отправляет prompt первого шага
- `handleDialogInput(chatId, text)` — вызывается на каждый текст, передаёт в handler текущего шага
- `'next'` — перейти к следующему шагу, отправить его prompt
- `'retry'` — повторить текущий шаг (не прошла валидация)
- `'done'` — удалить диалог
- `cancelDialog(chatId)` — принудительная отмена
- `isInDialog(chatId)` — проверка

**Хранится только в памяти** (`Map<number, DialogState>`), при перезапуске бота теряется.

**Маршрутизация текста** (`handlers/text.ts`):
1. Если сообщение — команда или кнопка меню → отмена диалога + передача дальше
2. Если пользователь в диалоге → `handleDialogInput()`
3. Иначе → пропустить

### Уровневая система (`services/leveling.ts`)

- `BASE_XP = 1000` — базовый XP для формулы
- `SCALE = 1.5` — экспоненциальный коэффициент
- Формула уровня: `Level = floor((totalXp / 1000)^(1/1.5)) + 1`
- Аватары: `img/level-references/image_part_1.png` … `image_part_9.png`
- Уровень capped на 9 (все уровни >9 используют image_part_9.png)

### XP-логика

- **Начисление**: выполнение задачи добавляет `xpReward` к `Goal.currentXp` и `User.totalXp`
- **Отмена выполнения** (MEDIUM/HARD): XP отнимается у цели и пользователя, `currentXp` не может уйти ниже 0
- **Завершение цели**: когда `currentXp >= requiredXp`, цель помечается `isCompleted = true`, все невыполненные задачи удаляются
- **Выполненная цель**: нельзя добавить новые задачи, нельзя отмечать существующие

### Ежедневные задачи (DAILY) и кулдаун

- Кулдаун: **12 часов** от момента последнего выполнения
- Проверяется на лету при клике на задачу
- Если кулдаун не прошёл — пользователь видит оставшееся время в `answerCallbackQuery`
- `completedAt` обновляется при каждом выполнении
- `isCompleted` для DAILY не используется

---

## Команды и сценарии

### Команды

| Команда | Действие |
|---------|---------|
| `/start` | Создать/обновить пользователя, показать профиль, закрепить сообщение |
| `/menu` | Показать клавиатуру `[Профиль] [Цели]` |

### Кнопки меню (persistent keyboard)

| Кнопка | Действие |
|--------|---------|
| `Профиль` | Карточка профиля: аватар, уровень, прогресс-бар, список целей |
| `Цели` | Список целей с inline-кнопками |

### Сценарий: создание цели

1. Пользователь жмёт `➕ Добавить цель` в списке целей
2. Диалог (3 шага):
   - **Шаг 1**: «Введите название цели:»
   - **Шаг 2**: «Введите описание цели (или `-` чтобы пропустить):»
   - **Шаг 3**: «Сколько опыта нужно набрать? (число):» — с подсказками: Лёгкая ~5 000 XP, Средняя ~10 000 XP, Сложная ~20 000 XP
3. Цель создана, бот присылает подтверждение

### Сценарий: просмотр цели

Клик на цель в списке → карточка цели:
```
🎯 Название цели
⭐ ▰▰▰▰▰▱▱▱▱▱ 50%
      (500/1000 XP)
📝 Описание

[🔄 Задача 1  +50 XP]
[📋 Задача 2  +100 XP]  ← success-стиль, если выполнена
[💪 Задача 3  +200 XP]
[➕ Добавить задачу]
```

Задачи отсортированы: **ежедневные → средние → сложные**, внутри типа по `id`.

### Сценарий: добавление задачи к цели

1. Клик `➕ Добавить задачу` → выбор типа: `[🔄 Ежедневная] [📋 Средняя] [💪 Сложная]`
2. Выбор типа → диалог (2 шага):
   - **Шаг 1**: «Введите название задачи:»
   - **Шаг 2**: «Введите кол-во XP за выполнение:»
3. Задача создана → подтверждение + обновлённая карточка цели

### Сценарий: выполнение задачи

- Клик на задачу в карточке цели
- **DAILY**: проверка кулдауна → начислить XP, обновить `completedAt`, перерисовать цель
- **MEDIUM/HARD**: переключить ✅/⬜ → начислить/отнять XP, перерисовать цель
- **Цель выполнена**: при достижении порога XP — авто-завершение, удаление невыполненных задач

---

## Формат callback_data

Все inline-кнопки используют формат `action:params`:

| Кнопка | callback_data | Обработчик |
|--------|--------------|-----------|
| Цель в списке | `goal:123` | `showGoal(ctx, 123)` |
| «Все цели» | `goals_list` | `showGoalsList(ctx)` |
| «Добавить цель» | `add_goal` | `startAddGoal(ctx)` |
| «Добавить задачу» | `add_subtask:123` | `showSubtaskTypePicker(ctx, 123)` |
| Тип задачи | `subtask_type:123:DAILY` | `handleSubtaskType(ctx, 123, 'DAILY')` |
| Задача | `subtask:456` | `handleSubtaskToggle(ctx, 456)` |

---

## API сервисов

### `services/user.ts`

```typescript
findOrCreateUser(telegramId, username?, firstName?) → User
```
Upsert пользователя по telegramId, обновляет username/firstName при повторном заходе.

### `services/goal.ts`

| Функция | Описание |
|---------|---------|
| `getUserGoals(userId)` | Все цели пользователя с подзадачами, сортировка: новые сверху |
| `findGoal(goalId)` | Цель с подзадачами |
| `createGoal(data)` | Создать цель + опционально подзадачи |
| `addXpToGoal(goalId, xp)` | Начислить/отнять XP цели. Авто-завершение при `currentXp >= requiredXp`, удаление невыполненных задач |
| `addXpToUser(userId, xp)` | Начислить/отнять XP пользователю |
| `createSubtask(data)` | Создать задачу. Ошибка если цель выполнена |
| `toggleSubtask(subtaskId)` | Переключить выполнение задачи. Бросает ошибку если кулдаун / цель выполнена. Возвращает `{ goalId }` |

### `services/leveling.ts`

| Функция | Описание |
|---------|---------|
| `getLevel(totalXp)` | Уровень по XP (1-9, capped) |
| `getXpForLevel(level)` | XP, необходимый для достижения уровня |
| `getXpToNextLevel(totalXp)` | Сколько XP осталось до следующего уровня |
| `getLevelProgress(totalXp)` | Прогресс в процентах (0-100) |
| `getActualAvatarPath(level)` | Путь к файлу аватара |

### `services/profile.ts`

| Функция | Описание |
|---------|---------|
| `getProfileCard(totalXp, firstName)` | Сборка `ProfileCard`: имя, уровень, прогресс, аватар |
| `buildProfileCaption(card, extra?)` | Формирование Markdown-подписи к фото профиля |

### `lib/cooldown.ts`

```typescript
getDailyCooldownRemaining(completedAt: Date | null) → string | null
```
Возвращает оставшееся время кулдауна в формате `"Xч Yм"` или `null` если кулдаун прошёл / не было выполнений.

### `lib/format.ts`

| Экспорт | Описание |
|---------|---------|
| `formatNumber(n)` | `1000000` → `"1 000 000"` |
| `buildProgressBar(percent)` | `50` → `"▰▰▰▰▰▱▱▱▱▱"` (10 сегментов) |
| `formatGoalProgress(current, required)` | `"▰▰▱▱▱▱▱▱▱▱ 25%"` |
| `GOAL_XP_LINE_INDENT` | `"      "` — отступ для строки с XP в карточке цели |

---

## Конфигурация

### .env

```env
BOT_TOKEN=<токен бота от @BotFather>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/game_life
```

### tsconfig.json

- target: ES2023
- module: ESNext
- moduleResolution: bundler
- strict: true
- rootDir: src → outDir: dist

---

## Разработка

### Запуск

```bash
npm run dev     # tsx watch — авто-перезагрузка при изменениях
```

### Миграции

```bash
# После изменения schema.prisma:
npx prisma migrate dev --name описание_миграции

# Только перегенерировать клиент (после pull или ручных правок):
npx prisma generate
```

### Код-стайл

```bash
npm run lint     # eslint (any → warn, неиспользуемые переменные → error)
npm run format   # prettier: singleQuote, trailingComma: all, printWidth: 90
```

---

## Развёртывание

```bash
npm run build          # tsc → dist/
npm run start          # node dist/index.js
```

Перед запуском убедиться что:
- PostgreSQL запущен и БД создана
- `.env` содержит валидные `BOT_TOKEN` и `DATABASE_URL`
- Миграции применены (`npx prisma migrate deploy`)
- В `img/level-references/` лежат файлы `image_part_1.png` … `image_part_9.png`
