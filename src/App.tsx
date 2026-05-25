import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import AuthForm from './components/Auth/AuthForm';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

interface RouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<RouteProps> = ({ children }) => {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) return <div>Loading...</div>;
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) return <div>Loading...</div>;
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

// ── Jobs page wrapper: lifts filter state up so Sidebar can access it ──
const JobsWithSidebar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [triggerSearch, setTriggerSearch] = useState(0);

  const handleSearch = () => setTriggerSearch((n) => n + 1);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          jobFilters={{
            searchQuery,
            location,
            onSearchChange: setSearchQuery,
            onLocationChange: setLocation,
            onSearch: handleSearch,
          }}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <Jobs
            searchQuery={searchQuery}
            location={location}
            triggerSearch={triggerSearch}
          />
        </main>
      </div>
    </div>
  );
};

// ── Chat page wrapper: passes chat sessions to Sidebar ──
const ChatWithSidebar: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<
    { id: string; title: string; date: string }[]
  >([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/chat/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.sessions) {
          setChatSessions(
            response.data.sessions.map((s: { sessionId: string; title: string; lastActivity: string }) => ({
              id: s.sessionId,
              title: s.title,
              date: new Date(s.lastActivity).toLocaleDateString(),
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    if (token) fetchSessions();
  }, [token]);

  const handleSessionUpdate = useCallback((newSession: { id: string; title: string; date: string }) => {
    setChatSessions((prev) => {
      const exists = prev.find((s) => s.id === newSession.id);
      if (exists) {
        return prev.map(s => s.id === newSession.id ? newSession : s);
      }
      return [newSession, ...prev];
    });
  }, []);

  const handleRenameSession = async (id: string, newTitle: string) => {
    try {
      await axios.put(`/chat/sessions/${id}`, { title: newTitle }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar chatSessions={chatSessions} onRenameSession={handleRenameSession} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <Chat onSessionUpdate={handleSessionUpdate} />
        </main>
      </div>
    </div>
  );
};

// ── Generic layout for pages that don't need contextual sidebar ──
const DefaultLayout: React.FC<RouteProps> = ({ children }) => (
  <div className="flex flex-col h-screen overflow-hidden">
    <Header />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        {children}
      </main>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthForm />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DefaultLayout>
              <Dashboard />
            </DefaultLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <ChatWithSidebar />
          </PrivateRoute>
        }
      />
      <Route
        path="/chat/:sessionId"
        element={
          <PrivateRoute>
            <ChatWithSidebar />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <PrivateRoute>
            <JobsWithSidebar />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <DefaultLayout>
              <Profile />
            </DefaultLayout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <DefaultLayout>
              <Settings />
            </DefaultLayout>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;