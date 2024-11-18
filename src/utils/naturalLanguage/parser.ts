import { graphQLSchema } from "@composabase/sdk"
import { getGQLPTClient } from "@composabase/utils/naturalLanguage";

import {
  InputTypeComposer,
  InterfaceTypeComposer,
  ObjectTypeComposer,
  ObjectTypeComposerArgumentConfigMap,
} from "graphql-compose";

import { 
  VectorStoreBaseConfig,
  EmbeddingBaseConfig,
  getEmbeddingAdapter,
  getVectoreStoreAdapter,
} from "@composabase/utils/adapters";


type Metadata = {
  kind: string;
  name: string;
  parentType: string | null;
  definition: string;
}

type Match = {
  metadata: Metadata;
  score: number;
  id: string;
}

type ProcessArguments = ObjectTypeComposerArgumentConfigMap<any> | undefined | ObjectTypeComposerArgumentConfigMap<any>;

type ProcessFieldTypesType = ObjectTypeComposer<any, any> | InterfaceTypeComposer<any, any> | InputTypeComposer<any>;

type ParseArguments = {
  plainText: string;
  numberOfRetries?: number;
  // generativeAI?: GenerativeAIOptions
  embedding: EmbeddingBaseConfig,
  vectorStore: VectorStoreBaseConfig
}

const typeMap: {
  [key: string]: {
    sdl: string,
    parent: string | null,
    name: string | null,
  }
} = {};

function isInputObjectType(type: string) {
  return graphQLSchema.schemaComposer.isInputObjectType(type);
}

function isObjectType(type: string) {
  return graphQLSchema.schemaComposer.isObjectType(type);
}

function isEnumType(type: string) {
  return graphQLSchema.schemaComposer.isEnumType(type);
}

function isUnionType(type: string) {
  return graphQLSchema.schemaComposer.isUnionType(type);
}

function isScalarType(type: string) {
  return graphQLSchema.schemaComposer.isScalarType(type);
}

function cleanUpType(type: string) {
  return type
    .replaceAll("!", "")
    .replaceAll("[", "")
    .replaceAll("]", "");
}

function processMetadata(metadata: Metadata, subgraphs: string[]) {
  const fieldTypes = [
    "Field",
    "FieldDefinition"
  ]

  if (fieldTypes.includes(metadata.kind) || subgraphs.length > 0 && subgraphs.includes(metadata.parentType!)) {
    const queryField = metadata.parentType ?
      graphQLSchema
        .schemaComposer
        .getOTC(metadata.parentType)
        .getField(metadata.name) :
      graphQLSchema.schemaComposer.Query.getField(metadata.name);

    typeMap[metadata.name] = {
      sdl: metadata.definition,
      parent: metadata.parentType,
      name: metadata.name,
    };

    const args = queryField.args;
    processArguments(args, subgraphs);

    const typeName = cleanUpType(queryField.type.getTypeName());
    const typeSDL = graphQLSchema
      .schemaComposer
      .getTypeSDL(typeName);
    const typeMetadata: Metadata = {
      kind: "ObjectTypeDefinition",
      name: typeName,
      parentType: null,
      definition: typeSDL,
    };
    processMetadata(typeMetadata, subgraphs);
  }

  if (metadata.kind === "ObjectTypeDefinition") {
    typeMap[metadata.name] = {
      sdl: metadata.definition,
      parent: metadata.parentType,
      name: metadata.name,
    };
    const type = graphQLSchema
      .schemaComposer
      .getOTC(metadata.name);
    type.getInterfacesTypes().forEach((interfaceType) => {
      const interfaceSDL = graphQLSchema
        .schemaComposer
        .getIFTC(interfaceType.name)
        .toSDL();
      const interfaceMetadata: Metadata = {
        kind: "InterfaceTypeDefinition",
        name: interfaceType.name,
        parentType: null,
        definition: interfaceSDL,
      };
      processMetadata(interfaceMetadata, subgraphs);
    });

    processFieldTypes(type, subgraphs);
  }

  if (metadata.kind === "InterfaceTypeDefinition") {
    typeMap[metadata.name] = {
      sdl: metadata.definition,
      parent: metadata.parentType,
      name: metadata.name,
    };
    const type = graphQLSchema
      .schemaComposer
      .getIFTC(metadata.name);

    type.getInterfacesTypes().forEach((interfaceType) => {
      const interfaceSDL = graphQLSchema
        .schemaComposer
        .getIFTC(interfaceType.name)
        .toSDL();
      const interfaceMetadata: Metadata = {
        kind: "InterfaceTypeDefinition",
        name: interfaceType.name,
        parentType: null,
        definition: interfaceSDL,
      };
      processMetadata(interfaceMetadata, subgraphs);
    });
  }

  if (metadata.kind === "InputObjectTypeDefinition") {
    typeMap[metadata.name] = {
      sdl: metadata.definition,
      parent: null,
      name: metadata.name,
    };
    const type = graphQLSchema
      .schemaComposer
      .getITC(metadata.name);

    processFieldTypes(type, subgraphs);
  }
}

