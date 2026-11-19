import OpenAI from "openai";
import { BACKUP_MODELS, DEFAULT_MODEL } from "@/constants/models";

type ChatParams = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;
type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;

let client: OpenAI | undefined;

// The client is created on first use rather than at import, so a deployment
// without the key still builds and the request fails with a message that says
// what to set.
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to the deployment's environment variables and redeploy.");
  }
  client ??= new OpenAI({ apiKey });
  return client;
}

// gpt-4o-mini predates reasoning models: it takes a temperature and rejects a
// reasoning effort. The GPT-6 models are the other way round.
const TAKES_TEMPERATURE = new Set<string>(["gpt-4o-mini"]);

function optionsFor(model: string, temperature: number): Partial<ChatParams> {
  if (TAKES_TEMPERATURE.has(model)) return { temperature };
  // The GPT-6 models reason before answering unless told not to, which these
  // short tasks don't need. "none" is newer than the installed SDK's types.
  return { reasoning_effort: "none" as ChatParams["reasoning_effort"] };
}

// A wrong key or an exhausted quota fails the same way on every model, so
// there is no point trying another one.
function wouldFailOnAnyModel(error: unknown): boolean {
  return error instanceof OpenAI.APIError && (error.status === 401 || error.code === "insufficient_quota");
}

// Asks the requested model and, if it can't answer, the default and then the
// backups in order. Returns the answer and the model that gave it.
export async function completeChat(request: {
  model: string;
  messages: ChatMessage[];
  temperature: number;
}): Promise<{ text: string; model: string }> {
  const openai = getOpenAI();
  const candidates = [...new Set<string>([request.model, DEFAULT_MODEL, ...BACKUP_MODELS])];

  // If every model fails, report why the first one did: that is the one that
  // was asked for.
  let firstError: unknown;
  for (const model of candidates) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: request.messages,
        ...optionsFor(model, request.temperature),
      });
      return { text: completion.choices[0].message?.content?.trim() ?? "", model };
    } catch (error) {
      firstError ??= error;
      if (wouldFailOnAnyModel(error)) break;
      console.warn(`OpenAI model ${model} could not answer, trying the next one:`, (error as Error).message);
    }
  }
  throw firstError;
}
