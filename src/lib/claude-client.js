// lib/claude-client.js
// Thin wrapper around Anthropic's messages API.
// Used by draft-emails.js cron job to generate outreach email drafts.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
// Exported so callers (e.g. the draft-emails cron) can record the exact
// model name into email_drafts.model_used without redeclaring it.
export const DEFAULT_MODEL = 'claude-sonnet-4-6';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing env var: ANTHROPIC_API_KEY');
}

/**
 * Generate an email draft using Claude.
 *
 * @param {string} systemPrompt - Sets Claude's role and constraints
 * @param {string} userPrompt - The event/contact context to draft from
 * @param {{ model?: string, maxTokens?: number }} options
 * @returns {Promise<string>} The generated text content
 */
export async function askClaude(systemPrompt, userPrompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 1000,
  } = options;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const content = data.content?.find(block => block.type === 'text')?.text ?? '';

  if (!content) {
    throw new Error('Claude returned an empty response');
  }

  return content;
}

/**
 * Generate a structured JSON response from Claude.
 * Your system prompt must instruct Claude to return only valid JSON,
 * no preamble, no markdown fences.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ model?: string, maxTokens?: number }} options
 * @returns {Promise<any>} Parsed JSON object
 */
export async function askClaudeJSON(systemPrompt, userPrompt, options = {}) {
  const content = await askClaude(systemPrompt, userPrompt, options);

  try {
    const clean = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON response: ${err.message}\nRaw: ${content}`);
  }
}
