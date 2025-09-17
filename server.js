const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 9003;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  
  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Set up basic socket handlers (TypeScript modules will be handled by Next.js)
  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);
    
    // Basic connection handling
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
    
    // Join user room when user ID is provided
    socket.on('join-user-room', (userId) => {
      if (userId) {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their room`);
      }
    });
    
    // Leave user room
    socket.on('leave-user-room', (userId) => {
      if (userId) {
        socket.leave(`user-${userId}`);
        console.log(`User ${userId} left their room`);
      }
    });
  });

  // Make io available globally for API routes
  global.io = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.io server initialized with modular handlers');
    });
});
