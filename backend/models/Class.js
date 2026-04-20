const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: { type: String, required: true, trim: true },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  inviteCode: { 
    type: String, 
    required: true, 
    unique: true 
  }
}, { timestamps: true });

// // Index for faster queries
classSchema.index({ teacherId: 1 });
// classSchema.index({ inviteCode: 1 });

module.exports = mongoose.model('Class', classSchema);