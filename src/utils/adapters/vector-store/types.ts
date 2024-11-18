type Providers = (typeof VectorStoreProviders)[number]; 

// @todo: add 'openai' | 'anthropic'; providers
export const VectorStoreProviders = ['pinecone'] as const;

export type VectorStoreBaseConfig = {
  provider: Providers;
  options: VectorStoreBaseOtions;
}

type VectorStoreBaseOtions = PineconeAdapterOptions;

export type PineconeAdapterOptions = {
  indexName: string;
  namespace: string;
  numberOfResults?: number | undefined;
}
