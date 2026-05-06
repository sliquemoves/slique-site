// lib/perplexity-client.js
// Thin wrapper around Perplexity's chat completions API.
// Used by discover-events.js and enrich-contacts.js cron jobs.

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error('Missing env var: PERPLEXITY_API_KEY');
}

/**
 * Send a prompt to Perplexity and get a text response back.
 * Uses sonar model for source-backed, real-time web results.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ model?: string, maxTokens?: number }} options
 * @returns {Promise<{ content: string, citations: string[] }>}
 */
export async function askPerplexity(systemPrompt, userPrompt, options = {}) {
  const {
    model = 'sonar',
    maxTokens = 2000,
  } = options;

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      return_citations: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  const citations = data.citations ?? [];

  return { content, citations };
}

/**
 * Ask Perplexity for a JSON response.
 * Wraps askPerplexity and safely parses the JSON.
 * Your system prompt should explicitly instruct the model to return only JSON.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ model?: string, maxTokens?: number }} options
 * @returns {Promise<{ data: any, citations: string[] }>}
 */
export async function askPerplexityJSON(systemPrompt, userPrompt, options = {}) {
  const { content, citations } = await askPerplexity(systemPrompt, userPrompt, options);

  try {
    // Strip markdown code fences if the model wraps the JSON in them
    const clean = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const data = JSON.parse(clean);
    return { data, citations };
  } catch (err) {
    throw new Error(`Failed to parse Perplexity JSON response: ${err.message}\nRaw: ${content}`);
  }
}
