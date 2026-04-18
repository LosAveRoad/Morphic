'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import AuthForm from '../components/AuthForm';
import CanvasContainer from '../components/CanvasContainer';

export default function Home() {
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <CanvasContainer /> : <AuthForm />;
}