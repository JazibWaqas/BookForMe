module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Shows", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      movieId: {
        type: Sequelize.INTEGER,
        references: { model: "Movies", key: "id" },
        onDelete: "CASCADE",
      },
      screenId: {
        type: Sequelize.INTEGER,
        references: { model: "Screens", key: "id" },
        onDelete: "CASCADE",
      },
      startTime: { type: Sequelize.DATE, allowNull: false },
      endTime: { type: Sequelize.DATE, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("Shows");
  },
};
