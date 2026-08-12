import React, { useState } from 'react';
import { Mail, Camera, Image, Film, Code, PenTool } from 'lucide-react';
import { Github, Linkedin, Youtube } from './SocialIcons';

export default function Team({ team, theme }) {
  const [activeDept, setActiveDept] = useState('All');

  const departments = ['All', 'Design', 'Photography & Video', 'Editorial', 'Web Dev & Technical', 'Event Operations'];

  const getDeptIcon = (dept) => {
    switch (dept) {
      case 'Design': return <PenTool size={16} />;
      case 'Photography & Video': return <Camera size={16} />;
      case 'Editorial': return <Image size={16} />;
      case 'Web Dev & Technical': return <Code size={16} />;
      default: return <Film size={16} />;
    }
  };

  const filteredStudents = activeDept === 'All'
    ? team.students
    : team.students.filter(student => student.department === activeDept);

  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span className="badge badge-blue" style={{ marginBottom: '12px' }}>THE CREATORS</span>
          <h2 style={{ marginBottom: '16px' }}>Meet Our Team</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The passionate students and faculty advisors behind Campus Creative.</p>
        </div>

        {/* -----------------------------------------
           FACULTY ADVISORS
           ----------------------------------------- */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{ 
            fontSize: '1.65rem', 
            textAlign: 'left', 
            marginBottom: '28px',
            borderBottom: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--accent-light)',
            paddingBottom: '8px'
          }}>
            Faculty Advisors
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="grid-2" style={{ width: '100%', maxWidth: '800px' }}>
              {team.faculty?.map((advisor, index) => (
                <div key={index} className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', textAlign: 'left' }}>
                  <div style={{ 
                    width: '70px', 
                    height: '70px', 
                    borderRadius: theme === 'sketch' ? '8px' : '50%', 
                    backgroundColor: 'var(--secondary)',
                    border: theme === 'sketch' ? '2px solid #1F2937' : '3px solid var(--accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    boxShadow: theme === 'sketch' ? '2px 2px 0 #1F2937' : 'none'
                  }}>
                    👩‍🏫
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{advisor.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '8px' }}>
                      {advisor.designation}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} />
                      <span>{advisor.contact}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -----------------------------------------
           STUDENT LEADERSHIP
           ----------------------------------------- */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{ 
            fontSize: '1.65rem', 
            textAlign: 'left', 
            marginBottom: '28px',
            borderBottom: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--accent-light)',
            paddingBottom: '8px'
          }}>
            Student Leadership
          </h3>

          <div className="grid-4">
            {team.leadership?.map((leader, index) => (
              <div key={index} className="card card-glow-hover" style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--accent-light)', 
                  margin: '0 auto 16px auto',
                  border: theme === 'sketch' ? '2px solid #1F2937' : '3px solid var(--primary)',
                  boxShadow: theme === 'sketch' ? '3px 3px 0 #1F2937' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}>
                  {leader.role === 'President' ? '👑' : leader.role === 'Vice President' ? '🚀' : leader.role === 'Secretary' ? '📝' : '💼'}
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{leader.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px' }}>{leader.role}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{leader.year} • {leader.dept}</p>
              </div>
            ))}
          </div>
        </div>

        {/* -----------------------------------------
           STUDENT CORE TEAM & DEPT FILTERS
           ----------------------------------------- */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px',
            marginBottom: '28px',
            borderBottom: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--accent-light)',
            paddingBottom: '12px'
          }}>
            <h3 style={{ fontSize: '1.65rem' }}>Core Coordinators</h3>
            
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className={`btn`}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    borderRadius: theme === 'sketch' ? '4px' : '9999px',
                    backgroundColor: activeDept === dept ? 'var(--primary)' : 'rgba(249,115,22,0.05)',
                    color: activeDept === dept ? '#fff' : 'var(--text-primary)',
                    border: theme === 'sketch' ? '1.5px solid #1F2937' : 'none',
                    boxShadow: theme === 'sketch' && activeDept === dept ? '1.5px 1.5px 0 #1F2937' : 'none'
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-4">
            {filteredStudents?.map((member, index) => (
              <div key={index} className="card card-glow-hover" style={{ textAlign: 'center', padding: '20px' }}>
                {theme === 'sketch' ? (
                  /* Sketch Polaroid avatar */
                  <div className="polaroid-frame" style={{ '--rot': `${(index % 3 - 1) * 2}deg`, padding: '8px 8px 24px 8px', marginBottom: '16px', display: 'block' }}>
                    <div style={{ 
                      width: '70px', 
                      height: '70px', 
                      backgroundColor: 'var(--accent-light)',
                      border: '1.5px solid #1F2937', 
                      borderRadius: '4px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem'
                    }}>
                      ⚡
                    </div>
                  </div>
                ) : (
                  /* Canvas Circular Avatar */
                  <div style={{
                    position: 'relative',
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-section)',
                    margin: '0 auto 16px auto',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem'
                  }}>
                    🎨
                  </div>
                )}
                
                <h4 style={{ fontSize: '1rem', marginBottom: '2px' }}>{member.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '2px' }}>{member.role}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{member.department}</p>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <a href="#" style={{ color: 'var(--text-secondary)' }}><Mail size={14} /></a>
                  <a href="#" style={{ color: 'var(--text-secondary)' }}><Linkedin size={14} /></a>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
