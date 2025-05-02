import type { Folders } from "@renderer/App"
import { Check, ChevronDown, Settings, } from "lucide-react"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import Modal from "./ui/Modal"
import { motion } from "framer-motion"
import clsx from "clsx"

interface HeaderInterface {
  folders: Folders[]
  setFolders: Dispatch<SetStateAction<Folders[]>>
  foundFolders: Folders[];
  setFoundFolders: Dispatch<SetStateAction<Folders[]>>
  quality: "Alta" | "Média" | "Baixa" | "",
  setQuality: Dispatch<SetStateAction<"Alta" | "Média" | "Baixa" | "">>
}


const Header = ({ folders, setFoundFolders, quality, setQuality }: HeaderInterface) => {
  const [search, setSearch] = useState("")
  useEffect(() => {
    setFoundFolders(folders.filter((f) => f.name.includes(search)))
  }, [search, setFoundFolders, folders])
  const [modalSettings, setModalSettings] = useState(false)
  const [selectQuality, setSelectQuality] = useState(false)
  const qualityOptions: ("Alta" | "Média" | "Baixa")[] = ["Alta", "Média", "Baixa"]

  useEffect(() => {
    if (quality) {
      localStorage.setItem("quality", JSON.stringify(quality))
    }
  }, [quality])

  return (
    <>
      <header className='border-b dark:border-zinc-700'>
        <div className=" p-[2rem] flex gap-[1rem]">
          <input value={search} onChange={({ target: { value } }) => setSearch(value)} placeholder='Procurar pasta...' type="text" className='dark:bg-zinc-900 hover:bg-zinc-800/70 focus:bg-zinc-800/70 text-[1.4rem] dark:placeholder:text-zinc-300 text-zinc-300 flex-[1_1_auto] p-[.8rem] rounded-[.8rem] duration-200' />
          <button onClick={() => setModalSettings(true)} className="rounded-[.8rem] bg-zinc-800 flex items-center gap-[.6rem] p-[.8rem] text-zinc-100 text-[1.4rem] font-medium  cursor-pointer ">
            <Settings className="size-[2rem]" />
          </button>
        </div>
      </header>
      <Modal show={modalSettings} onExit={() => setModalSettings(false)}>
        <h1 className="text-zinc-100 text-[2rem] font-semibold mb-[2rem]">Configurações</h1>
        <div className="flex flex-col gap-[.6rem]">
          <label className="text-[1.6rem] text-zinc-300 font-medium">Qualidade da leitura dos PDFs</label>
          <button onClick={(e) => setSelectQuality(v => !v)} className="p-[1rem] border border-zinc-800 rounded-[.8rem] text-zinc-300 flex items-center justify-between relative">
            <span className="text-[1.4rem] ">{quality ? quality : "Selecionar qualidade"}</span>
            <ChevronDown className="size-[1.8rem]" />
            {selectQuality && <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} className="absolute w-full top-[120%] bg-zinc-900 left-0 border border-zinc-800 rounded-[.8rem] p-[1rem]">
              <div className="flex flex-col ">

                {qualityOptions.map((q, i) => <label key={i} className="flex items-center gap-[.6rem] text-[1.4rem] p-[.8rem] hover:bg-zinc-800 duration-200 rounded-[.8rem] text-zinc-300">
                  <Check className={clsx("size-[1.4rem] ", {
                    "opacity-0": q !== quality
                  })} />
                  <input type="radio" value={q} name="quality" onChange={({ target: { value } }) => { setQuality(value as "Alta" | "Média" | "Baixa" | ""); setSelectQuality(false) }} hidden />
                  <span>{q}</span>
                </label>)}
              </div>
            </motion.div>}
          </button>
        </div>
      </Modal>
    </>
  )
}

export default Header