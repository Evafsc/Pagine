import { NavLink } from 'react-router-dom'
import { Search, PlusCircle, MessageCircle, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const tabs = [
  { to: '/',          icon: Search,        label: 'Explorer'  },
  { to: '/publier',   icon: PlusCircle,    label: 'Publier'   },
  { to: '/messages',  icon: MessageCircle, label: 'Messages', badge: true },
  { to: '/profil',    icon: User,          label: 'Profil'    },
]

export function BottomNav({ unreadCount = 0 }) {
  const { user } = useAuthStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border bottom-nav max-w-md mx-auto">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors duration-150 relative
              ${isActive ? 'text-accent' : 'text-muted hover:text-ink'}`
            }
          >
            <div className="relative">
              <Icon size={22} strokeWidth={1.75} />
              {badge && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
