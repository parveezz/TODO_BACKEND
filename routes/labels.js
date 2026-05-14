const express = require('express');
const { getLabels, createLabel, deleteLabel } = require('../controllers/labelController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .get(protect, getLabels)
  .post(protect, createLabel);

router.route('/:id')
  .delete(protect, deleteLabel);

module.exports = router;
