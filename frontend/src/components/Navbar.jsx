import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-3 border-black px-4 py-3 md:px-8 shadow-[0_4px_0_#111] select-none overflow-visible">
      
      {/* Creative Striped Comic Border at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stripes-comic border-t border-black"></div>

      <div className="max-w-7xl mx-auto flex items-center justify-between relative pb-1">
        
        {/* Left: Creative Comic Logo with 3D Offset & Tilt */}
        <Link to="/" className="group flex items-center relative">
          
          {/* Red 3D offset background layer */}
          <div className="absolute -inset-1.5 bg-comic-red border-3 border-black rounded-2xl transform -rotate-1.5 group-hover:rotate-1.5 transition-transform duration-200"></div>
          
          {/* Main Yellow Logo Card */}
          <div className="relative bg-comic-yellow border-3 border-black px-4 py-1.5 rounded-2xl shadow-[3px_3px_0_#111] text-center transform group-hover:scale-102 transition-transform flex items-center gap-2">
            <span className="text-lg leading-none">🎨</span>
            <div>
              <span className="font-luckiest text-xl md:text-2xl text-black tracking-wider block leading-none">
                CAMPUS CREATIVE
              </span>
              <span className="font-bangers text-[9px] text-comic-red tracking-widest block mt-0.5 leading-none">
                HACK • CREATE • INNOVATE
              </span>
            </div>
            <span className="text-lg leading-none animate-pulse">✨</span>
          </div>

        </Link>

        {/* Right: Rounded Navigation Buttons (Public safe routes only) */}
        <div className="flex items-center gap-2.5 font-luckiest text-xs md:text-sm">
          <Link 
            to="/" 
            className={`border-3 border-black px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0_#111] hover:scale-102 transition-all ${
              currentPath === "/" 
                ? "bg-bright-orange text-white" 
                : "bg-white text-black hover:bg-light-gray"
            }`}
          >
            HOME
          </Link>
          <Link 
            to="/home" 
            className={`border-3 border-black px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0_#111] hover:scale-102 transition-all ${
              currentPath === "/home" 
                ? "bg-bright-orange text-white" 
                : "bg-white text-black hover:bg-light-gray"
            }`}
          >
            REGISTER
          </Link>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
