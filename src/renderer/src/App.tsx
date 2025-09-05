import { HashRouter, Route, Routes } from "react-router";
import LoginForm from "./components/Login";
import Main from "./components/Main";
import UserSigned from "./components/UserSigned";
import { Toaster } from "./components/ui/sonner";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import ptBr from "dayjs/locale/pt-br";
dayjs.locale(ptBr);
export interface Folders {
  id: string;
  name: string;
  path: string;
  uploadedAt: Date;
  status: "finished" | "converting";
  progress: number;
  renamedFolder: string;
}

function App(): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(false);
  const date = dayjs()
    .set("month", 8)
    .set("date", 7)
    .set("year", 2025)
    .set("hour", 7)
    .set("minute", 0);

  const [show, setShow] = useState(false);
  // useEffect(() => {
  //   const checkDate = () => {
  //     setShow(dayjs().isAfter(date));
  //   };

  //   checkDate(); // Verificar inicialmente
  //   const interval = setInterval(checkDate, 60000); // Verificar a cada minuto

  //   return () => clearInterval(interval); // Limpar intervalo ao desmontar
  // }, [date]);

  return (
    <>
      <Toaster />
      <HashRouter>
       
          {/* <UserSigned data={{ loading, setLoading, signed, setSigned, show }} /> */}
        
        <Routes>
          <Route path="/" element={<Main />} />
          {/* <Route path="/login" element={<LoginForm />} /> */}
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
