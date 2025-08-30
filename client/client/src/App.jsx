import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import AuthSuccess from './pages/AuthSuccess';

function App() {
  return (
    <Router>
     
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
    
    </Router>
  );
}

export default App;