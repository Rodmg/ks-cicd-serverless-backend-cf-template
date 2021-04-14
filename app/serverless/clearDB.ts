require("dotenv").config();

import { log } from "@/libraries/Log";
import { setupDBClearData } from "@/db";

export const handler = async () => {
  try {
    await setupDBClearData();
    log.info("CLEAR DONE");
  } catch (err) {
    log.error("ERROR EXECUTING CLEAR:", err.message);
    return false;
  }
  return true;
};
