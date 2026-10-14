export function durationMs(minutes,seconds){if(String(minutes).trim()===''||String(seconds).trim()==='')return null;const m=Number(minutes),s=Number(seconds);return Number.isInteger(m)&&m>=0&&m<=1440&&Number.isInteger(s)&&s>=0&&s<=59&&(m*60+s)>0?(m*60+s)*1000:null;}
export function remainingMs(timer,now=Date.now()){return timer.status==='running'?Math.max(0,timer.deadline-now):timer.remaining;}
export function timerText(ms){const seconds=Math.ceil(Math.max(0,ms)/1000);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
