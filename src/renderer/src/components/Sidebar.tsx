import clsx from "clsx";
import { FolderPlus } from "lucide-react";
import React, { useEffect, useState } from "react";

declare module "react" {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
      webkitdirectory?: string;
  }
}
const Sidebar = () => {
  const folders = ["93 - renomeados", "LOTE _ SLA", "ASSdsda"];
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    // function handleOpenFolder(){
    if (openFolder) {
      window.electron.ipcRenderer.send("open-folder", openFolder);
      window.electron.ipcRenderer.on("open-folder", (e, v) => setFiles(v));
    }
    // }
  }, [openFolder]);

  useEffect(()=> {
    window.electron.ipcRenderer.on("get-file-path", (_, p)=> window.alert(p))
    return ()=> window.electron.ipcRenderer.removeAllListeners("get-file-path")
  },[])

  return (
    <aside className="border-r dark:border-zinc-700">
      <div className="p-[2rem] ">
        <div className="flex items-center justify-between dark:text-zinc-100 mb-[1.2rem]">
          <span className=" text-[1.6rem] font-semibold block ">
            Pastas transformadas
          </span>
          <label className="cursor-pointer">
          <FolderPlus className="size-[1.6rem]" />
            <input onChange={({target:{files}})=> {
              if(files){
                window.electron.ipcRenderer.send("get-f", files[0].webkitRelativePath)
              }
            }} type="file" accept="" webkitdirectory="true" hidden />
          </label>
        </div>
        <ul className="flex flex-col dark:text-zinc-300 text-[1.4rem]">
          {folders.map((f, i) => (
            <li
              key={i}
              onClick={() => setOpenFolder((v) => (!v ? f : null))}
              className={clsx(
                "flex items-center gap-[1rem] p-[.6rem] hover:bg-zinc-800 duration-200 cursor-pointer rounded-[.6rem]",
                {
                  "bg-zinc-800": openFolder === f,
                }
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-[1.6rem]"
              >
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
