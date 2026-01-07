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

export default function Register() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  const handleHome = () => {
    navigate("/home");
  };
  const handleLogin = () => {    
    navigate("/");
  };

  const handleRegister = async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      await axios.post("http://localhost:3000/user/register", {
        "username": username,
        "email": email,
        "passwd": password,
      });

      navigate("/");

    } catch (err: any) {
      if (err.response) {
        setError("Błąd rejestracji. Sprawdź dane.");
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

        <h2 className="text-[40px] font-bold mb-3 text-center">
          Zarejestruj się
        </h2>

        <fieldset className="flex bg-[#7C7C7C] rounded-box w-full h-[344px] mx-auto border p-4 pt-6 text-sm flex-col gap-4 items-center">

          <div className="flex flex-col gap-4 w-full items-center">

            {/* Username */}
            <div className="flex flex-col gap-1 w-[340px] mt-14">
              <label className="text-white text-[16px]">
                Nazwa użytkownika
              </label>
              <input
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                className="text-[20px] input input-sm w-full h-8"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1 w-[340px]">
              <label className="text-white text-[16px]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                className="text-[20px] input input-sm w-full h-8"
              />
            </div>

            {/* Password */}
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

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm mt-1">
              {error}
            </p>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="btn btn-neutral bg-[#059669] border-0 flex-center text-[20px] mt-2 w-[258px] self-center h-12"
          >
            {loading ? "Rejestracja..." : "Zarejestruj się"}
          </button>

          <button
            onClick={handleLogin}
            className="btn btn-ghost border-0"
          >
            Posiadasz konto?
          </button>

        </fieldset>
      </div>
    </div> );
}
