import React from 'react';
import { Award, Star, Compass, Library } from 'lucide-react';

export default function Achievements({ theme }) {
  // Pre-populated milestones list
  const achievementsList = [
    { year: '2026', title: 'Best Media Club Award', description: 'Awarded by the college senate for documenting the annual cultural fest with high cinematic coverage.', type: 'win' },
    { year: '2026', title: 'National Photothon - 1st Runner Up', description: 'Student Core members secured 2nd place in the Inter-College Photography contest.', type: 'win' },
    { year: '2025', title: '10K Instagram Milestone', description: 'Our community grew past 10,000 active followers, reaching design enthusiasts across colleges.', type: 'milestone' },
    { year: '2025', title: 'Launched Creative Studio', description: 'Inaugurated our dedicated creative lab with high-end editing desks, cameras, and graphic rigs.', type: 'milestone' },
    { year: '2024', title: 'Short Film Contest Winner', description: 'Our entry "Silent Campus Paths" won best direction at the Zonal Media Festival.', type: 'win' },
  ];

  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span className="badge badge-orange" style={{ marginBottom: '12px' }}>HALL OF FAME</span>
          <h2 style={{ marginBottom: '16px' }}>Club Achievements</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Celebrating our milestones, competition trophies, and media coverages.</p>
        </div>

        {/* Timeline Layout */}
        <div className="timeline">
          {achievementsList.map((ach, idx) => (
            <div key={idx} className="timeline-item" style={{ textAlign: 'left' }}>
              {/* Dot */}
              <div className="timeline-dot"></div>

              {/* Box */}
              <div className="card card-glow-hover" style={{ 
                marginLeft: '12px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{ach.year}</span>
                  <span className="badge badge-green" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{ach.type}</span>
                </div>
                
                <h4 style={{ fontSize: '1.25rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ach.type === 'win' ? <Award size={18} style={{ color: 'var(--primary)' }} /> : <Star size={18} style={{ color: 'var(--highlight)' }} />}
                  <span>{ach.title}</span>
                </h4>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {ach.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Milestones grid */}
        <div style={{ marginTop: '80px' }}>
          <h3 style={{ 
            fontSize: '1.65rem', 
            textAlign: 'left', 
            marginBottom: '28px',
            borderBottom: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--accent-light)',
            paddingBottom: '8px'
          }}>
            Club Statistics
          </h3>

          <div className="grid-4">
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🏆</span>
              <h4 style={{ fontSize: '1.5rem', margin: '12px 0 4px 0' }}>15+</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trophies Won</p>
            </div>
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🤝</span>
              <h4 style={{ fontSize: '1.5rem', margin: '12px 0 4px 0' }}>80+</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Members</p>
            </div>
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🎬</span>
              <h4 style={{ fontSize: '1.5rem', margin: '12px 0 4px 0' }}>120+</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cinematic Posts</p>
            </div>
            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>📢</span>
              <h4 style={{ fontSize: '1.5rem', margin: '12px 0 4px 0' }}>25+</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Workshops Organized</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
