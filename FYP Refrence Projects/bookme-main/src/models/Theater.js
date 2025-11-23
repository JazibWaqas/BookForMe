import Sequelize, { Model } from "sequelize";

class Theater extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        location: Sequelize.STRING,
      },
      { sequelize, timestamps: true }
    );
    return this;
  }
}

export default Theater;
