import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function embedQuery(query: string) {
  const embeddingResponse = await cohere.embed({
    texts: [query],
    model: "embed-english-v3.0",
    inputType: "search_query",
    embeddingTypes: ["float"],
  });

  // @ts-ignore
  const embedding = embeddingResponse.embeddings.float[0] as number[];
  if (!embedding) {
    throw new Error("No embedding found");
  }
  return embedding;
}
