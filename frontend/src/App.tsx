// import '@/index.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Layout } from '@/components/common/Layout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// Pages
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { CompetitionDetailPage } from '@/pages/CompetitionDetailPage';
import { OrganizerDashboard } from '@/pages/organizer/OrganizerDashboard';
import { CreateCompetitionPage } from '@/pages/organizer/CreateCompetitionPage';
import { EditCompetitionPage } from '@/pages/organizer/EditCompetitionPage';
import { ManageCompetitionPage } from '@/pages/organizer/ManageCompetitionPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
            
            {/* Protected user routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected organizer routes */}
            <Route 
              path="/organizer" 
              element={
                <ProtectedRoute requireOrganizer>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizer/competitions/new" 
              element={
                <ProtectedRoute requireOrganizer>
                  <CreateCompetitionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizer/competitions/:id/edit" 
              element={
                <ProtectedRoute requireOrganizer>
                  <EditCompetitionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizer/competitions/:id/manage" 
              element={
                <ProtectedRoute requireOrganizer>
                  <ManageCompetitionPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;