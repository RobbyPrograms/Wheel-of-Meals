'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaUtensils, FaDharmachakra, FaCalendarAlt, FaLightbulb, FaCog } from 'react-icons/fa';

export default function DashboardSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FaHome className="mr-3" />,
    },
    {
      name: 'My Foods',
      path: '/dashboard/foods',
      icon: <FaUtensils className="mr-3" />,
    },
    {
      name: 'Meal Wheel',
      path: '/dashboard/wheel',
      icon: <FaDharmachakra className="mr-3" />,
    },
    {
      name: 'Meal Planning',
      path: '/dashboard/meal-plan',
      icon: <FaCalendarAlt className="mr-3" />,
    },
    {
      name: 'AI Suggestions',
      path: '/dashboard/suggestions',
      icon: <FaLightbulb className="mr-3" />,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center px-4 py-2 rounded-md ${
              isActive(item.path)
                ? 'bg-secondary/10 text-secondary'
                : 'hover:bg-gray-100'
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
        <div className="border-t my-4"></div>
        <Link
          href="/setup"
          className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100"
        >
          <FaCog className="mr-3" />
          Database Setup
        </Link>
      </nav>
    </div>
  );
} 