import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import terminalRoutes from './routes/terminalRoutes.js';
import mergeRoutes from './routes/mergeRoutes.js';  // Add this line

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// WebSocket Connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('joinProject', (projectId) => {
    socket.join(projectId);
    console.log(`User joined project: ${projectId}`);
  });
  
  socket.on('fileUpdate', (data) => {
    io.to(data.projectId).emit('fileChanged', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/merge', mergeRoutes);  // Add this line

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
