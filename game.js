const app=document.getElementById('app'),overlay=document.getElementById('overlay');
let S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:false,quickType:null,quickPlayer:null,quickSelections:[],manager:null,nextMatchBonus:0,eventHistory:[],interviewCount:0};
let ACTIVE_GAME_MODE='home';
function setActiveGameMode(mode){ACTIVE_GAME_MODE=mode;document.body.dataset.gameMode=mode;}
let M=null,storyTimer=null;
const pick=(a,n=1)=>[...a].sort(()=>Math.random()-.5).slice(0,n);
const one=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rnd=(min,max)=>Math.random()*(max-min)+min;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VENUES=['Liberty Arena','Crown Coliseum','MetroPlex Pavilion','Titan Dome','Victory Gardens Arena','Iron City Center','Skyline Stadium'];
const MATCH_LABELS=['MAIN EVENT','FEATURED CONTEST','GAUNTLET SHOWCASE','PRIME-TIME MATCH'];
const SUPPORT_CAST={
 'mike-sullivan':{id:'mike-sullivan',name:'Mike Sullivan',role:'Play-by-Play Commentator',group:'Broadcast Team'},
 'johnny-cannon':{id:'johnny-cannon',name:'Johnny Cannon',role:'Colour Commentator',group:'Broadcast Team'},
 'katie-morgan':{id:'katie-morgan',name:'Katie Morgan',role:'Backstage Interviewer',group:'Broadcast Team'},
 'scarlett-storm':{id:'scarlett-storm',name:'Scarlett Storm',role:'The Blonde Bombshell',group:'Managers'},
 'preston-cole':{id:'preston-cole',name:'Preston Cole',role:'The Strategist',group:'Managers'},
 'graham-archer':{id:'graham-archer',name:'Graham Archer',role:'The Mastermind',group:'Managers'},
 'tommy-sparks':{id:'tommy-sparks',name:'Tommy Sparks',role:'The Megaphone',group:'Managers'}
};
const MANAGERS=[
 {id:'scarlett-storm',name:'Scarlett Storm',title:'The Blonde Bombshell',initials:'SS',passive:2,ability:'Championship Confidence',description:'Adds +2 to your team score and strengthens positive interview outcomes.',voice:'You have earned this moment. Now finish the job.'},
 {id:'preston-cole',name:'Preston Cole',title:'The Strategist',initials:'PC',passive:3,ability:'Ringside Game Plan',description:'Adds +3 through scouting, match psychology and precise ringside direction.',voice:'I know exactly how they can be beaten.'},
 {id:'graham-archer',name:'Graham Archer',title:'The Mastermind',initials:'GA',passive:3,ability:'Psychological Edge',description:'Adds +3 to your team score through scouting and perfectly timed distractions.',voice:'Leave the distractions to me.'},
 {id:'tommy-sparks',name:'Tommy Sparks',title:'The Megaphone',initials:'TS',passive:2,ability:'Crowd Ignition',description:'Adds +2 to your team score by building momentum and crowd energy.',voice:'COME ON! SHOW THEM WHAT YOU HAVE GOT!'}
];
function npc(id){return SUPPORT_CAST[id]||MANAGERS.find(m=>m.id===id)}
function npcImage(id,type='full',extra=''){const c=CHARACTER_IMAGE_MANAGER[id],src=c?.assets?.[type]||c?.assets?.full||`assets/wrestlers/${id}/${type}.webp`;return `<img class="npc-art npc-${id} ${extra}" src="${src}" alt="${npc(id)?.name||id}" onerror="this.style.display='none'">`}
function lowerThird(person,subtitle=''){return `<div class="character-lower-third"><small>${subtitle||person.role||person.title||''}</small><b>${person.name}</b></div>`}
function managerCard(m,action=''){return `<button class="manager-card illustrated" ${action?`onclick="${action}"`:''}><div class="manager-card-art">${npcImage(m.id,'full')}</div>${lowerThird(m,m.title)}<div class="manager-card-copy"><b>${m.ability}</b><p>${m.description}</p></div></button>`}

function managerBonus(){return S.manager?.passive||0}
function managerStrip(){return S.manager?`<div class="active-manager">${npcImage(S.manager.id,'portrait')}<div><small>AT RINGSIDE</small><b>${S.manager.name}</b><em>${S.manager.ability}</em><q>${S.manager.voice}</q></div></div>`:''}

const STATS_KEY='ttg_stats_3_7_2';
function defaultStats(){return {version:1,total:0,wins:0,losses:0,singles:{matches:0,wins:0,losses:0},tag:{matches:0,wins:0,losses:0},currentStreak:0,bestWinStreak:0,bestGauntlet:0,wrestlers:{},teams:{},highestRated:null,lastMatch:null}}
function loadStats(){try{const saved=JSON.parse(localStorage.getItem(STATS_KEY)||'null');return saved&&saved.version===1?Object.assign(defaultStats(),saved):defaultStats()}catch(e){return defaultStats()}}
function saveStats(stats){try{localStorage.setItem(STATS_KEY,JSON.stringify(stats))}catch(e){}}
function wrestlerStats(stats,w){if(!stats.wrestlers[w.id])stats.wrestlers[w.id]={id:w.id,name:w.name,matches:0,wins:0,losses:0,singles:0,tag:0};return stats.wrestlers[w.id]}
function teamKey(team){return [...team].map(w=>w.id).sort().join('__')}
function teamStats(stats,team){const key=teamKey(team);if(!stats.teams[key])stats.teams[key]={key,name:teamName(team),members:team.map(w=>w.id),matches:0,wins:0,losses:0};return stats.teams[key]}
function recordCompletedMatch(win,rating){if(!M||M.statsRecorded)return;M.statsRecorded=true;const stats=loadStats(),singles=isSinglesMatch(),mode=singles?'singles':'tag';stats.total++;win?stats.wins++:stats.losses++;stats[mode].matches++;win?stats[mode].wins++:stats[mode].losses++;stats.currentStreak=win?stats.currentStreak+1:0;stats.bestWinStreak=Math.max(stats.bestWinStreak,stats.currentStreak);if(!S.exhibition)stats.bestGauntlet=Math.max(stats.bestGauntlet,S.streak);
 [...S.team,...S.opp].forEach(w=>{const ws=wrestlerStats(stats,w);ws.matches++;ws[mode]++});S.team.forEach(w=>{const ws=wrestlerStats(stats,w);win?ws.wins++:ws.losses++});S.opp.forEach(w=>{const ws=wrestlerStats(stats,w);win?ws.losses++:ws.wins++});
 if(!singles){const playerTeam=teamStats(stats,S.team),oppTeam=teamStats(stats,S.opp);playerTeam.matches++;oppTeam.matches++;if(win){playerTeam.wins++;oppTeam.losses++}else{playerTeam.losses++;oppTeam.wins++}}
 const matchRecord={rating:Number(rating.toFixed(1)),type:singles?'Singles':'Tag Team',mode:S.exhibition?'Exhibition':'Tag Team Gauntlet',winner:teamName(win?S.team:S.opp),date:new Date().toISOString()};stats.lastMatch=matchRecord;if(!stats.highestRated||matchRecord.rating>stats.highestRated.rating)stats.highestRated=matchRecord;saveStats(stats)}
function pct(w,m){return m?Math.round(w/m*100):0}

