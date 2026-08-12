import React, { useState } from 'react';
import { Sun, Moon, Compass, Calendar, Users, Film, UserPlus, Grid, Award, Megaphone, PhoneCall, ShieldAlert, Sparkles, Menu, X, User } from 'lucide-react';

export default function Navbar({ currentPage, setCurrentPage, theme, toggleTheme, student }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'reel', label: 'Reel', icon: Film },
    { id: 'join', label: 'Join Us', icon: UserPlus },
    { id: 'gallery', label: 'Gallery', icon: Grid },
    // { id: 'achievements', label: 'Wins', icon: Award },
    { id: 'announcements', label: 'Updates', icon: Megaphone },
    { id: 'contact', label: 'Contact', icon: PhoneCall },
  ];

  return (
    <div className="navbar-wrapper" style={{ position: 'relative' }}>
      <div className="container">
        <nav className="navbar">
          {/* Logo Section */}
          <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => { setCurrentPage('home'); setIsOpen(false); }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--primary)',
              borderRadius: theme === 'sketch' ? '8px' : '50%',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: '800',
              border: theme === 'sketch' ? '2px solid #1F2937' : 'none',
              boxShadow: theme === 'sketch' ? '2px 2px 0 #1F2937' : 'none'
            }}>
              C
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05, textAlign: 'left', fontSize: '1.15rem' }}>
              <span style={{ fontWeight: '800' }}>Campus</span>
              <span style={{ paddingLeft: '3ch', color: 'var(--primary)', fontWeight: '800' }}>Creative</span>
            </span>
          </div>

          {/* Navigation Links (Desktop) */}
          <ul className="nav-links" style={{ display: 'flex' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme Toggle Switcher */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === 'canvas' ? 'Sunset Sketch' : 'Sunset Canvas'}`}
            >
              {theme === 'canvas' ? <Sparkles size={20} /> : <Sun size={20} />}
            </button>

            {/* Desktop-only action items */}
            <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Student Dashboard Profile Shortcut */}
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="theme-toggle-btn"
                title="My Profile Dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: theme === 'sketch' ? '6px' : '50%',
                  border: theme === 'sketch' 
                    ? '2px solid #1F2937' 
                    : currentPage === 'dashboard' ? '2px solid var(--primary)' : '1px solid rgba(249, 115, 22, 0.15)',
                  backgroundColor: currentPage === 'dashboard' ? 'var(--accent-light)' : 'var(--bg-card)',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  boxShadow: theme === 'sketch' && currentPage === 'dashboard' ? '2px 2px 0px #1F2937' : 'none'
                }}
              >
                <User size={18} />
              </button>

              {/* Admin Panel Button */}
              {student?.name?.toLowerCase() === 'hero' && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className={`btn btn-secondary`}
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '0.85rem', 
                    borderRadius: theme === 'sketch' ? '6px' : '9999px',
                    borderColor: 'var(--accent-coral)',
                    color: 'var(--accent-coral)',
                    backgroundColor: theme === 'sketch' ? '#FFF' : 'rgba(244, 63, 94, 0.05)'
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>Admin</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburguer Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="menu-btn"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: theme === 'sketch' ? '6px' : '50%',
                border: theme === 'sketch' ? '2px solid #1F2937' : '1px solid rgba(249, 115, 22, 0.15)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxShadow: theme === 'sketch' ? '3px 3px 0px #1F2937' : 'var(--box-shadow)'
              }}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            borderBottom: 'var(--border-style)',
            borderTop: theme === 'sketch' ? '2px solid #1F2937' : 'none',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 9999,
            textAlign: 'left'
          }}>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setCurrentPage(item.id);
                        setIsOpen(false);
                      }}
                      className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        width: '100%',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '12px 20px',
                        textAlign: 'left',
                        boxSizing: 'border-box'
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ fontSize: '1rem' }}>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              borderTop: '1px solid rgba(249, 115, 22, 0.12)', 
              paddingTop: '20px', 
              marginTop: '8px' 
            }}>
              <button
                onClick={() => {
                  setCurrentPage('dashboard');
                  setIsOpen(false);
                }}
                className={`btn ${currentPage === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  flex: 1, 
                  padding: '12px 20px', 
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              {student?.name?.toLowerCase() === 'hero' && (
                <button
                  onClick={() => {
                    setCurrentPage('admin');
                    setIsOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{ 
                    flex: 1, 
                    padding: '12px 20px', 
                    fontSize: '0.9rem',
                    borderColor: 'var(--accent-coral)',
                    color: 'var(--accent-coral)',
                    backgroundColor: theme === 'sketch' ? '#FFF' : 'rgba(244, 63, 94, 0.05)'
                  }}
                >
                  Admin
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
