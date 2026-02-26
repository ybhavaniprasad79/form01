const express=require('express');
const cors=require('cors')
const xlsx = require('xlsx');
require('dotenv').config()
const {connect}=require('./connect')
const TeamRegistration = require('./model')
const app=express();

// Middleware
app.use(cors({
  origin: '*',
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

// POST endpoint for downloading all team data as Excel (password protected)
app.post('/api/download-teams', async (req, res) => {
    try {
        const { password } = req.body;

        // Check password (use environment variable for security)
        const DOWNLOAD_PASSWORD = process.env.DOWNLOAD_PASSWORD;
        
        if (!password || password !== DOWNLOAD_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Fetch all team registrations
        const teams = await TeamRegistration.find().sort({ createdAt: -1 });

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No teams registered yet'
            });
        }

        // Format data for Excel
        const excelData = [];
        teams.forEach((team, index) => {
            // Add team leader
            excelData.push({
                'S.No': index + 1,
                'Team Name': team.teamName,
                'Member Type': 'Team Leader',
                'Name': team.teamLeader.name,
                'Reg No': team.teamLeader.regNo,
                'Phone No': team.teamLeader.phoneNo,
                'email': team.teamLeader.regNo + '@klu.ac.in',
                'Year': team.teamLeader.year,
                'Branch': team.teamLeader.branch,
                'Section': team.teamLeader.section,
                'Registered On': team.createdAt ? new Date(team.createdAt).toLocaleString() : 'N/A'
            });
            
            // Add team member 1
            excelData.push({
                'S.No': '',
                'Team Name': '',
                'Member Type': 'Team Member 1',
                'Name': team.teamMember1.name,
                'Reg No': team.teamMember1.regNo,
                'Phone No': team.teamMember1.phoneNo,
                'email': team.teamMember1.regNo + '@klu.ac.in',
                'Year': team.teamMember1.year,
                'Branch': team.teamMember1.branch,
                'Section': team.teamMember1.section,
                'Registered On': ''
            });
            
            // Add team member 2
            excelData.push({
                'S.No': '',
                'Team Name': '',
                'Member Type': 'Team Member 2',
                'Name': team.teamMember2.name,
                'Reg No': team.teamMember2.regNo,
                'Phone No': team.teamMember2.phoneNo,
                'email': team.teamMember2.regNo + '@klu.ac.in',
                'Year': team.teamMember2.year,
                'Branch': team.teamMember2.branch,
                'Section': team.teamMember2.section,
                'Registered On': ''
            });
        });

        // Create workbook and worksheet
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(excelData);

        // Add worksheet to workbook
        xlsx.utils.book_append_sheet(wb, ws, 'Team Registrations');

        // Generate buffer
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=team_registrations_${Date.now()}.xlsx`);

        // Send file
        res.send(excelBuffer);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating Excel file',
            error: error.message
        });
    }
});

app.listen(process.env.PORT,async()=>{
    await connect;
    console.log(`Server is running on port ${process.env.PORT}`);
}); 