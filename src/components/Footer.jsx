import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PhoneFAIcon, MapMarkerAltFAIcon, HammerFAIcon, FacebookFAIcon, InstagramFAIcon, TelegramPlaneFAIcon } from './FontAwesome';

const Footer = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <footer id="footer" className="bg-primary-dark text-white py-6 md:py-166">
      <div className="container mx-auto px-4">
        {/* Mobile Layout - Simplified */}
        <div className="block md:hidden">
          {/* Company Info Only */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <HammerFAIcon className="text-primary-orange text-xl" />
              <h3 className="text-lg font-bold">Alibobo</h3>
            </div>
            <p className="text-gray-300 text-sm text-center px-2">
              Qurilish mollalari va ustalarni topishning eng oson yo'li
            </p>
          </div>

          {/* Biz haqimizda - Expandable */}
          <div className="border-b border-gray-600 pb-4 mb-4">
            <button 
              onClick={() => toggleSection('about')}
              className="flex items-center justify-between w-full text-left py-0"
            >
              <span className="text-base font-semibold text-white">Biz haqimizda</span>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 36 36" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className={`transform transition-transform duration-300 ${expandedSections.about ? 'rotate-180' : ''}`}
              >
                <path 
                  fillRule="evenodd" 
                  clipRule="evenodd" 
                  d="M5.29276 12.293C5.68321 11.9024 6.31637 11.9023 6.70697 12.2928L18.0044 23.5858L29.2928 12.293C29.6832 11.9024 30.3164 11.9023 30.707 12.2928C31.0976 12.6832 31.0977 13.3164 30.7072 13.707L18.7119 25.707C18.5244 25.8945 18.27 25.9999 18.0048 26C17.7396 26.0001 17.4852 25.8947 17.2977 25.7072L5.29303 13.7072C4.90243 13.3168 4.90231 12.6836 5.29276 12.293Z" 
                  fill="currentColor"
                />
              </svg>
            </button>
            {expandedSections.about && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Qurilish mollalari va ustalarni topishning eng oson yo'li. Sizning orzuingizdagi uyni qurishda yordam beramiz.
                </p>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-gray-300 hover:text-primary-orange transition duration-300 text-sm">
                      Topshirish punktlari
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-300 hover:text-primary-orange transition duration-300 text-sm">
                      Vakansiyalar
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Aloqa - Expandable */}
          <div className="border-b border-gray-600 pb-4 mb-4">
            <button 
              onClick={() => toggleSection('contact')}
              className="flex items-center justify-between w-full text-left py-0"
            >
              <span className="text-base font-semibold text-white">Aloqa</span>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 36 36" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className={`transform transition-transform duration-300 ${expandedSections.contact ? 'rotate-180' : ''}`}
              >
                <path 
                  fillRule="evenodd" 
                  clipRule="evenodd" 
                  d="M5.29276 12.293C5.68321 11.9024 6.31637 11.9023 6.70697 12.2928L18.0044 23.5858L29.2928 12.293C29.6832 11.9024 30.3164 11.9023 30.707 12.2928C31.0976 12.6832 31.0977 13.3164 30.7072 13.707L18.7119 25.707C18.5244 25.8945 18.27 25.9999 18.0048 26C17.7396 26.0001 17.4852 25.8947 17.2977 25.7072L5.29303 13.7072C4.90243 13.3168 4.90231 12.6836 5.29276 12.293Z" 
                  fill="currentColor"
                />
              </svg>
            </button>
            {expandedSections.contact && (
              <div className="mt-3 space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <PhoneFAIcon className="mr-3 text-primary-orange text-sm" />
                    <a href="tel:+998919771111" className="hover:text-primary-orange transition duration-300 text-sm">
                      +998 91 977 11 11
                    </a>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <InstagramFAIcon className="mr-3 text-primary-orange text-sm" />
                    <a
                      href="https://instagram.com/alibobo_qurilishmollari"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary-orange"
                    >
                      @alibobo_qurilishmollari
                    </a>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapMarkerAltFAIcon className="mr-3 text-primary-orange text-sm" />
                    <span className="text-sm">Gijduvon, Buxoro</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-600">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Savollaringiz bormi? Bizga qo'ng'iroq qiling yoki xabar yuboring. 
                      Mutaxassislarimiz sizga yordam berishga tayyor!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row - Social Icons on Side & Copyright */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary-orange transition duration-300" aria-label="Facebook">
                <FacebookFAIcon className="text-lg" />
              </a>
              <a href="https://instagram.com/alibobo_qurilishmollari" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-orange transition duration-300" aria-label="Instagram">
                <InstagramFAIcon className="text-lg" />
              </a>
              <a href="https://t.me/mountain_peak" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-orange transition duration-300" aria-label="Telegram">
                <TelegramPlaneFAIcon className="text-lg" />
              </a>
            </div>
            <p className="text-gray-400 text-xs"> 2025 Alibobo</p>
          </div>
        </div>

        {/* Desktop Layout - Original 4 Columns */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <HammerFAIcon className="text-primary-orange text-2xl" />
              <h3 className="text-xl font-bold">Alibobo</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Qurilish mollalari va ustalarni topishning eng oson yo'li. Sizning orzuingizdagi uyni
              qurishda yordam beramiz.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary-orange transition duration-300" aria-label="Facebook">
                <FacebookFAIcon />
              </a>
              <a href="https://instagram.com/alibobo_qurilishmollari" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-orange transition duration-300" aria-label="Instagram">
                <InstagramFAIcon />
              </a>
              <a href="https://t.me/mountain_peak" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary-orange transition duration-300" aria-label="Telegram">
                <TelegramPlaneFAIcon />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Mahsulotlar</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products?category=santexnika" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Santexnika
                </Link>
              </li>
              <li>
                <Link to="/products?category=yevro-remont" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Yevro remont
                </Link>
              </li>
              <li>
                <Link to="/products?category=elektrika" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Elektrika
                </Link>
              </li>
              <li>
                <Link to="/products?category=xoz-mag" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Xoz-mag
                </Link>
              </li>
              <li>
                <Link to="/products?category=dekorativ-mahsulotlar" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Dekorativ mahsulotlar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Ustalar</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/craftsmen?specialty=Elektrik" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Elektrik
                </Link>
              </li>
              <li>
                <Link to="/craftsmen?specialty=Santexnik" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Santexnik
                </Link>
              </li>
              <li>
                <Link to="/craftsmen?specialty=Quruvchi" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Quruvchi
                </Link>
              </li>
              <li>
                <Link to="/craftsmen?specialty=Duradgor" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Duradgor
                </Link>
              </li>
              <li>
                <Link to="/craftsmen?specialty=Plitka%20yotqizuvchi" className="text-gray-300 hover:text-primary-orange transition duration-300">
                  Plitka yotqizuvchi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Aloqa</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300">
                <PhoneFAIcon className="mr-2 text-primary-orange" />
                <a href="tel:+998919771111" className="hover:text-primary-orange transition duration-300">
                  +998 91 977 11 11
                </a>
              </li>
              <li className="flex items-center text-gray-300">
                <InstagramFAIcon className="mr-2 text-primary-orange" />
                <a
                  href="https://instagram.com/alibobo_qurilishmollari"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-orange"
                >
                  @alibobo_qurilishmollari
                </a>
              </li>
              <li className="flex items-center text-gray-300">
                <MapMarkerAltFAIcon className="mr-2 text-primary-orange" />
                Gijduvon, Buxoro
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 md:mt-12 pt-6 md:pt-8 text-center">
          <p className="text-gray-300 text-xs md:text-sm"> 2025 Alibobo. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;