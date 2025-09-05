import dayjs from "dayjs";
import { FolderCheck, FolderUp, Trash2Icon } from "lucide-react";
import relativeTime from "dayjs/plugin/relativeTime";
import { Dispatch, SetStateAction,  } from "react";
import Modal from "./ui/Modal";
dayjs.extend(relativeTime);

const Folder = ({
  id,
  name,
  uploadedAt,
  path,
  progress,
  status,
  renamedFolder,
  deleteFn,
  error,
  setError,
}: {
  id: string;
  name: string;
  uploadedAt: Date;
  path: string;
  status: "finished" | "converting";
  progress: number;
  renamedFolder: string;
  deleteFn: (v: string) => void;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
}) => {
    
  function openFolder(): void {
    window.electron.ipcRenderer.send("open-folder", {
      path: renamedFolder,
      id,
    });
  }



  return (
    <li className="text-zinc-100 flex gap-[1rem] w-full relative">
      {status === "converting" ? (
        <FolderUp className="size-[2.4rem] stroke-1" />
      ) : (
        <FolderCheck className="size-[2.4rem] stroke-1" />
      )}
      <div className="w-full grid grid-cols-[1fr_auto] gap-[1rem] ">
        <div className="">
          <div className="flex items-center gap-6">
            <span className="text-base">
              {(name + " - renomeado").slice(0, 40)}
            </span>
            <p className="text-zinc-400 text-xs">
              {dayjs(uploadedAt).fromNow()}
            </p>
          </div>
          {status === "converting" && (
            <div className="flex items-center gap-[1rem] text-sm">
              <div className="bg-zinc-700 w-full h-[.35rem] mt-[.6rem] rounded-full relative overflow-x-hidden">
                <div
                  style={{ width: `${progress}%` }}
                  className="absolute top-0 left-0 bg-zinc-100 h-full rounded-full duration-200"
                ></div>
              </div>
              <span>{progress}%</span>
            </div>
          )}
          {status === "finished" && (
            <button
              onClick={openFolder}
              className="text-zinc-300 py-[.8rem] text-sm cursor-pointer"
            >
              Abrir pasta
            </button>
          )}
        </div>
        <button
          onClick={() => deleteFn(id)}
          className="text-rose-500 p-[1rem] cursor-pointer"
        >
          <Trash2Icon className="size-5" />
        </button>

        <Modal
          onExit={() => setError("")}
          className="min-h-fit w-[70%]"
          show={error === id}
        >
          <p className="text-[1.5rem] leading-[1.3]">
            Ocorreu um erro ao abrir a pasta, talvez ela tenha sido movida ou
            renomeada, deseja excluir o item do histórico?
          </p>
          <div className="flex gap-[1rem] w-full text-[1.4rem] mt-[1.2rem] font-semibold">
            <button
              onClick={() => deleteFn(id)}
              className="w-full p-[1rem] rounded-[.8rem] bg-rose-700"
            >
              Excluir
            </button>
            <button
              onClick={() => setError("")}
              className="w-full p-[1rem] rounded-[.8rem] bg-zinc-800/30"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      </div>
    </li>
  );
};

export default Folder;
