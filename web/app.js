import { PushNotifications } from '@capacitor/push-notifications';

const logEl = document.getElementById('log');

function log(msg) {
  console.log(msg);
  if (logEl) {
    logEl.textContent += msg + '\n';
  }
}

document.getElementById('register')?.addEventListener('click', async () => {
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive === 'granted') {
      await PushNotifications.register();
    } else {
      log('Permission not granted for push');
    }
  } catch (err) {
    log('Error requesting permission: ' + err);
  }
});

PushNotifications.addListener('registration', async (token) => {
  log('FCM registration token: ' + token.value);
  try {
    await fetch('/.netlify/functions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value })
    });
    log('Token sent to server');
  } catch (err) {
    log('Error sending token to server: ' + err);
  }
});

PushNotifications.addListener('registrationError', (err) => {
  log('Registration error: ' + JSON.stringify(err));
});

PushNotifications.addListener('pushNotificationReceived', (notification) => {
  log('Push received: ' + JSON.stringify(notification));
});

PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
  log('Push action performed: ' + JSON.stringify(notification));
});

document.getElementById('test')?.addEventListener('click', async () => {
  try {
    await fetch('/.netlify/functions/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Signals AI',
        body: 'This is a test push notification from the app'
      })
    });
    log('Test push sent');
  } catch (err) {
    log('Error sending test push: ' + err);
  }
});
