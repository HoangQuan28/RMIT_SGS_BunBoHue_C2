'use client';

import { useRouter } from 'next/navigation';
import { VerifyView } from '@/components/verify/VerifyView';

export default function VerifyPage() {
  const router = useRouter();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#faf8f5]">
      <VerifyView
        onVerified={(email) => {
          router.push('/?verified=true&email=' + encodeURIComponent(email));
        }}
        onBackToApp={() => {
          router.push('/');
        }}
      />
    </div>
  );
}
