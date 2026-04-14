import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import StudentDashboard from './components/StudentDashboard';
import PlacementDashboard from './components/PlacementDashboard';
import TakeTest from './components/TakeTest';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      console.log("User loaded from localStorage:", JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    console.log("App: handleLogin called with user:", userData);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    console.log("User logged out");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route 
          path="/student" 
          element={
            user && user.role === 'student' ? 
              <StudentDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
          } 
        />
        <Route 
          path="/student/test" 
          element={
            user && user.role === 'student' ? 
              <TakeTest user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
          } 
        />
        <Route 
          path="/placement" 
          element={
            user && user.role === 'placement' ? 
              <PlacementDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" />
          } 
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;