import type { ResolverProps } from '@composabase/sdk'
import { Pinecone } from '@pinecone-database/pinecone';

export default async function Resolver({ args }: ResolverProps) {
  const { query } = args;

  const model = 'multilingual-e5-large';
  const namespace = 'composabase-drupal';
  const indexName = "composabase-drupal-index"

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const queryEmbedding = await pc.inference.embed(
    model,
    [query],
    { inputType: 'query' }
  );

  const index = pc.index(indexName);

  const queryResponse = await index.namespace(namespace).query({
    topK: 3,
    vector: queryEmbedding[0].values!,
    includeValues: false,
    includeMetadata: true
  });

  const matches = queryResponse.matches.map((match) => {
    return match.metadata;
  });

  return matches;
}
