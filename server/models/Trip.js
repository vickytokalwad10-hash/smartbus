const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  date: { type: Date, default: Date.now },
  hourOfDay: { type: Number }, // 0-23
  startTime: { type: Date },
  endTime: { type: Date },
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  passengerCount: { type: Number, default: 0 },
  scannedPasses: [{ passId: String, scannedAt: Date }],
  gpsPoints: [{ lat: Number, lng: Number, timestamp: Date }],
  distanceCovered: { type: Number, default: 0 }, // km
  currentStop: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trip', tripSchema);
