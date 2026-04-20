const Notification = require('../models/Notification');

// Create notification
const createNotification = async (userId, type, title, message, relatedId = null, relatedModel = null, classId = null) => {
  try {
    console.log(`🔔 Creating notification for user ${userId}:`, { type, title });
    
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      classId,
      isRead: false
    });
    
    console.log(`✅ Notification created: ${notification._id}`);
    
    // Emit socket event for real-time notification
    const io = require('../server').io;
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
      console.log(`📡 Emitted notification to user_${userId}`);
    }
    
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
};

// Get user's notifications
const getMyNotifications = async (req, res) => {
  try {
    console.log(`📋 Fetching notifications for user: ${req.user.id}`);
    
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      isRead: false 
    });
    
    console.log(`📊 Found ${notifications.length} notifications, ${unreadCount} unread`);
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    console.log(`✅ Notification marked as read: ${notification._id}`);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    console.log(`🗑️ Notification deleted: ${req.params.id}`);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createNotification, 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
};