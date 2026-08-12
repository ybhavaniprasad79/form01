import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Award, Users, FileText, CheckCircle } from 'lucide-react';

export default function Events({ events, registerForEvent, student, theme, addToast }) {
  const [filter, setFilter] = useState('All');
  const [timers, setTimers] = useState({});

  const categories = ['All', 'Workshops', 'Competitions', 'Photography', 'Videography', 'Design', 'Cultural'];

  // Setup simple countdowns for upcoming events
  useEffect(() => {
    const calculateTime = () => {
      const updatedTimers = {};
      events.forEach(e => {
        if (e.status === 'upcoming') {
          const eventDate = new Date(e.dateStr || '2026-08-10T10:00:00');
          const difference = eventDate - new Date();
          
          if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            updatedTimers[e.id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          } else {
            updatedTimers[e.id] = 'Happening Now!';
          }
        }
      });
      setTimers(updatedTimers);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [events]);

  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(e => e.category === filter);

  const upcomingEvents = filteredEvents.filter(e => e.status === 'upcoming');
  const pastEvents = filteredEvents.filter(e => e.status === 'past');

  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container">
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '12px' }}>CLUB CALENDAR</span>
          <h2 style={{ marginBottom: '16px' }}>Event Hub</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Sign up for workshops, participate in creative competitions, or view past highlights.</p>
        </div>

        {/* Categories Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px', 
          flexWrap: 'wrap',
          marginBottom: '48px' 
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`btn ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '8px 18px', 
                fontSize: '0.85rem',
                borderRadius: theme === 'sketch' ? '6px' : '9999px',
                backgroundColor: filter === cat ? 'var(--primary)' : 'transparent',
                borderColor: filter === cat ? 'var(--primary)' : 'var(--border)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* UPCOMING EVENTS */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{ 
            fontSize: '1.75rem', 
            textAlign: 'left', 
            marginBottom: '28px',
            borderBottom: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--accent-light)',
            paddingBottom: '8px'
          }}>
            Upcoming Activities
          </h3>
          
          {upcomingEvents.length > 0 ? (
            <div className="grid-2">
              {upcomingEvents.map((event) => {
                const isRegistered = student.registeredEvents?.includes(event.id);
                return (
                  <div key={event.id} className="card card-glow-hover" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span className="badge badge-blue">{event.category}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        📅 {event.date}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{event.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', flex: 1 }}>
                      {event.description}
                    </p>

                    {/* Countdown Clock Widget */}
                    <div style={{ 
                      backgroundColor: 'var(--bg-section)', 
                      padding: '12px 18px', 
                      borderRadius: theme === 'sketch' ? '6px' : '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      border: theme === 'sketch' ? '2px solid #1F2937' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                        <Clock size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Starts In:</span>
                      </div>
                      <span style={{ 
                        fontFamily: theme === 'sketch' ? 'var(--font-heading)' : 'monospace', 
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        color: 'var(--text-primary)'
                      }}>
                        {timers[event.id] || 'Loading...'}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          📍 Venue: <strong>{event.venue}</strong>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ⏰ Time: <strong>{event.time}</strong>
                        </span>
                      </div>

                      <button
                        onClick={() => registerForEvent(event.id)}
                        disabled={isRegistered}
                        className={`btn ${isRegistered ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ 
                          padding: '10px 24px', 
                          fontSize: '0.85rem',
                          backgroundColor: isRegistered ? 'rgba(34, 197, 94, 0.1)' : 'var(--primary)',
                          borderColor: isRegistered ? 'var(--accent-green)' : 'none',
                          color: isRegistered ? 'var(--accent-green)' : '#fff',
                          cursor: isRegistered ? 'default' : 'pointer'
                        }}
                      >
                        {isRegistered ? (
                          <>
                            <CheckCircle size={16} />
                            <span>Registered!</span>
                          </>
                        ) : (
                          <span>Register Now</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No upcoming events in this category yet. Stay tuned!</p>
          )}
        </div>

        {/* PAST EVENTS */}
        <div>
          <h3 style={{ 
            fontSize: '1.75rem', 
            textAlign: 'left', 
            marginBottom: '28px',
            borderBottom: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--accent-light)',
            paddingBottom: '8px'
          }}>
            Past Chronicles
          </h3>

          {pastEvents.length > 0 ? (
            <div className="grid-2">
              {pastEvents.map((event) => (
                <div key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span className="badge badge-coral">{event.category}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date: {event.date}</span>
                  </div>

                  <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{event.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    {event.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid-2" style={{ 
                    backgroundColor: 'var(--bg-section)', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    border: theme === 'sketch' ? '2px solid #1F2937' : 'none'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>🏆 WINNERS</span>
                      <strong style={{ color: 'var(--primary)' }}>{event.winners || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>📊 STATISTICS</span>
                      <strong>{event.stats || '45+ submissions'}</strong>
                    </div>
                  </div>

                  {/* Feedback preview & Certificate availability */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontStyle: 'italic', 
                      color: 'var(--text-secondary)',
                      fontFamily: theme === 'sketch' ? 'var(--font-handwritten)' : 'var(--font-body)'
                    }}>
                      "{event.feedback || 'Incredible experience, learned a lot!'}"
                    </span>
                    <span className="badge badge-green" style={{ textTransform: 'none', gap: '4px', fontSize: '0.75rem' }}>
                      <FileText size={12} />
                      <span>Certificates Available</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No past events recorded in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}
