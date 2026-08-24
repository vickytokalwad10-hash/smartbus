const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  stops: [{ name: String, order: Number, lat: Number, lng: Number }],
  frequency: { type: String, default: 'Every 15 mins' },
  startTime: { type: String, default: '06:00' },
  endTime: { type: String, default: '22:00' },
  baseFare: { type: Number, default: 20 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);
