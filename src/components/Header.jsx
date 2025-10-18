import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import CartSidebar from './CartSidebar';
import { 
  SearchFAIcon, 
  CartFAIcon, 
  ExclamationTriangleFAIcon
} from './FontAwesome';
import MobileBottomNavigation from './MobileBottomNavigation';

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  // Typeahead state
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [debouncedQuery] = useDebounce(searchQuery, 250);

  // Suggestions only (no real-time search)
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
        // Simple name matching
        const seen = new Set();
        const names = [];
        for (const product of products) {
          const name = product?.name;
          if (name && name.toLowerCase().includes(q) && !seen.has(name)) {
            seen.add(name);
            names.push(name);
          }
        }
        setSuggestions(names.slice(0, 8));
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

  const openAdminModal = () => {
    setShowLoginModal(true);
    // Lock background scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '17px';
  };

  const handleLogoInteraction = (e) => {
    // Prevent default behavior for both click and touch events on mobile
    e.preventDefault();

    // Desktop double-click triggers via onDoubleClick
    if (e.type === 'dblclick') {
      openAdminModal();
      return;
    }

    // Touch: detect double-tap within 400ms
    const now = Date.now();
    if (now - lastTap < 400) {
      openAdminModal();
      setLastTap(0);
    } else {
      setLastTap(now);
    }
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
      <header className="bg-primary-dark shadow-lg z-50 hidden lg:block" style={{ minHeight: '80px' }}>
        <div className="container mx-auto px-6">
          <div className="flex items-center py-2 gap-8" style={{ minHeight: '76px' }}>
            {/* Left side - Logo */}
            <div className="flex items-center min-w-fit">
              {/* Logo */}
              <div
                className="flex items-center space-x-3 cursor-pointer select-none"
                onDoubleClick={handleLogoInteraction}
                onTouchEnd={handleLogoInteraction}
                title=""
                style={{ userSelect: 'none' }}
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  loading="eager"
                  decoding="sync"
                  fetchpriority="high"
                  width="128"
                  height="128"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <img
                  src="/alibobo.png"
                  alt="Alibobo"
                  loading="eager"
                  decoding="sync"
                  fetchpriority="high"
                  width="256"
                  height="64"
                  className="h-16 w-32 object-cover"
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
                    aria-label="Qidirish"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-orange transition duration-300"
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
                aria-label="Savatchani ochish"
                className="relative bg-transparent hover:bg-gray-700 hover:bg-opacity-20 text-primary-orange px-3 py-2 rounded-lg transition duration-300"
              >
                <CartFAIcon className="text-xl" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 z-10 bg-red-600 text-white text-[10px] font-bold leading-none min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-[5px] shadow-sm select-none pointer-events-none">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header - Logo and Search - Hide when cart is open */}
      <header className={`bg-primary-dark shadow-lg lg:hidden transition-transform duration-300 ${isCartOpen ? '-translate-y-full' : 'translate-y-0'}`} style={{ minHeight: '64px' }}>
        <div className="container mx-auto mobile-header py-2">
          <div className="flex items-center justify-between gap-2" style={{ minHeight: '48px' }}>
            {/* Mobile Logo */}
            <div
              className="flex items-center space-x-1.5 cursor-pointer select-none mobile-logo-container"
              onDoubleClick={handleLogoInteraction}
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
                width="40"
                height="40"
                className="w-10 h-10 object-cover rounded-lg"
              />
              <img
                src="/alibobo.png"
                alt="Alibobo"
                loading="eager"
                decoding="sync"
                fetchpriority="high"
                width="120"
                height="30"
                className="h-8 w-20 object-cover alibobo-text"
              />
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mobile-search-form mobile-search-container">
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
                  className="w-full mobile-search-input bg-white border border-gray-300 rounded-md transition duration-300"
                />
                <button
                  type="submit"
                  aria-label="Qidirish"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-orange transition duration-300 p-1"
                >
                  <SearchFAIcon className="text-xs" />
                </button>
                {/* Close-match typeahead suggestions (mobile) */}
                {isFocused && debouncedQuery.trim().length >= 2 && suggestions.length > 0 && (
                  <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 mobile-suggestions overflow-auto">
                    {suggestions.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className="w-full text-left px-2 py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(name);
                            if (onSearch) onSearch(name);
                            setIsFocused(false);
                          }}
                        >
                          <span className="text-xs text-gray-800 truncate block">{name}</span>
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation
        cart={cart}
        isCartOpen={isCartOpen}
        onToggleCart={onToggleCart}
        onSearch={onSearch}
        onCategorySelect={onCategorySelect}
        getTotalItems={getTotalItems}
      />

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
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off" data-form-type="other">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Login
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
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
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
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
        onToggleCart={onToggleCart}
        onSearch={onSearch}
        onCategorySelect={onCategorySelect}
        getTotalItems={getTotalItems}
      />

      {/* Catalog Modal - Commented out as Catalog component is not defined */}
      {/* {isCategoryModalOpen && (
        <Catalog
          onCategorySelect={onCategorySelect}
          onClose={() => setIsCategoryModalOpen(false)}
          selectedCategory={selectedCategory}
        />
      )} */}
    </>
  );
};

export default Header;
