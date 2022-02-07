const { DataTypes, Model } = require('sequelize')
const db = require('./db.client.js')

class Destination extends Model {}

Destination.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Destination',
    tableName: 'destinations',
  },
)

module.exports = Destination