function processArguments(args: ProcessArguments, subgraphs: string[]) {
  // @ts-ignore
  Object.entries(args).forEach(([argName, arg]) => {
    const argType = cleanUpType(arg.type.getTypeName());
    if (!typeMap[argType] && graphQLSchema.schemaComposer.has(argType)) {
      const argTypeSDL = graphQLSchema.schemaComposer.getTypeSDL(argType);
      typeMap[argType] = {
        sdl: argTypeSDL,
        parent: null,
        name: null,
      };
      if (isInputObjectType(argType)) {
        const inputType = graphQLSchema.schemaComposer.getITC(argType);
        const inputTypeSDL = inputType.toSDL();
        const inputTypeMetadata: Metadata = {
          kind: "InputObjectTypeDefinition",
          name: argType,
          parentType: null,
          definition: inputTypeSDL,
        };

        processMetadata(inputTypeMetadata, subgraphs);
      }
    }
  });
}

function processFieldTypes(type: ProcessFieldTypesType, subgraphs: string[]) {
  type.getFieldNames().forEach((fieldName) => {
    const field = type.getField(fieldName);
    const fieldTypeName = cleanUpType(field.type.getTypeName());

    if (field.astNode?.kind === 'FieldDefinition') {
      const args = field.args;
      // @ts-ignore
      processArguments(args, subgraphs);
    }

    if (!typeMap[fieldTypeName] && graphQLSchema.schemaComposer.has(fieldTypeName)) {
      if (isScalarType(fieldTypeName)) {
        const typeFieldType = graphQLSchema.schemaComposer.getSTC(fieldTypeName);
        const typeFieldTypeSDL = typeFieldType.toSDL();
        typeMap[fieldTypeName] = {
          sdl: typeFieldTypeSDL,
          parent: null,
          name: null,
        };
      }

      if (isUnionType(fieldTypeName)) {
        const typeFieldType = graphQLSchema.schemaComposer.getUTC(fieldTypeName);
        const typeFieldTypeSDL = typeFieldType.toSDL();
        typeMap[fieldTypeName] = {
          sdl: typeFieldTypeSDL,
          parent: null,
          name: null,
        };
        typeFieldType.getTypes().forEach((unionType) => {
          const unionTypeSDL = graphQLSchema
            .schemaComposer
            .getOTC(unionType.getTypeName())
            .toSDL();
          const unionMetadata: Metadata = {
            kind: "ObjectTypeDefinition",
            name: unionType.getTypeName(),
            parentType: null,
            definition: unionTypeSDL,
          };
          processMetadata(unionMetadata, subgraphs);
        });
      }

      if (isEnumType(fieldTypeName)) {
        const typeFieldType = graphQLSchema.schemaComposer.getETC(fieldTypeName);
        const typeFieldTypeSDL = typeFieldType.toSDL();
        typeMap[fieldTypeName] = {
          sdl: typeFieldTypeSDL,
          parent: null,
          name: null,
        };
      }

      if (isObjectType(fieldTypeName)) {
        const typeFieldType = graphQLSchema.schemaComposer.getOTC(fieldTypeName);
        const typeFieldTypeSDL = typeFieldType.toSDL();
        typeMap[fieldTypeName] = {
          sdl: typeFieldTypeSDL,
          parent: null,
          name: null,
        };
        const fieldMetadata: Metadata = {
          kind: "ObjectTypeDefinition",
          name: fieldTypeName,
          parentType: null,
          definition: typeFieldTypeSDL,
        };

        processMetadata(fieldMetadata, subgraphs);
      }

      if (isInputObjectType(fieldTypeName)) {
        const typeFieldType = graphQLSchema.schemaComposer.getITC(fieldTypeName);
        const typeFieldTypeSDL = typeFieldType.toSDL();
        typeMap[fieldTypeName] = {
          sdl: typeFieldTypeSDL,
          parent: null,
          name: null,
        };
        const fieldMetadata: Metadata = {
          kind: "InputObjectTypeDefinition",
          name: fieldTypeName,
          parentType: null,
          definition: typeFieldTypeSDL,
        };

        processMetadata(fieldMetadata, subgraphs);
      }
    }

    const args = field.args ?? [];
    // @ts-ignore
    processArguments(args, subgraphs);
  });
}

