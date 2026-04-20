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
  file: { 
    type: String 
  },
  text: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['pending', 'submitted', 'graded', 'returned'],
    default: 'pending'
  },
  grade: { 
    type: Number,
    min: 0,
    max: 100
  },
  feedback: { 
    type: String 
  },
  feedbackVoice: { 
    type: String // URL to voice feedback
  },
  submittedAt: { 
    type: Date 
  },
  gradedAt: { 
    type: Date 
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);