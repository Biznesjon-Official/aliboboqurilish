import React from 'react';
import { UserFAIcon, BoxFAIcon, CartFAIcon, ChartLineFAIcon, ArrowUpFAIcon, ArrowDownFAIcon, MinusFAIcon } from './FontAwesome';

const AdminStatsCards = ({ 
  statistics = null, 
  editStats = null,
  loading = false, 
  error = null,
  formatNumber = (num) => num?.toLocaleString() || '0'
}) => {
  
  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="stats-item flex items-center flex-1 p-4 animate-pulse">
      <div className="icon-container w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
      <div>
        <div className="h-3 bg-gray-200 rounded w-16 sm:w-20 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-12 sm:w-16"></div>
      </div>
    </div>
  );

  // Error component (neutral style, no red underline/text)
  const ErrorCard = ({ label, icon, iconBg, iconColor }) => (
    <div className="stats-card rounded-xl p-4 sm:p-6 card-hover bg-white shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-xs sm:text-sm">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary-dark">—</p>
          {/* No explicit error text to avoid visual noise */}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center opacity-50 ml-3`}>
          {React.createElement(icon, { className: `${iconColor} text-lg sm:text-xl` })}
        </div>
      </div>
    </div>
  );

  // Calculate growth indicator
  const getGrowthIndicator = (growth) => {
    if (typeof growth !== 'number' || isNaN(growth)) return null;
    
    const isPositive = growth > 0;
    const isNegative = growth < 0;
    
    if (growth === 0) return null;
    
    const IconComponent = isPositive ? ArrowUpFAIcon : isNegative ? ArrowDownFAIcon : MinusFAIcon;
    
    return (
      <div className={`flex items-center text-xs mt-1 ${
        isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
      }`}>
        <IconComponent className="mr-1" />
        <span>{Math.abs(growth)}%</span>
      </div>
    );
  };

  // Format revenue with compact notation
  const formatRevenue = (amount) => {
    if (!amount || amount === 0) return '0';
    
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    
    return formatNumber(amount);
  };

  const stats = [
    {
      label: 'Ustalar',
      value: loading ? '...' : formatNumber(statistics?.craftsmen?.total),
      subValue: statistics?.craftsmen?.recentlyAdded ? `+${statistics.craftsmen.recentlyAdded} (7 kun)` : null,
      icon: UserFAIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Mahsulotlar',
      value: loading ? '...' : formatNumber(statistics?.products?.total),
      subValue: statistics?.products?.recentlyAdded ? `+${statistics.products.recentlyAdded} (7 kun)` : null,
      icon: BoxFAIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      label: 'Buyurtmalar',
      value: loading ? '...' : formatNumber(statistics?.orders?.total),
      subValue: statistics?.orders?.recentlyCreated ? `+${statistics.orders.recentlyCreated} (7 kun)` : null,
      icon: CartFAIcon,
      iconBg: 'bg-orange-100',
      iconColor: 'text-primary-orange',
    },
    {
      label: 'Daromad',
      value: loading ? '...' : formatRevenue(statistics?.revenue?.total),
      subValue: statistics?.revenue?.thisMonth ? `${formatRevenue(statistics.revenue.thisMonth)}` : null,
      growth: statistics?.revenue?.growth,
      icon: ChartLineFAIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  if (loading || error) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center space-x-3">
              {/* Icon placeholder */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
              {/* Text placeholder */}
              <div className="flex-1 min-w-0">
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
      {stats.map((item, idx) => {
        return (
          <div key={idx} className="bg-white rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-orange/20 transition-all duration-300 group hover:-translate-y-1">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Part 1: Icon - Left Side */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${item.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`${item.iconColor} text-sm sm:text-lg lg:text-xl`} />
              </div>
              
              {/* Part 2: Text Content - Right Side (divided into 2 parts) */}
              <div className="flex-1 min-w-0">
                {/* Top Part: Label (what it is - ustalar, mahsulotlar, etc.) */}
                <p className="text-gray-500 text-xs sm:text-sm font-medium leading-tight truncate">{item.label}</p>
                
                {/* Bottom Part: Number/Amount */}
                <p className="stat-number text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 group-hover:text-primary-orange transition-colors duration-300 truncate">{item.value}</p>
                
                {/* Sub-value (recent additions) - hidden on mobile */}
                {item.subValue && (
                  <p className="text-xs text-gray-500 mt-1 truncate hidden sm:block">{item.subValue}</p>
                )}
                
                {/* Growth indicator - hidden on mobile */}
                {item.growth !== undefined && (
                  <div className="hidden lg:block">
                    {getGrowthIndicator(item.growth)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStatsCards; 