import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b-3 border-black px-4 py-3 md:px-8 shadow-[0_4px_0_#000] select-none overflow-visible">
      
      {/* Creative Striped Comic Border at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-stripes-comic border-t-3 border-black"></div>

      <div className="max-w-7xl mx-auto flex items-center justify-center relative pb-2.5">
        
        {/* Floating Paint Palette Sticker (Canvas Theme) */}
        <div className="absolute left-[10%] md:left-[25%] top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none">
          <div className="relative bg-white border-2 border-black p-2 rounded-xl shadow-[2px_2px_0_#000] rotate-[-10deg] animate-float flex items-center gap-1">
            <svg className="w-6 h-6 text-comic-orange" viewBox="0 0 24 24" fill="currentColor" stroke="black" strokeWidth="2">
              <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8z" />
            </svg>
            <span className="font-bangers text-[9px] tracking-wide text-black">ART</span>
          </div>
        </div>

        {/* Floating 4-Point Star Sticker (Anime Theme) */}
        <div className="absolute right-[10%] md:right-[25%] top-1/2 -translate-y-1/2 hidden sm:block pointer-events-none">
          <div className="relative bg-white border-2 border-black p-2 rounded-xl shadow-[2px_2px_0_#000] rotate-[12deg] animate-twinkle flex items-center gap-1">
            <svg className="w-6 h-6 text-comic-yellow" viewBox="0 0 24 24" fill="currentColor" stroke="black" strokeWidth="2">
              <path d="M12 2c0 5.523 4.477 10 10 10-5.523 0-10 4.477-10 10 0-5.523-4.477-10-10-10 5.523 0 10-4.477 10-10z" />
            </svg>
            <span className="font-bangers text-[9px] tracking-wide text-black">ANIME</span>
          </div>
        </div>

        {/* Creative Comic Logo with 3D Offset & Tilt */}
        <Link to="/" className="group flex items-center relative">
          
          {/* Red 3D offset background layer */}
          <div className="absolute -inset-1.5 bg-comic-red border-3 border-black rounded-2xl transform -rotate-1.5 group-hover:rotate-1.5 transition-transform duration-200"></div>
          
          {/* Main Yellow Logo Card */}
          <div className="relative bg-comic-yellow border-3 border-black px-6 py-2 rounded-2xl shadow-[3px_3px_0_#000] text-center transform group-hover:scale-102 transition-transform flex items-center gap-2">
            
            {/* Embedded Palette Brush Icon */}
            <span className="text-xl md:text-2xl leading-none">🎨</span>

            <div>
              <span className="font-luckiest text-2xl md:text-3xl text-black tracking-wider block leading-none">
                CANVAS CRAFT
              </span>
              <span className="font-bangers text-[10px] text-comic-red tracking-widest block mt-0.5 leading-none">
                HACK • CREATE • INNOVATE
              </span>
            </div>

            {/* Embedded Anime Sparkle Icon */}
            <span className="text-xl md:text-2xl leading-none animate-pulse">✨</span>

          </div>

          {/* BAM! Speech bubble next to title */}
          <div className="absolute -top-4 -right-9 bg-white border-2 border-black text-black font-bangers text-[8px] px-1.5 py-0.25 rounded-md shadow-[1.5px_1.5px_0_#000] rotate-12 scale-0 group-hover:scale-100 transition-transform origin-bottom-left duration-200 pointer-events-none">
            POW!
          </div>

        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
