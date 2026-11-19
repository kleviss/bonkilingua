import OpenAI from "openai";

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
