import Sequelize, { Model } from "sequelize";

class Show extends Model {
  static init(sequelize) {
    super.init(
      {
        movieId: Sequelize.INTEGER,
        screenId: Sequelize.INTEGER,
        startTime: Sequelize.DATE,
        endTime: Sequelize.DATE,
      },
      { sequelize, timestamps: true }
    );
    return this;
  }
  static associate(models) {
    this.belongsTo(models.Movie, { foreignKey: "movieId" });
    this.belongsTo(models.Screen, { foreignKey: "screenId" });
  }
}

export default Show;
