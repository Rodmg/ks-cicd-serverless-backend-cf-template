"use strict";
const { generateSecret } = require("../util");

module.exports = async config => ({
  GitSource: {
    Type: "String",
    Default: config.gitSource,
    AllowedValues: [
      "BITBUCKET",
      "CODECOMMIT",
      "CODEPIPELINE",
      "GITHUB",
      "GITHUB_ENTERPRISE",
      "NO_SOURCE",
      "S3",
    ],
    Description: "Service where your Git repository is hosted",
  },
  GitLocation: {
    Type: "String",
    Default: config.gitLocation,
    Description: "Url for your Git repository",
  },
  JumpboxSSHAccessIp: config.jumpBox
    ? {
        Type: "String",
        Default: "140.148.249.89/32",
        Description: "Your ip so you can access the jumpbox via SSH",
      }
    : undefined,
  JumpboxSSHKeyPair: config.jumpBox
    ? {
        Type: "String",
        Default: "app-dev",
        Description: "Your key pair so you can access the jumpbox via SSH",
      }
    : undefined,
  AwsRegion: {
    Type: "String",
    Default: "us-east-2",
    Description: "AWS Region to use",
  },
  DBName: {
    Type: "String",
    Default: "appbackend",
    Description: "Name of the DB in PosrgreSQL RDS",
  },
  DBUser: {
    Type: "String",
    Default: "apppsuser",
    Description: "PostgreSQL Username",
  },
  DBPassword: {
    Type: "String",
    Default: await generateSecret(),
    Description: "PostgreSQL Password",
  },
  APIUrl: {
    Type: "String",
    Default: config.apiUrl,
    Description: "Url for the API",
  },
  JwtSecret: {
    Type: "String",
    Default: await generateSecret(),
    Description: "Secret for signing JWTs. TODO: extract to SecretsManager",
  },
});
