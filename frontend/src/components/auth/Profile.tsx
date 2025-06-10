'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Profile() {
  const { user, logout } = useAuth();
  const [username, setUsername] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return <div className="p-6 text-center text-gray-400">Please log in to view your profile</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The updateUser function doesn't exist in the original auth context
    // We would need to implement this functionality using the existing API
    // For now, we'll just close the editing mode
    setIsEditing(false);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-indigo-600 rounded-full mx-auto flex items-center justify-center mb-4">
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt={user.name || 'User'} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {(user.name || user.email?.substring(0, 2) || user.walletAddress?.substring(0, 2)).toUpperCase()}
            </span>
          )}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-400">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">
              {user.name || user.email?.split('@')[0] || 'Unnamed User'}
            </h2>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        {user.email && (
          <div className="mb-4">
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-white">{user.email}</p>
          </div>
        )}
        
        {user.walletAddress && (
          <div className="mb-4">
            <p className="text-sm text-gray-400">Wallet Address</p>
            <p className="text-white font-mono break-all">{user.walletAddress}</p>
          </div>
        )}
        
        <div className="text-center mt-6">
          <button
            onClick={() => logout()}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
} 