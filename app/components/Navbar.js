// app/components/Navbar.js
'use client';
import logo from '../../public/vercel.svg'
export default function Navbar() {
  return (
    <nav className="bg-[#f2edf1] text-[#2c212a] p-4 flex items-center">
        <div className='logo flex items-center justify-between p-2 gap-5'>
    <img src={logo} alt="" />
    <h2 className='text-xl font-bold font-serif'>AE</h2>
    </div>
      <div className="container mx-auto text-center">
        <h1 className="text-4xl font-bold font-serif">Audio Editor</h1>
        <p className="text-lg font-semibold">Edit and enhance your audio files seamlessly.</p>
      </div>
    </nav>
  );
}
