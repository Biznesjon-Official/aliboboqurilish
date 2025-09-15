import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { useFuzzySearch } from '../hooks/useFuzzySearch';
import CartSidebar from './CartSidebar';
import CategorySection from './CategorySection';
import Catalog from './Catalog';
import { 
  SearchFAIcon, 
  CartFAIcon, 
  BoxFAIcon, 
  PhoneFAIcon, 
  UserFAIcon, 
  ExclamationTriangleFAIcon,
  GraduationCapFAIcon 
} from './FontAwesome';
import { getFuzzyMatches } from '../hooks/useFuzzySearch';

const Header = ({
  onSuccessfulLogin,
  cart,
  isCartOpen,
  onToggleCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
  getTotalItems,
  onCategorySelect,
  selectedCategory,
  onSearch
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  // Typeahead state
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [debouncedQuery] = useDebounce(searchQuery, 250);

  // Fetch and filter close-match suggestions based on debounced input
  useEffect(() => {
    const q = (debouncedQuery || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const url = `/api/products?search=${encodeURIComponent(q)}&limit=20`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to load suggestions');
        const data = await res.json();
        const products = Array.isArray(data?.products) ? data.products : [];
        // Use fuzzy matcher to get only close matches
        const matches = getFuzzyMatches(products, q, 10);
        const seen = new Set();
        const names = [];
        for (const m of matches) {
          const name = m?.product?.name || '';
          if (name && !seen.has(name)) {
            seen.add(name);
            names.push(name);
          }
        }
        setSuggestions(names);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Suggestion fetch error:', err.message);
          setSuggestions([]);
        }
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [debouncedQuery]);

  // All suggestion-related helpers removed

  // Removed close-on-scroll logic (no suggestions panel)

  const handleLogoInteraction = (e) => {
    // Prevent default behavior for both click and touch events on mobile
    e.preventDefault();
    
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    // Reset tap count if too much time has passed
    if (tapLength > 500) {
      setTapCount(2);
    } else {
      setTapCount(prev => {
        const newCount = prev + 1;
        // Check if this is the second tap (double tap)
        if (newCount === 2) {
          console.log('Logo double tapped!');
          setShowLoginModal(true);
          // Lock background scroll
          document.body.style.overflow = 'hidden';
          document.body.style.paddingRight = '17px';
          return 0; // Reset count
        }
        return newCount;
      });
    }
    
    setLastTap(currentTime);
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === 'admin' && password === 'admin123') {
      setShowLoginModal(false);
      setUsername('');
      setPassword('');

      // Restore background scroll
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';

      if (onSuccessfulLogin) {
        onSuccessfulLogin();
      }

      navigate('/admin');
    } else {
      setErrorMessage('Noto\'g\'ri login yoki parol!');
      setShowErrorModal(true);
      setShowLoginModal(false);
      // Keep scroll locked for error modal
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
    setUsername('');
    setPassword('');
    // Restore background scroll
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    // Always propagate the query (including empty) so clearing input resets results
    if (onSearch) {
      onSearch(q);
    }
  };

  // Removed unused showProducts function

  const toggleCart = () => {
    if (onToggleCart) {
      onToggleCart();
    }
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-primary-dark shadow-lg z-50 hidden lg:block">
        <div className="container mx-auto px-6">
          <div className="flex items-center py-2 gap-8">
            {/* Left side - Logo */}
            <div className="flex items-center min-w-fit">
              {/* Logo */}
              <div
                className="flex items-center space-x-3 cursor-pointer select-none"
                onClick={handleLogoInteraction}
                onTouchEnd={handleLogoInteraction}
                title="Admin panel uchun 2 marta bosing"
                style={{ userSelect: 'none' }}
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  loading="eager"
                  decoding="sync"
                  fetchpriority="high"
                  width="48"
                  height="48"
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <img
                  src="/alibobo.png"
                  alt="Alibobo"
                  loading="eager"
                  decoding="sync"
                  fetchpriority="high"
                  width="144"
                  height="56"
                  className="h-14 w-36 object-cover"
                />
              </div>
            </div>

            {/* Centered Search Bar */}
            <div className="flex-1 flex justify-center">
              <form onSubmit={handleSearch} className="w-full max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchQuery(v);
                      // If cleared, immediately clear global search so products reload
                      if (v.trim() === '' && onSearch) {
                        onSearch('');
                      }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    placeholder="Mahsulotlar va turkumlar izlash"
                    className="w-full px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition duration-300"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-orange transition duration-300"
                  >
                    <SearchFAIcon className="text-base" />
                  </button>
                  {/* Close-match typeahead suggestions (desktop) */}
                  {isFocused && debouncedQuery.trim().length >= 2 && suggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-md z-50 max-h-80 overflow-auto">
                      {suggestions.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSearchQuery(name);
                              if (onSearch) onSearch(name);
                              setIsFocused(false);
                            }}
                          >
                            <span className="text-sm text-gray-800">{name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>
            </div>

            {/* Right side - Cart Button */}
            <div className="flex items-center min-w-fit ml-auto">
              <button
                onClick={toggleCart}
                className="relative bg-transparent hover:bg-gray-700 hover:bg-opacity-20 text-primary-orange px-3 py-2 rounded-lg transition duration-300"
              >
                <CartFAIcon className="text-xl" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header - Logo and Search - Hide when cart is open */}
      <header className={`bg-primary-dark shadow-lg lg:hidden transition-transform duration-300 ${isCartOpen ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center  justify-between gap-3">
            {/* Mobile Logo */}
            <div
              className="flex items-center space-x-2 cursor-pointer select-none min-w-fit"
              onClick={handleLogoInteraction}
              onTouchEnd={handleLogoInteraction}
              title="Admin panel uchun 2 marta bosing"
              style={{ userSelect: 'none' }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                loading="eager"
                decoding="sync"
                fetchpriority="high"
                width="32"
                height="32"
                className="w-8 h-8 object-cover rounded-lg"
              />
              <img
                src="/alibobo.png"
                alt="Alibobo"
                loading="eager"
                decoding="sync"
                fetchpriority="high"
                width="96"
                height="32"
                className="h-8 w-24 object-cover"
              />
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="flex-none w-36 ">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchQuery(v);
                    if (v.trim() === '' && onSearch) {
                      onSearch('');
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                  placeholder="Qidiruv"
                  className="w-full px-3 py-1.5 pr-8 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition duration-300 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-orange transition duration-300"
                >
                  <SearchFAIcon className="text-xs" />
                </button>
                {/* Close-match typeahead suggestions (mobile) */}
                {isFocused && debouncedQuery.trim().length >= 2 && suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-md z-50 max-h-80 overflow-auto">
                    {suggestions.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(name);
                            if (onSearch) onSearch(name);
                            setIsFocused(false);
                          }}
                        >
                          <span className="text-sm text-gray-800">{name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Orqa fon bilan */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}>
        <ul className="flex items-center justify-around py-4">
          {/* 1. Akademiya */}
          <li className="flex-1">
            <button
              onClick={() => {
                // Close cart if open
                if (isCartOpen) {
                  onToggleCart();
                }
                // Scroll to top and show both products and craftsmen
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
              className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
            >
              <GraduationCapFAIcon className="text-[18px]" />
              <span className="text-[11px] sm:text-xs font-medium">Akademiya</span>
            </button>
          </li>

          {/* 2. Mahsulotlar */}
          <li className="flex-1">
            <button
              onClick={() => {
                // Close cart if open
                if (isCartOpen) {
                  onToggleCart();
                }
                // Clear search and category to show all products
                setSearchQuery('');
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
              }}
              className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
            >
              <BoxFAIcon className="text-[18px]" />
              <span className="text-[11px] sm:text-xs font-medium">Mahsulotlar</span>
            </button>
          </li>

          {/* 3. Aloqa */}
          <li className="flex-1">
            <a
              href="tel:+998948494956"
              onClick={() => {
                // Close cart if open
                if (isCartOpen) {
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
              onClick={toggleCart}
              className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full relative"
            >
              <CartFAIcon className="text-[18px]" />
              <span className="text-[11px] sm:text-xs font-medium">Savatcha</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 right-3 bg-red-500 text-white text-[8px] rounded-full h-3 w-3 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </li>

          {/* 5. Ustalar */}
          <li className="flex-1">
            <button
              onClick={() => {
                // Close cart if open
                if (isCartOpen) {
                  onToggleCart();
                }
                const craftsmenSection = document.getElementById('craftsmen');
                if (craftsmenSection) {
                  craftsmenSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }}
              className="flex flex-col items-center px-1 text-gray-700 hover:text-primary-orange transition duration-200 w-full"
            >
              <UserFAIcon className="text-[18px]" />
              <span className="text-[11px] sm:text-xs font-medium">Ustalar</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Panel</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Login
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange"
                  placeholder="Login kiriting"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Parol
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange"
                  placeholder="Parol kiriting"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition duration-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-orange text-white py-2 rounded-lg hover:bg-opacity-90 transition duration-300"
                >
                  Kirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4"
          onClick={closeErrorModal}
        >
          <div
            className="bg-white rounded-xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-lg bg-red-500">
              <ExclamationTriangleFAIcon className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mt-5">Login Xatoligi!</h2>
            <p className="text-gray-600 mt-2 text-sm px-4">
              {errorMessage}
            </p>
            <button
              onClick={closeErrorModal}
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-semibold mt-6"
            >
              Yaxshi
            </button>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => onToggleCart && onToggleCart()}
        cart={cart || []}
        onRemoveFromCart={onRemoveFromCart}
        onUpdateQuantity={onUpdateQuantity}
        onCheckout={onCheckout}
      />

      {/* Catalog Modal */}
      {isCategoryModalOpen && (
        <Catalog
          onCategorySelect={onCategorySelect}
          onClose={() => setIsCategoryModalOpen(false)}
          selectedCategory={selectedCategory}
        />
      )}
    </>
  );
};

export default Header;
