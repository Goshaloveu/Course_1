import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { competitionService } from '@/api/competitionService';
import { CompetitionDetail, Participant, ResultUpload, ResultsUploadPayload } from '@/types/api';
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
  
  const [results, setResults] = useState<ResultUpload[]>([]);
  const [isSubmittingResults, setIsSubmittingResults] = useState<boolean>(false);
  const [isPublishingResults, setIsPublishingResults] = useState<boolean>(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Fetch competition and participants
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch competition details
        const competitionData = await competitionService.getCompetitionById(id);
        setCompetition(competitionData);
        
        // Fetch participants
        const participantsData = await competitionService.getCompetitionParticipants(id);
        setParticipants(participantsData);
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Не удалось загрузить данные соревнования.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
          <CardTitle>{competition.title}</CardTitle>
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
          {participants.length === 0 ? (
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
      
      {/* Results section */}
      <Card>
        <CardHeader>
          <CardTitle>Управление результатами</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {competition.status === 'results_published' ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-800">
              Результаты опубликованы. Чтобы обновить результаты, загрузите новый файл и опубликуйте результаты снова.
            </div>
          ) : null}
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Загрузка результатов</h3>
              <p className="text-sm text-gray-600 mb-4">
                Загрузите CSV файл с результатами. Формат файла: <code>username,result,rank</code> (по одной записи на строку).
              </p>
              
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="max-w-sm"
                />
                <Button onClick={processResultsFile} disabled={!csvFile}>
                  Обработать файл
                </Button>
              </div>
              
              {results.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-green-600 mb-2">Обработано результатов: {results.length}</p>
                  <Button onClick={handleUploadResults} disabled={isSubmittingResults}>
                    {isSubmittingResults ? 'Загрузка...' : 'Загрузить результаты'}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-2">Публикация результатов</h3>
              <p className="text-sm text-gray-600 mb-4">
                После загрузки всех результатов нажмите кнопку ниже, чтобы опубликовать их. После публикации результаты станут видны всем пользователям.
              </p>
              
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