const Consultation = require('../models/Consultation');

// Agricultural expert simulated knowledge base
const expertAdvisories = {
  'Crop Health & Disease': {
    expert: 'Dr. Ramesh Sharma (Senior Agronomist, ICAR)',
    reply: 'Based on the symptoms described, isolate affected crop patches immediately. If fungal blight or leaf spots are observed, apply a recommended Mancozeb or Copper Oxychloride spray (2g/L) during early morning hours.'
  },
  'Soil Fertility & Nutrients': {
    expert: 'Dr. Priya Patel (Soil Scientist)',
    reply: 'Ensure soil pH is balanced between 6.2 and 7.2. Split nitrogen application across basal and vegetative stages to prevent leaching. Incorporate organic green manure during the pre-sowing period.'
  },
  'Pest & Weed Control': {
    expert: 'Er. Rajesh Verma (Integrated Pest Management Specialist)',
    reply: 'Deploy yellow sticky traps (15-20 per acre) and pheromone traps to monitor pest threshold. For sucking pests like aphids and thrips, use 5% Neem Seed Kernel Extract (NSKE) spray before resorting to chemical insecticides.'
  },
  'Irrigation & Water Mgmt': {
    expert: 'Eng. Sunil Kulkarni (Irrigation Consultant)',
    reply: 'Adopt drip or micro-sprinkler irrigation to achieve up to 45% water savings and prevent root rot diseases caused by waterlogging. Maintain soil moisture at field capacity during the flowering phase.'
  },
  'Harvesting & Post-Harvest': {
    expert: 'Dr. Ananya Roy (Post-Harvest Technologist)',
    reply: 'Harvest crops at optimum physiological maturity. Ensure grains are sun-dried to under 12% moisture content before storage in hermetic bags to prevent weevil infestations.'
  },
  'Organic Farming Practices': {
    expert: 'Sardar Baldev Singh (Organic Agriculture Advisor)',
    reply: 'Utilize Jeevamrutha and Panchagavya formulations to stimulate beneficial soil microbial flora. Maintain crop rotation with leguminous pulses to fix atmospheric nitrogen naturally.'
  },
  'Other': {
    expert: 'AgriTech Advisory Cell',
    reply: 'Thank you for reaching out. An agricultural extension officer has logged your inquiry and will provide detailed localized recommendations.'
  }
};

exports.createConsultation = async (req, res) => {
  try {
    const { topic, subject, description, urgency } = req.body;

    if (!topic || !subject || !description) {
      return res.status(400).json({
        message: 'Topic, subject and description are required'
      });
    }

    // Generate responsive expert guidance based on selected agronomy topic
    const advisory = expertAdvisories[topic] || expertAdvisories['Other'];

    const consultation = await Consultation.create({
      farmer: req.user.id,
      topic,
      subject: subject.trim(),
      description: description.trim(),
      urgency: urgency || 'Routine',
      status: 'Answered',
      expertName: advisory.expert,
      expertResponse: advisory.reply,
      respondedAt: new Date()
    });

    res.status(201).json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit consultation request' });
  }
};

exports.getConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ farmer: req.user.id })
      .sort({ createdAt: -1 });

    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve consultations' });
  }
};

exports.deleteConsultation = async (req, res) => {
  try {
    const deleted = await Consultation.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Consultation record not found' });
    }

    res.json({ message: 'Consultation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete consultation' });
  }
};

