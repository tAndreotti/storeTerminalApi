import fs from "fs";
import path from "path";
import aws, { S3 } from "aws-sdk";
import mime from "mime";
import uploadConfig from "@config/upload";
import { error } from "console";

export default class DiskStorageProvider {
  private client: S3;

  constructor() {
    this.client = new aws.S3({
      apiVersion: "2012-10-17",
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })
  }

  public async saveFile(file: string): Promise<string> {
    const originalPath = path.resolve(uploadConfig.tmpFolder, file);

    const ContentType = mime.getType(originalPath);

    if (!ContentType) {
      throw new Error("File not found.");
    }

    const fileContent = await fs.promises.readFile(originalPath);

    await this.client.putObject({
      Bucket: uploadConfig.config.aws.bucket,
      Key: file,
      ACL: "public-read",
      Body: fileContent,
      ContentType,
    }).promise();

    await fs.promises.unlink(originalPath);

    return file;
  }

  public async deleteFile(file: string): Promise<void> {
    await this.client.deleteObject({
      Bucket: uploadConfig.config.aws.bucket,
      Key: file
    }).promise();
  }
}
