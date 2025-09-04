# 📱 Cuaderno de Campo Digital - Muestreo de Ácaros en Cítricos

## 🚀 Aplicación Web Progresiva (PWA) Completa

Esta es una aplicación web progresiva completa para el muestreo de ácaros en cítricos usando metodología presencia/ausencia. Funciona completamente offline y puede instalarse como una aplicación nativa en dispositivos móviles.

## 📁 Archivos Incluidos

### Archivos Principales
- **`index.html`** - Interfaz principal de la aplicación
- **`styles.css`** - Estilos y diseño responsivo
- **`app.js`** - Lógica principal de la aplicación
- **`gps.js`** - Manejo de geolocalización GPS
- **`storage.js`** - Almacenamiento local y sincronización
- **`manifest.json`** - Configuración PWA
- **`sw.js`** - Service Worker para funcionamiento offline

## ✨ Características Principales

### 📱 **Funcionalidad Móvil Completa**
- Diseño responsivo optimizado para móviles
- Captura automática de GPS con un botón
- Funciona completamente offline
- Se instala como app nativa
- Interfaz táctil optimizada

### 🔄 **Gestión de Datos Robusta**
- Almacenamiento local con IndexedDB + localStorage
- Backup automático y manual
- Exportación a CSV
- Importación de respaldos
- Validación de integridad de datos

### 🌐 **Capacidades GPS Avanzadas**
- Geolocalización de alta precisión
- Indicadores de calidad de señal
- Validación automática de coordenadas
- Detección de ubicación en República Dominicana
- Manejo de errores GPS completo

### 📊 **Muestreo Especializado**
- Metodología presencia/ausencia
- 3 especies objetivo configuradas
- Cálculo automático de % infestación
- Umbrales de tratamiento incluidos
- Registro de fauna auxiliar

## 🛠️ Instalación y Uso

### **Opción 1: Servidor Web Local**
1. Descargar todos los archivos en una carpeta
2. Ejecutar un servidor web local:
   ```bash
   # Con Python 3
   python -m http.server 8000
   
   # Con Node.js (http-server)
   npx http-server
   
   # Con PHP
   php -S localhost:8000
   ```
3. Abrir `http://localhost:8000` en el navegador móvil
4. Instalar como PWA desde el menú del navegador

### **Opción 2: Hosting Web**
1. Subir todos los archivos a un servidor web
2. Asegurar HTTPS para funcionalidad completa de GPS
3. Acceder desde cualquier dispositivo móvil
4. Instalar como app desde el navegador

## 📋 Cómo Usar la Aplicación

### **1. Primer Uso**
- Abrir la aplicación en el navegador móvil
- Permitir acceso a ubicación cuando se solicite
- La app se puede usar inmediatamente sin instalación

### **2. Crear Nuevo Registro**
- Tap en la pestaña "📝 Muestreo"
- Completar información general (fecha, técnico, finca)
- Presionar "📍 Obtener GPS" para capturar ubicación
- Llenar datos de muestreo por especie
- Presionar "💾 Guardar Registro"

### **3. Ver Registros Guardados**
- Tap en "📋 Registros" para ver todos los datos
- Tap en cualquier registro para ver detalles
- Usar "📊 Exportar CSV" para análisis externo

### **4. Gestión de Datos**
- Pestaña "☁️ Sincronizar" para backups
- "💾 Crear Respaldo Local" para seguridad
- "📂 Importar Respaldo" para restaurar datos

## 🔧 Características Técnicas

### **Almacenamiento**
- **IndexedDB**: Base de datos local robusta
- **localStorage**: Backup secundario
- **Capacidad**: Miles de registros sin problemas
- **Persistencia**: Datos nunca se pierden

### **GPS**
- **Precisión**: ±5-10 metros típicamente
- **Validación**: Coordenadas automáticamente verificadas
- **Fallback**: Entrada manual si GPS no funciona
- **Indicadores**: Estado visual de calidad de señal

### **Offline**
- **Service Worker**: Funciona sin internet
- **Cache**: Todos los recursos guardados localmente
- **Sincronización**: Automática cuando hay conexión
- **Actualizaciones**: Automáticas en segundo plano

### **Seguridad**
- **Validación**: Todos los campos validados
- **Integridad**: Verificación automática de datos
- **Backups**: Múltiples niveles de respaldo
- **Privacidad**: Todos los datos locales

## 📊 Especies Configuradas

### **Aceria sheldoni** (Ácaro de la Yema)
- **Ubicación**: Yemas y brotes
- **Daño**: Deformaciones, crecimiento zigzag
- **Umbral**: 2 ácaros/yema

### **Phyllocoptruta oleivora** (Ácaro Tostador)
- **Ubicación**: Frutos
- **Daño**: Aspecto empolvado, sin brillo
- **Umbral**: 2 ácaros/fruto pequeño → PROBLEMÁTICO

### **Polyphagotarsonemus latus** (Ácaro Blanco)
- **Ubicación**: Hojas jóvenes
- **Daño**: Plateamiento, bronceado
- **Umbral**: >15% hojas afectadas → CRÍTICO

## 🏢 Fincas Preconfiguradas

- **Fernández** (12.43 ha)
- **B. Cementerio** (3.68 ha)
- **Baez** (9.57 ha)
- **Baez 2** (22.81 ha)
- **Florida** (12.46 ha)
- **Victorina** (25.76 ha)
- **Bogaert** (44.0 ha)

## 🔍 Solución de Problemas

### **GPS No Funciona**
- Verificar permisos de ubicación en el navegador
- Asegurar que el GPS del dispositivo esté activado
- Usar entrada manual si es necesario
- Reiniciar la aplicación si persiste

### **Datos No Se Guardan**
- Verificar espacio disponible en el dispositivo
- Comprobar que los campos obligatorios estén llenos
- Crear backup manual como precaución
- Contactar soporte si continúa

### **App No Se Instala**
- Usar navegador actualizado (Chrome, Safari, Firefox)
- Asegurar conexión HTTPS si está en servidor
- Limpiar cache del navegador
- Intentar desde menú "Añadir a pantalla de inicio"

## 📞 Soporte

Para problemas técnicos o preguntas sobre uso:
- Revisar este README completo
- Verificar configuración de permisos
- Crear backup antes de cambios importantes
- Documentar pasos para reproducir problemas

## 🔐 Privacidad y Datos

- **Todos los datos se almacenan localmente** en el dispositivo
- **No se envía información a servidores externos**
- **El usuario tiene control completo** de sus datos
- **Backups son opcionales** y manejados por el usuario
- **GPS solo se usa cuando el usuario lo solicita**

## 🚀 Instalación como App Nativa

### **Android (Chrome)**
1. Abrir la aplicación en Chrome
2. Tap en menú (⋮) → "Añadir a pantalla de inicio"
3. Confirmar instalación
4. La app aparecerá como cualquier otra aplicación

### **iOS (Safari)**
1. Abrir la aplicación en Safari
2. Tap en botón compartir (□↗)
3. Seleccionar "Añadir a pantalla de inicio"
4. Confirmar instalación

---

**¡La aplicación está lista para usar! Todos los archivos necesarios están incluidos y la funcionalidad está completa.**