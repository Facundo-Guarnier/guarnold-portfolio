
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { BrandFooter } from './components/ui/BrandFooter';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/editor" element={<Admin />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
        <BrandFooter compact />
      </div>
    </Router>
  );
};

export default App;
