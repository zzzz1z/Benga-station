// public/background.js
addEventListener('backgroundFetch', async (resolve, reject, args) => {
  try {
    console.log("Background runner executed successfully!");
    // Perform your background check or API calls here
    
    resolve(); // Required so the mobile OS doesn't kill your background task
  } catch (error) {
    reject(error);
  }
});