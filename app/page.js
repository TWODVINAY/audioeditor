// app/page.js
'use client';

import Navbar from './components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="flex flex-col bg-[#f2edf1] text-[#2c212a]  items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-semibold mb-4">Welcome to Audio Editor</h2>
        <Link href="/generate-music" className='cursor-pointer'>
        
          <DrawOutlineButton className=" px-6 py-2  rounded">Start Editing</DrawOutlineButton>
        </Link>
      </main>
    </div>
  );
}
const DrawOutlineButton = ({ children, ...rest }) => {
  return (
    <button
      {...rest}
      className="group relative cursor-pointer px-4 py-2 font-medium hover:text-[#601951] transition-colors duration-[400ms] text-[#195160]"
    >
      <span>{children}</span>

      {/* TOP */}
      <span className="absolute left-0 top-0 h-[2px] w-0 bg-[#601951] transition-all duration-100 group-hover:w-full" />

      {/* RIGHT */}
      <span className="absolute right-0 top-0 h-0 w-[2px] bg-[#601951] transition-all delay-100 duration-100 group-hover:h-full" />

      {/* BOTTOM */}
      <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-[#601951] transition-all delay-200 duration-100 group-hover:w-full" />

      {/* LEFT */}
      <span className="absolute bottom-0 left-0 h-0 w-[2px] bg-[#601951] transition-all delay-300 duration-100 group-hover:h-full" />
    </button>
  );
};
