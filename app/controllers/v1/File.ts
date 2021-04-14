import { ModelController } from "@/libraries/ModelController";
import {
  Controller,
  handleServerError,
  parseBody,
  parseId,
} from "@/libraries/Controller";
import { File } from "@/models/File";
import { Request, Response, Router } from "express";
import { validateJWT } from "@/policies/General";
import {
  deleteS3File,
  getPublicUploadUrl,
} from "@/services/FileManagerService";
import { config } from "@/config";
import { v4 as uuidv4 } from "uuid";
import { extname } from "path";
import { validateBody } from "@/libraries/Validator";
import { FileSchema } from "@/validators/File";
import mime from "mime-types";

export class FileController extends ModelController<File> {
  constructor() {
    super();
    this.name = "file";
    this.model = File;
  }

  routes(): Router {
    this.router.get("/", validateJWT("access"), (req, res) =>
      this.handleFindAll(req, res),
    );

    this.router.get("/:id", validateJWT("access"), (req, res) =>
      this.handleFindOne(req, res),
    );

    /*
      File upload is a 2 step process:
      1. Post here to create the db representation of the file, you will get the upload url in the response
      2. Upload the file to that url
    */
    this.router.post(
      "/",
      validateJWT("access"),
      validateBody(FileSchema),
      (req, res) => this.handleCreate(req, res),
    );

    this.router.put(
      "/:id",
      validateJWT("access"),
      validateBody(FileSchema),
      (req, res) => this.handleUpdate(req, res),
    );

    this.router.delete("/:id", validateJWT("access"), (req, res) =>
      this.deleteFile(req, res),
    );

    return this.router;
  }

  private async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      const file: File = await File.findByPk(parseId(req));
      await this.handleDelete(req, res); // Deletes File from db

      const key = file.path
        .split("/")
        .slice(-2)
        .join("/");

      // Delete from S3
      const params = {
        Bucket: config.aws.s3.fileBucketName,
        Key: key,
      };
      await deleteS3File(params);
    } catch (error) {
      handleServerError(error, res);
    }
  }

  async handleCreate(req: Request, res: Response) {
    try {
      const values = parseBody(req);
      const { type, fileName } = values;
      const extension = extname(fileName);
      const path = `${type}/${uuidv4()}${extension}`;
      const contentType =
        mime.contentType(fileName) || "application/octet-stream";

      const created = await this.create({
        type,
        fileName,
        path,
        isUploaded: false,
      });
      const result = {
        ...created.toJSON(),
        uploadUrl: await getPublicUploadUrl(
          path,
          contentType,
          config.aws.s3.fileBucketName,
        ),
      };
      return Controller.created(res, result);
    } catch (err) {
      handleServerError(err, res);
    }
  }
}

const file = new FileController();
export default file;
