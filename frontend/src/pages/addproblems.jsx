import React, { useEffect, useMemo, useState } from "react";

const VIEW_MODES = {
  problems: "problems",
  students: "students",
};

const ADMIN_KEY_STORAGE = "adminConsole.adminKey";
const ADMIN_VIEW_STORAGE = "adminConsole.viewMode";

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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-gray-900 to-slate-950 text-gray-100">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-slate-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-slate-300/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {!isVerified ? (
            <div className="min-h-[calc(100vh-80px)] grid place-items-center">
              <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-900/40 p-8 shadow-xl shadow-black/30 backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent" />

                <div className="relative text-center">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800/60 ring-1 ring-gray-700/60 shadow-md shadow-black/25">
                    <span className="text-base font-bold text-gray-100">
                      Admin
                    </span>
                  </div>
                  <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Problem Statements
                  </h1>
                  <p className="mt-2 text-sm text-gray-300">
                    Enter admin key to manage problem statements.
                  </p>
                </div>

                <form
                  onSubmit={handleVerify}
                  className="relative mt-8 space-y-4"
                >
                  <label
                    className="block text-xs font-semibold tracking-wider text-gray-300 uppercase"
                    htmlFor="adminKey"
                  >
                    Admin Key
                  </label>
                  <input
                    id="adminKey"
                    type="password"
                    className="h-11 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                    placeholder="Enter adminPassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                  />
                  {verifyError ? (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {verifyError}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className={
                      `inline-flex h-11 w-full items-center justify-center rounded-xl bg-gray-700 px-6 text-sm font-semibold text-white shadow-md shadow-black/25 transition-all duration-200 ` +
                      (isVerifying
                        ? "opacity-80"
                        : "hover:-translate-y-0.5 hover:bg-gray-600 active:translate-y-0")
                    }
                  >
                    {isVerifying ? "Verifying…" : "Unlock"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Admin Console
                  </div>
                  <div className="text-sm text-gray-400">
                    Manage problem statements and student visibility
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {viewMode === VIEW_MODES.problems ? (
                    <>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-700 px-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-600 active:translate-y-0"
                      >
                        Add Problem Statement
                      </button>
                      <button
                        type="button"
                        onClick={showStudents}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/40 px-4 text-sm font-semibold text-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800/60 active:translate-y-0"
                      >
                        Teams
                      </button>
                      <button
                        type="button"
                        onClick={loadConfigAndProblems}
                        disabled={isLoadingProblems}
                        className={
                          `inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-all duration-200 ` +
                          (isLoadingProblems
                            ? "border-gray-700/60 bg-gray-900/40 text-gray-300 opacity-80"
                            : "border-gray-700/60 bg-gray-900/40 text-gray-100 hover:bg-gray-800/60")
                        }
                      >
                        {isLoadingProblems ? "Loading…" : "Refresh"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={showProblems}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-700 px-4 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-600 active:translate-y-0"
                      >
                        Show Problems
                      </button>
                      <button
                        type="button"
                        onClick={loadSelectedTeams}
                        disabled={isLoadingTeams}
                        className={
                          `inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-all duration-200 ` +
                          (isLoadingTeams
                            ? "border-gray-700/60 bg-gray-900/40 text-gray-300 opacity-80"
                            : "border-gray-700/60 bg-gray-900/40 text-gray-100 hover:bg-gray-800/60")
                        }
                      >
                        {isLoadingTeams ? "Loading…" : "Refresh"}
                      </button>
                    </>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/25">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      aria-hidden="true"
                    />
                    Verified
                  </span>
                </div>
              </header>

              {viewMode === VIEW_MODES.problems ? (
                <>
                  <section>
                    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-700/60 bg-gray-900/40 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-lg font-semibold text-white">
                            Problem Statements
                          </div>
                          <div className="mt-1 text-sm text-gray-400 leading-relaxed">
                            Toggle visibility for students
                          </div>
                        </div>

                        <label className="inline-flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-200">
                            {problemsEnabled ? "On" : "Off"}
                          </span>
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() =>
                              handleToggleProblems(!problemsEnabled)
                            }
                            className={
                              `relative inline-flex h-9 w-16 items-center rounded-full border transition ` +
                              (problemsEnabled
                                ? "border-emerald-500/40 bg-emerald-500/15"
                                : "border-gray-700/60 bg-gray-900/40")
                            }
                            aria-label="Toggle problem statements"
                          >
                            <span
                              className={
                                `inline-block h-7 w-7 transform rounded-full transition ` +
                                (problemsEnabled
                                  ? "translate-x-8 bg-emerald-400"
                                  : "translate-x-1 bg-gray-400")
                              }
                            />
                          </button>
                        </label>
                      </div>

                      {toggleError ? (
                        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          {toggleError}
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section>
                    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-700/60 bg-gray-900/40 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
                      <div className="flex items-baseline justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold text-white">
                            All Problem Statements
                          </div>
                          <div className="mt-1 text-sm text-gray-400 leading-relaxed">
                            Edit or delete existing statements
                          </div>
                        </div>
                      </div>

                      {problemsLoadError ? (
                        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          {problemsLoadError}
                        </div>
                      ) : null}

                      {updateError ? (
                        <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          {updateError}
                        </div>
                      ) : null}

                      <div className="mt-5 space-y-3">
                        {problems.length ? (
                          problems.map((p) => (
                            <div
                              key={p._id}
                              className="rounded-2xl border border-gray-700/60 bg-gray-900/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-900/55"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="text-base font-semibold text-white">
                                    {p.title}
                                  </div>
                                  <div className="mt-2 text-sm leading-relaxed text-gray-300">
                                    {p.shortDescription}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <button
                                    type="button"
                                    onClick={() => startEditing(p)}
                                    className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/40 px-4 text-sm font-semibold text-gray-100 transition hover:bg-gray-800/60"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(p._id)}
                                    className="inline-flex h-9 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-gray-700/60 bg-gray-900/30 px-4 py-5 text-sm text-gray-300">
                            No problem statements found.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <section>
                  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-700/60 bg-gray-900/40 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-white">
                          Students
                        </div>
                        <div className="mt-1 text-sm text-gray-400 leading-relaxed">
                          Teams with selected problem statements
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        Total: {selectedTeams.length}
                      </div>
                    </div>

                    <div className="mt-5">
                      <label
                        className="block text-xs font-semibold tracking-wider text-gray-300 uppercase"
                        htmlFor="teamSearch"
                      >
                        Search Teams
                      </label>
                      <input
                        id="teamSearch"
                        className="mt-2 h-11 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                        placeholder="Search by team name or leader"
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        autoComplete="off"
                      />
                      <div className="mt-2 text-xs text-gray-400">
                        Showing {filteredTeams.length} of {selectedTeams.length}
                      </div>
                    </div>

                    {teamsLoadError ? (
                      <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {teamsLoadError}
                      </div>
                    ) : null}

                    <div className="mt-5 space-y-3">
                      {filteredTeams.length ? (
                        filteredTeams.map((t) => {
                          const problemTitle =
                            t?.selectedProblemStatement?.title ||
                            t?.selectedProblemStatement?.name ||
                            "-";
                          return (
                            <div
                              key={t._id}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                const problem = t?.selectedProblemStatement;
                                if (!problem || typeof problem !== "object") {
                                  return;
                                }
                                setStudentProblemPopup({
                                  teamName: t?.teamName || "",
                                  leaderName: t?.teamLeader?.name || "",
                                  selectedAt:
                                    t?.selectedProblemSelectedAt || null,
                                  problem,
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  const problem = t?.selectedProblemStatement;
                                  if (!problem || typeof problem !== "object") {
                                    return;
                                  }
                                  setStudentProblemPopup({
                                    teamName: t?.teamName || "",
                                    leaderName: t?.teamLeader?.name || "",
                                    selectedAt:
                                      t?.selectedProblemSelectedAt || null,
                                    problem,
                                  });
                                }
                              }}
                              className="cursor-pointer rounded-2xl border border-gray-700/60 bg-gray-900/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-900/55 focus:outline-none focus:ring-2 focus:ring-gray-200/10"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="text-base font-semibold text-white">
                                    {t.teamName}
                                  </div>
                                  <div className="mt-1 text-sm text-gray-300">
                                    Leader: {t?.teamLeader?.name || "-"}
                                  </div>
                                  <div className="mt-2 text-sm leading-relaxed text-gray-300">
                                    Selected: {problemTitle}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {t?.selectedProblemSelectedAt
                                    ? new Date(
                                        t.selectedProblemSelectedAt,
                                      ).toLocaleString()
                                    : ""}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-gray-700/60 bg-gray-900/30 px-4 py-5 text-sm text-gray-300">
                          {isLoadingTeams
                            ? "Loading teams…"
                            : selectedTeams.length
                              ? "No teams match your search."
                              : "No teams have selected a problem statement yet."}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {viewMode === VIEW_MODES.students && studentProblemPopup ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/70"
                    onClick={() => setStudentProblemPopup(null)}
                    aria-label="Close"
                  />
                  <div className="relative w-full max-w-2xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-gray-700/60 bg-gray-900/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-7">
                    <div className="flex items-start justify-between gap-3 border-b border-gray-700/60 pb-4">
                      <div className="pr-2">
                        <div className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          {studentProblemPopup.teamName || "Team"}
                        </div>
                        <div className="mt-1 text-xl font-semibold tracking-tight text-white">
                          {studentProblemPopup.problem?.title ||
                            "Problem Statement"}
                        </div>
                        {studentProblemPopup.leaderName ? (
                          <div className="mt-1 text-sm text-gray-400">
                            Leader: {studentProblemPopup.leaderName}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setStudentProblemPopup(null)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/60 text-sm font-semibold text-gray-100 transition hover:bg-gray-800/60"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    <div className="mt-5 space-y-3 text-sm leading-relaxed text-gray-200">
                      {studentProblemPopup.problem?.shortDescription ? (
                        <p className="text-gray-300 leading-relaxed">
                          {studentProblemPopup.problem.shortDescription}
                        </p>
                      ) : null}
                      {studentProblemPopup.problem?.fullDescription ? (
                        <p className="text-gray-300 leading-relaxed">
                          {studentProblemPopup.problem.fullDescription}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setStudentProblemPopup(null)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-600 bg-transparent px-5 text-sm font-semibold text-gray-100 transition-all duration-200 hover:bg-gray-800/40"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {viewMode === VIEW_MODES.problems && activeModal ? (
                <div className="fixed inset-0 z-50">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() =>
                      activeModal === "edit" ? cancelEditing() : closeCreate()
                    }
                    aria-label="Close"
                  />

                  <div className="relative h-full w-full overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-gray-900 to-slate-950" />
                    <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-slate-500/10 blur-3xl" />
                    <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-slate-300/8 blur-3xl" />

                    <div className="relative h-full w-full overflow-y-auto">
                      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                        <div
                          role="dialog"
                          aria-modal="true"
                          className="overflow-hidden rounded-3xl border border-gray-700/60 bg-gray-900/55 shadow-2xl shadow-black/50 backdrop-blur-xl"
                        >
                          <div className="sticky top-0 z-10 border-b border-gray-700/60 bg-gray-900/70 backdrop-blur-xl">
                            <div className="flex items-start justify-between gap-4 px-6 py-5 sm:px-8">
                              <div className="min-w-0 pr-2">
                                <div className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                  Admin
                                </div>
                                <div className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                                  {activeModal === "edit"
                                    ? "Edit Problem Statement"
                                    : "Create Problem Statement"}
                                </div>
                                <div className="mt-1 text-sm text-gray-400 leading-relaxed">
                                  {activeModal === "edit"
                                    ? "Update the selected statement"
                                    : "Add a new statement"}
                                </div>
                              </div>

                              <div className="flex flex-none items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    activeModal === "edit"
                                      ? cancelEditing()
                                      : closeCreate()
                                  }
                                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/50 px-4 text-sm font-semibold text-gray-100 transition hover:bg-gray-800/60"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="px-6 py-7 sm:px-8">
                            {activeModal === "create" ? (
                              <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                  <label
                                    className="block text-xs font-semibold tracking-wider text-gray-300 uppercase"
                                    htmlFor="title"
                                  >
                                    Title
                                  </label>
                                  <input
                                    id="title"
                                    className="mt-2 h-11 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Problem title"
                                  />
                                </div>

                                <div>
                                  <label
                                    className="block text-xs font-semibold tracking-wider text-gray-300 uppercase"
                                    htmlFor="shortDesc"
                                  >
                                    Short Description
                                  </label>
                                  <textarea
                                    id="shortDesc"
                                    rows={4}
                                    className="mt-2 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 py-3 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                                    value={shortDescription}
                                    onChange={(e) =>
                                      setShortDescription(e.target.value)
                                    }
                                    placeholder="A short summary shown on cards"
                                  />
                                </div>

                                <div>
                                  <label
                                    className="block text-xs font-semibold tracking-wider text-gray-300 uppercase"
                                    htmlFor="fullDesc"
                                  >
                                    Full Description (optional)
                                  </label>
                                  <textarea
                                    id="fullDesc"
                                    rows={7}
                                    className="mt-2 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 py-3 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                                    value={fullDescription}
                                    onChange={(e) =>
                                      setFullDescription(e.target.value)
                                    }
                                    placeholder="More details shown in the popup"
                                  />
                                </div>

                                {saveError ? (
                                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {saveError}
                                  </div>
                                ) : null}

                                {saveMessage ? (
                                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                                    {saveMessage}
                                  </div>
                                ) : null}

                                <div className="sticky bottom-0 -mx-6 mt-8 border-t border-gray-700/60 bg-gray-900/65 px-6 py-5 backdrop-blur-xl sm:-mx-8 sm:px-8">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                    <button
                                      type="button"
                                      onClick={closeCreate}
                                      className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/50 px-5 text-sm font-semibold text-gray-100 transition hover:bg-gray-800/60"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={!canSave}
                                      className={
                                        `inline-flex h-10 items-center justify-center rounded-xl bg-gray-700 px-5 text-sm font-semibold text-white transition-all duration-200 ` +
                                        (canSave
                                          ? "hover:bg-gray-600"
                                          : "opacity-70")
                                      }
                                    >
                                      {isSaving ? "Saving…" : "Create"}
                                    </button>
                                  </div>
                                </div>
                              </form>
                            ) : (
                              <form
                                onSubmit={handleUpdate}
                                className="space-y-6"
                              >
                                <div>
                                  <label className="block text-xs font-semibold tracking-wider text-gray-300 uppercase">
                                    Title
                                  </label>
                                  <input
                                    className="mt-2 h-11 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                                    value={editTitle}
                                    onChange={(e) =>
                                      setEditTitle(e.target.value)
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold tracking-wider text-gray-300 uppercase">
                                    Short Description
                                  </label>
                                  <textarea
                                    rows={4}
                                    className="mt-2 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 py-3 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                                    value={editShortDescription}
                                    onChange={(e) =>
                                      setEditShortDescription(e.target.value)
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold tracking-wider text-gray-300 uppercase">
                                    Full Description (optional)
                                  </label>
                                  <textarea
                                    rows={6}
                                    className="mt-2 w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-4 py-3 text-sm text-gray-100 outline-none transition-all duration-200 focus:border-gray-500/90 focus:ring-2 focus:ring-gray-200/10"
                                    value={editFullDescription}
                                    onChange={(e) =>
                                      setEditFullDescription(e.target.value)
                                    }
                                  />
                                </div>

                                {updateError ? (
                                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {updateError}
                                  </div>
                                ) : null}

                                <div className="sticky bottom-0 -mx-6 mt-8 border-t border-gray-700/60 bg-gray-900/65 px-6 py-5 backdrop-blur-xl sm:-mx-8 sm:px-8">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                    <button
                                      type="button"
                                      onClick={cancelEditing}
                                      className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-900/50 px-5 text-sm font-semibold text-gray-100 transition hover:bg-gray-800/60"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={isUpdating}
                                      className={
                                        `inline-flex h-10 items-center justify-center rounded-xl bg-gray-700 px-5 text-sm font-semibold text-white transition-all duration-200 ` +
                                        (isUpdating
                                          ? "opacity-80"
                                          : "hover:bg-gray-600")
                                      }
                                    >
                                      {isUpdating ? "Saving…" : "Save"}
                                    </button>
                                  </div>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
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

export default AddProblems;
