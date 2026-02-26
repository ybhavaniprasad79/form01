import React, { useState } from 'react'

const Download = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (!password) {
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
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to download data');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team_registrations_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('File downloaded successfully!');
      setPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred while downloading the file');
      console.error('Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Download Team Data
            </h2>
            <p className="text-gray-400 text-sm">
              Enter password to download all registered teams data
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-lg text-green-300 text-sm text-center">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleDownload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div className="mt-6 text-center">
            <a
              href="/home"
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              ← Back to Registration Form
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Download
