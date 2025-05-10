export default async function handler(req, res) {
  if (!process.env.DEFITUNA_API_URL) {
    console.error('DEFITUNA_API_URL is not set.');
    return res.status(500).json({ message: 'API URL configuration error.' });
  }

  const targetUrl = `${process.env.DEFITUNA_API_URL}/vaults`; // Endpoint to get all vaults

  try {
    const apiResponse = await fetch(targetUrl);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`API Error (${apiResponse.status}) for ${targetUrl}: ${errorBody}`);
      return res.status(apiResponse.status).json({ message: `Failed to fetch all vault details: ${apiResponse.statusText}`, error: errorBody });
    }

    const data = await apiResponse.json(); // This should be an object like { data: [...] }
    return res.status(200).json(data); // Forward the exact response from the upstream API
  } catch (error) {
    console.error(`Network or other error for ${targetUrl}:`, error);
    return res.status(500).json({ message: 'Error fetching all vault details from upstream API.', error: error.message });
  }
} 