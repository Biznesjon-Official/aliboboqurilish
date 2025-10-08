import React, { useState } from 'react';

const ImageOptimization = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [replacing, setReplacing] = useState(false);

  // Rasm hajmlarini tahlil qilish
  const analyzeImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/image-optimization/analyze');
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Tahlil xatoligi:', error);
      alert('Tahlil qilishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Base64 rasmlarni faylga konvertatsiya qilish
  const convertBase64ToFiles = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Base64 rasmlarni faylga konvertatsiya qilishni xohlaysizmi? Bu jarayon bir necha daqiqa davom etishi mumkin.')) {
      return;
    }

    setConverting(true);
    try {
      const response = await fetch('/api/image-optimization/convert-base64', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Muvaffaqiyatli! ${data.stats.convertedProducts} ta mahsulot konvertatsiya qilindi.`);
        // Tahlilni yangilash
        analyzeImages();
      } else {
        alert('Konvertatsiya qilishda xatolik: ' + data.message);
      }
    } catch (error) {
      console.error('Konvertatsiya xatoligi:', error);
      alert('Konvertatsiya qilishda xatolik yuz berdi');
    } finally {
      setConverting(false);
    }
  };

  // Tashqi linklarni almashtirish
  const replaceExternalLinks = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Tashqi domen rasmlarini standart rasm bilan almashtirishni xohlaysizmi?')) {
      return;
    }

    setReplacing(true);
    try {
      const response = await fetch('/api/image-optimization/replace-external-links', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Muvaffaqiyatli! ${data.stats.replacedProducts} ta mahsulotda tashqi linklar almashtirildi.`);
        // Tahlilni yangilash
        analyzeImages();
      } else {
        alert('Almashtirish xatoligi: ' + data.message);
      }
    } catch (error) {
      console.error('Almashtirish xatoligi:', error);
      alert('Almashtirish jarayonida xatolik yuz berdi');
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Rasm Optimallashtirish
        </h1>

        {/* Tahlil tugmasi */}
        <div className="mb-6">
          <button
            onClick={analyzeImages}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Tahlil qilinmoqda...' : 'Rasmlarni Tahlil Qilish'}
          </button>
        </div>

        {/* Tahlil natijalari */}
        {analysis && (
          <div className="space-y-6">
            {/* Umumiy statistika */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Jami Mahsulotlar</h3>
                <p className="text-2xl font-bold text-blue-900">{analysis.analysis.totalProducts}</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">Base64 Rasmlar</h3>
                <p className="text-2xl font-bold text-yellow-900">{analysis.analysis.base64Images}</p>
                <p className="text-xs text-yellow-600">
                  Jami: {analysis.analysis.totalBase64SizeMB} MB
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-600">Tashqi Linklar</h3>
                <p className="text-2xl font-bold text-red-900">{analysis.analysis.blockedDomains}</p>
                <p className="text-xs text-red-600">Bloklangan domenlar</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Lokal Rasmlar</h3>
                <p className="text-2xl font-bold text-green-900">{analysis.analysis.localImages}</p>
              </div>
            </div>

            {/* Katta base64 rasmlar haqida ogohlantirish */}
            {analysis.analysis.largeBase64Images > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      Katta Base64 Rasmlar Topildi
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      {analysis.analysis.largeBase64Images} ta rasm 100KB dan katta. 
                      Bu rasmlar saytni sekinlashtirishi mumkin.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tavsiyalar */}
            {analysis.recommendations && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tavsiyalar</h3>
                <ul className="space-y-2">
                  {analysis.recommendations.convertBase64 && (
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700">{analysis.recommendations.convertBase64}</span>
                    </li>
                  )}
                  {analysis.recommendations.replaceExternal && (
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span className="text-gray-700">{analysis.recommendations.replaceExternal}</span>
                    </li>
                  )}
                  {analysis.recommendations.optimizeLarge && (
                    <li className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span className="text-gray-700">{analysis.recommendations.optimizeLarge}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Amallar */}
            <div className="flex flex-wrap gap-4">
              {analysis.analysis.base64Images > 0 && (
                <button
                  onClick={convertBase64ToFiles}
                  disabled={converting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {converting ? 'Konvertatsiya qilinmoqda...' : 'Base64 ni Faylga Aylantirish'}
                </button>
              )}
              
              {analysis.analysis.blockedDomains > 0 && (
                <button
                  onClick={replaceExternalLinks}
                  disabled={replacing}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {replacing ? 'Almashtirilmoqda...' : 'Tashqi Linklarni Almashtirish'}
                </button>
              )}
            </div>

            {/* Batafsil ma'lumot */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Batafsil Ma'lumot</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>O'rtacha Base64 hajmi:</strong> {analysis.analysis.averageBase64SizeKB} KB</p>
                  <p><strong>Eng katta Base64:</strong> {analysis.analysis.largestBase64SizeKB} KB</p>
                </div>
                <div>
                  <p><strong>Tashqi rasmlar:</strong> {analysis.analysis.externalImages}</p>
                  <p><strong>Bloklangan domenlar:</strong> {analysis.analysis.blockedDomains}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Yo'riqnoma */}
        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Yo'riqnoma</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Base64 rasmlar:</strong> Ma'lumotlar bazasida saqlangan rasmlar. Ular saytni sekinlashtiradi.</li>
            <li>• <strong>Tashqi linklar:</strong> Uzum.uz, Ozon.ru kabi saytlardan olingan rasmlar. Ular ishlamasligi mumkin.</li>
            <li>• <strong>Lokal rasmlar:</strong> Serverda saqlangan rasmlar. Eng tez ishlaydi.</li>
            <li>• <strong>Konvertatsiya:</strong> Base64 rasmlarni serverga fayl sifatida saqlaydi.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageOptimization;