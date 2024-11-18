import { VectorStoreBaseConfig, VectorStoreProviders } from "./types";

export const getVectoreStoreAdapter = (config:VectorStoreBaseConfig) => {
  if (!VectorStoreProviders.includes(config.provider)) {
    throw new Error(`Unsupported VectorStore Provider: ${config.provider}`)
  }

  return require(`../${config.provider}/vector-store.ts`)
    .getAdapter(config.options)
}

export * from "./types";