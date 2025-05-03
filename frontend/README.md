# Платформа Соревнований "ЯЛ" (Frontend)

Frontend-приложение для платформы соревнований "ЯЛ", построенное на React с использованием TypeScript, Tailwind CSS и shadcn/ui.

## Особенности

- Просмотр списка соревнований и подробной информации
- Регистрация на соревнования
- Авторизация через Telegram
- Панель управления для организаторов соревнований
- Просмотр и публикация результатов

## Технологии

- React + TypeScript
- Vite (сборка)
- React Router (маршрутизация)
- Tailwind CSS (стилизация)
- shadcn/ui (компоненты UI)
- Axios (API-запросы)

## Требования

- Node.js 16+
- npm или yarn

## Установка

1. Клонируйте репозиторий:
   ```
   git clone <repository-url>
   cd competition-platform
   ```

2. Установите зависимости:
   ```
   npm install
   ```

3. Создайте файл `.env` в корне проекта:
   ```
   VITE_API_URL=http://127.0.0.1:8000
   ```

## Запуск

Для запуска в режиме разработки:

```
npm run dev
```

Приложение будет доступно по адресу [http://localhost:5173](http://localhost:5173).

## Сборка

Для сборки приложения:

```
npm run build
```

Для предварительного просмотра собранного приложения:

```
npm run preview
```

## Интеграция с Backend

Frontend интегрируется с FastAPI Backend по следующим маршрутам:

- **Авторизация**: `/api/v1/auth/telegram/callback`
- **Пользователи**: `/api/v1/users/me`
- **Соревнования**: `/api/v1/competitions`, `/api/v1/competitions/{id}`
- **Результаты**: `/api/v1/competitions/{id}/results`
- **Регистрация**: `/api/v1/competitions/{id}/register`
- **Управление организатора**: Различные маршруты под `/api/v1/organizer/...`

## Структура проекта

```
src/
├── api/                 # API-клиент и сервисы для работы с API
├── components/          # Компоненты React
│   ├── ui/              # shadcn/ui компоненты
│   ├── auth/            # Компоненты авторизации
│   ├── common/          # Общие компоненты
│   ├── competitions/    # Компоненты для соревнований
│   └── organizer/       # Компоненты панели организатора
├── context/             # React Context (AuthContext)
├── pages/               # Страницы приложения
├── types/               # TypeScript типы
└── utils/               # Утилиты
```

## Добавление компонентов shadcn/ui

Для добавления новых компонентов shadcn/ui:

```
npx shadcn@latest add <component-name>
```

Например:

```
npx shadcn@latest add button
npx shadcn@latest add card
```

## Разработка

### Telegram OAuth

Для авторизации через Telegram в проекте используется Telegram OAuth. В режиме разработки реализован мок для авторизации, но для продакшена необходимо настроить Telegram Bot и зарегистрировать адрес обратного вызова.

### Работа с API

Все запросы к API инкапсулированы в соответствующих сервисах в директории `src/api`. Базовый URL API настраивается через переменную окружения `VITE_API_URL`.
