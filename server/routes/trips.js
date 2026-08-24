const router = require('express').Router();
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const { protect, authorize } = require('../middleware/auth');

// GET driver's assigned trip for today
router.get('/assigned', protect, authorize('driver'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    let trip = await Trip.findOne({
      driver: req.user._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'in-progress'] }
    }).populate('bus').populate('route');

    // If none today, get next scheduled
    if (!trip) {
      trip = await Trip.findOne({ driver: req.user._id, status: 'scheduled' })
        .populate('bus').populate('route').sort({ date: 1 });
    }
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all trips (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const trips = await Trip.find().populate('bus','busNumber').populate('driver','name').populate('route','routeNumber name').sort({ date: -1 }).limit(50);
    res.json(trips);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single trip
router.get('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('bus').populate('route').populate('driver','name');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST start trip
router.post('/:id/start', protect, authorize('driver'), async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, {
      status: 'in-progress',
      startTime: new Date(),
      hourOfDay: new Date().getHours()
    }, { new: true });
    await Bus.findByIdAndUpdate(trip.bus, { status: 'active' });
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST end trip
router.post('/:id/end', protect, authorize('driver'), async (req, res) => {
  try {
    const { passengerCount, distanceCovered } = req.body;
    const trip = await Trip.findByIdAndUpdate(req.params.id, {
      status: 'completed',
      endTime: new Date(),
      passengerCount: passengerCount || 0,
      distanceCovered: distanceCovered || 0
    }, { new: true });
    await Bus.findByIdAndUpdate(trip.bus, { status: 'idle', currentOccupancy: 0 });
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST add GPS point
router.post('/:id/gps', protect, authorize('driver'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const trip = await Trip.findByIdAndUpdate(req.params.id, {
      $push: { gpsPoints: { lat, lng, timestamp: new Date() } }
    }, { new: true });
    await Bus.findByIdAndUpdate(trip.bus, { lastLocation: { lat, lng, updatedAt: new Date() } });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST scan pass
router.post('/:id/scan', protect, authorize('driver'), async (req, res) => {
  try {
    const { passId } = req.body;
    await Trip.findByIdAndUpdate(req.params.id, {
      $push: { scannedPasses: { passId, scannedAt: new Date() } },
      $inc: { passengerCount: 1 }
    });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST advance stop
router.post('/:id/stop', protect, authorize('driver'), async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, { $inc: { currentStop: 1 } }, { new: true });
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
