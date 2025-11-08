// Admin dashboard functionality
class AdminDashboard {
    constructor() {
        this.alerts = [];
        this.filters = {
            status: '',
            emergencyType: '',
            dateFrom: '',
            dateTo: ''
        };
        this.currentPage = 1;
        this.totalPages = 1;
        
        this.init();
    }

    async init() {
        await this.checkAdminAuth();
        this.initEventListeners();
        this.loadDashboard();
        this.setupRealTimeUpdates();
    }

    async checkAdminAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Not authenticated');
            }

            const user = await response.json();
            if (user.role !== 'admin') {
                alert('Admin access required');
                window.location.href = '/';
                return;
            }

            this.user = user;
            this.updateUIForAdmin();
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
        }
    }

    updateUIForAdmin() {
        document.getElementById('adminWelcome').textContent = `Welcome, ${this.user.name}`;
    }

    initEventListeners() {
        // Filter events
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.loadAlerts();
        });
        
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.filters.emergencyType = e.target.value;
            this.loadAlerts();
        });
        
        document.getElementById('dateFrom').addEventListener('change', (e) => {
            this.filters.dateFrom = e.target.value;
            this.loadAlerts();
        });
        
        document.getElementById('dateTo').addEventListener('change', (e) => {
            this.filters.dateTo = e.target.value;
            this.loadAlerts();
        });
        
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.debounce(() => this.loadAlerts(), 300);
        });
        
        // Logout
        document.getElementById('adminLogout').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
        
        // Refresh data
        document.getElementById('refreshData').addEventListener('click', () => this.loadDashboard());
    }

    async loadDashboard() {
        await Promise.all([
            this.loadStats(),
            this.loadAlerts()
        ]);
    }

    async loadStats() {
        try {
            // In a real app, you'd have a dedicated stats endpoint
            // For now, we'll calculate from alerts
            const alerts = this.alerts.length ? this.alerts : await this.fetchAlerts();
            
            const stats = {
                total: alerts.length,
                active: alerts.filter(a => a.status === 'active').length,
                responded: alerts.filter(a => a.status === 'responded').length,
                resolved: alerts.filter(a => a.status === 'resolved').length
            };
            
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalAlerts').textContent = stats.total;
        document.getElementById('activeAlerts').textContent = stats.active;
        document.getElementById('respondedAlerts').textContent = stats.responded;
        document.getElementById('resolvedAlerts').textContent = stats.resolved;
        
        // Update critical alerts badge
        const criticalBadge = document.querySelector('.stat-card.critical .stat-number');
        if (criticalBadge) {
            criticalBadge.textContent = stats.active;
        }
    }

    async loadAlerts(page = 1) {
        try {
            this.showLoading(true);
            
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                page: page,
                limit: 10,
                ...this.filters
            });

            const response = await fetch(`/api/alerts?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch alerts');
            }

            const data = await response.json();
            this.alerts = data.alerts;
            this.currentPage = data.currentPage;
            this.totalPages = data.totalPages;
            
            this.renderAlertsTable();
            this.renderPagination();
        } catch (error) {
            console.error('Error loading alerts:', error);
            this.showError('Failed to load alerts');
        } finally {
            this.showLoading(false);
        }
    }

    renderAlertsTable() {
        const tbody = document.getElementById('alertsTableBody');
        
        if (this.alerts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div>No alerts found</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.alerts.map(alert => `
            <tr data-alert-id="${alert._id}">
                <td>
                    <div class="user-info">
                        <strong>${alert.userName}</strong>
                        <div class="user-phone">${alert.userPhone}</div>
                    </div>
                </td>
                <td>
                    <span class="emergency-${alert.emergencyType}">
                        ${this.formatEmergencyType(alert.emergencyType)}
                    </span>
                </td>
                <td>${this.formatDate(alert.createdAt)}</td>
                <td>
                    <span class="status-badge status-${alert.status}">
                        ${this.formatStatus(alert.status)}
                    </span>
                </td>
                <td>
                    <div class="location-info">
                        ${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        ${alert.status === 'active' ? `
                            <button class="btn-sm btn-success" onclick="adminDashboard.updateAlertStatus('${alert._id}', 'responded')">
                                Respond
                            </button>
                        ` : ''}
                        
                        ${alert.status === 'responded' ? `
                            <button class="btn-sm btn-warning" onclick="adminDashboard.updateAlertStatus('${alert._id}', 'resolved')">
                                Resolve
                            </button>
                        ` : ''}
                        
                        <button class="btn-sm btn-info" onclick="adminDashboard.showAlertDetails('${alert._id}')">
                            Details
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="btn-secondary" onclick="adminDashboard.loadAlerts(${this.currentPage - 1})">Previous</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="btn-primary" disabled>${i}</button>`;
            } else {
                paginationHTML += `<button class="btn-secondary" onclick="adminDashboard.loadAlerts(${i})">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="btn-secondary" onclick="adminDashboard.loadAlerts(${this.currentPage + 1})">Next</button>`;
        }
        
        pagination.innerHTML = paginationHTML;
    }

    async updateAlertStatus(alertId, status) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/alerts/${alertId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Failed to update alert');
            }

            this.showSuccess(`Alert ${status} successfully`);
            this.loadDashboard(); // Reload both stats and alerts
        } catch (error) {
            console.error('Error updating alert:', error);
            this.showError('Failed to update alert');
        }
    }

    async showAlertDetails(alertId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/alerts?limit=1000`, { // Get all to find specific alert
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch alert details');
            }

            const data = await response.json();
            const alert = data.alerts.find(a => a._id === alertId);
            
            if (!alert) {
                throw new Error('Alert not found');
            }

            this.renderAlertDetailsModal(alert);
        } catch (error) {
            console.error('Error fetching alert details:', error);
            this.showError('Failed to load alert details');
        }
    }

    renderAlertDetailsModal(alert) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Alert Details</h3>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="alert-details">
                    <div class="alert-detail">
                        <span class="detail-label">User Information</span>
                        <div class="detail-value">
                            <strong>Name:</strong> ${alert.userName}<br>
                            <strong>Phone:</strong> ${alert.userPhone}
                        </div>
                    </div>
                    
                    <div class="alert-detail">
                        <span class="detail-label">Emergency Type</span>
                        <div class="detail-value emergency-${alert.emergencyType}">
                            ${this.formatEmergencyType(alert.emergencyType)}
                        </div>
                    </div>
                    
                    <div class="alert-detail">
                        <span class="detail-label">Description</span>
                        <div class="detail-value">${alert.description}</div>
                    </div>
                    
                    <div class="alert-detail">
                        <span class="detail-label">Location</span>
                        <div class="detail-value">
                            Latitude: ${alert.location.latitude}<br>
                            Longitude: ${alert.location.longitude}
                        </div>
                    </div>
                    
                    <div class="alert-detail">
                        <span class="detail-label">Status</span>
                        <div class="detail-value">
                            <span class="status-badge status-${alert.status}">
                                ${this.formatStatus(alert.status)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="alert-detail">
                        <span class="detail-label">Timeline</span>
                        <div class="detail-value">
                            <strong>Created:</strong> ${this.formatDate(alert.createdAt)}<br>
                            ${alert.responseTime ? `<strong>Responded:</strong> ${this.formatDate(alert.responseTime)}<br>` : ''}
                            ${alert.resolutionTime ? `<strong>Resolved:</strong> ${this.formatDate(alert.resolutionTime)}` : ''}
                        </div>
                    </div>
                    
                    ${alert.chatbotLogs && alert.chatbotLogs.length > 0 ? `
                        <div class="alert-detail">
                            <span class="detail-label">Chatbot Conversation</span>
                            <div class="chatbot-logs">
                                ${alert.chatbotLogs.map(log => `
                                    <div class="log-entry ${log.isUser ? 'log-user' : 'log-ai'}">
                                        <span class="log-time">${this.formatTime(log.timestamp)}</span>
                                        <strong>${log.isUser ? 'User' : 'AI'}:</strong> ${log.message}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-actions">
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    formatEmergencyType(type) {
        const types = {
            medical: '🏥 Medical',
            fire: '🔥 Fire',
            police: '🚓 Police',
            accident: '🚗 Accident',
            other: '⚠️ Other'
        };
        return types[type] || type;
    }

    formatStatus(status) {
        return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString();
    }

    showLoading(show) {
        // Implement loading indicator
        const table = document.querySelector('.alerts-table');
        if (table) {
            table.classList.toggle('loading', show);
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
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    setupRealTimeUpdates() {
        // In a real application, you would set up WebSocket connections
        // for real-time alert updates. For now, we'll use polling.
        setInterval(() => {
            this.loadDashboard();
        }, 30000); // Refresh every 30 seconds
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});