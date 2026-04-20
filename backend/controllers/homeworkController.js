const Homework = require('../models/Homework');
const Submission = require('../models/Submission');

const createHomework = async (req, res) => {
  const { classId, title, description, dueDate } = req.body;
  const teacherId = req.user.id;
  let voiceNotePath = null;

  if (req.file) {
    voiceNotePath = `/uploads/${req.file.filename}`;
  }

  try {
    const homework = await Homework.create({
      classId,
      title,
      description,
      voiceNote: voiceNotePath,
      dueDate,
      createdBy: teacherId
    });

    res.status(201).json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClassHomework = async (req, res) => {
  const { classId } = req.params;

  try {
    const homework = await Homework.find({ classId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    // Get submissions for each homework
    const homeworkWithSubmissions = await Promise.all(
      homework.map(async (hw) => {
        const submissions = await Submission.find({ homeworkId: hw._id })
          .populate('studentId', 'name email');
        return {
          ...hw.toObject(),
          submissions
        };
      })
    );
    
    res.json(homeworkWithSubmissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitHomework = async (req, res) => {
  const { homeworkId } = req.params;
  const studentId = req.user.id;
  let filePath = null;

  if (req.file) {
    filePath = `/uploads/${req.file.filename}`;
  }

  try {
    // Check if already submitted
    const existingSubmission = await Submission.findOne({ homeworkId, studentId });
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this homework' });
    }

    const submission = await Submission.create({
      homeworkId,
      studentId,
      file: filePath,
      text: req.body.text || '',
      status: 'submitted'
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add delete homework function
const deleteHomework = async (req, res) => {
  const { homeworkId } = req.params;
  
  try {
    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }
    
    // Delete all submissions for this homework
    await Submission.deleteMany({ homeworkId });
    await homework.deleteOne();
    
    res.json({ message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createHomework, getClassHomework, submitHomework, deleteHomework };