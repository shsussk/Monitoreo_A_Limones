// sw.js - Service Worker para funcionamiento offline
const CACHE_NAME = 'muestreo-acaros-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/gps.js',
  '/storage.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Todos los recursos cacheados');
        // Activar inmediatamente el nuevo service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error cacheando recursos:', error);
      })
  );
});

// Activar Service Worker y limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activado');
      // Tomar control inmediatamente
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }

        // Si no está en cache, intentar obtener de la red
        return fetch(event.request).then(response => {
          // Verificar si la respuesta es válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.log('Error en fetch:', error);
          
          // Para páginas HTML, devolver una página offline básica
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Para otros recursos, no hacer nada (dejará que falle)
          throw error;
        });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano (cuando hay conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    console.log('Iniciando sincronización en segundo plano');
    
    // Aquí podrías agregar lógica para sincronizar con un servidor
    // Por ahora, solo logeamos que la sincronización ocurrió
    
    // Notificar al cliente que la sincronización fue exitosa
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SUCCESS',
        message: 'Datos sincronizados correctamente'
      });
    });
    
  } catch (error) {
    console.error('Error en sincronización:', error);
    
    // Notificar error al cliente
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        message: 'Error en la sincronización'
      });
    });
  }
}

// Notificaciones push (para futuras implementaciones)
self.addEventListener('push', event => {
  const title = 'Muestreo Ácaros';
  const options = {
    body: event.data ? event.data.text() : 'Mensaje de la aplicación',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Limpieza periódica de cache (ejecutar cada vez que se activa el SW)
self.addEventListener('activate', event => {
  event.waitUntil(
    cleanupCache()
  );
});

async function cleanupCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    // Eliminar entradas de cache que sean muy antiguas (más de 30 días)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const deletePromises = requests.map(async request => {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (responseDate < thirtyDaysAgo) {
            console.log('Eliminando entrada antigua del cache:', request.url);
            return cache.delete(request);
          }
        }
      }
    });

    await Promise.all(deletePromises);
    console.log('Limpieza de cache completada');
  } catch (error) {
    console.error('Error en limpieza de cache:', error);
  }
}

// Manejar errores del Service Worker
self.addEventListener('error', event => {
  console.error('Error en Service Worker:', event.error);
});

// Manejar errores no capturados
self.addEventListener('unhandledrejection', event => {
  console.error('Promise rechazada no manejada en Service Worker:', event.reason);
});

// Información de versión para debugging
console.log('Service Worker versión:', CACHE_NAME);
console.log('URLs a cachear:', urlsToCache);