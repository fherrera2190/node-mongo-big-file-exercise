const { workerData } = require("worker_threads");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");


const workerpool = require('workerpool');

const config = require("./config/config");
const pool = workerpool.pool(path.resolve(__dirname, "./worker.js"));
const BATCH_SIZE = config.batchSize;

console.log(path.resolve(__dirname, workerData))
console.log((__dirname, workerData))

let batch = [];
const pendingTasks = [];

fs.createReadStream(path.resolve((__dirname, workerData)))
    .pipe(csv())
    .on('data', (row) => {
        batch.push(row);

        if (batch.length === BATCH_SIZE) {
            const currentBatch = batch;
            batch = [];

            const task = pool.exec('guardarBatchEnMongo', [currentBatch]);
            pendingTasks.push(task);
        }
    })
    .on('end', async () => {
        // Si quedó un lote parcial
        if (batch.length > 0) {
            const task = pool.exec('guardarBatchEnMongo', [batch]);
            pendingTasks.push(task);
        }

        try {
            const results = await Promise.all(pendingTasks);
            results.forEach((res, i) => {
                console.log(`Lote ${i + 1}: ${res.insertedCount} documentos guardados.`);
            });
        } catch (err) {
            console.error('❌ Error en el procesamiento de lotes:', err);
        } finally {
            await pool.terminate();
            console.log('✅ Pool cerrado y proceso finalizado.');
        }
    });