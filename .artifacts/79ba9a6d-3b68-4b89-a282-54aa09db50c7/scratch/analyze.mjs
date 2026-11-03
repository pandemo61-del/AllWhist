import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/miche/Downloads/allwhist-simulations-toutes-2026-11-03T17-56-12-018Z.json', 'utf8'));

let totalPlayed = 0;
let totalSuccess = 0;
const stats = {};

for (const sim of data.simulations) {
    if (sim.isPasse || sim.contrat?.id === 'passe') continue;
    totalPlayed++;
    const cId = sim.contrat?.id || 'unknown';
    if (!stats[cId]) stats[cId] = { total: 0, success: 0 };
    stats[cId].total++;
    if (sim.resultat?.reussite) {
        totalSuccess++;
        stats[cId].success++;
    }
}

console.log(`Overall Success Rate: ${totalSuccess}/${totalPlayed} (${Math.round((totalSuccess/totalPlayed)*100)}%)`);
console.log("\nContract Breakdown:");
for (const [cId, s] of Object.entries(stats)) {
    const rate = Math.round((s.success / s.total) * 100);
    console.log(`- ${cId}: ${s.success}/${s.total} (${rate}%) [Total Deals: ${s.total}]`);
}
