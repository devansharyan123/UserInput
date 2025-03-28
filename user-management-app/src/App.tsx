import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import UserList from './components/UserList';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/users" replace /> : <Login />
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? <Navigate to="/users" replace /> : <SignUp />
        }
      />
      <Route
        path="/users"
        element={
          isAuthenticated ? <UserList /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/users" : "/login"} replace />}
      />
    </Routes>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </div>
  );
};

export default App;
