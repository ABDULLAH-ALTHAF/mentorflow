const express = require('express');
const { protect, teacherOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { 
  createNote, 
  getClassNotes, 
  deleteNote 
} = require('../controllers/noteController');

const router = express.Router();

router.use(protect);

router.post('/', teacherOnly, upload.single('file'), createNote);
router.get('/:classId', getClassNotes);
router.delete('/:noteId', teacherOnly, deleteNote);

module.exports = router;