let token = null;
let isGuest = true; // Start as guest by default

// Auth Functions
function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
}

function showSignupForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

async function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            loginSuccess(username);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Signup failed');
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            loginSuccess(username);
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Login failed');
    }
}

function loginSuccess(username) {
    isGuest = false;
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('auth-forms').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('username-display').textContent = username;
    document.getElementById('portfolio-section').style.display = 'block';
    loadPortfolio();
}

function logout() {
    token = null;
    isGuest = true;
    document.getElementById('auth-buttons').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('portfolio-section').style.display = 'none';
    document.getElementById('portfolio-summary').style.display = 'none';
}

// Stock Functions
async function searchStock() {
    const symbol = document.getElementById('stock-search').value.toUpperCase();
    
    try {
        const response = await fetch(`/api/stocks/search/${symbol}`);
        const data = await response.json();
        
        if (data['Global Quote']) {
            const quote = data['Global Quote'];
            const price = quote['05. price'];
            
            const resultHtml = `
                <div class="search-result">
                    <h3>${symbol}</h3>
                    <p>Price: $${parseFloat(price).toFixed(2)}</p>
                    ${!isGuest ? `
                        <input type="number" id="shares-input" placeholder="Number of shares">
                        <button onclick="addToPortfolio('${symbol}', ${price})">Add to Portfolio</button>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('search-result').innerHTML = resultHtml;
        } else {
            document.getElementById('search-result').innerHTML = '<p>Stock not found</p>';
        }
    } catch (error) {
        document.getElementById('search-result').innerHTML = '<p>Error searching for stock</p>';
    }
}

async function addToPortfolio(symbol, price) {
    const shares = document.getElementById('shares-input').value;
    
    try {
        const response = await fetch('/api/stocks/portfolio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                symbol,
                shares: Number(shares),
                purchasePrice: Number(price)
            })
        });

        if (response.ok) {
            loadPortfolio();
            document.getElementById('search-result').innerHTML = '';
            document.getElementById('stock-search').value = '';
        } else {
            alert('Failed to add stock to portfolio');
        }
    } catch (error) {
        alert('Error adding stock to portfolio');
    }
}

async function loadPortfolio() {
    if (isGuest) return;

    try {
        const response = await fetch('/api/stocks/portfolio', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const portfolio = await response.json();
        const tbody = document.getElementById('portfolio-body');
        tbody.innerHTML = '';

        let totalPortfolioValue = 0;
        let totalInitialValue = 0;

        portfolio.forEach(stock => {
            const totalValue = stock.totalValue;
            const initialValue = stock.shares * stock.purchasePrice;
            totalPortfolioValue += totalValue;
            totalInitialValue += initialValue;

            const row = `
                <tr>
                    <td>${stock.symbol}</td>
                    <td>${stock.shares}</td>
                    <td>$${stock.purchasePrice.toFixed(2)}</td>
                    <td>$${stock.currentPrice.toFixed(2)}</td>
                    <td>$${totalValue.toFixed(2)}</td>
                    <td>${stock.performance.toFixed(2)}%</td>
                    <td>
                        <button onclick="removeFromPortfolio('${stock.symbol}')">Remove</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

        // Update portfolio summary
        const totalPerformance = ((totalPortfolioValue - totalInitialValue) / totalInitialValue) * 100;
        document.getElementById('portfolio-summary').innerHTML = `
            <h3>Portfolio Summary</h3>
            <p>Total Value: $${totalPortfolioValue.toFixed(2)}</p>
            <p>Total Performance: ${totalPerformance.toFixed(2)}%</p>
        `;
        document.getElementById('portfolio-summary').style.display = 'block';
    } catch (error) {
        console.error('Error loading portfolio:', error);
    }
}

async function removeFromPortfolio(symbol) {
    try {
        const response = await fetch(`/api/stocks/portfolio/${symbol}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadPortfolio();
        } else {
            alert('Failed to remove stock from portfolio');
        }
    } catch (error) {
        alert('Error removing stock from portfolio');
    }
}