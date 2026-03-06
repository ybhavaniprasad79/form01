const express = require("express");
const cors = require("cors");
const xlsx = require("xlsx");
const mongoose = require("mongoose");
require("dotenv").config();
const { connect } = require("./connect");
const {
  TeamRegistration,
  AppSettings,
  ProblemStatement,
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
        shortDescription: 1,
        fullDescription: 1,
        slotsTaken: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    )
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
app.get("/api/problems/config", async (req, res) => {
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
app.post("/api/admin/problems/config", async (req, res) => {
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
      { upsert: true, new: true },
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
        shortDescription: 1,
        fullDescription: 1,
        slotsTaken: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    )
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
    const { password, title, shortDescription, fullDescription } =
      req.body || {};

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

    if (!shortDescription || !String(shortDescription).trim()) {
      return res.status(400).json({
        success: false,
        message: "Short description is required",
      });
    }

    if (String(shortDescription).trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Short description must be at least 10 characters",
      });
    }

    const created = await ProblemStatement.create({
      title: String(title).trim(),
      shortDescription: String(shortDescription).trim(),
      fullDescription: String(fullDescription || "").trim(),
    });

    res.status(201).json({
      success: true,
      message: "Problem statement created",
      data: created,
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
    const { password, title, shortDescription, fullDescription } =
      req.body || {};

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

    if (!shortDescription || !String(shortDescription).trim()) {
      return res.status(400).json({
        success: false,
        message: "Short description is required",
      });
    }

    const updated = await ProblemStatement.findByIdAndUpdate(
      id,
      {
        title: String(title).trim(),
        shortDescription: String(shortDescription).trim(),
        fullDescription: String(fullDescription || "").trim(),
      },
      { new: true, runValidators: true },
    ).lean();

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
      {
        selectedProblemStatement: { $exists: true, $ne: null },
      },
      {
        teamName: 1,
        teamLeader: 1,
        selectedProblemStatement: 1,
        selectedProblemSelectedAt: 1,
        submittedAt: 1,
      },
    )
      .populate({
        path: "selectedProblemStatement",
        select: { title: 1, shortDescription: 1, fullDescription: 1 },
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
    const teams = await TeamRegistration.find({}, { teamName: 1 }).sort({
      submittedAt: -1,
    });
    const rounds = await RoundMarks.find().sort({ createdAt: 1 });
    const outOfByRound = {};

    const teamsWithMarks = teams.map((team) => {
      const roundMarks = {};
      let total = 0;

      rounds.forEach((round) => {
        const teamMark = round.teamMarks.find(
          (tm) => tm.teamName === team.teamName,
        );
        const mark = teamMark ? teamMark.mark : 0;
        roundMarks[round.roundName] = mark;
        outOfByRound[round.roundName] = round.outOf;
        total += mark;
      });

      return {
        _id: team._id,
        teamName: team.teamName,
        roundMarks,
        total,
      };
    });

    res.status(200).json({
      success: true,
      rounds: rounds.map((r) => r.roundName),
      outOfByRound,
      data: teamsWithMarks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch marks board",
      error: error.message,
    });
  }
});

// POST endpoint to create a new round
app.post("/api/marks/round", async (req, res) => {
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

    const problemExists = await ProblemStatement.exists({
      _id: normalizedProblemId,
    });
    if (!problemExists) {
      return res.status(404).json({
        success: false,
        message: "Problem statement not found",
      });
    }

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

    if (currentSelectedCount >= MAX_TEAMS_PER_PROBLEM) {
      return res.status(409).json({
        success: false,
        code: "PROBLEM_FULL",
        message: `This problem statement already has ${MAX_TEAMS_PER_PROBLEM} teams.`,
      });
    }

    const reserved = await ProblemStatement.findOneAndUpdate(
      {
        _id: normalizedProblemId,
        slotsTaken: { $lt: MAX_TEAMS_PER_PROBLEM },
      },
      { $inc: { slotsTaken: 1 } },
      { new: true, projection: { _id: 1, slotsTaken: 1 } },
    ).lean();

    if (!reserved) {
      return res.status(409).json({
        success: false,
        code: "PROBLEM_FULL",
        message: `This problem statement already has ${MAX_TEAMS_PER_PROBLEM} teams.`,
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
        },
      },
      {
        new: true,
        projection: {
          teamName: 1,
          selectedProblemStatement: 1,
          selectedProblemSelectedAt: 1,
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

// PUT endpoint for team registration form submission
app.put("/api/register", async (req, res) => {
  try {
    const {
      teamName,
      teamLeader,
      teamMember1,
      teamMember2,
      teamMember3,
      payment,
    } = req.body;

    // Validate required fields
    if (
      !teamName ||
      !teamLeader ||
      !teamMember1 ||
      !teamMember2 ||
      !teamMember3
    ) {
      return res.status(400).json({
        success: false,
        message: "Team name and all team members information are required",
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

    // Check if team name already exists
    const existingTeam = await TeamRegistration.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message:
          "Team name already exists. Please choose a different team name",
      });
    }

    // Check if transaction ID already exists
    const existingTransaction = await TeamRegistration.findOne({
      "payment.transactionId": payment.transactionId,
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

    // Collect all registration numbers
    const regNos = [
      teamLeader.regNo,
      teamMember1.regNo,
      teamMember2.regNo,
      teamMember3.regNo,
    ];

    // Check for duplicates within the same team
    const uniqueRegNos = new Set(regNos);
    if (uniqueRegNos.size !== regNos.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate registration numbers found within the team",
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
        message: "One or more registration numbers already exist in the system",
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

// POST endpoint for downloading all team data as Excel (password protected)
app.post("/api/download-teams", async (req, res) => {
  try {
    const { password } = req.body;

    // Check password (use environment variable for security)
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

    // Format data for Excel
    const excelData = [];
    teams.forEach((team, index) => {
      // Add team leader
      excelData.push({
        "S.No": index + 1,
        "Team Name": team.teamName,
        "Member Type": "Team Leader",
        Name: team.teamLeader.name,
        "Reg No": team.teamLeader.regNo,
        "Phone No": team.teamLeader.phoneNo,
        email: team.teamLeader.regNo + "@klu.ac.in",
        Year: team.teamLeader.year,
        Branch: team.teamLeader.branch,
        Section: team.teamLeader.section,
        "Transaction ID": team.payment.transactionId,
        "Payment Status": team.payment.status,
        "Receipt URL": team.payment.receiptUrl,
        "Registered On": team.submittedAt
          ? new Date(team.submittedAt).toLocaleString()
          : "N/A",
      });

      // Add team member 1
      excelData.push({
        "S.No": "",
        "Team Name": "",
        "Member Type": "Team Member 1",
        Name: team.teamMember1.name,
        "Reg No": team.teamMember1.regNo,
        "Phone No": team.teamMember1.phoneNo,
        email: team.teamMember1.regNo + "@klu.ac.in",
        Year: team.teamMember1.year,
        Branch: team.teamMember1.branch,
        Section: team.teamMember1.section,
        "Transaction ID": "",
        "Payment Status": "",
        "Registered On": "",
      });

      // Add team member 2
      excelData.push({
        "S.No": "",
        "Team Name": "",
        "Member Type": "Team Member 2",
        Name: team.teamMember2.name,
        "Reg No": team.teamMember2.regNo,
        "Phone No": team.teamMember2.phoneNo,
        email: team.teamMember2.regNo + "@klu.ac.in",
        Year: team.teamMember2.year,
        Branch: team.teamMember2.branch,
        Section: team.teamMember2.section,
        "Transaction ID": "",
        "Payment Status": "",
        "Registered On": "",
      });

      // Add team member 3
      excelData.push({
        "S.No": "",
        "Team Name": "",
        "Member Type": "Team Member 3",
        Name: team.teamMember3.name,
        "Reg No": team.teamMember3.regNo,
        "Phone No": team.teamMember3.phoneNo,
        email: team.teamMember3.regNo + "@klu.ac.in",
        Year: team.teamMember3.year,
        Branch: team.teamMember3.branch,
        Section: team.teamMember3.section,
        "Transaction ID": "",
        "Payment Status": "",
        "Registered On": "",
      });
    });

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, "Team Registrations");

    // Generate buffer
    const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=team_registrations_${Date.now()}.xlsx`,
    );

    // Send file
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

// POST endpoint to verify payment (admin only - password protected)
app.post("/api/verify-payment", async (req, res) => {
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
      { upsert: true, new: true },
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
      { upsert: true, new: true },
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
