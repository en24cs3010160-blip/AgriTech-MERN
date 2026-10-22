const express = require('express');
const router = express.Router();
const {
  createConsultation,
  getConsultations,
  deleteConsultation
} = require('../controllers/consultationController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createConsultation);
router.get('/', getConsultations);
router.delete('/:id', deleteConsultation);

module.exports = router;

