// public/background.js
addEventListener('backgroundFetch', async (resolve, reject, args) => {
  try {
    await fetch('https://benga-station.vercel.app/api/keepalive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'ios-native-system' })
    });
    resolve();
  } catch (error) {
    reject(error);
  }
});