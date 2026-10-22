const Farm = require('../models/Farm');
const Crop = require('../models/Crop');

// Create a farm
exports.createFarm = async (req, res) => {
  try {
    const { farmName, location, sizeInAcres, soilType } = req.body;

    if (!farmName || !location || sizeInAcres == null || sizeInAcres <= 0) {
      return res.status(400).json({
        message: 'Valid farm name, location and size are required'
      });
    }

    const farm = await Farm.create({
      farmer: req.user.id,
      farmName,
      location,
      sizeInAcres,
      soilType
    });

    res.status(201).json(farm);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create farm' });
  }
};

// Get farms belonging to logged-in farmer
exports.getFarms = async (req, res) => {
  try {
    const farms = await Farm.find({ farmer: req.user.id });
    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch farms' });
  }
};

// Update a farm
exports.updateFarm = async (req, res) => {
  try {
    const { farmName, location, sizeInAcres, soilType } = req.body;

    if (
      sizeInAcres !== undefined &&
      (!Number.isFinite(sizeInAcres) || sizeInAcres <= 0)
    ) {
      return res.status(400).json({
        message: 'Farm size must be greater than zero'
      });
    }

    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      { $set: { farmName, location, sizeInAcres, soilType } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!farm) {
      return res.status(404).json({
        message: 'Farm not found'
      });
    }

    res.json(farm);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid farm ID' });
    }
    res.status(500).json({ message: 'Failed to update farm' });
  }
};

// Delete a farm
exports.deleteFarm = async (req, res) => {
  try {
    const farm = await Farm.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!farm) {
      return res.status(404).json({
        message: 'Farm not found'
      });
    }

    // Cascade delete associated crops to prevent orphaned records
    await Crop.deleteMany({ farm: req.params.id });

    res.json({ message: 'Farm and associated crops deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid farm ID' });
    }
    res.status(500).json({ message: 'Failed to delete farm' });
  }
};
