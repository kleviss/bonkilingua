"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col min-h-screen'>
      <div className='px-6 py-4 border-b border-gray-100 bg-white'>
        <div className='flex items-center justify-center'>
          <h1 className='text-lg font-semibold text-gray-900'>Login to Bonkilingua</h1>
        </div>
      </div>

      <div className='flex-1 p-6 flex flex-col justify-center'>
        <div className='space-y-6'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl font-bold text-gray-900'>Welcome back</h2>
            <p className='text-sm text-gray-600 mt-2'>Sign in to access your account and continue learning</p>
          </div>

          {error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm'>{error}</div>}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                Email
              </label>
              <input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500'
                placeholder='you@example.com'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between'>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <Link href='/auth/forgot-password' className='text-xs text-yellow-600 hover:underline'>
                  Forgot password?
                </Link>
              </div>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500'
                placeholder='••••••••'
              />
            </div>

            <Button type='submit' disabled={loading} className='w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold'>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              Don't have an account?{" "}
              <Link href='/auth/signup' className='text-yellow-600 hover:underline'>
                Sign up
              </Link>
            </p>
          </div>

          <div className='text-center'>
            <Link href='/' className='text-sm text-gray-600 hover:underline'>
              Continue without an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
