import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Send, Users, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Submit Need', path: '/submit', icon: Send },
    { name: 'Volunteer Portal', path: '/volunteer', icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-brand-primary p-1.5 rounded-lg transition-transform group-hover:scale-105">
                <Activity className="w-5 h-5 text-brand-accent" />
              </div>
              <span className="text-xl font-bold text-brand-primary tracking-tight">
                Community<span className="text-brand-accent">Bridge</span>
              </span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center space-x-2 ${
                    isActive ? 'text-brand-primary' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-accent' : ''}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-slate-100 -z-10 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center">
             <button className="btn-outline flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <span>Admin Login</span>
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
