let currentUser = null; // This tracks the logged-in user
let portfolio = []; // This holds the user's portfolio

// Show login form when Login button is clicked
document.getElementById('login-btn').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
});

// Show signup form when Sign Up button is clicked
document.getElementById('signup-btn').addEventListener('click', () => {
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
});

// Close login form
document.getElementById('close-login').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
});

// Close signup form
document.getElementById('close-signup').addEventListener('click', () => {
    document.getElementById('signup-form').style.display = 'none';
});

// Simulate login with hardcoded credentials
document.getElementById('submit-login').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simulating a successful login (In real app, use DB verification)
    currentUser = email;
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('auth-buttons').style.display = 'none'; // Hide login/signup buttons
    document.getElementById('portfolio-section').style.display = 'block'; // Show portfolio section
    loadPortfolio();
});

// Simulate signup and login
document.getElementById('submit-signup').addEventListener('click', () => {
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    // Simulating successful signup and login
    currentUser = email;
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('auth-buttons').style.display = 'none'; // Hide login/signup buttons
    document.getElementById('portfolio-section').style.display = 'block'; // Show portfolio section
    loadPortfolio();
});

// Search functionality (accessible for everyone)
document.getElementById('search-btn').addEventListener('click', () => {
    const stockSymbol = document.getElementById('stock-symbol').value.trim();
    if (!stockSymbol) return alert("Please enter a stock symbol.");
    
    fetchStockData(stockSymbol);
});

// Fetch stock data from Alpha Vantage API
async function fetchStockData(symbol) {
    const apiKey = 'YOUR_API_KEY'; // Use your API key here
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data["Time Series (Daily)"]) {
            displayStockData(symbol, data);
        } else {
            alert("Stock not found.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Display stock data and "Add to Portfolio" button if logged in
function displayStockData(symbol, data) {
    const stockList = document.getElementById("stock-list");
    const latestDate = Object.keys(data["Time Series (Daily)"])[0];
    const stockInfo = data["Time Series (Daily)"][latestDate];
    const stockCard = document.createElement("div");
    stockCard.classList.add("stock-card");

    const price = stockInfo["4. close"];
    const change = ((parseFloat(price) - parseFloat(stockInfo["1. open"])) / parseFloat(stockInfo["1. open"])) * 100;
    const changeClass = change >= 0 ? "positive" : "negative";

    stockCard.innerHTML = `
        <h3>${symbol.toUpperCase()}</h3>
        <p>Price: <span class="price">$${parseFloat(price).toFixed(2)}</span></p>
        <p class="change ${changeClass}">${change.toFixed(2)}%</p>
        <p>Last Updated: ${latestDate}</p>
    `;

    // Show the 'Add to Portfolio' button only if the user is logged in
    if (currentUser) {
        const addButton = document.createElement('button');
        addButton.textContent = 'Add to Portfolio';
        addButton.addEventListener('click', () => addStockToPortfolio(symbol, parseFloat(price).toFixed(2)));
        stockCard.appendChild(addButton);
    }

    stockList.appendChild(stockCard);
}

// Add stock to portfolio
function addStockToPortfolio(symbol, price) {
    portfolio.push({ symbol, price, shares: 1 });
    loadPortfolio();
}

// Load portfolio (show added stocks)
function loadPortfolio() {
    const portfolioTable = document.getElementById('portfolio-body');
    portfolioTable.innerHTML = '';
    portfolio.forEach((stock, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>${stock.shares}</td>
            <td>${stock.price}</td>
            <td><button onclick="removeStock(${index})">Remove</button></td>
        `;
        portfolioTable.appendChild(row);
    });

    // Update total value and profit/loss
    updatePortfolioSummary();
}

// Remove stock from portfolio
function removeStock(index) {
    portfolio.splice(index, 1);
    loadPortfolio();
}

// Update total portfolio value and profit/loss
function updatePortfolioSummary() {
    const totalValue = portfolio.reduce((acc, stock) => acc + (stock.shares * stock.price), 0);
    const totalProfitLoss = portfolio.reduce((acc, stock) => acc + (stock.shares * (stock.price - stock.price)), 0); // Assuming no previous prices for simplicity

    document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('total-profit-loss').textContent = `$${totalProfitLoss.toFixed(2)}`;
}
