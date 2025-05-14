import { useState, useEffect } from 'react';
import { CompetitionCard } from '@/components/competitions/CompetitionCard';
import { competitionService } from '@/api/competitionService';
import { Competition } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

interface CompetitionWithStatus extends Competition {
  isRegistered?: boolean;
  isOrganizer?: boolean;
}

export const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [competitions, setCompetitions] = useState<CompetitionWithStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        
        // Get all competitions
        const data = await competitionService.getAllCompetitions();
        let competitionsWithStatus: CompetitionWithStatus[] = [...data];
        
        // If user is authenticated, check registration status for each competition
        if (isAuthenticated && user) {
          const updatedCompetitions = [...competitionsWithStatus];
          
          for (let i = 0; i < updatedCompetitions.length; i++) {
            try {
              const status = await competitionService.checkRegistrationStatus(updatedCompetitions[i].id);
              updatedCompetitions[i] = {
                ...updatedCompetitions[i],
                isRegistered: status.is_registered,
                isOrganizer: status.is_organizer
              };
            } catch (err) {
              console.error(`Failed to check status for competition ${updatedCompetitions[i].id}:`, err);
              // Keep the competition but mark status as unchecked
              updatedCompetitions[i] = {
                ...updatedCompetitions[i],
                isRegistered: false,
                isOrganizer: false
              };
            }
          }
          
          competitionsWithStatus = updatedCompetitions;
        }
        
        setCompetitions(competitionsWithStatus);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch competitions:', err);
        setError('Не удалось загрузить соревнования. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [isAuthenticated, user]);

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
              <CompetitionCard 
                key={competition.id} 
                competition={competition} 
                isRegistered={competition.isRegistered}
                isOrganizer={competition.isOrganizer}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}; 