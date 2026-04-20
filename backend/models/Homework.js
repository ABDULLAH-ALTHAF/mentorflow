const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String },
  voiceNote: { type: String }, // URL/path to audio file
  dueDate: { type: Date },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);