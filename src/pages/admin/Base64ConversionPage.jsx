import React from 'react';
import Base64Converter from '../../components/admin/Base64Converter';

const Base64ConversionPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Base64 Rasm Konvertatsiyasi</h1>
                            <p className="mt-2 text-gray-600">
                                Sayt tezligini oshirish uchun base64 rasmlarni URL formatiga o'tkazing
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <a
                                href="/admin"
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Admin Panelga Qaytish
                            </a>
                        </div>
                    </div>
                </div>

                {/* Base64 Converter Component */}
                <Base64Converter />

                {/* Qo'shimcha ma'lumot */}
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Base64 vs URL Format Taqqoslash</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Base64 Format */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                Base64 Format (Hozirgi)
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-red-700">Hajm:</span>
                                    <span className="font-medium text-red-800">Juda katta (30% ko'proq)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-red-700">Tezlik:</span>
                                    <span className="font-medium text-red-800">Sekin</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-red-700">Cache:</span>
                                    <span className="font-medium text-red-800">Qiyin</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-red-700">Database:</span>
                                    <span className="font-medium text-red-800">Katta hajm</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-700 font-mono break-all">
                                data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
                            </div>
                        </div>

                        {/* URL Format */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                URL Format (Tavsiya etiladi)
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-green-700">Hajm:</span>
                                    <span className="font-medium text-green-800">Kichik (70% kam)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">Tezlik:</span>
                                    <span className="font-medium text-green-800">Tez</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">Cache:</span>
                                    <span className="font-medium text-green-800">Oson</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">Database:</span>
                                    <span className="font-medium text-green-800">Kichik hajm</span>
                                </div>
                            </div>
                            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700 font-mono">
                                /uploads/products/product-image-123.jpg
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-3">Kutilayotgan Yaxshilanishlar:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">60-80%</div>
                                <div className="text-sm text-blue-700">Tezlik oshishi</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">30-50%</div>
                                <div className="text-sm text-green-700">Hajm kamayishi</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">70%</div>
                                <div className="text-sm text-orange-700">Rasm tezligi</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">90%</div>
                                <div className="text-sm text-purple-700">Cache samaradorligi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Base64ConversionPage;