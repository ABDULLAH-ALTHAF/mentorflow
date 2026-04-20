const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['homework_posted', 'submission_received', 'submission_graded', 'feedback_added', 'new_message'],
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  relatedId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'relatedModel' 
  },
  relatedModel: { 
    type: String, 
    enum: ['Homework', 'Submission', 'Class'] 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);