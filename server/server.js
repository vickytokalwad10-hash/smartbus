require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./db');
const setupSocket = require('./socket/socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true } // Allow all origins for mobile dev
});

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: true, credentials: true })); // Allow mobile + web dev connections
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/passes', require('./routes/passes'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/users', require('./routes/users'));
app.use('/api/predictions', require('./routes/predictions'));

// Socket.IO
setupSocket(io);

// Make io accessible to routes (for emitting from REST endpoints)
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 SmartBus API running on http://localhost:${PORT}`));
