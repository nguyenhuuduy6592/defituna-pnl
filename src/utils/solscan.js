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
      // >= 1 day, show days and hours
      const ageInDays = Math.floor(ageInSeconds / (24 * 60 * 60));
      const remainingHours = Math.floor((ageInSeconds % (24 * 60 * 60)) / 3600);
      if (remainingHours > 0) {
        return `${ageInDays} day${ageInDays === 1 ? "" : "s"} ${remainingHours} hour${remainingHours === 1 ? "" : "s"}`;
      }
      return `${ageInDays} day${ageInDays === 1 ? "" : "s"}`;
    } else if (ageInSeconds >= 60 * 60) {
      // >= 1 hour, show hours and minutes
      const ageInHours = Math.floor(ageInSeconds / (60 * 60));
      const remainingMinutes = Math.floor((ageInSeconds % (60 * 60)) / 60);
      if (remainingMinutes > 0) {
        return `${ageInHours} hour${ageInHours === 1 ? "" : "s"} ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`;
      }
      return `${ageInHours} hour${ageInHours === 1 ? "" : "s"}`;
    } else if (ageInSeconds >= 60) {
      // >= 1 minute, show minutes and seconds
      const ageInMinutes = Math.floor(ageInSeconds / 60);
      const remainingSeconds = Math.floor(ageInSeconds % 60);
      if (remainingSeconds > 0) {
        return `${ageInMinutes} minute${ageInMinutes === 1 ? "" : "s"} ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`;
      }
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