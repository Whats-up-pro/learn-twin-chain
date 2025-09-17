import React from 'react';

interface AchievementUnlockedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onViewAchievements?: () => void;
}

const AchievementUnlockedPopup: React.FC<AchievementUnlockedPopupProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onViewAchievements
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-blue-600 text-white p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Chúc mừng!</h2>
            <p className="text-lg opacity-90">Bạn vừa mở khóa một thành tựu</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
          {description && (
            <p className="text-gray-600 mb-6">{description}</p>
          )}

          <div className="flex items-center justify-center space-x-3">
            {onViewAchievements && (
              <button
                onClick={onViewAchievements}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Xem thành tựu
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementUnlockedPopup;


