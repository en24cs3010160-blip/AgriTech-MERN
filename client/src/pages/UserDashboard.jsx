import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, getCurrentUser, clearAuthSession } from '../services/api';

const emptyFarm = {
  farmName: '',
  location: '',
  sizeInAcres: '',
  soilType: ''
};

const emptyCrop = {
  farm: '',
  cropName: '',
  plantingDate: '',
  expectedHarvestDate: '',
  notes: '',
  pestAlert: false,
  diseaseAlert: false,
  alertNotes: ''
};

const emptyProduct = {
  name: '',
  description: '',
  price: '',
  category: 'Seeds',
  stock: '0',
  image: ''
};

const emptySoil = {
  farm: '',
  pH: '6.5',
  nitrogen: '180',
  phosphorus: '22',
  potassium: '160',
  moisturePercentage: '45',
  organicMatter: '2.5'
};

const emptyResource = {
  name: '',
  category: 'Equipment',
  quantity: '1',
  unit: 'units',
  cost: '0',
  farm: '',
  status: 'Available',
  notes: ''
};

const emptyConsultation = {
  topic: 'Crop Health & Disease',
  subject: '',
  description: '',
  urgency: 'Routine'
};

const emptyPost = {
  title: '',
  content: '',
  category: 'General Discussion'
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Core Data States
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [soilRecords, setSoilRecords] = useState([]);
  const [resources, setResources] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [posts, setPosts] = useState([]);

  // Forms
  const [farmForm, setFarmForm] = useState(emptyFarm);
  const [cropForm, setCropForm] = useState(emptyCrop);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [soilForm, setSoilForm] = useState(emptySoil);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [consultationForm, setConsultationForm] = useState(emptyConsultation);
  const [postForm, setPostForm] = useState(emptyPost);
  const [replyText, setReplyText] = useState({});

  // Editing States
  const [editingFarm, setEditingFarm] = useState(null);
  const [editingCrop, setEditingCrop] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingResource, setEditingResource] = useState(null);

  // Booking & Weather
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingQuantity, setBookingQuantity] = useState({});
  const [weatherCity, setWeatherCity] = useState('Indore');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Initial load
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAllData();
    loadWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAllData() {
    setLoading(true);
    const results = await Promise.allSettled([
      apiRequest('/farms'),
      apiRequest('/crops'),
      apiRequest('/products'),
      apiRequest('/bookings/my'),
      apiRequest('/soil'),
      apiRequest('/resources'),
      apiRequest('/consultations'),
      apiRequest('/forum')
    ]);

    if (results[0].status === 'fulfilled') setFarms(Array.isArray(results[0].value) ? results[0].value : []);
    if (results[1].status === 'fulfilled') setCrops(Array.isArray(results[1].value) ? results[1].value : []);
    if (results[2].status === 'fulfilled') setProducts(Array.isArray(results[2].value) ? results[2].value : []);
    if (results[3].status === 'fulfilled') setBookings(Array.isArray(results[3].value) ? results[3].value : []);
    if (results[4].status === 'fulfilled') setSoilRecords(Array.isArray(results[4].value) ? results[4].value : []);
    if (results[5].status === 'fulfilled') setResources(Array.isArray(results[5].value) ? results[5].value : []);
    if (results[6].status === 'fulfilled') setConsultations(Array.isArray(results[6].value) ? results[6].value : []);
    if (results[7].status === 'fulfilled') setPosts(Array.isArray(results[7].value) ? results[7].value : []);

    setLoading(false);
  }

  function handleLogout() {
    clearAuthSession();
    navigate('/login');
  }

  // --- Weather ---
  async function loadWeather(e) {
    if (e) e.preventDefault();
    const city = weatherCity.trim();
    if (!city) return;

    setWeatherLoading(true);
    setWeatherError('');
    try {
      const data = await apiRequest(`/weather?city=${encodeURIComponent(city)}`);
      setWeather(data);
    } catch (err) {
      setWeatherError(err.message || 'Unable to fetch weather');
    } finally {
      setWeatherLoading(false);
    }
  }

  // --- Farm CRUD ---
  async function handleFarmSubmit(e) {
    e.preventDefault();
    const size = Number(farmForm.sizeInAcres);
    if (!Number.isFinite(size) || size <= 0) {
      setMessage('Farm size must be greater than zero.');
      return;
    }

    const payload = {
      farmName: farmForm.farmName.trim(),
      location: farmForm.location.trim(),
      sizeInAcres: size,
      soilType: farmForm.soilType.trim()
    };

    try {
      if (editingFarm) {
        await apiRequest(`/farms/${editingFarm}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMessage('Farm updated successfully.');
      } else {
        await apiRequest('/farms', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Farm added successfully.');
      }
      setFarmForm(emptyFarm);
      setEditingFarm(null);
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function startEditFarm(f) {
    setEditingFarm(f._id);
    setFarmForm({
      farmName: f.farmName || '',
      location: f.location || '',
      sizeInAcres: String(f.sizeInAcres ?? ''),
      soilType: f.soilType || ''
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  async function deleteFarm(id) {
    if (!window.confirm('Delete this farm? All crops associated with this farm will also be deleted.')) return;
    try {
      await apiRequest(`/farms/${id}`, { method: 'DELETE' });
      setMessage('Farm deleted successfully.');
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // --- Crop CRUD ---
  async function handleCropSubmit(e) {
    e.preventDefault();
    const payload = {
      farm: cropForm.farm,
      cropName: cropForm.cropName.trim(),
      plantingDate: cropForm.plantingDate,
      expectedHarvestDate: cropForm.expectedHarvestDate || undefined,
      notes: cropForm.notes.trim(),
      pestAlert: cropForm.pestAlert,
      diseaseAlert: cropForm.diseaseAlert,
      alertNotes: cropForm.alertNotes.trim()
    };

    try {
      if (editingCrop) {
        await apiRequest(`/crops/${editingCrop}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMessage('Crop updated successfully.');
      } else {
        await apiRequest('/crops', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Crop added successfully.');
      }
      setCropForm(emptyCrop);
      setEditingCrop(null);
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function startEditCrop(c) {
    setEditingCrop(c._id);
    setCropForm({
      farm: typeof c.farm === 'object' ? c.farm?._id || '' : c.farm || '',
      cropName: c.cropName || '',
      plantingDate: c.plantingDate ? String(c.plantingDate).slice(0, 10) : '',
      expectedHarvestDate: c.expectedHarvestDate ? String(c.expectedHarvestDate).slice(0, 10) : '',
      notes: c.notes || '',
      pestAlert: Boolean(c.pestAlert),
      diseaseAlert: Boolean(c.diseaseAlert),
      alertNotes: c.alertNotes || ''
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  async function deleteCrop(id) {
    if (!window.confirm('Delete this crop?')) return;
    try {
      await apiRequest(`/crops/${id}`, { method: 'DELETE' });
      setMessage('Crop deleted successfully.');
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // --- Product CRUD ---
  async function handleProductSubmit(e) {
    e.preventDefault();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);

    if (!productForm.name.trim() || !Number.isFinite(price) || price < 0 || stock < 0) {
      setMessage('Enter a valid product name, positive price, and stock.');
      return;
    }

    const payload = {
      ...productForm,
      name: productForm.name.trim(),
      price,
      stock
    };

    try {
      if (editingProduct) {
        await apiRequest(`/products/${editingProduct}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMessage('Product updated successfully.');
      } else {
        await apiRequest('/products', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Product added to marketplace.');
      }
      setProductForm(emptyProduct);
      setEditingProduct(null);
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function startEditProduct(p) {
    setEditingProduct(p._id);
    setProductForm({
      name: p.name || '',
      description: p.description || '',
      price: String(p.price ?? ''),
      category: p.category || 'Seeds',
      stock: String(p.stock ?? 0),
      image: p.image || ''
    });
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product listing?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      setMessage('Product removed successfully.');
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // --- Buy / Book Product ---
  async function buyProduct(product) {
    const qty = Number(bookingQuantity[product._id] || 1);
    if (!Number.isInteger(qty) || qty < 1) {
      setMessage('Enter a valid order quantity.');
      return;
    }

    if (qty > Number(product.stock)) {
      setMessage('Requested quantity exceeds available stock.');
      return;
    }

    const sellerId = product.seller?._id || product.seller;
    if (String(sellerId) === String(user.id || user._id)) {
      setMessage('You cannot purchase your own product.');
      return;
    }

    if (!window.confirm(`Place order for ${qty} × "${product.name}" for ₹${(Number(product.price) * qty).toFixed(2)}?`)) {
      return;
    }

    setBookingLoading(true);
    try {
      const res = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, quantity: qty })
      });
      setMessage(res.message || 'Order booked successfully.');
      await loadAllData();
    } catch (err) {
      setMessage(`Order booking failed: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  }

  // --- Soil Health Submission ---
  async function handleSoilSubmit(e) {
    e.preventDefault();
    if (!soilForm.farm) {
      setMessage('Select a farm for the soil health assessment.');
      return;
    }

    try {
      await apiRequest('/soil', {
        method: 'POST',
        body: JSON.stringify(soilForm)
      });
      setMessage('Soil health test recorded with agronomy recommendations!');
      setSoilForm(emptySoil);
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteSoilRecord(id) {
    if (!window.confirm('Delete this soil record?')) return;
    try {
      await apiRequest(`/soil/${id}`, { method: 'DELETE' });
      setMessage('Soil record removed.');
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // --- Resources ---
  async function handleResourceSubmit(e) {
    e.preventDefault();
    try {
      if (editingResource) {
        await apiRequest(`/resources/${editingResource}`, {
          method: 'PUT',
          body: JSON.stringify(resourceForm)
        });
        setMessage('Resource updated.');
      } else {
        await apiRequest('/resources', {
          method: 'POST',
          body: JSON.stringify(resourceForm)
        });
        setMessage('Farm resource registered.');
      }
      setResourceForm(emptyResource);
      setEditingResource(null);
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteResource(id) {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await apiRequest(`/resources/${id}`, { method: 'DELETE' });
      setMessage('Resource deleted.');
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // --- Expert Consultation ---
  async function handleConsultationSubmit(e) {
    e.preventDefault();
    try {
      await apiRequest('/consultations', {
        method: 'POST',
        body: JSON.stringify(consultationForm)
      });
      setMessage('Consultation submitted! Expert advisory response received.');
      setConsultationForm(emptyConsultation);
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // --- Forum Discussions ---
  async function handlePostSubmit(e) {
    e.preventDefault();
    try {
      await apiRequest('/forum', {
        method: 'POST',
        body: JSON.stringify(postForm)
      });
      setMessage('Discussion topic published to community.');
      setPostForm(emptyPost);
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleAddReply(postId) {
    const text = (replyText[postId] || '').trim();
    if (!text) return;

    try {
      await apiRequest(`/forum/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content: text })
      });
      setReplyText({ ...replyText, [postId]: '' });
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleLikePost(postId) {
    try {
      await apiRequest(`/forum/${postId}/like`, { method: 'POST' });
      await loadAllData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Aggregate Stats
  const totalAcres = farms.reduce((sum, f) => sum + (Number(f.sizeInAcres) || 0), 0);
  const activeAlertCrops = crops.filter(c => c.pestAlert || c.diseaseAlert);
  const optimalSoilCount = soilRecords.filter(s => s.healthStatus === 'Optimal').length;

  if (!user) return null;

  return (
    <main className="dashboard-page">
      {/* Top Header */}
      <header className="dashboard-header">
        <div>
          <div className="brand">🌱 AgriTech</div>
          <p>Farmer Management & Digital Agro Services</p>
        </div>
        <div className="header-user-controls">
          <span className="user-role-pill">
            🌾 {user.name} ({user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Farmer'})
          </span>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      {/* Welcome Banner */}
      <section className="welcome-panel">
        <h1>Welcome back, {user.name}!</h1>
        <p>Comprehensive digital agro-hub for farms, crops, weather, soil health, market & expert advisory.</p>
        <p>
          <strong>Account:</strong> {user.email} &bull; <strong>Role:</strong>{' '}
          <span className="status-pill role-farmer">{user.role || 'farmer'}</span>
        </p>
      </section>

      {/* Global Status Message */}
      {message && (
        <div className="dashboard-message alert-banner">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} className="close-msg-btn">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button
          type="button"
          className={activeTab === 'overview' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          type="button"
          className={activeTab === 'farms-crops' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('farms-crops')}
        >
          🌾 Farms & Crops ({farms.length}/{crops.length})
        </button>
        <button
          type="button"
          className={activeTab === 'weather' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('weather')}
        >
          🌤️ Weather
        </button>
        <button
          type="button"
          className={activeTab === 'soil' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('soil')}
        >
          🧪 Soil Health ({soilRecords.length})
        </button>
        <button
          type="button"
          className={activeTab === 'alerts' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('alerts')}
        >
          ⚠️ Pest Alerts {activeAlertCrops.length > 0 && `(${activeAlertCrops.length})`}
        </button>
        <button
          type="button"
          className={activeTab === 'resources' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('resources')}
        >
          🚜 Resources ({resources.length})
        </button>
        <button
          type="button"
          className={activeTab === 'marketplace' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('marketplace')}
        >
          🛒 Marketplace & Orders ({products.length})
        </button>
        <button
          type="button"
          className={activeTab === 'expert' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('expert')}
        >
          👨‍🌾 Expert Help ({consultations.length})
        </button>
        <button
          type="button"
          className={activeTab === 'forum' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('forum')}
        >
          💬 Forum ({posts.length})
        </button>
      </nav>

      {loading && <p className="loading-indicator">Updating real-time farm data...</p>}

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <section className="tab-content">
          <div className="analytics-grid">
            <div className="stat-card">
              <span className="stat-icon">🏡</span>
              <div>
                <p>Total Farms</p>
                <h3>{farms.length}</h3>
                <small>{totalAcres.toFixed(1)} acres cultivated</small>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">🌱</span>
              <div>
                <p>Active Crops</p>
                <h3>{crops.length}</h3>
                <small>{crops.length - activeAlertCrops.length} healthy standing</small>
              </div>
            </div>

            <div className="stat-card warning">
              <span className="stat-icon">⚠️</span>
              <div>
                <p>Threat Alerts</p>
                <h3 style={{ color: activeAlertCrops.length > 0 ? '#c92a2a' : '#2b8a3e' }}>
                  {activeAlertCrops.length}
                </h3>
                <small>{activeAlertCrops.length > 0 ? 'Urgent attention required' : 'No active crop threats'}</small>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">🧪</span>
              <div>
                <p>Soil Health Tests</p>
                <h3>{soilRecords.length}</h3>
                <small>{optimalSoilCount} optimal parcels</small>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">🚜</span>
              <div>
                <p>Farm Resources</p>
                <h3>{resources.length}</h3>
                <small>Allocated inputs & gear</small>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">📦</span>
              <div>
                <p>My Orders Placed</p>
                <h3>{bookings.length}</h3>
                <small>Agri inputs & seeds</small>
              </div>
            </div>
          </div>

          {/* Quick Threat Warning if any */}
          {activeAlertCrops.length > 0 && (
            <div className="urgent-alert-box">
              <h3>🚨 Active Pest/Disease Alerts Detected ({activeAlertCrops.length})</h3>
              <p>Immediate action recommended for the following crops:</p>
              <ul>
                {activeAlertCrops.map(c => (
                  <li key={c._id}>
                    <strong>{c.cropName}</strong> {c.pestAlert && '• Pest Infestation'} {c.diseaseAlert && '• Crop Disease'}: {c.alertNotes || 'Inspect foliage immediately.'}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setActiveTab('alerts')} className="small-action-btn">
                Open Threat Center →
              </button>
            </div>
          )}

          {/* Quick Weather Strip */}
          {weather && (
            <div className="weather-overview-strip">
              <span>🌤️ Current Weather in <strong>{weather.city}</strong>:</span>
              <span><strong>{weather.temperature}°C</strong> ({weather.description})</span>
              <span>💧 Humidity: {weather.humidity}%</span>
              <span>💨 Wind: {weather.windSpeed} m/s</span>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: FARMS & CROPS */}
      {activeTab === 'farms-crops' && (
        <section className="tab-content">
          <div className="dashboard-grid">
            {/* Add / Edit Farm */}
            <div className="dashboard-card">
              <h2>{editingFarm ? 'Edit Farm' : 'Add New Farm'}</h2>
              <form onSubmit={handleFarmSubmit}>
                <label>
                  Farm Name
                  <input
                    value={farmForm.farmName}
                    onChange={e => setFarmForm({ ...farmForm, farmName: e.target.value })}
                    placeholder="e.g. Green Valley East"
                    required
                  />
                </label>

                <label>
                  Location / Village
                  <input
                    value={farmForm.location}
                    onChange={e => setFarmForm({ ...farmForm, location: e.target.value })}
                    placeholder="e.g. Indore, MP"
                    required
                  />
                </label>

                <label>
                  Size (Acres)
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={farmForm.sizeInAcres}
                    onChange={e => setFarmForm({ ...farmForm, sizeInAcres: e.target.value })}
                    placeholder="e.g. 5.5"
                    required
                  />
                </label>

                <label>
                  Soil Classification
                  <input
                    value={farmForm.soilType}
                    onChange={e => setFarmForm({ ...farmForm, soilType: e.target.value })}
                    placeholder="e.g. Black Cotton Soil / Alluvial"
                  />
                </label>

                <button type="submit">
                  {editingFarm ? 'Save Farm Changes' : 'Register Farm'}
                </button>

                {editingFarm && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => { setEditingFarm(null); setFarmForm(emptyFarm); }}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>

            {/* Add / Edit Crop */}
            <div className="dashboard-card">
              <h2>{editingCrop ? 'Edit Crop' : 'Plant New Crop'}</h2>
              {farms.length === 0 ? (
                <p>Register a farm first before recording crop planting.</p>
              ) : (
                <form onSubmit={handleCropSubmit}>
                  <label>
                    Select Farm
                    <select
                      value={cropForm.farm}
                      onChange={e => setCropForm({ ...cropForm, farm: e.target.value })}
                      required
                    >
                      <option value="">Choose registered farm</option>
                      {farms.map(f => (
                        <option key={f._id} value={f._id}>
                          {f.farmName} ({f.location})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Crop Variety / Name
                    <input
                      value={cropForm.cropName}
                      onChange={e => setCropForm({ ...cropForm, cropName: e.target.value })}
                      placeholder="e.g. Sharbati Wheat, Soybean JS-335"
                      required
                    />
                  </label>

                  <label>
                    Planting Date
                    <input
                      type="date"
                      value={cropForm.plantingDate}
                      onChange={e => setCropForm({ ...cropForm, plantingDate: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    Expected Harvest Date
                    <input
                      type="date"
                      value={cropForm.expectedHarvestDate}
                      onChange={e => setCropForm({ ...cropForm, expectedHarvestDate: e.target.value })}
                    />
                  </label>

                  <label>
                    Field Notes & Observations
                    <textarea
                      rows="2"
                      value={cropForm.notes}
                      onChange={e => setCropForm({ ...cropForm, notes: e.target.value })}
                      placeholder="Observations on germination, fertilizer dosage, etc."
                    />
                  </label>

                  <fieldset className="alert-fields">
                    <legend>Pest & Disease Status</legend>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={cropForm.pestAlert}
                        onChange={e => setCropForm({ ...cropForm, pestAlert: e.target.checked })}
                      />
                      Active Pest Threat Detected
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={cropForm.diseaseAlert}
                        onChange={e => setCropForm({ ...cropForm, diseaseAlert: e.target.checked })}
                      />
                      Active Crop Disease Detected
                    </label>

                    <label>
                      Threat Symptoms / Details
                      <textarea
                        rows="2"
                        value={cropForm.alertNotes}
                        onChange={e => setCropForm({ ...cropForm, alertNotes: e.target.value })}
                        placeholder="Detail symptoms (e.g. yellow leaves, stem borer, aphid clusters)"
                      />
                    </label>
                  </fieldset>

                  <button type="submit">
                    {editingCrop ? 'Save Crop Changes' : 'Record Crop'}
                  </button>

                  {editingCrop && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => { setEditingCrop(null); setCropForm(emptyCrop); }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Farms List */}
          <section className="dashboard-card records-card">
            <h2>Your Registered Farms ({farms.length})</h2>
            {farms.length === 0 ? (
              <p>No farms registered yet. Add your first parcel above.</p>
            ) : (
              <div className="record-list">
                {farms.map(f => (
                  <article className="record-item" key={f._id}>
                    <div>
                      <h3>{f.farmName}</h3>
                      <p>📍 Location: {f.location}</p>
                      <p>📐 Size: {f.sizeInAcres} acres</p>
                      <p>🌱 Soil Type: {f.soilType || 'Not specified'}</p>
                    </div>
                    <div className="record-actions">
                      <button type="button" onClick={() => startEditFarm(f)}>Edit</button>
                      <button type="button" className="delete-button" onClick={() => deleteFarm(f._id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Crops List */}
          <section className="dashboard-card records-card">
            <h2>Standing Crops ({crops.length})</h2>
            {crops.length === 0 ? (
              <p>No crops planted yet.</p>
            ) : (
              <div className="record-list">
                {crops.map(c => (
                  <article className="record-item" key={c._id}>
                    <div>
                      <h3>{c.cropName}</h3>
                      <p>🏡 Farm: {typeof c.farm === 'object' ? c.farm?.farmName || 'Farm' : farms.find(f => f._id === c.farm)?.farmName || 'Farm'}</p>
                      <p>📅 Planted: {c.plantingDate ? String(c.plantingDate).slice(0, 10) : 'N/A'}</p>
                      <p>🌾 Harvest Target: {c.expectedHarvestDate ? String(c.expectedHarvestDate).slice(0, 10) : 'Not scheduled'}</p>
                      {c.notes && <p>📝 Notes: {c.notes}</p>}

                      <div className="crop-alert-status">
                        <span className={`status-pill ${c.pestAlert ? 'alert-active' : 'alert-ok'}`}>
                          {c.pestAlert ? '⚠️ Pest Alert' : '✓ No Pests'}
                        </span>
                        <span className={`status-pill ${c.diseaseAlert ? 'alert-active' : 'alert-ok'}`}>
                          {c.diseaseAlert ? '⚠️ Disease Alert' : '✓ No Disease'}
                        </span>
                        {c.alertNotes && <p className="alert-note-text">Threat notes: {c.alertNotes}</p>}
                      </div>
                    </div>
                    <div className="record-actions">
                      <button type="button" onClick={() => startEditCrop(c)}>Edit</button>
                      <button type="button" className="delete-button" onClick={() => deleteCrop(c._id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {/* TAB 3: WEATHER FORECAST */}
      {activeTab === 'weather' && (
        <section className="tab-content">
          <div className="dashboard-card weather-card">
            <div className="weather-heading">
              <h2>🌤️ Real-Time Agricultural Weather Forecast</h2>
              <p>Check localized atmospheric humidity, wind speed, pressure, and temperature for farming operations.</p>
            </div>

            <form onSubmit={loadWeather} className="weather-form">
              <input
                value={weatherCity}
                onChange={e => setWeatherCity(e.target.value)}
                placeholder="Enter city or district, e.g. Indore, Bhopal, Pune"
                required
              />
              <button type="submit" disabled={weatherLoading}>
                {weatherLoading ? 'Fetching Live Conditions...' : 'Check Weather'}
              </button>
            </form>

            {weatherError && <p className="weather-error" role="alert">{weatherError}</p>}

            {weather && (
              <div className="weather-details">
                <div className="weather-main">
                  <div>
                    <h3>{weather.city}{weather.country ? `, ${weather.country}` : ''}</h3>
                    <p className="weather-description">{weather.description}</p>
                    <p className="weather-temperature">{weather.temperature}°C</p>
                    <p>Thermal feel: {weather.feelsLike}°C</p>
                  </div>
                  {weather.icon && (
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                      alt={weather.description}
                    />
                  )}
                </div>

                <div className="weather-stats">
                  <div className="weather-stat">
                    <span>💧</span>
                    <div>
                      <p>Relative Humidity</p>
                      <strong>{weather.humidity}%</strong>
                    </div>
                  </div>
                  <div className="weather-stat">
                    <span>🌡️</span>
                    <div>
                      <p>Atmospheric Pressure</p>
                      <strong>{weather.pressure} hPa</strong>
                    </div>
                  </div>
                  <div className="weather-stat">
                    <span>💨</span>
                    <div>
                      <p>Wind Velocity</p>
                      <strong>{weather.windSpeed} m/s</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 4: SOIL HEALTH MONITORING */}
      {activeTab === 'soil' && (
        <section className="tab-content">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>🧪 Record Soil Test Assessment</h2>
              <p>Log chemical soil test values to generate tailored agronomy soil health recommendations.</p>

              {farms.length === 0 ? (
                <p>Register a farm parcel before recording soil metrics.</p>
              ) : (
                <form onSubmit={handleSoilSubmit}>
                  <label>
                    Select Farm Parcel
                    <select
                      value={soilForm.farm}
                      onChange={e => setSoilForm({ ...soilForm, farm: e.target.value })}
                      required
                    >
                      <option value="">Choose farm parcel</option>
                      {farms.map(f => (
                        <option key={f._id} value={f._id}>{f.farmName} ({f.location})</option>
                      ))}
                    </select>
                  </label>

                  <div className="form-row-2">
                    <label>
                      Soil pH (0 - 14)
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        value={soilForm.pH}
                        onChange={e => setSoilForm({ ...soilForm, pH: e.target.value })}
                        required
                      />
                    </label>

                    <label>
                      Moisture Content (%)
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={soilForm.moisturePercentage}
                        onChange={e => setSoilForm({ ...soilForm, moisturePercentage: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  <div className="form-row-3">
                    <label>
                      Nitrogen (kg/ha)
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={soilForm.nitrogen}
                        onChange={e => setSoilForm({ ...soilForm, nitrogen: e.target.value })}
                        required
                      />
                    </label>

                    <label>
                      Phosphorus (kg/ha)
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={soilForm.phosphorus}
                        onChange={e => setSoilForm({ ...soilForm, phosphorus: e.target.value })}
                        required
                      />
                    </label>

                    <label>
                      Potassium (kg/ha)
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={soilForm.potassium}
                        onChange={e => setSoilForm({ ...soilForm, potassium: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  <label>
                    Organic Matter (%)
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={soilForm.organicMatter}
                      onChange={e => setSoilForm({ ...soilForm, organicMatter: e.target.value })}
                    />
                  </label>

                  <button type="submit">Analyze & Save Soil Record</button>
                </form>
              )}
            </div>

            <div className="dashboard-card">
              <h2>📋 Soil Quality Index Guide</h2>
              <ul className="info-list">
                <li><strong>Ideal Soil pH:</strong> 6.0 – 7.5 for optimal macro/micro-nutrient uptake.</li>
                <li><strong>Nitrogen (N):</strong> Target &gt; 180 kg/ha for leafy vegetative vigor.</li>
                <li><strong>Phosphorus (P):</strong> Target &gt; 20 kg/ha for healthy root elongation and seed development.</li>
                <li><strong>Potassium (K):</strong> Target &gt; 150 kg/ha for water retention and disease tolerance.</li>
                <li><strong>Moisture:</strong> 40% – 60% field capacity ideal for non-submerged crops.</li>
              </ul>
            </div>
          </div>

          <section className="dashboard-card records-card">
            <h2>Saved Soil Health Records ({soilRecords.length})</h2>
            {soilRecords.length === 0 ? (
              <p>No soil test evaluations logged yet.</p>
            ) : (
              <div className="record-list">
                {soilRecords.map(s => (
                  <article className="record-item" key={s._id}>
                    <div>
                      <h3>{s.farm?.farmName || 'Farm'} — Status: <span className={`status-pill ${s.healthStatus === 'Optimal' ? 'alert-ok' : 'alert-active'}`}>{s.healthStatus}</span></h3>
                      <p><strong>Parameters:</strong> pH: {s.pH} | N: {s.nitrogen} kg/ha | P: {s.phosphorus} kg/ha | K: {s.potassium} kg/ha | Moisture: {s.moisturePercentage}%</p>
                      <p><strong>Agronomy Advisory:</strong> {s.recommendations}</p>
                      <p><small>Test Logged: {new Date(s.createdAt).toLocaleDateString()}</small></p>
                    </div>
                    <div className="record-actions">
                      <button type="button" className="delete-button" onClick={() => deleteSoilRecord(s._id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {/* TAB 5: PEST & DISEASE ALERTS */}
      {activeTab === 'alerts' && (
        <section className="tab-content">
          <div className="dashboard-card">
            <h2>⚠️ Pest & Disease Threat Monitoring Center</h2>
            <p>Immediate action dashboard highlighting standing crops flagged for insect pests or infectious pathogen risks.</p>

            {activeAlertCrops.length === 0 ? (
              <div className="all-clear-banner">
                <h3>✓ All Crops Healthy!</h3>
                <p>No active pest outbreaks or disease threats reported across your farms. Keep monitoring foliage regularly.</p>
              </div>
            ) : (
              <div className="record-list">
                {activeAlertCrops.map(c => (
                  <article className="record-item alert-highlighted" key={c._id}>
                    <div>
                      <h3>🚨 {c.cropName} under Active Threat</h3>
                      <p>🏡 <strong>Farm:</strong> {typeof c.farm === 'object' ? c.farm?.farmName : 'Farm'}</p>
                      <p><strong>Threat Classification:</strong> {c.pestAlert && '🐛 Pest Infestation'} {c.diseaseAlert && '🦠 Crop Disease'}</p>
                      <p><strong>Symptoms / Observation:</strong> {c.alertNotes || 'No notes specified.'}</p>
                      <div className="remedy-box">
                        <strong>Recommended Protocol:</strong>
                        <p>1. Quarantine infected patch to prevent spore/insect drift.</p>
                        <p>2. Spray appropriate biological deterrent (Neem extract) or targeted fungicide.</p>
                        <p>3. Submit a ticket in Expert Consultation for diagnosis.</p>
                      </div>
                    </div>
                    <div className="record-actions">
                      <button type="button" onClick={() => startEditCrop(c)}>Update Symptoms</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 6: RESOURCE MANAGEMENT */}
      {activeTab === 'resources' && (
        <section className="tab-content">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>{editingResource ? 'Edit Farm Resource' : 'Register Farm Resource'}</h2>
              <form onSubmit={handleResourceSubmit}>
                <label>
                  Resource Name
                  <input
                    value={resourceForm.name}
                    onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })}
                    placeholder="e.g. Drip Irrigation Kit, Urea Bags, Tractor"
                    required
                  />
                </label>

                <div className="form-row-2">
                  <label>
                    Category
                    <select
                      value={resourceForm.category}
                      onChange={e => setResourceForm({ ...resourceForm, category: e.target.value })}
                    >
                      <option value="Equipment">Equipment / Machinery</option>
                      <option value="Fertilizer">Fertilizers & Nutrients</option>
                      <option value="Water">Water & Irrigation</option>
                      <option value="Seeds">Seeds & Saplings</option>
                      <option value="Fuel">Fuel & Energy</option>
                      <option value="Labor">Labor</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Status
                    <select
                      value={resourceForm.status}
                      onChange={e => setResourceForm({ ...resourceForm, status: e.target.value })}
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Depleted">Depleted</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </label>
                </div>

                <div className="form-row-2">
                  <label>
                    Quantity
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={resourceForm.quantity}
                      onChange={e => setResourceForm({ ...resourceForm, quantity: e.target.value })}
                      required
                    />
                  </label>

                  <label>
                    Measurement Unit
                    <input
                      value={resourceForm.unit}
                      onChange={e => setResourceForm({ ...resourceForm, unit: e.target.value })}
                      placeholder="e.g. units, kg, litres, hours"
                      required
                    />
                  </label>
                </div>

                <label>
                  Associated Farm (Optional)
                  <select
                    value={resourceForm.farm}
                    onChange={e => setResourceForm({ ...resourceForm, farm: e.target.value })}
                  >
                    <option value="">General farm inventory</option>
                    {farms.map(f => (
                      <option key={f._id} value={f._id}>{f.farmName}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Notes & Details
                  <textarea
                    rows="2"
                    value={resourceForm.notes}
                    onChange={e => setResourceForm({ ...resourceForm, notes: e.target.value })}
                    placeholder="Storage location, maintenance date, etc."
                  />
                </label>

                <button type="submit">
                  {editingResource ? 'Update Resource' : 'Add to Inventory'}
                </button>

                {editingResource && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => { setEditingResource(null); setResourceForm(emptyResource); }}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>

            <div className="dashboard-card records-card">
              <h2>Inventory & Resource Assets ({resources.length})</h2>
              {resources.length === 0 ? (
                <p>No agricultural inputs or machinery recorded yet.</p>
              ) : (
                <div className="record-list">
                  {resources.map(r => (
                    <article className="record-item" key={r._id}>
                      <div>
                        <h3>{r.name} ({r.category})</h3>
                        <p><strong>Stock / Quantity:</strong> {r.quantity} {r.unit}</p>
                        <p><strong>Status:</strong> <span className="status-pill alert-ok">{r.status}</span></p>
                        {r.farm && <p><strong>Allocated Farm:</strong> {r.farm?.farmName || 'Farm'}</p>}
                        {r.notes && <p>Notes: {r.notes}</p>}
                      </div>
                      <div className="record-actions">
                        <button type="button" onClick={() => {
                          setEditingResource(r._id);
                          setResourceForm({
                            name: r.name,
                            category: r.category,
                            quantity: String(r.quantity),
                            unit: r.unit,
                            cost: String(r.cost || 0),
                            farm: r.farm?._id || '',
                            status: r.status,
                            notes: r.notes || ''
                          });
                        }}>Edit</button>
                        <button type="button" className="delete-button" onClick={() => deleteResource(r._id)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB 7: MARKETPLACE & BOOKINGS */}
      {activeTab === 'marketplace' && (
        <section className="tab-content">
          <div className="dashboard-card records-card">
            <h2>🛒 Agricultural Products Marketplace ({products.length})</h2>
            <p>Publish inputs, seeds, or produce for sale, or purchase supplies from other growers.</p>

            <form onSubmit={handleProductSubmit}>
              <label>
                Product Title
                <input
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Certified Organic Wheat Seeds"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Specifications, germination percentage, certification"
                />
              </label>

              <div className="form-row-3">
                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Pesticides">Pesticides</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Available Stock
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                    required
                  />
                </label>
              </div>

              <label>
                Image URL (optional)
                <input
                  type="url"
                  value={productForm.image}
                  onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </label>

              <button type="submit">
                {editingProduct ? 'Save Product Changes' : 'List Product on Marketplace'}
              </button>

              {editingProduct && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => { setEditingProduct(null); setProductForm(emptyProduct); }}
                >
                  Cancel
                </button>
              )}
            </form>

            <div className="record-list" style={{ marginTop: 24 }}>
              {products.length === 0 ? (
                <p>No marketplace listings available.</p>
              ) : (
                products.map(p => {
                  const sellerId = p.seller?._id || p.seller;
                  const isMine = String(sellerId) === String(user.id || user._id);

                  return (
                    <article className="record-item" key={p._id}>
                      <div>
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                          />
                        )}
                        <h3>{p.name}</h3>
                        <p>{p.description || 'No description provided.'}</p>
                        <p><strong>Category:</strong> {p.category} &bull; <strong>Price:</strong> ₹{p.price} &bull; <strong>Stock:</strong> {p.stock}</p>
                        <p><small>Listed by: {p.seller?.name || 'Seller'}</small></p>

                        {!isMine && (
                          <div className="record-actions" style={{ marginTop: 10 }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                              Qty:
                              <input
                                type="number"
                                min="1"
                                max={p.stock}
                                style={{ width: 80, padding: 6 }}
                                value={bookingQuantity[p._id] || '1'}
                                onChange={e => setBookingQuantity({ ...bookingQuantity, [p._id]: e.target.value })}
                                disabled={Number(p.stock) < 1}
                              />
                            </label>
                            <button
                              type="button"
                              disabled={bookingLoading || Number(p.stock) < 1}
                              onClick={() => buyProduct(p)}
                            >
                              {Number(p.stock) < 1 ? 'Out of Stock' : 'Buy Now'}
                            </button>
                          </div>
                        )}
                      </div>

                      {isMine && (
                        <div className="record-actions">
                          <button type="button" onClick={() => startEditProduct(p)}>Edit</button>
                          <button type="button" className="delete-button" onClick={() => deleteProduct(p._id)}>Delete</button>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* My Bookings / Orders */}
          <section className="dashboard-card records-card">
            <h2>📦 My Bookings & Orders ({bookings.length})</h2>
            {bookings.length === 0 ? (
              <p>You haven't placed any marketplace orders yet.</p>
            ) : (
              <div className="record-list">
                {bookings.map(b => (
                  <article className="record-item" key={b._id}>
                    <div>
                      <h3>{b.product?.name || 'Product'}</h3>
                      <p><strong>Quantity:</strong> {b.quantity} &bull; <strong>Total Amount:</strong> ₹{Number(b.totalPrice || 0).toFixed(2)}</p>
                      <p><strong>Order Status:</strong> <span className="status-pill alert-ok">{b.status || 'Pending'}</span></p>
                      <p><small>Ordered on: {new Date(b.createdAt).toLocaleString()}</small></p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {/* TAB 8: EXPERT CONSULTATION */}
      {activeTab === 'expert' && (
        <section className="tab-content">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>👨‍🌾 Request Agricultural Expert Consultation</h2>
              <p>Submit questions regarding pest outbreaks, soil degradation, fertilization schedules, or water conservation to qualified agronomists.</p>

              <form onSubmit={handleConsultationSubmit}>
                <label>
                  Consultation Subject
                  <input
                    value={consultationForm.subject}
                    onChange={e => setConsultationForm({ ...consultationForm, subject: e.target.value })}
                    placeholder="e.g. Yellow leaf curl disease in tomato plants"
                    required
                  />
                </label>

                <div className="form-row-2">
                  <label>
                    Agronomy Domain / Topic
                    <select
                      value={consultationForm.topic}
                      onChange={e => setConsultationForm({ ...consultationForm, topic: e.target.value })}
                    >
                      <option value="Crop Health & Disease">Crop Health & Disease</option>
                      <option value="Soil Fertility & Nutrients">Soil Fertility & Nutrients</option>
                      <option value="Pest & Weed Control">Pest & Weed Control</option>
                      <option value="Irrigation & Water Mgmt">Irrigation & Water Mgmt</option>
                      <option value="Harvesting & Post-Harvest">Harvesting & Post-Harvest</option>
                      <option value="Organic Farming Practices">Organic Farming Practices</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Urgency
                    <select
                      value={consultationForm.urgency}
                      onChange={e => setConsultationForm({ ...consultationForm, urgency: e.target.value })}
                    >
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>
                </div>

                <label>
                  Detailed Description of Issue
                  <textarea
                    rows="4"
                    value={consultationForm.description}
                    onChange={e => setConsultationForm({ ...consultationForm, description: e.target.value })}
                    placeholder="Describe crop variety, days after sowing, symptoms, and previous chemical sprays"
                    required
                  />
                </label>

                <button type="submit">Submit to Agro-Expert Panel</button>
              </form>
            </div>

            <div className="dashboard-card records-card">
              <h2>Advisory History ({consultations.length})</h2>
              {consultations.length === 0 ? (
                <p>No expert consultations logged yet.</p>
              ) : (
                <div className="record-list">
                  {consultations.map(c => (
                    <article className="record-item" key={c._id}>
                      <div>
                        <h3>{c.subject} <small>({c.topic})</small></h3>
                        <p><strong>Query:</strong> {c.description}</p>
                        <p><strong>Urgency:</strong> {c.urgency} &bull; <strong>Status:</strong> <span className="status-pill alert-ok">{c.status}</span></p>
                        {c.expertResponse && (
                          <div className="expert-reply-card">
                            <strong>💬 Advisory from {c.expertName}:</strong>
                            <p>{c.expertResponse}</p>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB 9: COMMUNITY FORUM */}
      {activeTab === 'forum' && (
        <section className="tab-content">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>💬 Farmer Community Exchange</h2>
              <p>Share localized farming wisdom, crop price updates, and tips with peer growers.</p>

              <form onSubmit={handlePostSubmit}>
                <label>
                  Discussion Title
                  <input
                    value={postForm.title}
                    onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="e.g. Best organic spray for leaf miner control"
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={postForm.category}
                    onChange={e => setPostForm({ ...postForm, category: e.target.value })}
                  >
                    <option value="Crop Advice">Crop Advice</option>
                    <option value="Pest Management">Pest Management</option>
                    <option value="Market Rates">Market Rates</option>
                    <option value="Farming Equipment">Farming Equipment</option>
                    <option value="Organic Techniques">Organic Techniques</option>
                    <option value="General Discussion">General Discussion</option>
                  </select>
                </label>

                <label>
                  Message
                  <textarea
                    rows="3"
                    value={postForm.content}
                    onChange={e => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="Describe your question or share your experience"
                    required
                  />
                </label>

                <button type="submit">Post to Forum</button>
              </form>
            </div>

            <div className="dashboard-card records-card">
              <h2>Community Posts ({posts.length})</h2>
              {posts.length === 0 ? (
                <p>No community posts yet. Start the conversation!</p>
              ) : (
                <div className="record-list">
                  {posts.map(p => (
                    <article className="record-item forum-item" key={p._id}>
                      <div>
                        <h3>{p.title}</h3>
                        <p className="forum-meta">
                          🏷️ {p.category} &bull; 👤 By {p.authorName} &bull; 🕒 {new Date(p.createdAt).toLocaleDateString()}
                        </p>
                        <p>{p.content}</p>

                        <div className="forum-actions">
                          <button type="button" onClick={() => handleLikePost(p._id)} className="like-btn">
                            👍 {p.likes || 0} Helpful
                          </button>
                        </div>

                        {/* Replies */}
                        {p.replies && p.replies.length > 0 && (
                          <div className="replies-list">
                            <strong>Replies ({p.replies.length}):</strong>
                            {p.replies.map((r, idx) => (
                              <div key={idx} className="reply-bubble">
                                <span className="reply-author">{r.authorName}:</span> {r.content}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="reply-input-row">
                          <input
                            type="text"
                            placeholder="Write a peer response..."
                            value={replyText[p._id] || ''}
                            onChange={e => setReplyText({ ...replyText, [p._id]: e.target.value })}
                          />
                          <button type="button" onClick={() => handleAddReply(p._id)}>Reply</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
