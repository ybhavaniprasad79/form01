const express = require("express");
const cors = require("cors");
const xlsx = require("xlsx");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { connect } = require("./connect");
const {
  TeamRegistration,
  AppSettings,
  ProblemStatement,
  Track,
  RoundMarks,
} = require("./model");
const { cloudinary, upload } = require("./cloudinary");
const app = express();

const MAX_TEAMS_PER_PROBLEM = 7;

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "app is running" });
});

// Admin password verification (for unlocking admin UI)
app.post("/api/admin/verify", (req, res) => {
  const { password } = req.body || {};

  if (!password || password !== process.env.adminPassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid password",
    });
  }

  return res.status(200).json({
    success: true,
  });
});

// Admin: list all problem statements (password protected, ignores global toggle)
app.get("/api/admin/problems", async (req, res) => {
  try {
    const { password } = req.query;

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const problems = await ProblemStatement.find(
      {},
      {
        title: 1,
        track: 1,
        trackTitle: 1,
        trackFocus: 1,
        themePng: 1,
        shortDescription: 1,
        fullDescription: 1,
        slotsTaken: 1,
        limit: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    )
      .populate("track")
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: problems.length,
      data: problems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// =========================================================================
// TRACKS MANAGEMENT ENDPOINTS (Title & Focus Area)
// =========================================================================

// Public: fetch all tracks
app.get("/api/tracks", async (req, res) => {
  try {
    const tracks = await Track.find().sort({ createdAt: 1 }).lean();
    return res.status(200).json({
      success: true,
      total: tracks.length,
      data: tracks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: create a new track (title and focus)
app.post("/api/tracks", async (req, res) => {
  try {
    const { password, title, focus } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Track title is required",
      });
    }

    if (!focus || !String(focus).trim()) {
      return res.status(400).json({
        success: false,
        message: "Track focus is required",
      });
    }

    const track = await Track.create({
      title: String(title).trim(),
      focus: String(focus).trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Track created successfully",
      data: track,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: update track (title and focus)
app.put("/api/tracks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password, title, focus } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid track id",
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Track title is required",
      });
    }

    if (!focus || !String(focus).trim()) {
      return res.status(400).json({
        success: false,
        message: "Track focus is required",
      });
    }

    const trimmedTitle = String(title).trim();
    const trimmedFocus = String(focus).trim();

    const updatedTrack = await Track.findByIdAndUpdate(
      id,
      { title: trimmedTitle, focus: trimmedFocus },
      { new: true, runValidators: true },
    ).lean();

    if (!updatedTrack) {
      return res.status(404).json({
        success: false,
        message: "Track not found",
      });
    }

    // Sync denormalized track info to all problem statements referencing this track
    await ProblemStatement.updateMany(
      { track: id },
      { $set: { trackTitle: trimmedTitle, trackFocus: trimmedFocus } },
    );

    return res.status(200).json({
      success: true,
      message: "Track updated successfully",
      data: updatedTrack,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: delete track
app.delete("/api/tracks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid track id",
      });
    }

    const deleted = await Track.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Track not found",
      });
    }

    // Unset track on any problem statement referencing this track
    await ProblemStatement.updateMany(
      { track: id },
      { $set: { track: null, trackTitle: "", trackFocus: "" } },
    );

    return res.status(200).json({
      success: true,
      message: "Track deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

const getProblemStatementsEnabled = async () => {
  let settings = await AppSettings.findOne({ key: "problemStatementsEnabled" });
  if (!settings) {
    settings = await AppSettings.create({
      key: "problemStatementsEnabled",
      enabled: true,
      updatedAt: new Date(),
    });
  }

  return settings.enabled !== false;
};

// Public: fetch whether problem statements are enabled
app.get(["/api/problems/config", "/api/config/problems-enabled"], async (req, res) => {
  try {
    const enabled = await getProblemStatementsEnabled();
    return res.status(200).json({
      success: true,
      enabled,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: enable/disable problem statements (password protected)
app.post(["/api/admin/problems/config", "/api/config/problems-enabled"], async (req, res) => {
  try {
    const { password, enabled } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const normalizedEnabled = Boolean(enabled);

    const updated = await AppSettings.findOneAndUpdate(
      { key: "problemStatementsEnabled" },
      { $set: { enabled: normalizedEnabled, updatedAt: new Date() } },
      { upsert: true, returnDocument: "after" },
    ).lean();

    return res.status(200).json({
      success: true,
      enabled: updated.enabled !== false,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Public: fetch all problem statements
app.get("/api/problems", async (req, res) => {
  try {
    const enabled = await getProblemStatementsEnabled();
    if (!enabled) {
      return res.status(200).json({
        success: true,
        total: 0,
        data: [],
        disabled: true,
      });
    }

    const problems = await ProblemStatement.find(
      {},
      {
        title: 1,
        track: 1,
        trackTitle: 1,
        trackFocus: 1,
        themePng: 1,
        shortDescription: 1,
        fullDescription: 1,
        slotsTaken: 1,
        limit: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    )
      .populate("track")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      total: problems.length,
      data: problems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: create a new problem statement (password protected)
app.post("/api/problems", async (req, res) => {
  try {
    const {
      password,
      trackId,
      track,
      title,
      themePng,
      imgUrl,
      shortDescription,
      fullDescription,
      longDescription,
      limit,
    } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (String(title).trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters",
      });
    }

    const sDesc = String(shortDescription || "").trim();
    if (!sDesc) {
      return res.status(400).json({
        success: false,
        message: "Short description is required",
      });
    }

    const chosenTrackId = trackId || track || null;
    let trackDoc = null;
    if (chosenTrackId && mongoose.Types.ObjectId.isValid(String(chosenTrackId))) {
      trackDoc = await Track.findById(chosenTrackId).lean();
    }

    const created = await ProblemStatement.create({
      title: String(title).trim(),
      track: trackDoc ? trackDoc._id : null,
      trackTitle: trackDoc ? trackDoc.title : "",
      trackFocus: trackDoc ? trackDoc.focus : "",
      themePng: String(themePng !== undefined ? themePng : (imgUrl || "")).trim(),
      shortDescription: sDesc,
      fullDescription: String(fullDescription !== undefined ? fullDescription : (longDescription || "")).trim(),
      limit: typeof limit === "number" && limit > 0 ? limit : 7,
    });

    const populated = await ProblemStatement.findById(created._id).populate("track").lean();

    res.status(201).json({
      success: true,
      message: "Problem statement created",
      data: populated,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: update an existing problem statement (password protected)
app.put("/api/problems/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      password,
      trackId,
      track,
      title,
      themePng,
      imgUrl,
      shortDescription,
      fullDescription,
      longDescription,
      limit,
    } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const sDesc = String(shortDescription || "").trim();
    if (!sDesc) {
      return res.status(400).json({
        success: false,
        message: "Short description is required",
      });
    }

    const updateFields = {
      title: String(title).trim(),
      themePng: String(themePng !== undefined ? themePng : (imgUrl || "")).trim(),
      shortDescription: sDesc,
      fullDescription: String(fullDescription !== undefined ? fullDescription : (longDescription || "")).trim(),
      limit: typeof limit === "number" && limit > 0 ? limit : 7,
    };

    const chosenTrackId = trackId !== undefined ? trackId : (track !== undefined ? track : undefined);
    if (chosenTrackId !== undefined) {
      if (chosenTrackId && mongoose.Types.ObjectId.isValid(String(chosenTrackId))) {
        const trackDoc = await Track.findById(chosenTrackId).lean();
        updateFields.track = trackDoc ? trackDoc._id : null;
        updateFields.trackTitle = trackDoc ? trackDoc.title : "";
        updateFields.trackFocus = trackDoc ? trackDoc.focus : "";
      } else {
        updateFields.track = null;
        updateFields.trackTitle = "";
        updateFields.trackFocus = "";
      }
    }

    const updated = await ProblemStatement.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true },
    ).populate("track").lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Problem statement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Problem statement updated",
      data: updated,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || "Validation error",
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: delete an existing problem statement (password protected)
app.delete("/api/problems/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }

    const deleted = await ProblemStatement.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Problem statement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Problem statement deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// GET endpoint to fetch all teams with leader + members (admin only - password protected)
app.get("/api/teams", async (req, res) => {
  try {
    const { password } = req.query;

    // Check password (use environment variable for security)
    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const teams = await TeamRegistration.find(
      {},
      {
        teamName: 1,
        teamLeader: 1,
        teamMember1: 1,
        teamMember2: 1,
        teamMember3: 1,
        payment: 1,
        submittedAt: 1,
      },
    )
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      totalTeams: teams.length,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: list teams that selected a problem statement (password protected)
app.get("/api/admin/teams/selected", async (req, res) => {
  try {
    const { password } = req.query;

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const teams = await TeamRegistration.find(
      {},
      {
        teamName: 1,
        teamLeader: 1,
        selectedProblemStatement: 1,
        selectedProblemSelectedAt: 1,
        submittedAt: 1,
        submissions: 1,
      },
    )
      .populate({
        path: "selectedProblemStatement",
        select: { title: 1, shortDescription: 1, fullDescription: 1, track: 1, trackTitle: 1, trackFocus: 1, themePng: 1 },
      })
      .sort({ selectedProblemSelectedAt: -1, submittedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: teams.length,
      data: teams,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: Full team and student management list (password protected)
app.get("/api/admin/teams-management", async (req, res) => {
  try {
    const password = req.query.password || req.headers["x-admin-password"];

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const teams = await TeamRegistration.find()
      .populate({
        path: "selectedProblemStatement",
        select: { title: 1, shortDescription: 1, fullDescription: 1, limit: 1, slotsTaken: 1 },
      })
      .sort({ submittedAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalTeams: teams.length,
      data: teams,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error fetching teams for management",
      error: error.message,
    });
  }
});

// Admin: Update any details of a team and its students (password protected)
app.put("/api/admin/teams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      password,
      teamName,
      teamLeader,
      teamMember1,
      teamMember2,
      teamMember3,
      payment,
      selectedProblemStatement,
    } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    let team;
    if (mongoose.Types.ObjectId.isValid(String(id))) {
      team = await TeamRegistration.findById(id);
    }
    if (!team) {
      team = await TeamRegistration.findOne({ teamName: id });
    }
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check team name uniqueness if updated
    if (teamName && teamName.trim() && teamName.trim().toLowerCase() !== team.teamName.toLowerCase()) {
      const existingTeam = await TeamRegistration.findOne({
        _id: { $ne: team._id },
        teamName: { $regex: new RegExp(`^${escapeRegex(teamName.trim())}$`, "i") },
      });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: `Team name "${teamName.trim()}" already taken by another team`,
        });
      }
      team.teamName = teamName.trim();
    }

    // Collect regNos to check internal and cross-team duplicates
    const incomingLeader = teamLeader || team.teamLeader;
    const incomingM1 = teamMember1 || team.teamMember1;
    const incomingM2 = teamMember2 || team.teamMember2;
    const incomingM3 = teamMember3 !== undefined ? teamMember3 : team.teamMember3;

    const allMembers = [
      { role: "Leader", data: incomingLeader },
      { role: "Member 1", data: incomingM1 },
      { role: "Member 2", data: incomingM2 },
      { role: "Member 3", data: incomingM3 },
    ];

    const regNos = allMembers
      .filter((m) => m.data && m.data.regNo && String(m.data.regNo).trim())
      .map((m) => String(m.data.regNo).trim().toUpperCase());

    const uniqueRegNos = new Set(regNos);
    if (uniqueRegNos.size !== regNos.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate registration / application numbers found within the team members",
      });
    }

    // Check cross-team duplicate regNos
    if (regNos.length > 0) {
      const duplicateTeam = await TeamRegistration.findOne({
        _id: { $ne: team._id },
        $or: [
          { "teamLeader.regNo": { $in: regNos } },
          { "teamMember1.regNo": { $in: regNos } },
          { "teamMember2.regNo": { $in: regNos } },
          { "teamMember3.regNo": { $in: regNos } },
        ],
      });
      if (duplicateTeam) {
        return res.status(400).json({
          success: false,
          message: `One or more registration numbers already belong to team "${duplicateTeam.teamName}"`,
        });
      }
    }

    // Update members
    if (teamLeader) team.teamLeader = { ...team.teamLeader, ...teamLeader };
    if (teamMember1) team.teamMember1 = { ...team.teamMember1, ...teamMember1 };
    if (teamMember2) team.teamMember2 = { ...team.teamMember2, ...teamMember2 };
    if (teamMember3 !== undefined) {
      team.teamMember3 = teamMember3 && teamMember3.name ? { ...team.teamMember3, ...teamMember3 } : teamMember3;
    }

    // Handle problem statement adjustment
    if (selectedProblemStatement !== undefined) {
      const currentProbId = team.selectedProblemStatement ? String(team.selectedProblemStatement) : null;
      const targetProbId = selectedProblemStatement && String(selectedProblemStatement).trim() ? String(selectedProblemStatement).trim() : null;

      if (currentProbId !== targetProbId) {
        // Decrement previous problem statement
        if (currentProbId && mongoose.Types.ObjectId.isValid(currentProbId)) {
          await ProblemStatement.findByIdAndUpdate(currentProbId, { $inc: { slotsTaken: -1 } });
          await ProblemStatement.updateOne({ _id: currentProbId, slotsTaken: { $lt: 0 } }, { $set: { slotsTaken: 0 } });
        }
        // Increment new problem statement
        if (targetProbId && mongoose.Types.ObjectId.isValid(targetProbId)) {
          await ProblemStatement.findByIdAndUpdate(targetProbId, { $inc: { slotsTaken: 1 } });
          team.selectedProblemStatement = targetProbId;
          team.selectedProblemSelectedAt = new Date();
          if (!team.submissions || team.submissions.length === 0) {
            team.submissions = [{ canvaFigmaLink: "", note: "", isSubmitted: false, submittedAt: null }];
          }
        } else {
          team.selectedProblemStatement = null;
          team.selectedProblemSelectedAt = null;
          team.submissions = [];
        }
      }
    }

    // Handle payment updates
    if (payment) {
      if (payment.transactionId && payment.transactionId.trim()) {
        const transId = payment.transactionId.trim();
        // Check uniqueness across other teams
        const dupTrans = await TeamRegistration.findOne({
          _id: { $ne: team._id },
          "payment.transactionId": { $regex: new RegExp(`^${escapeRegex(transId)}$`, "i") },
        });
        if (dupTrans) {
          return res.status(400).json({
            success: false,
            message: `Transaction ID "${transId}" is already used by team "${dupTrans.teamName}"`,
          });
        }
        team.payment.transactionId = transId;
      }
      if (payment.receiptUrl !== undefined) team.payment.receiptUrl = payment.receiptUrl;
      if (payment.receiptFileName !== undefined) team.payment.receiptFileName = payment.receiptFileName;
      if (payment.status && ["pending", "verified", "rejected"].includes(payment.status)) {
        team.payment.status = payment.status;
        if (payment.status === "verified" && !team.payment.verifiedAt) {
          team.payment.verifiedAt = new Date();
        } else if (payment.status !== "verified") {
          team.payment.verifiedAt = null;
        }
      }
    }

    await team.save();

    const populatedTeam = await TeamRegistration.findById(team._id)
      .populate({
        path: "selectedProblemStatement",
        select: { title: 1, shortDescription: 1, fullDescription: 1, limit: 1, slotsTaken: 1 },
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Team and student details updated successfully",
      data: populatedTeam,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || "Validation error",
        errors: messages,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error updating team",
      error: error.message,
    });
  }
});

// Admin: Quick update a single student/member in a team (password protected)
app.patch("/api/admin/teams/:id/member/:memberKey", async (req, res) => {
  try {
    const { id, memberKey } = req.params;
    const { password, memberData } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!["teamLeader", "teamMember1", "teamMember2", "teamMember3"].includes(memberKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member role key",
      });
    }

    let team;
    if (mongoose.Types.ObjectId.isValid(String(id))) {
      team = await TeamRegistration.findById(id);
    }
    if (!team) {
      team = await TeamRegistration.findOne({ teamName: id });
    }
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const regNo = memberData?.regNo ? String(memberData.regNo).trim().toUpperCase() : null;
    if (regNo) {
      // Check duplicate within other members of this team
      const otherMembers = ["teamLeader", "teamMember1", "teamMember2", "teamMember3"]
        .filter((k) => k !== memberKey && team[k] && team[k].regNo)
        .map((k) => String(team[k].regNo).trim().toUpperCase());

      if (otherMembers.includes(regNo)) {
        return res.status(400).json({
          success: false,
          message: `Registration number "${regNo}" is already used by another member in this team`,
        });
      }

      // Check duplicate across other teams
      const duplicateTeam = await TeamRegistration.findOne({
        _id: { $ne: team._id },
        $or: [
          { "teamLeader.regNo": regNo },
          { "teamMember1.regNo": regNo },
          { "teamMember2.regNo": regNo },
          { "teamMember3.regNo": regNo },
        ],
      });
      if (duplicateTeam) {
        return res.status(400).json({
          success: false,
          message: `Registration number "${regNo}" already belongs to team "${duplicateTeam.teamName}"`,
        });
      }
    }

    team[memberKey] = { ...team[memberKey], ...memberData };
    await team.save();

    const populatedTeam = await TeamRegistration.findById(team._id)
      .populate({
        path: "selectedProblemStatement",
        select: { title: 1, shortDescription: 1, fullDescription: 1, limit: 1, slotsTaken: 1 },
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: `${memberKey} details updated successfully`,
      data: populatedTeam,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error updating member details",
      error: error.message,
    });
  }
});

// Admin: Manually create a new team (password protected)
app.post("/api/admin/teams", async (req, res) => {
  try {
    const {
      password,
      teamName,
      teamLeader,
      teamMember1,
      teamMember2,
      teamMember3,
      payment,
      selectedProblemStatement,
    } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Team name is required",
      });
    }

    const existingTeam = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${escapeRegex(teamName.trim())}$`, "i") },
    });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: `Team name "${teamName.trim()}" already exists`,
      });
    }

    const regNos = [
      teamLeader?.regNo,
      teamMember1?.regNo,
      teamMember2?.regNo,
      teamMember3?.regNo,
    ]
      .filter(Boolean)
      .map((r) => String(r).trim().toUpperCase());

    const uniqueRegNos = new Set(regNos);
    if (uniqueRegNos.size !== regNos.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate registration numbers found in the team",
      });
    }

    if (regNos.length > 0) {
      const duplicate = await TeamRegistration.findOne({
        $or: [
          { "teamLeader.regNo": { $in: regNos } },
          { "teamMember1.regNo": { $in: regNos } },
          { "teamMember2.regNo": { $in: regNos } },
          { "teamMember3.regNo": { $in: regNos } },
        ],
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `One or more registration numbers already belong to team "${duplicate.teamName}"`,
        });
      }
    }

    const newTeam = new TeamRegistration({
      teamName: teamName.trim(),
      teamLeader: teamLeader || {},
      teamMember1: teamMember1 || {},
      teamMember2: teamMember2 || {},
      teamMember3: teamMember3 || {},
      payment: {
        transactionId: payment?.transactionId ? payment.transactionId.trim() : `MANUAL-${Date.now()}`,
        receiptUrl: payment?.receiptUrl || "/payment.png",
        receiptFileName: payment?.receiptFileName || "",
        status: payment?.status || "verified",
        verifiedAt: payment?.status === "verified" || !payment?.status ? new Date() : null,
      },
      selectedProblemStatement: selectedProblemStatement && mongoose.Types.ObjectId.isValid(selectedProblemStatement) ? selectedProblemStatement : null,
      selectedProblemSelectedAt: selectedProblemStatement ? new Date() : null,
      submissions: selectedProblemStatement ? [{ canvaFigmaLink: "", note: "", isSubmitted: false, submittedAt: null }] : [],
    });

    if (selectedProblemStatement && mongoose.Types.ObjectId.isValid(selectedProblemStatement)) {
      await ProblemStatement.findByIdAndUpdate(selectedProblemStatement, { $inc: { slotsTaken: 1 } });
    }

    await newTeam.save();

    const populated = await TeamRegistration.findById(newTeam._id)
      .populate("selectedProblemStatement")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: populated,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || "Validation error",
        errors: messages,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error creating team",
      error: error.message,
    });
  }
});

// Admin: Delete a team (password protected)
app.delete("/api/admin/teams/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    let team;
    if (mongoose.Types.ObjectId.isValid(String(id))) {
      team = await TeamRegistration.findById(id);
    }
    if (!team) {
      team = await TeamRegistration.findOne({ teamName: id });
    }
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Decrement slotsTaken on problem statement if selected
    if (team.selectedProblemStatement) {
      await ProblemStatement.findByIdAndUpdate(team.selectedProblemStatement, {
        $inc: { slotsTaken: -1 },
      });
      await ProblemStatement.updateOne(
        { _id: team.selectedProblemStatement, slotsTaken: { $lt: 0 } },
        { $set: { slotsTaken: 0 } },
      );
    }

    await TeamRegistration.findByIdAndDelete(team._id);

    return res.status(200).json({
      success: true,
      message: `Team "${team.teamName}" deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error deleting team",
      error: error.message,
    });
  }
});

// Helper to find a team by teamId (ObjectId) or teamName
const findTeamByIdentifier = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(String(identifier))) {
    const team = await TeamRegistration.findById(identifier);
    if (team) return team;
  }
  return await TeamRegistration.findOne({ teamName: identifier });
};

// Admin: reset selected problem statement for a team (password protected)
app.post(["/api/admin/team/:teamId/reset-problem", "/api/admin/teams/:teamId/reset-problem"], async (req, res) => {
  try {
    const { password } = req.body || {};

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const { teamId } = req.params;
    const team = await findTeamByIdentifier(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const problemId = team.selectedProblemStatement;
    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: "Team has not selected any problem statement",
      });
    }

    // Decrement slotsTaken on the problem statement
    await ProblemStatement.findByIdAndUpdate(problemId, {
      $inc: { slotsTaken: -1 },
    });

    // Also update slotsTaken to not go below 0 (just in case)
    await ProblemStatement.updateOne(
      { _id: problemId, slotsTaken: { $lt: 0 } },
      { $set: { slotsTaken: 0 } },
    );

    // Clear the problem selection in the team document
    team.selectedProblemStatement = null;
    team.selectedProblemSelectedAt = null;
    team.submissions = [];
    await team.save();

    return res.status(200).json({
      success: true,
      message: "Problem statement reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


// Admin: reset (clear & unlock) all submission forms for a team (password protected)
app.post(["/api/admin/team/:teamId/reset-submissions", "/api/admin/teams/:teamId/reset-submissions"], async (req, res) => {
  try {
    const { password } = req.body || {};
    const { teamId } = req.params;

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const team = await findTeamByIdentifier(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Reset submissions array to a single fresh empty slot
    team.submissions = [{
      canvaFigmaLink: "",
      note: "",
      isSubmitted: false,
      submittedAt: null,
    }];

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Submissions reset successfully",
      data: team,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: reset (clear & unlock) team project submission form slot (password protected)
app.post(["/api/admin/team/:teamId/reset-form/:formIndex", "/api/admin/teams/:teamId/reset-form/:formIndex"], async (req, res) => {
  try {
    const { password } = req.body || {};
    const { teamId, formIndex } = req.params;
    const index = parseInt(formIndex, 10);

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid form index",
      });
    }

    const team = await findTeamByIdentifier(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (!team.submissions || index >= team.submissions.length) {
      return res.status(400).json({
        success: false,
        message: "Form index out of bounds",
      });
    }

    const submission = team.submissions[index];
    submission.canvaFigmaLink = "";
    submission.note = "";
    submission.isSubmitted = false;
    submission.submittedAt = null;

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Form reset successfully",
      data: team,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: add another submission form for team (password protected)
app.post(["/api/admin/team/:teamId/add-form", "/api/admin/teams/:teamId/add-form"], async (req, res) => {
  try {
    const { password } = req.body || {};
    const { teamId } = req.params;

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const team = await findTeamByIdentifier(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (!team.submissions) {
      team.submissions = [];
    }

    team.submissions.push({
      canvaFigmaLink: "",
      note: "",
      isSubmitted: false,
      submittedAt: null,
    });

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Form added successfully",
      data: team,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Admin: remove team project submission form (password protected)
app.post(["/api/admin/team/:teamId/remove-form/:formIndex", "/api/admin/teams/:teamId/remove-form/:formIndex"], async (req, res) => {
  try {
    const { password } = req.body || {};
    const { teamId, formIndex } = req.params;
    const index = parseInt(formIndex, 10);

    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid form index",
      });
    }

    const team = await findTeamByIdentifier(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (!team.submissions || index >= team.submissions.length) {
      return res.status(400).json({
        success: false,
        message: "Form index out of bounds",
      });
    }

    if (team.submissions.length <= 1) {
      return res.status(400).json({
        success: false,
        message: "A team must have at least one submission form",
      });
    }

    // Remove the form at the specified index
    team.submissions.splice(index, 1);

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Form removed successfully",
      data: team,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

app.post("/api/verify-admin", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required",
    });
  }

  if (password !== process.env.adminPassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid password",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Authenticated",
  });
});

// GET endpoint to fetch team registration count
app.get("/api/teams/count", async (req, res) => {
  try {
    let settings = await AppSettings.findOne({ key: "maxTeams" });

    // If no settings exist, create default
    if (!settings) {
      settings = await AppSettings.create({
        key: "maxTeams",
        maxTeams: 50,
        updatedAt: new Date(),
      });
    }

    const count = await TeamRegistration.countDocuments();
    res.status(200).json({
      success: true,
      count,
      maxTeams: settings.maxTeams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch team count",
      error: error.message,
    });
  }
});

// GET endpoint to fetch all registered team names
app.get("/api/teams", async (req, res) => {
  try {
    const teams = await TeamRegistration.find({}, { teamName: 1, _id: 1 }).sort(
      { submittedAt: -1 },
    );

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teams",
      error: error.message,
    });
  }
});

// GET endpoint to fetch marks board with all rounds and team scores
app.get("/api/marks-board", async (req, res) => {
  try {
    const teams = await TeamRegistration.find(
      {},
      {
        teamName: 1,
        selectedProblemStatement: 1,
        teamLeader: 1,
        teamMember1: 1,
        teamMember2: 1,
        teamMember3: 1,
      }
    )
      .populate({
        path: "selectedProblemStatement",
        select: { title: 1 },
      })
      .sort({
        submittedAt: -1,
      });
    const rounds = await RoundMarks.find().sort({ createdAt: 1 });
    const problems = await ProblemStatement.find({}, { title: 1 }).sort({ title: 1 });
    const outOfByRound = {};

    rounds.forEach((round) => {
      outOfByRound[round.roundName] = round.outOf;
    });

    const teamsWithMarks = teams.map((team) => {
      const roundMarks = {};
      let total = 0;

      rounds.forEach((round) => {
        const teamMark = round.teamMarks?.find(
          (tm) => tm.teamName === team.teamName,
        );
        const mark = teamMark ? teamMark.mark : 0;
        roundMarks[round.roundName] = mark;
        total += mark;
      });

      const theme = team.selectedProblemStatement?.title || "Unassigned";

      return {
        _id: team._id,
        teamName: team.teamName,
        theme,
        selectedProblemStatement: team.selectedProblemStatement,
        roundMarks,
        total,
      };
    });

    const individualStudents = [];
    teams.forEach((team) => {
      const theme = team.selectedProblemStatement?.title || "Unassigned";

      const processMember = (m, role) => {
        if (!m || !m.name || !String(m.name).trim()) return;
        const regNo = String(m.regNo || "").trim().toUpperCase();
        if (!regNo) return;

        const roundMarks = {};
        let total = 0;

        rounds.forEach((round) => {
          const sMark = round.individualMarks?.find(
            (im) => String(im.regNo).trim().toUpperCase() === regNo
          );
          const mark = sMark ? sMark.mark : 0;
          roundMarks[round.roundName] = mark;
          total += mark;
        });

        individualStudents.push({
          _id: `${team._id}-${regNo}`,
          regNo,
          studentName: m.name,
          teamName: team.teamName,
          theme,
          role,
          year: m.year || "1",
          branch: m.branch || "",
          section: m.section || "",
          gender: m.gender || "",
          residenceType: m.residenceType || "",
          hostelName: m.hostelName || "",
          roomNo: m.roomNo || "",
          phoneNo: m.phoneNo || "",
          roundMarks,
          total,
        });
      };

      processMember(team.teamLeader, "Team Leader");
      processMember(team.teamMember1, "Member 1");
      processMember(team.teamMember2, "Member 2");
      processMember(team.teamMember3, "Member 3");
    });

    res.status(200).json({
      success: true,
      rounds: rounds.map((r) => r.roundName),
      outOfByRound,
      problemStatements: problems.map((p) => p.title),
      data: teamsWithMarks,
      individualStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch marks board",
      error: error.message,
    });
  }
});

// PATCH endpoint to update individual student marks in a round
app.patch("/api/individual-marks", async (req, res) => {
  try {
    const { regNo, studentName, teamName, roundName, mark } = req.body;

    if (!regNo || !roundName || mark === undefined || mark === null) {
      return res.status(400).json({
        success: false,
        message: "regNo, roundName and mark are required",
      });
    }

    const numericMark = Number(mark);
    if (!Number.isFinite(numericMark)) {
      return res.status(400).json({
        success: false,
        message: "Mark must be a valid number",
      });
    }

    const round = await RoundMarks.findOne({ roundName: roundName.trim() });
    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    if (numericMark < 0 || numericMark > round.outOf) {
      return res.status(400).json({
        success: false,
        message: `Mark must be between 0 and ${round.outOf}`,
      });
    }

    const normalizedRegNo = String(regNo).trim().toUpperCase();
    if (!round.individualMarks) {
      round.individualMarks = [];
    }

    const studentMarkIndex = round.individualMarks.findIndex(
      (im) => String(im.regNo).trim().toUpperCase() === normalizedRegNo
    );

    if (studentMarkIndex === -1) {
      round.individualMarks.push({
        regNo: normalizedRegNo,
        studentName: studentName || "",
        teamName: teamName || "",
        mark: numericMark,
      });
    } else {
      round.individualMarks[studentMarkIndex].mark = numericMark;
      if (studentName) round.individualMarks[studentMarkIndex].studentName = studentName;
      if (teamName) round.individualMarks[studentMarkIndex].teamName = teamName;
    }

    await round.save();

    res.status(200).json({
      success: true,
      message: "Individual mark updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update individual mark",
      error: error.message,
    });
  }
});

// POST endpoint to create a new round
app.post(["/api/marks/round", "/api/rounds"], async (req, res) => {
  try {
    const { roundName, outOf } = req.body;

    if (!roundName || !roundName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Round name is required",
      });
    }

    const numericOutOf = Number(outOf);
    if (!Number.isFinite(numericOutOf) || numericOutOf < 1) {
      return res.status(400).json({
        success: false,
        message: "Out of mark must be a valid number greater than 0",
      });
    }

    const normalizedRound = roundName.trim();

    // Check if round already exists
    const existingRound = await RoundMarks.findOne({
      roundName: normalizedRound,
    });
    if (existingRound) {
      return res.status(400).json({
        success: false,
        message: "Round name already exists",
      });
    }

    // Get all teams
    const teams = await TeamRegistration.find({}, { teamName: 1 });

    // Create round with all teams initialized to 0
    const teamMarks = teams.map((team) => ({
      teamName: team.teamName,
      mark: 0,
    }));

    const newRound = await RoundMarks.create({
      roundName: normalizedRound,
      outOf: numericOutOf,
      teamMarks,
    });

    res.status(200).json({
      success: true,
      message: "Round created successfully",
      round: newRound.roundName,
      outOf: newRound.outOf,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create round",
      error: error.message,
    });
  }
});

// PUT endpoint to update round name and/or out of marks
app.put(["/api/marks/round", "/api/rounds/:roundName", "/api/rounds"], async (req, res) => {
  try {
    const oldRoundName = req.params.roundName || req.body.oldRoundName || req.body.roundName;
    const { newRoundName, outOf } = req.body;

    if (!oldRoundName || !oldRoundName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Old round name is required",
      });
    }

    if (!newRoundName || !newRoundName.trim()) {
      return res.status(400).json({
        success: false,
        message: "New round name is required",
      });
    }

    const numericOutOf = Number(outOf);
    if (!Number.isFinite(numericOutOf) || numericOutOf < 1) {
      return res.status(400).json({
        success: false,
        message: "Out of mark must be a valid number greater than 0",
      });
    }

    const normalizedOldRound = oldRoundName.trim();
    const normalizedNewRound = newRoundName.trim();

    // Find the round to update
    const roundToUpdate = await RoundMarks.findOne({
      roundName: normalizedOldRound,
    });

    if (!roundToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    // Check if new round name already exists (only if changing the name)
    if (normalizedOldRound !== normalizedNewRound) {
      const existingRound = await RoundMarks.findOne({
        roundName: normalizedNewRound,
      });
      if (existingRound) {
        return res.status(400).json({
          success: false,
          message: "Round name already exists",
        });
      }
    }

    // Update the round
    roundToUpdate.roundName = normalizedNewRound;
    roundToUpdate.outOf = numericOutOf;
    await roundToUpdate.save();

    res.status(200).json({
      success: true,
      message: "Round updated successfully",
      round: roundToUpdate.roundName,
      outOf: roundToUpdate.outOf,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update round",
      error: error.message,
    });
  }
});

// PATCH endpoint to update marks for a team in a round
app.patch("/api/marks", async (req, res) => {
  try {
    const { teamName, roundName, mark } = req.body;

    if (!teamName || !roundName || mark === undefined || mark === null) {
      return res.status(400).json({
        success: false,
        message: "teamName, roundName and mark are required",
      });
    }

    const numericMark = Number(mark);
    if (!Number.isFinite(numericMark)) {
      return res.status(400).json({
        success: false,
        message: "Mark must be a valid number",
      });
    }

    // Find the round and update the team's mark
    const round = await RoundMarks.findOne({ roundName: roundName.trim() });
    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    if (numericMark < 0 || numericMark > round.outOf) {
      return res.status(400).json({
        success: false,
        message: `Mark must be between 0 and ${round.outOf}`,
      });
    }

    const teamMarkIndex = round.teamMarks.findIndex(
      (tm) => tm.teamName === teamName,
    );
    if (teamMarkIndex === -1) {
      // Team doesn't exist in this round, add it
      round.teamMarks.push({ teamName, mark: numericMark });
    } else {
      round.teamMarks[teamMarkIndex].mark = numericMark;
    }

    await round.save();

    res.status(200).json({
      success: true,
      message: "Mark updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update mark",
      error: error.message,
    });
  }
});

// GET endpoint to fetch teams with round marks
app.get("/api/marks-board", async (req, res) => {
  try {
    const teams = await TeamRegistration.find(
      {},
      { teamName: 1, roundMarks: 1 },
    ).sort({ submittedAt: -1 });

    const roundsSet = new Set();
    const formattedTeams = teams.map((team) => {
      const roundMarks = team.roundMarks
        ? Object.fromEntries(team.roundMarks)
        : {};
      Object.keys(roundMarks).forEach((round) => roundsSet.add(round));

      const total = Object.values(roundMarks).reduce((sum, value) => {
        const numericValue = Number(value);
        return sum + (Number.isFinite(numericValue) ? numericValue : 0);
      }, 0);

      return {
        _id: team._id,
        teamName: team.teamName,
        roundMarks,
        total,
      };
    });

    res.status(200).json({
      success: true,
      rounds: Array.from(roundsSet),
      data: formattedTeams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch marks board",
      error: error.message,
    });
  }
});

// POST endpoint to create a new round for all teams
app.post("/api/marks/round", async (req, res) => {
  try {
    const { roundName } = req.body;

    if (!roundName || !roundName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Round name is required",
      });
    }

    const normalizedRound = roundName.trim();
    const teams = await TeamRegistration.find();

    await Promise.all(
      teams.map(async (team) => {
        const existingValue = team.roundMarks
          ? team.roundMarks.get(normalizedRound)
          : undefined;
        if (existingValue === undefined) {
          team.roundMarks = team.roundMarks || new Map();
          team.roundMarks.set(normalizedRound, 0);
          await team.save();
        }
      }),
    );

    res.status(200).json({
      success: true,
      message: "Round created successfully",
      round: normalizedRound,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create round",
      error: error.message,
    });
  }
});

// PATCH endpoint to update marks for a team in a round
app.patch("/api/marks", async (req, res) => {
  try {
    const { teamId, roundName, mark } = req.body;

    if (!teamId || !roundName || mark === undefined || mark === null) {
      return res.status(400).json({
        success: false,
        message: "teamId, roundName and mark are required",
      });
    }

    const numericMark = Number(mark);
    if (!Number.isFinite(numericMark)) {
      return res.status(400).json({
        success: false,
        message: "Mark must be a valid number",
      });
    }

    const team = await TeamRegistration.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    team.roundMarks = team.roundMarks || new Map();
    team.roundMarks.set(roundName.trim(), numericMark);
    await team.save();

    const roundMarks = Object.fromEntries(team.roundMarks || []);
    const total = Object.values(roundMarks).reduce((sum, value) => {
      const numericValue = Number(value);
      return sum + (Number.isFinite(numericValue) ? numericValue : 0);
    }, 0);

    res.status(200).json({
      success: true,
      message: "Mark updated successfully",
      data: {
        _id: team._id,
        teamName: team.teamName,
        roundMarks,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update mark",
      error: error.message,
    });
  }
});

// POST endpoint to upload receipt to Cloudinary
app.post("/api/upload-receipt", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Use promise-based upload with timeout
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "team-registrations/receipts",
          resource_type: "auto",
          allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
          timeout: 60000,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      // Convert buffer to stream and pipe to Cloudinary
      const streamifier = require("streamifier");
      const stream = streamifier.createReadStream(req.file.buffer);

      stream.on("error", (error) => {
        uploadStream.destroy();
        reject(error);
      });

      stream.pipe(uploadStream);
    });

    const result = await uploadPromise;

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during file upload",
      error: error.message || "Unknown error",
    });
  }
});

// GET endpoint to check team name availability
app.get("/api/check-team-name/:teamName", async (req, res) => {
  try {
    const { teamName } = req.params;

    if (!teamName || !teamName.trim()) {
      return res.json({
        available: true,
        message: "",
      });
    }

    const existingTeam = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${escapeRegex(teamName)}$`, "i") },
    });

    if (existingTeam) {
      return res.json({
        available: false,
        message: "Team name already exists",
      });
    }

    res.json({
      available: true,
      message: "Team name is available",
    });
  } catch (error) {
    console.error("Team name check error:", error);
    res.status(500).json({
      available: true,
      message: "",
    });
  }
});

// GET endpoint to fetch a team dashboard by Team Key (team name, case-insensitive)
app.get("/api/team/:teamKey", async (req, res) => {
  try {
    const { teamKey } = req.params;

    const normalized = (teamKey || "").trim();
    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: "Team Key is required",
      });
    }

    const team = await TeamRegistration.findOne(
      { teamName: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") } },
      {
        teamName: 1,
        teamLeader: 1,
        teamMember1: 1,
        teamMember2: 1,
        teamMember3: 1,
        selectedProblemStatement: 1,
        selectedProblemSelectedAt: 1,
        submittedAt: 1,
        "payment.status": 1,
        submissions: 1,
      },
    ).lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Invalid Team Key",
      });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Public: set selected problem statement for a team (one-time)
app.post("/api/team/:teamKey/select-problem", async (req, res) => {
  try {
    const { teamKey } = req.params;
    const { problemId } = req.body || {};

    const normalizedTeamKey = (teamKey || "").trim();
    if (!normalizedTeamKey) {
      return res.status(400).json({
        success: false,
        message: "Team Key is required",
      });
    }

    const normalizedProblemId = String(problemId || "").trim();
    if (!normalizedProblemId) {
      return res.status(400).json({
        success: false,
        message: "problemId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(normalizedProblemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid problemId",
      });
    }

    const problem = await ProblemStatement.findById(normalizedProblemId).lean();
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem statement not found",
      });
    }
    const problemLimit =
      typeof problem.limit === "number" && problem.limit > 0
        ? problem.limit
        : MAX_TEAMS_PER_PROBLEM;

    const teamNameQuery = {
      teamName: {
        $regex: new RegExp(`^${escapeRegex(normalizedTeamKey)}$`, "i"),
      },
    };

    const existingTeam = await TeamRegistration.findOne(teamNameQuery, {
      _id: 1,
      selectedProblemStatement: 1,
    }).lean();

    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (existingTeam.selectedProblemStatement) {
      return res.status(409).json({
        success: false,
        message: "Problem statement already selected",
      });
    }

    // Ensure we don't exceed the per-problem limit.
    // First, sync `slotsTaken` up to the actual selected count (helps with existing DBs).
    const currentSelectedCount = await TeamRegistration.countDocuments({
      selectedProblemStatement: normalizedProblemId,
    });

    await ProblemStatement.updateOne(
      {
        _id: normalizedProblemId,
        $or: [
          { slotsTaken: { $exists: false } },
          { slotsTaken: { $lt: currentSelectedCount } },
        ],
      },
      { $set: { slotsTaken: currentSelectedCount } },
    );

    if (currentSelectedCount >= problemLimit) {
      return res.status(409).json({
        success: false,
        code: "PROBLEM_FULL",
        message: `This problem statement already has ${problemLimit} teams.`,
      });
    }

    const reserved = await ProblemStatement.findOneAndUpdate(
      {
        _id: normalizedProblemId,
        slotsTaken: { $lt: problemLimit },
      },
      { $inc: { slotsTaken: 1 } },
      { returnDocument: "after", projection: { _id: 1, slotsTaken: 1 } },
    ).lean();

    if (!reserved) {
      return res.status(409).json({
        success: false,
        code: "PROBLEM_FULL",
        message: `This problem statement already has ${problemLimit} teams.`,
      });
    }

    const updated = await TeamRegistration.findOneAndUpdate(
      {
        ...teamNameQuery,
        $or: [
          { selectedProblemStatement: null },
          { selectedProblemStatement: { $exists: false } },
        ],
      },
      {
        $set: {
          selectedProblemStatement: normalizedProblemId,
          selectedProblemSelectedAt: new Date(),
          submissions: [{ canvaFigmaLink: "", note: "", isSubmitted: false, submittedAt: null }],
        },
      },
      {
        returnDocument: "after",
        projection: {
          teamName: 1,
          selectedProblemStatement: 1,
          selectedProblemSelectedAt: 1,
          submissions: 1,
        },
      },
    ).lean();

    if (!updated) {
      // Rollback the reservation if we couldn't write the team selection.
      await ProblemStatement.updateOne(
        { _id: normalizedProblemId, slotsTaken: { $gt: 0 } },
        { $inc: { slotsTaken: -1 } },
      );

      const latestTeam = await TeamRegistration.findOne(teamNameQuery, {
        selectedProblemStatement: 1,
      }).lean();

      if (!latestTeam) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      if (latestTeam.selectedProblemStatement) {
        return res.status(409).json({
          success: false,
          message: "Problem statement already selected",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Unable to select problem statement",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Problem statement selected",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Public: submit a Canva/Figma link and note for a team (formIndex 0-indexed)
app.post("/api/team/:teamKey/submit-form/:formIndex", async (req, res) => {
  try {
    const { teamKey, formIndex } = req.params;
    const { canvaFigmaLink, note } = req.body || {};
    const index = parseInt(formIndex, 10);

    const normalizedTeamKey = (teamKey || "").trim();
    if (!normalizedTeamKey) {
      return res.status(400).json({
        success: false,
        message: "Team Key is required",
      });
    }

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid form index",
      });
    }

    const team = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${escapeRegex(normalizedTeamKey)}$`, "i") },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (!team.selectedProblemStatement) {
      return res.status(400).json({
        success: false,
        message: "No problem statement selected yet",
      });
    }

    // Initialize submissions if empty
    if (!team.submissions || team.submissions.length === 0) {
      team.submissions = [{ canvaFigmaLink: "", note: "", isSubmitted: false, submittedAt: null }];
    }

    if (index >= team.submissions.length) {
      return res.status(400).json({
        success: false,
        message: "Form index out of bounds",
      });
    }

    const submission = team.submissions[index];
    if (submission.isSubmitted) {
      return res.status(400).json({
        success: false,
        message: "Form is already submitted and locked against changes",
      });
    }

    submission.canvaFigmaLink = (canvaFigmaLink || "").trim();
    submission.note = (note || "").trim();
    submission.isSubmitted = true;
    submission.submittedAt = new Date();

    // Update global submittedAt of the team to show activity
    team.submittedAt = new Date();

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Form submitted successfully",
      data: team,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// PUT endpoint for team registration form submission
app.put("/api/register", async (req, res) => {
  try {
    const { teamName, teamLeader, teamMember1, teamMember2, teamMember3, payment } =
      req.body;

    // Validate required fields
    if (!teamName || !teamLeader || !teamMember1 || !teamMember2 || !teamMember3) {
      return res.status(400).json({
        success: false,
        message: "Team name and all 4 team members information are required",
      });
    }

    // Validate payment fields
    if (!payment || !payment.transactionId || !payment.receiptUrl) {
      return res.status(400).json({
        success: false,
        message: "Payment information (transaction ID and receipt) is required",
      });
    }

    if (!payment.transactionId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID cannot be empty",
      });
    }

    if (!payment.receiptUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Receipt upload is required",
      });
    }

    // Check if team name already exists (case-insensitive)
    const existingTeam = await TeamRegistration.findOne({
      teamName: { $regex: new RegExp(`^${escapeRegex(teamName.trim())}$`, "i") },
    });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message:
          "Team name already exists. Please choose a different team name",
      });
    }

    // Check if transaction ID already exists (case-insensitive)
    const existingTransaction = await TeamRegistration.findOne({
      "payment.transactionId": { $regex: new RegExp(`^${escapeRegex(payment.transactionId.trim())}$`, "i") },
    });
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction ID already registered. Please use a different transaction ID",
      });
    }

    // Check if registration limit reached
    let settings = await AppSettings.findOne({ key: "maxTeams" });

    // If no settings exist, create default
    if (!settings) {
      settings = await AppSettings.create({
        key: "maxTeams",
        maxTeams: 50,
        updatedAt: new Date(),
      });
    }

    const teamCount = await TeamRegistration.countDocuments();
    if (teamCount >= settings.maxTeams) {
      return res.status(400).json({
        success: false,
        message: `Registration closed. Maximum limit of ${settings.maxTeams} teams has been reached`,
      });
    }

    // Collect all registration/application numbers
    const regNos = [
      String(teamLeader?.regNo || "").trim().toUpperCase(),
      String(teamMember1?.regNo || "").trim().toUpperCase(),
      String(teamMember2?.regNo || "").trim().toUpperCase(),
      String(teamMember3?.regNo || "").trim().toUpperCase(),
    ];

    // Check for duplicates within the same team
    const uniqueRegNos = new Set(regNos);
    if (uniqueRegNos.size !== regNos.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate registration / application numbers found within the team",
      });
    }

    // Check if any registration number already exists in the database
    const existingRegistrations = await TeamRegistration.find({
      $or: [
        { "teamLeader.regNo": { $in: regNos } },
        { "teamMember1.regNo": { $in: regNos } },
        { "teamMember2.regNo": { $in: regNos } },
        { "teamMember3.regNo": { $in: regNos } },
      ],
    });

    if (existingRegistrations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more registration / application numbers already exist in the system",
      });
    }

    // Create new team registration document with payment
    const teamRegistration = new TeamRegistration({
      teamName,
      teamLeader,
      teamMember1,
      teamMember2,
      teamMember3,
      payment: {
        transactionId: payment.transactionId.trim(),
        receiptUrl: payment.receiptUrl,
        receiptFileName: payment.receiptFileName || "",
        status: "pending",
      },
    });

    // Save to database
    await teamRegistration.save();

    res.status(201).json({
      success: true,
      message: "Team registration and payment submitted successfully",
      data: teamRegistration,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = error.keyPattern?.teamName
        ? "Team name"
        : error.keyPattern?.["payment.transactionId"]
          ? "Transaction ID"
          : "Registration number";
      return res.status(400).json({
        success: false,
        message: `${field} already exists in the system`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Helper classifier functions for student data
const isHostelMember = (m) => String(m?.residenceType || "").trim().toLowerCase() === "hosteler";
const isDayScholarMember = (m) => !isHostelMember(m);
const isFemaleMember = (m) => {
  const g = String(m?.gender || "").trim().toLowerCase();
  return g.includes("female") || g.includes("girl") || g === "f";
};
const isMaleMember = (m) => {
  const g = String(m?.gender || "").trim().toLowerCase();
  return (g.includes("male") || g.includes("boy") || g === "m") && !isFemaleMember(m);
};

// GET / POST endpoint to get categorized download statistics
app.post("/api/download-stats", async (req, res) => {
  try {
    const { password } = req.body;
    const DOWNLOAD_PASSWORD = process.env.DOWNLOAD_PASSWORD;

    if (!password || password !== DOWNLOAD_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const teams = await TeamRegistration.find().sort({ createdAt: -1 });

    let totalStudents = 0;
    let hostelGirls = 0;
    let hostelBoys = 0;
    let dayScholarGirls = 0;
    let dayScholarBoys = 0;

    teams.forEach((t) => {
      const members = [t.teamLeader, t.teamMember1, t.teamMember2, t.teamMember3].filter(
        (m) => m && m.name && m.name.trim()
      );

      members.forEach((m) => {
        totalStudents++;
        if (isHostelMember(m)) {
          if (isFemaleMember(m)) hostelGirls++;
          else if (isMaleMember(m)) hostelBoys++;
          else hostelBoys++; // fallback
        } else {
          if (isFemaleMember(m)) dayScholarGirls++;
          else if (isMaleMember(m)) dayScholarBoys++;
          else dayScholarBoys++; // fallback
        }
      });
    });

    res.json({
      success: true,
      stats: {
        totalTeams: teams.length,
        totalStudents,
        hostelGirls,
        hostelBoys,
        dayScholarGirls,
        dayScholarBoys,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching download statistics",
      error: error.message,
    });
  }
});

// POST endpoint for downloading categorized team/student data as Excel (.xlsx)
app.post("/api/download-teams", async (req, res) => {
  try {
    const { password, category = "all" } = req.body;

    const DOWNLOAD_PASSWORD = process.env.DOWNLOAD_PASSWORD;

    if (!password || password !== DOWNLOAD_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Fetch all team registrations
    const teams = await TeamRegistration.find().sort({ createdAt: -1 });

    if (teams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No teams registered yet",
      });
    }

    let excelData = [];
    let sheetName = "Team Registrations";
    let filePrefix = "Master_Team_Registrations";

    if (category === "all" || category === "master") {
      sheetName = "All Team Registrations";
      filePrefix = "Master_Team_Registrations";

      teams.forEach((team, index) => {
        const getMemberExcelRow = (m, memberType, isLeader) => ({
          "S.No": isLeader ? index + 1 : "",
          "Team Name": isLeader ? team.teamName : "",
          "Member Role": memberType,
          "Student Name": m?.name || "",
          "Reg No": m?.regNo || "",
          Gender: m?.gender || "",
          "Residence Type": m?.residenceType === "hosteler" ? "Hosteler" : "Day Scholar",
          "Hostel Name": m?.residenceType === "hosteler" ? (m?.hostelName || "") : "N/A",
          "Room No": m?.residenceType === "hosteler" ? (m?.roomNo || "") : "N/A",
          "Warden Name": m?.residenceType === "hosteler" ? (m?.wardenName || "") : "N/A",
          "Warden Phone No": m?.residenceType === "hosteler" ? (m?.wardenPhoneNo || "") : "N/A",
          "Student Phone": m?.phoneNo || "",
          Email: m?.regNo ? `${m.regNo}@klu.ac.in` : "",
          Year: m?.year || "",
          Branch: m?.branch || "",
          Section: m?.section || "",
          "Transaction ID": isLeader ? team.payment.transactionId : "",
          "Payment Status": isLeader ? team.payment.status : "",
          "Receipt URL": isLeader ? team.payment.receiptUrl : "",
          "Registered On": isLeader && team.submittedAt
            ? new Date(team.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : "",
        });

        if (team.teamLeader) {
          excelData.push(getMemberExcelRow(team.teamLeader, "Team Leader", true));
        }
        if (team.teamMember1) {
          excelData.push(getMemberExcelRow(team.teamMember1, "Member 1", false));
        }
        if (team.teamMember2) {
          excelData.push(getMemberExcelRow(team.teamMember2, "Member 2", false));
        }
        if (team.teamMember3 && team.teamMember3.name) {
          excelData.push(getMemberExcelRow(team.teamMember3, "Member 3", false));
        }
      });
    } else {
      // Categorized member-wise exports
      let filterFn = null;

      if (category === "hostel-girls") {
        sheetName = "Hostel Girls";
        filePrefix = "Hostel_Girls_Registrations";
        filterFn = (m) => isHostelMember(m) && isFemaleMember(m);
      } else if (category === "hostel-boys") {
        sheetName = "Hostel Boys";
        filePrefix = "Hostel_Boys_Registrations";
        filterFn = (m) => isHostelMember(m) && isMaleMember(m);
      } else if (category === "dayscholar-girls") {
        sheetName = "Day Scholar Girls";
        filePrefix = "DayScholar_Girls_Registrations";
        filterFn = (m) => isDayScholarMember(m) && isFemaleMember(m);
      } else if (category === "dayscholar-boys") {
        sheetName = "Day Scholar Boys";
        filePrefix = "DayScholar_Boys_Registrations";
        filterFn = (m) => isDayScholarMember(m) && isMaleMember(m);
      }

      let serialNo = 1;

      teams.forEach((team) => {
        const checkAndPush = (m, roleName) => {
          if (m && m.name && filterFn && filterFn(m)) {
            excelData.push({
              "S.No": serialNo++,
              "Student Name": m.name || "",
              "Reg No": m.regNo || "",
              Gender: m.gender || "",
              "Residence Type": isHostelMember(m) ? "Hosteler" : "Day Scholar",
              "Hostel Name": isHostelMember(m) ? (m.hostelName || "N/A") : "N/A",
              "Room No": isHostelMember(m) ? (m.roomNo || "N/A") : "N/A",
              "Warden Name": isHostelMember(m) ? (m.wardenName || "N/A") : "N/A",
              "Warden Phone No": isHostelMember(m) ? (m.wardenPhoneNo || "N/A") : "N/A",
              "Student Phone": m.phoneNo || "",
              Email: m.regNo ? `${m.regNo}@klu.ac.in` : "",
              Year: m.year || "",
              Branch: m.branch || "",
              Section: m.section || "",
              "Team Name": team.teamName,
              "Team Role": roleName,
              "Payment Status": team.payment?.status || "pending",
              "Transaction ID": team.payment?.transactionId || "",
              "Registered On": team.submittedAt
                ? new Date(team.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                : "",
            });
          }
        };

        checkAndPush(team.teamLeader, "Team Leader");
        checkAndPush(team.teamMember1, "Member 1");
        checkAndPush(team.teamMember2, "Member 2");
        checkAndPush(team.teamMember3, "Member 3");
      });
    }

    if (excelData.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No records found matching the "${sheetName}" category`,
      });
    }

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);

    // Set auto column width for clean Excel presentation
    const colWidths = Object.keys(excelData[0] || {}).map((k) => ({
      wch: Math.max(k.length + 4, 14),
    }));
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, sheetName);

    // Generate buffer
    const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${filePrefix}_${Date.now()}.xlsx`,
    );

    // Send Excel buffer
    res.send(excelBuffer);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating Excel file",
      error: error.message,
    });
  }
});

// GET endpoint to check payment status of a team
app.get("/api/payment-status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const team = await TeamRegistration.findOne({
      "payment.transactionId": transactionId,
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found with this transaction ID",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        teamName: team.teamName,
        paymentStatus: team.payment.status,
        transactionId: team.payment.transactionId,
        submittedAt: team.submittedAt,
        verifiedAt: team.payment.verifiedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// POST endpoint to verify/update payment status (admin only - password protected)
app.post(["/api/verify-payment", "/api/update-payment-status"], async (req, res) => {
  try {
    const { password, transactionId, status } = req.body;

    // Check password (use environment variable for security)
    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Validate fields
    if (!transactionId || !status) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID and status are required",
      });
    }

    if (!["verified", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be verified, rejected, or pending",
      });
    }

    // Find and update the team
    const team = await TeamRegistration.findOneAndUpdate(
      { "payment.transactionId": transactionId },
      {
        "payment.status": status,
        "payment.verifiedAt": status === "verified" ? new Date() : null,
      },
      { returnDocument: "after" },
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found with this transaction ID",
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`,
      data: {
        teamName: team.teamName,
        paymentStatus: team.payment.status,
        transactionId: team.payment.transactionId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// GET endpoint to fetch all payments with status (admin only - password protected)
app.get("/api/all-payments", async (req, res) => {
  try {
    const { password } = req.query;

    // Check password (use environment variable for security)
    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const teams = await TeamRegistration.find(
      {},
      {
        teamName: 1,
        "payment.transactionId": 1,
        "payment.status": 1,
        "payment.receiptUrl": 1,
        "payment.receiptFileName": 1,
        submittedAt: 1,
        "payment.verifiedAt": 1,
      },
    ).sort({ submittedAt: -1 });

    // Count payments by status
    const statusCounts = {
      pending: teams.filter((t) => t.payment.status === "pending").length,
      verified: teams.filter((t) => t.payment.status === "verified").length,
      rejected: teams.filter((t) => t.payment.status === "rejected").length,
    };

    res.status(200).json({
      success: true,
      statusCounts,
      totalPayments: teams.length,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// GET endpoint to check registration status (public)
app.get("/api/registration-status", async (req, res) => {
  try {
    let settings = await AppSettings.findOne({ key: "registrationStatus" });

    // If no settings exist, create default
    if (!settings) {
      settings = await AppSettings.create({
        key: "registrationStatus",
        enabled: true,
        updatedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      enabled: settings.enabled,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// POST endpoint to toggle registration status (admin only - password protected)
app.post("/api/toggle-registration", async (req, res) => {
  try {
    const { password, enabled } = req.body;

    // Check password (use environment variable for security)
    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "enabled field must be a boolean",
      });
    }

    // Update or create settings
    const settings = await AppSettings.findOneAndUpdate(
      { key: "registrationStatus" },
      {
        enabled,
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" },
    );

    res.status(200).json({
      success: true,
      enabled: settings.enabled,
      message: `Registrations ${settings.enabled ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// POST endpoint to upload a new QR code image
app.post("/api/upload-qr", upload.single('qrCode'), async (req, res) => {
  try {
    const password = req.body.password;
    if (password !== process.env.adminPassword) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "team-registrations/qr",
          resource_type: "auto",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          timeout: 60000,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      const streamifier = require("streamifier");
      const stream = streamifier.createReadStream(req.file.buffer);

      stream.on("error", (error) => {
        uploadStream.destroy();
        reject(error);
      });

      stream.pipe(uploadStream);
    });

    const result = await uploadPromise;

    // Save to AppSettings
    await AppSettings.findOneAndUpdate(
      { key: "paymentQr" },
      { qrUrl: result.secure_url, updatedAt: new Date() },
      { upsert: true, returnDocument: "after" }
    );

    res.status(200).json({ success: true, message: "QR Code updated successfully", url: result.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// GET endpoint to get payment QR URL
app.get("/api/payment-qr", async (req, res) => {
  try {
    const settings = await AppSettings.findOne({ key: "paymentQr" });
    res.status(200).json({
      success: true,
      url: settings ? settings.qrUrl : "/payment.png", // fallback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// GET endpoint to get max teams limit
app.get("/api/max-teams", async (req, res) => {
  try {
    let settings = await AppSettings.findOne({ key: "maxTeams" });

    // If no settings exist, create default
    if (!settings) {
      settings = await AppSettings.create({
        key: "maxTeams",
        maxTeams: 50,
        updatedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      maxTeams: settings.maxTeams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// POST endpoint to update max teams limit (admin only - password protected)
app.post("/api/update-max-teams", async (req, res) => {
  try {
    const { password, maxTeams } = req.body;

    // Check password (use environment variable for security)
    if (password !== process.env.adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    if (!maxTeams || typeof maxTeams !== "number" || maxTeams < 1) {
      return res.status(400).json({
        success: false,
        message: "maxTeams must be a positive number",
      });
    }

    // Update or create settings
    const settings = await AppSettings.findOneAndUpdate(
      { key: "maxTeams" },
      {
        maxTeams,
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" },
    );

    res.status(200).json({
      success: true,
      maxTeams: settings.maxTeams,
      message: `Maximum teams updated to ${settings.maxTeams}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

app.listen(process.env.PORT, async () => {
  await connect;
  console.log(`Server is running on port ${process.env.PORT}`);
});
