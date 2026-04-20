const Message = require('../models/Message');

const getClassMessages = async (req, res) => {
  const { classId } = req.params;

  try {
    const messages = await Message.find({ classId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClassMessages };