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
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  grade: { 
    type: Number,
    min: 0,
    max: 100
  },
  feedback: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);