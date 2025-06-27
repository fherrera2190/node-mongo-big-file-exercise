const config = require("./config/config");
const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const Records = require("./records.model");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const csv = require("csv-parser");

const BATCH_SIZE = config.batchSize;
const mongoDB = config.mongoDB;
const options = config.options;
console.log(BATCH_SIZE);
const start = async () => {
  let batch = [];

  try {
    await mongoose.connect(mongoDB, options);
    const stream = fs.createReadStream(workerData).pipe(csv());

    stream.on("data", async (row) => {
      batch.push(row);

      if (batch.length >= BATCH_SIZE) {
        try {
          stream.pause();
          
          await Records.insertMany(batch);

        } catch (err) {
          parentPort.postMessage("error");
        }
        batch = [];
        stream.resume();
      }
    });

    stream.on("end", async () => {
      try {
        if (batch.length > 0) {
          await Records.insertMany(batch);
        }
        parentPort.postMessage("ok");
      } catch (err) {
        parentPort.postMessage("error");
      } finally {
        await mongoose.disconnect();
        fs.existsSync(workerData) && fs.unlinkSync(workerData);
      }
    });

    stream.on("error", async (err) => {
      await mongoose.disconnect();
      fs.existsSync(workerData) && fs.unlinkSync(workerData);
      parentPort.postMessage("error");
    });
  } catch (error) {
    await mongoose.disconnect();
    fs.existsSync(workerData) && fs.unlinkSync(workerData);
    parentPort.postMessage("error");
  }
};

start();
