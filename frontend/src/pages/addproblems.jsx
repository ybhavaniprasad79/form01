import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Key, AlertTriangle, FileText, Check, Plus, RefreshCw, Trash2, Edit, Users, Eye } from "lucide-react";

const VIEW_MODES = {
  problems: "problems",
  students: "students",
};

const ADMIN_KEY_STORAGE = "adminConsole.adminKey";
const ADMIN_VIEW_STORAGE = "adminConsole.viewMode";
const MAX_TEAMS_PER_PROBLEM = 7;

const AddProblems = () => {
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [viewMode, setViewMode] = useState(VIEW_MODES.problems);

  const [didRestoreKey, setDidRestoreKey] = useState(false);
  const [didAutoVerify, setDidAutoVerify] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_KEY_STORAGE);
    const normalized = (stored || "").trim();
    if (normalized) setPassword(normalized);
    const storedView = (localStorage.getItem(ADMIN_VIEW_STORAGE) || "").trim();
    if (storedView && Object.values(VIEW_MODES).includes(storedView)) {
      setViewMode(storedView);
    }
    setDidRestoreKey(true);
  }, []);

  useEffect(() => {
    if (!didRestoreKey) return;
    localStorage.setItem(ADMIN_VIEW_STORAGE, viewMode);
  }, [viewMode, didRestoreKey]);

  useEffect(() => {
    if (!didRestoreKey) return;
    if (didAutoVerify) return;
    if (isVerified) return;

    const normalized = password.trim();
    if (!normalized) return;

    setDidAutoVerify(true);
    setIsVerifying(true);
    setVerifyError("");
    setSaveMessage("");

    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: normalized }),
          },
        );
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          setVerifyError(data?.message || "Invalid admin key.");
          setIsVerified(false);
          return;
        }

        localStorage.setItem(ADMIN_KEY_STORAGE, normalized);
        setIsVerified(true);
      } catch {
        setVerifyError("Unable to connect to the server.");
        setIsVerified(false);
      } finally {
        setIsVerifying(false);
      }
    })();
  }, [didRestoreKey, didAutoVerify, isVerified, password]);

  const [activeModal, setActiveModal] = useState(null); // null | create | edit

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [problemsEnabled, setProblemsEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const [problems, setProblems] = useState([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [problemsLoadError, setProblemsLoadError] = useState("");

  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamsLoadError, setTeamsLoadError] = useState("");

  const [teamSearch, setTeamSearch] = useState("");
  const [studentProblemPopup, setStudentProblemPopup] = useState(null);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return selectedTeams;

    return selectedTeams.filter((t) => {
      const teamName = String(t?.teamName || "").toLowerCase();
      const leaderName = String(t?.teamLeader?.name || "").toLowerCase();
      return teamName.includes(q) || leaderName.includes(q);
    });
  }, [selectedTeams, teamSearch]);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editShortDescription, setEditShortDescription] = useState("");
  const [editFullDescription, setEditFullDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const canSave = useMemo(() => {
    return Boolean(
      title.trim() && shortDescription.trim() && isVerified && !isSaving,
    );
  }, [title, shortDescription, isVerified, isSaving]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyError("");
    setSaveMessage("");

    const normalized = password.trim();
    if (!normalized) {
      setVerifyError("Enter admin key.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: normalized }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setVerifyError(data?.message || "Invalid admin key.");
        setIsVerified(false);
        return;
      }

      localStorage.setItem(ADMIN_KEY_STORAGE, normalized);
      setIsVerified(true);
    } catch {
      setVerifyError("Unable to connect to the server.");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const loadConfigAndProblems = async () => {
    setProblemsLoadError("");
    setToggleError("");
    setIsLoadingProblems(true);
    try {
      const [configRes, problemsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/problems/config`),
        fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/problems?password=${encodeURIComponent(
            password.trim(),
          )}`,
        ),
      ]);

      const configData = await configRes.json().catch(() => null);
      if (configRes.ok && configData?.success) {
        setProblemsEnabled(Boolean(configData.enabled));
      }

      const problemsData = await problemsRes.json().catch(() => null);
      if (
        !problemsRes.ok ||
        !problemsData?.success ||
        !Array.isArray(problemsData?.data)
      ) {
        setProblemsLoadError(
          problemsData?.message || "Failed to load problem statements.",
        );
        setProblems([]);
        return;
      }

      setProblems(problemsData.data);
    } catch {
      setProblemsLoadError("Unable to connect to the server.");
      setProblems([]);
    } finally {
      setIsLoadingProblems(false);
    }
  };

  useEffect(() => {
    if (!isVerified) return;
    if (viewMode === VIEW_MODES.problems) loadConfigAndProblems();
    if (viewMode === VIEW_MODES.students) loadSelectedTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified, viewMode]);

  const loadSelectedTeams = async () => {
    setTeamsLoadError("");
    setIsLoadingTeams(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/selected?password=${encodeURIComponent(
          password.trim(),
        )}`,
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !Array.isArray(data?.data)) {
        setTeamsLoadError(data?.message || "Failed to load teams.");
        setSelectedTeams([]);
        return;
      }

      setSelectedTeams(data.data);
    } catch {
      setTeamsLoadError("Unable to connect to the server.");
      setSelectedTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleToggleProblems = async (nextEnabled) => {
    setToggleError("");
    setIsToggling(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/problems/config`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            enabled: nextEnabled,
          }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setToggleError(data?.message || "Failed to update toggle.");
        return;
      }

      setProblemsEnabled(Boolean(data.enabled));
    } catch {
      setToggleError("Unable to connect to the server.");
    } finally {
      setIsToggling(false);
    }
  };

  const startEditing = (p) => {
    setUpdateError("");
    setEditingId(p._id);
    setEditTitle(String(p.title || ""));
    setEditShortDescription(String(p.shortDescription || ""));
    setEditFullDescription(String(p.fullDescription || ""));
    setActiveModal("edit");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditShortDescription("");
    setEditFullDescription("");
    setUpdateError("");
    setActiveModal(null);
  };

  const showStudents = () => {
    setActiveModal(null);
    setSaveError("");
    setSaveMessage("");
    setUpdateError("");
    setProblemsLoadError("");
    setToggleError("");
    setTeamSearch("");
    setStudentProblemPopup(null);
    setViewMode(VIEW_MODES.students);
  };

  const showProblems = () => {
    setTeamsLoadError("");
    setStudentProblemPopup(null);
    setViewMode(VIEW_MODES.problems);
  };

  const openCreate = () => {
    setSaveError("");
    setSaveMessage("");
    setActiveModal("create");
  };

  const closeCreate = () => {
    setActiveModal(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateError("");
    if (!editingId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/problems/${encodeURIComponent(editingId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            title: editTitle.trim(),
            shortDescription: editShortDescription.trim(),
            fullDescription: editFullDescription.trim(),
          }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setUpdateError(data?.message || "Failed to update problem statement.");
        return;
      }

      await loadConfigAndProblems();
      cancelEditing();
    } catch {
      setUpdateError("Unable to connect to the server.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    setUpdateError("");

    const ok = window.confirm("Delete this problem statement?");
    if (!ok) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/problems/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        setUpdateError(data?.message || "Failed to delete problem statement.");
        return;
      }

      if (editingId === id) cancelEditing();
      await loadConfigAndProblems();
    } catch {
      setUpdateError("Unable to connect to the server.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveMessage("");

    if (!canSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/problems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            title: title.trim(),
            shortDescription: shortDescription.trim(),
            fullDescription: fullDescription.trim(),
          }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setSaveError(data?.message || "Failed to save problem statement.");
        return;
      }

      setSaveMessage("Problem statement added.");
      setTitle("");
      setShortDescription("");
      setFullDescription("");

      await loadConfigAndProblems();
      setActiveModal(null);
    } catch {
      setSaveError("Unable to connect to the server.");
    } finally {
      setIsSaving(false);
    }
  };

  const getProblemDifficulty = (id, title) => {
    const val = (title.length + id.charCodeAt(id.length - 1)) % 3;
    if (val === 0) return { label: "HARD", color: "bg-comic-red text-white" };
    if (val === 1) return { label: "MEDIUM", color: "bg-comic-orange text-black" };
    return { label: "EASY", color: "bg-comic-lime text-black" };
  };

  return (
    <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-16 text-black">
      <Navbar />
      <div className="max-w-6xl mx-auto w-full px-4 mt-8 flex-grow">
        
        {/* Simple Page Header */}
        <div className="relative mb-8 text-center">
          <div className="bg-white border-3 border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0_#000] inline-block">
            <h2 className="font-luckiest text-2xl md:text-4xl text-black tracking-wide leading-none">
              PROBLEM VAULT PANEL
            </h2>
            <p className="font-bangers text-sm text-comic-red tracking-widest mt-1 uppercase">
              DOSSIER CONFIGURATION CONSOLE
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {problemsLoadError && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 bg-comic-red border-3 border-black rounded-2xl p-4 text-white font-bangers text-base shadow-[3px_3px_0_#000]"
            >
              💥 ERROR: {problemsLoadError}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {updateError && (
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-5 bg-comic-red border-3 border-black rounded-2xl p-4 text-white font-bangers text-base shadow-[3px_3px_0_#000]"
            >
              💥 ERROR: {updateError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password Accreditation Gate */}
        {!isVerified ? (
          <div className="min-h-[calc(100vh-260px)] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              className="relative w-full max-w-lg bg-white border-3 border-black rounded-2xl p-6 md:p-8 shadow-[4px_4px_0_#000] overflow-hidden bg-halftone-dots-white text-center"
            >
              <div className="absolute top-0 right-0 bg-comic-red border-b-3 border-l-3 border-black px-4 py-1 text-white font-bangers text-xs rounded-tr-2xl">
                COMMAND SECURE
              </div>

              <div className="relative text-center mt-4">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-comic-yellow border-3 border-black shadow-[2px_2px_0_#000] mb-3">
                  <Shield size={22} className="stroke-[2.5] text-black" />
                </div>
                <h1 className="text-3xl font-luckiest text-black tracking-tight leading-none mb-1">
                  ADMIN PASSCODE
                </h1>
                <p className="text-xs font-semibold text-gray-700 max-w-xs mx-auto">
                  Provide validation keys to manage the active hackathon problem statements.
                </p>
              </div>

              <form onSubmit={handleVerify} className="relative mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                    ADMIN VAULT PASSWORD
                  </label>
                  <input
                    type="password"
                    className="w-full h-11 comic-input bg-gray-50 text-black border-3 border-black rounded-lg px-4 font-luckiest tracking-wide focus:bg-comic-yellow/10"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <AnimatePresence>
                  {verifyError && (
                    <motion.div 
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-xl border-3 border-black bg-comic-red p-3 text-white font-bangers text-sm shadow-[2px_2px_0_#000]"
                    >
                      💥 OOPS! {verifyError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  type="submit"
                  disabled={isVerifying}
                  className="w-full h-12 rounded-xl text-lg flex items-center justify-center gap-2 comic-btn-primary"
                >
                  {isVerifying ? "UNLOCKING PORTALS..." : "OPEN PROBLEM PANEL"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* Main console view */
          <div className="space-y-6">
            
            {/* Top Toolbar */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-3 border-black p-5 rounded-2xl shadow-[4px_4px_0_#000] relative bg-halftone-dots-white">
              <div className="space-y-0.5 text-left">
                <div className="text-xl font-luckiest text-black tracking-wider leading-none">
                  ADMIN CONSOLE DECK
                </div>
                <div className="font-bangers text-xs text-comic-red tracking-widest uppercase mt-1">
                  MANAGE MISSION FILES & TEAM SELECTIONS
                </div>
              </div>

              {/* Action Buttons styled as stickers */}
              <div className="flex flex-wrap items-center gap-2.5 font-bangers text-base">
                {viewMode === VIEW_MODES.problems ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      type="button"
                      onClick={openCreate}
                      className="bg-comic-lime text-black border-3 border-black rounded-xl px-4 py-1.5 shadow-[2px_2px_0_#000] cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={14} /> ADD DOSSIER
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      type="button"
                      onClick={showStudents}
                      className="bg-comic-cyan text-black border-3 border-black rounded-xl px-4 py-1.5 shadow-[2px_2px_0_#000] cursor-pointer flex items-center gap-1"
                    >
                      <Users size={14} /> TEAM ROSTERS
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      type="button"
                      onClick={loadConfigAndProblems}
                      disabled={isLoadingProblems}
                      className="bg-white text-black border-3 border-black rounded-xl px-4 py-1.5 shadow-[2px_2px_0_#000] cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} className={isLoadingProblems ? "animate-spin" : ""} /> REFRESH
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      type="button"
                      onClick={showProblems}
                      className="bg-comic-yellow text-black border-3 border-black rounded-xl px-4 py-1.5 shadow-[2px_2px_0_#000] cursor-pointer flex items-center gap-1"
                    >
                      <FileText size={14} /> DOSSIERS VAULT
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      type="button"
                      onClick={loadSelectedTeams}
                      disabled={isLoadingTeams}
                      className="bg-white text-black border-3 border-black rounded-xl px-4 py-1.5 shadow-[2px_2px_0_#000] cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} className={isLoadingTeams ? "animate-spin" : ""} /> REFRESH
                    </motion.button>
                  </>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-comic-green/10 border-2 border-black px-3 py-1 font-bangers text-xs shadow-[1.5px_1.5px_0_#000]">
                  <span className="h-2 w-2 rounded-full bg-comic-green" />
                  AUTHENTICATED
                </span>
              </div>
            </header>

            {/* ----------------- PROBLEMS TAB ----------------- */}
            {viewMode === VIEW_MODES.problems && (
              <div className="space-y-6">
                
                {/* Enable toggle control widget */}
                <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-left">
                  <div className="absolute top-0 right-0 bg-comic-cyan border-b-3 border-l-3 border-black px-4 py-0.5 text-black font-bangers text-[10px] rounded-tr-2xl">
                    ACTIVE CONTROLS
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                    <div>
                      <h3 className="text-xl font-luckiest text-black">STUDENT ACCESS LINK</h3>
                      <p className="text-xs font-semibold text-gray-700">Toggle whether problem statements are visible for students to lock onto.</p>
                    </div>

                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <span className="font-luckiest text-base text-black">
                        {problemsEnabled ? "ACTIVE!" : "DISABLED!"}
                      </span>
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleProblems(!problemsEnabled)}
                        className={`relative inline-flex h-9 w-18 items-center rounded-full border-3 border-black transition ${
                          problemsEnabled ? "bg-comic-green" : "bg-comic-red"
                        }`}
                        aria-label="Toggle problem statements"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white border-2 border-black transition-transform ${
                            problemsEnabled ? "translate-x-9" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  {toggleError && (
                    <div className="mt-3 bg-comic-red border-3 border-black rounded-lg p-2.5 text-white font-bangers text-xs shadow-[1.5px_1.5px_0_#000]">
                      💥 OOPS! {toggleError}
                    </div>
                  )}
                </div>

                {/* List of Problem Statements as Comic Mission Folders */}
                <div className="bg-white border-3 border-black rounded-2xl p-5 md:p-6 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-left">
                  <div className="absolute top-0 right-0 bg-comic-purple border-b-3 border-l-3 border-black px-4 py-0.5 text-white font-bangers text-[10px] rounded-tr-2xl">
                    MISSION FILES
                  </div>
                  
                  <h3 className="text-2xl font-luckiest text-black mb-5">ALL ACTIVE MISSION FILES</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {problems.length ? (
                      problems.map((p) => {
                        const difficulty = getProblemDifficulty(p._id, p.title);
                        const slotsLeft = MAX_TEAMS_PER_PROBLEM - (p.slotsTaken || 0);

                        return (
                          /* Problem Card Styled like a Top Secret Folder File */
                          <div
                            key={p._id}
                            className="bg-white border-3 border-black rounded-2xl p-5 shadow-[3px_3px_0_#000] relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#000] flex flex-col justify-between"
                          >
                            <div className="absolute top-0 right-0 bg-comic-yellow border-b-2 border-l-2 border-black px-3 py-0.5 font-bangers text-[9px] text-black">
                              CLASSIFIED
                            </div>

                            <div className="space-y-2 text-left">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`font-bangers text-[10px] px-2 py-0.25 border border-black rounded shadow-[1px_1px_0_#000] ${difficulty.color}`}>
                                  {difficulty.label}
                                </span>
                                <span className="font-bangers text-[10px] bg-comic-cyan border border-black text-black px-2 py-0.25 rounded shadow-[1px_1px_0_#000]">
                                  SLOTS LEFT: {slotsLeft}
                                </span>
                              </div>

                              <h4 className="font-luckiest text-base text-black leading-tight tracking-wide border-b-2 border-black pb-1">
                                {p.title}
                              </h4>
                              
                              <p className="text-xs font-semibold text-gray-700 leading-relaxed font-comic line-clamp-3 mb-3">
                                {p.shortDescription}
                              </p>
                            </div>

                            {/* Edit / Delete Action buttons */}
                            <div className="flex items-center gap-2.5 mt-3 pt-2 border-t border-gray-200 font-bangers text-xs">
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                type="button"
                                onClick={() => startEditing(p)}
                                className="flex-1 bg-comic-cyan hover:bg-[#1eb6e5] text-black border-2 border-black rounded-lg py-1 shadow-[1.5px_1.5px_0_#000] cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Edit size={12} /> EDIT FILE
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                type="button"
                                onClick={() => handleDelete(p._id)}
                                className="flex-1 bg-comic-red hover:bg-[#eb2419] text-white border-2 border-black rounded-lg py-1 shadow-[1.5px_1.5px_0_#000] cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Trash2 size={12} /> SCRAP FILE
                              </motion.button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 border-2 border-dashed border-black rounded-2xl p-6 text-center bg-gray-50">
                        <p className="font-luckiest text-base text-black">NO ACTIVE MISSIONS LOGGED</p>
                        <p className="text-xs font-semibold text-gray-500 mt-1">Click the "ADD DOSSIER" button above to log a new problem folder.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TEAMS TAB ----------------- */}
            {viewMode === VIEW_MODES.students && (
              <div className="bg-white border-3 border-black rounded-2xl p-5 md:p-6 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-left">
                <div className="absolute top-0 right-0 bg-comic-purple border-b-3 border-l-3 border-black px-4 py-0.5 text-white font-bangers text-[10px] rounded-tr-2xl">
                  TEAM FILES
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-2xl font-luckiest text-black">ALLIANCE TARGET LOGS</h3>
                    <p className="text-xs font-semibold text-gray-700">Check team coordinates and active target choices.</p>
                  </div>
                  <div className="font-bangers text-base bg-comic-yellow border-2 border-black rounded-xl px-3.5 py-0.5 shadow-[1.5px_1.5px_0_#000]">
                    TOTAL TEAMS: {selectedTeams.length}
                  </div>
                </div>

                {/* Team Search filter input */}
                <div className="mb-5">
                  <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                    SEARCH REGISTERED ALLIANCES
                  </label>
                  <input
                    className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-4 focus:bg-comic-yellow/10 font-semibold text-sm"
                    placeholder="Search by team title or leader name..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    autoComplete="off"
                  />
                  <div className="mt-1.5 text-xs font-bangers text-gray-500 tracking-wider">
                    FILTERING SHOWS: {filteredTeams.length} OF {selectedTeams.length} FILES
                  </div>
                </div>

                {/* Verification Table */}
                <div className="overflow-x-auto border-3 border-black rounded-xl shadow-[3px_3px_0_#000] bg-white">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-comic-blue border-b-3 border-black text-white font-bangers text-sm tracking-wider">
                        <th className="px-3.5 py-2.5 text-left border-r-2 border-black">ALLIANCE TEAM NAME</th>
                        <th className="px-3.5 py-2.5 text-left border-r-2 border-black">TEAM LEADER</th>
                        <th className="px-3.5 py-2.5 text-left border-r-2 border-black">SELECTED MISSION DOSSIER</th>
                        <th className="px-3.5 py-2.5 text-center border-r-2 border-black">TIME SECURED</th>
                        <th className="px-3.5 py-2.5 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeams.length ? (
                        filteredTeams.map((t, idx) => {
                          const problemTitle =
                            t?.selectedProblemStatement?.title ||
                            t?.selectedProblemStatement?.name ||
                            "-";
                          return (
                            <tr 
                              key={t._id} 
                              className={`border-b-2 border-black hover:bg-[#fffbe6] transition-colors ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <td className="px-3 py-3 border-r-2 border-black font-luckiest text-black">{t.teamName}</td>
                              <td className="px-3 py-3 border-r-2 border-black font-semibold text-gray-800">{t?.teamLeader?.name || "-"}</td>
                              <td className="px-3 py-3 border-r-2 border-black font-semibold text-[11px] text-gray-700">{problemTitle}</td>
                              <td className="px-3 py-3 border-r-2 border-black text-center font-bangers text-[10px] text-gray-500 tracking-wider">
                                {t?.selectedProblemSelectedAt
                                  ? new Date(t.selectedProblemSelectedAt).toLocaleString()
                                  : "-"}
                              </td>
                              <td className="px-3 py-3 text-center font-bangers text-[10px]">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  type="button"
                                  onClick={() => {
                                    const problem = t?.selectedProblemStatement;
                                    if (!problem || typeof problem !== "object") return;
                                    setStudentProblemPopup({
                                      teamName: t?.teamName || "",
                                      leaderName: t?.teamLeader?.name || "",
                                      selectedAt: t?.selectedProblemSelectedAt || null,
                                      problem,
                                    });
                                  }}
                                  className="bg-comic-blue hover:bg-blue-600 text-white border-2 border-black rounded px-2.5 py-0.5 shadow-[1.5px_1.5px_0_#000] cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye size={10} /> DOSSIER
                                </motion.button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500 font-bangers tracking-wide uppercase">
                            {isLoadingTeams
                              ? "LOADING TEAM TARGET FILES..."
                              : selectedTeams.length
                                ? "NO ALLIANCE MEETS QUERY PARAMETERS"
                                : "NO ALLIANCE HAS LOCKED A DOSSIER YET"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Back button */}
            <div className="mt-8 text-center">
              <motion.a
                whileHover={{ scale: 1.02 }}
                href="/"
                className="inline-block bg-white border-3 border-black rounded-xl px-5 py-1.5 font-luckiest text-xs text-black shadow-[3px_3px_0_#000] hover:bg-gray-50 transition"
              >
                ← BACK TO LAUNCH DECK
              </motion.a>
            </div>

          </div>
        )}
      </div>

      {/* 1. Student problem statement details modal (speech bubble style) */}
      <AnimatePresence>
        {viewMode === VIEW_MODES.students && studentProblemPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setStudentProblemPopup(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white border-3 border-black rounded-2xl p-5 shadow-[6px_6px_0_#000] bg-halftone-dots-white max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-3 mb-3 text-left">
                <div>
                  <span className="font-bangers text-[10px] text-comic-red uppercase leading-none block mb-0.5">
                    ALLIANCE COORDINATE LOCK: {studentProblemPopup.teamName}
                  </span>
                  <h3 className="text-xl font-luckiest tracking-wide text-black leading-tight">
                    {studentProblemPopup.problem?.title || "Problem Statement"}
                  </h3>
                  {studentProblemPopup.leaderName && (
                    <p className="text-xs font-semibold text-gray-500 mt-1">Leader: {studentProblemPopup.leaderName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStudentProblemPopup(null)}
                  className="bg-comic-red text-white border-2 border-black font-bangers text-base rounded w-7 h-7 flex items-center justify-center shadow-[1.5px_1.5px_0_#000] cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-gray-800 leading-relaxed font-comic text-left">
                <div className="bg-comic-yellow/5 border border-dashed border-black p-3 rounded-lg">
                  <span className="font-bangers text-[10px] text-comic-red block mb-0.5">OBJECTIVE SUMMARY</span>
                  <p>{studentProblemPopup.problem.shortDescription}</p>
                </div>
                {studentProblemPopup.problem.fullDescription && (
                  <div className="bg-gray-50 border border-black p-3 rounded-lg">
                    <span className="font-bangers text-[10px] text-gray-500 block mb-0.5">FULL DOSSIER DETAILS</span>
                    <p className="whitespace-pre-wrap">{studentProblemPopup.problem.fullDescription}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end font-bangers text-base">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  type="button"
                  onClick={() => setStudentProblemPopup(null)}
                  className="bg-white border-3 border-black rounded-lg px-4 py-1.5 shadow-[2px_2px_0_#000] hover:bg-gray-50 text-black cursor-pointer"
                >
                  CLOSE
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Admin Create/Edit Modal (explosive scale-up dialog) */}
      <AnimatePresence>
        {viewMode === VIEW_MODES.problems && activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => (activeModal === "edit" ? cancelEditing() : closeCreate())}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white border-3 border-black rounded-2xl p-5 shadow-[6px_6px_0_#000] bg-halftone-dots-white max-h-[85vh] overflow-y-auto text-left"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-3 mb-4">
                <div>
                  <span className="font-bangers text-[10px] text-comic-red uppercase leading-none block mb-0.5">
                    ADMIN DOSSIER OVERRIDE
                  </span>
                  <h3 className="text-xl font-luckiest tracking-wide text-black leading-tight">
                    {activeModal === "edit" ? "EDIT PROBLEM DOSSIER" : "CREATE NEW DOSSIER"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => (activeModal === "edit" ? cancelEditing() : closeCreate())}
                  className="bg-comic-red text-white border-2 border-black font-bangers text-base rounded w-7 h-7 flex items-center justify-center shadow-[1.5px_1.5px_0_#000] cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Form Content */}
              {activeModal === "create" ? (
                <form onSubmit={handleSave} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      DOSSIER TITLE
                    </label>
                    <input
                      className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-3.5 focus:bg-comic-yellow/10 font-semibold"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Secure Vault Protocol Challenge"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      SHORT SUMMARY (SHOWN ON TRADING CARDS)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border-3 border-black bg-gray-50 px-3 py-2 focus:bg-comic-yellow/10 font-semibold"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="A short summary of target objectives..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      FULL INSTRUCTION SHEET (DOSSIER POPUP VIEW)
                    </label>
                    <textarea
                      rows={5}
                      className="w-full rounded-lg border-3 border-black bg-gray-50 px-3 py-2 focus:bg-comic-yellow/10 font-semibold"
                      value={fullDescription}
                      onChange={(e) => setFullDescription(e.target.value)}
                      placeholder="Detailed target specifications and guidelines..."
                    />
                  </div>

                  {saveError && (
                    <div className="bg-comic-red border-3 border-black rounded-lg p-2.5 text-white font-bangers text-xs shadow-[1.5px_1.5px_0_#000]">
                      💥 OOPS! {saveError}
                    </div>
                  )}

                  {saveMessage && (
                    <div className="bg-comic-lime border-3 border-black rounded-lg p-2.5 text-black font-bangers text-xs shadow-[1.5px_1.5px_0_#000]">
                      🔥 SUCCESS: {saveMessage}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 font-bangers text-base pt-3 border-t-2 border-black">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      type="button"
                      onClick={closeCreate}
                      className="bg-white border-3 border-black rounded-lg px-4.5 py-1 shadow-[2px_2px_0_#000] hover:bg-gray-50 text-black cursor-pointer"
                    >
                      ABORT
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      type="submit"
                      disabled={!canSave}
                      className={`border-3 border-black rounded-lg px-5 py-1.5 shadow-[2px_2px_0_#000] cursor-pointer ${
                        canSave ? "bg-comic-lime text-black hover:bg-comic-green" : "bg-gray-200 text-gray-400 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      {isSaving ? "LOGGING DOSSIER..." : "✓ CREATE DOSSIER"}
                    </motion.button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      DOSSIER TITLE
                    </label>
                    <input
                      className="w-full h-10 comic-input bg-gray-50 border-3 border-black rounded-lg px-3.5 focus:bg-comic-yellow/10 font-semibold"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      SHORT SUMMARY (SHOWN ON TRADING CARDS)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border-3 border-black bg-gray-50 px-3 py-2 focus:bg-comic-yellow/10 font-semibold"
                      value={editShortDescription}
                      onChange={(e) => setEditShortDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bangers tracking-wider text-black mb-1">
                      FULL INSTRUCTION SHEET (DOSSIER POPUP VIEW)
                    </label>
                    <textarea
                      rows={5}
                      className="w-full rounded-lg border-3 border-black bg-gray-50 px-3 py-2 focus:bg-comic-yellow/10 font-semibold"
                      value={editFullDescription}
                      onChange={(e) => setEditFullDescription(e.target.value)}
                    />
                  </div>

                  {updateError && (
                    <div className="bg-comic-red border-3 border-black rounded-lg p-2.5 text-white font-bangers text-xs shadow-[1.5px_1.5px_0_#000]">
                      💥 OOPS! {updateError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 font-bangers text-base pt-3 border-t-2 border-black">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      type="button"
                      onClick={cancelEditing}
                      className="bg-white border-3 border-black rounded-lg px-4.5 py-1 shadow-[2px_2px_0_#000] hover:bg-gray-50 text-black cursor-pointer"
                    >
                      ABORT
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      type="submit"
                      disabled={isUpdating}
                      className="bg-comic-cyan hover:bg-[#1eb4e3] text-black border-3 border-black rounded-lg px-5 py-1.5 shadow-[2px_2px_0_#000] cursor-pointer"
                    >
                      {isUpdating ? "UPDATING DOSSIER..." : "✓ SAVE CHANGES"}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddProblems;
