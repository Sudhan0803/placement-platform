import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../firebase';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log("Attempting login with role:", role);
    
    const result = await signIn(email, password, role);
    
    if (result.success) {
      console.log("Login successful! User role:", result.user.role);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Call the onLogin callback from App.js
      onLogin(null, result.user);
      
      // Redirect based on role
      if (result.user.role === 'student') {
        console.log("Redirecting to student dashboard");
        navigate('/student');
      } else if (result.user.role === 'placement') {
        console.log("Redirecting to placement dashboard");
        navigate('/placement');
      } else {
        console.log("Unknown role, redirecting to login");
        navigate('/login');
      }
    } else {
      setError(result.error || 'Login failed');
      console.log("Login failed:", result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Placement Portal</h2>
          <p className="text-gray-500 mt-2">Login to your account</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="student@college.edu" 
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Login as
            </label>
            <select 
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              value={role} 
              onChange={e=>setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="placement">Placement Team</option>
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
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition duration-200 font-semibold disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-semibold">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;