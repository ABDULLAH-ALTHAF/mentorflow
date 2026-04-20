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

// Basic health route
app.get('/', (req, res) => {
  res.send('MentorFlow Backend is running 🚀');
});

// Socket.io for real-time chat (class rooms)
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ MentorFlow Backend running on port ${PORT}`);
  console.log(`📁 Uploads folder: http://localhost:${PORT}/uploads`);
});