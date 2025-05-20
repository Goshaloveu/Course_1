import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/api/authService';

// Определяем типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setText: (text: string) => void;
          setParams: (params: object) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

interface TelegramMiniAppProps {
  children: React.ReactNode;
}

export const TelegramMiniApp: React.FC<TelegramMiniAppProps> = ({ children }) => {
  const { login, isAuthenticated } = useAuth();
  const [isWebApp, setIsWebApp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем, запущено ли приложение как Telegram WebApp
    const isTelegramWebApp = !!window.Telegram?.WebApp;
    setIsWebApp(isTelegramWebApp);

    if (isTelegramWebApp) {
      // Сообщаем Telegram WebApp, что мы готовы
      window.Telegram.WebApp.ready();

      // Разворачиваем WebApp на весь экран
      if (!window.Telegram.WebApp.isExpanded) {
        window.Telegram.WebApp.expand();
      }

      // Кастомизация внешнего вида
      window.Telegram.WebApp.setHeaderColor('#1e293b'); // slate-800
      window.Telegram.WebApp.setBackgroundColor('#f8fafc'); // slate-50

      // Если пользователь не авторизован и есть данные пользователя в WebApp
      if (!isAuthenticated && window.Telegram.WebApp.initDataUnsafe.user) {
        handleWebAppAuth();
      }
    }
  }, [isAuthenticated]);

  // Функция для авторизации через Telegram WebApp
  const handleWebAppAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { WebApp } = window.Telegram!;
      const telegramUser = WebApp.initDataUnsafe.user;
      
      if (!telegramUser) {
        setError('Не удалось получить данные пользователя из Telegram WebApp');
        return;
      }

      // Создаем объект с данными для авторизации
      const authData = {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || '',
        username: telegramUser.username || '',
        photo_url: telegramUser.photo_url || '',
        auth_date: WebApp.initDataUnsafe.auth_date,
        hash: WebApp.initDataUnsafe.hash
      };

      // Отправляем данные на сервер для авторизации
      const authResponse = await authService.telegramCallback(authData);
      login(authResponse.access_token);
    } catch (error) {
      console.error('Telegram WebApp authentication failed:', error);
      setError('Ошибка при авторизации через Telegram WebApp');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`telegram-mini-app ${isWebApp ? 'in-telegram' : ''}`}>
      {isWebApp && isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-center">Выполняется авторизация...</p>
          </div>
        </div>
      )}

      {isWebApp && error && (
        <div className="fixed top-4 left-4 right-4 bg-red-100 text-red-800 p-3 rounded-lg shadow z-50">
          {error}
        </div>
      )}

      {children}
    </div>
  );
}; 