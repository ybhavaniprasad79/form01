import React, { useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

export default function Gallery({ theme }) {
  const [filter, setFilter] = useState('All');
  const [activePhotoIdx, setActivePhotoIdx] = useState(null);

  const categories = ['All', 'Events', 'Workshops', 'Competitions', 'Team Outings', 'Behind the Scenes'];

  // Simulated gorgeous creative catalog
  const photos = [
    { id: 1, category: 'Events', label: 'Sunset Photowalk 2026', emoji: '🌇', rot: '-2deg', color: '#FDBA74' },
    { id: 2, category: 'Workshops', label: 'Figma Design Camp', emoji: '🎨', rot: '3deg', color: '#FFE8D6' },
    { id: 3, category: 'Competitions', label: 'Frame Winner Entry', emoji: '🏆', rot: '-1deg', color: '#FCD34D' },
    { id: 4, category: 'Team Outings', label: 'Weekend Hills Trek', emoji: '⛰️', rot: '2deg', color: '#FFF7F0' },
    { id: 5, category: 'Behind the Scenes', label: 'Core Planning Session', emoji: '📝', rot: '-3deg', color: '#FFF1E6' },
    { id: 6, category: 'Events', label: 'Film Festival Showcase', emoji: '🎬', rot: '1deg', color: '#FFE8D6' },
    { id: 7, category: 'Workshops', label: 'Videography Camera Settings', emoji: '🎥', rot: '3deg', color: '#FDBA74' },
    { id: 8, category: 'Competitions', label: 'Poster Design Entry', emoji: '🖼️', rot: '-2deg', color: '#FFF7F0' },
  ];

  const filteredPhotos = filter === 'All'
    ? photos
    : photos.filter(p => p.category === filter);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActivePhotoIdx(prev => (prev === 0 ? filteredPhotos.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActivePhotoIdx(prev => (prev === filteredPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-blue" style={{ marginBottom: '12px' }}>PORTFOLIO EXPOSURE</span>
          <h2 style={{ marginBottom: '16px' }}>Creative Gallery</h2>
          <p style={{ color: 'var(--text-secondary)' }}>A visual catalog of workshops, event memories, field outings, and design creations.</p>
        </div>

        {/* Filter Bar */}
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
                padding: '6px 14px', 
                fontSize: '0.8rem',
                borderRadius: theme === 'sketch' ? '4px' : '9999px',
                backgroundColor: filter === cat ? 'var(--primary)' : 'transparent',
                borderColor: filter === cat ? 'var(--primary)' : 'var(--border)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <div className="masonry-grid">
          {filteredPhotos.map((photo, index) => (
            <div 
              key={photo.id}
              onClick={() => setActivePhotoIdx(index)}
              style={{ cursor: 'pointer' }}
            >
              {theme === 'sketch' ? (
                /* Polaroid frame for Sunset Sketch */
                <div 
                  className="polaroid-frame" 
                  style={{ 
                    '--rot': photo.rot, 
                    display: 'block',
                    width: '100%'
                  }}
                >
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1', 
                    backgroundColor: photo.color, 
                    borderRadius: '4px',
                    border: '2px solid #1F2937',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3.5rem'
                  }}>
                    {photo.emoji}
                  </div>
                  <div className="handwritten-label" style={{ fontSize: '1.2rem', marginTop: '16px' }}>
                    {photo.label}
                  </div>
                </div>
              ) : (
                /* Sleek Canvas Image Box */
                <div className="card card-glow-hover" style={{ 
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${photo.color} 0%, var(--bg-section) 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem'
                  }}>
                    {photo.emoji}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{photo.label}</span>
                    <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>{photo.category}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredPhotos.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', marginTop: '40px' }}>No photos found in this category.</p>
        )}

      </div>

      {/* FULLSCREEN LIGHTBOX POPUP */}
      {activePhotoIdx !== null && (
        <div 
          onClick={() => setActivePhotoIdx(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '24px'
          }}
        >
          {/* Close indicator */}
          <button 
            onClick={() => setActivePhotoIdx(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              border: 'none',
              background: 'none',
              color: '#fff',
              fontSize: '2rem',
              cursor: 'pointer'
            }}
          >
            <X size={32} />
          </button>

          {/* Left Arrow */}
          <button 
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '24px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Picture Box */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              backgroundColor: '#fff', 
              padding: '16px 16px 48px 16px', 
              borderRadius: '8px', 
              maxWidth: '600px', 
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '100%',
              aspectRatio: '4/3',
              backgroundColor: filteredPhotos[activePhotoIdx].color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '6rem',
              borderRadius: '4px',
              border: '1px solid #eee'
            }}>
              {filteredPhotos[activePhotoIdx].emoji}
            </div>
            <h3 style={{ marginTop: '16px', fontSize: '1.25rem', color: '#1F2937' }}>
              {filteredPhotos[activePhotoIdx].label}
            </h3>
            <span className="badge badge-orange" style={{ marginTop: '8px' }}>
              {filteredPhotos[activePhotoIdx].category}
            </span>
          </div>

          {/* Right Arrow */}
          <button 
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '24px',
              border: 'none',
              background: 'rgba(255,255,255,0.1)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
