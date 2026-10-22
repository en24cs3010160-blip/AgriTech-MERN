
const Booking = require("../models/Booking");
const Product = require("../models/Product");

exports.createBooking = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({
        message: "Valid product and quantity are required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const requestedQuantity = Number(quantity);

    if (Number(product.stock) < requestedQuantity) {
      return res.status(400).json({
        message: "Insufficient product stock",
      });
    }

    if (String(product.seller) === String(req.user.id)) {
      return res.status(400).json({
        message: "You cannot book your own product",
      });
    }

    const booking = await Booking.create({
      farmer: req.user.id,
      product: product._id,
      quantity: requestedQuantity,
      totalPrice: Number(product.price) * requestedQuantity,
    });

    product.stock = Number(product.stock) - requestedQuantity;
    await product.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message,
    });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      farmer: req.user.id,
    })
      .populate("product", "name price image")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};
