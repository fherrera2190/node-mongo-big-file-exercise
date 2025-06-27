const Records = require("./records.model");
const { Worker } = require("worker_threads");
const path = require("path");
const csv = require("csv-parser");
const fs = require("fs");

const upload = async (req, res) => {
  /* Acá va tu código! Recordá que podés acceder al archivo desde la constante file */
  const { file } = req;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const worker = new Worker(path.resolve(__dirname, "worker.js"), {
    workerData: file.path,
  });

  try {
    await new Promise((resolve, reject) => {
      worker.on("message", (msg) => {
        if (msg === "ok") {
          resolve();
        } else if (msg === "error") {
          reject(new Error("Worker reported an error"));
        }
      });

      worker.on("error", reject);

      worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });

    return res.status(200).json({ message: "Upload completed successfully." });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Error subiendo los datos" });
  }
};

const list = async (_, res) => {
  try {
    const data = await Records.find({}).limit(10).lean();

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = {
  upload,
  list,
};
