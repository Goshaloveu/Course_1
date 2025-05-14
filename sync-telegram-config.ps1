# PowerShell скрипт для синхронизации настроек Telegram бота из корневого .env

Write-Host "Синхронизация настроек Telegram бота" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor White

# Проверяем существование корневого .env файла
if (-not (Test-Path -Path ".env")) {
    Write-Host "Ошибка: Файл .env не найден в корне проекта!" -ForegroundColor Red
    Write-Host "Пожалуйста, убедитесь, что файл .env находится в директории: $((Get-Location).Path)" -ForegroundColor Red
    exit 1
}

# Читаем содержимое корневого .env файла
$rootEnvContent = Get-Content -Path ".env" -Raw
Write-Host "Файл .env найден. Извлекаю настройки Telegram..." -ForegroundColor Yellow

# Извлекаем переменные Telegram бота с помощью регулярных выражений
$botNameMatch = [regex]::Match($rootEnvContent, 'VITE_TELEGRAM_BOT_NAME="?([^"\r\n]+)"?')
$botTokenMatch = [regex]::Match($rootEnvContent, 'TELEGRAM_BOT_TOKEN="?([^"\r\n]+)"?')
$botApiKeyMatch = [regex]::Match($rootEnvContent, 'TELEGRAM_BOT_API_KEY="?([^"\r\n]+)"?')

# Проверяем, найдены ли переменные
$botName = if ($botNameMatch.Success) { $botNameMatch.Groups[1].Value } else { $null }
$botToken = if ($botTokenMatch.Success) { $botTokenMatch.Groups[1].Value } else { $null }
$botApiKey = if ($botApiKeyMatch.Success) { $botApiKeyMatch.Groups[1].Value } else { $null }

# Если API ключ не найден, генерируем новый
if (-not $botApiKey) {
    $botApiKey = -join ((48..57) + (97..122) | Get-Random -Count 16 | ForEach-Object { [char]$_ })
    Write-Host "API ключ не найден, сгенерирован новый: $botApiKey" -ForegroundColor Yellow
}

# Проверяем наличие минимально необходимых переменных
if (-not $botName) {
    Write-Host "Ошибка: Переменная VITE_TELEGRAM_BOT_NAME не найдена в .env файле!" -ForegroundColor Red
    exit 1
}

if (-not $botToken) {
    Write-Host "Предупреждение: Переменная TELEGRAM_BOT_TOKEN не найдена. Виджет будет работать, но авторизация на бэкенде будет неудачной!" -ForegroundColor Yellow
}

# Выводим найденные настройки
Write-Host "Найдены следующие настройки:" -ForegroundColor Green
Write-Host "- Имя бота: $botName" -ForegroundColor White
if ($botToken) {
    $maskedToken = $botToken.Substring(0, 5) + "..." + $botToken.Substring($botToken.Length - 5)
    Write-Host "- Токен бота: $maskedToken" -ForegroundColor White
} else {
    Write-Host "- Токен бота: НЕ НАЙДЕН" -ForegroundColor Yellow
}
Write-Host "- API ключ: $botApiKey" -ForegroundColor White

# Создаем .env.local для frontend
$frontendEnv = @"
VITE_TELEGRAM_BOT_NAME="$botName"
"@

# Создаем .env для backend (используя только найденные переменные)
$backendEnv = @"
# Настройки Telegram
"@

if ($botToken) {
    $backendEnv += @"

TELEGRAM_BOT_TOKEN="$botToken"
"@
}

$backendEnv += @"

TELEGRAM_BOT_NAME="$botName"
TELEGRAM_BOT_API_KEY="$botApiKey"
"@

# Создаем .env для telegram_bot
$telegramBotEnv = @"
# --- Telegram ---
"@

if ($botToken) {
    $telegramBotEnv += @"

TELEGRAM_BOT_TOKEN="$botToken"
"@
}

$telegramBotEnv += @"

TELEGRAM_BOT_NAME="$botName"
TELEGRAM_BOT_API_KEY="$botApiKey"
"@

