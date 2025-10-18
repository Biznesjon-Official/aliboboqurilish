import React, { useState, useEffect } from 'react';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // API configuration
  const API_BASE = (() => {
    if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (process.env.NODE_ENV === 'production' && origin) {
      return `${origin.replace(/\/$/, '')}/api`;
    }
    return 'http://localhost:5000/api';
  })();

  // Sodda form state - faqat kerakli maydonlar
  const [formData, setFormData] = useState({
    title: '',
    backgroundImage: '',
    badge: 'CHEGIRMA',
    targetUrl: '',
    isActive: true,
    priority: 0
  });

  const badgeOptions = ['ISSIQ', 'YANGI', 'CHEGIRMA', 'TOP', 'CHEKLANGAN'];

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/promotions?active=false`);
      const data = await response.json();
      
      if (data.success) {
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission (create or update)
  const [saving, setSaving] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const url = editingPromotion 
        ? `${API_BASE}/promotions/${editingPromotion._id}`
        : `${API_BASE}/promotions`;
      
      const method = editingPromotion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setEditingPromotion(null);
        resetForm();
        fetchPromotions();
        fetchAnalytics();
        alert(editingPromotion ? 'Aksiya muvaffaqiyatli yangilandi!' : 'Yangi aksiya qo\'shildi!');
      } else {
        alert('Xatolik: ' + (data.message || 'Aksiyani saqlashda xatolik'));
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Aksiyani saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title || '',
      backgroundImage: promotion.backgroundImage || '',
      badge: promotion.badge || 'CHEGIRMA',
      targetUrl: promotion.targetUrl || '',
      isActive: promotion.isActive !== false,
      priority: promotion.priority || 0
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" aksiyasini o'chirishni xohlaysizmi?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/promotions/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchPromotions();
        fetchAnalytics();
        alert('Aksiya muvaffaqiyatli o\'chirildi!');
      } else {
        alert('Aksiyani o\'chirishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Aksiyani o\'chirishda xatolik yuz berdi');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      backgroundImage: '',
      badge: 'CHEGIRMA',
      targetUrl: '',
      isActive: true,
      priority: 0
    });
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/promotions/analytics`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchAnalytics();
  }, []);

  // Modal ochilganda body scroll qilishni to'xtatish va ESC tugmasi
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');

      // ESC tugmasi bilan yopish
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowModal(false);
          setEditingPromotion(null);
          resetForm();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.body.style.overflow = 'unset';
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
  }, [showModal]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Aksiyalar Boshqaruvi</h1>
          <button
            onClick={() => {
              setEditingPromotion(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            + Yangi Aksiya
          </button>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Jami Aksiyalar</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.analytics.totalPromotions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Faol Aksiyalar</h3>
              <p className="text-2xl font-bold text-green-600">{analytics.analytics.activePromotions}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Jami Bosishlar</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.analytics.totalClicks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">O'rtacha Bosish</h3>
              <p className="text-2xl font-bold text-purple-600">{Math.round(analytics.analytics.avgClicksPerPromotion || 0)}</p>
            </div>
          </div>
        )}

        {/* Promotions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Aksiyalar Ro'yxati</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Yuklanmoqda...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksiya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ustunlik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Badge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Holat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bosishlar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promotions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-4xl mb-2">📢</div>
                          <p className="text-lg font-medium mb-1">Hech qanday aksiya yo'q</p>
                          <p className="text-sm">Birinchi aksiyangizni qo'shing</p>
                        </div>
                      </td>
                    </tr>
                  ) : promotions.map((promotion) => (
                    <tr key={promotion._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 h-12 mr-3 rounded-lg overflow-hidden bg-gray-200">
                            {promotion.backgroundImage ? (
                              <img 
                                src={promotion.backgroundImage} 
                                alt={promotion.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{promotion.title}</div>
                            <div className="text-sm text-gray-500">{promotion.targetUrl}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">Ustunlik: {promotion.priority}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          promotion.badge === 'ISSIQ' ? 'bg-red-100 text-red-800' :
                          promotion.badge === 'YANGI' ? 'bg-green-100 text-green-800' :
                          promotion.badge === 'CHEGIRMA' ? 'bg-yellow-100 text-yellow-800' :
                          promotion.badge === 'TOP' ? 'bg-purple-100 text-purple-800' :
                          promotion.badge === 'CHEKLANGAN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {promotion.badge}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {promotion.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {promotion.clickCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors duration-200"
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => handleDelete(promotion._id, promotion.title)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Example uslubida */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay overflow-hidden p-4"
          style={{ zIndex: 999999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingPromotion(null);
              resetForm();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-lg z-20">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {editingPromotion ? 'Aksiyani Tahrirlash' : 'Yangi Aksiya Qo\'shish'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Sodda form - faqat kerakli maydonlar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aksiya nomi *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Masalan: Qurilish materiallari"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rasm URL *
                  </label>
                  <input
                    type="url"
                    name="backgroundImage"
                    value={formData.backgroundImage}
                    onChange={(e) => setFormData({...formData, backgroundImage: e.target.value})}
                    required
                    placeholder="https://example.com/rasm.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Badge
                    </label>
                    <select
                      name="badge"
                      value={formData.badge}
                      onChange={(e) => setFormData({...formData, badge: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {badgeOptions.map(badge => (
                        <option key={badge} value={badge}>
                          {badge}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ustunlik (0-10)
                    </label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                      min="0"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qaysi sahifaga olib borsin *
                  </label>
                  <input
                    type="text"
                    name="targetUrl"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
                    required
                    placeholder="/products?category=qurilish-materiallari"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Faol
                  </label>
                </div>
              </div>

              {/* Ko'rinish */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ko'rinish:</h4>
                <div className="relative overflow-hidden rounded-lg h-48"
                     style={formData.backgroundImage ? {
                       backgroundImage: `url(${formData.backgroundImage})`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center'
                     } : { background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}>
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  
                  {/* Badge */}
                  {formData.badge && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {formData.badge}
                      </span>
                    </div>
                  )}

                  {/* Pastki qism */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 z-10">
                    <h3 className="text-white text-lg font-bold mb-1">
                      {formData.title || 'Aksiya nomi'}
                    </h3>
                    <p className="text-white/80 text-sm">
                      Mahsulotlarni ko'rish uchun bosing
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 rounded-md transition-colors duration-200 flex items-center"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {saving ? 'Saqlanmoqda...' : (editingPromotion ? 'Yangilash' : 'Saqlash')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;