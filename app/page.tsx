export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, color: '#1A2744', margin: '0 0 8px' }}>Plansparency</h1>
      <p style={{ fontSize: 18, color: '#B8860B', fontStyle: 'italic', margin: '0 0 40px' }}>Your 401(k), crystal clear.</p>
      <div style={{ display: 'flex', gap: 16 }}>
        <a href="/try" style={{ background: '#1A2744', color: '#fff', padding: '14px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Try it free</a>
        <a href="/advisor" style={{ background: '#B8860B', color: '#fff', padding: '14px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>For Advisors</a>
      </div>
    </main>
  );
}
