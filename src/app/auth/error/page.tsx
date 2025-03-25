'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Log lỗi để dễ debug
  useEffect(() => {
    console.error('Error caught in ErrorPage:', error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Đã có lỗi xảy ra</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Thử lại</button>
    </div>
  );
}
