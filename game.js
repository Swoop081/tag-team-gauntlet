const app=document.getElementById("app"),overlay=document.getElementById("overlay");
let S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false};
let M=null;
const pick=(a,n=1)=>[...a].sort(()=>Math.random()-.5).slice(0,n);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rnd=(min,max)=>Math.random()*(max-min)+min;
function rel(a,b){return RELATIONSHIPS.find(r=>(r.a===a.id&&r.b===b.id)||(r.a===b.id&&r.b===a.id))}
function chemistry(a,b){let r=rel(a,b);return r?r.chemistry:Math.round((a.versatility+b.versatility)/2)}
function score(t){let[a,b]=t,av=k=>(a[k]+b[k])/2;return av("overall")*.3+av("tag")*.25+(chemistry(a,b)+S.chem)*.2+av("technique")*.1+av("power")*.05+av("speed")*.05+av("charisma")*.05+S.momentum}
function card(w,onclick="",compact=false){return `<article class="card${compact?' compact':''}" ${onclick?`onclick="${onclick}"`:""}><img src="${w.image}"><div class="name">${w.name}<small>${w.title} · ${w.faction}</small></div></article>`}
function render(x){app.innerHTML=x;document.getElementById("streak").textContent=S.streak}
function home(){M=null;S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false};render(`<section class="panel home"><h1>TAG TEAM <span>GAUNTLET</span></h1><p>Draw one original wrestler, choose one of two partners, and survive as many matches as possible. Matches now unfold event by event, and your decisions can change the result.</p><button class="btn" onclick="start()">START GAUNTLET</button></section>`)}
function start(){let captain=pick(WRESTLERS)[0];S.team=[captain];window.opts=pick(WRESTLERS.filter(w=>w.id!==captain.id),2);render(`<section class="panel"><h1 class="title">Choose Your Partner</h1><p class="sub">Your first wrestler is ${captain.name}</p><div class="cards two">${opts.map((w,i)=>card(w,`partner(${i})`)).join("")}</div><div class="actions" style="max-width:320px;margin:25px auto">${card(captain)}</div></section>`)}
function partner(i){S.team.push(opts[i]);discover(()=>team())}
function discover(next){let r=rel(...S.team);if(r&&r.type==="legendary"){overlay.innerHTML=`<div class="overlay"><div class="discover"><p>LEGENDARY TEAM DISCOVERED</p><div class="pair">${card(S.team[0])}${card(S.team[1])}</div><h1>${r.teamName}</h1><button class="btn" id="continue">CONTINUE</button></div></div>`;document.getElementById("continue").onclick=()=>{overlay.innerHTML="";next()}}else next()}
function team(){render(`<section class="panel"><h1 class="title">Your Team</h1><p class="sub">${rel(...S.team)?.teamName||S.team.map(x=>x.name).join(" & ")}</p><div class="cards two">${S.team.map(x=>card(x)).join("")}</div><div class="actions"><button class="btn" onclick="opponent()">FIND OPPONENT</button></div></section>`)}
function opponent(){let ids=new Set(S.team.map(x=>x.id)),eligible=WRESTLERS.filter(x=>!ids.has(x.id));S.opp=pick(eligible,2);render(`<section class="panel"><h1 class="title">Next Match</h1><div class="battle"><div><div class="cards">${S.team.map(x=>card(x)).join("")}</div></div><div class="vs">VS</div><div><div class="cards">${S.opp.map(x=>card(x)).join("")}</div></div></div><div class="actions"><button class="btn" onclick="match()">START MATCH</button></div></section>`)}
function walkout(){let[a,b]=S.team,c=chemistry(a,b),risk=((100-(a.loyalty+b.loyalty)/2)*.0007)+Math.max(0,75-c)*.0008;if(rel(a,b)?.type==="rivalry")risk+=.018;if(rel(a,b)?.type==="legendary")risk*=.08;return Math.random()<risk?(a.loyalty<b.loyalty?a:b):null}

