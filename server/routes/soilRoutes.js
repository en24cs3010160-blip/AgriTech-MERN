const express = require('express');
const router = express.Router();
const {
  createSoilRecord,
  getSoilRecords,
  deleteSoilRecord
} = require('../controllers/soilController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createSoilRecord);
router.get('/', getSoilRecords);
router.delete('/:id', deleteSoilRecord);

module.exports = router;

