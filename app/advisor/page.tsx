import { currentUser } from '@clerk/nextjs/server';

export default async function AdvisorDashboard() {
  // Skip Clerk call when key isn't configured (local dev without keys)
  const user = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? await currentUser()
    : null;

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ color: '#1A2744' }}>
        Welcome{user?.emailAddresses[0]?.emailAddress ? `, ${user.emailAddresses[0].emailAddress}` : ''}
      </h1>
      <p style={{ color: '#666', margin: '8px 0 32px' }}>Advisor Dashboard</p>
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 32, textAlign: 'center' }}>
        <p style={{ fontSize: 18, marginBottom: 16 }}>No plans uploaded yet.</p>
        <a href="/advisor/plans" style={{ background: '#B8860B', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none' }}>Upload your first plan</a>
      </div>
    </div>
  );
}
