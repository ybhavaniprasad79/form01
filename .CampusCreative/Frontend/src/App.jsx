import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import Events from './components/Events';
import Team from './components/Team';
import ReelOfTheMonth from './components/ReelOfTheMonth';
import JoinTeam from './components/JoinTeam';
import Dashboard from './components/Dashboard';
import Gallery from './components/Gallery';
import Achievements from './components/Achievements';
import Announcements from './components/Announcements';
import ContactUs from './components/ContactUs';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Navigation & UI States
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('ccc_page') || 'home';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ccc_theme') || 'canvas';
  });
  const [toasts, setToasts] = useState([]);

  // Mock Database State (Initialized from localStorage if present)
  
  // 1. Events State
  const [events, setEvents] = useState(() => {
    const cached = localStorage.getItem('ccc_events');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'evt-1',
        title: 'Golden Hour Photowalk',
        category: 'Photography',
        date: '2026-08-01',
        time: '4:30 PM - 6:30 PM',
        venue: 'Campus Central Lake & Red Brick Courtyard',
        description: 'Explore the campus at golden hour to capture beautiful architectures, shadows, and expressions. Bring your DSLRs or smartphone cameras.',
        status: 'upcoming',
        dateStr: '2026-08-01T16:30:00'
      },
      {
        id: 'evt-2',
        title: 'Visual Storytelling Workshop',
        category: 'Workshops',
        date: '2026-08-15',
        time: '10:00 AM - 1:00 PM',
        venue: 'Seminar Hall B, Block-B',
        description: 'A hands-on session on film pacing, camera angles, post-production transitions, and scripting aesthetic student reels.',
        status: 'upcoming',
        dateStr: '2026-08-15T10:00:00'
      },
      {
        id: 'evt-3',
        title: 'Sunset Canvas Exhibition',
        category: 'Cultural Events',
        date: '2026-07-10',
        venue: 'Exhibition Hall A',
        description: 'Annual creative showcase exhibiting photos, poster designs, and graphic narratives. Judged by regional creative directors.',
        status: 'past',
        winners: 'Rahul Sharma & Team',
        stats: '150+ Attendees, 40+ Entries',
        feedback: 'Incredible experience, seeing fellow student work inspired me!'
      },
      {
        id: 'evt-4',
        title: 'Frame-by-Frame Editing Lab',
        category: 'Videography',
        date: '2026-06-25',
        venue: 'Creative Studio Lab',
        description: 'Deep-dive intensive into grading, timeline cutting, color match workflows, and adding sound templates.',
        status: 'past',
        winners: 'Ananya Roy',
        stats: '30+ Certified Editors',
        feedback: 'DaVinci Resolve shortcuts shown here saved me hours of work!'
      }
    ];
  });

  // 2. Student Profile State
  const [student, setStudent] = useState(() => {
    const cached = localStorage.getItem('ccc_student');
    if (cached) return JSON.parse(cached);
    return {
      name: 'Alex Mercer',
      department: 'Design & Media',
      year: '3rd Year',
      status: 'Active Core Member',
      attendancePct: 84,
      registeredEvents: ['evt-1'],
      certificates: [
        { id: 'CERT-FDSM-2026', title: 'Figma Design Sprint Camp', date: 'June 2026' },
        { id: 'CERT-CVLB-2026', title: 'Campus Videography Lab 2026', date: 'May 2026' }
      ],
      achievements: [
        'Best Poster Design - Sunset Canvas 2026',
        'Lead Designer Appointment'
      ],
      contributions: {
        photos: 12,
        reels: 4,
        posters: 8,
        volunteering: 3
      },
      notifications: [
        'Upcoming event: Photowalk next Saturday!',
        'Your certificate for Figma Design Sprint Camp is now available.'
      ]
    };
  });

  // 3. Applications State
  const [applications, setApplications] = useState(() => {
    const cached = localStorage.getItem('ccc_applications');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'APP-001',
        name: 'Kavya Iyer',
        email: 'kavya.iyer@college.edu',
        role: 'Videographer',
        department: 'Computer Science',
        year: '2nd Year',
        status: 'Shortlisted',
        pitch: 'I love making reels and editing short campus documentaries on DaVinci.',
        portfolio: 'https://behance.net/kavya'
      },
      {
        id: 'APP-002',
        name: 'Rohit Verma',
        email: 'rohit.v@college.edu',
        role: 'Content Writer',
        department: 'Electronics',
        year: '1st Year',
        status: 'Pending',
        pitch: 'Writing captions and drafting monthly newsletters is my core interest.',
        portfolio: 'https://medium.com/@rohit'
      }
    ];
  });

  // 4. Announcements State
  const [announcements, setAnnouncements] = useState(() => {
    const cached = localStorage.getItem('ccc_announcements');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'ann-1',
        title: 'Recruitment 2026 is Live!',
        category: 'Recruitment Updates',
        content: 'We are officially accepting student applications for Available Roles under the Join Team portal. Apply today to pitch your portfolio!',
        date: 'July 20, 2026',
        actionLink: true
      },
      {
        id: 'ann-2',
        title: 'Congratulations Sunset Canvas Winners',
        category: 'Event Results',
        content: 'Special applause to Rahul Sharma & Team for securing the Golden Plaque award at the Sunset Canvas Exhibition. Certificates have been issued.',
        date: 'July 11, 2026',
        actionLink: false
      }
    ];
  });

  // 5. Reels State
  const [reels, setReels] = useState(() => {
    const cached = localStorage.getItem('ccc_reels');
    if (cached) return JSON.parse(cached);
    return {
      current: {
        title: 'Golden Campus Sunset',
        creator: 'siddharth_sen',
        month: 'July 2026',
        likes: '1.8K',
        views: '14.2K',
        description: 'A cinematic compilation of our campus during golden hour. Shot on Sony A7IV and edited in Premiere Pro.'
      },
      archive: [
        { title: 'Campus Rain Sunset', creator: 'priya_nair', month: 'June 2026', views: '11K' },
        { title: 'Behind the Scenes of Fest', creator: 'design_team', month: 'May 2026', views: '8.9K' },
        { title: 'Creative Club Trailer', creator: 'ankit_roy', month: 'April 2026', views: '19K' }
      ],
      votes: [
        { id: 'drone', topic: 'Cinematic Drone Shots', count: 12 },
        { id: 'life', topic: 'A Day in the Life of a Creator', count: 8 },
        { id: 'vibe', topic: 'Creative Club Vibe Check', count: 15 }
      ]
    };
  });

  // 6. Faculty and Core Team State
  const [team] = useState({
    faculty: [
      { name: 'Dr. Aranya Sen', designation: 'Senior Faculty Advisor (Media & Design)', contact: 'aranya.sen@college.edu' },
      { name: 'Prof. Vipul Roy', designation: 'Co-Advisor (Fine Arts Department)', contact: 'vipul.roy@college.edu' }
    ],
    leadership: [
      { name: 'Siddharth Roy', role: 'President', year: '4th Year', dept: 'Information Technology' },
      { name: 'Riya Malhotra', role: 'Vice President', year: '4th Year', dept: 'Mechanical Engineering' },
      { name: 'Kavya Sharma', role: 'Secretary', year: '3rd Year', dept: 'Computer Science' },
      { name: 'Abhishek Nair', role: 'Treasurer', year: '3rd Year', dept: 'Electronics' }
    ],
    students: [
      { name: 'Ananya Deshmukh', role: 'Lead Graphic Designer', department: 'Design', email: 'ananya@mail.com' },
      { name: 'Rohan Mehta', role: 'Senior Videographer', department: 'Photography & Video', email: 'rohan@mail.com' },
      { name: 'Tanya Goel', role: 'Newsletter Lead Editor', department: 'Editorial', email: 'tanya@mail.com' },
      { name: 'Aditya Sen', role: 'Web Developer', department: 'Web Dev & Technical', email: 'aditya@mail.com' },
      { name: 'Pooja Hegde', role: 'Logistics Coordinator', department: 'Event Operations', email: 'pooja@mail.com' },
      { name: 'Vikram Seth', role: 'Visual Editor', department: 'Photography & Video', email: 'vikram@mail.com' }
    ]
  });

  // Sync state variables to localStorage on change
  useEffect(() => {
    localStorage.setItem('ccc_page', currentPage);
    localStorage.setItem('ccc_theme', theme);
    localStorage.setItem('ccc_events', JSON.stringify(events));
    localStorage.setItem('ccc_student', JSON.stringify(student));
    localStorage.setItem('ccc_applications', JSON.stringify(applications));
    localStorage.setItem('ccc_announcements', JSON.stringify(announcements));
    localStorage.setItem('ccc_reels', JSON.stringify(reels));
  }, [currentPage, theme, events, student, applications, announcements, reels]);

  // Toast System
  const addToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // State Modification Procedures
  const registerForEvent = (eventId) => {
    if (student.registeredEvents.includes(eventId)) return;
    
    // Update student registrations
    const updatedRegistrations = [...student.registeredEvents, eventId];
    setStudent({
      ...student,
      registeredEvents: updatedRegistrations,
      notifications: [
        `You have successfully registered for: ${events.find(e => e.id === eventId)?.title}`,
        ...student.notifications
      ]
    });
    addToast('Successfully registered for event! Verification loaded in your Dashboard.');
  };

  const addApplication = (newApp) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  const updateApplicationStatus = (appId, newStatus) => {
    setApplications((prev) => prev.map(app => {
      if (app.id === appId) {
        // If this is the current logged-in student, update their membership badge!
        if (app.name === student.name) {
          setStudent(prevStudent => ({
            ...prevStudent,
            status: newStatus === 'Approved' ? 'Active Core Member' : prevStudent.status,
            notifications: [
              `Your recruitment application (${appId}) status updated: ${newStatus}`,
              ...prevStudent.notifications
            ]
          }));
        }
        return { ...app, status: newStatus };
      }
      return app;
    }));
  };

  const addEvent = (newEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const updateFeaturedReel = (newReelData) => {
    setReels(prev => ({
      ...prev,
      current: newReelData
    }));
  };

  const broadcastAnnouncement = (newAnnouncement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    // Also notify student
    setStudent(prev => ({
      ...prev,
      notifications: [
        `Broadcast: ${newAnnouncement.title}`,
        ...prev.notifications
      ]
    }));
  };

  const issueCertificate = (newCert) => {
    setStudent(prev => ({
      ...prev,
      certificates: [newCert, ...prev.certificates],
      notifications: [
        `Congratulations! Verified credential issued: ${newCert.title}`,
        ...prev.notifications
      ]
    }));
  };

  const voteForNextReel = (topicId) => {
    setReels(prev => ({
      ...prev,
      votes: prev.votes.map(v => v.id === topicId ? { ...v, count: v.count + 1 } : v)
    }));
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'canvas' ? 'sketch' : 'canvas'));
    addToast(`Theme toggled to ${theme === 'canvas' ? 'Sunset Sketch 🎨' : 'Sunset Canvas 🌅'}`);
  };

  // Component page routing resolver
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} theme={theme} events={events} team={team} reels={reels} />;
      case 'events':
        return <Events events={events} registerForEvent={registerForEvent} student={student} theme={theme} addToast={addToast} />;
      case 'team':
        return <Team team={team} theme={theme} />;
      case 'reel':
        return <ReelOfTheMonth reels={reels} voteForNextReel={voteForNextReel} theme={theme} addToast={addToast} />;
      case 'join':
        return <JoinTeam applications={applications} addApplication={addApplication} theme={theme} addToast={addToast} />;
      case 'dashboard':
        return <Dashboard student={student} setStudent={setStudent} events={events} theme={theme} addToast={addToast} />;
      case 'gallery':
        return <Gallery theme={theme} />;
      case 'achievements':
        return <Achievements theme={theme} />;
      case 'announcements':
        return <Announcements announcements={announcements} theme={theme} />;
      case 'contact':
        return <ContactUs team={team} theme={theme} addToast={addToast} />;
      case 'admin':
        return (
          <AdminPanel
            events={events}
            addEvent={addEvent}
            applications={applications}
            updateApplicationStatus={updateApplicationStatus}
            reels={reels}
            updateFeaturedReel={updateFeaturedReel}
            announcements={announcements}
            broadcastAnnouncement={broadcastAnnouncement}
            student={student}
            issueCertificate={issueCertificate}
            theme={theme}
            addToast={addToast}
          />
        );
      default:
        return <Home setCurrentPage={setCurrentPage} theme={theme} events={events} team={team} reels={reels} />;
    }
  };

  return (
    <div className={theme === 'sketch' ? 'theme-sketch theme-sketch-bg' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        theme={theme}
        toggleTheme={toggleTheme}
        student={student}
      />

      {/* Primary Page Canvas */}
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer setCurrentPage={setCurrentPage} theme={theme} />

      {/* Floating alert/toasts */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map((t) => (
          <div key={t.id} className="alert-toast">
            <span style={{ fontSize: '1.2rem' }}>✨</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
