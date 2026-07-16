const app=document.getElementById('app'),overlay=document.getElementById('overlay');
let S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null};
let M=null,storyTimer=null;
const pick=(a,n=1)=>[...a].sort(()=>Math.random()-.5).slice(0,n);
const one=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rnd=(min,max)=>Math.random()*(max-min)+min;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function rel(a,b){return RELATIONSHIPS.find(r=>(r.a===a.id&&r.b===b.id)||(r.a===b.id&&r.b===a.id))}
function chemistry(a,b){let r=rel(a,b);return r?r.chemistry:Math.round((a.versatility+b.versatility)/2)}
function score(t){let[a,b]=t;if(!b)return a.overall*.34+a.technique*.2+a.power*.14+a.speed*.12+a.charisma*.1+a.resilience*.1+S.momentum;let av=k=>(a[k]+b[k])/2;return av('overall')*.3+av('tag')*.25+(chemistry(a,b)+S.chem)*.2+av('technique')*.1+av('power')*.05+av('speed')*.05+av('charisma')*.05+S.momentum}
function card(w,onclick='',compact=false){return `<article class="card${compact?' compact':''}" ${onclick?`onclick="${onclick}"`:''}><img src="${w.image}"><div class="name">${w.name}<small>${w.title} · ${w.faction}</small></div></article>`}
function render(x){app.innerHTML=x;document.getElementById('streak').textContent=S.streak}
function clearStoryTimer(){if(storyTimer){clearTimeout(storyTimer);storyTimer=null}}
function home(){clearStoryTimer();M=null;S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null};render(`<section class="panel home"><div class="actions top-actions"><button class="btn" onclick="start()">START GAUNTLET</button></div><h1>TAG TEAM <span>GAUNTLET</span></h1><p>Build a team and survive the Gauntlet. Matches now play as televised wrestling stories, pausing only when your decision can change the outcome.</p></section>`)}
function start(){let captain=one(WRESTLERS);S.team=[captain];window.opts=pick(WRESTLERS.filter(w=>w.id!==captain.id),2);render(`<section class="panel"><h1 class="title">Choose Your Partner</h1><p class="sub">Your first wrestler is ${captain.name}</p><div class="cards two">${opts.map((w,i)=>card(w,`partner(${i})`)).join('')}</div><div class="actions" style="max-width:320px;margin:25px auto">${card(captain)}</div></section>`)}
function partner(i){S.team.push(opts[i]);discover(()=>team())}
function discover(next){let r=S.team.length>1?rel(...S.team):null;if(r&&r.type==='legendary'){overlay.innerHTML=`<div class="overlay unlock-overlay"><div class="discover unlock-discover"><div class="actions top-actions"><button class="btn" id="continue">CONTINUE</button></div><p>LEGENDARY TEAM DISCOVERED</p><div class="pair unlock-pair">${card(S.team[0])}${card(S.team[1])}</div><h1>${r.teamName}</h1></div></div>`;document.getElementById('continue').onclick=()=>{overlay.innerHTML='';next()}}else next()}
function team(){clearStoryTimer();render(`<section class="panel"><div class="actions top-actions"><button class="btn" onclick="opponent()">FIND OPPONENT</button></div><h1 class="title">Your Team</h1><p class="sub">${rel(...S.team)?.teamName||S.team.map(x=>x.name).join(' & ')}</p><div class="cards two">${S.team.map(x=>card(x)).join('')}</div></section>`)}
function opponent(){let ids=new Set(S.team.map(x=>x.id)),eligible=WRESTLERS.filter(x=>!ids.has(x.id));S.opp=pick(eligible,2);render(`<section class="panel"><div class="actions top-actions"><button class="btn" onclick="match()">START MATCH</button></div><h1 class="title">Next Match</h1><div class="battle"><div><div class="cards">${S.team.map(x=>card(x)).join('')}</div></div><div class="vs">VS</div><div><div class="cards">${S.opp.map(x=>card(x)).join('')}</div></div></div></section>`)}
function walkout(){if(S.team.length<2)return null;let[a,b]=S.team,c=chemistry(a,b),risk=((100-(a.loyalty+b.loyalty)/2)*.0007)+Math.max(0,75-c)*.0008;if(rel(a,b)?.type==='rivalry')risk+=.018;if(rel(a,b)?.type==='legendary')risk*=.08;return Math.random()<risk?(a.loyalty<b.loyalty?a:b):null}

