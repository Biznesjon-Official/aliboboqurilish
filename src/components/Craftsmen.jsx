import React, { useState, useCallback, useMemo, useEffect } from 'react';
import OptimizedImage from './OptimizedImage';
import { TimesFAIcon, PhoneFAIcon } from './FontAwesome';
import { CraftsmenGridSkeleton } from './LoadingSkeleton';

const Craftsmen = ({ craftsmenData = [], loading = false, initialSpecialty = '' }) => {
  // Filter only active craftsmen for the main page
  const activeCraftsmen = craftsmenData.filter(craftsman => craftsman.status === 'active');
  
  // Category filter and search state
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync with initialSpecialty from route changes
  useEffect(() => {
    setSelectedSpecialty(initialSpecialty || '');
  }, [initialSpecialty]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCraftsman, setSelectedCraftsman] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [currentLightboxIndex, setCurrentLightboxIndex] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callPhone, setCallPhone] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [modalSlideIndex, setModalSlideIndex] = useState(0);

  // Compute API base (same logic as hooks/useCraftsmanQueries)
  const API_BASE = useMemo(() => {
    if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (process.env.NODE_ENV === 'production' && origin) {
      return `${origin.replace(/\/$/, '')}/api`;
    }
    return 'http://localhost:5000/api';
  }, []);

  // Local state for full detail to power modal images
  const [selectedCraftDetail, setSelectedCraftDetail] = useState(null);
  useEffect(() => {
    let abort = false;
    const controller = new AbortController();
    const loadDetail = async (id) => {
      try {
        const resp = await fetch(`${API_BASE}/craftsmen/${id}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (!resp.ok) return;
        const data = await resp.json();
        if (!abort) setSelectedCraftDetail(data);
      } catch (_) {}
    };
    if (selectedCraftsman && selectedCraftsman._id) {
      setSelectedCraftDetail(null); // reset then load
      loadDetail(selectedCraftsman._id);
    } else {
      setSelectedCraftDetail(null);
    }
    return () => { abort = true; controller.abort(); };
  }, [selectedCraftsman, API_BASE]);

  // Helper function to format price safely
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "0 so'm/kun";
    return price.toLocaleString() + " so'm/kun";
  };

  // Card component that ensures we have all images (fetches detail only when needed)
  const CraftsmanCard = ({ craftsman, index }) => {
    const initialImages = useMemo(() => getCraftsmanImages(craftsman), [craftsman]);
    const [detail, setDetail] = useState(null);
    useEffect(() => {
      let abort = false;
      const controller = new AbortController();
      const fetchDetail = async () => {
        try {
          const resp = await fetch(`${API_BASE}/craftsmen/${craftsman._id}`, {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          if (!resp.ok) {
            // Silently fail for 404 or other errors to prevent console spam
            return;
          }
          const data = await resp.json();
          if (!abort) setDetail(data);
        } catch (error) {
          // Only log if it's not an abort error
          if (error.name !== 'AbortError') {
            // Silently fail to prevent console spam in development
          }
        }
      };
      if (craftsman && craftsman._id && initialImages.length <= 1) {
        fetchDetail();
      } else {
        setDetail(null);
      }
      return () => { abort = true; controller.abort(); };
    }, [craftsman, initialImages.length, API_BASE]);

    const images = useMemo(() => {
      const detailImages = detail ? getCraftsmanImages(detail) : [];
      return detailImages.length > initialImages.length ? detailImages : initialImages;
    }, [detail, initialImages]);

    return (
      <div className="bg-white rounded-xl shadow-lg hover-scale overflow-hidden">
        {images.length > 0 ? (
          <ImageCarousel images={images} craftsmanIndex={index} showPlaceholder={false} />
        ) : (
          <div className="h-48 bg-gray-100 rounded-t-xl" />
        )}

        <div className="p-2 sm:p-3 lg:p-4">
          <div className="mb-2 sm:mb-3">
            <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 line-clamp-1">{craftsman.name || 'Noma\'lum'}</h3>
            <p className="text-gray-600 text-xs sm:text-sm line-clamp-1">{craftsman.specialty || 'Mutaxassislik belgilanmagan'}</p>
            <p className="text-sm sm:text-base text-green-600 font-medium mt-1">{formatPrice(craftsman.price)}</p>
          </div>

          <div className="mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2 line-clamp-2">{craftsman.description || 'Tavsif mavjud emas'}</p>
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <span className="truncate text-xs">{craftsman.phone || '+998 00 000 00 00'}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="inline-flex items-center px-1.5 sm:px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Faol
            </span>
            <button 
              onClick={() => showCraftsmanDetails(craftsman)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              <span className="lg:hidden">Aloqa</span>
              <span className="hidden lg:inline">Bog'lanish</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Build image list for a craftsman based on sanitized backend fields
  // NOTE: On the main page we do NOT want to show placeholder.svg at all
  const getCraftsmanImages = (craftsman) => {
    if (!craftsman) return [];
    const out = [];

    const pushUrl = (val) => {
      if (!val) return;
      let s = null;
      if (typeof val === 'string') s = val;
      else if (typeof val === 'object') {
        s = val.url || val.src || val.image || val.path || null;
      }
      if (typeof s === 'string' && s.trim().length > 0) out.push(s.trim());
    };

    // Prefer sanitized fields from API
    pushUrl(craftsman.avatar);
    pushUrl(craftsman.portfolioPreview);

    // Portfolio: could be array of strings or objects
    if (Array.isArray(craftsman.portfolio)) {
      for (const p of craftsman.portfolio) pushUrl(p);
    }

    // Alternative keys often used
    if (Array.isArray(craftsman.photos)) {
      for (const p of craftsman.photos) pushUrl(p);
    }
    if (Array.isArray(craftsman.images)) {
      for (const p of craftsman.images) pushUrl(p);
    }

    // Legacy single image fields
    pushUrl(craftsman.image);
    pushUrl(craftsman.photo);

    // Deduplicate while preserving order
    const seen = new Set();
    const unique = out.filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });

    // Filter out placeholder.svg entirely for main page rendering
    const isPlaceholder = (u) =>
      typeof u === 'string' && /(^|\/)placeholder\.svg$/i.test(u);

    const filtered = unique.filter((u) => !isPlaceholder(u));
    return filtered; // may be empty; we will conditionally render UI
  };

  // Show craftsman details modal
  const showCraftsmanDetails = (craftsman) => {
    setSelectedCraftsman(craftsman);
    setIsModalOpen(true);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px'; // Prevent layout shift
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCraftsman(null);
    // Restore background scroll
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
  };

  // Open lightbox
  const openLightbox = (images, startIndex = 0) => {
    setLightboxImages(images);
    setCurrentLightboxIndex(startIndex);
    setIsLightboxOpen(true);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px'; // Prevent layout shift
  };

  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImages([]);
    setCurrentLightboxIndex(0);
    // Restore background scroll
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0px';
  };

  // Navigate lightbox
  const navigateLightbox = (direction) => {
    if (direction === 'prev' && currentLightboxIndex > 0) {
      setCurrentLightboxIndex(currentLightboxIndex - 1);
    } else if (direction === 'next' && currentLightboxIndex < lightboxImages.length - 1) {
      setCurrentLightboxIndex(currentLightboxIndex + 1);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Create a simple toast notification instead of alert
      const toast = document.createElement('div');
      toast.textContent = 'Telefon raqami nusxalandi!';
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      const toast = document.createElement('div');
      toast.textContent = 'Telefon raqami nusxalandi!';
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2000);
    }
  };

  // Modal image sliding functionality
  const slideModalImages = (direction) => {
    if (!selectedCraftsman) return;
    
    const source = selectedCraftDetail || selectedCraftsman;
    const images = getCraftsmanImages(source);
    const itemsPerPage = window.innerWidth < 640 ? 2 : 3;
    const maxSlide = Math.max(0, images.length - itemsPerPage);
    
    if (direction === 'prev' && modalSlideIndex > 0) {
      setModalSlideIndex(modalSlideIndex - 1);
    } else if (direction === 'next' && modalSlideIndex < maxSlide) {
      setModalSlideIndex(modalSlideIndex + 1);
    }
  };

  // Handle phone call - mobile vs desktop
  const handlePhoneCall = (phone) => {
    // Better mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768 || 
                     'ontouchstart' in window;
    
    if (isMobile) {
      // Mobile - direct call
      window.location.href = `tel:${phone}`;
    } else {
      // Desktop - show call modal
      setCallPhone(phone);
      setShowCallModal(true);
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Prevent layout shift
    }
  };

  // Image carousel component - exactly like ustalar-qismi with hover effect
  const ImageCarousel = ({ images, craftsmanIndex, showPlaceholder = true }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lastHoverTime, setLastHoverTime] = useState(0);
    const hoverDelay = 800; // 800ms delay between changes (slower)

    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      if (currentTime - lastHoverTime < hoverDelay) {
        return; // Too soon, ignore this hover
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      
      let newIndex;
      if (x < width / 2) {
        // Left side - previous image (don't loop to last image)
        newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentImageIndex;
      } else {
        // Right side - next image (don't loop to first image)
        newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : currentImageIndex;
      }
      
      if (newIndex !== currentImageIndex) {
        setCurrentImageIndex(newIndex);
        setLastHoverTime(currentTime);
      }
    };

    const handleMouseLeave = () => {
      // Keep the current image active when mouse leaves
      // Do not reset to first image
      setLastHoverTime(0);
    };

    return (
      <div 
        className="image-carousel h-48 bg-gray-100 rounded-t-xl cursor-pointer relative overflow-hidden"
        onClick={() => openLightbox(images, currentImageIndex)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {images.map((image, index) => (
          <div key={index} className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`} style={{ opacity: index === currentImageIndex ? 1 : 0 }}>
            <OptimizedImage
              src={image}
              alt="Ish namunasi"
              className="w-full h-full"
              objectFit="cover"
              placeholder="skeleton"
              fallbackSrc={showPlaceholder ? "/assets/ustalar/placeholder.svg" : undefined}
              priority={true}
              loading="eager"
            />
          </div>
        ))}
      </div>
    );
  };

  // Build specialties list from active craftsmen and derive filtered list
  const specialties = Array.from(
    new Set(activeCraftsmen.map(c => c.specialty).filter(Boolean))
  ).sort();

  const displayedCraftsmen = (() => {
    let list = selectedSpecialty
      ? activeCraftsmen.filter(c => c.specialty === selectedSpecialty)
      : activeCraftsmen;
    const q = (searchTerm || '').toLowerCase().trim();
    if (q) {
      list = list.filter(c => {
        const name = (c.name || '').toLowerCase();
        const spec = (c.specialty || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return name.includes(q) || spec.includes(q) || desc.includes(q) || phone.includes(q);
      });
    }
    return list;
  })();

  return (
    <>
      {/* Header - Mobile Responsive */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 text-center">Professional Ustalar</h1>
          <p className="text-sm sm:text-base text-gray-600 text-center mt-2">Eng malakali hunarmandlar bilan tanishing</p>
        </div>
      </header>

      {/* Main Content - Mobile Responsive Grid */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 lg:pb-12">
        {/* Search input with clear (x) */}
        <div className="mb-4">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ustalar bo'yicha qidirish (ism, mutaxassislik, telefon)"
              className="w-full px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition duration-300 text-sm sm:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-700 rounded flex items-center justify-center"
                aria-label="Qidiruvni yopish"
              >
                <TimesFAIcon className="text-sm" />
              </button>
            )}
          </div>
        </div>
        {/* Specialties under the title */}
        {specialties.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              <button
                onClick={() => setSelectedSpecialty('')}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
                  selectedSpecialty === ''
                    ? 'bg-orange-500 text-white border-orange-500 shadow'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Barchasi
              </button>
              {specialties.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
                    selectedSpecialty === spec
                      ? 'bg-orange-500 text-white border-orange-500 shadow'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  title={spec}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
          {displayedCraftsmen.map((craftsman, index) => (
            <CraftsmanCard key={craftsman._id} craftsman={craftsman} index={index} />
          ))}
        </div>

        {/* Empty State - Only show if not loading and no data */}
        {displayedCraftsmen.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="w-16 sm:w-24 h-16 sm:h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Ustalar topilmadi</h3>
            <p className="text-sm sm:text-base text-gray-500">
              {selectedSpecialty || searchTerm 
                ? 'Tanlangan filtrlar bo\'yicha ustalar topilmadi' 
                : 'Hozircha ustalar ma\'lumotlari mavjud emas'
              }
            </p>
          </div>
        )}

        {/* Loading State - Show skeleton while data is being fetched */}
        {loading && displayedCraftsmen.length === 0 && (
          <CraftsmenGridSkeleton count={6} />
        )}
      </main>

      {/* Master Details Modal - Mobile Responsive */}
      {isModalOpen && selectedCraftsman && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
          style={{ zIndex: 999999 }}
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg max-w-lg w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto modal-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-white p-4 rounded-t-lg border-b">
              <button 
                onClick={closeModal}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 z-10 p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 pr-8 sm:pr-10">Usta haqida ma'lumot</h2>
            </div>

            {/* Work samples - hide completely if only placeholder */}
            <div className="px-3 sm:px-4 pt-4 sm:pt-6 pb-4">
              {(() => {
                const source = selectedCraftDetail || selectedCraftsman;
                const images = getCraftsmanImages(source);
                if (images.length === 0) return null;
                return (
                  <div className="mb-6">
                    <div className="relative">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
                        <div className="col-span-2 sm:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 transition-all duration-300">
                          {images.slice(modalSlideIndex, modalSlideIndex + (window.innerWidth < 640 ? 2 : 3)).map((img, index) => (
                            <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(images, modalSlideIndex + index)}>
                              <OptimizedImage
                                src={img}
                                alt={`Ish namunasi ${modalSlideIndex + index + 1}`}
                                className="w-full h-full"
                                objectFit="cover"
                                placeholder="skeleton"
                                fallbackSrc={undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      {(() => {
                        const itemsPerPage = window.innerWidth < 640 ? 2 : 3;
                        if (images.length > itemsPerPage) {
                          const maxSlide = Math.max(0, images.length - itemsPerPage);
                          return (
                            <div className="flex justify-between items-center">
                              <button
                                onClick={() => slideModalImages('prev')}
                                disabled={modalSlideIndex === 0}
                                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <div className="flex items-center justify-center space-x-1">
                                {Array.from({ length: maxSlide + 1 }, (_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                                      i === modalSlideIndex ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <button
                                onClick={() => slideModalImages('next')}
                                disabled={modalSlideIndex >= maxSlide}
                                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Craftsman Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{(selectedCraftDetail || selectedCraftsman).name}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-1">{(selectedCraftDetail || selectedCraftsman).specialty}</p>
                <p className="text-base sm:text-lg text-green-600 font-semibold">{formatPrice((selectedCraftDetail || selectedCraftsman).price)}</p>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Tavsif:</h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{(selectedCraftDetail || selectedCraftsman).description || 'Tavsif mavjud emas'}</p>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Aloqa:</h4>
                <div className="flex items-center text-sm sm:text-base text-gray-600">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <span>{(selectedCraftDetail || selectedCraftsman).phone}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handlePhoneCall((selectedCraftDetail || selectedCraftsman).phone)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <PhoneFAIcon className="mr-2" />
                  <span className="hidden sm:inline">Qo'ng'iroq qilish</span>
                  <span className="sm:hidden">Qo'ng'iroq</span>
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Call Modal - exactly like ustalar-qismi */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Telefon raqami
              </h3>
              
              <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300">
                  <p className="text-xl font-mono font-semibold text-gray-800">{callPhone}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <button
                  onClick={() => copyToClipboard(callPhone)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {showCopySuccess ? (
                    <>
                      <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Nusxalandi
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Nusxalash
                    </>
                  )}
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-6 space-y-2">
                <p><strong>1-qadam:</strong> Yuqoridagi "Nusxalash" tugmasini bosing</p>
                <p><strong>2-qadam:</strong> Telefoningizni oling</p>
                <p><strong>3-qadam:</strong> Raqamni terib, qo'ng'iroq qiling</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCallModal(false);
                    setShowCopySuccess(false);
                    // Restore background scroll
                    document.body.style.overflow = 'auto';
                    document.body.style.paddingRight = '0px';
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Lightbox - exactly like ustalar-qismi */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center" style={{ zIndex: 999999 }}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Previous button */}
            {lightboxImages.length > 1 && currentLightboxIndex > 0 && (
              <button 
                onClick={() => navigateLightbox('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/30 rounded-full p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Next button */}
            {lightboxImages.length > 1 && currentLightboxIndex < lightboxImages.length - 1 && (
              <button 
                onClick={() => navigateLightbox('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-black/30 rounded-full p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            
            {/* Image container */}
            <div className="relative w-full h-full flex items-center justify-center p-8 no-scrollbar">
              <img 
                src={lightboxImages[currentLightboxIndex]} 
                alt="Ish namunasi" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                <span>{currentLightboxIndex + 1} / {lightboxImages.length}</span>
              </div>
              
              {/* Image title */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
                <p className="text-sm font-medium">Ish namunasi</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .hover-scale {
          transition: transform 0.3s ease;
        }
        .hover-scale:hover {
          transform: scale(1.02);
        }
        .image-carousel img {
          transition: opacity 0.3s ease;
        }
        
        /* Custom scrollbar styles */
        .modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        
        .modal-scroll::-webkit-scrollbar {
          width: 4px;
        }
        
        .modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .modal-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 2px;
        }
        
        .modal-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
        
        /* Hide scrollbar completely for lightbox */
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default Craftsmen;