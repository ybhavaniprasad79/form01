import React, { useState, useEffect } from 'react'

const Home = () => {
  const initialFormState = {
    teamName: '',
    teamLeader: {
      name: '',
      regNo: '',
      phoneNo: '',
      year: '',
      branch: '',
      section: ''
    },
    teamMember1: {
      name: '',
      regNo: '',
      phoneNo: '',
      year: '',
      branch: '',
      section: ''
    },
    teamMember2: {
      name: '',
      regNo: '',
      phoneNo: '',
      year: '',
      branch: '',
      section: ''
    }
  };

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('teamRegistrationForm');
    return savedData ? JSON.parse(savedData) : initialFormState;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamCount, setTeamCount] = useState(0);
  const [maxTeams] = useState(5);

  useEffect(() => {
    localStorage.setItem('teamRegistrationForm', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const fetchTeamCount = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/teams/count');
        const data = await response.json();
        if (data.success) {
          setTeamCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch team count:', error);
      }
    };

    fetchTeamCount();
  }, []);

  const handleChange = (e, memberType) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [memberType]: {
        ...prev[memberType],
        [name]: value
      }
    }));
  };

  const handleTeamNameChange = (e) => {
    setFormData(prev => ({
      ...prev,
      teamName: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit registration');
      }

      setSuccess('Team registration submitted successfully!');
      localStorage.removeItem('teamRegistrationForm');
      setFormData(initialFormState);
      setTeamCount(prev => prev + 1); // Update team count
      
      // Scroll to top
      window.scrollTo(0, 0);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'An error occurred while submitting the form');
      console.error('Submission error:', err);
      
      // Refresh team count to show accurate count if registration closed
      try {
        const countResponse = await fetch('http://localhost:5000/api/teams/count');
        const countData = await countResponse.json();
        if (countData.success) {
          setTeamCount(countData.count);
        }
      } catch (countError) {
        console.error('Failed to refresh team count:', countError);
      }
      
      // Scroll to top to show error message
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  const handleClearMember = (memberType) => {
    setFormData(prev => ({
      ...prev,
      [memberType]: {
        name: '',
        regNo: '',
        phoneNo: '',
        year: '',
        branch: '',
        section: ''
      }
    }));
  };

  const renderMemberForm = (memberType, title) => (
    <div className="bg-gray-700/50 p-5 rounded-xl border border-gray-600/50 backdrop-blur-sm flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={() => handleClearMember(memberType)}
          className="px-3 py-1 text-xs font-medium text-gray-300 bg-gray-600/50 hover:bg-gray-600 rounded-lg border border-gray-500/50 transition-colors"
        >
          Clear
        </button>
      </div>
      
      <div className="w-full max-w-lg space-y-3">
      
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center">
          Name
        </label>
        <input
          type="text"
          name="name"
          value={formData[memberType].name}
          onChange={(e) => handleChange(e, memberType)}
          className="w-full px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
          placeholder="Enter full name"
          required
        />
      </div>

      {/* Registration Number */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center">
          Registration Number
        </label>
        <input
          type="text"
          name="regNo"
          value={formData[memberType].regNo}
          onChange={(e) => handleChange(e, memberType)}
          maxLength="11"
          pattern="[0-9]{11}"
          className="w-full px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
          placeholder="Enter registration number"
          required
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center">
          Phone Number
        </label>
        <input
          type="tel"
          name="phoneNo"
          value={formData[memberType].phoneNo}
          onChange={(e) => handleChange(e, memberType)}
          maxLength="10"
          pattern="[0-9]{10}"
          className="w-full px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
          placeholder="Enter phone number"
          required
        />
      </div>

      {/* Year, Branch and Section side by side */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center">
            Year
          </label>
          <select
            name="year"
            value={formData[memberType].year}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition"
            required
          >
            <option value="">Select year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center">
            Branch
          </label>
          <input
            type="text"
            name="branch"
            value={formData[memberType].branch}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
            placeholder="CSE, ECE..."
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5 text-center">
            Section
          </label>
          <input
            type="text"
            name="section"
            value={formData[memberType].section}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
            placeholder="A, B, C..."
            required
          />
        </div>
      </div>
      </div>


    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold text-center text-white mb-6">
            Team Registration Form
          </h2>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-900/30 border border-green-600/50 rounded-lg text-green-300 text-sm text-center">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-600/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Team Name */}
            <div className="bg-gray-700/50 p-5 rounded-xl border border-gray-600/50 backdrop-blur-sm flex flex-col items-center">
              <label className="block text-xs font-medium text-gray-400 mb-2 text-center">
                Team Name
              </label>
              <input
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleTeamNameChange}
                className="w-full max-w-lg px-3 py-2 text-sm bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
                placeholder="Enter team name"
                required
              />
            </div>

            {/* Team Leader */}
            {renderMemberForm('teamLeader', '👨‍💼 Team Leader')}

            {/* Team Member 1 */}
            {renderMemberForm('teamMember1', '👤 Team Member 1')}

            {/* Team Member 2 */}
            {renderMemberForm('teamMember2', '👤 Team Member 2')}

            {/* Submit Button */}
            <div className="pt-3 flex justify-center">
              <button
                type="submit"
                disabled={loading || teamCount >= maxTeams}
                className={`w-full max-w-lg bg-gray-700/80 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  loading || teamCount >= maxTeams
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-600 hover:shadow-xl'
                }`}
              >
                {teamCount >= maxTeams 
                  ? 'Registration Closed' 
                  : loading 
                    ? 'Submitting...' 
                    : 'Submit Team Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Home