const express=require('express');
const cors=require('cors')
require('dotenv').config()
const {connect}=require('./connect')
const TeamRegistration = require('./model')
const app=express();

// Middleware
app.use(cors({
  origin: 'https://form01-iota.vercel.app/',
  credentials: true
}));
app.use(express.json());

app.get('/',(req,res)=>{
    res.status(200).json({message:"app is running"})
})

// GET endpoint to fetch team registration count
app.get('/api/teams/count', async (req, res) => {
    try {
        const count = await TeamRegistration.countDocuments();
        res.status(200).json({
            success: true,
            count,
            maxTeams: parseInt(process.env.maxTeams)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team count',
            error: error.message
        });
    }
});

// PUT endpoint for team registration form submission
app.put('/api/register', async (req, res) => {
    try {
        const { teamName, teamLeader, teamMember1, teamMember2 } = req.body;

        // Validate required fields
        if (!teamName || !teamLeader || !teamMember1 || !teamMember2) {
            return res.status(400).json({
                success: false,
                message: 'Team name and all team members information are required'
            });
        }

        // Check if team name already exists
        const existingTeam = await TeamRegistration.findOne({ teamName });
        if (existingTeam) {
            return res.status(400).json({
                success: false,
                message: 'Team name already exists. Please choose a different team name'
            });
        }

        // Check if registration limit reached
        const teamCount = await TeamRegistration.countDocuments();
        if (teamCount >= parseInt(process.env.maxTeams)) {
            return res.status(400).json({
                success: false,
                message: `Registration closed. Maximum limit of ${process.env.maxTeams} teams has been reached`
            });
        }

        // Collect all registration numbers
        const regNos = [
            teamLeader.regNo,
            teamMember1.regNo,
            teamMember2.regNo
        ];

        // Check for duplicates within the same team
        const uniqueRegNos = new Set(regNos);
        if (uniqueRegNos.size !== regNos.length) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate registration numbers found within the team'
            });
        }

        // Check if any registration number already exists in the database
        const existingRegistrations = await TeamRegistration.find({
            $or: [
                { 'teamLeader.regNo': { $in: regNos } },
                { 'teamMember1.regNo': { $in: regNos } },
                { 'teamMember2.regNo': { $in: regNos } }
            ]
        });

        if (existingRegistrations.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'One or more registration numbers already exist in the system'
            });
        }

        // Create new team registration document
        const teamRegistration = new TeamRegistration({
            teamName,
            teamLeader,
            teamMember1,
            teamMember2
        });

        // Save to database
        await teamRegistration.save();

        res.status(201).json({
            success: true,
            message: 'Team registration submitted successfully',
            data: teamRegistration
        });
    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            const field = error.keyPattern?.teamName ? 'Team name' : 'Registration number';
            return res.status(400).json({
                success: false,
                message: `${field} already exists in the system`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

app.listen(process.env.PORT,async()=>{
    await connect;
    console.log(`Server is running on port ${process.env.PORT}`);
}); 