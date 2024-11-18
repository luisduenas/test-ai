type Providers = (typeof EmbeddingProviders)[number]; 

// @todo: add 'pinecone' | 'anthropic'; providers
export const EmbeddingProviders = ['openai'] as const;

export type EmbeddingBaseConfig = {
  provider: Providers;
  options?: EmbeddingBaseOptions;
}

type EmbeddingBaseOptions = EmbeddingOpenAIOptions;

export type EmbeddingOpenAIOptions = {
  model: 'text-embedding-3-small' | 'text-embedding-3-large	' | 'text-embedding-ada-002';
}
