import { createReadStream } from "node:fs";
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
export function createStorage(config) {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  const bucket = config.bucket;
  return {
    async ready() {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    },
    async initialize() {
      try {
        await this.ready();
      } catch (error) {
        if (
          error.$metadata?.httpStatusCode !== 404 &&
          error.name !== "NotFound"
        )
          throw error;
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    },
    async put(key, bytes, mime) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: mime,
        }),
      );
    },
    async putFile(key, filename, mime, size) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: createReadStream(filename),
          ContentType: mime,
          ContentLength: size,
        }),
      );
    },
    async stream(key, range) {
      const result = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key, Range: range }),
      );
      return result.Body;
    },
    async get(key) {
      const r = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      return Buffer.from(await r.Body.transformToByteArray());
    },
    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    close() {
      client.destroy();
    },
  };
}
