/**
 * Enhanced Registration Form with Role Selection and Validation
 */
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    did: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    institution: '',
    program: '',
    department: '',
    birth_year: '',
    acceptTerms: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Auto-generate DID if name changes
    if (name === 'name' && value) {
      const didSuffix = value.toLowerCase().replace(/\s+/g, '') + Date.now().toString().slice(-4);
      setFormData(prev => ({ ...prev, did: `did:learntwin:${didSuffix}` }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.did.trim()) {
      errors.did = 'DID is required';
    } else if (!formData.did.startsWith('did:learntwin:')) {
      errors.did = 'DID must start with "did:learntwin:"';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email format is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions';
    }

    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.institution.trim()) {
        errors.institution = 'Institution is required for students';
      }
      if (!formData.program.trim()) {
        errors.program = 'Program is required for students';
      }
    } else if (formData.role === 'teacher') {
      if (!formData.institution.trim()) {
        errors.institution = 'Institution is required for teachers';
      }
      if (!formData.department.trim()) {
        errors.department = 'Department is required for teachers';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const registrationData = {
        did: formData.did,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        institution: formData.institution,
        program: formData.program,
        department: formData.department,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : null
      };

      await register(registrationData);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 py-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Please check your email to verify your account before signing in.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 py-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Join LearnTwinChain
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I am a
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Student</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={formData.role === 'teacher'}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Teacher</span>
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* DID */}
          <div>
            <label htmlFor="did" className="block text-sm font-medium text-gray-700 mb-1">
              Decentralized ID (DID) *
            </label>
            <input
              type="text"
              id="did"
              name="did"
              value={formData.did}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.did ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="did:learntwin:yourname"
              disabled={loading}
            />
            {formErrors.did && (
              <p className="mt-1 text-sm text-red-600">{formErrors.did}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Create a strong password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be 8+ characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
              disabled={loading}
            />
            {formErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
              Institution *
            </label>
            <input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.institution ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your school/university"
              disabled={loading}
            />
            {formErrors.institution && (
              <p className="mt-1 text-sm text-red-600">{formErrors.institution}</p>
            )}
          </div>

          {/* Conditional Fields */}
          {formData.role === 'student' && (
            <div>
              <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
                Study Program *
              </label>
              <input
                type="text"
                id="program"
                name="program"
                value={formData.program}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.program ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Computer Science"
                disabled={loading}
              />
              {formErrors.program && (
                <p className="mt-1 text-sm text-red-600">{formErrors.program}</p>
              )}
            </div>
          )}

          {formData.role === 'teacher' && (
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.department ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Computer Science Department"
                disabled={loading}
              />
              {formErrors.department && (
                <p className="mt-1 text-sm text-red-600">{formErrors.department}</p>
              )}
            </div>
          )}

          {/* Birth Year */}
          <div>
            <label htmlFor="birth_year" className="block text-sm font-medium text-gray-700 mb-1">
              Birth Year (Optional)
            </label>
            <input
              type="number"
              id="birth_year"
              name="birth_year"
              value={formData.birth_year}
              onChange={handleChange}
              min="1900"
              max="2010"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2000"
              disabled={loading}
            />
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                  formErrors.acceptTerms ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-700">
                I accept the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
              </span>
            </label>
            {formErrors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">{formErrors.acceptTerms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}