const { Sequelize } = require('sequelize')

// database
const sequelize = new Sequelize(
    'd4r694brgd4n2l',
    'gynbskvhsqvgbs',
    '7a0792ab98a78fe845ad57189a2febaa093f341fd1fa8412eddcbe379d231592',
    {
        host: 'ec2-52-30-133-191.eu-west-1.compute.amazonaws.com',
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
);

// authentication and synchronization
sequelize.authenticate()
  .then(() => {
    sequelize.sync().catch(() => console.log("Cannot sync the database"));
  })
  .catch(() => console.log("Cannot connect to database, please check environment credentials"));

module.exports = sequelize;
