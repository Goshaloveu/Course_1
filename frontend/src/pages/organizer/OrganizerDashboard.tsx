import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { competitionService } from '@/api/competitionService';
import { Competition } from '@/types/api';
import { formatDate } from '@/utils/dateUtils';

export const OrganizerDashboard = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizerCompetitions = async () => {
      try {
        setLoading(true);
        const data = await competitionService.getOrganizerCompetitions();
        setCompetitions(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch organizer competitions:', err);
        setError('Не удалось загрузить ваши соревнования. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerCompetitions();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'registration_open':
        return 'bg-green-100 text-green-800';
      case 'registration_closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'results_published':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Предстоит';
      case 'registration_open':
        return 'Регистрация открыта';
      case 'registration_closed':
        return 'Регистрация закрыта';
      case 'in_progress':
        return 'В процессе';
      case 'completed':
        return 'Завершено';
      case 'results_published':
        return 'Результаты опубликованы';
      default:
        return 'Неизвестный статус';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Панель организатора</h1>
        <Link to="/organizer/competitions/new">
          <Button>Создать соревнование</Button>
        </Link>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6">Ваши соревнования</h2>
        
        {loading ? (
          <div className="text-center py-12">Загрузка соревнований...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">У вас пока нет созданных соревнований</p>
            <Link to="/organizer/competitions/new">
              <Button>Создать первое соревнование</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => (
              <Card key={competition.id} className="flex justify-between items-start space-y-1">
                <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusBadgeClass(competition.status)}`}>
                  {getStatusLabel(competition.status)}
                </span>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{competition.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {formatDate(competition.comp_start_at)} - {formatDate(competition.comp_end_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">Регистрация</p>
                      <p className="mt-1">
                        {formatDate(competition.reg_start_at).split(' ')[0]} - {formatDate(competition.reg_end_at).split(' ')[0]}
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
                <CardFooter className="grid grid-cols-2 gap-2">
                  <Link to={`/organizer/competitions/${competition.id}/edit`} className="w-full">
                    <Button className="w-full" variant="outline">Редактировать</Button>
                  </Link>
                  <Link to={`/organizer/competitions/${competition.id}/manage`} className="w-full">
                    <Button className="w-full">Управлять</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}; 