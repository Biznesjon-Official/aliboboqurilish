import React, { useState, useEffect } from 'react';
import {
  CartFAIcon,
  TimesFAIcon,
  MinusFAIcon,
  PlusFAIcon,
  TrashFAIcon,
  HammerFAIcon,
  UserFAIcon,
  PhoneFAIcon,
  MapMarkerAltFAIcon,
  ExclamationTriangleFAIcon,
  SpinnerFAIcon,
  CheckFAIcon
} from './FontAwesome';
import { queryClient } from '../lib/queryClient';
import { useCreateOrder } from '../hooks/useOrderQueries';
import OptimizedImage from './OptimizedImage';

const CartSidebar = ({
  isOpen,
  onClose,
  cart,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout
}) => {
  // React Query mutation for order creation
  const createOrderMutation = useCreateOrder();

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Add form validation state
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseInt(item.price?.toString().replace(/[^\d]/g, '') || '0');
      return total + (price * item.quantity);
    }, 0);
  };



  // Add validation functions
  const validateForm = () => {
    const errors = {
      name: '',
      phone: '',
      address: ''
    };

    let isValid = true;

    // Validate Name
    if (customerData.name.trim() === '') {
      errors.name = 'Iltimos, ismingizni kiriting';
      isValid = false;
    } else if (customerData.name.trim().length < 3) {
      errors.name = 'Ism kamida 3 belgidan iborat bo\'lishi kerak';
      isValid = false;
    }

    // Validate Phone
    if (customerData.phone.trim() === '') {
      errors.phone = 'Iltimos, telefon raqamingizni kiriting';
      isValid = false;
    } else if (customerData.phone.length < 19) { // Full length of +998 (XX) XXX-XX-XX is 19
      errors.phone = 'Iltimos, telefon raqamingizni to\'liq kiriting';
      isValid = false;
    }

    // Validate Address
    if (customerData.address.trim() === '') {
      errors.address = 'Iltimos, yetkazib berish manzilini kiriting';
      isValid = false;
    } else if (customerData.address.trim().length < 10) {
      errors.address = 'Manzil kamida 10 belgidan iborat bo\'lishi kerak';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Clear errors when user starts typing
  const handleInputChange = (field, value) => {
    setCustomerData({ ...customerData, [field]: value });

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  // Simple phone formatter without cursor position issues
  const formatPhoneNumber = (value) => {
    // Extract only digits
    const digits = value.replace(/\D/g, '');

    // Always start with +998
    if (digits.length <= 3) {
      return '+998';
    }

    // Get phone digits after country code (max 9 digits)
    const phoneDigits = digits.slice(3, 12);

    // Format as +998 (XX) XXX-XX-XX
    let formatted = '+998';

    if (phoneDigits.length > 0) {
      formatted += ` (${phoneDigits.slice(0, 2)}`;
      if (phoneDigits.length >= 2) {
        formatted += `) ${phoneDigits.slice(2, 5)}`;
        if (phoneDigits.length >= 5) {
          formatted += `-${phoneDigits.slice(5, 7)}`;
          if (phoneDigits.length >= 7) {
            formatted += `-${phoneDigits.slice(7, 9)}`;
          }
        }
      }
    }

    return formatted;
  };

  // Calculate cursor position after formatting
  const getCursorPosition = (oldValue, newValue, oldCursor, isAdding = false) => {
    // If adding a character, place cursor after the new digit
    if (isAdding) {
      // Count digits before cursor in old value
      const digitsBeforeCursor = oldValue.slice(0, oldCursor).replace(/\D/g, '').length;

      // Find position after the same number of digits in new value
      let digitCount = 0;
      for (let i = 0; i < newValue.length; i++) {
        if (/\d/.test(newValue[i])) {
          digitCount++;
          if (digitCount === digitsBeforeCursor + 1) {
            return i + 1;
          }
        }
      }

      return newValue.length;
    } else {
      // For deletion, maintain relative position
      const digitsBeforeCursor = oldValue.slice(0, oldCursor).replace(/\D/g, '').length;

      let digitCount = 0;
      for (let i = 0; i < newValue.length; i++) {
        if (/\d/.test(newValue[i])) {
          digitCount++;
          if (digitCount === digitsBeforeCursor) {
            return i + 1;
          }
        }
      }

      return Math.min(oldCursor, newValue.length);
    }
  };

  const handlePhoneChange = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const oldValue = customerData.phone;
    const newValue = e.target.value;

    // Allow complete deletion
    if (newValue === '' || newValue.length < 4) {
      handleInputChange('phone', '');
      return;
    }

    // Determine if user is adding or removing characters
    const oldDigits = oldValue.replace(/\D/g, '');
    const newDigits = newValue.replace(/\D/g, '');
    const isAdding = newDigits.length > oldDigits.length;

    const formatted = formatPhoneNumber(newValue);
    handleInputChange('phone', formatted);

    // Set cursor position after formatting
    setTimeout(() => {
      if (input && document.activeElement === input) {
        const newCursorPos = getCursorPosition(oldValue, formatted, cursorPosition, isAdding);
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    // Check if cart is not empty
    if (!cart || cart.length === 0) {
      setErrorMessage('Savatcha bo\'sh. Iltimos, mahsulot qo\'shing.');
      setShowErrorModal(true);
      return;
    }

    // Validate cart items have valid product IDs
    const invalidItems = cart.filter(item => {
      const productId = item._id || item.id;
      if (!productId) return true;

      // Extract actual MongoDB ID if it's a cartId
      const extractedId = typeof productId === 'string' && productId.includes('-')
        ? productId.split('-')[0]
        : productId;

      // Check if it looks like a valid MongoDB ObjectId (24 hex characters)
      return !(typeof extractedId === 'string' && /^[a-fA-F0-9]{24}$/.test(extractedId));
    });

    if (invalidItems.length > 0) {
      console.error('Invalid cart items found:', invalidItems);
      setErrorMessage(`Savatchada noto\'g\'ri mahsulotlar bor: ${invalidItems.map(item => item.name).join(', ')}. Iltimos, savatchani tozalang va qayta urinib ko\'ring.`);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data for backend API
      const orderData = {
        customerName: customerData.name.trim(),
        customerPhone: customerData.phone.trim(),
        customerAddress: customerData.address.trim(),
        items: cart.map(item => {
          // Extract proper MongoDB ObjectId
          let productId = item._id || item.id;

          // If productId is a cartId (contains hyphens), extract the actual MongoDB ID
          if (typeof productId === 'string' && productId.includes('-')) {
            productId = productId.split('-')[0];
          }

          // Log for debugging
          console.log('Processing cart item:');
          console.table({
            name: item.name,
            originalId: item._id,
            itemId: item.id,
            extractedProductId: productId,
            selectedVariants: JSON.stringify(item.selectedVariants),
            hasSelectedVariants: item.selectedVariants && typeof item.selectedVariants === 'object' && Object.keys(item.selectedVariants).length > 0,
            variantOptionToSend: (
              item.selectedVariants &&
              typeof item.selectedVariants === 'object' &&
              Object.keys(item.selectedVariants).length > 0
            ) ? Object.values(item.selectedVariants).join(', ') : undefined
          });

          return {
            productId: productId, // Product ID for inventory tracking
            name: item.name,
            quantity: parseInt(item.quantity) || 1,
            price: parseInt(item.price?.toString().replace(/[^\d]/g, '') || '0'),
            variantOption: (
              item.selectedVariants &&
              typeof item.selectedVariants === 'object' &&
              Object.keys(item.selectedVariants).length > 0
            ) ? Object.values(item.selectedVariants).join(', ') : undefined
          };
        }),
        totalAmount: calculateTotal(),
        status: 'pending',
        orderDate: new Date().toISOString()
      };

      console.log('Buyurtma ma\'lumotlari yuborilmoqda:');
      console.table(orderData);
      console.log('Cart items with corrected productIds:');
      console.table(orderData.items.map(item => ({
        name: item.name,
        productId: item.productId,
        quantity: item.quantity,
        variantOption: item.variantOption
      })));

      // Use React Query mutation for automatic cache invalidation
      const savedOrder = await createOrderMutation.mutateAsync(orderData);

      console.log('Buyurtma muvaffaqiyatli saqlandi:', savedOrder);

      // IMMEDIATE: Force aggressive cache refresh for real-time updates
      queryClient.removeQueries({ queryKey: ['products'], exact: false });
      queryClient.refetchQueries({ queryKey: ['products'], exact: false, type: 'all' });

      // Force refresh all stocks globally
      if (window.forceRefreshAllStocks) {
        console.log('🔄 Triggering force refresh after order creation');
        window.forceRefreshAllStocks();
      }

      // Force DOM events for immediate UI updates
      window.dispatchEvent(new CustomEvent('forceStockRefresh', {
        detail: { reason: 'order_created', orderId: savedOrder._id }
      }));

      // Reset form data
      setCustomerData({
        name: '',
        phone: '',
        address: ''
      });
      setFormErrors({
        name: '',
        phone: '',
        address: ''
      });

      // Close checkout modal
      setShowCheckoutModal(false);

      // Clear cart if callback provided
      if (onCheckout) {
        onCheckout();
      }

      // Show success modal with order details
      const total = calculateTotal();
      setOrderTotal(total);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Buyurtma yuborishda xatolik:', error);

      // Handle different types of errors
      let errorMessage = 'Buyurtma yuborishda xatolik yuz berdi.';

      if (error.name === 'AbortError') {
        errorMessage = 'So\'rov vaqti tugadi. Iltimos, internetni tekshiring va qayta urinib ko\'ring.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Server bilan aloqa yo\'q. Iltimos, backend serverni ishga tushiring.';
      } else if (error.message.includes('404')) {
        errorMessage = 'API endpoint topilmadi. Backend server ishlamayotgan bo\'lishi mumkin.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  return (
    <>
      {/* Cart Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      ></div>

      {/* Shopping Cart Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 md:w-[30rem] lg:w-[36rem] xl:w-[40rem] bg-white shadow-2xl transform transition-transform duration-300 z-[70] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between p-4 bg-primary-orange text-white">
          <div className="flex items-center space-x-3">
            <CartFAIcon className="text-xl" />
            <div>
              <h3 className="text-lg font-bold">Savatcha</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <TimesFAIcon className="text-2xl" />
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <CartFAIcon className="text-6xl mb-4 text-gray-300" />
              <h4 className="text-xl font-semibold mb-2">Savatcha bo'sh</h4>
              <p>Mahsulot yoki xizmat qo'shing</p>
            </div>
          ) : (
            <div className="p-4 pb-2 space-y-2">
              {cart.map((item) => {
                const price = parseInt(item.price?.toString().replace(/[^\d]/g, '') || '0');
                const totalPrice = (price * item.quantity).toLocaleString();

                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-2">
                    {/* Top Row: Image, Name, Price */}
                    <div className="flex items-start gap-3 mb-2">
                      {/* Product Image */}
                      <div
                        className="flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden p-2 border border-gray-200"
                        style={{ width: '70px', height: '70px' }}
                      >
                        <OptimizedImage
                          src={item.image || item.finalImage}
                          alt={item.name}
                          className="w-full h-full"
                          objectFit="contain"
                          placeholder="skeleton"
                          fallbackSrc="/assets/default-product.svg"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Mahsulot
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {item.price} / {item.unit || 'dona'}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-primary-orange">
                          {totalPrice} so'm
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Quantity Controls and Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 font-medium">Miqdor:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <MinusFAIcon className="text-xs text-gray-600" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <PlusFAIcon className="text-xs text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <TrashFAIcon className="text-xs" />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 pt-3 space-y-3 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] mt-auto">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-primary-dark">Jami:</span>
              <span className="text-2xl font-bold text-primary-orange">
                {calculateTotal().toLocaleString()} so'm
              </span>
            </div>
            <button
              onClick={() => {
                setShowCheckoutModal(true);
                onClose();
              }}
              className="w-full bg-primary-orange text-white py-3 rounded-lg hover:bg-opacity-90 transition duration-300 font-semibold"
            >
              Buyurtma berish
            </button>
          </div>
        )}


      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div 
          className="modal-overlay fixed inset-0 bg-black bg-opacity-50 p-4" 
          style={{ 
            zIndex: 9999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh'
          }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="text-center mb-4">
              <HammerFAIcon className="text-primary-orange text-2xl" />
              <h3 className="text-xl font-bold text-primary-dark mt-2">Buyurtma berish</h3>
              <p className="text-gray-600 text-sm">Ma'lumotlaringizni kiriting</p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <UserFAIcon className="text-primary-orange mr-2 text-xs" />
                  Sizning ismingiz
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-primary-orange focus:border-transparent ${formErrors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                    }`}
                  placeholder="To'liq ismingizni kiriting"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <ExclamationTriangleFAIcon className="mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <PhoneFAIcon className="text-primary-orange mr-2 text-xs" />
                  Telefon raqami
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={handlePhoneChange}
                  onKeyDown={(e) => {
                    const input = e.target;
                    const cursorPosition = input.selectionStart;
                    const value = input.value;

                    // Handle backspace
                    if (e.key === 'Backspace') {
                      // Prevent deletion of +998 prefix
                      if (cursorPosition <= 4 && value.startsWith('+998')) {
                        e.preventDefault();
                        return;
                      }
                    }

                    // Only allow digits and control keys
                    if (!/[\d]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onFocus={(e) => {
                    if (!customerData.phone || customerData.phone === '') {
                      handleInputChange('phone', '+998');
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-primary-orange focus:border-transparent ${formErrors.phone
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                    }`}
                  placeholder="+998 (__) ___-__-__"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <ExclamationTriangleFAIcon className="mr-1" />
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapMarkerAltFAIcon className="text-primary-orange mr-2 text-xs" />
                  Yetkazib berish manzilim
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={customerData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-primary-orange focus:border-transparent resize-none ${formErrors.address
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                    }`}
                  placeholder="To'liq manzilni kiriting (shahar, ko'cha, uy raqami)"
                  rows="3"
                ></textarea>
                {formErrors.address && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <ExclamationTriangleFAIcon className="mr-1" />
                    {formErrors.address}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Jami to'lov:</span>
                  <span className="text-xl font-bold text-primary-orange">
                    {calculateTotal().toLocaleString()} so'm
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setFormErrors({ name: '', phone: '', address: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={isSubmitting}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <SpinnerFAIcon className="mr-2" />
                      Yuborilmoqda...
                    </>
                  ) : (
                    'Buyurtma berish'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckFAIcon className="text-green-500 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Buyurtma qabul qilindi!</h3>
              <p className="text-gray-600 mb-4">
                Buyurtmangiz muvaffaqiyatli ro'yxatga olindi. Tez orada siz bilan bog'lanamiz.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Buyurtma summasi:</p>
                <p className="text-xl font-bold text-primary-orange">
                  {orderTotal.toLocaleString()} so'm
                </p>
              </div>
            </div>
            <button
              onClick={closeSuccessModal}
              className="w-full bg-primary-orange text-white py-3 rounded-lg hover:bg-opacity-90 transition font-semibold"
            >
              Yaxshi
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4">
          <div
            className="bg-white rounded-xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center transform transition-all duration-300"
            style={{
              animation: 'modalSlideIn 0.3s ease-out'
            }}
          >
            {/* Icon */}
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-lg bg-red-500">
              <ExclamationTriangleFAIcon className="text-white text-3xl" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-red-600 mt-5">Xatolik yuz berdi!</h2>

            {/* Description */}
            <p className="text-gray-600 mt-2 text-sm px-4">
              {errorMessage}
            </p>

            {/* Action Button */}
            <button
              onClick={closeErrorModal}
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition font-semibold mt-6 flex items-center justify-center text-sm"
            >
              <TimesFAIcon className="mr-2" />
              Yaxshi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CartSidebar;
