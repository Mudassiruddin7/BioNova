import { Server } from 'socket.io';
import http from 'http';
import logger from '../utils/logger';

// Define the io variable as a Server instance
let io: Server;

/**
 * Initialize Socket.IO server
 * @param server HTTP server instance
 * @returns Socket.IO server instance
 */
export const initializeIO = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  logger.info('Socket.IO initialized');
  
  // Set up authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow connection but user will have limited access
      return next();
    }
    
    // Here you would validate the token and attach user data to socket
    // This is a simplified version - you would validate against your auth system
    try {
      // For example: const user = jwt.verify(token, process.env.JWT_SECRET);
      // socket.data.user = user;
      socket.data.authenticated = true;
      return next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      return next();
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    const userId = socket.data.user?.id;
    logger.info(`Socket connected: ${socket.id}${userId ? ` for user ${userId}` : ''}`);
    
    // Join user to their private room if authenticated
    if (socket.data.authenticated && socket.data.user?.id) {
      socket.join(socket.data.user.id);
    }
    
    // Synapse agent events
    socket.on('synapse_agent_query', (data) => {
      logger.info(`Synapse agent query received: ${socket.id}`, { query: data.query });
      // The actual processing happens in the backend, this just logs the event
    });
    
    // Handle client events for typing indicators
    socket.on('synapse_typing_start', () => {
      if (socket.data.user?.id) {
        socket.to(socket.data.user.id).emit('synapse_typing_start');
      }
    });
    
    socket.on('synapse_typing_stop', () => {
      if (socket.data.user?.id) {
        socket.to(socket.data.user.id).emit('synapse_typing_stop');
      }
    });
    
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 * @returns Socket.IO server instance or undefined if not initialized
 */
export const getIO = (): Server | undefined => {
  if (!io) {
    logger.warn('Socket.IO requested but not initialized');
  }
  return io;
};

/**
 * Send a Synapse agent update to a specific user
 * @param userId User ID to send the update to
 * @param updateType Type of update (e.g., 'thinking', 'retrieving', 'planning', 'response')
 * @param data Update data
 */
export const sendSynapseUpdate = (
  userId: string, 
  updateType: 'thinking' | 'retrieving' | 'planning' | 'response' | 'error', 
  data: any
): void => {
  if (!io) {
    logger.warn('Cannot send Synapse update: Socket.IO not initialized');
    return;
  }
  
  io.to(userId).emit('synapse_update', {
    type: updateType,
    timestamp: new Date().toISOString(),
    data
  });
  
  logger.debug(`Synapse update sent to user ${userId}`, { type: updateType });
};

/**
 * Send an agent status update to a specific user's session
 * @param userId User ID to send the update to
 * @param sessionId Chat session ID
 * @param status Agent processing status
 * @param message Optional status message
 */
export const sendAgentStatusUpdate = (
  userId: string,
  sessionId: string,
  status: 'idle' | 'thinking' | 'retrieving' | 'planning' | 'responding',
  message?: string
): void => {
  if (!io) {
    logger.warn('Cannot send agent status update: Socket.IO not initialized');
    return;
  }
  
  io.to(userId).emit('synapse_agent_update', {
    sessionId,
    status,
    message,
    timestamp: new Date().toISOString()
  });
  
  logger.debug(`Agent status update sent to user ${userId}`, { 
    sessionId, 
    status, 
    message 
  });
}; 