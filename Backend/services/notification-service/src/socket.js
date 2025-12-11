// socket.js - Complete updated file
let ioInstance = null;

exports.init = (server) => {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: { 
      origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance.use((socket, next) => {
    // Simple token validation - get userId from query
    const userId = socket.handshake.query?.userId;
    if (userId) {
      socket.userId = userId;
      console.log(`Socket auth: User ${userId} connecting`);
    } else {
      console.log('Socket connecting without userId');
    }
    next();
  });

  ioInstance.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, 'User:', socket.userId);
    
    if (socket.userId) {
      socket.join(socket.userId);
      console.log(`User ${socket.userId} joined room ${socket.userId}`);
    }

    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId);
        socket.userId = userId;
        console.log(`User ${userId} joined via join event`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', socket.id, 'Reason:', reason);
    });
  });

  return ioInstance;
};

exports.notifyUser = (userId, payload) => {
  if (!ioInstance) {
    console.log('Socket.io not initialized');
    return;
  }
  
  if (!userId) {
    console.log('Cannot notify: No userId provided');
    return;
  }
  
  console.log(`Sending notification to user ${userId}:`, payload);
  ioInstance.to(userId).emit('notification', payload);
};

exports.getIo = () => ioInstance;