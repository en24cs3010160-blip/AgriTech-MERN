const SoilRecord = require('../models/SoilRecord');
const Farm = require('../models/Farm');

exports.createSoilRecord = async (req, res) => {
  try {
    const {
      farm,
      pH,
      nitrogen,
      phosphorus,
      potassium,
      moisturePercentage,
      organicMatter,
      notes
    } = req.body;

    if (!farm || pH == null || nitrogen == null || phosphorus == null || potassium == null || moisturePercentage == null) {
      return res.status(400).json({
        message: 'Farm and soil metrics (pH, N, P, K, moisture) are required'
      });
    }

    const farmDoc = await Farm.findOne({ _id: farm, farmer: req.user.id });
    if (!farmDoc) {
      return res.status(404).json({ message: 'Associated farm not found' });
    }

    // Determine health status and generate realistic agronomic recommendations
    let healthStatus = 'Optimal';
    const recs = [];

    const numPh = Number(pH);
    if (numPh < 6.0) {
      healthStatus = 'Needs Attention';
      recs.push('Acidic soil: Apply agricultural lime (calcium carbonate) to raise pH.');
    } else if (numPh > 7.8) {
      healthStatus = 'Needs Attention';
      recs.push('Alkaline soil: Incorporate sulfur or gypsum and organic compost.');
    }

    const numN = Number(nitrogen);
    if (numN < 140) {
      if (healthStatus === 'Optimal') healthStatus = 'Moderate';
      recs.push('Low Nitrogen: Top-dress with urea or well-rotted cow manure/vermicompost.');
    }

    const numP = Number(phosphorus);
    if (numP < 15) {
      if (healthStatus === 'Optimal') healthStatus = 'Moderate';
      recs.push('Low Phosphorus: Apply single superphosphate (SSP) or bone meal.');
    }

    const numK = Number(potassium);
    if (numK < 120) {
      if (healthStatus === 'Optimal') healthStatus = 'Moderate';
      recs.push('Low Potassium: Apply muriate of potash (MOP) to boost crop disease resistance.');
    }

    const numMoist = Number(moisturePercentage);
    if (numMoist < 30) {
      recs.push('Low moisture: Schedule irrigation or apply mulch to conserve moisture.');
    }

    if (recs.length === 0) {
      recs.push('Soil nutrient balance is optimal for balanced crop growth.');
    }

    const record = await SoilRecord.create({
      farmer: req.user.id,
      farm,
      pH: numPh,
      nitrogen: numN,
      phosphorus: numP,
      potassium: numK,
      moisturePercentage: numMoist,
      organicMatter: organicMatter != null ? Number(organicMatter) : 2.5,
      healthStatus,
      recommendations: recs.join(' '),
      testDate: new Date()
    });

    const populated = await SoilRecord.findById(record._id).populate('farm', 'farmName location');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Soil record error:', error);
    res.status(500).json({ message: 'Failed to record soil health data' });
  }
};

exports.getSoilRecords = async (req, res) => {
  try {
    const records = await SoilRecord.find({ farmer: req.user.id })
      .populate('farm', 'farmName location')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve soil records' });
  }
};

exports.deleteSoilRecord = async (req, res) => {
  try {
    const deleted = await SoilRecord.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Soil record not found' });
    }

    res.json({ message: 'Soil health record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete soil record' });
  }
};

