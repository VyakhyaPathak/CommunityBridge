import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { SubmitNeed } from './pages/SubmitNeed';
import { VolunteerPortal } from './pages/VolunteerPortal';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-brand-bg">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/submit" element={<SubmitNeed />} />
            <Route path="/volunteer" element={<VolunteerPortal />} />
          </Routes>
        </main>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500
            },
          }}
        />
      </div>
    </Router>
  );
}