const PERSONALITY_PROFILES={"jack-mercer":{"archetype":"Rebel Brawler","events":["raises a fist and invites the opposition to hit harder","turns the exchange into a rough Southern brawl","fires back with heavy right hands as the crowd chants Iceman","shrugs off the shot and dares the opponent to try again","drags the fight toward the ropes and makes it ugly","stomps to the centre of the ring and refuses to back down"]},"victor-royale":{"archetype":"Royal Strategist","events":["orders the ring around him with a royal gesture","slows the pace and dictates every movement","smirks after escaping danger and points to his crown","uses the referee as a shield before reclaiming control","demands his partner follow the plan","turns a simple counter into a statement of superiority"]},"jett-valentine":{"archetype":"Heartbreaker Showman","events":["blows a kiss to the crowd and steals the spotlight","poses for the cameras before snapping back into the fight","fixes his hair after a dazzling escape","spins away from danger and points at himself","plays to the crowd instead of making the cover","turns the ropes into a stage and the match into his show"]},"revenant":{"archetype":"Supernatural Force","events":["sits straight up as the arena lights flicker","walks through the punishment without expression","raises his head slowly and the crowd falls silent","stands motionless while the opponent hesitates","surges forward as green light flashes across the arena","absorbs the strike as though pain means nothing"]},"nightwatch":{"archetype":"Dark Enforcer","events":["appears from the blind side with perfect timing","raises the black bat from ringside and fixes a cold stare on the ring","stalks the legal wrestler without wasting a step","points toward Revenant before striking","uses the ropes to cut off every escape route","lets the face paint and silence do the intimidating"]},"titan":{"archetype":"Hollywood Megastar","events":["grins for the cameras before landing a blockbuster shot","turns the arena into his personal main event","pauses for the hard camera and then explodes forward","talks to the crowd while controlling the exchange","throws his arms wide as if accepting an award","delivers the hit and immediately checks which camera caught it"]},"cameron-tremblay":{"archetype":"Technical Purist","events":["dissects the opponent with flawless technique","counters as though he planned the exchange three moves ago","targets a limb and refuses to lose position","transitions from hold to hold without giving space","uses perfect balance to reverse the momentum","turns the contest into a clinic in precision"]},"hollowman":{"archetype":"Urban Legend","events":["slowly rises again, refusing to stay down","stalks forward while the front row backs away","tilts the stitched mask and keeps advancing","absorbs a huge shot without changing expression","stands in the corner breathing heavily before charging","makes the entire arena feel like the woods after midnight"]},"damian-blackwell":{"archetype":"Silent Assassin","events":["waits patiently, then strikes without warning","finds the smallest opening and exploits it","circles quietly until the perfect angle appears","cuts off the comeback with one precise blow","never changes expression as control shifts his way","turns stillness into sudden violence"]},"elias-crowe":{"archetype":"Unhinged Hardcore","events":["laughs through the pain and creates total chaos","pulls at the loose straps of the straitjacket and charges","welcomes the punishment with a crooked grin","rolls outside and turns the match into a street fight","scrapes at the canvas and crawls back toward danger","looks happiest when the match becomes impossible to control"]},"el-rey-del-cielo":{"archetype":"Lucha Aerialist","events":["springs into the air with impossible balance","turns the ropes into a launchpad","lands on his feet and points toward the sky","changes direction in mid-air and leaves everyone stunned","flies across the ring before the opponent can react","makes gravity look optional"]},"max-justice":{"archetype":"Heroic Powerhouse","events":["rallies the crowd and refuses to surrender","fights back for everyone who believes in him","checks on his partner before charging into danger","raises a fist and the arena answers","absorbs the punishment and stands for one more fight","turns courage into a powerful comeback"]},"primal":{"archetype":"Apex Beast","events":["lets out a roar and overwhelms the opposition","hunts the opponent across the ring","drops low like a predator before exploding forward","drives through the defence with raw force","paces behind the opponent and waits to strike","abandons technique and unleashes pure instinct"]},"lucas-bennett":{"archetype":"Elite Olympian","events":["shoots for a takedown with championship precision","turns the match into an elite wrestling clinic","chains two takedowns together without losing control","forces the opponent to wrestle at his pace","uses world-class conditioning to win the scramble","treats every exchange like the final of a tournament"]},"marcus-king":{"archetype":"Street Fighter","events":["fires off a rapid street-fighting combination","feeds off the crowd and finishes the exchange standing tall","slips a strike and answers with a heavy combination","turns the centre of the ring into his neighbourhood","talks through the exchange and keeps swinging","fights with rhythm, power and complete confidence"]},"mateo-vega":{"archetype":"Aerial Con Artist","events":["fakes one direction and attacks from another","distracts the referee just long enough to steal control","pretends to be hurt before springing into the air","points behind the opponent and steals the opening","turns a rope escape into a flying counter","smiles because everybody fell for the trick again"]},"ryder-phoenix":{"archetype":"Rockstar Ego","events":["grabs the microphone at ringside and mouths off mid-match","turns a basic exchange into a sold-out concert moment","plays air guitar after a successful counter","demands the spotlight before delivering a sharp strike","shouts that the crowd came to see him","misses a cover because he is busy performing"]},"sterling-sinclair":{"archetype":"Luxury Playboy","events":["checks his hair after a perfectly executed counter","wrestles with effortless, expensive-looking confidence","dusts off his shoulder and looks offended by the contact","waves dismissively before taking control","smiles as if the result has already been purchased","makes every movement look tailored and exclusive"]},"dax-maddox":{"archetype":"Veteran Workhorse","events":["finds another gear when everyone thinks he is finished","keeps grinding forward through sheer work rate","drags himself up and immediately asks for more","wins a long exchange through patience and effort","refuses the easy way out and keeps working","turns exhaustion into one more burst of offence"]},"logan-steele":{"archetype":"Living Legend","events":["cups an ear to the crowd and draws on their energy","powers back like the living legend he is","points around the arena as the noise rises","shakes off the damage and stands taller","uses veteran timing to land the perfect counter","reminds everyone why generations still believe"]}};
const STORY_TYPES={
 classic:{name:'Classic Wrestling Match',min:12,max:16,decisions:2,bias:0},
 war:{name:'Back-and-Forth War',min:16,max:21,decisions:3,bias:0,nearFall:.18},
 comeback:{name:'Underdog Comeback',min:14,max:19,decisions:3,bias:-7,comeback:true},
 sprint:{name:'Fast Sprint',min:8,max:11,decisions:1,bias:2},
 domination:{name:'One-Sided Domination',min:8,max:13,decisions:1,bias:12},
 tagClinic:{name:'Tag Team Showcase',min:14,max:19,decisions:3,bias:0,tags:true},
 upset:{name:'Upset Special',min:12,max:17,decisions:2,bias:-4,upset:true}
};
const PHASES=[
 {id:'opening',label:'Opening Bell'},
 {id:'control',label:'Early Control'},
 {id:'shift',label:'Momentum Shift'},
 {id:'crisis',label:'Crisis Point'},
 {id:'climax',label:'Climax'},
 {id:'finish',label:'Finish'}
];
const MOVES={
 opening:['wins the opening lock-up','lands the first hard strike','shoots behind for an early takedown','backs the opponent into the corner','catches the opponent with a quick arm drag'],
 control:['cuts off the ring and takes control','lands a heavy clothesline','drives the opponent into the turnbuckles','wears the opponent down with a grinding hold','drops the opponent with a sudden slam'],
 shift:['counters at the last possible second','escapes and creates separation','fires back with a desperate combination','ducks a strike and changes the entire match','catches the opponent rushing in'],
 crisis:['survives a brutal sequence','reaches toward the corner but is dragged back','absorbs a huge impact and somehow keeps moving','finds a burst of energy from nowhere','gets trapped far from the tag rope'],
 climax:['connects with the biggest move of the match so far','launches into a frantic finishing sequence','catches the opponent flush and hooks the leg','turns a counter into a spectacular impact','empties the tank in one final surge']
};


