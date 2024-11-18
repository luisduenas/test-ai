import type { ResolverProps } from '@composabase/sdk'
import { AdapterOpenAI } from "@gqlpt/adapter-openai";
import { GQLPTClient } from "gqlpt";
import { graphQLSchema } from "@composabase/sdk"
import { client } from '@composabase/client'

const graphqlGenClient = async () => {
  const client = new GQLPTClient({
    typeDefs: graphQLSchema.schemaComposer.toSDL(),
    adapter: new AdapterOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
    excludedQueries: ["textToQuery"],
    maxRetries: 3,
  });

  await client.connect();

  return client;
}

const generateQueryAndVariables = async (text: string) => {
  type SchemaData = {
    [key: string]: {
      queries: string[];
    };
  };
  const schemaData: SchemaData = {}
  Object.entries(graphQLSchema.schemaComposer.Query.getFields()).forEach(([key, value]) => {
    if (!value.astNode) {
      return;
    }
    if (graphQLSchema.schemaComposer.has(key)) {
      schemaData[key] = {
        queries: graphQLSchema.schemaComposer.getOTC(key).getFieldNames()
      }
    }
    const queryName = `${key}Query`;
    if (graphQLSchema.schemaComposer.has(queryName)) {
      schemaData[key] = {
        queries: graphQLSchema.schemaComposer.getOTC(queryName).getFieldNames()
      }
    }
  });
  const subgraphs = Object.keys(schemaData);
  const textToQuery = `Available registered queries from the schema to use while generating the GraphQL query:
    ${subgraphs.map(subgraph => {
      return `
        - ${subgraph}:${schemaData[subgraph].queries.map(query => {
          return `
            - ${query}`
        }).join('')}
      `
    }).join('')}
  `;
  console.log(`${text}\n${textToQuery}`);
  const genClient = await graphqlGenClient();
  const response = await genClient.generateQueryAndVariables(
    `${text}\n${textToQuery}`
  );

  return response;
}

export default async function Resolver({ args }: ResolverProps) {
  const { text } = args;

  const response = await generateQueryAndVariables(text);
  const query = response.query.replaceAll('\n', '');
  const variables = response.variables ? response.variables : {};

  const { data, error } = await client.query(query, variables);

  if (error) {
    console.log(JSON.stringify( error, null, 2));
    throw error
  }

  return {
    query,
    variables,
    data,
  }
}