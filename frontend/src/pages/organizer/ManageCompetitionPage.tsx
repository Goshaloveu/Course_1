import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { competitionService } from '@/api/competitionService';
import { CompetitionDetail, Participant, ResultUpload, ResultsUploadPayload, Team, TeamMember } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export const ManageCompetitionPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState<boolean>(false);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [results, setResults] = useState<ResultUpload[]>([]);
  const [isSubmittingResults, setIsSubmittingResults] = useState<boolean>(false);
  const [isPublishingResults, setIsPublishingResults] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Fetch competition
  useEffect(() => {
    const fetchCompetition = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch competition details
        const competitionData = await competitionService.getCompetitionById(id);
        setCompetition(competitionData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch competition:', err);
        setError('Не удалось загрузить данные соревнования.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetition();
  }, [id]);

  // Fetch participants separately to avoid race conditions
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!id || !competition) return;
      
      try {
        setIsLoadingParticipants(true);
        
        // Fetch participants
        const participantsData = await competitionService.getCompetitionParticipants(id);
        console.log('Fetched participants:', participantsData);
        setParticipants(participantsData);
        
        // Fetch teams if it's a team competition
        if (competition.type === 'team') {
          try {
            const teamsData = await competitionService.getCompetitionTeams(id);
            setTeams(teamsData);
          } catch (error) {
            console.error('Failed to fetch teams:', error);
          }
        }
        
      } catch (err) {
        console.error('Failed to fetch participants:', err);
        toast.error('Не удалось загрузить список участников.');
      } finally {
        setIsLoadingParticipants(false);
      }
    };

    if (competition) {
      fetchParticipants();
    }
  }, [id, competition]);

  // Handle file input change for CSV upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  // Process CSV file (simple implementation for the MVP)
  const processResultsFile = async () => {
    if (!csvFile) {
      toast.error('Пожалуйста, выберите файл с результатами.');
      return;
    }

    try {
      const text = await csvFile.text();
      const lines = text.split('\n');
      const parsedResults: ResultUpload[] = [];
      
      // Simple CSV parsing (format: username,result,rank)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [user_identifier, result_value, rank] = line.split(',');
        if (user_identifier && result_value) {
          parsedResults.push({
            user_identifier,
            result_value,
            rank: parseInt(rank) || i
          });
        }
      }
      
      if (parsedResults.length === 0) {
        toast.error('Не удалось обработать файл. Пожалуйста, проверьте формат.');
        return;
      }
      
      setResults(parsedResults);
      toast.success(`Обработано ${parsedResults.length} результатов.`);
    } catch (err) {
      console.error('Error processing CSV file:', err);
      toast.error('Ошибка при обработке файла. Пожалуйста, проверьте формат.');
    }
  };

  // Upload competition results
  const handleUploadResults = async () => {
    if (!id) return;
    
    if (results.length === 0) {
      toast.error('Нет результатов для загрузки. Пожалуйста, загрузите файл сначала.');
      return;
    }
    
    try {
      setIsSubmittingResults(true);
      
      const payload: ResultsUploadPayload = {
        results: results
      };
      
      await competitionService.uploadCompetitionResults(id, payload);
      toast.success('Результаты успешно загружены.');
      setCsvFile(null);
    } catch (err) {
      console.error('Error uploading results:', err);
      toast.error('Ошибка при загрузке результатов. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmittingResults(false);
    }
  };

  // Publish competition results
  const handlePublishResults = async () => {
    if (!id) return;
    
    try {
      setIsPublishingResults(true);
      await competitionService.publishCompetitionResults(id);
      
      // Update competition status after publishing
      const updatedCompetition = await competitionService.getCompetitionById(id);
      setCompetition(updatedCompetition);
      
      toast.success('Результаты опубликованы!');
    } catch (err) {
      console.error('Error publishing results:', err);
      toast.error('Ошибка при публикации результатов. Пожалуйста, попробуйте снова.');
    } finally {
      setIsPublishingResults(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Загрузка данных соревнования...</div>;
  }

  if (error || !competition) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Соревнование не найдено'}</p>
        <Link to="/organizer">
          <Button variant="outline">Вернуться к панели организатора</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/organizer" className="text-blue-600 hover:text-blue-800 mr-4">
            &larr; Назад к панели организатора
          </Link>
          <h1 className="text-3xl font-bold">Управление соревнованием</h1>
        </div>
        <div className="flex space-x-4">
          <Link to={`/organizer/competitions/${id}/edit`}>
            <Button variant="outline">Редактировать детали</Button>
          </Link>
          <Link to={`/competitions/${id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Просмотр страницы</Button>
          </Link>
        </div>
      </div>
      
      {/* Competition details summary */}
      <Card>
        <CardHeader>
          <CardTitle className="truncate" title={competition.title}>{competition.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">Даты соревнования</p>
              <p className="mt-1">
                {formatDate(competition.comp_start_at)} - {formatDate(competition.comp_end_at)}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Статус</p>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  competition.status === 'registration_open' ? 'bg-green-100 text-green-800' :
                  competition.status === 'ongoing' ? 'bg-purple-100 text-purple-800' :
                  competition.status === 'results_published' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {competition.status === 'registration_open' ? 'Регистрация открыта' :
                   competition.status === 'registration_closed' ? 'Регистрация закрыта' :
                   competition.status === 'ongoing' ? 'В процессе' :
                   competition.status === 'finished' ? 'Завершено' :
                   competition.status === 'results_published' ? 'Результаты опубликованы' :
                   'Предстоит'}
                </span>
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Тип</p>
              <p className="mt-1">
                {competition.type === 'individual' ? 'Индивидуальное' : 
                 competition.type === 'team' ? 'Командное' : 'Другое'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Participants section */}
      <Card>
        <CardHeader>
          <CardTitle>Участники ({participants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingParticipants ? (
            <p className="text-center py-6">Загрузка участников...</p>
          ) : participants.length === 0 ? (
            <p className="text-center py-6 text-gray-500">На данный момент нет зарегистрированных участников.</p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Телеграм</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-mono text-xs">{participant.id}</TableCell>
                      <TableCell>{participant.first_name} {participant.last_name}</TableCell>
                      <TableCell>{participant.username ? `@${participant.username}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Teams section for team competitions */}
      {competition.type === 'team' && (
        <Card>
          <CardHeader>
            <CardTitle>Команды ({teams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingParticipants ? (
              <p className="text-center py-6">Загрузка команд...</p>
            ) : teams.length === 0 ? (
              <p className="text-center py-6 text-gray-500">На данный момент нет зарегистрированных команд.</p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Капитан</TableHead>
                      <TableHead>Создана</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-mono text-xs">{team.id}</TableCell>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>{team.captain_id}</TableCell>
                        <TableCell>{formatDate(team.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Results Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Загрузка результатов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">1. Загрузите CSV файл с результатами участников:</p>
              <Input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                className="max-w-md"
              />
            </div>
            
            {csvFile && (
              <div>
                <Button onClick={processResultsFile} variant="outline" className="mr-2">
                  Обработать файл
                </Button>
                <span className="text-sm text-gray-500">{csvFile.name}</span>
              </div>
            )}
            
            {results.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm">Обработано результатов: <span className="font-semibold">{results.length}</span></p>
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleUploadResults} 
                    disabled={isSubmittingResults}
                    variant="default"
                  >
                    {isSubmittingResults ? 'Загрузка...' : 'Загрузить результаты'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Publish Results */}
      <Card>
        <CardHeader>
          <CardTitle>Публикация результатов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm">После публикации, результаты станут видны всем участникам.</p>
            <div className="flex space-x-3">
              <Button 
                onClick={handlePublishResults}
                disabled={isPublishingResults || competition.status === 'results_published'}
                variant={competition.status === 'results_published' ? 'outline' : 'default'}
              >
                {isPublishingResults ? 'Публикация...' : 
                 competition.status === 'results_published' ? 'Результаты опубликованы' : 'Опубликовать результаты'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 