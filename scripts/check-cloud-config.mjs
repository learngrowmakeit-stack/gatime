// Print configuration presence only; never print keys or their values.
const names = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];
console.log('Gatime cloud configuration at build time:');
for (const name of names) {
  console.log(`  ${name}: ${process.env[name]?.trim() ? 'present' : 'missing from build environment'}`);
}
