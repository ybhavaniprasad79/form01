import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import introVideo from '../assets/PixVerse_V5.6_Image_Text_360P_Video_Generation.mp4'

const INTRO_DURATION_MS = 5000

const Animation = () => {
  const [isIntroDone, setIsIntroDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), INTRO_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleRegister = () => {
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gray-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-gray-400/15 blur-3xl" />

        {!isIntroDone ? (
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="relative flex flex-col items-center gap-6">
              <div className="intro-video-container">
                <video
                  autoPlay
                  muted
                  playsInline
                  className="intro-video"
                >
                  <source src={introVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="text-center">
                <p className="text-lg uppercase tracking-[0.3em] text-gray-400">
                  Loading
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center max-w-2xl text-reveal">
              <div className="mx-auto h-48 w-48 flex items-center justify-center">
                <img
                  src="/club_logo.png"
                  alt="Club logo"
                  className="h-48 w-48 object-contain"
                />
              </div>
              <h1 className="mt-8 text-5xl font-semibold text-white">
                Creative Verse Registration
              </h1>
              <p className="mt-4 text-lg text-gray-300">
                Step into the spotlight and register your team for the big event.
              </p>
              <button
                type="button"
                onClick={handleRegister}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-gray-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-gray-900/50 transition hover:-translate-y-0.5 hover:bg-gray-600"
              >
                Register for Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Animation