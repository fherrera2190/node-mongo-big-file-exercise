require("dotenv").config({ path: `${__dirname}/.env` });

module.exports = {
  mongoDB: process.env.MONGODB_URL,
  options: {
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    connectTimeoutMS: 30000,
    autoIndex: false,
    socketTimeoutMS: 30000,
    user: process.env.MONGODB_USER,
    pass: process.env.MONGODB_PASSWORD,
    authSource: process.env.MONGODB_AUTHDB,
  },
  batchSize: process.env.BATCH_SIZE || 10000,
};
