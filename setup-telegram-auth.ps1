# PowerShell скрипт для настройки Telegram аутентификации

# Функция для генерации случайного ключа
function Get-RandomKey {
    param (
        [int]$Length = 32
    )
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToHexString($bytes).ToLower()
}

Write-Host "Настройка Telegram аутентификации" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor White

# Запрашиваем имя бота
$BOT_NAME = ""
while ([string]::IsNullOrEmpty($BOT_NAME)) {
    $BOT_NAME = Read-Host "Введите имя вашего Telegram бота (без символа @)"
    if ([string]::IsNullOrEmpty($BOT_NAME)) {
        Write-Host "Имя бота не может быть пустым" -ForegroundColor Red
    }
}

# Запрашиваем токен бота
$BOT_TOKEN = ""
while ([string]::IsNullOrEmpty($BOT_TOKEN)) {
    $BOT_TOKEN = Read-Host "Введите токен бота от BotFather"
    if ([string]::IsNullOrEmpty($BOT_TOKEN)) {
        Write-Host "Токен бота не может быть пустым" -ForegroundColor Red
    }
}

# Генерируем API ключ
$API_KEY = Get-RandomKey -Length 16
$SECRET_KEY = Get-RandomKey -Length 32

Write-Host "Создаю файлы конфигурации..." -ForegroundColor Yellow

# Создаем .env для backend
$BACKEND_ENV = @"
# Настройки безопасности
SECRET_KEY="$SECRET_KEY"

# Настройки Telegram
TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
TELEGRAM_BOT_NAME="$BOT_NAME"
TELEGRAM_BOT_API_KEY="$API_KEY"

# Настройки среды
ENVIRONMENT="local"
"@

# Создаем .env для frontend
$FRONTEND_ENV = @"
VITE_TELEGRAM_BOT_NAME="$BOT_NAME"
"@

# Создаем .env для telegram_bot
$TELEGRAM_BOT_ENV = @"
# --- Telegram ---
TELEGRAM_BOT_TOKEN="$BOT_TOKEN"
TELEGRAM_BOT_NAME="$BOT_NAME"
TELEGRAM_BOT_API_KEY="$API_KEY"
"@

# Записываем файлы
try {
    Set-Content -Path "backend\.env" -Value $BACKEND_ENV -Encoding UTF8
    Set-Content -Path "frontend\.env.local" -Value $FRONTEND_ENV -Encoding UTF8
    Set-Content -Path "telegram_bot\.env" -Value $TELEGRAM_BOT_ENV -Encoding UTF8
    
    Write-Host "Настройка завершена!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Важно: Файлы .env созданы в следующих директориях:" -ForegroundColor White
    Write-Host "- backend\.env" -ForegroundColor White
    Write-Host "- frontend\.env.local" -ForegroundColor White
    Write-Host "- telegram_bot\.env" -ForegroundColor White
    Write-Host ""
    Write-Host "Что дальше:" -ForegroundColor Yellow
    Write-Host "1. Запустите бэкенд: cd backend; uvicorn app.main:app --reload" -ForegroundColor White
    Write-Host "2. Запустите фронтенд: cd frontend; npm run dev" -ForegroundColor White
    Write-Host "3. Перейдите на страницу логина и проверьте виджет Telegram" -ForegroundColor White
    Write-Host ""
    Write-Host "ВАЖНО: Не публикуйте файлы .env в репозитории!" -ForegroundColor Red
}
catch {
    Write-Host "Произошла ошибка при создании файлов: $_" -ForegroundColor Red
} 