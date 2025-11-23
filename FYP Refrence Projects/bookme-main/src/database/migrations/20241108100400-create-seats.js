module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Seats", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      screenId: {
        type: Sequelize.INTEGER,
        references: { model: "Screens", key: "id" },
        onDelete: "CASCADE",
      },
      seatNumber: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, defaultValue: "standard" },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("Seats");
  },
};
