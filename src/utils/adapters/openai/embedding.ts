import { OpenAIEmbeddings } from "@langchain/openai";
import { EmbeddingOpenAIOptions } from "@composabase/utils/adapters/embedding/types";

export const getAdapter = (options:EmbeddingOpenAIOptions): OpenAIEmbeddings => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  return new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    model: options?.model ? options.model : undefined,
  });
}
