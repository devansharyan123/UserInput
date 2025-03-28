import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check both sessionStorage and localStorage for backward compatibility
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Migrate token to sessionStorage if it exists in localStorage
      if (localStorage.getItem('token')) {
        sessionStorage.setItem('token', token);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token: string) => {
    // Store in sessionStorage for better security
    sessionStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear both storages to ensure complete logout
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 