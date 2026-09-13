import { Link, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, BrainCircuit, Mic, Network,
  UserCircle, Beaker, ClipboardList, Layers, FileText,
  HelpCircle, Award, Edit3
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/syllabus', label: 'Syllabus & Units', icon: Layers },
  { href: '/exam-notes', label: 'Exam & IAE Notes', icon: FileText },
  { href: '/question-bank', label: 'Question Bank (QB)', icon: HelpCircle },
  { href: '/answers', label: 'Structured Answers', icon: Award },
  { href: '/answer-optimizer', label: 'Answer Optimizer', icon: Edit3 },
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
    <nav className="w-60 py-6 px-4 flex flex-col gap-1.5 h-full bg-[#ffffff] border-r border-[#d9d9dd] overflow-y-auto">
      <div className="text-[10px] font-mono text-[#93939f] px-3 mb-2 uppercase tracking-widest">Workspace</div>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            to={href}
            className={`flex items-center gap-3 px-3.5 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider transition-colors group ${
              isActive
                ? 'bg-white text-black border border-black shadow-none font-bold'
                : 'text-[#75758a] hover:bg-[#eeece7] hover:text-black border border-transparent'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isActive ? 'text-black' : 'text-[#75758a] group-hover:text-black'
            }`} />
            <span className="flex-1 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
