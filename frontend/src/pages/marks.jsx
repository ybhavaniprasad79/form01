import React, { useEffect, useState, useRef } from 'react'

function Marks() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [authenticating, setAuthenticating] = useState(false)
  const [authError, setAuthError] = useState('')
  const [teams, setTeams] = useState([])
  const [rounds, setRounds] = useState([])
  const [outOfByRound, setOutOfByRound] = useState({})
  const [selectedRound, setSelectedRound] = useState('')
  const [newRound, setNewRound] = useState('')
  const [newRoundOutOf, setNewRoundOutOf] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRound, setEditingRound] = useState('')
  const [editRoundName, setEditRoundName] = useState('')
  const [editRoundOutOf, setEditRoundOutOf] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const updateTimeoutRef = useRef(null)

  const handleLogout = () => {
    setIsAuthenticated(false)
    setAdminPassword('')
    setAuthError('')
  }

  const handlePasswordSubmit = async () => {
    if (!adminPassword.trim()) {
      setAuthError('Please enter password')
      return
    }

    setAuthenticating(true)
    setAuthError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminPassword })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid password')
      }

      setIsAuthenticated(true)
      setLoading(true)
      setAdminPassword('')
    } catch (err) {
      setAuthError(err.message || 'Authentication failed')
    } finally {
      setAuthenticating(false)
    }
  }

  const fetchMarksBoard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks-board`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch marks board')
      }

      const availableRounds = data.rounds || []
      setRounds(availableRounds)
      setOutOfByRound(data.outOfByRound || {})
      setTeams(data.data || [])
      setSelectedRound((prev) => {
        if (prev && availableRounds.includes(prev)) {
          return prev
        }
        return availableRounds[0] || ''
      })
    } catch (err) {
      setError(err.message || 'Unable to load marks board')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchMarksBoard()
    }
  }, [isAuthenticated])

  const handleCreateRound = async () => {
    if (!newRound.trim()) {
      setError('Please enter a round name')
      return
    }

    const numericOutOf = Number(newRoundOutOf)
    if (!Number.isFinite(numericOutOf) || numericOutOf < 1) {
      setError('Please enter valid out of marks (minimum 1)')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks/round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roundName: newRound.trim(), outOf: numericOutOf })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create round')
      }

      const createdRound = data.round
      const createdRoundOutOf = Number(data.outOf) || numericOutOf
      setRounds((prev) => [...prev, createdRound])
      setOutOfByRound((prev) => ({
        ...prev,
        [createdRound]: createdRoundOutOf
      }))
      setSelectedRound(createdRound)
      setTeams((prev) =>
        prev.map((team) => ({
          ...team,
          roundMarks: {
            ...(team.roundMarks || {}),
            [createdRound]: 0
          },
          total: team.total || 0
        }))
      )
      setNewRound('')
      setNewRoundOutOf('')
      setMessage('Round created successfully')
      setTimeout(() => setMessage(''), 2000)
      setShowModal(false)
    } catch (err) {
      setError(err.message || 'Unable to create round')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleEditRound = async () => {
    if (!editRoundName.trim()) {
      setError('Please enter a round name')
      return
    }

    const numericOutOf = Number(editRoundOutOf)
    if (!Number.isFinite(numericOutOf) || numericOutOf < 1) {
      setError('Please enter valid out of marks (minimum 1)')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks/round`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          oldRoundName: editingRound, 
          newRoundName: editRoundName.trim(), 
          outOf: numericOutOf 
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update round')
      }

      // Update rounds list
      setRounds((prev) => prev.map(r => r === editingRound ? editRoundName.trim() : r))
      
      // Update outOfByRound
      setOutOfByRound((prev) => {
        const updated = { ...prev }
        if (editingRound !== editRoundName.trim()) {
          delete updated[editingRound]
        }
        updated[editRoundName.trim()] = numericOutOf
        return updated
      })

      // Update teams with new round name
      setTeams((prev) =>
        prev.map((team) => {
          if (editingRound !== editRoundName.trim()) {
            const updatedRoundMarks = { ...team.roundMarks }
            if (updatedRoundMarks[editingRound] !== undefined) {
              updatedRoundMarks[editRoundName.trim()] = updatedRoundMarks[editingRound]
              delete updatedRoundMarks[editingRound]
            }
            return {
              ...team,
              roundMarks: updatedRoundMarks
            }
          }
          return team
        })
      )

      // Update selected round if it was the one being edited
      if (selectedRound === editingRound) {
        setSelectedRound(editRoundName.trim())
      }

      setMessage('Round updated successfully')
      setTimeout(() => setMessage(''), 2000)
      setShowEditModal(false)
      setEditingRound('')
      setEditRoundName('')
      setEditRoundOutOf('')
    } catch (err) {
      setError(err.message || 'Unable to update round')
      setTimeout(() => setError(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleMarkChange = (teamName, roundName, value) => {
    const mark = value === '' ? 0 : Number(value)
    if (!Number.isFinite(mark)) {
      return
    }

    const roundOutOf = Number(outOfByRound?.[roundName])
    const maxMark = Number.isFinite(roundOutOf) && roundOutOf > 0 ? roundOutOf : Infinity
    const normalizedMark = Math.max(0, Math.min(mark, maxMark))

    // Update local state immediately for instant UI feedback
    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamName === teamName) {
          const updatedRoundMarks = {
            ...team.roundMarks,
            [roundName]: normalizedMark
          }
          const total = Object.values(updatedRoundMarks).reduce((sum, val) => sum + val, 0)
          return {
            ...team,
            roundMarks: updatedRoundMarks,
            total
          }
        }
        return team
      })
    )

    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    // Set new timeout to update database after 5 seconds
    updateTimeoutRef.current = setTimeout(async () => {
      setSaving(true)
      setError('')

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ teamName, roundName, mark: normalizedMark })
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to update mark')
        }
      } catch (err) {
        setError(err.message || 'Unable to update mark')
        setTimeout(() => setError(''), 3000)
      } finally {
        setSaving(false)
      }
    }, 3000)
  }

  const selectedRoundOutOf = Number(outOfByRound?.[selectedRound])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-gray-800/80 border border-gray-700/50 rounded-xl shadow-2xl p-6">
          <h2 className="text-white text-2xl font-bold mb-2 text-center">Admin Access</h2>
          <p className="text-gray-400 text-sm text-center mb-5">Enter password to open this page</p>
          {authError && (
            <div className="bg-red-500/90 text-white px-4 py-3 rounded-lg mb-4 font-semibold shadow-md border border-red-600/50 text-sm">
              {authError}
            </div>
          )}
          <input
            type='password'
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder='Enter admin password'
            className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-600/50 text-white rounded-lg outline-none transition-colors focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !authenticating) {
                handlePasswordSubmit()
              }
            }}
          />
          <button
            onClick={handlePasswordSubmit}
            disabled={authenticating}
            className={`w-full mt-4 px-6 py-3 text-base font-semibold text-white rounded-lg transition-all shadow-lg ${
              authenticating
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-600/80 hover:bg-green-600'
            }`}
          >
            {authenticating ? 'Verifying...' : 'Open Marks Page'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white text-xl font-medium">
        <p>Loading marks board...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-5xl font-bold mb-2">
              Team Marks System
            </h1>
            <p className="text-gray-300 text-base">
              Manage rounds and track team performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-6 py-3 text-base font-semibold text-white bg-gray-700/80 hover:bg-gray-600 rounded-lg transition-all shadow-lg"
            >
              Logout
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 text-base font-semibold text-white bg-green-600/80 hover:bg-green-600 rounded-lg transition-all shadow-lg"
            >
              + Create Round
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/90 text-white px-5 py-4 rounded-lg mb-5 font-semibold shadow-md border border-red-600/50">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-500/90 text-white px-5 py-4 rounded-lg mb-5 font-semibold shadow-md border border-green-600/50">
            {message}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-xl font-semibold">Create New Round</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type='text'
                  value={newRound}
                  onChange={(e) => setNewRound(e.target.value)}
                  placeholder='Enter round name (e.g., Round 1, Semi Finals)'
                  className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-600/50 text-white rounded-lg outline-none transition-colors focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !saving) {
                      handleCreateRound()
                    }
                  }}
                />
                <input
                  type='number'
                  min='1'
                  value={newRoundOutOf}
                  onChange={(e) => setNewRoundOutOf(e.target.value)}
                  placeholder='Out of marks (e.g., 10, 20, 50)'
                  className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-600/50 text-white rounded-lg outline-none transition-colors focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 text-base font-semibold text-gray-300 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateRound} 
                    disabled={saving}
                    className={`flex-1 px-6 py-3 text-base font-semibold text-white rounded-lg transition-all shadow-lg ${
                      saving 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-green-600/80 hover:bg-green-600 cursor-pointer'
                    }`}
                  >
                    {saving ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-xl font-semibold">Edit Round</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type='text'
                  value={editRoundName}
                  onChange={(e) => setEditRoundName(e.target.value)}
                  placeholder='Enter round name (e.g., Round 1, Semi Finals)'
                  className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-600/50 text-white rounded-lg outline-none transition-colors focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !saving) {
                      handleEditRound()
                    }
                  }}
                />
                <input
                  type='number'
                  min='1'
                  value={editRoundOutOf}
                  onChange={(e) => setEditRoundOutOf(e.target.value)}
                  placeholder='Out of marks (e.g., 10, 20, 50)'
                  className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-600/50 text-white rounded-lg outline-none transition-colors focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 text-base font-semibold text-gray-300 bg-gray-700/80 hover:bg-gray-600 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEditRound} 
                    disabled={saving}
                    className={`flex-1 px-6 py-3 text-base font-semibold text-white rounded-lg transition-all shadow-lg ${
                      saving 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600/80 hover:bg-blue-600 cursor-pointer'
                    }`}
                  >
                    {saving ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 p-6 bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50">
          <h3 className="text-white text-xl font-semibold mb-4 mt-0">
            Select Round
          </h3>
          {rounds.length === 0 ? (
            <p className="text-gray-400 text-base italic m-0">
              No rounds yet. Create a round to start entering marks.
            </p>
          ) : (
            <div className="flex gap-3 flex-wrap">
              {rounds.map((round) => {
                const isSelected = selectedRound === round
                return (
                  <div key={round} className="flex gap-2 items-center">
                    <button
                      onClick={() => setSelectedRound(round)}
                      className={`px-6 py-3 text-base rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-green-600/80 text-white border border-green-600/50 font-semibold shadow-lg'
                          : 'bg-gray-700/80 text-gray-300 border border-gray-600/50 font-medium hover:bg-gray-600'
                      }`}
                    >
                      {round}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRound(round)
                        setEditRoundName(round)
                        setEditRoundOutOf(String(outOfByRound[round] || ''))
                        setShowEditModal(true)
                      }}
                      className="px-3 py-3 text-base rounded-lg bg-blue-600/80 text-white border border-blue-600/50 hover:bg-blue-600 transition-all shadow-lg"
                      title="Edit round"
                    >
                      ✏️
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {teams.length === 0 ? (
          <div className="p-10 bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 text-center text-gray-400 text-base">
            No teams found. Teams need to register first.
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams by name..."
                className="w-full px-4 py-3 text-base bg-gray-900/70 border border-gray-600/50 text-white rounded-lg outline-none transition-colors focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-500"
              />
            </div>

            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-base">
                  <thead>
                    <tr className="bg-gray-700/80">
                      <th className="px-5 py-4 text-left font-semibold text-base text-white border-b border-gray-600/50">
                        Team Name
                      </th>
                      <th className="px-5 py-4 text-center font-semibold text-base text-white border-b border-gray-600/50">
                        {selectedRound
                          ? `${selectedRound} (Out of ${Number.isFinite(selectedRoundOutOf) ? selectedRoundOutOf : '-'})`
                          : 'Select a round'}
                      </th>
                      <th className="px-5 py-4 text-center font-semibold text-base text-white border-b border-gray-600/50">
                        Total Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams
                      .filter((team) => 
                        team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((team, index) => {
                        const roundValue = selectedRound ? team.roundMarks?.[selectedRound] ?? 0 : 0
                        return (
                          <tr 
                            key={team._id}
                            className={`transition-colors hover:bg-gray-700/50 ${
                              index % 2 === 0 ? 'bg-gray-800/40' : 'bg-transparent'
                            }`}
                          >
                            <td className="px-5 py-4 border-b border-gray-700/50 text-gray-200 font-medium">
                              {team.teamName}
                            </td>
                            <td className="px-5 py-4 border-b border-gray-700/50 text-center">
                              {selectedRound ? (
                                <div className="inline-flex py-2 px-3 bg-gray-800/70 border border-gray-600/50 rounded-lg">
                                  <div className="flex justify-between items-center gap-x-3">
                                    <div className="grow">
                                      <input 
                                        className="w-16 p-0 bg-transparent border-0 text-center text-white text-base font-medium placeholder:text-gray-500 focus:ring-0 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                                        style={{MozAppearance: 'textfield'}}
                                        type="number" 
                                        value={roundValue}
                                        onChange={(e) => handleMarkChange(team.teamName, selectedRound, e.target.value)}
                                        disabled={saving}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-lg">-</span>
                              )}
                            </td>
                            <td className="px-5 py-4 border-b border-gray-700/50 text-center font-bold text-lg text-green-400">
                              {team.total ?? 0}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
                {teams.filter((team) => team.teamName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    No teams match your search "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Marks