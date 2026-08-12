import React, { useState } from 'react';
import { Play, Pause, Heart, Eye, ArrowLeft, ArrowRight, Award, Vote } from 'lucide-react';

export default function ReelOfTheMonth({ reels, voteForNextReel, theme, addToast }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [votedTopic, setVotedTopic] = useState(null);

  const currentReel = reels.current || {
    title: 'Golden Campus Sunset',
    creator: 'Siddharth Sen',
    month: 'July 2026',
    likes: '1.8K',
    views: '14.2K',
    description: 'A cinematic compilation of our campus during golden hour. Shot on Sony A7IV and edited in Premiere Pro.'
  };

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      addToast('Thanks for liking the reel! ❤️');
    } else {
      setLiked(false);
    }
  };

  const handleVote = (topicId) => {
    if (votedTopic) return;
    setVotedTopic(topicId);
    voteForNextReel(topicId);
    addToast('Vote registered! Thanks for participating 🗳️');
  };

  return (
    <div className="section" style={{ flex: 1 }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="badge badge-coral" style={{ marginBottom: '12px' }}>CINEMATOGRAPHY</span>
          <h2 style={{ marginBottom: '16px' }}>Reel of the Month</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Celebrating outstanding student-produced videography and editing.</p>
        </div>

        <div className="grid-2" style={{ alignItems: 'center', gap: '48px' }}>
          
          {/* LEFT: Phone Mockup Reel Player */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="reel-mockup">
              {/* Top notch */}
              <div style={{ 
                position: 'absolute', 
                top: '6px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '100px', 
                height: '18px', 
                backgroundColor: '#1F2937', 
                borderRadius: '9999px',
                zIndex: 10
              }}></div>

              {/* Video content / Canvas */}
              <div 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  cursor: 'pointer',
                  background: 'linear-gradient(220deg, #F97316 0%, #FB7185 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {/* Simulated Wave Lines in background */}
                {isPlaying && (
                  <div style={{
                    position: 'absolute',
                    top: '40%',
                    left: '-20%',
                    width: '140%',
                    height: '80%',
                    borderTop: '3px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '50%',
                    animation: 'float 3s ease-in-out infinite'
                  }}></div>
                )}

                {/* Simulated video playback cover */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#fff',
                  zIndex: 3
                }}>
                  {isPlaying ? (
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(0,0,0,0.4)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}>
                      <Pause size={28} />
                    </div>
                  ) : (
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(255,255,255,0.3)', 
                      backdropFilter: 'blur(4px)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}>
                      <Play size={28} style={{ marginLeft: '4px' }} />
                    </div>
                  )}
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {isPlaying ? 'PLAYING PREVIEW' : 'CLICK TO WATCH'}
                  </span>
                </div>

                {/* Bottom Overlay containing creator profile and description */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '24px 20px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                  color: '#fff',
                  textAlign: 'left',
                  zIndex: 4
                }}>
                  <p style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--secondary)', marginBottom: '4px' }}>
                    @{currentReel.creator}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#eee', marginBottom: '8px', lineHeight: '1.4' }}>
                    {currentReel.title} — {currentReel.month}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#ccc', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {currentReel.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Like and View counters below Phone */}
            <div style={{ 
              display: 'flex', 
              gap: '24px', 
              marginTop: '16px',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}>
              <button 
                onClick={handleLike}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  color: liked ? 'var(--accent-coral)' : 'var(--text-primary)'
                }}
              >
                <Heart size={20} fill={liked ? 'var(--accent-coral)' : 'none'} />
                <span>{liked ? '1.9K' : currentReel.likes} Likes</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Eye size={20} />
                <span>{currentReel.views} Views</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Reel Description & Voting Panel */}
          <div style={{ textAlign: 'left' }}>
            <span className="badge badge-orange" style={{ marginBottom: '12px' }}>HIGHLIGHT CREATOR</span>
            <h3 style={{ fontSize: '1.85rem', marginBottom: '16px' }}>{currentReel.title}</h3>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1.05rem' }}>
              {currentReel.description}
            </p>

            <div style={{ 
              borderLeft: theme === 'sketch' ? '3px solid #1F2937' : '3px solid var(--primary)', 
              paddingLeft: '16px', 
              marginBottom: '40px',
              fontStyle: 'italic',
              color: 'var(--text-secondary)'
            }}>
              "The golden hour light on our red brick walls was too perfect. I wanted to capture the contrast between the quiet library and the bustling student center in under 30 seconds." <br />
              <strong style={{ display: 'block', marginTop: '8px', fontStyle: 'normal', color: 'var(--text-primary)' }}>— @{currentReel.creator}</strong>
            </div>

            {/* Voting station */}
            <div className="card" style={{ background: '#FFF' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Vote size={20} style={{ color: 'var(--primary)' }} />
                <span>Vote for Next Month's Theme!</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Which topic should our videography team cover in August? Select one option below:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reels.votes?.map((opt) => (
                  <button
                    key={opt.id}
                    disabled={votedTopic !== null}
                    onClick={() => handleVote(opt.id)}
                    className="btn"
                    style={{
                      justifyContent: 'space-between',
                      borderRadius: theme === 'sketch' ? '6px' : '12px',
                      border: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--border)',
                      padding: '12px 20px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      backgroundColor: votedTopic === opt.id ? 'var(--accent-light)' : '#FFF',
                      color: 'var(--text-primary)',
                      cursor: votedTopic ? 'default' : 'pointer',
                      boxShadow: 'none'
                    }}
                  >
                    <span>{opt.topic}</span>
                    <span style={{ color: 'var(--primary)' }}>
                      {votedTopic === opt.id ? `${opt.count + 1} votes` : `${opt.count} votes`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PREVIOUS REELS ARCHIVE */}
        <div style={{ marginTop: '80px' }}>
          <h3 style={{ 
            fontSize: '1.65rem', 
            textAlign: 'left', 
            marginBottom: '28px',
            borderBottom: theme === 'sketch' ? '2px solid #1F2937' : '1px solid var(--accent-light)',
            paddingBottom: '8px'
          }}>
            Archive Reels
          </h3>

          <div className="grid-3">
            {reels.archive?.map((reel, index) => (
              <div key={index} className="card card-glow-hover" style={{ textAlign: 'left', padding: '20px' }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent-light) 100%)',
                  borderRadius: theme === 'sketch' ? '6px' : '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  border: theme === 'sketch' ? '2px solid #1F2937' : 'none'
                }}>
                  <Play size={24} style={{ color: '#fff' }} />
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{reel.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '8px' }}>
                  By @{reel.creator} • {reel.month}
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>👁️ {reel.views} Views</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
