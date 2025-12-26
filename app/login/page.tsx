'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Background with Watermark */}
      <div className="hidden lg:flex lg:w-[80%] relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
        {/* Watermark Logo - Semi-transparent Circular Design */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* You can replace this with an image */}
          <img src="/12.png" alt="Watermark" className="w-[600px] h-[600px] opacity-20 object-contain blur-sm" />
          {/* <div className="relative w-[500px] h-[500px] opacity-10">
            <div className="absolute inset-0 rounded-full border-[40px] border-blue-400 blur-sm"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[120px] font-bold text-blue-500 tracking-wider">
                DES
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Right Section - Login Card */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-1">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="p-10">
            {/* Top Logo */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <img src="/12.png" alt="Logo" className="h-16 object-contain" />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              {/* You can add your image above the DES text */}
              {/* <img src="/path-to-your-image.png" alt="Logo" className="h-16 mx-auto mb-4 object-contain" /> */}
              <h1 className="text-4xl font-extrabold text-blue-900 tracking-wide">DES</h1>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter your password"
                />
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 text-white py-3 px-4 rounded-lg hover:bg-blue-800 active:bg-blue-950 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all mt-6"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Bottom Footer Logo */}
            <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
              <img src="/pilipns.png" alt="Philippines" className="h-12 object-contain" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
