const config = require("./config/config");
const workerpool = require("workerpool");
const Records = require("./records.model");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
let client;

async function connectDB() {
  if (!client) {
    const mongoDB = config.mongoDB;
    const options = config.options;
    client = await mongoose.connect(mongoDB, options);
  }
}

async function guardarBatchEnMongo(batch) {
  await connectDB();

  if (!Array.isArray(batch) || batch.length === 0) return { insertedCount: 0 };
  const result = await Records.insertMany(batch);
  return { insertedCount: result.insertedCount };
}

workerpool.worker({
  guardarBatchEnMongo,
});
