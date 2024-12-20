
import { Pinecone } from "@pinecone-database/pinecone";

export const hasIndex = async (pinecone: Pinecone, index: string) => {
  const { indexes = [] } = await pinecone.listIndexes();

  return indexes.some((i: { name: string }) => i.name === index) ?? false;
}

export const waitForIndex = async (pinecone: Pinecone, index: string, retryInterval = 2000, maxRetries = 10) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { status } = await pinecone.describeIndex(index);
    if (status.ready) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, retryInterval));
  }

  throw new Error(`Index '${index}' is not ready after ${maxRetries} attempts.`);
}