const BROADCAST_COMMENTARY={
 openingSingles:['The atmosphere changes the instant the bell rings.','Both wrestlers know one mistake could decide this contest.','There is no partner to save either competitor tonight.','The crowd settles in for a true one-on-one test.'],
 openingTag:['Four wrestlers, two corners, and one chance to make a statement.','The opening teams are studying every possible tag lane.','Chemistry could matter as much as power in this contest.','The crowd is already calling for the first explosive tag.'],
 phase:{
  control:['The pace is settling, and one side is beginning to dictate the match.','This is where discipline starts to separate the competitors.','The opening exchanges are over; control now matters.'],
  shift:['Momentum is changing hands in a hurry.','The entire match has turned on one sharp exchange.','The crowd senses that the balance is beginning to move.'],
  crisis:['This is now a survival test.','Every mistake carries twice the danger at this stage.','The match has reached the point where instinct takes over.'],
  climax:['The arena is on its feet for the finishing stretch.','One decisive move could end this at any second.','Neither side can afford to hesitate now.'],
  finish:['The final opening is here.','Everything comes down to this last exchange.']
 },
 close:['Nobody has been able to create real separation.','This remains balanced enough to turn on a single counter.','The next major mistake may be the last one.'],
 dominant:['The advantage is becoming impossible to ignore.','One side is imposing its style with authority.','This is turning into a commanding performance.'],
 hotCrowd:['Listen to this crowd—the building is completely alive!','The noise is rising with every exchange!','The audience knows it is watching something special.']
};
function phaseCommentary(phaseId){const pool=BROADCAST_COMMENTARY.phase[phaseId]||[];return pool.length?one(pool):''}
function broadcastPulse(){
 if(M.crowd>=72&&Math.random()<.45)return one(BROADCAST_COMMENTARY.hotCrowd);
 if(Math.abs(M.playerControl-50)<=9&&Math.random()<.32)return one(BROADCAST_COMMENTARY.close);
 if(Math.abs(M.playerControl-50)>=27&&Math.random()<.35)return one(BROADCAST_COMMENTARY.dominant);
 return '';
}
function matchRatingData(rating){
 const rounded=clamp(Math.round(rating),1,5);
 const labels=['QUICK CONTEST','SOLID BOUT','STRONG MATCH','SHOW-STEALER','INSTANT CLASSIC'];
 return {rounded,stars:'★'.repeat(rounded)+'☆'.repeat(5-rounded),label:labels[rounded-1]};
}
function crowdReaction(){
 if(M.crowd>=85)return 'STANDING OVATION';
 if(M.crowd>=68)return 'ELECTRIC';
 if(M.crowd>=50)return 'LOUD APPROVAL';
 if(M.finishType==='Photo Finish')return 'SHOCKED SILENCE';
 return 'RESPECTFUL APPLAUSE';
}
function finishHeadline(){
 if(M.finishType==='Photo Finish')return 'A LAST-SECOND ESCAPE';
 if(M.finishType==='Decisive Finish')return 'A COMMANDING STATEMENT';
 if(M.storyKey==='upset')return 'THE UPSET IS COMPLETE';
 return 'A HARD-FOUGHT VICTORY';
}
function currentVenue(){if(!S.venue)S.venue=one(VENUES);return S.venue}
function attendance(){if(!S.attendance)S.attendance=Math.floor(rnd(11800,19800));return S.attendance.toLocaleString()}
function teamName(team){return team.length>1?(rel(...team)?.teamName||team.map(x=>x.name).join(' & ')):team[0].name}
function isSinglesMatch(){return S.team.length===1&&S.opp.length===1}
function isTagMatch(){return S.team.length===2&&S.opp.length===2}
// CHARACTER IMAGE MANAGER 2.0 — configuration is loaded from assets/config/imageManager.js
const CHARACTER_IMAGE_MANAGER=window.TTG_IMAGE_MANAGER||{};
function characterImageConfig(w){const id=typeof w==='string'?w:w?.id;return id?CHARACTER_IMAGE_MANAGER[id]||null:null}
function legacyWrestlerImage(w){return `assets/${w.id}.webp`}
function wrestlerImageCandidates(w,type='full'){
 const config=characterImageConfig(w),set=config?.assets;
 const list=[];
 if(set)list.push(set[type]||set.full);
 list.push(`assets/${w.id}.webp`,`assets/${w.id}.webp`,`assets/wrestlers/${w.id}.webp`,`assets/wrestlers/${w.id}.webp`);
 return [...new Set(list.filter(Boolean))];
}
function wrestlerImage(w,type='full'){return wrestlerImageCandidates(w,type)[0]}
function advanceImageFallback(img){
 const candidates=(img.dataset.sources||'').split('|').filter(Boolean);
 const next=Number(img.dataset.sourceIndex||0)+1;
 if(next<candidates.length){img.dataset.sourceIndex=String(next);img.src=candidates[next];return;}
 img.style.display='none';img.parentElement?.classList.add('missing-art');
}
function imageTransform(config,type='full',screen='default'){
 const screens=config?.screens||{};
 if(screens[screen])return screens[screen];
 const map=config?.transforms||{};
 // Never let an unspecified screen inherit an enlarged full-art transform.
 // Unknown contexts use a neutral contained transform instead.
 if(screen==='default')return {scale:1,x:0,y:0,anchor:type==='full'?'feet':'centre'};
 return map[type]||map.full||config?.transform||{scale:1,x:0,y:0,anchor:'feet'};
}
function imageWithFallback(w,type,extraClass='',screen='default'){
 const resolvedScreen=screen==='default'?(type==='portrait'?'matchPortrait':type==='victory'?'victory':'card'):screen;
 const sources=wrestlerImageCandidates(w,type),config=characterImageConfig(w),t=imageTransform(config,type,resolvedScreen);
 const custom=config?' framework-custom':'';
 const anchor=t.anchor||'feet';
 const st=`--custom-scale:${t.scale??1};--custom-x:${t.x??0}px;--custom-y:${t.y??0}px;`;
 return `<img class="wrestler-art wrestler-${w.id}${custom} ${extraClass}" style="${st}" data-art-type="${type}" data-image-screen="${resolvedScreen}" data-image-anchor="${anchor}" src="${sources[0]}" data-sources="${sources.join('|')}" data-source-index="0" alt="${w.name}" onerror="advanceImageFallback(this)">`;
}
function wrestlerPng(w){return wrestlerImage(w,'full')}
function heroPortrait(w,side='',artType='auto',screenOverride=''){const resolvedType=artType==='auto'?(characterImageConfig(w)?'portrait':'full'):artType;const screen=screenOverride||(resolvedType==='victory'?'victory':'preMatch');return `<article class="hero-portrait ${side} image-framework ${characterImageConfig(w)?'has-render':'legacy-render'}">${imageWithFallback(w,resolvedType,`art-${resolvedType}`,screen)}<div><small>${w.title}</small><h3>${w.name}</h3><span>${w.finisher}</span></div></article>`}
function tvSting(label,title,subtitle=''){overlay.innerHTML=`<div class="overlay tv-sting-overlay"><section class="tv-sting"><small>${label}</small><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}<div class="tv-scan"></div></section></div>`;setTimeout(()=>{if(overlay.querySelector('.tv-sting-overlay'))overlay.innerHTML=''},850)}
function rel(a,b){return RELATIONSHIPS.find(r=>(r.a===a.id&&r.b===b.id)||(r.a===b.id&&r.b===a.id))}
function chemistry(a,b){let r=rel(a,b);return r?r.chemistry:Math.round((a.versatility+b.versatility)/2)}
function score(t){let[a,b]=t,bonus=S.momentum+(S.nextMatchBonus||0)+managerBonus();if(!b)return a.overall*.34+a.technique*.2+a.power*.14+a.speed*.12+a.charisma*.1+a.resilience*.1+bonus;let av=k=>(a[k]+b[k])/2;return av('overall')*.3+av('tag')*.25+(chemistry(a,b)+S.chem)*.2+av('technique')*.1+av('power')*.05+av('speed')*.05+av('charisma')*.05+bonus}
function imageFallback(img,name){const wrap=img.closest('.card');if(!wrap)return;img.style.display='none';wrap.classList.add('missing-art');let ph=wrap.querySelector('.art-placeholder');if(!ph){ph=document.createElement('div');ph.className='art-placeholder';ph.innerHTML=`<b>${name.split(/\s+/).map(x=>x.replace(/[^A-Za-z]/g,'')[0]||'').join('').slice(0,3)}</b><small>ADD WRESTLER ART</small>`;wrap.insertBefore(ph,wrap.firstChild)}}
function card(w,onclick='',compact=false,screen='card'){const upgraded=!!characterImageConfig(w),artType=compact&&upgraded?'portrait':'full',resolvedScreen=compact?'matchPortrait':screen;return `<article class="card character-tile${compact?' compact':''}${upgraded?' image-framework-card':' legacy-card'}" ${onclick?`onclick="${onclick}"`:''}>${imageWithFallback(w,artType,`art-${artType}`,resolvedScreen)}<div class="name">${w.name}<small>${w.title}</small></div></article>`}
function render(x){
 const isCareerScreen=ACTIVE_GAME_MODE==='career';
 document.body.classList.toggle('career-mode',isCareerScreen);
 document.body.classList.toggle('gauntlet-mode',ACTIVE_GAME_MODE==='gauntlet');
 app.classList.remove('screen-enter');
 app.innerHTML=x;
 const streakValue=document.getElementById('streak');
 if(streakValue)streakValue.textContent=S.streak;
 requestAnimationFrame(()=>app.classList.add('screen-enter'));
}
function clearStoryTimer(){if(storyTimer){clearTimeout(storyTimer);storyTimer=null}}
const FEATURE_LINES={
'jack-mercer':'Cold as ice. Tough as steel.','victor-royale':'Every kingdom needs a Kingmaker.','jett-valentine':'The spotlight always finds the Heartbreaker.','revenant':'You cannot defeat what refuses to die.','nightwatch':'When darkness falls, the Sentinel is watching.','titan':'Every match is another Hollywood blockbuster.','mason-marks':'Precision is the difference between good and excellent.','hollowman':'Some legends are better left undiscovered.','damian-black':'One opening. One strike. One Kill Shot.','elias-crowe':'Chaos is not a strategy. It is a lifestyle.','el-rey-del-cielo':'The sky has only one king.','max-justice':'When the fight is hardest, the Hero stands tallest.','primal':'There is no plan for surviving raw instinct.','lucas-bennett':'Gold is earned through flawless preparation.','marcus-king':'The streets taught him how to survive.','mateo-vega':'By the time you see the trick, the match is over.','ryder-phoenix':'Every arena becomes his stage.','sterling-sinclair':'Class, confidence and the Golden Touch.','dave-maddox':'Nobody outworks the Workhorse.','logan-steele':'Legends do not fade. They set the standard.'};
const BIOS={
'jack-mercer':'A rebellious brawler who thrives under pressure, Jack Mercer fights with equal parts toughness, instinct and defiance.','victor-royale':'A calculating ring general who treats every contest like a kingdom to be conquered.','jett-valentine':'Charisma, speed and swagger make Jett Valentine one of the most magnetic stars in the Gauntlet.','revenant':'A silent supernatural force who absorbs punishment and advances with unnatural calm.','nightwatch':'A patient, watchful enforcer who waits for the exact moment to deliver Midnight Mass.','titan':'A blockbuster personality with main-event power, Titan believes every camera belongs to him.','mason-marks':'The Canadian Icon turns technical wrestling into an exact science.','hollowman':'A masked urban legend whose relentless advance turns every arena into a horror story.','damian-black':'A silent assassin who wastes no motion and never misses an opening.','elias-crowe':'The Lunatic embraces danger, pain and disorder with a smile that unsettles everyone around him.','el-rey-del-cielo':'A heroic luchador whose speed and aerial brilliance make the impossible look effortless.','max-justice':'An inspirational hero who meets every challenge with courage and overwhelming strength.','primal':'An untamed powerhouse who grows more dangerous as the fight becomes more physical.','lucas-bennett':'The Olympian combines discipline, athleticism and championship-level precision.','marcus-king':'A battle-tested street veteran who earned his reputation through toughness and grit.','mateo-vega':'The Con Artist wins with aerial skill, misdirection and one more trick than his opponent expects.','ryder-phoenix':'A fearless Rockstar who transforms every entrance and every comeback into a headline moment.','sterling-sinclair':'The Playboy brings effortless luxury, athleticism and supreme self-confidence to every contest.','dave-maddox':'The Workhorse earns every victory through stamina, reliability and the decisive Maddox Cutter.','logan-steele':'The Living Legend carries decades of experience and the respect of an entire generation.'};
function resetClassicState(){clearStoryTimer();M=null;S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:false,quickType:null,quickPlayer:null,quickSelections:[],venue:null,attendance:null,previewCaptain:null,manager:null,nextMatchBonus:0,eventHistory:[],interviewCount:0};}
function shellBack(){return `<button class="shell-back" onclick="home()">← MAIN MENU</button>`}
function featuredSuperstar(){return one(WRESTLERS)}
function home(){
 setActiveGameMode('home');
 clearStoryTimer();M=null;overlay.innerHTML='';
 const w=featuredSuperstar();
 render(`<section class="game-hub"><div class="hub-copy"><div class="tv-kicker">WELCOME TO LPW</div><h1>TAG TEAM <span>GAUNTLET</span></h1><p>Build a team, survive the broadcast and unlock the Founding Twenty.</p><nav class="hub-menu"><button class="hub-option primary live-menu-option" onclick="gauntletLiveHome()"><b>CAREER</b><small>Begin or continue your weekly career.</small></button><button class="hub-option" onclick="classicHome()"><b>CLASSIC GAUNTLET</b><small>One loss ends the run.</small></button><button class="hub-option" onclick="quickMatchMenu()"><b>QUICK MATCH</b><small>Singles and Tag Team exhibition framework.</small></button><button class="hub-option" onclick="collection()"><b>COLLECTION</b><small>Explore the Founding Twenty.</small></button><button class="hub-option" onclick="statisticsMenu()"><b>STATISTICS</b><small>Your legacy framework.</small></button><button class="hub-option muted" onclick="optionsMenu()"><b>OPTIONS</b><small>Presentation settings coming soon.</small></button></nav></div><article class="featured-superstar"><div class="live-chip">FEATURED SUPERSTAR</div>${imageWithFallback(w,'full','art-full','homeFeature')}<div class="featured-lower-third"><small>${w.title}</small><h2>${w.name}</h2><p>${FEATURE_LINES[w.id]||w.signature}</p><button onclick="collectionProfile('${w.id}')">VIEW PROFILE</button></div></article></section>`)
}
function classicHome(){
 setActiveGameMode('gauntlet');
 resetClassicState();S.previewCaptain=one(WRESTLERS);const captain=S.previewCaptain;
 render(`<section class="panel mode-landing"><div class="actions top-actions"><button class="btn" onclick="start()">START GAUNTLET</button>${shellBack()}</div><div class="mode-landing-art">${imageWithFallback(captain,'full','art-full','classicLanding')}<div class="mode-preview-label"><small>YOUR STARTING WRESTLER</small><b>${captain.name}</b></div></div><div class="mode-landing-copy"><div class="tv-kicker">CLASSIC MODE</div><h1>SURVIVE THE GAUNTLET</h1><p>Your run begins with <strong>${captain.name}</strong>. Choose a partner and survive as long as possible. Every broadcast, decision and reward matters. Lose once and the run is over.</p></div></section>`)
}
function collection(){
 const managers=Object.values(SUPPORT_CAST).filter(x=>x.group==='Managers'),broadcast=Object.values(SUPPORT_CAST).filter(x=>x.group==='Broadcast Team');
 const supportTiles=list=>list.map(x=>`<article class="collection-tile support-tile">${npcImage(x.id,'full')}<span><small>${x.role}</small><b>${x.name}</b></span></article>`).join('');
 render(`<section class="collection-screen">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">LEGACY PRO WRESTLING PERSONNEL</div><h1>CHARACTER DATABASE</h1><p>Wrestlers, managers and the broadcast team.</p></div><strong>${WRESTLERS.length+managers.length+broadcast.length}</strong></header><h2 class="collection-section-title">WRESTLERS</h2><div class="collection-grid">${WRESTLERS.map(w=>`<button class="collection-tile" onclick="collectionProfile('${w.id}')">${imageWithFallback(w,'full','art-full','collection')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div><h2 class="collection-section-title">MANAGERS</h2><div class="collection-grid support-grid">${supportTiles(managers)}</div><h2 class="collection-section-title">BROADCAST TEAM</h2><div class="collection-grid support-grid">${supportTiles(broadcast)}</div></section>`)
}
function collectionProfile(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w)return collection();
 render(`<section class="profile-screen"><div class="profile-nav"><button class="shell-back" onclick="collection()">← COLLECTION</button><button class="profile-play" onclick="playNowFromCollection('${w.id}')">PLAY NOW · SINGLES</button></div><div class="profile-art image-framework-profile">${imageWithFallback(w,'full','art-full','profile')}</div><div class="profile-copy"><div class="profile-status">FOUNDING TWENTY · AVAILABLE</div><small>${w.title}</small><h1>${w.name}</h1><div class="profile-signature"><span>SIGNATURE MOVE</span><b>${w.signature}</b></div><p>${BIOS[w.id]||`${w.name} is a competitor in Tag Team Gauntlet.`}</p><div class="profile-facts"><div><small>STYLE</small><b>${(typeof profileFor==='function'?profileFor(w).archetype:'Wrestler')}</b></div><div><small>OVERALL</small><b>${w.overall}</b></div><div><small>RARITY</small><b>${w.rarity}</b></div></div></div></section>`)
}
function playNowFromCollection(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w)return collection();
 clearStoryTimer();M=null;overlay.innerHTML='';
 S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:true,quickType:'singles',quickPlayer:w,quickSelections:[],quickSourceProfile:id,venue:null,attendance:null};
 quickSinglesOpponentSelect();
}
function quickMatchMenu(){
 setActiveGameMode('quick');
 const w=one(WRESTLERS);
 render(`<section class="framework-screen quick-framework">${shellBack()}<div class="framework-art image-framework-profile">${imageWithFallback(w,'full','art-full','quickLanding')}</div><div class="framework-copy"><div class="tv-kicker">EXHIBITION</div><h1>QUICK MATCH</h1><p>Create a dream match using any wrestlers from the Founding Twenty.</p><div class="framework-options"><button onclick="beginQuickSingles()"><b>SINGLES MATCH</b><small>Choose one wrestler and one opponent.</small><em>›</em></button><button onclick="beginQuickTag()"><b>TAG TEAM MATCH</b><small>Choose two wrestlers and an opposing team.</small><em>›</em></button></div></div></section>`)
}
function beginQuickSingles(){
 clearStoryTimer();M=null;overlay.innerHTML='';
 S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:true,quickType:'singles',quickPlayer:null,quickSelections:[],quickSourceProfile:null,venue:null,attendance:null};
 quickSinglesPlayerSelect();
}
function quickSinglesPlayerSelect(){
 render(`<section class="panel"><div class="actions top-actions"><button class="btn secondary" onclick="quickMatchMenu()">← QUICK MATCH</button></div><div class="tv-kicker">QUICK MATCH · SINGLES</div><h1 class="title">Choose Your Wrestler</h1><p class="sub">Select the wrestler you want to control.</p><div class="collection-grid">${WRESTLERS.map(w=>`<button class="collection-tile" onclick="selectQuickPlayer('${w.id}')">${imageWithFallback(w,'full','art-full','quickMatch')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)
}
function selectQuickPlayer(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w)return quickSinglesPlayerSelect();S.quickPlayer=w;S.quickSourceProfile=null;quickSinglesOpponentSelect();
}
function quickSinglesOpponentSelect(){
 const player=S.quickPlayer;if(!player)return quickSinglesPlayerSelect();
 const opponents=WRESTLERS.filter(w=>w.id!==player.id);
 const backAction=S.quickSourceProfile?`collectionProfile('${S.quickSourceProfile}')`:'quickSinglesPlayerSelect()';
 const backLabel=S.quickSourceProfile?'PROFILE':'CHANGE WRESTLER';
 render(`<section class="panel"><div class="actions top-actions"><button class="btn secondary" onclick="${backAction}">← ${backLabel}</button></div><div class="tv-kicker">QUICK MATCH · SINGLES</div><h1 class="title">Choose Your Opponent</h1><p class="sub">${player.name} is ready. Select the opposition.</p><div class="collection-grid">${opponents.map(w=>`<button class="collection-tile" onclick="selectQuickOpponent('${w.id}')">${imageWithFallback(w,'full','art-full','quickMatch')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)
}
function selectQuickOpponent(id){
 const opponent=WRESTLERS.find(x=>x.id===id),player=S.quickPlayer;if(!player||!opponent||player.id===opponent.id)return quickSinglesOpponentSelect();
 S.team=[player];S.opp=[opponent];S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));
 render(`<section class="panel singles-intro television-card"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN SINGLES BROADCAST</button><button class="btn secondary" onclick="quickSinglesOpponentSelect()">CHANGE OPPONENT</button></div><div class="tv-kicker">QUICK MATCH · SINGLES</div><div class="cinematic-versus singles-cinematic compact-preview"><div class="hero-team hero-left">${heroPortrait(player,'left')}</div><div class="giant-vs">VS</div><div class="hero-team hero-right">${heroPortrait(opponent,'right')}</div></div><div class="event-details"><span>🏟 ${currentVenue()}</span><span>👥 ${attendance()} · SOLD OUT</span><span>EXHIBITION</span></div></section>`)
}
function quickSinglesRematch(){
 if(!S.team.length||!S.opp.length)return beginQuickSingles();M=null;clearStoryTimer();S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));selectQuickOpponent(S.opp[0].id);
}
function beginQuickTag(){
 clearStoryTimer();M=null;overlay.innerHTML='';
 S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:true,quickType:'tag',quickPlayer:null,quickSelections:[],venue:null,attendance:null};
 quickTagSelect();
}
function quickTagSelect(){
 const slots=['YOUR WRESTLER 1','YOUR WRESTLER 2','OPPONENT 1','OPPONENT 2'];
 const chosen=new Set(S.quickSelections.map(w=>w.id));
 const slot=S.quickSelections.length;
 if(slot>=4)return confirmQuickTag();
 render(`<section class="panel"><div class="actions top-actions"><button class="btn secondary" onclick="${slot?'undoQuickTagSelection()':'quickMatchMenu()'}">← ${slot?'UNDO LAST PICK':'QUICK MATCH'}</button></div><div class="tv-kicker">QUICK MATCH · TAG TEAM</div><h1 class="title">Choose ${slots[slot]}</h1><p class="sub">${slot?`${S.quickSelections.map(w=>w.name).join(' · ')} selected`:'Build your team first, then choose the opposition.'}</p><div class="collection-grid">${WRESTLERS.filter(w=>!chosen.has(w.id)).map(w=>`<button class="collection-tile" onclick="selectQuickTagWrestler('${w.id}')">${imageWithFallback(w,'full','art-full','quickMatch')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)
}
function selectQuickTagWrestler(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w||S.quickSelections.some(x=>x.id===id))return quickTagSelect();
 S.quickSelections.push(w);quickTagSelect();
}
function undoQuickTagSelection(){S.quickSelections.pop();quickTagSelect()}
function confirmQuickTag(){
 const [a,b,c,d]=S.quickSelections;if(!a||!b||!c||!d)return quickTagSelect();
 S.team=[a,b];S.opp=[c,d];S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));
 render(`<section class="panel television-card"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN TAG TEAM BROADCAST</button><button class="btn secondary" onclick="beginQuickTag()">CHANGE TEAMS</button></div><div class="tv-kicker">QUICK MATCH · TAG TEAM</div><div class="cinematic-versus compact-preview"><div class="hero-team hero-left">${S.team.map(w=>heroPortrait(w,'left')).join('')}</div><div class="giant-vs">VS</div><div class="hero-team hero-right">${S.opp.map(w=>heroPortrait(w,'right')).join('')}</div></div><div class="event-details"><span>🏟 ${currentVenue()}</span><span>👥 ${attendance()} · SOLD OUT</span><span>EXHIBITION</span></div></section>`)
}
function quickTagRematch(){
 if(!isTagMatch())return beginQuickTag();M=null;clearStoryTimer();S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));confirmQuickTag();
}
function quickRematch(){return S.quickType==='tag'?quickTagRematch():quickSinglesRematch()}
function statisticsMenu(tab='career'){
 const stats=loadStats(),record=`${stats.wins}–${stats.losses}`,winRate=pct(stats.wins,stats.total);
 const wrestlerRows=Object.values(stats.wrestlers).sort((a,b)=>b.wins-a.wins||b.matches-a.matches||a.name.localeCompare(b.name));
 const teamRows=Object.values(stats.teams).sort((a,b)=>b.wins-a.wins||b.matches-a.matches||a.name.localeCompare(b.name));
 let detail='';
 if(tab==='career')detail=`<div class="stats-detail-grid"><article><small>OVERALL WIN RATE</small><b>${winRate}%</b><span>${stats.wins} wins from ${stats.total} matches</span></article><article><small>SINGLES RECORD</small><b>${stats.singles.wins}–${stats.singles.losses}</b><span>${stats.singles.matches} matches</span></article><article><small>TAG TEAM RECORD</small><b>${stats.tag.wins}–${stats.tag.losses}</b><span>${stats.tag.matches} matches</span></article><article><small>CURRENT WIN STREAK</small><b>${stats.currentStreak}</b><span>Best overall: ${stats.bestWinStreak}</span></article></div>`;
 if(tab==='wrestlers')detail=wrestlerRows.length?`<div class="stats-table"><div class="stats-row stats-head"><span>WRESTLER</span><span>M</span><span>W</span><span>L</span><span>WIN %</span></div>${wrestlerRows.map(x=>`<div class="stats-row"><span>${x.name}</span><span>${x.matches}</span><span>${x.wins}</span><span>${x.losses}</span><span>${pct(x.wins,x.matches)}%</span></div>`).join('')}</div>`:`<p class="stats-empty">Complete a match to begin wrestler records.</p>`;
 if(tab==='teams')detail=teamRows.length?`<div class="stats-table"><div class="stats-row stats-head"><span>TEAM</span><span>M</span><span>W</span><span>L</span><span>WIN %</span></div>${teamRows.map(x=>`<div class="stats-row"><span>${x.name}</span><span>${x.matches}</span><span>${x.wins}</span><span>${x.losses}</span><span>${pct(x.wins,x.matches)}%</span></div>`).join('')}</div>`:`<p class="stats-empty">Complete a Tag Team match to begin team records.</p>`;
 if(tab==='records')detail=`<div class="stats-detail-grid"><article><small>BEST GAUNTLET RUN</small><b>${stats.bestGauntlet}</b><span>Longest Classic streak</span></article><article><small>BEST WIN STREAK</small><b>${stats.bestWinStreak}</b><span>Across all modes</span></article><article><small>HIGHEST RATED MATCH</small><b>${stats.highestRated?stats.highestRated.rating.toFixed(1):'—'}</b><span>${stats.highestRated?`${stats.highestRated.type} · ${stats.highestRated.winner}`:'No completed matches'}</span></article><article><small>LAST RESULT</small><b>${stats.lastMatch?stats.lastMatch.winner:'—'}</b><span>${stats.lastMatch?`${stats.lastMatch.mode} · ${stats.lastMatch.rating.toFixed(1)} stars`:'No completed matches'}</span></article></div>`;
 render(`<section class="stats-framework">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">YOUR LEGACY</div><h1>STATISTICS</h1><p>Persistent records from Tag Team Gauntlet and Quick Match.</p></div></header><div class="stat-cards"><article><small>CAREER</small><b>${stats.total}</b><span>Total Matches</span></article><article><small>RECORD</small><b>${record}</b><span>Wins & Losses</span></article><article><small>BEST RUN</small><b>${stats.bestGauntlet}</b><span>Longest Gauntlet Streak</span></article><article><small>COLLECTION</small><b>${WRESTLERS.length}</b><span>Founding Twenty Profiles</span></article></div><div class="stats-tabs"><button class="${tab==='career'?'active':''}" onclick="statisticsMenu('career')">CAREER</button><button class="${tab==='wrestlers'?'active':''}" onclick="statisticsMenu('wrestlers')">WRESTLERS</button><button class="${tab==='teams'?'active':''}" onclick="statisticsMenu('teams')">TEAMS</button><button class="${tab==='records'?'active':''}" onclick="statisticsMenu('records')">RECORDS</button></div><div class="stats-detail">${detail}</div></section>`)
}
function optionsMenu(){
 render(`<section class="panel mode-landing">${shellBack()}<div class="mode-landing-copy"><div class="tv-kicker">COMING SOON</div><h1>OPTIONS</h1><p>Broadcast speed, animation, audio and accessibility controls will live here.</p></div></section>`)
}
function start(){let captain=S.previewCaptain||one(WRESTLERS);S.previewCaptain=null;S.team=[captain];window.opts=pick(WRESTLERS.filter(w=>w.id!==captain.id),2);render(`<section class="panel"><h1 class="title">Choose Your Partner</h1><p class="sub">Your first wrestler is ${captain.name}. Choose one partner to begin the Gauntlet.</p><div class="cards two">${opts.map((w,i)=>card(w,`partner(${i})`,false,'partner')).join('')}</div></section>`)}
function partner(i){S.team.push(opts[i]);discover(()=>team())}
function discover(next){let r=S.team.length>1?rel(...S.team):null;if(r&&r.type==='legendary'){overlay.innerHTML=`<div class="overlay unlock-overlay"><div class="discover unlock-discover"><div class="actions top-actions"><button class="btn" id="continue">CONTINUE</button></div><div class="tv-kicker">FOUNDING TWENTY</div><p>LEGENDARY TEAM DISCOVERED</p><div class="pair unlock-pair">${card(S.team[0])}${card(S.team[1])}</div><h1>${r.teamName}</h1></div></div>`;document.getElementById('continue').onclick=()=>{overlay.innerHTML='';next()}}else next()}
function team(){clearStoryTimer();render(`<section class="panel compact-team-confirm"><h1 class="title">Your Team</h1><p class="sub">${S.team.map(x=>x.name).join(' & ')}</p>${managerStrip()}${S.nextMatchBonus?`<div class="next-match-boost">NEXT MATCH BONUS <b>+${S.nextMatchBonus}</b></div>`:''}<div class="cards two">${S.team.map(x=>card(x)).join('')}</div><div class="auto-transition-note">Preparing the next broadcast…</div></section>`);storyTimer=setTimeout(()=>opponent(),2200)}
function opponent(){
 let ids=new Set(S.team.map(x=>x.id)),eligible=WRESTLERS.filter(x=>!ids.has(x.id));S.opp=pick(eligible,2);S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));
 render(`<section class="panel television-card atmosphere-card compact-challengers"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN BROADCAST</button></div><div class="tv-kicker">MAIN EVENT</div><h1 class="match-card-title">TONIGHT'S CHALLENGERS</h1><div class="cinematic-versus"><div class="hero-team hero-left">${S.team.map(w=>heroPortrait(w,'left')).join('')}</div><div class="giant-vs">VS</div><div class="hero-team hero-right">${S.opp.map(w=>heroPortrait(w,'right')).join('')}</div></div>${commentaryDesk()}<div class="broadcast-desk-preview"><p>${commentatorLine(COMMENTATORS.play,preMatchStatLine())}</p><p>${commentatorLine(COMMENTATORS.colour,'Four wrestlers are ready. There is nowhere to hide once the bell rings.')}</p></div><div class="event-details"><span>🏟 ${currentVenue()}</span><span>👥 ${attendance()} · SOLD OUT</span><span>🔥 STREAK ${S.streak}</span></div></section>`)
}
function walkout(){if(S.team.length<2)return null;let[a,b]=S.team,c=chemistry(a,b),risk=((100-(a.loyalty+b.loyalty)/2)*.0007)+Math.max(0,75-c)*.0008;if(rel(a,b)?.type==='rivalry')risk+=.018;if(rel(a,b)?.type==='legendary')risk*=.08;return Math.random()<risk?(a.loyalty<b.loyalty?a:b):null}



// 3.8.0 Build 3 — Atmosphere & Personality
const SHOW_BRANDS=['GAUNTLET NIGHT','FRIDAY NIGHT GAUNTLET','SURVIVAL SHOWCASE','PRIME-TIME GAUNTLET'];
const COMMENTATORS={play:{id:'mike-sullivan',name:'Mike Sullivan',role:'PLAY-BY-PLAY'},colour:{id:'johnny-cannon',name:'Johnny Cannon',role:'COLOUR COMMENTARY'}};
const FACTION_IDENTITY={
 'Dark Dominion':['Bound by darkness. Built to end runs.','Fear follows this faction to the ring.'],
 'Guardians':['United by honour. Driven by the crowd.','Heroes stand tallest when the pressure rises.'],
 'Royal Dynasty':['Wrestling royalty has arrived.','They believe victory is their birthright.'],
 'Renegades':['No rules. No fear. No retreat.','They thrive when the fight gets ugly.'],
 'Excellence':['Precision. Discipline. Excellence.','Every movement has a purpose.'],
 'Skyborne':['The sky is not the limit—it is their territory.','Speed, flight and impossible angles.'],
 'Titans':['Raw force changes every plan.','The ring gets smaller when the Titans arrive.']
};
const ENTRANCE_LINES={
 'jack-mercer':'The arena erupts as Jack Mercer storms toward the ring, fists raised and eyes locked on the opposition.',
 'victor-royale':'Victor Royale enters at a measured pace, directing the arena as though it already belongs to him.',
 'jett-valentine':'Jett Valentine steps into the spotlight, turning the entrance ramp into his personal stage.',
 'revenant':'The lights flicker. The Revenant appears through the darkness without breaking his stare.',
 'nightwatch':'Nightwatch emerges in silence, black bat across his shoulder as the crowd grows uneasy.',
 'titan':'Titan arrives like a blockbuster premiere, finding the hard camera before he finds the ring.',
 'mason-marks':'Mason Marks walks with calm precision, studying every detail before the bell.',
 'hollowman':'The arena falls quiet as Hollowman advances slowly, the mask revealing nothing.',
 'damian-black':'Damian Black enters without theatrics, already searching for the opening that ends the match.',
 'elias-crowe':'Elias Crowe laughs his way down the aisle, delighted by the chaos waiting ahead.',
 'el-rey-del-cielo':'El Rey del Cielo races to the ring and salutes the crowd from the top rope.',
 'max-justice':'Max Justice raises a fist and the entire building rises with him.',
 'primal':'Primal stalks toward the ring like a predator entering familiar territory.',
 'lucas-bennett':'Lucas Bennett marches out with the focus of an athlete entering a gold-medal final.',
 'marcus-king':'Marcus King arrives with street-born confidence, trading words with the front row.',
 'mateo-vega':'Mateo Vega smiles at the camera, already planning the trick nobody will see coming.',
 'ryder-phoenix':'Ryder Phoenix treats the entrance like a sold-out concert and demands every eye in the building.',
 'sterling-sinclair':'Sterling Sinclair glides toward the ring with effortless arrogance, soaking in every reaction.',
 'dave-maddox':'Dave Maddox heads straight for the ring, wasting no motion and asking for no shortcuts.',
 'logan-steele':'Logan Steele cups an ear to the crowd and lets the roar carry him to ringside.'
};
const HISTORY_KEY='ttg_history_3_8_0';
function loadHistory(){try{return Object.assign({matches:0,teams:{},opponents:{},partners:{},factions:{}},JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}'))}catch(e){return {matches:0,teams:{},opponents:{},partners:{},factions:{}}}}
function saveHistory(h){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(h))}catch(e){}}
function entranceLine(w){return ENTRANCE_LINES[w.id]||`${w.name} makes the walk to the ring with complete focus.`}
function factionIdentity(team){const factions=[...new Set(team.map(w=>w.faction))];if(factions.length===1)return one(FACTION_IDENTITY[factions[0]]||['A united corner enters the arena.']);return 'Two different wrestling worlds are about to share one corner.'}
function commentatorLine(speaker,text){return `<span class="commentator-name">${speaker.name}:</span> ${text}`}
function commentaryDesk(){return `<section class="commentary-desk"><div class="desk-commentator">${npcImage('mike-sullivan','portrait')}<span><small>PLAY-BY-PLAY</small><b>MIKE SULLIVAN</b></span></div><div class="desk-centre"><i>LIVE</i><strong>COMMENTARY DESK</strong></div><div class="desk-commentator right">${npcImage('johnny-cannon','portrait')}<span><small>COLOUR COMMENTARY</small><b>JOHNNY CANNON</b></span></div></section>`}
function preMatchStatLine(){const h=loadHistory(),opp=S.opp.map(w=>h.opponents[w.id]||0),best=Math.max(0,...opp);if(best>1){const w=S.opp[opp.indexOf(best)];return `${w.name} has crossed paths with you ${best} times before.`}if(S.streak>=5)return `Your team enters with a ${S.streak}-match Gauntlet streak.`;if(S.streak===0)return 'A new run begins tonight, and the first statement matters.';return `Your team has survived ${S.streak} match${S.streak===1?'':'es'} in this run.`}
function updateAtmosphereHistory(win){if(S.exhibition||!M)return;const h=loadHistory();h.matches++;S.opp.forEach(w=>h.opponents[w.id]=(h.opponents[w.id]||0)+1);S.team.forEach(w=>h.partners[w.id]=(h.partners[w.id]||0)+1);const tk=teamKey(S.team);h.teams[tk]=(h.teams[tk]||0)+1;saveHistory(h)}
function milestoneData(){const stats=loadStats(),items=[];if(S.streak===1)items.push(['FIRST VICTORY','The Gauntlet journey is officially underway.']);if(S.streak===5)items.push(['FIVE MATCH STREAK','Momentum is becoming a legacy.']);if(S.streak===10)items.push(['DOMINATING THE GAUNTLET','Ten straight victories have changed the entire broadcast.']);if(S.streak>0&&S.streak===stats.bestGauntlet)items.push(['NEW PERSONAL BEST',`A new standard has been set at ${S.streak} victories.`]);return items.slice(0,2)}
function commentatorExchange(){const p=S.team[M.activeP],o=S.opp[M.activeO];const play=one([`${p.name} is trying to dictate the pace.`,`${o.name} is cutting off every escape route.`,`This match is changing with every exchange.`]);const colour=one([`${profileFor(p).archetype} instincts are taking over now.`,`${o.faction} never arrives without a plan.`,`The crowd can feel that one mistake will decide this.`]);return [commentatorLine(COMMENTATORS.play,play),commentatorLine(COMMENTATORS.colour,colour)]}

const PERSONALITY_PROFILES={"jack-mercer":{"archetype":"Rebel Brawler","events":["raises a fist and invites the opposition to hit harder","turns the exchange into a rough Southern brawl","fires back with heavy right hands as the crowd chants Iceman","shrugs off the shot and dares the opponent to try again","drags the fight toward the ropes and makes it ugly","stomps to the centre of the ring and refuses to back down"]},"victor-royale":{"archetype":"Royal Strategist","events":["orders the ring around him with a royal gesture","slows the pace and dictates every movement","smirks after escaping danger and points to his crown","uses the referee as a shield before reclaiming control","demands his partner follow the plan","turns a simple counter into a statement of superiority"]},"jett-valentine":{"archetype":"Heartbreaker Showman","events":["blows a kiss to the crowd and steals the spotlight","poses for the cameras before snapping back into the fight","fixes his hair after a dazzling escape","spins away from danger and points at himself","plays to the crowd instead of making the cover","turns the ropes into a stage and the match into his show"]},"revenant":{"archetype":"Supernatural Force","events":["sits straight up as the arena lights flicker","walks through the punishment without expression","raises his head slowly and the crowd falls silent","stands motionless while the opponent hesitates","surges forward as green light flashes across the arena","absorbs the strike as though pain means nothing"]},"nightwatch":{"archetype":"Dark Enforcer","events":["appears from the blind side with perfect timing","raises the black bat from ringside and fixes a cold stare on the ring","stalks the legal wrestler without wasting a step","points toward The Revenant before striking","uses the ropes to cut off every escape route","lets the face paint and silence do the intimidating"]},"titan":{"archetype":"Hollywood Megastar","events":["grins for the cameras before landing a blockbuster shot","turns the arena into his personal main event","pauses for the hard camera and then explodes forward","talks to the crowd while controlling the exchange","throws his arms wide as if accepting an award","delivers the hit and immediately checks which camera caught it"]},"mason-marks":{"archetype":"Technical Purist","events":["dissects the opponent with flawless technique","counters as though he planned the exchange three moves ago","targets a limb and refuses to lose position","transitions from hold to hold without giving space","uses perfect balance to reverse the momentum","turns the contest into a clinic in precision"]},"hollowman":{"archetype":"Urban Legend","events":["slowly rises again, refusing to stay down","stalks forward while the front row backs away","tilts the stitched mask and keeps advancing","absorbs a huge shot without changing expression","stands in the corner breathing heavily before charging","makes the entire arena feel like the woods after midnight"]},"damian-black":{"archetype":"Silent Assassin","events":["waits patiently, then strikes without warning","finds the smallest opening and exploits it","circles quietly until the perfect angle appears","cuts off the comeback with one precise blow","never changes expression as control shifts his way","turns stillness into sudden violence"]},"elias-crowe":{"archetype":"Unhinged Hardcore","events":["laughs through the pain and creates total chaos","pulls at the loose straps of the straitjacket and charges","welcomes the punishment with a crooked grin","rolls outside and turns the match into a street fight","scrapes at the canvas and crawls back toward danger","looks happiest when the match becomes impossible to control"]},"el-rey-del-cielo":{"archetype":"Lucha Aerialist","events":["springs into the air with impossible balance","turns the ropes into a launchpad","lands on his feet and points toward the sky","changes direction in mid-air and leaves everyone stunned","flies across the ring before the opponent can react","makes gravity look optional"]},"max-justice":{"archetype":"Heroic Powerhouse","events":["rallies the crowd and refuses to surrender","fights back for everyone who believes in him","checks on his partner before charging into danger","raises a fist and the arena answers","absorbs the punishment and stands for one more fight","turns courage into a powerful comeback"]},"primal":{"archetype":"Apex Beast","events":["lets out a roar and overwhelms the opposition","hunts the opponent across the ring","drops low like a predator before exploding forward","drives through the defence with raw force","paces behind the opponent and waits to strike","abandons technique and unleashes pure instinct"]},"lucas-bennett":{"archetype":"Elite Olympian","events":["shoots for a takedown with championship precision","turns the match into an elite wrestling clinic","chains two takedowns together without losing control","forces the opponent to wrestle at his pace","uses world-class conditioning to win the scramble","treats every exchange like the final of a tournament"]},"marcus-king":{"archetype":"Street Fighter","events":["fires off a rapid street-fighting combination","feeds off the crowd and finishes the exchange standing tall","slips a strike and answers with a heavy combination","turns the centre of the ring into his neighbourhood","talks through the exchange and keeps swinging","fights with rhythm, power and complete confidence"]},"mateo-vega":{"archetype":"Aerial Con Artist","events":["fakes one direction and attacks from another","distracts the referee just long enough to steal control","pretends to be hurt before springing into the air","points behind the opponent and steals the opening","turns a rope escape into a flying counter","smiles because everybody fell for the trick again"]},"ryder-phoenix":{"archetype":"Rockstar Ego","events":["grabs the microphone at ringside and mouths off mid-match","turns a basic exchange into a sold-out concert moment","plays air guitar after a successful counter","demands the spotlight before delivering a sharp strike","shouts that the crowd came to see him","misses a cover because he is busy performing"]},"sterling-sinclair":{"archetype":"Luxury Playboy","events":["checks his hair after a perfectly executed counter","wrestles with effortless, expensive-looking confidence","dusts off his shoulder and looks offended by the contact","waves dismissively before taking control","smiles as if the result has already been purchased","makes every movement look tailored and exclusive"]},"dave-maddox":{"archetype":"Veteran Workhorse","events":["finds another gear when everyone thinks he is finished","keeps grinding forward through sheer work rate","drags himself up and immediately asks for more","wins a long exchange through patience and effort","refuses the easy way out and keeps working","turns exhaustion into one more burst of offence"]},"logan-steele":{"archetype":"Living Legend","events":["cups an ear to the crowd and draws on their energy","powers back like the living legend he is","points around the arena as the noise rises","shakes off the damage and stands taller","uses veteran timing to land the perfect counter","reminds everyone why generations still believe"]}};
// Broadcast 2.1 content wave: more arena atmosphere, phase variety and faction flavour.
Object.assign(BROADCAST_COMMENTARY,{
 openingTag:[...BROADCAST_COMMENTARY.openingTag,'The legal wrestlers circle while both partners shout instructions from the apron.','The bell rings and every possible tag combination suddenly matters.','Neither corner wants to reveal its strategy first.','The opening lock-up draws an immediate roar from the crowd.'],
 openingSingles:[...BROADCAST_COMMENTARY.openingSingles,'The camera tightens as both wrestlers meet in the centre of the ring.','No shortcuts, no partner—only one wrestler can control this opening.','The first exchange feels like a test of nerve as much as skill.'],
 shift:[...BROADCAST_COMMENTARY.phase.shift,'A single counter has changed the temperature of the entire building.','The apron comes alive as both teams realise the match is turning.','That exchange may have rewritten the plan for everyone involved.','Control is moving faster than the referee can follow.'],
 hotCrowd:[...BROADCAST_COMMENTARY.hotCrowd,'The crowd rises as one—nobody is sitting now!','A chant rolls from one side of the arena to the other!','Every strike is getting a louder reaction than the last!','The building is shaking under this closing stretch!'],
 nearFall:[...(BROADCAST_COMMENTARY.nearFall||[]),'TWO AND NINE-TENTHS! The entire arena thought it was over!','The partner breaks it up at the final possible instant!','That shoulder barely escaped the canvas before three!'],
 tag:[...(BROADCAST_COMMENTARY.tag||[]),'A desperate tag changes the entire complexion of the match!','Fresh energy enters the ring and the crowd responds immediately!','Perfect timing on the tag—both partners knew exactly what was needed!']
});
const FACTION_BROADCAST={
 'Dark Dominion':['The lights seem dimmer whenever Dark Dominion takes control.','There is something deeply unsettling about the patience in that corner.','Dark Dominion is turning this match into a nightmare.'],
 'Guardians':['The Guardians corner is rallying the entire arena.','That is the kind of courage the Guardians build their name on.','The crowd believes because the Guardians refuse to stop fighting.'],
 'Royal Dynasty':['Royal Dynasty is treating the ring like inherited property.','The arrogance from that corner is matched only by its precision.','Royal Dynasty believes victory is its birthright.'],
 'Renegades':['The Renegades are happiest when the rulebook starts falling apart.','This has become exactly the kind of fight the Renegades wanted.','The Renegades are dragging the broadcast into dangerous territory.'],
 'Excellence':['Excellence is stripping every wasted movement out of this match.','That corner is turning wrestling fundamentals into a weapon.','Excellence is making every counter look premeditated.'],
 'Skyborne':['Skyborne is forcing everyone in the building to look upward.','The speed from that corner is changing every possible angle.','Skyborne has turned the ropes into open airspace.'],
 'Titans':['The Titans are making the ring feel much smaller.','Raw force is beginning to overwhelm every defensive plan.','The Titans corner is imposing its will on the entire match.']
};
function factionBroadcast(w){const lines=FACTION_BROADCAST[w&&w.faction];return lines&&lines.length?one(lines):''}
const WRESTLER_DECISIONS={"jack-mercer":[["Throw the First Punch","Invite the Brawl","Cold-Stare the Challenger","Take the Centre","Make It a Bar Fight"],["Ice-Cold Pressure","Hammer the Body","Drag It to the Ropes","Trade Heavy Hands","Refuse to Back Down"],["Fight Through the Freeze","Dare Him to Hit Harder","Southern Grit","Brawl Back to Life","Plant Both Boots"],["Call for Ice Breaker","End It with a Right Hand","Freeze the Comeback","Settle This Like a Brawler","One Last Bar-Room Swing"]],"victor-royale":[["Issue a Royal Decree","Command the Opening","Make Him Bow","Dictate the Pace","Claim the Centre"],["Rule the Ring","Execute the Royal Plan","Use the Referee","Slow the Peasant Down","Protect the Crown"],["Restore the Kingdom","Escape with Royal Timing","Order a Counterattack","Never Show Panic","Reclaim the Throne"],["Call for Royal Decree","Crown the Challenger","Finish by Royal Order","Seal the Kingdom","Demand the Final Bow"]],"jett-valentine":[["Steal the Spotlight","Blow a Kiss","Pose Before Contact","Dance Out of Danger","Make the Cameras Watch"],["Heartbreaker Sequence","Turn the Ropes into a Stage","Dazzle the Front Row","Showboat and Strike","Keep the Spotlight"],["Find the Camera","Break Their Heart","Spin Back into Control","Feed Off the Attention","Refuse to Leave the Stage"],["Call for Heartbreaker","End on the Hard Camera","Take the Final Bow","Steal the Finish","Make It Picture Perfect"]],"revenant":[["Walk Through the First Shot","Rise from the Darkness","Stand Motionless","Let the Lights Flicker","Invite the Fear"],["Absorb the Punishment","Stalk Without Emotion","Turn Pain into Power","Darken the Arena","Refuse to Stay Down"],["Sit Straight Up","Return from the Dead","Silence the Crowd","Walk Through the Storm","Rise Again"],["Call for Final Reckoning","End It in Darkness","Claim Another Soul","Make the Lights Go Out","Deliver the Last Omen"]],"nightwatch":[["Strike from the Blind Side","Control the Shadows","Cut Off Every Exit","Raise the Black Bat","Wait in Silence"],["Enforce the Darkness","Trap Him by the Ropes","Stalk the Legal Man","Use Perfect Timing","Protect the Sentinel"],["Disappear and Return","Counter from the Shadows","Stand Guard","Turn Silence into Violence","Find the Blind Side"],["Call for Midnight Verdict","Deliver the Final Warning","End the Watch","Strike at Midnight","Close Every Escape"]],"titan":[["Find the Hard Camera","Make a Blockbuster Entrance","Own the Main Event","Pose Before the Hit","Start the Show"],["Direct the Action","Hit the Blockbuster Beat","Work the Camera Angle","Turn It into a Spectacle","Steal the Scene"],["Rewrite the Ending","Find Another Take","Play to the Balcony","Make the Comeback Cinematic","Refuse a Bad Ending"],["Call for Box Office Bomb","Deliver the Final Scene","Win the Main Event","Take the Closing Shot","Roll the Credits"]],"mason-marks":[["Win the First Exchange","Test the Balance","Target the Wrist","Set the Technical Pace","Force a Clean Lock-Up"],["Dissect the Arm","Chain the Holds","Control the Hips","Transition Without Space","Turn It into a Clinic"],["Find the Technical Escape","Reverse Three Moves Ahead","Rebuild the Base","Counter with Precision","Trust the Fundamentals"],["Call for Perfect Execution","Finish the Clinic","Trap the Final Hold","Execute the Winning Sequence","Leave No Technical Error"]],"hollowman":[["Stalk from the Corner","Tilt the Stitched Mask","Invite the Nightmare","Walk Through the Opening","Make the Arena Uneasy"],["Drag Him into the Woods","Absorb the Impact","Keep Advancing","Turn Fear into Control","Breathe Behind the Mask"],["Rise from the Canvas","Refuse the Last Breath","Stalk Through the Pain","Make Him Doubt Reality","Return from the Dark"],["Call for Last Breath","End the Urban Legend","Take Him into the Woods","Close the Final Chapter","Leave No Witness"]],"damian-black":[["Wait for One Opening","Circle in Silence","Measure the Distance","Strike Without Warning","Hide the Kill Shot"],["Exploit the Smallest Error","Cut Off the Angle","Stay Emotionless","Control with Precision","Make Stillness Dangerous"],["Disappear from Danger","Counter in One Motion","Reset the Target","Find the Blind Angle","Turn Defence into a Strike"],["Call for Kill Shot","End It Without Warning","Take the Perfect Angle","One Opening, One Strike","Finish in Silence"]],"elias-crowe":[["Laugh at the First Hit","Start the Chaos","Welcome the Pain","Rush the Corner","Make the Referee Nervous"],["Turn It into a Street Fight","Rip at the Straitjacket","Make Order Impossible","Fight Outside the Rules","Smile Through the Damage"],["Laugh Back to Life","Crawl Toward Danger","Beg for More","Turn Pain into Madness","Break the Match Open"],["Call for Beautiful Disaster","Finish in Total Chaos","Make the Ending Unhinged","Crash Through the Limit","Leave the Ring in Ruins"]],"el-rey-del-cielo":[["Take to the Sky","Test the Ropes","Spin Past the Lock-Up","Make Gravity Optional","Launch Before He Blinks"],["Own the Airspace","Change Direction Mid-Flight","Use the Ropes as Wings","Fly Over the Defence","Keep the Pace Impossible"],["Spring Back to Life","Escape Through the Air","Land on His Feet","Reach for the Sky","Turn the Fall into Flight"],["Call for Crown of the Sky","Finish from Above","Take the Final Flight","Rule the Air One Last Time","Drop from the Heavens"]],"max-justice":[["Stand for the Crowd","Raise the Heroic Fist","Meet Him Head On","Fight the Right Way","Protect the Centre"],["Heroic Pressure","Rally the Arena","Power Through the Defence","Keep Fighting Fair","Turn Courage into Control"],["Rise for Everyone","Launch the Hero\u2019s Return","Refuse to Surrender","Fight Through the Pain","Stand Tall Again"],["Call for Hero\u2019s End","Deliver Street Justice","Finish for the People","One Final Act of Courage","End It Like a Hero"]],"primal":[["Hunt from the Bell","Let Out the Roar","Drop into a Predator Stance","Charge on Instinct","Claim the Territory"],["Overwhelm the Prey","Abandon Technique","Use Raw Force","Pace Behind the Target","Tear Through the Defence"],["Unleash the Beast","Roar Through the Pain","Fight on Pure Instinct","Break Free of the Trap","Turn Wounds into Rage"],["Call for Apex Assault","Finish the Hunt","Devour the Final Opening","Strike Like the Apex","End It with Raw Instinct"]],"lucas-bennett":[["Shoot for the Takedown","Set an Olympic Pace","Win the Scramble","Test the Base","Wrestle for Position"],["Chain the Takedowns","Use Elite Conditioning","Force the Mat Game","Control Every Scramble","Turn It into a Final"],["Rebuild the Base","Wrestle Out of Danger","Trust the Conditioning","Reverse the Position","Win the Desperate Scramble"],["Call for Gold Standard","Finish the Tournament","Execute the Medal Sequence","Win the Final Exchange","Seal It with Elite Wrestling"]],"marcus-king":[["Throw the First Punch","Rule the Streets","Take the Block","Talk and Swing","Start a Street Fight"],["Street-King Pressure","Back Him into the Corner","Fight with Rhythm","Own the Neighbourhood","Unload the Combination"],["Fight Back from the Streets","Dig into Street Grit","Swing Until It Changes","Refuse to Be Run Off","Turn Pain into Confidence"],["Call for Street Justice","End It on His Block","Deliver the King\u2019s Verdict","Finish with the Combination","Rule the Final Exchange"]],"mateo-vega":[["Sell the Fake","Point Behind Him","Make Him Guess","Pretend to Slip","Steal the First Opening"],["Run the Con","Distract the Referee","Attack from the Other Side","Fake the Injury","Smile Through the Trick"],["Play Possum","Escape with a Lie","Make Him Chase the Wrong Target","Spring the Counter","Turn Panic into a Con"],["Call for Grand Illusion","Steal the Finish","End It with Misdirection","Pull the Final Trick","Make the Pin Disappear"]],"ryder-phoenix":[["Start the Concert","Demand the Spotlight","Play to the Front Row","Mouth Off Before Contact","Hit the Opening Riff"],["Rockstar Pressure","Play Air Guitar","Turn the Ring into a Stage","Keep the Crowd Singing","Make Every Hit a Chorus"],["Find the Encore","Rise for One More Song","Feed Off the Noise","Refuse to Leave the Stage","Turn the Boos into Fuel"],["Call for Final Encore","Drop the Last Note","End the Show Loud","Take the Closing Solo","Finish the Concert"]],"sterling-sinclair":[["Flash the Gold","Outclass the Challenger","Make Him Chase","Dust Off the Shoulder","Set an Expensive Pace"],["Apply the Golden Touch","Wrestle with Luxury","Humiliate the Opposition","Keep the Suit Clean","Make It Look Effortless"],["Protect the Investment","Escape with Class","Restore the Golden Image","Never Show Desperation","Buy Time with Style"],["Call for Golden Touch","Close the Deal","Finish with First-Class Precision","Cash In the Final Opening","Make the Ending Exclusive"]],"dave-maddox":[["Outwork Him Early","Set the Veteran Pace","Make Him Earn Everything","Start the Long Shift","Win the First Grind"],["Keep Grinding Forward","Use Veteran Timing","Turn Work Rate into Control","Refuse the Easy Way","Wear Him Down Honestly"],["Find Another Gear","Work Through the Exhaustion","Drag Himself Up","Give One More Effort","Outlast the Storm"],["Call for Final Shift","Finish the Long Night","Empty the Tank","Win with Veteran Grit","One Last Workhorse Burst"]],"logan-steele":[["Cup an Ear to the Crowd","Fire Up the Arena","Point to the People","Stand Like a Legend","Test His Strength"],["Legendary Pressure","Feed Off the Noise","Shake Off the Damage","Use Veteran Timing","Make the Arena Believe"],["Hulk Up","The Legend Won\u2019t Die","Rise with the Crowd","Stand Taller","Find the Heroic Second Wind"],["Call for Icon Slam","Finish the Story","End It Like a Legend","Give the Crowd the Moment","Deliver One More Icon Slam"]]};

const DECISION_SITUATIONS={
 opening:[['The opening belongs to instinct',n=>`${n} senses the first real opportunity.`],['The challenger rushes forward',n=>`${n} has only a heartbeat to answer.`],['A test of nerve begins',n=>`The entire arena waits to see how ${n} responds.`],['The centre of the ring is open',n=>`${n} can establish the identity of this match.`],['The opponent hesitates',n=>`${n} catches a moment of uncertainty.`],['The crowd demands a statement',n=>`${n} has a chance to define the opening exchange.`]],
 control:[['Momentum is there to be shaped',n=>`${n} has the match leaning in the right direction.`],['The pace is beginning to break',n=>`${n} can choose how to exploit the advantage.`],['A tactical opening appears',n=>`${n} has several ways to tighten control.`],['The opponent is being forced backward',n=>`${n} can turn pressure into a defining sequence.`],['The crowd senses something building',n=>`${n} has the arena ready for a signature moment.`],['The next exchange could change everything',n=>`${n} must decide what kind of match this becomes.`]],
 crisis:[['The match is slipping away',n=>`${n} needs an answer before control is lost.`],['Survival has become the only priority',n=>`${n} is being pushed toward the limit.`],['The opponent smells the finish',n=>`${n} has one chance to reverse the danger.`],['The arena waits for a response',n=>`${n} must find something personal and immediate.`],['The comeback window is closing',n=>`${n} cannot afford another empty exchange.`],['Instinct takes over',n=>`${n} has been forced beyond the original plan.`]],
 finish:[['The final opening is here',n=>`${n} can feel the match within reach.`],['One decision can end the night',n=>`${n} has the opponent vulnerable.`],['The crowd rises for the finish',n=>`${n} has reached the defining moment.`],['The winning sequence is available',n=>`${n} must choose how to close the match.`],['Everything has narrowed to this exchange',n=>`${n} can finish with identity or caution.`],['The opponent is one move from defeat',n=>`${n} has the arena holding its breath.`]]
};
const ACTION_META={
 risk:{desc:'Explosive and spectacular. Strong reward, real danger.',attrs:['speed','charisma']},
 control:{desc:'Use discipline and ring awareness to own the next exchange.',attrs:['technique','resilience']},
 pressure:{desc:'Keep building momentum without exposing the finish.',attrs:['power','technique']},
 comeback:{desc:'Turn personality and resilience into a major swing.',attrs:['charisma','resilience']},
 survive:{desc:'Absorb the danger and wait for the right counter.',attrs:['resilience','technique']},
 finisher:{desc:'Commit to the signature ending with maximum stakes.',attrs:['technique','charisma']},
 tag:{desc:'Use teamwork and fresh energy to change the match.',attrs:['tag','charisma']}
};
function decisionPhase(){if(M.phaseIndex>=4||M.playerMom>=67)return 'finish';if(M.playerControl<42)return 'crisis';return M.phaseIndex<=1?'opening':'control'}
function attributeValue(w,action){const meta=ACTION_META[action]||ACTION_META.control;return meta.attrs.reduce((s,k)=>s+(Number(w[k])||70),0)/meta.attrs.length}
function actionOrder(phase){return phase==='crisis'?['comeback','survive','risk','control','comeback']:phase==='finish'?['finisher','risk','pressure','finisher','control']:phase==='opening'?['risk','control','pressure','risk','control']:['pressure','risk','control','pressure','risk']}
function buildPersonalOptions(w,phase){const names=(WRESTLER_DECISIONS[w.id]||WRESTLER_DECISIONS['dave-maddox'])[['opening','control','crisis','finish'].indexOf(phase)]||[];const actions=actionOrder(phase);return names.map((name,i)=>({action:actions[i%actions.length],name,desc:ACTION_META[actions[i%actions.length]].desc,exclusive:true,attr:Math.round(attributeValue(w,actions[i%actions.length]))}))}
function freshOptions(pool,count=3){M.decisionSeen=M.decisionSeen||[];let fresh=pool.filter(x=>!M.decisionSeen.includes(x.name));if(fresh.length<count)fresh=pool;const chosen=pick(fresh,count);chosen.forEach(x=>M.decisionSeen.push(x.name));M.decisionSeen=M.decisionSeen.slice(-18);return chosen}
function decisionChance(w,o,action){const edge=(attributeValue(w,action)-((o.resilience+o.technique)/2))/250;const control=(M.playerControl-50)/220;const base={risk:.56,control:.74,pressure:.69,comeback:.59,survive:.78,finisher:.50,tag:.76}[action]||.65;return clamp(base+edge+control,.28,.91)}
function choiceCommentary(choice,w,o,success){const label=choice.name;if(success){const pools=[`${w.name} chooses ${label}—and it works perfectly!`,`${label} becomes the moment that changes the match for ${w.name}!`,`${w.name} makes this match unmistakably his own with ${label}!`];return one(pools)}const pools=[`${w.name} commits to ${label}, but ${o.name} has it scouted!`,`${label} nearly changes everything—until ${o.name} shuts the door.`,`${w.name} tries to impose his identity with ${label}, but the timing is wrong.`];return one(pools)}

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
function wrestlerIntro(w){return `${w.title.toUpperCase()} — ${w.name.toUpperCase()}`}
function personalityEvent(w){return one(profileFor(w).events)}
function setSpotlight(w,tagline){M.spotlight={name:w.name,title:w.title,move:w.finisher,tagline:tagline||one(['THIS COULD BE IT!','THE CROWD IS ON ITS FEET!','A DEFINING MOMENT!'])};}
function clearSpotlight(){if(M)M.spotlight=null}

function chooseStory(){
 const keys=isSinglesMatch()?['classic','war','comeback','sprint','domination','upset']:['classic','war','comeback','sprint','domination','tagClinic','upset'];
 const weights=isSinglesMatch()?[32,25,14,12,10,7]:[28,24,13,10,8,11,6];let r=Math.random()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<keys.length;i++){r-=weights[i];if(r<=0)return keys[i]}return 'classic';
}
function match(){
 tvSting(isSinglesMatch()?'FEATURED SINGLES MATCH':(S.exhibition?'TAG TEAM EXHIBITION':'TAG TEAM GAUNTLET'),isSinglesMatch()?'ONE-ON-ONE':'THE BELL IS NEXT',`${currentVenue()} · ${attendance()} fans`);
 clearStoryTimer();const isOpeningGauntlet=!S.exhibition&&S.streak===0;const q=(S.exhibition||isOpeningGauntlet)?null:walkout();if(q)return lose(`${q.name} walks away before the bell!`);
 let storyKey=chooseStory();
 if(isOpeningGauntlet&&['comeback','upset'].includes(storyKey))storyKey=one(['classic','war','tagClinic']);
 const story=STORY_TYPES[storyKey],eventTarget=Math.round(rnd(story.min,story.max));
 const teamPower=score(S.team),oppPower=score(S.opp)+S.streak*.7;
 let hiddenEdge=(teamPower-oppPower)/7+story.bias+rnd(-8,8);
 if(isOpeningGauntlet)hiddenEdge=Math.max(10,hiddenEdge+15);
 if(story.upset)hiddenEdge=teamPower>=oppPower?rnd(-10,-3):rnd(3,10);
 const startPlayer=Math.round(teamPower),startOpp=Math.round(oppPower);
 const carriedBonus=S.nextMatchBonus||0;S.nextMatchBonus=0;
 M={storyKey,story,eventTarget,eventIndex:0,phaseIndex:0,activeP:0,activeO:0,playerControl:50+hiddenEdge,playerMom:10+S.momentum*2,oppMom:12+S.streak,log:[],highlights:[],nearFalls:0,finishers:0,tags:0,decisionsMade:0,nextDecisionAt:decisionPoints(eventTarget,story.decisions),waiting:false,ended:false,latest:'',winner:null,loser:null,turningPoint:'',bestMoment:'',mvp:null,matchSeconds:Math.round(rnd(330,900)),phaseLabel:'Opening Bell',spotlight:null,personalityMoments:{},startPlayer,startOpp,performancePlayer:0,performanceOpp:0,decisionPlayer:0,decisionOpp:0,crowd:0,crowdPlayer:0,crowdOpp:0,finalPlayer:0,finalOpp:0,finishType:'',decisionSeen:[],currentDecision:null,carriedBonus};
 addBroadcast('broadcast',`${isSinglesMatch()?'YOUR WRESTLER':'YOUR TEAM'}: ${S.team.map(wrestlerIntro).join(' / ')}`); addBroadcast('broadcast',`${isSinglesMatch()?'OPPONENT':'OPPOSITION'}: ${S.opp.map(wrestlerIntro).join(' / ')}`);
 addBroadcast('phase','OPENING BELL');
 addBroadcast('commentary',commentatorLine(COMMENTATORS.play,one(isSinglesMatch()?BROADCAST_COMMENTARY.openingSingles:BROADCAST_COMMENTARY.openingTag)));
 addBroadcast('commentary',commentatorLine(COMMENTATORS.colour,one(BROADCAST_COMMENTARY.openingTag)));
 const rivalry=rivalryStatus();if(rivalry.active){addBroadcast('phase',`RIVALRY MATCH · MEETING ${rivalry.meetings+1}`);addBroadcast('commentary',commentatorLine(COMMENTATORS.play,`${rivalry.name} has become a familiar and dangerous rival. This one is personal.`));}
 if(S.manager){addBroadcast('manager',`${S.manager.name}: “${S.manager.voice}”`);addBroadcast('commentary',commentatorLine(COMMENTATORS.play,`${S.manager.name} is at ringside and could be a major factor tonight.`));}
 renderMatch();scheduleNext(900);
}
function decisionPoints(total,count){const pts=[];for(let i=1;i<=count;i++)pts.push(Math.round(total*(i/(count+1)))+Math.round(rnd(-1,1)));return [...new Set(pts)].filter(x=>x>1&&x<total-1).sort((a,b)=>a-b)}
function phaseForEvent(i,total){const p=i/total;if(p<.14)return 0;if(p<.34)return 1;if(p<.55)return 2;if(p<.72)return 3;if(p<.9)return 4;return 5}
function addBroadcast(type,text,meta={}){M.log.push({type,text,...meta});M.latest=text;if(meta.highlight){M.highlights.push(text);if(!M.bestMoment||meta.weight>=(M.bestWeight||0)){M.bestMoment=text;M.bestWeight=meta.weight||1}}}
function scheduleNext(ms=1050){clearStoryTimer();storyTimer=setTimeout(()=>advanceStory(),ms)}
function renderMatch(){
 const p=S.team[M.activeP],o=S.opp[M.activeO],control=clamp(M.playerControl,5,95);
 const pPartner=!isSinglesMatch()&&S.team.length>1?S.team[1-M.activeP]:null;
 const oPartner=!isSinglesMatch()&&S.opp.length>1?S.opp[1-M.activeO]:null;
 const portraitPanel=(w,side,partner)=>`<article class="match-stage-card ${side}">
   <div class="match-stage-art">${imageWithFallback(w,'portrait','art-portrait','matchStage')}</div>
   <div class="match-stage-name"><small>${isSinglesMatch()?(side==='player'?'YOUR WRESTLER':'OPPONENT'):'LEGAL WRESTLER'}</small><h2>${w.name}</h2><span>${w.title}</span></div>
   ${partner?`<div class="match-stage-partner"><b>PARTNER</b><span>${partner.name}</span></div>`:''}
 </article>`;
 render(`<section class="panel story-panel match-ui-v2">
 <div class="broadcast-top"><div><small>MATCH BROADCAST</small><h1>${M.phaseLabel}</h1></div><div class="story-chip">${M.story.name}</div></div><div class="broadcast-status prominent-status"><span>Moment ${Math.min(M.eventIndex+1,M.eventTarget)} of ${M.eventTarget}</span><span>${formatTime(Math.round(M.matchSeconds*(M.eventIndex/Math.max(1,M.eventTarget))))}</span></div>${managerStrip()}
 <div class="match-stage">${portraitPanel(p,'player',pPartner)}<div class="match-stage-vs">VS</div>${portraitPanel(o,'opponent',oPartner)}</div>
 <div class="control-strip match-control"><div class="team-label">${S.team.map(x=>x.name).join(' & ')}</div><div class="control-meter"><i style="width:${control}%"></i><span>CONTROL ${Math.round(control)}–${Math.round(100-control)}</span></div><div class="team-label right">${S.opp.map(x=>x.name).join(' & ')}</div></div>
 <div class="scoreboard-strip"><div><small>MATCH SCORE</small><strong>${projectedScore('player')}</strong></div><div class="crowd-meter"><span>🔥 CROWD ${Math.round(M.crowd)}%</span><i style="width:${M.crowd}%"></i></div><div class="right"><small>MATCH SCORE</small><strong>${projectedScore('opp')}</strong></div></div>
 <div class="decision-layer">${M.waiting?decisionHTML():''}</div>
 ${commentaryDesk()}<div id="broadcastFeed" class="broadcast-feed match-commentary-feed">${M.log.slice(-12).map((e,i)=>`<div class="broadcast-line ${e.type} ${i===M.log.slice(-12).length-1?'latest':''}">${e.type==='phase'?'<b>'+e.text+'</b>':e.text}</div>`).join('')}</div>
 ${M.spotlight?`<div class="signature-spotlight"><small>★ SIGNATURE MOVE ★</small><h2>${M.spotlight.move}</h2><h3>${M.spotlight.name}</h3><p>${M.spotlight.tagline}</p></div>`:''}
 ${M.waiting?'':`<div class="auto-play"><span class="live-dot"></span> MATCH IN PROGRESS</div>`}
 </section>`);
 const feed=document.getElementById('broadcastFeed');if(feed)feed.scrollTop=feed.scrollHeight
}
function decisionHTML(){const d=getDecision();M.currentDecision=d;return `<div class="story-decision"><small>${d.phase.toUpperCase()} DECISION</small><h2>${d.title}</h2><p>${d.text}</p><div class="choice-grid">${d.options.map((x,i)=>`<button class="choice" onclick="storyChoice('choice-${i}')"><b>${x.name}</b><small>${x.desc}</small></button>`).join('')}</div></div>`}
function getDecision(){
 const p=S.team[M.activeP],partner=S.team.length>1?S.team[1-M.activeP]:null,phase=decisionPhase(),situation=one(DECISION_SITUATIONS[phase]);
 let pool=buildPersonalOptions(p,phase);
 if(phase==='finish')pool.push({action:'finisher',name:`Attempt ${p.finisher}`,desc:ACTION_META.finisher.desc,exclusive:true,attr:Math.round(attributeValue(p,'finisher'))});
 if(partner&&Math.random()<.55)pool.push({action:'tag',name:phase==='crisis'?`Fight toward ${partner.name}`:`Release ${partner.name}`,desc:ACTION_META.tag.desc,exclusive:false,attr:Math.round(attributeValue(p,'tag'))});
 const options=freshOptions(pool,3).map((x,i)=>({...x,token:`choice-${i}`}));
 return {phase,title:situation[0],text:situation[1](p.name),options};
}
async function advanceStory(){
 if(!M||M.ended||M.waiting)return;
 clearSpotlight();
 M.eventIndex++;
 const newPhase=phaseForEvent(M.eventIndex,M.eventTarget);
 if(newPhase!==M.phaseIndex){M.phaseIndex=newPhase;M.phaseLabel=PHASES[newPhase].label;addBroadcast('phase',PHASES[newPhase].label.toUpperCase());const call=phaseCommentary(PHASES[newPhase].id);if(call)addBroadcast('commentary',call);}
 if(M.nextDecisionAt.includes(M.eventIndex)){M.waiting=true;renderMatch();return}
 generateAutomaticBeat();const pulse=broadcastPulse();if(pulse)addBroadcast('commentary',commentatorLine(COMMENTATORS.play,pulse));if(Math.random()<.24)commentatorExchange().forEach(x=>addBroadcast('commentary',x));renderMatch();
 if(M.eventIndex>=M.eventTarget)return resolveFinish();
 scheduleNext(M.phaseIndex>=4?1150:900);
}
function eventWrestler(teamSide){return teamSide==='player'?S.team[M.activeP]:S.opp[M.activeO]}
function shiftControl(amount,reason){const before=M.playerControl;M.playerControl=clamp(M.playerControl+amount,5,95);if(!S.exhibition&&S.streak===0)M.playerControl=Math.max(51,M.playerControl);if(Math.abs(M.playerControl-before)>=9&&!M.turningPoint)M.turningPoint=reason}
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
 const phase=PHASES[M.phaseIndex].id;const openingGauntlet=!S.exhibition&&S.streak===0;let playerActs=Math.random()<(openingGauntlet?Math.max(.72,M.playerControl/100):(M.playerControl/100)),actor=eventWrestler(playerActs?'player':'opp'),victim=eventWrestler(playerActs?'opp':'player');
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
function storyChoice(token){if(!M||!M.waiting)return;const choice=M.currentDecision?.options?.find(x=>x.token===token);if(!choice)return;M.waiting=false;M.decisionsMade++;const p=S.team[M.activeP],o=S.opp[M.activeO],id=choice.action;let chance=decisionChance(p,o,id);if(!S.exhibition&&S.streak===0)chance=Math.max(.72,chance);const success=Math.random()<chance;
 if(id==='tag'){const old=p;M.activeP=1-M.activeP;const incoming=S.team[M.activeP];if(success){M.playerMom=clamp(M.playerMom+14,0,100);shiftControl(9,`${choice.name} changed the match.`);M.tags++;addMatchScore('player',7,'decision');heatCrowd(8,'player');addBroadcast('choice',`${old.name} executes ${choice.name}—${incoming.name} enters with perfect timing!`,{highlight:true,weight:2})}else{shiftControl(-6,`${choice.name} was cut off.`);addMatchScore('player',-4,'decision');addBroadcast('counter',`${old.name} reaches for ${choice.name}, but ${o.name} cuts off the tag!`)}}
 else if(id==='finisher'){M.finishers++;M.playerMom=clamp(M.playerMom-42,0,100);if(success){setSpotlight(p,'THE PERSONAL GAMBLE PAYS OFF!');addMatchScore('player',15);addMatchScore('player',9,'decision');heatCrowd(14,'player');shiftControl(15,`${choice.name} landed.`);addBroadcast('finisher',`${choiceCommentary(choice,p,o,true)} ${p.finisher} connects!`,{highlight:true,weight:3.2});if(M.phaseIndex>=4&&Math.random()<.48)M.eventIndex=Math.max(M.eventIndex,M.eventTarget-1);else createNearFall(true)}else{addMatchScore('player',-10);addMatchScore('player',-6,'decision');addMatchScore('opp',5);heatCrowd(7,'opp');shiftControl(-14,`${choice.name} was countered.`);addBroadcast('counter',choiceCommentary(choice,p,o,false),{highlight:true,weight:2.5})}}
 else if(success){const swing={risk:13,comeback:18,survive:5,pressure:8,control:8}[id]||7,score={risk:8,comeback:8,survive:4,pressure:6,control:6}[id]||5,crowd={risk:12,comeback:11,survive:4,pressure:7,control:6}[id]||6;addMatchScore('player',score,'decision');addMatchScore('player',Math.max(2,score-3));heatCrowd(crowd,'player');shiftControl(swing,`${choice.name} became the turning point.`);M.playerMom=clamp(M.playerMom+(id==='comeback'?22:11),0,100);addBroadcast('choice',choiceCommentary(choice,p,o,true),{highlight:true,weight:id==='risk'||id==='comeback'?2.5:1.8})}
 else{addMatchScore('player',-5,'decision');addMatchScore('opp',3);heatCrowd(5,'opp');shiftControl(id==='survive'?-4:-10,`${choice.name} failed.`);addBroadcast('counter',choiceCommentary(choice,p,o,false),{highlight:true,weight:1.8})}
 M.currentDecision=null;renderMatch();scheduleNext(1250);
}
function resolveFinish(){
 if(M.ended)return;M.phaseIndex=5;M.phaseLabel='Finish';addBroadcast('phase','FINISH');
 const crowdBonusPlayer=Math.round(M.crowdPlayer*.12),crowdBonusOpp=Math.round(M.crowdOpp*.12);
 const finishVariancePlayer=Math.round(rnd(-3,3)),finishVarianceOpp=Math.round(rnd(-3,3));
 M.performancePlayer+=finishVariancePlayer;M.performanceOpp+=finishVarianceOpp;
 M.finalPlayer=Math.round(M.startPlayer+M.performancePlayer+M.decisionPlayer+crowdBonusPlayer);
 M.finalOpp=Math.round(M.startOpp+M.performanceOpp+M.decisionOpp+crowdBonusOpp);
 const openingGauntletMatch=!S.exhibition&&S.streak===0;
 const gap=Math.abs(M.finalPlayer-M.finalOpp);M.finishType=gap>=30?'Dominant Victory':gap>=16?'Decisive Finish':gap>=7?'Competitive Finish':'Photo Finish';
 const win=M.finalPlayer>=M.finalOpp;const side=win?'player':'opp';const winnerTeam=win?S.team:S.opp,loserTeam=win?S.opp:S.team;
 let winner=winnerTeam[M.activeP],loser=loserTeam[M.activeO];if(!win){winner=winnerTeam[M.activeO];loser=loserTeam[M.activeP]}
 if(Math.random()<.48)winner=one(winnerTeam);if(Math.random()<.48)loser=one(loserTeam);
 M.finishers++;setSpotlight(winner,M.finishType==='Photo Finish'?'A LAST-SECOND OPENING!':'THE MATCH ENDS HERE!');
 if(M.finishType==='Photo Finish')addBroadcast('counter',`${loser.name} nearly steals it—but ${winner.name} counters at the final instant!`,{highlight:true,weight:3.4});
 addBroadcast('finisher',`${winner.name} catches ${loser.name} with ${winner.finisher}!`,{highlight:true,weight:4});addBroadcast('pin','ONE... TWO... THREE!');addBroadcast('result',`${winnerTeam.map(x=>x.name).join(' & ')} win by ${M.finishType.toLowerCase()}!`);
 M.ended=true;M.winner=winner;M.loser=loser;M.mvp=selectMVP(winnerTeam,winner);if(win&&!S.exhibition)S.streak++;updateAtmosphereHistory(win);
 renderMatch();storyTimer=setTimeout(()=>showSummary(win),1500);
}
function selectMVP(team,finisherWinner){const sorted=[...team].sort((a,b)=>(b.overall+b.charisma+b.technique)-(a.overall+a.charisma+a.technique));return Math.random()<.65?finisherWinner:sorted[0]}
const VICTORY_CELEBRATIONS={
 'jack-mercer':'raises his fists and shares the victory with the crowd.',
 'victor-royale':'stands over the fallen opposition and demands they acknowledge the Kingmaker.',
 'jett-valentine':'blows a kiss to the hard camera and poses beneath the spotlight.',
 'revenant':'stands motionless as the arena lights flicker around him.',
 'nightwatch':'rests the black bat across his shoulders and silently surveys the ring.',
 'titan':'finds the hard camera and turns the victory into a Hollywood ending.',
 'mason-marks':'adjusts his sunglasses and calmly accepts another display of excellence.',
 'hollowman':'remains beside the fallen opponent, breathing heavily behind the mask.',
 'damian-black':'walks away without celebration—the assignment is complete.',
 'elias-crowe':'laughs wildly as the referee keeps a cautious distance.',
 'el-rey-del-cielo':'climbs the turnbuckle and salutes the crowd from above the ring.',
 'max-justice':'raises both arms and points toward the fans who carried him through.',
 'primal':'roars over the opposition and pounds his chest.',
 'lucas-bennett':'raises one finger, treating the victory like another championship final.',
 'marcus-king':'celebrates with the front row and declares the street belongs to him.',
 'mateo-vega':'grins at the referee as though the entire finish was planned from the start.',
 'ryder-phoenix':'demands a microphone and treats the victory like an encore.',
 'sterling-sinclair':'poses with effortless confidence as if victory were already purchased.',
 'dave-maddox':'leans on the ropes, exhausted but still standing after another hard-earned win.',
 'logan-steele':'cups an ear to the crowd and lets the arena celebrate with the Living Legend.'
};
function victoryCelebration(w){return VICTORY_CELEBRATIONS[w.id]||`${w.name} celebrates a defining victory.`}
function showSummary(win){
 clearStoryTimer();
 const length=formatTime(M.matchSeconds);
 const rating=clamp(1.65+M.highlights.length*.11+M.nearFalls*.20+M.finishers*.12+M.tags*.05+M.eventTarget*.045+M.crowd*.006,1,5);
 const ratingData=matchRatingData(rating),highlights=[...M.highlights].slice(-5),story=buildSummaryStory();
 recordCompletedMatch(win,rating);
 M.lossMessage=`${M.winner.name} wins after a ${rating.toFixed(1)}-star match.`;
 const playerCrowd=Math.round(M.crowdPlayer*.12),oppCrowd=Math.round(M.crowdOpp*.12);
 const winningSide=win?S.team:S.opp;
 const resultArt=winningSide.map(w=>heroPortrait(w,'winner',characterImageConfig(w)?'victory':'full','resultVictory')).join('');
 render(`<section class="panel match-result summary-panel presentation-summary">
 <div class="actions top-actions">${S.exhibition?`<button class="btn" onclick="quickRematch()">REMATCH</button><button class="btn secondary" onclick="quickMatchMenu()">QUICK MATCH MENU</button>`:(win?`<button class="btn" onclick="postMatchFlow()">${S.tournament?'ADVANCE TO NEXT ROUND':(S.specialSingles?'RETURN TO GAUNTLET':'CONTINUE BROADCAST')}</button>`:`<button class="btn" onclick="handleLoss()">CONTINUE</button>`)}</div>
 <div class="result-banner"><small>OFFICIAL RESULT</small><strong>${win?'YOU WON':'YOU LOST'}</strong></div><div class="winner-celebration television-winners result-${win?'win':'loss'}"><div class="confetti-field"></div><div class="winning-team-art ${isSinglesMatch()?'singles-winner':''}">${resultArt}</div><div class="winner-copy"><small>${isSinglesMatch()?'MATCH WINNER':'WINNING TEAM'}</small><h2>${teamName(winningSide)}</h2><p>${isSinglesMatch()?victoryCelebration(M.winner):'The winning duo stands tall after a hard-fought victory.'}</p></div></div><div class="result-broadcast-header below-winners"><small>${S.exhibition?'EXHIBITION RESULT':'GAUNTLET RESULT'} · ${isSinglesMatch()?'SINGLES':'TAG TEAM'}</small><h1>${finishHeadline()}</h1><p>${currentVenue()} · ${length}</p></div>${win&&S.manager?`<div class="manager-celebration">${npcImage(S.manager.id,'portrait')}<p><b>${S.manager.name}</b> celebrates at ringside: “${S.manager.voice}”</p></div>`:''}
 <div class="result-accolades"><article><small>MATCH RATING</small><span class="result-stars">${ratingData.stars}</span><strong>${rating.toFixed(1)} · ${ratingData.label}</strong></article><article><small>CROWD REACTION</small><b>${crowdReaction()}</b><strong>EXCITEMENT ${Math.round(M.crowd)}%</strong></article><article><small>FINISH</small><b>${M.finishType.toUpperCase()}</b><strong>${M.winner.name} · ${M.winner.finisher}</strong></article></div>
 <div class="match-breakdown"><h3>Match Score Breakdown</h3><div class="breakdown-head"><strong>${S.team.map(x=>x.name).join(' & ')}</strong><b>${M.finalPlayer} – ${M.finalOpp}</b><strong>${S.opp.map(x=>x.name).join(' & ')}</strong></div><div class="breakdown-row"><span>Starting Score</span><b>${M.startPlayer}</b><i>${M.startOpp}</i></div><div class="breakdown-row"><span>Performance</span><b>${Math.round(M.performancePlayer)}</b><i>${Math.round(M.performanceOpp)}</i></div><div class="breakdown-row"><span>Crowd Bonus</span><b>${playerCrowd}</b><i>${oppCrowd}</i></div><div class="breakdown-row"><span>Decision Bonus</span><b>${Math.round(M.decisionPlayer)}</b><i>${Math.round(M.decisionOpp)}</i></div></div>
 <div class="summary-grid"><article><small>MATCH STORY</small><p>${story}</p></article><article><small>MATCH MVP</small><h2>${M.mvp.name}</h2><p>${mvpReason(M.mvp)}</p></article><article><small>TURNING POINT</small><p>${M.turningPoint||'The match remained balanced until the final exchange.'}</p></article><article><small>BEST MOMENT</small><p>${M.bestMoment||`${M.winner.name} delivered ${M.winner.finisher} to end the match.`}</p></article></div>
 <div class="highlight-reel"><h3>Broadcast Highlights</h3>${highlights.map(x=>`<p>${x}</p>`).join('')}</div>${milestoneData().length?`<div class="milestone-grid">${milestoneData().map(m=>`<article><small>ACHIEVEMENT ANNOUNCER</small><h2>${m[0]}</h2><p>${m[1]}</p></article>`).join('')}</div>`:''}</section>`)
}

function postMatchFlow(){
 if(S.tournament)return tournamentAdvance();
 if(S.specialSingles){restoreTagTeams();return rewards();}
 if(!S.exhibition&&S.streak===1)return rewards();
 if(Math.random()<.72)return triggerBetweenMatchEvent();
 rewards();
}
const BETWEEN_MATCH_EVENTS=[
 {id:'singles',weight:18,run:showSinglesChallenge},
 {id:'interview',weight:28,run:showBackstageInterview},
 {id:'manager',weight:18,available:()=>!S.manager||Math.random()<.45,run:showManagerRecruitment},
 {id:'media',weight:12,run:()=>showChoiceEvent({personId:'tommy-sparks',eyebrow:'BACKSTAGE DEVELOPMENT',title:'The Cameras Are Waiting',copy:'A producer offers your team one final television segment.',choices:[['FIRE UP THE CROWD','Turn attention into momentum.','bonus',3],['KEEP IT PROFESSIONAL','Strengthen team chemistry.','chem',3],['WALK AWAY','Avoid risk and take a small edge.','bonus',1]]})},
 {id:'scout',weight:12,run:()=>showChoiceEvent({personId:'graham-archer',eyebrow:'SCOUTING REPORT',title:'Know Your Enemy',copy:'An agent has secured footage of your next opponents.',choices:[['STUDY THE TAPES','Take a measured score bonus.','bonus',3],['PLAN THE OPENING','Gain momentum for the next match.','momentum',2],['TRUST YOUR INSTINCTS','Smaller but safe advantage.','bonus',1]]})}
];
function weightedEvent(){const pool=BETWEEN_MATCH_EVENTS.filter(e=>!e.available||e.available());let total=pool.reduce((n,e)=>n+e.weight,0),roll=Math.random()*total;for(const e of pool){roll-=e.weight;if(roll<=0)return e}return pool[0]}
function triggerBetweenMatchEvent(){const e=weightedEvent();S.eventHistory.push(e.id);e.run()}
function finishBetweenEvent(){overlay.innerHTML='';rewards()}
function applyEventEffect(type,value){if(type==='chem')S.chem+=value;if(type==='momentum')S.momentum+=value;if(type==='bonus')S.nextMatchBonus=(S.nextMatchBonus||0)+value}
function showChoiceEvent(event){const person=event.personId?npc(event.personId):null;overlay.innerHTML=`<div class="overlay event-overlay"><section class="between-event illustrated-event">${person?`<div class="event-character">${npcImage(person.id,'full')}${lowerThird(person)}</div>`:''}<div class="event-content"><div class="tv-kicker">EXCLUSIVE · ${event.eyebrow}</div><h1>${event.title}</h1><p>${event.copy}</p><div class="choice-grid event-choice-grid">${event.choices.map((c,i)=>`<button class="choice" onclick="resolveChoiceEvent(${i})"><b>${c[0]}</b><small>${c[1]}</small></button>`).join('')}</div></div></section></div>`;S.currentBetweenEvent=event}
function resolveChoiceEvent(i){const c=S.currentBetweenEvent?.choices?.[i];if(!c)return;applyEventEffect(c[2],c[3]);overlay.innerHTML=`<div class="overlay event-overlay"><section class="between-event outcome"><div class="tv-kicker">DECISION MADE</div><h1>${c[0]}</h1><p>${c[2]==='chem'?`Team chemistry improves by +${c[3]}.`:c[2]==='momentum'?`Your momentum improves by +${c[3]}.`:`You gain +${c[3]} team score for the next match.`}</p><button class="btn" onclick="finishBetweenEvent()">CONTINUE</button></section></div>`}
function showManagerRecruitment(){const offers=pick(MANAGERS.filter(m=>m.id!==S.manager?.id),2);S.managerOffers=offers;overlay.innerHTML=`<div class="overlay event-overlay"><section class="between-event manager-recruit"><div class="tv-kicker">MANAGER RECRUITMENT · EXCLUSIVE</div><h1>A Manager Wants In</h1><p>${S.manager?'A new representative offers to replace your current manager.':'Two representatives are interested in guiding your team for the rest of this Gauntlet run.'}</p><div class="manager-grid">${offers.map((m,i)=>managerCard(m,`recruitManager(${i})`)).join('')}</div><button class="btn secondary" onclick="finishBetweenEvent()">DECLINE</button></section></div>`}
function recruitManager(i){S.manager=S.managerOffers[i];overlay.innerHTML=`<div class="overlay event-overlay"><section class="between-event outcome"><div class="tv-kicker">NEW MANAGER</div><div class="manager-single">${managerCard(S.manager)}</div><h1>${S.manager.name} Joins Your Team</h1><p>${S.manager.description} They remain your manager unless replaced by a future recruitment event.</p><button class="btn" onclick="finishBetweenEvent()">CONTINUE</button></section></div>`}
const INTERVIEW_QUESTIONS=[
 w=>({q:`${w.name}, your opponents say this run is built on luck. What do you say?`,a:[['RESPECT THE CHALLENGE','“Every team here can beat you if you lose focus.”','chem',3],['CALL YOUR SHOT','“Put anyone in front of us. We are winning again.”','bonus',4],['INSULT THE OPPOSITION','“They are not on our level—and they know it.”','bonus',6]]}),
 w=>({q:`${w.name}, what does this victory prove about your team?`,a:[['PRAISE YOUR PARTNER','“We win because we trust each other.”','chem',4],['OWN THE MOMENT','“It proves we belong in the spotlight.”','momentum',2],['DEMAND MORE','“One win means nothing. Send the next team.”','bonus',5]]}),
 w=>({q:`${w.name}, the crowd is beginning to believe in this run. Do you?`,a:[['THANK THE FANS','“We feel every voice in that arena.”','momentum',2],['STAY FOCUSED','“Belief does not win matches. Preparation does.”','bonus',3],['PROMISE DOMINANCE','“They have not seen anything yet.”','bonus',5]]})
];
function showBackstageInterview(){const speaker=one(S.team),x=one(INTERVIEW_QUESTIONS)(speaker);S.currentInterview=x;S.interviewCount++;overlay.innerHTML=`<div class="overlay interview-overlay"><section class="backstage-interview illustrated-interview"><div class="interviewer-art">${npcImage('katie-morgan','full')}${lowerThird(npc('katie-morgan'),'BACKSTAGE INTERVIEWER')}</div><div class="interview-content"><div class="tv-kicker">LIVE · BACKSTAGE</div><div class="interview-question"><small>KATIE MORGAN WITH ${speaker.name.toUpperCase()}</small><h1>“${x.q}”</h1></div><div class="choice-grid interview-choices">${x.a.map((a,i)=>`<button class="choice" onclick="answerInterview(${i})"><b>${a[0]}</b><small>${a[1]}</small></button>`).join('')}</div></div></section></div>`}
function answerInterview(i){const a=S.currentInterview?.a?.[i];if(!a)return;let value=a[3];if(S.manager?.id==='scarlett-storm'&&value>0)value++;applyEventEffect(a[2],value);overlay.innerHTML=`<div class="overlay interview-overlay"><section class="backstage-interview interview-result"><div class="tv-kicker">INTERVIEW COMPLETE</div><h1>${a[0]}</h1><blockquote>${a[1]}</blockquote><p>${a[2]==='chem'?`Team chemistry +${value}`:a[2]==='momentum'?`Momentum +${value}`:`Next-match team score +${value}`}</p><button class="btn" onclick="finishBetweenEvent()">CONTINUE</button></section></div>`}
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
 render(`<section class="panel singles-intro television-card"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN SINGLES BROADCAST</button></div><div class="tv-kicker">FEATURED SINGLES MATCH</div><div class="cinematic-versus singles-cinematic compact-preview"><div class="hero-team hero-left">${heroPortrait(chosen,'left')}</div><div class="giant-vs">VS</div><div class="hero-team hero-right">${heroPortrait(challenger,'right')}</div></div><p>${challenger.title} issued the challenge. ${chosen.title} accepted it.</p></section>`);
}
function declineSinglesChallenge(){overlay.innerHTML='';S.pendingChallenger=null;rewards();}
function restoreTagTeams(){if(S.tagBackup){S.team=S.tagBackup.team;S.opp=S.tagBackup.opp}S.tagBackup=null;S.specialSingles=false;}
function mvpReason(w){const moments=M.personalityMoments[w.id]||0;const reasons=[];if(w.id===M.winner.id)reasons.push(`sealed the victory with ${w.finisher}`);if(moments)reasons.push(`delivered ${moments} signature personality moment${moments===1?'':'s'}`);if(M.nearFalls>1)reasons.push('survived a match filled with near falls');if(!isSinglesMatch()&&M.tags>2)reasons.push('made a major impact in the tag exchanges');return reasons.length?reasons.slice(0,2).join(' and ')+'.':`${w.title} controlled the defining stretch of the match.`}
function buildSummaryStory(){const playerWon=M.winner&&S.team.some(x=>x.id===M.winner.id);if(isSinglesMatch()){const winnerSide=playerWon?'Your wrestler':'The opponent';const opener=M.storyKey==='comeback'?'The match became an underdog survival story':M.storyKey==='war'?'Both wrestlers traded control in a relentless battle':M.storyKey==='sprint'?'The contest exploded into a frantic sprint':M.storyKey==='domination'?'One wrestler seized control early and refused to release it':M.storyKey==='upset'?'The favourite was dragged into a dangerous upset attempt':'Both wrestlers built the contest carefully through every phase';return `${opener}. ${M.turningPoint||'The decisive momentum swing came late'}. ${winnerSide} closed the match when ${M.winner.name} landed ${M.winner.finisher}.`}const winnerSide=playerWon?'Your team':'The opposition';const opener=M.storyKey==='comeback'?'The match became an underdog survival story':M.storyKey==='war'?'Both teams traded control in a relentless war':M.storyKey==='sprint'?'The contest exploded into a frantic sprint':M.storyKey==='domination'?'One team seized control early and refused to release it':M.storyKey==='tagClinic'?'Quick tags and team combinations defined the match':M.storyKey==='upset'?'The favourites were dragged into a dangerous upset attempt':'Both teams built the contest carefully through every phase';return `${opener}. ${M.turningPoint||'The decisive momentum swing came late'}. ${winnerSide} closed the story when ${M.winner.name} landed ${M.winner.finisher}.`}
function formatTime(total){const m=Math.floor(total/60),s=String(total%60).padStart(2,'0');return `${m}:${s}`}
function handleLoss(){if(S.tournament)return tournamentEliminated();if(S.exhibition)return quickMatchMenu();if(S.specialSingles)restoreTagTeams();lose(M.lossMessage)}
const REWARD_PRESENTATION={
 wrestler:{eyebrow:'ROSTER OPPORTUNITY',title:'Recruit Wrestler',icon:'★',flavour:'A new competitor is ready to join your team.',detail:'Reveal a wrestler, then decide whether to change your current partnership.',theme:'gold',cta:'REVEAL RECRUIT'},
 chem:{eyebrow:'TEAMWORK UPGRADE',title:'The Team Is Clicking',icon:'⚡',flavour:'Trust is building between your partners.',detail:'Gain +5 chemistry for the remainder of this Gauntlet run.',theme:'blue',cta:'BOOST CHEMISTRY'},
 momentum:{eyebrow:'NEXT MATCH EDGE',title:'Ride the Momentum',icon:'▲',flavour:'Carry the energy of this victory into the next broadcast.',detail:'Gain +2 momentum for your next match.',theme:'red',cta:'TAKE MOMENTUM'},
 wind:{eyebrow:'RUN SAVER',title:'Dig Deep',icon:'♥',flavour:'One defeat will not end this Gauntlet.',detail:'Gain one Second Wind. It can be earned only once per run.',theme:'green',cta:'CLAIM SECOND WIND'}
};
function rewards(){
 let types=['wrestler','chem','momentum'];if(!S.windAwarded)types.push('wind');
 const first=S.streak===1;
 render(`<section class="panel reward-stage"><div class="reward-celebration"><div class="tv-kicker">${first?'FIRST VICTORY':'VICTORY REWARD'}</div><h1>${first?'YOUR RUN BEGINS':'REWARDS EARNED'}</h1><p>${first?'You survived the opening match. Choose the first upgrade for your team.':'Your team advances. Choose one reward before the next opponent arrives.'}</p></div><div class="reward-reveal-line"><span></span><b>CHOOSE ONE</b><span></span></div><div class="rewards reward-grid-2">${types.map((type,i)=>{const x=REWARD_PRESENTATION[type];return `<button class="reward reward-${x.theme}" style="--reward-delay:${i*110}ms" onclick="reward('${type}')"><span class="reward-glow"></span><small>${x.eyebrow}</small><i>${x.icon}</i><h3>${x.title}</h3><p>${x.flavour}</p><strong>${x.detail}</strong><b>${x.cta}</b></button>`}).join('')}</div></section>`)
}
function reward(t){if(t==='wrestler'){let ids=new Set(S.team.map(x=>x.id));S.offer=one(WRESTLERS.filter(x=>!ids.has(x.id)));render(`<section class="panel"><div class="actions top-actions"><button class="btn" onclick="team()">KEEP TEAM</button><button class="btn" onclick="replace(0)">REPLACE ${S.team[0].name}</button><button class="btn" onclick="replace(1)">REPLACE ${S.team[1].name}</button></div><h1 class="title">New Wrestler</h1><div style="max-width:340px;margin:auto">${card(S.offer)}</div></section>`)}else if(t==='chem'){S.chem+=5;team()}else if(t==='momentum'){S.momentum+=2;team()}else{S.wind=true;S.windAwarded=true;team()}}
function replace(i){S.team[i]=S.offer;discover(()=>team())}
function lose(msg){clearStoryTimer();if(S.wind){const names=S.team.map(w=>w.name).join(' & ');render(`<section class="panel home second-wind-screen"><div class="actions top-actions"><button class="btn" onclick="useWind()">CONTINUE RUN</button></div><h1>SECOND WIND</h1><p>${names} refuse to let the run end here.</p><strong>Your Second Wind has been used. The next loss ends your run.</strong></section>`)}else render(`<section class="panel home"><div class="actions top-actions"><button class="btn" onclick="home()">PLAY AGAIN</button></div><h1>GAUNTLET OVER</h1><p>${msg}</p><h2>FINAL STREAK: ${S.streak}</h2></section>`)}
function useWind(){S.wind=false;rewards()}
function rosterStatus(){
 const upgraded=new Set(Object.keys(CHARACTER_IMAGE_MANAGER));
 render(`<section class="panel roster-status"><div class="actions top-actions"><button class="btn" onclick="home()">BACK</button></div><div class="tv-kicker">DEVELOPER TOOLS</div><h1 class="title">ROSTER STATUS</h1><p>Artwork checks update automatically. Green means the configured file loaded successfully; fallback means the original roster art remains available.</p><div class="roster-status-grid">${WRESTLERS.map(w=>{const c=characterImageConfig(w);return `<article class="roster-status-row" data-status-id="${w.id}"><div><b>${w.name}</b><small>${w.title} · ${w.signature}</small></div><span class="status-pill ${c?'configured':'legacy'}">${c?'CONFIGURED':'LEGACY'}</span><span data-check="full">${c?'Checking full…':'Fallback art'}</span><span data-check="portrait">${c?'Checking portrait…':'Fallback art'}</span><span data-check="victory">${c?'Checking victory…':'Fallback art'}</span></article>`}).join('')}</div></section>`);
 upgraded.forEach(id=>{const w=WRESTLERS.find(x=>x.id===id),c=characterImageConfig(w);['full','portrait','victory'].forEach(type=>{const el=document.querySelector(`[data-status-id="${id}"] [data-check="${type}"]`);if(!el)return;const probe=new Image();probe.onload=()=>{el.textContent=`✓ ${type}`;el.className='asset-ok'};probe.onerror=()=>{el.textContent=`✕ ${type}`;el.className='asset-bad'};probe.src=c.assets[type]})});
}

/* Version 5.2 — Tournament, Achievements, Help & Rivalries */
const ACHIEVEMENT_KEY='ttg_achievements_v52';
const TOURNAMENT_KEY='ttg_tournament_records_v52';
const ACHIEVEMENTS=[
 {id:'first-win',name:'First Bell',desc:'Win your first match.',test:(st)=>st.wins>=1},
 {id:'ten-wins',name:'Ten Count',desc:'Win 10 matches.',test:(st)=>st.wins>=10},
 {id:'fifty-wins',name:'Main Event Regular',desc:'Win 50 matches.',test:(st)=>st.wins>=50},
 {id:'streak-3',name:'Heating Up',desc:'Reach a 3-match win streak.',test:(st)=>st.bestWinStreak>=3},
 {id:'streak-5',name:'On a Roll',desc:'Reach a 5-match win streak.',test:(st)=>st.bestWinStreak>=5},
 {id:'gauntlet-10',name:'Survivor',desc:'Reach 10 wins in Tag Team Gauntlet.',test:(st)=>st.bestGauntlet>=10},
 {id:'five-star',name:'Instant Classic',desc:'Produce a 5-star match.',test:(st)=>st.highestRated&&st.highestRated.rating>=4.95},
 {id:'all-founders',name:'Founding Twenty',desc:'Use every founding wrestler in a completed match.',test:(st)=>Object.keys(st.wrestlers||{}).filter(k=>st.wrestlers[k].matches>0).length>=20},
 {id:'tournament-win',name:'Tournament Champion',desc:'Win an eight-team tournament.',custom:true},
 {id:'perfect-tournament',name:'Perfect Bracket',desc:'Win a tournament without using Second Wind.',custom:true},
 {id:'rivalry',name:'This Is Personal',desc:'Face the same opponent at least three times.',custom:true},
 {id:'manager',name:'Guided to Victory',desc:'Win a match with a manager at ringside.',custom:true}
];
function loadAchievements(){try{return JSON.parse(localStorage.getItem(ACHIEVEMENT_KEY)||'{}')}catch(e){return {}}}
function saveAchievements(a){try{localStorage.setItem(ACHIEVEMENT_KEY,JSON.stringify(a))}catch(e){}}
function unlockAchievement(id){const a=loadAchievements();if(a[id])return false;a[id]={date:new Date().toISOString()};saveAchievements(a);return true}
function checkAchievements(){const st=loadStats();ACHIEVEMENTS.forEach(x=>{if(!x.custom&&x.test(st))unlockAchievement(x.id)});if(S.manager&&M&&M.ended&&M.finalPlayer>=M.finalOpp)unlockAchievement('manager');const r=rivalryStatus();if(r.meetings>=3)unlockAchievement('rivalry')}
const _recordCompletedMatch=recordCompletedMatch;
recordCompletedMatch=function(win,rating){_recordCompletedMatch(win,rating);checkAchievements()};
function achievementMenu(){const a=loadAchievements(),unlocked=ACHIEVEMENTS.filter(x=>a[x.id]).length;render(`<section class="achievement-screen">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">CAREER MILESTONES</div><h1>ACHIEVEMENTS</h1><p>${unlocked} of ${ACHIEVEMENTS.length} unlocked.</p></div><strong>${unlocked}/${ACHIEVEMENTS.length}</strong></header><div class="achievement-grid">${ACHIEVEMENTS.map(x=>`<article class="achievement ${a[x.id]?'unlocked':'locked'}"><i>${a[x.id]?'★':'◇'}</i><div><small>${a[x.id]?'UNLOCKED':'LOCKED'}</small><h3>${x.name}</h3><p>${x.desc}</p></div></article>`).join('')}</div></section>`)}
function helpMenu(){render(`<section class="help-screen">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">HOW TO PLAY</div><h1>HELP & GUIDE</h1><p>Everything needed to survive the broadcast.</p></div></header><div class="help-grid"><article><h2>Tag Team Gauntlet</h2><p>Start with one wrestler, choose one of two partners, then survive match after match. One loss ends the run unless Second Wind is available.</p></article><article><h2>Tournament Mode</h2><p>Select two wrestlers and win three consecutive rounds: Quarterfinal, Semifinal and Final. Lose once and your tournament is over.</p></article><article><h2>Match Decisions</h2><p><b>Control</b> is reliable, <b>Risk</b> creates a bigger swing, <b>Comeback</b> is strongest while behind, and <b>Finisher</b> becomes safer late in the match.</p></article><article><h2>Managers</h2><p>Managers provide a permanent run bonus and may create special backstage opportunities. Preston Cole is a ringside strategist, not a trainer.</p></article><article><h2>Rewards</h2><p>Classic victories can recruit wrestlers, improve chemistry, add momentum or grant the one-use Second Wind.</p></article><article><h2>Rivalries</h2><p>Repeated encounters are remembered. After three meetings, commentary and presentation identify the opponent as a developing rival.</p></article><article><h2>Match Ratings</h2><p>Ratings now reward genuine drama. Five-star matches are rare and require major moments, crowd heat, near falls and a strong finish.</p></article><article><h2>Quick Match</h2><p>Play standalone Singles or Tag Team exhibitions without affecting a Gauntlet or tournament run.</p></article></div></section>`)}
function rivalryStatus(){const h=loadHistory();if(!S.opp||!S.opp.length)return {active:false,meetings:0,name:''};const ranked=S.opp.map(w=>({w,n:h.opponents[w.id]||0})).sort((a,b)=>b.n-a.n),top=ranked[0];return {active:top.n>=2,meetings:top.n,name:top.w.name}}
function tournamentHome(){resetClassicState();S.tournament=true;S.tournamentSelections=[];render(`<section class="panel mode-landing tournament-landing">${shellBack()}<div class="mode-landing-copy"><div class="tv-kicker">NEW MODE</div><h1>GAUNTLET CUP</h1><p>Eight teams enter a single-elimination tournament. Win the Quarterfinal, Semifinal and Final to become Tournament Champion.</p><button class="btn" onclick="tournamentSelect()">ENTER TOURNAMENT</button></div><div class="tournament-trophy">🏆<small>8 TEAMS · 3 ROUNDS · 1 CHAMPION</small></div></section>`)}
function tournamentSelect(){S.tournament=true;S.tournamentSelections=S.tournamentSelections||[];const chosen=new Set(S.tournamentSelections.map(w=>w.id));render(`<section class="panel tournament-select"><div class="actions top-actions"><button class="btn secondary" onclick="tournamentHome()">BACK</button>${S.tournamentSelections.length===2?`<button class="btn" onclick="tournamentCreate()">CONFIRM TEAM</button>`:''}</div><div class="tv-kicker">GAUNTLET CUP ENTRY</div><h1 class="title">SELECT TWO WRESTLERS</h1><p class="sub">${S.tournamentSelections.length}/2 selected${S.tournamentSelections.length?` · ${S.tournamentSelections.map(w=>w.name).join(' & ')}`:''}</p><div class="collection-grid tournament-roster">${WRESTLERS.map(w=>`<button class="collection-tile ${chosen.has(w.id)?'selected':''}" onclick="toggleTournamentWrestler('${w.id}')">${imageWithFallback(w,'portrait','art-portrait','collection')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)}
function toggleTournamentWrestler(id){const w=WRESTLERS.find(x=>x.id===id),i=S.tournamentSelections.findIndex(x=>x.id===id);if(i>=0)S.tournamentSelections.splice(i,1);else if(S.tournamentSelections.length<2)S.tournamentSelections.push(w);tournamentSelect()}
function tournamentCreate(){S.team=[...S.tournamentSelections];const available=WRESTLERS.filter(w=>!S.team.some(x=>x.id===w.id));const shuffled=pick(available,Math.min(available.length,18));const opponents=[];for(let i=0;i<6;i+=2)opponents.push([shuffled[i],shuffled[i+1]]);window.T={round:0,wins:0,secondWindUsed:false,opponents};tournamentRoundScreen()}
function tournamentRoundName(){return ['QUARTERFINAL','SEMIFINAL','FINAL'][T.round]}
function tournamentRoundScreen(){const opp=T.opponents[T.round];render(`<section class="panel tournament-bracket"><div class="tv-kicker">GAUNTLET CUP</div><h1>${tournamentRoundName()}</h1><div class="tournament-progress"><span class="done">ENTRY</span><span class="${T.round>=1?'done':'active'}">QF</span><span class="${T.round>=2?'done':T.round===1?'active':''}">SF</span><span class="${T.round===2?'active':''}">FINAL</span></div><div class="cinematic-versus compact-tournament-vs"><div class="hero-team">${S.team.map(w=>heroPortrait(w,'left')).join('')}</div><div class="giant-vs">VS</div><div class="hero-team">${opp.map(w=>heroPortrait(w,'right')).join('')}</div></div><button class="btn broadcast-button" onclick="tournamentPrepareMatch()">BEGIN ${tournamentRoundName()}</button></section>`)}
function tournamentPrepareMatch(){S.opp=T.opponents[T.round];S.venue=one(VENUES);S.attendance=Math.floor(rnd(12500,20500));S.streak=T.wins;match()}
function tournamentAdvance(){T.wins++;if(T.round>=2){unlockAchievement('tournament-win');if(!T.secondWindUsed)unlockAchievement('perfect-tournament');const rec=JSON.parse(localStorage.getItem(TOURNAMENT_KEY)||'{"wins":0}');rec.wins=(rec.wins||0)+1;localStorage.setItem(TOURNAMENT_KEY,JSON.stringify(rec));return tournamentChampion()}T.round++;render(`<section class="panel tournament-advance"><div class="tv-kicker">ROUND COMPLETE</div><h1>YOU ADVANCE</h1><p>${S.team.map(w=>w.name).join(' & ')} move on to the ${tournamentRoundName()}.</p><button class="btn" onclick="tournamentRoundScreen()">VIEW NEXT ROUND</button></section>`)}
function tournamentChampion(){const championArt=S.team.map(w=>heroPortrait(w,'winner','victory','resultVictory')).join('');render(`<section class="panel tournament-champion"><div class="tournament-trophy">🏆<small>GAUNTLET CUP</small></div><h1>TOURNAMENT CHAMPIONS</h1><p>${S.team.map(w=>w.name).join(' & ')} survive all three rounds.</p><div class="television-winners tournament-winners"><div class="confetti-field"></div><div class="winning-team-art">${championArt}</div></div><button class="btn" onclick="home()">RETURN TO MAIN MENU</button></section>`) }
function tournamentEliminated(){render(`<section class="panel tournament-advance"><div class="tv-kicker">GAUNTLET CUP</div><h1>ELIMINATED</h1><p>Your tournament ends in the ${tournamentRoundName()}.</p><button class="btn" onclick="tournamentHome()">TRY AGAIN</button><button class="btn secondary" onclick="home()">MAIN MENU</button></section>`)}

// CAREER 6.1 BUILD 2 — playable weekly career and stable recruitment
const LIVE_SAVE_KEY='ttg_gauntlet_live_v1';
const LIVE_DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const LIVE_FOUNDERS=['jack-mercer','victor-royale','jett-valentine','revenant'];
function liveLoad(){
 try{
  const c=JSON.parse(localStorage.getItem(LIVE_SAVE_KEY)||'null');
  if(!c)return null;
  c.version=2;c.stable=Array.isArray(c.stable)&&c.stable.length?c.stable:[c.founder];
  c.active=c.active||c.founder;c.day=Number.isInteger(c.day)?c.day:0;c.week=c.week||1;c.month=c.month||1;
  c.wins=c.wins||0;c.losses=c.losses||0;c.momentum=Number.isFinite(c.momentum)?c.momentum:50;
  c.popularity=Number.isFinite(c.popularity)?c.popularity:20;c.training=c.training||{power:0,speed:0,technique:0,charisma:0,recovery:0};
  c.history=Array.isArray(c.history)?c.history:[];c.pending=c.pending||null;
  return c;
 }catch(e){return null}
}
function liveSave(career){try{localStorage.setItem(LIVE_SAVE_KEY,JSON.stringify(career))}catch(e){}}
function liveFounder(id){return WRESTLERS.find(w=>w.id===id)}
function liveClamp(n,min,max){return Math.max(min,Math.min(max,n))}
function liveIsSupercard(c){return c.day===6&&c.week%4===0}
function liveDayLabel(c,index){
 if(index===6&&c.week%4===0)return 'SUPERCARD';
 return ['MATCH NIGHT','FALLOUT','TRAINING','PROMO','MAIN EVENT','PREPARATION','WEEKLY REVIEW'][index];
}
function liveDayDescription(c){
 if(c.day===0)return 'Open the week with a singles match. Defeat an opponent to create a recruitment opportunity.';
 if(c.day===1)return 'Choose how your stable responds to the previous match.';
 if(c.day===2)return 'Develop one permanent career attribute.';
 if(c.day===3)return 'Cut a promo and shape your popularity or momentum.';
 if(c.day===4)return 'Compete in the weekly main event and continue building your stable.';
 if(c.day===5)return 'Prepare for Sunday with recovery, scouting or promotion.';
 if(liveIsSupercard(c))return 'The four-week cycle reaches its Supercard. Win the biggest match of the month.';
 return 'Review the week, collect your momentum bonus and move to the next week.';
}
function liveAdvanceDay(c){
 const completed=c.day;
 if(c.day<6)c.day++;
 else{c.day=0;c.week++;if((c.week-1)%4===0)c.month++}
 c.pending=null;liveSave(c);return completed;
}
function liveOpponent(c){
 const pool=WRESTLERS.filter(w=>w.id!==c.active);
 const seed=(c.week*17+c.day*11+c.wins*5+c.losses*3)%pool.length;
 return pool[seed]||pool[0];
}
function gauntletLiveHome(){
 const c=liveLoad();
 render(`<section class="panel live-mode-home">${shellBack()}<div class="tv-kicker">PERSISTENT CAREER MODE</div><h1>CAREER</h1><p>Compete through a seven-day wrestling week, recruit defeated opponents and grow a permanent stable.</p><div class="live-home-actions">${c?`<button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE · WEEK ${c.week}, ${LIVE_DAYS[c.day]}</button><button class="btn secondary" onclick="gauntletLiveStable()">VIEW STABLE · ${c.stable.length}</button>`:''}<button class="btn ${c?'secondary':'live-primary'}" onclick="gauntletLiveNewCareer()">${c?'START NEW CAREER':'BEGIN CAREER'}</button></div><div class="live-cycle"><b>BUILD 2</b><span>Playable weekly activities, match results, permanent stats and wrestler recruitment.</span></div></section>`)
}
function gauntletLiveNewCareer(){const c=liveLoad();if(c&&!confirm('Start a new Career career and replace the current save?'))return;gauntletLiveFounderSelect()}
function gauntletLiveFounderSelect(){
 const founders=LIVE_FOUNDERS.map(liveFounder).filter(Boolean);
 render(`<section class="panel live-founder-screen lpw-founder-clean"><button class="shell-back" onclick="gauntletLiveHome()">← CAREER</button><div class="tv-kicker">NEW CAREER</div><h1>CHOOSE YOUR WRESTLER</h1><p class="sub">This wrestler becomes the first member of your stable.</p><div class="live-founder-grid">${founders.map(w=>`<button class="live-founder-card" onclick="gauntletLiveChooseFounder('${w.id}')">${imageWithFallback(w,'full','art-full','quickMatch')}<span><small>${w.title}</small><b>${w.name}</b><em>${w.signature}</em></span></button>`).join('')}</div></section>`)
}
function gauntletLiveChooseFounder(id){
 const w=liveFounder(id);if(!w||!LIVE_FOUNDERS.includes(id))return gauntletLiveFounderSelect();
 const c={version:2,founder:id,active:id,stable:[id],week:1,month:1,day:0,wins:0,losses:0,momentum:50,popularity:20,training:{power:0,speed:0,technique:0,charisma:0,recovery:0},history:[],created:new Date().toISOString()};
 liveSave(c);gauntletLiveCalendar();
}
function gauntletLiveCalendar(){
 const c=liveLoad();if(!c)return gauntletLiveHome();const w=liveFounder(c.active)||liveFounder(c.founder),supercard=c.week%4===0;
 render(`<section class="panel live-calendar-screen"><div class="live-calendar-top"><button class="shell-back" onclick="home()">← MAIN MENU</button><button class="shell-back" onclick="gauntletLiveHome()">CAREER MENU</button></div><div class="tv-kicker">MONTH ${c.month} · WEEK ${c.week}</div><h1>CAREER</h1><div class="live-career-dashboard"><div class="live-career-hero">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div><small>ACTIVE WRESTLER</small><b>${w.name}</b><span>${c.wins}-${c.losses} record · ${c.stable.length} stable members</span></div></div><div class="live-mini-stats"><span><small>MOMENTUM</small><b>${c.momentum}</b></span><span><small>POPULARITY</small><b>${c.popularity}</b></span><button onclick="gauntletLiveStable()">MANAGE STABLE</button></div></div><div class="live-week-strip">${LIVE_DAYS.map((d,i)=>`<div class="live-day ${i<c.day?'complete':''} ${i===c.day?'current':''} ${i===6&&supercard?'supercard':''}"><small>${d.slice(0,3).toUpperCase()}</small><b>${i===6&&supercard?'SUPERCARD':i+1}</b><span>${liveDayLabel(c,i)}</span></div>`).join('')}</div><div class="live-today"><small>TODAY · ${LIVE_DAYS[c.day].toUpperCase()}</small><h2>${liveDayLabel(c,c.day)}</h2><p>${liveDayDescription(c)}</p><button class="btn live-primary" onclick="gauntletLiveBeginDay()">${c.day===0||c.day===4||liveIsSupercard(c)?'VIEW MATCH':'BEGIN ACTIVITY'}</button></div></section>`)
}
function gauntletLiveBeginDay(){const c=liveLoad();if(!c)return gauntletLiveHome();if(c.day===0||c.day===4||liveIsSupercard(c))return gauntletLiveMatchCard();if(c.day===1)return gauntletLiveChoice('FALLOUT','How does your stable respond?',[['Regroup','Momentum +8','momentum',8],['Address the media','Popularity +6','popularity',6],['Study the footage','Technique +1','technique',1]]);if(c.day===2)return gauntletLiveChoice('TRAINING','Choose today’s development focus.',[['Power drills','Power +1','power',1],['Speed circuit','Speed +1','speed',1],['Technical clinic','Technique +1','technique',1]]);if(c.day===3)return gauntletLiveChoice('PROMO','Choose the message you deliver.',[['Call out a rival','Momentum +10','momentum',10],['Thank the fans','Popularity +10','popularity',10],['Promise victory','Charisma +1','charisma',1]]);if(c.day===5)return gauntletLiveChoice('PREPARATION','Choose how to spend Saturday.',[['Recover','Recovery +1 and Momentum +4','recovery',1,'momentum',4],['Scout opponents','Technique +1','technique',1],['Public appearance','Popularity +8','popularity',8]]);return gauntletLiveWeeklyReview()}
function gauntletLiveChoice(title,prompt,choices){
 render(`<section class="panel live-activity-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">${LIVE_DAYS[liveLoad().day].toUpperCase()}</div><h1>${title}</h1><p>${prompt}</p><div class="live-choice-grid">${choices.map((x,i)=>`<button onclick='gauntletLiveResolveChoice(${JSON.stringify(x)})'><b>${x[0]}</b><span>${x[1]}</span></button>`).join('')}</div></section>`)
}
function gauntletLiveResolveChoice(choice){
 const c=liveLoad();if(!c)return gauntletLiveHome();const key=choice[2],amount=choice[3],key2=choice[4],amount2=choice[5];
 if(['momentum','popularity'].includes(key))c[key]=liveClamp(c[key]+amount,0,100);else c.training[key]=(c.training[key]||0)+amount;
 if(key2)c[key2]=liveClamp((c[key2]||0)+amount2,0,100);
 const day=liveAdvanceDay(c);
 render(`<section class="panel live-day-complete"><div class="tv-kicker">ACTIVITY COMPLETE</div><h1>${choice[0].toUpperCase()}</h1><p>${choice[1]}.</p><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE TO ${LIVE_DAYS[c.day].toUpperCase()}</button></section>`)
}
function gauntletLiveMatchCard(){
 const c=liveLoad();if(!c)return gauntletLiveHome();const player=liveFounder(c.active),opp=liveOpponent(c),isSC=liveIsSupercard(c);c.pending={opponent:opp.id,isSupercard:isSC};liveSave(c);
 render(`<section class="panel live-match-card"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">${isSC?'MONTHLY SUPERCARD':LIVE_DAYS[c.day].toUpperCase()+' MATCH'}</div><h1>${isSC?'SUPERCARD MAIN EVENT':'SINGLES MATCH'}</h1><div class="live-versus"><div>${imageWithFallback(player,'portrait','art-portrait','matchPortrait')}<small>YOUR WRESTLER</small><b>${player.name}</b></div><strong>VS</strong><div>${imageWithFallback(opp,'portrait','art-portrait','matchPortrait')}<small>OPPONENT</small><b>${opp.name}</b></div></div><p>Choose your approach. Momentum and training influence the result.</p><div class="live-strategy-grid"><button onclick="gauntletLiveResolveMatch('control')"><b>CONTROL</b><span>Reliable and technical</span></button><button onclick="gauntletLiveResolveMatch('risk')"><b>TAKE A RISK</b><span>Higher reward, higher danger</span></button><button onclick="gauntletLiveResolveMatch('showboat')"><b>SHOWBOAT</b><span>Build popularity through spectacle</span></button></div></section>`)
}
function gauntletLiveResolveMatch(strategy){
 const c=liveLoad();if(!c||!c.pending)return gauntletLiveCalendar();const opp=liveFounder(c.pending.opponent),player=liveFounder(c.active),t=c.training||{};
 let chance=.48+(c.momentum-50)/250+((t.power||0)+(t.speed||0)+(t.technique||0))/120;
 if(strategy==='control')chance+=.08+(t.technique||0)/80;if(strategy==='risk')chance-=.03;if(strategy==='showboat')chance-=.06+(t.charisma||0)/150;
 if(c.pending.isSupercard)chance-=.08;chance=liveClamp(chance,.2,.82);const win=c.history.length===0?true:Math.random()<chance;
 if(win){c.wins++;c.momentum=liveClamp(c.momentum+(c.pending.isSupercard?16:10),0,100);if(strategy==='showboat')c.popularity=liveClamp(c.popularity+12,0,100)}else{c.losses++;c.momentum=liveClamp(c.momentum-12,0,100)}
 c.history.unshift({week:c.week,day:c.day,opponent:opp.id,win,strategy,supercard:c.pending.isSupercard,date:new Date().toISOString()});c.history=c.history.slice(0,30);liveSave(c);
 if(win&&!c.stable.includes(opp.id))return gauntletLiveRecruitment(opp.id);
 gauntletLiveFinishMatch(win,opp.id,false);
}
function gauntletLiveRecruitment(id){const c=liveLoad(),opp=liveFounder(id);render(`<section class="panel live-recruit-screen"><div class="tv-kicker">MATCH WON · RECRUITMENT OPPORTUNITY</div><h1>${opp.name.toUpperCase()} IS IMPRESSED</h1>${imageWithFallback(opp,'victory','art-full','resultVictory')}<p>You defeated ${opp.name}. Invite this wrestler to join your permanent stable?</p><div class="live-recruit-actions"><button class="btn live-primary" onclick="gauntletLiveAcceptRecruit('${id}')">RECRUIT ${opp.name.toUpperCase()}</button><button class="btn secondary" onclick="gauntletLiveFinishMatch(true,'${id}',false)">DECLINE</button></div></section>`)}
function gauntletLiveAcceptRecruit(id){const c=liveLoad();if(!c.stable.includes(id))c.stable.push(id);liveSave(c);gauntletLiveFinishMatch(true,id,true)}
function gauntletLiveFinishMatch(win,oppId,recruited){
 const c=liveLoad(),opp=liveFounder(oppId),wasSC=c.pending&&c.pending.isSupercard;const completed=liveAdvanceDay(c);
 render(`<section class="panel live-day-complete ${win?'live-win':'live-loss'}"><div class="tv-kicker">${wasSC?'SUPERCARD RESULT':'MATCH RESULT'}</div><h1>${win?'VICTORY':'DEFEAT'}</h1><p>${win?`${liveFounder(c.active).name} defeated ${opp.name}.${recruited?` ${opp.name} has joined your stable.`:''}`:`${opp.name} wins, but your Career career continues.`}</p><div class="live-result-record"><b>${c.wins}-${c.losses}</b><span>CAREER RECORD</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE TO ${LIVE_DAYS[c.day].toUpperCase()}</button></section>`)
}
function gauntletLiveWeeklyReview(){
 const c=liveLoad();c.momentum=liveClamp(c.momentum+5,0,100);const oldWeek=c.week;liveAdvanceDay(c);
 render(`<section class="panel live-day-complete"><div class="tv-kicker">WEEK ${oldWeek} COMPLETE</div><h1>WEEKLY REVIEW</h1><p>Your stable receives +5 Momentum. Week ${c.week} is ready.</p><div class="live-result-record"><b>${c.stable.length}</b><span>STABLE MEMBERS</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">BEGIN WEEK ${c.week}</button></section>`)
}
function gauntletLiveStable(){
 const c=liveLoad();if(!c)return gauntletLiveHome();
 render(`<section class="panel live-stable-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">PERMANENT ROSTER</div><h1>YOUR STABLE</h1><p>Select which recruited wrestler represents you in upcoming matches.</p><div class="live-stable-grid">${c.stable.map(id=>{const w=liveFounder(id);return `<button class="live-stable-card ${id===c.active?'active':''}" onclick="gauntletLiveSetActive('${id}')">${imageWithFallback(w,'portrait','art-portrait','collection')}<span><small>${id===c.founder?'FOUNDER':'RECRUITED'}</small><b>${w.name}</b><em>${id===c.active?'ACTIVE WRESTLER':'SELECT'}</em></span></button>`}).join('')}</div><div class="live-training-summary"><h2>CAREER DEVELOPMENT</h2>${Object.entries(c.training).map(([k,v])=>`<span><small>${k.toUpperCase()}</small><b>+${v}</b></span>`).join('')}</div></section>`)
}
function gauntletLiveSetActive(id){const c=liveLoad();if(!c||!c.stable.includes(id))return gauntletLiveStable();c.active=id;liveSave(c);gauntletLiveStable()}

// CAREER 6.2 BUILD 3 — Career XP, levels and wrestler stat cards
const LIVE_PROGRESSION_STATS=['power','speed','technique','charisma','resilience','versatility','finisher'];
function liveBaseStat(w,key){
 if(key==='finisher')return Math.max(60,Math.min(90,Math.round(((w.technique||75)+(w.charisma||75)+(w.overall||80))/3)-4));
 return Number(w[key])||75;
}
function liveStartingStat(w,key){return liveClamp(Math.round(liveBaseStat(w,key)*0.78),55,82)}
function livePotentialCap(w,key){return liveClamp(Math.max(liveStartingStat(w,key)+8,Math.round(liveBaseStat(w,key))),72,99)}
function liveNewProfile(id){
 const w=liveFounder(id);const stats={},caps={};
 LIVE_PROGRESSION_STATS.forEach(k=>{stats[k]=liveStartingStat(w,k);caps[k]=livePotentialCap(w,k)});
 return {level:1,xp:0,points:0,stats,caps,totalXp:0};
}
function liveEnsureProgression(c){
 c.progression=c.progression&&typeof c.progression==='object'?c.progression:{};
 (c.stable||[]).forEach(id=>{if(!c.progression[id])c.progression[id]=liveNewProfile(id)});
 c.version=3;return c;
}
const _liveLoadBuild2=liveLoad;
liveLoad=function(){const c=_liveLoadBuild2();if(!c)return null;liveEnsureProgression(c);liveSave(c);return c};
function liveXpForNext(level){return 180+(level-1)*70}
function liveProgress(id,c){liveEnsureProgression(c);return c.progression[id]||(c.progression[id]=liveNewProfile(id))}
function liveAwardXp(c,id,amount,reason){
 const p=liveProgress(id,c);const before=p.level;p.xp+=amount;p.totalXp+=amount;
 while(p.xp>=liveXpForNext(p.level)){p.xp-=liveXpForNext(p.level);p.level++;p.points++}
 return {amount,reason,levels:p.level-before,level:p.level,points:p.points};
}
function liveEffectiveStat(c,id,key){const p=liveProgress(id,c);return p.stats[key]||liveStartingStat(liveFounder(id),key)}
function liveProgressBar(p){const need=liveXpForNext(p.level),pct=Math.max(0,Math.min(100,Math.round((p.xp/need)*100)));return `<div class="live-xp-track"><i style="width:${pct}%"></i></div><small>${p.xp} / ${need} XP TO LEVEL ${p.level+1}</small>`}
function gauntletLiveCareerCard(id){
 const c=liveLoad();if(!c)return gauntletLiveHome();id=id||c.active;if(!c.stable.includes(id))id=c.active;
 const w=liveFounder(id),p=liveProgress(id,c);
 render(`<section class="panel live-career-card-screen"><div class="live-calendar-top"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><button class="shell-back" onclick="gauntletLiveStable()">STABLE</button></div><div class="tv-kicker">CAREER DEVELOPMENT</div><h1>WRESTLER STAT CARD</h1><div class="live-stat-card"><div class="live-stat-identity">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div><small>${w.title}</small><h2>${w.name}</h2><b>LEVEL ${p.level}</b>${liveProgressBar(p)}<span>AVAILABLE STAT POINTS <strong>${p.points}</strong></span></div></div><div class="live-attribute-list">${LIVE_PROGRESSION_STATS.map(k=>{const value=p.stats[k],cap=p.caps[k],maxed=value>=cap;return `<div class="live-attribute-row"><span><small>${k.toUpperCase()}</small><b>${value}<em>/ ${cap}</em></b></span><div class="live-attribute-meter"><i style="width:${Math.round(value/cap*100)}%"></i></div><button ${p.points<1||maxed?'disabled':''} onclick="gauntletLiveSpendPoint('${id}','${k}')">${maxed?'MAX':'+'}</button></div>`}).join('')}</div></div><p class="live-stat-note">XP is earned steadily from matches and weekly activities. Each level awards one permanent stat point for this career.</p></section>`)
}
function gauntletLiveSpendPoint(id,key){const c=liveLoad(),p=liveProgress(id,c);if(!LIVE_PROGRESSION_STATS.includes(key)||p.points<1||p.stats[key]>=p.caps[key])return gauntletLiveCareerCard(id);p.stats[key]++;p.points--;liveSave(c);gauntletLiveCareerCard(id)}
const _gauntletLiveChooseFounderB2=gauntletLiveChooseFounder;
gauntletLiveChooseFounder=function(id){const w=liveFounder(id);if(!w||!LIVE_FOUNDERS.includes(id))return gauntletLiveFounderSelect();const c={version:3,founder:id,active:id,stable:[id],week:1,month:1,day:0,wins:0,losses:0,momentum:50,popularity:20,training:{power:0,speed:0,technique:0,charisma:0,recovery:0},progression:{},history:[],created:new Date().toISOString()};liveEnsureProgression(c);liveSave(c);gauntletLiveCalendar()};
const _gauntletLiveAcceptRecruitB2=gauntletLiveAcceptRecruit;
gauntletLiveAcceptRecruit=function(id){const c=liveLoad();if(!c.stable.includes(id))c.stable.push(id);liveEnsureProgression(c);liveSave(c);gauntletLiveFinishMatch(true,id,true)};
const _gauntletLiveCalendarB2=gauntletLiveCalendar;
gauntletLiveCalendar=function(){
 const c=liveLoad();if(!c)return gauntletLiveHome();const w=liveFounder(c.active)||liveFounder(c.founder),p=liveProgress(c.active,c),supercard=c.week%4===0;
 render(`<section class="panel live-calendar-screen"><div class="live-calendar-top"><button class="shell-back" onclick="home()">← MAIN MENU</button><button class="shell-back" onclick="gauntletLiveHome()">CAREER MENU</button></div><div class="tv-kicker">MONTH ${c.month} · WEEK ${c.week}</div><h1>CAREER</h1><div class="live-career-dashboard"><div class="live-career-hero">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div><small>ACTIVE WRESTLER</small><b>${w.name}</b><span>Level ${p.level} · ${c.wins}-${c.losses} record · ${c.stable.length} stable members</span>${liveProgressBar(p)}</div></div><div class="live-mini-stats"><span><small>MOMENTUM</small><b>${c.momentum}</b></span><span><small>POPULARITY</small><b>${c.popularity}</b></span><button onclick="gauntletLiveCareerCard()">STAT CARD${p.points?` · ${p.points} POINT${p.points===1?'':'S'}`:''}</button><button onclick="gauntletLiveStable()">MANAGE STABLE</button></div></div><div class="live-week-strip">${LIVE_DAYS.map((d,i)=>`<div class="live-day ${i<c.day?'complete':''} ${i===c.day?'current':''} ${i===6&&supercard?'supercard':''}"><small>${d.slice(0,3).toUpperCase()}</small><b>${i===6&&supercard?'SUPERCARD':i+1}</b><span>${liveDayLabel(c,i)}</span></div>`).join('')}</div><div class="live-today"><small>TODAY · ${LIVE_DAYS[c.day].toUpperCase()}</small><h2>${liveDayLabel(c,c.day)}</h2><p>${liveDayDescription(c)}</p><button class="btn live-primary" onclick="gauntletLiveBeginDay()">${c.day===0||c.day===4||liveIsSupercard(c)?'VIEW MATCH':'BEGIN ACTIVITY'}</button></div></section>`)
};
const _gauntletLiveChoiceB2=gauntletLiveChoice;
gauntletLiveChoice=function(title,prompt,choices){const c=liveLoad();render(`<section class="panel live-choice-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">${LIVE_DAYS[c.day].toUpperCase()} ACTIVITY</div><h1>${title}</h1><p>${prompt}</p><div class="live-choice-grid">${choices.map((ch,i)=>`<button onclick="gauntletLiveCompleteChoice(${i},${JSON.stringify(choices).replace(/"/g,'&quot;')})"><b>${ch[0]}</b><span>${ch[1]}</span></button>`).join('')}</div></section>`)};
gauntletLiveCompleteChoice=function(index,choices){const c=liveLoad(),choice=choices[index];if(!choice)return gauntletLiveCalendar();const key=choice[2],amount=Number(choice[3])||0;if(key==='momentum'||key==='popularity')c[key]=liveClamp(c[key]+amount,0,100);else c.training[key]=(c.training[key]||0)+amount;if(choice[4])c[choice[4]]=liveClamp((c[choice[4]]||0)+(Number(choice[5])||0),0,100);const xp=liveAwardXp(c,c.active,c.day===2?45:30,choice[0]);const completed=liveAdvanceDay(c);liveSave(c);render(`<section class="panel live-day-complete"><div class="tv-kicker">${LIVE_DAYS[completed].toUpperCase()} COMPLETE</div><h1>${choice[0].toUpperCase()}</h1><p>${choice[1]}</p><div class="live-xp-award"><b>+${xp.amount} XP</b><span>${xp.levels?`LEVEL UP! +${xp.levels} STAT POINT${xp.levels===1?'':'S'}`:`Progressing toward Level ${xp.level+1}`}</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE TO ${LIVE_DAYS[c.day].toUpperCase()}</button></section>`)};
const _gauntletLiveResolveMatchB2=gauntletLiveResolveMatch;
gauntletLiveResolveMatch=function(strategy){
 const c=liveLoad();if(!c||!c.pending)return gauntletLiveCalendar();const opp=liveFounder(c.pending.opponent),t=c.training||{};
 const power=liveEffectiveStat(c,c.active,'power'),speed=liveEffectiveStat(c,c.active,'speed'),tech=liveEffectiveStat(c,c.active,'technique'),charisma=liveEffectiveStat(c,c.active,'charisma'),res=liveEffectiveStat(c,c.active,'resilience'),vers=liveEffectiveStat(c,c.active,'versatility'),fin=liveEffectiveStat(c,c.active,'finisher');
 let chance=.36+(c.momentum-50)/250+((power+speed+tech+res+vers+fin)/6-65)/170+((t.power||0)+(t.speed||0)+(t.technique||0))/140;
 if(strategy==='control')chance+=.05+(tech-65)/300;if(strategy==='risk')chance+=(speed+fin-140)/420;if(strategy==='showboat')chance+=(charisma-70)/280-.03;if(c.pending.isSupercard)chance-=.08;chance=liveClamp(chance,.2,.84);const win=c.history.length===0?true:Math.random()<chance;
 if(win){c.wins++;c.momentum=liveClamp(c.momentum+(c.pending.isSupercard?16:10),0,100);if(strategy==='showboat')c.popularity=liveClamp(c.popularity+12,0,100)}else{c.losses++;c.momentum=liveClamp(c.momentum-12,0,100)}
 const xpAmount=win?(c.pending.isSupercard?240:110):(c.pending.isSupercard?70:40);const xp=liveAwardXp(c,c.active,xpAmount,win?'Match victory':'Match experience');c.lastXpAward=xp;
 c.history.unshift({week:c.week,day:c.day,opponent:opp.id,win,strategy,supercard:c.pending.isSupercard,xp:xpAmount,date:new Date().toISOString()});c.history=c.history.slice(0,30);liveSave(c);if(win&&!c.stable.includes(opp.id))return gauntletLiveRecruitment(opp.id);gauntletLiveFinishMatch(win,opp.id,false)
};
const _gauntletLiveFinishMatchB2=gauntletLiveFinishMatch;
gauntletLiveFinishMatch=function(win,oppId,recruited){const c=liveLoad(),opp=liveFounder(oppId),wasSC=c.pending&&c.pending.isSupercard,xp=c.lastXpAward||{amount:0,levels:0,level:liveProgress(c.active,c).level};c.lastXpAward=null;const completed=liveAdvanceDay(c);liveSave(c);render(`<section class="panel live-day-complete ${win?'live-win':'live-loss'}"><div class="tv-kicker">${wasSC?'SUPERCARD RESULT':'MATCH RESULT'}</div><h1>${win?'VICTORY':'DEFEAT'}</h1><p>${win?`${liveFounder(c.active).name} defeated ${opp.name}.${recruited?` ${opp.name} has joined your stable.`:''}`:`${opp.name} wins, but your Career career continues.`}</p><div class="live-xp-award"><b>+${xp.amount} XP</b><span>${xp.levels?`LEVEL UP! +${xp.levels} STAT POINT${xp.levels===1?'':'S'} EARNED`:`Level ${xp.level} progression`}</span></div><div class="live-result-record"><b>${c.wins}-${c.losses}</b><span>CAREER RECORD</span></div><div class="live-result-actions"><button class="btn ${xp.levels?'live-primary':'secondary'}" onclick="gauntletLiveCareerCard()">VIEW STAT CARD</button><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE TO ${LIVE_DAYS[c.day].toUpperCase()}</button></div></section>`)};
const _gauntletLiveStableB2=gauntletLiveStable;
gauntletLiveStable=function(){const c=liveLoad();if(!c)return gauntletLiveHome();render(`<section class="panel live-stable-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">PERMANENT ROSTER</div><h1>YOUR STABLE</h1><p>Select your active wrestler or open an individual career stat card.</p><div class="live-stable-grid">${c.stable.map(id=>{const w=liveFounder(id),p=liveProgress(id,c);return `<article class="live-stable-card ${id===c.active?'active':''}">${imageWithFallback(w,'portrait','art-portrait','collection')}<span><small>${id===c.founder?'FOUNDER':'RECRUITED'} · LEVEL ${p.level}</small><b>${w.name}</b><em>${p.points?`${p.points} STAT POINT${p.points===1?'':'S'} READY`:id===c.active?'ACTIVE WRESTLER':'STABLE MEMBER'}</em><div><button onclick="gauntletLiveSetActive('${id}')">${id===c.active?'ACTIVE':'SELECT'}</button><button onclick="gauntletLiveCareerCard('${id}')">STAT CARD</button></div></span></article>`}).join('')}</div></section>`)};


const _homeV52=home;
home=function(){clearStoryTimer();M=null;overlay.innerHTML='';const w=featuredSuperstar();render(`<section class="game-hub"><div class="hub-copy"><div class="tv-kicker">WELCOME TO LPW</div><h1>TAG TEAM <span>GAUNTLET</span></h1><p>Build a team, survive the broadcast and create your legacy.</p><nav class="hub-menu"><button class="hub-option primary live-menu-option" onclick="gauntletLiveHome()"><b>CAREER</b><small>Begin or continue your weekly career.</small></button><button class="hub-option" onclick="classicHome()"><b>CLASSIC GAUNTLET</b><small>One loss ends the run.</small></button><button class="hub-option tournament-option" onclick="tournamentHome()"><b>GAUNTLET CUP</b><small>Eight-team single-elimination tournament.</small></button><button class="hub-option" onclick="quickMatchMenu()"><b>QUICK MATCH</b><small>Singles and Tag Team exhibitions.</small></button><button class="hub-option" onclick="collection()"><b>COLLECTION</b><small>Explore the Founding Twenty.</small></button><button class="hub-option" onclick="achievementMenu()"><b>ACHIEVEMENTS</b><small>Career milestones and challenges.</small></button><button class="hub-option" onclick="statisticsMenu()"><b>STATISTICS</b><small>Your complete match history.</small></button><button class="hub-option" onclick="helpMenu()"><b>HELP & GUIDE</b><small>Rules, decisions and mode explanations.</small></button></nav></div><article class="featured-superstar"><div class="live-chip">FEATURED SUPERSTAR</div>${imageWithFallback(w,'full','art-full','homeFeature')}<div class="featured-lower-third"><small>${w.title}</small><h2>${w.name}</h2><p>${FEATURE_LINES[w.id]||w.signature}</p><button onclick="collectionProfile('${w.id}')">VIEW PROFILE</button></div></article></section>`)};


// CAREER 6.3 BUILD 4 — premium career cards, OVR, milestones and level celebrations
const LIVE_TRAITS=[
 {id:'iron-chin',name:'Iron Chin',description:'Resilience has extra influence when calculating match odds.',stat:'resilience'},
 {id:'ring-general',name:'Ring General',description:'Technique has extra influence when using Control the Match.',stat:'technique'},
 {id:'crowd-favourite',name:'Crowd Favourite',description:'Earn larger popularity gains from promos and showboating.',stat:'charisma'},
 {id:'comeback-king',name:'Comeback King',description:'Gain a match-odds boost whenever momentum is below 45.',stat:'resilience'},
 {id:'show-stealer',name:'Show Stealer',description:'Speed and Finisher have extra influence on high-risk strategies.',stat:'speed'}
];
function liveOverall(p){
 const weights={power:1,speed:1,technique:1.15,charisma:.75,resilience:1.1,versatility:.9,finisher:1.1};
 let total=0,weight=0;LIVE_PROGRESSION_STATS.forEach(k=>{total+=(Number(p.stats[k])||0)*weights[k];weight+=weights[k]});
 return Math.round(total/weight);
}
function livePotentialOverall(p){
 const temp={stats:p.caps};return liveOverall(temp);
}
function liveProfileUpgrade(p){
 p.traits=Array.isArray(p.traits)?p.traits:[];
 p.milestones=Number(p.milestones)||0;
 p.wins=Number(p.wins)||0;p.losses=Number(p.losses)||0;p.supercardWins=Number(p.supercardWins)||0;
 p.titles=Number(p.titles)||0;p.lastLevel=Number(p.lastLevel)||p.level;
 return p;
}
const _liveEnsureProgressionB3=liveEnsureProgression;
liveEnsureProgression=function(c){_liveEnsureProgressionB3(c);Object.values(c.progression||{}).forEach(liveProfileUpgrade);c.version=4;return c};
const _liveAwardXpB3=liveAwardXp;
liveAwardXp=function(c,id,amount,reason){
 const p=liveProfileUpgrade(liveProgress(id,c)),before=p.level,beforePoints=p.points,beforeMilestones=p.milestones;
 p.xp+=amount;p.totalXp+=amount;
 while(p.xp>=liveXpForNext(p.level)){
  p.xp-=liveXpForNext(p.level);p.level++;
  if(p.level%10===0)p.milestones++;else p.points++;
 }
 p.lastLevel=before;
 return {amount,reason,levels:p.level-before,level:p.level,points:p.points,pointsEarned:p.points-beforePoints,milestonesEarned:p.milestones-beforeMilestones};
};
function liveTraitById(id){return LIVE_TRAITS.find(t=>t.id===id)}
function liveTraitBonus(c,id,stat){const p=liveProgress(id,c);return (p.traits||[]).some(t=>liveTraitById(t)?.stat===stat)?2:0}
function liveCareerRecord(p){return `${p.wins||0}-${p.losses||0}`}
function liveAttributeRows(p,interactive,id){return LIVE_PROGRESSION_STATS.map(k=>{const value=p.stats[k],cap=p.caps[k],maxed=value>=cap;return `<div class="live-attribute-row"><span><small>${k.toUpperCase()}</small><b>${value}<em>/ ${cap}</em></b></span><div class="live-attribute-meter"><i style="width:${Math.round(value/cap*100)}%"></i></div>${interactive?`<button ${p.points<1||maxed?'disabled':''} onclick="gauntletLiveSpendPoint('${id}','${k}',true)">${maxed?'MAX':'+'}</button>`:''}</div>`}).join('')}
function gauntletLiveCareerCard(id){
 const c=liveLoad();if(!c)return gauntletLiveHome();id=id||c.active;if(!c.stable.includes(id))id=c.active;
 const w=liveFounder(id),p=liveProfileUpgrade(liveProgress(id,c)),ovr=liveOverall(p),potential=livePotentialOverall(p);
 render(`<section class="panel live-career-card-screen premium"><div class="live-calendar-top"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><button class="shell-back" onclick="gauntletLiveStable()">STABLE</button></div><div class="tv-kicker">CAREER DEVELOPMENT</div><h1>MY CAREER</h1><div class="live-premium-card"><div class="live-card-art">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div class="live-level-badge"><small>LEVEL</small><b>${p.level}</b></div><div class="live-ovr-badge"><small>OVR</small><b>${ovr}</b><em>MAX ${potential}</em></div></div><div class="live-card-main"><small>${w.title}</small><h2>${w.name}</h2>${liveProgressBar(p)}<div class="live-career-record-grid"><span><small>RECORD</small><b>${liveCareerRecord(p)}</b></span><span><small>SUPERCARD WINS</small><b>${p.supercardWins||0}</b></span><span><small>WEEKS</small><b>${c.week}</b></span><span><small>TITLES</small><b>${p.titles||0}</b></span></div><div class="live-point-callout ${p.points?'ready':''}"><small>AVAILABLE ATTRIBUTE POINTS</small><b>${p.points}</b><button ${p.points<1?'disabled':''} onclick="gauntletLiveSpendPoints('${id}')">${p.points?'SPEND POINTS':'KEEP PROGRESSING'}</button></div></div><div class="live-card-attributes">${liveAttributeRows(p,false,id)}</div><div class="live-trait-panel"><div><small>CAREER TRAITS</small><b>${p.traits.length?`${p.traits.length} UNLOCKED`:'NONE YET'}</b></div>${p.traits.length?p.traits.map(t=>{const trait=liveTraitById(t);return trait?`<span><b>${trait.name}</b><small>${trait.description}</small></span>`:''}).join(''):'<p>Reach Level 10 to choose your first defining trait.</p>'}${p.milestones?`<button onclick="gauntletLiveMilestoneChoice('${id}')">CHOOSE MILESTONE TRAIT · ${p.milestones}</button>`:''}</div></div></section>`)
}
function gauntletLiveSpendPoints(id){
 const c=liveLoad();if(!c)return gauntletLiveHome();id=id||c.active;const w=liveFounder(id),p=liveProgress(id,c);
 render(`<section class="panel live-spend-screen"><div class="live-calendar-top"><button class="shell-back" onclick="gauntletLiveCareerCard('${id}')">← STAT CARD</button><span class="live-spend-counter">${p.points} POINT${p.points===1?'':'S'} AVAILABLE</span></div><div class="tv-kicker">SHAPE YOUR WRESTLER</div><h1>SPEND ATTRIBUTE POINTS</h1><div class="live-spend-identity">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div><small>${w.title}</small><h2>${w.name}</h2><span>OVR <b>${liveOverall(p)}</b></span></div></div><div class="live-spend-list">${liveAttributeRows(p,true,id)}</div><p>Each increase is permanent for this Career career. Potential caps preserve each wrestler's identity.</p><button class="btn live-primary" onclick="gauntletLiveCareerCard('${id}')">DONE</button></section>`)
}
function gauntletLiveSpendPoint(id,key,stay){const c=liveLoad(),p=liveProgress(id,c);if(!LIVE_PROGRESSION_STATS.includes(key)||p.points<1||p.stats[key]>=p.caps[key])return stay?gauntletLiveSpendPoints(id):gauntletLiveCareerCard(id);p.stats[key]++;p.points--;liveSave(c);stay?gauntletLiveSpendPoints(id):gauntletLiveCareerCard(id)}
function gauntletLiveMilestoneChoice(id){
 const c=liveLoad();if(!c)return gauntletLiveHome();id=id||c.active;const w=liveFounder(id),p=liveProgress(id,c);if(!p.milestones)return gauntletLiveCareerCard(id);
 const available=LIVE_TRAITS.filter(t=>!p.traits.includes(t.id));
 render(`<section class="panel live-milestone-screen"><button class="shell-back" onclick="gauntletLiveCareerCard('${id}')">← STAT CARD</button><div class="tv-kicker">LEVEL ${p.level} MILESTONE</div><h1>CHOOSE A CAREER TRAIT</h1><p>Define how ${w.name} develops. This choice is permanent for the current career.</p><div class="live-trait-choice-grid">${available.map(t=>`<button onclick="gauntletLiveSelectTrait('${id}','${t.id}')"><small>${t.stat.toUpperCase()} SPECIALITY</small><b>${t.name}</b><span>${t.description}</span></button>`).join('')}</div></section>`)
}
function gauntletLiveSelectTrait(id,traitId){const c=liveLoad(),p=liveProgress(id,c),trait=liveTraitById(traitId);if(!trait||p.milestones<1||p.traits.includes(traitId))return gauntletLiveMilestoneChoice(id);p.traits.push(traitId);p.milestones--;liveSave(c);gauntletLiveCareerCard(id)}
function gauntletLiveLevelCelebration(id,xp,nextDay,returnMode){
 const c=liveLoad(),w=liveFounder(id),p=liveProgress(id,c),ovr=liveOverall(p);
 render(`<section class="panel live-level-celebration"><div class="live-level-rays"></div><div class="tv-kicker">CAREER PROGRESSION</div><h1>LEVEL UP!</h1>${imageWithFallback(w,'victory','art-victory','postMatch')}<div class="live-celebration-level"><small>${w.name}</small><b>LEVEL ${p.level}</b><span>OVR ${ovr}</span></div><div class="live-celebration-rewards">${xp.pointsEarned?`<span><b>+${xp.pointsEarned}</b><small>ATTRIBUTE POINT${xp.pointsEarned===1?'':'S'}</small></span>`:''}${xp.milestonesEarned?`<span><b>TRAIT</b><small>MILESTONE CHOICE READY</small></span>`:''}</div><div class="live-result-actions">${p.milestones?`<button class="btn live-primary" onclick="gauntletLiveMilestoneChoice('${id}')">CHOOSE TRAIT</button>`:''}${p.points?`<button class="btn live-primary" onclick="gauntletLiveSpendPoints('${id}')">SPEND POINTS</button>`:''}<button class="btn secondary" onclick="${returnMode==='card'?`gauntletLiveCareerCard('${id}')`:'gauntletLiveCalendar()'}">${returnMode==='card'?'VIEW STAT CARD':`CONTINUE${nextDay?` TO ${nextDay}`:''}`}</button></div></section>`)
}
const _gauntletLiveResolveMatchB3=gauntletLiveResolveMatch;
gauntletLiveResolveMatch=function(strategy){
 const c=liveLoad();if(!c||!c.pending)return gauntletLiveCalendar();const activeId=c.active,wasSC=c.pending.isSupercard,beforeWins=c.wins,beforeLosses=c.losses;
 _gauntletLiveResolveMatchB3(strategy);
 // The original flow may continue into recruitment before the result screen, so compare the saved career totals.
 const updated=liveLoad();if(!updated)return;const p=liveProgress(activeId,updated);
 if(updated.wins>beforeWins){p.wins++;if(wasSC)p.supercardWins++}else if(updated.losses>beforeLosses)p.losses++;liveSave(updated)
};
const _gauntletLiveFinishMatchB3=gauntletLiveFinishMatch;
gauntletLiveFinishMatch=function(win,oppId,recruited){
 const c=liveLoad(),xp=c.lastXpAward||{amount:0,levels:0,level:liveProgress(c.active,c).level,pointsEarned:0,milestonesEarned:0},activeId=c.active;
 _gauntletLiveFinishMatchB3(win,oppId,recruited);
 if(xp.levels)setTimeout(()=>gauntletLiveLevelCelebration(activeId,xp,LIVE_DAYS[liveLoad()?.day||0].toUpperCase(),'calendar'),40);
};
const _gauntletLiveCompleteChoiceB3=gauntletLiveCompleteChoice;
gauntletLiveCompleteChoice=function(index,choices){
 const before=liveLoad(),activeId=before&&before.active;_gauntletLiveCompleteChoiceB3(index,choices);
 const after=liveLoad();if(before&&after){const p=liveProgress(activeId,after);if(p.level>(p.lastLevel||p.level)){const gained=p.level-p.lastLevel,pointsEarned=Array.from({length:gained},(_,i)=>p.lastLevel+i+1).filter(l=>l%10!==0).length,milestonesEarned=gained-pointsEarned;p.lastLevel=p.level;liveSave(after);setTimeout(()=>gauntletLiveLevelCelebration(activeId,{levels:gained,pointsEarned,milestonesEarned},LIVE_DAYS[after.day].toUpperCase(),'calendar'),40)}}
};
const _gauntletLiveCalendarB3=gauntletLiveCalendar;
gauntletLiveCalendar=function(){
 _gauntletLiveCalendarB3();const c=liveLoad();if(!c)return;const p=liveProgress(c.active,c),buttons=document.querySelector('.live-mini-stats');if(buttons){const first=buttons.querySelector('button');if(first)first.textContent=`MY CAREER · OVR ${liveOverall(p)}${p.points?` · ${p.points} POINT${p.points===1?'':'S'}`:''}`}
};
gauntletLiveStable=function(){const c=liveLoad();if(!c)return gauntletLiveHome();render(`<section class="panel live-stable-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">PERMANENT ROSTER</div><h1>YOUR STABLE</h1><p>Compare Overall Ratings, select your active wrestler or develop each career.</p><div class="live-stable-grid">${c.stable.map(id=>{const w=liveFounder(id),p=liveProgress(id,c);return `<article class="live-stable-card ${id===c.active?'active':''}">${imageWithFallback(w,'portrait','art-portrait','collection')}<span><small>${id===c.founder?'FOUNDER':'RECRUITED'} · LEVEL ${p.level}</small><b>${w.name}</b><em>OVR ${liveOverall(p)} · ${p.points?`${p.points} POINT${p.points===1?'':'S'} READY`:id===c.active?'ACTIVE WRESTLER':'STABLE MEMBER'}</em><div><button onclick="gauntletLiveSetActive('${id}')">${id===c.active?'ACTIVE':'SELECT'}</button><button onclick="gauntletLiveCareerCard('${id}')">MY CAREER</button></div></span></article>`}).join('')}</div></section>`)};



// CAREER 6.4 BUILD 5 — Living World, feuds, NPC encounters and full broadcast matches
const LIVE_NPC_ENCOUNTERS=[
 {npc:'katie-morgan',title:'Exclusive Interview',copy:'Katie Morgan wants your reaction to the week so far.',choices:[['Speak with confidence','Popularity +8','popularity',8],['Send a warning','Feud intensity +12','feud',12],['Keep it measured','Momentum +6','momentum',6]]},
 {npc:'scarlett-storm',title:'A Manager Approaches',copy:'Scarlett Storm believes your career needs a stronger presence at ringside.',choices:[['Accept her guidance','Scarlett joins your corner','manager','scarlett-storm'],['Ask for advice only','Momentum +8','momentum',8],['Decline respectfully','Popularity +4','popularity',4]]},
 {npc:'preston-cole',title:'Scouting Report',copy:'Preston Cole has studied your rival and found a weakness.',choices:[['Study the report','Next match bonus +5','bonus',5],['Focus on yourself','Technique +1','technique',1],['Reject the plan','Momentum +5','momentum',5]]},
 {npc:'graham-archer',title:'The Mastermind\'s Offer',copy:'Graham Archer offers to manipulate the situation in your favour.',choices:[['Accept the plan','Next match bonus +6','bonus',6],['Use the information only','Feud intensity +8','feud',8],['Walk away','Popularity +5','popularity',5]]},
 {npc:'tommy-sparks',title:'Fire Up the Crowd',copy:'Tommy Sparks wants to turn Saturday into a rally for your wrestler.',choices:[['Take the microphone','Popularity +10','popularity',10],['Challenge your rival','Feud intensity +10','feud',10],['Save your energy','Momentum +7','momentum',7]]},
 {npc:'johnny-cannon',title:'Cannon Calls You Out',copy:'Johnny Cannon questions whether you are ready for the Supercard spotlight.',choices:[['Prove him wrong','Momentum +9','momentum',9],['Laugh it off','Popularity +7','popularity',7],['Name your rival','Feud intensity +9','feud',9]]}
];
function liveEnsureWorld(c){
 c.world=c.world||{};c.world.feud=c.world.feud||null;c.world.news=Array.isArray(c.world.news)?c.world.news:[];
 c.world.nextMatchBonus=Number(c.world.nextMatchBonus)||0;c.world.lastResult=c.world.lastResult||null;c.world.manager=c.world.manager||null;
 return c;
}
const _liveLoadWorld=liveLoad;
liveLoad=function(){const c=_liveLoadWorld();if(!c)return null;liveEnsureWorld(c);liveSave(c);return c};
function liveStartFeud(c,opponentId,reason='A heated challenge begins a new rivalry.'){
 c.world.feud={opponent:opponentId,intensity:25,playerWins:0,rivalWins:0,chapter:1,reason};
}
function liveFeud(c){return c.world&&c.world.feud&&liveFounder(c.world.feud.opponent)?c.world.feud:null}
function liveFeudOpponent(c){const f=liveFeud(c);return f?liveFounder(f.opponent):null}
function liveAddNews(c,text){c.world.news.unshift({week:c.week,day:c.day,text});c.world.news=c.world.news.slice(0,12)}
function liveChooseStoryOpponent(c){
 const f=liveFeud(c);if(f&&(c.day===4||liveIsSupercard(c)))return liveFounder(f.opponent);
 const opp=liveOpponent(c);if(!f&&c.day===0&&c.week%4===1)liveStartFeud(c,opp.id,`${opp.name} interrupted the opening broadcast and demanded a fight.`);
 return liveFeudOpponent(c)||opp;
}
function gauntletLiveNews(){
 const c=liveLoad(),f=liveFeud(c),r=liveFeudOpponent(c),last=c.world.lastResult;
 const headline=last?(last.win?`${liveFounder(c.active).name} scores a major victory over ${liveFounder(last.opponent).name}.`:`${liveFounder(last.opponent).name} hands ${liveFounder(c.active).name} a setback.`):'A new week begins in Career.';
 const branch=last?(last.win?(f?`${r.name} claims the victory changes nothing and promises revenge.`:'The locker room has taken notice.'):(f?`${r.name} says the rivalry is now firmly under control.`:'The defeat creates pressure to respond.')):'Mike Sullivan previews the week ahead.';
 render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">TUESDAY · GAUNTLET NEWS</div><h1>FALLOUT</h1><div class="live-npc-scene">${npcImage('mike-sullivan','portrait')}<div><small>MIKE SULLIVAN</small><h2>${headline}</h2><p>${branch}</p></div></div>${f?`<div class="live-feud-banner"><small>ACTIVE FEUD</small><b>${liveFounder(c.active).name} vs ${r.name}</b><span>Intensity ${f.intensity}% · ${f.playerWins}-${f.rivalWins}</span></div>`:''}<button class="btn live-primary" onclick="gauntletLiveCompleteWorldDay('News coverage complete',30)">CONTINUE TO WEDNESDAY</button></section>`)
}
function gauntletLivePromo(){
 const c=liveLoad(),r=liveFeudOpponent(c)||liveChooseStoryOpponent(c);if(!liveFeud(c))liveStartFeud(c,r.id,'A direct promo challenge ignited the rivalry.');
 render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">THURSDAY · LIVE PROMO</div><h1>FACE TO FACE</h1><div class="live-promo-faceoff"><div>${imageWithFallback(liveFounder(c.active),'portrait','art-portrait','matchPortrait')}<b>${liveFounder(c.active).name}</b></div><strong>VS</strong><div>${imageWithFallback(r,'portrait','art-portrait','matchPortrait')}<b>${r.name}</b></div></div><div class="live-npc-scene compact">${npcImage('katie-morgan','portrait')}<div><small>KATIE MORGAN</small><p>“The microphone is yours. What do you say to ${r.name}?”</p></div></div><div class="live-choice-grid"><button onclick="gauntletLiveResolvePromo('respect')"><b>SHOW RESPECT</b><span>Popularity +8 · Feud +5</span></button><button onclick="gauntletLiveResolvePromo('warning')"><b>ISSUE A WARNING</b><span>Momentum +8 · Feud +12</span></button><button onclick="gauntletLiveResolvePromo('insult')"><b>MAKE IT PERSONAL</b><span>Popularity +5 · Feud +18</span></button></div></section>`)
}
function gauntletLiveResolvePromo(type){const c=liveLoad(),f=liveFeud(c);if(type==='respect'){c.popularity=liveClamp(c.popularity+8,0,100);f.intensity+=5}else if(type==='warning'){c.momentum=liveClamp(c.momentum+8,0,100);f.intensity+=12}else{c.popularity=liveClamp(c.popularity+5,0,100);f.intensity+=18}f.intensity=liveClamp(f.intensity,0,100);liveAddNews(c,`${liveFounder(c.active).name} delivered a ${type} promo against ${liveFeudOpponent(c).name}.`);const xp=liveAwardXp(c,c.active,40,'Rival promo');liveAdvanceDay(c);liveSave(c);render(`<section class="panel live-day-complete"><div class="tv-kicker">PROMO COMPLETE</div><h1>MESSAGE DELIVERED</h1><p>The rivalry with ${liveFeudOpponent(c).name} has intensified.</p><div class="live-xp-award"><b>+${xp.amount} XP</b><span>FEUD INTENSITY ${f.intensity}%</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE TO FRIDAY</button></section>`)}
function gauntletLiveEncounter(){const c=liveLoad(),enc=LIVE_NPC_ENCOUNTERS[(c.week+c.wins+c.losses)%LIVE_NPC_ENCOUNTERS.length],person=npc(enc.npc);c.world.pendingEncounter=enc;liveSave(c);render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">SATURDAY · RANDOM ENCOUNTER</div><h1>${enc.title}</h1><div class="live-npc-scene large">${npcImage(person.id,'full')}<div><small>${person.role||person.title}</small><h2>${person.name}</h2><p>${enc.copy}</p></div></div><div class="live-choice-grid">${enc.choices.map((x,i)=>`<button onclick="gauntletLiveResolveEncounter(${i})"><b>${x[0]}</b><span>${x[1]}</span></button>`).join('')}</div></section>`)}
function gauntletLiveResolveEncounter(i){const c=liveLoad(),enc=c.world.pendingEncounter,ch=enc&&enc.choices[i];if(!ch)return gauntletLiveCalendar();const type=ch[2],value=ch[3];if(type==='manager')c.world.manager=value;else if(type==='bonus')c.world.nextMatchBonus+=Number(value)||0;else if(type==='feud'){const f=liveFeud(c);if(f)f.intensity=liveClamp(f.intensity+(Number(value)||0),0,100)}else if(type==='technique'){const p=liveProgress(c.active,c);p.stats.technique=Math.min(p.caps.technique,p.stats.technique+1)}else c[type]=liveClamp((c[type]||0)+(Number(value)||0),0,100);const xp=liveAwardXp(c,c.active,35,'Random encounter');c.world.pendingEncounter=null;liveAdvanceDay(c);liveSave(c);render(`<section class="panel live-day-complete"><div class="tv-kicker">ENCOUNTER COMPLETE</div><h1>${ch[0].toUpperCase()}</h1><p>${ch[1]}</p><div class="live-xp-award"><b>+${xp.amount} XP</b><span>${c.world.manager?`${npc(c.world.manager).name} is now in your corner`:'The living world has changed'}</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE TO SUNDAY</button></section>`)}
function gauntletLiveCompleteWorldDay(label,xpAmount){const c=liveLoad(),xp=liveAwardXp(c,c.active,xpAmount,label);liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()}

const _liveDayDescription5=liveDayDescription;
liveDayDescription=function(c){if(c.day===1)return 'See the broadcast fallout and how the result changes your feud.';if(c.day===3)return 'Go face-to-face with your current rival in a branching promo.';if(c.day===5)return 'A random NPC encounter can change your career, feud or next match.';if(liveIsSupercard(c)){const r=liveFeudOpponent(c);return r?`The rivalry with ${r.name} reaches its Supercard conclusion.`:_liveDayDescription5(c)}return _liveDayDescription5(c)};
const _liveDayLabel5=liveDayLabel;
liveDayLabel=function(c,i){if(i===1)return 'NEWS & FALLOUT';if(i===3)return 'RIVAL PROMO';if(i===5)return 'RANDOM ENCOUNTER';return _liveDayLabel5(c,i)};

gauntletLiveBeginDay=function(){const c=liveLoad();if(!c)return gauntletLiveHome();if(c.day===0||c.day===4||liveIsSupercard(c))return gauntletLiveMatchCard();if(c.day===1)return gauntletLiveNews();if(c.day===2)return gauntletLiveChoice('TRAINING','Choose today’s development focus.',[['Power drills','Power +1','power',1],['Speed circuit','Speed +1','speed',1],['Technical clinic','Technique +1','technique',1]]);if(c.day===3)return gauntletLivePromo();if(c.day===5)return gauntletLiveEncounter();return gauntletLiveWeeklyReview()};

gauntletLiveMatchCard=function(){const c=liveLoad();if(!c)return gauntletLiveHome();const player=liveFounder(c.active),opp=liveChooseStoryOpponent(c),isSC=liveIsSupercard(c);c.pending={opponent:opp.id,isSupercard:isSC};liveSave(c);render(`<section class="panel live-match-card"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">${isSC?'MONTHLY SUPERCARD':LIVE_DAYS[c.day].toUpperCase()+' MATCH'}</div><h1>${isSC?'FEUD FINALE':'FEATURED SINGLES MATCH'}</h1><div class="live-versus"><div>${imageWithFallback(player,'portrait','art-portrait','matchPortrait')}<small>YOUR WRESTLER</small><b>${player.name}</b></div><strong>VS</strong><div>${imageWithFallback(opp,'portrait','art-portrait','matchPortrait')}<small>${isSC?'SUPERCARD RIVAL':'OPPONENT'}</small><b>${opp.name}</b></div></div>${liveFeud(c)?`<div class="live-feud-banner"><small>RIVALRY</small><b>Intensity ${liveFeud(c).intensity}%</b><span>${liveFeud(c).playerWins}-${liveFeud(c).rivalWins} in this feud</span></div>`:''}<p>This match uses the full broadcast engine with commentary and branching decisions.</p><button class="btn live-primary" onclick="gauntletLiveLaunchBroadcast()">BEGIN MATCH BROADCAST</button></section>`)};
function gauntletLiveLaunchBroadcast(){const c=liveLoad();if(!c||!c.pending)return gauntletLiveCalendar();const player=liveFounder(c.active),opp=liveFounder(c.pending.opponent);S={team:[player],opp:[opp],streak:2,chem:0,momentum:Math.round(c.momentum/20),wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:false,quickType:null,quickPlayer:null,quickSelections:[],manager:c.world.manager?MANAGERS.find(m=>m.id===c.world.manager):null,nextMatchBonus:c.world.nextMatchBonus||0,eventHistory:[],interviewCount:0,liveMode:true};c.world.nextMatchBonus=0;liveSave(c);match()}
function liveCompleteBroadcast(win){const c=liveLoad();if(!c||!c.pending)return gauntletLiveCalendar();const opp=liveFounder(c.pending.opponent),f=liveFeud(c),wasSC=c.pending.isSupercard;if(win){c.wins++;c.momentum=liveClamp(c.momentum+(wasSC?16:10),0,100);if(f){f.playerWins++;f.intensity=liveClamp(f.intensity+8,0,100)}}else{c.losses++;c.momentum=liveClamp(c.momentum-10,0,100);if(f){f.rivalWins++;f.intensity=liveClamp(f.intensity+10,0,100)}}const xpAmount=win?(wasSC?250:120):(wasSC?80:50),xp=liveAwardXp(c,c.active,xpAmount,win?'Broadcast victory':'Broadcast experience');c.lastXpAward=xp;c.world.lastResult={win,opponent:opp.id,week:c.week,supercard:wasSC};liveAddNews(c,win?`${liveFounder(c.active).name} defeated ${opp.name}.`:`${opp.name} defeated ${liveFounder(c.active).name}.`);if(wasSC&&f){liveAddNews(c,`${liveFounder(c.active).name} and ${opp.name} completed their rivalry at the Supercard.`);c.world.feud=null}c.history.unshift({week:c.week,day:c.day,opponent:opp.id,win,supercard:wasSC,xp:xpAmount,date:new Date().toISOString()});c.history=c.history.slice(0,40);liveSave(c);S.liveMode=false;gauntletLiveFinishMatch(win,opp.id,false)}
const _postMatchFlow5=postMatchFlow;
postMatchFlow=function(){if(S.liveMode)return liveCompleteBroadcast(true);return _postMatchFlow5()};
const _handleLoss5=handleLoss;
handleLoss=function(){if(S.liveMode)return liveCompleteBroadcast(false);return _handleLoss5()};

const _gauntletLiveCalendar5=gauntletLiveCalendar;
gauntletLiveCalendar=function(){_gauntletLiveCalendar5();const c=liveLoad();if(!c)return;const f=liveFeud(c),r=liveFeudOpponent(c),dash=document.querySelector('.live-career-dashboard');if(dash&&f)dash.insertAdjacentHTML('afterend',`<div class="live-feud-banner calendar-feud"><small>CURRENT FEUD</small><b>${liveFounder(c.active).name} vs ${r.name}</b><span>Intensity ${f.intensity}% · Supercard payoff in Week 4</span></div>`)};


/* Initial home render is intentionally deferred until every version override has loaded. */


/* Character Image Developer Mode 2.0
   Open with ?dev=images or press Ctrl+Shift+I. Tune full, portrait and victory independently. */
(function initCharacterImageDeveloperMode(){
 const DEV_KEY='ttg_image_manager_preview_v4';
 let panel=null,selectedId=Object.keys(CHARACTER_IMAGE_MANAGER)[0]||'',selectedType='full';
 function enabled(){return new URLSearchParams(location.search).get('dev')==='images'||localStorage.getItem('ttg_image_dev_enabled')==='1'}
 function config(id){return CHARACTER_IMAGE_MANAGER[id]}
 function transform(id,type){const c=config(id);if(!c)return null;c.transforms=c.transforms||{full:c.transform||{scale:1,x:0,y:0}};c.transforms[type]=c.transforms[type]||{...(c.transforms.full||{scale:1,x:0,y:0})};return c.transforms[type]}
 function apply(id,type){const t=transform(id,type);if(!t)return;document.querySelectorAll(`.wrestler-${CSS.escape(id)}.framework-custom[data-art-type="${type}"]`).forEach(img=>{img.style.setProperty('--custom-scale',t.scale??1);img.style.setProperty('--custom-x',`${t.x??0}px`);img.style.setProperty('--custom-y',`${t.y??0}px`)})}
 function applyAll(){Object.keys(CHARACTER_IMAGE_MANAGER).forEach(id=>['full','portrait','victory'].forEach(type=>apply(id,type)))}
 function loadPreview(){try{const saved=JSON.parse(localStorage.getItem(DEV_KEY)||'{}');Object.entries(saved).forEach(([id,types])=>{if(config(id))Object.entries(types).forEach(([type,t])=>Object.assign(transform(id,type),t))})}catch(e){}}
 function savePreview(){const out={};Object.entries(CHARACTER_IMAGE_MANAGER).forEach(([id,c])=>out[id]=c.transforms);localStorage.setItem(DEV_KEY,JSON.stringify(out))}
 function snippet(id){const c=config(id);const rows=['full','portrait','victory'].map(type=>{const t=transform(id,type);return `      ${type}: { scale: ${Number(t.scale).toFixed(2)}, x: ${Math.round(t.x)}, y: ${Math.round(t.y)} }`}).join(',\n');return `'${id}': {\n  assets: {\n    full: '${c.assets.full}',\n    portrait: '${c.assets.portrait}',\n    victory: '${c.assets.victory}'\n  },\n  transforms: {\n${rows}\n  }\n}`}
 function refresh(){if(!panel)return;const t=transform(selectedId,selectedType);panel.querySelector('[data-scale]').value=t.scale;panel.querySelector('[data-scale-out]').textContent=Number(t.scale).toFixed(2);panel.querySelector('[data-x]').value=t.x;panel.querySelector('[data-x-out]').textContent=Math.round(t.x);panel.querySelector('[data-y]').value=t.y;panel.querySelector('[data-y-out]').textContent=Math.round(t.y)}
 function setValue(key,value){transform(selectedId,selectedType)[key]=value;apply(selectedId,selectedType);refresh();savePreview()}
 function open(){
  if(panel){panel.remove();panel=null;return}
  localStorage.setItem('ttg_image_dev_enabled','1');
  panel=document.createElement('aside');panel.className='image-dev-panel';
  panel.innerHTML=`<div class="image-dev-head"><strong>IMAGE MANAGER 4.0</strong><button data-close>×</button></div><label>Wrestler<select data-wrestler>${Object.keys(CHARACTER_IMAGE_MANAGER).map(id=>`<option value="${id}">${WRESTLERS.find(w=>w.id===id)?.name||id}</option>`).join('')}</select></label><label>Artwork<select data-type><option value="full">Full / collection</option><option value="portrait">Match portrait</option><option value="victory">Victory</option></select></label><label>Scale <output data-scale-out></output><input data-scale type="range" min="0.50" max="2.50" step="0.01"></label><label>X <output data-x-out></output><input data-x type="range" min="-150" max="150" step="1"></label><label>Y <output data-y-out></output><input data-y type="range" min="-180" max="180" step="1"></label><div class="image-dev-actions"><button data-copy>Copy wrestler config</button><button data-roster>Roster status</button></div><div class="image-dev-actions"><button data-reset>Reset previews</button></div><small>Each artwork type is independent. Preview values persist only on this device.</small>`;
  document.body.appendChild(panel);
  panel.querySelector('[data-wrestler]').value=selectedId;
  panel.querySelector('[data-type]').value=selectedType;
  panel.querySelector('[data-wrestler]').onchange=e=>{selectedId=e.target.value;refresh()};
  panel.querySelector('[data-type]').onchange=e=>{selectedType=e.target.value;refresh()};
  panel.querySelector('[data-scale]').oninput=e=>setValue('scale',Number(e.target.value));
  panel.querySelector('[data-x]').oninput=e=>setValue('x',Number(e.target.value));
  panel.querySelector('[data-y]').oninput=e=>setValue('y',Number(e.target.value));
  panel.querySelector('[data-close]').onclick=open;
  panel.querySelector('[data-copy]').onclick=async e=>{try{await navigator.clipboard.writeText(snippet(selectedId));e.target.textContent='Copied';setTimeout(()=>e.target.textContent='Copy wrestler config',900)}catch(_){prompt('Copy this config:',snippet(selectedId))}};
  panel.querySelector('[data-roster]').onclick=()=>{open();rosterStatus()};
  panel.querySelector('[data-reset]').onclick=()=>{localStorage.removeItem(DEV_KEY);location.reload()};
  refresh();applyAll();
 }
 loadPreview();
 const observer=new MutationObserver(()=>applyAll());observer.observe(document.getElementById('app'),{childList:true,subtree:true});
 document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='i'){e.preventDefault();open()}});
 const dev=new URLSearchParams(location.search).get('dev');
 if(dev==='roster')setTimeout(rosterStatus,100);else if(enabled())setTimeout(open,250);
})();


/* CAREER 6.5 — LIVING WORLD / DYNAMIC TELEVISION */
Object.assign(SUPPORT_CAST,{
 'katie-morgan':{id:'katie-morgan',name:'Katie Morgan',role:'Backstage Interviewer',group:'Broadcast Team'},
 'veronica-vale':{id:'veronica-vale',name:'Veronica Vale',role:'General Manager',group:'Operations'},
 'coach-hank-dawson':{id:'coach-hank-dawson',name:'Coach Hank Dawson',role:'Performance Coach',group:'Operations'},
 'dr-lena-hart':{id:'dr-lena-hart',name:'Dr. Lena Hart',role:'Medical Director',group:'Operations'},
 'leon-ward':{id:'leon-ward',name:'Leon Ward',role:'Head of Security',group:'Operations'},
 'raymond-briggs':{id:'raymond-briggs',name:'Raymond Briggs',role:'Match Producer',group:'Operations'},
 'ava-cross':{id:'ava-cross',name:'Ava Cross',role:'Social Media Reporter',group:'Broadcast Team'},
 'ethan-brooks':{id:'ethan-brooks',name:'Ethan Brooks',role:'Ring Announcer',group:'Broadcast Team'}
});
delete SUPPORT_CAST['kate-morgan'];
const LIVE_SHOWS={0:{name:'MONDAY NIGHT MAYHEM',short:'MAYHEM'},3:{name:'THURSDAY NIGHT THROWDOWN',short:'THROWDOWN'}};
const LIVE_SUPERCARDS=['Collision Course','Final Reckoning','Crossfire','High Stakes','Breaking Point','Last Stand','Full Impact','Zero Hour','Aftershock','Uprising','Collision Point','No Surrender'];
const LIVE_SEGMENTS=['promo','backstage-attack','interview','contract-signing','commentary-confrontation','locker-room','video-message','medical-angle'];
function liveMonthWeek(c){return ((c.week-1)%4)+1}
function liveMonthSlot(c,day=c.day){return (liveMonthWeek(c)-1)*2+(day===3?1:0)}
function liveCurrentSupercard(c){liveEnsureWorld(c);return c.world.supercardName||LIVE_SUPERCARDS[(c.month-1)%LIVE_SUPERCARDS.length]}
function liveShuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function liveOtherPool(c,exclude=[]){return WRESTLERS.filter(w=>w.id!==c.active&&!exclude.includes(w.id))}
function livePickDifferent(c,exclude=[]){const pool=liveOtherPool(c,exclude);return one(pool)}
function liveGenerateMonthlyPlan(c){
 c.world=c.world||{};
 const f=liveFeud(c),rival=f&&f.opponent;
 let types=liveShuffle(['singles','singles','singles','singles','tag','tag','multi','segment']);
 // Randomly trade one or two matches for story segments while preserving all caps.
 if(Math.random()<.75)types[Math.floor(Math.random()*types.length)]='segment';
 if(Math.random()<.35){const choices=types.map((x,i)=>x!=='segment'?i:-1).filter(i=>i>=0);if(choices.length)types[one(choices)]='segment'}
 let rivalSingles=0;
 c.world.monthPlan=types.map((type,index)=>{
  const day=index%2===0?0:3, week=Math.floor(index/2)+1;
  if(type==='segment')return {type,segment:one(LIVE_SEGMENTS),week,day};
  if(type==='tag'){
   const partner=livePickDifferent(c,[rival]);
   const opp1=(rival&&Math.random()<.45)?liveFounder(rival):livePickDifferent(c,[partner?.id]);
   const opp2=livePickDifferent(c,[partner?.id,opp1?.id]);
   return {type,week,day,partner:partner.id,opponents:[opp1.id,opp2.id]};
  }
  if(type==='multi'){
   const count=Math.random()<.5?3:4, opponents=[];
   while(opponents.length<count-1){const w=livePickDifferent(c,opponents);if(w&&!opponents.includes(w.id))opponents.push(w.id)}
   return {type,week,day,opponents};
  }
  let opp;
  if(rival&&rivalSingles<1&&index>1&&Math.random()<.35){opp=liveFounder(rival);rivalSingles++}
  else opp=livePickDifferent(c,[rival]);
  return {type:'singles',week,day,opponents:[opp.id]};
 });
 c.world.supercardName=LIVE_SUPERCARDS[(c.month-1)%LIVE_SUPERCARDS.length];
 liveSave(c);
}
const _liveEnsureWorld65=liveEnsureWorld;
liveEnsureWorld=function(c){
 _liveEnsureWorld65(c);
 c.version=6;
 c.world.onboardingSeen=!!c.world.onboardingSeen;
 c.world.injury=c.world.injury||null;
 c.world.katieThisWeek=c.world.katieThisWeek||0;
 c.world.worldStories=Array.isArray(c.world.worldStories)?c.world.worldStories:[];
 c.world.showSeen=c.world.showSeen||{};
 if(!Array.isArray(c.world.monthPlan)||c.world.planMonth!==c.month){c.world.planMonth=c.month;liveGenerateMonthlyPlan(c)}
 return c.world;
};
const _liveLoad65=liveLoad;
liveLoad=function(){const c=_liveLoad65();if(c){liveEnsureWorld(c);liveSave(c)}return c};

gauntletLiveNewCareer=function(){const c=liveLoad();if(c&&!confirm('Start a new Career career and replace the current save?'))return;localStorage.removeItem(LIVE_SAVE_KEY);gauntletLiveIntro(0)};
function gauntletLiveIntro(page=0){
 setActiveGameMode('career');
 const slides=[
  {k:'WELCOME TO CAREER',h:'THIS IS YOUR CAREER',p:'I am Veronica Vale, General Manager of LEGACY Pro Wrestling. You will guide one wrestler through a living wrestling world where every victory, injury, rivalry and decision changes what happens next.',img:'full'},
  {k:'TWO LIVE SHOWS EVERY WEEK',h:'MAYHEM & THROWDOWN',p:'Monday Night Mayhem and Thursday Night Throwdown always feature a match card or a major replacement segment. The rest of the week reacts naturally to the stories created on television.',img:'portrait'},
  {k:'FOUR WEEKS · ONE RIVALRY',h:'WIN THE SUPERCARD',p:'Each month builds toward a named Supercard. The Supercard result decides the feud. Win and your rival joins your permanent stable; lose and you must try again in a new story.',img:'full'},
  {k:'BUILD YOUR ROSTER',h:'CHOOSE YOUR WRESTLER',p:'After every Supercard you may continue with your current wrestler or switch to anyone you have unlocked. Choose the first wrestler who will represent your stable.',img:'portrait'}
 ];
 const s=slides[Math.max(0,Math.min(page,slides.length-1))],last=page===slides.length-1;
 render(`<section class="panel live-onboarding live-onboarding-page-${page}"><div class="live-onboarding-art">${npcImage('veronica-vale',s.img)}</div><div class="live-onboarding-copy"><div class="tv-kicker">${s.k}</div><h1>${s.h}</h1><p>${s.p}</p><div class="live-onboarding-progress">${slides.map((_,i)=>`<span class="${i<=page?'on':''}"></span>`).join('')}</div><button class="btn live-primary" onclick="${last?'gauntletLiveFounderSelect()':`gauntletLiveIntro(${page+1})`}">${last?'SELECT STARTING WRESTLER':'CONTINUE'}</button></div></section>`)
}
const _gauntletLiveChooseFounder65=gauntletLiveChooseFounder;
gauntletLiveChooseFounder=function(id){
 const w=liveFounder(id);if(!w||!LIVE_FOUNDERS.includes(id))return gauntletLiveFounderSelect();
 const c={version:6,founder:id,active:id,stable:[id],week:1,month:1,day:0,wins:0,losses:0,momentum:50,popularity:20,training:{power:0,speed:0,technique:0,charisma:0,recovery:0},history:[],created:new Date().toISOString(),world:{onboardingSeen:true,news:[],worldStories:[],katieThisWeek:0}};
 liveEnsureWorld(c);liveStartFeud(c,livePickDifferent(c).id,'Veronica Vale has selected your first monthly rival.');liveGenerateMonthlyPlan(c);liveSave(c);gauntletLiveCalendar();
};
function livePlanItem(c){if(liveIsSupercard(c))return {type:'supercard'};if(c.day===0||c.day===3)return c.world.monthPlan[liveMonthSlot(c)]||{type:'segment',segment:'promo'};return null}
function liveShowName(c){return LIVE_SHOWS[c.day]?.name||LIVE_DAYS[c.day].toUpperCase()}
function liveSegmentTitle(seg){return ({promo:'In-Ring Promo','backstage-attack':'Backstage Attack','interview':'Exclusive Interview','contract-signing':'Contract Signing','commentary-confrontation':'Commentary Desk Confrontation','locker-room':'Locker-Room Incident','video-message':'Video Message','medical-angle':'Medical Update'})[seg]||'Major Story Segment'}
function liveDayLabel65(c,index){
 if(index===6&&c.week%4===0)return liveCurrentSupercard(c).toUpperCase();
 if(index===0||index===3){const item=(c.world.monthPlan||[])[(liveMonthWeek(c)-1)*2+(index===3?1:0)];return item?.type==='segment'?liveSegmentTitle(item.segment).toUpperCase():LIVE_SHOWS[index].short;
 }
 if(index===6)return 'WEEKLY REVIEW';
 if(c.world.injury&&index===c.day)return 'MEDICAL EVALUATION';
 return ['','WORLD FALLOUT','CAREER DEVELOPMENT','','RECOVERY & MEDIA','LIVING WORLD',''][index];
}
liveDayLabel=liveDayLabel65;
liveDayDescription=function(c){
 if(c.day===0||c.day===3){const item=livePlanItem(c);return `${liveShowName(c)} presents ${item.type==='segment'?liveSegmentTitle(item.segment):item.type==='tag'?'a featured tag-team match':item.type==='multi'?'a multi-person showcase':'a featured singles match'}.`}
 if(liveIsSupercard(c))return `${liveCurrentSupercard(c)} ends the monthly rivalry. Victory decides the feud and unlocks your opponent.`;
 if(c.world.injury)return 'Dr. Lena Hart must evaluate the injury suffered in your last match before anything else can happen.';
 return 'Today is selected dynamically from training, interviews, medical care, world news and unexpected encounters.'
};
const _gauntletLiveCalendar65=gauntletLiveCalendar;
gauntletLiveCalendar=function(){
 const c=liveLoad();if(!c)return gauntletLiveHome();const w=liveFounder(c.active),f=liveFeud(c),r=liveFeudOpponent(c);
 render(`<section class="panel live-calendar-screen"><div class="live-calendar-top"><button class="shell-back" onclick="home()">← MAIN MENU</button><button class="shell-back" onclick="gauntletLiveHome()">CAREER MENU</button></div><div class="tv-kicker">MONTH ${c.month} · WEEK ${liveMonthWeek(c)} · ${liveCurrentSupercard(c).toUpperCase()}</div><h1>CAREER</h1><div class="live-career-dashboard"><div class="live-career-hero">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div><small>ACTIVE WRESTLER</small><b>${w.name}</b><span>${c.wins}-${c.losses} record · ${c.stable.length} stable members</span></div></div><div class="live-mini-stats"><span><small>MOMENTUM</small><b>${c.momentum}</b></span><span><small>POPULARITY</small><b>${c.popularity}</b></span><button onclick="gauntletLiveStable()">MANAGE STABLE</button></div></div>${f?`<div class="live-feud-banner calendar-feud"><div>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div><span><small>CURRENT FEUD</small><b>${w.name} vs ${r.name}</b><em>${liveCurrentSupercard(c)} · Intensity ${f.intensity}%</em></span><div>${imageWithFallback(r,'portrait','art-portrait','matchPortrait')}</div></div>`:''}<div class="live-week-strip">${LIVE_DAYS.map((d,i)=>`<div class="live-day ${i<c.day?'complete':''} ${i===c.day?'current':''} ${i===6&&liveIsSupercard({...c,day:i})?'supercard':''}"><small>${d.slice(0,3).toUpperCase()}</small><b>${i===0?'M':i===3?'T':i+1}</b><span>${liveDayLabel(c,i)}</span></div>`).join('')}</div><div class="live-today"><small>TODAY · ${LIVE_DAYS[c.day].toUpperCase()}</small><h2>${liveDayLabel(c,c.day)}</h2><p>${liveDayDescription(c)}</p><button class="btn live-primary" onclick="gauntletLiveBeginDay()">BEGIN</button></div></section>`)
};
function liveSimulateWorld(c){
 const pool=liveShuffle(liveOtherPool(c)).slice(0,6),stories=[];
 for(let i=0;i+1<pool.length;i+=2){const a=pool[i],b=pool[i+1],winner=Math.random()<.5?a:b,loser=winner===a?b:a;stories.push({a:a.id,b:b.id,winner:winner.id,text:`${winner.name} defeated ${loser.name} in a closely watched match.`})}
 if(Math.random()<.55){const a=one(pool),b=one(pool.filter(x=>x.id!==a.id));stories.push({a:a.id,b:b.id,text:`Tension exploded when ${a.name} confronted ${b.name} after the bell.`})}
 c.world.worldStories=stories;stories.forEach(s=>liveAddNews(c,s.text));return stories
}
function gauntletLiveShowIntro(){
 const c=liveLoad(),item=livePlanItem(c),stories=liveSimulateWorld(c),venue=one(VENUES),attendance=Math.floor(rnd(11000,20500)).toLocaleString();liveSave(c);
 const card=stories.slice(0,2).map(s=>`<li>${s.text}</li>`).join('');
 render(`<section class="panel live-show-intro"><div class="show-announcer-art">${npcImage('ethan-brooks','full')}</div><div class="show-intro-copy"><div class="tv-kicker">LIVE FROM ${venue.toUpperCase()} · ${attendance} IN ATTENDANCE</div><h1>${liveIsSupercard(c)?liveCurrentSupercard(c).toUpperCase():liveShowName(c)}</h1><p class="show-intro-line">Ethan Brooks welcomes the audience to tonight's broadcast.</p><div class="show-card-list"><small>ALSO TONIGHT</small><ul>${card||'<li>Major developments from across the LPW world.</li>'}</ul><b>YOUR SEGMENT · ${liveIsSupercard(c)?'FEUD FINALE':item.type==='segment'?liveSegmentTitle(item.segment):item.type.toUpperCase()+' MATCH'}</b></div><button class="btn live-primary" onclick="gauntletLiveRunShowSegment()">START THE SHOW</button></div></section>`)
}
function gauntletLiveRunShowSegment(){const c=liveLoad(),item=livePlanItem(c);if(liveIsSupercard(c)||['singles','tag'].includes(item.type))return gauntletLiveMatchCard65();if(item.type==='multi')return gauntletLiveMultiMatch(item);return gauntletLiveStorySegment(item.segment)}
gauntletLiveBeginDay=function(){const c=liveLoad();if(!c)return gauntletLiveHome();if(c.day===0||c.day===3||liveIsSupercard(c))return gauntletLiveShowIntro();if(c.world.injury)return gauntletLiveDoctorVisit();return gauntletLiveDynamicDay()};
function gauntletLiveDynamicDay(){
 const c=liveLoad(),f=liveFeud(c),r=liveFeudOpponent(c),roll=Math.random();
 if(c.world.katieThisWeek<2&&(roll<.34||c.day===1)){c.world.katieThisWeek++;liveSave(c);return gauntletLiveKatieInterview()}
 if(roll<.55)return gauntletLiveWorldRecap();
 if(roll<.76)return gauntletLiveTraining65();
 return gauntletLiveEncounter65();
}
function gauntletLiveKatieInterview(){
 const c=liveLoad(),r=liveFeudOpponent(c),last=c.world.lastResult;
 const qs=[
  `${r.name} says you are avoiding a decisive confrontation. What is your response?`,
  last?`${last.win?'You won':'You lost'} your last match. What did that result prove about your path to ${liveCurrentSupercard(c)}?`:`What message do you want to send before ${liveCurrentSupercard(c)}?`,
  `Your rivalry with ${r.name} is becoming personal. Where does competition end and hatred begin?`,
  `The rest of the roster is watching this feud closely. Do you feel pressure to represent your stable?`,
  `Would defeating ${r.name} and recruiting them change the balance of power in Career?`
 ];
 render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">EXCLUSIVE · BACKSTAGE</div><h1>KATIE MORGAN INTERVIEW</h1><div class="live-npc-scene large">${npcImage('katie-morgan','full')}<div><small>BACKSTAGE INTERVIEWER</small><h2>Katie Morgan</h2><p>“${one(qs)}”</p></div></div><div class="live-choice-grid"><button onclick="gauntletLiveResolveDynamic('popularity',8,'You answered with confidence.')"><b>CONFIDENT</b><span>Popularity +8</span></button><button onclick="gauntletLiveResolveDynamic('momentum',8,'You delivered a direct warning.')"><b>DIRECT WARNING</b><span>Momentum +8</span></button><button onclick="gauntletLiveResolveDynamic('feud',12,'You made the rivalry deeply personal.')"><b>MAKE IT PERSONAL</b><span>Feud +12</span></button></div></section>`)
}
function gauntletLiveWorldRecap(){
 const c=liveLoad();if(!c.world.worldStories.length)liveSimulateWorld(c);const stories=c.world.worldStories;
 render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${stories[0]?.text||'The wrestling world continues to move around your career.'}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${stories[1]?.text||'Every result creates a new opportunity—and a new enemy.'}</p></div></div><div class="live-world-results">${stories.slice(2).map(s=>`<article><span>${s.a?imageWithFallback(liveFounder(s.a),'portrait','art-portrait','matchPortrait'):''}</span><p>${s.text}</p>${s.b?`<span>${imageWithFallback(liveFounder(s.b),'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`).join('')}</div><button class="btn live-primary" onclick="gauntletLiveResolveDynamic('popularity',3,'You studied the wider wrestling world.')">CONTINUE</button></section>`)
}
function gauntletLiveTraining65(){render(`<section class="panel live-world-screen"><div class="tv-kicker">PERFORMANCE CENTRE</div><h1>TRAINING SESSION</h1><div class="live-npc-scene large">${npcImage('coach-hank-dawson','full')}<div><small>PERFORMANCE COACH</small><h2>Coach Hank Dawson</h2><p>“Pick one area. We improve it properly or we do not waste the day.”</p></div></div><div class="live-choice-grid"><button onclick="gauntletLiveResolveDynamic('power',1,'Power training complete.')"><b>POWER DRILLS</b><span>Power +1</span></button><button onclick="gauntletLiveResolveDynamic('speed',1,'Speed training complete.')"><b>SPEED CIRCUIT</b><span>Speed +1</span></button><button onclick="gauntletLiveResolveDynamic('technique',1,'Technical training complete.')"><b>TECHNICAL CLINIC</b><span>Technique +1</span></button></div></section>`)}
function gauntletLiveEncounter65(){const people=['ava-cross','raymond-briggs','leon-ward','scarlett-storm','preston-cole','graham-archer','tommy-sparks'],id=one(people),p=npc(id);render(`<section class="panel live-world-screen"><div class="tv-kicker">UNEXPECTED ENCOUNTER</div><h1>${p.role.toUpperCase()}</h1><div class="live-npc-scene large">${npcImage(id,'full')}<div><small>${p.role}</small><h2>${p.name}</h2><p>${id==='raymond-briggs'?'Raymond offers a detailed match plan for your next appearance.':id==='leon-ward'?'Security has learned that your rival may be planning another attack.':id==='ava-cross'?'Ava wants a short clip for the fans before the next live show.':'A new opportunity could change the direction of your career.'}</p></div></div><div class="live-choice-grid"><button onclick="gauntletLiveResolveDynamic('momentum',6,'The encounter increased your momentum.')"><b>ACCEPT</b><span>Momentum +6</span></button><button onclick="gauntletLiveResolveDynamic('popularity',6,'The encounter increased your popularity.')"><b>MAKE IT PUBLIC</b><span>Popularity +6</span></button></div></section>`)}
function gauntletLiveResolveDynamic(type,val,msg){const c=liveLoad();if(type==='feud'){const f=liveFeud(c);if(f)f.intensity=liveClamp(f.intensity+val,0,100)}else if(['power','speed','technique','charisma','recovery'].includes(type)){const p=liveProgress(c.active,c);p.stats[type]=Math.min(p.caps[type],p.stats[type]+val)}else c[type]=liveClamp((c[type]||0)+val,0,100);liveAwardXp(c,c.active,35,'Career activity');liveAdvanceDay(c);liveSave(c);render(`<section class="panel live-day-complete"><div class="tv-kicker">DAY COMPLETE</div><h1>${msg.toUpperCase()}</h1><div class="live-result-cast">${npcImage(type==='feud'?'katie-morgan':'veronica-vale','portrait')}</div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)}
function gauntletLiveDoctorVisit(){const c=liveLoad();render(`<section class="panel live-world-screen"><div class="tv-kicker">MEDICAL EVALUATION</div><h1>DOCTOR'S ORDERS</h1><div class="live-npc-scene large">${npcImage('dr-lena-hart','full')}<div><small>MEDICAL DIRECTOR</small><h2>Dr. Lena Hart</h2><p>“The injury is manageable, but the decision you make now will affect the next show.”</p></div></div><div class="live-choice-grid"><button onclick="gauntletLiveClearInjury('rest')"><b>REST & RECOVER</b><span>Momentum -3 · safer return</span></button><button onclick="gauntletLiveClearInjury('push')"><b>COMPETE THROUGH IT</b><span>Momentum +5 · future risk</span></button></div></section>`)}
function gauntletLiveClearInjury(type){const c=liveLoad();c.world.injury=null;c.momentum=liveClamp(c.momentum+(type==='push'?5:-3),0,100);liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()}
function gauntletLiveStorySegment(seg){
 const c=liveLoad(),r=liveFeudOpponent(c),player=liveFounder(c.active);
 const npcId=seg==='contract-signing'?'veronica-vale':seg==='backstage-attack'?'leon-ward':seg==='commentary-confrontation'?'mike-sullivan':seg==='interview'?'katie-morgan':'katie-morgan';
 const copy={promo:`${player.name} and ${r.name} exchange final warnings in the ring.`, 'backstage-attack':`${r.name} ambushes ${player.name} in the arena corridor before security arrives.`,interview:`Katie Morgan attempts to get answers as ${r.name} interrupts the interview.`, 'contract-signing':`Veronica Vale oversees the signing for ${liveCurrentSupercard(c)}.`, 'commentary-confrontation':`${r.name} joins commentary and provokes ${player.name} from ringside.`, 'locker-room':`A confrontation erupts inside the locker room and divides the roster.`, 'video-message':`${r.name} sends a threatening message from an undisclosed location.`, 'medical-angle':`The rivalry targets an existing weakness and forces a medical update.`}[seg];
 render(`<section class="panel live-story-segment"><div class="story-character-left">${npcImage(npcId,'full')}</div><div class="story-centre"><div class="tv-kicker">${liveShowName(c)} · ${liveSegmentTitle(seg).toUpperCase()}</div><h1>${liveSegmentTitle(seg)}</h1><div class="story-rival-images"><div>${imageWithFallback(player,'full','art-full','quickMatch')}<b>${player.name}</b></div><div>${imageWithFallback(r,'full','art-full','quickMatch')}<b>${r.name}</b></div></div><p>${copy}</p><div class="live-choice-grid"><button onclick="gauntletLiveResolveSegment('${seg}','calm')"><b>STAY CONTROLLED</b><span>Popularity +6</span></button><button onclick="gauntletLiveResolveSegment('${seg}','fight')"><b>ESCALATE</b><span>Momentum +6 · Feud +10</span></button></div></div></section>`)
}
function gauntletLiveResolveSegment(seg,choice){const c=liveLoad(),f=liveFeud(c);if(choice==='fight'){c.momentum=liveClamp(c.momentum+6,0,100);if(f)f.intensity=liveClamp(f.intensity+10,0,100)}else c.popularity=liveClamp(c.popularity+6,0,100);if(seg==='backstage-attack'&&Math.random()<.35)c.world.injury={severity:'minor'};liveAwardXp(c,c.active,45,'Television segment');liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()}
function gauntletLiveMatchCard65(){
 const c=liveLoad(),item=livePlanItem(c),player=liveFounder(c.active),isSC=liveIsSupercard(c),r=liveFeudOpponent(c);
 let type=isSC?'singles':item.type,opponents=isSC?[r.id]:item.opponents,partner=item.partner;
 c.pending={opponent:opponents[0],opponents,type,partner,isSupercard:isSC};liveSave(c);
 const roster=[player,...(partner?[liveFounder(partner)]:[]),...opponents.map(liveFounder)];
 render(`<section class="panel live-match-card"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">${isSC?liveCurrentSupercard(c).toUpperCase():liveShowName(c)}</div><h1>${isSC?'FEUD FINALE':type==='tag'?'TAG TEAM MATCH':'FEATURED SINGLES MATCH'}</h1><div class="live-match-lineup ${type}">${roster.map((w,i)=>`<div>${imageWithFallback(w,'full','art-full','quickMatch')}<small>${i===0?'YOUR WRESTLER':i===1&&partner?'YOUR PARTNER':'OPPONENT'}</small><b>${w.name}</b></div>`).join('')}</div><div class="live-npc-scene compact">${npcImage('raymond-briggs','portrait')}<div><small>MATCH PRODUCER</small><p>“Use the broadcast decisions to control the pace. The result will shape what happens tomorrow.”</p></div></div><button class="btn live-primary" onclick="gauntletLiveLaunchBroadcast65()">BEGIN MATCH BROADCAST</button></section>`)
}
function gauntletLiveLaunchBroadcast65(){const c=liveLoad(),p=c.pending,player=liveFounder(c.active);const team=p.type==='tag'?[player,liveFounder(p.partner)]:[player],opp=p.opponents.map(liveFounder);S={team,opp,streak:2,chem:0,momentum:Math.round(c.momentum/20),wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:false,quickType:null,quickPlayer:null,quickSelections:[],manager:c.world.manager?MANAGERS.find(m=>m.id===c.world.manager):null,nextMatchBonus:c.world.nextMatchBonus||0,eventHistory:[],interviewCount:0,liveMode:true};c.world.nextMatchBonus=0;liveSave(c);match()}
function gauntletLiveMultiMatch(item){const c=liveLoad(),player=liveFounder(c.active),opps=item.opponents.map(liveFounder);c.pending={opponent:opps[0].id,opponents:item.opponents,type:'multi',isSupercard:false};liveSave(c);render(`<section class="panel live-match-card"><div class="tv-kicker">${liveShowName(c)} · MULTI-PERSON SHOWCASE</div><h1>${opps.length===2?'TRIPLE THREAT':'FATAL FOUR-WAY'}</h1><div class="live-match-lineup multi">${[player,...opps].map(w=>`<div>${imageWithFallback(w,'full','art-full','quickMatch')}<b>${w.name}</b></div>`).join('')}</div><p>Choose the central strategy for this chaotic match.</p><div class="live-choice-grid"><button onclick="gauntletLiveResolveMulti('patient')"><b>WAIT FOR AN OPENING</b><span>Safer approach</span></button><button onclick="gauntletLiveResolveMulti('attack')"><b>CONTROL THE CHAOS</b><span>Higher momentum</span></button></div></section>`)}
function gauntletLiveResolveMulti(style){const c=liveLoad(),chance=.48+c.momentum/250+(style==='patient'?.07:0),win=Math.random()<chance,opp=liveFounder(c.pending.opponent);c.wins+=win?1:0;c.losses+=win?0:1;c.momentum=liveClamp(c.momentum+(win?9:-7),0,100);c.world.lastResult={win,opponent:opp.id,week:c.week,supercard:false};liveAwardXp(c,c.active,win?110:55,'Multi-person match');liveAdvanceDay(c);liveSave(c);render(`<section class="panel live-day-complete ${win?'live-win':'live-loss'}"><div class="tv-kicker">MULTI-PERSON RESULT</div><h1>${win?'VICTORY':'DEFEAT'}</h1>${imageWithFallback(win?liveFounder(c.active):opp,'victory','art-full','resultVictory')}<p>${win?'You survived the chaos and scored the deciding fall.':'Another wrestler claimed the deciding fall.'}</p><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)}
const _liveCompleteBroadcast65=liveCompleteBroadcast;
liveCompleteBroadcast=function(win){
 const c=liveLoad();if(!c||!c.pending)return gauntletLiveCalendar();const p=c.pending,opp=liveFounder(p.opponent),f=liveFeud(c),wasSC=p.isSupercard;
 if(win){c.wins++;c.momentum=liveClamp(c.momentum+(wasSC?16:10),0,100);if(f)f.playerWins++}else{c.losses++;c.momentum=liveClamp(c.momentum-10,0,100);if(f)f.rivalWins++}
 if(f)f.intensity=liveClamp(f.intensity+(win?8:10),0,100);
 const xpAmount=win?(wasSC?250:120):(wasSC?80:50);c.lastXpAward=liveAwardXp(c,c.active,xpAmount,win?'Broadcast victory':'Broadcast experience');c.world.lastResult={win,opponent:opp.id,week:c.week,supercard:wasSC};
 if(!wasSC&&Math.random()<.14)c.world.injury={severity:'minor'};
 c.history.unshift({week:c.week,day:c.day,opponent:opp.id,win,supercard:wasSC,xp:xpAmount,date:new Date().toISOString()});c.history=c.history.slice(0,60);
 if(wasSC){S.liveMode=false;return gauntletLiveSupercardResult(win,opp.id)}
 liveAdvanceDay(c);liveSave(c);S.liveMode=false;gauntletLiveFinishMatch65(win,opp.id)
};
function gauntletLiveFinishMatch65(win,oppId){const c=liveLoad(),opp=liveFounder(oppId),xp=c.lastXpAward||{amount:0};c.lastXpAward=null;liveSave(c);render(`<section class="panel live-day-complete ${win?'live-win':'live-loss'}"><div class="tv-kicker">MATCH RESULT</div><h1>${win?'VICTORY':'DEFEAT'}</h1><div class="live-result-images">${imageWithFallback(liveFounder(c.active),win?'victory':'full','art-full','resultVictory')}${imageWithFallback(opp,win?'full':'victory','art-full','resultVictory')}</div><p>${win?`${liveFounder(c.active).name} defeated ${opp.name}.`:`${opp.name} defeated ${liveFounder(c.active).name}.`}</p><div class="live-xp-award"><b>+${xp.amount} XP</b><span>${c.world.injury?'An injury will require medical attention tomorrow.':'The world will react tomorrow.'}</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)}
function gauntletLiveSupercardResult(win,oppId){
 const c=liveLoad(),opp=liveFounder(oppId),name=liveCurrentSupercard(c);if(win&&!c.stable.includes(oppId))c.stable.push(oppId);c.world.lastFeud={opponent:oppId,won:win,supercard:name};c.world.feud=null;c.world.monthPlan=null;c.world.katieThisWeek=0;liveAdvanceDay(c);liveSave(c);
 render(`<section class="panel live-supercard-result ${win?'live-win':'live-loss'}"><div class="supercard-result-art">${imageWithFallback(liveFounder(c.active),win?'victory':'full','art-full','resultVictory')}${imageWithFallback(opp,win?'full':'victory','art-full','resultVictory')}</div><div><div class="tv-kicker">${name.toUpperCase()} · FEUD COMPLETE</div><h1>${win?'FEUD WON':'FEUD LOST'}</h1><p>${win?`${opp.name} has been unlocked and added to your stable.`:`${opp.name} won the decisive match. The television tally does not override the Supercard result.`}</p><button class="btn live-primary" onclick="gauntletLiveMonthRosterChoice()">CHOOSE NEXT MONTH'S WRESTLER</button></div></section>`)
}
function gauntletLiveMonthRosterChoice(){const c=liveLoad();render(`<section class="panel live-founder-screen"><div class="tv-kicker">NEW MONTH · NEW OPPORTUNITY</div><h1>WHO REPRESENTS YOUR STABLE?</h1><p class="sub">Continue with your current wrestler or change to any unlocked character.</p><div class="live-founder-grid">${c.stable.map(id=>{const w=liveFounder(id);return `<button class="live-founder-card" onclick="gauntletLiveStartNextMonth('${id}')">${imageWithFallback(w,'full','art-full','quickMatch')}<span><small>${id===c.active?'CURRENT WRESTLER':'STABLE MEMBER'}</small><b>${w.name}</b><em>${w.signature}</em></span></button>`}).join('')}</div></section>`)}
function gauntletLiveStartNextMonth(id){const c=liveLoad();c.active=id;c.world.katieThisWeek=0;const opp=livePickDifferent(c,c.stable);liveStartFeud(c,opp.id,'A new monthly rivalry begins.');liveGenerateMonthlyPlan(c);liveSave(c);gauntletLiveCalendar()}


/* ============================================================
   LEGACY PRO WRESTLING 7.0 — CAREER PRESENTATION UPDATE
   ============================================================ */
function lpwCareerYear(c){return Math.floor(((Number(c?.month)||1)-1)/12)+1}
function lpwTimeline(c){return `YEAR ${lpwCareerYear(c)} · MONTH ${c.month} · WEEK ${liveMonthWeek(c)}`}
function lpwShowLogo(name){const cls=name.includes('MAYHEM')?'mayhem':'throwdown';return `<div class="lpw-show-logo ${cls}"><small>LPW</small><b>${name.replace('MONDAY NIGHT ','').replace('THURSDAY NIGHT ','')}</b><span>${name.startsWith('MONDAY')?'MONDAY NIGHT':'THURSDAY NIGHT'}</span></div>`}
function lpwPortraitCard(w,label=''){return `<div class="lpw-portrait-card">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<small>${label}</small><b>${w.name}</b></div>`}
const _renderLPW7=render;
render=function(x){_renderLPW7(x);const html=String(x);const career=html.includes('live-');document.body.classList.toggle('career-view',career);document.body.classList.toggle('classic-view',html.includes('mode-landing')||html.includes('match-shell'));document.body.classList.toggle('match-broadcast-view',html.includes('match-ui-v2'));}

home=function(){
 clearStoryTimer();M=null;overlay.innerHTML='';document.body.classList.remove('career-view','classic-view');const w=featuredSuperstar();
 render(`<section class="game-hub lpw-home"><div class="hub-copy"><div class="tv-kicker">BUILD YOUR LEGACY</div><h1>LEGACY <span>PRO WRESTLING</span></h1><p>Live a wrestling career inside a world that changes every week.</p><nav class="hub-menu"><button class="hub-option primary live-menu-option" onclick="gauntletLiveHome()"><b>CAREER</b><small>Build a stable and live through LPW television.</small></button><button class="hub-option" onclick="classicHome()"><b>TAG TEAM GAUNTLET</b><small>One run. One loss ends it.</small></button><button class="hub-option" onclick="collection()"><b>COLLECTION</b><small>Explore the Founding Twenty.</small></button><button class="hub-option" onclick="achievementMenu()"><b>ACHIEVEMENTS</b><small>Career milestones and challenges.</small></button><button class="hub-option muted" onclick="optionsMenu()"><b>SETTINGS</b><small>Presentation and game options.</small></button></nav></div><article class="featured-superstar"><div class="live-chip">FEATURED SUPERSTAR</div>${imageWithFallback(w,'full','art-full','homeFeature')}<div class="featured-lower-third"><small>${w.title}</small><h2>${w.name}</h2><p>${FEATURE_LINES[w.id]||w.signature}</p><button onclick="collectionProfile('${w.id}')">VIEW PROFILE</button></div></article></section>`)
};
classicHome=function(){resetClassicState();S.previewCaptain=one(WRESTLERS);const captain=S.previewCaptain;render(`<section class="panel mode-landing"><div class="actions top-actions"><button class="btn" onclick="start()">START TAG TEAM GAUNTLET</button>${shellBack()}</div><div class="mode-landing-art">${imageWithFallback(captain,'full','art-full','classicLanding')}<div class="mode-preview-label"><small>YOUR STARTING WRESTLER</small><b>${captain.name}</b></div></div><div class="mode-landing-copy"><div class="tv-kicker">CLASSIC CHALLENGE MODE</div><h1>TAG TEAM GAUNTLET</h1><p>Your run begins with <strong>${captain.name}</strong>. Choose a partner and survive to the end. Lose once and the run is over.</p></div></section>`)};

gauntletLiveHome=function(){const c=liveLoad();render(`<section class="panel live-mode-home lpw-career-home">${shellBack()}<div class="tv-kicker">LEGACY PRO WRESTLING</div><h1>CAREER</h1><p>Compete through a living wrestling calendar, build rivalries, recruit opponents and grow a permanent stable.</p><div class="live-home-actions">${c?`<button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE · ${lpwTimeline(c)}</button><button class="btn secondary" onclick="gauntletLiveStable()">VIEW STABLE · ${c.stable.length}</button>`:''}<button class="btn ${c?'secondary':'live-primary'}" onclick="gauntletLiveNewCareer()">${c?'START NEW CAREER':'BEGIN CAREER'}</button></div><div class="live-cycle"><b>VERSION 7.0</b><span>Living television, career progression and a fully branded LPW presentation.</span></div></section>`)};

gauntletLiveCalendar=function(){const c=liveLoad();if(!c)return gauntletLiveHome();const w=liveFounder(c.active),f=liveFeud(c),r=liveFeudOpponent(c);render(`<section class="panel live-calendar-screen"><div class="live-calendar-top"><button class="shell-back" onclick="home()">← MAIN MENU</button><button class="shell-back" onclick="gauntletLiveHome()">CAREER MENU</button></div><div class="tv-kicker">${lpwTimeline(c)}</div><h1>CAREER</h1><div class="live-career-dashboard"><div class="live-career-hero">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div><small>ACTIVE WRESTLER</small><b>${w.name}</b><span>${c.wins}-${c.losses} record · ${c.stable.length} stable member${c.stable.length===1?'':'s'}</span></div></div><div class="live-mini-stats"><span><small>MOMENTUM</small><b>${c.momentum}</b></span><span><small>POPULARITY</small><b>${c.popularity}</b></span><button onclick="gauntletLiveStable()">MANAGE STABLE</button></div></div>${f?`<div class="live-feud-banner calendar-feud"><div>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div><span><small>CURRENT FEUD</small><b>${w.name} vs ${r.name}</b><em>${liveCurrentSupercard(c)} · Intensity ${f.intensity}%</em></span><div>${imageWithFallback(r,'portrait','art-portrait','matchPortrait')}</div></div>`:''}<div class="live-week-strip">${LIVE_DAYS.map((d,i)=>`<div class="live-day ${i<c.day?'complete':''} ${i===c.day?'current':''} ${i===6&&liveIsSupercard({...c,day:i})?'supercard':''}"><small>${d.slice(0,3).toUpperCase()}</small><b>${i===0?'M':i===3?'T':i+1}</b><span>${liveDayLabel(c,i)}</span></div>`).join('')}</div><div class="live-today"><small>TODAY · ${LIVE_DAYS[c.day].toUpperCase()}</small><h2>${liveDayLabel(c,c.day)}</h2><p>${liveDayDescription(c)}</p><button class="btn live-primary" onclick="gauntletLiveBeginDay()">BEGIN</button></div><div class="lpw-ple-card"><small>UPCOMING PREMIUM EVENT</small><b>${liveCurrentSupercard(c)}</b><span>${Math.max(0,4-liveMonthWeek(c))} week${Math.max(0,4-liveMonthWeek(c))===1?'':'s'} away</span></div></section>`)};

gauntletLiveShowIntro=function(){const c=liveLoad(),item=livePlanItem(c),stories=liveSimulateWorld(c),venue=one(VENUES),attendance=Math.floor(rnd(11000,20500)).toLocaleString();liveSave(c);const show=liveIsSupercard(c)?liveCurrentSupercard(c).toUpperCase():liveShowName(c);const card=stories.slice(0,2).map(s=>`<li>${s.text.replace(/ defeated .*?\./,' is scheduled to appear tonight.')}</li>`).join('');render(`<section class="panel live-show-intro lpw-show-open"><div class="show-intro-copy">${liveIsSupercard(c)?`<div class="lpw-ple-title">${show}</div>`:lpwShowLogo(show)}<div class="tv-kicker">LIVE FROM ${venue.toUpperCase()} · ${attendance} IN ATTENDANCE</div><div class="live-commentary-duo show-preview"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>Welcome to ${show}. Tonight could change the direction of several LPW careers.</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>The pressure is rising, and nobody on this roster can afford to stand still.</p></div></div><div class="show-card-list"><small>TONIGHT ON LPW</small><ul>${card||'<li>Major developments from across LPW.</li>'}</ul><b>YOUR SEGMENT · ${liveIsSupercard(c)?'FEUD FINALE':item.type==='segment'?liveSegmentTitle(item.segment):item.type.toUpperCase()+' MATCH'}</b></div><button class="btn live-primary" onclick="gauntletLiveRunShowSegment()">START THE SHOW</button></div></section>`)};

gauntletLiveMatchCard65=function(){const c=liveLoad(),item=livePlanItem(c),player=liveFounder(c.active),isSC=liveIsSupercard(c),r=liveFeudOpponent(c);let type=isSC?'singles':item.type,opponents=isSC?[r.id]:item.opponents,partner=item.partner;c.pending={opponent:opponents[0],opponents,type,partner,isSupercard:isSC};liveSave(c);const roster=[player,...(partner?[liveFounder(partner)]:[]),...opponents.map(liveFounder)];render(`<section class="panel live-match-card"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button>${isSC?`<div class="lpw-ple-title">${liveCurrentSupercard(c).toUpperCase()}</div>`:lpwShowLogo(liveShowName(c))}<h1>${isSC?'FEUD FINALE':type==='tag'?'TAG TEAM MATCH':'FEATURED SINGLES MATCH'}</h1><div class="live-match-lineup ${type} portrait-lineup">${roster.map((w,i)=>lpwPortraitCard(w,i===0?'YOUR WRESTLER':i===1&&partner?'YOUR PARTNER':'OPPONENT')).join('')}</div><div class="live-npc-scene compact producer-card">${npcImage('raymond-briggs','portrait')}<div><small>MATCH PRODUCER</small><b>Raymond Briggs</b><p>Use the broadcast decisions to control the pace. The result will shape what happens tomorrow.</p></div></div><button class="btn live-primary" onclick="gauntletLiveLaunchBroadcast65()">BEGIN MATCH BROADCAST</button></section>`)};

gauntletLiveStorySegment=function(seg){const c=liveLoad(),r=liveFeudOpponent(c),player=liveFounder(c.active);const npcId=seg==='contract-signing'?'veronica-vale':seg==='backstage-attack'?'leon-ward':seg==='commentary-confrontation'?'mike-sullivan':seg==='medical-angle'?'dr-lena-hart':'katie-morgan';const copy={promo:`${player.name} and ${r.name} exchange final warnings in the ring.`,'backstage-attack':`${r.name} ambushes ${player.name} before security arrives.`,interview:`Katie Morgan attempts to get answers as ${r.name} interrupts.`,'contract-signing':`Veronica Vale oversees the signing for ${liveCurrentSupercard(c)}.`,'commentary-confrontation':`${r.name} joins commentary and provokes ${player.name} from ringside.`,'locker-room':`A confrontation erupts inside the locker room and divides the roster.`,'video-message':`${r.name} sends a threatening message from an undisclosed location.`,'medical-angle':`The rivalry targets an existing weakness and forces a medical update.`}[seg];const usePortraits=['medical-angle','commentary-confrontation','interview','backstage-attack'].includes(seg);render(`<section class="panel live-world-screen lpw-story"><div class="tv-kicker">${liveShowName(c)} · ${liveSegmentTitle(seg).toUpperCase()}</div><h1>${liveSegmentTitle(seg)}</h1><div class="live-npc-scene compact">${npcImage(npcId,'portrait')}<div><small>${npc(npcId)?.role||''}</small><b>${npc(npcId)?.name||''}</b><p>${copy}</p></div></div><div class="${usePortraits?'lpw-story-matchup':'story-rival-images'}">${usePortraits?lpwPortraitCard(player,'ACTIVE WRESTLER')+lpwPortraitCard(r,'RIVAL'):`<div>${imageWithFallback(player,'full','art-full','quickMatch')}<b>${player.name}</b></div><div>${imageWithFallback(r,'full','art-full','quickMatch')}<b>${r.name}</b></div>`}</div><div class="live-choice-grid"><button onclick="gauntletLiveResolveSegment('${seg}','calm')"><b>STAY CONTROLLED</b><span>Popularity +6</span></button><button onclick="gauntletLiveResolveSegment('${seg}','fight')"><b>ESCALATE</b><span>Momentum +6 · Feud +10</span></button></div></section>`)};

gauntletLiveResolveDynamic=function(type,val,msg){const c=liveLoad();if(type==='feud'){const f=liveFeud(c);if(f)f.intensity=liveClamp(f.intensity+val,0,100)}else if(['power','speed','technique','charisma','recovery'].includes(type)){const p=liveProgress(c.active,c);p.stats[type]=Math.min(p.caps[type],p.stats[type]+val)}else c[type]=liveClamp((c[type]||0)+val,0,100);liveAwardXp(c,c.active,35,'Career activity');liveAdvanceDay(c);liveSave(c);const w=liveFounder(c.active);render(`<section class="panel live-day-complete lpw-player-complete"><div class="tv-kicker">DAY COMPLETE</div><h1>${msg.toUpperCase()}</h1><div class="lpw-active-full">${imageWithFallback(w,'full','art-full','quickMatch')}</div><b>${w.name}</b><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)};

gauntletLiveWorldRecap=function(){const c=liveLoad();if(!c.world.worldStories.length)liveSimulateWorld(c);const stories=c.world.worldStories;render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${stories[0]?.text||'The LPW world continues to move around your career.'}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${stories[1]?.text||'Every result creates a new opportunity—and a new enemy.'}</p></div></div><div class="live-world-results">${stories.slice(2).map(s=>`<article><span>${s.a?imageWithFallback(liveFounder(s.a),'portrait','art-portrait','matchPortrait'):''}</span><p>${s.text}</p>${s.b?`<span>${imageWithFallback(liveFounder(s.b),'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`).join('')}</div><button class="btn live-primary" onclick="gauntletLiveResolveDynamic('popularity',3,'You studied the wider wrestling world.')">CONTINUE</button></section>`)};

// CAREER 7.1 TEST — clarity, event pacing, feud origins and presentation pass
SUPPORT_CAST['ava-cross']={id:'ava-cross',name:'Ava Cross',role:'Social Media Correspondent',group:'Broadcast Team'};
SUPPORT_CAST['leon-ward']={id:'leon-ward',name:'Leon Ward',role:'Head of Security',group:'Operations'};
SUPPORT_CAST['dr-lena-hart']={id:'dr-lena-hart',name:'Dr. Lena Hart',role:'Medical Director',group:'Medical'};
SUPPORT_CAST['raymond-briggs']={id:'raymond-briggs',name:'Raymond Briggs',role:'Match Producer',group:'Operations'};
SUPPORT_CAST['ethan-brooks']={id:'ethan-brooks',name:'Ethan Brooks',role:'Ring Announcer',group:'Broadcast Team'};
const LPW_DECISION_GUIDANCE=true;
function lpwRiskLabel(chance){return chance>=.68?{key:'favourable',label:'FAVOURABLE'}:chance>=.52?{key:'balanced',label:'BALANCED'}:{key:'risky',label:'RISKY'}}
function lpwAttrNames(action){return (ACTION_META[action]?.attrs||[]).map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' + ')}
function lpwGuidance(action){return ({risk:'Huge swing if it lands; failure can hand control away.',control:'Reliable way to steady the match and protect your position.',pressure:'Builds control without committing everything to one moment.',comeback:'Can reverse a crisis quickly; failure may deepen the danger.',survive:'Safer counter that stabilises the match for a smaller reward.',finisher:'Match-ending potential with the highest consequences if countered.',tag:'Uses teamwork and fresh energy to change the match.'})[action]||'Changes the next exchange.'}
decisionHTML=function(){const d=getDecision();M.currentDecision=d;return `<div class="story-decision psychology-v2-foundation"><div class="your-call-label">YOUR CALL</div><h2>${d.title}</h2><p>${d.text}</p><div class="choice-grid psychology-neutral">${d.options.map((x,i)=>`<button class="choice psychology-choice" onclick="storyChoice('choice-${i}')"><b>${x.name}</b><small>${x.desc}</small></button>`).join('')}</div></div>`};

function lpwEnsureDirector(c){liveEnsureWorld(c);c.world.director=c.world.director||{lastNpc:null,lastType:null,seen:{},managerOfferMonth:0};return c.world.director}
function lpwMarkEvent(c,type,npcId){const d=lpwEnsureDirector(c);d.lastType=type;d.lastNpc=npcId;d.seen[type]=(d.seen[type]||0)+1}
function lpwEventScene({kicker,title,npcId,copy,choices}){const p=npc(npcId);render(`<section class="panel live-world-screen lpw-expanded-event"><div class="tv-kicker">${kicker}</div><h1>${title}</h1><div class="live-npc-scene large expanded">${npcImage(npcId,'full')}<div><small>${p?.role||''}</small><h2>${p?.name||''}</h2><p>${copy}</p></div></div><div class="live-choice-grid contextual">${choices.map((x,i)=>`<button onclick="gauntletLiveResolveExpanded(${i})"><b>${x.title}</b><span>${x.copy}</span><em>${x.effect}</em></button>`).join('')}</div></section>`)}
function gauntletLiveResolveExpanded(i){const c=liveLoad(),e=c.world.pendingExpanded,ch=e?.choices?.[i];if(!ch)return gauntletLiveCalendar();if(ch.type==='manager')c.world.manager=ch.value;else if(ch.type==='feud'){const f=liveFeud(c);if(f)f.intensity=liveClamp(f.intensity+ch.value,0,100)}else if(ch.type==='bonus')c.world.nextMatchBonus=(c.world.nextMatchBonus||0)+ch.value;else c[ch.type]=liveClamp((c[ch.type]||0)+ch.value,0,100);liveAwardXp(c,c.active,35,e.title);c.world.pendingExpanded=null;liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()}
function lpwShowExpanded(c,event){c.world.pendingExpanded=event;lpwMarkEvent(c,event.type,event.npcId);liveSave(c);lpwEventScene(event)}

function gauntletLiveAvaEvent(){const c=liveLoad(),r=liveFeudOpponent(c),player=liveFounder(c.active);const pool=[
 {title:'YOU ARE TRENDING',copy:`A clip of ${player.name}'s latest appearance is climbing the LPW feeds. Ava asks how you want to use the attention.`,choices:[{title:'JOIN THE CONVERSATION',copy:'Post a confident message and engage with supporters.',effect:'Likely effect: popularity rises.',type:'popularity',value:7},{title:'TURN IT TOWARD THE RIVALRY',copy:`Tag ${r?.name||'your rival'} and make the trend personal.`,effect:'Likely effect: feud intensity rises.',type:'feud',value:10}]},
 {title:'RIVAL POST GOES VIRAL',copy:`${r?.name||'Your rival'} has mocked you online and thousands of fans are reacting. Ava needs your response before the story grows without you.`,choices:[{title:'ANSWER WITH CONFIDENCE',copy:'Respond without losing control of the message.',effect:'Likely effect: momentum rises.',type:'momentum',value:7},{title:'MAKE IT A SCANDAL',copy:'Release a cutting reply designed to dominate the feed.',effect:'Likely effect: popularity and controversy rise.',type:'popularity',value:6}]},
 {title:'BACKSTAGE CLIP LEAKED',copy:'Unreleased footage from backstage has appeared online. Ava can either contain it or turn it into part of your story.',choices:[{title:'CONTROL THE STORY',copy:'Give Ava an official statement before rumours take over.',effect:'Likely effect: momentum rises.',type:'momentum',value:6},{title:'LET IT SPREAD',copy:'Use the mystery to keep everyone talking.',effect:'Likely effect: popularity rises.',type:'popularity',value:8}]}
 ];const e=one(pool);lpwShowExpanded(c,{type:'social',npcId:'ava-cross',kicker:'LPW SOCIAL · TRENDING NOW',title:e.title,copy:e.copy,choices:e.choices})}
function gauntletLiveSecurityEvent(){const c=liveLoad(),r=liveFeudOpponent(c);lpwShowExpanded(c,{type:'security',npcId:'leon-ward',kicker:'BACKSTAGE · SECURITY ALERT',title:'TENSION IN THE ARENA',copy:`Leon Ward has learned that ${r?.name||'your rival'} may be planning a confrontation. Security can keep you separated—or you can use the warning to confront the situation yourself.`,choices:[{title:'LET SECURITY HANDLE IT',copy:'Stay protected and keep the show under control.',effect:'Likely effect: momentum improves safely.',type:'momentum',value:5},{title:'GO LOOKING FOR THEM',copy:'Ignore the warning and force the rivalry forward.',effect:'Likely effect: feud intensity rises.',type:'feud',value:12}]})}
function gauntletLiveManagerEvent(){const c=liveLoad(),d=lpwEnsureDirector(c),managers=['preston-cole','graham-archer','scarlett-storm','tommy-sparks'];if(!c.world.manager&&d.managerOfferMonth!==c.month){d.managerOfferMonth=c.month;const id=one(managers),p=npc(id);return lpwShowExpanded(c,{type:'manager-recruitment',npcId:id,kicker:'RARE OPPORTUNITY · MANAGER INTEREST',title:p.role.toUpperCase(),copy:`${p.name} explains exactly what is being offered: a long-term partnership, occasional strategic support and a place at ringside for important moments. You are not required to accept a manager.`,choices:[{title:'BEGIN A PRIVATE PARTNERSHIP',copy:`Accept ${p.name}'s representation without making an immediate public spectacle.`,effect:'Likely effect: manager joins your career; momentum rises.',type:'manager',value:id},{title:'DECLINE THE OFFER',copy:'Continue your career independently.',effect:'No manager is assigned.',type:'momentum',value:2}]})}
 const id=c.world.manager,p=npc(id);return lpwShowExpanded(c,{type:'manager-advice',npcId:id,kicker:'MANAGER ADVICE',title:'A TIMELY GAME PLAN',copy:`${p.name} has appeared because the next match matters—not simply because another week has passed. The advice focuses on a weakness in your rival's approach.`,choices:[{title:'FOLLOW THE PLAN',copy:'Commit to the scouting report in your next match.',effect:'Likely effect: next-match advantage.',type:'bonus',value:5},{title:'TRUST YOUR INSTINCTS',copy:'Keep control of your own preparation.',effect:'Likely effect: momentum rises.',type:'momentum',value:5}]})}
function gauntletLiveDynamicDay(){const c=liveLoad(),d=lpwEnsureDirector(c);let type;if(c.day===1&&c.world.lastResult)type='recap';else{const roll=Math.random();type=roll<.30?'social':roll<.48?'training':roll<.63?'interview':roll<.75?'security':roll<.84?'world':roll<.92?'manager':'training'}if(type===d.lastType)type=type==='social'?'training':'social';if(type==='social')return gauntletLiveAvaEvent();if(type==='security')return gauntletLiveSecurityEvent();if(type==='manager')return gauntletLiveManagerEvent();if(type==='interview')return gauntletLiveKatieInterview();if(type==='recap'||type==='world')return gauntletLiveWorldRecap();return gauntletLiveTraining65()}

function gauntletLiveFeudOrigin(){const c=liveLoad(),r=liveFeudOpponent(c),p=liveFounder(c.active),origins=[
 {title:'A PUBLIC CALL-OUT',npc:'katie-morgan',copy:`${r.name} interrupts a live interview and claims ${p.name} has been avoiding real competition.`},
 {title:'A BACKSTAGE ATTACK',npc:'leon-ward',copy:`${r.name} blindsides ${p.name} in the corridor. My security team and I separate them before the situation escalates.`},
 {title:'A SOCIAL MEDIA FIRESTORM',npc:'ava-cross',copy:`Ava Cross reports that ${r.name} has insulted ${p.name} in a post now trending across LPW.`},
 {title:'A CHALLENGE FROM MANAGEMENT',npc:'veronica-vale',copy:`Veronica Vale announces that tension between ${p.name} and ${r.name} will be settled over the coming month.`}
 ];const o=one(origins),pSources=wrestlerImageCandidates(p,'portrait'),rSources=wrestlerImageCandidates(r,'portrait');c.world.feud.reason=o.copy;c.world.feudOriginSeen=c.month;liveSave(c);render(`<section class="panel lpw-feud-origin"><div class="tv-kicker">NEW MONTH · FEUD ORIGIN</div><h1>${o.title}</h1><div class="origin-matchup origin-matchup-820"><div class="origin-wrestler-frame origin-wrestler-left"><img class="origin-wrestler-image" src="${pSources[0]}" data-sources="${pSources.join('|')}" data-source-index="0" alt="${p.name}" onerror="advanceImageFallback(this)"></div><strong class="origin-vs-820">VS</strong><div class="origin-wrestler-frame origin-wrestler-right"><img class="origin-wrestler-image" src="${rSources[0]}" data-sources="${rSources.join('|')}" data-source-index="0" alt="${r.name}" onerror="advanceImageFallback(this)"></div></div><div class="live-npc-scene expanded origin-report origin-report-${o.npc}">${npcImage(o.npc,'full')}<div class="origin-report-copy"><b>${npc(o.npc)?.name||''}</b><small>${npc(o.npc)?.role||''}</small><p>${o.copy}</p></div></div><p class="origin-close">The rivalry will culminate at <b>${liveCurrentSupercard(c)}</b>.</p><button class="btn live-primary" onclick="gauntletLiveCalendar()">BEGIN THE MONTH</button></section>`)}
const _lpwStartNextMonth=gauntletLiveStartNextMonth;
gauntletLiveStartNextMonth=function(id){const c=liveLoad();c.active=id;c.world.katieThisWeek=0;const opp=livePickDifferent(c,c.stable);liveStartFeud(c,opp.id,'A new rivalry is about to begin.');liveGenerateMonthlyPlan(c);liveSave(c);gauntletLiveFeudOrigin()};
const _lpwChooseFounder=gauntletLiveChooseFounder;
gauntletLiveChooseFounder=function(id){_lpwChooseFounder(id);setTimeout(()=>{const c=liveLoad();if(c&&c.world.feudOriginSeen!==c.month)gauntletLiveFeudOrigin()},20)};

gauntletLiveWorldRecap=function(){const c=liveLoad(),last=c.world.lastResult,player=liveFounder(c.active);if(!c.world.worldStories.length)liveSimulateWorld(c);const other=c.world.worldStories;let lead='The LPW world continues to move around your career.',analysis='Every result creates a new opportunity—and a new enemy.';if(last){const opp=liveFounder(last.opponent);lead=last.win?`${player.name} defeated ${opp.name}. It is the headline result from the latest broadcast.`:`${player.name} was defeated by ${opp.name}. The loss now demands a response.`;analysis=last.win?`That victory changes how the locker room views ${player.name}.`:`The next appearance will show whether ${player.name} can recover.`}render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${lead}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${analysis}</p></div></div><div class="live-world-results">${other.slice(0,3).map(s=>`<article><span>${s.a?imageWithFallback(liveFounder(s.a),'portrait','art-portrait','matchPortrait'):''}</span><p>${s.text}</p>${s.b?`<span>${imageWithFallback(liveFounder(s.b),'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`).join('')}</div><button class="btn live-primary" onclick="gauntletLiveResolveDynamic('popularity',3,'World recap complete.')">CONTINUE</button></section>`)};

gauntletLiveFinishMatch65=function(win,oppId){const c=liveLoad(),opp=liveFounder(oppId),player=liveFounder(c.active),xp=c.lastXpAward||{amount:0};c.lastXpAward=null;if(!win)xp.amount=0;liveSave(c);render(`<section class="panel live-day-complete ${win?'live-win':'live-loss'}"><div class="tv-kicker">MATCH RESULT</div><h1>${win?'VICTORY':'DEFEAT'}</h1><div class="live-result-images enlarged">${imageWithFallback(player,win?'victory':'full','art-full','resultVictory')}${imageWithFallback(opp,win?'full':'victory','art-full','resultVictory')}</div><p>${win?`${player.name} defeated ${opp.name}.`:`${player.name} was defeated by ${opp.name}.`}</p><div class="live-xp-award"><b>${win?`+${xp.amount} XP`:'NO XP EARNED'}</b><span>${c.world.injury?'An injury will require medical attention tomorrow.':'The world will react tomorrow.'}</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)};

gauntletLiveSupercardResult=function(win,oppId){const c=liveLoad(),opp=liveFounder(oppId),player=liveFounder(c.active),name=liveCurrentSupercard(c),f=liveFeud(c);if(win&&!c.stable.includes(oppId))c.stable.push(oppId);c.world.lastFeud={opponent:oppId,won:win,supercard:name};c.world.feud=null;c.world.monthPlan=null;c.world.katieThisWeek=0;liveAdvanceDay(c);liveSave(c);render(`<section class="panel live-supercard-result ${win?'live-win':'live-loss'}"><div class="supercard-logo logo-${name.toLowerCase().replace(/\s+/g,'-')}"><small>LEGACY PRO WRESTLING PRESENTS</small><b>${name}</b></div><div class="supercard-result-art enlarged">${imageWithFallback(player,win?'victory':'full','art-full','resultVictory')}${imageWithFallback(opp,win?'full':'victory','art-full','resultVictory')}</div><div><div class="tv-kicker">FEUD COMPLETE</div><h1>${win?'FEUD WON':'FEUD LOST'}</h1><p>${win?`${player.name} won the decisive Super Card match and ${opp.name} has been unlocked.`:`${opp.name} won the decisive Super Card match. Television results do not override the finale.`}</p><div class="feud-record"><b>TELEVISION RECORD</b><span>${player.name} ${f?.playerWins||0} · ${f?.rivalWins||0} ${opp.name}</span><em>Super Card winner: ${win?player.name:opp.name}</em></div><button class="btn live-primary" onclick="gauntletLiveMonthRosterChoice()">CHOOSE NEXT MONTH'S WRESTLER</button></div></section>`)};

gauntletLiveMonthRosterChoice=function(){const c=liveLoad();render(`<section class="panel live-founder-screen portrait-roster"><div class="tv-kicker">NEW MONTH · NEW OPPORTUNITY</div><h1>CHOOSE YOUR WRESTLER</h1><p class="sub">Continue with your current wrestler or select any unlocked member of your roster.</p><div class="live-founder-grid portrait-grid">${c.stable.map(id=>{const w=liveFounder(id),p=liveProgress(id,c);return `<button class="live-founder-card portrait" onclick="gauntletLiveStartNextMonth('${id}')">${imageWithFallback(w,'portrait','art-portrait','collection')}<span><small>${id===c.active?'ACTIVE WRESTLER':'UNLOCKED'}</small><b>${w.name}</b><em>Level ${p.level} · Momentum ${c.momentum}</em></span></button>`}).join('')}</div></section>`)};

const _lpwMatchCard=gauntletLiveMatchCard65;
gauntletLiveMatchCard65=function(){const c=liveLoad();if(liveIsSupercard(c)){const p=liveFounder(c.active),r=liveFeudOpponent(c);c.pending={opponent:r.id,opponents:[r.id],type:'singles',partner:null,isSupercard:true};liveSave(c);return render(`<section class="panel live-match-card supercard-card"><div class="supercard-logo"><small>LEGACY PRO WRESTLING PRESENTS</small><b>${liveCurrentSupercard(c)}</b></div><div class="live-npc-scene ring-intro expanded">${npcImage('ethan-brooks','full')}<div><small>RING ANNOUNCER</small><b>Ethan Brooks</b><p>“The following contest is the decisive match of the monthly rivalry!”</p></div></div><div class="live-match-lineup singles portrait-lineup">${lpwPortraitCard(p,'YOUR WRESTLER')}${lpwPortraitCard(r,'RIVAL')}</div><button class="btn live-primary" onclick="gauntletLiveLaunchBroadcast65()">BEGIN SUPER CARD MATCH</button></section>`)}return _lpwMatchCard()};

/* ==========================================================================\n   LEGACY PRO WRESTLING 8.0 — CHAMPIONSHIP ERA\n   ========================================================================== */
Object.assign(FEATURE_LINES,{
 'ace-riot':'He says what everyone else is afraid to say.',
 'everest':'The mountain does not move for anyone.',
 'axel-voss':'Every match ends at Impact Zero.',
 'slater-nova':'The biggest risk is becoming forgettable.'
});
Object.assign(BIOS,{
 'ace-riot':'An outspoken technical rebel whose words create headlines and whose precision forces opponents to listen.',
 'everest':'A respectful, once-in-a-generation giant whose calm presence makes every contest feel historic.',
 'axel-voss':'An explosive combat athlete who combines heavyweight force with terrifying speed and ruthless efficiency.',
 'slater-nova':'A fearless aerial artist who treats every match as a canvas and every impossible risk as self-expression.'
});
Object.assign(PERSONALITY_PROFILES,{
 'ace-riot':{archetype:'The Rebel',events:['argues with the referee while never losing position','invites the crowd to speak louder','turns a technical counter into a public statement','points at the hard camera before attacking','refuses to follow the expected script','wins the exchange and immediately demands the microphone']},
 'everest':{archetype:'The Attraction',events:['absorbs the strike without taking a step backward','raises one enormous hand and silences the arena','calmly returns to his feet','blocks the escape with a single step','shows mercy before resuming the contest','stands immovable in the centre of the ring']},
 'axel-voss':{archetype:'The Destroyer',events:['explodes forward with frightening speed','drives through the opponent like a tackle dummy','cuts off the ring with combat precision','shows no emotion after a brutal takedown','forces the pace into another violent gear','stalks forward with both fists ready']},
 'slater-nova':{archetype:'The Artist',events:['changes direction in mid-air','paints a streak of colour through the ropes','balances on the turnbuckle as the crowd rises','takes the dangerous route without hesitation','turns a fall into an aerial counter','stares at the lights before launching himself again']}
});
Object.assign(WRESTLER_DECISIONS,{
 'ace-riot':[['Take the Microphone','Challenge the System','Win the Argument','Expose the Opening','Refuse the Script'],['Turn Technique into Protest','Make It Personal','Control the Narrative','Outthink the Favourite','Force Them to Listen'],['Fight from Conviction','Reject the Easy Exit','Speak Through the Pain','Create a Rebellion','Refuse to Stay Silent'],['Call for Riot Trigger','End the Debate','Deliver the Final Statement','Make the Champion Listen','Finish on His Terms']],
 'everest':[['Claim the Centre','Stand Immovable','Offer One Warning','Test Their Courage','Raise the Mountain'],['Close Every Escape','Apply Mountain Pressure','Show Controlled Strength','Slow the Entire Match','Make the Ring Feel Smaller'],['Rise Without Emotion','Absorb the Avalanche','Refuse to Fall','Find the Giant\'s Balance','Stand One More Time'],['Call for Summit Slam','End the Climb','Bring Down the Mountain','Finish with One Motion','Reach the Summit']],
 'axel-voss':[['Explode from the Bell','Shoot for Ground Control','Crash Through the Guard','Set a Combat Pace','Take Away the Breath'],['Keep the Pressure Violent','Launch Another Takedown','Cut Off Every Exit','Punish the Weakness','Turn Speed into Force'],['Fight Out with Power','Return to His Feet','Answer with a Suplex','Break the Hold Apart','Become More Dangerous'],['Call for Impact Zero','End It Immediately','Deliver Total Destruction','Finish the Fight','Leave Nothing Standing']],
 'slater-nova':[['Paint the Opening','Test the Highest Rope','Trust the Instinct','Create the First Moment','Take the Unusual Path'],['Turn the Ring into a Canvas','Attempt the Impossible','Change Direction Mid-Flight','Make the Crowd Believe','Risk Everything for the Moment'],['Create from the Fall','Reach for the Ropes','Turn Pain into Motion','Find One More Flight','Refuse the Safe Choice'],['Call for Nova Fall','Take the Final Flight','Create the Lasting Image','Finish from the Sky','Risk It All One More Time']]
});

const LPW8_TITLES=[
 {id:'world',name:'LEGACY World Championship',short:'WORLD',prestige:100},
 {id:'television',name:'LEGACY Television Championship',short:'TELEVISION',prestige:82},
 {id:'heritage',name:'LEGACY Heritage Championship',short:'HERITAGE',prestige:88},
 {id:'tag',name:'LEGACY Tag Team Championship',short:'TAG TEAM',prestige:90}
];
function lpw8Init(c){
 c.championships=c.championships||{world:'jack-mercer',television:'jett-valentine',heritage:'mason-marks',tag:['victor-royale','sterling-sinclair']};
 c.rankings=c.rankings||WRESTLERS.map((w,i)=>({id:w.id,points:Math.max(10,100-i*3)+(w.overall-95)*4,wins:0,losses:0}));
 return c;
}
function lpw8Rankings(c){lpw8Init(c);return [...c.rankings].sort((a,b)=>b.points-a.points)}
function lpw8RankingScreen(){const c=lpw8Init(liveLoad());liveSave(c);const rows=lpw8Rankings(c);render(`<section class="panel lpw8-rankings">${shellBack()}<div class="tv-kicker">CHAMPIONSHIP ERA</div><h1>POWER RANKINGS</h1><p class="sub">Wins, losses and major performances shape every title opportunity.</p><div class="lpw8-title-strip">${LPW8_TITLES.map(t=>{const h=c.championships[t.id],names=Array.isArray(h)?h.map(id=>liveFounder(id)?.name).join(' & '):liveFounder(h)?.name;return `<article><small>${t.short} CHAMPION</small><b>${names||'VACANT'}</b></article>`}).join('')}</div><div class="lpw8-ranking-list">${rows.map((r,i)=>{const w=liveFounder(r.id);return `<article><strong>${i+1}</strong>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<span><b>${w.name}</b><small>${w.title}</small></span><em>${r.points} PTS<br>${r.wins}-${r.losses}</em></article>`}).join('')}</div><button class="btn live-primary" onclick="gauntletLiveHome()">RETURN TO CAREER</button></section>`)}
function lpw8Championships(){const c=lpw8Init(liveLoad());liveSave(c);render(`<section class="panel lpw8-championships">${shellBack()}<div class="tv-kicker">LEGACY GOLD</div><h1>CHAMPIONSHIPS</h1><div class="lpw8-belt-grid">${LPW8_TITLES.map(t=>{const h=c.championships[t.id],ids=Array.isArray(h)?h:[h],names=ids.map(id=>liveFounder(id)?.name).filter(Boolean).join(' & ');return `<article><div class="lpw8-belt">★</div><small>${t.name}</small><h2>${names||'VACANT'}</h2><p>Prestige ${t.prestige}</p></article>`}).join('')}</div><button class="btn live-primary" onclick="lpw8RankingScreen()">VIEW POWER RANKINGS</button></section>`)}
const _lpw8Home=gauntletLiveHome;
gauntletLiveHome=function(){setActiveGameMode('career');_lpw8Home();const actions=document.querySelector('.live-home-actions');if(actions)actions.insertAdjacentHTML('beforeend','<button class="btn secondary" onclick="lpw8Championships()">CHAMPIONSHIPS</button><button class="btn secondary" onclick="lpw8RankingScreen()">POWER RANKINGS</button>');const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent='VERSION 8.0';};
const _lpw8Finish=gauntletLiveFinishMatch65;
gauntletLiveFinishMatch65=function(win,oppId){const c=lpw8Init(liveLoad()),me=c.rankings.find(x=>x.id===c.active),op=c.rankings.find(x=>x.id===oppId);if(me){me.points=Math.max(0,me.points+(win?18:-6));me[win?'wins':'losses']++}if(op){op.points=Math.max(0,op.points+(win?-4:14));op[win?'losses':'wins']++}liveSave(c);return _lpw8Finish(win,oppId)};


/* LPW 8.0.1 boot completion: render only the final current-version home screen. */
window.__LPW_BOOT_COMPLETE__ = true;
home();
document.documentElement.classList.add('lpw-ready');
document.documentElement.classList.remove('lpw-booting');

/* LPW 8.0.2 — focused mobile layout fixes: stable cards + career calendar */
gauntletLiveStable=function(){
 const c=liveLoad(); if(!c)return gauntletLiveHome();
 render(`<section class="panel live-stable-screen lpw-stable-clean">
  <button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button>
  <div class="tv-kicker">PERMANENT ROSTER</div>
  <h1>YOUR STABLE</h1>
  <p>Tap a wrestler to make them active. Open My Career for development.</p>
  <div class="live-stable-grid">${c.stable.map(id=>{
   const w=liveFounder(id),p=liveProgress(id,c),active=id===c.active;
   return `<article class="live-stable-card ${active?'active':''}">
    <div class="lpw-stable-art" onclick="gauntletLiveSetActive('${id}')">
     ${imageWithFallback(w,'portrait','art-portrait','collection')}
     <div class="lpw-stable-overlay">
      <span><small>${active?'ACTIVE':'OVR '+liveOverall(p)}</small><b>${w.name}</b></span>
      <button onclick="event.stopPropagation();gauntletLiveCareerCard('${id}')">MY CAREER</button>
     </div>
    </div>
   </article>`
  }).join('')}</div>
 </section>`)
};

gauntletLiveCalendar=function(){
 const c=liveLoad(); if(!c)return gauntletLiveHome();
 const w=liveFounder(c.active),f=liveFeud(c),r=liveFeudOpponent(c);
 const nickname=(w.name.match(/^"[^"]+"/)||[''])[0];
 const ringName=w.name.replace(/^"[^"]+"\s*/, '');
 render(`<section class="panel live-calendar-screen lpw-calendar-compact lpw-calendar-807">
  <div class="live-calendar-top"><button class="shell-back" onclick="home()">← MAIN MENU</button><button class="shell-back" onclick="gauntletLiveHome()">CAREER MENU</button></div>
  <div class="tv-kicker">${lpwTimeline(c)}</div>
  <h1>CAREER</h1>
  <div class="live-week-strip">${LIVE_DAYS.map((d,i)=>`<div class="live-day ${i<c.day?'complete':''} ${i===c.day?'current':''} ${i===6&&liveIsSupercard({...c,day:i})?'supercard':''}"><small>${d.slice(0,3).toUpperCase()}</small><b>${i===0?'M':i===3?'T':i+1}</b><span>${liveDayLabel(c,i)}</span></div>`).join('')}</div>
  <div class="lpw-active-wrestler-feature">
   <small class="lpw-feature-label">ACTIVE WRESTLER</small>
   <div class="lpw-feature-portrait">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div>
   <div class="lpw-active-copy">${nickname?`<span class="lpw-active-nickname">${nickname}</span>`:''}<b class="lpw-active-name">${ringName}</b><span class="lpw-active-record">${c.wins}-${c.losses} record · ${c.stable.length} stable member${c.stable.length===1?'':'s'}</span></div>
  </div>
  <div class="live-mini-stats lpw-stats-below-feature"><span><small>MOMENTUM</small><b>${c.momentum}</b></span><span><small>POPULARITY</small><b>${c.popularity}</b></span><button onclick="gauntletLiveStable()">MANAGE STABLE</button></div>
  ${f?`<div class="live-feud-banner calendar-feud"><div>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div><span><small>CURRENT FEUD</small><b>${w.name} vs ${r.name}</b><em>${liveCurrentSupercard(c)} · Intensity ${f.intensity}%</em></span><div>${imageWithFallback(r,'portrait','art-portrait','matchPortrait')}</div></div>`:''}
  <div class="live-today"><div><small>TODAY · ${LIVE_DAYS[c.day].toUpperCase()}</small><h2>${liveDayLabel(c,c.day)}</h2><p>${liveDayDescription(c)}</p></div><button class="btn live-primary" onclick="gauntletLiveBeginDay()">BEGIN</button></div>
  <div class="lpw-ple-card"><small>UPCOMING PREMIUM EVENT</small><b>${liveCurrentSupercard(c)}</b><span>${Math.max(0,4-liveMonthWeek(c))} week${Math.max(0,4-liveMonthWeek(c))===1?'':'s'} away</span></div>
 </section>`)
};


/* VERSION 8.0.21 — calendar weekday correction and active-wrestler text cleanup. */
const LPW_CALENDAR_MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const LPW_CALENDAR_START=Date.UTC(2025,0,1);
function lpwCalendarDate(c,offset=0){
 const absolute=((Math.max(1,c.week)-1)*7)+(Number.isInteger(c.day)?c.day:0)+offset;
 const date=new Date(LPW_CALENDAR_START+(absolute*86400000));
 return {date,absolute,day:date.getUTCDate(),month:date.getUTCMonth(),year:date.getUTCFullYear()-2024,weekday:(date.getUTCDay()+6)%7};
}
function lpwCalendarIsSupercard(d){
 if(d.weekday!==6)return false;
 const firstSundayOffset=4; // January 5, 2025 is the first Sunday in the Career calendar.
 const sundayNumber=Math.floor((d.absolute-firstSundayOffset)/7)+1;
 return sundayNumber>0&&sundayNumber%4===0;
}
function lpwCalendarActivity(d){
 if(d.weekday===0)return 'MAYHEM';
 if(d.weekday===3)return 'THROWDOWN';
 if(lpwCalendarIsSupercard(d))return 'SUPERCARD';
 return ['MAYHEM','WORLD FALLOUT','CAREER DEVELOPMENT','THROWDOWN','RECOVERY & MEDIA','LIVING WORLD','WEEKLY REVIEW'][d.weekday];
}
function lpwCalendarDescription(d){
 if(d.weekday===0)return 'MONDAY NIGHT MAYHEM presents a featured singles match.';
 if(d.weekday===1)return 'The wrestling world reacts to the events of Monday Night Mayhem.';
 if(d.weekday===2)return 'Develop your wrestler through training and career decisions.';
 if(d.weekday===3)return 'THURSDAY NIGHT THROWDOWN presents the second live show of the week.';
 if(d.weekday===4)return 'Recover, meet the media and respond to the week’s major developments.';
 if(d.weekday===5)return 'The wider LEGACY world advances through stories, rankings and opportunities.';
 if(lpwCalendarIsSupercard(d))return 'The four-week cycle reaches its SuperCard with the month’s decisive rivalry match.';
 return 'Review the week before the next Monday Night Mayhem begins.';
}
function lpwCalendarLabel(c,offset){
 const d=lpwCalendarDate(c,offset);
 return {...d,label:lpwCalendarActivity(d),supercard:lpwCalendarIsSupercard(d)};
}
function lpwCalendarTimeline(c){const d=lpwCalendarDate(c);return `YEAR ${d.year} · ${LPW_CALENDAR_MONTHS[d.month].toUpperCase()} ${d.day} · WEEK ${c.week}`}

gauntletLiveCalendar=function(){
 const c=liveLoad(); if(!c)return gauntletLiveHome();
 const w=liveFounder(c.active),f=liveFeud(c),r=liveFeudOpponent(c);
 const nickname=(w.name.match(/^"[^"]+"/)||[''])[0],ringName=w.name.replace(/^"[^"]+"\s*/, '');
 const forecast=Array.from({length:7},(_,i)=>lpwCalendarLabel(c,i));
 const today=forecast[0];
 render(`<section class="panel live-calendar-screen lpw-calendar-compact lpw-calendar-807 lpw-calendar-821">
  <div class="live-calendar-top"><button class="shell-back" onclick="home()">← MAIN MENU</button><button class="shell-back" onclick="gauntletLiveHome()">CAREER MENU</button></div>
  <div class="tv-kicker">${lpwCalendarTimeline(c)}</div><h1>CAREER</h1>
  <div class="live-week-strip lpw-date-forecast" aria-label="Next seven days">${forecast.map((d,i)=>`<div class="live-day ${i===0?'current':''} ${d.supercard?'supercard':''}"><small>${LIVE_DAYS[d.weekday].slice(0,3).toUpperCase()}</small><b>${d.day}</b><span>${d.label}</span>${i>0&&d.day===1?`<em>${LPW_CALENDAR_MONTHS[d.month].slice(0,3).toUpperCase()}</em>`:''}</div>`).join('')}</div>
  <div class="lpw-active-wrestler-feature"><small class="lpw-feature-label">ACTIVE WRESTLER</small><div class="lpw-feature-portrait">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div><div class="lpw-active-copy">${nickname?`<span class="lpw-active-nickname">${nickname}</span>`:''}<b class="lpw-active-name">${ringName}</b><span class="lpw-active-record">${c.wins}-${c.losses} Record</span><span class="lpw-active-stable">${c.stable.length} Stable Member${c.stable.length===1?'':'s'}</span></div></div>
  <div class="live-mini-stats lpw-stats-below-feature"><span><small>MOMENTUM</small><b>${c.momentum}</b></span><span><small>POPULARITY</small><b>${c.popularity}</b></span><button onclick="gauntletLiveStable()">MANAGE STABLE</button></div>
  ${f?`<div class="live-feud-banner calendar-feud"><div>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div><span><small>CURRENT FEUD</small><b>${w.name} vs ${r.name}</b><em>${liveCurrentSupercard(c)} · Intensity ${f.intensity}%</em></span><div>${imageWithFallback(r,'portrait','art-portrait','matchPortrait')}</div></div>`:''}
  <div class="live-today"><div><small>TODAY · ${LIVE_DAYS[today.weekday].toUpperCase()} · ${LPW_CALENDAR_MONTHS[today.month].toUpperCase()} ${today.day}</small><h2>${today.label}</h2><p>${lpwCalendarDescription(today)}</p></div><button class="btn live-primary" onclick="gauntletLiveBeginDay()">BEGIN</button></div>
 </section>`)
};

/* ============================================================
   LEGACY PRO WRESTLING 8.1 — START THE SHOW HOTFIX
   Repairs invalid Career show plan entries before advancing.
   ============================================================ */
function lpwValidCareerWrestler(id){
 const w=liveFounder(id);
 return !!(w&&w.id&&w.name);
}
function lpwPickCareerOpponent(c,exclude=[]){
 const blocked=new Set([c?.active,...exclude].filter(Boolean));
 const pool=WRESTLERS.filter(w=>w&&w.id&&w.name&&!blocked.has(w.id));
 return pool.length?one(pool):WRESTLERS.find(w=>w&&w.id&&w.name);
}
function lpwRepairShowItem(c,item){
 if(!c)return null;
 if(liveIsSupercard(c))return {type:'supercard'};
 let fixed=(item&&typeof item==='object')?{...item}:{type:'singles'};
 const allowed=['singles','tag','multi','segment'];
 if(!allowed.includes(fixed.type))fixed.type='singles';
 if(fixed.type==='segment'){
  if(!LIVE_SEGMENTS.includes(fixed.segment))fixed.segment='promo';
  return fixed;
 }
 if(fixed.type==='tag'){
  let partner=lpwValidCareerWrestler(fixed.partner)?fixed.partner:null;
  if(!partner)partner=lpwPickCareerOpponent(c)?.id;
  let opponents=Array.isArray(fixed.opponents)?fixed.opponents.filter(lpwValidCareerWrestler):[];
  opponents=[...new Set(opponents)].filter(id=>id!==c.active&&id!==partner);
  while(opponents.length<2){
   const pick=lpwPickCareerOpponent(c,[partner,...opponents]);
   if(!pick||opponents.includes(pick.id))break;
   opponents.push(pick.id);
  }
  if(!partner||opponents.length<2)return lpwRepairShowItem(c,{type:'singles'});
  return {...fixed,partner,opponents:opponents.slice(0,2)};
 }
 if(fixed.type==='multi'){
  let opponents=Array.isArray(fixed.opponents)?fixed.opponents.filter(lpwValidCareerWrestler):[];
  opponents=[...new Set(opponents)].filter(id=>id!==c.active);
  while(opponents.length<2){
   const pick=lpwPickCareerOpponent(c,opponents);
   if(!pick||opponents.includes(pick.id))break;
   opponents.push(pick.id);
  }
  if(opponents.length<2)return lpwRepairShowItem(c,{type:'singles'});
  return {...fixed,opponents:opponents.slice(0,3)};
 }
 let opponents=Array.isArray(fixed.opponents)?fixed.opponents.filter(lpwValidCareerWrestler):[];
 opponents=[...new Set(opponents)].filter(id=>id!==c.active);
 if(!opponents.length){
  const rival=liveFeudOpponent(c);
  const pick=(rival&&lpwValidCareerWrestler(rival.id)&&rival.id!==c.active)?rival:lpwPickCareerOpponent(c);
  if(pick)opponents=[pick.id];
 }
 return {...fixed,type:'singles',opponents:opponents.slice(0,1)};
}
function lpwPersistRepairedShowItem(c,item){
 if(!c||!item||liveIsSupercard(c))return item;
 liveEnsureWorld(c);
 const slot=liveMonthSlot(c);
 if(Array.isArray(c.world.monthPlan)&&slot>=0){c.world.monthPlan[slot]=item;liveSave(c)}
 return item;
}
gauntletLiveRunShowSegment=function(){
 try{
  const c=liveLoad();
  if(!c)return gauntletLiveHome();
  const item=lpwPersistRepairedShowItem(c,lpwRepairShowItem(c,livePlanItem(c)));
  if(!item)throw new Error('Unable to create tonight\'s show segment.');
  if(liveIsSupercard(c)||item.type==='singles'||item.type==='tag')return gauntletLiveMatchCard65();
  if(item.type==='multi')return gauntletLiveMultiMatch(item);
  return gauntletLiveStorySegment(item.segment);
 }catch(err){
  console.error('Start the Show failed:',err);
  const c=liveLoad();
  if(c){liveGenerateMonthlyPlan(c);liveSave(c)}
  render(`<section class="panel live-world-screen"><div class="tv-kicker">CAREER RECOVERY</div><h1>SHOW CARD REBUILT</h1><p>Tonight's card contained invalid match data and has been repaired.</p><button class="btn live-primary" onclick="gauntletLiveRunShowSegment()">START THE SHOW</button><button class="btn secondary" onclick="gauntletLiveCalendar()">RETURN TO CALENDAR</button></section>`);
 }
};
gauntletLiveMatchCard65=function(){
 try{
  const c=liveLoad();if(!c)return gauntletLiveHome();
  const isSC=liveIsSupercard(c),player=liveFounder(c.active);
  if(!player)throw new Error('Active wrestler is missing.');
  let item=lpwRepairShowItem(c,livePlanItem(c));
  const rival=liveFeudOpponent(c);
  if(isSC){
   const opponent=(rival&&lpwValidCareerWrestler(rival.id)&&rival.id!==c.active)?rival:lpwPickCareerOpponent(c);
   if(!opponent)throw new Error('No valid Supercard opponent is available.');
   item={type:'singles',opponents:[opponent.id]};
  }else item=lpwPersistRepairedShowItem(c,item);
  const type=item.type,opponents=item.opponents||[],partner=item.partner||null;
  const roster=[player,...(partner?[liveFounder(partner)]:[]),...opponents.map(liveFounder)].filter(Boolean);
  const expected=type==='tag'?4:2;
  if(roster.length<expected)throw new Error('Tonight\'s match roster is incomplete.');
  c.pending={opponent:opponents[0],opponents,type,partner,isSupercard:isSC};liveSave(c);
  render(`<section class="panel live-match-card"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button>${isSC?`<div class="lpw-ple-title">${liveCurrentSupercard(c).toUpperCase()}</div>`:lpwShowLogo(liveShowName(c))}<h1>${isSC?'FEUD FINALE':type==='tag'?'TAG TEAM MATCH':'FEATURED SINGLES MATCH'}</h1><div class="live-match-lineup ${type} portrait-lineup">${roster.map((w,i)=>lpwPortraitCard(w,i===0?'YOUR WRESTLER':i===1&&partner?'YOUR PARTNER':'OPPONENT')).join('')}</div><div class="live-npc-scene compact producer-card">${npcImage('raymond-briggs','portrait')}<div><small>MATCH PRODUCER</small><b>Raymond Briggs</b><p>Use the broadcast decisions to control the pace. The result will shape what happens tomorrow.</p></div></div><button class="btn live-primary" onclick="gauntletLiveLaunchBroadcast65()">BEGIN MATCH BROADCAST</button></section>`);
 }catch(err){
  console.error('Career match card failed:',err);
  const c=liveLoad();if(c){liveGenerateMonthlyPlan(c);liveSave(c)}
  render(`<section class="panel live-world-screen"><div class="tv-kicker">CAREER RECOVERY</div><h1>MATCH CARD REPAIRED</h1><p>The match card could not be loaded, so Career rebuilt tonight's segment.</p><button class="btn live-primary" onclick="gauntletLiveShowIntro()">RETURN TO SHOW</button><button class="btn secondary" onclick="gauntletLiveCalendar()">RETURN TO CALENDAR</button></section>`);
 }
};
