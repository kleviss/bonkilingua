"use client";

import { ArrowLeft, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export default function SettingsPage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // Redirect to home page after sign out
    window.location.href = "/";
  };

  return (
    <>
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-100 bg-white flex items-center space-x-4'>
        <Link href='/' className='p-1'>
          <ArrowLeft className='h-5 w-5 text-gray-600' />
        </Link>
        <h1 className='text-lg font-semibold text-gray-900'>Settings</h1>
      </div>

      {/* Content */}
      <div className='p-6 space-y-6'>
        {/* Account Section */}
        {user ? (
          <Card>
            <CardContent className='p-6'>
              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                    <User className='h-5 w-5 text-gray-600' />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>Account</h3>
                    <p className='text-sm text-gray-600'>{user.email}</p>
                  </div>
                </div>

                <div className='pt-4 border-t'>
                  <Button
                    variant='outline'
                    onClick={handleSignOut}
                    className='w-full flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50'
                  >
                    <LogOut className='h-4 w-4' />
                    <span>Sign out</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className='p-6'>
              <div className='text-center space-y-4'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto'>
                  <User className='h-8 w-8 text-gray-400' />
                </div>
                <div>
                  <h3 className='font-medium text-gray-900'>Not signed in</h3>
                  <p className='text-sm text-gray-600 mt-1'>Sign in to access your account settings</p>
                </div>
                <Button asChild className='w-full'>
                  <Link href='/auth/login'>Sign in</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Settings */}
        <Card>
          <CardContent className='p-6'>
            <h3 className='font-medium text-gray-900 mb-4'>App Settings</h3>
            <p className='text-sm text-gray-600'>Additional settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
