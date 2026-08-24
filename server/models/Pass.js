const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
  passId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  boardingPoint: { type: String, required: true },
  destinationStop: { type: String, required: true },
  duration: { type: String, enum: ['daily', 'weekly', 'monthly', 'semester', 'annual'], required: true },
  passType: { type: String, enum: ['student', 'teacher', 'general'], default: 'general' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'pending', 'expired', 'rejected'], default: 'pending' },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  idCardUrl: { type: String },
  paymentMethod: { type: String },
  qrData: { type: String },
  createdAt: { type: Date, default: Date.now }
});

passSchema.pre('save', function (next) {
  if (!this.passId) {
    this.passId = 'JDC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  this.qrData = JSON.stringify({ passId: this.passId, userId: this.user.toString() });
  next();
});

module.exports = mongoose.model('Pass', passSchema);
