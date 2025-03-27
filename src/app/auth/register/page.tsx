'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  return (
    <div>
      {/* ...rest of your component code... */}
    </div>
  );
}