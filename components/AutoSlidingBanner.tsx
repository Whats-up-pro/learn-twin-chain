import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlayIcon,
  TrophyIcon,
  SparklesIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAppContext } from '../contexts/AppContext';
import toast from 'react-hot-toast';
import { useTranslation } from '../src/hooks/useTranslation';

interface BannerSlide {
  id: string;
  type: 'course' | 'achievement' | 'slogan';
  title: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  icon?: string;
  gradient: string;
  actionText: string;
  actionUrl?: string;
  courseId?: string;
  achievementId?: string;
  featured?: boolean;
}

const AutoSlidingBanner: React.FC = () => {
  const { t } = useTranslation();
  
  try {
    const navigate = useNavigate();
    const { courses, achievements, enrollments } = useAppContext();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Add safety checks for context data
    const safeCourses = courses || [];
    const safeAchievements = achievements || [];
    const safeEnrollments = enrollments || [];

  // Generate banner slides based on available data
    const generateBannerSlides = (): BannerSlide[] => {
    const slides: BannerSlide[] = [];

    // Course promotion slides
    const featuredCourses = safeCourses
      .filter(course => course && course.status === 'published')
      .slice(0, 3);

    featuredCourses.forEach((course, index) => {
      const isEnrolled = safeEnrollments.some(e => e?.course?.course_id === course?.course_id);
      const progress = safeEnrollments.find(e => e?.course?.course_id === course?.course_id)?.enrollment?.completion_percentage || 0;
      
      slides.push({
        id: `course-${course.course_id}`,
        type: 'course',
        title: course.title,
        subtitle: isEnrolled ? `${t('components.autoSlidingBanner.continueLearning')} (${Math.round(progress)}% complete)` : t('components.autoSlidingBanner.newCourseAvailable'),
        description: course.description,
        imageUrl: course.thumbnail_url || `https://images.unsplash.com/photo-${1516321318423 + index}?w=800&h=400&fit=crop`,
        gradient: isEnrolled ? 'from-blue-600 to-purple-600' : 'from-green-500 to-teal-600',
        actionText: isEnrolled ? t('components.autoSlidingBanner.continueLearning') : t('components.autoSlidingBanner.enrollNow'),
        actionUrl: isEnrolled ? `/course/${course.course_id}/learn` : `/course/${course.course_id}`,
        courseId: course.course_id,
        featured: !isEnrolled
      });
    });

    // Achievement showcase slides
    if (safeAchievements && safeAchievements.length > 0) {
      const recentAchievements = safeAchievements.slice(0, 2);
      recentAchievements.forEach((achievement, index) => {
        slides.push({
          id: `achievement-${achievement.id || index}`,
          type: 'achievement',
          title: achievement.title || achievement.achievement?.title || t('components.autoSlidingBanner.newAchievementUnlocked'),
          subtitle: t('components.autoSlidingBanner.congratulationsOnYourProgress'),
          description: achievement.description || achievement.achievement?.description || 'Keep up the great work and unlock more achievements!',
          icon: '🏆',
          gradient: 'from-yellow-500 to-orange-600',
          actionText: t('components.autoSlidingBanner.viewAchievements'),
          actionUrl: '/achievements',
          achievementId: achievement.id
        });
      });
    }

    // Motivational slogan slides
    const slogans = [
      {
        title: 'Unlock Your Potential',
        subtitle: 'Learn, Earn, Achieve',
        description: 'Transform your skills with blockchain-powered learning and earn NFTs as you progress through your educational journey.',
        icon: '🚀',
        gradient: 'from-purple-600 to-pink-600'
      },
      {
        title: 'Learn. Earn. Verify.',
        subtitle: 'Your Digital Twin Awaits',
        description: 'Build your verifiable learning credentials on the blockchain. Every achievement is a step toward your digital future.',
        icon: '🔗',
        gradient: 'from-indigo-600 to-blue-600'
      },
      {
        title: 'NFT-Powered Learning',
        subtitle: 'Earn While You Learn',
        description: 'Complete courses, earn achievements, and mint NFTs that prove your skills. Your learning journey becomes your digital portfolio.',
        icon: '✨',
        gradient: 'from-emerald-500 to-cyan-600'
      },
      {
        title: 'Blockchain Education',
        subtitle: 'Future-Ready Skills',
        description: 'Master cutting-edge technologies and build a verifiable learning record that employers and institutions trust.',
        icon: '🎓',
        gradient: 'from-red-500 to-pink-600'
      }
    ];

    slogans.forEach((slogan, index) => {
      slides.push({
        id: `slogan-${index}`,
        type: 'slogan',
        title: slogan.title,
        subtitle: slogan.subtitle,
        description: slogan.description,
        icon: slogan.icon,
        gradient: slogan.gradient,
        actionText: t('components.autoSlidingBanner.startLearning'),
        actionUrl: '/courses'
      });
    });

    return slides;
  };

  const slides = generateBannerSlides();

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const handleSlideAction = (slide: BannerSlide) => {
    if (slide.actionUrl) {
      navigate(slide.actionUrl);
      
      // Show appropriate toast message
      if (slide.type === 'course') {
        if (slide.courseId && safeEnrollments.some(e => e?.course?.course_id === slide.courseId)) {
          toast.success(`Continuing ${slide.title} 📚`);
        } else {
          toast.success(`Exploring ${slide.title} 🎯`);
        }
      } else if (slide.type === 'achievement') {
        toast.success(`${t('components.autoSlidingBanner.viewachievements')} 🏆`);
      } else {
        toast.success(`${t('components.autoSlidingBanner.startingYourLearningJourney')} 🚀`);
      }
    }
  };

  // Add error handling for empty slides
  if (slides.length === 0) {
    return (
      <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl mb-8 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">{t('components.autoSlidingBanner.welcomeToLearningJourney')}</h2>
          <p className="text-lg opacity-90">{t('components.autoSlidingBanner.loadingPersonalizedContent')}</p>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-56 rounded-3xl overflow-hidden shadow-2xl mb-8">
      {/* Main Banner */}
      <div className="relative w-full h-full">
        {/* Background Image/Pattern */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: currentSlideData.imageUrl 
              ? `url(${currentSlideData.imageUrl})` 
              : `linear-gradient(135deg, var(--tw-gradient-stops))`,
            background: currentSlideData.imageUrl 
              ? `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${currentSlideData.imageUrl})`
              : undefined
          }}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${currentSlideData.gradient} opacity-90`}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              {/* Text Content */}
              <div className="text-white space-y-3">
                {/* Badge */}
                <div className="flex items-center space-x-2">
                  {currentSlideData.icon && (
                    <span className="text-lg">{currentSlideData.icon}</span>
                  )}
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                    {currentSlideData.type === 'course' && 'Course'}
                    {currentSlideData.type === 'achievement' && 'Achievement'}
                    {currentSlideData.type === 'slogan' && 'Learning'}
                  </span>
                  {currentSlideData.featured && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                      NEW
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl lg:text-2xl font-bold leading-tight">
                  {currentSlideData.title}
                </h1>

                {/* Subtitle */}
                <p className="text-sm lg:text-base text-white/90 font-medium">
                  {currentSlideData.subtitle}
                </p>

                {/* Action Button */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleSlideAction(currentSlideData)}
                    className="group flex items-center space-x-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span>{currentSlideData.actionText}</span>
                    <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  {currentSlideData.type === 'course' && (
                    <button
                      onClick={() => navigate(`/course/${currentSlideData.courseId}`)}
                      className="flex items-center space-x-1 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium text-sm hover:bg-white/30 transition-all duration-300"
                    >
                      <PlayIcon className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Element */}
              <div className="hidden lg:flex justify-center items-center">
                <div className="relative">
                  {currentSlideData.type === 'course' && (
                    <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <AcademicCapIcon className="h-24 w-24 text-white/60" />
                    </div>
                  )}
                  {currentSlideData.type === 'achievement' && (
                    <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <TrophyIcon className="h-24 w-24 text-white/60" />
                    </div>
                  )}
                  {currentSlideData.type === 'slogan' && (
                    <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <SparklesIcon className="h-24 w-24 text-white/60" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/30 transition-all duration-300 opacity-70 hover:opacity-100"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/30 transition-all duration-300 opacity-70 hover:opacity-100"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Auto-play indicator */}
        {isAutoPlaying && slides.length > 1 && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center space-x-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white text-xs">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <span>{t('components.autoSlidingBanner.auto')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error) {
    console.error('AutoSlidingBanner error:', error);
    return (
      <div className="relative w-full h-96 rounded-3xl overflow-hidden shadow-2xl mb-8 bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">{t('components.autoSlidingBanner.bannerLoadingError')}</h2>
          <p className="text-lg opacity-90">{t('components.autoSlidingBanner.refreshPageToTryAgain')}</p>
        </div>
      </div>
    );
  }
};

export default AutoSlidingBanner;
