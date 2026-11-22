const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'Card', 'Wallet', 'Cash'], default: 'UPI' },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  description: { type: String },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function () {
  if (!this.transactionId) {
    this.transactionId = 'TXN-' + Date.now().toString(36).toUpperCase();
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
