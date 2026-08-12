import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

export default function ContactUs({ team, theme, addToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill out all required fields.');
      return;
    }
    setSuccess(true);
    addToast('Message sent! We will contact you soon. ✉️');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '12px' }}>GET IN TOUCH</span>
          <h2 style={{ marginBottom: '16px' }}>Contact Us</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Have questions about workshops, sponsorship, or custom design queries? Send us a message.</p>
        </div>

        <div className="grid-2" style={{ gap: '48px', alignItems: 'flex-start' }}>
          
          {/* LEFT: Contact info and map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left' }}>
            <div className="card" style={{ padding: '24px', background: '#FFF' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Club Coordinates</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--primary)' }}><Mail size={20} /></div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>EMAIL</span>
                    <strong>creativeclub@college.edu</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--primary)' }}><Phone size={20} /></div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>PHONE</span>
                    <strong>+91 98765 43210</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ color: 'var(--primary)' }}><MapPin size={20} /></div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>LOCATION</span>
                    <strong>Block-B, Ground Floor, Creative Media Lab</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG Campus map */}
            <div className="card" style={{ padding: '20px', background: '#FFF', textAlign: 'center' }}>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '12px', textAlign: 'left' }}>Campus Blueprint (Studio Spot)</h4>
              
              <div style={{ 
                width: '100%', 
                height: '180px', 
                backgroundColor: 'var(--bg-section)', 
                borderRadius: '8px',
                border: theme === 'sketch' ? '2px solid #1F2937' : '1px dashed var(--secondary)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* SVG mock map */}
                <svg width="100%" height="100%" style={{ opacity: 0.85 }}>
                  <rect x="20" y="20" width="80" height="50" rx="4" fill="rgba(249, 115, 22, 0.15)" stroke="var(--primary)" strokeWidth="1.5" />
                  <text x="60" y="45" fontFamily="var(--font-heading)" fontSize="10" textAnchor="middle">Block A</text>

                  <rect x="120" y="20" width="120" height="70" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="var(--accent-blue)" strokeWidth="2" />
                  <text x="180" y="55" fontFamily="var(--font-heading)" fontSize="10" textAnchor="middle" fontWeight="bold">Block B (Lab)</text>
                  
                  <circle cx="180" cy="70" r="6" fill="var(--primary)" className="animate-float" />
                  <text x="180" y="85" fontFamily="var(--font-handwritten)" fontSize="12" fill="var(--primary)" textAnchor="middle" fontWeight="bold">📍 Studio</text>

                  <rect x="20" y="100" width="90" height="60" rx="4" fill="rgba(34, 197, 94, 0.1)" stroke="var(--accent-green)" strokeWidth="1.5" />
                  <text x="65" y="135" fontFamily="var(--font-heading)" fontSize="10" textAnchor="middle">Library</text>

                  <line x1="100" y1="45" x2="120" y2="45" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="65" y1="70" x2="65" y2="100" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT: Contact Form */}
          <div style={{ textAlign: 'left' }}>
            <div className="card" style={{ background: '#FFF' }}>
              
              {success ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'var(--accent-green)'
                  }}>
                    <MessageSquare size={28} />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Message Received!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    We have received your message and will reach out to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 20px', fontSize: '0.8rem' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Send a Message</span>
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
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
                      placeholder="e.g. rahul@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Collaboration Proposal"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Your Message *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write your query in detail..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="form-textarea"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '10px' }}
                  >
                    <Send size={16} />
                    <span>Send Message</span>
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
