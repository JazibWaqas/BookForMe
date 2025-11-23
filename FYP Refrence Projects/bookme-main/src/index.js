import dotenv from "dotenv";
import expressService from "./services/express.service";
import sequelizeService from "./services/sequelize.service";
import awsService from "./services/aws.service";
import redisService from "./services/redis.service";
dotenv.config();

const services = [expressService, awsService, sequelizeService];

(async () => {
  try {
    for (const service of services) {
      await service.init();
    }
    console.log("Server initialized.");
    await redisService.init();
    console.log("Redis initialized.");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})();
