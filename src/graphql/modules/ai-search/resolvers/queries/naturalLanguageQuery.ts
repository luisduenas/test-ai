import type { ResolverProps } from '@composabase/sdk'
import { client } from '@composabase/client'
import { parse } from '@composabase/utils/naturalLanguage';

export default async function Resolver({ args }: ResolverProps) {
  const { plainText } = args;
  const { query, variables } = await parse({
    plainText,
    // Pull data from configuration via context
    embedding: {
      provider: 'openai',
    },
    vectorStore: {
      provider: 'pinecone',
      options: {
        indexName: 'drupal-schema-index',
        namespace: 'drupal-schema-namespace',
      }
    }
    // Pull data from configuration via context
  });

  const { data, error } = await client.query(query, variables);

  if (error) {
    console.log(JSON.stringify(error, null, 2));
    throw error
  }

  return {
    query,
    variables,
    data,
  }

}