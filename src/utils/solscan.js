export async function getPositionAge(address) {
  try {
    // First request to get total transactions
    const initialResponse = await fetch(
      `https://api-v2.solscan.io/v2/account/transaction?address=${address}&page_size=1`
    );
    const initialData = await initialResponse.json();

    if (!initialData.success || !initialData.total) {
      return "Unknown";
    }

    // Second request to get the oldest transaction
    const oldestResponse = await fetch(
      `https://api-v2.solscan.io/v2/account/transaction?address=${address}&page_size=1&page=${initialData.total}`
    );
    const oldestData = await oldestResponse.json();

    if (!oldestData.success || !oldestData.data?.[0]) {
      return "Unknown";
    }

    // Calculate age in seconds
    const creationTime = oldestData.data[0].block_time; // Unix timestamp in seconds
    const now = Date.now() / 1000; // Current time in seconds
    const ageInSeconds = now - creationTime;

    // Convert to appropriate unit
    if (ageInSeconds >= 24 * 60 * 60) {
      // >= 1 day, show in days
      const ageInDays = Math.floor(ageInSeconds / (24 * 60 * 60));
      return `${ageInDays} day${ageInDays === 1 ? "" : "s"}`;
    } else if (ageInSeconds >= 60 * 60) {
      // >= 1 hour but < 1 day, show in hours
      const ageInHours = Math.floor(ageInSeconds / (60 * 60));
      return `${ageInHours} hour${ageInHours === 1 ? "" : "s"}`;
    } else if (ageInSeconds >= 60) {
      // >= 1 minute but < 1 hour, show in minutes
      const ageInMinutes = Math.floor(ageInSeconds / 60);
      return `${ageInMinutes} minute${ageInMinutes === 1 ? "" : "s"}`;
    } else {
      // < 1 minute, show in seconds
      const ageInSecondsRounded = Math.floor(ageInSeconds);
      return `${ageInSecondsRounded} second${ageInSecondsRounded === 1 ? "" : "s"}`;
    }
  } catch (error) {
    console.error("Error fetching position age:", error);
    return "Unknown";
  }
}