'use client';
import logo from '../../public/vercel.svg';
export default function Navbar() {
  return (
    <nav className="bg-[#f2edf1] text-[#2c212a] p-4 flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5 p-2">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <h2 className="text-xl font-bold font-serif">AE</h2>
      </div>
      <div className="text-center md:text-right">
        <h1 className="text-4xl font-bold font-serif">Audio Editor</h1>
        <p className="text-lg font-semibold">Edit and enhance your audio files seamlessly.</p>
      </div>
    </nav>
  );
}
