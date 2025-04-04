'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaUtensils, FaCalendarAlt, FaRandom, FaChartPie, FaChevronRight } from 'react-icons/fa';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleNavigation = (path: string) => {
    if (path === '/dashboard/foods') {
      router.push('/dashboard?panel=foods');
    } else if (path === '/dashboard/meal-plans') {
      router.push('/dashboard?panel=meal-plans');
    } else {
      router.push(path);
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FaChartPie className="text-lg" />,
    },
    {
      name: 'My Meals',
      path: '/dashboard/foods',
      icon: <FaUtensils className="text-lg" />,
    },
    {
      name: 'Meal Plans',
      path: '/dashboard/meal-plans',
      icon: <FaCalendarAlt className="text-lg" />,
    },
    {
      name: 'Random Meal',
      path: '/dashboard/random',
      icon: <FaRandom className="text-lg" />,
    },
  ];

  return (
    <div className="border border-border p-6">
      <h2 className="text-lg font-medium mb-6 text-primary">
        Menu
      </h2>
      
      <nav>
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex items-center py-2 transition-colors duration-200 w-full text-left
                  ${isActive(item.path) 
                    ? 'text-accent font-medium' 
                    : 'text-text-primary hover:text-accent'}
                `}
              >
                <span className={`mr-3 ${isActive(item.path) ? 'text-accent' : 'text-text-secondary'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
                {isActive(item.path) && (
                  <FaChevronRight className="ml-auto text-accent text-sm" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-8 pt-6 border-t border-border">
        <div className="bg-accent bg-opacity-5 p-4">
          <div className="text-xs uppercase tracking-wider text-text-secondary mb-2">
            SAVED MEALS
          </div>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-medium text-accent">12</div>
            <div className="badge bg-accent bg-opacity-10 text-accent px-2 py-0.5">+3 this week</div>
          </div>
        </div>
      </div>
    </div>
  );
} 