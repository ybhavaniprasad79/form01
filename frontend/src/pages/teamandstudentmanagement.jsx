import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  AlertTriangle,
  FileText,
  Check,
  Plus,
  RotateCw,
  Trash2,
  Edit3,
  Users,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  LogOut,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Building2,
  Phone,
  Mail,
  CreditCard,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Shield,
  BookOpen,
  ArrowRight,
  User,
  X,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import FashionBackground from "../components/FashionBackground";
import { Link } from "react-router-dom";

const ADMIN_KEY_STORAGE = "adminTeamManagement.authKey";

const VIEW_MODES = {
  TEAMS: "teams",
  STUDENTS: "students",
};

const EMPTY_MEMBER = {
  name: "",
  regNo: "",
  phoneNo: "",
  year: "1",
  branch: "",
  section: "",
  gender: "Male",
  residenceType: "dayScholar",
  hostelName: "",
  roomNo: "",
  wardenName: "",
  wardenPhoneNo: "",
};

const TeamAndStudentManagement = () => {
  // Authentication states
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [didRestoreKey, setDidRestoreKey] = useState(false);

  // Data states
  const [teams, setTeams] = useState([]);
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // View & Filter states
  const [viewMode, setViewMode] = useState(VIEW_MODES.TEAMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [problemFilter, setProblemFilter] = useState("ALL");
  const [residenceFilter, setResidenceFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [expandedTeamIds, setExpandedTeamIds] = useState(new Set());

  // Modals & Active Edit states
  const [editTeamModalOpen, setEditTeamModalOpen] = useState(false);
  const [quickStudentModalOpen, setQuickStudentModalOpen] = useState(false);
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptModalUrl, setReceiptModalUrl] = useState(null);

  // Form states for full Team editing / creation
  const [activeTeamData, setActiveTeamData] = useState(null);
  const [activeMemberTab, setActiveMemberTab] = useState("teamLeader"); // teamLeader, teamMember1, teamMember2, teamMember3
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toastMessage, setToastMessage] = useState({ text: "", type: "success" });

  // Quick student edit state
  const [quickStudentTarget, setQuickStudentTarget] = useState({
    teamId: null,
    teamName: "",
    memberKey: "teamLeader",
    memberData: { ...EMPTY_MEMBER },
  });

  // Team to delete
  const [teamToDelete, setTeamToDelete] = useState(null);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: "", type: "success" });
    }, 4000);
  };

  // Restore session-stored admin key if present
  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE) || localStorage.getItem(ADMIN_KEY_STORAGE);
    const normalized = (stored || "").trim();
    if (normalized) {
      setPassword(normalized);
      verifyAdminKey(normalized);
    }
    setDidRestoreKey(true);
  }, []);

  const verifyAdminKey = async (keyToVerify) => {
    const key = (keyToVerify || password).trim();
    if (!key) {
      setVerifyError("Please enter the administrator passcode.");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: key }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        localStorage.removeItem(ADMIN_KEY_STORAGE);
        setVerifyError(data?.message || "Invalid admin passcode. Access denied.");
        setIsVerified(false);
        return;
      }

      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
      localStorage.setItem(ADMIN_KEY_STORAGE, key);
      setIsVerified(true);
      fetchAllData(key);
    } catch {
      setVerifyError("Unable to connect to the backend server.");
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    setIsVerified(false);
    setPassword("");
    setVerifyError("");
    setTeams([]);
    setProblems([]);
    showToast("Admin console locked successfully", "info");
  };

  // Fetch teams and problem statements
  const fetchAllData = async (adminKey = password) => {
    const key = (adminKey || password).trim();
    if (!key) return;

    setIsLoading(true);
    setFetchError("");

    try {
      // Fetch teams
      const teamsRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams-management?password=${encodeURIComponent(key)}`
      );
      const teamsData = await teamsRes.json().catch(() => null);

      if (!teamsRes.ok || !teamsData?.success) {
        throw new Error(teamsData?.message || "Failed to load teams list");
      }

      // Fetch problem statements for assignment dropdown
      const problemsRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/problems?password=${encodeURIComponent(key)}`
      );
      const problemsData = await problemsRes.json().catch(() => null);

      setTeams(teamsData.data || []);
      setProblems(problemsData?.data || []);
    } catch (err) {
      setFetchError(err.message || "Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Extract distinct branches for filter dropdown
  const availableBranches = useMemo(() => {
    const branchSet = new Set();
    teams.forEach((t) => {
      [t.teamLeader, t.teamMember1, t.teamMember2, t.teamMember3].forEach((m) => {
        if (m && m.branch && String(m.branch).trim()) {
          branchSet.add(String(m.branch).trim().toUpperCase());
        }
      });
    });
    return Array.from(branchSet).sort();
  }, [teams]);

  // Transform teams into flat student records for directory view
  const allStudents = useMemo(() => {
    const list = [];
    teams.forEach((t) => {
      const addMember = (m, roleName, memberKey) => {
        if (!m || !m.name || !String(m.name).trim()) return;
        list.push({
          teamId: t._id,
          teamName: String(t.teamName || ""),
          paymentStatus: t.payment?.status || "pending",
          transactionId: String(t.payment?.transactionId || ""),
          selectedProblem: t.selectedProblemStatement,
          roleName,
          memberKey,
          data: m,
        });
      };

      addMember(t.teamLeader, "Team Leader", "teamLeader");
      addMember(t.teamMember1, "Member 1", "teamMember1");
      addMember(t.teamMember2, "Member 2", "teamMember2");
      addMember(t.teamMember3, "Member 3", "teamMember3");
    });
    return list;
  }, [teams]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalStudents = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let hostelGirls = 0;
    let hostelBoys = 0;
    let dayScholarGirls = 0;
    let dayScholarBoys = 0;
    let assignedProblemCount = 0;

    teams.forEach((t) => {
      if (t.payment?.status === "verified") verifiedCount++;
      else if (t.payment?.status === "rejected") rejectedCount++;
      else pendingCount++;

      if (t.selectedProblemStatement) assignedProblemCount++;

      const members = [t.teamLeader, t.teamMember1, t.teamMember2, t.teamMember3].filter(
        (m) => m && m.name && m.name.trim()
      );

      members.forEach((m) => {
        totalStudents++;
        const isHostel = String(m.residenceType || "").toLowerCase() === "hosteler";
        const g = String(m.gender || "").toLowerCase();
        const isFemale = g.includes("female") || g.includes("girl") || g === "f";

        if (isHostel) {
          if (isFemale) hostelGirls++;
          else hostelBoys++;
        } else {
          if (isFemale) dayScholarGirls++;
          else dayScholarBoys++;
        }
      });
    });

    return {
      totalTeams: teams.length,
      totalStudents,
      verifiedCount,
      pendingCount,
      rejectedCount,
      hostelGirls,
      hostelBoys,
      dayScholarGirls,
      dayScholarBoys,
      totalHostelers: hostelGirls + hostelBoys,
      totalDayScholars: dayScholarGirls + dayScholarBoys,
      assignedProblemCount,
    };
  }, [teams]);

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return teams.filter((team) => {
      // Payment filter
      if (paymentFilter !== "ALL" && (team.payment?.status || "pending") !== paymentFilter) {
        return false;
      }

      // Problem filter
      if (problemFilter === "ASSIGNED" && !team.selectedProblemStatement) return false;
      if (problemFilter === "UNASSIGNED" && team.selectedProblemStatement) return false;
      if (
        problemFilter !== "ALL" &&
        problemFilter !== "ASSIGNED" &&
        problemFilter !== "UNASSIGNED"
      ) {
        const pId = team.selectedProblemStatement?._id || team.selectedProblemStatement;
        if (String(pId) !== String(problemFilter)) return false;
      }

      const members = [team.teamLeader, team.teamMember1, team.teamMember2, team.teamMember3].filter(
        (m) => m && m.name
      );

      // Residence filter
      if (residenceFilter !== "ALL") {
        const hasMatch = members.some((m) => {
          const isHostel = String(m.residenceType || "").toLowerCase() === "hosteler";
          const g = String(m.gender || "").toLowerCase();
          const isFemale = g.includes("female") || g.includes("girl") || g === "f";

          if (residenceFilter === "hosteler") return isHostel;
          if (residenceFilter === "dayScholar") return !isHostel;
          if (residenceFilter === "hostel-girls") return isHostel && isFemale;
          if (residenceFilter === "hostel-boys") return isHostel && !isFemale;
          if (residenceFilter === "dayscholar-girls") return !isHostel && isFemale;
          if (residenceFilter === "dayscholar-boys") return !isHostel && !isFemale;
          return true;
        });
        if (!hasMatch) return false;
      }

      // Year filter
      if (yearFilter !== "ALL") {
        const hasMatch = members.some((m) => String(m.year) === yearFilter);
        if (!hasMatch) return false;
      }

      // Branch filter
      if (branchFilter !== "ALL") {
        const hasMatch = members.some(
          (m) => String(m.branch || "").trim().toUpperCase() === branchFilter
        );
        if (!hasMatch) return false;
      }

      // Gender filter
      if (genderFilter !== "ALL") {
        const hasMatch = members.some((m) => {
          const g = String(m.gender || "").toLowerCase();
          const isFemale = g.includes("female") || g.includes("girl") || g === "f";
          if (genderFilter === "female") return isFemale;
          if (genderFilter === "male") return !isFemale;
          return true;
        });
        if (!hasMatch) return false;
      }

      // Search Query
      if (q) {
        const teamNameMatch = String(team.teamName || "").toLowerCase().includes(q);
        const transMatch = String(team.payment?.transactionId || "").toLowerCase().includes(q);
        const probTitleMatch = String(team.selectedProblemStatement?.title || "").toLowerCase().includes(q);

        const memberMatch = members.some((m) => {
          return (
            String(m.name || "").toLowerCase().includes(q) ||
            String(m.regNo || "").toLowerCase().includes(q) ||
            String(m.phoneNo || "").toLowerCase().includes(q) ||
            String(m.branch || "").toLowerCase().includes(q) ||
            String(m.section || "").toLowerCase().includes(q) ||
            String(m.hostelName || "").toLowerCase().includes(q) ||
            String(m.wardenName || "").toLowerCase().includes(q)
          );
        });

        if (!teamNameMatch && !transMatch && !probTitleMatch && !memberMatch) {
          return false;
        }
      }

      return true;
    });
  }, [teams, searchQuery, paymentFilter, problemFilter, residenceFilter, yearFilter, branchFilter, genderFilter]);

  // Filtered Students Directory
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allStudents.filter((item) => {
      const m = item.data;

      // Payment filter
      if (paymentFilter !== "ALL" && item.paymentStatus !== paymentFilter) {
        return false;
      }

      // Problem filter
      if (problemFilter === "ASSIGNED" && !item.selectedProblem) return false;
      if (problemFilter === "UNASSIGNED" && item.selectedProblem) return false;
      if (
        problemFilter !== "ALL" &&
        problemFilter !== "ASSIGNED" &&
        problemFilter !== "UNASSIGNED"
      ) {
        const pId = item.selectedProblem?._id || item.selectedProblem;
        if (String(pId) !== String(problemFilter)) return false;
      }

      // Residence filter
      const isHostel = String(m.residenceType || "").toLowerCase() === "hosteler";
      const g = String(m.gender || "").toLowerCase();
      const isFemale = g.includes("female") || g.includes("girl") || g === "f";

      if (residenceFilter === "hosteler" && !isHostel) return false;
      if (residenceFilter === "dayScholar" && isHostel) return false;
      if (residenceFilter === "hostel-girls" && (!isHostel || !isFemale)) return false;
      if (residenceFilter === "hostel-boys" && (!isHostel || isFemale)) return false;
      if (residenceFilter === "dayscholar-girls" && (isHostel || !isFemale)) return false;
      if (residenceFilter === "dayscholar-boys" && (isHostel || isFemale)) return false;

      // Year filter
      if (yearFilter !== "ALL" && String(m.year || "") !== yearFilter) return false;

      // Branch filter
      if (branchFilter !== "ALL" && String(m.branch || "").trim().toUpperCase() !== branchFilter)
        return false;

      // Gender filter
      if (genderFilter === "female" && !isFemale) return false;
      if (genderFilter === "male" && isFemale) return false;

      // Search query
      if (q) {
        const match =
          String(item.teamName || "").toLowerCase().includes(q) ||
          String(item.transactionId || "").toLowerCase().includes(q) ||
          String(m.name || "").toLowerCase().includes(q) ||
          String(m.regNo || "").toLowerCase().includes(q) ||
          String(m.phoneNo || "").toLowerCase().includes(q) ||
          String(m.branch || "").toLowerCase().includes(q) ||
          String(m.section || "").toLowerCase().includes(q) ||
          String(m.hostelName || "").toLowerCase().includes(q) ||
          String(m.wardenName || "").toLowerCase().includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [allStudents, searchQuery, paymentFilter, problemFilter, residenceFilter, yearFilter, branchFilter, genderFilter]);

  const toggleTeamExpand = (teamId) => {
    setExpandedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTeamIds(new Set(teams.map((t) => t._id)));
  };

  const collapseAll = () => {
    setExpandedTeamIds(new Set());
  };

  // Open Full Team Edit Modal
  const handleOpenEditTeam = (team) => {
    setActiveTeamData({
      _id: team._id,
      teamName: team.teamName || "",
      selectedProblemStatement: team.selectedProblemStatement?._id || team.selectedProblemStatement || "",
      payment: {
        transactionId: team.payment?.transactionId || "",
        status: team.payment?.status || "pending",
        receiptUrl: team.payment?.receiptUrl || "",
        receiptFileName: team.payment?.receiptFileName || "",
      },
      teamLeader: { ...EMPTY_MEMBER, ...(team.teamLeader || {}) },
      teamMember1: { ...EMPTY_MEMBER, ...(team.teamMember1 || {}) },
      teamMember2: { ...EMPTY_MEMBER, ...(team.teamMember2 || {}) },
      teamMember3: { ...EMPTY_MEMBER, ...(team.teamMember3 || {}) },
    });
    setActiveMemberTab("teamLeader");
    setModalError("");
    setEditTeamModalOpen(true);
  };

  // Save Full Team Updates
  const handleSaveTeam = async () => {
    if (!activeTeamData?.teamName?.trim()) {
      setModalError("Team Name is required.");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const payload = {
        password: password.trim(),
        teamName: activeTeamData.teamName.trim(),
        selectedProblemStatement: activeTeamData.selectedProblemStatement || null,
        payment: activeTeamData.payment,
        teamLeader: activeTeamData.teamLeader,
        teamMember1: activeTeamData.teamMember1,
        teamMember2: activeTeamData.teamMember2,
        teamMember3: activeTeamData.teamMember3?.name?.trim() ? activeTeamData.teamMember3 : undefined,
      };

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${activeTeamData._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update team");
      }

      showToast(`Team "${activeTeamData.teamName}" updated successfully!`, "success");
      setEditTeamModalOpen(false);
      fetchAllData();
    } catch (err) {
      setModalError(err.message || "Failed to save team changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Quick Edit Single Student Modal
  const handleOpenQuickStudent = (teamId, teamName, memberKey, memberData) => {
    setQuickStudentTarget({
      teamId,
      teamName,
      memberKey,
      memberData: { ...EMPTY_MEMBER, ...(memberData || {}) },
    });
    setModalError("");
    setQuickStudentModalOpen(true);
  };

  // Save Quick Student Update
  const handleSaveQuickStudent = async () => {
    if (!quickStudentTarget.memberData.name?.trim()) {
      setModalError("Student name is required.");
      return;
    }
    if (!quickStudentTarget.memberData.regNo?.trim()) {
      setModalError("Registration / Application number is required.");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${quickStudentTarget.teamId}/member/${quickStudentTarget.memberKey}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            memberData: quickStudentTarget.memberData,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update student");
      }

      showToast(`Student ${quickStudentTarget.memberData.name} updated!`, "success");
      setQuickStudentModalOpen(false);
      fetchAllData();
    } catch (err) {
      setModalError(err.message || "Failed to update student.");
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Payment Status Change
  const handleQuickPaymentStatus = async (teamId, newStatus) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${teamId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            payment: { status: newStatus },
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to change payment status");
      }
      showToast(`Payment status updated to "${newStatus}"`, "success");
      fetchAllData();
    } catch (err) {
      showToast(err.message || "Error updating payment status", "error");
    }
  };

  // Quick Problem Statement Assignment
  const handleQuickProblemAssign = async (teamId, problemId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${teamId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            selectedProblemStatement: problemId || null,
          }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update problem statement");
      }
      showToast(
        problemId ? "Problem statement assigned successfully" : "Problem statement cleared",
        "success"
      );
      fetchAllData();
    } catch (err) {
      showToast(err.message || "Error updating problem statement", "error");
    }
  };

  // Delete Team
  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${teamToDelete._id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to delete team");
      }
      showToast(`Team "${teamToDelete.teamName}" deleted permanently`, "success");
      setDeleteModalOpen(false);
      setTeamToDelete(null);
      fetchAllData();
    } catch (err) {
      showToast(err.message || "Error deleting team", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Create Manual Team
  const handleOpenCreateTeam = () => {
    setActiveTeamData({
      teamName: "",
      selectedProblemStatement: "",
      payment: {
        transactionId: `MANUAL-${Date.now().toString().slice(-6)}`,
        status: "verified",
        receiptUrl: "/payment.png",
        receiptFileName: "manual-entry",
      },
      teamLeader: { ...EMPTY_MEMBER },
      teamMember1: { ...EMPTY_MEMBER },
      teamMember2: { ...EMPTY_MEMBER },
      teamMember3: { ...EMPTY_MEMBER },
    });
    setActiveMemberTab("teamLeader");
    setModalError("");
    setCreateTeamModalOpen(true);
  };

  const handleSaveCreateTeam = async () => {
    if (!activeTeamData?.teamName?.trim()) {
      setModalError("Team Name is required.");
      return;
    }
    if (!activeTeamData?.teamLeader?.name?.trim() || !activeTeamData?.teamLeader?.regNo?.trim()) {
      setModalError("Team Leader Name and Reg No are required.");
      return;
    }
    if (!activeTeamData?.teamMember1?.name?.trim() || !activeTeamData?.teamMember1?.regNo?.trim()) {
      setModalError("Member 1 Name and Reg No are required.");
      return;
    }
    if (!activeTeamData?.teamMember2?.name?.trim() || !activeTeamData?.teamMember2?.regNo?.trim()) {
      setModalError("Member 2 Name and Reg No are required.");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const payload = {
        password: password.trim(),
        teamName: activeTeamData.teamName.trim(),
        selectedProblemStatement: activeTeamData.selectedProblemStatement || null,
        payment: activeTeamData.payment,
        teamLeader: activeTeamData.teamLeader,
        teamMember1: activeTeamData.teamMember1,
        teamMember2: activeTeamData.teamMember2,
        teamMember3: activeTeamData.teamMember3?.name?.trim() ? activeTeamData.teamMember3 : undefined,
      };

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to create team");
      }

      showToast(`Team "${activeTeamData.teamName}" created successfully!`, "success");
      setCreateTeamModalOpen(false);
      fetchAllData();
    } catch (err) {
      setModalError(err.message || "Failed to create team.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper renderer for member cards
  const renderMemberCard = (member, roleLabel, roleBadgeColor, teamId, teamName, memberKey) => {
    if (!member || !member.name) {
      return (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-3 flex items-center justify-between text-xs text-white/40">
          <span>{roleLabel} (Not assigned)</span>
          <button
            onClick={() => handleOpenQuickStudent(teamId, teamName, memberKey, EMPTY_MEMBER)}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] transition-colors"
          >
            + Add Member
          </button>
        </div>
      );
    }

    const isHostel = String(member.residenceType || "").toLowerCase() === "hosteler";
    const g = String(member.gender || "").toLowerCase();
    const isFemale = g.includes("female") || g.includes("girl") || g === "f";

    return (
      <div className="relative group/member bg-black/40 hover:bg-black/60 border border-white/10 hover:border-pink-500/40 rounded-xl p-3.5 transition-all">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${roleBadgeColor}`}
            >
              {roleLabel}
            </span>
            <span className="text-[11px] font-mono font-semibold text-pink-300 bg-pink-950/40 border border-pink-500/20 px-1.5 py-0.5 rounded">
              {member.regNo}
            </span>
          </div>
          <button
            onClick={() => handleOpenQuickStudent(teamId, teamName, memberKey, member)}
            className="opacity-80 group-hover/member:opacity-100 p-1 hover:bg-pink-500/20 text-pink-300 rounded transition-all"
            title={`Edit ${roleLabel}`}
          >
            <Edit3 size={13} />
          </button>
        </div>

        <div className="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5 mb-1.5">
          {member.name}
          <span className="text-[10px] text-white/50 font-normal">
            ({isFemale ? "Female" : "Male"})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-white/70">
          <div className="flex items-center gap-1">
            <BookOpen size={11} className="text-amber-400 shrink-0" />
            <span>
              {member.branch || "N/A"} - Sec {member.section || "N/A"} (Yr {member.year || "1"})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Phone size={11} className="text-emerald-400 shrink-0" />
            <a
              href={`tel:${member.phoneNo}`}
              className="hover:underline hover:text-emerald-300 truncate"
            >
              {member.phoneNo || "N/A"}
            </a>
          </div>

          <div className="col-span-2 flex items-center gap-1 mt-0.5 text-[10px]">
            {isHostel ? (
              <span className="inline-flex items-center gap-1 text-purple-300 bg-purple-950/50 border border-purple-800/40 px-1.5 py-0.5 rounded">
                <Building2 size={10} />
                Hostel: {member.hostelName || "Hosteler"} (Room {member.roomNo || "-"}) | Warden:{" "}
                {member.wardenName || "-"} ({member.wardenPhoneNo || "-"})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sky-300 bg-sky-950/50 border border-sky-800/40 px-1.5 py-0.5 rounded">
                <Home size={10} />
                Day Scholar
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper renderer for student form tab inside modal
  const renderStudentFormFields = (memberState, setMemberState) => {
    const updateField = (field, val) => {
      setMemberState((prev) => ({
        ...prev,
        [field]: val,
      }));
    };

    const isHostel = String(memberState.residenceType || "").toLowerCase() === "hosteler";

    return (
      <div className="space-y-3.5 text-xs text-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/70 font-medium mb-1">
              Full Name <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              value={memberState.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/70 font-medium mb-1">
              Registration / Application No <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              value={memberState.regNo || ""}
              onChange={(e) => updateField("regNo", e.target.value.toUpperCase())}
              placeholder="e.g. 2300030001"
              className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white font-mono uppercase outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-white/70 font-medium mb-1">
              Phone Number <span className="text-pink-400">*</span>
            </label>
            <input
              type="tel"
              value={memberState.phoneNo || ""}
              onChange={(e) => updateField("phoneNo", e.target.value)}
              placeholder="10-digit number"
              className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/70 font-medium mb-1">
              Gender
            </label>
            <select
              value={memberState.gender || "Male"}
              onChange={(e) => updateField("gender", e.target.value)}
              className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-white/70 font-medium mb-1">
              Year of Study
            </label>
            <select
              value={memberState.year || "1"}
              onChange={(e) => updateField("year", e.target.value)}
              className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-white/70 font-medium mb-1">
              Branch <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              value={memberState.branch || ""}
              onChange={(e) => updateField("branch", e.target.value.toUpperCase())}
              placeholder="e.g. CSE, ECE, CS&IT"
              className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white uppercase outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/70 font-medium mb-1">
              Section <span className="text-pink-400">*</span>
            </label>
            <input
              type="text"
              value={memberState.section || ""}
              onChange={(e) => updateField("section", e.target.value.toUpperCase())}
              placeholder="e.g. 12, S1"
              className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white uppercase outline-none"
            />
          </div>
        </div>

        {/* Residence Type */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-white/90">
              Residence Type
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="radio"
                  name={`residence-${memberState.regNo || Math.random()}`}
                  checked={!isHostel}
                  onChange={() => updateField("residenceType", "dayScholar")}
                  className="accent-pink-500"
                />
                <span>Day Scholar</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="radio"
                  name={`residence-${memberState.regNo || Math.random()}`}
                  checked={isHostel}
                  onChange={() => updateField("residenceType", "hosteler")}
                  className="accent-pink-500"
                />
                <span>Hosteler</span>
              </label>
            </div>
          </div>

          {isHostel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-[10px] text-white/70 mb-1">
                  Hostel Name
                </label>
                <input
                  type="text"
                  value={memberState.hostelName || ""}
                  onChange={(e) => updateField("hostelName", e.target.value)}
                  placeholder="e.g. Tulip / Himalaya"
                  className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/70 mb-1">
                  Room No
                </label>
                <input
                  type="text"
                  value={memberState.roomNo || ""}
                  onChange={(e) => updateField("roomNo", e.target.value)}
                  placeholder="e.g. 402"
                  className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/70 mb-1">
                  Warden Name
                </label>
                <input
                  type="text"
                  value={memberState.wardenName || ""}
                  onChange={(e) => updateField("wardenName", e.target.value)}
                  placeholder="e.g. Mr. Sharma"
                  className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/70 mb-1">
                  Warden Phone No
                </label>
                <input
                  type="tel"
                  value={memberState.wardenPhoneNo || ""}
                  onChange={(e) => updateField("wardenPhoneNo", e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#07020d] text-white selection:bg-pink-500/30 selection:text-pink-200">
      <FashionBackground />
      <Navbar />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage.text && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-xl flex items-center gap-2.5 text-sm font-medium ${
              toastMessage.type === "error"
                ? "bg-red-950/90 border-red-500/50 text-red-200"
                : toastMessage.type === "info"
                ? "bg-sky-950/90 border-sky-500/50 text-sky-200"
                : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
            }`}
          >
            {toastMessage.type === "error" ? (
              <XCircle size={18} className="text-red-400" />
            ) : toastMessage.type === "info" ? (
              <Sparkles size={18} className="text-sky-400" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* If NOT Verified: Admin Passcode Login Modal/Gate */}
        {!isVerified ? (
          <div className="min-h-[70vh] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md bg-[#0B0616]/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#880A45] to-[#14216F] text-white border-b border-l border-white/20 px-4 py-1.5 font-['Cinzel'] text-xs tracking-widest font-bold rounded-tr-3xl shadow-sm">
                ADMIN AUTHENTICATION
              </div>

              <div className="relative text-center mt-4 flex flex-col items-center">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[#880A45] to-[#14216F] border border-white/20 mb-3 shadow-lg">
                  <Lock size={28} className="text-white" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-['Montserrat'] text-white">
                  ADMIN CONSOLE
                </h2>
                <p className="text-xs text-gray-300 mt-1 mb-6 font-normal max-w-xs">
                  Authenticate your administrator access key to manage teams, students, and configurations.
                </p>
              </div>

              {verifyError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center justify-center gap-2 font-['Cinzel'] tracking-wider shadow-sm text-left"
                >
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span>{verifyError}</span>
                </motion.div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyAdminKey();
                }}
                className="space-y-4"
              >
                <div className="text-left">
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                    MASTER ADMIN PASSCODE
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin passcode"
                      className="w-full h-11 bg-black/60 text-white border border-white/15 focus:border-[#880A45] rounded-xl px-4 pr-11 outline-none transition font-medium text-xs font-mono shadow-xs"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-pink-300 transition-colors p-1"
                      title={showPassword ? "Hide passcode" : "Show passcode"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isVerifying}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#880A45] to-[#14216F] hover:opacity-90 font-['Cinzel'] font-bold text-xs uppercase tracking-widest text-white shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <span>UNLOCK ADMIN VAULT »</span>
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-['Cinzel'] text-gray-400">
                <Link to="/home" className="hover:text-pink-300 transition-colors">
                  ← HOME
                </Link>
                <Link to="/admin/teamandividualmarks" className="hover:text-pink-300 transition-colors">
                  JURY LEADERBOARD →
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Dashboard Main Content */
          <div className="space-y-6">
            {/* Top Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-pink-600/20 border border-pink-500/40 text-pink-400">
                    <Users size={22} />
                  </span>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider font-['Montserrat'] bg-gradient-to-r from-white via-pink-100 to-pink-400 bg-clip-text text-transparent">
                      Student & Team Management
                    </h1>
                    <p className="text-xs text-white/60 font-['Montserrat'] mt-0.5">
                      Full control over registrations, students, payments, and problem assignments
                    </p>
                  </div>
                </div>

                {/* Quick Admin Page Links */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                  <Link
                    to="/admin/problems"
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <BookOpen size={12} className="text-pink-400" />
                    <span>Problems Console</span>
                  </Link>
                  <Link
                    to="/admin/teamandividualmarks"
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Crown size={12} className="text-amber-400" />
                    <span>Jury & Marks</span>
                  </Link>
                  <Link
                    to="/download"
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <FileText size={12} className="text-emerald-400" />
                    <span>Export Excel</span>
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleOpenCreateTeam}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-[#880A45] hover:opacity-90 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                >
                  <Plus size={16} />
                  <span>Add New Team</span>
                </button>

                <button
                  onClick={() => fetchAllData()}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all disabled:opacity-50"
                  title="Refresh data"
                >
                  <RotateCw size={16} className={isLoading ? "animate-spin text-pink-400" : ""} />
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 text-red-300 hover:text-red-200 transition-all flex items-center gap-1.5 text-xs font-['Cinzel'] font-bold cursor-pointer uppercase tracking-wider"
                  title="Lock Console & Logout"
                >
                  <Lock size={14} />
                  <span>Lock Console</span>
                </button>
              </div>
            </div>

            {/* Error banner if fetching failed */}
            {fetchError && (
              <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-2xl text-xs text-red-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-400 shrink-0" />
                  <span>{fetchError}</span>
                </div>
                <button
                  onClick={() => fetchAllData()}
                  className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Overview Metric Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
                <div className="text-[11px] text-white/60 font-medium uppercase tracking-wider">
                  Total Teams
                </div>
                <div className="text-2xl font-black text-white mt-1 font-mono">
                  {stats.totalTeams}
                </div>
                <div className="text-[10px] text-pink-400 mt-0.5">
                  {stats.assignedProblemCount} assigned themes
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
                <div className="text-[11px] text-white/60 font-medium uppercase tracking-wider">
                  Total Students
                </div>
                <div className="text-2xl font-black text-white mt-1 font-mono">
                  {stats.totalStudents}
                </div>
                <div className="text-[10px] text-white/50 mt-0.5">
                  Across all active roles
                </div>
              </div>

              <div className="bg-black/50 border border-emerald-500/20 rounded-2xl p-3.5 backdrop-blur-md">
                <div className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider">
                  Verified Paid
                </div>
                <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">
                  {stats.verifiedCount}
                </div>
                <div className="text-[10px] text-emerald-400/70 mt-0.5">
                  {stats.pendingCount} pending verification
                </div>
              </div>

              <div className="bg-black/50 border border-purple-500/20 rounded-2xl p-3.5 backdrop-blur-md">
                <div className="text-[11px] text-purple-300 font-medium uppercase tracking-wider">
                  Hostelers
                </div>
                <div className="text-2xl font-black text-purple-300 mt-1 font-mono">
                  {stats.totalHostelers}
                </div>
                <div className="text-[10px] text-purple-400/80 mt-0.5">
                  {stats.hostelGirls} Girls | {stats.hostelBoys} Boys
                </div>
              </div>

              <div className="bg-black/50 border border-sky-500/20 rounded-2xl p-3.5 backdrop-blur-md">
                <div className="text-[11px] text-sky-300 font-medium uppercase tracking-wider">
                  Day Scholars
                </div>
                <div className="text-2xl font-black text-sky-300 mt-1 font-mono">
                  {stats.totalDayScholars}
                </div>
                <div className="text-[10px] text-sky-400/80 mt-0.5">
                  {stats.dayScholarGirls} Girls | {stats.dayScholarBoys} Boys
                </div>
              </div>

              <div className="bg-black/50 border border-amber-500/20 rounded-2xl p-3.5 backdrop-blur-md">
                <div className="text-[11px] text-amber-300 font-medium uppercase tracking-wider">
                  Themes Active
                </div>
                <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
                  {problems.length}
                </div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">
                  Problem Statements
                </div>
              </div>
            </div>

            {/* Filter & Controls Panel */}
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* View Switcher Tabs */}
                <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-2xl">
                  <button
                    onClick={() => setViewMode(VIEW_MODES.TEAMS)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      viewMode === VIEW_MODES.TEAMS
                        ? "bg-gradient-to-r from-pink-600 to-[#880A45] text-white shadow-lg"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Layers size={14} />
                    <span>Teams View ({filteredTeams.length})</span>
                  </button>
                  <button
                    onClick={() => setViewMode(VIEW_MODES.STUDENTS)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      viewMode === VIEW_MODES.STUDENTS
                        ? "bg-gradient-to-r from-pink-600 to-[#880A45] text-white shadow-lg"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <UserCheck size={14} />
                    <span>Students Directory ({filteredStudents.length})</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student name, regNo, phone, team..."
                    className="w-full pl-10 pr-8 py-2 bg-white/5 border border-white/10 focus:border-pink-500 rounded-xl text-xs text-white placeholder:text-white/30 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Granular Filters Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-white/5 text-xs">
                {/* Payment status filter */}
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-pink-500 text-xs"
                  >
                    <option value="ALL">All Payments</option>
                    <option value="verified">Verified Only</option>
                    <option value="pending">Pending Only</option>
                    <option value="rejected">Rejected Only</option>
                  </select>
                </div>

                {/* Problem Statement filter */}
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">
                    Problem Theme
                  </label>
                  <select
                    value={problemFilter}
                    onChange={(e) => setProblemFilter(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-pink-500 text-xs truncate"
                  >
                    <option value="ALL">All Problem Themes</option>
                    <option value="ASSIGNED">Assigned Only</option>
                    <option value="UNASSIGNED">Unassigned Only</option>
                    {problems.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Residence Type filter */}
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">
                    Residence / Hostel
                  </label>
                  <select
                    value={residenceFilter}
                    onChange={(e) => setResidenceFilter(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-pink-500 text-xs"
                  >
                    <option value="ALL">All Residences</option>
                    <option value="hosteler">All Hostelers</option>
                    <option value="dayScholar">All Day Scholars</option>
                    <option value="hostel-girls">Hostel Girls</option>
                    <option value="hostel-boys">Hostel Boys</option>
                    <option value="dayscholar-girls">Day Scholar Girls</option>
                    <option value="dayscholar-boys">Day Scholar Boys</option>
                  </select>
                </div>

                {/* Year filter */}
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">
                    Year of Study
                  </label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-pink-500 text-xs"
                  >
                    <option value="ALL">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                {/* Branch filter */}
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">
                    Branch
                  </label>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-pink-500 text-xs truncate"
                  >
                    <option value="ALL">All Branches</option>
                    {availableBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender filter */}
                <div>
                  <label className="block text-[10px] text-white/50 uppercase font-semibold mb-1">
                    Gender
                  </label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-pink-500 text-xs"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Quick filter resets & expand/collapse */}
              <div className="flex items-center justify-between pt-2 text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <span>
                    Showing{" "}
                    <strong className="text-white">
                      {viewMode === VIEW_MODES.TEAMS
                        ? filteredTeams.length
                        : filteredStudents.length}
                    </strong>{" "}
                    records
                  </span>
                  {(searchQuery ||
                    paymentFilter !== "ALL" ||
                    problemFilter !== "ALL" ||
                    residenceFilter !== "ALL" ||
                    yearFilter !== "ALL" ||
                    branchFilter !== "ALL" ||
                    genderFilter !== "ALL") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setPaymentFilter("ALL");
                        setProblemFilter("ALL");
                        setResidenceFilter("ALL");
                        setYearFilter("ALL");
                        setBranchFilter("ALL");
                        setGenderFilter("ALL");
                      }}
                      className="text-pink-400 hover:underline flex items-center gap-1 ml-2"
                    >
                      <X size={12} /> Clear all filters
                    </button>
                  )}
                </div>

                {viewMode === VIEW_MODES.TEAMS && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={expandAll}
                      className="hover:text-white transition-colors"
                    >
                      Expand All
                    </button>
                    <span>•</span>
                    <button
                      onClick={collapseAll}
                      className="hover:text-white transition-colors"
                    >
                      Collapse All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* VIEW MODE 1: TEAMS CARDS / LIST */}
            {viewMode === VIEW_MODES.TEAMS && (
              <div className="space-y-4">
                {isLoading && teams.length === 0 ? (
                  <div className="text-center py-20 bg-black/40 border border-white/10 rounded-3xl">
                    <RotateCw size={32} className="animate-spin text-pink-500 mx-auto mb-3" />
                    <p className="text-sm text-white/70">Loading team registrations...</p>
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className="text-center py-16 bg-black/40 border border-white/10 rounded-3xl">
                    <FolderOpen size={40} className="text-white/20 mx-auto mb-3" />
                    <p className="text-base font-semibold text-white/80">No teams found</p>
                    <p className="text-xs text-white/50 mt-1">
                      Try adjusting your search query or filters.
                    </p>
                  </div>
                ) : (
                  filteredTeams.map((team, index) => {
                    const isExpanded = expandedTeamIds.has(team._id);
                    const paymentStatus = team.payment?.status || "pending";
                    const problemTitle =
                      team.selectedProblemStatement?.title || "No Problem Assigned";

                    return (
                      <motion.div
                        key={team._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/60 backdrop-blur-xl border border-white/10 hover:border-pink-500/30 rounded-3xl overflow-hidden transition-all shadow-xl"
                      >
                        {/* Team Header Bar */}
                        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-white/[0.03] to-transparent">
                          <div className="flex items-start sm:items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-pink-400 shrink-0">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide font-['Montserrat']">
                                  {team.teamName}
                                </h3>

                                {/* Payment badge */}
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1 ${
                                    paymentStatus === "verified"
                                      ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                                      : paymentStatus === "rejected"
                                      ? "bg-red-950/80 border-red-500/40 text-red-300"
                                      : "bg-amber-950/80 border-amber-500/40 text-amber-300"
                                  }`}
                                >
                                  <CreditCard size={10} />
                                  {paymentStatus}
                                </span>

                                {/* Problem theme pill */}
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border truncate max-w-xs ${
                                    team.selectedProblemStatement
                                      ? "bg-purple-950/60 border-purple-500/30 text-purple-300"
                                      : "bg-white/5 border-white/10 text-white/40"
                                  }`}
                                >
                                  {problemTitle}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50 mt-1">
                                <span>
                                  TXN:{" "}
                                  <strong className="text-white/80 font-mono">
                                    {team.payment?.transactionId || "N/A"}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Registered:{" "}
                                  {team.submittedAt
                                    ? new Date(team.submittedAt).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons for this team */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Quick payment toggle */}
                            <select
                              value={paymentStatus}
                              onChange={(e) =>
                                handleQuickPaymentStatus(team._id, e.target.value)
                              }
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer transition-all ${
                                paymentStatus === "verified"
                                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                                  : paymentStatus === "rejected"
                                  ? "bg-red-950/60 border-red-500/40 text-red-300"
                                  : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="verified">Verified</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            {/* View Receipt */}
                            {team.payment?.receiptUrl && (
                              <button
                                onClick={() => setReceiptModalUrl(team.payment.receiptUrl)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                                title="View Receipt image"
                              >
                                <Eye size={13} />
                                <span>Receipt</span>
                              </button>
                            )}

                            {/* Edit Team Full Button */}
                            <button
                              onClick={() => handleOpenEditTeam(team)}
                              className="px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-200 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Edit3 size={13} />
                              <span>Edit Team</span>
                            </button>

                            {/* Delete Team Button */}
                            <button
                              onClick={() => {
                                setTeamToDelete(team);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 text-red-300 transition-colors"
                              title="Delete Team"
                            >
                              <Trash2 size={14} />
                            </button>

                            {/* Accordion expand toggle */}
                            <button
                              onClick={() => toggleTeamExpand(team._id)}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors ml-1"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Member Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/10 p-4 sm:p-5 bg-black/40 space-y-4"
                            >
                              {/* Quick Problem Assignment Dropdown row */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                                <div className="flex items-center gap-2 text-xs">
                                  <Sparkles size={14} className="text-pink-400" />
                                  <span className="text-white/70 font-medium">
                                    Assigned Theme:
                                  </span>
                                  <span className="font-bold text-white">
                                    {problemTitle}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <select
                                    value={
                                      team.selectedProblemStatement?._id ||
                                      team.selectedProblemStatement ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleQuickProblemAssign(team._id, e.target.value)
                                    }
                                    className="bg-black/80 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-pink-500"
                                  >
                                    <option value="">-- Clear Problem Statement --</option>
                                    {problems.map((p) => (
                                      <option key={p._id} value={p._id}>
                                        {p.title} ({p.slotsTaken || 0}/{p.limit || 7} slots)
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* 4 Team Member Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {renderMemberCard(
                                  team.teamLeader,
                                  "Team Leader",
                                  "bg-amber-500/20 text-amber-300 border border-amber-500/40",
                                  team._id,
                                  team.teamName,
                                  "teamLeader"
                                )}
                                {renderMemberCard(
                                  team.teamMember1,
                                  "Member 1",
                                  "bg-pink-500/20 text-pink-300 border border-pink-500/40",
                                  team._id,
                                  team.teamName,
                                  "teamMember1"
                                )}
                                {renderMemberCard(
                                  team.teamMember2,
                                  "Member 2",
                                  "bg-purple-500/20 text-purple-300 border border-purple-500/40",
                                  team._id,
                                  team.teamName,
                                  "teamMember2"
                                )}
                                {renderMemberCard(
                                  team.teamMember3,
                                  "Member 3",
                                  "bg-sky-500/20 text-sky-300 border border-sky-500/40",
                                  team._id,
                                  team.teamName,
                                  "teamMember3"
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW MODE 2: FLAT STUDENTS DIRECTORY */}
            {viewMode === VIEW_MODES.STUDENTS && (
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                        <th className="py-3.5 px-4">Student Name</th>
                        <th className="py-3.5 px-4">Reg No</th>
                        <th className="py-3.5 px-4">Team</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Academic</th>
                        <th className="py-3.5 px-4">Residence & Hostel</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-white/50">
                            No students match the current criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((item, idx) => {
                          const m = item.data;
                          const isHostel =
                            String(m.residenceType || "").toLowerCase() === "hosteler";
                          const g = String(m.gender || "").toLowerCase();
                          const isFemale =
                            g.includes("female") || g.includes("girl") || g === "f";

                          return (
                            <tr
                              key={`${item.teamId}-${item.memberKey}-${idx}`}
                              className="hover:bg-white/[0.03] transition-colors"
                            >
                              <td className="py-3 px-4 font-semibold text-white">
                                <div className="flex items-center gap-1.5">
                                  <span>{m.name}</span>
                                  <span className="text-[10px] text-white/40">
                                    ({isFemale ? "F" : "M"})
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-pink-300 bg-pink-950/40 border border-pink-500/20 px-1.5 py-0.5 rounded text-[11px]">
                                  {m.regNo}
                                </span>
                              </td>

                              <td className="py-3 px-4 font-medium text-white/90">
                                {item.teamName}
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    item.memberKey === "teamLeader"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-white/10 text-white/80"
                                  }`}
                                >
                                  {item.roleName}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-white/70">
                                <div>
                                  {m.branch || "N/A"} - Sec {m.section || "N/A"}
                                </div>
                                <div className="text-[10px] text-white/40">
                                  Year {m.year || "1"}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                {isHostel ? (
                                  <div className="text-[11px] text-purple-300">
                                    <span className="font-medium">
                                      {m.hostelName || "Hostel"}
                                    </span>{" "}
                                    (Rm {m.roomNo || "-"})
                                    <div className="text-[10px] text-white/40">
                                      Warden: {m.wardenName || "-"}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sky-300 text-[11px]">
                                    Day Scholar
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <a
                                  href={`tel:${m.phoneNo}`}
                                  className="text-emerald-400 hover:underline font-mono"
                                >
                                  {m.phoneNo || "-"}
                                </a>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() =>
                                    handleOpenQuickStudent(
                                      item.teamId,
                                      item.teamName,
                                      item.memberKey,
                                      m
                                    )
                                  }
                                  className="px-2.5 py-1 bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 border border-pink-500/30 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                >
                                  <Edit3 size={11} />
                                  <span>Edit</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT FULL TEAM (TEAM + 4 MEMBERS + PAYMENT + PROBLEM STATEMENT) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editTeamModalOpen && activeTeamData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl max-h-[90vh] bg-[#0c0414] border border-pink-500/40 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden relative text-white"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-pink-600/20 text-pink-400">
                    <Edit3 size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold font-['Montserrat'] uppercase tracking-wider">
                      Edit Team Details
                    </h2>
                    <p className="text-xs text-white/50">
                      Modifying "{activeTeamData.teamName}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditTeamModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Error */}
              {modalError && (
                <div className="mt-3 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2 shrink-0">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
                {/* Team Name & Problem Statement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/70 font-medium mb-1">
                      Team Name <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={activeTeamData.teamName}
                      onChange={(e) =>
                        setActiveTeamData((prev) => ({
                          ...prev,
                          teamName: e.target.value,
                        }))
                      }
                      className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 font-medium mb-1">
                      Assigned Problem Statement
                    </label>
                    <select
                      value={activeTeamData.selectedProblemStatement || ""}
                      onChange={(e) =>
                        setActiveTeamData((prev) => ({
                          ...prev,
                          selectedProblemStatement: e.target.value,
                        }))
                      }
                      className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
                    >
                      <option value="">-- No Problem Assigned --</option>
                      {problems.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({p.slotsTaken || 0}/{p.limit || 7} slots)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Configuration Row */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="font-semibold text-white/90 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-emerald-400" />
                    <span>Payment Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-white/60 mb-1">
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        value={activeTeamData.payment?.transactionId || ""}
                        onChange={(e) =>
                          setActiveTeamData((prev) => ({
                            ...prev,
                            payment: {
                              ...prev.payment,
                              transactionId: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/60 mb-1">
                        Payment Status
                      </label>
                      <select
                        value={activeTeamData.payment?.status || "pending"}
                        onChange={(e) =>
                          setActiveTeamData((prev) => ({
                            ...prev,
                            payment: {
                              ...prev.payment,
                              status: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/60 mb-1">
                        Receipt URL / File
                      </label>
                      <input
                        type="text"
                        value={activeTeamData.payment?.receiptUrl || ""}
                        onChange={(e) =>
                          setActiveTeamData((prev) => ({
                            ...prev,
                            payment: {
                              ...prev.payment,
                              receiptUrl: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-2.5 py-1.5 text-white text-xs outline-none truncate"
                      />
                    </div>
                  </div>
                </div>

                {/* Member Sub-Tabs for Leader, Member 1, 2, 3 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white/90">
                      Team Members Details
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
                    {[
                      { key: "teamLeader", label: "Team Leader", badge: "Leader" },
                      { key: "teamMember1", label: "Member 1", badge: "M1" },
                      { key: "teamMember2", label: "Member 2", badge: "M2" },
                      { key: "teamMember3", label: "Member 3 (Opt)", badge: "M3" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveMemberTab(tab.key)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 ${
                          activeMemberTab === tab.key
                            ? "bg-pink-600 text-white shadow-lg"
                            : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Member Form Body */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
                    {renderStudentFormFields(
                      activeTeamData[activeMemberTab] || EMPTY_MEMBER,
                      (updater) => {
                        setActiveTeamData((prev) => ({
                          ...prev,
                          [activeMemberTab]:
                            typeof updater === "function"
                              ? updater(prev[activeMemberTab] || EMPTY_MEMBER)
                              : updater,
                        }));
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditTeamModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveTeam}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-[#880A45] hover:opacity-90 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Team Details</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK EDIT SINGLE STUDENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {quickStudentModalOpen && quickStudentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] bg-[#0c0414] border border-pink-500/40 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden relative text-white"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-pink-600/20 text-pink-400">
                    <User size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold font-['Montserrat'] uppercase tracking-wider">
                      Edit Student Details
                    </h2>
                    <p className="text-xs text-white/50">
                      Team: <strong>{quickStudentTarget.teamName}</strong> • Role:{" "}
                      <strong>{quickStudentTarget.memberKey}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQuickStudentModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="mt-3 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2 shrink-0">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
                {renderStudentFormFields(
                  quickStudentTarget.memberData,
                  (updater) => {
                    setQuickStudentTarget((prev) => ({
                      ...prev,
                      memberData:
                        typeof updater === "function"
                          ? updater(prev.memberData)
                          : updater,
                    }));
                  }
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuickStudentModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveQuickStudent}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-[#880A45] hover:opacity-90 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>Updating Student...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Update Student</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW TEAM MANUALLY */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {createTeamModalOpen && activeTeamData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl max-h-[90vh] bg-[#0c0414] border border-pink-500/40 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden relative text-white"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-pink-600/20 text-pink-400">
                    <Plus size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold font-['Montserrat'] uppercase tracking-wider">
                      Add New Team
                    </h2>
                    <p className="text-xs text-white/50">
                      Manually register a team into the system
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateTeamModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {modalError && (
                <div className="mt-3 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2 shrink-0">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/70 font-medium mb-1">
                      Team Name <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={activeTeamData.teamName}
                      onChange={(e) =>
                        setActiveTeamData((prev) => ({
                          ...prev,
                          teamName: e.target.value,
                        }))
                      }
                      placeholder="e.g. Code Ninjas"
                      className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/70 font-medium mb-1">
                      Assign Problem Statement (Optional)
                    </label>
                    <select
                      value={activeTeamData.selectedProblemStatement || ""}
                      onChange={(e) =>
                        setActiveTeamData((prev) => ({
                          ...prev,
                          selectedProblemStatement: e.target.value,
                        }))
                      }
                      className="w-full bg-black/60 border border-white/20 focus:border-pink-500 rounded-lg px-3 py-2 text-white outline-none"
                    >
                      <option value="">-- Assign Later --</option>
                      {problems.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} ({p.slotsTaken || 0}/{p.limit || 7} slots)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Member Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-white/10 pb-2">
                    {[
                      { key: "teamLeader", label: "Team Leader *" },
                      { key: "teamMember1", label: "Member 1 *" },
                      { key: "teamMember2", label: "Member 2 *" },
                      { key: "teamMember3", label: "Member 3 (Opt)" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveMemberTab(tab.key)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                          activeMemberTab === tab.key
                            ? "bg-pink-600 text-white shadow-lg"
                            : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
                    {renderStudentFormFields(
                      activeTeamData[activeMemberTab] || EMPTY_MEMBER,
                      (updater) => {
                        setActiveTeamData((prev) => ({
                          ...prev,
                          [activeMemberTab]:
                            typeof updater === "function"
                              ? updater(prev[activeMemberTab] || EMPTY_MEMBER)
                              : updater,
                        }));
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreateTeamModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCreateTeam}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-[#880A45] hover:opacity-90 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RotateCw size={14} className="animate-spin" />
                      <span>Creating Team...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Create Team</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {deleteModalOpen && teamToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c0414] border border-red-500/40 rounded-3xl p-6 shadow-2xl text-white space-y-4 text-center"
            >
              <div className="inline-flex p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-400">
                <Trash2 size={28} />
              </div>

              <h3 className="text-lg font-bold font-['Montserrat']">
                Delete Team Registration?
              </h3>

              <p className="text-xs text-white/70">
                Are you sure you want to permanently delete team{" "}
                <strong className="text-white font-mono text-sm">
                  "{teamToDelete.teamName}"
                </strong>
                ? This action cannot be undone and will free up any reserved problem
                statement slot.
              </p>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-red-900/50 disabled:opacity-50"
                >
                  {isSaving ? (
                    <RotateCw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>Delete Permanently</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: RECEIPT PREVIEW MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {receiptModalUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl max-h-[90vh] bg-black border border-white/20 rounded-3xl p-4 shadow-2xl flex flex-col text-white relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Payment Receipt Preview
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={receiptModalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:bg-white/10 rounded text-pink-400"
                    title="Open in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => setReceiptModalUrl(null)}
                    className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto py-3 flex items-center justify-center">
                <img
                  src={receiptModalUrl}
                  alt="Payment Receipt"
                  className="max-h-[70vh] w-auto object-contain rounded-xl border border-white/10 shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamAndStudentManagement;
