import sequelize from "../config/database";
import fs from "fs";

const modelFiles = fs
  .readdirSync(__dirname + "/../models/")
  .filter((file) => file.endsWith(".js"));

const sequelizeService = {
  init: async () => {
    try {
      const connection = sequelize;

      for (const file of modelFiles) {
        const model = await import(`../models/${file}`);
        if (model.default.init) {
          model.default.init(connection);
        }
      }

      for (const file of modelFiles) {
        const model = await import(`../models/${file}`);
        if (model.default.associate) {
          model.default.associate(connection.models);
        }
      }

      console.log("[SEQUELIZE] Database service initialized");
    } catch (error) {
      console.log("[SEQUELIZE] Error during database service initialization");
      throw error;
    }
  },
  getInstance: () => sequelize,
};

export default sequelizeService;
