document.getElementById('show-signup').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

// Simulate login (In real applications, verify with DB)
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = '/dashboard.html'; // Redirect to dashboard after login
});

// Simulate signup (In real applications, verify with DB)
document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = '/dashboard.html'; // Redirect to dashboard after signup
});
