export const AVAILABLE_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]['value'];

// The model used when none is chosen. OpenAI retires models over time, so
// this is the one place to change when the default has to move.
export const DEFAULT_MODEL: ModelId = 'gpt-4o-mini';

// Returns the requested model if it is still offered, otherwise the default.
// Covers requests that name no model and ones that name a retired model.
export function resolveModel(model: unknown): ModelId {
  const match = AVAILABLE_MODELS.find((m) => m.value === model);
  return match ? match.value : DEFAULT_MODEL;
}
