require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Pass = require('../models/Pass');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🌱 Connected to MongoDB — seeding JD College Bus Pass Management System...');

  // Clear existing
  await Promise.all([
    User.deleteMany({}), Route.deleteMany({}), Bus.deleteMany({}),
    Trip.deleteMany({}), Pass.deleteMany({}), Payment.deleteMany({}), Complaint.deleteMany({})
  ]);

  // --- USERS (JD College Students, Teachers, Drivers, Admin) ---
  const pw = await bcrypt.hash('test123', 10);
  const users = await User.insertMany([
    { name: 'Aarav Sharma', email: 'student@test.com', password: pw, role: 'student', collegeName: 'JD College of Engineering & Technology', studentId: 'JDC-STU-8821', phone: '9876543210' },
    { name: 'Ananya Deshmukh', email: 'student2@test.com', password: pw, role: 'student', collegeName: 'JD College of Engineering & Technology', studentId: 'JDC-STU-4412', phone: '9876543211' },
    { name: 'Prof. Rajesh Kulkarni', email: 'teacher@test.com', password: pw, role: 'teacher', collegeName: 'JD College of Engineering & Technology', employeeId: 'JDC-FAC-101', phone: '9876543212' },
    { name: 'Dr. Sunita Patil', email: 'teacher2@test.com', password: pw, role: 'teacher', collegeName: 'JD College of Engineering & Technology', employeeId: 'JDC-FAC-102', phone: '9876543213' },
    { name: 'Sanjay Raut', email: 'driver@test.com', password: pw, role: 'driver', employeeId: 'DRV-001', phone: '9876543214' },
    { name: 'Mohan Singh', email: 'driver2@test.com', password: pw, role: 'driver', employeeId: 'DRV-002', phone: '9876543215' },
    { name: 'Rajesh Joshi', email: 'admin@test.com', password: pw, role: 'admin', phone: '9876543216' },
  ]);
  console.log('✅ JD College Users (Students & Teachers) seeded');

  // --- ROUTES (JD College Routes in Nagpur) ---
  const routes = await Route.insertMany([
    {
      routeNumber: '42A',
      name: 'JD College Campus Express',
      baseFare: 20,
      frequency: 'Every 10 mins',
      startTime: '06:00', endTime: '22:00',
      stops: [
        { name: 'Sitabuldi Interchange', order: 1, lat: 21.1458, lng: 79.0882 },
        { name: 'Jhansi Rani Square', order: 2, lat: 21.1410, lng: 79.0780 },
        { name: 'Dharampeth Market', order: 3, lat: 21.1370, lng: 79.0660 },
        { name: 'JD College Main Gate', order: 4, lat: 21.1255, lng: 79.0522 },
        { name: 'Hostel Block', order: 5, lat: 21.1200, lng: 79.0420 },
      ]
    },
    {
      routeNumber: '101',
      name: 'Nagpur Metro - JD College Circular',
      baseFare: 25,
      frequency: 'Every 15 mins',
      startTime: '05:30', endTime: '23:00',
      stops: [
        { name: 'Nagpur Central Station', order: 1, lat: 21.1524, lng: 79.0888 },
        { name: 'Cotton Market', order: 2, lat: 21.1480, lng: 79.0920 },
        { name: 'Sitabuldi Junction', order: 3, lat: 21.1458, lng: 79.0882 },
        { name: 'Rahate Colony', order: 4, lat: 21.1290, lng: 79.0790 },
        { name: 'JD College Wardha Rd Stop', order: 5, lat: 21.0920, lng: 79.0620 },
      ]
    },
    {
      routeNumber: '52B',
      name: 'Futala - JD College Shuttle',
      baseFare: 30,
      frequency: 'Every 20 mins',
      startTime: '07:00', endTime: '21:00',
      stops: [
        { name: 'Civil Lines Terminal', order: 1, lat: 21.1550, lng: 79.0750 },
        { name: 'High Court Square', order: 2, lat: 21.1520, lng: 79.0700 },
        { name: 'Japanese Garden', order: 3, lat: 21.1620, lng: 79.0620 },
        { name: 'Seminary Hills', order: 4, lat: 21.1680, lng: 79.0550 },
        { name: 'JD College Extension', order: 5, lat: 21.1540, lng: 79.0440 },
      ]
    },
    {
      routeNumber: 'EV-22',
      name: 'MIHAN - JD College Eco Shuttle',
      baseFare: 15,
      frequency: 'Every 8 mins',
      startTime: '06:00', endTime: '22:00',
      stops: [
        { name: 'Airport Metro Station', order: 1, lat: 21.0920, lng: 79.0620 },
        { name: 'Chhatrapati Square', order: 2, lat: 21.1120, lng: 79.0680 },
        { name: 'Khapri Junction', order: 3, lat: 21.0600, lng: 79.0580 },
        { name: 'MIHAN Tech Park', order: 4, lat: 21.0450, lng: 79.0450 },
        { name: 'JD College South Gate', order: 5, lat: 21.0380, lng: 79.0390 },
      ]
    }
  ]);
  console.log('✅ JD College Routes seeded');

  // --- BUSES ---
  const buses = await Bus.insertMany([
    { busNumber: 'MH-31-FC-4201', registrationPlate: 'MH31FC4201', capacity: 50, type: 'Diesel', route: routes[0]._id, driver: users[4]._id, status: 'active', currentOccupancy: 32, lastLocation: { lat: 21.1370, lng: 79.0660 } },
    { busNumber: 'MH-31-EV-1012', registrationPlate: 'MH31EV1012', capacity: 60, type: 'Electric', route: routes[1]._id, driver: users[5]._id, status: 'active', currentOccupancy: 18, lastLocation: { lat: 21.1458, lng: 79.0882 } },
    { busNumber: 'MH-31-EV-2234', registrationPlate: 'MH31EV2234', capacity: 40, type: 'Electric', route: routes[3]._id, status: 'idle', currentOccupancy: 0, lastLocation: { lat: 21.0920, lng: 79.0620 } },
    { busNumber: 'MH-31-HB-5501', registrationPlate: 'MH31HB5501', capacity: 55, type: 'Hybrid', route: routes[2]._id, status: 'maintenance' },
  ]);
  console.log('✅ JD College Bus Fleet seeded');

  // --- PASSES ---
  const now = new Date();
  const pastStart = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000);
  const pastEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 120);

  const passes = await Pass.insertMany([
    // Expired tenure pass with unused taps that rolled over
    {
      passId: 'JDC-AARAV-PREV-2023',
      user: users[0]._id, route: routes[0]._id,
      boardingPoint: 'Sitabuldi Interchange', destinationStop: 'JD College Main Gate',
      duration: 'semester', passType: 'student', amount: 600,
      status: 'expired', validFrom: pastStart, validUntil: pastEnd,
      totalTaps: 240, usedTaps: 228, rolloverTapsIn: 0, rolloverTapsOut: 12, rolloverClaimed: true,
      qrData: JSON.stringify({ passId: 'JDC-AARAV-PREV-2023', userId: users[0]._id })
    },
    // Current active pass with 12 rollover taps carried forward from previous tenure
    {
      passId: 'JDC-AARAV001-2024',
      user: users[0]._id, route: routes[0]._id,
      boardingPoint: 'Sitabuldi Interchange', destinationStop: 'JD College Main Gate',
      duration: 'semester', passType: 'student', amount: 600,
      status: 'active', validFrom: now, validUntil,
      totalTaps: 252, usedTaps: 34, rolloverTapsIn: 12, rolloverTapsOut: 0, rolloverClaimed: false,
      linkedPreviousPassId: 'JDC-AARAV-PREV-2023',
      qrData: JSON.stringify({ passId: 'JDC-AARAV001-2024', userId: users[0]._id })
    },
    {
      passId: 'JDC-ANANYA002-2024',
      user: users[1]._id, route: routes[0]._id,
      boardingPoint: 'Dharampeth Market', destinationStop: 'Hostel Block',
      duration: 'monthly', passType: 'student', amount: 250,
      status: 'active', validFrom: now, validUntil: new Date(now.getTime() + 30*24*60*60*1000),
      totalTaps: 60, usedTaps: 18, rolloverTapsIn: 0, rolloverTapsOut: 0, rolloverClaimed: false,
      qrData: JSON.stringify({ passId: 'JDC-ANANYA002-2024', userId: users[1]._id })
    },
    {
      passId: 'JDC-RAJESH003-2024',
      user: users[2]._id, route: routes[1]._id,
      boardingPoint: 'Nagpur Central Station', destinationStop: 'JD College Wardha Rd Stop',
      duration: 'monthly', passType: 'teacher', amount: 350,
      status: 'active', validFrom: now, validUntil: new Date(now.getTime() + 30*24*60*60*1000),
      totalTaps: 68, usedTaps: 22, rolloverTapsIn: 8, rolloverTapsOut: 0, rolloverClaimed: false,
      qrData: JSON.stringify({ passId: 'JDC-RAJESH003-2024', userId: users[2]._id })
    },
    {
      passId: 'JDC-SUNITA004-2024',
      user: users[3]._id, route: routes[2]._id,
      boardingPoint: 'Civil Lines Terminal', destinationStop: 'JD College Extension',
      duration: 'weekly', passType: 'teacher', amount: 105,
      status: 'pending', validFrom: now, validUntil: new Date(now.getTime() + 7*24*60*60*1000),
      totalTaps: 14, usedTaps: 0, rolloverTapsIn: 0, rolloverTapsOut: 0, rolloverClaimed: false,
      qrData: JSON.stringify({ passId: 'JDC-SUNITA004-2024', userId: users[3]._id })
    },
  ]);
  console.log('✅ Passes seeded');

  // --- TRIPS ---
  const tripData = [];
  for (let d = 30; d >= 0; d--) {
    const date = new Date(); date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    [8, 9, 13, 17, 18].forEach(hour => {
      const baseCount = isWeekend ? 15 : (hour === 8 || hour === 18 ? 45 : 28);
      const count = baseCount + Math.floor(Math.random() * 10 - 5);
      const tripDate = new Date(date); tripDate.setHours(hour, 0, 0, 0);
      tripData.push({
        bus: buses[0]._id, driver: users[4]._id, route: routes[0]._id,
        date: tripDate, hourOfDay: hour,
        status: 'completed',
        startTime: tripDate, endTime: new Date(tripDate.getTime() + 45*60*1000),
        passengerCount: Math.max(0, count),
        distanceCovered: 8.5
      });
    });
    [7, 9, 12, 16, 19].forEach(hour => {
      const base = isWeekend ? 20 : (hour === 9 || hour === 19 ? 50 : 32);
      const tripDate = new Date(date); tripDate.setHours(hour, 0, 0, 0);
      tripData.push({
        bus: buses[1]._id, driver: users[5]._id, route: routes[1]._id,
        date: tripDate, hourOfDay: hour,
        status: 'completed',
        passengerCount: Math.max(0, base + Math.floor(Math.random() * 12 - 6)),
        distanceCovered: 12.0
      });
    });
  }
  tripData.push({
    bus: buses[0]._id, driver: users[4]._id, route: routes[0]._id,
    date: new Date(), hourOfDay: new Date().getHours(),
    status: 'scheduled', currentStop: 0
  });
  tripData.push({
    bus: buses[1]._id, driver: users[5]._id, route: routes[1]._id,
    date: new Date(), hourOfDay: new Date().getHours(),
    status: 'scheduled', currentStop: 0
  });
  await Trip.insertMany(tripData);
  console.log(`✅ ${tripData.length} Trips seeded`);

  // --- PAYMENTS ---
  await Payment.insertMany([
    { user: users[0]._id, pass: passes[0]._id, route: routes[0]._id, amount: 600, method: 'UPI', status: 'success', description: 'Semester student pass purchase', transactionId: 'TXN-JDC123' },
    { user: users[0]._id, route: routes[0]._id, amount: 20, method: 'Card', status: 'success', description: 'Single journey fare', transactionId: 'TXN-JDC456' },
    { user: users[2]._id, pass: passes[2]._id, route: routes[1]._id, amount: 350, method: 'UPI', status: 'success', description: 'Monthly faculty pass purchase', transactionId: 'TXN-JDC789' },
    { user: users[3]._id, pass: passes[3]._id, route: routes[2]._id, amount: 105, method: 'Card', status: 'success', description: 'Weekly faculty pass purchase', transactionId: 'TXN-JDC012' },
  ]);
  console.log('✅ Payments seeded');

  // --- COMPLAINTS ---
  await Complaint.insertMany([
    { user: users[0]._id, bus: buses[0]._id, route: routes[0]._id, type: 'delay', reason: 'traffic', description: 'Bus was delayed by 15 mins near Jhansi Rani Square during peak morning lecture hour.', status: 'resolved', resolvedAt: new Date() },
    { user: users[2]._id, route: routes[1]._id, type: 'complaint', description: 'Faculty seat reservation sign requested on Route 101 morning bus.', status: 'open' },
    { user: users[4]._id, bus: buses[0]._id, route: routes[0]._id, type: 'incident', reason: 'breakdown', description: 'Engine indicator near Dharampeth. Bus parked safely near JD College gate.', status: 'in-progress' },
  ]);
  console.log('✅ Complaints seeded');

  console.log('\n🎉 JD College Bus Pass Management System Database seeded successfully!');
  console.log('\n📋 Test Accounts (JD College):');
  console.log('  Student : student@test.com  / test123 (Aarav Sharma)');
  console.log('  Teacher : teacher@test.com  / test123 (Prof. Rajesh Kulkarni)');
  console.log('  Driver  : driver@test.com   / test123 (Sanjay Raut)');
  console.log('  Admin   : admin@test.com    / test123 (Rajesh Joshi)');
  process.exit(0);
};

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
