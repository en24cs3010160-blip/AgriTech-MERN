
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (!name?.trim() || price === undefined || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        message: 'Valid product name and price are required'
      });
    }

    if (stock !== undefined && (!Number.isFinite(Number(stock)) || Number(stock) < 0)) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    const product = await Product.create({
      name: name.trim(),
      description,
      price: Number(price),
      category,
      image,
      stock: stock === undefined ? 0 : Number(stock),
      seller: req.user.id
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your products' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const allowedFields = [
      'name', 'description', 'price', 'category', 'image', 'stock'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }

    if (typeof product.name !== 'string' || !product.name.trim()) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    if (!Number.isFinite(product.price) || product.price < 0) {
      return res.status(400).json({ message: 'Price must be zero or greater' });
    }

    if (!Number.isFinite(product.stock) || product.stock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    product.name = product.name.trim();
    await product.save();

    res.json(product);
  } catch (error) {
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid product details or ID' });
    }
    res.status(500).json({ message: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    res.status(500).json({ message: 'Failed to delete product' });
  }
};
