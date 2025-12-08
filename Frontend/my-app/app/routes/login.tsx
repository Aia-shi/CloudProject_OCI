import type { Route } from "./+types/home";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Login() {
  const navigate = useNavigate();

  const handleHome = () => {
    navigate("/home");
  };
  const handleRegister = () => {    
    navigate("/register");
  };
  return (
  <div className="flex w-full h-full justify-center items-center login-form">
    <div className="w-[516px] mx-auto">

      <h2 className="text-[40px] font-bold mb-3 text-center">Zaloguj się</h2>

      <fieldset className="flex bg-[#7C7C7C] rounded-box w-full h-[344px] mx-auto border p-4 pt-6 text-sm flex-col gap-4 items-center">

      <div className="flex flex-col gap-4 w-full items-center ">
        <div className="flex flex-col gap-2 w-[340px] mt-14">
          <input type="email" className=" text-[20px] input input-sm w-full h-8" placeholder="User" />
        </div>

        <div className="flex flex-col gap-2 w-[340px]">
          <input type="email" className=" text-[20px] input input-sm w-full h-8" placeholder="Email" />
        </div>
        
        <div className="flex flex-col gap-2 w-[340px]">
          <input type="password" className=" text-[20px] input input-sm w-full h-8" placeholder="Password" />
        </div>
      </div>
      <button 
        onClick={handleHome}
        className=" btn btn-neutral bg-[#059669] border-0  flex-center text-[20px] mt-2 w-[258px] self-center h-12">
        Logowanie
      </button>
      <button onClick={handleRegister} className="btn btn-ghost border-0">Nie posiadasz konta?</button>

    </fieldset>
    </div>
  </div>
  );
}
