// API endpoint for generating Value Canvas using Claude
// This should be placed in your backend API routes (e.g., /api/generate-canvas.js or similar)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { outcome, beneficiary, nonDelivery, alternatives } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY, // Make sure this env var is set
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are helping create a Value Proposition Canvas for a product story. Transform the following story data into a Value Proposition Canvas format.

Story Data:
- Outcome: ${outcome}
- Beneficiary: ${beneficiary}
- Non-delivery Impact: ${nonDelivery}
- Alternatives Considered: ${alternatives}

Create a Value Proposition Canvas with these sections:

RIGHT SIDE (Customer Segment):
1. Customer Jobs: What are they trying to accomplish? (derive from Outcome and Beneficiary)
2. Pains: What problems/frustrations do they have? (derive from Non-delivery Impact)
3. Gains: What positive outcomes do they want? (derive from Outcome, stated positively)

LEFT SIDE (Value Proposition):
4. Products & Services: Our solution (derive from Alternatives - the solution we're proposing)
5. Pain Relievers: How our solution addresses their pains (connect solution to pains)
6. Gain Creators: How our solution creates their desired gains (connect solution to gains)

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "customerJobs": ["job 1", "job 2", "job 3"],
  "pains": ["pain 1", "pain 2", "pain 3"],
  "gains": ["gain 1", "gain 2", "gain 3"],
  "solution": "Brief description of the chosen solution",
  "painRelievers": ["reliever 1", "reliever 2", "reliever 3"],
  "gainCreators": ["creator 1", "creator 2", "creator 3"]
}

Keep each item concise (1-2 sentences max). Focus on the user's perspective.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const canvasJson = JSON.parse(responseText);

    // Return the canvas data
    res.status(200).json({ canvas: canvasJson });

  } catch (error) {
    console.error("Canvas generation error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate canvas"
    });
  }
}
