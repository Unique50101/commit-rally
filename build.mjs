import {cp,mkdir,writeFile,appendFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {circuit,driver} from './docs/engine.mjs';
import {backdrop,racers} from './docs/scene.mjs';
const root=dirname(fileURLToPath(import.meta.url));
export function sectorsFromWeeks(weeks) {
  if(!Array.isArray(weeks)||!weeks.length) throw Error('Contribution calendar unavailable');
  const sums=Array(12).fill(0);
  weeks.forEach((w,i)=>{
    for(const day of w.contributionDays) sums[Math.floor(i*12/weeks.length)]+=day.contributionCount;
  });
  const max=Math.max(1,...sums);
  return sums.map(s=>Math.round(9*Math.sqrt(s/max)));
}
async function main() {
  const user=process.env.RALLY_USER;
  if(!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(user||'')) throw Error('Supply an individual GitHub username.');
  const token=process.env.RALLY_TOKEN;
  if(!token) throw Error('GitHub token is required.');
  const query='query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{contributionCount}}}}}}';
  const res=await fetch('https://api.github.com/graphql',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({query,variables:{login:user}}),signal:AbortSignal.timeout(30000)});
  if(!res.ok) throw Error('GitHub returned HTTP '+res.status);
  const data=await res.json();
  if(data.errors || !data.data?.user) throw Error('Cannot read this contribution calendar. Use a user login, including in organization repositories.');
  const sectors=sectorsFromWeeks(data.data.user.contributionsCollection.contributionCalendar.weeks);
  const workspace=await realpath(process.env.GITHUB_WORKSPACE||process.cwd());
  const output=resolve(workspace,process.env.RALLY_OUTPUT||'rally-site');
  const rel=relative(workspace,output);
  if(!rel||rel.startsWith('..')||isAbsolute(rel)) throw Error('Use a new output subdirectory inside the workspace.');
  await mkdir(dirname(output),{recursive:true});
  if(await realpath(dirname(output))!==dirname(output)) throw Error('Output must not traverse a symlink.');
  await mkdir(output); // Refuse to overwrite caller-owned files.
  await cp(resolve(root,'docs'),output,{recursive:true});
  await writeFile(resolve(output,'track.json'),JSON.stringify({name:'@'+user+' circuit',sectors}));
  const track=circuit(sectors);
  await writeFile(resolve(output,'preview.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 414">'+backdrop(track)+racers(track,driver())+'</svg>');
  if(process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,'directory='+rel+'\n');
  console.log('Built the @'+user+' circuit in '+rel);
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) await main();
