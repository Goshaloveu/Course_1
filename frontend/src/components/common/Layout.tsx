import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { SearchButton } from './SearchButton';
import { SocialIcons } from './SocialIcons';
import { Toaster } from '@/components/ui/sonner';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, user, isOrganizer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('RU');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header/Navbar */}
      <header className="bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="shape-512-512_blue.svg" 
              alt="YL Competitions Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">YL Competitions</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/">
              <div className="relative dark:text-slate-50 text-slate-900 hover:text-[#3B82F6] font-medium transition-all duration-200 cursor-pointer">
                Главная
                {isActive('/') && (
                  <div className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-[#3B82F6]" style={{ transform: 'none', transformOrigin: '50% 50% 0px' }}></div>
                )}
              </div>
            </Link>
            
            <Link to="/competitions">
              <div className="relative dark:text-slate-50 text-slate-900 hover:text-[#3B82F6] font-medium transition-all duration-200 cursor-pointer">
                Соревнования
                {isActive('/competitions') && (
                  <div className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-[#3B82F6]" style={{ transform: 'none', transformOrigin: '50% 50% 0px' }}></div>
                )}
              </div>
            </Link>
            
            <Link to="/teams">
              <div className="relative dark:text-slate-50 text-slate-900 hover:text-[#3B82F6] font-medium transition-all duration-200 cursor-pointer">
                Команды
                {isActive('/teams') && (
                  <div className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-[#3B82F6]" style={{ transform: 'none', transformOrigin: '50% 50% 0px' }}></div>
                )}
              </div>
            </Link>
            
            {isAuthenticated && (
              <Link to="/profile">
                <div className="relative dark:text-slate-50 text-slate-900 hover:text-[#3B82F6] font-medium transition-all duration-200 cursor-pointer">
                  Профиль
                  {isActive('/profile') && (
                    <div className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-[#3B82F6]" style={{ transform: 'none', transformOrigin: '50% 50% 0px' }}></div>
                  )}
                </div>
              </Link>
            )}
            
            {isOrganizer && (
              <Link to="/organizer">
                <div className="relative dark:text-slate-50 text-slate-900 hover:text-[#3B82F6] font-medium transition-all duration-200 cursor-pointer">
                  Панель организатора
                  {isActive('/organizer') && (
                    <div className="absolute bottom-[-4px] left-0 w-full h-[2px] bg-[#3B82F6]" style={{ transform: 'none', transformOrigin: '50% 50% 0px' }}></div>
                  )}
                </div>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <SearchButton />
              <ThemeToggle />
              
              {/* Language Selector */}
              <div className="relative">
                <button 
                  className="flex items-center justify-center w-10 h-8 rounded border border-border bg-background"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                >
                  {language}
                </button>
                
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-24 rounded-md shadow-lg bg-background border border-border z-50">
                    <div className="py-1">
                      <button
                        className={`flex items-center px-4 py-2 text-sm w-full text-left ${language === 'EN' ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}
                        onClick={() => {
                          setLanguage('EN');
                          setLangMenuOpen(false);
                        }}
                      >
                        EN
                        {language === 'EN' && (
                          <svg className="w-4 h-4 ml-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <button
                        className={`flex items-center px-4 py-2 text-sm w-full text-left ${language === 'RU' ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}
                        onClick={() => {
                          setLanguage('RU');
                          setLangMenuOpen(false);
                        }}
                      >
                        RU
                        {language === 'RU' && (
                          <svg className="w-4 h-4 ml-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {isAuthenticated ? (
              <Button variant="outline" onClick={handleLogout} className="ml-4">
                Выйти
              </Button>
            ) : (
              <Link to="/login" className="ml-4">
                <Button>Войти</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Author and info */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <img 
                  src="chat.png" 
                  alt="Georgiy Kudryashov" 
                  className="h-12 w-12 rounded-full mr-3"
                />
                <div>
                  <h3 className="text-xl font-bold">Georgiy Kudryashov</h3>
                  <p className="text-sm text-muted-foreground">18 y.o. Data Scientist from Orenburg</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Плейбой, филантроп, миценат, Data Scientist, предприниматель, инвестор.
              </p>
              <SocialIcons />
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Быстрые ссылки</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Главная
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    Обо мне
                  </Link>
                </li>
                <li>
                  <Link to="/mentorship" className="text-muted-foreground hover:text-primary transition-colors">
                    Менторство
                  </Link>
                </li>
                <li>
                  <Link to="/consulting" className="text-muted-foreground hover:text-primary transition-colors">
                    Консалтинг
                  </Link>
                </li>
                <li>
                  <Link to="/schedule" className="text-muted-foreground hover:text-primary transition-colors">
                    Запланировать встречу
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                &copy; 2025 Georgiy Kudryashov. Все права защищены.
              </p>
              <div className="flex items-center mt-2">
                <img 
                  src="vite.svg"
                  alt="Vite" 
                  className="h-4 mx-2"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}; 