import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { useAuth } from '@/context/AuthContext';

// Используем имя бота из переменной окружения или официальное имя
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'YL_CodeBot';
console.log('Telegram Bot Name:', TELEGRAM_BOT_NAME);

export const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Войдите с помощью вашего аккаунта Telegram для доступа к платформе
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {/* <div className="my-4 text-center text-gray-500">
            <p>
              Нажмите на кнопку ниже, чтобы войти через Telegram. 
              Это быстро, безопасно и не требует создания дополнительного пароля.
            </p>
          </div> */}
          
          <div className="mt-6 w-full flex justify-center">
            <TelegramLoginButton 
              botName={TELEGRAM_BOT_NAME} 
              size="large" 
              cornerRadius={10}
            />
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-400">
            <p>
              При входе через Telegram вы соглашаетесь с условиями использования сервиса 
              и даете согласие на обработку ваших персональных данных.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 