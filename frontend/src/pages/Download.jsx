import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Check, RefreshCw, Eye } from 'lucide-react';

const Download = () => {
  const [tab, setTab] = useState('download'); // 'download' or 'status'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Download states
  const [downloadPassword, setDownloadPassword] = useState('');

  // Payment status states
  const [statusPassword, setStatusPassword] = useState('');
  const [allPayments, setAllPayments] = useState(null);
  const [statusEdits, setStatusEdits] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [statusGatePassword, setStatusGatePassword] = useState('');
  const [isStatusAuthorized, setIsStatusAuthorized] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [maxTeams, setMaxTeams] = useState(50);
  const [maxTeamsInput, setMaxTeamsInput] = useState('');
  const [modalImage, setModalImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (!downloadPassword) {
      setError('Please enter password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/download-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: downloadPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to download data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team_registrations_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('File downloaded successfully!');
      setDownloadPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred while downloading the file');
      console.error('Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPayments = async () => {
    if (!statusPassword) {
      setError('Please enter admin password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/all-payments?password=${statusPassword}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payments');
      }

      setAllPayments(data);
      setStatusEdits((prev) => {
        const next = { ...prev };
        data.data.forEach((team) => {
          if (!next[team.payment.transactionId]) {
            next[team.payment.transactionId] = team.payment.status;
          }
        });
        return next;
      });
      setSuccess('Payments refreshed');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Fetch payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockStatusTools = async (e) => {
    e.preventDefault();

    if (!statusGatePassword) {
      setError('Please enter admin password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/all-payments?password=${statusGatePassword}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid admin password');
      }

      setIsStatusAuthorized(true);
      setStatusPassword(statusGatePassword);
      setStatusGatePassword('');
      setAllPayments(data);
      const nextEdits = {};
      data.data.forEach((team) => {
        nextEdits[team.payment.transactionId] = team.payment.status;
      });
      setStatusEdits(nextEdits);
      setSuccess('Access granted');
      
      fetchRegistrationStatus();
      fetchMaxTeams();
    } catch (err) {
      setError(err.message || 'Invalid admin password');
      console.error('Unlock status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectUpdateStatus = async (transactionId, status) => {
    if (!statusPassword) {
      setError('Please enter admin password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/verify-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: statusPassword,
            transactionId: transactionId,
            status
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update payment status');
      }

      setStatusEdits(prev => ({ ...prev, [transactionId]: status }));

      setAllPayments((prev) => {
        if (!prev) return prev;
        const updated = prev.data.map((team) => {
          if (team.payment.transactionId === transactionId) {
            return {
              ...team,
              payment: {
                ...team.payment,
                status
              }
            };
          }
          return team;
        });

        const statusCounts = {
          pending: updated.filter(t => t.payment.status === 'pending').length,
          verified: updated.filter(t => t.payment.status === 'verified').length,
          rejected: updated.filter(t => t.payment.status === 'rejected').length
        };

        return { ...prev, data: updated, statusCounts };
      });

      setSuccess(`Payment status updated to ${status}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Status change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registration-status`);
      const data = await response.json();
      if (data.success) {
        setRegistrationEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Failed to fetch registration status:', err);
    }
  };

  const fetchMaxTeams = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/max-teams`);
      const data = await response.json();
      if (data.success) {
        setMaxTeams(data.maxTeams);
        setMaxTeamsInput(data.maxTeams.toString());
      }
    } catch (err) {
      console.error('Failed to fetch max teams:', err);
    }
  };

  const handleUpdateMaxTeams = async () => {
    if (!statusPassword) {
      setError('Please enter admin password');
      return;
    }

    const newMaxTeams = parseInt(maxTeamsInput);
    if (isNaN(newMaxTeams) || newMaxTeams < 1) {
      setError('Max teams must be a positive number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/update-max-teams`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: statusPassword,
            maxTeams: newMaxTeams
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update max teams');
      }

      setMaxTeams(newMaxTeams);
      setSuccess(`Maximum teams updated to ${newMaxTeams}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Update max teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!statusPassword) {
      setError('Please enter admin password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/toggle-registration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: statusPassword,
            enabled: !registrationEnabled
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle registration');
      }

      setRegistrationEnabled(data.enabled);
      setSuccess(`Registration ${data.enabled ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Toggle registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBubbleStyle = (status) => {
    switch(status) {
      case 'verified':
        return 'bg-comic-green text-black border-2 border-black';
      case 'rejected':
        return 'bg-comic-red text-white border-2 border-black';
      case 'pending':
        return 'bg-comic-yellow text-black border-2 border-black';
      default:
        return 'bg-white text-black border-2 border-black';
    }
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setModalImage(null);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-16 text-black">
      <Navbar />
      {/* Image Modal */}
      <AnimatePresence>
        {isModalOpen && modalImage && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-xl w-full bg-white border-3 border-black p-5 rounded-2xl shadow-[6px_6px_0_#000] text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-3.5 left-6 bg-comic-yellow border-2 border-black text-black font-bangers text-[10px] px-2.5 py-0.5 rounded shadow-[1.5px_1.5px_0_#000]">
                RECEIPT PROOF
              </div>
              <button
                onClick={closeImageModal}
                className="absolute -top-3.5 right-4 bg-comic-red text-white border-2 border-black font-bangers text-[10px] px-3 py-0.5 rounded shadow-[1.5px_1.5px_0_#000] cursor-pointer"
              >
                ✕ CLOSE
              </button>
              <div className="border-3 border-black rounded-xl overflow-hidden mt-4 bg-gray-50">
                <img
                  src={modalImage}
                  alt="Receipt full view"
                  className="max-w-full max-h-[60vh] object-contain mx-auto"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto w-full px-4 mt-8 flex-grow">
        
        {/* Simple Page Header */}
        <div className="relative mb-8 text-center">
          <div className="bg-white border-3 border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0_#000] inline-block">
            <h2 className="font-luckiest text-2xl md:text-4xl text-black tracking-wide leading-none">
              MISSION CONTROL CENTER
            </h2>
            <p className="font-bangers text-sm text-comic-red tracking-widest mt-1 uppercase">
              ADMIN DEPLOYMENT COMMAND
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 bg-comic-red border-3 border-black rounded-2xl p-4 text-white font-bangers text-base shadow-[3px_3px_0_#000]"
            >
              💥 OOPS! {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Success Banner */}
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 bg-comic-lime border-3 border-black rounded-2xl p-4 text-black font-bangers text-base shadow-[3px_3px_0_#000]"
            >
              🔥 NICE! {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-3 mb-6 font-luckiest text-base">
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => {
              setTab('download');
              setError('');
              setSuccess('');
            }}
            className={`px-5 py-2.5 border-3 border-black rounded-xl shadow-[3px_3px_0_#000] cursor-pointer transition-all ${
              tab === 'download' ? 'bg-comic-yellow text-black' : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            📥 DOWNLOAD DATA
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => {
              setTab('status');
              setError('');
              setSuccess('');
            }}
            className={`px-5 py-2.5 border-3 border-black rounded-xl shadow-[3px_3px_0_#000] cursor-pointer transition-all ${
              tab === 'status' ? 'bg-comic-yellow text-black' : 'bg-white text-black hover:bg-gray-50'
            }`}
          >
            💳 VERIFY DEPOSITS
          </motion.button>
        </div>

        {/* ----------------- DOWNLOAD TAB ----------------- */}
        {tab === 'download' && (
          <div className="bg-white border-3 border-black rounded-2xl p-6 md:p-8 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-center">
            <div className="absolute top-0 right-0 bg-comic-red border-b-3 border-l-3 border-black px-4 py-1 text-white font-bangers text-xs rounded-tr-2xl">
              XLSX Teleport
            </div>

            <div className="text-center mb-6 mt-2">
              <h2 className="text-2xl font-luckiest text-black mb-1">
                TELEPORT MISSION RECORDS
              </h2>
              <p className="text-xs font-semibold text-gray-700">
                Verify authentication credentials to download registrations.
              </p>
            </div>

            <form onSubmit={handleDownload} className="space-y-4 max-w-sm mx-auto text-left">
              <div>
                <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                  SECRET ACCESS KEY
                </label>
                <input
                  type="password"
                  value={downloadPassword}
                  onChange={(e) => setDownloadPassword(e.target.value)}
                  className="w-full h-11 comic-input bg-gray-50 text-black border-3 border-black rounded-lg px-4 focus:bg-comic-yellow/10"
                  placeholder="Enter access key"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-comic-red hover:bg-[#ff251c] text-white border-3 border-black rounded-xl font-luckiest text-lg shadow-[3px_3px_0_#000] cursor-pointer flex items-center justify-center"
              >
                {loading ? 'DOWNLOADING...' : 'DOWNLOAD EXCEL'}
              </motion.button>
            </form>
          </div>
        )}

        {/* ----------------- SECURITY ACCREDITATION GATE ----------------- */}
        {tab === 'status' && !isStatusAuthorized && (
          <div className="bg-white border-3 border-black rounded-2xl p-6 md:p-8 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-center">
            <div className="absolute top-0 right-0 bg-comic-red border-b-3 border-l-3 border-black px-4 py-1 text-white font-bangers text-xs rounded-tr-2xl">
              RESTRICTED VAULT
            </div>

            <div className="text-center mb-6 mt-2">
              <h2 className="text-2xl font-luckiest text-black mb-1">
                SECURITY ACCESS Cleared Only
              </h2>
              <p className="text-xs font-semibold text-gray-700">
                Submit admin passcode to manage active verification lists.
              </p>
            </div>

            <form onSubmit={handleUnlockStatusTools} className="space-y-4 max-w-sm mx-auto text-left">
              <div>
                <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                  SECRET ACCESS KEY
                </label>
                <input
                  type="password"
                  value={statusGatePassword}
                  onChange={(e) => setStatusGatePassword(e.target.value)}
                  className="w-full h-11 comic-input bg-gray-50 text-black border-3 border-black rounded-lg px-4 focus:bg-comic-yellow/10"
                  placeholder="Enter access key"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-comic-red hover:bg-[#ff251c] text-white border-3 border-black rounded-xl font-luckiest text-lg shadow-[3px_3px_0_#000] cursor-pointer"
              >
                {loading ? 'UNLOCKING...' : 'ACCESS STATUS CONTROL'}
              </motion.button>
            </form>
          </div>
        )}

        {/* ----------------- VERIFICATION COMMAND STATION ----------------- */}
        {tab === 'status' && isStatusAuthorized && (
          <div className="space-y-6">
            
            {/* System controls widget */}
            <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-left">
              <div className="absolute top-0 right-0 bg-comic-cyan border-b-3 border-l-3 border-black px-4 py-0.5 text-black font-bangers text-[10px] rounded-tr-2xl">
                CONTROLS
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="space-y-0.5">
                  <h3 className="text-xl font-luckiest text-black">MISSION GATE PORTALS</h3>
                  <p className="text-xs font-semibold text-gray-700 leading-none">Open or shut registration portals and caps.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-3 py-1.5 border-2 border-black rounded-lg font-luckiest text-sm shadow-[1.5px_1.5px_0_#000] ${
                    registrationEnabled ? 'bg-comic-green text-black' : 'bg-comic-red text-white'
                  }`}>
                    {registrationEnabled ? 'PORTALS ACTIVE' : 'PORTALS SHUT'}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    onClick={handleToggleRegistration}
                    disabled={loading}
                    className={`px-4 py-2 rounded-xl border-3 border-black font-bangers text-base shadow-[3px_3px_0_#000] cursor-pointer transition-all ${
                      registrationEnabled ? 'bg-comic-red text-white' : 'bg-comic-green text-black'
                    }`}
                  >
                    {registrationEnabled ? '🔒 CLOSE REGISTRATIONS' : '✓ OPEN REGISTRATIONS'}
                  </motion.button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t-2 border-dashed border-black">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-full sm:max-w-xs">
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      MAX ROSTER THRESHOLD CAP
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={maxTeamsInput}
                        onChange={(e) => setMaxTeamsInput(e.target.value)}
                        className="flex-grow h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-3 focus:bg-comic-yellow/10 font-luckiest text-sm"
                        placeholder="Cap limit"
                        min="1"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        type="button"
                        onClick={handleUpdateMaxTeams}
                        disabled={loading}
                        className="bg-comic-yellow text-black border-3 border-black font-bangers text-xs rounded-lg px-3 shadow-[1.5px_1.5px_0_#000]"
                      >
                        UPDATE
                      </motion.button>
                    </div>
                  </div>
                  <div className="font-bangers text-xs text-gray-500 tracking-wider">
                    CURRENT REGISTRATION CAP: <span className="font-luckiest text-black">{maxTeams}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Table */}
            <div className="bg-white border-3 border-black rounded-2xl p-5 md:p-6 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-left">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-luckiest text-black">DEPOSITS MONITOR</h2>
                  <p className="text-xs font-semibold text-gray-700">Scan and verify incoming registration proof uploads.</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  type="button"
                  onClick={handleRefreshPayments}
                  disabled={loading}
                  className="bg-white border-3 border-black text-black font-bangers text-sm rounded-xl px-3.5 py-1.5 shadow-[2px_2px_0_#000] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> REFRESH
                </motion.button>
              </div>

              {!allPayments ? (
                <div className="text-center font-bangers text-gray-500 py-8 tracking-widest text-sm">
                  RETRIEVING FILES...
                </div>
              ) : (
                <>
                  {/* Filter Search */}
                  <div className="mb-5">
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      FILTER BY NAME OR TRANSACTION UTR ID
                    </label>
                    <input
                      type="text"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-4 focus:bg-comic-yellow/10 font-semibold text-sm"
                      placeholder="Type name or transaction UTR to scan..."
                    />
                  </div>

                  {/* Clean Stat Metric Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 font-luckiest text-base">
                    <div className="bg-comic-yellow border-3 border-black rounded-xl p-3 text-center shadow-[3px_3px_0_#000]">
                      <p className="text-black text-2xl leading-none font-luckiest mb-0.5">{allPayments.statusCounts.pending}</p>
                      <p className="text-black text-[10px] font-bangers tracking-widest leading-none mt-1">PENDING VERIFICATION</p>
                    </div>

                    <div className="bg-comic-green border-3 border-black rounded-xl p-3 text-center shadow-[3px_3px_0_#000]">
                      <p className="text-black text-2xl leading-none font-luckiest mb-0.5">{allPayments.statusCounts.verified}</p>
                      <p className="text-black text-[10px] font-bangers tracking-widest leading-none mt-1">VERIFIED TEAMS</p>
                    </div>

                    <div className="bg-comic-red border-3 border-black rounded-xl p-3 text-center shadow-[3px_3px_0_#000]">
                      <p className="text-white text-2xl leading-none font-luckiest mb-0.5">{allPayments.statusCounts.rejected}</p>
                      <p className="text-white text-[10px] font-bangers tracking-widest leading-none mt-1">REJECTED TEAMS</p>
                    </div>
                  </div>

                  {/* Table Roster */}
                  <div className="overflow-x-auto border-3 border-black rounded-xl shadow-[3px_3px_0_#000] bg-white">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-comic-blue border-b-3 border-black text-white font-bangers text-sm tracking-wider">
                          <th className="px-3.5 py-2.5 text-left border-r-2 border-black">ALLIANCE TITLE</th>
                          <th className="px-3.5 py-2.5 text-left border-r-2 border-black">TRANSACTION UTR</th>
                          <th className="px-3.5 py-2.5 text-center border-r-2 border-black">RECEIPT</th>
                          <th className="px-3.5 py-2.5 text-left border-r-2 border-black">SUBMITTED</th>
                          <th className="px-3.5 py-2.5 text-center border-r-2 border-black">STATUS</th>
                          <th className="px-3.5 py-2.5 text-center">DECISION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPayments.data.filter((team) => {
                          const query = statusFilter.trim().toLowerCase();
                          if (!query) return true;
                          const teamName = team.teamName.toLowerCase();
                          const txn = team.payment.transactionId.toLowerCase();
                          return teamName.includes(query) || txn.includes(query);
                        }).map((team, idx) => {
                          const currentStatus = statusEdits[team.payment.transactionId] || team.payment.status;
                          return (
                            <tr 
                              key={team._id} 
                              className={`border-b-2 border-black hover:bg-[#fffbe6] transition-colors ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <td className="px-3 py-3 border-r-2 border-black font-luckiest text-black">{team.teamName}</td>
                              <td className="px-3 py-3 border-r-2 border-black font-mono text-[10px] text-gray-700 font-bold select-all">{team.payment.transactionId}</td>
                              <td className="px-3 py-3 border-r-2 border-black text-center">
                                {team.payment.receiptUrl ? (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    type="button"
                                    onClick={() => openImageModal(team.payment.receiptUrl)}
                                    className="bg-comic-blue hover:bg-blue-600 text-white border-2 border-black rounded px-2.5 py-0.5 font-bangers text-[10px] shadow-[1.5px_1.5px_0_#000] cursor-pointer"
                                  >
                                    VIEW
                                  </motion.button>
                                ) : (
                                  <span className="text-gray-500 font-bangers text-[9px] uppercase">NO RECEIPT</span>
                                )}
                              </td>
                              <td className="px-3 py-3 border-r-2 border-black font-bangers text-[10px] text-gray-500 tracking-wider">
                                {new Date(team.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-3 border-r-2 border-black text-center">
                                <div className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-luckiest border-2 border-black shadow-[1.5px_1.5px_0_#000] ${getStatusBubbleStyle(currentStatus)}`}>
                                  {currentStatus.toUpperCase()}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center font-bangers text-[10px]">
                                <div className="flex justify-center items-center gap-1.5">
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    type="button"
                                    onClick={() => handleDirectUpdateStatus(team.payment.transactionId, 'verified')}
                                    disabled={loading || currentStatus === 'verified'}
                                    className={`border-2 border-black rounded px-2 py-0.5 shadow-[1.5px_1.5px_0_#000] cursor-pointer ${
                                      currentStatus === 'verified'
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                        : 'bg-comic-green text-black hover:bg-green-600'
                                    }`}
                                  >
                                    VERIFY
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    type="button"
                                    onClick={() => handleDirectUpdateStatus(team.payment.transactionId, 'rejected')}
                                    disabled={loading || currentStatus === 'rejected'}
                                    className={`border-2 border-black rounded px-2 py-0.5 shadow-[1.5px_1.5px_0_#000] cursor-pointer ${
                                      currentStatus === 'rejected'
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                        : 'bg-comic-red text-white hover:bg-red-600'
                                    }`}
                                  >
                                    REJECT
                                  </motion.button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        <div className="mt-8 text-center font-luckiest text-sm">
          <motion.a
            whileHover={{ scale: 1.02 }}
            href="/"
            className="inline-block bg-white border-3 border-black rounded-xl px-5 py-1.5 text-black shadow-[3px_3px_0_#000] hover:bg-gray-50 transition"
          >
            ← BACK TO HOME
          </motion.a>
        </div>

      </div>
    </div>
  );
};

export default Download;
