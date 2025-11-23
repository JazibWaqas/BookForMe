import Sequelize, { Model } from "sequelize";

class Seat extends Model {
  static init(sequelize) {
    super.init(
      {
        screenId: Sequelize.INTEGER,
        seatNumber: Sequelize.STRING,
        type: Sequelize.STRING,
      },
      { sequelize, timestamps: true }
    );
    return this;
  }
  static associate(models) {
    this.belongsTo(models.Screen, { foreignKey: "screenId" });
    this.hasMany(models.Booking, { foreignKey: "seatId" });
  }
}

export default Seat;
