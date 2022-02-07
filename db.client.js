const { Sequelize } = require('sequelize')

// database
const sequelize = new Sequelize(
    'd85p80rig2uv9p',
    'qbqsdwhqmyufuf',
    'bf4c98990d75a6486ce87b82807bd92dec440e5d7fb4b6f59fce859914c04c2f',
    {
        host: 'ec2-52-19-170-215.eu-west-1.compute.amazonaws.com',
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
