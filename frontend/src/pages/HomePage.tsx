import { useState, useEffect } from 'react';
import { CompetitionCard } from '@/components/competitions/CompetitionCard';
import { competitionService } from '@/api/competitionService';
import { Competition } from '@/types/api';

export const HomePage = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const data = await competitionService.getAllCompetitions();
        setCompetitions(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch competitions:', err);
        setError('Не удалось загрузить соревнования. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-6">Актуальные соревнования</h2>
        
        {loading ? (
          <div className="text-center py-12">Загрузка соревнований...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            На данный момент нет доступных соревнований
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}; 