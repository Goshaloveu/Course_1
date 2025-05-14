import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { competitionService } from '@/api/competitionService';
import { getMyTeams } from '@/api/teams';
import { CompetitionDetail, CompetitionResult } from '@/types/api';
import { CompetitionFormat, CompetitionStatus } from '@/types/competition';
import { TeamReadWithMembers } from '@/types/team';
import { TeamRegistrationReadDetailed, TeamRegistrationCreatePayload } from '@/types/teamRegistration';
import { Button } from '@/components/ui/button';
import { ResultsTable } from '@/components/competitions/ResultsTable';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CompetitionDetailPage = () => {
  const { id: competitionId } = useParams<{ id: string }>();
  const { isAuthenticated, user: currentUser } = useAuth();
  
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isTeamActionLoading, setIsTeamActionLoading] = useState<boolean>(false);
  
  const [isIndividuallyRegistered, setIsIndividuallyRegistered] = useState<boolean>(false);
  const [isOrganizer, setIsOrganizer] = useState<boolean>(false);
  
  const [registeredTeams, setRegisteredTeams] = useState<TeamRegistrationReadDetailed[]>([]);
  const [userLedTeams, setUserLedTeams] = useState<TeamReadWithMembers[]>([]);
  const [selectedTeamIdToRegister, setSelectedTeamIdToRegister] = useState<string>("");
  const [showRegisterTeamModal, setShowRegisterTeamModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchCompetitionDetails = async () => {
      if (!competitionId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await competitionService.getCompetitionById(competitionId);
        setCompetition(data);
        
        if (data.status === CompetitionStatus.RESULTS_PUBLISHED) {
          const resultsData = await competitionService.getCompetitionResults(competitionId);
          setResults(resultsData);
        }
        
        if (isAuthenticated && currentUser) {
          try {
            const registrationStatus = await competitionService.checkRegistrationStatus(competitionId);
            setIsIndividuallyRegistered(registrationStatus.is_registered);
            setIsOrganizer(registrationStatus.is_organizer);
          } catch (err) {
            console.error('Failed to check individual registration status', err);
          }
        }
        
        if (data.type === CompetitionFormat.TEAM) {
          try {
            const regTeamsData = await competitionService.getRegisteredTeams(competitionId);
            setRegisteredTeams(regTeamsData || []);

            if (isAuthenticated && currentUser) {
              const ledTeamsData = await getMyTeams();
              setUserLedTeams(ledTeamsData || []);
            }

          } catch (err) {
            console.error('Failed to fetch team data for competition:', err);
            toast.error("Не удалось загрузить информацию о командах. Пожалуйста, попробуйте позже.");
            // Set empty arrays to avoid null errors in render
            setRegisteredTeams([]);
            setUserLedTeams([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch competition details:', err);
        setError('Не удалось загрузить информацию о соревновании.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitionDetails();
  }, [competitionId, isAuthenticated, currentUser]);

  const handleRegister = async () => {
    if (!competitionId || !isAuthenticated) return;
    setIsRegistering(true);
    try {
      await competitionService.registerForCompetition(competitionId);
      setIsIndividuallyRegistered(true);
      toast.success('Вы успешно зарегистрированы на соревнование!');
    } catch (err: any) {
      console.error('Failed to register for competition:', err);
      const errorMessage = err.response?.data?.detail || 'Не удалось зарегистрироваться.';
      toast.error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const getCurrentUserTeamRegistration = (): TeamRegistrationReadDetailed | undefined => {
    if (!currentUser || !userLedTeams.length || !registeredTeams) return undefined;
    for (const ledTeam of userLedTeams) {
        const currentUserIdNum = Number(currentUser.id);
        if (ledTeam.leader_id !== currentUserIdNum) continue;

        const registration = registeredTeams.find(rt => rt.team_id === ledTeam.id);
        if (registration) {
            return registration; 
        }
    }
    return undefined;
  };
  const currentUserRegisteredTeamDetails = getCurrentUserTeamRegistration();

  const renderTeamRegistrationSection = () => {
    if (!competition || competition.type !== CompetitionFormat.TEAM) return null;

    const isRegOpen = competition.status === CompetitionStatus.REGISTRATION_OPEN;
    const isUpcoming = competition.status === CompetitionStatus.UPCOMING;

    const userLeadsAnyTeam = userLedTeams.some(lt => lt.leader_id === Number(currentUser?.id));

    const canRegisterTeam = isAuthenticated && 
                            isRegOpen && 
                            !currentUserRegisteredTeamDetails && 
                            userLeadsAnyTeam;
                            
    const canWithdrawTeam = isAuthenticated && 
                            currentUserRegisteredTeamDetails && 
                            (isRegOpen || isUpcoming) &&
                            Number(currentUser?.id) === currentUserRegisteredTeamDetails.team.leader_id; 

    return (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Зарегестрированные команды</h2>
            <div className="mb-4">
                {canRegisterTeam && (
                    <Button onClick={() => setShowRegisterTeamModal(true)} disabled={isTeamActionLoading}>
                        {isTeamActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Зарегистрировать команду
                    </Button>
                )}
                {currentUserRegisteredTeamDetails && (
                    <p className="text-green-600 mb-2">
                        Ваша команда "{currentUserRegisteredTeamDetails.team.name}" зарегистрирована.
                        {canWithdrawTeam && (
                             <Button variant="outline" size="sm" className="ml-4" onClick={handleWithdrawTeam} disabled={isTeamActionLoading}>
                                {isTeamActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Снять команду
                            </Button>
                        )}
                    </p>
                )}
                {isAuthenticated && !userLeadsAnyTeam && isRegOpen && (
                    <div className="mt-2">
                        <p className="text-gray-600">Вы должны создать команду, чтобы зарегистрироваться на это соревнование.</p>
                        <Button asChild variant="outline" className="mt-2">
                            <Link to="/teams/create">Создать команду</Link>
                        </Button>
                    </div>
                )}
                {!isRegOpen && (
                    <p className="text-gray-600">Регистрация на это соревнование {
                        competition.status === CompetitionStatus.REGISTRATION_CLOSED ? 'закрыта' : 
                        competition.status === CompetitionStatus.UPCOMING ? 'предстоит' : 
                        'завершено'
                    }.</p>
                )}
            </div>

            <h3 className="text-lg font-medium mt-6 mb-3">Зарегистрированные команды</h3>
            {registeredTeams.length > 0 ? (
                <div className="space-y-3">
                    {registeredTeams.map((registration) => (
                        <div key={registration.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                                <p className="font-medium">{registration.team.name}</p>
                                <p className="text-sm text-gray-500">
                                    Регистрациия: {formatDate(new Date(registration.registration_date))}
                                </p>
                            </div>
                            <Link 
                                to={`/teams/${registration.team_id}`} 
                                className="text-blue-600 hover:underline text-sm"
                            >
                                Команда
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-600">Еще нет команд, зарегистрированных на это соревнование.</p>
            )}
        </div>
    );
  };

  const handleWithdrawTeam = async () => {
    if (!competitionId || !currentUserRegisteredTeamDetails) return;
    
    setIsTeamActionLoading(true);
    try {
      await competitionService.withdrawTeamFromCompetition(
        competitionId, 
        currentUserRegisteredTeamDetails.team_id
      );
      
      // Remove the withdrawn team from registeredTeams
      setRegisteredTeams(prev => 
        prev.filter(reg => reg.team_id !== currentUserRegisteredTeamDetails.team_id)
      );
      
      toast.success('Ваша команда снята с соревнований.');
    } catch (err: any) {
      console.error('Не удалось отозвать команду:', err);
      toast.error(err.response?.data?.detail || 'Не удалось снять команду с соревнований.');
    } finally {
      setIsTeamActionLoading(false);
    }
  };

  const handleRegisterSelectedTeam = async () => {
    if (!competitionId || !selectedTeamIdToRegister) {
      toast.error('Пожалуйста, выберите команду для регистрации');
      return;
    }
    
    setIsTeamActionLoading(true);
    try {
      const payload: TeamRegistrationCreatePayload = {
        team: { id: parseInt(selectedTeamIdToRegister) }
      };
      
      const registrationResult = await competitionService.registerTeamForCompetition(
        competitionId, 
        payload
      );
      
      // Fetch the team details for display
      const selectedTeam = userLedTeams.find(t => t.id === parseInt(selectedTeamIdToRegister));
      
      if (selectedTeam && registrationResult) {
        // Add the new registration to the list with team details
        const newRegistration: TeamRegistrationReadDetailed = {
          ...registrationResult,
          team: selectedTeam
        };
        
        setRegisteredTeams(prev => [...prev, newRegistration]);
        toast.success(`Команда "${selectedTeam.name}" успешно зарегистрирована!`);
        setShowRegisterTeamModal(false);
        setSelectedTeamIdToRegister("");
      }
    } catch (err: any) {
      console.error('Ошибка регистрации команды:', err);
      toast.error(err.response?.data?.detail || 'Не удалось зарегистрировать команду на соревнование.');
    } finally {
      setIsTeamActionLoading(false);
    }
  };

  const getStatusInfo = (statusValue: CompetitionStatus | string | undefined) => {
    if (!statusValue) return { color: 'gray', text: 'Неизвестно' };
    
    // Convert string status to enum if needed
    const status = typeof statusValue === 'string' 
      ? statusValue as CompetitionStatus
      : statusValue;
    
    switch (status) {
      case CompetitionStatus.UPCOMING:
        return { color: 'blue', text: 'Предстоит' };
      case CompetitionStatus.REGISTRATION_OPEN:
        return { color: 'green', text: 'Регистрация открыта' };
      case CompetitionStatus.REGISTRATION_CLOSED:
        return { color: 'yellow', text: 'Регистрация закрыта' };
      case CompetitionStatus.ONGOING:
        return { color: 'purple', text: 'Проходит' };
      case CompetitionStatus.FINISHED:
        return { color: 'gray', text: 'Завершено' };
      case CompetitionStatus.RESULTS_PUBLISHED:
        return { color: 'indigo', text: 'Результаты опубликованы' };
      default:
        return { color: 'gray', text: statusValue };
    }
  };

  const getIndividualRegistrationButtonText = () => {
    if (isRegistering) return 'Регистрация...';
    if (isIndividuallyRegistered) return 'Уже зарегистрирован';
    if (isOrganizer) return 'Вы организатор';
    if (!isAuthenticated) return 'Войдите для регистрации';
    return 'Зарегистрироваться';
  };

  if (loading) {
    return <div className="container mx-auto p-4 flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error || !competition) {
    return <div className="container mx-auto p-4">Ошибка: {error || 'Соревнование не найдено'}</div>;
  }

  const statusInfo = getStatusInfo(competition.status);
  const isRegistrationOpen = competition.status === CompetitionStatus.REGISTRATION_OPEN;
  const isTeamCompetition = competition.type === CompetitionFormat.TEAM;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{competition.title}</h1>
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
            {statusInfo.text}
          </div>
        </div>
        
        {competition.description && (
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Описание</h2>
            <p className="text-gray-700">{competition.description}</p>
          </div>
        )}
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-medium mb-2">Детали</h2>
            <ul className="space-y-2">
              <li className="flex">
                <span className="font-medium w-40">Тип:</span>
                <span>{isTeamCompetition ? 'Командное соревнование' : 'Индивидуальное соревнование'}</span>
              </li>
              {competition.reg_start_at && (
                <li className="flex">
                  <span className="font-medium w-40">Открытие регистрации:</span>
                  <span>{formatDate(new Date(competition.reg_start_at))}</span>
                </li>
              )}
              {competition.reg_end_at && (
                <li className="flex">
                  <span className="font-medium w-40">Закрытие регистрации:</span>
                  <span>{formatDate(new Date(competition.reg_end_at))}</span>
                </li>
              )}
              {competition.comp_start_at && (
                <li className="flex">
                  <span className="font-medium w-40">Начало соревнования:</span>
                  <span>{formatDate(new Date(competition.comp_start_at))}</span>
                </li>
              )}
              {competition.comp_end_at && (
                <li className="flex">
                  <span className="font-medium w-40">Конец соревнования:</span>
                  <span>{formatDate(new Date(competition.comp_end_at))}</span>
                </li>
              )}
              {isTeamCompetition && (
                <>
                  {competition.min_team_members && (
                    <li className="flex">
                      <span className="font-medium w-40">Минимальный размер команды:</span>
                      <span>{competition.min_team_members} members</span>
                    </li>
                  )}
                  {competition.max_team_members && (
                    <li className="flex">
                      <span className="font-medium w-40">Максимальный размер команды:</span>
                      <span>{competition.max_team_members} members</span>
                    </li>
                  )}
                  {competition.roster_lock_date && (
                    <li className="flex">
                      <span className="font-medium w-40">Дата блокировки состава команды:</span>
                      <span>{formatDate(new Date(competition.roster_lock_date))}</span>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-2">Регистрация</h2>
            {!isTeamCompetition ? (
              // Individual competition registration section
              <div>
                <p className="mb-3">Зарегистрироваться как индивидуальный участник</p>
                <Button 
                  onClick={handleRegister} 
                  disabled={isRegistering || isIndividuallyRegistered || isOrganizer || !isAuthenticated || !isRegistrationOpen}
                  className="w-full sm:w-auto"
                >
                  {isRegistering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {getIndividualRegistrationButtonText()}
                </Button>
                {!isRegistrationOpen && !isIndividuallyRegistered && !isOrganizer && (
                  <p className="text-gray-600 mt-2 text-sm">
                    Регистрация {
                      competition.status === CompetitionStatus.UPCOMING ? 'еще не открыта' : 
                      competition.status === CompetitionStatus.REGISTRATION_CLOSED ? 'закрыта' : 
                      'больше недоступна'
                    }.
                  </p>
                )}
              </div>
            ) : (
              // Team competition information
              <div>
                <p className="mb-3">Это командное соревнование. Пожалуйста, зарегистрируйте свою команду ниже.</p>
                <Link to="/teams">
                  <Button variant="outline">Просмотреть свои команды</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {competition.external_links && Object.keys(competition.external_links).length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Ссылки</h2>
            <ul className="space-y-1">
              {Object.entries(competition.external_links).map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Team Registration Section (only for team competitions) */}
      {isTeamCompetition && renderTeamRegistrationSection()}
      
      {/* Results Section (only if results are published) */}
      {competition.status === CompetitionStatus.RESULTS_PUBLISHED && results.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Результаты</h2>
          <ResultsTable results={results} />
        </div>
      )}
      
      {/* Team Registration Dialog */}
      <Dialog open={showRegisterTeamModal} onOpenChange={setShowRegisterTeamModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Зарегистрировать свою команду</DialogTitle>
            <DialogDescription>
              Выберите команду, которую вы хотите зарегистрировать для этого соревнования.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="team-select" className="text-sm font-medium">
              Выберите команду
            </Label>
            <Select value={selectedTeamIdToRegister} onValueChange={setSelectedTeamIdToRegister}>
              <SelectTrigger id="team-select" className="w-full mt-1">
                <SelectValue placeholder="Выберите команду" />
              </SelectTrigger>
              <SelectContent>
                {userLedTeams
                  .filter(team => team.leader_id === Number(currentUser?.id)) // Only show teams where user is leader
                  .map(team => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name} ({team.members.length} members)
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            
            {competition.min_team_members && (
              <p className="text-sm text-gray-500 mt-2">
                Примечание: Команды должны иметь не менее {competition.min_team_members} участников для участия.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegisterTeamModal(false)}>
              Отменить
            </Button>
            <Button 
              onClick={handleRegisterSelectedTeam} 
              disabled={!selectedTeamIdToRegister || isTeamActionLoading}
            >
              {isTeamActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Зарегистрировать команду
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 