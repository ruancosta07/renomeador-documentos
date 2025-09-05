import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import pdf from "pdf-poppler";
import { createWorker } from "tesseract.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import pLimit from "p-limit";
import sharp from "sharp";
import { mainWindow } from "./index";
dayjs.extend(duration);
let progress = 0;

import { Worker } from "bullmq";

const filesWithError = new Set<string>();

interface PDFQueue {
  filePath: string;
  tmpDir: string;
  outputFolder: string;
}

const worker = new Worker(
  "extractText",
  async (job) => {
    if (job.name === "extract") {
      const { data, id } = job;
      await extractCodeFromPdf({
        ...data,
      });
    }
  },
  { connection: { host: "127.0.0.1", port: 6379 }, concurrency: 100 }
);

const ocrWorker = createWorker("por");
(async () => {
  await (await ocrWorker).load();
})();

const limit = pLimit(8);

async function extractCodeFromPdf({
  filePath,
  tmpDir,
  outputFolder,
  length,
  pdfPath,
}: PDFQueue & { length: number; pdfPath: string }) {
  // console.log()
  const { recognize } = await ocrWorker;
  const {
    data: { text },
  } = await limit(() => recognize(filePath));
  const matches = text
    .trim()
    .replace(/—/g, "¨")
    .toLowerCase()
    .match(/[Pres ]\s*(9\d{7,8}|10\d{6,7}|13\d{7,8})/g);
  if (matches) {
    console.log(matches[0].replace(/ /g, "").replace("r", "").replace("s", ""));
  }
  progress++;
  mainWindow.webContents.send("file-parsed", {
    progress,
    totalFiles: length,
    path: outputFolder.replace(/ - renomeado/g, ''),
  });
  if (matches && matches.length > 0) {
    const newFileName = `${matches[0].replace(/ /g, "").replace("r", "").replace("s", "")}.pdf`;
    const destinationPath = path.resolve(outputFolder, newFileName);
    await fsPromises.copyFile(
      path.join(pdfPath, path.basename(filePath.replace(/-1.jpg/g, ".pdf"))),
      destinationPath
    );
  } else {
    filesWithError.add(path.basename(filePath).replace(/-1.jpg/g, ".pdf"));
    console.log(`Erro ao ler arquivo ${filePath.replace(/-1.jpg/g, ".pdf")}`);
  }
  if (progress >= length) {
    const errorFile = path.join(outputFolder, "erros.txt");
    for (const l of filesWithError) {
      await fsPromises.appendFile(errorFile, `${l}\n`, "utf-8");
    }
    filesWithError.clear()
    await fsPromises.rm(tmpDir, { recursive: true });
  }
}

interface PDFQueue {
  filePath: string;
  tmpDir: string;
}

export async function pdfToJpeg({ filePath, tmpDir,  length}: PDFQueue & {length:number}) {
  const filename = path.basename(filePath, ".pdf");

  // 1. Converte PDF para JPG
  await pdf.convert(filePath, {
    format: "jpeg",
    out_dir: tmpDir,
    out_prefix: filename,
    page: 1,
  });

  // 2. Pega os JPGs gerados
  const files = fs
    .readdirSync(tmpDir)
    .filter((f) => f.startsWith(filename) && f.endsWith(".jpg"));
  if(files.length < length) return
  // 3. Processa cada JPG com sharp
  for (const imgFile of files) {
    try {
      const imgPath = path.join(tmpDir, imgFile);

      const optimizedPath = imgPath; // sobrescreve o mesmo arquivo

      const buffer = await sharp(imgPath)
        .grayscale()
        .normalize()
        .threshold(180)
        .jpeg({ quality: 80 })
        .toBuffer();

      await fs.promises.writeFile(imgPath, buffer);
    } catch (error) {
      console.log(error);
    }
  }
}

// export async function extractTextFromPDFsInFolder(
//   folderPath: string,
//   outputFolder: string,
//   quality: "Alta" | "Média" | "Baixa" | "",
//   mainWindow: BrowserWindow
// ): Promise<void> {
//   const filesWithError: string[] = [];
//   const initialTime = Date.now();
//   const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".pdf"));
//   let progress = 0;
//   const resizeQuality = {
//     Alta: 2048,
//     Média: 1440,
//     Baixa: 1024,
//   };

//   const finalQuality = {
//     Alta: 100,
//     Média: 80,
//     Baixa: 60,
//   };

//   if (files.length === 0) {
//     console.log("Nenhum PDF encontrado.");
//     return;
//   }

//   await fsPromises.mkdir(outputFolder, { recursive: true });

//   const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "pdfocr-"));
//   console.log("Pasta temporária criada:", tempDir);
//   const worker = await createWorker("por");
//   const limit = pLimit(os.cpus().length);

//   const processPdfFile = async (file: string) => {
//     const originalPath = path.join(folderPath, file);
//     const pdfTempPath = path.join(tempDir, file);
//     await fsPromises.copyFile(originalPath, pdfTempPath);

//     const imgOutDir = path.join(tempDir, path.basename(file, ".pdf"));
//     await fsPromises.mkdir(imgOutDir);

//     await pdf.convert(pdfTempPath, {
//       format: "jpeg",
//       out_dir: imgOutDir,
//       out_prefix: "page",
//       page: 1,
//     });

//     const images = fs.readdirSync(imgOutDir).filter((f) => f.endsWith(".jpg"));

//     for (const image of images) {
//       const imagePath = path.join(imgOutDir, image);
//       const enhancedImagePath = path.join(imgOutDir, `enhanced-${image}`);

//       await sharp(imagePath)
//         .resize(resizeQuality[quality] ?? 1440)
//         .grayscale()
//         .normalize()
//         .sharpen()
//         .jpeg({ quality: finalQuality[quality] ?? 80 })
//         .toFile(enhancedImagePath);

//       const {
//         data: { text },
//       } = await worker.recognize(enhancedImagePath);
//       progress++;
//       mainWindow.webContents.send("file-parsed", {
//         progress,
//         totalFiles: files.length,
//         path: folderPath,
//       });
//       // console.log(text.trim())
//       const matches = text
//         .trim()
//         .replace(/—/g, "¨")
//         .toLowerCase()
//         .match(/[Pres ]\s*(9\d{7,8}|10\d{6,7}|13\d{7,8})/g);
//       if (matches) {
//         console.log(
//           matches[0].replace(/ /g, "").replace("r", "").replace("s", "")
//         );
//       }
//       if (matches && matches.length > 0) {
//         const newFileName = `${matches[0].replace(/ /g, "").replace("r", "").replace("s", "")}.pdf`;
//         const destinationPath = path.resolve(outputFolder, newFileName);
//         await fsPromises.copyFile(originalPath, destinationPath);
//       } else {
//         filesWithError.push(file);
//         console.log(`Erro ao ler arquivo ${file}`);
//       }
//     }
//   };
//   await Promise.allSettled(files.map((f) => limit(() => processPdfFile(f))));

//   await worker.terminate();
//   if (filesWithError.length > 0) {
//     const filePath = path.resolve(outputFolder, "falhas.txt");
//     for (const file of filesWithError) {
//       await fsPromises.appendFile(filePath, `${file}\n`);
//     }
//   }

//   const finalTime = Date.now();
//   const elapsedTime = dayjs.duration(finalTime - initialTime);

//   await fsPromises.rm(tempDir, { recursive: true, force: true });
// }
