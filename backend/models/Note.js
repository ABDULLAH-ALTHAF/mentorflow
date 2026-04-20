const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  file: { 
    type: String 
  },
  fileType: { 
    type: String 
  },
  type: { 
    type: String, 
    enum: ['material', 'assignment', 'resource'],
    default: 'material'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);