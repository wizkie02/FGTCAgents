import { Suspense } from 'react';
import SignInContent from './SignInContent';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-500">Đang tải...</div>}>
      <SignInContent />
    </Suspense>
  );
}
