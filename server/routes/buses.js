const router = require('express').Router();
const Bus = require('../models/Bus');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find().populate('route', 'routeNumber name').populate('driver', 'name');
    res.json(buses);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('route').populate('driver', 'name phone');
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(bus);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
