// Main application logic
class EmergencyApp {
    constructor() {
        this.currentLocation = null;
        this.map = null;
        this.userMarker = null;
        this.emergencyMarker = null;
        this.currentAlertId = null;
        this.selectedEmergencyType = null;
        this.isLoggedIn = false;
        this.user = null;
        
        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.checkAuthStatus();
        this.getCurrentLocation();
    }

    initEventListeners() {
        // SOS Button
        document.getElementById('sosButton').addEventListener('click', () => this.handleSOS());
        
        // Emergency type buttons
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectEmergencyType(e.target));
        });
        
        // Confirm emergency
        document.getElementById('confirmEmergency').addEventListener('click', () => this.sendEmergencyAlert());
        
        // Location refresh
        document.getElementById('refreshLocation').addEventListener('click', () => this.getCurrentLocation());
        
        // Map click for precise location
        if (this.map) {
            this.map.addListener('click', (e) => this.placeEmergencyMarker(e.latLng));
        }
    }

    initMap() {
        const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York default
        
        this.map = new google.maps.Map(document.getElementById('map'), {
            zoom: 15,
            center: defaultLocation,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                }
            ]
        });

        this.updateLocationStatus('Map initialized. Getting your location...');
    }

    getCurrentLocation() {
        this.updateLocationStatus('Getting your location...');
        
        if (!navigator.geolocation) {
            this.updateLocationStatus('Geolocation is not supported by this browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                this.updateMapLocation(this.currentLocation);
                this.updateLocationStatus('Location acquired successfully');
            },
            (error) => {
                console.error('Error getting location:', error);
                let errorMessage = 'Unable to get your location. ';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                        break;
                }
                
                this.updateLocationStatus(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    updateMapLocation(location) {
        if (!this.map) return;

        this.map.setCenter(location);
        
        // Update or create user marker
        if (this.userMarker) {
            this.userMarker.setPosition(location);
        } else {
            this.userMarker = new google.maps.Marker({
                position: location,
                map: this.map,
                title: 'Your Current Location',
                icon: {
                    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODYgMiA0IDUuNTg2IDQgMTBDNCAxNC40MTQgNy41ODYgMTggMTIgMThDMTYuNDE0IDE4IDIwIDE0LjQxNCAyMCAxMEMyMCA1LjU4NiAxNi40MTQgMiAxMiAyWk0xMiAxMkMxMC44OTcgMTIgMTAgMTEuMTAzIDEwIDEwQzEwIDguODk3IDEwLjg5NyA4IDEyIDhDMTMuMTAzIDggMTQgOC44OTcgMTQgMTBDMTQgMTEuMTAzIDEzLjEwMyAxMiAxMiAxMloiIGZpbGw9IiMzNTg0RjYiLz4KPC9zdmc+',
                    scaledSize: new google.maps.Size(30, 30),
                    anchor: new google.maps.Point(15, 15)
                }
            });
        }
    }

    placeEmergencyMarker(latLng) {
        if (!this.map) return;

        // Remove existing emergency marker
        if (this.emergencyMarker) {
            this.emergencyMarker.setMap(null);
        }

        // Create new emergency marker
        this.emergencyMarker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            title: 'Emergency Location',
            icon: {
                url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDc3IDIgMTJDMiAxNy41MjMgNi40NzcgMjIgMTIgMjJDMTcuNTIzIDIyIDIyIDE3LjUyMyAyMiAxMkMyMiA2LjQ3NyAxNy41MjMgMiAxMiAyWk0xMyAxN1Y3SDExVjE3SDEzWiIgZmlsbD0iI0RDMjYyNiIvPgo8L3N2Zz4=',
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20)
            },
            animation: google.maps.Animation.BOUNCE
        });

        // Update current location to the marked location
        this.currentLocation = {
            lat: latLng.lat(),
            lng: latLng.lng()
        };

        this.updateLocationStatus('Emergency location marked on map');
    }

    updateLocationStatus(message) {
        const statusElement = document.getElementById('locationStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    handleSOS() {
        if (!this.isLoggedIn) {
            alert('Please login to send emergency alerts');
            document.getElementById('loginBtn').click();
            return;
        }

        const emergencyTypes = document.getElementById('emergencyTypes');
        emergencyTypes.classList.remove('hidden');
        
        // Scroll to emergency types
        emergencyTypes.scrollIntoView({ behavior: 'smooth' });
    }

    selectEmergencyType(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        this.selectedEmergencyType = button.dataset.type;
        
        // Show description input
        document.getElementById('emergencyDescription').classList.remove('hidden');
    }

    async sendEmergencyAlert() {
        if (!this.selectedEmergencyType) {
            alert('Please select an emergency type');
            return;
        }

        const description = document.getElementById('descriptionInput').value.trim();
        if (!description) {
            alert('Please describe the emergency situation');
            return;
        }

        if (!this.currentLocation) {
            alert('Please allow location access or click on the map to mark your location');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Not authenticated');
            }

            const alertData = {
                emergencyType: this.selectedEmergencyType,
                description: description,
                location: {
                    latitude: this.currentLocation.lat,
                    longitude: this.currentLocation.lng,
                    address: 'Location acquired from device' // Could be reverse geocoded
                },
                severity: 'high' // Default to high for emergency alerts
            };

            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(alertData)
            });

            const result = await response.json();

            if (response.ok) {
                this.currentAlertId = result.alert._id;
                this.showAlertSuccess();
                this.resetEmergencyUI();
                
                // Start chatbot session for this alert
                if (window.chatbot) {
                    window.chatbot.setCurrentAlert(this.currentAlertId);
                }
            } else {
                throw new Error(result.message || 'Failed to send alert');
            }
        } catch (error) {
            console.error('Error sending alert:', error);
            alert(`Error: ${error.message}`);
        }
    }

    showAlertSuccess() {
        // Create success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert-success';
        successMessage.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000;">
                <strong>✓ Emergency Alert Sent!</strong><br>
                Help is on the way. Use the AI guide for immediate assistance.
            </div>
        `;
        
        document.body.appendChild(successMessage);
        
        // Remove after 5 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 5000);
    }

    resetEmergencyUI() {
        // Reset emergency UI
        document.getElementById('emergencyTypes').classList.add('hidden');
        document.getElementById('emergencyDescription').classList.add('hidden');
        document.getElementById('descriptionInput').value = '';
        this.selectedEmergencyType = null;
        
        // Remove active classes
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            this.validateToken(token);
        }
    }

    async validateToken(token) {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.user = await response.json();
                this.isLoggedIn = true;
                this.updateUIForAuth(true);
            } else {
                localStorage.removeItem('token');
                this.updateUIForAuth(false);
            }
        } catch (error) {
            console.error('Token validation error:', error);
            localStorage.removeItem('token');
            this.updateUIForAuth(false);
        }
    }

    updateUIForAuth(authenticated) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userWelcome = document.getElementById('userWelcome');

        if (authenticated) {
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            userWelcome.textContent = `Welcome, ${this.user.name}`;
        } else {
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            userWelcome.textContent = 'Welcome!';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyApp = new EmergencyApp();
});

// Google Maps callback
function initMap() {
    if (window.emergencyApp) {
        window.emergencyApp.initMap();
    }
}