const PERSONALITY={
 "jack-mercer":["raises a fist and dares the opposition to hit harder","turns the exchange into a rough Southern brawl"],
 "victor-royale":["orders his partner forward with a royal gesture","slows the pace and dictates every movement"],
 "jett-valentine":["blows a kiss to the crowd and steals the spotlight","poses one second too long—but somehow keeps control"],
 "revenant":["sits straight up as the arena lights flicker","walks through the punishment without expression"],
 "nightwatch":["appears from the blind side with perfect timing","stands motionless, watching for one fatal mistake"],
 "titan":["grins for the cameras before landing a blockbuster shot","turns the arena into his personal main event"],
 "cameron-tremblay":["dissects the opponent with flawless technique","counters three moves ahead"],
 "hollowman":["slowly rises again, refusing to stay down","stalks forward while the crowd falls silent"],
 "damian-blackwell":["waits patiently, then strikes without warning","finds the smallest opening and exploits it"],
 "elias-crowe":["laughs through the pain and creates total chaos","throws himself into danger with no concern for the cost"],
 "el-rey-del-cielo":["springs into the air with impossible balance","turns the ropes into a launchpad"],
 "max-justice":["rallies the crowd and refuses to surrender","fights back for everyone who believes in him"],
 "primal":["lets out a roar and overwhelms the opposition","hunts his opponent across the ring"],
 "lucas-bennett":["shoots for a takedown with championship precision","turns the match into a wrestling clinic"],
 "marcus-king":["fires off a rapid street-fighting combination","feeds off the crowd and finishes the exchange standing tall"],
 "mateo-vega":["fakes one direction and attacks from another","distracts the referee just long enough to steal control"],
 "ryder-phoenix":["grabs an imaginary microphone and mouths off mid-match","turns a basic exchange into a sold-out concert moment"],
 "sterling-sinclair":["checks his hair after a perfectly executed counter","wrestles with effortless, expensive-looking confidence"],
 "dax-maddox":["finds another gear when everyone thinks he is finished","keeps grinding forward through sheer work rate"],
 "logan-steele":["cups an ear to the crowd and draws on their energy","powers back like the living legend he is"]
};
const OPENINGS=["The bell rings and both teams circle cautiously.","The crowd rises as the opening wrestlers lock up.","No feeling-out process—both teams charge immediately.","A tense stare-down gives way to the first exchange."];
const GENERIC_HITS=["lands a heavy clothesline","drives the opponent into the turnbuckles","connects with a sharp counter","wins a fast exchange","drops the opponent with a sudden slam","cuts off the ring and takes control"];

