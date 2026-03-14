import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import AuthForm from './components/Auth/AuthForm';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';

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
        <main className="flex-1 overflow-y-auto bg-gray-50">
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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar chatSessions={chatSessions} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Chat onSessionsChange={setChatSessions} />
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
      <main className="flex-1 overflow-y-auto bg-gray-50">
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
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;