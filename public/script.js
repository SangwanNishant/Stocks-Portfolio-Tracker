const apiUrl = "http://localhost:3000/stocks"; // Backend API endpoint

document.getElementById("stock-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const stock = {
        name: document.getElementById("stock-name").value,
        ticker: document.getElementById("stock-ticker").value,
        quantity: parseInt(document.getElementById("stock-quantity").value),
        buyPrice: parseFloat(document.getElementById("stock-price").value),
    };

    await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stock),
    });

    fetchStocks();
});

async function fetchStocks() {
    const response = await fetch(apiUrl);
    const stocks = await response.json();

    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = "";

    let portfolioValue = 0;

    stocks.forEach((stock) => {
        portfolioValue += stock.quantity * stock.buyPrice;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${stock.name}</td>
            <td>${stock.ticker}</td>
            <td>${stock.quantity}</td>
            <td>${stock.buyPrice}</td>
            <td>
                <button onclick="deleteStock('${stock._id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById("portfolio-value").textContent = portfolioValue.toFixed(2);
}

async function deleteStock(id) {
    await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
    fetchStocks();
}

fetchStocks();