function profileFor(w){return PERSONALITY_PROFILES[w.id]||{archetype:'Wrestler',events:['shows a flash of individual style']}}
function wrestlerIntro(w){return `${w.title.toUpperCase()} — ${w.name.toUpperCase()} · ${w.faction.toUpperCase()}`}
function personalityEvent(w){return one(profileFor(w).events)}
function setSpotlight(w,tagline){M.spotlight={name:w.name,title:w.title,move:w.finisher,tagline:tagline||one(['THIS COULD BE IT!','THE CROWD IS ON ITS FEET!','A DEFINING MOMENT!'])};}
function clearSpotlight(){if(M)M.spotlight=null}

function chooseStory(){
 const keys=['classic','war','comeback','sprint','domination','tagClinic','upset'];
 const weights=[28,24,13,10,8,11,6];let r=Math.random()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<keys.length;i++){r-=weights[i];if(r<=0)return keys[i]}return 'classic';
}
function match(){
 clearStoryTimer();const q=walkout();if(q)return lose(`${q.name} walks away before the bell!`);
 const storyKey=chooseStory(),story=STORY_TYPES[storyKey],eventTarget=Math.round(rnd(story.min,story.max));
 const teamPower=score(S.team),oppPower=score(S.opp)+S.streak*.7;
 let hiddenEdge=(teamPower-oppPower)/7+story.bias+rnd(-8,8);
 if(story.upset)hiddenEdge=teamPower>=oppPower?rnd(-10,-3):rnd(3,10);
 const startPlayer=Math.round(teamPower),startOpp=Math.round(oppPower);
 M={storyKey,story,eventTarget,eventIndex:0,phaseIndex:0,activeP:0,activeO:0,playerControl:50+hiddenEdge,playerMom:12+S.momentum*2,oppMom:12+S.streak,log:[],highlights:[],nearFalls:0,finishers:0,tags:0,decisionsMade:0,nextDecisionAt:decisionPoints(eventTarget,story.decisions),waiting:false,ended:false,latest:'',winner:null,loser:null,turningPoint:'',bestMoment:'',mvp:null,matchSeconds:Math.round(rnd(330,900)),phaseLabel:'Opening Bell',spotlight:null,personalityMoments:{},startPlayer,startOpp,performancePlayer:0,performanceOpp:0,decisionPlayer:0,decisionOpp:0,crowd:8,crowdPlayer:0,crowdOpp:0,finalPlayer:0,finalOpp:0,finishType:''};
 addBroadcast('broadcast',`${S.specialSingles?'YOUR REPRESENTATIVE':'YOUR TEAM'}: ${S.team.map(wrestlerIntro).join(' / ')}`); addBroadcast('broadcast',`${S.specialSingles?'CHALLENGER':'OPPOSITION'}: ${S.opp.map(wrestlerIntro).join(' / ')}`);
 addBroadcast('phase','OPENING BELL');
 addBroadcast('normal',one(['The bell rings and both teams circle cautiously.','The crowd rises as the opening wrestlers lock up.','No feeling-out process—both teams charge immediately.','A tense stare-down gives way to the first exchange.']));
 renderMatch();scheduleNext(900);
}
function decisionPoints(total,count){const pts=[];for(let i=1;i<=count;i++)pts.push(Math.round(total*(i/(count+1)))+Math.round(rnd(-1,1)));return [...new Set(pts)].filter(x=>x>1&&x<total-1).sort((a,b)=>a-b)}
function phaseForEvent(i,total){const p=i/total;if(p<.14)return 0;if(p<.34)return 1;if(p<.55)return 2;if(p<.72)return 3;if(p<.9)return 4;return 5}
function addBroadcast(type,text,meta={}){M.log.push({type,text,...meta});M.latest=text;if(meta.highlight){M.highlights.push(text);if(!M.bestMoment||meta.weight>=(M.bestWeight||0)){M.bestMoment=text;M.bestWeight=meta.weight||1}}}
function scheduleNext(ms=1050){clearStoryTimer();storyTimer=setTimeout(()=>advanceStory(),ms)}
function renderMatch(){
 const p=S.team[M.activeP],o=S.opp[M.activeO],control=clamp(M.playerControl,5,95);
 render(`<section class="panel story-panel">
 <div class="broadcast-top"><div><small>MATCH BROADCAST</small><h1>${M.phaseLabel}</h1></div><div class="story-chip">${M.story.name}</div></div>
 <div class="control-strip"><div class="team-label">${S.team.map(x=>x.name).join(' & ')}</div><div class="control-meter"><i style="width:${control}%"></i><span>CONTROL ${Math.round(control)}–${Math.round(100-control)}</span></div><div class="team-label right">${S.opp.map(x=>x.name).join(' & ')}</div></div>
 <div class="scoreboard-strip"><div><small>MATCH SCORE</small><strong>${projectedScore('player')}</strong></div><div class="crowd-meter"><span>🔥 CROWD ${Math.round(M.crowd)}%</span><i style="width:${M.crowd}%"></i></div><div class="right"><small>MATCH SCORE</small><strong>${projectedScore('opp')}</strong></div></div>
 <div class="decision-layer">${M.waiting?decisionHTML():''}</div>
 <div class="broadcast-layout"><div class="broadcast-card">${card(p,'',true)}<small>${S.specialSingles?'YOUR WRESTLER':'LEGAL WRESTLER'}</small></div><div id="broadcastFeed" class="broadcast-feed">${M.log.slice(-10).map((e,i)=>`<div class="broadcast-line ${e.type} ${i===M.log.slice(-10).length-1?'latest':''}">${e.type==='phase'?'<b>'+e.text+'</b>':e.text}</div>`).join('')}</div><div class="broadcast-card">${card(o,'',true)}<small>${S.specialSingles?'CHALLENGER':'LEGAL WRESTLER'}</small></div></div>
 ${M.spotlight?`<div class="signature-spotlight"><small>★ SIGNATURE MOVE ★</small><h2>${M.spotlight.move}</h2><h3>${M.spotlight.name}</h3><p>${M.spotlight.tagline}</p></div>`:''}<div class="broadcast-status"><span>Moment ${Math.min(M.eventIndex+1,M.eventTarget)} of ${M.eventTarget}</span><span>${formatTime(Math.round(M.matchSeconds*(M.eventIndex/Math.max(1,M.eventTarget))))}</span></div>
 ${M.waiting?'':`<div class="auto-play"><span class="live-dot"></span> MATCH IN PROGRESS</div>`}
 </section>`);
 const feed=document.getElementById('broadcastFeed');if(feed)feed.scrollTop=feed.scrollHeight
}
function decisionHTML(){const d=getDecision();return `<div class="story-decision"><small>CRITICAL DECISION</small><h2>${d.title}</h2><p>${d.text}</p><div class="choice-grid">${d.options.map(x=>`<button class="choice" onclick="storyChoice('${x.id}')"><b>${x.name}</b><small>${x.desc}</small></button>`).join('')}</div></div>`}
function getDecision(){
 const p=S.team[M.activeP],partner=S.team.length>1?S.team[1-M.activeP]:null,control=M.playerControl;
 if(S.specialSingles){if(M.phaseIndex>=4||M.playerMom>=67)return {title:`${p.name} has a chance to finish it`,text:`${p.finisher} is available, but the challenger may be waiting for it.`,options:[{id:'finisher',name:`Attempt ${p.finisher}`,desc:'Biggest possible reward—and risk.'},{id:'risk',name:'Create a Highlight',desc:'Use speed and creativity to seize the moment.'},{id:'pressure',name:'Keep the Pressure On',desc:'Protect the advantage and wait for a cleaner opening.'}]};if(control<42)return {title:'Your wrestler is losing control',text:`${p.name} needs to change the direction of this singles match.`,options:[{id:'comeback',name:'Launch a Comeback',desc:'High risk, but a major momentum swing.'},{id:'survive',name:'Weather the Storm',desc:'Reduce risk and wait for a mistake.'},{id:'risk',name:'Take a Big Risk',desc:'Try to shock the challenger immediately.'}]};return {title:'A major opening appears',text:`${p.name} has the challenger off balance.`,options:[{id:'risk',name:'Create a Highlight',desc:'Attempt a spectacular sequence.'},{id:'control',name:'Control the Match',desc:'Stay disciplined and protect momentum.'},{id:'finisher',name:`Tease ${p.finisher}`,desc:'Try to force a panicked counter.'}]};}
 if(M.phaseIndex>=4||M.playerMom>=67)return {title:`${p.name} has a chance to finish it`,text:`${p.finisher} is available, but the opponent may be waiting for it.`,options:[{id:'finisher',name:`Attempt ${p.finisher}`,desc:'Biggest possible reward—and risk.'},{id:'tag',name:`Tag ${partner.name}`,desc:'Bring in a fresh wrestler for the final stretch.'},{id:'pressure',name:'Keep the Pressure On',desc:'Protect the advantage and wait for a cleaner opening.'}]};
 if(control<42)return {title:'Your team is losing control',text:`${p.name} is being isolated. This decision could spark the comeback.`,options:[{id:'comeback',name:'Launch a Comeback',desc:'High risk, but a major momentum swing.'},{id:'tag',name:`Fight for the Tag`,desc:`Try to bring in ${partner.name}.`},{id:'survive',name:'Weather the Storm',desc:'Reduce risk and wait for a mistake.'}]};
 return {title:'A major opening appears',text:`${p.name} has the opposition off balance.`,options:[{id:'risk',name:'Create a Highlight',desc:'Attempt a spectacular sequence.'},{id:'tag',name:`Make the Tag`,desc:`Let ${partner.name} attack with fresh energy.`},{id:'control',name:'Control the Match',desc:'Stay disciplined and protect momentum.'}]};
}
async function advanceStory(){
 if(!M||M.ended||M.waiting)return;
 clearSpotlight();
 M.eventIndex++;
 const newPhase=phaseForEvent(M.eventIndex,M.eventTarget);
 if(newPhase!==M.phaseIndex){M.phaseIndex=newPhase;M.phaseLabel=PHASES[newPhase].label;addBroadcast('phase',PHASES[newPhase].label.toUpperCase());}
 if(M.nextDecisionAt.includes(M.eventIndex)){M.waiting=true;renderMatch();return}
 generateAutomaticBeat();renderMatch();
 if(M.eventIndex>=M.eventTarget)return resolveFinish();
 scheduleNext(M.phaseIndex>=4?1150:900);
}
function eventWrestler(teamSide){return teamSide==='player'?S.team[M.activeP]:S.opp[M.activeO]}
function shiftControl(amount,reason){const before=M.playerControl;M.playerControl=clamp(M.playerControl+amount,5,95);if(Math.abs(M.playerControl-before)>=9&&!M.turningPoint)M.turningPoint=reason}
function addMatchScore(side,amount,category='performance'){
 if(!M)return;
 const key=category==='decision'?(side==='player'?'decisionPlayer':'decisionOpp'):(side==='player'?'performancePlayer':'performanceOpp');
 M[key]+=amount;
}
function heatCrowd(amount,side){
 if(!M)return;M.crowd=clamp(M.crowd+amount,0,100);
 if(side==='player')M.crowdPlayer+=Math.max(0,amount);else if(side==='opp')M.crowdOpp+=Math.max(0,amount);
}
function projectedScore(side){
 const start=side==='player'?M.startPlayer:M.startOpp,perf=side==='player'?M.performancePlayer:M.performanceOpp,decision=side==='player'?M.decisionPlayer:M.decisionOpp,crowdShare=side==='player'?M.crowdPlayer:M.crowdOpp;
 return Math.round(start+perf+decision+crowdShare*.12);
}
function generateAutomaticBeat(){
 const phase=PHASES[M.phaseIndex].id;let playerActs=Math.random()<(M.playerControl/100),actor=eventWrestler(playerActs?'player':'opp'),victim=eventWrestler(playerActs?'opp':'player');
 let amount=rnd(3,8)*(playerActs?1:-1);
 if(M.story.comeback&&M.phaseIndex<2)amount=-Math.abs(amount);if(M.story.comeback&&M.phaseIndex>=3)amount=Math.abs(amount)*1.35;
 if(M.storyKey==='domination')amount=Math.abs(amount)*(M.story.bias>0?1:-1);
 const move=one(MOVES[phase]||MOVES.control);
 addBroadcast('normal',`${actor.name} ${move}.`);
 shiftControl(amount,`${actor.name} changed the match by ${move}.`);
 addMatchScore(playerActs?'player':'opp',Math.round(rnd(2,5)));
 heatCrowd(Math.round(rnd(1,3)),playerActs?'player':'opp');
 if(playerActs)M.playerMom=clamp(M.playerMom+rnd(5,11),0,100);else M.oppMom=clamp(M.oppMom+rnd(5,11),0,100);
 if(Math.random()<.58){const line=personalityEvent(actor);M.personalityMoments[actor.id]=(M.personalityMoments[actor.id]||0)+1;addMatchScore(playerActs?'player':'opp',1);heatCrowd(2,playerActs?'player':'opp');addBroadcast('personality',`${actor.name} ${line}.`,{highlight:true,weight:1.25});}
 if(S.team.length>1&&S.opp.length>1&&(M.story.tags||Math.random()<.16)&&M.phaseIndex>0){
   if(playerActs){const old=actor;M.activeP=1-M.activeP;const fresh=S.team[M.activeP];addBroadcast('tag',`${old.name} makes the tag—${fresh.name} explodes into the match!`,{highlight:true,weight:1.3});shiftControl(5,`${fresh.name}'s hot tag changed the momentum.`);addMatchScore('player',6);heatCrowd(6,'player')}
   else{const old=actor;M.activeO=1-M.activeO;const fresh=S.opp[M.activeO];addBroadcast('tag',`${old.name} tags out and ${fresh.name} storms through the ropes.`,{highlight:true,weight:1.2});shiftControl(-4,`${fresh.name}'s tag changed the momentum.`);addMatchScore('opp',6);heatCrowd(5,'opp')}
   M.tags++;
 }
 if(M.phaseIndex>=3&&Math.random()<(.1+(M.story.nearFall||0))){createNearFall(playerActs)}
 if(M.phaseIndex>=4&&Math.random()<.18){attemptAIFinisher(playerActs)}
}
function createNearFall(playerSide){const side=playerSide?'player':'opp',attacker=eventWrestler(side),defender=eventWrestler(playerSide?'opp':'player');M.nearFalls++;addMatchScore(side,4);heatCrowd(9,side);addBroadcast('nearfall',`${attacker.name} hooks the leg—ONE... TWO... ${defender.name} kicks out!`,{highlight:true,weight:2});}
function attemptAIFinisher(playerSide){const attacker=eventWrestler(playerSide?'player':'opp'),defender=eventWrestler(playerSide?'opp':'player');const success=Math.random()<.62;M.finishers++;
 if(success){setSpotlight(attacker);addMatchScore(playerSide?'player':'opp',15);heatCrowd(12,playerSide?'player':'opp');addBroadcast('finisher',`${attacker.name} lands ${attacker.finisher} on ${defender.name}!`,{highlight:true,weight:2.8});shiftControl(playerSide?12:-12,`${attacker.name} landed ${attacker.finisher}.`);if(Math.random()<.66)createNearFall(playerSide)}else{addMatchScore(playerSide?'player':'opp',-8);addMatchScore(playerSide?'opp':'player',5);heatCrowd(7,playerSide?'opp':'player');addBroadcast('counter',`${defender.name} escapes ${attacker.finisher} at the last possible second!`,{highlight:true,weight:2.2});}
}
function storyChoice(id){if(!M||!M.waiting)return;M.waiting=false;M.decisionsMade++;const p=S.team[M.activeP],o=S.opp[M.activeO];
 if(id==='tag'){const old=p;M.activeP=1-M.activeP;const incoming=S.team[M.activeP];M.playerMom=clamp(M.playerMom+14,0,100);shiftControl(8,`${incoming.name}'s hot tag was the turning point.`);M.tags++;addMatchScore('player',6,'decision');heatCrowd(7,'player');addBroadcast('choice',`${old.name} reaches the corner—${incoming.name} makes the hot tag and takes over!`,{highlight:true,weight:2});}
 else if(id==='finisher'){M.finishers++;const chance=.52+(p.technique+p.charisma-o.resilience)/520+(M.playerControl-50)/180;M.playerMom=clamp(M.playerMom-45,0,100);if(Math.random()<chance){setSpotlight(p,'THE GAMBLE PAYS OFF!');addMatchScore('player',15);addMatchScore('player',8,'decision');heatCrowd(14,'player');shiftControl(15,`${p.name} hit ${p.finisher}.`);addBroadcast('finisher',`${p.name} hits ${p.finisher}! The entire arena rises!`,{highlight:true,weight:3.2});if(M.phaseIndex>=4&&Math.random()<.48){M.eventIndex=Math.max(M.eventIndex,M.eventTarget-1)}else createNearFall(true)}else{addMatchScore('player',-10);addMatchScore('player',-6,'decision');addMatchScore('opp',5);heatCrowd(7,'opp');shiftControl(-14,`${o.name} countered ${p.finisher}.`);addBroadcast('counter',`${o.name} counters ${p.finisher}! The gamble backfires!`,{highlight:true,weight:2.5});}}
 else if(id==='comeback'){if(Math.random()<.62){addMatchScore('player',7);addMatchScore('player',7,'decision');heatCrowd(10,'player');shiftControl(18,`${p.name} launched an unforgettable comeback.`);M.playerMom=clamp(M.playerMom+22,0,100);addBroadcast('choice',`${p.name} digs deep and launches a furious comeback!`,{highlight:true,weight:2.5})}else{addMatchScore('player',-5,'decision');addMatchScore('opp',3);shiftControl(-7,`${p.name}'s comeback attempt was stopped.`);addBroadcast('counter',`${p.name} tries to rally, but ${o.name} cuts the comeback off.`)}}
 else if(id==='risk'){if(Math.random()<.62){addMatchScore('player',9);addMatchScore('player',6,'decision');heatCrowd(12,'player');shiftControl(13,`${p.name}'s spectacular risk paid off.`);M.playerMom=clamp(M.playerMom+18,0,100);addBroadcast('choice',`${p.name} creates a breathtaking highlight and changes the match!`,{highlight:true,weight:2.4})}else{addMatchScore('player',-8);addMatchScore('player',-5,'decision');addMatchScore('opp',3);heatCrowd(5,'opp');shiftControl(-11,`${p.name}'s high-risk attempt failed.`);addBroadcast('counter',`${p.name} takes a huge risk—but crashes and burns!`,{highlight:true,weight:1.8})}}
 else if(id==='survive'){addMatchScore('player',3,'decision');shiftControl(4,`${p.name} survived the opposition's strongest stretch.`);M.playerMom=clamp(M.playerMom+8,0,100);addBroadcast('choice',`${p.name} covers up, survives the storm, and waits for an opening.`)}
 else if(id==='pressure'||id==='control'){addMatchScore('player',5,'decision');addMatchScore('player',3);shiftControl(7,`${p.name} controlled the decisive stretch.`);M.playerMom=clamp(M.playerMom+10,0,100);addBroadcast('choice',`${p.name} stays disciplined and keeps the match under control.`)}
 renderMatch();scheduleNext(1250);
}
function resolveFinish(){
 if(M.ended)return;M.phaseIndex=5;M.phaseLabel='Finish';addBroadcast('phase','FINISH');
 const crowdBonusPlayer=M.crowdPlayer*.12,crowdBonusOpp=M.crowdOpp*.12;
 M.finalPlayer=Math.round(M.startPlayer+M.performancePlayer+M.decisionPlayer+crowdBonusPlayer+rnd(-3,3));
 M.finalOpp=Math.round(M.startOpp+M.performanceOpp+M.decisionOpp+crowdBonusOpp+rnd(-3,3));
 const gap=Math.abs(M.finalPlayer-M.finalOpp);M.finishType=gap>=22?'Decisive Finish':gap>=10?'Competitive Finish':'Photo Finish';
 const win=M.finalPlayer>=M.finalOpp;const side=win?'player':'opp';const winnerTeam=win?S.team:S.opp,loserTeam=win?S.opp:S.team;
 let winner=winnerTeam[M.activeP],loser=loserTeam[M.activeO];if(!win){winner=winnerTeam[M.activeO];loser=loserTeam[M.activeP]}
 if(Math.random()<.48)winner=one(winnerTeam);if(Math.random()<.48)loser=one(loserTeam);
 M.finishers++;setSpotlight(winner,M.finishType==='Photo Finish'?'A LAST-SECOND OPENING!':'THE MATCH ENDS HERE!');
 if(M.finishType==='Photo Finish')addBroadcast('counter',`${loser.name} nearly steals it—but ${winner.name} counters at the final instant!`,{highlight:true,weight:3.4});
 addBroadcast('finisher',`${winner.name} catches ${loser.name} with ${winner.finisher}!`,{highlight:true,weight:4});addBroadcast('pin','ONE... TWO... THREE!');addBroadcast('result',`${winnerTeam.map(x=>x.name).join(' & ')} win by ${M.finishType.toLowerCase()}!`);
 M.ended=true;M.winner=winner;M.loser=loser;M.mvp=selectMVP(winnerTeam,winner);if(win)S.streak++;
 renderMatch();storyTimer=setTimeout(()=>showSummary(win),1500);
}
function selectMVP(team,finisherWinner){const sorted=[...team].sort((a,b)=>(b.overall+b.charisma+b.technique)-(a.overall+a.charisma+a.technique));return Math.random()<.65?finisherWinner:sorted[0]}
function showSummary(win){
 clearStoryTimer();const length=formatTime(M.matchSeconds),rating=clamp(2.15+M.highlights.length*.16+M.nearFalls*.28+M.finishers*.2+M.tags*.08+M.eventTarget*.055,1,5),rounded=Math.round(rating),stars='★'.repeat(rounded)+'☆'.repeat(5-rounded);
 const highlights=[...M.highlights].slice(-5);const story=buildSummaryStory();M.lossMessage=`${M.winner.name} wins after a ${rating.toFixed(1)}-star match.`;
 const playerCrowd=Math.round(M.crowdPlayer*.12),oppCrowd=Math.round(M.crowdOpp*.12);
 render(`<section class="panel match-result summary-panel"><div class="actions top-actions">${win?`<button class="btn" onclick="postMatchFlow()">${S.specialSingles?'RETURN TO GAUNTLET':'CONTINUE BROADCAST'}</button>`:`<button class="btn" onclick="handleLoss()">CONTINUE</button>`}</div><h1 class="title" style="color:${win?'#65e98a':'#ff6b6b'}">${win?'You Win!':'You Lose'}</h1><div class="rating"><span>${stars}</span><strong>${rating.toFixed(1)} MATCH RATING · ${length} · ${M.finishType.toUpperCase()}</strong></div><div class="match-breakdown"><h3>Match Score Breakdown</h3><div class="breakdown-head"><strong>${S.team.map(x=>x.name).join(' & ')}</strong><b>${M.finalPlayer} – ${M.finalOpp}</b><strong>${S.opp.map(x=>x.name).join(' & ')}</strong></div><div class="breakdown-row"><span>Starting Score</span><b>${M.startPlayer}</b><i>${M.startOpp}</i></div><div class="breakdown-row"><span>Performance</span><b>${Math.round(M.performancePlayer)}</b><i>${Math.round(M.performanceOpp)}</i></div><div class="breakdown-row"><span>Crowd Bonus</span><b>${playerCrowd}</b><i>${oppCrowd}</i></div><div class="breakdown-row"><span>Decision Bonus</span><b>${Math.round(M.decisionPlayer)}</b><i>${Math.round(M.decisionOpp)}</i></div></div><div class="summary-grid"><article><small>MATCH STORY</small><p>${story}</p></article><article><small>MATCH MVP</small><h2>${M.mvp.name}</h2><p>${mvpReason(M.mvp)}</p></article><article><small>TURNING POINT</small><p>${M.turningPoint||'The match remained balanced until the final exchange.'}</p></article><article><small>BEST MOMENT</small><p>${M.bestMoment||`${M.winner.name} delivered ${M.winner.finisher} to end the match.`}</p></article></div><div class="highlight-reel"><h3>Broadcast Highlights</h3>${highlights.map(x=>`<p>${x}</p>`).join('')}</div></section>`)
}

