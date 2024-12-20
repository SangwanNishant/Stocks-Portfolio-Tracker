document.getElementById('search-btn').addEventListener('click', () => {
    const stockSymbol = document.getElementById('stock-symbol').value.trim();
    if (stockSymbol) {
        // For simplicity, you can redirect to a stock search page (or handle stock search here)
        window.location.href = `/search?symbol=${stockSymbol}`;
    } else {
        alert("Please enter a stock symbol.");
    }
});

document.getElementById('login-btn').addEventListener('click', () => {
    window.location.href = '/auth.html'; // Redirect to login/signup page
});

document.getElementById('signup-btn').addEventListener('click', () => {
    window.location.href = '/auth.html'; // Redirect to login/signup page
});
