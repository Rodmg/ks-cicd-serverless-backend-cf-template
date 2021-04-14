require("dotenv").config();

import { S3Event } from "aws-lambda";
import { log } from "@/libraries/Log";
import { setupDB } from "@/db";
import { File } from "@/models/File";

let connected = false;

export const handler = async (event: S3Event) => {
  try {
    if (!connected) {
      await setupDB();
      connected = true;
    }
    const s3Record = event.Records[0].s3;
    const key = s3Record.object.key;
    const file: File = await File.findOne({ where: { path: key } });
    file.isUploaded = true;
    await file.save();
  } catch (err) {
    log.error("Error handling file upload:", err);
  }
};
