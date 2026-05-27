import { NavLink } from 'react-router-dom'
import { Search, PlusCircle, MessageCircle, User, Sparkles } from 'lucide-react'

const tabs = [
  { to: '/',            icon: Search,        label: 'Explorer'    },
  { to: '/conseiller',  icon: Sparkles,      label: 'Conseiller'  },
  { to: '/publier',     icon: PlusCircle,    label: 'Publier'     },
  { to: '/messages',    icon: MessageCircle, label: 'Messages'    },
  { to: '/profil',      icon: User,          label: 'Profil'      },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border bottom-nav max-w-md mx-auto">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors duration-150
              ${isActive ? 'text-accent' : 'text-muted hover:text-ink'}`
            }>
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}