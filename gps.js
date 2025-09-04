// gps.js - Manejo de geolocalización
class GPSManager {
    constructor() {
        this.watchId = null;
        this.isTracking = false;
        this.lastPosition = null;
        this.options = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000
        };
    }

    async getLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no soportada'));
                return;
            }

            this.updateGPSStatus('Obteniendo ubicación...', 'loading');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.handleLocationSuccess(position);
                    resolve(position);
                },
                (error) => {
                    this.handleLocationError(error);
                    reject(error);
                },
                this.options
            );
        });
    }

    handleLocationSuccess(position) {
        const { latitude, longitude, accuracy, altitude } = position.coords;
        
        // Actualizar campos del formulario
        document.getElementById('latitud').value = latitude.toFixed(6);
        document.getElementById('longitud').value = longitude.toFixed(6);
        document.getElementById('precision').value = `±${Math.round(accuracy)}m`;
        
        if (altitude !== null) {
            const altitudElement = document.getElementById('altitud');
            if (altitudElement) {
                altitudElement.value = Math.round(altitude);
            }
        }

        // Actualizar estado visual
        this.updateGPSStatus(`GPS Activo (±${Math.round(accuracy)}m)`, 'active');
        this.lastPosition = position;

        // Mostrar notificación de éxito
        if (app) {
            app.showToast(`Ubicación obtenida con precisión de ±${Math.round(accuracy)}m`, 'success');
        }

        console.log('GPS obtenido:', { latitude, longitude, accuracy });
    }

    handleLocationError(error) {
        let message = '';
        let statusText = 'GPS Error';

        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Permiso de ubicación denegado. Active los permisos de ubicación.';
                statusText = 'GPS Denegado';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Información de ubicación no disponible. Verifique su conexión GPS.';
                statusText = 'GPS No disponible';
                break;
            case error.TIMEOUT:
                message = 'Tiempo de espera agotado. Intente nuevamente.';
                statusText = 'GPS Timeout';
                break;
            default:
                message = 'Error desconocido al obtener la ubicación.';
                break;
        }

        this.updateGPSStatus(statusText, 'error');
        
        if (app) {
            app.showToast(message, 'error');
        }

        console.error('Error GPS:', error);
    }

    updateGPSStatus(text, status) {
        const gpsStatus = document.getElementById('gpsStatus');
        const gpsBtn = document.getElementById('gpsBtn');
        
        if (gpsStatus) {
            gpsStatus.textContent = `🌐 ${text}`;
            gpsStatus.className = `status-${status}`;
        }

        if (gpsBtn) {
            gpsBtn.classList.remove('loading');
            if (status === 'loading') {
                gpsBtn.classList.add('loading');
                gpsBtn.textContent = '📍 Obteniendo...';
                gpsBtn.disabled = true;
            } else {
                gpsBtn.textContent = '📍 Obtener GPS';
                gpsBtn.disabled = false;
            }
        }
    }

    startTracking() {
        if (this.isTracking) {
            return;
        }

        if (!navigator.geolocation) {
            if (app) {
                app.showToast('Geolocalización no soportada', 'error');
            }
            return;
        }

        this.isTracking = true;
        this.updateGPSStatus('Rastreando...', 'loading');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handleLocationSuccess(position);
            },
            (error) => {
                this.handleLocationError(error);
                this.stopTracking();
            },
            {
                ...this.options,
                timeout: 10000 // Timeout más corto para tracking
            }
        );
    }

    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
        this.updateGPSStatus('GPS Inactivo', 'inactive');
    }

    clearGPS() {
        this.stopTracking();
        document.getElementById('latitud').value = '';
        document.getElementById('longitud').value = '';
        document.getElementById('precision').value = '';
        
        const altitudElement = document.getElementById('altitud');
        if (altitudElement) {
            altitudElement.value = '';
        }

        this.updateGPSStatus('GPS Inactivo', 'inactive');
        this.lastPosition = null;
    }

    // Validar coordenadas manualmente ingresadas
    validateCoordinates(lat, lon) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return false;
        }

        // Validar rangos válidos
        if (latitude < -90 || latitude > 90) {
            return false;
        }

        if (longitude < -180 || longitude > 180) {
            return false;
        }

        // Validar que no esté en coordenadas 0,0 (Golfo de Guinea)
        if (latitude === 0 && longitude === 0) {
            return false;
        }

        return true;
    }

    // Calcular distancia entre dos puntos GPS
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distancia en metros
    }

    // Formatear coordenadas para mostrar
    formatCoordinate(coord, type) {
        if (!coord) return '';
        
        const degrees = Math.abs(coord);
        const direction = type === 'lat' ? 
            (coord >= 0 ? 'N' : 'S') : 
            (coord >= 0 ? 'E' : 'W');
        
        return `${degrees.toFixed(6)}° ${direction}`;
    }

    // Obtener información de precisión
    getAccuracyInfo(accuracy) {
        if (accuracy <= 5) {
            return { level: 'excellent', color: '#4caf50', text: 'Excelente' };
        } else if (accuracy <= 10) {
            return { level: 'good', color: '#8bc34a', text: 'Buena' };
        } else if (accuracy <= 20) {
            return { level: 'fair', color: '#ff9800', text: 'Regular' };
        } else {
            return { level: 'poor', color: '#f44336', text: 'Baja' };
        }
    }

    // Verificar si está dentro de República Dominicana (aproximado)
    isWithinDominicanRepublic(lat, lon) {
        // Coordenadas aproximadas de República Dominicana
        const bounds = {
            north: 19.9,
            south: 17.5,
            east: -68.3,
            west: -72.0
        };

        return lat >= bounds.south && lat <= bounds.north &&
               lon >= bounds.west && lon <= bounds.east;
    }
}

// Funciones globales para el HTML
function getLocation() {
    if (!window.gpsManager) {
        window.gpsManager = new GPSManager();
    }
    
    window.gpsManager.getLocation()
        .then(position => {
            console.log('Ubicación obtenida exitosamente');
        })
        .catch(error => {
            console.error('Error obteniendo ubicación:', error);
        });
}

function clearGPS() {
    if (window.gpsManager) {
        window.gpsManager.clearGPS();
    }
}

function startGPSTracking() {
    if (!window.gpsManager) {
        window.gpsManager = new GPSManager();
    }
    window.gpsManager.startTracking();
}

function stopGPSTracking() {
    if (window.gpsManager) {
        window.gpsManager.stopTracking();
    }
}

// Inicializar GPS Manager cuando se carga el documento
document.addEventListener('DOMContentLoaded', () => {
    window.gpsManager = new GPSManager();
    
    // Agregar validación en tiempo real para coordenadas manuales
    const latInput = document.getElementById('latitud');
    const lonInput = document.getElementById('longitud');
    
    if (latInput && lonInput) {
        [latInput, lonInput].forEach(input => {
            input.addEventListener('blur', () => {
                const lat = parseFloat(latInput.value);
                const lon = parseFloat(lonInput.value);
                
                if (latInput.value && lonInput.value) {
                    if (!window.gpsManager.validateCoordinates(lat, lon)) {
                        if (app) {
                            app.showToast('Coordenadas inválidas', 'warning');
                        }
                    } else if (!window.gpsManager.isWithinDominicanRepublic(lat, lon)) {
                        if (app) {
                            app.showToast('Ubicación fuera de República Dominicana', 'warning');
                        }
                    }
                }
            });
        });
    }
});

// Limpiar recursos al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.gpsManager) {
        window.gpsManager.stopTracking();
    }
});