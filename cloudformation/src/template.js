"use strict";
const parameters = require("./components/parameters");
const network = require("./components/network");
const db = require("./components/db");
const cache = require("./components/cache");
const storage = require("./components/storage");
const jumpbox = require("./components/jumpbox");
const cicd = require("./components/cicd");
const backup = require("./components/backup");

/*
  Base CloudFormation template (JSON format)
    We are defining it in JS for flexibility
*/

module.exports = async config => ({
  AWSTemplateFormatVersion: "2010-09-09",
  Description: `Base Environment Configuration for ${config.appName}`,
  Parameters: await parameters(config),
  Resources: {
    ...network(config),
    ...db(config),
    ...(config.cache ? cache(config) : {}),
    ...storage(config),
    ...(config.jumpBox ? jumpbox(config) : {}),
    ...cicd(config),
    ...(config.backup ? backup(config) : {}),
  },
  Outputs: {},
});
