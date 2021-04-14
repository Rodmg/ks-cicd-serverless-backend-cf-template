require("dotenv").config();

import { log } from "@/libraries/Log";
import { setupDBAlterSchema } from "@/db";

export const handler = async () => {
  try {
    await setupDBAlterSchema();
    log.info("SCHEMA UPDATE DONE");
  } catch (err) {
    log.error("ERROR EXECUTING SCHEMA UPDATE:", err.message);
    return false;
  }
  return true;
};
