import type { ResolverProps, } from '@composabase/sdk'
import { client } from '@composabase/client'
import { hasIndex, waitForIndex } from "@composabase/utils/pinecone";
import { Pinecone } from '@pinecone-database/pinecone';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export default async function Resolver({ args }: ResolverProps) {
  const { term } = args;
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!
  });

  const graphql_query = `
query MyQuery {
  drupal_subgraph {
    nodeRecipes(first: 10) {
      nodes {
        id
        ingredients
        summary {
          value
        }
        title
      }
    }
  }
}
`;

  const drupal_recipes = await client.query(graphql_query, {}).toPromise()
    .then(response => {
      return response.data.drupal_subgraph.nodeRecipes.nodes;
    })
    .catch(error => {
      console.error('Error:', error);
    });

  const model = 'multilingual-e5-large';

  const embeddings = await pc.inference.embed(
    model,
    drupal_recipes.map((rcp: string) => JSON.stringify(rcp)),
    { inputType: 'passage', truncate: 'END' }
  );

  const indexName = "example-index"

  if (!await hasIndex(pc, indexName)) {

    await pc.createIndex({
      name: indexName,
      dimension: 1024,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });
    await waitForIndex(pc, indexName);

  }

  const index = pc.index(indexName);
  const records = await Promise.all(drupal_recipes.map(async (recipe: { id: number, title: string; summary: { value: string; }; ingredients: Array<string>; }, i: number) => {

    const enrichedObject = await generateObject({
      model: openai('gpt-4-turbo'),
      temperature: 0.5,
      maxTokens: 1024,
      schema: z.object({
        recipe: z.object({
          title: z.string(),
          country: z.string(),
          price: z.number(),
          ingredients: z.array(z.string()),
        }),
      }),
      prompt: `Given the following recipe, assume the country of origin and the aproximate price in USD. ${JSON.stringify(recipe)}`,
    });

    return {
      id: recipe.id,
      values: embeddings[i].values,
      metadata: { title: recipe.title, summary: recipe.summary.value, ingredients: recipe.ingredients, originCountry: enrichedObject.object.recipe.country, price: enrichedObject.object.recipe.price }
    }
  }));


  await index.namespace('example-namespace').upsert(records);

  const query = [
    `${term}`,
  ];

  // Convert the query into a numerical vector that Pinecone can search with
  const queryEmbedding = await pc.inference.embed(
    model,
    query,
    { inputType: 'query' }
  );

  // Search the index for the three most similar vectors
  const queryResponse = await index.namespace("example-namespace").query({
    topK: 3,
    vector: queryEmbedding[0].values!,
    includeValues: true,
    includeMetadata: true
  });

  const matches = queryResponse.matches.map((match) => {
    return match.metadata;
  });

  return matches;
}
