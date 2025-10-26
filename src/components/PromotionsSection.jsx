  import React, { useState, useEffect } from 'react';

  const PromotionsSection = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentCenterIndex, setCurrentCenterIndex] = useState(1); // Start with middle promotion in center for desktop
    const [mobileCurrentIndex, setMobileCurrentIndex] = useState(0); // Mobile carousel index
    const [direction, setDirection] = useState('right'); // Track slide direction

    // API configuration
    const API_BASE = (() => {
      if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (process.env.NODE_ENV === 'production' && origin) {
        return `${origin.replace(/\/$/, '')}/api`;
      }
      return 'http://localhost:5000/api';
    })();

    // Fetch promotions from API
    useEffect(() => {
      setLoading(true);
      
      const fetchPromotions = async () => {
        try {
          const response = await fetch(`${API_BASE}/promotions?limit=6&active=true`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.promotions && data.promotions.length > 0) {
              setPromotions(data.promotions);
            } else {
              // No active promotions found
              setPromotions([]);
            }
          } else {
            // API error, no promotions
            setPromotions([]);
          }
        } catch (apiError) {
          console.log('API not available, no promotions will be shown');
          setPromotions([]);
        } finally {
          setLoading(false);
        }
      };

      fetchPromotions();
    }, [API_BASE]);



    // Handle side banner click - move to center
    const handleSideBannerClick = (index) => {
      setCurrentCenterIndex(index);
    };

    // Handle mobile banner click - move to center
    const handleMobileBannerClick = (index) => {
      setMobileCurrentIndex(index);
    };

    // Handle center banner click - navigate to URL
    const handleCenterBannerClick = async (promotion) => {
      try {
        // Track click
        await fetch(`${API_BASE}/promotions/${promotion._id}/click`, {
          method: 'POST'
        });
        
        // Navigate to target URL if available
        if (promotion.targetUrl) {
          window.location.href = promotion.targetUrl;
        }
      } catch (error) {
        console.error('Error tracking promotion click:', error);
        // Still navigate even if tracking fails
        if (promotion.targetUrl) {
          window.location.href = promotion.targetUrl;
        }
      }
    };

    // Don't show loading state, just wait for data

    // Only show promotions if we have active ones from API
    const displayPromotions = promotions;

    // Get arranged promotions based on current center index
    const getArrangedPromotions = () => {
      if (!displayPromotions || displayPromotions.length < 3) return { left: null, center: null, right: null };
      
      const center = displayPromotions[currentCenterIndex];
      const left = displayPromotions[(currentCenterIndex - 1 + displayPromotions.length) % displayPromotions.length];
      const right = displayPromotions[(currentCenterIndex + 1) % displayPromotions.length];
      
      return { left, center, right };
    };

    // Don't render anything if no active promotions
    if (!displayPromotions || displayPromotions.length === 0) {
      return null;
    }

    return (
      <div className="w-full bg-white py-4 md:py-6">
        <div className="w-full">


          {/* Desktop: True Carousel - Cards Slide */}
          <div className="hidden md:block relative">
            {/* Left Arrow */}
            <button
              onClick={() => {
                setDirection('left');
                setCurrentCenterIndex((currentCenterIndex - 1 + displayPromotions.length) % displayPromotions.length);
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110"
              aria-label="Oldingi"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Right Arrow */}
            <button
              onClick={() => {
                setDirection('right');
                setCurrentCenterIndex((currentCenterIndex + 1) % displayPromotions.length);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110"
              aria-label="Keyingi"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="overflow-hidden px-4">
              <div className="flex gap-3 h-80 items-center justify-center transition-all duration-500">
                {(() => {
                  if (!displayPromotions || displayPromotions.length < 3) return null;
                  
                  const leftIndex = (currentCenterIndex - 1 + displayPromotions.length) % displayPromotions.length;
                  const centerIndex = currentCenterIndex;
                  const rightIndex = (currentCenterIndex + 1) % displayPromotions.length;
                  
                  const left = displayPromotions[leftIndex];
                  const center = displayPromotions[centerIndex];
                  const right = displayPromotions[rightIndex];
                  
                  return (
                    <>
                      {/* Left card - kichikroq */}
                      <div
                        key={`left-${left._id}-${currentCenterIndex}`}
                        onClick={() => {
                          setDirection('left');
                          handleSideBannerClick(leftIndex);
                        }}
                        className={`flex-[0.8] h-full relative overflow-hidden cursor-pointer group rounded-xl transition-all duration-500 ease-in-out ${direction === 'left' ? 'animate-slideInLeft' : 'animate-slideInRight'}`}
                        style={{ 
                          backgroundImage: left.backgroundImage ? `url(${left.backgroundImage})` : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-40 transition-all duration-300"></div>
                        {left.badge && (
                          <div className="absolute top-4 left-4 z-20">
                            <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                              {left.badge === 'HOT' ? 'ISSIQ' : left.badge === 'NEW' ? 'YANGI' : left.badge === 'SALE' ? 'CHEGIRMA' : left.badge === 'TOP' ? 'TOP' : left.badge === 'LIMITED' ? 'CHEKLANGAN' : left.badge}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 z-10">
                          <h3 className="text-white text-base font-bold mb-1">{left.title || 'Aksiya'}</h3>
                          <p className="text-white/70 text-xs">Ko'rish uchun bosing</p>
                        </div>
                      </div>

                      {/* Center card - eng katta */}
                      <div
                        key={`center-${center._id}-${currentCenterIndex}`}
                        onClick={() => handleCenterBannerClick(center)}
                        className={`flex-[3] h-full relative overflow-hidden cursor-pointer group rounded-xl transition-all duration-500 ease-in-out shadow-2xl ${direction === 'left' ? 'animate-slideInLeft' : 'animate-slideInRight'}`}
                        style={{ 
                          backgroundImage: center.backgroundImage ? `url(${center.backgroundImage})` : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300"></div>
                        {center.badge && (
                          <div className="absolute top-4 left-4 z-20">
                            <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                              {center.badge === 'HOT' ? 'ISSIQ' : center.badge === 'NEW' ? 'YANGI' : center.badge === 'SALE' ? 'CHEGIRMA' : center.badge === 'TOP' ? 'TOP' : center.badge === 'LIMITED' ? 'CHEKLANGAN' : center.badge}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 z-10">
                          <h3 className="text-white text-2xl font-bold mb-2">{center.title || 'Aksiya'}</h3>
                          <p className="text-white/80 text-sm">Mahsulotlarni ko'rish uchun bosing</p>
                        </div>
                      </div>

                      {/* Right card - kichikroq */}
                      <div
                        key={`right-${right._id}-${currentCenterIndex}`}
                        onClick={() => {
                          setDirection('right');
                          handleSideBannerClick(rightIndex);
                        }}
                        className={`flex-[0.8] h-full relative overflow-hidden cursor-pointer group rounded-xl transition-all duration-500 ease-in-out ${direction === 'left' ? 'animate-slideInLeft' : 'animate-slideInRight'}`}
                        style={{ 
                          backgroundImage: right.backgroundImage ? `url(${right.backgroundImage})` : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-40 transition-all duration-300"></div>
                        {right.badge && (
                          <div className="absolute top-4 left-4 z-20">
                            <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                              {right.badge === 'HOT' ? 'ISSIQ' : right.badge === 'NEW' ? 'YANGI' : right.badge === 'SALE' ? 'CHEGIRMA' : right.badge === 'TOP' ? 'TOP' : right.badge === 'LIMITED' ? 'CHEKLANGAN' : right.badge}
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 z-10">
                          <h3 className="text-white text-base font-bold mb-1">{right.title || 'Aksiya'}</h3>
                          <p className="text-white/70 text-xs">Ko'rish uchun bosing</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Mobile: Yandex Market Style Layout */}
          <div className="md:hidden relative">
            {/* Mobile Left Arrow */}
            <button
              onClick={() => handleMobileBannerClick((mobileCurrentIndex - 1 + displayPromotions.length) % displayPromotions.length)}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
              aria-label="Oldingi"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Mobile Right Arrow */}
            <button
              onClick={() => handleMobileBannerClick((mobileCurrentIndex + 1) % displayPromotions.length)}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
              aria-label="Keyingi"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="flex gap-2 h-48 overflow-hidden w-full relative">
              {(() => {
                if (!displayPromotions || displayPromotions.length < 3) return null;
                
                const leftIndex = (mobileCurrentIndex - 1 + displayPromotions.length) % displayPromotions.length;
                const centerIndex = mobileCurrentIndex;
                const rightIndex = (mobileCurrentIndex + 1) % displayPromotions.length;
                
                const left = displayPromotions[leftIndex];
                const center = displayPromotions[centerIndex];
                const right = displayPromotions[rightIndex];
                
                return (
                  <>
                    {/* Left banner - yopishib turadi */}
                    <div
                      onClick={() => handleMobileBannerClick(leftIndex)}
                      className="flex-[0.5] relative overflow-hidden cursor-pointer rounded-r-lg"
                      style={{
                        backgroundImage: left.backgroundImage ? `url(${left.backgroundImage})` : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                      {left.badge && (
                        <div className="absolute top-2 left-2 z-20">
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            {left.badge === 'HOT' ? 'ISSIQ' : left.badge === 'NEW' ? 'YANGI' : left.badge === 'SALE' ? 'CHEGIRMA' : left.badge === 'TOP' ? 'TOP' : left.badge === 'LIMITED' ? 'CHEKLANGAN' : left.badge}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <h3 className="text-white text-xs font-bold">{left.title || 'Aksiya'}</h3>
                      </div>
                    </div>

                    {/* Center banner - kattaroq */}
                    <div
                      onClick={() => handleCenterBannerClick(center)}
                      className="flex-[3.5] relative overflow-hidden cursor-pointer rounded-lg"
                      style={{
                        backgroundImage: center.backgroundImage ? `url(${center.backgroundImage})` : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                      {center.badge && (
                        <div className="absolute top-3 left-3 z-20">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {center.badge === 'HOT' ? 'ISSIQ' : center.badge === 'NEW' ? 'YANGI' : center.badge === 'SALE' ? 'CHEGIRMA' : center.badge === 'TOP' ? 'TOP' : center.badge === 'LIMITED' ? 'CHEKLANGAN' : center.badge}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <h3 className="text-white text-sm font-bold mb-1">{center.title || 'Asosiy Aksiya'}</h3>
                        <p className="text-white/80 text-xs">Ko'rish uchun bosing</p>
                      </div>
                    </div>

                    {/* Right banner - yopishib turadi */}
                    <div
                      onClick={() => handleMobileBannerClick(rightIndex)}
                      className="flex-[0.5] relative overflow-hidden cursor-pointer rounded-l-lg"
                      style={{
                        backgroundImage: right.backgroundImage ? `url(${right.backgroundImage})` : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                      {right.badge && (
                        <div className="absolute top-2 right-2 z-20">
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            {right.badge === 'HOT' ? 'ISSIQ' : right.badge === 'NEW' ? 'YANGI' : right.badge === 'SALE' ? 'CHEGIRMA' : right.badge === 'TOP' ? 'TOP' : right.badge === 'LIMITED' ? 'CHEKLANGAN' : right.badge}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <h3 className="text-white text-xs font-bold">{right.title || 'Aksiya'}</h3>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>
      </div>
    );
  };

  export default PromotionsSection;