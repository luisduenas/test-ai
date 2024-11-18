import { Pinecone, QueryOptions } from "@pinecone-database/pinecone";
import { PineconeAdapterOptions } from "@composabase/utils/adapters";

export class PineconeAdapter {
  private pinecone: Pinecone;
  private indexName: string;
  private namespace: string;

  constructor({
    apiKey,
    indexName,
    namespace,
  }: PineconeAdapterOptions & { apiKey: string }) {
    this.pinecone = new Pinecone({
      apiKey,
    });
    this.indexName = indexName;
    this.namespace = namespace;

    return this
  }

  public async query(queryOptions: QueryOptions) {
    return await this.pinecone
      .index(this.indexName)
      .namespace(this.namespace)
      .query(queryOptions);
  }
}

export const getAdapter = ({
  indexName,
  namespace,
} :PineconeAdapterOptions): PineconeAdapter => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable is not set');
  }

  return new PineconeAdapter({
    apiKey: process.env.PINECONE_API_KEY,
    indexName,
    namespace,
  });
}