export async function parse({
  plainText,
  numberOfRetries = 3,
  embedding,
  vectorStore,
}: ParseArguments) {
  // EmbeddingAdapter
  // const embeddingAdapter = openai(embedding.options);
  const embeddingAdapter = getEmbeddingAdapter(embedding);
  const queryVector = await embeddingAdapter.embedQuery(plainText);
  // EmbeddingAdapter

  // VectoreStoreAdapter
  const vectoreStoreAdapter = getVectoreStoreAdapter(vectorStore);
  // VectoreStoreAdapter

  const subgraphQueryMap: {
    [key: string]: {
      query: string,
      cleanUpType: string,
    }
  } = {};
  const subgraphs = Object.keys(graphQLSchema.schemaComposer.Query.getFields()).
    filter(
      (subgraph) => {
        const  supergraphType = cleanUpType(
          graphQLSchema.schemaComposer.Query.getField(subgraph).type.getTypeName()
        );

        return supergraphType.endsWith('Query')
      }
    );
  const subgraphQuery = subgraphs.map(
    (subgraph) => {
      const queryName = graphQLSchema
        .schemaComposer
        .Query
        .getField(subgraph)
        .type
        .getTypeName();
      subgraphQueryMap[subgraph] = {
        query: queryName,
        cleanUpType: cleanUpType(queryName),
      };
      return cleanUpType(queryName);
    }
  );

  // @todo remove filter if no subgraphQuery 
  const searchResults = await vectoreStoreAdapter.query({
    topK: 3,
    vector: queryVector,
    includeMetadata: true,
    filter: {
      "parentType": { "$in": subgraphQuery },
    }
  });

  const subgraphsWithResults: (string | null)[] = []
  searchResults.matches.forEach((match: Match) => {
    if (!subgraphsWithResults.includes(match.metadata.parentType)) {
      subgraphsWithResults.push(match.metadata.parentType);
    }
  });

  const queryKeyValue: { [key: string]: string } = {};
  subgraphsWithResults.forEach(
    (subgraph) => {
      Object.entries(subgraphQueryMap).forEach(([key, value]) => {
        if (value.cleanUpType === subgraph) {
          queryKeyValue[key] = value.query;
        }
      });
    }
  )

  const queryKeyValueString = Object.entries(queryKeyValue).map(
    ([key, value]) => `${key}: ${value}`
  ).join('\n  ');

  typeMap['Query'] = {
    sdl: `type Query {
  ${queryKeyValueString}
}`,
    parent: null,
    name: null,
  }

  searchResults.matches.forEach((match: Match) => {
    const metadata = match.metadata;
    processMetadata(metadata, subgraphs);
  });

  const queries: {
    [key: string]: { sdl: string, name: string }[]
  } = {};
  Object.entries(typeMap).map(([key, value]) => {
    if (value.parent) {
      if (!queries[value.parent]) {
        queries[value.parent] = [];
      }
      queries[value.parent].push({
        sdl: value.sdl,
        name: value.name!
      });
    }
  });

  let partialSchema = ''
  partialSchema += Object.entries(queries).map(([key, value]) => {
    const sdl = value.map((field) => {
      return `${field.sdl}`;
    });
    return `type ${key} {
  ${sdl.join('\n  ')}
}\n\n`
  }).join('\n');

  partialSchema += Object.entries(typeMap).map(([key, value]) => {
    if (!value.parent) {
      return value.sdl;
    }
  }).join('\n');

  const client = await getGQLPTClient({
    typeDefs: partialSchema,
    adapter: 'openai',
    excludedQueries: ["textToQuery", "naturalLanguageQuery"],
    maxRetries: numberOfRetries,
  });

  // const textToQuery = `Available registered queries from the schema to use while generating the GraphQL query:
  // ${Object.entries(subgraphQueryMap).map(([key]) => {
  //   const subgraph = subgraphQueryMap[key];
  //   return `
  //   ${key}:${queries[subgraph.cleanUpType].map((query) => {
  //     return `
  //     - ${query.name}`
  //   }).join('')}
  //   `
  // }).join('')}`;

  const { query, variables } = await client.generateQueryAndVariables(
    `${plainText}`
  );

  return {
    query,
    variables,
  };
}
