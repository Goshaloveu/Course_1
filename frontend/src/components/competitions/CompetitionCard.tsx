import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Competition, getCompetitionType } from '@/types/api';
import { formatDate } from '@/utils/dateUtils';
import { Link } from 'react-router-dom';
import { CalendarIcon, UsersIcon } from 'lucide-react';

interface CompetitionCardProps {
  competition: Competition;
  isRegistered?: boolean;
  isOrganizer?: boolean;
}

export const CompetitionCard = ({ competition, isRegistered, isOrganizer }: CompetitionCardProps) => {
  const { id, title, reg_start_at, reg_end_at, comp_start_at, comp_end_at, status } = competition;
  const type = getCompetitionType(competition);

  // Helper function to determine the status label and color
  const getStatusInfo = () => {
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

  const statusInfo = getStatusInfo();

  // Helper function to determine the competition type label and icon
  const getTypeInfo = () => {
    switch (type) {
      case 'individual':
        return { label: 'Индивидуальное', icon: <UsersIcon size={16} className="mr-1" /> };
      case 'team':
        return { label: 'Командное', icon: <UsersIcon size={16} className="mr-1" /> };
      default:
        return { label: 'Другое', icon: null };
    }
  };
  
  const typeInfo = getTypeInfo();

  // Format date in a more readable way (e.g. "10 июля - 15 июля 2023")
  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) {
      return 'Даты не указаны';
    }
    
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Некорректные даты';
      }
      
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      
      const startMonth = startDate.toLocaleString('ru', { month: 'long' });
      const endMonth = endDate.toLocaleString('ru', { month: 'long' });
      
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      if (startYear !== endYear) {
        return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
      } else if (startMonth !== endMonth) {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
      } else {
        return `${startDay} - ${endDay} ${endMonth} ${startYear}`;
      }
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Ошибка в датах';
    }
  };

  return (
    <Card className="w-full h-full flex flex-col border-2 hover:border-blue-300 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start space-y-1">
          <span className={`px-3 py-1 rounded-full text-xs font-medium mb-2 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {(isRegistered || isOrganizer) && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isOrganizer ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {isOrganizer ? 'Организатор' : 'Зарегистрирован'}
            </span>
          )}
        </div>
        <div className="block">
          <CardTitle className="text-xl line-clamp-2 min-h-[3rem]" title={title || 'Без названия'}>
            {title || 'Без названия'}
          </CardTitle>
          <CardDescription className="mt-2 flex items-center">
            {typeInfo.icon}{typeInfo.label}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="space-y-3">
          <div className="flex items-start">
            <CalendarIcon size={16} className="mt-1 mr-2 text-gray-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Регистрация</p>
              <p className="text-sm text-gray-600">
                {formatDateRange(reg_start_at, reg_end_at)}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <CalendarIcon size={16} className="mt-1 mr-2 text-gray-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Соревнование</p>
              <p className="text-sm text-gray-600">
                {formatDateRange(comp_start_at, comp_end_at)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link to={`/competitions/${id}`} className="w-full">
          <Button className="w-full font-medium">Подробнее</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}; 