function match(){
 const q=walkout();
 if(q)return lose(`${q.name} walks away before the bell!`);
 M={round:0,maxRounds:8,playerHP:100,oppHP:100,playerMom:10+S.momentum*2,oppMom:10+S.streak,activeP:0,activeO:0,log:[pick(OPENINGS)[0]],highlights:0,nearFalls:0,finishers:0,decision:null,ended:false};
 renderMatch();
}
function meter(label,value,cls=""){return `<div class="meter-wrap"><div class="meter-label"><span>${label}</span><strong>${Math.round(value)}</strong></div><div class="meter"><i class="${cls}" style="width:${clamp(value,0,100)}%"></i></div></div>`}
function renderMatch(){
 const p=S.team[M.activeP],o=S.opp[M.activeO];
 render(`<section class="panel match-panel">
 <div class="match-head"><div><small>YOUR TEAM</small><h2>${p.name}</h2>${meter('HEALTH',M.playerHP,'health')}${meter('MOMENTUM',M.playerMom,'momentum')}</div><div class="round-badge">ROUND<br><b>${Math.min(M.round+1,M.maxRounds)}</b></div><div class="right"><small>OPPONENT</small><h2>${o.name}</h2>${meter('HEALTH',M.oppHP,'health enemy')}${meter('MOMENTUM',M.oppMom,'momentum enemy')}</div></div>
 <div class="match-stage"><div class="mini-card">${card(p,'',true)}</div><div class="commentary-feed">${M.log.slice(-6).map((x,i)=>`<p class="${i===Math.min(5,M.log.slice(-6).length-1)?'latest':''}">${x}</p>`).join('')}</div><div class="mini-card">${card(o,'',true)}</div></div>
 <div class="decision"><h3>${M.decision?.title||'Choose your approach'}</h3><p>${M.decision?.text||'Your team has a moment to act.'}</p><div class="choice-grid">${choices().map(c=>`<button class="choice" onclick="choose('${c.id}')"><b>${c.name}</b><small>${c.desc}</small></button>`).join('')}</div></div>
 </section>`)
}
function choices(){
 const canFinish=M.playerMom>=65;
 return [
  {id:'attack',name:'Stay Aggressive',desc:'Reliable damage and momentum.'},
  {id:'tag',name:'Make the Tag',desc:'Fresh wrestler, safer recovery.'},
  canFinish?{id:'finish',name:'Go for the Finisher',desc:'High reward, but it can be countered.'}:{id:'risk',name:'Take a Risk',desc:'Bigger swing with a chance to backfire.'}
 ];
}
function choose(action){if(M.ended)return;M.round++;const p=S.team[M.activeP],o=S.opp[M.activeO];let pDmg=0,oDmg=0,pMom=0,oMom=0;
 if(action==='tag'){
   M.activeP=1-M.activeP;const incoming=S.team[M.activeP];M.playerHP=clamp(M.playerHP+5,0,100);M.playerMom=clamp(M.playerMom+9,0,100);M.log.push(`${p.name} reaches the corner—${incoming.name} makes the tag and enters with fresh energy!`);M.highlights++;
 }else if(action==='finish'){
   M.finishers++;const chance=.48+(p.technique+p.charisma-o.resilience)/500;
   if(Math.random()<chance){pDmg=rnd(28,38);pMom=-48;M.log.push(`FINISHER! ${p.name} hits ${p.finisher} on ${o.name}!`);M.highlights+=2;if(M.oppHP-pDmg>0&&Math.random()<.55){M.nearFalls++;M.log.push(`${o.name} kicks out at TWO! The arena erupts.`);}}
   else{oDmg=rnd(14,22);pMom=-35;M.log.push(`${o.name} counters ${p.name}'s ${p.finisher}! A huge momentum swing!`);M.highlights++}
 }else if(action==='risk'){
   if(Math.random()<.58){pDmg=rnd(16,25);pMom=16;M.log.push(`${p.name} takes a huge risk and it pays off—${pick(GENERIC_HITS)[0]}!`);M.highlights++}
   else{oDmg=rnd(13,22);pMom=-8;M.log.push(`${p.name} goes high-risk, but ${o.name} moves at the last second!`)}
 }else{
   pDmg=rnd(9,16)+(p.power+p.speed)/55;pMom=12;M.log.push(`${p.name} ${pick(GENERIC_HITS)[0]} and keeps the pressure on.`)
 }
 // personality beat
 if(Math.random()<.42){const who=Math.random()<.72?p:o;const line=pick(PERSONALITY[who.id]||['shows a glimpse of their unique style'])[0];M.log.push(`${who.name} ${line}.`);M.highlights++}
 // opponent response
 if(M.oppHP-pDmg>0){
   const activeO=S.opp[M.activeO];
   if(M.oppMom>=67&&Math.random()<.42){M.finishers++;oDmg+=rnd(23,34);M.oppMom-=45;M.log.push(`${activeO.name} suddenly hits ${activeO.finisher}!`);M.highlights+=2;if(M.playerHP-oDmg>0&&Math.random()<.5){M.nearFalls++;M.log.push(`${S.team[M.activeP].name} survives at TWO AND NINE-TENTHS!`)}}
   else if(Math.random()<.25){M.activeO=1-M.activeO;const n=S.opp[M.activeO];M.oppHP=clamp(M.oppHP+4,0,100);M.oppMom+=8;M.log.push(`${activeO.name} tags out. ${n.name} storms into the match.`)}
   else{oDmg+=rnd(7,14)+(activeO.power+activeO.technique)/70;M.oppMom+=10;M.log.push(`${activeO.name} answers back and shifts the momentum.`)}
 }
 M.oppHP=clamp(M.oppHP-pDmg,0,100);M.playerHP=clamp(M.playerHP-oDmg,0,100);M.playerMom=clamp(M.playerMom+pMom,0,100);M.oppMom=clamp(M.oppMom+oMom,0,100);
 if(M.oppHP<=0)return finishMatch(true);
 if(M.playerHP<=0)return finishMatch(false);
 if(M.round>=M.maxRounds){const pTotal=M.playerHP+M.playerMom*.25+score(S.team)*.35;const oTotal=M.oppHP+M.oppMom*.25+score(S.opp)*.35+S.streak*.5;M.log.push('Both teams empty the tank as the match reaches its decisive moment.');return finishMatch(pTotal>=oTotal)}
 M.decision={title:decisionTitle(),text:decisionText()};renderMatch();
}
function decisionTitle(){if(M.playerHP<30)return 'Your team is in serious trouble';if(M.oppHP<30)return 'The opponent is vulnerable';if(M.playerMom>=65)return 'Your finisher is ready';return pick(['Momentum is shifting','A crucial opening appears','The crowd is getting louder'])[0]}
function decisionText(){if(M.playerHP<30)return 'Do you play it safe, tag out, or gamble on a comeback?';if(M.oppHP<30)return 'One strong sequence could end the match.';if(M.playerMom>=65)return `${S.team[M.activeP].name} can attempt ${S.team[M.activeP].finisher}.`;return 'Choose how your team handles the next exchange.'}
function finishMatch(win){M.ended=true;const winner=win?S.team[M.activeP]:S.opp[M.activeO],loser=win?S.opp[M.activeO]:S.team[M.activeP];if(M.log[M.log.length-1]?.includes('kicks out')===false){}M.log.push(`${winner.name} covers ${loser.name}—ONE... TWO... THREE!`);const rating=clamp(2.2+M.highlights*.22+M.nearFalls*.32+M.finishers*.22+Math.min(M.round,8)*.08,1,5);const stars='★'.repeat(Math.round(rating))+'☆'.repeat(5-Math.round(rating));if(win)S.streak++;
 render(`<section class="panel match-result"><h1 class="title" style="color:${win?'#65e98a':'#ff6b6b'}">${win?'You Win!':'You Lose'}</h1><div class="final-log">${M.log.slice(-8).map(x=>`<p>${x}</p>`).join('')}</div><div class="rating"><span>${stars}</span><strong>${rating.toFixed(1)} MATCH RATING</strong></div><div class="actions">${win?`<button class="btn" onclick="rewards()">CHOOSE REWARD</button>`:`<button class="btn" onclick="handleLoss()">CONTINUE</button>`}</div></section>`);M.lossMessage=`${winner.name} wins after a ${rating.toFixed(1)}-star match.`}
