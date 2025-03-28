import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import SignUp from './components/SignUp';
import UserList from './components/UserList';

// Theme Configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('token')
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/users" /> : <Login />
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ? <Navigate to="/users" /> : <SignUp />
              }
            />
            <Route
              path="/users"
              element={
                isAuthenticated ? <UserList /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated ? "/users" : "/login"} />
              }
            />
          </Routes>
        </AnimatePresence>
      </Router>
    </ThemeProvider>
  );
};

export default App;
