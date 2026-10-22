const http = require('http');
require('dotenv').config();
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runEndToEndVerification() {
  console.log('=== AGRITECH COMPLETE ROLE SEPARATION & MARKETPLACE TEST SUITE ===\n');
  const results = [];
  const testRun = async (title, fn) => {
    try {
      const msg = await fn();
      results.push({ title, status: 'PASSED', msg });
      console.log(`[PASS] ${title} -> ${msg || 'OK'}`);
    } catch (err) {
      results.push({ title, status: 'FAILED', err: err.message });
      console.error(`[FAIL] ${title} -> ${err.message}`);
    }
  };

  const ts = Date.now();
  const farmer1Email = `test_farmer1_${ts}@example.com`;
  const farmer2Email = `test_farmer2_${ts}@example.com`;
  const adminEmail = `test_admin_${ts}@example.com`;
  const password = 'Password123!';

  let farmer1Token = null;
  let farmer2Token = null;
  let adminToken = null;
  let productId = null;
  let bookingId = null;

  // 1. Root API Health
  await testRun('GET / (API Health Check)', async () => {
    const res = await request('GET', '/');
    if (res.status !== 200 || !res.body.message) throw new Error(`Status ${res.status}`);
    return res.body.message;
  });

  // 2. Public Registration strictly creates Farmer (prevent role injection)
  await testRun('POST /api/auth/register (Role Escalation Protection)', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: 'Farmer One (Seller)',
      email: farmer1Email,
      password,
      role: 'admin' // Attempted role escalation
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    if (res.body.user.role !== 'farmer') throw new Error(`Role escalation succeeded! Got: ${res.body.user.role}`);
    return `Role escalation prevented: Account created with role "${res.body.user.role}"`;
  });

  // 3. Register second farmer (Buyer)
  await testRun('POST /api/auth/register (Farmer Two - Buyer)', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: 'Farmer Two (Buyer)',
      email: farmer2Email,
      password
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    return `Buyer registered with role "${res.body.user.role}"`;
  });

  // 4. Farmer 1 login via /api/auth/login
  await testRun('POST /api/auth/login (Farmer Login Success)', async () => {
    const res = await request('POST', '/api/auth/login', { email: farmer1Email, password });
    if (res.status !== 200 || !res.body.token) throw new Error(`Status ${res.status}`);
    farmer1Token = res.body.token;
    return `Farmer 1 logged in, role: ${res.body.user.role}`;
  });

  // 5. Farmer 2 login via /api/auth/login
  await testRun('POST /api/auth/login (Farmer 2 Login Success)', async () => {
    const res = await request('POST', '/api/auth/login', { email: farmer2Email, password });
    if (res.status !== 200 || !res.body.token) throw new Error(`Status ${res.status}`);
    farmer2Token = res.body.token;
    return `Farmer 2 logged in, role: ${res.body.user.role}`;
  });

  // 6. Farmer attempting Admin Login (MUST BE 403 REJECTED)
  await testRun('POST /api/auth/admin-login (Farmer Attempt Blocked)', async () => {
    const res = await request('POST', '/api/auth/admin-login', { email: farmer1Email, password });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    return `Farmer rejected from admin login: "${res.body.message}"`;
  });

  // 7. Setup verified Admin User in DB
  await testRun('DB Setup Authorized Admin Account', async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await User.create({
      name: 'System Admin Tester',
      email: adminEmail,
      password: hash,
      role: 'admin'
    });
    return `Admin account seeded with role: admin`;
  });

  // 8. Admin login via /api/auth/admin-login
  await testRun('POST /api/auth/admin-login (Admin Login Success)', async () => {
    const res = await request('POST', '/api/auth/admin-login', { email: adminEmail, password });
    if (res.status !== 200 || !res.body.token || res.body.user.role !== 'admin') {
      throw new Error(`Admin login failed: ${res.status}`);
    }
    adminToken = res.body.token;
    return `Admin logged in successfully, role: ${res.body.user.role}`;
  });

  // 9. Admin attempting Farmer Login (MUST BE 403 REJECTED)
  await testRun('POST /api/auth/login (Admin Attempt on Farmer Login Blocked)', async () => {
    const res = await request('POST', '/api/auth/login', { email: adminEmail, password });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    return `Admin blocked on farmer login: "${res.body.message}"`;
  });

  // 10. Farmer blocked from Admin APIs
  await testRun('GET /api/admin/stats (Farmer Blocked on Admin API)', async () => {
    const res = await request('GET', '/api/admin/stats', null, farmer1Token);
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    return `Farmer denied access to admin API: "${res.body.message}"`;
  });

  // 11. Admin permitted on Admin APIs
  await testRun('GET /api/admin/stats (Admin Access Permitted)', async () => {
    const res = await request('GET', '/api/admin/stats', null, adminToken);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    return `Admin retrieved stats: ${res.body.totalUsers} users, ${res.body.totalProducts} products`;
  });

  // 12. Marketplace: Farmer 1 lists a product
  await testRun('POST /api/products (Farmer 1 Lists Product)', async () => {
    const res = await request('POST', '/api/products', {
      name: 'Certified Sharbati Wheat Seeds',
      description: 'High germination rate, 98% purity, graded seeds.',
      price: 650.00,
      category: 'Seeds',
      stock: 25,
      image: ''
    }, farmer1Token);
    if (res.status !== 201 || !res.body._id) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    productId = res.body._id;
    return `Product listed (ID: ${productId}, Stock: ${res.body.stock}, Price: ₹${res.body.price})`;
  });

  // 13. Marketplace: Farmer 2 views product listings
  await testRun('GET /api/products (Farmer 2 Views Marketplace)', async () => {
    const res = await request('GET', '/api/products');
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error(`Status ${res.status}`);
    const found = res.body.find(p => p._id === productId);
    if (!found) throw new Error('Product not visible in marketplace');
    if (found.seller?.name !== 'Farmer One (Seller)') throw new Error(`Incorrect seller: ${found.seller?.name}`);
    return `Product visible to buyer with seller "${found.seller.name}"`;
  });

  // 14. Marketplace: Farmer 1 tries to buy their OWN product (MUST BE 400 REJECTED)
  await testRun('POST /api/bookings (Self-Booking Rejection)', async () => {
    const res = await request('POST', '/api/bookings', {
      productId,
      quantity: 2
    }, farmer1Token);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    return `Self-booking prevented: "${res.body.message}"`;
  });

  // 15. Marketplace: Farmer 2 buys 5 units from Farmer 1
  await testRun('POST /api/bookings (Farmer 2 Buys from Farmer 1)', async () => {
    const res = await request('POST', '/api/bookings', {
      productId,
      quantity: 5
    }, farmer2Token);
    if (res.status !== 201 || !res.body.booking) throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
    bookingId = res.body.booking._id;
    if (res.body.booking.totalPrice !== 3250) throw new Error(`Incorrect total: ${res.body.booking.totalPrice}`);
    return `Order placed (ID: ${bookingId}, Qty: 5, Total: ₹${res.body.booking.totalPrice})`;
  });

  // 16. Stock Verification: Stock decremented from 25 to 20
  await testRun('GET /api/products (Verify Stock Decrement)', async () => {
    const res = await request('GET', '/api/products');
    const updatedProd = res.body.find(p => p._id === productId);
    if (updatedProd.stock !== 20) throw new Error(`Expected stock 20, got ${updatedProd.stock}`);
    return `Stock correctly reduced to ${updatedProd.stock}`;
  });

  // 17. Buyer Bookings History
  await testRun('GET /api/bookings/my (Farmer 2 Order History)', async () => {
    const res = await request('GET', '/api/bookings/my', null, farmer2Token);
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error(`Status ${res.status}`);
    const foundBooking = res.body.find(b => b._id === bookingId);
    if (!foundBooking) throw new Error('Booking not found in user history');
    return `Buyer verified order: ${foundBooking.product?.name} (Status: ${foundBooking.status})`;
  });

  // 18. Admin updates booking status
  await testRun('PATCH /api/admin/bookings/:id/status (Admin Confirms Order)', async () => {
    const res = await request('PATCH', `/api/admin/bookings/${bookingId}/status`, {
      status: 'Confirmed'
    }, adminToken);
    if (res.status !== 200 || res.body.booking.status !== 'Confirmed') throw new Error(`Status ${res.status}`);
    return `Booking status updated to "${res.body.booking.status}" by Admin`;
  });

  // 19. Cleanup: Remove temporary test records & accounts
  console.log('\n--- Cleaning up temporary test data ---');
  const Product = require('./models/Product');
  const Booking = require('./models/Booking');
  const User = require('./models/User');

  if (bookingId) await Booking.findByIdAndDelete(bookingId);
  if (productId) await Product.findByIdAndDelete(productId);
  await User.deleteMany({ email: { $in: [farmer1Email, farmer2Email, adminEmail] } });
  await mongoose.disconnect();
  console.log('Cleanup complete. Production data 100% preserved.');

  console.log('\n========================================');
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================');

  if (failed > 0) process.exit(1);
}

runEndToEndVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
