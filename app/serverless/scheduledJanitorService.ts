/*
  scheduledJanitorService.ts
  Eample on how to implement a scheduled task in serverless
  (see serverless.yml for scheduling configuration)
*/
require("dotenv").config();

import { setupDB } from "@/db";
import { log } from "@/libraries/Log";
import janitorService from "@/services/JanitorService";

let isConnected = false;

export const handler = async () => {
  if (!isConnected) {
    try {
      await setupDB();
      isConnected = true;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }

  await janitorService.clean();
};
