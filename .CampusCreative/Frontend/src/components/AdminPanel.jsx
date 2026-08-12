import React, { useState } from 'react';
import { Calendar, Users, Award, FileText, Plus, Bell, RefreshCw, Film, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPanel({
  events,
  addEvent,
  applications,
  updateApplicationStatus,
  reels,
  updateFeaturedReel,
  announcements,
  broadcastAnnouncement,
  student,
  issueCertificate,
  theme,
  addToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('events');

  // Event creation form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Workshops',
    date: '',
    time: '',
    venue: '',
    description: '',
    dateStr: '' // for countdown calculation
  });

  // Reel update form state
  const [newReel, setNewReel] = useState({
    title: reels.current?.title || '',
    creator: reels.current?.creator || '',
    likes: reels.current?.likes || '1.5K',
    views: reels.current?.views || '12K',
    description: reels.current?.description || ''
  });

  // Announcement form state
  const [newAnn, setNewAnn] = useState({
    title: '',
    category: 'Important Notices',
    content: ''
  });

  // Certificate issue state
  const [certTitle, setCertTitle] = useState('Visual Storytelling Masterclass');

  // Handle Event Creation
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.venue || !newEvent.description) {
      alert('Please fill out all fields.');
      return;
    }

    const createdEvent = {
      id: `EVT-${Math.floor(100 + Math.random() * 900)}`,
      title: newEvent.title,
      category: newEvent.category,
      date: newEvent.date,
      time: newEvent.time,
      venue: newEvent.venue,
      description: newEvent.description,
      status: 'upcoming',
      dateStr: `${newEvent.date}T${newEvent.time || '10:00:00'}`
    };

    addEvent(createdEvent);
    addToast(`New Event Published: ${newEvent.title} 📅`);
    setNewEvent({ title: '', category: 'Workshops', date: '', time: '', venue: '', description: '', dateStr: '' });
  };

  // Handle Reel Update
  const handleUpdateReel = (e) => {
    e.preventDefault();
    updateFeaturedReel(newReel);
    addToast('Featured Reel Updated successfully! 🎬');
  };

  // Handle Announcement Broadcast
  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.content) {
      alert('Title and content are required.');
      return;
    }

    const createdAnn = {
      id: `ANN-${Math.floor(100 + Math.random() * 900)}`,
      title: newAnn.title,
      category: newAnn.category,
      content: newAnn.content,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    broadcastAnnouncement(createdAnn);
    addToast(`Announcement Broadcasted: ${newAnn.title} 📢`);
    setNewAnn({ title: '', category: 'Important Notices', content: '' });
  };

  // Handle Certificate Issue
  const handleIssueCert = (e) => {
    e.preventDefault();
    const certId = `CERT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCert = {
      id: certId,
      title: certTitle,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    issueCertificate(newCert);
    addToast(`Certificate issued to student ${student.name}! 🎓`);
  };

  return (
    <div className="section" style={{ flex: 1, padding: '40px 0' }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-coral" style={{ marginBottom: '12px' }}>CONTROL CENTER</span>
          <h2 style={{ marginBottom: '16px' }}>Admin Workspace</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage recruitment applications, publish events, generate certificates, and broadcast club notices.</p>
        </div>

        {/* Dashboard statistics */}
        <div className="grid-4" style={{ marginBottom: '40px' }}>
          <div className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ color: 'var(--primary)', padding: '10px', backgroundColor: 'var(--accent-light)', borderRadius: '8px' }}>
              <Users size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>APPLICATIONS</span>
              <h4 style={{ fontSize: '1.25rem' }}>{applications.length} Submitted</h4>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-blue)', padding: '10px', backgroundColor: 'rgba(14,165,233,0.1)', borderRadius: '8px' }}>
              <Calendar size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EVENTS</span>
              <h4 style={{ fontSize: '1.25rem' }}>{events.length} Published</h4>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-green)', padding: '10px', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
              <Award size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NOTICES</span>
              <h4 style={{ fontSize: '1.25rem' }}>{announcements.length} Feeds</h4>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-coral)', padding: '10px', backgroundColor: 'rgba(244,63,94,0.1)', borderRadius: '8px' }}>
              <FileText size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CREDENTIALS</span>
              <h4 style={{ fontSize: '1.25rem' }}>{student.certificates?.length || 0} Issued</h4>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px', textAlign: 'left' }}>
          
          {/* Sub Navigation */}
          <div className="card" style={{ padding: '12px', background: '#FFF', display: 'flex', flexDirection: 'column', gap: '4px', height: 'fit-content' }}>
            {[
              { id: 'events', label: 'Event Publisher', icon: Calendar },
              { id: 'recruitment', label: 'Applications Pipeline', icon: Users },
              { id: 'announcements', label: 'Broadcast Feeds', icon: Bell },
              { id: 'reels', label: 'Featured Reel', icon: Film },
              { id: 'certificates', label: 'Issue Certificates', icon: Award }
            ].map((subTab) => {
              const Icon = subTab.icon;
              return (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    background: activeSubTab === subTab.id ? 'var(--accent-light)' : 'none',
                    color: activeSubTab === subTab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    borderRadius: theme === 'sketch' ? '4px' : '10px',
                    padding: '10px 16px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: theme === 'sketch' && activeSubTab === subTab.id ? '1.5px solid #1F2937' : 'none',
                    boxShadow: 'none'
                  }}
                >
                  <Icon size={14} />
                  <span>{subTab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub Workspace */}
          <div className="card" style={{ padding: '32px', background: '#FFF', minHeight: '360px' }}>
            
            {/* EVENT MANAGEMENT */}
            {activeSubTab === 'events' && (
              <form onSubmit={handleCreateEvent}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '20px', borderBottom: '1px solid #FFE8D6', paddingBottom: '8px' }}>
                  Publish New Event
                </h3>

                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Photoshop Design Sprint"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="form-select"
                    >
                      <option value="Workshops">Workshops</option>
                      <option value="Competitions">Competitions</option>
                      <option value="Photography">Photography</option>
                      <option value="Videography">Videography</option>
                      <option value="Design">Design</option>
                      <option value="Cultural Events">Cultural Events</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Event Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM - 12:00 PM"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Venue *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Creative Lab Block-B"
                      value={newEvent.venue}
                      onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Event Summary *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Summarize the core focus of the event and list any requirements..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="form-textarea"
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Publish Event</span>
                </button>
              </form>
            )}

            {/* RECRUITMENT MANAGEMENT */}
            {activeSubTab === 'recruitment' && (
              <div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '20px', borderBottom: '1px solid #FFE8D6', paddingBottom: '8px' }}>
                  Recruitment Pipeline Review
                </h3>

                {applications.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {applications.map((app) => (
                      <div key={app.id} style={{ 
                        padding: '20px', 
                        border: '1.5px solid var(--border)', 
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <h4 style={{ fontSize: '1.1rem' }}>{app.name}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: <strong>{app.id}</strong> • Year: {app.year}</span>
                          </div>
                          
                          <span className={`badge ${
                            app.status === 'Approved' ? 'badge-green' : 
                            app.status === 'Shortlisted' ? 'badge-blue' : 
                            app.status === 'Rejected' ? 'badge-coral' : 'badge-orange'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          Role: <strong style={{ color: 'var(--primary)' }}>{app.role}</strong> • Branch: {app.department || 'N/A'}
                        </p>

                        <div style={{ 
                          padding: '10px 14px', 
                          backgroundColor: 'var(--bg-section)', 
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          marginBottom: '16px',
                          border: theme === 'sketch' ? '1.5px solid #1F2937' : 'none'
                        }}>
                          <strong>Pitch:</strong> "{app.pitch}" <br />
                          <strong>Portfolio:</strong> <a href={app.portfolio} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>View link</a>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              updateApplicationStatus(app.id, 'Shortlisted');
                              addToast(`Applicant ${app.name} Shortlisted! 🔵`);
                            }}
                            disabled={app.status === 'Approved'}
                            className="btn btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                          >
                            Shortlist
                          </button>
                          
                          <button
                            onClick={() => {
                              updateApplicationStatus(app.id, 'Approved');
                              addToast(`Applicant ${app.name} Approved as Member! 🟢`);
                            }}
                            className="btn btn-primary"
                            style={{ 
                              padding: '6px 14px', 
                              fontSize: '0.75rem', 
                              backgroundColor: 'var(--accent-green)', 
                              border: theme === 'sketch' ? '2px solid #1F2937' : 'none' 
                            }}
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => {
                              updateApplicationStatus(app.id, 'Rejected');
                              addToast(`Applicant ${app.name} application rejected. 🔴`);
                            }}
                            className="btn"
                            style={{ 
                              padding: '6px 14px', 
                              fontSize: '0.75rem', 
                              backgroundColor: 'transparent',
                              border: '1px solid var(--accent-coral)',
                              color: 'var(--accent-coral)'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No applications submitted yet.</p>
                )}
              </div>
            )}

            {/* BROADCAST ANNOUNCEMENTS */}
            {activeSubTab === 'announcements' && (
              <form onSubmit={handleBroadcast}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '20px', borderBottom: '1px solid #FFE8D6', paddingBottom: '8px' }}>
                  Broadcast Notice
                </h3>

                <div className="form-group">
                  <label className="form-label">Notice Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Recruitment Results Released"
                    value={newAnn.title}
                    onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notice Category</label>
                  <select
                    value={newAnn.category}
                    onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="Important Notices">Important Notices</option>
                    <option value="Recruitment Updates">Recruitment Updates</option>
                    <option value="Event Results">Event Results</option>
                    <option value="New Initiatives">New Initiatives</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notice Content *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide full description of the notice..."
                    value={newAnn.content}
                    onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                    className="form-textarea"
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Send Broadcast</span>
                </button>
              </form>
            )}

            {/* REEL MANAGEMENT */}
            {activeSubTab === 'reels' && (
              <form onSubmit={handleUpdateReel}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '20px', borderBottom: '1px solid #FFE8D6', paddingBottom: '8px' }}>
                  Featured Reel Desk
                </h3>

                <div className="form-group">
                  <label className="form-label">Reel Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cinematic Autumn Campus"
                    value={newReel.title}
                    onChange={(e) => setNewReel({ ...newReel, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Creator Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. siddharth_sen"
                    value={newReel.creator}
                    onChange={(e) => setNewReel({ ...newReel, creator: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Views Metric</label>
                    <input
                      type="text"
                      placeholder="e.g. 14.5K"
                      value={newReel.views}
                      onChange={(e) => setNewReel({ ...newReel, views: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Likes Metric</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.8K"
                      value={newReel.likes}
                      onChange={(e) => setNewReel({ ...newReel, likes: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reel Details *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write a description explaining how the reel was filmed..."
                    value={newReel.description}
                    onChange={(e) => setNewReel({ ...newReel, description: e.target.value })}
                    className="form-textarea"
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Update Reel</span>
                </button>
              </form>
            )}

            {/* CERTIFICATE ISSUING */}
            {activeSubTab === 'certificates' && (
              <form onSubmit={handleIssueCert}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '20px', borderBottom: '1px solid #FFE8D6', paddingBottom: '8px' }}>
                  Issue Verified Student Certificate
                </h3>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Generate and issue a verified digital certificate for student <strong>{student.name}</strong>. It will be loaded directly into their Student Dashboard.
                </p>

                <div className="form-group">
                  <label className="form-label">Certificate Course / Event Title *</label>
                  <select
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    className="form-select"
                  >
                    <option value="Visual Storytelling Masterclass">Visual Storytelling Masterclass</option>
                    <option value="Photoshop Essentials Workshop">Photoshop Essentials Workshop</option>
                    <option value="Figma Design Sprint Camp">Figma Design Sprint Camp</option>
                    <option value="Campus Videography Lab 2026">Campus Videography Lab 2026</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Issue Certificate</span>
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
