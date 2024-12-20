require("dotenv").config(); // Load environment variables from .env
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load environment variables
const { MONGO_URI, API_KEY } = process.env;
const path = require("path");


// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));


// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// Schema & Model
const stockSchema = new mongoose.Schema({
    name: String,
    ticker: String,
    quantity: Number,
    buyPrice: Number,
});
const Stock = mongoose.model("Stock", stockSchema);

// Fetch Stock Price from Alpha Vantage
async function fetchStockPrice(ticker) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`;
    try {
        const response = await axios.get(url);
        const price = response.data["Global Quote"]["05. price"];
        return parseFloat(price); // Convert to a number
    } catch (error) {
        console.error("Error fetching stock price:", error.message);
        return null;
    }
}

// API Routes

// Serve index.html on the root (/) route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Get all stocks
app.get("/stocks", async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stocks" });
    }
});

// Add a new stock
app.post("/stocks", async (req, res) => {
    try {
        const stock = new Stock(req.body);
        await stock.save();
        res.status(201).json(stock);
    } catch (err) {
        res.status(500).json({ error: "Failed to add stock" });
    }
});

// Delete a stock
app.delete("/stocks/:id", async (req, res) => {
    try {
        await Stock.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: "Failed to delete stock" });
    }
});

// Fetch real-time stock price
app.get("/stocks/price/:ticker", async (req, res) => {
    const ticker = req.params.ticker;
    const price = await fetchStockPrice(ticker);

    if (price) {
        res.json({ ticker, price });
    } else {
        res.status(500).json({ error: "Failed to fetch stock price" });
    }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
