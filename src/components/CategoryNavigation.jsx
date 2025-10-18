import { prefetchQueries } from '../lib/queryClient';

const CategoryNavigation = ({
  categories = [],
  selectedCategory = '',
  onCategorySelect,
  className = '',
  isDesktop = false
}) => {
  // Simple categories without icons - like the image
  const allCategories = [
    { id: 'all', name: '', displayName: 'Hammasi' },
    { id: 'xoz-mag', name: 'xoz-mag', displayName: 'Xoz-mag' },
    { id: 'yevro-remont', name: 'yevro-remont', displayName: 'Yevro remont' },
    { id: 'elektrika', name: 'elektrika', displayName: 'Elektrika' },
    { id: 'dekor', name: 'dekor', displayName: 'Dekorativ' },
    { id: 'santexnika', name: 'santexnika', displayName: 'Santexnika' },
  ];

  const categoriesToUse = categories.length > 0 ? categories : allCategories;

  const handleCategoryClick = (category) => {

    if (onCategorySelect) {
      onCategorySelect(category.name);
    }
  };

  const handleCategoryHover = (category) => {
    try {
      // Warm the first page for this category for instant switch
      prefetchQueries.productsList(category.name || '', '', 20);
    } catch { }
  };

  return (
    <div className={`w-full border-b border-gray-200 ${className}`}>
      {/* Horizontal scrollable container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-0 px-0 py-0 min-w-max">
          {categoriesToUse.map((category) => {
            const isSelected = selectedCategory === category.name ||
              (selectedCategory === '' && category.id === 'all');

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                onMouseEnter={() => handleCategoryHover(category)}
                className={`
                  relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300
                  hover:text-gray-900 group overflow-hidden
                  ${isSelected
                    ? 'text-gray-900'
                    : 'text-gray-600'
                  }
                `}
              >
                {category.displayName}

                {/* Alibaba style bottom line - sariqroq rang */}
                <div className={`
                  absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-yellow-500
                  transition-all duration-300 ease-out
                  ${isSelected
                    ? 'w-full'
                    : 'w-0 group-hover:w-full'
                  }
                `}></div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryNavigation;