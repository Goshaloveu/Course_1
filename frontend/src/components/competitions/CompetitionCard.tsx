import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Competition } from '@/types/api';
import { formatDate } from '@/utils/dateUtils';
import { Link } from 'react-router-dom';

interface CompetitionCardProps {
  competition: Competition;
}

export const CompetitionCard = ({ competition }: CompetitionCardProps) => {
  const { id, title, reg_start_at, reg_end_at, comp_start_at, comp_end_at, status, type } = competition;

  // Helper function to determine the status label and color
  const getStatusInfo = () => {
    switch (status) {
      case 'upcoming':
        return { label: 'Предстоит', color: 'bg-blue-100 text-blue-800' };
      case 'registration_open':
        return { label: 'Регистрация открыта', color: 'bg-green-100 text-green-800' };
      case 'registration_closed':
        return { label: 'Регистрация закрыта', color: 'bg-yellow-100 text-yellow-800' };
      case 'in_progress':
        return { label: 'В процессе', color: 'bg-purple-100 text-purple-800' };
      case 'completed':
        return { label: 'Завершено', color: 'bg-gray-100 text-gray-800' };
      case 'results_published':
        return { label: 'Результаты опубликованы', color: 'bg-indigo-100 text-indigo-800' };
      default:
        return { label: 'Неизвестный статус', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusInfo = getStatusInfo();

  // Helper function to determine the competition type label
  const getTypeLabel = () => {
    switch (type) {
      case 'individual':
        return 'Индивидуальное';
      case 'team':
        return 'Командное';
      default:
        return 'Другое';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="mt-2">
              Тип: {getTypeLabel()}
            </CardDescription>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Регистрация</p>
            <p className="text-sm">
              {formatDate(reg_start_at)} - {formatDate(reg_end_at)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Соревнование</p>
            <p className="text-sm">
              {formatDate(comp_start_at)} - {formatDate(comp_end_at)}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/competitions/${id}`} className="w-full">
          <Button className="w-full">Подробнее</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}; 