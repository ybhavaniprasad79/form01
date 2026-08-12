import React from 'react';
import { Megaphone, Calendar, ArrowRight } from 'lucide-react';

export default function Announcements({ announcements, theme }) {
  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="badge badge-blue" style={{ marginBottom: '12px' }}>NEWS ROOM</span>
          <h2 style={{ marginBottom: '16px' }}>Club Announcements</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Get the latest updates, recruitment calls, workshop results, and new initiatives.</p>
        </div>

        {/* Announcements List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          {announcements.map((ann, index) => (
            <div key={ann.id || index} className="card card-glow-hover" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-orange" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Megaphone size={12} />
                  <span>{ann.category || 'Announcement'}</span>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  <span>{ann.date || 'July 23, 2026'}</span>
                </span>
              </div>

              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                {ann.title}
              </h3>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '16px' }}>
                {ann.content}
              </p>
              
              {ann.actionLink && (
                <a href="#" className="btn-text" style={{ fontSize: '0.85rem' }}>
                  <span>Read More details</span>
                  <ArrowRight size={14} />
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
