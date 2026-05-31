import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (hasClerk) {
    // Clerk configured — enforce session auth.
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');
  }
  // No Clerk key configured — advisor area is OPEN (pilot mode): anyone who
  // knows the URL can access it. To lock it down later, add a login system
  // (Clerk keys or a shared-password gate) and this branch will enforce it.

  return <>{children}</>;
}
