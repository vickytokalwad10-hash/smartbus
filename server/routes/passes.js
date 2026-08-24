const router = require('express').Router();
const Pass = require('../models/Pass');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

// Calculate validity date
const calcValidity = (duration) => {
  const d = new Date();
  const map = { daily: 1, weekly: 7, monthly: 30, semester: 120, annual: 365 };
  d.setDate(d.getDate() + (map[duration] || 30));
  return d;
};

// GET /api/passes/mine — user's own passes
router.get('/mine', protect, async (req, res) => {
  try {
    const passes = await Pass.find({ user: req.user._id })
      .populate('route', 'routeNumber name')
      .sort({ createdAt: -1 });
    res.json(passes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/passes/:id — single pass (for QR validation)
router.get('/:id', protect, async (req, res) => {
  try {
    const pass = await Pass.findOne({ passId: req.params.id })
      .populate('user', 'name email studentId employeeId role')
      .populate('route', 'routeNumber name');
    if (!pass) return res.status(404).json({ message: 'Pass not found', valid: false });
    const valid = pass.status === 'active' && new Date(pass.validUntil) > new Date();
    res.json({ ...pass.toObject(), valid });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all passes (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;
    const passes = await Pass.find(query)
      .populate('user', 'name email role')
      .populate('route', 'routeNumber name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(passes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create pass
router.post('/', protect, async (req, res) => {
  try {
    const { routeId, boardingPoint, destinationStop, duration, passType, paymentMethod } = req.body;
    const baseFares = { daily: 30, weekly: 150, monthly: 500, semester: 1200, annual: 2000 };
    let amount = baseFares[duration] || 500;
    
    // Concessions for Students & Teachers
    if (req.user.role === 'student') {
      amount = Math.round(amount * 0.5); // 50% discount for students
    } else if (req.user.role === 'teacher') {
      amount = Math.round(amount * 0.7); // 30% faculty discount for teachers
    }

    const pass = await Pass.create({
      user: req.user._id,
      route: routeId,
      boardingPoint,
      destinationStop,
      duration,
      passType: req.user.role === 'student' ? 'student' : req.user.role === 'teacher' ? 'teacher' : 'general',
      amount,
      paymentMethod,
      status: 'active',
      validFrom: new Date(),
      validUntil: calcValidity(duration)
    });

    // Create payment record
    await Payment.create({
      user: req.user._id,
      pass: pass._id,
      route: routeId,
      amount,
      method: paymentMethod || 'UPI',
      status: 'success',
      description: `${duration} pass purchase (${req.user.role})`
    });

    const populated = await Pass.findById(pass._id).populate('route', 'routeNumber name');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update pass status (admin)
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const pass = await Pass.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(pass);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
