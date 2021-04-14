require("dotenv").config();

import serverless from "serverless-http";
import { log } from "@/libraries/Log";
import { setupDB } from "@/db";
import { app } from "@/server";

const serverHandler = serverless(app, {
  binary: ["application/pdf"],
});

process.env.TZ = "UTC"; // IMPORTANT For correct timezone management with DB, Tasks etc.

let connected = false;

export const handler = async (event, context) => {
  if (!connected) {
    try {
      await setupDB();
      connected = true;
    } catch (err) {
      log.error(err);
    }
  }
  return serverHandler(event, context);
};
