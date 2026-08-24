const router = require('express').Router();
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const { protect, authorize } = require('../middleware/auth');

// Simple weighted average prediction engine
function predictRidership(historicalData, targetHour) {
  if (!historicalData.length) return { predicted: 0, confidence: 0 };
  // Sort by date desc, give more weight to recent data
  const sorted = historicalData.sort((a, b) => new Date(b.date) - new Date(a.date));
  let weightedSum = 0, totalWeight = 0;
  sorted.forEach((t, i) => {
    const weight = 1 / (i + 1); // recency weight
    weightedSum += t.passengerCount * weight;
    totalWeight += weight;
  });
  const predicted = Math.round(weightedSum / totalWeight);
  const variance = sorted.reduce((sum, t) => sum + Math.pow(t.passengerCount - predicted, 2), 0) / sorted.length;
  const confidence = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));
  return { predicted, confidence: Math.round(confidence) };
}

// GET predictions for a route
router.get('/:routeId', protect, authorize('admin'), async (req, res) => {
  try {
    const { routeId } = req.params;
    const days = parseInt(req.query.days) || 7;
    const since = new Date(); since.setDate(since.getDate() - 30);

    const trips = await Trip.find({
      route: routeId,
      status: 'completed',
      date: { $gte: since }
    }).sort({ date: -1 });

    // Build hourly breakdown
    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6AM-10PM
    const predictions = hours.map(hour => {
      const hourTrips = trips.filter(t => t.hourOfDay === hour);
      const { predicted, confidence } = predictRidership(hourTrips, hour);
      return { hour, predicted, confidence };
    });

    // Weekly chart data (last 7 days actual vs predicted)
    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
      const dayTrips = trips.filter(t => new Date(t.date) >= dayStart && new Date(t.date) <= dayEnd);
      const actual = dayTrips.reduce((s, t) => s + t.passengerCount, 0);
      const { predicted } = predictRidership(
        trips.filter(t => {
          const td = new Date(t.date);
          return td.getDay() === d.getDay(); // same day of week
        }),
        12
      );
      chartData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        actual,
        predicted: Math.round(predicted * 1.05) // slight overestimate bias
      });
    }

    // Recommendations
    const recommendations = predictions
      .filter(p => p.predicted > 0 && p.confidence > 20)
      .map(p => ({
        hour: p.hour,
        predicted: p.predicted,
        confidence: p.confidence,
        suggestion: p.predicted > 40
          ? `Add relief bus at ${p.hour}:00 — predicted ${p.predicted} passengers (${p.confidence}% confidence)`
          : null
      }))
      .filter(p => p.suggestion);

    res.json({ predictions, chartData, recommendations });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET admin overview stats
router.get('/overview/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const Pass = require('../models/Pass');
    const Bus = require('../models/Bus');
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const [activePasses, busesInService, todayTrips] = await Promise.all([
      Pass.countDocuments({ status: 'active' }),
      Bus.countDocuments({ status: 'active' }),
      Trip.find({ date: { $gte: today, $lt: tomorrow }, status: { $in: ['in-progress', 'completed'] } })
    ]);

    const todayRidership = todayTrips.reduce((s, t) => s + t.passengerCount, 0);
    const buses = await Bus.find({ status: 'active' });
    const avgOccupancy = buses.length
      ? Math.round(buses.reduce((s, b) => s + (b.currentOccupancy / b.capacity) * 100, 0) / buses.length)
      : 0;

    res.json({ activePasses, busesInService, todayRidership, avgOccupancy });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
