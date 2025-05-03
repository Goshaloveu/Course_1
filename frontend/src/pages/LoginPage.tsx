import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import { useAuth } from '@/context/AuthContext';

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
          <div className="my-4 text-center text-gray-500">
            <p>
              Для входа в систему и регистрации на соревнования используйте ваш аккаунт Telegram.
              Это безопасно и не требует создания дополнительного пароля.
            </p>
          </div>
          <div className="mt-4">
            <TelegramLoginButton botName="YourBotName" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 