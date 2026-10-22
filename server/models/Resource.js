const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    farm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Water', 'Fertilizer', 'Seeds', 'Equipment', 'Fuel', 'Labor', 'Other'],
      default: 'Equipment'
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Available', 'In Use', 'Depleted', 'Maintenance'],
      default: 'Available'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);

