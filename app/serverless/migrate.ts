require("dotenv").config();

import { log } from "@/libraries/Log";
import { db } from "@/db";
import path from "path";
import Umzug from "umzug";

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, "./../migrations"),
    params: [db.getQueryInterface()],
  },
  storage: "sequelize",
  storageOptions: {
    sequelize: db,
  },
});

export const handler = async () => {
  try {
    await umzug.up();
    log.info("MIGRATIONS DONE");
  } catch (err) {
    log.error(err);
    return false;
  }
  return true;
};
