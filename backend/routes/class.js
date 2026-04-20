const express = require('express');
const { protect, teacherOnly } = require('../middleware/auth');
const { createClass, joinClass, getMyClasses, getClassUsers } = require('../controllers/classController');

const router = express.Router();

router.use(protect); // All class routes protected

router.post('/', teacherOnly, createClass);
router.post('/join', joinClass);
router.get('/my', getMyClasses);
router.get('/:classId/users', getClassUsers); // Add this line

module.exports = router;