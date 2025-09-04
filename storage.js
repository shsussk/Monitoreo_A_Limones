// storage.js - Manejo de almacenamiento local y sincronización
class StorageManager {
    constructor() {
        this.dbName = 'MuestreoAcarosDB';
        this.dbVersion = 1;
        this.storeName = 'registros';
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.log('IndexedDB no disponible, usando localStorage');
                resolve();
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error abriendo IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB inicializado correctamente');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('finca', 'finca', { unique: false });
                    store.createIndex('syncStatus', 'syncStatus', { unique: false });
                }
            };
        });
    }

    async saveRegistro(registro) {
        // Intentar guardar en IndexedDB primero
        if (this.db) {
            return this.saveToIndexedDB(registro);
        } else {
            return this.saveToLocalStorage(registro);
        }
    }

    async saveToIndexedDB(registro) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(registro);

            request.onsuccess = () => {
                console.log('Registro guardado en IndexedDB:', registro.id);
                resolve(registro);
            };

            request.onerror = () => {
                console.error('Error guardando en IndexedDB');
                // Fallback a localStorage
                this.saveToLocalStorage(registro);
                reject(request.error);
            };
        });
    }

    saveToLocalStorage(registro) {
        try {
            let registros = this.getRegistrosFromLocalStorage();
            
            // Actualizar registro existente o agregar nuevo
            const index = registros.findIndex(r => r.id === registro.id);
            if (index >= 0) {
                registros[index] = registro;
            } else {
                registros.push(registro);
            }

            localStorage.setItem('muestreoAcaros', JSON.stringify(registros));
            console.log('Registro guardado en localStorage:', registro.id);
            return Promise.resolve(registro);
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
            return Promise.reject(error);
        }
    }

    async getAllRegistros() {
        if (this.db) {
            return this.getFromIndexedDB();
        } else {
            return this.getRegistrosFromLocalStorage();
        }
    }

    async getFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Error obteniendo de IndexedDB, usando localStorage');
                resolve(this.getRegistrosFromLocalStorage());
            };
        });
    }

    getRegistrosFromLocalStorage() {
        try {
            const stored = localStorage.getItem('muestreoAcaros');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error leyendo localStorage:', error);
            return [];
        }
    }

    async deleteRegistro(id) {
        if (this.db) {
            return this.deleteFromIndexedDB(id);
        } else {
            return this.deleteFromLocalStorage(id);
        }
    }

    async deleteFromIndexedDB(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Registro eliminado de IndexedDB:', id);
                resolve();
            };

            request.onerror = () => {
                console.error('Error eliminando de IndexedDB');
                reject(request.error);
            };
        });
    }

    deleteFromLocalStorage(id) {
        try {
            let registros = this.getRegistrosFromLocalStorage();
            registros = registros.filter(r => r.id !== id);
            localStorage.setItem('muestreoAcaros', JSON.stringify(registros));
            console.log('Registro eliminado de localStorage:', id);
            return Promise.resolve();
        } catch (error) {
            console.error('Error eliminando de localStorage:', error);
            return Promise.reject(error);
        }
    }

    async clearAllRegistros() {
        if (this.db) {
            await this.clearIndexedDB();
        }
        this.clearLocalStorage();
    }

    async clearIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('IndexedDB limpiado');
                resolve();
            };

            request.onerror = () => {
                console.error('Error limpiando IndexedDB');
                reject(request.error);
            };
        });
    }

    clearLocalStorage() {
        try {
            localStorage.removeItem('muestreoAcaros');
            console.log('localStorage limpiado');
        } catch (error) {
            console.error('Error limpiando localStorage:', error);
        }
    }

    // Exportar datos
    async exportData() {
        const registros = await this.getAllRegistros();
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            totalRegistros: registros.length,
            registros: registros,
            metadata: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            }
        };
        return exportData;
    }

    // Importar datos
    async importData(data) {
        if (!data || !data.registros || !Array.isArray(data.registros)) {
            throw new Error('Formato de datos inválido');
        }

        const existentes = await this.getAllRegistros();
        const nuevos = data.registros.filter(nuevo => 
            !existentes.some(existente => existente.id === nuevo.id)
        );

        for (const registro of nuevos) {
            await this.saveRegistro(registro);
        }

        return nuevos.length;
    }

    // Obtener estadísticas de almacenamiento
    async getStorageStats() {
        try {
            const registros = await this.getAllRegistros();
            const stats = {
                totalRegistros: registros.length,
                registrosPendientes: registros.filter(r => r.syncStatus === 'pending').length,
                registrosSincronizados: registros.filter(r => r.syncStatus === 'synced').length,
                ultimoRegistro: registros.length > 0 ? Math.max(...registros.map(r => new Date(r.timestamp))) : null,
                fincas: [...new Set(registros.map(r => r.finca))].filter(f => f),
                tecnicos: [...new Set(registros.map(r => r.tecnico))].filter(t => t)
            };

            // Calcular espacio usado (aproximado)
            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                stats.storageUsed = estimate.usage;
                stats.storageQuota = estimate.quota;
                stats.storagePercentage = ((estimate.usage / estimate.quota) * 100).toFixed(2);
            }

            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }

    // Limpiar registros antiguos
    async cleanOldRecords(daysOld = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const registros = await this.getAllRegistros();
        const toDelete = registros.filter(r => 
            new Date(r.timestamp) < cutoffDate && r.syncStatus === 'synced'
        );

        for (const registro of toDelete) {
            await this.deleteRegistro(registro.id);
        }

        return toDelete.length;
    }

    // Backup automático
    async createAutoBackup() {
        try {
            const data = await this.exportData();
            const filename = `backup_auto_${new Date().toISOString().split('T')[0]}.json`;
            
            // Guardar en localStorage como backup
            localStorage.setItem('lastAutoBackup', JSON.stringify({
                date: new Date().toISOString(),
                data: data
            }));

            return { success: true, filename };
        } catch (error) {
            console.error('Error en backup automático:', error);
            return { success: false, error: error.message };
        }
    }

    // Restaurar desde backup automático
    async restoreFromAutoBackup() {
        try {
            const backup = localStorage.getItem('lastAutoBackup');
            if (!backup) {
                throw new Error('No hay backup automático disponible');
            }

            const backupData = JSON.parse(backup);
            const imported = await this.importData(backupData.data);
            
            return { success: true, registrosImportados: imported };
        } catch (error) {
            console.error('Error restaurando backup automático:', error);
            return { success: false, error: error.message };
        }
    }

    // Validar integridad de datos
    async validateDataIntegrity() {
        try {
            const registros = await this.getAllRegistros();
            const issues = [];

            for (const registro of registros) {
                // Verificar campos requeridos
                if (!registro.id || !registro.timestamp || !registro.tecnico || !registro.finca) {
                    issues.push(`Registro ${registro.id || 'sin ID'}: campos requeridos faltantes`);
                }

                // Verificar formato de timestamp
                if (registro.timestamp && isNaN(new Date(registro.timestamp))) {
                    issues.push(`Registro ${registro.id}: timestamp inválido`);
                }

                // Verificar coordenadas GPS si están presentes
                if (registro.latitud && registro.longitud) {
                    const lat = parseFloat(registro.latitud);
                    const lon = parseFloat(registro.longitud);
                    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                        issues.push(`Registro ${registro.id}: coordenadas GPS inválidas`);
                    }
                }
            }

            return {
                valid: issues.length === 0,
                totalRegistros: registros.length,
                issues: issues
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
}

// Inicializar Storage Manager globalmente
let storageManager;
document.addEventListener('DOMContentLoaded', async () => {
    storageManager = new StorageManager();
    await storageManager.initDB();
});

// Hacer disponible globalmente
window.storageManager = storageManager;