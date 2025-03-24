'use client';

import { getProviders, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-2xl font-bold mb-6">Sign in to FGTC Search</h1>
      <div className="space-y-4">
        {providers &&
          Object.values(providers).map((provider: any) => (
            <button
              key={provider.name}
              onClick={() => signIn(provider.id)}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
            >
              Sign in with {provider.name}
            </button>
          ))}
      </div>
    </div>
  );
}
