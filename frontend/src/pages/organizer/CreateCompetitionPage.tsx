import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CompetitionForm } from '@/components/organizer/CompetitionForm';
import { competitionService } from '@/api/competitionService';
import { CompetitionDetail } from '@/types/api';
import { toast } from 'sonner';

export const CreateCompetitionPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (data: Partial<CompetitionDetail>) => {
    try {
      setIsSubmitting(true);
      await competitionService.createCompetition(data as Omit<CompetitionDetail, 'id' | 'organizer_id'>);
      toast.success('Соревнование успешно создано!');
      navigate('/organizer');
    } catch (error) {
      console.error('Error creating competition:', error);
      toast.error('Ошибка при создании соревнования. Пожалуйста, попробуйте снова.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link to="/organizer" className="text-blue-600 hover:text-blue-800 mr-4">
          &larr; Назад к панели организатора
        </Link>
        <h1 className="text-3xl font-bold">Создать новое соревнование</h1>
      </div>
      
      <p className="text-gray-600">
        Заполните форму ниже, чтобы создать новое соревнование. Все поля обязательны для заполнения.
      </p>
      
      <CompetitionForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </div>
  );
}; 