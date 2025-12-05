// api/get-feedback.js
// Backend endpoint for AI feedback on user stories

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { step, formData } = req.body

    // Validate input
    if (!step || !formData) {
      return res.status(400).json({ error: 'Missing step or formData' })
    }

    // Build context-aware prompt
    const prompt = buildFeedbackPrompt(step, formData)

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const feedbackText = data.content[0].text

    // Parse JSON response from Claude
    let feedback
    try {
      feedback = JSON.parse(feedbackText)
    } catch (parseError) {
      // If Claude didn't return valid JSON, try to extract it
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse feedback response')
      }
    }

    // Validate feedback structure
    if (!feedback.questions || !feedback.suggestions || !feedback.working) {
      throw new Error('Invalid feedback structure')
    }

    return res.status(200).json({ feedback })

  } catch (error) {
    console.error('Feedback API error:', error)
    return res.status(500).json({
      error: 'Failed to generate feedback',
      details: error.message
    })
  }
}

function buildFeedbackPrompt(step, formData) {
  const { outcome, beneficiary, currentMethod, alternatives, scores } = formData

  // Build context string with what's filled in
  let context = 'Story progress:\n'
  if (outcome) context += `- Outcome: "${outcome}"\n`
  if (beneficiary) context += `- Beneficiary: "${beneficiary}"\n`
  if (currentMethod) context += `- Current Method: "${currentMethod}"\n`
  if (alternatives) context += `- Alternatives: "${alternatives}"\n`
  if (scores) {
    context += `- Scores: Reach=${scores.reach}, Impact=${scores.impact}, Effort=${scores.effort}, Confidence=${scores.confidence}\n`
  }

  // Step-specific guidance
  const stepGuidance = getStepGuidance(step)

  return `You are an experienced Product Manager providing constructive feedback to a Product Owner working on a user story. Your role is to help them think more deeply and articulate more clearly.

Current step: ${step}
${context}

Based on what they've entered and focusing on the "${step}" step, provide feedback that:

${stepGuidance}

1. QUESTIONS (1-2): Ask thought-provoking questions that:
   - Challenge assumptions or expose gaps
   - Explore alternatives or edge cases
   - Use "What if..." or "Have you considered..."
   - Be curious, not critical

2. SUGGESTIONS (1-2): Offer specific improvements to:
   - Make language more concrete and measurable
   - Remove ambiguity or strengthen value proposition
   - Improve clarity or actionability
   - Explain WHY each suggestion helps

3. WHAT'S WORKING (1-2): Highlight strengths to:
   - Reinforce good practices
   - Build confidence
   - Be specific about what's effective

Keep responses concise (2-3 sentences per point), actionable, and supportive. Use a collaborative tone.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "questions": ["question 1", "question 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "working": ["strength 1", "strength 2"]
}

If any field would have fewer than 2 items, include "N/A" or a brief note about why more feedback isn't needed.`
}

function getStepGuidance(step) {
  const guidance = {
    outcome: `Focus on:
- Is the outcome specific and measurable?
- Is it a true outcome or just an output/feature?
- Can success be clearly validated?
- Is the business value articulated?`,

    beneficiary: `Focus on:
- Is the beneficiary specific enough?
- Can we identify and reach this group?
- Do we understand their needs and context?
- Is this the right user segment?`,

    'current-method': `Focus on:
- Is the current pain point clearly articulated?
- Do we understand WHY it's problematic?
- Is this the root cause or a symptom?
- What evidence supports this being a problem?`,

    alternatives: `Focus on:
- Are the alternatives comprehensive?
- Have non-technical options been considered?
- Is there a "do nothing" option for comparison?
- Are the alternatives realistic and feasible?`,

    scoring: `Focus on:
- Do the scores align with the story details?
- Is the confidence score justified by research?
- Does the effort estimate seem realistic?
- Does the final recommendation make sense?`
  }

  return guidance[step] || guidance.outcome
}
