import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Mobile-only bottom navigation for admin pages
// Mirrors links found in AdminSidebar for consistency
const links = [
  { key: 'dashboard', icon: 'fas fa-chart-line', label: 'Dashboard' },
  { key: 'craftsmen', icon: 'fas fa-users', label: 'Ustalar', badge: 'craftsmenCount' },
  { key: 'products', icon: 'fas fa-box', label: 'Mahsulotlar', badge: 'productsCount' },
  { key: 'orders', icon: 'fas fa-shopping-cart', label: 'Buyurtmalar', badge: 'ordersCount' },
  { key: 'home', icon: 'fas fa-home', label: 'Bosh sahifa' },
];

const defaultCounts = { craftsmenCount: 0, productsCount: 0, ordersCount: 0 };

const AdminBottomNav = ({ counts = defaultCounts }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname || '';
  let activeSection = 'dashboard';
  if (pathname.startsWith('/admin')) {
    const rest = pathname.slice('/admin');
    const first = rest.split('/').filter(Boolean)[0];
    activeSection = first || 'dashboard';
  }

  const handleNavigate = (key) => {
    if (key === 'home') navigate('/');
    else if (key === 'dashboard') navigate('/admin');
    else navigate(`/admin/${key}`);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-[-2px] bg-primary-dark border-t border-gray-700 shadow-2xl z-40 lg:hidden"
      role="navigation"
      aria-label="Admin bottom navigation"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-stretch justify-around">
        {links.map((link) => {
          const isActive = activeSection === link.key;
          return (
            <li key={link.key} className="flex-1">
              <button
                type="button"
                onClick={() => handleNavigate(link.key)}
                className={
                  'relative w-full h-full flex flex-col items-center justify-center py-3 text-xs transition-colors ' +
                  (isActive ? 'text-primary-orange' : 'text-gray-300 hover:text-primary-orange')
                }
                title={link.label}
              >
                <div className="relative">
                  <i className={`${link.icon} text-sm`}></i>
                </div>
                <span className="mt-0.5 text-[10px] leading-none">{link.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default AdminBottomNav;