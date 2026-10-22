
const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  cropName: {
    type: String,
    required: true
  },
  plantingDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['growing', 'harvested', 'failed'],
    default: 'growing'
  },
  notes: {
    type: String
  },

  // Pest and disease alerts
  pestAlert: {
    type: Boolean,
    default: false
  },
  diseaseAlert: {
    type: Boolean,
    default: false
  },
  alertNotes: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Crop', cropSchema);
