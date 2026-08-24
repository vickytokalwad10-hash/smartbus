const router = require('express').Router();
const Route = require('../models/Route');
const { protect, authorize } = require('../middleware/auth');

// GET all routes
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find({ active: true });
    res.json(routes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET frequent routes (top 5 by name for demo)
router.get('/frequent', async (req, res) => {
  try {
    const routes = await Route.find({ active: true }).limit(5);
    res.json(routes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET search routes
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const routes = await Route.find({
      $or: [
        { routeNumber: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { 'stops.name': { $regex: query, $options: 'i' } }
      ]
    });
    res.json(routes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single route
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: 'Route not found' });
    res.json(route);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create route (admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json(route);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update route (admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(route);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE route (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
