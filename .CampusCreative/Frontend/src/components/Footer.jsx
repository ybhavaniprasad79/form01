import { Mail, MapPin } from 'lucide-react';
import { Instagram, Linkedin, Youtube } from './SocialIcons';

export default function Footer({ setCurrentPage, theme }) {
  return (
    <footer style={{ 
      marginTop: 'auto', 
      backgroundColor: 'var(--bg-section)', 
      borderTop: 'var(--border-style)',
      padding: '48px 0 24px 0',
      position: 'relative'
    }}>
      {/* Wave Accent Divider for Sunset Canvas Theme */}
      {theme === 'canvas' && (
        <div style={{
          position: 'absolute',
          top: '-48px',
          left: 0,
          width: '100%',
          height: '48px',
          overflow: 'hidden',
          lineHeight: 0
        }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            height: '48px',
            fill: 'var(--bg-section)'
          }}>
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
          </svg>
        </div>
      )}

      {/* Notebook sketch lines for Sunset Sketch Theme */}
      {theme === 'sketch' && (
        <div style={{
          borderTop: '2px dashed #1F2937',
          position: 'absolute',
          top: '3px',
          left: 0,
          right: 0
        }}></div>
      )}

      <div className="container">
        <div className="grid-3" style={{ textAlign: 'left', marginBottom: '32px' }}>
          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Campus Creative Club</span>
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Empowering students through photography, filmmaking, design, and storytelling. We document, style, and design campus life.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <a href="#" className="btn-secondary" style={{ width: '36px', height: '36px', borderRadius: '50%', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--primary)', color: 'var(--primary)' }}>
                <Instagram size={18} />
              </a>
              <a href="#" className="btn-secondary" style={{ width: '36px', height: '36px', borderRadius: '50%', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--primary)', color: 'var(--primary)' }}>
                <Linkedin size={18} />
              </a>
              <a href="#" className="btn-secondary" style={{ width: '36px', height: '36px', borderRadius: '50%', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--primary)', color: 'var(--primary)' }}>
                <Youtube size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '16px' }}>Quick Navigation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Home</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('events'); }}>Events</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('team'); }}>Team</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('reel'); }}>Reel</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('join'); }}>Join Us</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('gallery'); }}>Gallery</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('achievements'); }}>Achievements</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('contact'); }}>Contact</a>
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '16px' }}>Contact Us</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} />
                <span>campuscreators@klu.ac.in</span>
              </li>
            </ul>
            {theme === 'sketch' && (
              <div style={{ 
                fontFamily: 'var(--font-handwritten)', 
                fontSize: '1.2rem', 
                color: 'var(--primary)',
                marginTop: '16px',
                transform: 'rotate(-2deg)'
              }}>
                ✏️ Capture every moment.
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          borderTop: theme === 'sketch' ? '2px solid #1F2937' : '1px solid rgba(249, 115, 22, 0.1)', 
          paddingTop: '20px', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p>© {new Date().getFullYear()} Campus Creative Club. All rights reserved.</p>
          <p style={{ display: 'flex', gap: '8px' }}>
            <span>Made by Jayanth & Bhavani Prasad (Web Developers)</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