# Записываем файлы
try {
    # Проверяем наличие директорий
    if (-not (Test-Path -Path "frontend")) {
        Write-Host "Директория frontend не найдена. Создание файла пропущено." -ForegroundColor Yellow
    } else {
        Set-Content -Path "frontend\.env.local" -Value $frontendEnv -Encoding UTF8
        Write-Host "Файл frontend\.env.local создан" -ForegroundColor Green
    }
    
    if (-not (Test-Path -Path "backend")) {
        Write-Host "Директория backend не найдена. Создание файла пропущено." -ForegroundColor Yellow
    } else {
        # Проверяем, существует ли уже .env в backend
        $backendEnvPath = "backend\.env"
        if (Test-Path -Path $backendEnvPath) {
            # Читаем существующий файл
            $existingBackendEnv = Get-Content -Path $backendEnvPath -Raw
            
            # Обновляем только настройки Telegram в существующем файле
            $updatedEnv = $existingBackendEnv -replace 'TELEGRAM_BOT_NAME="[^"]*"', "TELEGRAM_BOT_NAME=`"$botName`""
            
            if ($botToken) {
                $updatedEnv = $updatedEnv -replace 'TELEGRAM_BOT_TOKEN="[^"]*"', "TELEGRAM_BOT_TOKEN=`"$botToken`""
            }
            
            $updatedEnv = $updatedEnv -replace 'TELEGRAM_BOT_API_KEY="[^"]*"', "TELEGRAM_BOT_API_KEY=`"$botApiKey`""
            
            # Записываем обновленный файл
            Set-Content -Path $backendEnvPath -Value $updatedEnv -Encoding UTF8
        } else {
            # Создаем новый файл
            Set-Content -Path $backendEnvPath -Value $backendEnv -Encoding UTF8
        }
        Write-Host "Файл backend\.env обновлен" -ForegroundColor Green
    }
    
    if (-not (Test-Path -Path "telegram_bot")) {
        Write-Host "Директория telegram_bot не найдена. Создание файла пропущено." -ForegroundColor Yellow
    } else {
        # Проверяем, существует ли уже .env в telegram_bot
        $telegramBotEnvPath = "telegram_bot\.env"
        if (Test-Path -Path $telegramBotEnvPath) {
            # Читаем существующий файл
            $existingTelegramBotEnv = Get-Content -Path $telegramBotEnvPath -Raw
            
            # Обновляем только настройки Telegram в существующем файле
            $updatedEnv = $existingTelegramBotEnv -replace 'TELEGRAM_BOT_NAME="[^"]*"', "TELEGRAM_BOT_NAME=`"$botName`""
            
            if ($botToken) {
                $updatedEnv = $updatedEnv -replace 'TELEGRAM_BOT_TOKEN="[^"]*"', "TELEGRAM_BOT_TOKEN=`"$botToken`""
            }
            
            $updatedEnv = $updatedEnv -replace 'TELEGRAM_BOT_API_KEY="[^"]*"', "TELEGRAM_BOT_API_KEY=`"$botApiKey`""
            
            # Записываем обновленный файл
            Set-Content -Path $telegramBotEnvPath -Value $updatedEnv -Encoding UTF8
        } else {
            # Создаем новый файл
            Set-Content -Path $telegramBotEnvPath -Value $telegramBotEnv -Encoding UTF8
        }
        Write-Host "Файл telegram_bot\.env обновлен" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Синхронизация завершена!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Что дальше:" -ForegroundColor Yellow
    Write-Host "1. Перезапустите бэкенд: cd backend; uvicorn app.main:app --reload" -ForegroundColor White
    Write-Host "2. Перезапустите фронтенд: cd frontend; npm run dev" -ForegroundColor White
    Write-Host "3. Проверьте работу виджета на странице входа" -ForegroundColor White
}
catch {
    Write-Host "Произошла ошибка при создании файлов: $_" -ForegroundColor Red
} 