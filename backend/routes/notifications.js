const express = require('express');
const { protect } = require('../middleware/auth');
const { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all notifications for current user
router.get('/', getMyNotifications);

// Mark a specific notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;