import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { authService } from '@/api/authService';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Добавляем интерфейс для данных, которые возвращает Telegram Login Widget
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Объявляем тип для window с доступом к onTelegramAuth
declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

// Props for the component
interface TelegramLoginButtonProps {
  botName: string;
  size?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write' | 'read';
}

export const TelegramLoginButton = ({
  botName,
  size = 'large',
  cornerRadius = 10,
  requestAccess = 'write'
}: TelegramLoginButtonProps) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Callback функция для Telegram Login Widget
  const handleTelegramAuth = async (user: TelegramUser) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Telegram auth data:', user);
      const authResponse = await authService.telegramCallback(user);
      login(authResponse.access_token);
      navigate('/');
    } catch (error) {
      console.error('Telegram authentication failed:', error);
      setError('Ошибка при авторизации через Telegram. Пожалуйста, попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  // Устанавливаем глобальную функцию для Telegram Login Widget
  useEffect(() => {
    // Устанавливаем глобальный callback для виджета
    window.onTelegramAuth = handleTelegramAuth;
    
    // Очистка при размонтировании
    return () => {
      window.onTelegramAuth = undefined;
    };
  }, []);
  
  // Параметры Telegram Login Widget
  useEffect(() => {
    // Проверяем, есть ли имя бота
    if (!botName) {
      setError('Имя бота не указано. Проверьте настройки переменных окружения.');
      return;
    }

    // Парсим имя бота, удаляя спецсимволы для корректной работы виджета
    const sanitizedBotName = botName.replace(/[^a-zA-Z0-9_]/g, '');
    console.log('Original bot name:', botName);
    console.log('Sanitized bot name:', sanitizedBotName);
    
    // Очистка предыдущих скриптов (если есть)
    if (buttonRef.current) {
      buttonRef.current.innerHTML = '';
    }
    
    // Создаем скрипт для официального Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', sanitizedBotName);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess);
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    
    // Обработка ошибок загрузки скрипта
    script.onerror = () => {
      setError('Не удалось загрузить виджет Telegram. Проверьте подключение к интернету.');
    };
    
    // Добавляем скрипт на страницу
    if (buttonRef.current) {
      buttonRef.current.appendChild(script);
    }
    
    // Очистка при размонтировании
    return () => {
      if (buttonRef.current && script.parentNode) {
        buttonRef.current.removeChild(script);
      }
    };
  }, [botName, size, cornerRadius, requestAccess]);

  // Проверяем URL на наличие параметров от Telegram OAuth при загрузке
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    const hash = searchParams.get('hash');
    
    // Если в URL есть параметры от Telegram Login
    if (id && hash) {
      // Собираем данные из URL
      const authData: Record<string, any> = {};
      for (const [key, value] of searchParams.entries()) {
        if (['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash'].includes(key)) {
          authData[key] = key === 'id' || key === 'auth_date' ? parseInt(value) : value;
        }
      }
      
      // Обрабатываем данные Telegram OAuth
      handleTelegramAuth(authData as TelegramUser);
      
      // Очищаем URL от параметров авторизации
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  return (
    <div className="telegram-login">
      {/* Контейнер для виджета Telegram Login */}
      <div ref={buttonRef} className="flex justify-center min-h-[50px]"></div>
      
      {/* Сообщение об ошибке Domain Invalid */}
      <div className="mt-3 text-center">
        <div className="p-2 bg-yellow-100 text-amber-800 text-xs rounded-md mb-3">
          <p><strong>Ошибка "Bot domain invalid"?</strong></p>
          <p>Привяжите домен в настройках бота через команду /setdomain в BotFather</p>
        </div>
      </div>
      
      {/* Показываем ошибку, если она есть */}
      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-800 text-xs rounded-md">
          {error}
        </div>
      )}
      
      {/* Показываем отладочную информацию о текущем боте */}
      {!botName && (
        <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md">
          Имя бота не указано. Проверьте переменную VITE_TELEGRAM_BOT_NAME в .env файле.
        </div>
      )}
      
      {/* Показываем индикатор загрузки */}
      {isLoading && (
        <div className="mt-3 text-center text-sm text-gray-500">
          Выполняется авторизация...
        </div>
      )}
      
      {/* Запасной вариант для разработки */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">Для тестирования используйте режим разработки:</p>
        <Button 
          className="bg-[#0088cc] hover:bg-[#0088cc]/90"
          onClick={() => {
            // Симуляция входа для разработки
            const mockLoginData: TelegramUser = {
              id: 12345678,
              first_name: 'Dev',
              last_name: 'User',
              username: 'devuser',
              auth_date: Math.floor(Date.now() / 1000),
              hash: 'mockhash123',
            };
            handleTelegramAuth(mockLoginData);
          }}
        >
          Войти через Telegram (Dev Mode)
        </Button>
      </div>
    </div>
  );
}; 