const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class');
const homeworkRoutes = require('./routes/homework');
const messageRoutes = require('./routes/message');
const noteRoutes = require('./routes/notes'); // Add this line
const notificationRoutes = require('./routes/notifications');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files (homework, voice notes)

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notes', noteRoutes); // Add this line
app.use('/api/notifications', notificationRoutes);

// Basic health route
app.get('/', (req, res) => {
  res.send('MentorFlow Backend is running 🚀');
});

// Socket.io for real-time chat (class rooms)
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Add user to their personal room for notifications
socket.on('user_connected', (userId) => {
  socket.join(`user_${userId}`);
  console.log(`User ${userId} joined their personal room`);
});

  // Join a class room
  socket.on('join_class', ({ classId, userId }) => {
    const room = `class_${classId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} (User ${userId}) joined ${room}`);
    
    // Optional: Notify others in room
    socket.to(room).emit('user_joined', { userId, message: 'A student joined the class' });
  });

  // Send message in class
  socket.on('send_message', async (data) => {
    const { classId, senderId, message } = data;
    const room = `class_${classId}`;

    try {
      // Save message to database
      const Message = require('./models/Message');
      const newMessage = await Message.create({
        classId,
        senderId,
        message
      });

      const populatedMessage = await newMessage.populate('senderId', 'name role');

      // Broadcast to everyone in the class room (including sender)
      io.to(room).emit('receive_message', populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Add this after your existing routes, before server.listen
// Better file serving with error handling
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filepath)) {
    console.error('File not found:', filepath);
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Send file for download
  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).json({ error: 'Download failed' });
    }
  });
});



// Debug endpoint - REMOVE IN PRODUCTION
app.get('/api/debug/files', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, 'uploads');
  
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      uploadsFolder: uploadsDir,
      files: files 
    });
  });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ MentorFlow Backend running on port ${PORT}`);
  console.log(`📁 Uploads folder: http://localhost:${PORT}/uploads`);
});