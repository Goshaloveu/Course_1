import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { competitionService } from '@/api/competitionService';
import { CompetitionDetail, CompetitionResult } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ResultsTable } from '@/components/competitions/ResultsTable';
import { formatDate, isDateBetween } from '@/utils/dateUtils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const CompetitionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  // Fetch competition details
  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await competitionService.getCompetitionById(id);
        setCompetition(data);
        
        // If results are published, fetch them
        if (data.status === 'results_published') {
          const resultsData = await competitionService.getCompetitionResults(id);
          setResults(resultsData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch competition details:', err);
        setError('Не удалось загрузить информацию о соревновании.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionDetails();
  }, [id]);

  // Handle registration
  const handleRegister = async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      setIsRegistering(true);
      await competitionService.registerForCompetition(id);
      setIsRegistered(true);
      toast.success('Вы успешно зарегистрированы на соревнование!');
    } catch (err) {
      console.error('Failed to register for competition:', err);
      toast.error('Не удалось зарегистрироваться на соревнование.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Render loading state
  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>;
  }

  // Render error state
  if (error || !competition) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Соревнование не найдено'}</p>
        <Link to="/">
          <Button>Вернуться на главную</Button>
        </Link>
      </div>
    );
  }

  // Parse external links from JSON
  let externalLinks: Record<string, string> = {};
  try {
    if (competition.external_links_json) {
      externalLinks = JSON.parse(competition.external_links_json);
    }
  } catch (err) {
    console.error('Failed to parse external links:', err);
  }

  // Check if registration is open
  const isRegistrationOpen = isDateBetween(competition.reg_start_at, competition.reg_end_at);
  
  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
        &larr; Назад к списку соревнований
      </Link>

      {/* Competition header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{competition.title}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            competition.status === 'registration_open' ? 'bg-green-100 text-green-800' :
            competition.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
            competition.status === 'results_published' ? 'bg-indigo-100 text-indigo-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {competition.status === 'registration_open' ? 'Регистрация открыта' :
             competition.status === 'registration_closed' ? 'Регистрация закрыта' :
             competition.status === 'in_progress' ? 'В процессе' :
             competition.status === 'completed' ? 'Завершено' :
             competition.status === 'results_published' ? 'Результаты опубликованы' :
             'Предстоит'}
          </span>
        </div>
        
        {/* Competition details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Информация</h2>
            <p className="text-gray-700 whitespace-pre-line">{competition.description}</p>
            
            {/* External links */}
            {Object.keys(externalLinks).length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Ссылки</h3>
                <ul className="space-y-1">
                  {Object.entries(externalLinks).map(([name, url]) => (
                    <li key={name}>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Даты и время</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Регистрация</h3>
                <p className="text-gray-700">
                  {formatDate(competition.reg_start_at)} - {formatDate(competition.reg_end_at)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Соревнование</h3>
                <p className="text-gray-700">
                  {formatDate(competition.comp_start_at)} - {formatDate(competition.comp_end_at)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Тип соревнования</h3>
                <p className="text-gray-700">
                  {competition.type === 'individual' ? 'Индивидуальное' : 
                   competition.type === 'team' ? 'Командное' : 'Другое'}
                </p>
              </div>
            </div>
            
            {/* Registration button */}
            {isAuthenticated && competition.status === 'registration_open' && isRegistrationOpen && (
              <div className="mt-6">
                <Button 
                  onClick={handleRegister}
                  disabled={isRegistering || isRegistered}
                  className="w-full"
                >
                  {isRegistering ? 'Регистрация...' : 
                   isRegistered ? 'Вы зарегистрированы' : 'Зарегистрироваться'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results section */}
      {competition.status === 'results_published' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Результаты</h2>
          <ResultsTable results={results} />
        </div>
      )}
    </div>
  );
}; 