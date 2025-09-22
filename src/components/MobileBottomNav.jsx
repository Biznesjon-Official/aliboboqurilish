import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCapFAIcon,
  BoxFAIcon,
  PhoneFAIcon,
  CartFAIcon,
  UsersFAIcon
} from './FontAwesome';

// Mobile bottom navigation for pages that don't render Header (e.g., ProductDetailPage)
// Mirrors the bottom navbar used on the home page.
const MobileBottomNav = () => {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
    >
      <ul className="flex items-center justify-around py-4">
        {/* 1. Akademiya */}
        <li className="flex-1">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
          >
            <GraduationCapFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Akademiya</span>
          </button>
        </li>

        {/* 2. Mahsulotlar */}
        <li className="flex-1">
          <button
            onClick={() => navigate('/#products')}
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
          >
            <BoxFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Mahsulotlar</span>
          </button>
        </li>

        {/* 3. Aloqa */}
        <li className="flex-1">
          <a
            href="tel:+998919771111"
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
          >
            <PhoneFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Aloqa</span>
          </a>
        </li>

        {/* 4. Savatcha */}
        <li className="flex-1">
          <button
            onClick={() => navigate('/', { state: { openCart: true } })}
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full relative"
          >
            <CartFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Savatcha</span>
          </button>
        </li>

        {/* 5. Ustalar */}
        <li className="flex-1">
          <button
            onClick={() => navigate('/#craftsmen')}
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
          >
            <UsersFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Ustalar</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default MobileBottomNav;

