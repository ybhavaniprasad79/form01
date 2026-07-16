import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Key, AlertTriangle, Key as KeyIcon, Clock, Check, Users } from "lucide-react";

const TEAM_KEY_STORAGE = "teamPanel.teamKey";
const MAX_TEAMS_PER_PROBLEM = 7;

const TeamPanel = () => {
  const [teamKey, setTeamKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [team, setTeam] = useState(null);
  const [view, setView] = useState("access"); // access | dashboard
  const [animateIn, setAnimateIn] = useState(false);
  const [didRestore, setDidRestore] = useState(false);
  const [problems, setProblems] = useState([]);
  const [didLoadProblems, setDidLoadProblems] = useState(false);
  const [areProblemsDisabled, setAreProblemsDisabled] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [detailsProblemId, setDetailsProblemId] = useState(null);
  const [isSelectedExpanded, setIsSelectedExpanded] = useState(false);
  const [expandedProblemId, setExpandedProblemId] = useState(null);
  const [problemsError, setProblemsError] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    setAnimateIn(false);
    const id = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(id);
  }, [view]);

  useEffect(() => {
    if (didRestore) return;
    setDidRestore(true);

    const storedKey = localStorage.getItem(TEAM_KEY_STORAGE);
    const normalized = (storedKey || "").trim();
    if (!normalized) return;

    setTeamKey(normalized);
    setIsLoading(true);
    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(normalized)}`,
        );
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          localStorage.removeItem(TEAM_KEY_STORAGE);
          return;
        }

        setTeam(data.data);
        const dbSelected = String(
          data?.data?.selectedProblemStatement || "",
        ).trim();
        if (dbSelected) {
          setSelectedProblemId(dbSelected);
        }
        setView("dashboard");
      } catch {
        // keep user on access screen
      } finally {
        setIsLoading(false);
      }
    })();
  }, [didRestore]);

  useEffect(() => {
    let cancelled = false;
    setProblemsError("");
    setDidLoadProblems(false);
    setAreProblemsDisabled(false);
    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/problems`,
        );
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data?.data)) {
          return;
        }

        if (data?.disabled && !cancelled) {
          setAreProblemsDisabled(true);
          setProblems([]);
          return;
        }

        if (!cancelled) setAreProblemsDisabled(false);

        const normalized = data.data
          .map((p) => ({
            id: String(p._id || ""),
            title: p.title || "",
            themePng: p.themePng || "",
            shortDescription: p.shortDescription || "",
            fullDescription: p.fullDescription || "",
            slotsTaken: Number(p.slotsTaken || 0),
            limit: Number(p.limit || 7),
          }))
          .filter((p) => p.id && p.title && p.shortDescription);

        if (!cancelled) {
          setProblems(normalized);
        }
      } catch {
        if (!cancelled) setProblemsError("");
      } finally {
        if (!cancelled) setDidLoadProblems(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!didLoadProblems) return;
    if (!selectedProblemId) return;
    if (areProblemsDisabled) return;
    const exists = problems.some((p) => p.id === selectedProblemId);
    if (exists) return;

    setSelectedProblemId(null);
  }, [didLoadProblems, problems, selectedProblemId, areProblemsDisabled]);

  const selectedProblem = useMemo(() => {
    return problems.find((p) => p.id === selectedProblemId) || null;
  }, [problems, selectedProblemId]);

  const detailsProblem = useMemo(() => {
    return problems.find((p) => p.id === detailsProblemId) || null;
  }, [problems, detailsProblemId]);

  const visibleProblems = useMemo(() => {
    if (selectedProblemId) return problems;
    return problems.filter((p) => (p.slotsTaken || 0) < (p.limit || MAX_TEAMS_PER_PROBLEM));
  }, [problems, selectedProblemId]);

  const members = useMemo(() => {
    if (!team) return [];

    const safe = (m) =>
      m
        ? {
          name: m.name || "",
          regNo: m.regNo ?? "",
          year: m.year || "",
          branch: m.branch || "",
          section: m.section || "",
        }
        : null;

    return [
      { role: "Team Leader", ...safe(team.teamLeader) },
      { role: "Team Member 1", ...safe(team.teamMember1) },
      { role: "Team Member 2", ...safe(team.teamMember2) },
      { role: "Team Member 3", ...safe(team.teamMember3) },
    ].filter((m) => m && m.name);
  }, [team]);

  const handleSubmitKey = async (e) => {
    e.preventDefault();
    setError("");

    const normalized = teamKey.trim();
    if (!normalized) {
      setError("Please enter your Team Key.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(normalized)}`,
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.message || "Invalid Team Key.");
        return;
      }

      setTeam(data.data);
      const dbSelected = String(
        data?.data?.selectedProblemStatement || "",
      ).trim();
      if (dbSelected) {
        setSelectedProblemId(dbSelected);
      }
      localStorage.setItem(TEAM_KEY_STORAGE, normalized);
      setView("dashboard");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setTeam(null);
    setTeamKey("");
    setError("");
    setSelectedProblemId(null);
    setDetailsProblemId(null);
    setIsSelectedExpanded(false);
    localStorage.removeItem(TEAM_KEY_STORAGE);
    setView("access");
  };

  const getProblemDifficulty = (id, title) => {
    const val = (title.length + id.charCodeAt(id.length - 1)) % 3;
    if (val === 0) return { label: "HARD", color: "bg-comic-red text-white" };
    if (val === 1) return { label: "MEDIUM", color: "bg-comic-orange text-black" };
    return { label: "EASY", color: "bg-comic-lime text-black" };
  };

  return (
    <div className="min-h-screen bg-comic-rays-blue bg-halftone-dots flex flex-col font-comic select-none pb-12 text-black">
      <Navbar />
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 mt-8">
        {view === "access" ? (
          /* Vault Access */
          <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              className="relative w-full max-w-lg bg-white border-3 border-black rounded-2xl p-6 md:p-8 shadow-[4px_4px_0_#000] overflow-hidden bg-halftone-dots-white text-center"
            >
              <div className="absolute top-0 right-0 bg-comic-red border-b-3 border-l-3 border-black px-4 py-1 text-white font-bangers text-xs rounded-tr-2xl">
                RESTRICTED VAULT
              </div>

              <div className="relative text-center mt-4">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-comic-yellow border-3 border-black shadow-[2px_2px_0_#000] mb-3">
                  <KeyIcon size={22} className="stroke-[2.5] text-black" />
                </div>
                <h1 className="text-3xl font-luckiest text-black tracking-tight leading-none mb-1">
                  TEAM LOG-IN
                </h1>
                <p className="text-xs font-semibold text-gray-700 max-w-xs mx-auto">
                  State your Alliance Key (Team Name) to synchronize control room screens.
                </p>
              </div>

              <form onSubmit={handleSubmitKey} className="mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bangers tracking-wider text-gray-700 mb-1">
                    TEAM KEY / REGISTERED NAME
                  </label>
                  <input
                    id="teamKey"
                    className="w-full h-11 comic-input bg-gray-50 text-black border-3 border-black rounded-lg px-4 font-luckiest tracking-wide focus:bg-comic-yellow/10"
                    placeholder="e.g., CODEWARRIORS"
                    value={teamKey}
                    onChange={(e) => setTeamKey(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-xl border-3 border-black bg-comic-red p-3.5 text-white font-bangers text-sm shadow-[2px_2px_0_#000]"
                    >
                      💥 OOPS! {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-lg flex items-center justify-center gap-2 comic-btn-primary"
                >
                  {isLoading ? "VERIFYING ALLIANCE..." : "ACCESS DASHBOARD"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* Control Room Dashboard */
          <div className="space-y-6">

            {/* Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border-3 border-black p-5 rounded-2xl shadow-[4px_4px_0_#000] relative bg-halftone-dots-white">
              <div className="space-y-0.5 text-left">
                <div className="text-2xl font-luckiest text-black tracking-wider leading-none">
                  WELCOME, {team?.teamName}!
                </div>
                <div className="font-bangers text-sm text-comic-red tracking-widest uppercase mt-0.5">
                  MISSION CONTROL STATION
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                type="button"
                onClick={handleLogout}
                className="rounded-xl px-4 py-1.5 text-base comic-btn-secondary"
              >
                LOGOUT
              </motion.button>
            </header>

            {/* Split layout grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column: Team Details & Payment Status */}
              <div className="lg:col-span-1 space-y-6">

                {/* 1. Team Details */}
                <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white">
                  <div className="absolute -top-4 left-6 bg-comic-cyan border-3 border-black text-black font-luckiest text-sm px-4 py-0.5 rounded-lg shadow-[2px_2px_0_#000]">
                    TEAM ROSTER
                  </div>

                  <div className="mt-3 space-y-3.5">
                    <div className="flex justify-between items-center bg-gray-50 border-2 border-black rounded-lg p-2.5">
                      <div>
                        <span className="font-bangers text-[10px] text-gray-500 block leading-none">ALLIANCE NAME</span>
                        <span className="font-luckiest text-base text-black">{team?.teamName}</span>
                      </div>
                      <div className="bg-comic-yellow border-2 border-black rounded-lg p-1.5 shadow-[1.5px_1.5px_0_#000]">
                        <Users size={16} />
                      </div>
                    </div>

                    {/* Member list */}
                    <div className="space-y-2.5 font-semibold text-gray-800">
                      {members.map((m, idx) => (
                        <div
                          key={`${m.role}-${m.regNo}`}
                          className={`flex items-center gap-2.5 border-2 border-black p-2.5 rounded-lg shadow-[1.5px_1.5px_0_#000] ${m.role === "Team Leader" ? "bg-comic-lime/10" : "bg-white"
                            }`}
                        >
                          <div className={`w-8 h-8 border-2 border-black rounded-full flex items-center justify-center font-luckiest text-xs ${m.role === "Team Leader" ? "bg-comic-lime" : "bg-comic-cyan"
                            }`}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-grow text-left">
                            <div className="flex items-center justify-between gap-1 leading-none">
                              <span className="truncate text-xs font-luckiest tracking-wide text-black">{m.name}</span>
                              <span className={`text-[9px] font-bangers border border-black px-1.5 py-0.25 rounded ${m.role === "Team Leader" ? "bg-comic-lime text-black" : "bg-gray-100"
                                }`}>
                                {m.role === "Team Leader" ? "LEADER" : `ALLY ${idx}`}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-comic font-bold leading-none mt-1.5">
                              REG: {m.regNo} • YR: {m.year} • {m.branch}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Payment Mission Status */}
                <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white">
                  <div className="absolute -top-4 left-6 bg-comic-purple border-3 border-black text-white font-luckiest text-sm px-4 py-0.5 rounded-lg shadow-[2px_2px_0_#000]">
                    DEPOSIT CHECK
                  </div>

                  <div className="mt-3 flex flex-col items-center">
                    <span className="font-bangers text-[10px] text-gray-500 mb-3.5 block leading-none">VERIFICATION SCAN STATUS</span>

                    {team?.payment?.status === "verified" ? (
                      <div className="speech-bubble speech-bubble-bottom bg-comic-green text-black px-4 py-3 w-full text-center shadow-[3px_3px_0_#111] mb-2.5">
                        <Check size={22} className="mx-auto mb-0.5 stroke-[3]" />
                        <h4 className="font-luckiest text-lg">VERIFIED!</h4>
                        <p className="font-bangers text-[10px] text-gray-800 tracking-wider mt-0.5">ACCESS TO PROBLEM PORTAL UNLOCKED!</p>
                      </div>
                    ) : team?.payment?.status === "rejected" ? (
                      <div className="speech-bubble speech-bubble-bottom bg-coral-orange text-white px-4 py-3 w-full text-center shadow-[3px_3px_0_#111] mb-2.5">
                        <AlertTriangle size={22} className="mx-auto mb-0.5 stroke-[2.5]" />
                        <h4 className="font-luckiest text-lg">REJECTED!</h4>
                        <p className="font-bangers text-[10px] text-red-200 tracking-wider mt-0.5">SUBMIT CORRECT RECEIPT ON REGISTRATION DESK.</p>
                      </div>
                    ) : (
                      <div className="speech-bubble speech-bubble-bottom bg-bright-orange text-white px-4 py-3 w-full text-center shadow-[3px_3px_0_#111] mb-2.5">
                        <Clock size={22} className="mx-auto mb-0.5 stroke-[2.5]" />
                        <h4 className="font-luckiest text-lg">PENDING...</h4>
                        <p className="font-bangers text-[10px] text-orange-100 tracking-wider mt-0.5">REVENUE SENSORS SCANNING TRANSACTION PROOF.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Problem dossiers */}
              <div className="lg:col-span-2 space-y-6">

                <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[4px_4px_0_#000] relative bg-halftone-dots-white text-left">
                  <div className="absolute -top-4 left-6 bg-comic-orange border-3 border-black text-white font-luckiest text-sm px-4 py-0.5 rounded-lg shadow-[2px_2px_0_#000]">
                    {selectedProblemId ? "MISSION FILE LOCKED" : "MISSION SELECTION"}
                  </div>

                  <div className="mt-3 mb-3">
                    <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                      {selectedProblemId
                        ? "Your alliance has successfully locked down a hackathon mission file. Proceed to coordinate configurations!"
                        : `Review dossiers below and select details. Limit cap is ${MAX_TEAMS_PER_PROBLEM} teams per statement folder. Once locked, it cannot be changed.`}
                    </p>
                  </div>

                  {problemsError && (
                    <div className="mb-4 bg-comic-red border-3 border-black rounded-lg p-2.5 text-white font-bangers text-xs shadow-[1.5px_1.5px_0_#000]">
                      💥 OOPS! {problemsError}
                    </div>
                  )}

                  {/* Selected topic panel */}
                  {selectedProblem ? (
                    <motion.div
                      layout
                      onClick={() => setIsSelectedExpanded((v) => !v)}
                      className="cursor-pointer border-3 border-black rounded-xl bg-comic-yellow/5 p-5 shadow-[2px_2px_0_#000] border-dashed hover:bg-comic-yellow/10 transition-colors relative"
                    >
                      <div className="absolute -top-3 right-4 bg-comic-red border border-black text-white font-bangers text-[10px] px-2 py-0.5 rounded rotate-3">
                        LOCKED TARGET!
                      </div>

                      <div className="space-y-3 text-center">
                        <div className="font-luckiest text-xl text-black">
                          {selectedProblem.title}
                        </div>
                        {selectedProblem.themePng && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(selectedProblem.themePng); }}
                            className="mx-auto w-32 h-32 border-2 border-black rounded-full overflow-hidden bg-gray-100 shadow-[2px_2px_0_#000] my-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                          >
                            <img src={selectedProblem.themePng} alt={selectedProblem.title} className="w-full h-full object-cover animate-none" />
                          </div>
                        )}
                        <p className="mx-auto max-w-2xl text-xs font-semibold text-gray-800 leading-relaxed font-comic">
                          {isSelectedExpanded
                            ? selectedProblem.fullDescription || selectedProblem.shortDescription
                            : selectedProblem.shortDescription}
                        </p>
                        <div className="mx-auto inline-block font-bangers text-xs text-comic-blue underline hover:text-blue-700 transition">
                          {isSelectedExpanded ? "CLICK TO SHOW SUMMARY" : "CLICK TO EXPAND DOSSIER"}
                        </div>
                      </div>

                      <div className="mt-5 flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailsProblemId(selectedProblem.id);
                          }}
                          className="bg-comic-blue hover:bg-blue-600 text-white font-bangers text-sm border-2 border-black rounded-lg px-4 py-1 shadow-[2px_2px_0_#000]"
                        >
                          VIEW DOSSIER DETAILS
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : problems.length ? (
                    /* Simple List of problem statements as trading cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                      {visibleProblems.map((p) => {
                        const difficulty = getProblemDifficulty(p.id, p.title);
                        const problemLimit = p.limit || MAX_TEAMS_PER_PROBLEM;
                        const slotsLeft = problemLimit - p.slotsTaken;

                        return (
                          <motion.div
                            key={p.id}
                            whileHover={{ scale: 1.01 }}
                            className="bg-white border-3 border-black rounded-xl p-4.5 shadow-[3px_3px_0_#000] flex flex-col justify-between text-left relative overflow-hidden"
                          >
                            <div>
                              <div className="flex justify-between items-center mb-2.5">
                                <span className={`font-bangers text-[10px] px-2 py-0.25 border border-black rounded shadow-[1px_1px_0_#000] ${difficulty.color}`}>
                                  {difficulty.label}
                                </span>
                                <span className="font-bangers text-[10px] bg-comic-cyan border border-black text-black px-2 py-0.25 rounded shadow-[1px_1px_0_#000]">
                                  {slotsLeft} / {problemLimit} SLOTS LEFT
                                </span>
                              </div>

                              <h3 className="font-luckiest text-base text-black leading-tight mb-1.5 tracking-wide">
                                {p.title}
                              </h3>

                              {p.themePng && (
                                <div 
                                  onClick={(e) => { e.stopPropagation(); setZoomedImage(p.themePng); }}
                                  className="w-full h-28 border border-black rounded-lg overflow-hidden my-2 bg-gray-100 cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                  <img src={p.themePng} alt={p.title} className="w-full h-full object-cover animate-none" />
                                </div>
                              )}

                              <p className="text-[11px] font-semibold text-gray-600 line-clamp-3 leading-relaxed font-comic mb-3">
                                {p.shortDescription}
                              </p>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              type="button"
                              onClick={() => setDetailsProblemId(p.id)}
                              className="w-full bg-comic-yellow hover:bg-[#eacb33] text-black border-2 border-black font-bangers py-1.5 rounded-lg text-xs shadow-[1.5px_1.5px_0_#000]"
                            >
                              VIEW DETAILS
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-3 border-dashed border-black rounded-2xl p-6 text-center">
                      <div className="text-lg font-luckiest text-black">
                        {areProblemsDisabled
                          ? "MISSION ARCHIVES SECURED"
                          : "NO MISSION FILES FOUND"}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-gray-500 font-comic">
                        {areProblemsDisabled
                          ? "Problem statement selection has been temporarily disabled by admins."
                          : "Check back later when mission coordinators release target coordinates."}
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}
      </div>

      {/* Popup modal detail */}
      <AnimatePresence>
        {detailsProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setDetailsProblemId(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white border-3 border-black rounded-2xl p-5 shadow-[6px_6px_0_#000] bg-halftone-dots-white max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-3 mb-3 text-left">
                <div>
                  <h3 className="text-xl font-luckiest tracking-wide text-black leading-tight">
                    {detailsProblem.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsProblemId(null)}
                  className="bg-comic-red text-white border-2 border-black font-bangers text-base rounded w-7 h-7 flex items-center justify-center shadow-[1.5px_1.5px_0_#000] cursor-pointer animate-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-gray-800 leading-relaxed font-comic text-left">
                {detailsProblem.themePng && (
                  <div 
                    onClick={() => setZoomedImage(detailsProblem.themePng)}
                    className="w-full h-40 border-2 border-black rounded-lg overflow-hidden bg-gray-100 mb-3 cursor-pointer hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all"
                  >
                    <img src={detailsProblem.themePng} alt={detailsProblem.title} className="w-full h-full object-cover animate-none" />
                  </div>
                )}
                <div className="bg-comic-yellow/5 border border-dashed border-black p-3 rounded-lg">
                  <span className="font-bangers text-[10px] text-comic-red block mb-0.5">OBJECTIVE SUMMARY</span>
                  <p>{detailsProblem.shortDescription}</p>
                </div>
                {detailsProblem.fullDescription && (
                  <div className="bg-gray-50 border border-black p-3 rounded-lg">
                    <span className="font-bangers text-[10px] text-gray-500 block mb-0.5">DOSSIER SPECIFICATIONS</span>
                    <p className="whitespace-pre-wrap">{detailsProblem.fullDescription}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3 items-center justify-end font-bangers text-base">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  type="button"
                  onClick={() => setDetailsProblemId(null)}
                  className="bg-white border-3 border-black rounded-lg px-4 py-1 shadow-[2px_2px_0_#000] hover:bg-gray-50 text-black cursor-pointer"
                >
                  CLOSE
                </motion.button>

                {!selectedProblemId && team?.payment?.status === "verified" ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    onClick={async () => {
                      setProblemsError("");

                      try {
                        const teamName =
                          String(team?.teamName || "").trim() ||
                          String(teamKey || "").trim();
                        if (!teamName) {
                          setProblemsError("Team not available. Please try again.");
                          return;
                        }

                        const response = await fetch(
                          `${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(teamName)}/select-problem`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              problemId: detailsProblem.id,
                            }),
                          },
                        );
                        const data = await response.json().catch(() => null);

                        if (!response.ok || !data?.success) {
                          setProblemsError(
                            data?.message || "Unable to select problem statement.",
                          );

                          if (data?.code === "PROBLEM_FULL") {
                            const fullId = detailsProblem.id;
                            setProblems((prev) =>
                              prev.map((p) =>
                                p.id === fullId
                                  ? { ...p, slotsTaken: MAX_TEAMS_PER_PROBLEM }
                                  : p,
                              ),
                            );
                            setExpandedProblemId((current) =>
                              current === fullId ? null : current,
                            );
                            setDetailsProblemId(null);
                          }
                          return;
                        }

                        setSelectedProblemId(detailsProblem.id);
                        setTeam((t) =>
                          t ? { ...t, selectedProblemStatement: detailsProblem.id } : t,
                        );
                        setIsSelectedExpanded(false);
                        setDetailsProblemId(null);
                      } catch {
                        setProblemsError("Unable to connect to the server.");
                      }
                    }}
                    className="bg-comic-green hover:bg-green-600 text-white border-3 border-black rounded-lg px-4 py-1 shadow-[2px_2px_0_#000] cursor-pointer"
                  >
                    LOCK TOPIC
                  </motion.button>
                ) : !selectedProblemId && team?.payment?.status !== "verified" ? (
                  <span className="text-[10px] bg-comic-red/10 border border-comic-red px-2 py-1 rounded font-comic text-comic-red font-bold">
                    * PAYMENT VERIFICATION REQUIRED TO LOCK
                  </span>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoomed Image Lightbox Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black cursor-zoom-out"
              onClick={() => setZoomedImage(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10 pointer-events-none"
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 bg-comic-red text-white border-2 border-black font-bangers text-lg rounded-full w-9 h-9 flex items-center justify-center shadow-[2px_2px_0_#000] cursor-pointer hover:scale-105 active:scale-95 transition pointer-events-auto"
              >
                ×
              </button>
              <div 
                className="bg-white p-3 rounded-2xl border-3 border-black shadow-[8px_8px_0_#000] overflow-hidden max-h-[80vh] pointer-events-auto cursor-zoom-out"
                onClick={() => setZoomedImage(null)}
              >
                <img
                  src={zoomedImage}
                  alt="Expanded theme PNG"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamPanel;
