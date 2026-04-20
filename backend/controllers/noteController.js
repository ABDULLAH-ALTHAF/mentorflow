const Note = require('../models/Note');

const createNote = async (req, res) => {
  const { classId, title, description, type } = req.body;
  const userId = req.user.id;
  let filePath = null;
  let fileType = null;

  if (req.file) {
    filePath = `/uploads/${req.file.filename}`;
    fileType = req.file.mimetype;
  }

  try {
    const note = await Note.create({
      classId,
      title,
      description,
      file: filePath,
      fileType,
      type: type || 'material',
      createdBy: userId
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClassNotes = async (req, res) => {
  const { classId } = req.params;

  try {
    const notes = await Note.find({ classId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNote = async (req, res) => {
  const { noteId } = req.params;

  try {
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createNote, getClassNotes, deleteNote };