import { useEffect, useRef, useState } from "react";
import Folder from "@/components/Folder";
import dayjs from "dayjs";
import ptBr from "dayjs/locale/pt-br";
import Header from "@/components/Header";
import { FolderUp } from "lucide-react";
import { Folders } from "@/App";
const Main = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [quality, setQuality] = useState<"Alta" | "Média" | "Baixa" | "">(
    () => {
      const localQuality = localStorage.getItem("quality");
      return localQuality ? localQuality.replace(/"/g, "") : "Média";
    }
  );
  const [folders, setFolders] = useState<Folders[]>(() => {
    const localFolders = localStorage.getItem("folders");
    return localFolders ? JSON.parse(localFolders) : [];
  });

  const [errorOpenFolder, setErrorOpenFolder] = useState<string>("");

  useEffect(() => {
    if (folders) {
      localStorage.setItem("folders", JSON.stringify(folders));
    }
  }, [folders]);
  // const interval = useRef<NodeJS.Timeout | null>(null)
  // useEffect(()=> {
  //   clearInterval(interval.current as NodeJS.Timeout)
  //   interval.current = setInterval(()=> {
  //       setFolders(f=> f.map((v)=> ({...v, uploadedAt: dayjs(v.uploadedAt).})))
  //   }, 60000)
  //   // return ()=>
  // },[])

  // const progress
  useEffect(() => {
    window.electron.ipcRenderer.once("error-open-folder", () => {
      console.log("asdad");
    });
    return () =>
      window.electron.ipcRenderer.removeAllListeners("error-open-folder");
  }, []);

  useEffect(() => {
    window.electron.ipcRenderer.on("error-open-folder", (e, id) => {
      setErrorOpenFolder(id);
    });
    return () =>
      window.electron.ipcRenderer.removeAllListeners("error-open-folder");
  }, []);

  useEffect(() => {
    let dragCounter = 0;
    const handleDragOver = (e: DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragEnter = (): void => {
      // e.preventDefault();
      dragCounter++;
    };

    const handleDragLeave = (e: DragEvent): void => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files?.length > 3) {
        window.alert("Selecione 3 pastas ou menos");
        return;
      }
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const path = String(window.electron.showFilePath(files[i]));

          setFolders((v) => [
            ...v,
            {
              id: crypto.randomUUID(),
              name: file.name,
              path,
              progress: 0,
              status: "converting",
              uploadedAt: new Date(),
              renamedFolder: path + " - renomeado",
            },
          ]);
          window.electron.ipcRenderer.send("start-parse", {
            path,
            quality: quality,
          });
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [quality]);

  function deleteItemFromHistory(id: string): void {
    setFolders((v) => v.filter((f) => f.id !== id));
  }

  useEffect(() => {
    window.electron.ipcRenderer.on("file-parsed", (e, i) => {
      const percentProgress = Math.round((i.progress / i.totalFiles) * 100);
      setFolders((v) =>
        v.map((f) => {
          console.log(f.path, i.path)
          return f.path === i.path
            ? {
                ...f,
                progress: percentProgress,
                status: percentProgress >= 100 ? "finished" : "converting",
              }
            : f;
        })
      );
    });
    return () => window.electron.ipcRenderer.removeAllListeners("file-parsed");
  }, []);

  const [foundFolders, setFoundFolders] = useState<Folders[]>([]);
  console.log(folders);

  return (
    <>
      <Header
        quality={quality}
        setQuality={setQuality}
        folders={folders}
        setFolders={setFolders}
        foundFolders={foundFolders}
        setFoundFolders={setFoundFolders}
      />
      {isDragging && (
        <div className="bg-zinc-950/70 w-screen h-screen fixed left-0 top-0 z-[2] flex items-center justify-center">
          <div className="flex flex-col items-center gap-[.8rem] text-zinc-100">
            <div className="p-3 rounded-[1rem] border border-zinc-100 bg-zinc-900">
              <FolderUp className="size-8" />
            </div>
            <span className="text-lg font-semibold max-w-[16ch] text-center leading-[1.15]">
              Arraste e solte a pasta aqui
            </span>
          </div>
        </div>
      )}
      <main className="p-4">
        <div className=" mt-[2rem] ">
          <ul className="flex flex-col gap-[1rem] ">
            {foundFolders.length === 0
              ? folders
                  .sort((a, b) => dayjs(b.uploadedAt).diff(a.uploadedAt))
                  .map((f, i) => (
                    <Folder
                      error={errorOpenFolder}
                      setError={setErrorOpenFolder}
                      {...f}
                      deleteFn={deleteItemFromHistory}
                      key={f.id}
                    />
                  ))
              : foundFolders
                  .toSorted((a, b) => dayjs(b.uploadedAt).diff(a.uploadedAt))
                  .map((f, i) => (
                    <Folder
                      error={errorOpenFolder}
                      setError={setErrorOpenFolder}
                      {...f}
                      key={f.id}
                      deleteFn={deleteItemFromHistory}
                    />
                  ))}
          </ul>
        </div>
      </main>
    </>
  );
};

export default Main;
