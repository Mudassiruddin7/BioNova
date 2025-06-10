'use client'

import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-16 text-center">
      <h1 className="text-8xl font-extrabold text-gray-500 mb-6">
        404
      </h1>
      <h2 className="text-3xl font-bold mb-4">
        Page Not Found
      </h2>
      <p className="text-gray-600 mb-10 max-w-lg">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          <Home className="mr-2 h-5 w-5" />
          Go to home
        </Link>
        
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Go back
        </button>
      </div>
    </div>
  )
} 