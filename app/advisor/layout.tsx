import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (hasClerk) {
    // Clerk configured — enforce session auth
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');
  } else if (process.env.NODE_ENV === 'production') {
    // Production without Clerk configured — block entirely rather than serve publicly
    redirect('/');
  }
  // Development without Clerk key — allow through for local dev

  return <>{children}</>;
}
