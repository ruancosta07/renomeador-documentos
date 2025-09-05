import React from 'react'
import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion"
import { twMerge } from 'tailwind-merge'
const Modal = ({ children, show, className, onExit, ...props }: React.HTMLAttributes<HTMLDivElement> & { show: boolean, children: React.ReactNode, onExit?: () => void } & HTMLMotionProps<"div">) => {
    return (
        <AnimatePresence>
            {show && <div onClick={() => onExit()} className='bg-zinc-950/50 fixed left-0 top-0 h-screen w-screen flex items-center justify-center z-[10]'>
                <motion.div onClick={(e) => e.stopPropagation()} className={twMerge(`min-h-[80%] bg-zinc-900 w-[80%] p-[1.6rem] rounded-[1rem] shadow-md ${className}`)} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }} {...props}>
                    {children}
                </motion.div>
            </div>}
        </AnimatePresence>
    )
}

export default Modal
