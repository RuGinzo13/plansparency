import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <>{children}</>;
}
