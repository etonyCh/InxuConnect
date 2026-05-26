async function getProperties() {
  const res = await fetch('http://localhost:3001/api/properties', { cache: 'no-store' });
  return res.json();
}

export default async function Home() {
  const { data: properties } = await getProperties();
  const moss = '#385144';
  const cloud = '#F8F5F2';

  return (
    <main style={{ background: cloud, minHeight: '100vh' }}>
      <header style={{ background: 'white', borderBottom: `1px solid #eee` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
            <span style={{ color: '#111' }}>Inzu</span>
            <span style={{ color: moss }}>Connect</span>
          </h1>
          <span style={{ fontSize: 14, color: '#666' }}>🇧🇮 Burundi</span>
        </div>
      </header>

      <section style={{ background: moss, color: 'white', padding: '60px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 36, fontWeight: 800 }}>Trouvez votre logement au Burundi</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>Bujumbura • Gitega • Locations vérifiées</p>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#111' }}>{properties.length} logements disponibles</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {properties.map((p: any) => (
            <div key={p.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(56,81,68,0.08)', border: `1px solid ${cloud}` }}>
              <div style={{ height: 200, background: `linear-gradient(135deg, ${moss}20, ${moss}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🏠</div>
              <div style={{ padding: 22 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#111' }}>{p.title}</h4>
                <p style={{ margin: '0 0 12px', color: '#666', fontSize: 14 }}>{p.description}</p>
                <div style={{ fontSize: 14, color: '#777', marginBottom: 16 }}>📍 {p.city}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 24, fontWeight: 800, color: moss }}>{p.price.toLocaleString('fr-FR')}</span>
                    <span style={{ marginLeft: 4, fontSize: 13, color: '#888' }}>FBu/mois</span>
                  </div>
                  <button style={{ background: moss, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Voir</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
