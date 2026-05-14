const mongoose = require('mongoose');

const LabelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a label name'],
    trim: true,
    maxlength: [20, 'Label name cannot be more than 20 characters']
  },
  color: {
    type: String,
    default: '#007AFF'
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent user from having duplicate label names
LabelSchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Label', LabelSchema);
