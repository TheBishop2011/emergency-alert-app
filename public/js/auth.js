// Authentication management
class AuthManager {
    constructor() {
        this.initEventListeners();
    }

    initEventListeners() {
        // Login modal
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideLoginModal());
        
        // Register modal
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterModal();
        });
        
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });
        
        document.getElementById('closeRegisterModal').addEventListener('click', () => this.hideRegisterModal());
        
        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
    }

    showLoginModal() {
        this.hideAllModals();
        document.getElementById('loginModal').classList.remove('hidden');
    }

    showRegisterModal() {
        this.hideAllModals();
        document.getElementById('registerModal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('loginForm').reset();
    }

    hideRegisterModal() {
        document.getElementById('registerModal').classList.add('hidden');
        document.getElementById('registerForm').reset();
    }

    hideAllModals() {
        this.hideLoginModal();
        this.hideRegisterModal();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('token', result.token);
                this.hideLoginModal();
                this.showSuccess('Login successful!');
                
                // Refresh the app state
                if (window.emergencyApp) {
                    window.emergencyApp.checkAuthStatus();
                }
                
                // Reload admin page if on admin section
                if (window.location.pathname.includes('admin') && window.adminApp) {
                    window.location.reload();
                }
            } else {
                throw new Error(result.message || 'Login failed');
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            password: document.getElementById('regPassword').value
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('token', result.token);
                this.hideRegisterModal();
                this.showSuccess('Registration successful!');
                
                // Refresh the app state
                if (window.emergencyApp) {
                    window.emergencyApp.checkAuthStatus();
                }
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        this.showSuccess('Logged out successfully');
        
        // Refresh the app state
        if (window.emergencyApp) {
            window.emergencyApp.checkAuthStatus();
        }
        
        // Redirect to main page if on admin section
        if (window.location.pathname.includes('admin')) {
            window.location.href = '/';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const backgroundColor = type === 'success' ? '#10b981' : type === 'error' ? '#dc2626' : '#3b82f6';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});