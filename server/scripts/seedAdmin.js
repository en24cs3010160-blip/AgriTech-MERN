require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_PASSWORD;
  const name = args[2] || process.env.ADMIN_NAME || 'System Administrator';

  if (!email) {
    console.error('Usage: node scripts/seedAdmin.js <email> [password] [name]');
    console.error('Or configure ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      await user.save();
      console.log(`Successfully elevated existing user "${user.name}" (${user.email}) to role: admin`);
    } else {
      if (!password) {
        console.error('Password is required when creating a new admin user');
        process.exit(1);
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin'
      });
      console.log(`Successfully created new admin user "${user.name}" (${user.email}) with role: admin`);
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();

