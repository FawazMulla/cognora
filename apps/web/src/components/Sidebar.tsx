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
    <nav className="w-64 py-6 px-4 flex flex-col gap-1.5 h-full bg-[#ffffff] border-r border-[#e3e6ed] overflow-y-auto font-sans">
      <div className="flex items-center gap-2 px-3 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4f75f2]" />
        <span className="text-[10px] font-mono font-bold text-[#8c8fa1] uppercase tracking-widest">
          Workspace Navigation
        </span>
      </div>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            to={href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-mono text-[11px] tracking-wide transition-all group ${
              isActive
                ? 'bg-[#edf3fc] text-[#4f75f2] border border-[#d0dcf5] font-bold shadow-xs'
                : 'text-[#6b6f82] hover:bg-[#f8f9fc] hover:text-[#121217] border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-[#4f75f2]' : 'text-[#8c8fa1] group-hover:text-[#4f75f2]'
            }`} />
            <span className="flex-1 truncate">{label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#4f75f2]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
