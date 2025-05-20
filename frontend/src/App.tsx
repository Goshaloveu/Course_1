// import '@/index.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TelegramMiniApp } from './components/TelegramMiniApp';

// Layouts
import { Layout } from './components/common/Layout';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
// CompetitionsPage seems missing, using HomePage as placeholder? Add if it exists.
// import CompetitionsPage from './pages/CompetitionsPage';
import { CompetitionDetailPage } from './pages/CompetitionDetailPage';
import { ProfilePage } from './pages/ProfilePage';

// Organizer Pages
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { CreateCompetitionPage } from './pages/organizer/CreateCompetitionPage';
import { EditCompetitionPage } from './pages/organizer/EditCompetitionPage';
import { ManageCompetitionPage } from './pages/organizer/ManageCompetitionPage';

// Team Pages
import TeamsListPage from './pages/TeamsListPage';
import MyTeamsPage from './pages/MyTeamsPage';
import CreateTeamPage from './pages/CreateTeamPage';
import TeamDetailPage from './pages/TeamDetailPage';

// Protected Route Component (keep existing definition)
interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'organizer';
}

function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'organizer' && !user?.is_organizer) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <TelegramMiniApp>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                {/* Assuming /competitions route shows HomePage or a missing CompetitionsPage */}
                <Route path="/competitions" element={<HomePage />} />
                <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
                
                {/* Team Routes */}
                <Route path="/teams" element={<TeamsListPage />} />
                <Route
                  path="/my-teams"
                  element={
                    <ProtectedRoute>
                      <MyTeamsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teams/create"
                  element={
                    <ProtectedRoute>
                      <CreateTeamPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teams/:teamId"
                  element={
                    <TeamDetailPage />
                  }
                />

                {/* Profile Route */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Organizer Routes */}
                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute role="organizer">
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer/competitions/new"
                  element={
                    <ProtectedRoute role="organizer">
                      <CreateCompetitionPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/organizer/competitions/:id/edit" 
                  element={
                    <ProtectedRoute role="organizer">
                      <EditCompetitionPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/organizer/competitions/:id/manage" 
                  element={
                    <ProtectedRoute role="organizer">
                      <ManageCompetitionPage />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Team routes */}
                <Route path="/teams" element={<TeamsListPage />} />
                <Route 
                  path="/my-teams" 
                  element={
                    <ProtectedRoute>
                      <MyTeamsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/teams/create" 
                  element={
                    <ProtectedRoute>
                      <CreateTeamPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/teams/:teamId" 
                  element={
                    <TeamDetailPage />
                  } 
                />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </TelegramMiniApp>
          <Toaster />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;