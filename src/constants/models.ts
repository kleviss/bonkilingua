// OpenAI retires models over time. This file is the one place to change when
// that happens: what the selector offers, what is used by default, and what
// is tried when a model stops answering.

// Models offered in the selector.
export const AVAILABLE_MODELS = [
  { value: 'gpt-6-luna', label: 'GPT-6 Luna' },
  { value: 'gpt-6.1-terra', label: 'GPT-6.1 Terra' },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]['value'];

// The model used when none is chosen.
export const DEFAULT_MODEL: ModelId = 'gpt-6-luna';

// Tried in this order when the requested model and the default can't answer.
// gpt-4o-mini is what the app ran on until November 2026. OpenAI shuts it down
// on Jan 14, 2027; it stays last as a known-good safety net until then and can
// be removed afterwards.
export const BACKUP_MODELS = ['gpt-6.1-terra', 'gpt-4o-mini'] as const;

// Returns the requested model if it is still offered, otherwise the default.
// Covers requests that name no model and ones that name a retired model.
export function resolveModel(model: unknown): ModelId {
  const match = AVAILABLE_MODELS.find((m) => m.value === model);
  return match ? match.value : DEFAULT_MODEL;
}
