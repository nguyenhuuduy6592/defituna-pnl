export default async function handler(req, res) {
  const { vaultAddress } = req.query;

  if (!vaultAddress || typeof vaultAddress !== 'string') {
    return res.status(400).json({ message: 'Vault address is required and must be a string.' });
  }

  if (!process.env.DEFITUNA_API_URL) {
    console.error('DEFITUNA_API_URL is not set.');
    return res.status(500).json({ message: 'API URL configuration error.' });
  }

  const targetUrl = `${process.env.DEFITUNA_API_URL}/vaults/${vaultAddress}`;

  try {
    const apiResponse = await fetch(targetUrl);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`API Error (${apiResponse.status}) for ${targetUrl}: ${errorBody}`);
      return res.status(apiResponse.status).json({ message: `Failed to fetch vault details: ${apiResponse.statusText}`, error: errorBody });
    }

    const data = await apiResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Network or other error for ${targetUrl}:`, error);
    return res.status(500).json({ message: 'Error fetching vault details from upstream API.', error: error.message });
  }
}