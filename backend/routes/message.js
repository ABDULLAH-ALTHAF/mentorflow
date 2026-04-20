const express = require('express');
const { protect } = require('../middleware/auth');
const { getClassMessages } = require('../controllers/messageController');

const router = express.Router();

router.use(protect);
router.get('/:classId', getClassMessages);

module.exports = router;