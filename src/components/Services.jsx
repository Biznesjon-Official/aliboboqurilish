
import React from 'react';
import { ToolsFAIcon, PhoneFAIcon, TruckFAIcon, ShieldAltFAIcon, HeadsetFAIcon } from './FontAwesome';

const Services = () => {
  return (
  <section id="services" className="py-20 bg-white">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-primary-dark mb-4">Bizning xizmatlar</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
            Qurilish jarayonida sizga kerakli barcha xizmatlarni taqdim etamiz
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="bg-primary-orange w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                <TruckFAIcon className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-dark mb-2">Yetkazib berish</h3>
                <p className="text-gray-600">Buxoro bo'ylab yetkazib berish xizmati</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary-orange w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                <ToolsFAIcon className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-dark mb-2">O'rnatish xizmati</h3>
                <p className="text-gray-600">Professional ustalar tomonidan o'rnatish va ta'mirlash</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
                <div className="bg-primary-orange w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldAltFAIcon className="text-white" />
                </div>
                <div>
                <h3 className="text-xl font-bold text-primary-dark mb-2">Kafolat</h3>
                <p className="text-gray-600">Barcha mollalar va xizmatlar uchun kafolat beramiz</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary-orange w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                <HeadsetFAIcon className="text-white" />
                </div>
              <div>
                <h3 className="text-xl font-bold text-primary-dark mb-2">24/7 qo'llab-quvvatlash</h3>
                <p className="text-gray-600">Har doim sizning xizmatlaringizda bo'lishga tayyormiz</p>
              </div>
            </div>
          </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 lg:p-8 border border-gray-200">
          <h3 className="text-xl lg:text-2xl font-bold text-primary-orange mb-4 text-center">Maslahat uchun</h3>
          
          <div className="text-center">
            <div className="mb-4">
              <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-6 font-medium">
                Mahsulot sotib olishda va loyihangizni amalga oshirishda ikkilanadigan bo'lsangiz, 
                bizning mutaxassislarimizdan <span className="text-primary-orange font-semibold">bepul maslahat</span> oling!
              </p>
              
              <a 
                href="tel:+998919771111" 
                className="inline-flex items-center justify-center gap-3 bg-primary-orange hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-110 hover:-translate-y-1 active:scale-95"
              >
                <PhoneFAIcon className="text-base animate-pulse" />
                <span className="tracking-wide">+998 91 977 11 11</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
};

export default Services;