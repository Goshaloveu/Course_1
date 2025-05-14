#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Настройка Telegram аутентификации${NC}"
echo "=================================="

# Запрашиваем имя бота
read -p "Введите имя вашего Telegram бота (без символа @): " BOT_NAME
while [[ -z "$BOT_NAME" ]]; do
  echo -e "${RED}Имя бота не может быть пустым${NC}"
  read -p "Введите имя вашего Telegram бота (без символа @): " BOT_NAME
done

# Запрашиваем токен бота
read -p "Введите токен бота от BotFather: " BOT_TOKEN
while [[ -z "$BOT_TOKEN" ]]; do
  echo -e "${RED}Токен бота не может быть пустым${NC}"
  read -p "Введите токен бота от BotFather: " BOT_TOKEN
done

# Генерируем API ключ
API_KEY=$(openssl rand -hex 16)

echo -e "${YELLOW}Создаю файлы конфигурации...${NC}"

# Создаем .env для backend
cat > backend/.env << EOF
# Настройки безопасности
SECRET_KEY="$(openssl rand -hex 32)"

# Настройки Telegram
TELEGRAM_BOT_TOKEN="${BOT_TOKEN}"
TELEGRAM_BOT_NAME="${BOT_NAME}"
TELEGRAM_BOT_API_KEY="${API_KEY}"

# Настройки среды
ENVIRONMENT="local"
EOF

# Создаем .env для frontend
cat > frontend/.env.local << EOF
VITE_TELEGRAM_BOT_NAME="${BOT_NAME}"
EOF

# Создаем .env для telegram_bot
cat > telegram_bot/.env << EOF
# --- Telegram ---
TELEGRAM_BOT_TOKEN="${BOT_TOKEN}"
TELEGRAM_BOT_NAME="${BOT_NAME}"
TELEGRAM_BOT_API_KEY="${API_KEY}"
EOF

echo -e "${GREEN}Настройка завершена!${NC}"
echo ""
echo "Важно: Файлы .env созданы в следующих директориях:"
echo "- backend/.env"
echo "- frontend/.env.local"
echo "- telegram_bot/.env"
echo ""
echo -e "${YELLOW}Что дальше:${NC}"
echo "1. Запустите бэкенд: cd backend && uvicorn app.main:app --reload"
echo "2. Запустите фронтенд: cd frontend && npm run dev"
echo "3. Перейдите на страницу логина и проверьте виджет Telegram"
echo ""
 