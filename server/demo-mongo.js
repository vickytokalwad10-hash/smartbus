const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartbus';

async function runDemo() {
  console.log('--------------------------------------------------');
  console.log('🔄 Connecting to MongoDB at:', MONGO_URI);
  console.log('--------------------------------------------------');

  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ SUCCESS: Connected to MongoDB!`);
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
    console.log('--------------------------------------------------');

    // Define a simple Demo Schema & Model
    const DemoUserSchema = new mongoose.Schema({
      name: String,
      role: String,
      email: String,
      createdAt: { type: Date, default: Date.now }
    });

    // Check existing collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📊 Collections found in database:');
    collections.forEach(c => console.log(`   - ${c.name}`));
    console.log('--------------------------------------------------');

    // Count records in seeded collections
    const User = mongoose.models.User || mongoose.model('User', DemoUserSchema);
    const userCount = await User.countDocuments();
    console.log(`👥 Total Users in DB: ${userCount}`);

    const users = await User.find({}).select('name role email').limit(4);
    console.log('📋 Sample Users:');
    users.forEach(u => console.log(`   • [${u.role?.toUpperCase()}] ${u.name} (${u.email})`));

    console.log('--------------------------------------------------');
    console.log('✨ Demo completed successfully!');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runDemo();
