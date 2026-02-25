import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import introVideo from '../assets/PixVerse_V5.6_Image_Text_360P_Video_Generation.mp4'

const INTRO_DURATION_MS = 5000

const Animation = () => {
  const [isIntroDone, setIsIntroDone] = useState(false)
  const [teamCount, setTeamCount] = useState(0)
  const [maxTeams] = useState(50)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), INTRO_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchTeamCount = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/teams/count')
        const data = await response.json()
        if (data.success) {
          setTeamCount(data.count)
        }
      } catch (error) {
        console.error('Failed to fetch team count:', error)
      }
    }

    fetchTeamCount()
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
              
              {/* Registration Progress Bar */}
              <div className="mt-6 w-full max-w-md mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-400">Teams Registered</span>
                  <span className="text-sm font-semibold text-white">{teamCount} / {maxTeams}</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden border border-gray-600/50">
                  <div 
                    className="progress-bar-fill h-full rounded-full transition-all duration-500"
                    style={{ width: `${(teamCount / maxTeams) * 100}%` }}
                  />
                </div>
                {teamCount >= maxTeams && (
                  <p className="mt-2 text-sm text-red-400 font-medium text-center">
                    Registration is now closed
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={teamCount >= maxTeams}
                className={`mt-8 inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold text-white shadow-lg shadow-gray-900/50 transition ${
                  teamCount >= maxTeams
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gray-700 hover:-translate-y-0.5 hover:bg-gray-600'
                }`}
              >
                {teamCount >= maxTeams ? 'Registration Closed' : 'Register for Event'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Animation