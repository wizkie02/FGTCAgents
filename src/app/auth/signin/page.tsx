'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  
  // Lấy callbackUrl từ query parameters, nếu không có thì mặc định là trang chủ
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  // Xử lý lỗi nếu có
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(
        errorParam === 'OAuthCallback' 
          ? 'Đăng nhập thất bại. Vui lòng thử lại.'
          : 'Có lỗi xảy ra trong quá trình đăng nhập.'
      );
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' }); // Luôn chuyển về trang chủ sau khi đăng nhập
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="flex flex-col items-center space-y-8 p-10 shadow-md rounded-lg bg-white">
        <h1 className="text-3xl font-bold">Đăng nhập</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <button
          onClick={handleGoogleSignIn}
          className="flex items-center gap-3 px-6 py-3 border rounded-md hover:bg-gray-50"
        >
          <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
          <span>Đăng nhập với Google</span>
        </button>
      </div>
    </div>
  );
}
