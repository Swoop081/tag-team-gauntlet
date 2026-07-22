const fs=require('fs'),vm=require('vm');
class LS{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const dummy={innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},dataset:{},style:{},querySelector(){return null},querySelectorAll(){return []},insertAdjacentHTML(){},appendChild(){},scrollTop:0,scrollHeight:0};
const doc={body:dummy,documentElement:dummy,getElementById(){return dummy},querySelector(){return null},querySelectorAll(){return []},createElement(){return Object.assign({},dummy)},addEventListener(){}};
let seed=83709;function rng(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
let timers=[];
const math=Object.create(Math);math.random=rng;
const ctx={console,Math:math,JSON,Date,document:doc,window:null,localStorage:new LS(),navigator:{serviceWorker:{register(){return Promise.resolve()}}},location:{reload(){},search:''},URLSearchParams,confirm:()=>true,alert(){},setTimeout:(fn,ms)=>{timers.push(fn);return timers.length},clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame:(fn)=>fn(),MutationObserver:class{observe(){}},Image:function(){},performance:{now:()=>0}};ctx.window=ctx;ctx.globalThis=ctx;
const context=vm.createContext(ctx);
for(const f of ['data.js','game.js'])vm.runInContext(fs.readFileSync('/mnt/data/lpw_build9/'+f,'utf8'),context,{filename:f});
const sim=vm.runInContext(`(function(){
 function ensureCareer(){
   gauntletLiveChooseFounder('revenant');
   let c=liveLoad();liveEnsureWorld(c);liveEnsureProgression(c);
   if(!liveFeud(c)){const opp=livePickDifferent(c,[c.active]);liveStartFeud(c,opp.id,'Year QA opening rivalry.');}
   liveGenerateMonthlyPlan(c);liveSave(c);return c;
 }
 function playMatch(){
   gauntletLiveMatchCard();gauntletLiveLaunchBroadcast();
   let guard=0;
   while(M&&!M.ended&&guard++<200){
     if(M.waiting){
       if(!M.currentDecision)renderMatch();
       const opts=M.currentDecision?.options||[];
       const idx=Math.floor(Math.random()*Math.max(1,opts.length));
       storyChoice('choice-'+idx);
       if(M.decisionOutcome)continueDecisionOutcome();
     } else advanceStory();
   }
   if(!M||!M.ended)throw new Error('match did not resolve');
   const win=M.finalPlayer>=M.finalOpp;
   showSummary(win);
   const rating=Number(M.completedRating||3);
   const result={win,player:M.finalPlayer,opp:M.finalOpp,rating,decisions:(M.decisionHistory||[]).map(x=>x.choice),supercard:!!liveLoad().pending?.isSupercard,opponent:liveLoad().pending?.opponent};
   liveCompleteBroadcast(win);
   return result;
 }
 let c=ensureCareer(), matches=[], injury={diagnoses:0,clearances:0,repeatDiagnosis:0,days:0};
 let forcedInjury=false;let seenInjuries=new WeakSet();let maxSteps=500,steps=0;
 while((liveLoad().month<=12)&&steps++<maxSteps){
   c=liveLoad();
   // Force one injury early so the actual state machine is exercised.
   if(!forcedInjury&&c.month===2&&c.week>=5&&!c.world.injury){c.world.injury={severity:'minor'};c.world.injuryDetail={name:'Bruised ribs',severity:'Minor',recovery:'3–5 days',cause:'a hard landing during your previous match'};liveSave(c);forcedInjury=true;}
   c=liveLoad();
   if(c.world?.injury){
     injury.days++;
     const i=c.world.injury;
     if(!i.diagnosed){
       if(i.__qaSeen)injury.repeatDiagnosis++; else {injury.diagnoses++;i.__qaSeen=true;c.world.injury=i;liveSave(c);}
       gauntletLiveDoctorVisit();
       gauntletLiveClearInjury(Math.random()<.5?'rest':'push');
       continue;
     }
     if(((Number(c.month||1)-1)*28+(Number(c.week||1)-1)*7+Number(c.day||0))>=Number(i.until)){
       gauntletLiveDoctorVisit();injury.clearances++;continue;
     }
     // exercise the actual restricted-day branching, then advance one day safely
     gauntletLiveBeginDay();
     c=liveLoad();liveAdvanceDay(c);liveSave(c);continue;
   }
   const isMatch=(c.day===0||c.day===3||liveIsSupercard(c));
   if(isMatch){
     const r=playMatch();matches.push({...r,month:c.month,week:c.week,day:c.day});
     c=liveLoad();
     if(r.supercard){
       const current=c.active;gauntletLiveStartNextMonth(current);
     }
     continue;
   }
   // Use actual XP and day advancement on non-match days.
   const xp=[30,45,40,35,30,25,25][c.day]||30;liveAwardXp(c,c.active,xp,'Headless year QA activity');liveAdvanceDay(c);liveSave(c);
 }
 c=liveLoad();
 const supercards=matches.filter(x=>x.supercard);
 const cleanPrefixes=/^(Rebel|Royal|Heroic|Primal|Olympian|Street|Rockstar|Playboy|Veteran|Legendary|Heartbreaker|Kingmaker|Iceman|Sentinel|Hollywood|Lunatic|Workhorse|Warlord|Showman|Strategist|Enforcer|Powerhouse|Aerialist|Purist|Assassin|Hardcore|Megastar|Con|Brawler|Supernatural|Undead|Dark|Masked|Canadian|Streetwise|Technical|Dominant|Fearless|Savage|Extreme|Iconic|Ruthless|Relentless|Precision|High-Flying|High|Cold-Blooded|Cold|Unbreakable|Unstoppable|Mysterious|Chaotic)\\s+/;
 return {final:{month:c.month,week:c.week,day:c.day,wins:c.wins,losses:c.losses,momentum:c.momentum,popularity:c.popularity,level:liveProgress(c.active,c).level},matches,supercards:{played:supercards.length,wins:supercards.filter(x=>x.win).length,losses:supercards.filter(x=>!x.win).length,results:supercards},injury,duplicateDecisionMatches:matches.filter(m=>new Set(m.decisions.map(x=>x.toLowerCase())).size!==m.decisions.length).length,prefixLeaks:[...new Set(matches.flatMap(m=>m.decisions).filter(x=>cleanPrefixes.test(x)))],rating:{mean:matches.reduce((a,b)=>a+b.rating,0)/matches.length,min:Math.min(...matches.map(x=>x.rating)),max:Math.max(...matches.map(x=>x.rating))}};
})()`,context);
fs.writeFileSync('/mnt/data/lpw_build9/BUILD-8-ACTUAL-ENGINE-YEAR-RUN.json',JSON.stringify(sim,null,2));
console.log(JSON.stringify({final:sim.final,supercards:sim.supercards,injury:sim.injury,duplicateDecisionMatches:sim.duplicateDecisionMatches,prefixLeaks:sim.prefixLeaks,rating:sim.rating},null,2));
