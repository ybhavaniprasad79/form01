import React, { useState, useEffect } from 'react'

const Home = () => {
  const initialFormState = {
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

  useEffect(() => {
    localStorage.setItem('teamRegistrationForm', JSON.stringify(formData));
  }, [formData]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Clear localStorage after successful submission if needed
    // localStorage.removeItem('teamRegistrationForm');
    // Add your form submission logic here
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
          
          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full max-w-lg bg-gray-700/80 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all shadow-lg hover:shadow-xl"
              >
                Submit Team Registration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Home