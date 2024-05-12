// app/api/search.route.js
import { NextRequest, NextResponse } from "next/server";
import { CohereClient } from "cohere-ai";
import { createClient } from "@supabase/supabase-js";
import { embedQuery } from "@/app/helpers";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

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
      },
    );
  }

  const embedding = await embedQuery(query);

  if (!embedding) {
    return new Response(JSON.stringify({ error: "Failed to get embedding" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const searchResults = await supabase.rpc(
    "search_vtm",
    {
      query_vector: embedding,
      top_k: parseInt(topK),
    },
  );

  if (searchResults.error) {
    return new Response(
      JSON.stringify({
        error: "Supabase query failed: " + JSON.stringify(searchResults.error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const resultText =
    searchResults.data.map((d: { doc_content: string }) => d.doc_content) ?? "";

  return new Response(JSON.stringify({ resultText: resultText.join("\n") }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
