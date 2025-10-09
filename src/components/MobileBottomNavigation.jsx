import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CartFAIcon, 
  BoxFAIcon, 
  PhoneFAIcon, 
  UsersFAIcon, 
  GraduationCapFAIcon 
} from './FontAwesome';

const MobileBottomNavigation = ({ 
  cart = [], 
  isCartOpen = false, 
  onToggleCart,
  onSearch,
  onCategorySelect,
  getTotalItems = () => 0
}) => {
  const navigate = useNavigate();

  const handleHomeNavigation = () => {
    // Close cart if open
    if (isCartOpen && onToggleCart) {
      onToggleCart();
    }
    // Navigate to home
    navigate('/');
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleProductsNavigation = () => {
    // Close cart if open
    if (isCartOpen && onToggleCart) {
      onToggleCart();
    }
    // Navigate to home first
    navigate('/');
    // Clear search and category to show all products
    setTimeout(() => {
      if (onSearch) {
        onSearch('');
      }
      if (onCategorySelect) {
        onCategorySelect('');
      }
      // Scroll to products section if available
      const productsSection = document.getElementById('products');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleCraftsmenNavigation = () => {
    // Close cart if open
    if (isCartOpen && onToggleCart) {
      onToggleCart();
    }
    // Navigate to home first
    navigate('/');
    setTimeout(() => {
      const craftsmenSection = document.getElementById('craftsmen');
      if (craftsmenSection) {
        craftsmenSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleCartToggle = () => {
    if (onToggleCart) {
      onToggleCart();
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-lg" 
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}
    >
      <ul className="flex items-center justify-around py-4">
        {/* 1. Akademiya */}
        <li className="flex-1">
          <button
            onClick={handleHomeNavigation}
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
          >
            <GraduationCapFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Akademiya</span>
          </button>
        </li>

        {/* 2. Mahsulotlar */}
        <li className="flex-1">
          <button
            onClick={handleProductsNavigation}
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
            onClick={() => {
              // Close cart if open
              if (isCartOpen && onToggleCart) {
                onToggleCart();
              }
            }}
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
          >
            <PhoneFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Aloqa</span>
          </a>
        </li>

        {/* 4. Savatcha */}
        <li className="flex-1">
          <button
            onClick={handleCartToggle}
            className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full relative"
          >
            <CartFAIcon className="text-[18px]" />
            <span className="text-[11px] sm:text-xs font-medium">Savatcha</span>
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 right-2 z-10 bg-red-600 text-white text-[9px] font-bold leading-none min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-[4px] shadow-sm select-none pointer-events-none">
                {getTotalItems()}
              </span>
            )}
          </button>
        </li>

        {/* 5. Ustalar */}
        <li className="flex-1">
          <button
            onClick={handleCraftsmenNavigation}
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

export default MobileBottomNavigation;