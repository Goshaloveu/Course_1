import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, user, isOrganizer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Соревнования YL
          </Link>

          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-gray-900">
              Главная
            </Link>
            {isAuthenticated && (
              <Link to="/profile" className="text-gray-700 hover:text-gray-900">
                Профиль
              </Link>
            )}
            {isOrganizer && (
              <Link to="/organizer" className="text-gray-700 hover:text-gray-900">
                Панель организатора
              </Link>
            )}
            {isAuthenticated ? (
              <Button variant="outline" onClick={handleLogout}>
                Выйти
              </Button>
            ) : (
              <Link to="/login">
                <Button>Войти</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-6">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Соревнования YL. Все права защищены.</p>
        </div>
      </footer>
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}; 