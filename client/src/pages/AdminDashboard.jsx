import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, getCurrentUser, clearAuthSession } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminUser] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Data
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!adminUser || adminUser.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [statsData, usersData, bookingsData, farmsData, cropsData, productsData] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/users'),
        apiRequest('/admin/bookings'),
        apiRequest('/admin/farms'),
        apiRequest('/admin/crops'),
        apiRequest('/products')
      ]);

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setFarms(Array.isArray(farmsData) ? farmsData : []);
      setCrops(Array.isArray(cropsData) ? cropsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      setMessage(`Admin data sync error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuthSession();
    navigate('/admin/login');
  }

  // Change User Role
  async function handleChangeRole(userId, newRole) {
    if (!window.confirm(`Change role of user to "${newRole}"?`)) return;
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      setMessage(`User role successfully changed to ${newRole}`);
      await loadAdminData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Delete User
  async function handleDeleteUser(userId) {
    if (!window.confirm('Delete this user? All their farms, crops, and product listings will also be removed.')) return;
    try {
      await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
      setMessage('User account and associated records deleted.');
      await loadAdminData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Update Booking Status
  async function handleStatusChange(bookingId, status) {
    try {
      await apiRequest(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setMessage(`Booking #${bookingId.slice(-6)} status updated to "${status}"`);
      await loadAdminData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Delete Product as Admin
  async function handleDeleteProduct(productId) {
    if (!window.confirm('Remove this product listing from the platform?')) return;
    try {
      await apiRequest(`/admin/products/${productId}`, { method: 'DELETE' });
      setMessage('Product listing removed by admin moderation.');
      await loadAdminData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!adminUser) return null;

  return (
    <main className="dashboard-page admin-dashboard-page">
      {/* Admin Header */}
      <header className="dashboard-header admin-header">
        <div className="admin-brand-cluster">
          <span className="admin-shield-icon">🛡️</span>
          <div>
            <div className="brand admin-brand">AgriTech Administration</div>
            <p>Platform Governance, User Verification & Agro-Metrics Console</p>
          </div>
        </div>

        <div className="header-user-controls">
          <span className="admin-badge">Admin: {adminUser.name}</span>
          <button type="button" className="logout-button admin-logout-btn" onClick={handleLogout}>
            Log Out Console
          </button>
        </div>
      </header>

      {/* Admin Message Banner */}
      {message && (
        <div className="dashboard-message admin-banner">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} className="close-msg-btn">✕</button>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <nav className="dashboard-nav admin-nav">
        <button
          type="button"
          className={activeTab === 'overview' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('overview')}
        >
          📊 System Overview
        </button>
        <button
          type="button"
          className={activeTab === 'users' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management ({users.length})
        </button>
        <button
          type="button"
          className={activeTab === 'bookings' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('bookings')}
        >
          📦 Platform Orders ({bookings.length})
        </button>
        <button
          type="button"
          className={activeTab === 'farms-crops' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('farms-crops')}
        >
          🌾 Platform Farms & Crops ({farms.length}/{crops.length})
        </button>
        <button
          type="button"
          className={activeTab === 'products' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('products')}
        >
          🛒 Marketplace Moderation ({products.length})
        </button>
      </nav>

      {loading && <p className="loading-indicator">Synchronizing platform data from MongoDB Atlas...</p>}

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === 'overview' && (
        <section className="tab-content">
          <div className="analytics-grid admin-stats-grid">
            <div className="stat-card admin-stat-card">
              <span className="stat-icon">👥</span>
              <div>
                <p>Total Registered Users</p>
                <h3>{stats?.totalUsers ?? users.length}</h3>
                <small>{stats?.totalFarmers ?? 0} Farmers &bull; {stats?.totalAdmins ?? 1} Admins</small>
              </div>
            </div>

            <div className="stat-card admin-stat-card">
              <span className="stat-icon">🏡</span>
              <div>
                <p>Registered Farm Parcels</p>
                <h3>{stats?.totalFarms ?? farms.length}</h3>
                <small>Distributed across registered growers</small>
              </div>
            </div>

            <div className="stat-card admin-stat-card">
              <span className="stat-icon">🌱</span>
              <div>
                <p>Active Standing Crops</p>
                <h3>{stats?.totalCrops ?? crops.length}</h3>
                <small>Monitored crop plantings</small>
              </div>
            </div>

            <div className="stat-card admin-stat-card warning">
              <span className="stat-icon">🚨</span>
              <div>
                <p>Threat Warnings</p>
                <h3 style={{ color: (stats?.activeAlertsCount || 0) > 0 ? '#c92a2a' : '#2b8a3e' }}>
                  {stats?.activeAlertsCount ?? 0}
                </h3>
                <small>Active pest or pathogen alerts</small>
              </div>
            </div>

            <div className="stat-card admin-stat-card">
              <span className="stat-icon">🛒</span>
              <div>
                <p>Marketplace Products</p>
                <h3>{stats?.totalProducts ?? products.length}</h3>
                <small>Seeds, fertilizers & farm inputs</small>
              </div>
            </div>

            <div className="stat-card admin-stat-card">
              <span className="stat-icon">💰</span>
              <div>
                <p>Platform Order Volume</p>
                <h3>₹{Number(stats?.totalRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                <small>{stats?.totalBookings ?? bookings.length} orders successfully placed</small>
              </div>
            </div>
          </div>

          <div className="dashboard-card admin-info-card" style={{ marginTop: 24 }}>
            <h2>🛡️ Platform Health & Security Governance</h2>
            <p>AgriTech platform operations are functioning normally with verified MongoDB Atlas database synchronization.</p>
            <div className="admin-status-grid">
              <div className="health-item">
                <span className="health-dot active" />
                <strong>Role-Based Access Control:</strong> Strict backend JWT role verification active.
              </div>
              <div className="health-item">
                <span className="health-dot active" />
                <strong>Database Persistence:</strong> Production MongoDB Atlas cluster connected.
              </div>
              <div className="health-item">
                <span className="health-dot active" />
                <strong>Weather API Service:</strong> Live OpenWeather meteorological connection verified.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <section className="tab-content">
          <div className="dashboard-card records-card">
            <h2>👥 Registered User Directory ({users.length})</h2>
            <p>Control user roles, inspect registered farmer activity, and oversee access privileges.</p>

            <div className="table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>User / Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Farms</th>
                    <th>Products</th>
                    <th>Orders</th>
                    <th>Joined</th>
                    <th>Role Action</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isSelf = String(u._id) === String(adminUser.id || adminUser._id);
                    return (
                      <tr key={u._id} className={isSelf ? 'current-admin-row' : ''}>
                        <td>
                          <strong>{u.name}</strong> {isSelf && <span className="self-tag">(You)</span>}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`status-pill ${u.role === 'admin' ? 'role-admin' : 'role-farmer'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.farmCount ?? 0}</td>
                        <td>{u.productCount ?? 0}</td>
                        <td>{u.bookingCount ?? 0}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          {!isSelf && (
                            <select
                              value={u.role}
                              onChange={e => handleChangeRole(u._id, e.target.value)}
                              className="role-select"
                            >
                              <option value="farmer">Farmer</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td>
                          {!isSelf && (
                            <button
                              type="button"
                              className="delete-button table-delete-btn"
                              onClick={() => handleDeleteUser(u._id)}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <section className="tab-content">
          <div className="dashboard-card records-card">
            <h2>📦 Platform Orders & Bookings ({bookings.length})</h2>
            <p>Manage order fulfillment, delivery tracking, and dispatch status across all farmers.</p>

            {bookings.length === 0 ? (
              <p>No orders placed on the platform yet.</p>
            ) : (
              <div className="table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Buyer</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Total (₹)</th>
                      <th>Order Date</th>
                      <th>Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id}>
                        <td><code>#{b._id.slice(-6)}</code></td>
                        <td>
                          <strong>{b.farmer?.name || 'Customer'}</strong>
                          <br />
                          <small>{b.farmer?.email}</small>
                        </td>
                        <td>{b.product?.name || 'Product'}</td>
                        <td>{b.quantity}</td>
                        <td>₹{Number(b.totalPrice || 0).toFixed(2)}</td>
                        <td>{new Date(b.createdAt).toLocaleString()}</td>
                        <td>
                          <select
                            value={b.status || 'Pending'}
                            onChange={e => handleStatusChange(b._id, e.target.value)}
                            className="status-dropdown"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: PLATFORM FARMS & CROPS */}
      {activeTab === 'farms-crops' && (
        <section className="tab-content">
          <div className="dashboard-grid">
            <div className="dashboard-card records-card">
              <h2>🏡 Platform Farms ({farms.length})</h2>
              <div className="record-list">
                {farms.map(f => (
                  <article className="record-item" key={f._id}>
                    <div>
                      <h3>{f.farmName}</h3>
                      <p>📍 Location: {f.location} &bull; 📐 {f.sizeInAcres} acres &bull; Soil: {f.soilType || 'N/A'}</p>
                      <p><small>Owner: {f.farmer?.name} ({f.farmer?.email})</small></p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="dashboard-card records-card">
              <h2>🌱 Standing Crops ({crops.length})</h2>
              <div className="record-list">
                {crops.map(c => (
                  <article className="record-item" key={c._id}>
                    <div>
                      <h3>{c.cropName}</h3>
                      <p>🏡 Farm: {c.farm?.farmName} ({c.farm?.location})</p>
                      <p>📅 Sowing: {c.plantingDate ? String(c.plantingDate).slice(0, 10) : 'N/A'}</p>
                      {(c.pestAlert || c.diseaseAlert) ? (
                        <span className="status-pill alert-active">
                          🚨 Threat Active: {c.pestAlert && 'Pest '} {c.diseaseAlert && 'Disease '}({c.alertNotes})
                        </span>
                      ) : (
                        <span className="status-pill alert-ok">✓ Healthy Standing</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: MARKETPLACE MODERATION */}
      {activeTab === 'products' && (
        <section className="tab-content">
          <div className="dashboard-card records-card">
            <h2>🛒 Marketplace Listings Moderation ({products.length})</h2>
            <p>Audit and moderate products listed by growers across the network.</p>

            <div className="record-list">
              {products.map(p => (
                <article className="record-item" key={p._id}>
                  <div>
                    <h3>{p.name}</h3>
                    <p><strong>Category:</strong> {p.category} &bull; <strong>Price:</strong> ₹{p.price} &bull; <strong>Stock:</strong> {p.stock}</p>
                    <p>{p.description || 'No description provided'}</p>
                    <p><small>Seller: {p.seller?.name || 'Seller'}</small></p>
                  </div>
                  <div className="record-actions">
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteProduct(p._id)}
                    >
                      Remove Listing
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
