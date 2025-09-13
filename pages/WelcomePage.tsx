import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpenIcon,
  AcademicCapIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PlayIcon,
  TrophyIcon,
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: <BookOpenIcon className="h-8 w-8" />,
      title: "Interactive Learning",
      description: "Engage with hands-on courses and real-world projects"
    },
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: "NFT Achievements",
      description: "Earn unique NFTs as you complete courses and milestones"
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: "Blockchain Verified",
      description: "Your achievements are securely stored on the blockchain"
    },
    {
      icon: <AcademicCapIcon className="h-8 w-8" />,
      title: "Expert Instructors",
      description: "Learn from industry professionals and certified experts"
    }
  ];

  const stats = [
    { number: "10K+", label: "Students" },
    { number: "500+", label: "Courses" },
    { number: "50+", label: "Instructors" },
    { number: "95%", label: "Success Rate" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      content: "The NFT rewards system made learning so much more engaging. I love collecting achievements!",
      avatar: "👩‍💻"
    },
    {
      name: "Mike Chen",
      role: "Data Scientist",
      content: "The blockchain verification gives me confidence that my certificates are authentic and secure.",
      avatar: "👨‍🔬"
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer",
      content: "The interactive courses and real-world projects helped me land my dream job!",
      avatar: "👩‍🎨"
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpenIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">LearnTwinChain</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <SparklesIcon className="h-4 w-4" />
              <span>Blockchain-Powered Learning Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
              Learn, Earn, and
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Verify</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Master new skills with interactive courses, earn NFT achievements, and get blockchain-verified certificates. 
              Join thousands of learners building the future of education.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <RocketLaunchIcon className="h-5 w-5" />
                <span>Start Learning Free</span>
              </button>
              <button
                onClick={() => navigate('/courses')}
                className="bg-white/70 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 border border-white/20"
              >
                <PlayIcon className="h-5 w-5" />
                <span>Browse Courses</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200/30 rounded-full blur-xl animate-pulse delay-2000"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gray-800 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose LearnTwinChain?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of education with blockchain technology and NFT rewards
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to start your blockchain-powered learning journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Sign Up & Connect Wallet</h3>
              <p className="text-gray-600">Create your account and connect your MetaMask wallet to enable NFT minting</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Enroll & Learn</h3>
              <p className="text-gray-600">Choose from hundreds of courses and start your learning journey</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Earn NFTs & Certificates</h3>
              <p className="text-gray-600">Complete courses and earn blockchain-verified NFTs and certificates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">What Our Students Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied learners who have transformed their careers
            </p>
          </div>
          
          <div className="relative">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-6xl mb-4">{testimonials[currentSlide].avatar}</div>
                <blockquote className="text-xl text-gray-700 mb-6 italic">
                  "{testimonials[currentSlide].content}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-800">{testimonials[currentSlide].name}</div>
                  <div className="text-gray-600">{testimonials[currentSlide].role}</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial Navigation */}
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our community of learners and start earning blockchain-verified achievements today
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <RocketLaunchIcon className="h-5 w-5" />
              <span>Get Started Free</span>
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center space-x-2"
            >
              <BookOpenIcon className="h-5 w-5" />
              <span>Explore Courses</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">LearnTwinChain</span>
              </div>
              <p className="text-gray-400">
                The future of education powered by blockchain technology and NFT achievements.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Courses</a></li>
                <li><a href="#" className="hover:text-white transition-colors">NFTs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Achievements</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Certificates</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LearnTwinChain. All rights reserved. Empowering learners with blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
