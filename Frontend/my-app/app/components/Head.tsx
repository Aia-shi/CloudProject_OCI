export default function Header() {
  return (
    <header className="w-full items-center">
      {/* make this a flex row so children can sit side-by-side */}
      <div className="p-5 flex items-center w-full">
        <div className="w-1/2 flex items-center gap-3">
          <img src="/logo planer.png" alt="Logo" className="h-15 w-auto" />
          <p className="p text-[36px] text-left text-white"><b>Inteligentny Planner Wydatków</b></p>
        </div>

        <div className="w-1/2 flex justify-end items-center gap-3 ">
          <p className="text-[24px]">Team</p>
          <p className="text-[24px]">Technologie Cloud</p>
          <p className="text-[24px]">Github</p>
        </div>
      </div>
    </header>
  );
}