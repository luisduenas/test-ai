import { EmbeddingBaseConfig, EmbeddingProviders } from './types'

export const getEmbeddingAdapter = (config:EmbeddingBaseConfig) => {
  if (!EmbeddingProviders.includes(config.provider)) {
    throw new Error(`Unsupported Embedding Provider: ${config.provider}`)
  }

  return require(`../${config.provider}/embedding.ts`)
    .getAdapter(config.options)
}

export * from './types'
