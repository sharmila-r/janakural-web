// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyBh7YYDZVKjvzJvVizcI9Bw6j48iweNg-o',
  authDomain: 'tvk-digital.firebaseapp.com',
  projectId: 'tvk-digital',
  storageBucket: 'tvk-digital.firebasestorage.app',
  messagingSenderId: '163487331612',
  appId: '1:163487331612:web:f50fce355ca87effa9b6d9',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Janakural';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.issueId || 'default',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  // Navigate to the issue if clicked
  const issueId = event.notification.data?.issueId;
  const url = issueId ? `/admin/issues?highlight=${issueId}` : '/admin/issues';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // If not, open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
