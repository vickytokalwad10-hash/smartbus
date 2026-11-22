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

// Base tap allotment per duration tenure (e.g. 2 taps/day)
const durationTapsMap = { daily: 2, weekly: 14, monthly: 60, semester: 240, annual: 730 };

// GET /api/passes/mine — user's own passes
router.get('/mine', protect, async (req, res) => {
  try {
    const passes = await Pass.find({ user: req.user._id })
      .populate('route', 'routeNumber name')
      .sort({ createdAt: -1 });
    res.json(passes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/passes/rollover-preview — preview unused taps from previous pass for current user
router.get('/rollover-preview', protect, async (req, res) => {
  try {
    const prevPass = await Pass.findOne({
      user: req.user._id,
      rolloverClaimed: { $ne: true }
    }).sort({ createdAt: -1 });

    if (!prevPass) {
      return res.json({ eligibleTaps: 0, previousPass: null });
    }

    const unusedTaps = Math.max(0, (prevPass.totalTaps || 0) - (prevPass.usedTaps || 0));
    res.json({
      eligibleTaps: unusedTaps,
      previousPass: {
        passId: prevPass.passId,
        duration: prevPass.duration,
        totalTaps: prevPass.totalTaps,
        usedTaps: prevPass.usedTaps,
        remainingTaps: unusedTaps,
        validUntil: prevPass.validUntil,
        status: prevPass.status
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/passes/:id — single pass (for QR validation)
router.get('/:id', protect, async (req, res) => {
  try {
    const pass = await Pass.findOne({ passId: req.params.id })
      .populate('user', 'name email studentId employeeId role')
      .populate('route', 'routeNumber name');
    if (!pass) return res.status(404).json({ message: 'Pass not found', valid: false });
    
    const isExpiredDate = new Date(pass.validUntil) <= new Date();
    const remaining = Math.max(0, (pass.totalTaps || 0) - (pass.usedTaps || 0));
    const isTapExhausted = pass.totalTaps != null && remaining <= 0;
    const valid = pass.status === 'active' && !isExpiredDate && !isTapExhausted;

    let reason = '';
    if (pass.status !== 'active') reason = `Pass is ${pass.status}`;
    else if (isExpiredDate) reason = 'Pass has expired';
    else if (isTapExhausted) reason = 'Tap limit reached (0 remaining taps)';

    res.json({
      ...pass.toObject(),
      valid,
      remainingTaps: remaining,
      reason
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/passes/:id/tap — record a pass tap/ride
router.post('/:id/tap', protect, async (req, res) => {
  try {
    const pass = await Pass.findOne({ passId: req.params.id })
      .populate('user', 'name email studentId employeeId role')
      .populate('route', 'routeNumber name');

    if (!pass) return res.status(404).json({ ok: false, message: 'Pass not found' });

    if (pass.status !== 'active') {
      return res.status(400).json({ ok: false, message: `Pass is ${pass.status}` });
    }

    if (new Date(pass.validUntil) <= new Date()) {
      return res.status(400).json({ ok: false, message: 'Pass has expired' });
    }

    const remaining = Math.max(0, (pass.totalTaps || 0) - (pass.usedTaps || 0));
    if (remaining <= 0) {
      return res.status(400).json({ ok: false, message: 'Tap limit reached (0 remaining taps)' });
    }

    pass.usedTaps = (pass.usedTaps || 0) + 1;
    await pass.save();

    const updatedRemaining = Math.max(0, pass.totalTaps - pass.usedTaps);
    const usedFromRollover = pass.usedTaps > (pass.totalTaps - pass.rolloverTapsIn);

    res.json({
      ok: true,
      message: 'Tap verified and recorded',
      pass: {
        passId: pass.passId,
        totalTaps: pass.totalTaps,
        usedTaps: pass.usedTaps,
        remainingTaps: updatedRemaining,
        rolloverTapsIn: pass.rolloverTapsIn,
        usedFromRollover,
        user: pass.user,
        route: pass.route
      }
    });
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

    // Calculate base taps according to tenure duration
    const baseTaps = durationTapsMap[duration] || 60;
    let rolloverTapsIn = 0;
    let linkedPreviousPassId = null;

    // Check for leftover unused taps from previous pass tenure
    const prevPass = await Pass.findOne({
      user: req.user._id,
      rolloverClaimed: { $ne: true }
    }).sort({ createdAt: -1 });

    if (prevPass) {
      const unused = Math.max(0, (prevPass.totalTaps || 0) - (prevPass.usedTaps || 0));
      if (unused > 0) {
        rolloverTapsIn = unused;
        linkedPreviousPassId = prevPass.passId || prevPass._id.toString();
        // Mark previous pass rollover as claimed
        prevPass.rolloverClaimed = true;
        prevPass.rolloverTapsOut = unused;
        await prevPass.save();
      }
    }

    const totalTaps = baseTaps + rolloverTapsIn;

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
      validUntil: calcValidity(duration),
      totalTaps,
      usedTaps: 0,
      rolloverTapsIn,
      rolloverTapsOut: 0,
      rolloverClaimed: false,
      linkedPreviousPassId
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
