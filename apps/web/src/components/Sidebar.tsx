import { Link, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, BrainCircuit, Mic, Network,
  UserCircle, Beaker, ClipboardList, ChevronRight
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/pyq', label: 'PYQ Intelligence', icon: BookOpen },
  { href: '/revision', label: 'Smart Revision', icon: BrainCircuit },
  { href: '/viva', label: 'Viva Engine', icon: Mic },
  { href: '/knowledge', label: 'Knowledge Graph', icon: Network },
  { href: '/twin', label: 'Digital Twin', icon: UserCircle },
  { href: '/practicals', label: 'Practicals', icon: Beaker },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <nav className="w-56 py-4 px-3 flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            to={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
              isActive
                ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
            }`} />
            <span className="flex-1 truncate">{label}</span>
            {isActive && <ChevronRight className="w-3 h-3 text-blue-400 shrink-0" />}
          </Link>
        );
      })}
    </nav>
  );
}
