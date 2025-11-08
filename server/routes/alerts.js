const express = require('express');
const jwt = require('jsonwebtoken');
const Alert = require('../models/Alert');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Create new emergency alert
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { emergencyType, description, location, severity } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alert = new Alert({
      userId: user._id,
      userName: user.name,
      userPhone: user.phone,
      emergencyType,
      description,
      location,
      severity: severity || 'medium'
    });

    await alert.save();

    // Populate alert for response
    await alert.populate('assignedTo', 'name email phone');

    // In a real application, you would send notifications here
    // await require('../utils/notifications').sendEmergencyNotifications(alert);

    res.status(201).json({
      message: 'Emergency alert created successfully',
      alert
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating alert', error: error.message });
  }
});

// Get all alerts (for admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const alerts = await Alert.find(query)
      .populate('assignedTo', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(query);

    res.json({
      alerts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
});

// Update alert status
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, assignedTo } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;

    if (status === 'responded') {
      updateData.responseTime = new Date();
    } else if (status === 'resolved') {
      updateData.resolutionTime = new Date();
    }

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email phone');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({
      message: 'Alert updated successfully',
      alert
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating alert', error: error.message });
  }
});

// Get user's alert history
router.get('/my-alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
});

module.exports = router;