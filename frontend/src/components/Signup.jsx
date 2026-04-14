import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../firebase';

const Signup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    console.log("Attempting signup with role:", formData.role);
    
    const result = await signUp(formData.email, formData.password, formData.name, formData.role);
    
    if (result.success) {
      console.log("Signup successful! User role:", result.user.role);
      
      setSuccess(`Account created successfully! Redirecting to ${formData.role} dashboard...`);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Call the onLogin callback from App.js
      onLogin(null, result.user);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        if (result.user.role === 'student') {
          console.log("Redirecting to student dashboard");
          navigate('/student');
        } else if (result.user.role === 'placement') {
          console.log("Redirecting to placement dashboard");
          navigate('/placement');
        } else {
          navigate('/login');
        }
      }, 2000);
    } else {
      setError(result.error || 'Signup failed');
      console.log("Signup failed:", result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 mt-2">Join the placement platform</p>
        </div>
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            ✅ {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Full Name *
            </label>
            <input 
              type="text" 
              name="name"
              placeholder="John Doe" 
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email Address *
            </label>
            <input 
              type="email" 
              name="email"
              placeholder="student@college.edu" 
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password *
            </label>
            <input 
              type="password" 
              name="password"
              placeholder="••••••••" 
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Confirm Password *
            </label>
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="••••••••" 
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Register as *
            </label>
            <select 
              name="role"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={formData.role} 
              onChange={handleChange}
            >
              <option value="student">Student - Apply for jobs and take tests</option>
              <option value="placement">Placement Team - Manage placements</option>
            </select>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 font-semibold disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          
          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;