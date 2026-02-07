import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerStore } from './components/CustomerStore';

function AppContent() {
  const { admin, loading } = useAuth();
  const isAdmin = window.location.pathname === '/admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (isAdmin) {
    return admin ? <AdminDashboard /> : <AdminLogin />;
  }

  return <CustomerStore />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
