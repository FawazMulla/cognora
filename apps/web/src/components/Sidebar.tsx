import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  BookOpen, 
  FlaskConical, 
  Mic, 
  FileEdit,
  UserCircle,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Student Twin', href: '/twin', icon: UserCircle },
  { name: 'PYQ Intelligence', href: '/pyq', icon: BookOpen },
  { name: 'Practical Generator', href: '/practicals', icon: FlaskConical },
  { name: 'Viva Engine', href: '/viva', icon: Mic },
  { name: 'Assignment Engine', href: '/assignments', icon: FileEdit },
  { name: 'Smart Revision', href: '/revision', icon: BrainCircuit },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 flex flex-col justify-between h-full min-h-0 pt-2 pb-4">
      <div className="py-2 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-gemini-surface text-gemini-text' 
                  : 'text-gemini-text-muted hover:text-gemini-text hover:bg-gemini-surface'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-gemini-blue' : 'text-gemini-text-muted'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 mb-4">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-gemini-text-muted hover:text-gemini-text hover:bg-gemini-surface transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
