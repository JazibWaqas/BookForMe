import Sequelize, { Model } from "sequelize";

class Screen extends Model {
  static init(sequelize) {
    super.init(
      {
        theaterId: Sequelize.INTEGER,
        name: Sequelize.STRING,
        totalSeats: Sequelize.INTEGER,
      },
      { sequelize, timestamps: true }
    );
    return this;
  }
  static associate(models) {
    this.belongsTo(models.Theater, { foreignKey: "theaterId" });
  }
}

export default Screen;
