import React from 'react';
import { Camera, Film, Brush, Sparkles, ChevronRight, Award, Calendar, Users, Eye, HelpCircle } from 'lucide-react';

export default function Home({ setCurrentPage, theme, events, team, reels }) {
  // Pre-fetch some preview data
  const nextEvent = events.find(e => e.status === 'upcoming') || events[0];
  const coreLeader = team.students?.find(member => member.role === 'President') || { name: 'Siddharth Roy', role: 'President' };

  return (
    <div style={{ flex: 1 }}>
      {/* -----------------------------------------
         HERO SECTION
         ----------------------------------------- */}
      <section style={{
        position: 'relative',
        padding: '120px 0 80px 0',
        background: theme === 'canvas' 
          ? 'linear-gradient(135deg, var(--bg-section) 0%, var(--bg-alt) 100%)' 
          : 'var(--bg-main)',
        textAlign: 'center',
        overflow: 'hidden',
        borderBottom: theme === 'sketch' ? '2px solid #1F2937' : 'none'
      }}>
        {/* Floating Sketch Sun outline in Sunset Sketch Theme */}
        {theme === 'sketch' && (
          <>
            {/* Draw a sketchy sun at top-right corner */}
            <div style={{
              position: 'absolute',
              top: '40px',
              right: '8%',
              width: '80px',
              height: '80px',
              border: '2.5px solid #F97316',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} className="animate-float">
              {/* rays */}
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: '16px',
                  height: '2.5px',
                  backgroundColor: '#F97316',
                  transform: `rotate(${i * 45}deg) translate(50px)`
                }} />
              ))}
              <span style={{ fontFamily: 'var(--font-handwritten)', fontSize: '0.8rem', color: '#F97316' }}>golden</span>
            </div>
            
            {/* Draw stars/sparkles floating in top-left */}
            <div style={{ position: 'absolute', top: '60px', left: '10%' }} className="animate-float">
              <span style={{ fontSize: '2.5rem', color: 'var(--highlight)', display: 'block' }}>★</span>
              <span style={{ fontSize: '1.5rem', color: 'var(--primary)', display: 'block', marginLeft: '20px', marginTop: '-10px' }}>✦</span>
            </div>
          </>
        )}

        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
            {/* Theme Badge */}
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '16px' }}>
              <span className="badge badge-orange" style={{ padding: '6px 16px', gap: '8px' }}>
                <Sparkles size={14} className="animate-spin-slow" />
                <span>Creative Hub Of Campus</span>
              </span>
            </div>

            {/* Main Editorial Header */}
            <h1 style={{ marginBottom: '24px', fontWeight: '900', lineHeight: 1.1 }}>
              Create. Capture.<br />
              <span style={{ 
                color: 'var(--primary)', 
                backgroundImage: theme === 'canvas' ? 'linear-gradient(to right, #F97316, #FB7185)' : 'none',
                WebkitBackgroundClip: theme === 'canvas' ? 'text' : 'none',
                WebkitTextFillColor: theme === 'canvas' ? 'transparent' : 'inherit'
              }}>Inspire.</span>
            </h1>

            {/* Sub-headline */}
            <p style={{ 
              fontSize: '1.2rem', 
              color: 'var(--text-secondary)', 
              marginBottom: '40px',
              fontFamily: theme === 'sketch' ? 'var(--font-heading)' : 'var(--font-body)',
              lineHeight: 1.5
            }}>
              {theme === 'sketch' 
                ? "✏️ A creative community notebook where ideas become stories through photography, filmmaking, design, and unforgettable campus experiences!"
                : "Empowering students through photography, filmmaking, design, storytelling, and unforgettable campus experiences."
              }
            </p>

            {/* Call To Actions */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '16px', 
              flexWrap: 'wrap' 
            }}>
              <button 
                onClick={() => setCurrentPage('join')}
                className="btn btn-primary"
                style={{ padding: '16px 36px', fontSize: '1.05rem' }}
              >
                Join the Club
                <ChevronRight size={18} />
              </button>
              <button 
                onClick={() => setCurrentPage('events')}
                className="btn btn-secondary"
                style={{ padding: '16px 36px', fontSize: '1.05rem' }}
              >
                Explore Events
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Wave divider for Sunset Canvas */}
        {theme === 'canvas' && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            overflow: 'hidden',
            lineHeight: 0
          }}>
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{
              position: 'relative',
              display: 'block',
              width: '100%',
              height: '40px',
              fill: 'var(--bg-main)'
            }}>
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C0,95.8,116,118.92,321.39,56.44Z" fill="var(--bg-main)"></path>
            </svg>
          </div>
        )}
      </section>

      {/* -----------------------------------------
         ABOUT SECTION
         ----------------------------------------- */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                <span className="badge badge-blue">About Creative Club</span>
              </div>
              <h2 style={{ marginBottom: '24px' }}>Where Imagination Meets Skill</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '1.05rem' }}>
                The Campus Creative Club is a student-driven collective dedicated to exploring visual arts, design, digital content production, and cultural journalism. We believe in providing every member with the freedom to learn, try, build, and capture campus history.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '1.05rem' }}>
                Whether you shoot with a DSLR, design layout grids on Figma, edit transitions in Premiere Pro, or draft captions for social campaigns—there is a desk for you here.
              </p>
              
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: theme === 'sketch' ? '8px' : '50%',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: theme === 'sketch' ? '2px solid #1F2937' : 'none'
                  }}>
                    <Camera size={20} style={{ color: 'var(--accent-blue)' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem' }}>1200+</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Moments Captured</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: theme === 'sketch' ? '8px' : '50%',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: theme === 'sketch' ? '2px solid #1F2937' : 'none'
                  }}>
                    <Calendar size={20} style={{ color: 'var(--accent-green)' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem' }}>25+</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Events Hosted</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual preview */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {theme === 'sketch' ? (
                /* Polaroid Sketch preview */
                <div className="polaroid-frame" style={{ '--rot': '3deg', maxWidth: '340px' }}>
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '4/3', 
                    backgroundColor: '#FDBA74', 
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    border: '2px solid #1F2937'
                  }}>
                    <span style={{ fontSize: '4rem' }}>📸</span>
                    {/* Sketch Doodles */}
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '1.2rem' }}>✨</div>
                  </div>
                  <div className="handwritten-label">our creative studio</div>
                </div>
              ) : (
                /* Canvas Glassmorphic Preview */
                <div style={{ 
                  position: 'relative',
                  width: '100%',
                  maxWidth: '400px',
                  aspectRatio: '1',
                  borderRadius: '32px',
                  background: 'linear-gradient(135deg, #F97316 0%, #FB7185 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 40px rgba(249, 115, 22, 0.2)'
                }}>
                  <div style={{
                    width: '80%',
                    height: '80%',
                    borderRadius: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#fff',
                    padding: '24px'
                  }}>
                    <Sparkles size={48} style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: '#fff', fontSize: '1.4rem', textAlign: 'center', marginBottom: '8px' }}>Sunset Canvas Studio</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem', textAlign: 'center' }}>Where beach colors inspire daily campus aesthetics.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------
         MISSION & VISION
         ----------------------------------------- */}
      <section className="section section-alt" style={{ borderTop: theme === 'sketch' ? '2px solid #1F2937' : 'none' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ marginBottom: '12px' }}>Our Mission & Vision</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Defining why we create and what we aim to accomplish.</p>
          </div>

          <div className="grid-2">
            <div className="card card-glow-hover" style={{ textAlign: 'left' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(249, 115, 22, 0.1)', marginBottom: '20px' }}>
                <Camera size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ marginBottom: '16px' }}>Our Mission</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                To establish a thriving visual community on campus by organizing skills-focused workshops, design hackathons, editing labs, and photowalks. We provide students with the software access, peer feedback, and networking opportunities to kickstart portfolios in photography, film, and graphics.
              </p>
            </div>

            <div className="card card-glow-hover" style={{ textAlign: 'left' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', marginBottom: '20px' }}>
                <Brush size={24} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <h3 style={{ marginBottom: '16px' }}>Our Vision</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                To transform campus culture into a visually rich and narrative-driven space. We envision a student body equipped to think creatively, communicate ideas visually, and preserve college milestones in formats that align with global aesthetic benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------
         PREVIEWS: EVENTS & TEAM
         ----------------------------------------- */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ gap: '48px' }}>
            {/* Upcoming Event Preview */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                <span className="badge badge-green">Coming Up Next</span>
              </div>
              <h3 style={{ fontSize: '1.85rem', marginBottom: '24px' }}>Don't Miss Out</h3>
              
              {nextEvent ? (
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge badge-orange">{nextEvent.category}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{nextEvent.date}</span>
                  </div>
                  <h4 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--text-primary)' }}>{nextEvent.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>{nextEvent.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📍 Venue: <strong>{nextEvent.venue}</strong>
                    </div>
                    <button 
                      onClick={() => setCurrentPage('events')}
                      className="btn btn-primary"
                      style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ) : (
                <p>No upcoming events scheduled right now. Check back soon!</p>
              )}
            </div>

            {/* Team Spotlight */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                <span className="badge badge-blue">Team Spotlight</span>
              </div>
              <h3 style={{ fontSize: '1.85rem', marginBottom: '24px' }}>Meet Student Leaders</h3>

              <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--secondary)',
                  border: theme === 'sketch' ? '2px solid #1F2937' : '3px solid var(--accent-light)',
                  boxShadow: theme === 'sketch' ? '2px 2px 0 #1F2937' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem'
                }}>
                  👨‍💻
                </div>
                <div>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{coreLeader.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px' }}>{coreLeader.role}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>"Join us to challenge conventions and bring your visual ideas to reality."</p>
                  
                  <button 
                    onClick={() => setCurrentPage('team')}
                    className="btn-text" 
                    style={{ fontSize: '0.8rem', marginTop: '12px', border: 'none', cursor: 'pointer' }}
                  >
                    View All Coordinators →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------
         REEL PREVIEW
         ----------------------------------------- */}
      <section className="section section-alt" style={{ borderTop: theme === 'sketch' ? '2px solid #1F2937' : 'none' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center' }}>
            {theme === 'sketch' ? (
              <div className="sticky-note" style={{ maxWidth: '380px', margin: '0 auto', textAlign: 'left' }}>
                <div className="paperclip"></div>
                <h3 style={{ marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>🎬 Reel of the Month</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Every month, our videography team creates something cinematic. The creator of the chosen reel gets featured on our portal and physical screens!
                </p>
                <div style={{ border: '1px dashed #1F2937', padding: '12px', borderRadius: '4px', backgroundColor: '#FFF' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>⚡ Trending: "{reels?.current?.title || 'Campus Rain Vibes'}"</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created by: {reels?.current?.creator || 'Siddharth'}</p>
                </div>
                <button 
                  onClick={() => setCurrentPage('reel')}
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '16px', fontSize: '0.85rem' }}
                >
                  Watch Reel Embed
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <span className="badge badge-coral" style={{ marginBottom: '12px' }}>Cinematic Corner</span>
                <h2 style={{ marginBottom: '24px' }}>Reel of the Month</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '1.05rem' }}>
                  Check out this month's featured Instagram video, showcasing our team's cinematography and editing skills. Each month, we highlight a creator who captures the essence of campus aesthetics.
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '1.05rem' }}>
                  Log in to your Dashboard to submit your clips for next month's selection and participate in theme polls!
                </p>
                <button 
                  onClick={() => setCurrentPage('reel')}
                  className="btn btn-primary"
                >
                  <Eye size={16} />
                  <span>Watch Feature Reel</span>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {/* Simulated Reels mockup */}
              <div className="reel-mockup" style={{ height: '480px', width: '270px' }}>
                <div style={{
                  position: 'absolute',
                  top: 0, right: 0, bottom: 0, left: 0,
                  background: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.7))',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '16px',
                  color: '#fff',
                  textAlign: 'left'
                }}>
                  <span className="badge badge-orange" style={{ alignSelf: 'flex-start', marginBottom: '8px', fontSize: '0.65rem' }}>FEATURED CREATOR</span>
                  <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>@{reels?.current?.creator || 'creative_club'}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#ccc', marginBottom: '12px' }}>{reels?.current?.description || 'Simulated aesthetic campus edits.'}</p>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                    <span>❤️ {reels?.current?.likes || '1.8K'} likes</span>
                    <span>👁️ {reels?.current?.views || '14K'} views</span>
                  </div>
                </div>
                {/* Mock Image Cover representing video */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(200deg, #F59E0B 0%, #EC4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}>
                    <span style={{ fontSize: '1.5rem', color: '#fff', marginLeft: '4px' }}>▶</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------
         CTA JOIN CLUB
         ----------------------------------------- */}
      <section className="section" style={{
        backgroundImage: theme === 'canvas' 
          ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(253, 186, 116, 0.08) 100%)'
          : 'none',
        backgroundColor: theme === 'sketch' ? 'var(--bg-main)' : 'transparent',
        borderTop: theme === 'sketch' ? '2px solid #1F2937' : 'none',
        borderBottom: theme === 'sketch' ? '2px solid #1F2937' : 'none'
      }}>
        <div className="container">
          <div className="card" style={{ 
            padding: '48px', 
            textAlign: 'center', 
            maxWidth: '900px', 
            margin: '0 auto',
            background: '#FFF'
          }}>
            <h2 style={{ marginBottom: '16px' }}>Ready to Express Your Creative Voice?</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 32px auto' }}>
              We recruit new designers, writers, photographers, editors, and event managers every academic year. Apply today to showcase your portfolio.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setCurrentPage('join')}
                className="btn btn-primary"
              >
                View Available Roles
              </button>
              <button 
                onClick={() => setCurrentPage('contact')}
                className="btn btn-secondary"
              >
                Connect with Advisors
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
