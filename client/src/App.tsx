import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/landing';
import Login from './pages/login';
import AccountPage from './pages/account';
import CoalesceController from './components/CoalesceController';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CoalesceController active={true} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Landing />} />
        <Route path="/login" element={<Login isSignup={false} />} />
        <Route path="/signup" element={<Login isSignup={true} />} />
        <Route path="/reset" element={<Login isSignup={false} isReset={true} />} />
        <Route path="/profile" element={<AccountPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;


