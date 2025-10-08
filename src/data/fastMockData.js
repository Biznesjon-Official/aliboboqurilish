// Fast loading mock data for immediate display
export const fastMockProducts = [
  {
    _id: 'fast-1',
    name: 'Yuklanmoqda...',
    price: 0,
    category: 'loading',
    stock: 0,
    unit: 'dona',
    image: '/assets/default-product.svg',
    isLoading: true
  }
];

export const fastMockResponse = {
  products: fastMockProducts,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 8,
    hasNextPage: false,
    hasPrevPage: false
  },
  performance: {
    cached: false,
    fastMock: true
  }
};