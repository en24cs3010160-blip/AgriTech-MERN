const mongoose = require('mongoose');

const soilRecordSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true
    },
    pH: {
      type: Number,
      required: true,
      min: 0,
      max: 14
    },
    nitrogen: {
      type: Number,
      required: true,
      min: 0
    },
    phosphorus: {
      type: Number,
      required: true,
      min: 0
    },
    potassium: {
      type: Number,
      required: true,
      min: 0
    },
    moisturePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    organicMatter: {
      type: Number,
      default: 2.5
    },
    healthStatus: {
      type: String,
      enum: ['Optimal', 'Moderate', 'Needs Attention', 'Degraded'],
      default: 'Optimal'
    },
    recommendations: {
      type: String,
      default: ''
    },
    testDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SoilRecord', soilRecordSchema);

