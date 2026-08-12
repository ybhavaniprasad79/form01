import React, { useState } from 'react';
import { User, Calendar, Award, FileText, CheckCircle, Bell, Settings, Download, Trash, Edit, RefreshCw } from 'lucide-react';

export default function Dashboard({ student, setStudent, events, theme, addToast }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editName, setEditName] = useState(student.name);
  const [editDept, setEditDept] = useState(student.department);
  const [activeCert, setActiveCert] = useState(null); // to show certificate lightbox/modal

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setStudent({
      ...student,
      name: editName,
      department: editDept
    });
    addToast('Profile settings updated successfully! 👤');
  };

  const getAttendanceOffset = () => {
    const percentage = student.attendancePct || 84;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    return circumference - (percentage / 100) * circumference;
  };

  return (
    <div className="section" style={{ flex: 1, padding: '40px 0' }}>
      <div className="container">
        
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', textAlign: 'left' }}>
          
          {/* LEFT: Sidebar Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Profile summary */}
            <div className="card" style={{ padding: '20px', textAlign: 'center', background: '#FFF' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                margin: '0 auto 12px auto',
                border: theme === 'sketch' ? '2px solid #1F2937' : 'none',
                boxShadow: theme === 'sketch' ? '2px 2px 0 #1F2937' : 'none'
              }}>
                🎓
              </div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{student.name}</h4>
              <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>{student.status}</span>
            </div>

            {/* Sidebar list */}
            <div className="card" style={{ padding: '12px', background: '#FFF', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'events', label: 'My Events', icon: Calendar },
                { id: 'certificates', label: 'Certificates', icon: FileText },
                { id: 'achievements', label: 'Achievements', icon: Award },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="btn"
                    style={{
                      justifyContent: 'flex-start',
                      background: activeTab === tab.id ? 'var(--accent-light)' : 'none',
                      color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                      borderRadius: theme === 'sketch' ? '4px' : '10px',
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      border: theme === 'sketch' && activeTab === tab.id ? '1.5px solid #1F2937' : 'none',
                      boxShadow: 'none'
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Active Tab Workspace */}
          <div className="card" style={{ padding: '32px', background: '#FFF', minHeight: '400px' }}>
            
            {/* OVERVIEW WORKSPACE */}
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid #FFE8D6', paddingBottom: '10px' }}>
                  Student Dashboard
                </h3>

                <div className="grid-3" style={{ marginBottom: '32px' }}>
                  {/* Member info */}
                  <div className="card" style={{ padding: '16px', backgroundColor: 'var(--bg-section)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DEPT / YEAR</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '6px' }}>{student.department}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.year}</p>
                  </div>

                  {/* Registered events count */}
                  <div className="card" style={{ padding: '16px', backgroundColor: 'var(--bg-section)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REGISTERED</span>
                    <h4 style={{ fontSize: '1.5rem', marginTop: '6px', color: 'var(--primary)' }}>
                      {student.registeredEvents?.length || 0}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Sign-ups</p>
                  </div>

                  {/* Certificates count */}
                  <div className="card" style={{ padding: '16px', backgroundColor: 'var(--bg-section)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CERTIFICATES</span>
                    <h4 style={{ fontSize: '1.5rem', marginTop: '6px', color: 'var(--accent-green)' }}>
                      {student.certificates?.length || 0}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Earned Credentials</p>
                  </div>
                </div>

                <div className="grid-2">
                  {/* Attendance Ring */}
                  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
                    <div className="attendance-progress">
                      <svg>
                        <circle className="attendance-circle-bg" cx="70" cy="70" r="54" />
                        <circle 
                          className="attendance-circle-fg" 
                          cx="70" 
                          cy="70" 
                          r="54" 
                          strokeDasharray={2 * Math.PI * 54}
                          strokeDashoffset={getAttendanceOffset()}
                        />
                      </svg>
                      <span className="attendance-value">{student.attendancePct || 84}%</span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Participation Index</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Based on event attendance history and workshops completed.</p>
                    </div>
                  </div>

                  {/* Contribution metrics */}
                  <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>My Contributions</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                      <div style={{ padding: '6px', backgroundColor: 'var(--bg-section)', borderRadius: '4px' }}>
                        📷 Photos: <strong>{student.contributions?.photos || 12}</strong>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: 'var(--bg-section)', borderRadius: '4px' }}>
                        🎬 Reels: <strong>{student.contributions?.reels || 4}</strong>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: 'var(--bg-section)', borderRadius: '4px' }}>
                        🎨 Posters: <strong>{student.contributions?.posters || 8}</strong>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: 'var(--bg-section)', borderRadius: '4px' }}>
                        🤝 Volunteered: <strong>{student.contributions?.volunteering || 3}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MY EVENTS WORKSPACE */}
            {activeTab === 'events' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid #FFE8D6', paddingBottom: '10px' }}>
                  My Events
                </h3>

                <h4 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Registered Sign-ups</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {student.registeredEvents?.length > 0 ? (
                    student.registeredEvents.map(eventId => {
                      const ev = events.find(e => e.id === eventId);
                      if (!ev) return null;
                      return (
                        <div key={eventId} style={{ 
                          padding: '16px', 
                          border: '1.5px solid var(--border)', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <span className="badge badge-orange" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>{ev.category}</span>
                            <h5 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{ev.title}</h5>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {ev.venue} • 📅 {ev.date}</p>
                          </div>
                          <span className="badge badge-blue">CONFIRMED</span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You haven't registered for any upcoming events yet.</p>
                  )}
                </div>

                <h4 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Participation History</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {events.filter(e => e.status === 'past').map(ev => (
                    <div key={ev.id} style={{ 
                      padding: '16px', 
                      border: '1px solid rgba(0,0,0,0.05)', 
                      backgroundColor: 'rgba(34, 197, 94, 0.03)',
                      borderRadius: '8px', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <span className="badge badge-green" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>{ev.category}</span>
                        <h5 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{ev.title}</h5>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date: {ev.date}</p>
                      </div>
                      <span className="badge badge-green" style={{ display: 'flex', gap: '4px' }}>
                        <CheckCircle size={10} />
                        <span>ATTENDED</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MY CERTIFICATES WORKSPACE */}
            {activeTab === 'certificates' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid #FFE8D6', paddingBottom: '10px' }}>
                  Earned Certificates
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Download high-resolution PDF credentials complete with secure QR codes for LinkedIn and resume inclusion.
                </p>

                <div className="grid-2">
                  {student.certificates?.map((cert, index) => (
                    <div key={index} className="card" style={{ padding: '20px', border: '1.5px solid var(--border)' }}>
                      <h4 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>{cert.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        ID: {cert.id} • Issued: {cert.date || 'July 2026'}
                      </p>
                      <button
                        onClick={() => setActiveCert(cert)}
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '0.8rem', padding: '8px 16px' }}
                      >
                        <Download size={14} />
                        <span>View Certificate</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS WORKSPACE */}
            {activeTab === 'achievements' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid #FFE8D6', paddingBottom: '10px' }}>
                  Club Achievements
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {student.achievements?.map((ach, idx) => (
                    <li key={idx} style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-section)',
                      borderRadius: '8px',
                      borderLeft: '4px solid var(--primary)'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>🏆</span>
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block' }}>{ach}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Creative Club Milestone</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* NOTIFICATIONS WORKSPACE */}
            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid #FFE8D6', paddingBottom: '10px' }}>
                  Club Notifications
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {student.notifications?.map((notif, index) => (
                    <div key={index} style={{ 
                      padding: '14px 18px', 
                      backgroundColor: 'var(--bg-section)', 
                      borderRadius: '8px',
                      borderLeft: '4px solid var(--accent-blue)',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Notification</span>
                      <p style={{ color: 'var(--text-secondary)' }}>{notif}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS WORKSPACE */}
            {activeTab === 'settings' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '1px solid #FFE8D6', paddingBottom: '10px' }}>
                  Edit Profile Settings
                </h3>

                <form onSubmit={handleSaveSettings} style={{ maxWidth: '400px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Branch/Department</label>
                    <input
                      type="text"
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ gap: '8px' }}
                  >
                    <RefreshCw size={16} />
                    <span>Save Changes</span>
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* CERTIFICATE MODAL / LIGHTBOX */}
      {activeCert && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="certificate-preview-card" style={{ 
            maxWidth: '650px', 
            width: '100%', 
            textAlign: 'center',
            position: 'relative',
            backgroundColor: '#FFFCFA'
          }}>
            {/* Close button */}
            <button 
              onClick={() => setActiveCert(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                border: 'none',
                background: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              ✕
            </button>

            {/* Top gold ribbon graphic */}
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎖️</div>

            <h3 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '2rem', 
              color: 'var(--primary)', 
              marginBottom: '10px' 
            }}>
              Certificate of Achievement
            </h3>
            <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              This is proudly presented to
            </p>

            <h2 style={{ 
              fontSize: '2.2rem', 
              color: 'var(--text-primary)', 
              marginBottom: '12px',
              fontFamily: theme === 'sketch' ? 'var(--font-heading)' : 'var(--font-body)'
            }}>
              {student.name}
            </h2>
            
            <p style={{ 
              maxWidth: '480px', 
              margin: '0 auto 24px auto', 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}>
              for outstanding participation and completion of the course/workshop titled <strong style={{ color: 'var(--text-primary)' }}>{activeCert.title}</strong> hosted by the Campus Creative Club.
            </p>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingTop: '20px', 
              borderTop: '1px solid #FFE8D6',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <p>Verify Code: <strong>{activeCert.id}</strong></p>
                <p>Date Issued: <strong>{activeCert.date || 'July 2026'}</strong></p>
              </div>

              {/* Secure QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  backgroundColor: '#000', 
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {/* Mock QR matrix using simple CSS block grids */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'radial-gradient(#fff 25%, transparent 25%)',
                    backgroundSize: '8px 8px',
                    backgroundColor: '#000'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Scan to Verify</span>
              </div>
            </div>

            <div style={{ marginTop: '28px' }}>
              <button 
                onClick={() => {
                  alert('Generating high quality PDF download payload...');
                  setActiveCert(null);
                }}
                className="btn btn-primary"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
