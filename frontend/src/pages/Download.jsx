import React, { useState } from 'react'

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
      
      // Fetch registration status and max teams
      fetchRegistrationStatus();
      fetchMaxTeams();
    } catch (err) {
      setError(err.message || 'Invalid admin password');
      console.error('Unlock status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusEdit = (transactionId, status) => {
    setStatusEdits((prev) => ({
      ...prev,
      [transactionId]: status
    }));
  };

  const handleUpdatePaymentStatus = async (transactionId) => {
    if (!statusPassword) {
      setError('Please enter admin password');
      return;
    }

    const status = statusEdits[transactionId];
    if (!status) {
      setError('Please select a status');
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'verified':
        return 'bg-green-900/30 border-green-600/50 text-green-300';
      case 'rejected':
        return 'bg-red-900/30 border-red-600/50 text-red-300';
      case 'pending':
        return 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300';
      default:
        return 'bg-gray-900/30 border-gray-600/50 text-gray-300';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Image Modal */}
      {isModalOpen && modalImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-2xl w-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-12 right-0 text-white bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            >
              ✕ Close
            </button>
            <img
              src={modalImage}
              alt="Receipt full view"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setTab('download');
              setError('');
              setSuccess('');
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              tab === 'download'
                ? 'bg-gray-700/80 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            📥 Download Data
          </button>
          <button
            onClick={() => {
              setTab('status');
              setError('');
              setSuccess('');
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              tab === 'status'
                ? 'bg-gray-700/80 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
            }`}
          >
            💳 Check & Update Status
          </button>
        </div>

        {/* Download Tab */}
        {tab === 'download' && (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Download Team Data
              </h2>
              <p className="text-gray-400 text-sm">
                Enter password to download all registered teams data
              </p>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-lg text-green-300 text-sm text-center">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleDownload} className="space-y-6 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={downloadPassword}
                  onChange={(e) => setDownloadPassword(e.target.value)}
                  className="w-full px-4 py-3 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
                  placeholder="Enter download password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gray-700/80 text-white py-3 px-4 rounded-lg text-base font-semibold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-600 hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </span>
                ) : (
                  '📥 Download Excel File'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Payment Status Tab */}
        {tab === 'status' && !isStatusAuthorized && (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700/50">
            <h2 className="text-3xl font-bold text-white mb-6">Admin Access Required</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter the admin password to access payment status tools.
            </p>

            {success && (
              <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-lg text-green-300 text-sm text-center">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleUnlockStatusTools} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={statusGatePassword}
                  onChange={(e) => setStatusGatePassword(e.target.value)}
                  className="w-full px-4 py-3 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
                  placeholder="Enter admin password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gray-700/80 text-white py-3 px-4 rounded-lg text-base font-semibold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-600 hover:shadow-xl'
                }`}
              >
                {loading ? '🔒 Verifying...' : '🔒 Unlock Status Tools'}
              </button>
            </form>
          </div>
        )}

        {tab === 'status' && isStatusAuthorized && (
          <div className="space-y-6">
            {/* Registration Control Panel */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Registration Control</h3>
                  <p className="text-sm text-gray-400">Temporarily enable or disable team registrations</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-lg border ${
                    registrationEnabled
                      ? 'bg-green-900/30 border-green-600/50 text-green-300'
                      : 'bg-red-900/30 border-red-600/50 text-red-300'
                  }`}>
                    <span className="font-semibold">
                      {registrationEnabled ? '✓ ' : '✕'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleRegistration}
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all border ${
                      loading
                        ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-400 bg-gray-700/50'
                        : registrationEnabled
                          ? 'border-red-500/50 text-red-300 bg-red-900/30 hover:bg-red-900/50'
                          : 'border-green-500/50 text-green-300 bg-green-900/30 hover:bg-green-900/50'
                    }`}
                  >
                    {loading ? '...' : registrationEnabled ? '🔒 Close Registrations' : '✓ Open Registrations'}
                  </button>
                </div>
              </div>
              {/* Max Teams Control */}
              <div className="mt-4 pt-4 border-t border-gray-600/50">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Maximum Teams Limit
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={maxTeamsInput}
                        onChange={(e) => setMaxTeamsInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
                        placeholder="Enter max teams"
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={handleUpdateMaxTeams}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                          loading
                            ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-400 bg-gray-700/50'
                            : 'border-blue-500/50 text-blue-300 bg-blue-900/30 hover:bg-blue-900/50'
                        }`}
                      >
                        {loading ? '...' : '✓ Update'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: {maxTeams}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700/50">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-3xl font-bold text-white">Payment Status Dashboard</h2>
                <button
                  type="button"
                  onClick={handleRefreshPayments}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    loading
                      ? 'opacity-50 cursor-not-allowed border-gray-600 text-gray-400'
                      : 'border-gray-500/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {loading ? 'Refreshing...' : '↻ Refresh List'}
                </button>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-lg text-green-300 text-sm text-center">
                  {success}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              {!allPayments ? (
                <div className="text-center text-gray-400 py-10">
                  No payment data loaded yet.
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Search by Team Name or Transaction ID
                    </label>
                    <input
                      type="text"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
                      placeholder="Type to filter..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 text-center">
                      <p className="text-yellow-300 font-semibold text-2xl">{allPayments.statusCounts.pending}</p>
                      <p className="text-yellow-300 text-sm">Pending</p>
                    </div>
                    <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4 text-center">
                      <p className="text-green-300 font-semibold text-2xl">{allPayments.statusCounts.verified}</p>
                      <p className="text-green-300 text-sm">Verified</p>
                    </div>
                    <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 text-center">
                      <p className="text-red-300 font-semibold text-2xl">{allPayments.statusCounts.rejected}</p>
                      <p className="text-red-300 text-sm">Rejected</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600/50">
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">Team Name</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">Transaction ID</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">Receipt</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">Submitted</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">Status</th>
                          <th className="px-4 py-3 text-left text-gray-400 font-medium">Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPayments.data.filter((team) => {
                          const query = statusFilter.trim().toLowerCase();
                          if (!query) return true;
                          const teamName = team.teamName.toLowerCase();
                          const txn = team.payment.transactionId.toLowerCase();
                          return teamName.includes(query) || txn.includes(query);
                        }).map((team) => {
                          const currentStatus = statusEdits[team.payment.transactionId] || team.payment.status;
                          return (
                            <tr key={team._id} className="border-b border-gray-600/30 hover:bg-gray-700/30 transition">
                              <td className="px-4 py-3 text-gray-300">{team.teamName}</td>
                              <td className="px-4 py-3 text-gray-300 font-mono text-xs">{team.payment.transactionId}</td>
                              <td className="px-4 py-3">
                                {team.payment.receiptUrl ? (
                                  <div 
                                    onClick={() => openImageModal(team.payment.receiptUrl)}
                                    className="cursor-pointer group"
                                  >
                                    <img
                                      src={team.payment.receiptUrl}
                                      alt="Receipt preview"
                                      className="w-16 h-16 object-cover rounded border border-gray-600/50 hover:border-blue-500/50 transition-all group-hover:shadow-lg"
                                    />
                                    <p className="text-[10px] text-gray-500 group-hover:text-blue-400 mt-1 transition-colors">Click to view</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-500 text-xs">No receipt</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{new Date(team.submittedAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={currentStatus}
                                  onChange={(e) => handleStatusEdit(team.payment.transactionId, e.target.value)}
                                  className="w-full min-w-[140px] px-3 py-2 text-xs bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="verified">Verified</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                <div className={`mt-2 inline-block px-2 py-1 rounded-full text-[10px] font-medium border ${getStatusColor(currentStatus)}`}>
                                  {currentStatus.toUpperCase()}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePaymentStatus(team.payment.transactionId)}
                                  disabled={loading}
                                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                                    loading
                                      ? 'opacity-50 cursor-not-allowed bg-gray-700/50 text-gray-400'
                                      : 'bg-green-700/80 text-white hover:bg-green-600'
                                  }`}
                                >
                                  {loading ? 'Updating...' : 'Update'}
                                </button>
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

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default Download
