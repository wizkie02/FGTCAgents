'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(
        errorParam === 'OAuthCallback'
          ? 'Đăng nhập thất bại. Vui lòng thử lại.'
          : errorParam === 'CredentialsSignin' 
            ? 'Email hoặc mật khẩu không chính xác.'
            : 'Có lỗi xảy ra trong quá trình đăng nhập.'
      );
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { 
        callbackUrl,
        redirect: true
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        setError('Email hoặc mật khẩu không chính xác.');
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Có lỗi xảy ra trong quá trình đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Đăng nhập</h1>
          <p className="mt-2 text-gray-600">
            Chào mừng bạn quay trở lại
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-2.5 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image src="/google.svg" alt="Google" width={20} height={20} />
            <span>Google</span>
          </button>

          <button
            onClick={() => router.push('/auth/register')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Đăng ký tài khoản</span>
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Ghi nhớ đăng nhập
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <button
              onClick={() => router.push('/auth/register')}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Đăng ký
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
