const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    topic: {
      type: String,
      required: true,
      enum: [
        'Crop Health & Disease',
        'Soil Fertility & Nutrients',
        'Pest & Weed Control',
        'Irrigation & Water Mgmt',
        'Harvesting & Post-Harvest',
        'Organic Farming Practices',
        'Other'
      ],
      default: 'Crop Health & Disease'
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    urgency: {
      type: String,
      enum: ['Routine', 'Urgent', 'Critical'],
      default: 'Routine'
    },
    status: {
      type: String,
      enum: ['Pending Review', 'Expert Assigned', 'Answered', 'Closed'],
      default: 'Pending Review'
    },
    expertName: {
      type: String,
      default: ''
    },
    expertResponse: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);

