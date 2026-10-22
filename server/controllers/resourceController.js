const Resource = require('../models/Resource');

exports.createResource = async (req, res) => {
  try {
    const { name, category, quantity, unit, cost, farm, status, notes } = req.body;

    if (!name || quantity == null || !unit) {
      return res.status(400).json({
        message: 'Resource name, quantity and unit are required'
      });
    }

    const resource = await Resource.create({
      farmer: req.user.id,
      farm: farm || undefined,
      name: name.trim(),
      category: category || 'Equipment',
      quantity: Number(quantity),
      unit: unit.trim(),
      cost: cost ? Number(cost) : 0,
      status: status || 'Available',
      notes: notes || ''
    });

    const populated = await Resource.findById(resource._id).populate('farm', 'farmName');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create resource entry' });
  }
};

exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find({ farmer: req.user.id })
      .populate('farm', 'farmName')
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const { name, category, quantity, unit, cost, status, notes, farm } = req.body;
    if (name) resource.name = name.trim();
    if (category) resource.category = category;
    if (quantity != null) resource.quantity = Number(quantity);
    if (unit) resource.unit = unit.trim();
    if (cost != null) resource.cost = Number(cost);
    if (status) resource.status = status;
    if (notes !== undefined) resource.notes = notes;
    if (farm !== undefined) resource.farm = farm || null;

    await resource.save();
    const populated = await Resource.findById(resource._id).populate('farm', 'farmName');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resource' });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const deleted = await Resource.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resource' });
  }
};

