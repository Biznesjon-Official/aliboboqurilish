import React, { useState, useEffect } from 'react';
import { InfoCircleFAIcon, CheckCircleFAIcon, ExclamationTriangleFAIcon, TimesCircleFAIcon, TrashFAIcon, QuestionCircleFAIcon, EditFAIcon } from './FontAwesome';

// AdminNotificationModals - exact match with index.html modal system
const AdminNotificationModals = ({
  alertModal,
  confirmModal,
  promptModal,
  closeAlert,
  onConfirmResponse,
  onPromptResponse
}) => {
  const [promptValue, setPromptValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  // Reset values when modals open
  useEffect(() => {
    if (promptModal?.show) {
      setPromptValue(promptModal.defaultValue || '');
    }
  }, [promptModal?.show]);

  useEffect(() => {
    if (confirmModal?.show && confirmModal.type === 'select') {
      setSelectValue('');
    }
  }, [confirmModal?.show]);

  // Handle keyboard events - matching index.html behavior exactly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (alertModal?.show) closeAlert?.();
        if (confirmModal?.show) onConfirmResponse?.(false);
        if (promptModal?.show) onPromptResponse?.(null);
      }
      if (e.key === 'Enter') {
        if (promptModal?.show) {
          onPromptResponse?.(promptValue);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [alertModal?.show, confirmModal?.show, promptModal?.show, promptValue, closeAlert, onConfirmResponse, onPromptResponse]);

  // Icon configurations matching index.html
  const getIconConfig = (type) => {
    const iconConfigs = {
      info: { icon: InfoCircleFAIcon, color: 'bg-blue-100 text-blue-600' },
      success: { icon: CheckCircleFAIcon, color: 'bg-green-100 text-green-600' },
      warning: { icon: ExclamationTriangleFAIcon, color: 'bg-yellow-100 text-yellow-600' },
      error: { icon: TimesCircleFAIcon, color: 'bg-red-100 text-red-600' },
      danger: { icon: TrashFAIcon, color: 'bg-red-100 text-red-600' },
      question: { icon: QuestionCircleFAIcon, color: 'bg-blue-100 text-blue-600' },
      edit: { icon: EditFAIcon, color: 'bg-blue-100 text-blue-600' }
    };
    return iconConfigs[type] || iconConfigs.info;
  };

  return (
    <>
      {/* Custom CSS Animations - matching index.html exactly */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes bounceNotification {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-bounce {
          animation: bounceNotification 2s;
        }
        
        .modal-backdrop {
          backdrop-filter: blur(4px);
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
      
      {/* Confirm Modal */}
      {confirmModal?.show && (
        <div 
          className="modal-overlay fixed inset-0 bg-black bg-opacity-50 p-4 animate-fadeIn" 
          style={{ 
            zIndex: 9999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '2rem',
            minHeight: '100vh'
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 animate-slideIn">
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${getIconConfig(confirmModal.type).color}`}>
                  {React.createElement(getIconConfig(confirmModal.type).icon, { className: 'text-2xl' })}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {confirmModal.message}
              </p>

              {/* Select field for order status updates */}
              {confirmModal.type === 'select' && (
                <div className="mb-4">
                  <select
                    value={selectValue}
                    onChange={(e) => setSelectValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-orange"
                    autoFocus
                  >
                    <option value="">Tanlang</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="processing">Jarayonda</option>
                    <option value="completed">Yakunlangan</option>
                    <option value="cancelled">Bekor qilingan</option>
                  </select>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    onConfirmResponse?.(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                >
                  {confirmModal.type === 'danger' ? 'Bekor qilish' : 'Yo\'q'}
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'select') {
                      onConfirmResponse?.(selectValue);
                    } else {
                      // Call the callback function if it exists
                      if (confirmModal.callback) {
                        confirmModal.callback();
                      }
                      onConfirmResponse?.(true);
                    }
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                    confirmModal.type === 'danger'
                      ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                      : 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500'
                  }`}
                  autoFocus={confirmModal.type !== 'select'}
                >
                  {confirmModal.type === 'danger' ? 'O\'chirish' : confirmModal.type === 'select' ? 'Yangilash' : 'Ha'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNotificationModals;
