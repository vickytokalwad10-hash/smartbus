const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  registrationPlate: { type: String },
  capacity: { type: Number, default: 50 },
  type: { type: String, enum: ['Electric', 'Diesel', 'Hybrid'], default: 'Diesel' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'idle', 'maintenance', 'offline'], default: 'idle' },
  currentOccupancy: { type: Number, default: 0 },
  lastLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);
