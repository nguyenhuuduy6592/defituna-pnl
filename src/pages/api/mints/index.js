export default async function handler(req, res) {
  if (!process.env.DEFITUNA_API_URL) {
    console.error('DEFITUNA_API_URL is not set for mints API route.');
    return res.status(500).json({ message: 'API URL configuration error.' });
  }

  const targetUrl = `${process.env.DEFITUNA_API_URL}/mints`;

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
