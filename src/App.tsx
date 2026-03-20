import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }          from './context/AuthContext';
import { ProjectProvider }       from './context/ProjectContext';
import { ThemeProvider }         from './context/ThemeContext';
import { SettingsProvider }      from './context/SettingsContext';
import { NotificationProvider }  from './context/NotificationContext';
import { StagingProvider }       from './context/StagingContext';
import { ProtectedRoute }        from './components/auth/ProtectedRoute';
import { AppLayout }             from './components/layout/AppLayout';
import { LoginPage }             from './pages/LoginPage';
import { Dashboard }             from './pages/Dashboard';
import { Projects }              from './pages/Projects';
import { ProjectDetail }         from './pages/ProjectDetail';
import { Unauthorized }          from './pages/Unauthorized';
import { MyTasks }               from './pages/MyTasks';
import { QCReview as QCReviewPage }    from './pages/QCReview';
import { Settings as SettingsPage }    from './pages/Settings';
import { useSettings }           from './context/SettingsContext';
import { useAuth }               from './context/AuthContext';

// ─── Landing redirect – settings.general.defaultLandingPage ──
function DefaultRedirect() {
  const { settings } = useSettings();
  const page = settings.general.defaultLandingPage ?? 'dashboard';
  const VALID: Record<string, string> = {
    dashboard:  '/dashboard',
    projects:   '/projects',
    'my-tasks': '/my-tasks',
    qc:         '/qc',
  };
  return <Navigate to={VALID[page] ?? '/dashboard'} replace />;
}

// ─── NotificationProvider + StagingProvider – kullanıcı bazlı ─
function UserAwareProviders({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? '';
  return (
    <NotificationProvider userId={userId}>
      <StagingProvider userId={userId}>
        {children}
      </StagingProvider>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <UserAwareProviders>
              <ProjectProvider>
                <Routes>
                  <Route path="/login"        element={<LoginPage />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route index                        element={<DefaultRedirect />} />
                      <Route path="/dashboard"        element={<Dashboard />} />
                      <Route path="/projects"         element={<Projects />} />
                      <Route path="/projects/:id"     element={<ProjectDetail />} />
                      <Route path="/my-tasks"         element={<MyTasks />} />
                      <Route path="/qc"               element={<QCReviewPage />} />
                      <Route path="/settings"         element={<SettingsPage />} />
                    </Route>
                  </Route>

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </ProjectProvider>
            </UserAwareProviders>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
