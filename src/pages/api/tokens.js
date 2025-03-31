const DEFITUNA_API = process.env.DEFITUNA_API_URL;

export default async function handler(req, res) {
  try {
    const response = await fetch(`${DEFITUNA_API}/mints`);
    if (!response.ok) {
      throw new Error('Failed to fetch token metadata from DeFiTuna API');
    }
    const { data } = await response.json();

    // Validate the data
    if (!Array.isArray(data)) {
      throw new Error('Invalid token metadata format received from API');
    }

    // Transform the array into a map of mint address to token metadata
    const tokenMetadata = {};
    data.forEach(token => {
      if (token.mint && token.symbol) {
        tokenMetadata[token.mint] = {
          symbol: token.symbol,
          decimals: token.decimals || 9
        };
      }
    });

    res.status(200).json(tokenMetadata);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch token metadata' });
  }
} 