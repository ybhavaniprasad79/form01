import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate();
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
    },
    teamMember3: {
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
    if (savedData) {
      // Merge saved data with initialFormState to ensure all fields exist
      return { ...initialFormState, ...JSON.parse(savedData) };
    }
    return initialFormState;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamCount, setTeamCount] = useState(0);
  const [maxTeams, setMaxTeams] = useState(50);
  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [isTxnChecking, setIsTxnChecking] = useState(false);
  const [txnExists, setTxnExists] = useState(false);
  const [txnCheckMessage, setTxnCheckMessage] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [completedTeamName, setCompletedTeamName] = useState('');

  useEffect(() => {
    localStorage.setItem('teamRegistrationForm', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    const fetchTeamCount = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teams/count`);
        const data = await response.json();
        if (data.success) {
          setTeamCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch team count:', error);
      }
    };

    const fetchRegistrationStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registration-status`);
        const data = await response.json();
        if (data.success) {
          setRegistrationEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Failed to fetch registration status:', error);
      }
    };

    const fetchMaxTeams = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/max-teams`);
        const data = await response.json();
        if (data.success) {
          setMaxTeams(data.maxTeams);
        }
      } catch (error) {
        console.error('Failed to fetch max teams:', error);
      }
    };

    fetchTeamCount();
    fetchRegistrationStatus();
    fetchMaxTeams();
  }, []);

  useEffect(() => {
    if (!showPayment) {
      setIsTxnChecking(false);
      setTxnExists(false);
      setTxnCheckMessage('');
      return;
    }

    const trimmed = transactionId.trim();
    if (!trimmed) {
      setIsTxnChecking(false);
      setTxnExists(false);
      setTxnCheckMessage('');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsTxnChecking(true);
      setTxnCheckMessage('');

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/payment-status/${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        if (response.ok) {
          setTxnExists(true);
          setTxnCheckMessage('Transaction ID already exists');
          return;
        }

        if (response.status === 404) {
          setTxnExists(false);
          setTxnCheckMessage('');
          return;
        }

        const data = await response.json().catch(() => null);
        setTxnExists(false);
        setTxnCheckMessage(data?.message || 'Unable to verify transaction ID');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setTxnExists(false);
          setTxnCheckMessage('Unable to verify transaction ID');
        }
      } finally {
        setIsTxnChecking(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [transactionId, showPayment]);

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

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate team name
    if (!formData.teamName.trim()) {
      setError('Please enter the team name');
      window.scrollTo(0, 0);
      return;
    }
    
    // Validate all team members
    const members = [
      { data: formData.teamLeader, name: 'Team Leader' },
      { data: formData.teamMember1, name: 'Team Member 1' },
      { data: formData.teamMember2, name: 'Team Member 2' },
      { data: formData.teamMember3, name: 'Team Member 3' }
    ];
    
    for (const member of members) {
      if (!member.data.name.trim()) {
        setError(`Please enter the name for ${member.name}`);
        window.scrollTo(0, 0);
        return;
      }
      if (!member.data.regNo.trim()) {
        setError(`Please enter the registration number for ${member.name}`);
        window.scrollTo(0, 0);
        return;
      }
      if (member.data.regNo.length !== 11 || !/^[0-9]+$/.test(member.data.regNo)) {
        setError(`Registration number for ${member.name} must be 11 digits`);
        window.scrollTo(0, 0);
        return;
      }
      if (!member.data.phoneNo.trim()) {
        setError(`Please enter the phone number for ${member.name}`);
        window.scrollTo(0, 0);
        return;
      }
      if (member.data.phoneNo.length !== 10 || !/^[0-9]+$/.test(member.data.phoneNo)) {
        setError(`Phone number for ${member.name} must be 10 digits`);
        window.scrollTo(0, 0);
        return;
      }
      if (!member.data.year) {
        setError(`Please select the year for ${member.name}`);
        window.scrollTo(0, 0);
        return;
      }
      if (!member.data.branch.trim()) {
        setError(`Please enter the branch for ${member.name}`);
        window.scrollTo(0, 0);
        return;
      }
      if (!member.data.section.trim()) {
        setError(`Please enter the section for ${member.name}`);
        window.scrollTo(0, 0);
        return;
      }
    }
    
    // All validations passed, proceed to payment
    setShowPayment(true);
    window.scrollTo(0, 0);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    
    if (!transactionId.trim()) {
      setError('Please enter the transaction ID');
      window.scrollTo(0, 0);
      return;
    }

    if (txnExists) {
      setError('Transaction ID already exists. Please enter a unique transaction ID');
      window.scrollTo(0, 0);
      return;
    }
    
    if (!receiptFile) {
      setError('Please upload the payment receipt/screenshot');
      window.scrollTo(0, 0);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Upload receipt to Cloudinary
      const formDataUpload = new FormData();
      formDataUpload.append('receipt', receiptFile);

      // Create abort controller with 120 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload-receipt`, {
          method: 'POST',
          body: formDataUpload,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || 'Failed to upload receipt');
        }

        // Step 2: Submit registration with receipt URL
        const submissionData = {
          ...formData,
          payment: {
            transactionId: transactionId,
            receiptUrl: uploadData.data.url,
            receiptFileName: receiptFile.name
          }
        };

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to submit registration');
        }

        setSuccess('Team registration and payment submitted successfully!');
        setCompletedTeamName(formData.teamName);
        setRegistrationComplete(true);
        localStorage.removeItem('teamRegistrationForm');
        setFormData(initialFormState);
        setTransactionId('');
        setReceiptFile(null);
        setShowPayment(false);
        setTeamCount(prev => prev + 1);
        
        window.scrollTo(0, 0);
      } catch (uploadErr) {
        clearTimeout(timeoutId);
        if (uploadErr.name === 'AbortError') {
          throw new Error('Upload timed out. Please try again with a smaller file.');
        }
        throw uploadErr;
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting the form');
      console.error('Submission error:', err);
      
      try {
        const countResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teams/count`);
        const countData = await countResponse.json();
        if (countData.success) {
          setTeamCount(countData.count);
        }
      } catch (countError) {
        console.error('Failed to refresh team count:', countError);
      }
      
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

  const handleGoHome = () => {
    navigate('/');
  };

  const renderRegistrationSuccess = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700/50 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500/50">
              <span className="text-5xl">✓</span>
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-white mb-2">Registration Complete!</h2>
          <p className="text-gray-300 mb-2">Thank you for registering</p>
          <p className="text-lg font-semibold text-green-400 mb-6">{completedTeamName}</p>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-8">
            Your registration has been submitted successfully. Your payment is now under verification. Join our community to stay updated!
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <a
              href="https://chat.whatsapp.com/CWIZynXu7jYKyNcNC57TkB"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600/80 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-lg text-center"
            >
              💬 Join Community (WhatsApp)
            </a>
            <a
              href="https://chat.whatsapp.com/DVBIy8LksOeEWQpeTWNqH6?mode=gi_t"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600/80 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-all shadow-lg text-center"
            >
              📱 Join Group (Whatsapp)
            </a>
          </div>

          {/* Home Button */}
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-700/80 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all border border-gray-600/50"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  const renderMemberForm = (memberType, title) => (
    <div className="bg-gray-700/50 p-5 rounded-xl border border-gray-600/50 backdrop-blur-sm flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-5">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
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
        <label className="block text-sm font-medium text-gray-400 mb-1.5 text-center">
          Name
        </label>
        <input
          type="text"
          name="name"
          value={formData[memberType].name}
          onChange={(e) => handleChange(e, memberType)}
          className="w-full px-3 py-2 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
          placeholder="Enter full name"
          required
        />
      </div>

      {/* Registration Number */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5 text-center">
          Registration Number
        </label>
        <input
          type="text"
          name="regNo"
          value={formData[memberType].regNo}
          onChange={(e) => handleChange(e, memberType)}
          maxLength="11"
          pattern="[0-9]{11}"
          className="w-full px-3 py-2 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
          placeholder="Enter registration number"
          required
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5 text-center">
          Phone Number
        </label>
        <input
          type="tel"
          name="phoneNo"
          value={formData[memberType].phoneNo}
          onChange={(e) => handleChange(e, memberType)}
          maxLength="10"
          pattern="[0-9]{10}"
          className="w-full px-3 py-2 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
          placeholder="Enter phone number"
          required
        />
      </div>

      {/* Year, Branch and Section side by side */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5 text-center">
            Year
          </label>
          <select
            name="year"
            value={formData[memberType].year}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-2 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition"
            required
          >
            <option value="">Select year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5 text-center">
            Branch
          </label>
          <input
            type="text"
            name="branch"
            value={formData[memberType].branch}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-2 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
            placeholder="CSE, ECE..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5 text-center">
            Section
          </label>
          <input
            type="text"
            name="section"
            value={formData[memberType].section}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-2 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
            placeholder="A, B, C..."
            required
          />
        </div>
      </div>
      </div>


    </div>
  );

  if (registrationComplete) {
    return renderRegistrationSuccess();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700/50">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
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
          
          <form className="space-y-5">
            {/* Team Registration Fields */}
            {!showPayment && (
              <>
                {/* Team Name */}
                <div className="bg-gray-700/50 p-5 rounded-xl border border-gray-600/50 backdrop-blur-sm flex flex-col items-center">
                  <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                    Team Name
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleTeamNameChange}
                    className="w-full max-w-lg px-3 py-2 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
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

                {/* Team Member 3 */}
                {renderMemberForm('teamMember3', '👤 Team Member 3')}
              </>
            )}

            {/* Payment Section */}
            {showPayment && (
              <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600/50 backdrop-blur-sm">
                <h3 className="text-2xl font-semibold text-white mb-6 text-center">💳 Payment Details</h3>
                
                {/* QR Code Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-white p-4 rounded-xl mb-4 relative">
                    {/* Placeholder for QR Code - Replace with actual QR code image */}
                    <div className="w-64 h-64 flex items-center justify-center bg-gray-200 rounded-lg">
                      <img 
                        src="/payment.jpeg" 
                        alt="Payment QR Code" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm" style={{display: 'none'}}>
                        QR Code Here
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-gray-300 text-lg font-medium">Scan to Pay</p>
                    <a
                      href="/payment.jpeg"
                      download="payment-qr-code.jpeg"
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600/80 hover:bg-blue-600 rounded-lg transition-colors"
                      title="Download QR Code"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download QR
                    </a>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-gray-800/70 p-4 rounded-lg mb-6 border border-gray-600/30">
                  <h4 className="text-lg font-semibold text-white mb-3 text-center">Account Details</h4>
                  <div className="space-y-2 text-center">
                    <p className="text-gray-300">
                      <span className="font-medium text-gray-400">Account Name:</span>{' '}
                      <span className="text-white font-semibold">Naresh Reddy</span>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium text-gray-400">UPI ID:</span>{' '}
                      <span className="text-white font-mono">nr6975060-1@oksbi</span>
                    </p>
                    <p className="text-gray-300">
                      <span className="font-medium text-gray-400">Amount:</span>{' '}
                      <span className="text-white font-semibold">₹400</span>
                    </p>
                  </div>
                </div>

                {/* Transaction ID Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                    Transaction ID / UTR Number
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-2.5 text-base bg-gray-800/70 border border-gray-600/50 text-white rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none transition placeholder:text-gray-500"
                    placeholder="Enter transaction ID"
                    required
                  />
                  {isTxnChecking && (
                    <p className="text-sm text-gray-400 mt-2 text-center">Checking transaction ID...</p>
                  )}
                  {!isTxnChecking && txnCheckMessage && (
                    <p className="text-sm text-red-400 mt-2 text-center">{txnCheckMessage}</p>
                  )}
                </div>

                {/* Receipt Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                    Upload Payment Screenshot/Receipt
                  </label>
                  <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                    only jpg, jpeg, png, pdf, webp formats are allowed
                  </label>
                  <div className="flex items-center justify-center">
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-800/70 text-gray-400 rounded-lg border-2 border-dashed border-gray-600/50 cursor-pointer hover:bg-gray-800 transition">
                      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-center">
                        {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                        required
                      />
                    </label>
                  </div>
                  {receiptFile && (
                    <p className="text-green-400 text-sm text-center mt-2">✓ File selected: {receiptFile.name}</p>
                  )}
                </div>

                {/* Back Button */}
                <div className="flex justify-center mb-4">
                  <button
                    type="button"
                    onClick={() => setShowPayment(false)}
                    className="px-6 py-2 text-sm font-medium text-gray-300 bg-gray-600/50 hover:bg-gray-600 rounded-lg border border-gray-500/50 transition-colors"
                  >
                    ← Back to Form
                  </button>
                </div>
              </div>
            )}

            {/* Submit/Payment Button */}
            <div className="pt-3 flex justify-center">
              {!showPayment ? (
                <button
                  type="submit"
                  onClick={handleProceedToPayment}
                  disabled={teamCount >= maxTeams || !registrationEnabled}
                  className={`w-full max-w-lg bg-gray-700/80 text-white py-2.5 px-4 rounded-lg text-base font-semibold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    teamCount >= maxTeams || !registrationEnabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-600 hover:shadow-xl'
                  }`}
                >
                  {!registrationEnabled
                    ? 'Registration Temporarily Closed'
                    : teamCount >= maxTeams
                      ? 'Registration Closed'
                      : '💳 Proceed to Payment'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading || teamCount >= maxTeams || !registrationEnabled}
                  className={`w-full max-w-lg bg-green-700/80 text-white py-2.5 px-4 rounded-lg text-base font-semibold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    loading || teamCount >= maxTeams || !registrationEnabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-green-600 hover:shadow-xl'
                  }`}
                >
                  {!registrationEnabled
                    ? 'Registration Temporarily Closed'
                    : teamCount >= maxTeams
                      ? 'Registration Closed'
                      : loading
                        ? 'Submitting...'
                        : '✓ Complete Registration'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Home