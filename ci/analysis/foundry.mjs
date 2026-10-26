// Calls a model deployed in Microsoft Foundry through its OpenAI-compatible v1 chat completions API.
export async function analyzeWithFoundry({
  digest,
  systemPrompt,
  schema,
  endpoint,
  deployment,
  apiKey,
  reasoningEffort = 'medium',
}) {
  // The portal shows the endpoint with a path (e.g. /openai/v1/responses); only the host matters here.
  const url = `${new URL(endpoint).origin}/openai/v1/chat/completions`;
  const started = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      model: deployment,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(digest) },
      ],
      // Strict mode makes the service enforce the schema instead of trusting the model to follow it.
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'run_analysis', strict: true, schema },
      },
      // Reasoning models spend part of this budget thinking, so it is far above the answer's size.
      max_completion_tokens: 16_000,
      // Newer GPT models default to little or no reasoning, which drops tests from the checklist.
      reasoning_effort: reasoningEffort,
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`Foundry answered ${res.status}: ${await res.text()}`);
  const reply = await res.json();
  const choice = reply.choices?.[0];
  if (choice?.message?.refusal) throw new Error(`Model refused: ${choice.message.refusal}`);
  if (choice?.finish_reason !== 'stop')
    throw new Error(`Model stopped early (${choice?.finish_reason}); raise max_completion_tokens`);
  return {
    analysis: JSON.parse(choice.message.content),
    usage: reply.usage,
    durationMs: Date.now() - started,
  };
}
