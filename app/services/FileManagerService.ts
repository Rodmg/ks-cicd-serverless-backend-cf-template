import aws from "aws-sdk";
import { config } from "@/config";
import { log } from "@/libraries/Log";
import { retry } from "@/libraries/util";

const s3 = new aws.S3({
  endpoint: config.env === "development" ? "http://localhost:4566" : undefined,
  s3ForcePathStyle: true,
});

export const deleteS3File = async (params: aws.S3.DeleteObjectRequest) => {
  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    log.error(error);
    throw error;
  }
};

export const getS3File = async (params: aws.S3.GetObjectRequest) => {
  try {
    const s3Object = await s3.getObject(params).promise();
    if (
      s3Object == null ||
      s3Object.Body == null ||
      s3Object.ContentLength == 0
    ) {
      return null;
    }

    return s3Object;
  } catch (error) {
    // Catching NoSuchKey
    if (error.statusCode === 404) {
      return null;
    }
    log.error(error);
    throw error;
  }
};

export const getS3List = async (params: aws.S3.ListObjectsV2Request) => {
  try {
    const s3Object = await s3.listObjectsV2(params).promise();
    if (
      s3Object == null ||
      s3Object.Contents == null ||
      s3Object.Contents.length == 0
    ) {
      return null;
    }

    return s3Object;
  } catch (error) {
    // Catching NoSuchKey
    if (error.statusCode === 404) {
      return null;
    }
    log.error(error);
    throw error;
  }
};

export const putS3File = async (params: aws.S3.PutObjectRequest) => {
  try {
    const putResponse = await s3.putObject(params).promise();

    return putResponse;
  } catch (error) {
    log.error(error);
    throw error;
  }
};

export const getS3FileStream = async (params: aws.S3.GetObjectRequest) => {
  try {
    // Retrieve metadata first to validate object exists
    await s3.headObject(params).promise();
    const objectStream = s3.getObject(params).createReadStream();

    return objectStream;
  } catch (error) {
    // Catching NoSuchKey
    if (error.statusCode === 404) {
      return null;
    }
    log.error(error);
    throw error;
  }
};

export const getPublicReadUrl = (
  path: string,
  bucket: string,
  download = false,
  fileName = "",
): Promise<string> => {
  const params = {
    Bucket: bucket,
    Key: path,
    Expires: 10 * 60, // 10 minutes
    ResponseContentDisposition: download
      ? `attachment; filename="${fileName}"`
      : undefined,
  };
  return retry<string>(() => s3.getSignedUrlPromise("getObject", params)).catch(
    err => {
      log.error("Error getting signed url.", err);
      return "";
    },
  );
};

export const getPublicUploadUrl = (
  path: string,
  contentType: string,
  bucket: string,
): Promise<string> => {
  const params = {
    Bucket: bucket,
    Key: path,
    ContentType: contentType,
    Expires: 10 * 60, // 10 minutes
  };
  return retry<string>(() => s3.getSignedUrlPromise("putObject", params)).catch(
    err => {
      log.error("Error getting signed url.", err);
      return "";
    },
  );
};
