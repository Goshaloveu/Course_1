import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { authService } from '@/api/authService';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Type definition for the Telegram widget callback data
interface TelegramLoginData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Props for the component
interface TelegramLoginButtonProps {
  botName: string;
  size?: 'large' | 'medium' | 'small';
  requestAccess?: 'write' | 'read';
}

export const TelegramLoginButton = ({
  botName,
  size = 'medium',
  requestAccess = 'write'
}: TelegramLoginButtonProps) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Function to handle Telegram auth callback
  const handleTelegramCallback = async (loginData: TelegramLoginData) => {
    try {
      const authResponse = await authService.telegramCallback(loginData);
      login(authResponse.access_token);
      navigate('/');
    } catch (error) {
      console.error('Telegram authentication failed:', error);
    }
  };

  // Check URL for Telegram callback data on initial load (if redirected from Telegram)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const telegramAuthData: Record<string, any> = {};
    
    // Extract Telegram data from URL if present
    let hasTelegramParams = false;
    for (const [key, value] of urlParams.entries()) {
      if (key === 'id' || key === 'auth_date' || key === 'hash') {
        hasTelegramParams = true;
        telegramAuthData[key] = key === 'id' ? parseInt(value) : value;
      } else if (key === 'first_name' || key === 'last_name' || key === 'username' || key === 'photo_url') {
        telegramAuthData[key] = value;
      }
    }

    // Process Telegram auth data if found in URL
    if (hasTelegramParams && telegramAuthData.id && telegramAuthData.hash) {
      handleTelegramCallback(telegramAuthData as TelegramLoginData);
    }
  }, []);

  // For development purposes, a simulated login button
  if (1) {
    return (
      <Button 
        className="bg-[#0088cc] hover:bg-[#0088cc]/90"
        onClick={() => {
          // Simulate Telegram login for development
          const mockLoginData: TelegramLoginData = {
            id: 12345678,
            first_name: 'Dev',
            last_name: 'User',
            username: 'devuser',
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mockhash123',
          };
          handleTelegramCallback(mockLoginData);
        }}
      >
        Войти через Telegram (Dev Mode)
      </Button>
    );
  }

  // In production, this component would integrate with the Telegram widget
  // For the MVP, we'll just use a button that redirects to Telegram OAuth
  return (
    <Button
      className="bg-[#0088cc] hover:bg-[#0088cc]/90"
      onClick={() => {
        // Redirect to Telegram OAuth
        // In a real implementation, you'd use the Telegram Login Widget 
        // or redirect to the Telegram OAuth URL
        window.location.href = `https://oauth.telegram.org/auth?bot_id=${botName}&origin=${window.location.origin}&return_to=${window.location.origin}`;
      }}
    >
      Войти через Telegram
    </Button>
  );
}; 