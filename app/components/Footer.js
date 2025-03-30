'use client';

export default function Footer() {
  return (
    <footer className="bg-[#f2edf1]  text-[#601951] p-4 text-center">
      <p>&copy; {new Date().getFullYear()} Audio Editing Web App. All rights reserved.</p>
    </footer>
  );
}
