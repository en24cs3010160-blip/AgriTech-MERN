const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

// Import Routes
const authRoutes = require("./routes/auth");
const farmRoutes = require("./routes/farms");
const cropRoutes = require("./routes/crops");
const weatherRoutes = require("./routes/weather");
const productRoutes = require("./routes/products");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const soilRoutes = require("./routes/soilRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const forumRoutes = require("./routes/forumRoutes");

const app = express();

// Configurable CORS for local dev and cloud deployment
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or allowed origins
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS access denied for origin'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health & Root Status
app.get("/", (req, res) => {
  res.json({
    message: "AgriTech API is running successfully",
    status: "Healthy",
    timestamp: new Date().toISOString()
  });
});

// Register Core & Extended Feature Routes
app.use("/api/auth", authRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/soil", soilRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/forum", forumRoutes);

// 404 Handler for undefined API routes
app.use((req, res, next) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`AgriTech server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

// Only auto-start when run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
