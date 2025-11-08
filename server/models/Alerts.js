const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  emergencyType: {
    type: String,
    enum: ['medical', 'fire', 'police', 'accident', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'responded', 'resolved', 'false-alarm'],
    default: 'active'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responseTime: Date,
  resolutionTime: Date,
  chatbotLogs: [{
    timestamp: Date,
    message: String,
    isUser: Boolean
  }]
}, {
  timestamps: true
});

// Index for faster queries
alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Alert', alertSchema);