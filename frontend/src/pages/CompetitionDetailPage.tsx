import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { competitionService } from '@/api/competitionService';
import { CompetitionDetail, CompetitionResult, CompetitionStatus, TeamRegistrationPayload, Team, TeamMember } from '@/types/api';
import { Button } from '@/components/ui/button';
import { ResultsTable } from '@/components/competitions/ResultsTable';
import { formatDate, isDateBetween } from '@/utils/dateUtils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const CompetitionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  
  // Team state
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState<boolean>(false);
  const [showTeamDialog, setShowTeamDialog] = useState<boolean>(false);

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
        
        // Check if user is registered or is the organizer
        if (isAuthenticated) {
          try {
            const registrationStatus = await competitionService.checkRegistrationStatus(id);
            setIsRegistered(registrationStatus.is_registered);
            setIsOrganizer(registrationStatus.is_organizer);
          } catch (error) {
            console.error('Failed to check registration status', error);
          }
        }
        
        // Fetch teams for team competition
        if (data.type === 'team') {
          try {
            const teamsData = await competitionService.getCompetitionTeams(id);
            setTeams(teamsData);
          } catch (error) {
            console.error('Failed to fetch teams', error);
          }
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
  }, [id, isAuthenticated]);

  // Handle individual registration
  const handleRegister = async () => {
    if (!id || !isAuthenticated) return;
    
    try {
      setIsRegistering(true);
      await competitionService.registerForCompetition(id);
      setIsRegistered(true);
      toast.success('Вы успешно зарегистрированы на соревнование!');
    } catch (err: any) {
      console.error('Failed to register for competition:', err);
      const errorMessage = err.response?.data?.detail || 'Не удалось зарегистрироваться на соревнование.';
      toast.error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Handle team creation
  const handleCreateTeam = async () => {
    if (!id || !isAuthenticated || !teamName.trim()) return;
    
    try {
      setIsCreatingTeam(true);
      const teamData: TeamRegistrationPayload = { name: teamName.trim() };
      const newTeam = await competitionService.createTeam(id, teamData);
      setTeams([...teams, newTeam]);
      setIsRegistered(true);
      setTeamName('');
      setShowTeamDialog(false);
      toast.success('Команда успешно создана!');
    } catch (err: any) {
      console.error('Failed to create team:', err);
      const errorMessage = err.response?.data?.detail || 'Не удалось создать команду.';
      toast.error(errorMessage);
    } finally {
      setIsCreatingTeam(false);
    }
  };
  
  // Load team members
  const handleViewTeamMembers = async (team: Team) => {
    setSelectedTeam(team);
    
    try {
      const members = await competitionService.getTeamMembers(team.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to fetch team members', error);
      toast.error('Не удалось загрузить участников команды.');
    }
  };

  // Helper function to get status display information
  const getStatusInfo = (status: CompetitionStatus) => {
    switch (status) {
      case 'upcoming':
        return { label: 'Предстоит', color: 'bg-blue-100 text-blue-800' };
      case 'registration_open':
        return { label: 'Регистрация открыта', color: 'bg-green-100 text-green-800' };
      case 'registration_closed':
        return { label: 'Регистрация закрыта', color: 'bg-yellow-100 text-yellow-800' };
      case 'ongoing':
        return { label: 'В процессе', color: 'bg-purple-100 text-purple-800' };
      case 'finished':
        return { label: 'Завершено', color: 'bg-gray-100 text-gray-800' };
      case 'results_published':
        return { label: 'Результаты опубликованы', color: 'bg-indigo-100 text-indigo-800' };
      default:
        return { label: 'Неизвестный статус', color: 'bg-gray-100 text-gray-800' };
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

  // Check if registration is open based on status
  const canRegister = competition.status === 'registration_open';
  
  // Get status display info
  const statusInfo = getStatusInfo(competition.status);
  
  // Determine if user can register (not organizer, not already registered, registration is open)
  const userCanRegister = isAuthenticated && canRegister && !isRegistered && !isOrganizer;
  
  // Get registration button text
  const getRegistrationButtonText = () => {
    if (isRegistering) return 'Регистрация...';
    if (isRegistered) return 'Вы зарегистрированы';
    if (isOrganizer) return 'Вы организатор';
    return 'Зарегистрироваться';
  };
  
  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
        &larr; Назад к списку соревнований
      </Link>

      {/* Competition header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold truncate max-w-[70%]">{competition.title}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
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
            
            {/* Registration buttons */}
            {isAuthenticated && (
              <div className="mt-6">
                {competition.type === 'individual' ? (
                  <Button 
                    onClick={handleRegister}
                    disabled={isRegistering || isRegistered || isOrganizer || !canRegister}
                    className="w-full"
                  >
                    {getRegistrationButtonText()}
                  </Button>
                ) : competition.type === 'team' ? (
                  <>
                    <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          disabled={isRegistering || isRegistered || isOrganizer || !canRegister}
                          className="w-full"
                        >
                          {getRegistrationButtonText()}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Создание команды</DialogTitle>
                          <DialogDescription>
                            Введите название вашей команды для участия в соревновании.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="team-name" className="text-sm font-medium">Название команды</label>
                            <Input
                              id="team-name"
                              placeholder="Введите название команды"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setShowTeamDialog(false)} variant="outline">Отмена</Button>
                          <Button 
                            onClick={handleCreateTeam}
                            disabled={isCreatingTeam || !teamName.trim()}
                          >
                            {isCreatingTeam ? 'Создание...' : 'Создать команду'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : null}
                
                {!canRegister && !isRegistered && !isOrganizer && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Регистрация в настоящее время недоступна
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teams section for team competitions */}
      {competition.type === 'team' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Команды</h2>
          {teams.length === 0 ? (
            <p className="text-center py-6 text-gray-500">Пока нет зарегистрированных команд.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <div key={team.id} className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewTeamMembers(team)}>
                  <h3 className="font-medium">{team.name}</h3>
                </div>
              ))}
            </div>
          )}
          
          {selectedTeam && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Состав команды: {selectedTeam.name}</h3>
              {teamMembers.length === 0 ? (
                <p>В команде пока нет участников.</p>
              ) : (
                <ul className="list-disc pl-6">
                  {teamMembers.map(member => (
                    <li key={member.user_id} className="mb-1">
                      {member.first_name} {member.last_name} {member.username ? `(@${member.username})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

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