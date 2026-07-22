import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Upload, Check, AlertTriangle, Smartphone } from 'lucide-react';

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
    }
  };

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('teamRegistrationForm');
    if (savedData) {
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
  const [teamNameStatus, setTeamNameStatus] = useState({ checking: false, available: null, message: '' });

  useEffect(() => {
    if (registrationComplete) {
      localStorage.removeItem('teamRegistrationForm');
      return;
    }
    localStorage.setItem('teamRegistrationForm', JSON.stringify(formData));
  }, [formData, registrationComplete]);

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
    const newTeamName = e.target.value;
    setFormData(prev => ({
      ...prev,
      teamName: newTeamName
    }));

    setTeamNameStatus({ checking: true, available: null, message: '' });

    if (window.teamNameCheckTimeout) {
      clearTimeout(window.teamNameCheckTimeout);
    }

    if (!newTeamName.trim()) {
      setTeamNameStatus({ checking: false, available: null, message: '' });
      return;
    }

    window.teamNameCheckTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/check-team-name/${encodeURIComponent(newTeamName)}`
        );
        const data = await response.json();
        setTeamNameStatus({
          checking: false,
          available: data.available,
          message: data.message
        });
      } catch (error) {
        setTeamNameStatus({ checking: false, available: null, message: '' });
      }
    }, 500);
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.teamName.trim()) {
      setError('Please enter the team name');
      window.scrollTo(0, 0);
      return;
    }

    if (teamNameStatus.available === false) {
      setError('Team name already exists. Please choose a different team name');
      window.scrollTo(0, 0);
      return;
    }

    const members = [
      { data: formData.teamLeader, name: 'Team Leader' },
      { data: formData.teamMember1, name: 'Team Member 1' },
      { data: formData.teamMember2, name: 'Team Member 2' }
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
      if (!/^[0-9]+$/.test(member.data.regNo)) {
        setError(`Registration number for ${member.name} must be a valid number`);
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
      const formDataUpload = new FormData();
      formDataUpload.append('receipt', receiptFile);

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
    <div className="min-h-screen bg-comic-rays-yellow bg-halftone-dots flex flex-col font-comic select-none text-black relative overflow-hidden">
      <Navbar />

      {/* Luffy's Straw Hat (One Piece) - Top Left */}
      <div className="absolute top-[12%] left-[6%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-float hidden sm:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-16 h-16 rotate-[-5deg]" viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="65" rx="45" ry="12" fill="#FFD93D" stroke="black" strokeWidth="4" />
            <path d="M22 62 C22 25, 78 25, 78 62" fill="#FFD93D" stroke="black" strokeWidth="4" />
            <path d="M22 55 C30 52, 70 52, 78 55 C78 62, 22 62, 22 55 Z" fill="#FF3B30" stroke="black" strokeWidth="3" />
          </svg>
        </div>
      </div>

      {/* Hidden Leaf Village Spiral (Naruto) - Top Right */}
      <div className="absolute top-[16%] right-[8%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-twinkle hidden sm:block">
        <div className="bg-white border-2 border-black p-2.5 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-12 h-12 rotate-[12deg] text-[#FF7A00]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <path d="M 45 45 C 50 35, 70 45, 60 60 C 50 70, 35 55, 45 45 C 55 35, 80 55, 75 75 L 85 85" stroke="black" strokeWidth="8" />
            <path d="M 45 45 C 50 35, 70 45, 60 60 C 50 70, 35 55, 45 45 C 55 35, 80 55, 75 75 L 85 85" />
            <polygon points="25,35 15,30 25,25" fill="#FF7A00" stroke="black" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="max-w-md w-full bg-white border-3 border-black rounded-2xl comic-shadow p-6 md:p-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-halftone-dots opacity-5 pointer-events-none"></div>

          <div className="mb-5 flex justify-center">
            <div className="w-16 h-16 bg-comic-lime rounded-full flex items-center justify-center border-3 border-black shadow-[2px_2px_0_#000]">
              <span className="text-4xl font-luckiest text-black">✓</span>
            </div>
          </div>

          <h2 className="text-3xl font-luckiest text-black mb-2 leading-none">REGISTRATION COMPLETE!</h2>
          <p className="text-gray-800 text-base font-bold mb-1">Thank you for registering team:</p>
          <p className="text-xl font-bangers text-comic-red tracking-wider mb-6 bg-comic-yellow/10 border-2 border-dashed border-black rounded-lg py-1.5 px-3 inline-block">
            {completedTeamName}
          </p>

          <p className="text-gray-600 text-xs font-semibold mb-6 leading-relaxed">
            Your credentials have been logged in the mission files. Your payment is currently under verification. Join our community chat to receive live updates.
          </p>

          <div className="space-y-3 mb-6 font-bangers text-base md:text-lg">
            <motion.a
              whileHover={{ scale: 1.01 }}
              href="https://chat.whatsapp.com/CWIZynXu7jYKyNcNC57TkB"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-comic-lime text-black border-3 border-black py-2.5 rounded-xl shadow-[3px_3px_0_#000] text-center transition-all"
            >
              💬 JOIN COMMUNITY (WHATSAPP)
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.01 }}
              href="https://chat.whatsapp.com/LeCwjIg78Fs0SUll0AMWAx"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-comic-cyan text-black border-3 border-black py-2.5 rounded-xl shadow-[3px_3px_0_#000] text-center transition-all"
            >
              📱 JOIN GROUP (WHATSAPP)
            </motion.a>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={handleGoHome}
            className="w-full py-2.5 rounded-xl text-base comic-btn-secondary"
          >
            ← BACK TO HOME
          </motion.button>
        </motion.div>
      </div>
    </div>
  );

  const renderMemberForm = (memberType, title, subtitle) => (
    <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white">
      <div className="absolute top-0 right-0 bg-comic-cyan border-b-3 border-l-3 border-black px-3 py-0.5 font-bangers text-[10px] text-black rounded-tr-2xl">
        {subtitle}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-luckiest text-black tracking-wider">{title}</h3>
        <button
          type="button"
          onClick={() => handleClearMember(memberType)}
          className="px-2 py-0.5 text-[10px] font-bangers text-white bg-comic-red hover:bg-red-600 rounded border-2 border-black shadow-[1.5px_1.5px_0_#000] transition-colors"
        >
          CLEAR DATA
        </button>
      </div>

      <div className="w-full space-y-3.5 text-left">
        <div>
          <label className="block text-[11px] font-bangers tracking-wider text-gray-700">
            FULL NAME
          </label>
          <input
            type="text"
            name="name"
            value={formData[memberType].name}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-1.5 text-sm comic-input bg-gray-50 text-black border-3 border-black rounded-lg focus:bg-comic-yellow/10 outline-none transition placeholder:text-gray-400 font-semibold"
            placeholder="Enter full name"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bangers tracking-wider text-gray-700">
            REGISTRATION NUMBER
          </label>
          <input
            type="tel"
            name="regNo"
            value={formData[memberType].regNo}
            onChange={(e) => handleChange(e, memberType)}
            className="w-full px-3 py-1.5 text-sm comic-input bg-gray-50 text-black border-3 border-black rounded-lg focus:bg-comic-yellow/10 outline-none transition placeholder:text-gray-400 font-semibold"
            placeholder="Enter registration number"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-bangers tracking-wider text-gray-700">
            PHONE NUMBER
          </label>
          <input
            type="tel"
            name="phoneNo"
            value={formData[memberType].phoneNo}
            onChange={(e) => handleChange(e, memberType)}
            maxLength="10"
            className="w-full px-3 py-1.5 text-sm comic-input bg-gray-50 text-black border-3 border-black rounded-lg focus:bg-comic-yellow/10 outline-none transition placeholder:text-gray-400 font-semibold"
            placeholder="Enter 10 digit number"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[9px] font-bangers tracking-wider text-gray-700">
              YEAR
            </label>
            <select
              name="year"
              value={formData[memberType].year}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full px-2 py-1.5 text-sm comic-input bg-gray-50 text-black border-3 border-black rounded-lg focus:bg-comic-yellow/10 outline-none transition font-semibold"
              required
            >
              <option value="">Select</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bangers tracking-wider text-gray-700">
              BRANCH
            </label>
            <input
              type="text"
              name="branch"
              value={formData[memberType].branch}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full px-2 py-1.5 text-sm comic-input bg-gray-50 text-black border-3 border-black rounded-lg focus:bg-comic-yellow/10 outline-none transition placeholder:text-gray-400 font-semibold uppercase"
              placeholder="CSE"
              required
            />
          </div>
          <div>
            <label className="block text-[9px] font-bangers tracking-wider text-gray-700">
              SECTION
            </label>
            <input
              type="text"
              name="section"
              value={formData[memberType].section}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full px-2 py-1.5 text-sm comic-input bg-gray-50 text-black border-3 border-black rounded-lg focus:bg-comic-yellow/10 outline-none transition placeholder:text-gray-400 font-semibold uppercase"
              placeholder="A"
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
    <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-16 text-black relative overflow-hidden">
      <Navbar />

      {/* Luffy's Straw Hat (One Piece) - Top Left */}
      <div className="absolute top-[12%] left-[6%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-float hidden sm:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-16 h-16 rotate-[-5deg]" viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="65" rx="45" ry="12" fill="#FFD93D" stroke="black" strokeWidth="4" />
            <path d="M22 62 C22 25, 78 25, 78 62" fill="#FFD93D" stroke="black" strokeWidth="4" />
            <path d="M22 55 C30 52, 70 52, 78 55 C78 62, 22 62, 22 55 Z" fill="#FF3B30" stroke="black" strokeWidth="3" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">LUFFY</div>
        </div>
      </div>

      {/* Hidden Leaf Village Spiral (Naruto) - Top Right */}
      <div className="absolute top-[16%] right-[8%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-twinkle hidden sm:block">
        <div className="bg-white border-2 border-black p-2.5 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-12 h-12 rotate-[12deg] text-[#FF7A00]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <path d="M 45 45 C 50 35, 70 45, 60 60 C 50 70, 35 55, 45 45 C 55 35, 80 55, 75 75 L 85 85" stroke="black" strokeWidth="8" />
            <path d="M 45 45 C 50 35, 70 45, 60 60 C 50 70, 35 55, 45 45 C 55 35, 80 55, 75 75 L 85 85" />
            <polygon points="25,35 15,30 25,25" fill="#FF7A00" stroke="black" strokeWidth="2.5" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">NARUTO</div>
        </div>
      </div>

      {/* Warding Fox Mask (Demon Slayer) - Bottom Left */}
      <div className="absolute bottom-[10%] left-[8%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-twinkle hidden sm:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-14 h-14 rotate-[-10deg]" viewBox="0 0 100 100">
            <path d="M20 50 C20 15, 80 15, 80 50 C80 80, 50 95, 50 95 C50 95, 20 80, 20 50 Z" fill="white" stroke="black" strokeWidth="4" />
            <path d="M25 25 L10 5 L35 18" fill="white" stroke="black" strokeWidth="4" />
            <path d="M75 25 L90 5 L65 18" fill="white" stroke="black" strokeWidth="4" />
            <path d="M35 48 L48 48" stroke="black" strokeWidth="5" strokeLinecap="round" />
            <path d="M52 48 L65 48" stroke="black" strokeWidth="5" strokeLinecap="round" />
            <path d="M28 65 L40 58 L28 72 Z" fill="#FF3B30" stroke="black" strokeWidth="2" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">DEMON SLAYER</div>
        </div>
      </div>

      {/* Shadow Daggers (Jinwoo) - Bottom Right */}
      <div className="absolute bottom-[15%] right-[6%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-float hidden sm:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-14 h-14 text-[#29C5F6] drop-shadow-[0_0_4px_#29C5F6]" viewBox="0 0 100 100">
            <path d="M30 80 L75 35 L80 40 L35 85 Z" fill="#333" stroke="black" strokeWidth="3" />
            <path d="M70 30 L85 15 L90 20 L75 35 Z" fill="currentColor" stroke="black" strokeWidth="2.5" />
            <path d="M70 80 L25 35 L20 40 L65 85 Z" fill="#333" stroke="black" strokeWidth="3" />
            <path d="M30 30 L15 15 L10 20 L25 35 Z" fill="currentColor" stroke="black" strokeWidth="2.5" />
            <circle cx="50" cy="30" r="5" fill="white" stroke="black" strokeWidth="1.5" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">JINWOO</div>
        </div>
      </div>

      {/* Paintbrush & Splat Sticker - Middle Left */}
      <div className="absolute top-[42%] left-[4%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-float hidden lg:block">
        <div className="bg-white border-2 border-black p-2 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-14 h-14 text-comic-cyan" viewBox="0 0 100 100">
            <path d="M20 40 C10 30, 10 60, 30 70 C50 80, 80 70, 70 50 C60 30, 30 50, 20 40 Z" fill="currentColor" opacity="0.4" />
            <path d="M85 15 L50 50 L45 45 L80 10 Z" fill="#D1A153" stroke="black" strokeWidth="3" />
            <path d="M50 50 L40 60 L35 55 L45 45 Z" fill="#999" stroke="black" strokeWidth="2.5" />
            <path d="M40 60 C38 65, 30 75, 25 80 C32 82, 42 75, 45 65 Z" fill="#FF3B30" stroke="black" strokeWidth="2.5" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">BRUSH</div>
        </div>
      </div>

      {/* Paint Splat Sticker - Middle Right */}
      <div className="absolute top-[45%] right-[4%] z-0 pointer-events-none opacity-20 lg:opacity-30 hover:opacity-90 transition-opacity duration-300 animate-twinkle hidden lg:block">
        <div className="bg-white border-2 border-black p-2.5 rounded-2xl shadow-[2px_2px_0_#000]">
          <svg className="w-12 h-12 text-comic-purple" viewBox="0 0 100 100">
            <path d="M50 20 C60 10, 80 15, 75 35 C70 55, 90 60, 75 75 C60 90, 45 75, 30 85 C15 70, 25 45, 35 30 C45 15, 40 30, 50 20 Z" fill="currentColor" stroke="black" strokeWidth="3" />
            <circle cx="20" cy="25" r="4" fill="currentColor" stroke="black" strokeWidth="1.5" />
            <circle cx="80" cy="20" r="5" fill="currentColor" stroke="black" strokeWidth="1.5" />
            <circle cx="85" cy="70" r="3" fill="currentColor" stroke="black" strokeWidth="1" />
          </svg>
          <div className="font-bangers text-[9px] tracking-wider text-black mt-1 text-center">SPLATTER</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 mt-8 flex-grow relative z-10">

        {/* Simple Page Header */}
        <div className="relative mb-8 text-center">
          <div className="bg-white border-3 border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0_#000] inline-block">
            <h2 className="font-luckiest text-2xl md:text-4xl text-black tracking-wide leading-none">
              REGISTRATION DESK
            </h2>
            <p className="font-bangers text-sm text-comic-red tracking-widest mt-1 uppercase">
              REGISTER YOUR ALLIANCE
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6 bg-comic-red border-3 border-black rounded-2xl p-4 text-white font-bangers text-base shadow-[3px_3px_0_#000] flex items-center gap-2"
            >
              <AlertTriangle size={20} className="stroke-[2.5] text-comic-yellow" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Success Banner */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 bg-comic-lime border-3 border-black rounded-2xl p-4 text-black font-bangers text-base shadow-[3px_3px_0_#000] flex items-center gap-2"
            >
              <Check size={20} className="stroke-[3]" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form className="space-y-6">
          {!showPayment ? (
            <div className="space-y-6">

              {/* Team Name Card */}
              <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-center">
                <div className="absolute -top-4 left-6 bg-comic-red border-3 border-black text-white font-luckiest text-sm px-4 py-0.5 rounded-lg shadow-[2px_2px_0_#000]">
                  TEAM NAME
                </div>

                <div className="mt-3 flex flex-col items-center">
                  <label className="block text-xs font-bangers tracking-wider text-gray-700 mb-1">
                    ALLIANCE TITLE / TEAM NAME
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleTeamNameChange}
                    className="w-full max-w-md px-3 py-2 text-center text-base comic-input bg-gray-50 border-3 border-black rounded-xl focus:bg-comic-yellow/10 outline-none transition font-luckiest text-black"
                    placeholder="Enter team name"
                    required
                  />

                  {teamNameStatus.checking && formData.teamName.trim() && (
                    <p className="text-xs font-bangers text-gray-500 mt-1.5 animate-pulse">CHECKING MISSION ARCHIVES...</p>
                  )}
                  {!teamNameStatus.checking && teamNameStatus.available === true && formData.teamName.trim() && (
                    <p className="text-xs font-bangers text-comic-green mt-1.5 flex items-center gap-1">
                      <Check size={14} /> READY FOR MISSION ACTION!
                    </p>
                  )}
                  {!teamNameStatus.checking && teamNameStatus.available === false && formData.teamName.trim() && (
                    <p className="text-xs font-bangers text-comic-red mt-1.5 flex items-center gap-1">
                      <AlertTriangle size={14} /> NAME CLAIMED BY ANOTHER HERO!
                    </p>
                  )}
                </div>
              </div>

              {/* Team Leader Details */}
              <div className="relative">
                <div className="absolute -top-4 left-6 z-10 bg-comic-yellow border-3 border-black text-black font-luckiest text-sm px-4 py-0.5 rounded-lg shadow-[2px_2px_0_#000]">
                  LEADER DETAILS
                </div>
                {renderMemberForm('teamLeader', '👨‍💼 LEADER INFO', 'TEAM LEADER')}
              </div>

              {/* Team Members */}
              <div className="relative pt-4">
                <div className="absolute -top-1 left-6 z-10 bg-comic-purple border-3 border-black text-white font-luckiest text-sm px-4 py-0.5 rounded-lg shadow-[2px_2px_0_#000]">
                  TEAM MEMBERS
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {renderMemberForm('teamMember1', '👤 Comrade 1', 'MEMBER 1')}
                  {renderMemberForm('teamMember2', '👤 Comrade 2', 'MEMBER 2')}
                </div>
              </div>

            </div>
          ) : (
            /* Payment screen */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-3 border-black rounded-2xl p-5 md:p-6 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-left"
            >
              <div className="absolute -top-4 left-6 bg-comic-yellow border-3 border-black text-black font-luckiest text-sm px-4 py-0.5 rounded-lg shadow-[2px_2px_0_#000]">
                PAYMENT DEPOSIT
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                {/* Left Side: Scan QR */}
                <div className="flex flex-col items-center">
                  <div className="relative bg-white border-3 border-black p-3 rounded-xl shadow-[3px_3px_0_#000] mb-3">
                    <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border-2 border-black">
                      <img
                        src="/payment.png"
                        alt="Payment QR Code"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-bangers text-sm" style={{ display: 'none' }}>
                        SCAN QR CODE
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-black text-sm font-bangers tracking-wider">SCAN TO TELEPORT FEE</p>
                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      href="/payment.png"
                      download="payment.png"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bangers text-white bg-comic-blue border-2 border-black rounded-lg shadow-[1.5px_1.5px_0_#000]"
                    >
                      DOWNLOAD QR
                    </motion.a>
                  </div>

                  {/* Account Details Box */}
                  <div className="bg-comic-yellow/10 p-4 rounded-xl border-3 border-dashed border-black mt-5 w-full text-center">
                    <h4 className="text-base font-luckiest text-black mb-2 leading-none">MISSION REVENUE</h4>
                    <div className="space-y-1.5 text-xs font-semibold text-gray-900 font-comic">
                      <p>
                        <span className="font-bangers text-comic-red">BENEFICIARY:</span>{' '}
                        <span>Naresh Reddy</span>
                      </p>
                      <p>
                        <span className="font-bangers text-comic-red">UPI ID:</span>{' '}
                        <span className="font-mono bg-white border border-gray-300 px-2 py-0.5 rounded text-[11px] select-all">reddynaresh559-1@oksbi</span>
                      </p>
                      <p>
                        <span className="font-bangers text-comic-red">FEE AMOUNT:</span>{' '}
                        <span className="font-luckiest text-lg">₹450</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Form Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      TRANSACTION ID / UTR NUMBER
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold comic-input bg-gray-50 text-black border-3 border-black rounded-lg focus:bg-comic-yellow/10 outline-none transition"
                      placeholder="Enter UTR transaction ID"
                      required
                    />

                    {isTxnChecking && (
                      <p className="text-[11px] font-bangers text-gray-500 mt-1 animate-pulse">VERIFYING WITH RECORDS VAULT...</p>
                    )}
                    {!isTxnChecking && txnCheckMessage && (
                      <p className="text-[11px] font-bangers text-comic-red mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> {txnCheckMessage}
                      </p>
                    )}
                  </div>

                  {/* Drag and Drop Zone */}
                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      UPLOAD RECEIPT SCREENSHOT
                    </label>

                    <div className="flex items-center justify-center">
                      <label className="w-full flex flex-col items-center px-4 py-4 bg-comic-orange/5 hover:bg-comic-orange/10 rounded-2xl border-3 border-dashed border-black cursor-pointer transition-colors">
                        <Upload className="w-8 h-8 mb-1.5 text-comic-orange stroke-[2]" />
                        <span className="text-xs font-luckiest tracking-wider text-black block mb-0.5">
                          DROP RECEIPT HERE
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold">
                          {receiptFile ? receiptFile.name : 'Or click to select screenshot'}
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
                      <div className="bg-comic-lime/10 border-2 border-dashed border-comic-green rounded-lg p-2 mt-2 flex items-center justify-center gap-1.5 text-comic-green font-bangers text-xs">
                        ✓ SCREENSHOT LOGGED: {receiptFile.name}
                      </div>
                    )}
                  </div>

                  {/* Summary Panel */}
                  <div className="bg-gray-50 border-3 border-black p-3.5 rounded-xl relative shadow-[3px_3px_0_#000] text-xs">
                    <h5 className="font-luckiest text-[11px] text-black mb-1.5 uppercase">MISSION ALLIANCE</h5>
                    <div className="font-semibold space-y-0.5 text-gray-700 font-comic">
                      <p><span className="font-bangers text-black">ALLIANCE:</span> {formData.teamName}</p>
                      <p><span className="font-bangers text-black">LEADER:</span> {formData.teamLeader.name}</p>
                      <p><span className="font-bangers text-black">Comrades:</span> {[formData.teamMember1.name, formData.teamMember2.name].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-center mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  type="button"
                  onClick={() => setShowPayment(false)}
                  className="px-5 py-2 text-sm font-bangers flex items-center gap-1 rounded-xl comic-btn-secondary"
                >
                  <ArrowLeft size={16} /> BACK TO FORM
                </motion.button>
              </div>

            </motion.div>
          )}

          <div className="pt-2 flex justify-center">
            {!showPayment ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                type="submit"
                onClick={handleProceedToPayment}
                disabled={teamCount >= maxTeams || !registrationEnabled}
                className={`w-full max-w-md py-3 px-6 border-3 border-black rounded-2xl shadow-[4px_4px_0_#111] transition-all flex items-center justify-center gap-2 ${teamCount >= maxTeams || !registrationEnabled
                  ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white font-luckiest text-lg'
                  : 'comic-btn-primary'
                  }`}
              >
                {!registrationEnabled
                  ? 'REGISTRATION SUSPENDED'
                  : teamCount >= maxTeams
                    ? 'ALL SEATS RESERVED'
                    : 'PROCEED TO PAYMENT'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }}
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading || teamCount >= maxTeams || !registrationEnabled}
                className={`w-full max-w-md py-3 px-6 border-3 border-black rounded-2xl shadow-[4px_4px_0_#111] transition-all flex items-center justify-center gap-2 ${loading || teamCount >= maxTeams || !registrationEnabled
                  ? 'bg-gray-400 cursor-not-allowed opacity-60 text-white font-luckiest text-lg'
                  : 'comic-btn-primary'
                  }`}
              >
                {!registrationEnabled
                  ? 'REGISTRATION SUSPENDED'
                  : teamCount >= maxTeams
                    ? 'ALL SEATS RESERVED'
                    : loading
                      ? 'COMMITTING DATA...'
                      : '✓ SUBMIT REGISTRATION'}
              </motion.button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Home;