'use client';

import { useEffect } from 'react';

export default function DebugPage() {
  useEffect(() => {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('All storage cleared');
    
    // Redirect to login after clearing
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="text-white text-center">
        <h1 className="text-2xl mb-4">Clearing Storage...</h1>
        <p>Redirecting to login...</p>
      </div>
    </div>
  );
}