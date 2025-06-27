const config = require("./config/config");
const workerpool = require("workerpool");
const Records = require("./records.model");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

async function guardarBatchEnMongo(batch) {
  try {
    const mongoDB = config.mongoDB;
    const options = config.options;
    await mongoose.connect(mongoDB, options);
    if (!Array.isArray(batch) || batch.length === 0)
      return { insertedCount: 0 };
    const result = await Records.insertMany(batch);
    return { insertedCount: result.insertedCount };
  } catch (error) {
    //tarea: agrega un log
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

workerpool.worker({
  guardarBatchEnMongo,
});
