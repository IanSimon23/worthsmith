// Vercel Serverless Function
// Place this file at: /api/suggest-alternatives.js

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { outcome, existingAlternatives } = req.body;

    // Validate input
    if (!outcome && !existingAlternatives) {
      return res.status(400).json({ error: 'Outcome or existing alternatives required' });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling Anthropic API...');

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `You are helping a Product Owner explore alternatives for a user story.

Outcome they want to achieve: "${outcome || 'Not specified yet'}"

Current alternatives they've considered: "${existingAlternatives || 'None yet'}"

Generate 5-7 specific, actionable alternatives they should consider. Use the 4Rs framework:
- Reduce: Can we do less or simplify?
- Reuse: Can we leverage existing features?
- Reframe: Is there a different problem to solve?
- Remove: What if we do nothing or delay?

Format as a bullet list using "•" bullets. Be specific and practical. Each alternative should be 1-2 sentences max.

Return ONLY the bullet list, no preamble or explanation.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `API error: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('Anthropic API success');

    // Extract text from response
    const suggestions = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    return res.status(200).json({ suggestions });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}