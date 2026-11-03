import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/miche/Downloads/allwhist-simulations-toutes-2026-11-03T17-56-12-018Z.json', 'utf8'));

const stats = {};
for (const sim of data.simulations) {
    const cId = sim.contrat?.id || 'unknown';
    if (!stats[cId]) stats[cId] = { total: 0, success: 0 };
    stats[cId].total++;
    if (sim.resultat?.reussite) stats[cId].success++;
}

console.log("Contract Success Rates:");
for (const [cId, s] of Object.entries(stats)) {
    const rate = Math.round((s.success / s.total) * 100);
    console.log(`- ${cId}: ${s.success}/${s.total} (${rate}%)`);
}
