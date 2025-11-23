import Sequelize, { Model } from "sequelize";

class Booking extends Model {
  static init(sequelize) {
    super.init(
      {
        userId: Sequelize.INTEGER,
        showId: Sequelize.INTEGER,
        seatId: Sequelize.INTEGER,
        status: Sequelize.STRING,
      },
      { sequelize, timestamps: true }
    );
    return this;
  }
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: "userId" });
    this.belongsTo(models.Show, { foreignKey: "showId" });
    this.belongsTo(models.Seat, { foreignKey: "seatId" });
  }
}

export default Booking;
