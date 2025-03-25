export const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-lg shadow p-6 mb-4">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

export const SkeletonStrategy = () => (
  <div className="animate-pulse bg-white rounded-lg shadow p-6 mb-4">
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  </div>
);

export const SkeletonChart = () => (
  <div className="animate-pulse bg-white rounded-lg shadow p-6">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
    <div className="h-64 bg-gray-200 rounded"></div>
  </div>
);

export const SkeletonInsight = () => (
  <div className="animate-pulse bg-white rounded-lg shadow p-4">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded w-full"></div>
  </div>
); 