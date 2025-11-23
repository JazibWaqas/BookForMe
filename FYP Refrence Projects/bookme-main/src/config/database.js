require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
    define: { timestamps: true },
  }
);

sequelize
  .authenticate()
  .then(() => console.log("[DB] Connected to PostgreSQL"))
  .catch((err) => console.error("[DB] Connection failed:", err));

module.exports = sequelize;
