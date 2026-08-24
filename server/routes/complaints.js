const router = require('express').Router();
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');

router.get('/mine', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('user', 'name email')
      .populate('bus', 'busNumber')
      .populate('route', 'routeNumber name')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const complaint = await Complaint.create({ user: req.user._id, ...req.body });
    res.status(201).json(complaint);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const update = { status: req.body.status };
    if (req.body.status === 'resolved') update.resolvedAt = new Date();
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(complaint);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
