const express = require('express');
const { protect, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { 
  createHomework, 
  getClassHomework, 
  submitHomework,
  deleteHomework 
} = require('../controllers/homeworkController');

const router = express.Router();

router.use(protect);

router.post('/', teacherOnly, upload.single('voiceNote'), createHomework);
router.get('/:classId', getClassHomework);
router.post('/:homeworkId/submit', upload.single('file'), submitHomework);
router.delete('/:homeworkId', teacherOnly, deleteHomework);

module.exports = router;