const express = require('express');
const { protect, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { 
  createHomework, 
  getClassHomework, 
  submitHomework,
  deleteHomework,
  addFeedback,
  getSubmissions
} = require('../controllers/homeworkController');

const router = express.Router();

router.use(protect);

router.post('/', teacherOnly, upload.single('voiceNote'), createHomework);
router.get('/:classId', getClassHomework);
router.post('/:homeworkId/submit', upload.single('file'), submitHomework);
router.delete('/:homeworkId', teacherOnly, deleteHomework);
router.post('/:submissionId/feedback', teacherOnly, upload.single('feedbackVoice'), addFeedback);
router.get('/:homeworkId/submissions', teacherOnly, getSubmissions);

module.exports = router;