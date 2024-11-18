import {
  parse,
  print,
  visit,
} from "graphql";

type EmbedArguments = {
  namespace: string;
  indexName: string;
}

// export async function embed({
//   namespace,
//   indexName,
// }: EmbedArguments) {

//   await pinecone.createIndex({
//     name: indexName,
//     dimension: 1536,
//     metric: 'cosine',
//     spec: {
//       serverless: {
//         cloud: 'aws',
//         region: 'us-east-1'
//       }
//     }
//   }).finally(() => {
//     console.log('Index created');
//   });

//   await gqlptClient.connect();

//   const index = pinecone.index(indexName);

//   // // Clear existing entries by schema hash (Pinecone doesn't support complex queries, so we assume reindexing)
//   const schemaNodes: any[] = [];
//   const parsedSchema = parse(gqlptClient.getTypeDefs() as string);

//   // Visit schema definitions and collect nodes
//   visit(parsedSchema, {
//     ObjectTypeDefinition: (node) => {
//       const typeNode = {
//         id: `${gqlptClient.schemaHash}-${node.name.value}`,  // Unique ID for Pinecone
//         name: node.name.value,
//         kind: "ObjectType",
//         definition: print(node),
//         schemaHash: gqlptClient.schemaHash,
//       };
//       schemaNodes.push(typeNode);

//       for (const field of node?.fields || []) {
//         const fieldNode = {
//           id: `${gqlptClient.schemaHash}-${node.name.value}-${field.name.value}`,
//           name: field.name.value,
//           kind: "Field",
//           type: field.type.toString(),
//           definition: print(field),
//           schemaHash: gqlptClient.schemaHash,
//           parentType: node.name.value,
//         };
//         schemaNodes.push(fieldNode);
//       }
//     },
//   });

//   // Loop through schema nodes and store in Pinecone
//   for (const node of schemaNodes) {
//     const vector = await embeddings.embedQuery(JSON.stringify(node));

//     await index.namespace(namespace).upsert([
//       {
//         id: node.id,
//         values: vector,
//         metadata: node,
//       },
//     ]);

//     console.log(`Upserted ${node.id} - ${node.name} to Pinecone`);
//   }

//   console.log('Uploaded schema to Pinecone');
// }