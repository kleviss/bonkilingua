"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { User } from "lucide-react";

export default function AuthButton() {
  const { user } = useAuth();

  // Only show login button when user is not logged in
  if (!user) {
    return (
      <div className='flex items-center space-x-2'>
        <Button variant='outline' size='sm' asChild>
          <Link href='/auth/login' className='flex items-center space-x-1'>
            <User className='h-3 w-3' />
            <span>Sign in</span>
          </Link>
        </Button>
      </div>
    );
  }

  // Return null when user is logged in (logout will be in settings)
  return null;
}
