import { Queue, Worker } from "bullmq";
import pdf from "pdf-poppler";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { createWorker } from "tesseract.js";
import { mainWindow } from "./index";
let progress = 0;
interface Q {
  folderPath: string;
  filePath: string;
  tmpDir: string;
  length: number;
  outputFolder: string;
}

// OCR worker pool
const cpuCount = os.cpus().length;
const POOL_SIZE = Math.max(1, Math.min(8, Math.floor(cpuCount / 2)));
const ocrWorkers: Array<ReturnType<typeof createWorker>> = Array.from(
  { length: POOL_SIZE },
  () => createWorker("por")
);
let nextWorkerIndex = 0;
function getNextOcrWorker() {
  const worker = ocrWorkers[nextWorkerIndex % ocrWorkers.length];
  nextWorkerIndex++;
  return worker;
}

// Track per-folder progress
const folderProgress = new Map<string, { done: number; total: number }>();

// Limit concurrent PDF conversions to avoid CPU/RAM spikes
const maxPdfConvert = Math.max(1, Math.min(4, Math.floor(cpuCount / 2)));
let convertingNow = 0;
const convertWaiters: Array<() => void> = [];
async function withConvertSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (convertingNow >= maxPdfConvert) {
    await new Promise<void>((resolve) => convertWaiters.push(resolve));
  }
  convertingNow++;
  try {
    return await fn();
  } finally {
    convertingNow--;
    const next = convertWaiters.shift();
    if (next) next();
  }
}

export const queue = new Queue("extractText", {
  connection: { host: "127.0.0.1", port: 6379 },
});

export const worker = new Worker(
  "extractText",
  async (job) => {
    if (job.name === "pdf-to-jpg") {
      const { data } = job;
      await parsePdfToJpg({ ...data });
    }
    if (job.name === "ocr") {
      const { data } = job;
      await ocr({ ...data });
    }
  },
  { connection: { host: "127.0.0.1", port: 6379 }, concurrency: 50 }
);



async function parsePdfToJpg({
  folderPath,
  filePath,
  tmpDir,
  length,
  outputFolder,
}: Q) {
  await queue.clean(0, 100, "active")
  const filename = path.basename(filePath).replace(/.pdf/g, "");
  await withConvertSlot(() =>
    pdf.convert(filePath, {
      out_dir: tmpDir,
      format: "jpeg",
      out_prefix: filename,
    })
  );
  //   if (progress >= length) {
  await queue.add("ocr", {
    folderPath,
    filePath,
    tmpDir,
    length,
    outputFolder,
  });
  //   }
}

async function ocr({ ...data }: Q) {
  const filename = path.basename(data.filePath).replace(/.pdf/g, "-1.jpg");
  await fsp.access(path.join(data.tmpDir, filename));
  const { recognize } = await getNextOcrWorker();
  const {
    data: { text },
  } = await recognize(path.join(data.tmpDir, filename));
  const matches = text
    .trim()
    .replace(/—/g, "¨")
    .toLowerCase()
    .match(/[Pres ]\s*(9\d{7,8}|10\d{6,7}|13\d{7,8})/g);
  progress++;
  const baseFolder = data.outputFolder.replace(/ - renomeado/g, "");
  const current = folderProgress.get(baseFolder) || {
    done: 0,
    total: data.length,
  };
  current.done = Math.min(current.done + 1, current.total);
  current.total = data.length;
  folderProgress.set(baseFolder, current);
  mainWindow.webContents.send("file-parsed", {
    progress: current.done,
    totalFiles: current.total,
    path: baseFolder,
  });
  if (matches && matches.length > 0) {
    const newFileName = `${matches[0].replace(/ /g, "").replace("r", "").replace("s", "")}.pdf`;
    const destinationPath = path.resolve(data.outputFolder, newFileName);
    await fsp.copyFile(data.filePath, destinationPath);
    // console.log(text);
  } else {
    // append to erros.txt when code not found
    const errorLine = path.basename(data.filePath) + "\n";
    try {
      await fsp.appendFile(
        path.join(data.outputFolder, "erros.txt"),
        errorLine,
        "utf8"
      );
    } catch {}
  }
}

export async function closeOcrPool(): Promise<void> {
  for (const w of ocrWorkers) {
    const orcWorker = await w;
    // @ts-ignore terminate exists on tesseract orcWorker
    if (typeof orcWorker.terminate === "function") {
      await orcWorker.terminate();
    }
  }
  await queue.close();
  await worker.close()

}
