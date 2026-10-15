import {readFile,writeFile,mkdir} from 'node:fs/promises';
const fingerprint=process.argv[2]?.toUpperCase();
const testMode=process.argv[3]==='--test';
if(process.argv[3]&&!testMode){console.error('Unknown option');process.exit(1);}
if(!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(fingerprint||'')){console.error('Usage: node android/link-domain.mjs "SHA-256 app signing certificate from Play Console" [--test]');process.exit(1);}
const manifest=JSON.parse(await readFile(new URL('./twa-manifest.json',import.meta.url),'utf8'));
const packageName=manifest.packageId+(testMode?'.test':'');
const directory=new URL('../public/.well-known/',import.meta.url);await mkdir(directory,{recursive:true});
await writeFile(new URL('assetlinks.json',directory),JSON.stringify([{relation:['delegate_permission/common.handle_all_urls'],target:{namespace:'android_app',package_name:packageName,sha256_cert_fingerprints:[fingerprint]}}],null,2)+'\n');
console.log('Created Digital Asset Links for '+packageName+'. Deploy the web app, then verify this exact certificate and HTTPS URL.');
