const Homework = require('../models/Homework');
const Submission = require('../models/Submission');
const { createNotification } = require('./notificationController');

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

    // Get all students in the class to notify them
    const Class = require('../models/Class');
    const classData = await Class.findById(classId);
    
    // Create notifications for all students
    if (classData && classData.students) {
      for (const studentId of classData.students) {
        await createNotification(
          studentId,
          'homework_posted',
          'New Homework Posted',
          `New homework "${title}" has been posted. Due: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}`,
          homework._id,
          'Homework',
          classId
        );
      }
    }

    res.status(201).json(homework);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD THIS MISSING FUNCTION
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
    let submission = await Submission.findOne({ homeworkId, studentId });
    
    if (submission) {
      // Update existing submission
      submission.file = filePath || submission.file;
      submission.text = req.body.text || submission.text;
      submission.status = 'submitted';
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      // Create new submission
      submission = await Submission.create({
        homeworkId,
        studentId,
        file: filePath,
        text: req.body.text || '',
        status: 'submitted',
        submittedAt: new Date()
      });
    }

    // Get homework details for notification
    const homework = await Homework.findById(homeworkId).populate('createdBy');
    
    // Notify teacher
    if (homework && homework.createdBy) {
      await createNotification(
        homework.createdBy._id,
        'submission_received',
        'New Submission Received',
        `${req.user.name} has submitted "${homework.title}"`,
        submission._id,
        'Submission',
        homework.classId
      );
    }

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD THIS MISSING FUNCTION
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

const addFeedback = async (req, res) => {
  const { submissionId } = req.params;
  const { grade, feedback } = req.body;
  let feedbackVoicePath = null;
  
  if (req.file) {
    feedbackVoicePath = `/uploads/${req.file.filename}`;
  }

  try {
    const submission = await Submission.findById(submissionId)
      .populate('homeworkId')
      .populate('studentId');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    submission.grade = grade || submission.grade;
    submission.feedback = feedback || submission.feedback;
    if (feedbackVoicePath) submission.feedbackVoice = feedbackVoicePath;
    submission.status = 'graded';
    submission.gradedAt = new Date();
    await submission.save();
    
    // Notify student
    if (submission.studentId) {
      await createNotification(
        submission.studentId._id,
        'submission_graded',
        'Homework Graded',
        `Your submission for "${submission.homeworkId.title}" has been graded. Grade: ${grade || 'Not specified'}`,
        submission._id,
        'Submission',
        submission.homeworkId.classId
      );
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubmissions = async (req, res) => {
  const { homeworkId } = req.params;
  
  try {
    const submissions = await Submission.find({ homeworkId })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 });
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createHomework, 
  getClassHomework, 
  submitHomework, 
  deleteHomework,
  addFeedback,
  getSubmissions
};