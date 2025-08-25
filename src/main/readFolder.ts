import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import os from "os";
import pdf from "pdf-poppler";
import { createWorker } from "tesseract.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import sharp from "sharp";
import { BrowserWindow, Notification } from "electron";
import pLimit from "p-limit";
dayjs.extend(duration);
export async function extractTextFromPDFsInFolder(
  folderPath: string,
  outputFolder: string,
  quality: "Alta" | "Média" | "Baixa" | "",
  mainWindow: BrowserWindow
): Promise<void> {
  const filesWithError: string[] = [];
  const initialTime = Date.now();
  const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".pdf"));
  let progress = 0;
  const resizeQuality = {
    Alta: 2048,
    Média: 1440,
    Baixa: 1024,
  };

  const finalQuality = {
    Alta: 100,
    Média: 80,
    Baixa: 60,
  };

  if (files.length === 0) {
    console.log("Nenhum PDF encontrado.");
    return;
  }

  await fsPromises.mkdir(outputFolder, { recursive: true });

  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "pdfocr-"));
  console.log("Pasta temporária criada:", tempDir);
  const worker = await createWorker("por");
  const limit = pLimit(os.cpus().length);

  const processPdfFile = async (file: string) => {
    const originalPath = path.join(folderPath, file);
    const pdfTempPath = path.join(tempDir, file);
    await fsPromises.copyFile(originalPath, pdfTempPath);

    const imgOutDir = path.join(tempDir, path.basename(file, ".pdf"));
    await fsPromises.mkdir(imgOutDir);

    await pdf.convert(pdfTempPath, {
      format: "jpeg",
      out_dir: imgOutDir,
      out_prefix: "page",
      page: 1,
    });

    const images = fs.readdirSync(imgOutDir).filter((f) => f.endsWith(".jpg"));

    for (const image of images) {
      const imagePath = path.join(imgOutDir, image);
      const enhancedImagePath = path.join(imgOutDir, `enhanced-${image}`);

      await sharp(imagePath)
        .resize(resizeQuality[quality] ?? 1440)
        .grayscale()
        .normalize()
        .sharpen()
        .jpeg({ quality: finalQuality[quality] ?? 80 })
        .toFile(enhancedImagePath);

      const {
        data: { text },
      } = await worker.recognize(enhancedImagePath);
      progress++;
      mainWindow.webContents.send("file-parsed", {
        progress,
        totalFiles: files.length,
        path: folderPath,
      });
      // console.log(text.trim())
      const matches = text
        .trim()
        .replace(/—/g, "¨")
        .toLowerCase()
        .match(/[Pres ]\s*(9\d{7,8}|10\d{6,7}|13\d{7,8})/g);
      if (matches) {
        console.log(
          matches[0].replace(/ /g, "").replace("r", "").replace("s", "")
        );
      }
      if (matches && matches.length > 0) {
        const newFileName = `${matches[0].replace(/ /g, "").replace("r", "").replace("s", "")}.pdf`;
        const destinationPath = path.resolve(outputFolder, newFileName);
        await fsPromises.copyFile(originalPath, destinationPath);
      } else {
        filesWithError.push(file);
        console.log(`Erro ao ler arquivo ${file}`);
      }
    }
  };
  await Promise.allSettled(files.map((f) => limit(() => processPdfFile(f))));

  await worker.terminate();
  if (filesWithError.length > 0) {
    const filePath = path.resolve(outputFolder, "falhas.txt");
    for (const file of filesWithError) {
      await fsPromises.appendFile(filePath, `${file}\n`);
    }
  }

  const finalTime = Date.now();
  const elapsedTime = dayjs.duration(finalTime - initialTime);

  await fsPromises.rm(tempDir, { recursive: true, force: true });
}
