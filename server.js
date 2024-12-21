require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  portfolio: [{
    symbol: String,
    shares: Number,
    purchasePrice: Number,
    purchaseDate: { type: Date, default: Date.now }
  }]
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Auth Middleware
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stock Routes
app.get('/api/stocks/search/:symbol', async (req, res) => {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${req.params.symbol}&apikey=${process.env.STOCK_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/stocks/portfolio', auth, async (req, res) => {
  try {
    const { symbol, shares, purchasePrice } = req.body;
    const user = await User.findById(req.user.userId);
    
    user.portfolio.push({ 
      symbol, 
      shares, 
      purchasePrice,
      purchaseDate: new Date()
    });
    await user.save();
    
    res.json(user.portfolio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/stocks/portfolio', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const portfolio = user.portfolio;
    
    // Get current prices for all stocks
    const currentPrices = await Promise.all(
      portfolio.map(async (stock) => {
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock.symbol}&apikey=${process.env.STOCK_API_KEY}`
        );
        return {
          symbol: stock.symbol,
          currentPrice: parseFloat(response.data['Global Quote']?.['05. price'] || 0)
        };
      })
    );

    // Calculate portfolio value and performance
    const enrichedPortfolio = portfolio.map(stock => {
      const currentPriceData = currentPrices.find(p => p.symbol === stock.symbol);
      const currentPrice = currentPriceData?.currentPrice || 0;
      const totalValue = currentPrice * stock.shares;
      const initialValue = stock.purchasePrice * stock.shares;
      const performance = ((totalValue - initialValue) / initialValue) * 100;

      return {
        ...stock.toObject(),
        currentPrice,
        totalValue,
        performance
      };
    });

    res.json(enrichedPortfolio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/stocks/portfolio/:symbol', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.portfolio = user.portfolio.filter(stock => stock.symbol !== req.params.symbol);
    await user.save();
    res.json(user.portfolio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});