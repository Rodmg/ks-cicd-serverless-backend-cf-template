"use strict";
const fs = require("fs");
const { config } = require("./src/config");
const template = require("./src/template");

/*
  Generates AWS CloudFormation templates in json format.
    Input: src/template.js
    Output: cloudformation-templates/template.json
*/

async function main() {
  fs.writeFileSync(
    `cloudformation-templates/template.json`,
    JSON.stringify(await template(config), null, 2),
  );
}

main();
