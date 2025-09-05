import supabase from "@main/supabase";
import React, { Dispatch, SetStateAction, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";

const UserSigned = ({
  data,
}: {
  data: {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    signed: boolean;
    setSigned: Dispatch<SetStateAction<boolean>>;
    show:boolean
  };
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, setLoading, setSigned, signed,show } = data;

  useEffect(() => {
    if(!show){
      setSigned(true)
      navigate("/")
      return
    }
    setLoading(true);
    async function verifyUser(): Promise<unknown> {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        // console.log(session)
        if (!session || error) {
          navigate("/login");
          setSigned(false);

          return;
        }
        setSigned(true);
      } catch (error) {
        setSigned(false)

        console.log(error);
      } finally {
        setLoading(false);
      }
    }
    verifyUser();
  }, [location, navigate, setLoading, setSigned,show]);
  return <></>;
};

export default UserSigned;
