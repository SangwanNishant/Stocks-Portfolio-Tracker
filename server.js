const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Initialize the Express app
const app = express();

// Middleware setup
app.use(express.json()); // Parse incoming JSON requests
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log(err));

// Models
const User = mongoose.model("User", new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    portfolio: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stock" }],
}));

const Stock = mongoose.model("Stock", new mongoose.Schema({
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}));

// Serve frontend (static HTML, CSS, JS) at the root URL
app.use(express.static(path.join(__dirname, "public")));

// Landing route for the root ("/") endpoint to serve the frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Guest stock price lookup (No authentication required)
app.get("/api/stock/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
        const response = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.STOCK_API_KEY}`);
        const data = response.data;
        if (data["Time Series (Daily)"]) {
            const latestDate = Object.keys(data["Time Series (Daily)"])[0];
            const stockInfo = data["Time Series (Daily)"][latestDate];
            res.json({
                symbol,
                currentPrice: stockInfo["4. close"],
                change: ((parseFloat(stockInfo["4. close"]) - parseFloat(stockInfo["1. open"])) / parseFloat(stockInfo["1. open"])) * 100,
            });
        } else {
            res.status(404).json({ message: "Stock not found" });
        }
    } catch (error) {
        res.status(400).json({ message: "Error fetching stock data" });
    }
});

// Sign up route
app.post("/api/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: "Error signing up" });
    }
});

// Login route
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: "Error logging in" });
    }
});

// Add stock to portfolio (User must be logged in)
app.post("/api/portfolio", async (req, res) => {
    const { token, symbol, name, currentPrice, amount } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const newStock = new Stock({ symbol, name, currentPrice, amount, user: user._id });
        await newStock.save();
        user.portfolio.push(newStock);
        await user.save();
        res.json({ message: "Stock added to portfolio" });
    } catch (error) {
        res.status(400).json({ message: "Error adding stock to portfolio" });
    }
});

// Remove stock from portfolio (User must be logged in)
app.delete("/api/portfolio/:stockId", async (req, res) => {
    const { stockId } = req.params;
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const stockToDelete = await Stock.findById(stockId);
        if (!stockToDelete || stockToDelete.user.toString() !== user._id.toString()) {
            return res.status(404).json({ message: "Stock not found in portfolio" });
        }

        await stockToDelete.remove();
        user.portfolio = user.portfolio.filter(stock => stock.toString() !== stockId);
        await user.save();

        res.json({ message: "Stock removed from portfolio" });
    } catch (error) {
        res.status(400).json({ message: "Error removing stock from portfolio" });
    }
});

// Portfolio route (Get user's portfolio)
app.get("/api/portfolio", async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate("portfolio");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user.portfolio);
    } catch (error) {
        res.status(400).json({ message: "Error fetching portfolio" });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
