const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  homeworkId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Homework', 
    required: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  file: { type: String },        // uploaded file path/URL
  text: { type: String },
  status: { 
    type: String, 
    enum: ['submitted', 'graded'], 
    default: 'submitted' 
  },
  feedback: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);