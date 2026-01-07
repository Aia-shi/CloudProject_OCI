import type { Route } from "./+types/home";
import { useNavigate } from "react-router";
import { useState } from "react";
import axios from "axios";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Login() {
  const navigate = useNavigate();

  const [login, setLogin] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleHome = () => {
    navigate("/home");
  };
  const handleRegister = () => {    
    navigate("/register");
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    console.log(login + " " + password)

    try {
      await axios.post("http://localhost:3000/user/login", {
        "login": login,
        "passwd": password,
      },{
        withCredentials: true,
      });

      navigate("/home");

    } catch (err: any) {
      if (err.response) {
        console.log(err)
        setError("Błąd logowania. Sprawdź dane.");
      } else {
        setError("Brak połączenia z serwerem.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="flex w-full h-full justify-center items-center login-form">
  <div className="w-[516px] mx-auto">

    <h2 className="text-[40px] font-bold mb-3 text-center">Zaloguj się</h2>

    <fieldset className="flex bg-[#7C7C7C] rounded-box w-full h-[344px] mx-auto border p-4 pt-6 text-sm flex-col gap-4 items-center">

      <div className="flex flex-col gap-4 w-full items-center">
        
        <div className="flex flex-col gap-1 w-[340px] mt-14">
          <label className="text-white text-[16px]">
            Nazwa użytkownika lub email
          </label>
          <input
            type="text"
            value={login}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLogin(e.target.value)
            }
            className="text-[20px] input input-sm w-full h-8"
          /> 
        </div>

        <div className="flex flex-col gap-1 w-[340px]">
          <label className="text-white text-[16px]">
            Hasło
          </label>
          <input
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            className="text-[20px] input input-sm w-full h-8"
          />
        </div>

      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="btn btn-neutral bg-[#059669] border-0 flex-center text-[20px] mt-2 w-[258px] self-center h-12"
      >
        {loading ? "Logowanie..." : "Zaloguj się"}
      </button>

      <button
        onClick={handleRegister}
        className="btn btn-ghost border-0"
      >
        Nie posiadasz konta?
      </button>   

    </fieldset>
  </div>
</div> );
}
