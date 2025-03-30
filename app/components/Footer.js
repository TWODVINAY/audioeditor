'use client';

export default function Footer() {
  return (
    <footer className="bg-[#f2edf1] text-[#601951] p-4 text-center md:text-left md:p-6">
      <p className="text-sm md:text-base">
        &copy; {new Date().getFullYear()} Audio Editing Web App. All rights reserved.
      </p>
    </footer>
  );
}
