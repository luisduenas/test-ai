import { GQLPTClient, GQLPTClientOptions } from "gqlpt";
import { graphQLSchema } from "@composabase/sdk"
import { AdapterOpenAI } from "@gqlpt/adapter-openai";

type GQLPTClientComposabaseOptions = Omit<GQLPTClientOptions, 'adapter'> & {
  adapter: 'openai' | 'anthropic';
};

function calculateAdapter(adapterName: 'openai' | 'anthropic') {
  if (adapterName === 'openai') {
    return new AdapterOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  else {
    throw new Error('Adapter not implemented');
  }
} 

export const getGQLPTClient = async ({
  typeDefs,
  excludedQueries = [],
  adapter,
  maxRetries = 3,
}:GQLPTClientComposabaseOptions) => {

  const client = new GQLPTClient({
    typeDefs: typeDefs ? typeDefs : graphQLSchema.schemaComposer.toSDL(),
    adapter: calculateAdapter(adapter), 
    excludedQueries,
    maxRetries,
  });

  await client.connect();

  return client;
}