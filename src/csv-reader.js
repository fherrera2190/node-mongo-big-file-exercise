const { workerData } = require("worker_threads");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const os = require("os");

const workerpool = require("workerpool");

const config = require("./config/config");

//create poolworkers
const pool = workerpool.pool(path.resolve(__dirname, "./worker.js"), {
  maxWorkers: os.cpus().length - 1,
  // maxWorkers: 4,
});

const BATCH_SIZE = config.batchSize;

let batch = [];
const pendingTasks = [];

fs.createReadStream(path.resolve((__dirname, workerData)))
  .pipe(csv())
  .on("data", (row) => {
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      const currentBatch = batch;
      const task = pool.exec("guardarBatchEnMongo", [currentBatch]);
      pendingTasks.push(task);
      batch = [];
    }
  })
  .on("end", async () => {
    if (batch.length > 0) {
      const task = pool.exec("guardarBatchEnMongo", [batch]);
      pendingTasks.push(task);
    }

    try {
      await Promise.all(pendingTasks);
      workerData && fs.unlinkSync(workerData);
    } catch (err) {
      console.error("❌ Error en el procesamiento de lotes:", err);
    } finally {
      await pool.terminate();
      console.log("✅ Pool cerrado y proceso finalizado.");
    }
  });