function handleLoss(){lose(M.lossMessage)}
function rewards(){let r=[["wrestler","New Wrestler"],["chem","Chemistry Boost"],["momentum","Momentum Boost"]];if(!S.windAwarded)r.push(["wind","Second Wind"]);render(`<section class="panel"><h1 class="title">Choose Reward</h1><div class="rewards">${r.map(x=>`<article class="reward" onclick="reward('${x[0]}')"><h3>${x[1]}</h3></article>`).join("")}</div></section>`)}
function reward(t){if(t==="wrestler"){let ids=new Set(S.team.map(x=>x.id));S.offer=pick(WRESTLERS.filter(x=>!ids.has(x.id)))[0];render(`<section class="panel"><h1 class="title">New Wrestler</h1><div style="max-width:340px;margin:auto">${card(S.offer)}</div><div class="actions"><button class="btn" onclick="team()">KEEP TEAM</button><button class="btn" onclick="replace(0)">REPLACE ${S.team[0].name}</button><button class="btn" onclick="replace(1)">REPLACE ${S.team[1].name}</button></div></section>`)}else if(t==="chem"){S.chem+=5;team()}else if(t==="momentum"){S.momentum+=2;team()}else{S.wind=true;S.windAwarded=true;team()}}
function replace(i){S.team[i]=S.offer;discover(()=>team())}
function lose(msg){if(S.wind){render(`<section class="panel home"><h1>SECOND WIND</h1><p>${msg}</p><button class="btn" onclick="useWind()">CONTINUE RUN</button></section>`)}else render(`<section class="panel home"><h1>GAUNTLET OVER</h1><p>${msg}</p><h2>FINAL STREAK: ${S.streak}</h2><button class="btn" onclick="home()">PLAY AGAIN</button></section>`)}
function useWind(){S.wind=false;rewards()}
home();
