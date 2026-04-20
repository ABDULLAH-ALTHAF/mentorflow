const Class = require('../models/Class');
const User = require('../models/User');

// Generate simple invite code (6 characters)
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createClass = async (req, res) => {
  const { className } = req.body;
  const teacherId = req.user.id;

  try {
    let inviteCode = generateInviteCode();
    let existingClass = await Class.findOne({ inviteCode });

    // Ensure unique invite code
    while (existingClass) {
      inviteCode = generateInviteCode();
      existingClass = await Class.findOne({ inviteCode });
    }

    const newClass = await Class.create({
      className,
      teacherId,
      inviteCode,
      students: []
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinClass = async (req, res) => {
  const { inviteCode } = req.body;
  const studentId = req.user.id;

  try {
    const classRoom = await Class.findOne({ inviteCode });
    if (!classRoom) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    if (classRoom.students.includes(studentId)) {
      return res.status(400).json({ message: 'Already joined this class' });
    }

    classRoom.students.push(studentId);
    await classRoom.save();

    // Add to student's joinedClasses
    await User.findByIdAndUpdate(studentId, { $push: { joinedClasses: classRoom._id } });

    res.json({ message: 'Joined class successfully', class: classRoom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyClasses = async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacherId: req.user.id })
        .populate('students', 'name email');
    } else {
      classes = await Class.find({ students: req.user.id })
        .populate('teacherId', 'name email');
    }
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createClass, joinClass, getMyClasses };