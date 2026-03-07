import React, { useEffect, useMemo, useState } from "react";

const TEAM_KEY_STORAGE = "teamPanel.teamKey";

const MAX_TEAMS_PER_PROBLEM = 7;

// Event/Round labels removed from UI per request.

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
            shortDescription: p.shortDescription || "",
            fullDescription: p.fullDescription || "",
            slotsTaken: Number(p.slotsTaken || 0),
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
    return problems.filter((p) => (p.slotsTaken || 0) < MAX_TEAMS_PER_PROBLEM);
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

  // Submission status display removed from UI per request.

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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-gray-900 to-slate-950 text-gray-100">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-slate-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-slate-300/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {view === "access" ? (
            <div className="min-h-[calc(100vh-80px)] grid place-items-center">
              <div
                className={
                  `relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-900/40 p-8 shadow-xl shadow-black/30 backdrop-blur-xl ` +
                  `transition-all duration-300 ease-out ` +
                  (animateIn
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2")
                }
              >
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent" />
                <div className="relative text-center">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800/60 ring-1 ring-gray-700/60 shadow-md shadow-black/25">
                    <span className="text-base font-bold text-gray-100">
                      &lt;/&gt;
                    </span>
                  </div>
                  <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Team Dashboard
                  </h1>
                  <p className="mt-2 text-sm text-gray-300">
                    Enter your Team Key to continue.
                  </p>
                </div>

                <form onSubmit={handleSubmitKey} className="mt-8 space-y-4">
                  <label
                    className="block text-xs font-semibold tracking-wider text-gray-300 uppercase"
                    htmlFor="teamKey"
                  >
                    Team Key (Team Name)
                  </label>
                  <input
                    id="teamKey"
                    className="h-11 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                    placeholder="e.g., CodeWarriors"
                    value={teamKey}
                    onChange={(e) => setTeamKey(e.target.value)}
                    autoComplete="off"
                  />

                  {error ? (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={
                      `mt-1 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gray-700 px-6 text-sm font-semibold text-white shadow-md shadow-black/25 transition-all duration-200 ` +
                      (isLoading
                        ? "opacity-80"
                        : "hover:-translate-y-0.5 hover:bg-gray-600 active:translate-y-0")
                    }
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                          aria-hidden="true"
                        />
                        Verifying…
                      </span>
                    ) : (
                      "Access Dashboard"
                    )}
                  </button>

                  <p className="pt-1 text-center text-xs text-gray-400">
                    Team Key is case-insensitive.
                  </p>
                </form>
              </div>
            </div>
          ) : (
            <div
              className={
                `transition-all duration-300 ease-out ` +
                (animateIn
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2")
              }
            >
              <div className="space-y-10">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      Welcome, {team?.teamName}
                    </div>
                    <div className="text-sm text-gray-400">Team dashboard</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/40 px-4 text-sm font-semibold text-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800/60 active:translate-y-0"
                  >
                    Change Team
                  </button>
                </header>

                <section>
                  <div className="mx-auto w-full max-w-4xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          Team Details
                        </h2>
                        <div className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                          {team?.teamName}
                        </div>
                        <div className="mt-1 text-sm text-gray-400">
                          Team Leader:{" "}
                          <span className="font-semibold text-emerald-100">
                            {team?.teamLeader?.name || "-"}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        Members: {members.length}
                      </div>
                    </div>

                    <div className="mt-7">
                      <div>
                        <div className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Team Members
                        </div>
                        <div className="mt-1 text-sm text-gray-300 leading-relaxed">
                          Leader + members
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {members.map((m) => (
                          <div
                            key={`${m.role}-${m.regNo}-${m.name}`}
                            className={
                              `group flex gap-3 rounded-xl border p-4 shadow-sm shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20 ` +
                              (m.role === "Team Leader"
                                ? "border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10"
                                : "border-gray-700/60 bg-gray-900/40 hover:bg-gray-900/60")
                            }
                          >
                            <div
                              className={
                                `flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold text-white ring-1 ` +
                                (m.role === "Team Leader"
                                  ? "bg-emerald-500/15 ring-emerald-500/25"
                                  : "bg-gray-700 ring-gray-600/50")
                              }
                            >
                              {(m.name || "?").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div
                                  className={
                                    `truncate text-sm font-semibold ` +
                                    (m.role === "Team Leader"
                                      ? "text-emerald-100"
                                      : "text-gray-100")
                                  }
                                >
                                  {m.name}
                                </div>
                                <span
                                  className={
                                    `inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ` +
                                    (m.role === "Team Leader"
                                      ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20"
                                      : "bg-gray-800/40 text-gray-200 ring-gray-700/60")
                                  }
                                >
                                  {m.role}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-400">
                                Reg No • {m.regNo}
                              </div>
                              <div className="mt-0.5 text-xs text-gray-400">
                                {m.year} Year • {m.branch} • {m.section}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mx-auto w-full max-w-4xl space-y-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-white">
                          {selectedProblem
                            ? "Problem Statement"
                            : "Problem Statements"}
                        </h2>
                        <p className="text-xs text-gray-400">
                          Note: Once selected, it can’t be changed. Each problem
                          statement is limited to {MAX_TEAMS_PER_PROBLEM} teams.
                        </p>
                      </div>
                    </div>

                    {problemsError ? (
                      <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {problemsError}
                      </div>
                    ) : null}

                    {selectedProblem ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setIsSelectedExpanded((v) => !v)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsSelectedExpanded((v) => !v);
                          }
                        }}
                        className="cursor-pointer rounded-2xl border border-gray-700/60 bg-gray-900/40 p-6 shadow-xl shadow-black/25 backdrop-blur-xl outline-none transition-all duration-200 hover:bg-gray-900/55 focus:ring-2 focus:ring-gray-200/10"
                      >
                        <div className="space-y-4 text-center">
                          <div className="text-lg font-semibold text-gray-100">
                            {selectedProblem.title}
                          </div>
                          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-gray-300">
                            {isSelectedExpanded
                              ? selectedProblem.fullDescription ||
                                selectedProblem.shortDescription
                              : selectedProblem.shortDescription}
                          </p>
                          <div className="mx-auto block text-center text-sm font-semibold text-sky-300 transition">
                            {isSelectedExpanded
                              ? "Click to hide full description"
                              : "Click to view full description"}
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailsProblemId(selectedProblem.id);
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-700 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-600"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ) : problems.length ? (
                      <div
                        className="max-h-130 overflow-y-auto rounded-2xl border border-gray-700/60 bg-gray-900/40 p-4 shadow-xl shadow-black/20 backdrop-blur-xl"
                        aria-label="Problem statements list"
                      >
                        {visibleProblems.map((p, idx) => {
                          const isExpanded = expandedProblemId === p.id;
                          return (
                            <div
                              key={p.id}
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setExpandedProblemId((current) =>
                                  current === p.id ? null : p.id,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setExpandedProblemId((current) =>
                                    current === p.id ? null : p.id,
                                  );
                                }
                              }}
                              className={
                                "cursor-pointer rounded-xl px-4 py-5 outline-none transition-all duration-200 hover:bg-gray-900/35 focus:ring-2 focus:ring-gray-200/10 sm:px-6 " +
                                (idx === 0 ? "" : "border-t border-gray-700/60")
                              }
                            >
                              <div className="space-y-4 text-center">
                                <div className="text-lg font-semibold text-gray-100">
                                  {p.title}
                                </div>
                                <p className="mx-auto max-w-3xl text-sm leading-relaxed text-gray-300">
                                  {isExpanded
                                    ? p.fullDescription || p.shortDescription
                                    : p.shortDescription}
                                </p>
                                <div className="mx-auto block text-center text-sm font-semibold text-sky-300 transition">
                                  {isExpanded
                                    ? "Click to hide full description"
                                    : "Click to view full description"}
                                </div>
                              </div>

                              <div className="mt-6 flex justify-center sm:justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailsProblemId(p.id);
                                  }}
                                  className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-700 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-600"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-gray-700/60 bg-gray-900/40 px-6 py-8 text-center shadow-xl shadow-black/20 backdrop-blur-xl">
                        <div className="text-base font-semibold text-white">
                          {areProblemsDisabled
                            ? "Problem statements are turned off"
                            : "No problem statements available"}
                        </div>
                        <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                          Please check back later.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {detailsProblem ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/70"
                    onClick={() => setDetailsProblemId(null)}
                    aria-label="Close"
                  />
                  <div className="relative w-full max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-gray-700/60 bg-gray-900/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-700/60 pb-4">
                      <div className="pr-2">
                        <div className="text-xl font-semibold tracking-tight text-white">
                          {detailsProblem.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailsProblemId(null)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/60 text-sm font-semibold text-gray-100 transition hover:bg-gray-800/60"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mt-5 space-y-3 text-sm leading-relaxed text-gray-200">
                      <p className="text-gray-300 leading-relaxed">
                        {detailsProblem.shortDescription}
                      </p>
                      {detailsProblem.fullDescription ? (
                        <p className="text-gray-300 leading-relaxed">
                          {detailsProblem.fullDescription}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setDetailsProblemId(null)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-600 bg-transparent px-5 text-sm font-semibold text-gray-100 transition-all duration-200 hover:bg-gray-800/40"
                      >
                        Close
                      </button>
                      {!selectedProblemId ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setProblemsError("");

                            try {
                              const teamName =
                                String(team?.teamName || "").trim() ||
                                String(teamKey || "").trim();
                              if (!teamName) {
                                setProblemsError(
                                  "Team not available. Please try again.",
                                );
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
                              const data = await response
                                .json()
                                .catch(() => null);

                              if (!response.ok || !data?.success) {
                                setProblemsError(
                                  data?.message ||
                                    "Unable to select problem statement.",
                                );

                                if (data?.code === "PROBLEM_FULL") {
                                  const fullId = detailsProblem.id;
                                  setProblems((prev) =>
                                    prev.map((p) =>
                                      p.id === fullId
                                        ? {
                                            ...p,
                                            slotsTaken: MAX_TEAMS_PER_PROBLEM,
                                          }
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
                                t
                                  ? {
                                      ...t,
                                      selectedProblemStatement:
                                        detailsProblem.id,
                                    }
                                  : t,
                              );
                              setIsSelectedExpanded(false);
                              setDetailsProblemId(null);
                            } catch {
                              setProblemsError(
                                "Unable to connect to the server.",
                              );
                            }
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-700 px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-600"
                        >
                          Select & Continue
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;
