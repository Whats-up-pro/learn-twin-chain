import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrophyIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';
import toast from 'react-hot-toast';
import { useTranslation } from '../src/hooks/useTranslation';

interface CompactSlide {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: string;
  actionText: string;
  actionUrl: string;
}

const CompactBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { achievements } = useAppContext();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: CompactSlide[] = [
    {
      id: 'slogan-1',
      title: 'Learn. Earn. Verify.',
      subtitle: 'Your Digital Twin Awaits',
      gradient: 'from-blue-600 to-purple-600',
      icon: '🚀',
      actionText: 'Start Learning',
      actionUrl: '/courses'
    },
    {
      id: 'slogan-2',
      title: 'NFT-Powered Learning',
      subtitle: 'Earn While You Learn',
      gradient: 'from-green-500 to-teal-600',
      icon: '✨',
      actionText: 'View NFTs',
      actionUrl: '/nfts'
    },
    {
      id: 'slogan-3',
      title: 'Blockchain Education',
      subtitle: 'Future-Ready Skills',
      gradient: 'from-purple-600 to-pink-600',
      icon: '🔗',
      actionText: 'Explore',
      actionUrl: '/dashboard'
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleSlideAction = (slide: CompactSlide) => {
    navigate(slide.actionUrl);
    toast.success(t('components.compactBanner.NavigatingToYourDestination'));
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${currentSlideData.gradient} opacity-90`}></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex items-center justify-between">
            {/* Text Content */}
            <div className="text-white space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{currentSlideData.icon}</span>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold">
                    {currentSlideData.title}
                  </h2>
                  <p className="text-lg text-white/90">
                    {currentSlideData.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleSlideAction(currentSlideData)}
              className="group flex items-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>{currentSlideData.actionText}</span>
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-1">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactBanner;
