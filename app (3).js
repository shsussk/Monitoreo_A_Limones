// app.js - Lógica principal de la aplicación
class MuestreoApp {
    constructor() {
        this.registros = [];
        this.currentTab = 'muestreo';
        this.gpsWatchId = null;
        this.init();
    }

    init() {
        this.loadRegistros();
        this.setupEventListeners();
        this.updateUI();
        this.setCurrentDateTime();
        this.checkConnection();
        console.log('App inicializada correctamente');
    }

    setupEventListeners() {
        // Cálculo automático de infestaciones
        const campos = ['plantas_aceria', 'positivas_aceria', 'plantas_phyllo', 'positivas_phyllo', 'plantas_poly', 'positivas_poly'];
        campos.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.calcularInfestaciones());
            }
        });

        // Validación de campos
        document.addEventListener('input', (e) => {
            if (e.target.type === 'number') {
                this.validateNumberInput(e.target);
            }
        });

        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('Service Worker registrado', reg))
                .catch(err => console.log('Error en Service Worker', err));
        }

        // Prevenir zoom en iOS
        document.addEventListener('touchstart', function (event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        });
    }

    setCurrentDateTime() {
        const now = new Date();
        const fecha = now.toISOString().split('T')[0];
        const hora = now.toTimeString().split(':').slice(0, 2).join(':');
        
        document.getElementById('fecha').value = fecha;
        document.getElementById('hora').value = hora;
    }

    validateNumberInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        if (min !== null && value < min) {
            input.value = min;
        }
        if (max !== null && value > max) {
            input.value = max;
        }

        // Validación específica para plantas positivas
        if (input.name.includes('positivas')) {
            const plantasId = input.name.replace('positivas', 'plantas');
            const plantasTotal = document.getElementById(plantasId);
            if (plantasTotal && value > parseFloat(plantasTotal.value)) {
                input.value = plantasTotal.value;
                this.showToast('Las plantas positivas no pueden ser más que el total', 'warning');
            }
        }
    }

    calcularInfestaciones() {
        // Aceria sheldoni
        const plantasAceria = parseFloat(document.getElementById('plantas_aceria').value) || 0;
        const positivasAceria = parseFloat(document.getElementById('positivas_aceria').value) || 0;
        if (plantasAceria > 0) {
            const porcAceria = (positivasAceria / plantasAceria * 100).toFixed(1);
            document.getElementById('infestacion_aceria').value = porcAceria + '%';
        }

        // Phyllocoptruta oleivora
        const plantasPhyllo = parseFloat(document.getElementById('plantas_phyllo').value) || 0;
        const positivasPhyllo = parseFloat(document.getElementById('positivas_phyllo').value) || 0;
        if (plantasPhyllo > 0) {
            const porcPhyllo = (positivasPhyllo / plantasPhyllo * 100).toFixed(1);
            document.getElementById('infestacion_phyllo').value = porcPhyllo + '%';
        }

        // Polyphagotarsonemus latus
        const plantasPoly = parseFloat(document.getElementById('plantas_poly').value) || 0;
        const positivasPoly = parseFloat(document.getElementById('positivas_poly').value) || 0;
        if (plantasPoly > 0) {
            const porcPoly = (positivasPoly / plantasPoly * 100).toFixed(1);
            document.getElementById('infestacion_poly').value = porcPoly + '%';
        }
    }

    guardarRegistro() {
        if (!this.validarFormulario()) {
            return;
        }

        const formData = new FormData(document.getElementById('muestreoForm'));
        const registro = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            syncStatus: 'pending'
        };

        // Convertir FormData a objeto
        for (let [key, value] of formData.entries()) {
            registro[key] = value;
        }

        // Agregar datos calculados
        registro.infestacion_aceria = document.getElementById('infestacion_aceria').value;
        registro.infestacion_phyllo = document.getElementById('infestacion_phyllo').value;
        registro.infestacion_poly = document.getElementById('infestacion_poly').value;

        this.registros.push(registro);
        this.saveRegistros();
        this.updateUI();
        this.showToast('Registro guardado correctamente', 'success');
        
        // Limpiar formulario después de guardar
        setTimeout(() => {
            this.limpiarFormulario();
        }, 1000);
    }

    validarFormulario() {
        const campos_requeridos = ['fecha', 'tecnico', 'finca'];
        let valido = true;

        campos_requeridos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (!elemento.value.trim()) {
                elemento.focus();
                this.showToast(`El campo ${campo} es obligatorio`, 'error');
                valido = false;
            }
        });

        // Validar que al menos una especie tenga datos
        const tieneAceria = document.getElementById('plantas_aceria').value && document.getElementById('positivas_aceria').value !== '';
        const tienePhyllo = document.getElementById('plantas_phyllo').value && document.getElementById('positivas_phyllo').value !== '';
        const tienePoly = document.getElementById('plantas_poly').value && document.getElementById('positivas_poly').value !== '';

        if (!tieneAceria && !tienePhyllo && !tienePoly) {
            this.showToast('Debe registrar datos para al menos una especie', 'warning');
            valido = false;
        }

        return valido;
    }

    limpiarFormulario() {
        document.getElementById('muestreoForm').reset();
        this.setCurrentDateTime();
        this.clearGPS();
        document.getElementById('infestacion_aceria').value = '';
        document.getElementById('infestacion_phyllo').value = '';
        document.getElementById('infestacion_poly').value = '';
    }

    loadRegistros() {
        try {
            const stored = localStorage.getItem('muestreoAcaros');
            this.registros = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error cargando registros:', error);
            this.registros = [];
        }
    }

    saveRegistros() {
        try {
            localStorage.setItem('muestreoAcaros', JSON.stringify(this.registros));
        } catch (error) {
            console.error('Error guardando registros:', error);
            this.showToast('Error al guardar en almacenamiento local', 'error');
        }
    }

    updateUI() {
        this.updateRecordCount();
        this.updateRegistrosList();
        this.updateSyncStatus();
    }

    updateRecordCount() {
        const countElement = document.getElementById('count');
        if (countElement) {
            countElement.textContent = this.registros.length;
        }
    }

    updateRegistrosList() {
        const listElement = document.getElementById('registrosList');
        if (!listElement) return;

        if (this.registros.length === 0) {
            listElement.innerHTML = '<p style="text-align: center; color: #666; margin: 40px 0;">No hay registros guardados</p>';
            return;
        }

        const html = this.registros
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(registro => this.createRegistroHTML(registro))
            .join('');
        
        listElement.innerHTML = html;
    }

    createRegistroHTML(registro) {
        const fecha = new Date(registro.timestamp).toLocaleString('es-DO');
        const especies = [];
        
        if (registro.plantas_aceria) especies.push(`Aceria: ${registro.infestacion_aceria || '0%'}`);
        if (registro.plantas_phyllo) especies.push(`Phyllo: ${registro.infestacion_phyllo || '0%'}`);
        if (registro.plantas_poly) especies.push(`Poly: ${registro.infestacion_poly || '0%'}`);

        return `
            <div class="registro-item" onclick="app.mostrarDetalleRegistro('${registro.id}')">
                <div class="registro-header">
                    <span class="registro-fecha">${fecha}</span>
                    <span class="registro-finca">${registro.finca || 'Sin finca'}</span>
                </div>
                <div class="registro-datos">
                    ${especies.map(esp => `<div class="registro-dato">${esp}</div>`).join('')}
                    ${registro.latitud ? `<div class="registro-dato">📍 GPS: ${parseFloat(registro.latitud).toFixed(4)}, ${parseFloat(registro.longitud).toFixed(4)}</div>` : ''}
                    ${registro.tecnico ? `<div class="registro-dato">👤 ${registro.tecnico}</div>` : ''}
                </div>
            </div>
        `;
    }

    mostrarDetalleRegistro(id) {
        const registro = this.registros.find(r => r.id === id);
        if (!registro) return;

        const detalles = Object.entries(registro)
            .filter(([key, value]) => value && key !== 'id' && key !== 'syncStatus')
            .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
            .join('<br>');

        const modal = confirm(`¿Desea eliminar este registro?\n\nDetalles del registro:\n${detalles.replace(/<br>/g, '\n').replace(/<strong>|<\/strong>/g, '')}`);
        
        if (modal) {
            this.eliminarRegistro(id);
        }
    }

    eliminarRegistro(id) {
        this.registros = this.registros.filter(r => r.id !== id);
        this.saveRegistros();
        this.updateUI();
        this.showToast('Registro eliminado', 'success');
    }

    clearGPS() {
        document.getElementById('latitud').value = '';
        document.getElementById('longitud').value = '';
        document.getElementById('precision').value = '';
        document.getElementById('gpsStatus').textContent = '🌐 GPS Inactivo';
        document.getElementById('gpsStatus').className = 'status-inactive';
    }

    exportarCSV() {
        if (this.registros.length === 0) {
            this.showToast('No hay registros para exportar', 'warning');
            return;
        }

        const headers = [
            'timestamp', 'fecha', 'hora', 'tecnico', 'finca', 'bloque',
            'latitud', 'longitud', 'precision', 'temperatura', 'humedad', 'lluvia',
            'plantas_aceria', 'positivas_aceria', 'infestacion_aceria',
            'plantas_phyllo', 'positivas_phyllo', 'infestacion_phyllo',
            'plantas_poly', 'positivas_poly', 'infestacion_poly',
            'fitoseidos', 'coccinelidos', 'observaciones'
        ];

        const csvContent = [
            headers.join(','),
            ...this.registros.map(registro => 
                headers.map(header => {
                    const value = registro[header] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        this.downloadFile(csvContent, `muestreo_acaros_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        this.showToast('Archivo CSV exportado correctamente', 'success');
    }

    borrarTodosRegistros() {
        if (confirm('¿Está seguro que desea eliminar TODOS los registros? Esta acción no se puede deshacer.')) {
            this.registros = [];
            this.saveRegistros();
            this.updateUI();
            this.showToast('Todos los registros han sido eliminados', 'success');
        }
    }

    crearRespaldo() {
        const respaldo = {
            version: '1.0',
            fecha: new Date().toISOString(),
            registros: this.registros
        };

        const jsonContent = JSON.stringify(respaldo, null, 2);
        this.downloadFile(jsonContent, `respaldo_muestreo_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        
        localStorage.setItem('lastBackup', new Date().toISOString());
        this.updateSyncStatus();
        this.showToast('Respaldo creado correctamente', 'success');
    }

    importarRespaldo() {
        document.getElementById('fileInput').click();
    }

    procesarArchivo(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const respaldo = JSON.parse(e.target.result);
                
                if (respaldo.registros && Array.isArray(respaldo.registros)) {
                    const nuevos = respaldo.registros.filter(nuevo => 
                        !this.registros.some(existente => existente.id === nuevo.id)
                    );
                    
                    this.registros.push(...nuevos);
                    this.saveRegistros();
                    this.updateUI();
                    this.showToast(`${nuevos.length} registros importados correctamente`, 'success');
                } else {
                    throw new Error('Formato de archivo inválido');
                }
            } catch (error) {
                console.error('Error importando archivo:', error);
                this.showToast('Error al importar el archivo', 'error');
            }
        };
        reader.readAsText(file);
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    updateSyncStatus() {
        const localCount = document.getElementById('localCount');
        const lastBackup = document.getElementById('lastBackup');
        
        if (localCount) localCount.textContent = this.registros.length;
        
        if (lastBackup) {
            const backup = localStorage.getItem('lastBackup');
            if (backup) {
                const fecha = new Date(backup).toLocaleString('es-DO');
                lastBackup.textContent = fecha;
            } else {
                lastBackup.textContent = 'Nunca';
            }
        }
    }

    checkConnection() {
        const updateStatus = () => {
            const status = navigator.onLine;
            const element = document.getElementById('connectionStatus');
            if (element) {
                element.textContent = status ? '📡 ONLINE' : '📡 OFFLINE';
                element.className = status ? 'status-online' : 'status-offline';
            }
        };

        updateStatus();
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
    }

    showLoading(text = 'Cargando...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        if (overlay && loadingText) {
            loadingText.textContent = text;
            overlay.classList.add('active');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Funciones globales para el HTML
function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar tab seleccionado
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    app.currentTab = tabName;
    
    if (tabName === 'registros') {
        app.updateRegistrosList();
    } else if (tabName === 'sincronizar') {
        app.updateSyncStatus();
    }
}

function guardarRegistro() {
    app.guardarRegistro();
}

function limpiarFormulario() {
    app.limpiarFormulario();
}

function exportarCSV() {
    app.exportarCSV();
}

function borrarTodosRegistros() {
    app.borrarTodosRegistros();
}

function crearRespaldo() {
    app.crearRespaldo();
}

function importarRespaldo() {
    app.importarRespaldo();
}

function procesarArchivo(event) {
    app.procesarArchivo(event);
}

function clearGPS() {
    app.clearGPS();
}

// Inicializar aplicación
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MuestreoApp();
});

// Manejar visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && app) {
        app.checkConnection();
        app.updateUI();
    }
});

// Prevenir pérdida de datos
window.addEventListener('beforeunload', (e) => {
    const form = document.getElementById('muestreoForm');
    const hasData = Array.from(new FormData(form)).some(([, value]) => value.trim());
    
    if (hasData) {
        e.preventDefault();
        e.returnValue = '';
    }
});