function postMatchFlow(){
 if(S.specialSingles){restoreTagTeams();return rewards();}
 const shouldChallenge=!S.challengeSeen||Math.random()<.35;
 if(shouldChallenge)return showSinglesChallenge();
 rewards();
}
function showSinglesChallenge(){
 S.challengeSeen=true;
 const challenger=one(S.opp);
 S.pendingChallenger=challenger;
 overlay.innerHTML=`<div class="overlay challenge-overlay"><section class="challenge-splash"><div class="tv-kicker">BROADCAST INTERRUPT</div><h1>Singles Challenge</h1><p class="challenge-copy"><strong>${challenger.name}</strong> has challenged your team to settle this one-on-one.</p><div class="challenge-versus"><div class="challenge-card">${card(challenger,'',true)}<span>CHALLENGER</span></div><div class="challenge-vs">VS</div><div class="representative-picker"><small>CHOOSE YOUR REPRESENTATIVE</small><div class="representative-grid">${S.team.map((w,i)=>`<button class="representative-option" onclick="acceptSinglesChallenge(${i})">${card(w,'',true)}<b>${w.name}</b></button>`).join('')}</div></div></div><div class="challenge-actions"><button class="btn secondary" onclick="declineSinglesChallenge()">DECLINE</button></div></section></div>`;
}
function acceptSinglesChallenge(index){
 const chosen=S.team[index],challenger=S.pendingChallenger;
 S.tagBackup={team:[...S.team],opp:[...S.opp]};
 S.team=[chosen];S.opp=[challenger];S.specialSingles=true;S.pendingChallenger=null;overlay.innerHTML='';
 render(`<section class="panel singles-intro"><div class="actions top-actions"><button class="btn" onclick="match()">BEGIN SINGLES MATCH</button></div><small>FEATURED SINGLES MATCH</small><h1>${chosen.name}</h1><div class="singles-vs">VS</div><h1>${challenger.name}</h1><p>${challenger.title} issued the challenge. ${chosen.title} accepted it.</p></section>`);
}
function declineSinglesChallenge(){overlay.innerHTML='';S.pendingChallenger=null;rewards();}
function restoreTagTeams(){if(S.tagBackup){S.team=S.tagBackup.team;S.opp=S.tagBackup.opp}S.tagBackup=null;S.specialSingles=false;}
function mvpReason(w){const moments=M.personalityMoments[w.id]||0;const reasons=[];if(w.id===M.winner.id)reasons.push(`sealed the victory with ${w.finisher}`);if(moments)reasons.push(`delivered ${moments} signature personality moment${moments===1?'':'s'}`);if(M.nearFalls>1)reasons.push('survived a match filled with near falls');if(M.tags>2)reasons.push('made a major impact in the tag exchanges');return reasons.length?reasons.slice(0,2).join(' and ')+'.':`${w.title} controlled the defining stretch of the match.`}
function buildSummaryStory(){const winnerSide=M.winner&&S.team.some(x=>x.id===M.winner.id)?'Your team':'The opposition';const opener=M.storyKey==='comeback'?'The match became an underdog survival story':M.storyKey==='war'?'Both teams traded control in a relentless war':M.storyKey==='sprint'?'The contest exploded into a frantic sprint':M.storyKey==='domination'?'One team seized control early and refused to release it':M.storyKey==='tagClinic'?'Quick tags and team combinations defined the match':M.storyKey==='upset'?'The favourites were dragged into a dangerous upset attempt':'Both teams built the contest carefully through every phase';return `${opener}. ${M.turningPoint||'The decisive momentum swing came late'}. ${winnerSide} closed the story when ${M.winner.name} landed ${M.winner.finisher}.`}
function formatTime(total){const m=Math.floor(total/60),s=String(total%60).padStart(2,'0');return `${m}:${s}`}
function handleLoss(){if(S.specialSingles)restoreTagTeams();lose(M.lossMessage)}
function rewards(){let r=[['wrestler','New Wrestler'],['chem','Chemistry Boost'],['momentum','Momentum Boost']];if(!S.windAwarded)r.push(['wind','Second Wind']);render(`<section class="panel"><h1 class="title">Choose Reward</h1><div class="rewards">${r.map(x=>`<article class="reward" onclick="reward('${x[0]}')"><h3>${x[1]}</h3></article>`).join('')}</div></section>`)}
function reward(t){if(t==='wrestler'){let ids=new Set(S.team.map(x=>x.id));S.offer=one(WRESTLERS.filter(x=>!ids.has(x.id)));render(`<section class="panel"><div class="actions top-actions"><button class="btn" onclick="team()">KEEP TEAM</button><button class="btn" onclick="replace(0)">REPLACE ${S.team[0].name}</button><button class="btn" onclick="replace(1)">REPLACE ${S.team[1].name}</button></div><h1 class="title">New Wrestler</h1><div style="max-width:340px;margin:auto">${card(S.offer)}</div></section>`)}else if(t==='chem'){S.chem+=5;team()}else if(t==='momentum'){S.momentum+=2;team()}else{S.wind=true;S.windAwarded=true;team()}}
function replace(i){S.team[i]=S.offer;discover(()=>team())}
function lose(msg){clearStoryTimer();if(S.wind){render(`<section class="panel home"><div class="actions top-actions"><button class="btn" onclick="useWind()">CONTINUE RUN</button></div><h1>SECOND WIND</h1><p>${msg}</p></section>`)}else render(`<section class="panel home"><div class="actions top-actions"><button class="btn" onclick="home()">PLAY AGAIN</button></div><h1>GAUNTLET OVER</h1><p>${msg}</p><h2>FINAL STREAK: ${S.streak}</h2></section>`)}
function useWind(){S.wind=false;rewards()}
home();
