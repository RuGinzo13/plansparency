import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  // When Clerk key is missing (local dev without keys), skip auth check
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }
  const { userId } = auth();
  if (!userId) redirect('/sign-in');
  return <>{children}</>;
}
