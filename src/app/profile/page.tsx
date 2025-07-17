import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center space-x-4">
        <Link href="/" className="p-1">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-600">This is your profile page. More features coming soon!</p>
      </div>
    </>
  );
} 