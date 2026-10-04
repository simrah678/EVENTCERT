const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registerNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['participant', 'coordinator', 'admin'],
    default: 'participant'
  },
  permissions: {
  createEvents: { type: Boolean, default: false },
  manageAttendance: { type: Boolean, default: false }
},
attendanceEvents: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }
],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);