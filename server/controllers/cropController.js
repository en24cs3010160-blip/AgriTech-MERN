
const Crop = require('../models/Crop');
const Farm = require('../models/Farm');

// Create a crop
exports.createCrop = async (req, res) => {
  try {
    const {
      farm,
      cropName,
      plantingDate,
      expectedHarvestDate,
      notes,
      pestAlert,
      diseaseAlert,
      alertNotes
    } = req.body;

    if (!farm || !cropName || !plantingDate) {
      return res.status(400).json({
        message: 'Farm, crop name and planting date are required'
      });
    }

    const farmExists = await Farm.findOne({
      _id: farm,
      farmer: req.user.id
    });

    if (!farmExists) {
      return res.status(404).json({
        message: 'Farm not found'
      });
    }

    const crop = await Crop.create({
      farm,
      cropName: cropName.trim(),
      plantingDate,
      expectedHarvestDate: expectedHarvestDate || undefined,
      notes,
      pestAlert: pestAlert ?? false,
      diseaseAlert: diseaseAlert ?? false,
      alertNotes: alertNotes || ''
    });

    res.status(201).json(crop);
  } catch (error) {
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid crop details'
      });
    }
    res.status(500).json({ message: 'Failed to create crop' });
  }
};

// Get crops belonging to the logged-in farmer
exports.getCrops = async (req, res) => {
  try {
    const farms = await Farm.find({ farmer: req.user.id }).select('_id');
    const farmIds = farms.map(item => item._id);

    const crops = await Crop.find({
      farm: { $in: farmIds }
    }).populate('farm', 'farmName location');

    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch crops' });
  }
};

// Update a crop
exports.updateCrop = async (req, res) => {
  try {
    const farms = await Farm.find({ farmer: req.user.id }).select('_id');
    const farmIds = farms.map(item => item._id);

    const allowedFields = [
      'cropName',
      'plantingDate',
      'expectedHarvestDate',
      'status',
      'notes',
      'pestAlert',
      'diseaseAlert',
      'alertNotes'
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const crop = await Crop.findOne({
      _id: req.params.id,
      farm: { $in: farmIds }
    });

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    Object.assign(crop, updates);
    await crop.save();

    res.json(crop);
  } catch (error) {
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid crop details' });
    }
    res.status(500).json({ message: 'Failed to update crop' });
  }
};

// Delete a crop
exports.deleteCrop = async (req, res) => {
  try {
    const farms = await Farm.find({ farmer: req.user.id }).select('_id');
    const farmIds = farms.map(item => item._id);

    const crop = await Crop.findOneAndDelete({
      _id: req.params.id,
      farm: { $in: farmIds }
    });

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    res.json({ message: 'Crop deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid crop ID' });
    }
    res.status(500).json({ message: 'Failed to delete crop' });
  }
};
