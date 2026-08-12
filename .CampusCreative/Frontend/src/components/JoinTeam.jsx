import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle, ClipboardList, Info, Search } from 'lucide-react';

export default function JoinTeam({ applications, addApplication, theme, addToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dept: '',
    year: '1st Year',
    role: 'Designer',
    portfolio: '',
    pitch: ''
  });

  const [submittedId, setSubmittedId] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const roles = [
    { name: 'Designer', details: 'Design posters, social grids, website layouts. Proficient in Figma/Illustrator.' },
    { name: 'Photographer', details: 'Capture campus events, photowalks. Must own a DSLR/Mirrorless camera.' },
    { name: 'Videographer & Editor', details: 'Record and edit Reels, trailers, event highlights. Premiere Pro / DaVinci.' },
    { name: 'Content Writer', details: 'Draft captions, emails, press notes, and website updates.' },
    { name: 'Web Developer', details: 'Maintain and update this website structure and add features.' },
    { name: 'Event Coordinator', details: 'Manage registrations, logistics, sponsorships, and venue setups.' }
  ];

  const faqs = [
    { q: 'Who can apply?', a: 'Any registered student of the college, regardless of branch or year. Passion matters most!' },
    { q: 'Do I need prior experience?', a: 'Not necessarily! For technical roles, a basic portfolio is good, but we look for willingness to learn.' },
    { q: 'What is the selection process?', a: 'After reviewing your application and portfolio, we will invite you for a casual interview/vibe check.' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.pitch) {
      alert('Please fill out all required fields.');
      return;
    }

    const newId = `APP-${Math.floor(100 + Math.random() * 900)}`;
    const newApp = {
      id: newId,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.dept,
      year: formData.year,
      portfolio: formData.portfolio,
      pitch: formData.pitch,
      status: 'Pending'
    };

    addApplication(newApp);
    setSubmittedId(newId);
    addToast(`Application Submitted Successfully! ID: ${newId} 🎉`);
    
    // Clear form
    setFormData({
      name: '',
      email: '',
      dept: '',
      year: '1st Year',
      role: 'Designer',
      portfolio: '',
      pitch: ''
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId) return;
    const found = applications.find(
      app => app.id.toUpperCase() === searchId.trim().toUpperCase()
    );
    setSearchResult(found || 'not_found');
  };

  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '12px' }}>RECRUITMENT PORTAL</span>
          <h2 style={{ marginBottom: '16px' }}>Join the Creative Team</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Become a designer, writer, photographer, or coordinator. We look forward to your application.</p>
        </div>

        <div className="grid-2" style={{ gap: '48px', alignItems: 'flex-start' }}>
          
          {/* LEFT: Recruitment Details, Status Tracking, and FAQs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Status Tracking Widget */}
            <div className="card" style={{ textAlign: 'left', background: '#FFF' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
                <span>Track Application Status</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Already applied? Enter your Application ID (e.g. APP-001) below to view status:
              </p>
              
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter APP-XXX"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="form-input"
                  style={{ padding: '10px 16px', fontSize: '0.9rem', flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: theme === 'sketch' ? '6px' : '9999px' }}
                >
                  <Search size={16} />
                </button>
              </form>

              {searchResult && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  backgroundColor: 'var(--bg-section)',
                  border: theme === 'sketch' ? '2px solid #1F2937' : 'none',
                  fontSize: '0.9rem'
                }}>
                  {searchResult === 'not_found' ? (
                    <span style={{ color: 'var(--accent-coral)', fontWeight: 'bold' }}>⚠️ ID Not Found. Double-check your spelling!</span>
                  ) : (
                    <div>
                      <p>Applicant: <strong>{searchResult.name}</strong></p>
                      <p>Role Applied: <strong>{searchResult.role}</strong></p>
                      <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        Status: 
                        <span className={`badge ${
                          searchResult.status === 'Approved' ? 'badge-green' : 
                          searchResult.status === 'Shortlisted' ? 'badge-blue' : 
                          searchResult.status === 'Rejected' ? 'badge-coral' : 'badge-orange'
                        }`}>
                          {searchResult.status}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Available Roles */}
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Open Positions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {roles.map((role, idx) => (
                  <div key={idx} className="card" style={{ padding: '18px 24px' }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '4px' }}>{role.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{role.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Recruitment FAQs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {faqs.map((faq, idx) => (
                  <div key={idx} style={{ 
                    borderLeft: '3px solid var(--secondary)', 
                    paddingLeft: '12px' 
                  }}>
                    <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>{faq.q}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Application Form */}
          <div style={{ textAlign: 'left' }}>
            <div className="card" style={{ background: '#FFF', position: 'relative' }}>
              {theme === 'sketch' && <div className="paperclip"></div>}
              
              {submittedId ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                    color: 'var(--accent-green)'
                  }}>
                    <CheckCircle size={36} />
                  </div>
                  <h3 style={{ marginBottom: '12px' }}>Application Submitted!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
                    Your application has been logged. Save the following ID to track progress or view it in the Admin Panel:
                  </p>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--bg-section)', 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    borderRadius: '8px',
                    border: theme === 'sketch' ? '2px solid #1F2937' : 'none',
                    display: 'inline-block',
                    marginBottom: '28px'
                  }}>
                    {submittedId}
                  </div>
                  <div>
                    <button
                      onClick={() => setSubmittedId(null)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 24px', fontSize: '0.85rem' }}
                    >
                      Submit Another Application
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Apply Online</span>
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kavya Iyer"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. kavya@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="grid-2" style={{ gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Department/Branch</label>
                      <input
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={formData.dept}
                        onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="form-select"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Select Preferred Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="form-select"
                    >
                      {roles.map((r, i) => (
                        <option key={i} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Portfolio URL (GitHub, Behance, Drive) *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://behance.net/username"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Why do you want to join Campus Creative? *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your design tools preference, filming skills, writing portfolio, etc..."
                      value={formData.pitch}
                      onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                      className="form-textarea"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '10px' }}
                  >
                    <Send size={18} />
                    <span>Submit Application</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
