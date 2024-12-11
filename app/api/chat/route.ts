import OpenAI from "openai";
import { StreamingTextResponse, OpenAIStream } from 'ai';

const {
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY 
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Define types for the incoming request data
interface Message {
  content: string;
  role: 'user' | 'assistant' | 'system'; // Specify allowed roles
}

interface RequestBody {
  messages: Message[];
  useRag?: boolean;
}

export async function POST(req: Request) {
  try {
    const { messages, useRag = true }: RequestBody = await req.json();
    const lastMessage = messages[messages.length - 1];

    let context = '';

    if (useRag) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: lastMessage.content,
      });

      const vector = embeddingResponse.data[0].embedding;

      const searchResponse = await fetch(
        `${ASTRA_DB_API_ENDPOINT}/api/json/v1/vector-search/${ASTRA_DB_COLLECTION}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Cassandra-Token': ASTRA_DB_APPLICATION_TOKEN
          },
          body: JSON.stringify({
            vectorField: "embedding",
            vector: vector,
            limit: 5
          })
        }
      );

      const searchResults = await searchResponse.json();
      if (searchResults?.data) {
        context = searchResults.data
          .map((doc: { title: string; content: string; url: string }) => `Title: ${doc.title}\nContent: ${doc.content}\nURL: ${doc.url}`)
          .join('\n\n');
      }
    }

    // Keep the original prompt structure with correct typing
    const systemPrompt: Message = {
      role: "system", // Ensure this is typed correctly
      content: `You are an AI assistant answering questions about Formula 1 and Wikipedia content. 
      ${useRag ? `Use the following context to answer questions. If the question cannot be answered 
      using the context provided, provide a general answer based on your knowledge.

      Context:
      ${context}` : 'Provide accurate information about Formula 1 racing.'}`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [systemPrompt, ...messages],
      temperature: 0.5,
      max_tokens: 500,
      stream: true
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
