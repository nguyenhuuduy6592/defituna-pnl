export default async function handler(req, res) {
  const { mintAddress } = req.query;

  if (!mintAddress || typeof mintAddress !== 'string') {
    return res
      .status(400)
      .json({ message: 'Mint address is required and must be a string.' });
  }

  if (!process.env.DEFITUNA_API_URL) {
    console.error('DEFITUNA_API_URL is not set for mint API route.');
    return res.status(500).json({ message: 'API URL configuration error.' });
  }

  const targetUrl = `${process.env.DEFITUNA_API_URL}/mints/${mintAddress}`;

  try {
    const apiResponse = await fetch(targetUrl);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(
        `Upstream API Error for ${targetUrl} (${apiResponse.status}): ${errorBody}`
      );
      return res.status(apiResponse.status).json({
        message: `Failed to fetch mint data: ${apiResponse.statusText}`,
        error: errorBody,
      });
    }

    const data = await apiResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Network or other error for ${targetUrl}:`, error);
    return res.status(500).json({
      message: 'Error fetching mint data from upstream API.',
      error: error.message,
    });
  }
}
