import { useNavigate } from 'react-router-dom';
import { ToolsFAIcon, UserFAIcon, SignOutAltFAIcon, ChartLineFAIcon, UserFAIcon as UsersFAIcon, BoxFAIcon, CartFAIcon } from './FontAwesome';

// Sidebar bo'limlari
const sidebarLinks = [
  {
    key: 'dashboard',
    icon: ChartLineFAIcon,
    label: 'Dashboard',
    badge: null,
  },
  {
    key: 'craftsmen',
    icon: UsersFAIcon,
    label: 'Ustalar',
    badge: 'craftsmenCount',
  },
  {
    key: 'products',
    icon: BoxFAIcon,
    label: 'Mahsulotlar',
    badge: 'productsCount',
  },
  {
    key: 'orders',
    icon: CartFAIcon,
    label: 'Buyurtmalar',
    badge: 'ordersCount',
  },
];

// countlarni prop orqali olish mumkin, default qiymat 0
const defaultCounts = {
  craftsmenCount: 0,
  productsCount: 0,
  ordersCount: 0,
};

const AdminSidebar = ({ active = 'dashboard', counts = defaultCounts, onLogout, isMobileOpen = false, onMobileToggle }) => {
  const navigate = useNavigate();
  
  const handleSectionChange = (key) => {
    // Add smooth transition delay for better UX
    const navigateWithTransition = () => {
      switch(key) {
        case 'dashboard':
          navigate('/admin');
          break;
        case 'craftsmen':
          navigate('/admin/craftsmen');
          break;
        case 'products':
          navigate('/admin/products');
          break;
        case 'orders':
          navigate('/admin/orders');
          break;
        default:
          navigate('/admin');
      }
    };
    
    // Add slight delay for smooth visual feedback
    setTimeout(navigateWithTransition, 100);
    
    // Close mobile sidebar
    if (onMobileToggle) onMobileToggle();
  };

  // Get craftsmen count from counts prop
  const craftsmenCount = counts.craftsmenCount || 0;
  const productsCount = counts.productsCount || 0;
  const ordersCount = counts.ordersCount || 0;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden sidebar-mobile-overlay"
          onClick={onMobileToggle}
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-primary-dark shadow-2xl z-50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-orange rounded-lg flex items-center justify-center">
            <ToolsFAIcon className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Alibobo</h1>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarLinks.map(link => {
            const isActive = active === link.key;
            return (
              <li key={link.key}>
                <button
                  className={
                    'sidebar-item flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ' +
                    (isActive ? 'active ' : 'text-gray-300 ')
                  }
                  style={
                    isActive
                      ? { backgroundColor: 'var(--primary-orange)', color: 'white' }
                      : { }
                  }
                  onClick={() => handleSectionChange(link.key)}
                  type="button"
                  onMouseOver={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(246,134,34,0.1)';
                      e.currentTarget.style.color = 'var(--primary-orange)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '';
                    }
                  }}
                >
                  <link.icon />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto bg-primary-orange text-white text-xs px-2 py-1 rounded-full">
                      {counts[link.badge] ?? 0}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-orange rounded-full flex items-center justify-center">
            <UserFAIcon className="text-white" />
          </div>
          <div>
            <p className="text-white font-medium">Admin</p>
            <p className="text-gray-400 text-sm">Boshqaruvchi</p>
          </div>
          <button onClick={onLogout} className="ml-auto text-gray-400 hover:text-white">
            <SignOutAltFAIcon />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminSidebar;