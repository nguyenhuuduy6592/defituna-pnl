export async function getPositionAge(address) {
  try {
    // First request to get total transactions
    const initialResponse = await fetch(
      `https://api-v2.solscan.io/v2/account/transaction?address=${address}&page_size=1`
    );
    const initialData = await initialResponse.json();
    
    if (!initialData.success || !initialData.total) {
      return 0;
    }

    // Second request to get the oldest transaction
    const oldestResponse = await fetch(
      `https://api-v2.solscan.io/v2/account/transaction?address=${address}&page_size=1&page=${initialData.total}`
    );
    const oldestData = await oldestResponse.json();
    
    if (!oldestData.success || !oldestData.data?.[0]) {
      return 0;
    }

    // Calculate age in days
    const creationTime = oldestData.data[0].block_time;
    const ageInDays = Math.floor((Date.now() / 1000 - creationTime) / (24 * 60 * 60));
    
    return ageInDays;
  } catch (error) {
    console.error('Error fetching position age:', error);
    return 0;
  }
}