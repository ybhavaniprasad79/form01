const mongoose = require('mongoose');

// Define member schema for team members
const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  regNo: {
    type: String,
    required: [true, 'Registration number is required'],
    match: [/^[0-9]{11}$/, 'Registration number must be exactly 11 digits']
  },
  phoneNo: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits']
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: {
      values: ['1', '2', '3'],
      message: 'Year must be 1st, 2nd, or 3rd year'
    }
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true,
    uppercase: true
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true
  }
}, { _id: false });

// Define team registration schema
const teamRegistrationSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Team name must be at least 2 characters'],
    maxlength: [50, 'Team name must not exceed 50 characters']
  },
  teamLeader: {
    type: memberSchema,
    required: [true, 'Team leader information is required']
  },
  teamMember1: {
    type: memberSchema,
    required: [true, 'Team member 1 information is required']
  },
  teamMember2: {
    type: memberSchema,
    required: [true, 'Team member 2 information is required']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
const TeamRegistration = mongoose.model('TeamRegistration', teamRegistrationSchema);

module.exports = TeamRegistration;
