import Sequelize, { Model } from "sequelize";

class Movie extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        duration: Sequelize.INTEGER,
      },
      { sequelize, timestamps: true }
    );
    return this;
  }
}

export default Movie;
