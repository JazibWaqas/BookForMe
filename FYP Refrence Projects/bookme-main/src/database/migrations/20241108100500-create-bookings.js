module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Bookings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "SET NULL",
      },
      showId: {
        type: Sequelize.INTEGER,
        references: { model: "Shows", key: "id" },
        onDelete: "CASCADE",
      },
      seatId: {
        type: Sequelize.INTEGER,
        references: { model: "Seats", key: "id" },
        onDelete: "CASCADE",
      },
      status: { type: Sequelize.STRING, defaultValue: "booked" },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("Bookings");
  },
};
