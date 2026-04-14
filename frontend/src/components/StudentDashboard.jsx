import React from 'react';

const StudentDashboard = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
          <button 
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Email: {user?.email}</p>
          <p className="text-gray-600">Role: {user?.role}</p>
          
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">
              ✅ You have successfully logged in as a {user?.role}!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;