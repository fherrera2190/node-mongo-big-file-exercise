const Records = require("./records.model");
const { Worker } = require("worker_threads");
const path = require("path");

const upload = async (req, res) => {
  /* Acá va tu código! Recordá que podés acceder al archivo desde la constante file */
  const { file } = req;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const worker = new Worker(path.resolve(__dirname, "csv-reader.js"), {
    workerData: file.path, // o file.buffer si lo tenés en memoria
  });

  worker.on("message", (msg) => {
    console.log("Mensaje del worker:", msg);
  });

  worker.on("error", (err) => {
    console.error("Error en el worker:", err);
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      res.status(500).json({ error: "El worker terminó con error" });
    }
    res.status(200).json({ message: "Upload completed successfully." });
  });
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
