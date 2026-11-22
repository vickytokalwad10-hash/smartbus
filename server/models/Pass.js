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
  totalTaps: { type: Number, default: 60 },
  usedTaps: { type: Number, default: 0 },
  rolloverTapsIn: { type: Number, default: 0 },
  rolloverTapsOut: { type: Number, default: 0 },
  rolloverClaimed: { type: Boolean, default: false },
  linkedPreviousPassId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

passSchema.virtual('remainingTaps').get(function () {
  return Math.max(0, (this.totalTaps || 0) - (this.usedTaps || 0));
});

passSchema.set('toJSON', { virtuals: true });
passSchema.set('toObject', { virtuals: true });

passSchema.pre('save', function () {
  if (!this.passId) {
    this.passId = 'JDC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  if (this.user) {
    this.qrData = JSON.stringify({ passId: this.passId, userId: this.user.toString() });
  }
});

module.exports = mongoose.model('Pass', passSchema);
