import http from 'http';

const API_URL = 'http://localhost:3001';

async function hitEndpoint(url: string, method = 'GET', body?: any): Promise<{ duration: number; status: number }> {
  const start = Date.now();
  try {
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    // Consume body
    await res.text();
    return { duration, status: res.status };
  } catch (err) {
    const duration = Date.now() - start;
    return { duration, status: 500 };
  }
}

async function runSimulation() {
  console.log('🚀 Démarrage du simulateur de charge Node.js pour InzuConnect...');
  console.log('增 Simulation de 150 requêtes en rafale parallèle...');

  const promises: Promise<{ duration: number; status: number; type: string }>[] = [];
  
  for (let i = 0; i < 50; i++) {
    const randomPhone = `+25779${Math.floor(1000000 + Math.random() * 9000000)}`;
    promises.push(
      hitEndpoint(`${API_URL}/api/listings`, 'GET').then(r => ({ ...r, type: 'GET /api/listings' }))
    );
    promises.push(
      hitEndpoint(`${API_URL}/api/listings/prop_1`, 'GET').then(r => ({ ...r, type: 'GET /api/listings/prop_1' }))
    );
    promises.push(
      hitEndpoint(`${API_URL}/api/auth/otp/send`, 'POST', { phone: randomPhone }).then(r => ({ ...r, type: 'POST /api/auth/otp/send' }))
    );
  }

  const startAll = Date.now();
  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startAll;

  // Compute metrics
  const successCount = results.filter(r => r.status === 200 || r.status === 201).length;
  const failureCount = results.length - successCount;
  const latencies = results.map(r => r.duration);
  const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);

  console.log('\n📊 RÉSULTATS DE LA SIMULATION :');
  console.log(`- Requêtes envoyées : ${results.length}`);
  console.log(`- Requêtes réussies : ${successCount} (${((successCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`- Requêtes échouées : ${failureCount}`);
  console.log(`- Temps total de la simulation : ${totalDuration} ms`);
  console.log(`- Latence moyenne : ${averageLatency.toFixed(1)} ms`);
  console.log(`- Latence minimale : ${minLatency} ms`);
  console.log(`- Latence maximale : ${maxLatency} ms`);

  if (failureCount > 0) {
    console.error('❌ Des requêtes ont échoué pendant la simulation de charge.');
    process.exit(1);
  }
  
  if (averageLatency > 1500) {
    console.warn('⚠️ La latence moyenne dépasse le seuil optimal de 1.5s.');
  } else {
    console.log('✅ Performances de l\'API validées avec succès sous charge parallèle.');
  }
}

runSimulation();
