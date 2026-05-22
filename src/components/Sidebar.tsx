import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  Sparkles,
  User,
  LogOut,
  Brain,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/insights', icon: Sparkles, label: 'AI Insights' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #00b2b2, #00a8d6)', boxShadow: '0 4px 15px rgba(0,178,178,0.4)' }}>
          <Brain size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">MindFrame</h1>
          <p className="text-[10px] text-white/40">AI Wellness Journal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 mt-4 border-t border-subtle pt-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, rgba(0,178,178,0.3), rgba(0,168,214,0.3))', border: '1px solid rgba(0,178,178,0.3)' }}>
            {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">{profile?.display_name || 'User'}</p>
            <p className="text-[10px] text-white/30">Active</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="nav-link w-full text-error-400 hover:text-error-400"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 glass rounded-xl flex items-center justify-center"
      >
        <Menu size={18} className="text-white/70" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`
        lg:hidden fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{ background: 'rgba(9, 14, 22, 0.98)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/50 hover:text-white"
        >
          <X size={16} />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 xl:w-60 h-screen sticky top-0 flex-shrink-0"
        style={{ background: 'rgba(9, 14, 22, 0.8)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <SidebarContent />
      </div>
    </>
  );
}
