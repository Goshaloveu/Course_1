import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeams } from '@/api/teams';
import { TeamRead } from '@/types/team';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react'; // Loading spinner icon

const TeamsListPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTeams = await getTeams(); // Fetch all public teams
        setTeams(fetchedTeams);
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || "Failed to load teams. Please try again.";
        console.error("Failed to fetch teams:", errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Команды</h1>
        <Button asChild>
          <Link to="/teams/create">Создать новую команду</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Загрузка команд...</p>
        </div>
      )}

      {error && !isLoading && (
         <p className="text-red-600 text-center py-4">Ошибка загрузки команд: {error}</p>
      )}

      {!isLoading && !error && teams.length === 0 && (
        <p className="text-center py-10">Не найдено публичных команд.</p>
      )}

      {!isLoading && !error && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                {team.tag && (
                  <CardDescription>Тег: {team.tag}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {team.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{team.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Не указано описание.</p>
                )}
                 {/* Add member count or leader info if needed/available from this endpoint */}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                   <Link to={`/teams/${team.id}`}>Посмотреть детали</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsListPage; 