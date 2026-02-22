import React from 'react';
import TelegramSkeleton from './TelegramSkeleton';
import TelegramShimmer from './TelegramShimmer';

const AdminSidebarSkeleton = () => {
  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-primary-dark shadow-2xl z-50 flex flex-col">
      {/* Logo skeleton */}
      <div className="p-6 border-b border-gray-700">
        <TelegramShimmer>
          <div className="flex items-center space-x-3">
            <TelegramSkeleton 
              width="w-10" 
              height="h-10" 
              rounded="rounded-lg" 
              className="bg-gray-600"
            />
            <div>
              <TelegramSkeleton 
                width="w-20" 
                height="h-5" 
                className="bg-gray-600 mb-1"
              />
              <TelegramSkeleton 
                width="w-16" 
                height="h-3" 
                className="bg-gray-700"
              />
            </div>
          </div>
        </TelegramShimmer>
      </div>

      {/* Navigation skeleton */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <TelegramShimmer key={index}>
              <div className="flex items-center space-x-3 p-3 rounded-lg">
                <TelegramSkeleton 
                  width="w-5" 
                  height="h-5" 
                  className="bg-gray-600"
                />
                <TelegramSkeleton 
                  width="w-20" 
                  height="h-4" 
                  className="bg-gray-600"
                />
                <div className="ml-auto">
                  <TelegramSkeleton 
                    width="w-6" 
                    height="h-4" 
                    rounded="rounded-full" 
                    className="bg-gray-700"
                  />
                </div>
              </div>
            </TelegramShimmer>
          ))}
        </div>
      </nav>

      {/* User profile skeleton */}
      <div className="border-t border-gray-700 p-4">
        <TelegramShimmer>
          <div className="flex items-center space-x-3">
            <TelegramSkeleton 
              width="w-10" 
              height="h-10" 
              rounded="rounded-full" 
              className="bg-gray-600"
            />
            <div>
              <TelegramSkeleton 
                width="w-16" 
                height="h-4" 
                className="bg-gray-600 mb-1"
              />
              <TelegramSkeleton 
                width="w-20" 
                height="h-3" 
                className="bg-gray-700"
              />
            </div>
            <div className="ml-auto">
              <TelegramSkeleton 
                width="w-5" 
                height="h-5" 
                className="bg-gray-600"
              />
            </div>
          </div>
        </TelegramShimmer>
      </div>
    </div>
  );
};

export default AdminSidebarSkeleton;

