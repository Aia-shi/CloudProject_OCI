import Navbar from "~/components/Navbar";
import RightPanel from "~/components/RightPanel";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
   <div className="flex h-full w-full items-center">
      <Navbar />
      <div className="flex w-2.5 h-[583px] bg-linear-to-b from-[#1F5E53] to-[#2E2E2E]
rounded-2xl ml-30 mr-6 ">

      </div>
      <div className="ml-auto">
        <RightPanel />
      </div>
    </div>
  );
}