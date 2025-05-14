import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeamDetails } from '@/api/teams';
import { TeamReadWithMembers, TeamMemberRead } from '@/types/team';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from 'lucide-react';

const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamReadWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setError("ID команды не найден в URL.");
      setIsLoading(false);
      return;
    }

    const fetchTeamDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedTeam = await getTeamDetails(Number(teamId));
        setTeam(fetchedTeam);
      } catch (err: any) {
        console.error(`Ошибка при получении деталей команды ${teamId}:`, err);
        setError(err.response?.data?.detail || "Не удалось загрузить детали команды.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Загрузка деталей команды...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-600 text-center">Ошибка: {error}</div>;
  }

  if (!team) {
    return <div className="container mx-auto py-8 text-center">Команда не найдена.</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Team Header & Info */}
      <Card>
        <CardHeader>
          <div className="mb-4">
            <div>
              <CardTitle className="text-3xl">{team.name}</CardTitle>
              {team.tag && (
                 <span className="text-sm font-medium text-muted-foreground ml-2">({team.tag})</span>
              )}
            </div>
          </div>
          {team.description && (
            <CardDescription>{team.description}</CardDescription>
          )}
           <div className="text-sm text-muted-foreground pt-2">
              Лидер: 
              <Link to={`/profile/${team.leader.id}`} className="text-primary hover:underline ml-1">
                  {team.leader.username || team.leader.first_name || `User ${team.leader.id}`}
              </Link>
           </div>
        </CardHeader>
      </Card>

      {/* Member List */}
      <Card>
        <CardHeader>
          <CardTitle>Участники ({team.members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя пользователя</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Дата присоединения</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.members.map((member: TeamMemberRead) => (
                <TableRow key={member.user.id}>
                  <TableCell>
                     <div className="flex items-center space-x-2">
                        <span>{member.user.username || member.user.first_name || `User ${member.user.id}`}</span>
                     </div>
                  </TableCell>
                  <TableCell>
                    <span className={`capitalize font-medium ${member.role === 'leader' ? 'text-primary' : 'text-muted-foreground'}`}>
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(member.join_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamDetailPage;
