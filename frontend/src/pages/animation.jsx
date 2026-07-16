import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Rocket, Sparkles } from 'lucide-react';

const Animation = () => {
  const [teamCount, setTeamCount] = useState(0);
  const [maxTeams, setMaxTeams] = useState(50);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamCount = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teams/count`);
        const data = await response.json();
        if (data.success) {
          setTeamCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch team count:', error);
      }
    };

    const fetchRegistrationStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registration-status`);
        const data = await response.json();
        if (data.success) {
          setRegistrationEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Failed to fetch registration status:', error);
      }
    };

    const fetchMaxTeams = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/max-teams`);
        const data = await response.json();
        if (data.success) {
          setMaxTeams(data.maxTeams);
        }
      } catch (error) {
        console.error('Failed to fetch max teams:', error);
      }
    };

    fetchTeamCount();
    fetchRegistrationStatus();
    fetchMaxTeams();
  }, []);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isClosed = teamCount >= maxTeams || !registrationEnabled;
  const progressPercent = Math.min(100, Math.max(0, (teamCount / maxTeams) * 100));

  return (
    <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-12 text-black relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* FLOATING ANIME CHARACTER STICKERS IN THE BACKGROUND */}

      {/* Luffy's Straw Hat (One Piece) - Top Left */}
      <div className="absolute top-[12%] left-[6%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-float hidden sm:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-16 h-16 rotate-[-5deg]" viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="65" rx="45" ry="12" fill="#FFD93D" stroke="black" strokeWidth="4" />
            <path d="M22 62 C22 25, 78 25, 78 62" fill="#FFD93D" stroke="black" strokeWidth="4" />
            <path d="M22 55 C30 52, 70 52, 78 55 C78 62, 22 62, 22 55 Z" fill="#FF3B30" stroke="black" strokeWidth="3" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">LUFFY</div>
        </div>
      </div>

      {/* Hidden Leaf Village Spiral (Naruto) - Top Right */}
      <div className="absolute top-[16%] right-[8%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-twinkle hidden sm:block">
        <div className="bg-white border-2 border-black p-2.5 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-12 h-12 rotate-[12deg] text-[#FF7A00]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <path d="M 45 45 C 50 35, 70 45, 60 60 C 50 70, 35 55, 45 45 C 55 35, 80 55, 75 75 L 85 85" stroke="black" strokeWidth="8" />
            <path d="M 45 45 C 50 35, 70 45, 60 60 C 50 70, 35 55, 45 45 C 55 35, 80 55, 75 75 L 85 85" />
            <polygon points="25,35 15,30 25,25" fill="#FF7A00" stroke="black" strokeWidth="2.5" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">NARUTO</div>
        </div>
      </div>

      {/* Warding Fox Mask (Demon Slayer) - Bottom Left */}
      <div className="absolute bottom-[10%] left-[8%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-twinkle hidden sm:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-14 h-14 rotate-[-10deg]" viewBox="0 0 100 100">
            <path d="M20 50 C20 15, 80 15, 80 50 C80 80, 50 95, 50 95 C50 95, 20 80, 20 50 Z" fill="white" stroke="black" strokeWidth="4" />
            <path d="M25 25 L10 5 L35 18" fill="white" stroke="black" strokeWidth="4" />
            <path d="M75 25 L90 5 L65 18" fill="white" stroke="black" strokeWidth="4" />
            <path d="M35 48 L48 48" stroke="black" strokeWidth="5" strokeLinecap="round" />
            <path d="M52 48 L65 48" stroke="black" strokeWidth="5" strokeLinecap="round" />
            <path d="M28 65 L40 58 L28 72 Z" fill="#FF3B30" stroke="black" strokeWidth="2" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">DEMON SLAYER</div>
        </div>
      </div>

      {/* Shadow Daggers / Eyes (Jinwoo) - Bottom Right */}
      <div className="absolute bottom-[15%] right-[6%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-float hidden sm:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-14 h-14 text-[#29C5F6] drop-shadow-[0_0_4px_#29C5F6]" viewBox="0 0 100 100">
            <path d="M30 80 L75 35 L80 40 L35 85 Z" fill="#333" stroke="black" strokeWidth="3" />
            <path d="M70 30 L85 15 L90 20 L75 35 Z" fill="currentColor" stroke="black" strokeWidth="2.5" />
            <path d="M70 80 L25 35 L20 40 L65 85 Z" fill="#333" stroke="black" strokeWidth="3" />
            <path d="M30 30 L15 15 L10 20 L25 35 Z" fill="currentColor" stroke="black" strokeWidth="2.5" />
            <circle cx="50" cy="30" r="5" fill="white" stroke="black" strokeWidth="1.5" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">JINWOO</div>
        </div>
      </div>

      {/* Paintbrush & Splat Sticker - Middle Left */}
      <div className="absolute top-[42%] left-[4%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-float hidden lg:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-14 h-14 text-comic-cyan" viewBox="0 0 100 100">
            <path d="M20 40 C10 30, 10 60, 30 70 C50 80, 80 70, 70 50 C60 30, 30 50, 20 40 Z" fill="currentColor" opacity="0.4" />
            <path d="M85 15 L50 50 L45 45 L80 10 Z" fill="#D1A153" stroke="black" strokeWidth="3" />
            <path d="M50 50 L40 60 L35 55 L45 45 Z" fill="#999" stroke="black" strokeWidth="2.5" />
            <path d="M40 60 C38 65, 30 75, 25 80 C32 82, 42 75, 45 65 Z" fill="#FF3B30" stroke="black" strokeWidth="2.5" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">BRUSH</div>
        </div>
      </div>

      {/* Paint Splat Sticker - Middle Right */}
      <div className="absolute top-[45%] right-[4%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-twinkle hidden lg:block">
        <div className="bg-white border-2 border-black p-2.5 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-12 h-12 text-comic-purple" viewBox="0 0 100 100">
            <path d="M50 20 C60 10, 80 15, 75 35 C70 55, 90 60, 75 75 C60 90, 45 75, 30 85 C15 70, 25 45, 35 30 C45 15, 40 30, 50 20 Z" fill="currentColor" stroke="black" strokeWidth="3" />
            <circle cx="20" cy="25" r="4" fill="currentColor" stroke="black" strokeWidth="1.5" />
            <circle cx="80" cy="20" r="5" fill="currentColor" stroke="black" strokeWidth="1.5" />
            <circle cx="85" cy="70" r="3" fill="currentColor" stroke="black" strokeWidth="1" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">SPLATTER</div>
        </div>
      </div>

      {/* Paper Airplane Sticker */}
      <div className="absolute top-[30%] left-[12%] z-0 pointer-events-none opacity-25 lg:opacity-40 animate-float hidden md:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#111] rotate-[15deg]">
          <svg className="w-12 h-12 text-sky-blue" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" fill="currentColor" />
            <path d="M22 2 11 13" />
          </svg>
          <div className="font-bangers text-[8px] tracking-wider text-black mt-1 text-center">LAUNCH</div>
        </div>
      </div>

      {/* Pencil Doodle Sticker */}
      <div className="absolute bottom-[28%] left-[16%] z-0 pointer-events-none opacity-25 lg:opacity-40 animate-twinkle hidden md:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#111] rotate-[-15deg]">
          <svg className="w-12 h-12 text-accent-yellow" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" fill="currentColor" />
          </svg>
          <div className="font-bangers text-[8px] tracking-wider text-black mt-1 text-center">CREATE</div>
        </div>
      </div>

      {/* Top-Left Cloud Decoration */}
      <div className="absolute -top-6 -left-6 z-0 opacity-40 pointer-events-none hidden lg:block">
        <svg className="w-48 h-48 text-white fill-white stroke-black" strokeWidth="3.5" viewBox="0 0 100 100">
          <path d="M10 80 Q10 40 40 40 Q50 30 70 40 Q90 40 90 70 Q90 85 75 90 L10 90 Z" />
        </svg>
      </div>

      {/* Bottom-Right Cloud Decoration */}
      <div className="absolute -bottom-6 -right-6 z-0 opacity-40 pointer-events-none hidden lg:block">
        <svg className="w-48 h-48 text-white fill-white stroke-black" strokeWidth="3.5" viewBox="0 0 100 100">
          <path d="M10 80 Q10 40 40 40 Q50 30 70 40 Q90 40 90 70 Q90 85 75 90 L10 90 Z" transform="scale(-1, 1) translate(-100, 0)" />
        </svg>
      </div>

      {/* Hero Section */}
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8 relative z-10 overflow-hidden">

        {/* Subtle decorative Sparkles */}
        <div className="absolute top-10 left-10 text-comic-yellow animate-twinkle pointer-events-none opacity-50">
          <Sparkles size={32} />
        </div>
        <div className="absolute bottom-20 right-10 text-comic-orange animate-twinkle pointer-events-none opacity-50">
          <Sparkles size={32} />
        </div>

        {/* Clean Comic Card Wrapper */}
        <div className="max-w-3xl w-full bg-white border-3 border-black rounded-3xl p-6 md:p-8 shadow-[6px_6px_0_#111] relative bg-halftone-dots-white my-4 text-center">

          {/* Issue headers */}
          <div className="absolute top-0 left-0 bg-comic-yellow border-b-3 border-r-3 border-black px-4 py-1 text-black font-bangers text-xs rounded-tl-2xl">
            ISSUE #01
          </div>
          <div className="absolute top-0 right-0 bg-coral-orange border-b-3 border-l-3 border-black px-4 py-1 text-white font-bangers text-xs rounded-tr-2xl">
            VOL. 2026
          </div>

          <div className="flex flex-col items-center mt-6">

            {/* Clean Logo Panel */}
            <div className="relative mb-6 w-full max-w-lg">
              <div className="bg-comic-yellow border-3 border-black px-6 py-4 rounded-2xl shadow-[4px_4px_0_#111]">
                <h1 className="font-luckiest text-4xl md:text-6xl text-black tracking-tight leading-none comic-title-shadow select-text">
                  CANVAS CRAFT
                </h1>
                <p className="font-bangers text-xl md:text-2xl text-coral-orange tracking-widest mt-1.5 uppercase">
                  Hack. Create. Innovate.
                </p>
              </div>
            </div>

            {/* Club Logo */}
            <motion.div
              className="relative w-36 h-36 bg-gray-50 border-3 border-black rounded-2xl shadow-[4px_4px_0_#111] flex items-center justify-center p-4 mb-6"
              whileHover={{ scale: 1.03 }}
            >
              <img
                src="/club_logo.png"
                alt="Club Logo"
                className="w-full h-full object-contain"
              />
            </motion.div>

            {/* Event Status Speech Bubble */}
            <div className="mb-8 max-w-md w-full">
              <div className="speech-bubble speech-bubble-bottom p-4 shadow-[3px_3px_0_#111]">
                <p className="font-bangers text-xl text-black tracking-wider">
                  {!registrationEnabled ? (
                    <span className="text-comic-orange">⚡ POW! REGISTRATION CLOSED</span>
                  ) : teamCount >= maxTeams ? (
                    <span className="text-coral-orange">⚡ BAM! SLOTS ARE FULL</span>
                  ) : (
                    <span className="text-comic-green">🔥 BOOM! REGISTRATIONS ARE OPEN!</span>
                  )}
                </p>
                <p className="text-xs font-comic text-gray-700 mt-1 font-semibold leading-relaxed">
                  {!registrationEnabled
                    ? "The mission board is temporarily disabled. Check back soon!"
                    : teamCount >= maxTeams
                      ? "All superhero slots have been claimed!"
                      : "Form your alliance and claim your mission folder today."}
                </p>
              </div>
            </div>

            {/* MISSION PROGRESS */}
            <div className="w-full max-w-md bg-gray-50 border-3 border-black rounded-2xl p-4 mb-8 shadow-[3px_3px_0_#111]">
              <h3 className="font-bangers text-lg text-black text-left mb-2.5 flex items-center gap-1.5">
                🚀 MISSION PROGRESS
              </h3>

              {/* Progress Track */}
              <div className="w-full bg-white border-3 border-black h-8 rounded-full relative overflow-visible flex items-center">
                <div
                  className="bg-comic-cyan h-full rounded-full border-r-3 border-black transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />

                {/* Float Rocket Icon */}
                <div
                  className="absolute transition-all duration-700"
                  style={{
                    left: `calc(${progressPercent}% - 12px)`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="bg-comic-yellow border-2 border-black p-1 rounded-full shadow-[1px_1px_0_#111] rotate-90 inline-block"
                  >
                    <Rocket className="w-4.5 h-4.5 text-coral-orange stroke-[2.5]" />
                  </motion.div>
                </div>
              </div>

              {/* Counts footer */}
              <div className="flex justify-between items-center mt-2.5 font-bangers text-xs md:text-sm">
                <span className="bg-comic-purple text-white border-2 border-black rounded-lg px-2 py-0.5 shadow-[1.5px_1.5px_0_#111]">
                  {teamCount} TEAMS LOGGED
                </span>
                <span className="bg-comic-lime text-black border-2 border-black rounded-lg px-2 py-0.5 shadow-[1.5px_1.5px_0_#111]">
                  CAPACITY: {maxTeams} TEAMS
                </span>
              </div>
            </div>

            {/* Action buttons styled as stickers */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate('/home')}
                disabled={isClosed}
                className={`font-luckiest text-xl text-white px-8 py-3.5 border-3 border-black rounded-2xl shadow-[4px_4px_0_#111] transition-all ${isClosed
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-bright-orange hover:bg-coral-orange cursor-pointer'
                  }`}
              >
                REGISTER NOW
              </motion.button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Animation;