'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const navItems = [
    { href: '/my-music', label: 'My Music' },
    { href: '/generate-music', label: 'Generate Music' },
    { href: '/settings', label: 'Settings' },
    { href: '/logout', label: 'Logout' },
  ];

  return (
    <>
      <div className="hidden md:block bg-[#e395d3] p-6 border-2 border-[#e4dae2] rounded-2xl">
        <ul className="space-y-12">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <li key={index}>
                <Link href={item.href}>
                  <button
                    className={`px-6 py-2 font-medium w-fit transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] ${
                      isActive
                        ? 'bg-[#601951] text-[#eebde4]'
                        : 'bg-[#eebde4] text-[#601951]'
                    }`}
                  >
                    {item.label}
                  </button>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#e395d3] p-2 border-t-2 border-[#e4dae2] flex justify-around">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link key={index} href={item.href}>
              <button
                className={`px-4 py-2 font-medium transition-all shadow-[3px_3px_0px_black] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] ${
                  isActive
                    ? 'bg-[#601951] text-[#eebde4]'
                    : 'bg-[#eebde4] text-[#601951]'
                }`}
              >
                {item.label}
              </button>
            </Link>
          );
        })}
      </div>
    </>
  );
}
