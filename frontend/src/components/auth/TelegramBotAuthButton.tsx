import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/api/authService';

export const TelegramBotAuthButton = () => {
  const [authToken, setAuthToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Open Telegram bot in a new window/tab
  const openTelegramBot = () => {
    // Use a hardcoded bot username for now
    // In production, you'll want to use environment variables
    const botUsername = 'your_bot_username';
    window.open(`https://t.me/${botUsername}`, '_blank');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!authToken.trim()) {
      setError('Пожалуйста, введите код авторизации');
      setIsLoading(false);
      return;
    }

    try {
      // Call the API to verify the token
      const response = await authService.telegramBotAuth(authToken);
      login(response.access_token);
      navigate('/');
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Неверный код авторизации или истек срок его действия');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for auth token in URL (when returning from Telegram)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setAuthToken(token);
      // Auto-submit the form if token is in the URL
      // We need to create a new function to call handleSubmit without an event
      const autoSubmit = async () => {
        try {
          const response = await authService.telegramBotAuth(token);
          login(response.access_token);
          navigate('/');
        } catch (err) {
          console.error('Auto-authentication error:', err);
          setError('Неверный код авторизации или истек срок его действия');
        }
      };
      
      autoSubmit();
    }
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      <Button 
        type="button"
        className="bg-[#0088cc] hover:bg-[#0088cc]/90 w-full"
        onClick={openTelegramBot}
      >
        Открыть Telegram бота
      </Button>
      
      <div className="text-center text-sm text-gray-500">
        или введите код, полученный от бота
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="auth-token">Код авторизации</Label>
          <Input
            id="auth-token"
            type="text"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Введите код от Telegram бота"
            className="w-full"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        
        <Button 
          type="submit"
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Проверка...' : 'Войти'}
        </Button>
      </form>
    </div>
  );
}; 