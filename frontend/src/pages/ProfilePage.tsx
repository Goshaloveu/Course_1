import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const ProfilePage = () => {
  const { user, isOrganizer } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg">Загрузка данных пользователя...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Профиль пользователя</h1>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Личная информация</CardTitle>
          <CardDescription>Ваши данные из Telegram</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
            {user.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt={`${user.first_name} ${user.last_name}`} 
                className="w-24 h-24 rounded-full"
              />
            )}
            <div>
              <h2 className="text-2xl font-semibold">
                {user.first_name} {user.last_name}
              </h2>
              {user.username && (
                <p className="text-gray-500">@{user.username}</p>
              )}
              <p className="mt-2">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {isOrganizer ? 'Организатор' : 'Участник'}
                </span>
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2">Информация об аккаунте</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID пользователя</p>
                <p>{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID в Telegram</p>
                <p>{user.telegram_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Дата регистрации</p>
                <p>{new Date(user.created_at).toLocaleDateString('ru')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 
        Additional sections could be added here for a more complete profile page:
        - List of competitions the user has registered for
        - User's competition results
        - Settings or preferences
      */}
    </div>
  );
}; 