import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CompetitionForm } from '@/components/organizer/CompetitionForm';
import { competitionService } from '@/api/competitionService';
import { CompetitionDetail } from '@/types/api';
import { toast } from 'sonner';

export const EditCompetitionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetition = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await competitionService.getCompetitionById(id);
        setCompetition(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch competition details:', err);
        setError('Не удалось загрузить информацию о соревновании.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetition();
  }, [id]);

  const handleSubmit = async (data: Partial<CompetitionDetail>) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      await competitionService.updateCompetition(id, data);
      toast.success('Соревнование успешно обновлено!');
      navigate('/organizer');
    } catch (error) {
      console.error('Error updating competition:', error);
      toast.error('Ошибка при обновлении соревнования. Пожалуйста, попробуйте снова.');
      setIsSubmitting(false);
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
          <button className="text-blue-600 hover:text-blue-800">
            Вернуться к панели организатора
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link to="/organizer" className="text-blue-600 hover:text-blue-800 mr-4">
          &larr; Назад к панели организатора
        </Link>
        <h1 className="text-3xl font-bold">Редактирование соревнования</h1>
      </div>
      
      <p className="text-gray-600">
        Отредактируйте информацию о соревновании и нажмите "Сохранить изменения".
      </p>
      
      <CompetitionForm 
        initialData={competition} 
        onSubmit={handleSubmit} 
        isLoading={isSubmitting} 
      />
    </div>
  );
}; 