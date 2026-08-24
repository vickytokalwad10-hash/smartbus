const setupSocket = (io) => {
  // Track connected drivers { busId: socketId }
  const activeBuses = {};

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Driver joins bus room
    socket.on('join:bus', ({ busId, role }) => {
      socket.join(`bus:${busId}`);
      if (role === 'driver') {
        activeBuses[busId] = socket.id;
        io.emit('fleet:active', Object.keys(activeBuses));
        console.log(`🚌 Driver joined bus:${busId}`);
      }
    });

    // Passenger/admin joins route room to watch
    socket.on('join:route', ({ routeId }) => {
      socket.join(`route:${routeId}`);
    });

    // Driver emits live location
    socket.on('bus:location', ({ busId, lat, lng, routeId, tripId }) => {
      const payload = { busId, lat, lng, timestamp: new Date(), tripId };
      // Broadcast to bus room and route room
      socket.to(`bus:${busId}`).emit('bus:location', payload);
      if (routeId) socket.to(`route:${routeId}`).emit('bus:location', payload);
      io.emit('bus:location:all', payload); // admin sees all

      // Update DB in background
      const Bus = require('../models/Bus');
      Bus.findByIdAndUpdate(busId, {
        lastLocation: { lat, lng, updatedAt: new Date() },
        status: 'active'
      }).catch(console.error);
    });

    // Driver updates seat occupancy
    socket.on('bus:occupancy', ({ busId, current, capacity, routeId }) => {
      const payload = { busId, current, capacity, pct: Math.round((current / capacity) * 100), timestamp: new Date() };
      socket.to(`bus:${busId}`).emit('bus:occupancy', payload);
      if (routeId) socket.to(`route:${routeId}`).emit('bus:occupancy', payload);
      io.emit('bus:occupancy:all', payload);

      const Bus = require('../models/Bus');
      Bus.findByIdAndUpdate(busId, { currentOccupancy: current }).catch(console.error);
    });

    // Driver marks stop arrived
    socket.on('bus:stop', ({ busId, stopIndex, stopName, routeId }) => {
      const payload = { busId, stopIndex, stopName, timestamp: new Date() };
      socket.to(`bus:${busId}`).emit('bus:stop', payload);
      if (routeId) socket.to(`route:${routeId}`).emit('bus:stop', payload);
    });

    socket.on('disconnect', () => {
      // Remove from activeBuses
      const busId = Object.keys(activeBuses).find(k => activeBuses[k] === socket.id);
      if (busId) {
        delete activeBuses[busId];
        io.emit('fleet:active', Object.keys(activeBuses));
        const Bus = require('../models/Bus');
        Bus.findByIdAndUpdate(busId, { status: 'idle' }).catch(console.error);
        console.log(`🚌 Bus ${busId} went offline`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
