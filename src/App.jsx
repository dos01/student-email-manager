import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HiOutlineHome, HiOutlineUsers, HiOutlineMail, HiOutlineCog } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import TestEmail from './pages/TestEmail';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setIsConfigured(!!(data.smtp?.host && data.imap?.host));
      })
      .catch(() => { });
  }, []);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
        }}
      />
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h1>📧 EduMail</h1>
            <p>Student Email Manager</p>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><HiOutlineHome /></span>
              Dashboard
            </NavLink>
            <NavLink to="/students" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><HiOutlineUsers /></span>
              Students
            </NavLink>
            <NavLink to="/test-email" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><HiOutlineMail /></span>
              Test Email
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><HiOutlineCog /></span>
              Settings
            </NavLink>
          </nav>
          <div className="sidebar-footer">
            <p>
              <span className={`status-dot ${isConfigured ? 'configured' : 'not-configured'}`}></span>
              {isConfigured ? 'Email configured' : 'Setup required'}
            </p>
          </div>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/test-email" element={<TestEmail />} />
            <Route path="/settings" element={<Settings onConfigChange={setIsConfigured} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
