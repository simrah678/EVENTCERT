const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({

  name: { type: String, required: true },

  description: { type: String },
  capacity: {
  type: Number,
  default: 100
},
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},

  date: { type: Date, required: true },

  venue: { type: String },

  category: {
    type: String,
    enum: [
      'Workshop',
      'Hackathon',
      'Seminar',
      'Competition',
      'Other'
    ],
    default: 'Other'
  },

  certificateTemplate: {
    type: String,
    enum: ['template1', 'template2', 'template3'],
    default: 'template1'
  },

  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('Event', eventSchema);