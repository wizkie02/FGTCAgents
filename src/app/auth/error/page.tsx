// src/app/auth/error/page.tsx
export default function ErrorPage({
    error,
    reset,
  }: {
    error?: Error;
    reset?: () => void;
  }) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Đã có lỗi xảy ra</h1>
        <p>{error?.message || "Xin vui lòng thử lại sau."}</p>
        {reset && (
          <button onClick={reset} style={{ marginTop: '1rem' }}>
            Thử lại
          </button>
        )}
      </div>
    );
  }
  