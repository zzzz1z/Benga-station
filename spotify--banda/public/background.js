// public/background.js

addEventListener('backgroundFetch', async (resolve, reject, args) => {
  try {
    // 1. Example: Ping your server endpoint to check for song updates or keep-alive
    const response = await fetch('https://benga-station.vercel.app/api/keepalive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ timestamp: Date.now() })
    });
    
    if (!response.ok) {
      throw new Error('Network response failed');
    }

    // 2. Always resolve when complete so iOS knows you finished successfully
    console.log("Background check completed successfully.");
    resolve();
    
  } catch (error) {
    console.error("Background sync error:", error);
    // Reject tells iOS the task failed, allowing it to try again later
    reject(error);
  }
});