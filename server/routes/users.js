const router = require('express').Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET all users (admin) or filter by role
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET user stats (admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [students, customers, drivers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'driver' })
    ]);
    res.json({ students, customers, drivers, total: students + customers + drivers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update user
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE user
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
