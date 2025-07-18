export default function Header() {
  return (
    <header className="bg-black text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center text-xl font-bold">
          {/* Icon: Chat bubble with dollar sign */}
          <span className="mr-2">
            <img src="/ChatChing.png" alt="Chat-ching Logo" className="inline-block h-12 w-12 mr-2 align-middle" />
          </span>
          Chat-ching bot's Authorization page
        </div>
        <div className="flex items-center text-xl font-bold">
          <span className="mr-2 text-white font-bold text-xl">Rather Labs</span>
          <span className="mr-2">
            <img src="/Rather-white.png" alt="Rather Labs Logo" className="inline-block h-10 w-10 mr-2 align-middle" />
          </span>
        </div>
      </div>
    </header>
  );
} 