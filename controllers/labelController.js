const Label = require('../models/Label');

// @desc    Get all labels
// @route   GET /api/labels
exports.getLabels = async (req, res) => {
  try {
    const labels = await Label.find({ user: req.user.id }).sort('name');
    res.status(200).json({ success: true, count: labels.length, data: labels });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Create new label
// @route   POST /api/labels
exports.createLabel = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const label = await Label.create(req.body);
    res.status(201).json({ success: true, data: label });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete label
// @route   DELETE /api/labels/:id
exports.deleteLabel = async (req, res) => {
  try {
    const label = await Label.findById(req.params.id);
    if (!label || label.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    await label.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
