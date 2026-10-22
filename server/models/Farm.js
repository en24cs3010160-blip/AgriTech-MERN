const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmName: { type: String, required: true },
  location: { type: String, required: true },
  sizeInAcres: { type: Number, required: true },
  soilType: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Farm', farmSchema);