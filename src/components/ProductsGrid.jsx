import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useProducts, useFastProducts as useFastProductsQuery } from '../hooks/useProductQueries';
import { useDebounce } from '../hooks/useDebounce';
import { useFastProducts } from '../hooks/useFastProducts';
import { queryClient } from '../lib/queryClient';

import CartSidebar from './CartSidebar';
import CategoryNavigation from './CategoryNavigation';
import ModernProductGrid from './ModernProductGrid';
import ProductLoader from './ProductLoader';
import ConstructionLoader from './ConstructionLoader';
import { SearchIcon, TimesIcon } from './Icons';


const ProductsGrid = ({
  cart,
  onAddToCart,
  isCartOpen,
  onToggleCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearch
}) => {

  // Direct search without debounce (like Craftsmen component)
  // Use selectedCategory directly instead of debouncing for instant category changes
  const debouncedCategory = selectedCategory || '';
  

  // No initial load state needed - show content immediately

  const [quickFilter, setQuickFilter] = useState('all');
  const [isPriceRatingSheetOpen, setIsPriceRatingSheetOpen] = useState(false);
  const [sheetMinPrice, setSheetMinPrice] = useState('');
  const [sheetMaxPrice, setSheetMaxPrice] = useState('');

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  // const [appliedMinRating, setAppliedMinRating] = useState('');
  // Infinite pagination handled by backend; we no longer slice locally

  const selectRef = useRef(null);

  // Category mapping function - frontend to backend
  // No mapping needed - use lowercase directly (backend uses case-insensitive regex)
  const getCategoryApiValue = (frontendCategory) => {
    return frontendCategory; // Pass through as-is
  };

  // Normalize categories to a canonical slug for reliable comparisons
  const normalizeCategory = (value) => {
    const v = (value || '').toString().trim().toLowerCase();
    if (!v) return '';
    const map = {
      'xoz-mag': 'xoz-mag',
      'xoz': 'xoz-mag',
      'mag': 'xoz-mag',
      'yevro-remont': 'yevro-remont',
      'yevro': 'yevro-remont',
      'remont': 'yevro-remont',
      'elektrika': 'elektrika',
      'dekor-mahsulotlar': 'dekor',
      'dekorativ-mahsulotlar': 'dekor',
      'dekorativ': 'dekor',
      'dekor': 'dekor',
      'santexnika': 'santexnika',
      'santexnik': 'santexnika',
    };
    return map[v] || v;
  };

  // Current page state for pagination
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPageChanging, setIsPageChanging] = useState(false);

  // Backend infinite pagination via React Query
  const mappedCategory = useMemo(() => {
    const result = debouncedCategory && debouncedCategory !== 'all' && debouncedCategory !== ''
      ? normalizeCategory(debouncedCategory)
      : '';

    return result;
  }, [debouncedCategory]);

  // Use fast products hook with pagination
  const {
    data: fastData,
    isLoading: fastLoading,
    isFetching: fastFetching,
    error: fastError,
    refetch: fastRefetch
  } = useFastProducts(mappedCategory, searchQuery || '', currentPageIndex + 1, 100);

  // Reset to first page when category or search changes
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [debouncedCategory, searchQuery]);

  // No category loading state needed

  // No infinite scroll - all products loaded at once

  // Get products for current page only
  const fetchedProducts = useMemo(() => {
    let products = [];
    
    // Use fast data for immediate display (backend handles pagination)
    if (fastData && fastData.products && fastData.products.length > 0) {
      products = [...fastData.products];
    }
    
    return products;
  }, [fastData]);

  // IMMEDIATE RENDER: Show content as soon as we have any products
  const shouldShowContent = fetchedProducts.length > 0;
  const isInitialLoading = !shouldShowContent && fastLoading;


  // No need to manage initial load state



  

  // Disabled background prefetch for faster initial load
  // Will be re-enabled after first successful load


  // No need for error handling of initial load state

  // No scroll-based loading - all products loaded at once


  // Initial loading state - ensure loading is true on first render
  // no-op


  // Removed complex filter change detection


  // no-op


  // Scroll event listener to close select dropdown
  useEffect(() => {
    const handleScroll = () => {
      if (selectRef.current) {
        selectRef.current.blur();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  // no-op


  // Simple category filtering
  const categoryFilteredProducts = useMemo(() => {
    if (!fetchedProducts || fetchedProducts.length === 0) return [];
    
    if (!debouncedCategory || debouncedCategory === 'all' || debouncedCategory === '') {
      return fetchedProducts;
    }
    
    const selectedSlug = normalizeCategory(debouncedCategory);
    
    const filtered = fetchedProducts.filter(product => {
      const productSlug = normalizeCategory(product.category);
      return productSlug === selectedSlug;
    });
    
    // No infinite loading - show results immediately
    
    return filtered;
  }, [fetchedProducts, debouncedCategory]);

  // Enhanced search - search in multiple fields (like Craftsmen component)
  const searchResults = useMemo(() => {
    let products = categoryFilteredProducts;
    
    // Apply search filter if there's a search query
    const q = (searchQuery || '').toLowerCase().trim();
    if (q) {
      products = products.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const badge = (product.badge || '').toLowerCase();
        
        return name.includes(q) || 
               category.includes(q) || 
               description.includes(q) || 
               badge.includes(q);
      });
    }
    
    return products;
  }, [categoryFilteredProducts, searchQuery]);

  // Final filtered products
  const filteredProducts = useMemo(() => {
    let products = searchResults || categoryFilteredProducts;

    // Price filter (fast operation)
    if (appliedMinPrice || appliedMaxPrice) {
      products = products.filter(product => {
        const price = parseInt(product.price?.toString().replace(/[^\d]/g, '') || '0');
        const min = appliedMinPrice ? parseInt(appliedMinPrice) : 0;
        const max = appliedMaxPrice ? parseInt(appliedMaxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Quick filter/sort (optimized)
    if (quickFilter !== 'all') {
      switch (quickFilter) {
        case 'mashhur':
          products.sort((a, b) => {
            const aHasPopularBadge = ((a.badge || '').toLowerCase().includes('mashhur')) || !!a.isPopular;
            const bHasPopularBadge = ((b.badge || '').toLowerCase().includes('mashhur')) || !!b.isPopular;
            if (aHasPopularBadge !== bHasPopularBadge) {
              return bHasPopularBadge - aHasPopularBadge;
            }
            const aPopularity = (a.reviews || 0) * (a.rating || 0);
            const bPopularity = (b.reviews || 0) * (b.rating || 0);
            return bPopularity - aPopularity;
          });
          break;
          
        case 'chegirma':
          products.sort((a, b) => {
            const aDiscount = a.oldPrice && a.oldPrice > a.price ? 
              ((a.oldPrice - a.price) / a.oldPrice) * 100 : 0;
            const bDiscount = b.oldPrice && b.oldPrice > b.price ? 
              ((b.oldPrice - b.price) / b.oldPrice) * 100 : 0;
            return bDiscount - aDiscount;
          });
          break;
          
        case 'yangi':
          products.sort((a, b) => {
            const aHasNewBadge = ((a.badge || '').toLowerCase().includes("yangi")) || !!a.isNew;
            const bHasNewBadge = ((b.badge || '').toLowerCase().includes("yangi")) || !!b.isNew;
            if (aHasNewBadge !== bHasNewBadge) {
              return bHasNewBadge - aHasNewBadge;
            }
            const aDate = new Date(a.createdAt || a.updatedAt || 0);
            const bDate = new Date(b.createdAt || b.updatedAt || 0);
            return bDate - aDate;
          });
          break;
      }
    } else {
      // Default sort by updatedAt (fast operation)
      products.sort((a, b) => {
        const aUpdated = new Date(a.updatedAt || 0);
        const bUpdated = new Date(b.updatedAt || 0);
        return bUpdated - aUpdated;
      });
    }

    return products;
  }, [categoryFilteredProducts, searchResults, appliedMinPrice, appliedMaxPrice, quickFilter]);

  // Backend pagination - get total pages from API response
  const totalPages = fastData?.pagination?.hasNextPage ? currentPageIndex + 2 : currentPageIndex + 1;
  
  // Use products directly from API (no local pagination needed)
  const paginatedProducts = fetchedProducts;
  
  // Debug pagination (removed to reduce console spam)

  // Fast page change function
  const changePage = useCallback((newPageIndex) => {
    if (isPageChanging) return; // Prevent multiple clicks
    
    setIsPageChanging(true);
    setCurrentPageIndex(newPageIndex);
    
    // Immediate scroll to products grid
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
      const rect = productsGrid.getBoundingClientRect();
      const scrollTop = window.pageYOffset + rect.top - 100; // 100px offset from top
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    } else {
      // Fallback to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Quick reset
    setTimeout(() => {
      setIsPageChanging(false);
    }, 100);
  }, [isPageChanging]);


  // Use centralized addToCart function
  const addToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  // Removed prefetch for simpler code


  // Manual refresh function


  // Price filter actions
  const applyPriceFilter = () => {
    const min = minPrice === '' ? '' : parseInt(minPrice, 10);
    const max = maxPrice === '' ? '' : parseInt(maxPrice, 10);

    if (min !== '' && max !== '' && max < min) {
      return; // invalid range, do nothing
    }

    setAppliedMinPrice(min === '' ? '' : String(min));
    setAppliedMaxPrice(max === '' ? '' : String(max));
  };

  const clearPriceFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
  };

  // Open bottom sheet for Narx/Baho filtering
  const openPriceRatingSheet = () => {
    setSheetMinPrice(appliedMinPrice || minPrice || '');
    setSheetMaxPrice(appliedMaxPrice || maxPrice || '');
    setIsPriceRatingSheetOpen(true);
  };

  const closePriceRatingSheet = () => setIsPriceRatingSheetOpen(false);

  const applyPriceRatingFromSheet = () => {
    // Apply min/max price from sheet
    const min = sheetMinPrice === '' ? '' : String(parseInt(sheetMinPrice, 10));
    const max = sheetMaxPrice === '' ? '' : String(parseInt(sheetMaxPrice, 10));
    if (min !== '' && max !== '' && parseInt(max, 10) < parseInt(min, 10)) {
      // swap to keep valid range
      setAppliedMinPrice(max);
      setAppliedMaxPrice(min);
      setMinPrice(max);
      setMaxPrice(min);
    } else {
      setAppliedMinPrice(min);
      setAppliedMaxPrice(max);
      setMinPrice(min);
      setMaxPrice(max);
    }
  };

  const calculateDiscount = (currentPrice, oldPrice) => {
    const current = parseInt(currentPrice?.toString().replace(/[^\d]/g, '') || '0');
    const old = parseInt(oldPrice?.toString().replace(/[^\d]/g, '') || '0');
    if (!old || !current || isNaN(old) || isNaN(current)) return 0;
    return Math.round(((old - current) / old) * 100);
  };

  // Handle category selection from CategoryNavigation
  const handleCategorySelect = useCallback((categoryName) => {
    // Use the parent's onCategorySelect if available
    if (onCategorySelect) {
      onCategorySelect(categoryName);
    }
    // Removed setCurrentCategory - not needed
  }, [onCategorySelect]);

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    if (fastRefetch) {
      fastRefetch();
    }
  }, [fastRefetch]);

  // No loader logic needed - show content immediately

  // No loader - show content immediately

  // Show error state if there's an API error and no products
  if (fastError && fetchedProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-6">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              Xatolik yuz berdi
            </h3>
            <p className="text-gray-500 mb-6">
              Mahsulotlarni yuklashda muammo yuz berdi. Iltimos, qayta urinib ko'ring.
            </p>
            <button
              onClick={handleRetry}
              className="bg-primary-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Qayta urinish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-6 pb-28 lg:pb-6">

      {/* Category Navigation - Mobile and Desktop */}
      <div className="mb-2">
        <CategoryNavigation
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          isDesktop={true}
        />
      </div>

      {/* Badge Filter */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 lg:gap-4">
            <span id="sort-label" className="text-gray-700 font-medium text-sm lg:text-base">Saralash:</span>
            <div className="relative">
              <select
                ref={selectRef}
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                className="custom-select custom-select-main"
                aria-labelledby="sort-label"
              >
                <option value="all">Hammasi</option>
                <option value="mashhur">Mashhur</option>
                <option value="chegirma">Chegirma</option>
                <option value="yangi">Yangi</option>
              </select>

            </div>

            {/* Price Filter (hidden on mobile) */}
            <span className="hidden sm:inline text-gray-700 font-medium text-sm lg:text-base">Narx:</span>
            <div className="hidden sm:flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="dan"
                value={minPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number.isInteger(parseFloat(value)) && parseFloat(value) >= 0)) {
                    setMinPrice(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',') {
                    e.preventDefault();
                  }
                }}
                aria-label="Minimal narx"
                className="w-20 lg:w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:border-primary-orange transition-colors duration-200 bg-white"
              />
              <span className="text-gray-400 text-sm">-</span>
              <input
                type="number"
                min="0"
                placeholder="oldin"
                value={maxPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number.isInteger(parseFloat(value)) && parseFloat(value) >= 0)) {
                    setMaxPrice(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.' || e.key === ',') {
                    e.preventDefault();
                  }
                }}
                aria-label="Maksimal narx"
                className="w-20 lg:w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:border-primary-orange transition-colors duration-200 bg-white"
              />

              <button
                onClick={applyPriceFilter}
                disabled={minPrice && maxPrice && parseInt(maxPrice) < parseInt(minPrice)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${minPrice && maxPrice && parseInt(maxPrice) < parseInt(minPrice)
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-primary-orange hover:bg-primary-orange/90 text-white'
                  }`}
              >
                Qidirish
              </button>

              {(appliedMinPrice || appliedMaxPrice) && (
                <button
                  onClick={clearPriceFilter}
                  aria-label="Filtrni tozalash"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-800 rounded transition-colors duration-200 flex items-center justify-center p-2 min-w-[44px] min-h-[44px]"
                  title="Tozalash"
                >
                  <TimesIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Narx filter bottom-sheet trigger */}
            <button
              onClick={openPriceRatingSheet}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 text-sm font-medium hover:bg-gray-50 sm:hidden"
              title="Narx bo'yicha filter"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              <span>Narx filtri</span>
            </button>
          </div>

        </div>
      </div>

      {/* Products Grid - IMMEDIATE DISPLAY */}
      {shouldShowContent ? (
        <>
          {/* Modern Product Grid with enhanced design */}
          <div id="products-grid">
            <ModernProductGrid
              products={paginatedProducts}
              onAddToCart={addToCart}
            />
          </div>

          {/* No infinite scroll sentinel needed */}

          {/* Pagination - always show when there are multiple pages */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {/* Previous Page */}
              {currentPageIndex > 0 && (
                <button
                  onClick={() => changePage(Math.max(0, currentPageIndex - 1))}
                  disabled={isPageChanging}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  ←
                </button>
              )}
              
              {/* Page Numbers - Always show first 5-7 pages when on early pages */}
              {(() => {
                const maxVisiblePages = 7; // Show more pages
                let startPage, endPage;
                
                if (currentPageIndex <= 2) {
                  // When on first 3 pages, show from page 1 onwards
                  startPage = 0;
                  endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
                } else if (currentPageIndex >= totalPages - 3) {
                  // When near the end, show last pages
                  endPage = totalPages - 1;
                  startPage = Math.max(0, totalPages - maxVisiblePages);
                } else {
                  // In the middle, center the current page
                  startPage = Math.max(0, currentPageIndex - Math.floor(maxVisiblePages / 2));
                  endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
                }
                
                return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                  const pageIndex = startPage + i;
                  const pageNum = pageIndex + 1;
                  const isCurrentPage = pageIndex === currentPageIndex;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageIndex)}
                      disabled={isPageChanging || isCurrentPage}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isCurrentPage 
                          ? 'bg-primary-orange text-white' 
                          : isPageChanging
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}
              
              {/* Next Page */}
              {currentPageIndex < totalPages - 1 && (
                <button
                  onClick={() => changePage(Math.min(totalPages - 1, currentPageIndex + 1))}
                  disabled={isPageChanging}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  →
                </button>
              )}
              
            </div>
          )}
          
        </>
      ) : isInitialLoading ? (
        // Clear construction-themed loader
        <ConstructionLoader 
          message="Mahsulotlar yuklanmoqda..."
          size="large"
          theme="orange"
        />
      ) : (
        // Show "no products" message only if we're not loading
        <div className="text-center py-16">
          <div className="text-gray-500 text-lg mb-2">Mahsulotlar topilmadi</div>
          <p className="text-gray-400">Boshqa kategoriya yoki qidiruv so'zini sinab ko'ring</p>
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

      {/* Bottom Sheet: Narx Filter (mobile) */}
      {isPriceRatingSheetOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={closePriceRatingSheet}></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl p-4 pt-3 max-h-[80vh] overflow-y-auto transition-transform duration-300">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Narx filtri</h3>
              <button onClick={closePriceRatingSheet} aria-label="Yopish" className="text-gray-600 hover:text-gray-800 p-2 min-w-[44px] min-h-[44px] rounded">
                <TimesIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Minimal narx (so'm)</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={sheetMinPrice}
                  onChange={(e) => setSheetMinPrice(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-orange"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Maksimal narx (so'm)</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={sheetMaxPrice}
                  onChange={(e) => setSheetMaxPrice(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-orange"
                  placeholder="5000000"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closePriceRatingSheet}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={applyPriceRatingFromSheet}
                className="flex-1 bg-primary-orange text-white py-2 rounded-lg font-semibold hover:bg-opacity-90"
              >
                Qo'llash
              </button>
            </div>
            <div style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsGrid;