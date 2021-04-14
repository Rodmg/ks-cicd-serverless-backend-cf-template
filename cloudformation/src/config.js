"use strict";

const config = {
  appName: "app",
  env: "production",
  backendBranch: "master",
  jumpBox: true,
  natGateway: true,
  cache: false,
  backup: true,
  dbDeletionPolicy: "Snapshot",
  s3DeletionPolicy: "Retain",
  apiUrl: "api.example.com",
  appUrl: "example.com",
};

module.exports = {
  config,
};
