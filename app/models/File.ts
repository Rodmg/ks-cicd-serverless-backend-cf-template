import { Table, Column, DataType, AfterFind } from "sequelize-typescript";
import { BaseModel } from "@/libraries/BaseModel";
import { getPublicReadUrl } from "@/services/FileManagerService";
import { config } from "@/config";

@Table({
  tableName: "file",
})
export class File extends BaseModel<File> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fileName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  path: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isUploaded: boolean;

  @Column({ type: DataType.VIRTUAL })
  get url() {
    return this._url;
  }
  // Calculated property
  _url: string;

  @Column({ type: DataType.VIRTUAL })
  get downloadUrl() {
    return this._downloadUrl;
  }
  // Calculated property
  _downloadUrl: string;

  async populateUrl(): Promise<string> {
    this._url = await getPublicReadUrl(this.path, config.aws.s3.fileBucketName);
    this._downloadUrl = await getPublicReadUrl(
      this.path,
      config.aws.s3.fileBucketName,
      true,
      this.fileName,
    );
    return this._url;
  }

  @AfterFind
  static populateUrl(files: File | File[]) {
    if (Array.isArray(files)) {
      return Promise.all(files.map(p => p.populateUrl()));
    }
    return files.populateUrl();
  }
}
