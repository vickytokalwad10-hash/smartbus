const router = require('express').Router();
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

// GET user's own payments
router.get('/mine', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('route', 'routeNumber name')
      .populate('pass', 'passId duration')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all payments (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('route', 'routeNumber name')
      .sort({ createdAt: -1 }).limit(100);
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
