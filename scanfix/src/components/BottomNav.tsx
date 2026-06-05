import type { Page } from '../App';
import type { AppUser } from '../types';

interface NavItem { id: Page; icon: string; label: string; roles?: string[] }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '⊞', label: 'Home' },
  { id: 'new-entry', icon: '+', label: 'New' },
  { id: 'active',    icon: '🔧', label: 'Active' },
  { id: 'completed', icon: '✓', label: 'Done' },
  { id: 'search',    icon: '🔍', label: 'Search' },
];

interface Props { current: Page; onChange: (p: Page) => void; user: AppUser }

export default function BottomNav({ current, onChange, user }: Props) {
  const items = NAV_ITEMS.filter(item => {
    if (item.id === 'new-entry' && user.role === 'mechanic') return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 z-30">
      <div className="flex">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
              current === item.id ? 'text-yellow-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">
              {item.id === 'new-entry' ? (
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-2xl font-bold ${current === item.id ? 'bg-yellow' : 'bg-dark'}`}>+</span>
              ) : item.icon}
            </span>
            <span className={`text-[10px] font-medium ${current === item.id ? 'text-yellow-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
