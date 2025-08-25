import type { Folders } from "@renderer/App";
import { Check, ChevronDown, MoreHorizontal, Settings } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Modal from "./ui/Modal";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface HeaderInterface {
  folders: Folders[];
  setFolders: Dispatch<SetStateAction<Folders[]>>;
  foundFolders: Folders[];
  setFoundFolders: Dispatch<SetStateAction<Folders[]>>;
  quality: "Alta" | "Média" | "Baixa" | "";
  setQuality: Dispatch<SetStateAction<"Alta" | "Média" | "Baixa" | "">>;
}

const Header = ({
  folders,
  setFoundFolders,
  quality,
  setQuality,
}: HeaderInterface) => {
  const [search, setSearch] = useState("");
  useEffect(() => {
    setFoundFolders(folders.filter((f) => f.name.includes(search)));
  }, [search, setFoundFolders, folders]);
  const [modalSettings, setModalSettings] = useState(false);
  const [selectQuality, setSelectQuality] = useState(false);
  const qualityOptions: ("Alta" | "Média" | "Baixa")[] = [
    "Alta",
    "Média",
    "Baixa",
  ];

  useEffect(() => {
    if (quality) {
      localStorage.setItem("quality", JSON.stringify(quality));
    }
  }, [quality]);

  return (
    <>
      <header className="border-b dark:border-zinc-700">
        <div className=" p-4 flex gap-[1rem] items-center">
          <Input
            value={search}
            onChange={({ target: { value } }) => setSearch(value)}
            placeholder="Procurar pasta..."
            className="text-sm"
          />
          <Dialog>
            <DialogTrigger>
              <Button variant={"secondary"}>
                <MoreHorizontal className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[80%]">
              <DialogTitle className="text-xl">Mais opções</DialogTitle>
              <Select value={quality} onValueChange={(v) => setQuality(v)}>
                <div>
                  <Label className="mb-2 text-[1rem]">
                    Qualidade da leitura dos PDFS
                  </Label>
                  <SelectTrigger value={quality} className="w-full">
                    {quality}
                  </SelectTrigger>
                </div>
                <SelectContent>
                  {qualityOptions.map((v) => (
                    <SelectItem className="hover:bg-muted" value={v} key={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DialogContent>
          </Dialog>
        </div>
      </header>
    </>
  );
};

export default Header;
