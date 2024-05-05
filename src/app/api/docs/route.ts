// app/api/search.route.js
import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { CohereClient } from "cohere-ai";
// import storedDocs.json
import storedDocs from "./storedDocs.json";

// Initialize the Pinecone client and index
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});
const index = pc.index("nextjs-docs");

// Initialize the Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function GET(req: NextRequest) {
  // Parse the search query from the URL query parameters
  const query = req.nextUrl.searchParams.get("query");
  const topK = req.nextUrl.searchParams.get("topK") ?? "2";
  if (!query) {
    return new Response(
      JSON.stringify({ error: "Query parameter is required" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Use Cohere to convert the query into an embedding
  const embeddingResponse = await cohere.embed({
    texts: [query],
    model: "embed-english-v3.0",
    inputType: "search_query",
    embeddingTypes: ["float"],
  });

  // @ts-ignore
  const embedding = embeddingResponse.embeddings.float[0] as number[];
  if (!embedding) {
    return new Response(JSON.stringify({ error: "Failed to get embedding" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  // Use Pinecone to query the index with the embedding
  const searchResults = await index.query({
    vector: embedding,
    topK: parseInt(topK),
  });

  if (!searchResults.matches) {
    return new Response(JSON.stringify({ error: "Pinecone query failed" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const resultIds = searchResults.matches.map((match) => match.id);
  const resultText = resultIds.map(
    (id) => storedDocs[id as keyof typeof storedDocs]
  );

  return new Response(JSON.stringify({ resultText: resultText.join("\n") }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
