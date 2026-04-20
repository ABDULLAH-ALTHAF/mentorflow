const Homework = require('../models/Homework');
const Submission = require('../models/Submission');
const upload = require('../middleware/upload'); // We'll use in routes

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
      .populate('createdBy', 'name');
    res.json(homework);
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

module.exports = { createHomework, getClassHomework, submitHomework };