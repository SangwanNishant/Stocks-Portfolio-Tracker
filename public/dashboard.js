let portfolio = [];

document.getElementById('add-stock-btn').addEventListener('click', () => {
    const stockSymbol = document.getElementById('add-stock-symbol').value.trim();
    if (stockSymbol) {
        addStockToPortfolio(stockSymbol);
    } else {
        alert("Please enter a stock symbol.");
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    // Log the user out by redirecting to the landing page
    window.location.href = '/index.html';
});

function addStockToPortfolio(symbol) {
    portfolio.push({ symbol, price: Math.random() * 100, shares: 1 }); // Simulated stock data
    loadPortfolio();
}

function loadPortfolio() {
    const portfolioTable = document.getElementById('portfolio-body');
    portfolioTable.innerHTML = '';
    portfolio.forEach((stock, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.symbol}</td>
            <td>${stock.shares}</td>
            <td>${stock.price.toFixed(2)}</td>
            <td><button onclick="removeStock(${index})">Remove</button></td>
        `;
        portfolioTable.appendChild(row);
    });

    updatePortfolioSummary();
}

function removeStock(index) {
    portfolio.splice(index, 1);
    loadPortfolio();
}

function updatePortfolioSummary() {
    const totalValue = portfolio.reduce((acc, stock) => acc + (stock.shares * stock.price), 0);
    document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
}
