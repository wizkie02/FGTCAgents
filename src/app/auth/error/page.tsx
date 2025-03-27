'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Separate loading component
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthErrorContent />
    </Suspense>
  );
}

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'Configuration':
          setError('Có lỗi trong cấu hình máy chủ. Vui lòng liên hệ quản trị viên.');
          break;
        case 'AccessDenied':
          setError('Bạn không có quyền truy cập vào trang này.');
          break;
        case 'Verification':
          setError('Token xác thực không hợp lệ. Vui lòng thử lại.');
          break;
        default:
          setError('Có lỗi xảy ra trong quá trình xác thực.');
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Lỗi xác thực
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error}
          </p>
        </div>
        <div className="mt-5">
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}