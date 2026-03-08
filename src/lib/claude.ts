import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = 'claude-opus-4-6';
export const MODEL_FAST = 'claude-sonnet-4-6'; // for bible/updater tasks

export async function callClaude(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    system?: string;
  } = {}
): Promise<string> {
  const response = await client.messages.create({
    model: options.model ?? MODEL,
    max_tokens: options.maxTokens ?? 8192,
    temperature: options.temperature ?? 0.7,
    system: options.system,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

export async function callClaudeJSON<T>(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    system?: string;
  } = {}
): Promise<T> {
  const text = await callClaude(prompt, {
    ...options,
    temperature: options.temperature ?? 0.2,
  });

  // Extract JSON from response (handles markdown code blocks, objects, arrays)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/) ?? text.match(/(\[[\s\S]*\])/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`Failed to parse Claude JSON response: ${jsonStr.slice(0, 200)}`);
  }
}
