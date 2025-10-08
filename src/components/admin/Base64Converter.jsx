import React, { useState } from 'react';
import { detectBase64Images, convertAllProductImages, formatFileSize } from '../../utils/imageConverter';

const Base64Converter = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);

  // Base64 rasmlarni tahlil qilish
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:5000/api/image-conversion/analyze-base64');
      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result);
      } else {
        alert('Tahlil xatoligi: ' + result.error);
      }
    } catch (error) {
      console.error('Tahlil xatoligi:', error);
      alert('Tahlil amalga oshmadi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Barcha base64 rasmlarni konvertatsiya qilish
  const handleConvertAll = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Barcha base64 rasmlarni URL formatiga o\'tkazishni xohlaysizmi? Bu jarayon bir necha daqiqa davom etishi mumkin.')) {
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetch('http://localhost:5000/api/image-conversion/convert-all-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConversionResult(result);
        alert(`Muvaffaqiyat! ${result.convertedImages} ta rasm konvertatsiya qilindi.`);
        // Tahlilni yangilash
        handleAnalyze();
      } else {
        alert('Konvertatsiya xatoligi: ' + result.error);
      }
    } catch (error) {
      console.error('Konvertatsiya xatoligi:', error);
      alert('Konvertatsiya amalga oshmadi');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Base64 Rasm Konvertatsiyasi</h2>
        <p className="text-gray-600">
          Base64 formatidagi rasmlarni URL formatiga o'tkazing va sayt tezligini oshiring.
        </p>
      </div>

      {/* Tahlil bo'limi */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">1. Base64 Rasmlarni Tahlil Qilish</h3>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Tahlil qilinmoqda...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Tahlil Qilish
              </>
            )}
          </button>
        </div>

        {/* Tahlil natijalari */}
        {analysisResult && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Tahlil Natijalari:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{analysisResult.summary.totalProducts}</div>
                <div className="text-sm text-gray-600">Mahsulotlar</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{analysisResult.summary.totalBase64Images}</div>
                <div className="text-sm text-gray-600">Base64 Rasmlar</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{analysisResult.summary.totalSize}</div>
                <div className="text-sm text-gray-600">Umumiy Hajm</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{analysisResult.summary.averageSize}</div>
                <div className="text-sm text-gray-600">O'rtacha Hajm</div>
              </div>
            </div>

            {analysisResult.products.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Base64 Rasmli Mahsulotlar:</h5>
                <div className="max-h-40 overflow-y-auto">
                  {analysisResult.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-800">{product.productName}</div>
                        <div className="text-sm text-gray-500">{product.base64Images} ta rasm</div>
                      </div>
                      <div className="text-sm font-medium text-orange-600">{product.totalSize}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Konvertatsiya bo'limi */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">2. Base64 Rasmlarni Konvertatsiya Qilish</h3>
          <button
            onClick={handleConvertAll}
            disabled={isConverting || !analysisResult || analysisResult.summary.totalBase64Images === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-2"
          >
            {isConverting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Konvertatsiya qilinmoqda...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Barchasini Konvertatsiya Qilish
              </>
            )}
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Muhim Eslatma:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Bu jarayon barcha base64 rasmlarni fayl formatiga o'tkazadi</li>
                <li>• Sayt tezligi sezilarli darajada oshadi</li>
                <li>• Database hajmi kamayadi</li>
                <li>• Jarayon bir necha daqiqa davom etishi mumkin</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Konvertatsiya natijalari */}
        {conversionResult && (
          <div className="mt-4 bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-700 mb-3">Konvertatsiya Natijalari:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{conversionResult.convertedImages}</div>
                <div className="text-sm text-gray-600">Konvertatsiya Qilingan</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{conversionResult.totalProducts}</div>
                <div className="text-sm text-gray-600">Jami Mahsulotlar</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{conversionResult.errors}</div>
                <div className="text-sm text-gray-600">Xatoliklar</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Foyda haqida ma'lumot */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Konvertatsiya Foydasi:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <div>
            <h5 className="font-medium mb-1">Tezlik:</h5>
            <ul className="space-y-1">
              <li>• Sahifa yuklash tezligi 60-80% oshadi</li>
              <li>• Rasmlar tezroq ko'rsatiladi</li>
              <li>• CDN orqali optimallashtiriladi</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">Hajm:</h5>
            <ul className="space-y-1">
              <li>• Database hajmi 30-50% kamayadi</li>
              <li>• Server xotirasi tejaydi</li>
              <li>• Backup tezroq bo'ladi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Base64Converter;