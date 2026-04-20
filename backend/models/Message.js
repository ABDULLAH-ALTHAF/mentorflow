const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { type: String, required: true },
  fileUrl: { type: String },   // optional file in chat (future)
}, { timestamps: true });

// Index for fast retrieval per class (chronological)
messageSchema.index({ classId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);