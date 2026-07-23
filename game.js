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
 render(`<section class="collection-screen">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">LEGACY PRO WRESTLING PERSONNEL</div><h1>CHARACTER DATABASE</h1><p>Wrestlers, managers and the broadcast team.</p></div><strong>${WRESTLERS.length+managers.length+broadcast.length}</strong></header><h2 class="collection-section-title">WRESTLERS</h2><div class="collection-grid">${[...WRESTLERS].sort((a,b)=>a.name.replace(/[\"']/g,'').localeCompare(b.name.replace(/[\"']/g,''))).map(w=>`<button class="collection-tile" onclick="collectionProfile('${w.id}')">${imageWithFallback(w,'full','art-full','collection')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div><h2 class="collection-section-title">MANAGERS</h2><div class="collection-grid support-grid">${supportTiles(managers)}</div><h2 class="collection-section-title">BROADCAST TEAM</h2><div class="collection-grid support-grid">${supportTiles(broadcast)}</div></section>`)
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
 render(`<section class="stats-framework">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">YOUR LEGACY</div><h1>STATISTICS</h1><p>Persistent records from Tag Team Gauntlet and Quick Match.</p></div></header><div class="stat-cards"><article><small>CAREER</small><b>${stats.total}</b><span>Total Matches</span></article><article><small>RECORD</small><b>${record}</b><span>Wins & Losses</span></article><article><small>BEST RUN</small><b>${stats.bestGauntlet}</b><span>Longest Gauntlet Streak</span></article><article><small>COLLECTION</small><b>${WRESTLERS.length}</b><span>Wrestler Profiles</span></article></div><div class="stats-tabs"><button class="${tab==='career'?'active':''}" onclick="statisticsMenu('career')">CAREER</button><button class="${tab==='wrestlers'?'active':''}" onclick="statisticsMenu('wrestlers')">WRESTLERS</button><button class="${tab==='teams'?'active':''}" onclick="statisticsMenu('teams')">TEAMS</button><button class="${tab==='records'?'active':''}" onclick="statisticsMenu('records')">RECORDS</button></div><div class="stats-detail">${detail}</div></section>`)
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
const WRESTLER_DECISIONS={"jack-mercer":[["Throw the First Punch","Invite the Brawl","Cold-Stare the Challenger","Take the Centre","Make It a Bar Fight"],["Ice-Cold Pressure","Hammer the Body","Drag It to the Ropes","Trade Heavy Hands","Refuse to Back Down"],["Fight Through the Freeze","Dare Him to Hit Harder","Southern Grit","Brawl Back to Life","Plant Both Boots"],["Call for Ice Breaker","End It with a Right Hand","Freeze the Comeback","Settle This Like a Brawler","One Last Bar-Room Swing"]],"victor-royale":[["Issue a Royal Decree","Command the Opening","Make Him Bow","Dictate the Pace","Claim the Centre"],["Rule the Ring","Execute the Royal Plan","Use the Referee","Slow the Peasant Down","Protect the Crown"],["Restore the Kingdom","Escape with Royal Timing","Order a Counterattack","Never Show Panic","Reclaim the Throne"],["Call for Royal Decree","Crown the Challenger","Finish by Royal Order","Seal the Kingdom","Demand the Final Bow"]],"jett-valentine":[["Steal the Spotlight","Blow a Kiss","Pose Before Contact","Dance Out of Danger","Make the Cameras Watch"],["Heartbreaker Takes Control","Turn the Ropes into a Stage","Dazzle the Front Row","Showboat and Strike","Hold the Spotlight"],["Find the Camera","Break Their Heart","Spin Back into Control","Feed Off the Attention","Refuse to Leave the Stage"],["Call for Heart Stopper","End on the Hard Camera","Take the Final Bow","Steal the Finish","Make It Picture Perfect"]],"revenant":[["Walk Through the First Shot","Rise from the Darkness","Stand Motionless","Let the Lights Flicker","Invite the Fear"],["Absorb the Punishment","Stalk Without Emotion","Turn Pain into Power","Darken the Arena","Refuse to Stay Down"],["Sit Straight Up","Return from the Dead","Silence the Crowd","Walk Through the Storm","Rise Again"],["Call for Final Reckoning","End It in Darkness","Claim Another Soul","Make the Lights Go Out","Deliver the Last Omen"]],"nightwatch":[["Strike from the Blind Side","Control the Shadows","Cut Off Every Exit","Raise the Black Bat","Wait in Silence"],["Enforce the Darkness","Trap Him by the Ropes","Stalk the Legal Man","Use Perfect Timing","Protect the Sentinel"],["Disappear and Return","Counter from the Shadows","Stand Guard","Turn Silence into Violence","Find the Blind Side"],["Call for Midnight Verdict","Deliver the Final Warning","End the Watch","Strike at Midnight","Close Every Escape"]],"titan":[["Find the Hard Camera","Make a Blockbuster Entrance","Own the Main Event","Pose Before the Hit","Start the Show"],["Direct the Action","Hit the Blockbuster Beat","Work the Camera Angle","Turn It into a Spectacle","Steal the Scene"],["Rewrite the Ending","Find Another Take","Play to the Balcony","Make the Comeback Cinematic","Refuse a Bad Ending"],["Call for Box Office Bomb","Deliver the Final Scene","Win the Main Event","Take the Closing Shot","Roll the Credits"]],"mason-marks":[["Win the First Exchange","Test the Balance","Target the Wrist","Set the Technical Pace","Force a Clean Lock-Up"],["Dissect the Arm","Chain the Holds","Control the Hips","Transition Without Space","Turn It into a Clinic"],["Find the Technical Escape","Reverse Three Moves Ahead","Rebuild the Base","Counter with Precision","Trust the Fundamentals"],["Call for Perfect Execution","Finish the Clinic","Trap the Final Hold","Execute the Winning Sequence","Leave No Technical Error"]],"hollowman":[["Stalk from the Corner","Tilt the Stitched Mask","Invite the Nightmare","Walk Through the Opening","Make the Arena Uneasy"],["Drag Him into the Woods","Absorb the Impact","Keep Advancing","Turn Fear into Control","Breathe Behind the Mask"],["Rise from the Canvas","Refuse the Last Breath","Stalk Through the Pain","Make Him Doubt Reality","Return from the Dark"],["Call for Last Breath","End the Urban Legend","Take Him into the Woods","Close the Final Chapter","Leave No Witness"]],"damian-black":[["Wait for One Opening","Circle in Silence","Measure the Distance","Strike Without Warning","Hide the Kill Shot"],["Exploit the Smallest Error","Cut Off the Angle","Stay Emotionless","Control with Precision","Make Stillness Dangerous"],["Disappear from Danger","Counter in One Motion","Reset the Target","Find the Blind Angle","Turn Defence into a Strike"],["Call for Kill Shot","End It Without Warning","Take the Perfect Angle","One Opening, One Strike","Finish in Silence"]],"elias-crowe":[["Laugh at the First Hit","Start the Chaos","Welcome the Pain","Rush the Corner","Make the Referee Nervous"],["Turn It into a Street Fight","Rip at the Straitjacket","Make Order Impossible","Fight Outside the Rules","Smile Through the Damage"],["Laugh Back to Life","Crawl Toward Danger","Beg for More","Turn Pain into Madness","Break the Match Open"],["Call for Beautiful Disaster","Finish in Total Chaos","Make the Ending Unhinged","Crash Through the Limit","Leave the Ring in Ruins"]],"el-rey-del-cielo":[["Take to the Sky","Test the Ropes","Spin Past the Lock-Up","Make Gravity Optional","Launch Before He Blinks"],["Own the Airspace","Change Direction Mid-Flight","Use the Ropes as Wings","Fly Over the Defence","Keep the Pace Impossible"],["Spring Back to Life","Escape Through the Air","Land on His Feet","Reach for the Sky","Turn the Fall into Flight"],["Call for Crown of the Sky","Finish from Above","Take the Final Flight","Rule the Air One Last Time","Drop from the Heavens"]],"max-justice":[["Stand for the Crowd","Raise the Heroic Fist","Meet Him Head On","Fight the Right Way","Protect the Centre"],["Heroic Pressure","Rally the Arena","Power Through the Defence","Keep Fighting Fair","Turn Courage into Control"],["Rise for Everyone","Launch the Hero\u2019s Return","Refuse to Surrender","Fight Through the Pain","Stand Tall Again"],["Call for Hero\u2019s End","Deliver Street Justice","Finish for the People","One Final Act of Courage","End It Like a Hero"]],"primal":[["Hunt from the Bell","Let Out the Roar","Drop into a Predator Stance","Charge on Instinct","Claim the Territory"],["Overwhelm the Prey","Abandon Technique","Use Raw Force","Pace Behind the Target","Tear Through the Defence"],["Unleash the Beast","Roar Through the Pain","Fight on Pure Instinct","Break Free of the Trap","Turn Wounds into Rage"],["Call for Apex Assault","Finish the Hunt","Devour the Final Opening","Strike Like the Apex","End It with Raw Instinct"]],"lucas-bennett":[["Shoot for the Takedown","Set an Olympic Pace","Win the Scramble","Test the Base","Wrestle for Position"],["Chain the Takedowns","Use Elite Conditioning","Force the Mat Game","Control Every Scramble","Turn It into a Final"],["Rebuild the Base","Wrestle Out of Danger","Trust the Conditioning","Reverse the Position","Win the Desperate Scramble"],["Call for Gold Standard","Finish the Tournament","Execute the Medal Sequence","Win the Final Exchange","Seal It with Elite Wrestling"]],"marcus-king":[["Throw the First Punch","Rule the Streets","Take the Block","Talk and Swing","Start a Street Fight"],["Street-King Pressure","Back Him into the Corner","Fight with Rhythm","Own the Neighbourhood","Unload the Combination"],["Fight Back from the Streets","Dig into Street Grit","Swing Until It Changes","Refuse to Be Run Off","Turn Pain into Confidence"],["Call for Street Justice","End It on His Block","Deliver the King\u2019s Verdict","Finish with the Combination","Rule the Final Exchange"]],"mateo-vega":[["Sell the Fake","Point Behind Him","Make Him Guess","Pretend to Slip","Steal the First Opening"],["Run the Con","Distract the Referee","Attack from the Other Side","Fake the Injury","Smile Through the Trick"],["Play Possum","Escape with a Lie","Make Him Chase the Wrong Target","Spring the Counter","Turn Panic into a Con"],["Call for Grand Illusion","Steal the Finish","End It with Misdirection","Pull the Final Trick","Make the Pin Disappear"]],"ryder-phoenix":[["Start the Concert","Demand the Spotlight","Play to the Front Row","Mouth Off Before Contact","Hit the Opening Riff"],["Rockstar Pressure","Play Air Guitar","Turn the Ring into a Stage","Keep the Crowd Singing","Make Every Hit a Chorus"],["Find the Encore","Rise for One More Song","Feed Off the Noise","Refuse to Leave the Stage","Turn the Boos into Fuel"],["Call for Final Encore","Drop the Last Note","End the Show Loud","Take the Closing Solo","Finish the Concert"]],"sterling-sinclair":[["Flash the Gold","Outclass the Challenger","Make Him Chase","Dust Off the Shoulder","Set an Expensive Pace"],["Apply the Golden Touch","Wrestle with Luxury","Humiliate the Opposition","Keep the Suit Clean","Make It Look Effortless"],["Protect the Investment","Escape with Class","Restore the Golden Image","Never Show Desperation","Buy Time with Style"],["Call for Golden Touch","Close the Deal","Finish with First-Class Precision","Cash In the Final Opening","Make the Ending Exclusive"]],"dave-maddox":[["Outwork Him Early","Set the Veteran Pace","Make Him Earn Everything","Start the Long Shift","Win the First Grind"],["Keep Grinding Forward","Use Veteran Timing","Turn Work Rate into Control","Refuse the Easy Way","Wear Him Down Honestly"],["Find Another Gear","Work Through the Exhaustion","Drag Himself Up","Give One More Effort","Outlast the Storm"],["Call for Final Shift","Finish the Long Night","Empty the Tank","Win with Veteran Grit","One Last Workhorse Burst"]],"logan-steele":[["Cup an Ear to the Crowd","Fire Up the Arena","Point to the People","Stand Like a Legend","Test His Strength"],["Legendary Pressure","Feed Off the Noise","Shake Off the Damage","Use Veteran Timing","Make the Arena Believe"],["Hulk Up","The Legend Won\u2019t Die","Rise with the Crowd","Stand Taller","Find the Heroic Second Wind"],["Call for Icon Slam","Finish the Story","End It Like a Legend","Give the Crowd the Moment","Deliver One More Icon Slam"]]};

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
const EXPANDED_DECISION_NAMES={
 opening:['Take the First Step','Set the Tempo','Claim the Spotlight','Test Their Nerve','Own the Opening','Make Them React'],
 control:['Dictate the Exchange','Cut Off the Ring','Turn Up the Pressure','Change the Rhythm','Force the Mistake','Make the Moment Count'],
 crisis:['Refuse to Fold','Create an Escape','Risk the Counter','Find Another Gear','Break Their Momentum','Survive the Storm'],
 finish:['Steal the Finish','End It With Style','Commit to the Closing Shot','Make It Picture Perfect','Leave No Doubt','Go for Everything']
};
function buildPersonalOptions(w,phase){
 const base=(WRESTLER_DECISIONS[w.id]||WRESTLER_DECISIONS['dave-maddox'])[['opening','control','crisis','finish'].indexOf(phase)]||[];
 const profile=profileFor(w),flavour=(profile?.archetype||'').split(' ')[0];
 const expanded=(EXPANDED_DECISION_NAMES[phase]||[]).map((name,i)=>i%2===0?`${flavour} ${name}`:name);
 const names=[...new Set([...base,...expanded])];const actions=actionOrder(phase);
 return names.map((name,i)=>({action:actions[i%actions.length],name,desc:'',exclusive:true,attr:Math.round(attributeValue(w,actions[i%actions.length]))}))
}
function freshOptions(pool,count=3){M.decisionSeen=M.decisionSeen||[];let fresh=pool.filter(x=>!M.decisionSeen.includes(x.name));if(fresh.length<count)fresh=pool;const chosen=pick(fresh,count);chosen.forEach(x=>M.decisionSeen.push(x.name));M.decisionSeen=M.decisionSeen.slice(-18);return chosen}
function decisionChance(w,o,action){const edge=(attributeValue(w,action)-((o.resilience+o.technique)/2))/250;const control=(M.playerControl-50)/220;const base={risk:.56,control:.74,pressure:.69,comeback:.59,survive:.78,finisher:.50,tag:.76}[action]||.65;return clamp(base+edge+control,.28,.91)}
function choiceCommentary(choice,w,o,success){const label=choice.name;if(success){const pools=[`${w.name} chooses ${label}—and it works perfectly!`,`${label} becomes the moment that changes the match for ${w.name}!`,`${w.name} makes this match unmistakably his own with ${label}!`];return one(pools)}const pools=[`${w.name} commits to ${label}, but ${o.name} has it scouted!`,`${label} nearly changes everything—until ${o.name} shuts the door.`,`${w.name} tries to impose his identity with ${label}, but the timing is wrong.`];return one(pools)}

const STORY_TYPES={
 classic:{name:'Classic Wrestling Match',min:14,max:18,decisions:4,bias:0},
 war:{name:'Back-and-Forth War',min:18,max:23,decisions:5,bias:0,nearFall:.18},
 comeback:{name:'Underdog Comeback',min:16,max:21,decisions:5,bias:-7,comeback:true},
 sprint:{name:'Fast Sprint',min:10,max:13,decisions:3,bias:2},
 domination:{name:'One-Sided Domination',min:10,max:14,decisions:3,bias:12},
 tagClinic:{name:'Tag Team Showcase',min:16,max:21,decisions:5,bias:0,tags:true},
 upset:{name:'Upset Special',min:14,max:19,decisions:4,bias:-4,upset:true}
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
 M={storyKey,story,eventTarget,eventIndex:0,phaseIndex:0,activeP:0,activeO:0,playerControl:50+hiddenEdge,playerMom:10+S.momentum*2,oppMom:12+S.streak,log:[],highlights:[],nearFalls:0,finishers:0,tags:0,decisionsMade:0,nextDecisionAt:decisionPoints(eventTarget,story.decisions),waiting:false,ended:false,latest:'',winner:null,loser:null,turningPoint:'',bestMoment:'',mvp:null,matchSeconds:Math.round(rnd(330,900)),phaseLabel:'Opening Bell',spotlight:null,personalityMoments:{},startPlayer,startOpp,performancePlayer:0,performanceOpp:0,decisionPlayer:0,decisionOpp:0,crowd:0,crowdPlayer:0,crowdOpp:0,finalPlayer:0,finalOpp:0,finishType:'',decisionSeen:[],currentDecision:null,decisionOutcome:null,decisionHistory:[],psychologyMomentum:0,decisionStreak:0,totalDecisions:Math.max(3,story.decisions),carriedBonus};
 addBroadcast('broadcast',`${isSinglesMatch()?'YOUR WRESTLER':'YOUR TEAM'}: ${S.team.map(wrestlerIntro).join(' / ')}`); addBroadcast('broadcast',`${isSinglesMatch()?'OPPONENT':'OPPOSITION'}: ${S.opp.map(wrestlerIntro).join(' / ')}`);
 addBroadcast('phase','OPENING BELL');
 addBroadcast('commentary',commentatorLine(COMMENTATORS.play,one(isSinglesMatch()?BROADCAST_COMMENTARY.openingSingles:BROADCAST_COMMENTARY.openingTag)));
 addBroadcast('commentary',commentatorLine(COMMENTATORS.colour,one(BROADCAST_COMMENTARY.openingTag)));
 const rivalry=rivalryStatus();if(rivalry.active){addBroadcast('phase',`RIVALRY MATCH · MEETING ${rivalry.meetings+1}`);addBroadcast('commentary',commentatorLine(COMMENTATORS.play,`${rivalry.name} has become a familiar and dangerous rival. This one is personal.`));}
 if(S.manager){addBroadcast('manager',`${S.manager.name}: “${S.manager.voice}”`);addBroadcast('commentary',commentatorLine(COMMENTATORS.play,`${S.manager.name} is at ringside and could be a major factor tonight.`));}
 renderMatch();scheduleNext(900);
}
function decisionPoints(total,count){
 count=Math.max(3,Math.min(count,total-4));
 const pts=[];let last=1;
 for(let i=1;i<=count;i++){
  const ideal=Math.round(total*(i/(count+1)));
  const min=last+2,max=total-((count-i+1)*2);
  const point=Math.max(min,Math.min(max,ideal));
  pts.push(point);last=point;
 }
 return pts;
}
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
 render(`<section class="panel story-panel match-ui-v2 ${M.decisionOutcome?'psychology-updating':''}">
 <div class="broadcast-top"><div><small>MATCH BROADCAST</small><h1>${M.phaseLabel}</h1></div><div class="story-chip">${M.story.name}</div></div><div class="broadcast-status prominent-status"><span>${M.waiting?`Decision ${Math.min(M.decisionsMade+1,M.totalDecisions)} of ${M.totalDecisions} · `:''}Moment ${Math.min(M.eventIndex+1,M.eventTarget)} of ${M.eventTarget}</span><span>${formatTime(Math.round(M.matchSeconds*(M.eventIndex/Math.max(1,M.eventTarget))))}</span></div>${managerStrip()}
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
function decisionHTML(){
 if(M.decisionOutcome){const x=M.decisionOutcome,sign=n=>n>0?`+${n}`:`${n}`;return `<div class="story-decision decision-outcome outcome-${x.key}"><small>YOUR CALL</small><h2>${x.label}</h2><p>${x.summary}</p><div class="outcome-deltas"><span><b>${sign(x.score)}</b><small>MATCH SCORE</small></span><span><b>${sign(x.control)}</b><small>CONTROL</small></span><span><b>${sign(x.crowd)}</b><small>CROWD</small></span></div><div class="outcome-progress">RESULT APPLIED</div><button type="button" class="btn outcome-continue" style="display:block!important;visibility:visible!important;opacity:1!important;margin:18px auto 2px!important;pointer-events:auto!important" onclick="continueDecisionOutcome()">CONTINUE MATCH</button></div>`}
 const d=getDecision();M.currentDecision=d;return `<div class="story-decision"><small>YOUR CALL</small><h2>${d.title}</h2><p>${d.text}</p><div class="choice-grid">${d.options.map((x,i)=>`<button class="choice choice-name-only" onclick="storyChoice('choice-${i}')"><b>${x.name}</b></button>`).join('')}</div></div>`}

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
 const phase=PHASES[M.phaseIndex].id;const openingGauntlet=!S.exhibition&&S.streak===0;let playerActs=false,actor=null,victim=null;
 const psychEdge=clamp((M.psychologyMomentum||0)/100,-.24,.24);
 playerActs=Math.random()<clamp((openingGauntlet?Math.max(.72,M.playerControl/100):(M.playerControl/100))+psychEdge,.12,.88);
 actor=eventWrestler(playerActs?'player':'opp');victim=eventWrestler(playerActs?'opp':'player');
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
function psychologyTier(chance,roll){
 // Match Psychology 2.2: outcomes are intentionally uncertain. Skill nudges the roll,
 // but no option is a guaranteed success.
 const adjusted=clamp(roll-((chance-.60)*.45),0,1);
 if(adjusted<.15)return {key:'major-success',label:'MAJOR SUCCESS',mult:1.45};
 if(adjusted<.50)return {key:'success',label:'SUCCESS',mult:1};
 if(adjusted<.75)return {key:'mixed',label:'MIXED RESULT',mult:.45};
 if(adjusted<.95)return {key:'failure',label:'FAILURE',mult:-.65};
 return {key:'major-failure',label:'MAJOR FAILURE',mult:-1.1};
}
function psychologyImpact(action){return ({
 risk:{score:10,control:7,crowd:13},control:{score:6,control:12,crowd:3},pressure:{score:8,control:9,crowd:7},
 comeback:{score:9,control:14,crowd:13},survive:{score:4,control:7,crowd:5},finisher:{score:16,control:12,crowd:15},tag:{score:8,control:11,crowd:10}
})[action]||{score:6,control:8,crowd:6}}
function psychologyCommentary(tier,choice,p,o){
 if(tier.key==='major-success')return [`${p.name} turns the moment into a spectacular breakthrough.`,`${choice.name} lands exactly as intended and the entire match swings toward ${p.name}.`];
 if(tier.key==='success')return [`${p.name} makes the call pay off.`,`${choice.name} creates a clear advantage without giving ${o.name} time to recover.`];
 if(tier.key==='mixed')return [`${p.name} gains ground, but ${o.name} prevents a complete takeover.`,`${choice.name} produces a trade-off and keeps both wrestlers in the fight.`];
 if(tier.key==='failure')return [`${o.name} anticipates the play and shuts it down.`,`${p.name} loses the exchange after committing at the wrong moment.`];
 return [`The gamble backfires badly for ${p.name}.`,`${o.name} turns the mistake into a major swing in score, control and crowd response.`];
}
function storyChoice(token){
 if(!M||!M.waiting||M.decisionOutcome)return;
 const choice=M.currentDecision?.options?.find(x=>x.token===token);if(!choice)return;
 const p=S.team[M.activeP],o=S.opp[M.activeO],id=choice.action;
 // Capture the exact values rendered on the match screen before applying the decision.
 // The result tiles must report the visible scoreboard change, including the small
 // Match Score contribution created by Crowd, rather than only the raw decision points.
 const beforeProjectedPlayer=projectedScore('player');
 const beforeControl=Math.round(M.playerControl);
 const beforeCrowd=Math.round(M.crowd);
 let chance=decisionChance(p,o,id);
 const tier=psychologyTier(chance,Math.random()),base=psychologyImpact(id);
 let score=Math.round(base.score*tier.mult),control=Math.round(base.control*tier.mult),crowd=Math.round(base.crowd*tier.mult);
 if(tier.key==='mixed'){
  // Mixed outcomes always contain a real trade-off rather than three small gains.
  if(id==='risk'||id==='finisher'||id==='comeback'){score=Math.max(2,score);crowd=Math.max(4,crowd);control=-Math.max(3,Math.round(base.control*.55))}
  else if(id==='control'||id==='survive'){control=Math.max(3,control);score=-Math.max(2,Math.round(base.score*.45));crowd=Math.max(1,crowd)}
  else {score=Math.max(2,score);control=Math.max(2,control);crowd=-Math.max(2,Math.round(base.crowd*.5))}
 }
 if(id==='tag'&&S.team.length>1&&tier.mult>0){M.activeP=1-M.activeP;M.tags++}
 if(id==='finisher')M.finishers++;
 addMatchScore('player',score,'decision');
 if(score<0)addMatchScore('opp',Math.max(2,Math.round(Math.abs(score)*.45)));
 shiftControl(control,`${choice.name} produced a ${tier.label.toLowerCase()}.`);
 // heatCrowd already applies both positive and negative movement to M.crowd.
 // The previous extra negative adjustment caused failed choices to subtract Crowd twice.
 heatCrowd(crowd,crowd>=0?'player':'opp');
 const momentumDelta={
  'major-success':18,'success':11,'mixed':3,'failure':-10,'major-failure':-18
 }[tier.key]||0;
 M.psychologyMomentum=clamp((M.psychologyMomentum||0)+momentumDelta,-45,45);
 M.playerMom=clamp(M.playerMom+Math.round(control*.7)+Math.max(0,Math.round(momentumDelta*.35)),0,100);
 if(momentumDelta<0)M.oppMom=clamp(M.oppMom+Math.abs(momentumDelta),0,100);
 const positive=tier.key==='success'||tier.key==='major-success';
 const negative=tier.key==='failure'||tier.key==='major-failure';
 M.decisionStreak=positive?Math.max(1,(M.decisionStreak||0)+1):negative?Math.min(-1,(M.decisionStreak||0)-1):0;
 const calls=psychologyCommentary(tier,choice,p,o);
 if(M.decisionStreak>=2)calls[1]=`${p.name} is building a run of successful calls and the opponent is struggling to interrupt it.`;
 if(M.decisionStreak<=-2)calls[1]=`The match is slipping away from ${p.name}; the next decision has become critical.`;
 addBroadcast(tier.mult>=0?'choice':'counter',calls[0],{highlight:true,weight:Math.abs(tier.mult)+1});
 addBroadcast('commentary',commentatorLine(COMMENTATORS.colour,calls[1]));
 const visibleScore=projectedScore('player')-beforeProjectedPlayer;
 const visibleControl=Math.round(M.playerControl)-beforeControl;
 const visibleCrowd=Math.round(M.crowd)-beforeCrowd;
 M.decisionOutcome={...tier,score:visibleScore,control:visibleControl,crowd:visibleCrowd,rawScore:score,rawControl:control,rawCrowd:crowd,summary:calls[0],choice:choice.name};
 M.decisionHistory.push({choice:choice.name,outcome:tier.label,score:visibleScore,control:visibleControl,crowd:visibleCrowd,rawScore:score,rawControl:control,rawCrowd:crowd,momentum:momentumDelta});
 M.decisionsMade++;renderMatch();
 clearStoryTimer();
}
function continueDecisionOutcome(){
 if(!M||!M.decisionOutcome)return;
 M.decisionOutcome=null;M.currentDecision=null;M.waiting=false;renderMatch();scheduleNext(650);
}

function resolveFinish(){
 if(M.ended)return;M.phaseIndex=5;M.phaseLabel='Finish';addBroadcast('phase','FINISH');
 const crowdBonusPlayer=Math.round(M.crowdPlayer*.12),crowdBonusOpp=Math.round(M.crowdOpp*.12);
 const psychologyCarry=Math.round((M.psychologyMomentum||0)*.55);
 if(psychologyCarry>0)M.decisionPlayer+=psychologyCarry;else if(psychologyCarry<0)M.decisionOpp+=Math.abs(psychologyCarry);
 const finishVariancePlayer=Math.round(rnd(-3,3)),finishVarianceOpp=Math.round(rnd(-3,3));
 M.performancePlayer+=finishVariancePlayer;M.performanceOpp+=finishVarianceOpp;
 // Career opponents must remain active participants unless a future explicit squash flag says otherwise.
 if(S.liveMode){
  const aiPerfFloor=Math.round(rnd(12,24));
  const aiDecisionFloor=Math.round(rnd(20,42));
  const aiCrowdFloor=Math.round(rnd(10,28));
  M.performanceOpp=Math.max(M.performanceOpp,aiPerfFloor);
  M.decisionOpp=Math.max(M.decisionOpp,aiDecisionFloor);
  M.crowdOpp=Math.max(M.crowdOpp,aiCrowdFloor);
 }
 const adjustedCrowdBonusOpp=Math.round(M.crowdOpp*.12);
 M.finalPlayer=Math.round(M.startPlayer+M.performancePlayer+M.decisionPlayer+crowdBonusPlayer);
 M.finalOpp=Math.round(M.startOpp+M.performanceOpp+M.decisionOpp+adjustedCrowdBonusOpp);
 const positiveDecisions=(M.decisionHistory||[]).filter(x=>x.outcome==='SUCCESS'||x.outcome==='MAJOR SUCCESS').length;
 const allPositive=M.decisionHistory?.length>=3&&positiveDecisions===M.decisionHistory.length;
 if(allPositive&&M.finalPlayer<M.finalOpp&&(M.finalOpp-M.finalPlayer)<=24&&Math.random()<.82){
  const rescue=(M.finalOpp-M.finalPlayer)+Math.round(rnd(1,6));
  M.decisionPlayer+=rescue;M.finalPlayer+=rescue;
  addBroadcast('commentary',commentatorLine(COMMENTATORS.colour,'Those consistently strong decisions changed the closing stretch and gave the player a real path to victory.'));
 }
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
 const rating=clamp(1.45+M.highlights.length*.085+M.nearFalls*.14+M.finishers*.09+M.tags*.035+M.eventTarget*.032+M.crowd*.0045+(Math.random()<.025?.35:0),1,5);M.completedRating=Number(rating.toFixed(2));
 const ratingData=matchRatingData(rating),highlights=[...new Set(M.highlights)].slice(-5),story=buildSummaryStory();
 recordCompletedMatch(win,rating);
 M.lossMessage=`${M.winner.name} wins after a ${rating.toFixed(1)}-star match.`;
 const playerCrowd=Math.round(M.crowdPlayer*.12),oppCrowd=Math.round(M.crowdOpp*.12);
 const winningSide=win?S.team:S.opp;
 const resultArt=winningSide.map(w=>heroPortrait(w,'winner',characterImageConfig(w)?'victory':'full','resultVictory')).join('');
 render(`<section class="panel match-result summary-panel presentation-summary">
 <div class="actions top-actions lpw837-result-actions-top">${S.exhibition?`<button class="btn" onclick="quickRematch()">REMATCH</button><button class="btn secondary" onclick="quickMatchMenu()">QUICK MATCH MENU</button>`:(win?`<button class="btn" onclick="postMatchFlow()">${S.tournament?'ADVANCE TO NEXT ROUND':(S.specialSingles?'RETURN TO GAUNTLET':'CONTINUE BROADCAST')}</button>`:`<button class="btn" onclick="handleLoss()">CONTINUE</button>`)}</div>
 <div class="result-banner"><small>OFFICIAL RESULT</small><strong>${win?'YOU WON':'YOU LOST'}</strong></div><div class="winner-celebration television-winners result-${win?'win':'loss'}"><div class="confetti-field"></div><div class="winning-team-art ${isSinglesMatch()?'singles-winner':''}">${resultArt}</div><div class="winner-copy"><small>${isSinglesMatch()?'MATCH WINNER':'WINNING TEAM'}</small><h2>${teamName(winningSide)}</h2><p>${isSinglesMatch()?victoryCelebration(M.winner):`${winningSide[0].name} and ${winningSide[1].name} combine effectively and celebrate a commanding team victory.`}</p></div></div><div class="result-broadcast-header below-winners"><small>${S.exhibition?'EXHIBITION RESULT':'MATCH RESULT'} · ${isSinglesMatch()?'SINGLES':'TAG TEAM'}</small><h1>${finishHeadline()}</h1><p>${currentVenue()} · ${length}</p></div>${win&&S.manager?`<div class="manager-celebration">${npcImage(S.manager.id,'portrait')}<p><b>${S.manager.name}</b> celebrates at ringside: “${S.manager.voice}”</p></div>`:''}
 ${M.decisionHistory?.length?`<div class="psychology-breakdown"><div class="tv-kicker">MATCH PSYCHOLOGY 2.0</div><h2>YOUR DECISIONS</h2>${M.decisionHistory.map(x=>`<article><b>${x.choice}</b><span>${x.outcome}</span><small>Score ${x.score>0?'+':''}${x.score} · Control ${x.control>0?'+':''}${x.control} · Crowd ${x.crowd>0?'+':''}${x.crowd} · Momentum ${x.momentum>0?'+':''}${x.momentum||0}</small></article>`).join('')}</div>`:''}<div class="result-accolades"><article><small>MATCH RATING</small><span class="result-stars">${ratingData.stars}</span><strong>${rating.toFixed(1)} · ${ratingData.label}</strong></article><article><small>CROWD REACTION</small><b>${crowdReaction()}</b><strong>EXCITEMENT ${Math.round(M.crowd)}%</strong></article><article><small>FINISH</small><b>${M.finishType.toUpperCase()}</b><strong>${M.winner.name} · ${M.winner.finisher}</strong></article></div>
 <div class="match-breakdown"><h3>Match Score Breakdown</h3><div class="breakdown-head"><strong>${S.team.map(x=>x.name).join(' & ')}</strong><b>${M.finalPlayer} – ${M.finalOpp}</b><strong>${S.opp.map(x=>x.name).join(' & ')}</strong></div><div class="breakdown-row"><span>Match Readiness</span><b>${M.startPlayer}</b><i>${M.startOpp}</i></div><div class="breakdown-row"><span>Performance</span><b>${Math.round(M.performancePlayer)}</b><i>${Math.round(M.performanceOpp)}</i></div><div class="breakdown-row"><span>Crowd Bonus</span><b>${playerCrowd}</b><i>${oppCrowd}</i></div><div class="breakdown-row"><span>Decision Impact</span><b>${Math.round(M.decisionPlayer)}</b><i>${Math.round(M.decisionOpp)}</i></div></div>
 <div class="summary-grid"><article><small>MATCH STORY</small><p>${story}</p></article><article><small>MATCH ANALYSIS</small><p>${isSinglesMatch()?`${M.winner.name} controlled the decisive exchange and converted the final opening.`:mvpReason(M.mvp)}</p></article><article><small>TURNING POINT</small><p>${M.turningPoint||'The match remained balanced until the final exchange.'}</p></article><article><small>BEST MOMENT</small><p>${M.bestMoment||`${M.winner.name} delivered ${M.winner.finisher} to end the match.`}</p></article></div>
 <div class="highlight-reel"><h3>Broadcast Highlights</h3>${highlights.map(x=>`<p>${x}</p>`).join('')}</div><div class="actions lpw837-result-actions-bottom">${S.exhibition?`<button class="btn" onclick="quickRematch()">REMATCH</button><button class="btn secondary" onclick="quickMatchMenu()">QUICK MATCH MENU</button>`:(win?`<button class="btn" onclick="postMatchFlow()">${S.tournament?'ADVANCE TO NEXT ROUND':(S.specialSingles?'RETURN TO GAUNTLET':'CONTINUE BROADCAST')}</button>`:`<button class="btn" onclick="handleLoss()">CONTINUE</button>`)}</div></section>`)
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
 window.scrollTo(0,0);
 render(`<section class="panel live-onboarding live-onboarding-template-${s.img} live-onboarding-page-${page}"><div class="live-onboarding-art">${npcImage('veronica-vale',s.img)}</div><div class="live-onboarding-copy"><div class="tv-kicker">${s.k}</div><h1>${s.h}</h1><p>${s.p}</p><div class="live-onboarding-progress">${slides.map((_,i)=>`<span class="${i<=page?'on':''}"></span>`).join('')}</div><button class="btn live-primary" onclick="${last?'gauntletLiveFounderSelect()':`gauntletLiveIntro(${page+1})`}">${last?'SELECT STARTING WRESTLER':'CONTINUE'}</button></div></section>`)
 requestAnimationFrame(()=>window.scrollTo(0,0));
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
function lpwShowLogo(name){const cls=name.includes('MAYHEM')?'mayhem':'throwdown';const day=name.startsWith('MONDAY')?'MONDAY NIGHT':'THURSDAY NIGHT';const show=name.replace('MONDAY NIGHT ','').replace('THURSDAY NIGHT ','');return `<div class="lpw-show-logo ${cls}"><span>${day}</span><b>${show}</b></div>`}
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
/* 8.5.9 Decision Card Framework — enabled only for Jett Valentine. */
const JETT_DECISION_CARDS={
 opening:[
  {name:'Steal the Spotlight',slug:'steal-the-spotlight',action:'risk'},
  {name:'Showstopper',slug:'showstopper',action:'control'},
  {name:'Believe the Hype',slug:'believe-the-hype',action:'pressure'},
  {name:'Never Misses',slug:'never-misses',action:'control'}
 ],
 control:[
  {name:'Feed Off the Attention',slug:'feed-off-the-attention',action:'pressure'},
  {name:'Raise the Tempo',slug:'raise-the-tempo',action:'risk'},
  {name:'Flash of Brilliance',slug:'flash-of-brilliance',action:'control'},
  {name:'Picture Perfect',slug:'picture-perfect',action:'risk'},
  {name:'Stolen Moment',slug:'stolen-moment',action:'pressure'}
 ],
 crisis:[
  {name:'One Last Encore',slug:'one-last-encore',action:'comeback'},
  {name:'Heart of Gold',slug:'heart-of-gold',action:'survive'},
  {name:'Break Their Heart',slug:'break-their-heart',action:'comeback'}
 ],
 finish:[
  {name:'Tune Up the Band',slug:'tune-up-the-band',action:'finisher'},
  {name:'High Risk',slug:'high-risk',action:'risk'},
  {name:'Heartbreaker',slug:'heartbreaker',action:'finisher'}
 ]
};
const lpw855BuildPersonalOptions=buildPersonalOptions;
buildPersonalOptions=function(w,phase){
 if(!w||w.id!=='jett-valentine')return lpw855BuildPersonalOptions(w,phase);
 const cards=JETT_DECISION_CARDS[phase]||JETT_DECISION_CARDS.control;
 return cards.map(card=>({
  ...card,
  desc:'',exclusive:true,
  attr:Math.round(attributeValue(w,card.action)),
  image:`assets/decisions/jett-valentine/${card.slug}.webp`
 }));
};
function isJettDecisionPresentation(){return S?.team?.[M?.activeP]?.id==='jett-valentine'}
function jettDecisionCardHTML(option,index){
 const label=String(option.name||'Decision').replace(/"/g,'&quot;');
 return `<button type="button" class="jett-decision-card" onclick="storyChoice('choice-${index}')" aria-label="Choose ${label}"><span class="jett-card-art"><img src="${option.image}" alt="${label}" loading="eager"></span><span class="jett-card-shade"></span><span class="jett-card-copy"><small>JETT VALENTINE</small><b>${option.name}</b></span></button>`;
}

decisionHTML=function(){
 if(M.decisionOutcome){
  const x=M.decisionOutcome,sign=n=>n>0?`+${n}`:`${n}`;
  return `<div class="story-decision psychology-v2-foundation decision-outcome outcome-${x.key}"><div class="your-call-label">YOUR CALL</div><h2>${x.label}</h2><p>${x.summary}</p><div class="outcome-deltas"><span><b>${sign(x.score)}</b><small>MATCH SCORE</small></span><span><b>${sign(x.control)}</b><small>CONTROL</small></span><span><b>${sign(x.crowd)}</b><small>CROWD</small></span></div><div class="outcome-progress">RESULT APPLIED</div><button type="button" class="btn outcome-continue" style="display:block!important;visibility:visible!important;opacity:1!important;margin:18px auto 2px!important;pointer-events:auto!important" onclick="continueDecisionOutcome()">CONTINUE MATCH</button></div>`;
 }
 const d=getDecision();M.currentDecision=d;
 if(isJettDecisionPresentation())return `<div class="story-decision psychology-v2-foundation jett-decision-presentation"><div class="your-call-label">YOUR CALL</div><h2>${d.title}</h2><p>${d.text}</p><div class="jett-decision-grid">${d.options.map(jettDecisionCardHTML).join('')}</div></div>`;
 return `<div class="story-decision psychology-v2-foundation"><div class="your-call-label">YOUR CALL</div><h2>${d.title}</h2><p>${d.text}</p><div class="choice-grid psychology-neutral">${d.options.map((x,i)=>`<button class="choice psychology-choice choice-name-only" onclick="storyChoice('choice-${i}')"><b>${x.name}</b></button>`).join('')}</div></div>`
};

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

/* LEGACY Pro Wrestling 8.2.8 — roster 29–32 presentation and psychology */
Object.assign(FEATURE_LINES,{
 'rex-hunter':'The Renegade lives for the moment nobody can control.',
 'magnus-fury':'The Berserker brings an entire arena to its feet.',
 'travis-stone':'When Big Rig starts moving, nothing stops the load.',
 'marco-montana':'The Don always makes an offer his opponent cannot survive.'
});
Object.assign(BIOS,{
 'rex-hunter':'A flamboyant renegade whose intensity, instinct and showmanship can turn any match into an unforgettable spectacle.',
 'magnus-fury':'A colourful powerhouse driven by raw adrenaline, explosive speed and an apparently limitless reserve of fighting spirit.',
 'travis-stone':'A towering enforcer whose quiet confidence and industrial strength make every movement feel inevitable.',
 'marco-montana':'A smooth, calculating operator who combines technical precision, streetwise timing and effortless superstar swagger.'
});
Object.assign(PERSONALITY_PROFILES,{
 'rex-hunter':{archetype:'The Renegade',events:['points skyward before surging forward','turns toward the crowd and feeds on the noise','changes rhythm without warning','laughs through the opponent’s offence','creates chaos and somehow controls it','signals that the next moment belongs to him']},
 'magnus-fury':{archetype:'The Berserker',events:['shakes the ropes with uncontrollable energy','bursts forward in a wave of colour and power','roars back to his feet','absorbs the impact and demands another','fires up as the arena rises','moves with impossible speed for his size']},
 'travis-stone':{archetype:'The Juggernaut',events:['steps forward without changing expression','cuts off the ring with one heavy stride','shrugs away the strike','raises one fist and waits','drives through the opponent with industrial force','stands over the damage in complete silence']},
 'marco-montana':{archetype:'The Don',events:['adjusts his gold chain and smiles','waves away the opponent’s challenge','controls the exchange with effortless timing','leans close and offers one final warning','turns a cheap opening into perfect strategy','smirks at the hard camera after taking control']}
});
Object.assign(WRESTLER_DECISIONS,{
 'rex-hunter':[['Create the First Moment','Point to the Sky','Change the Rhythm','Feed on the Noise','Start the Hunt'],['Turn Chaos into Control','Make It Unforgettable','Follow the Instinct','Raise the Intensity','Take Over the Spotlight'],['Fight Through the Madness','Refuse the Quiet Ending','Find Another Gear','Hear the Crowd Again','Hunt for the Opening'],['Call for Hunter\'s Mark','Finish the Hunt','Create the Lasting Moment','End It on His Terms','Make the Final Statement']],
 'magnus-fury':[['Release the Energy','Shake the Foundations','Charge Without Fear','Call to the Crowd','Begin the Rampage'],['Become Unstoppable','Overwhelm with Power','Move at Full Force','Roar Through the Pain','Break Their Resistance'],['Rise Like a Berserker','Find the Final Reserve','Refuse to Stay Down','Turn Pain into Fury','Summon One More Charge'],['Call for Berserker Bomb','End the Rampage','Deliver the Final Surge','Finish with Raw Power','Unleash Everything']],
 'travis-stone':[['Claim the Road','Move the Heavy Load','Cut Off the Ring','Set the Pace','Make the First Impact'],['Build Industrial Pressure','Drive Straight Through','Carry the Full Weight','Take Away Every Exit','Keep the Engine Running'],['Restart the Engine','Haul Himself Upright','Absorb the Collision','Refuse to Be Moved','Find One More Mile'],['Call for Dead Freight','Deliver the Final Load','End of the Road','Bring the Rig Through','Finish the Haul']],
 'marco-montana':[['Set the Terms','Make the First Offer','Control the Business','Show Who Owns the Ring','Take the Advantage'],['Change the Arrangement','Collect What Is Owed','Make It Personal','Control Every Detail','Offer No Escape'],['Refuse the Bad Deal','Buy Another Moment','Turn Trouble into Profit','Protect the Reputation','Find a Better Angle'],['Call for Final Offer','Close the Deal','Collect the Payment','Make the Offer Final','End the Negotiation']]
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
document.documentElement.classList.add('lpw-data-ready');

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


/* ==========================================================================\n   LEGACY PRO WRESTLING 8.2.8 — ROSTER 29–32 INTEGRATION\n   ========================================================================== */
function lpwCleanDecisionName(name){
 const wrestler=S?.team?.[0];
 let clean=String(name||'').trim();
 const prefixes=[];
 if(wrestler){
  prefixes.push(wrestler.title,wrestler.nickname);
  if(wrestler.id==='jett-valentine')prefixes.push('Heartbreaker','The Heartbreaker');
 }
 prefixes.filter(Boolean).sort((a,b)=>b.length-a.length).forEach(prefix=>{
  const escaped=String(prefix).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  clean=clean.replace(new RegExp(`^${escaped}\\s+`,'i'),'');
 });
 const fixes={
  'Claim the Spotlight':'Claim the Spotlight',
  'Force the Mistake':'Force the Mistake',
  'Steal the Finish':'Steal the Finish',
  'Take the First Step':'Take the First Step'
 };
 return fixes[clean]||clean;
}
/* These legacy hooks only apply when the older match-decision functions exist.
   Guard them so Career Mode initialization cannot be aborted by missing globals. */
if(typeof window.resolveDecision==='function'){
 const _resolveDecision827=window.resolveDecision;
 window.resolveDecision=function(index){
  if(window.M?.currentDecision?.choices?.[index])window.M.currentDecision.choices[index].name=lpwCleanDecisionName(window.M.currentDecision.choices[index].name);
  return _resolveDecision827(index);
 };
}
if(typeof window.showDecision==='function'){
 const _showDecision827=window.showDecision;
 window.showDecision=function(){
  const result=_showDecision827();
  if(window.M?.currentDecision?.choices)window.M.currentDecision.choices.forEach(c=>c.name=lpwCleanDecisionName(c.name));
  return result;
 };
}

milestoneData=function(){
 if(S?.liveMode){
  const c=liveLoad();
  if(!c)return [];
  const wins=Number(c.wins||0);
  if(wins===1)return [['FIRST VICTORY','Your first Career victory is officially in the record books.']];
  if(wins===3)return [['THREE MATCH STREAK','Three Career victories have established real momentum.']];
  if(wins===5)return [['RISING STAR','Five Career victories have changed how LPW views you.']];
  if(wins>5&&wins%5===0)return [['CAREER MILESTONE',`${wins} Career victories have set a new standard.`]];
  return [];
 }
 const stats=loadStats(),items=[];
 if(S.streak===1)items.push(['FIRST VICTORY','The Gauntlet journey is officially underway.']);
 if(S.streak===5)items.push(['FIVE MATCH STREAK','Momentum is becoming a legacy.']);
 if(S.streak===10)items.push(['DOMINATING THE GAUNTLET','Ten straight victories have changed the entire broadcast.']);
 if(S.streak>1&&S.streak===stats.bestGauntlet)items.push(['NEW PERSONAL BEST',`A new standard has been set at ${S.streak} victories.`]);
 return items.slice(0,2);
};

buildSummaryStory=function(){
 const playerWon=M.winner&&S.team.some(x=>x.id===M.winner.id);
 const margin=Math.abs((M.finalPlayer||0)-(M.finalOpp||0));
 const outcomes=(M.decisionHistory||[]).map(x=>x.outcome);
 const good=outcomes.filter(x=>x==='SUCCESS'||x==='MAJOR SUCCESS').length;
 const bad=outcomes.filter(x=>x==='FAILURE'||x==='MAJOR FAILURE').length;
 let flow;
 if(margin>=55)flow=`${M.winner.name} steadily pulled away and controlled the decisive phases`;
 else if(margin>=25)flow=`${M.winner.name} earned a clear advantage after a competitive opening`;
 else if(bad&&good)flow=`Momentum changed hands repeatedly before the closing exchange`;
 else flow=`The match remained competitive deep into the final phase`;
 if(outcomes.length){
  if(good>=2&&bad===0)flow=`A series of strong calls allowed ${playerWon?S.team[0].name:S.opp[0].name} to build sustained momentum`;
  else if(bad>=2)flow=`Early mistakes created a difficult recovery before the finish`;
 }
 return `${flow}. ${M.winner.name} sealed the result with ${M.winner.finisher}.`;
};

function lpwWorldResultText(winner,loser){
 const templates=[
  `${winner.name} defeated ${loser.name} after a competitive closing stretch.`,
  `${winner.name} secured the victory when one final opening appeared.`,
  `${winner.name} outlasted ${loser.name} in one of the night's most discussed matches.`,
  `${loser.name} pushed the pace, but ${winner.name} found the decisive answer.`,
  `${winner.name} left the arena with momentum after defeating ${loser.name}.`,
  `${winner.name} survived a late surge from ${loser.name}.`,
  `${winner.name} delivered a composed performance and put away ${loser.name}.`,
  `${winner.name} shocked the locker room with a victory over ${loser.name}.`
 ];
 return one(templates);
}
liveSimulateWorld=function(c){
 const pool=liveShuffle(liveOtherPool(c)).slice(0,8),stories=[];
 for(let i=0;i+1<pool.length&&stories.length<3;i+=2){
  const a=pool[i],b=pool[i+1],winner=Math.random()<.5?a:b,loser=winner===a?b:a;
  stories.push({a:a.id,b:b.id,winner:winner.id,text:lpwWorldResultText(winner,loser)});
 }
 const newsTemplates=[
  (a,b)=>`Social media erupted after ${a.name} publicly called out ${b.name}.`,
  (a,b)=>`${a.name} and ${b.name} had to be separated backstage.`,
  (a,b)=>`Championship rankings shifted after another unpredictable night.`,
  (a,b)=>`Medical staff confirmed that the roster will be evaluated before the next broadcast.`,
  (a,b)=>`Fans are already debating which match stole the show.`,
  (a,b)=>`Ticket demand increased following the latest LPW broadcast.`
 ];
 if(pool.length>=2){const a=one(pool),b=one(pool.filter(x=>x.id!==a.id));stories.push({a:a.id,b:b.id,text:one(newsTemplates)(a,b)})}
 c.world.worldStories=stories;stories.forEach(s=>liveAddNews(c,s.text));return stories;
};

gauntletLiveWorldRecap=function(){
 const c=liveLoad(),last=c.world.lastResult,player=liveFounder(c.active);if(!c.world.worldStories.length)liveSimulateWorld(c);
 const other=c.world.worldStories;let lead='Another LPW broadcast has reshaped the wider wrestling world.',analysis='Every headline creates pressure before the next show.';
 if(last){const opp=liveFounder(last.opponent);lead=last.win?`${player.name}'s victory over ${opp.name} leads tonight's headlines.`:`${opp.name}'s victory over ${player.name} has changed the conversation.`;analysis=last.win?one([`${player.name} is becoming impossible to ignore.`,`The locker room now has to take ${player.name} seriously.`,`That result could influence the next set of rankings.`]):one([`The response in the next match will matter.`,`A setback can create an even larger opportunity.`,`The pressure is now firmly on ${player.name}.`])}
 render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${lead}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${analysis}</p></div></div><div class="live-world-results">${other.slice(0,4).map(s=>`<article><span>${s.a?imageWithFallback(liveFounder(s.a),'portrait','art-portrait','matchPortrait'):''}</span><p>${s.text}</p>${s.b?`<span>${imageWithFallback(liveFounder(s.b),'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`).join('')}</div><button class="btn live-primary" onclick="gauntletLiveCompleteWorldRecap()">CONTINUE</button></section>`);
};
function gauntletLiveCompleteWorldRecap(){
 const c=liveLoad();liveAwardXp(c,c.active,35,'World recap');c.popularity=liveClamp((c.popularity||0)+3,0,100);liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar();
}

gauntletLiveFinishMatch65=function(win,oppId){
 const c=liveLoad(),opp=liveFounder(oppId),player=liveFounder(c.active),xp=c.lastXpAward||{amount:0};c.lastXpAward=null;if(!win)xp.amount=0;liveSave(c);
 const winner=win?player:opp;
 render(`<section class="panel live-day-complete live-result-winner-only ${win?'live-win':'live-loss'}"><div class="tv-kicker">MATCH RESULT</div><h1>${win?'VICTORY':'DEFEAT'}</h1><div class="live-result-solo">${imageWithFallback(winner,'victory','art-full','resultVictory')}</div><h2>${winner.name}</h2><p>${win?`${player.name} defeated ${opp.name}.`:`${opp.name} defeated ${player.name}.`}</p><div class="live-xp-award"><b>${win?`+${xp.amount} XP`:'NO XP EARNED'}</b><span>${c.world.injury?'An injury will require medical attention tomorrow.':'The world will react tomorrow.'}</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`);
};

/* ==========================================================================\n   LEGACY PRO WRESTLING 8.3.0 — CAREER MONTH ONE POLISH\n   ========================================================================== */

/* Introduction wording */
gauntletLiveIntro=function(page=0){
 setActiveGameMode('career');
 const slides=[
  {k:'WELCOME TO LEGACY PRO WRESTLING',h:'THIS IS YOUR CAREER',p:'I am Veronica Vale, General Manager of LEGACY Pro Wrestling. You will guide one wrestler through a living wrestling world where every victory, injury, rivalry and decision changes what happens next.',img:'full'},
  {k:'TWO LIVE SHOWS EVERY WEEK',h:'MAYHEM & THROWDOWN',p:'Monday Night Mayhem and Thursday Night Throwdown always feature you in a match or major story segment. The rest of the week reacts naturally to the stories your career creates.',img:'portrait'},
  {k:'FOUR WEEKS · ONE RIVALRY',h:'WIN THE SUPERCARD',p:'Each month builds toward a named Supercard. The Supercard result decides the feud. Win and your rival joins your permanent stable; lose and you must try again in a new story.',img:'full'},
  {k:'BUILD YOUR ROSTER',h:'CHOOSE YOUR WRESTLER',p:'After every Supercard you may continue with your current wrestler or switch to anyone you have unlocked. Choose the first wrestler who will represent your stable.',img:'portrait'}
 ];
 const s=slides[Math.max(0,Math.min(page,slides.length-1))],last=page===slides.length-1;
 window.scrollTo(0,0);
 render(`<section class="panel live-onboarding live-onboarding-template-${s.img} live-onboarding-page-${page}"><div class="live-onboarding-art">${npcImage('veronica-vale',s.img)}</div><div class="live-onboarding-copy"><div class="tv-kicker">${s.k}</div><h1>${s.h}</h1><p>${s.p}</p><div class="live-onboarding-progress">${slides.map((_,i)=>`<span class="${i<=page?'on':''}"></span>`).join('')}</div><button class="btn live-primary" onclick="${last?'gauntletLiveFounderSelect()':`gauntletLiveIntro(${page+1})`}">${last?'SELECT STARTING WRESTLER':'CONTINUE'}</button></div></section>`);
 requestAnimationFrame(()=>window.scrollTo(0,0));
};

/* Founder selection: identity only, no signature move line. */
gauntletLiveFounderSelect=function(){
 const founders=LIVE_FOUNDERS.map(liveFounder).filter(Boolean);
 render(`<section class="panel live-founder-screen lpw-founder-clean"><button class="shell-back" onclick="gauntletLiveHome()">← CAREER</button><div class="tv-kicker">NEW CAREER</div><h1>CHOOSE YOUR WRESTLER</h1><p class="sub">This wrestler becomes the first member of your stable.</p><div class="live-founder-grid">${founders.map(w=>`<button class="live-founder-card" onclick="gauntletLiveChooseFounder('${w.id}')">${imageWithFallback(w,'full','art-full','quickMatch')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`);
};

/* Fictional calendar: Monday January 1, month lengths advance independently of a real year. */
const LPW_FICTIONAL_MONTH_LENGTHS=[31,28,31,30,31,30,31,31,30,31,30,31];
function lpwCalendarDate(c,offset=0){
 const absolute=((Math.max(1,Number(c.week)||1)-1)*7)+(Number.isInteger(c.day)?c.day:0)+offset;
 let remaining=Math.max(0,absolute),year=1,month=0;
 while(remaining>=365){remaining-=365;year++}
 while(remaining>=LPW_FICTIONAL_MONTH_LENGTHS[month]){remaining-=LPW_FICTIONAL_MONTH_LENGTHS[month];month=(month+1)%12;if(month===0)year++}
 return {absolute,day:remaining+1,month,year,weekday:absolute%7};
}
function lpwCalendarIsSupercard(d){return d.weekday===6&&Math.floor(d.absolute/7)%4===3}
function lpwCalendarTimeline(c){const d=lpwCalendarDate(c);return `YEAR ${d.year} · ${LPW_CALENDAR_MONTHS[d.month].toUpperCase()} ${d.day} · WEEK ${c.week}`}

/* Career planning: hide unfinished multi-person matches and force the onboarding match. */
const _lpw830GenerateMonthlyPlan=liveGenerateMonthlyPlan;
liveGenerateMonthlyPlan=function(c){
 _lpw830GenerateMonthlyPlan(c);
 if(!Array.isArray(c.world.monthPlan))c.world.monthPlan=[];
 c.world.monthPlan=c.world.monthPlan.map(item=>item?.type==='multi'?{type:'singles',week:item.week,day:item.day,opponents:[lpwPickCareerOpponent(c)?.id].filter(Boolean)}:item);
 if(Number(c.month)===1&&Number(c.week)===1){
  const rival=liveFeudOpponent(c);
  if(rival)c.world.monthPlan[0]={type:'singles',week:1,day:0,opponents:[rival.id],onboarding:true};
 }
 liveSave(c);
};

const _lpw830RepairShowItem=lpwRepairShowItem;
lpwRepairShowItem=function(c,item){
 const fixed=_lpw830RepairShowItem(c,item);
 if(fixed?.type==='multi')return _lpw830RepairShowItem(c,{type:'singles'});
 if(Number(c?.month)===1&&Number(c?.week)===1&&Number(c?.day)===0){
  const rival=liveFeudOpponent(c);
  if(rival)return {type:'singles',opponents:[rival.id],onboarding:true};
 }
 return fixed;
};

/* Feud origin wording; preserve approved VS composition. */
gauntletLiveFeudOrigin=function(){
 const c=liveLoad(),r=liveFeudOpponent(c),p=liveFounder(c.active),origins=[
  {title:'A PUBLIC CALL-OUT',npc:'katie-morgan',copy:`${r.name} interrupts a live interview and claims ${p.name} has been avoiding real competition.`},
  {title:'A LINE IS CROSSED',npc:'leon-ward',copy:`Security reports that ${r.name} tried to confront ${p.name} away from the cameras.`},
  {title:'A MESSAGE IS SENT',npc:'mike-sullivan',copy:`${r.name} uses live television to guarantee victory over ${p.name}.`}
 ];
 const o=one(origins),pSources=wrestlerImageCandidates(p,'portrait'),rSources=wrestlerImageCandidates(r,'portrait');
 c.world.feud.reason=o.copy;c.world.feudOriginSeen=c.month;liveSave(c);
 render(`<section class="panel lpw-feud-origin"><div class="tv-kicker">NEW MONTH · FEUD ORIGIN</div><h1>${o.title}</h1><div class="origin-matchup origin-matchup-820"><div class="origin-wrestler-frame origin-wrestler-left"><img class="origin-wrestler-image" src="${pSources[0]}" data-sources="${pSources.join('|')}" data-source-index="0" alt="${p.name}" onerror="advanceImageFallback(this)"></div><strong class="origin-vs-820">VS</strong><div class="origin-wrestler-frame origin-wrestler-right"><img class="origin-wrestler-image" src="${rSources[0]}" data-sources="${rSources.join('|')}" data-source-index="0" alt="${r.name}" onerror="advanceImageFallback(this)"></div></div><div class="live-npc-scene expanded origin-report origin-report-${o.npc}">${npcImage(o.npc,'full')}<div class="origin-report-copy"><b>${npc(o.npc)?.name||''}</b><small>${npc(o.npc)?.role||''}</small><p>${o.copy}</p></div></div><p class="origin-close">This rivalry will culminate at <b>${liveCurrentSupercard(c)}</b>.</p><button class="btn live-primary" onclick="gauntletLiveCalendar()">BEGIN THE MONTH</button></section>`);
};

/* Career hub: primary action immediately below calendar. */
gauntletLiveCalendar=function(){
 const c=liveLoad();if(!c)return gauntletLiveHome();
 const w=liveFounder(c.active),f=liveFeud(c),r=liveFeudOpponent(c);
 const nickname=(w.name.match(/^"[^"]+"/)||[''])[0],ringName=w.name.replace(/^"[^"]+"\s*/, '');
 const forecast=Array.from({length:7},(_,i)=>lpwCalendarLabel(c,i)),today=forecast[0];
 render(`<section class="panel live-calendar-screen lpw-calendar-compact lpw-calendar-807 lpw-calendar-821 lpw-calendar-830"><div class="live-calendar-top"><button class="shell-back" onclick="home()">← MAIN MENU</button><button class="shell-back" onclick="gauntletLiveHome()">CAREER MENU</button></div><div class="tv-kicker">${lpwCalendarTimeline(c)}</div><h1>CAREER</h1><div class="live-week-strip lpw-date-forecast" aria-label="Next seven days">${forecast.map((d,i)=>`<div class="live-day ${i===0?'current':''} ${d.supercard?'supercard':''}"><small>${LIVE_DAYS[d.weekday].slice(0,3).toUpperCase()}</small><b>${d.day}</b><span>${d.label}</span>${i>0&&d.day===1?`<em>${LPW_CALENDAR_MONTHS[d.month].slice(0,3).toUpperCase()}</em>`:''}</div>`).join('')}</div><div class="live-today"><div><small>TODAY · ${LIVE_DAYS[today.weekday].toUpperCase()} · ${LPW_CALENDAR_MONTHS[today.month].toUpperCase()} ${today.day}</small><h2>${today.label}</h2><p>${lpwCalendarDescription(today)}</p></div><button class="btn live-primary" onclick="gauntletLiveBeginDay()">BEGIN</button></div><div class="lpw-active-wrestler-feature"><small class="lpw-feature-label">ACTIVE WRESTLER</small><div class="lpw-feature-portrait">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div><div class="lpw-active-copy">${nickname?`<span class="lpw-active-nickname">${nickname}</span>`:''}<b class="lpw-active-name">${ringName}</b><span class="lpw-active-record">${c.wins}-${c.losses} Record</span><span class="lpw-active-stable">${c.stable.length} Stable Member${c.stable.length===1?'':'s'}</span></div></div><div class="live-mini-stats lpw-stats-below-feature"><span><small>MOMENTUM</small><b>${c.momentum}</b></span><span><small>POPULARITY</small><b>${c.popularity}</b></span><button onclick="gauntletLiveStable()">MANAGE STABLE</button></div>${f?`<div class="live-feud-banner calendar-feud"><div>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}</div><span><small>CURRENT FEUD</small><b>${w.name} vs ${r.name}</b><em>${liveCurrentSupercard(c)} · Intensity ${f.intensity}%</em></span><div>${imageWithFallback(r,'portrait','art-portrait','matchPortrait')}</div></div>`:''}<div class="lpw-future-hub"><small>MORE FROM LEGACY</small><p>Future social, news, rankings and championship modules will live here without blocking daily progression.</p></div></section>`);
};

/* Unique, context-aware Katie questions. */
gauntletLiveKatieInterview=function(){
 const c=liveLoad(),r=liveFeudOpponent(c),last=c.world.lastResult;
 c.world.askedInterviewKeys=Array.isArray(c.world.askedInterviewKeys)?c.world.askedInterviewKeys:[];
 const prompts=[
  ['opening-warning',`${r.name} says you are avoiding a decisive confrontation. What is your response?`],
  ['result-reaction',last?`${last.win?'You won':'You lost'} your last match. What did that result prove about your path to ${liveCurrentSupercard(c)}?`:`What message do you want to send before ${liveCurrentSupercard(c)}?`],
  ['personal-line',`Your rivalry with ${r.name} is becoming personal. Where does competition end and hatred begin?`],
  ['roster-pressure',`The rest of the roster is watching this feud closely. Do you feel pressure to represent your stable?`],
  ['balance-power',`Would defeating ${r.name} and recruiting them change the balance of power in LEGACY Pro Wrestling?`],
  ['rival-guarantee',`${r.name} has guaranteed victory the next time you meet. What do you say to that?`],
  ['supercard-stakes',`What will defeating ${r.name} at ${liveCurrentSupercard(c)} mean to your career?`],
  ['momentum-shift',`Who holds the psychological advantage in this rivalry right now?`]
 ];
 let available=prompts.filter(([key])=>!c.world.askedInterviewKeys.includes(key));
 if(!available.length){c.world.askedInterviewKeys=[];available=prompts}
 const [key,q]=one(available);c.world.askedInterviewKeys.push(key);liveSave(c);
 render(`<section class="panel live-world-screen lpw-katie-interview"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">EXCLUSIVE · BACKSTAGE</div><h1>KATIE MORGAN INTERVIEW</h1><div class="live-npc-scene large">${npcImage('katie-morgan','full')}<div><small>BACKSTAGE INTERVIEWER</small><h2>Katie Morgan</h2><p>“${q}”</p></div></div><div class="live-choice-grid"><button onclick="gauntletLiveResolveDynamic('popularity',8,'You answered with confidence.')"><b>CONFIDENT</b><span>Popularity +8</span></button><button onclick="gauntletLiveResolveDynamic('momentum',8,'You delivered a direct warning.')"><b>DIRECT WARNING</b><span>Momentum +8</span></button><button onclick="gauntletLiveResolveDynamic('feud',12,'You made the rivalry deeply personal.')"><b>MAKE IT PERSONAL</b><span>Feud +12</span></button></div></section>`);
};

/* World recap action first; reading remains optional. */
gauntletLiveWorldRecap=function(){
 const c=liveLoad(),last=c.world.lastResult,player=liveFounder(c.active);if(!c.world.worldStories.length)liveSimulateWorld(c);
 const other=c.world.worldStories;let lead='Another LEGACY Pro Wrestling broadcast has reshaped the wider wrestling world.',analysis='Every headline creates pressure before the next show.';
 if(last){const opp=liveFounder(last.opponent);lead=last.win?`${player.name}'s victory over ${opp.name} leads tonight's headlines.`:`${opp.name}'s victory over ${player.name} has changed the conversation.`;analysis=last.win?one([`${player.name} is becoming impossible to ignore.`,`The locker room now has to take ${player.name} seriously.`,`That result could influence the next set of rankings.`]):one([`The response in the next match will matter.`,`A setback can create an even larger opportunity.`,`The pressure is now firmly on ${player.name}.`])}
 render(`<section class="panel live-world-screen lpw-world-recap-830"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><button class="btn live-primary recap-continue-top" onclick="gauntletLiveCompleteWorldRecap()">CONTINUE</button><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${lead}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${analysis}</p></div></div><div class="live-world-results">${other.slice(0,4).map(s=>`<article><span>${s.a?imageWithFallback(liveFounder(s.a),'portrait','art-portrait','matchPortrait'):''}</span><p>${s.text}</p>${s.b?`<span>${imageWithFallback(liveFounder(s.b),'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`).join('')}</div></section>`);
};

/* Thursday reacts to the week rather than repeating Monday's generic introduction. */
gauntletLiveShowIntro=function(){
 const c=liveLoad(),item=lpwPersistRepairedShowItem(c,lpwRepairShowItem(c,livePlanItem(c))),stories=liveSimulateWorld(c),venue=one(VENUES),attendance=Math.floor(rnd(11000,20500)).toLocaleString();liveSave(c);
 const show=liveIsSupercard(c)?liveCurrentSupercard(c).toUpperCase():liveShowName(c),last=c.world.lastResult,rival=liveFeudOpponent(c),player=liveFounder(c.active);
 let mike=`Welcome to ${show}. Tonight could change the direction of several LEGACY Pro Wrestling careers.`,johnny='The pressure is rising, and nobody on this roster can afford to stand still.';
 if(c.day===3){
  if(last){const opp=liveFounder(last.opponent);mike=last.win?`${player.name}'s victory earlier this week has shifted the mood around the locker room.`:`${player.name}'s setback against ${opp.name} has created immediate pressure.`;johnny=last.win?`${rival?.name||'The opposition'} has seen the momentum change and will be looking for an answer tonight.`:`Tonight tells us whether ${player.name} can respond before this rivalry slips away.`}
  else{mike=`The fallout from Monday Night Mayhem has followed us into Throwdown.`;johnny=`Every unresolved issue from Mayhem is waiting to explode tonight.`}
 }
 const card=stories.slice(0,2).map(s=>`<li>${s.a?`${liveFounder(s.a)?.name||'A LEGACY star'} is scheduled to appear tonight.`:s.text}</li>`).join('');
 render(`<section class="panel live-show-intro lpw-show-open"><div class="show-intro-copy">${liveIsSupercard(c)?`<div class="lpw-ple-title">${show}</div>`:lpwShowLogo(show)}<div class="tv-kicker">LIVE FROM ${venue.toUpperCase()} · ${attendance} IN ATTENDANCE</div><div class="live-commentary-duo show-preview"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${mike}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${johnny}</p></div></div><div class="show-card-list"><small>TONIGHT ON LPW</small><ul>${card||'<li>Major developments from across LEGACY Pro Wrestling.</li>'}</ul><b>YOUR SEGMENT · ${liveIsSupercard(c)?'FEUD FINALE':item.type==='segment'?liveSegmentTitle(item.segment):item.type.toUpperCase()+' MATCH'}</b></div><button class="btn live-primary" onclick="gauntletLiveRunShowSegment()">START THE SHOW</button></div></section>`);
};

/* Match introduction without decorative information boxes. */
gauntletLiveMatchCard65=function(){
 try{
  const c=liveLoad();if(!c)return gauntletLiveHome();const isSC=liveIsSupercard(c),player=liveFounder(c.active);if(!player)throw new Error('Active wrestler is missing.');
  let item=lpwRepairShowItem(c,livePlanItem(c));const rival=liveFeudOpponent(c);
  if(isSC){const opponent=(rival&&lpwValidCareerWrestler(rival.id)&&rival.id!==c.active)?rival:lpwPickCareerOpponent(c);if(!opponent)throw new Error('No valid Supercard opponent is available.');item={type:'singles',opponents:[opponent.id]}}else item=lpwPersistRepairedShowItem(c,item);
  const type=item.type,opponents=item.opponents||[],partner=item.partner||null,roster=[player,...(partner?[liveFounder(partner)]:[]),...opponents.map(liveFounder)].filter(Boolean),expected=type==='tag'?4:2;if(roster.length<expected)throw new Error('Tonight\'s match roster is incomplete.');
  c.pending={opponent:opponents[0],opponents,type,partner,isSupercard:isSC};liveSave(c);
  render(`<section class="panel live-match-card lpw-match-card-830"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button>${isSC?`<div class="lpw-ple-title">${liveCurrentSupercard(c).toUpperCase()}</div>`:lpwShowLogo(liveShowName(c))}<h1>${isSC?'FEUD FINALE':type==='tag'?'TAG TEAM MATCH':'FEATURED SINGLES MATCH'}</h1><div class="live-match-lineup ${type} portrait-lineup">${roster.map((w,i)=>lpwPortraitCard(w,i===0?'YOUR WRESTLER':i===1&&partner?'YOUR PARTNER':'OPPONENT')).join('')}</div><div class="live-npc-scene compact producer-card">${npcImage('raymond-briggs','portrait')}<div><small>MATCH PRODUCER</small><b>Raymond Briggs</b><p>Use the broadcast decisions to control the pace. The result will shape what happens tomorrow.</p></div></div><button class="btn live-primary" onclick="gauntletLiveLaunchBroadcast65()">BEGIN MATCH BROADCAST</button></section>`);
 }catch(err){console.error('Career match card failed:',err);const c=liveLoad();if(c){liveGenerateMonthlyPlan(c);liveSave(c)}render(`<section class="panel live-world-screen"><div class="tv-kicker">CAREER RECOVERY</div><h1>MATCH CARD REPAIRED</h1><p>The match card could not be loaded, so Career rebuilt tonight's segment.</p><button class="btn live-primary" onclick="gauntletLiveShowIntro()">RETURN TO SHOW</button><button class="btn secondary" onclick="gauntletLiveCalendar()">RETURN TO CALENDAR</button></section>`)}
};

/* Career achievements use the actual completed Career record only. */
milestoneData=function(){
 const c=liveLoad();
 const careerResult=!!(c&&c.world&&c.world.lastResult&&Array.isArray(c.history)&&c.history.length);
 if(careerResult&&document.body.classList.contains('career-view')){
  const wins=Number(c.wins||0),lastWin=!!c.world.lastResult.win;
  if(!lastWin)return [];
  if(wins===1)return [['FIRST CAREER VICTORY','Your first Career victory is officially in the record books.']];
  if([5,10,20,50].includes(wins))return [['CAREER MILESTONE',`${wins} completed Career victories have set a new standard.`]];
  return [];
 }
 const stats=loadStats(),items=[];
 if(S.streak===1)items.push(['FIRST VICTORY','The Gauntlet journey is officially underway.']);
 if(S.streak===5)items.push(['FIVE MATCH STREAK','Momentum is becoming a legacy.']);
 if(S.streak===10)items.push(['DOMINATING THE GAUNTLET','Ten straight victories have changed the entire broadcast.']);
 if(S.streak>1&&S.streak===stats.bestGauntlet)items.push(['NEW PERSONAL BEST',`A new standard has been set at ${S.streak} victories.`]);
 return items.slice(0,2);
};

/* Sudden feud-driven breaking news interruptions. */
function lpwBreakingNews(c){
 const rival=liveFeudOpponent(c),player=liveFounder(c.active);if(!rival||!player)return false;
 const intensity=liveFeud(c)?.intensity||25;
 const lines=intensity<50?[
  `${rival.name} mocked ${player.name} and guaranteed victory the next time they meet.`,
  `${rival.name} told reporters that ${player.name} has not faced real pressure yet.`,
  `${rival.name} released a message promising to expose ${player.name} at ${liveCurrentSupercard(c)}.`
 ]:intensity<75?[
  `${rival.name} interrupted a media appearance and warned ${player.name} that the rivalry is now personal.`,
  `${rival.name} demanded that ${player.name} answer a public challenge on the next broadcast.`,
  `Security separated ${rival.name} from ${player.name} after a heated backstage confrontation.`
 ]:[
  `${rival.name} attempted to ambush ${player.name} before officials intervened.`,
  `Veronica Vale has ordered extra security after another confrontation involving ${rival.name}.`,
  `${rival.name} vowed that ${player.name} will not make it through ${liveCurrentSupercard(c)} unchanged.`
 ];
 const line=one(lines);c.world.breakingWeek=c.week;c.world.breakingResume=true;liveSave(c);
 render(`<section class="panel lpw-breaking-news"><div class="tv-kicker">BREAKING NEWS</div><h1>RIVALRY UPDATE</h1><div class="breaking-rival-art">${imageWithFallback(rival,'full','art-full','quickMatch')}</div><h2>${rival.name}</h2><p>${line}</p><button class="btn live-primary" onclick="lpwResumeAfterBreakingNews()">CONTINUE</button></section>`);return true;
}
function lpwResumeAfterBreakingNews(){const c=liveLoad();c.world.breakingResume=false;liveSave(c);gauntletLiveBeginDay(true)}
const _lpw830BeginDay=gauntletLiveBeginDay;
gauntletLiveBeginDay=function(skipBreaking=false){
 const c=liveLoad();if(!c)return gauntletLiveHome();
 if(!skipBreaking&&c.week>1&&c.world.breakingWeek!==c.week&&Math.random()<.24&&liveFeud(c))return lpwBreakingNews(c);
 return _lpw830BeginDay();
};

/* LEGACY 8.3.5 — verified founder selection repair.
   The 8.2.8 legacy decision hooks are now guarded above, allowing this file to
   finish initialising. Founder cards use explicit event listeners and create
   the Career save before optional rivalry setup. */
function lpw835ChooseFounder(id){
 const wrestler=liveFounder(id);
 if(!wrestler||!LIVE_FOUNDERS.includes(id))return gauntletLiveFounderSelect();
 const career={
  version:8,founder:id,active:id,stable:[id],week:1,month:1,day:0,
  wins:0,losses:0,momentum:50,popularity:20,
  training:{power:0,speed:0,technique:0,charisma:0,recovery:0},
  progression:{},history:[],created:new Date().toISOString(),
  world:{onboardingSeen:true,news:[],worldStories:[],katieThisWeek:0,lastResult:null,manager:null,nextMatchBonus:0}
 };
 try{liveEnsureProgression(career)}catch(error){console.warn('Career progression setup:',error)}
 try{liveEnsureWorld(career)}catch(error){console.warn('Career world setup:',error)}
 liveSave(career);
 try{
  const rival=livePickDifferent(career);
  if(rival)liveStartFeud(career,rival.id,'Veronica Vale has selected your first monthly rival.');
  liveGenerateMonthlyPlan(career);
  liveSave(career);
 }catch(error){
  console.error('Career opening setup failed:',error);
  liveSave(career);
 }
 try{if(liveFeud(career))return gauntletLiveFeudOrigin()}catch(error){console.error('Feud origin failed:',error)}
 return gauntletLiveCalendar();
}
window.lpw835ChooseFounder=lpw835ChooseFounder;
window.gauntletLiveChooseFounder=lpw835ChooseFounder;
gauntletLiveChooseFounder=lpw835ChooseFounder;

gauntletLiveFounderSelect=function(){
 const founders=LIVE_FOUNDERS.map(liveFounder).filter(Boolean);
 render(`<section class="panel live-founder-screen lpw-founder-clean lpw-founder-835"><button type="button" class="shell-back" onclick="gauntletLiveHome()">← CAREER</button><div class="tv-kicker">NEW CAREER</div><h1>CHOOSE YOUR WRESTLER</h1><p class="sub">This wrestler becomes the first member of your stable.</p><div class="live-founder-grid">${founders.map(w=>`<button type="button" class="live-founder-card" data-founder-id="${w.id}" aria-label="Choose ${w.name}">${imageWithFallback(w,'full','art-full','quickMatch')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`);
 document.querySelectorAll('.lpw-founder-835 .live-founder-card').forEach(function(card){
  card.addEventListener('click',function(){lpw835ChooseFounder(card.dataset.founderId)});
 });
};
window.gauntletLiveFounderSelect=gauntletLiveFounderSelect;


/* ========================================================================== 
   LEGACY PRO WRESTLING 8.3.6 — MONTH ONE MEDIA & CAREER DEVELOPMENT
   ========================================================================== */
Object.assign(SUPPORT_CAST,{
 'derek-pierce':{id:'derek-pierce',name:'Derek Pierce',role:'Dirt Sheet Writer',group:'Media'},
 'madison-price':{id:'madison-price',name:'Madison Price',role:'Director of Sponsorships',group:'Business'},
 'noah-grant':{id:'noah-grant',name:'Noah Grant',role:'Broadcast Producer',group:'Broadcast Team'},
 'marcus-steele':{id:'marcus-steele',name:'Marcus Steele',role:'Talent Relations Director',group:'Operations'},
 'olivia-chase':{id:'olivia-chase',name:'Olivia Chase',role:'Live Events Coordinator',group:'Business'}
});
SUPPORT_CAST['ava-cross'].role='Social Media Correspondent';
SUPPORT_CAST['coach-hank-dawson'].role='Head Performance Coach';
SUPPORT_CAST['dr-lena-hart'].role='Chief Medical Officer';

const LPW836_TEAM=[
 ['veronica-vale','General Manager','Runs LPW and oversees contracts, opportunities and major career decisions.'],
 ['mike-sullivan','Play-by-Play Commentator','Calls the action and keeps the television audience informed.'],
 ['johnny-cannon','Colour Commentator','Adds analysis, personality and strong opinions to every broadcast.'],
 ['katie-morgan','Backstage Interviewer','Conducts interviews and gives wrestlers a chance to shape their own story.'],
 ['coach-hank-dawson','Head Performance Coach','Runs the Performance Centre and develops wrestler attributes.'],
 ['ava-cross','Social Media Correspondent','Tracks hashtags, polls, fan reactions and the weekly online conversation.'],
 ['derek-pierce','Dirt Sheet Writer','Publishes rumours, ratings, awards and backstage speculation.'],
 ['leon-ward','Head of Security','Handles investigations, attacks and backstage incidents.'],
 ['dr-lena-hart','Chief Medical Officer','Manages injuries, recovery and medical clearance.'],
 ['ethan-brooks','Director of Competition','Oversees rankings, tournaments and SuperCard ring introductions.'],
 ['madison-price','Director of Sponsorships','Brings commercial offers, endorsements and brand opportunities.'],
 ['noah-grant','Broadcast Producer','Controls television placement, production requests and exposure.'],
 ['marcus-steele','Talent Relations Director','Manages locker-room morale, disputes and wrestler relations.'],
 ['olivia-chase','Live Events Coordinator','Organises fan events, appearances and publicity opportunities.']
];

function lpw836Ensure(c){
 c.world=c.world||{};
 c.world.mediaArchive=Array.isArray(c.world.mediaArchive)?c.world.mediaArchive:[];
 c.world.metNpcs=c.world.metNpcs||{};
 c.world.lastDevelopmentNpc=c.world.lastDevelopmentNpc||'';
 return c;
}
const _lpw836Load=liveLoad;
liveLoad=function(){const c=_lpw836Load();if(c){lpw836Ensure(c);liveSave(c)}return c};

function lpw836Week(c){return ((Math.max(1,c.week)-1)%4)+1}
function lpw836MediaMeta(c){
 const week=lpw836Week(c);
 if(week===1)return {host:'ava-cross',kicker:'LPW SOCIAL',title:"AVA'S PULSE",button:'OPEN LPW SOCIAL',desc:'See what is trending across the LPW Universe.'};
 if(week===2)return {host:'derek-pierce',kicker:'WEEKLY MEDIA',title:'DIRT SHEET DIGEST',button:'READ DIRT SHEET',desc:'Catch up on rumours, ratings, awards and backstage gossip.'};
 if(week===3)return {host:'ava-cross',kicker:'LPW SOCIAL',title:"AVA'S PULSE",button:'OPEN LPW SOCIAL',desc:'The fans have spoken. See what is making headlines this week.'};
 return {host:'derek-pierce',kicker:'SUPERCARD SPECIAL',title:'INSTANT REACTION',button:'VIEW SUPERCARD REACTION',desc:'Immediate reaction, awards and rumours from the month’s biggest event.'};
}

const _lpw836CalendarActivity=lpwCalendarActivity;
lpwCalendarActivity=function(d){
 if(d.weekday===6&&!lpwCalendarIsSupercard(d)){
  const c=liveLoad(),m=lpw836MediaMeta(c);return m.title;
 }
 return _lpw836CalendarActivity(d);
};
const _lpw836CalendarDescription=lpwCalendarDescription;
lpwCalendarDescription=function(d){
 if(d.weekday===6&&!lpwCalendarIsSupercard(d)){const c=liveLoad();return lpw836MediaMeta(c).desc}
 if(d.weekday===2)return 'A dynamic career development meeting is waiting. Training, media, management or another department may call.';
 return _lpw836CalendarDescription(d);
};

function lpw836Archive(c,type,title,body){
 c.world.mediaArchive.unshift({month:c.month,week:lpw836Week(c),type,title,body,date:new Date().toISOString()});
 c.world.mediaArchive=c.world.mediaArchive.slice(0,96);liveSave(c);
}
function lpw836NoPhoto(id){const p=npc(id);return `<div class="lpw-npc-placeholder"><span>${(p?.name||id).split(' ').map(x=>x[0]).join('')}</span><small>PORTRAIT COMING SOON</small></div>`}
function lpw836NpcVisual(id,type='full'){const known=CHARACTER_IMAGE_MANAGER[id];return known?npcImage(id,type):lpw836NoPhoto(id)}
function lpw836FirstMeeting(id,next){
 const c=liveLoad(),p=npc(id);if(!c.world.metNpcs[id]){c.world.metNpcs[id]=true;liveSave(c);const intro={
  'derek-pierce':'Some people call it journalism. Others call it stirring the pot. If it is worth talking about, it will probably appear in my Dirt Sheet Digest.',
  'madison-price':'Build your reputation and I will bring you opportunities that extend far beyond the ring.',
  'noah-grant':'A great wrestler wins matches. A superstar creates unforgettable television.',
  'marcus-steele':'Respect behind the curtain matters as much as performance under the lights.',
  'olivia-chase':'Fans do not just watch LPW. They experience it, and I help create those moments.'
 }[id]||`I am ${p.name}. You will be hearing from my department as your career develops.`;
 return render(`<section class="panel live-world-screen lpw-npc-standard"><div class="tv-kicker">FIRST MEETING</div><h1>MEET THE TEAM</h1><div class="live-npc-scene large">${lpw836NpcVisual(id,'full')}<div><small>${p.role}</small><h2>${p.name}</h2><p>“${intro}”</p></div></div><button class="btn live-primary" onclick="${next}">CONTINUE</button></section>`)}
 return false;
}

function lpw836AvaPulse(){
 const c=liveLoad(),p=liveFounder(c.active),r=liveFeudOpponent(c),last=c.world.lastResult;
 const hashtag=`#${p.name.replace(/[^A-Za-z0-9]/g,'')}`;
 const result=last?(last.win?`${p.name}'s latest victory is driving the conversation.`:`Fans are debating how ${p.name} should respond to the latest defeat.`):`${p.name}'s Career debut is beginning to attract attention.`;
 const rival=r?`${p.name} vs ${r.name} is the most discussed rivalry in LPW.`:'Fans are waiting to see who steps forward next.';
 const body=`${result} ${rival}`;
 lpw836Archive(c,'pulse',"Ava's Pulse",body);
 render(`<section class="panel live-world-screen lpw-media-screen"><div class="tv-kicker">LPW SOCIAL</div><h1>AVA'S PULSE</h1><div class="live-npc-scene large">${lpw836NpcVisual('ava-cross','full')}<div><small>SOCIAL MEDIA CORRESPONDENT</small><h2>Ava Cross</h2><p>“Here is what the LPW audience is talking about before the new week begins.”</p></div></div><div class="lpw-media-grid"><article><small>TRENDING</small><b>${hashtag}</b><p>${result}</p></article><article><small>FAN POLL</small><b>${r?'Who wins the rivalry?':'Who should step up next?'}</b><p>${p.name} leads with ${55+Math.floor(Math.random()*31)}% of the vote.</p></article><article><small>COMMUNITY PULSE</small><b>MOST DISCUSSED</b><p>${rival}</p></article><article><small>VIRAL CLIP</small><b>${last?.win?'THE FINISH':'THE FALLOUT'}</b><p>Highlights have passed ${120+Math.floor(Math.random()*780)},000 views.</p></article></div><button class="btn live-primary" onclick="lpw836CompleteMedia()">CONTINUE</button></section>`);
}
function lpw836DirtSheet(supercard=false){
 const c=liveLoad(),p=liveFounder(c.active),r=liveFeudOpponent(c),last=c.world.lastResult;
 const match=last?`${last.win?p.name:liveFounder(last.opponent)?.name} vs ${last.win?liveFounder(last.opponent)?.name:p.name}`:`${p.name}'s next featured match`;
 const stars=(3.5+Math.random()*1.4).toFixed(2).replace(/0$/,'');
 const body=supercard?`Instant reaction to ${liveCurrentSupercard(c)}. ${p.name} is the central headline.`:`Rumours and awards from Week ${lpw836Week(c)}. ${p.name} remains under close scrutiny.`;
 lpw836Archive(c,supercard?'supercard-reaction':'dirt-sheet',supercard?'SuperCard Instant Reaction':'Dirt Sheet Digest',body);
 render(`<section class="panel live-world-screen lpw-media-screen"><div class="tv-kicker">${supercard?'SUPERCARD SPECIAL':'WEEKLY MEDIA'}</div><h1>${supercard?'INSTANT REACTION':'DIRT SHEET DIGEST'}</h1><div class="live-npc-scene large">${lpw836NpcVisual('derek-pierce','full')}<div><small>DIRT SHEET WRITER</small><h2>Derek Pierce</h2><p>“${supercard?'The final bell has only just rung, but the reaction has already started.':'Take this with a grain of salt, but people backstage are talking.'}”</p></div></div><div class="lpw-media-grid"><article><small>MATCH OF THE ${supercard?'NIGHT':'WEEK'}</small><b>${match}</b><p>${stars} stars</p></article><article><small>SUPERSTAR OF THE ${supercard?'NIGHT':'WEEK'}</small><b>${last?.win?p.name:(r?.name||p.name)}</b><p>The strongest headline performance.</p></article><article><small>${supercard?'BIGGEST SHOCK':'RUMOUR OF THE WEEK'}</small><b>SOURCES SAY...</b><p>${r?`Officials are discussing another major opportunity connected to ${p.name} and ${r.name}.`:`Management may be preparing a major announcement.`}</p></article><article><small>STOCK ${last?.win?'RISING':'UNDER PRESSURE'}</small><b>${p.name}</b><p>${last?.win?'Momentum is building quickly.':'The next response will be closely watched.'}</p></article></div><p class="lpw-disclaimer">The views and rumours published in the Dirt Sheet Digest are based on anonymous sources and backstage speculation. LPW has not verified these claims.</p><button class="btn live-primary" onclick="lpw836CompleteMedia()">CONTINUE</button></section>`);
}
function lpw836MediaDay(){const c=liveLoad(),m=lpw836MediaMeta(c);if(lpw836FirstMeeting(m.host,`lpw836MediaDay()`))return;if(lpw836Week(c)===1||lpw836Week(c)===3)return lpw836AvaPulse();return lpw836DirtSheet(lpw836Week(c)===4)}
function lpw836CompleteMedia(){const c=liveLoad();liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()}

function lpw836Outcome(title,npcId,before,after,reaction,ripple){
 const rows=Object.keys(after).map(k=>{const a=before[k],b=after[k],delta=(typeof a==='number'&&typeof b==='number')?b-a:null;return `<div><small>${k.toUpperCase()}</small><b>${a} <span>→</span> ${b}</b><em>${delta===null?'':delta>0?`+${delta}`:delta<0?`${delta}`:'NO CHANGE'}</em></div>`}).join('');
 render(`<section class="panel live-day-complete lpw-consequence-screen"><div class="tv-kicker">OUTCOME</div><h1>${title}</h1><div class="lpw-consequence-host">${lpw836NpcVisual(npcId,'portrait')}<span><small>${npc(npcId)?.role||''}</small><b>${npc(npcId)?.name||''}</b></span></div><div class="lpw-change-grid">${rows}</div><div class="lpw-world-reaction"><small>WORLD REACTION</small><p>${reaction}</p></div><div class="lpw-ripple"><b>THE RIPPLE EFFECT</b><span>${ripple}</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)
}
function lpw836ApplyOutcome(npcId,title,changes,reaction,ripple){
 const c=liveLoad(),p=liveProgress(c.active,c),f=liveFeud(c);const before={};
 Object.keys(changes).forEach(k=>{before[k]=['power','speed','technique','charisma','recovery'].includes(k)?p.stats[k]:k==='feud'?(f?.intensity||0):(c[k]||0)});
 Object.entries(changes).forEach(([k,v])=>{if(k==='feud'){if(f)f.intensity=liveClamp(f.intensity+v,0,100)}else if(['power','speed','technique','charisma','recovery'].includes(k)){p.stats[k]=Math.min(p.caps[k],p.stats[k]+v)}else c[k]=liveClamp((c[k]||0)+v,0,100)});
 const after={};Object.keys(changes).forEach(k=>{after[k]=['power','speed','technique','charisma','recovery'].includes(k)?p.stats[k]:k==='feud'?(f?.intensity||0):(c[k]||0)});
 liveAwardXp(c,c.active,35,'Career activity');liveAdvanceDay(c);liveSave(c);lpw836Outcome(title,npcId,before,after,reaction,ripple);
}
function lpw836Training(){
 if(lpw836FirstMeeting('coach-hank-dawson','lpw836Training()'))return;
 render(`<section class="panel live-world-screen lpw-npc-standard"><div class="tv-kicker">PERFORMANCE CENTRE</div><h1>TRAINING SESSION</h1><div class="live-npc-scene large">${lpw836NpcVisual('coach-hank-dawson','full')}<div><small>HEAD PERFORMANCE COACH</small><h2>Coach Hank Dawson</h2><p>“Choose the area that needs work. We train with purpose and make the session count.”</p></div></div><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('coach-hank-dawson','POWER TRAINING COMPLETE',{power:1},'Coach Hank is pleased with the focused session.','The improved attribute will influence future match performance.')"><b>POWER DRILLS</b><span>Power +1</span></button><button onclick="lpw836ApplyOutcome('coach-hank-dawson','SPEED TRAINING COMPLETE',{speed:1},'Your movement looked sharper by the end of the circuit.','The improved attribute will influence future match performance.')"><b>SPEED CIRCUIT</b><span>Speed +1</span></button><button onclick="lpw836ApplyOutcome('coach-hank-dawson','TECHNIQUE TRAINING COMPLETE',{technique:1},'The technical repetitions produced a measurable improvement.','The improved attribute will influence future match performance.')"><b>TECHNICAL CLINIC</b><span>Technique +1</span></button></div></section>`)
}
const LPW836_DEVELOPMENT=[
 {id:'coach-hank-dawson',weight:4,run:'lpw836Training()'},
 {id:'katie-morgan',title:'EXCLUSIVE INTERVIEW',copy:'Katie asks what you want the locker room to hear before your next appearance.',a:['DELIVER A CONFIDENT PROMO',{popularity:5},'Fans respond to the confidence.','Commentary may reference your words on the next show.'],b:['WARN YOUR RIVAL',{feud:7},'Your rival immediately takes notice.','The rivalry is more likely to escalate.']},
 {id:'veronica-vale',title:'GM MEETING',copy:'Veronica Vale wants to discuss your direction and expectations.',a:['ASK FOR AN OPPORTUNITY',{momentum:5},'Management appreciates the ambition.','A future opportunity may be influenced by this meeting.'],b:['FOCUS ON RESULTS',{popularity:3},'The professional response earns quiet respect.','Management will remember your discipline.']},
 {id:'leon-ward',title:'SECURITY BRIEFING',copy:'Leon has new information about a possible backstage incident.',a:['ESCALATE THE RESPONSE',{feud:6},'The situation becomes more personal.','Security expects further tension.'],b:['LET SECURITY HANDLE IT',{momentum:3},'The calm response protects your focus.','The incident may still resurface later.']},
 {id:'madison-price',title:'SPONSORSHIP OFFER',copy:'A sponsor wants to attach its name to your growing profile.',a:['ACCEPT THE CAMPAIGN',{popularity:6},'The campaign expands your visibility.','Commercial success may unlock larger offers.'],b:['PROTECT YOUR IMAGE',{momentum:3},'Fans respect the selective approach.','Your brand remains tightly controlled.']},
 {id:'noah-grant',title:'PRODUCTION MEETING',copy:'Noah wants a clear television objective for your next appearance.',a:['CHASE THE MAIN EVENT',{popularity:5},'Production sees main-event ambition.','Your television placement may improve.'],b:['FOCUS ON MATCH QUALITY',{momentum:4},'The broadcast team values the professional approach.','Future match presentation may reflect this choice.']},
 {id:'marcus-steele',title:'TALENT RELATIONS',copy:'Marcus asks you to help settle growing tension in the locker room.',a:['MEDIATE THE DISPUTE',{popularity:4},'The locker room appreciates your leadership.','Other wrestlers may remember who stepped forward.'],b:['STAY OUT OF IT',{momentum:2},'You preserve your own focus.','The unresolved tension may return.']},
 {id:'olivia-chase',title:'LIVE EVENT OPPORTUNITY',copy:'Olivia offers a fan appearance before the next broadcast.',a:['MEET THE FANS',{popularity:6},'The appearance creates strong goodwill.','Fan support may carry into future shows.'],b:['PREPARE FOR THE RING',{momentum:3},'The extra preparation sharpens your focus.','The audience may question your absence.']},
 {id:'dr-lena-hart',title:'MEDICAL CHECK-IN',copy:'Dr. Hart reviews your condition and recovery plan.',a:['FOLLOW THE RECOVERY PLAN',{recovery:1},'The careful approach improves recovery.','Your long-term health is better protected.'],b:['REQUEST CLEARANCE',{momentum:3},'Your determination is clear.','Pushing too hard may carry future risk.']},
 {id:'ethan-brooks',title:'COMPETITION UPDATE',copy:'Ethan has information about rankings and upcoming match opportunities.',a:['PUSH FOR A HIGHER RANKING',{popularity:4},'Your ambition becomes part of the conversation.','Competition officials will track your next result closely.'],b:['EARN IT IN THE RING',{momentum:4},'The answer earns respect from competition officials.','Your next match will carry added significance.']}
];
function lpw836CareerDevelopment(){
 const c=liveLoad(),bag=[];LPW836_DEVELOPMENT.forEach(e=>{for(let i=0;i<(e.weight||1);i++)bag.push(e)});let e=one(bag);if(e.id===c.world.lastDevelopmentNpc)e=one(LPW836_DEVELOPMENT.filter(x=>x.id!==e.id));c.world.lastDevelopmentNpc=e.id;liveSave(c);
 if(e.run)return window.eval(e.run);if(lpw836FirstMeeting(e.id,'lpw836CareerDevelopment()'))return;
 render(`<section class="panel live-world-screen lpw-npc-standard"><div class="tv-kicker">CAREER DEVELOPMENT</div><h1>${e.title}</h1><div class="live-npc-scene large">${lpw836NpcVisual(e.id,'full')}<div><small>${npc(e.id).role}</small><h2>${npc(e.id).name}</h2><p>${e.copy}</p></div></div><div class="live-choice-grid"><button onclick='lpw836ApplyOutcome(${JSON.stringify(e.id)},${JSON.stringify(e.a[0])},${JSON.stringify(e.a[1])},${JSON.stringify(e.a[2])},${JSON.stringify(e.a[3])})'><b>${e.a[0]}</b><span>Choose this response</span></button><button onclick='lpw836ApplyOutcome(${JSON.stringify(e.id)},${JSON.stringify(e.b[0])},${JSON.stringify(e.b[1])},${JSON.stringify(e.b[2])},${JSON.stringify(e.b[3])})'><b>${e.b[0]}</b><span>Choose this response</span></button></div></section>`)
}

const _lpw836Begin=gauntletLiveBeginDay;
gauntletLiveBeginDay=function(skipBreaking=false){
 const c=liveLoad();if(!c)return gauntletLiveHome();const d=lpwCalendarDate(c);
 if(d.weekday===6&&!lpwCalendarIsSupercard(d))return lpw836MediaDay();
 if(d.weekday===2&&!c.world.injury)return lpw836CareerDevelopment();
 return _lpw836Begin(skipBreaking);
};

function lpw836MediaArchive(){const c=liveLoad(),items=c.world.mediaArchive||[];render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveHome()">← CAREER</button><div class="tv-kicker">CAREER HISTORY</div><h1>MEDIA ARCHIVE</h1><p>Revisit the headlines, rumours and fan reactions that followed your career.</p><div class="lpw-archive-list">${items.length?items.map(x=>`<article><small>MONTH ${x.month} · WEEK ${x.week}</small><b>${x.title}</b><p>${x.body}</p></article>`).join(''):'<article><b>NO REPORTS YET</b><p>Weekly media reports will be stored here after they are viewed.</p></article>'}</div></section>`)}
function lpw836MeetTeam(){render(`<section class="panel live-world-screen"><button class="shell-back" onclick="gauntletLiveHome()">← CAREER</button><div class="tv-kicker">HELP GUIDE</div><h1>MEET THE TEAM</h1><div class="lpw-team-grid">${LPW836_TEAM.map(([id,title,bio])=>`<article>${lpw836NpcVisual(id,'portrait')}<small>${title}</small><b>${npc(id)?.name||id}</b><p>${bio}</p></article>`).join('')}</div></section>`)}
const _lpw836Home=gauntletLiveHome;
gauntletLiveHome=function(){_lpw836Home();const actions=document.querySelector('.live-home-actions');if(actions){actions.insertAdjacentHTML('beforeend','<button class="btn secondary" onclick="lpw836MediaArchive()">MEDIA ARCHIVE</button><button class="btn secondary" onclick="lpw836MeetTeam()">MEET THE TEAM</button>')}const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent='VERSION 8.3.6'};

/* Natural wrestler decision wording: remove archetype labels from any legacy-generated option. */
Object.keys(WRESTLER_DECISIONS).forEach(id=>{WRESTLER_DECISIONS[id]=WRESTLER_DECISIONS[id].map(stage=>stage.map(text=>String(text).replace(/^Supernatural\s+/i,'').replace(/^Royal\s+/i,'').replace(/^Hollywood\s+/i,''))) });

/* ==========================================================================\n   LEGACY PRO WRESTLING 8.3.7 — CAREER CONTINUITY & BROADCAST POLISH\n   ========================================================================== */
const LPW837_VERSION='8.3.7';
function lpw837Ensure(c){
 c.world=c.world||{};
 c.world.storyLog=Array.isArray(c.world.storyLog)?c.world.storyLog:[];
 c.world.mediaArchive=Array.isArray(c.world.mediaArchive)?c.world.mediaArchive:[];
 c.world.pendingConsequences=Array.isArray(c.world.pendingConsequences)?c.world.pendingConsequences:[];
 c.world.championIntroSeen=!!c.world.championIntroSeen;
 c.world.recentHeadings=Array.isArray(c.world.recentHeadings)?c.world.recentHeadings:[];
 return c;
}
function lpw837Log(c,type,text,meta={}){
 lpw837Ensure(c);c.world.storyLog.unshift({type,text,week:c.week,month:c.month,day:c.day,time:Date.now(),...meta});
 c.world.storyLog=c.world.storyLog.slice(0,40);if(text)liveAddNews(c,text);return c;
}
function lpw837Recent(c,type,limit=3){return lpw837Ensure(c).world.storyLog.filter(x=>!type||x.type===type).slice(0,limit)}
function lpw837AssignChampions(c){
 lpw8Init(c);const pool=WRESTLERS.map(w=>w.id).filter(id=>id!==c.active),pick=()=>pool.splice(Math.floor(Math.random()*pool.length),1)[0];
 c.championships={world:pick(),television:pick(),heritage:pick(),tag:[pick(),pick()]};return c;
}
function lpw837ChampionOnboarding(){
 const c=lpw837Ensure(liveLoad());if(!c)return gauntletLiveHome();const champ=liveFounder(c.championships?.world)||liveFounder('jack-mercer');
 c.world.championIntroSeen=true;lpw837Log(c,'champion',`${champ.name} opened the new Career as reigning LEGACY World Champion.`);liveSave(c);
 render(`<section class="panel live-world-screen lpw837-champion-intro"><div class="tv-kicker">THE CHAMPIONSHIP ERA</div><h1>MEET THE WORLD CHAMPION</h1><div class="lpw837-champion-stage">${imageWithFallback(champ,'full','art-full','resultVictory')}<div><small>REIGNING LEGACY WORLD CHAMPION</small><h2>${champ.name}</h2><p>“This championship is the standard. Every wrestler enters LEGACY Pro Wrestling believing they can reach me. Most discover how far away they really are.”</p><p class="lpw837-veronica-note"><b>Veronica Vale:</b> Every match, ranking point and rivalry can move your wrestler closer to this title.</p></div></div><button class="btn live-primary" onclick="gauntletLiveFeudOrigin()">BEGIN MONTH ONE</button></section>`);
}
const _lpw837ChooseFounder=lpw835ChooseFounder;
lpw835ChooseFounder=function(id){
 const wrestler=liveFounder(id);if(!wrestler||!LIVE_FOUNDERS.includes(id))return gauntletLiveFounderSelect();
 const career={version:9,founder:id,active:id,stable:[id],week:1,month:1,day:0,wins:0,losses:0,momentum:50,popularity:20,training:{power:0,speed:0,technique:0,charisma:0,recovery:0},progression:{},history:[],created:new Date().toISOString(),world:{onboardingSeen:true,news:[],worldStories:[],storyLog:[],mediaArchive:[],katieThisWeek:0,lastResult:null,manager:null,nextMatchBonus:0,championIntroSeen:false}};
 try{liveEnsureProgression(career);liveEnsureWorld(career);lpw837AssignChampions(career);const rival=livePickDifferent(career);if(rival)liveStartFeud(career,rival.id,'Veronica Vale has selected your first monthly rival.');liveGenerateMonthlyPlan(career);liveSave(career);return lpw837ChampionOnboarding()}catch(error){console.error('8.3.7 Career opening failed:',error);liveSave(career);return gauntletLiveCalendar()}
};
window.lpw835ChooseFounder=lpw835ChooseFounder;window.gauntletLiveChooseFounder=lpw835ChooseFounder;gauntletLiveChooseFounder=lpw835ChooseFounder;

const _lpw837Promo=gauntletLiveResolvePromo;
gauntletLiveResolvePromo=function(type){const c=liveLoad(),r=liveFeudOpponent(c),p=liveFounder(c.active);if(c&&r&&p){lpw837Log(c,'promo',`${p.name} answered ${r.name} with a ${type} promo.`,{rival:r.id});liveSave(c)}return _lpw837Promo(type)};
const _lpw837Outcome=lpw836ApplyOutcome;
lpw836ApplyOutcome=function(npcId,title,changes,reaction,ripple){const c=liveLoad(),p=liveFounder(c.active);if(c&&p){lpw837Log(c,'decision',`${p.name}: ${title}. ${reaction}`,{npc:npcId,changes});liveSave(c)}return _lpw837Outcome(npcId,title,changes,reaction,ripple)};

function lpw837Rating(){const c=liveLoad(),last=c?.world?.lastResult;let base=2.75+Math.random()*.85;if(last?.win)base+=.15;if(c?.momentum>70)base+=.15;if(Math.random()<.08)base+=.45;if(Math.random()<.015)base+=.45;return Math.min(5,Math.round(base*4)/4)}
function lpw837Stars(v){const whole=Math.floor(v),frac=v-whole;return '★'.repeat(whole)+(frac>=.75?'¾':frac>=.5?'½':frac>=.25?'¼':'')}
function lpw837DirtSheet(supercard=false){
 const c=lpw837Ensure(liveLoad()),p=liveFounder(c.active),r=liveFeudOpponent(c),last=c.world.lastResult,pool=liveOtherPool(c).filter(w=>w.id!==p.id),a=one(pool),b=one(pool.filter(x=>x.id!==a?.id)),rise=one(pool),fall=one(pool.filter(x=>x.id!==rise?.id)),rating=lpw837Rating();
 const match=last?`${p.name} vs ${liveFounder(last.opponent)?.name||r?.name||'an LPW rival'}`:`${a?.name||p.name} vs ${b?.name||r?.name||'an LPW contender'}`;
 const rumour=r?`Sources say officials are considering a stipulation for ${p.name} and ${r.name}.`:`Sources say a major challenge is being prepared for ${p.name}.`;
 const body=`${match} earned ${rating.toFixed(2).replace(/0$/,'')} stars. ${rise?.name||p.name} is trending upward while ${fall?.name||r?.name||p.name} faces pressure.`;
 lpw836Archive(c,supercard?'supercard-reaction':'dirt-sheet',supercard?'SuperCard Instant Reaction':'Dirt Sheet Digest',body);lpw837Log(c,'media',body);liveSave(c);
 render(`<section class="panel live-world-screen lpw-media-screen lpw837-dirt"><div class="tv-kicker">${supercard?'SUPERCARD SPECIAL':'WEEKLY MEDIA'}</div><h1>${supercard?'INSTANT REACTION':'DIRT SHEET DIGEST 2.0'}</h1><div class="live-npc-scene large">${lpw836NpcVisual('derek-pierce','full')}<div><small>DIRT SHEET WRITER</small><h2>Derek Pierce</h2><p>“Results are public. Everything else depends on who is willing to talk.”</p></div></div><div class="lpw-media-grid lpw837-media-grid"><article><small>MATCH OF THE ${supercard?'NIGHT':'WEEK'}</small><b>${match}</b><p>${lpw837Stars(rating)} · ${rating.toFixed(2).replace(/0$/,'')} stars</p></article><article><small>SUPERSTAR OF THE ${supercard?'NIGHT':'WEEK'}</small><b>${last?.win?p.name:(a?.name||r?.name||p.name)}</b><p>The performance creating the loudest conversation.</p></article><article><small>DUD OF THE WEEK</small><b>${fall?.name||r?.name||'Undisclosed'}</b><p>A difficult week has raised uncomfortable questions.</p></article><article><small>STOCK RISING</small><b>${rise?.name||p.name}</b><p>Momentum, reactions and internal confidence are moving upward.</p></article><article><small>STOCK FALLING</small><b>${fall?.name||r?.name||p.name}</b><p>The next appearance now carries added pressure.</p></article><article><small>INJURY WATCH</small><b>${c.world.injury?p.name:'ROSTER CLEARED'}</b><p>${c.world.injury?'Medical clearance remains under review.':'No major absence has been confirmed this week.'}</p></article><article><small>CONTRACT GOSSIP</small><b>${a?.name||'A TOP CONTENDER'}</b><p>Talent Relations is believed to be discussing future opportunities.</p></article><article><small>RUMOUR OF THE WEEK</small><b>SOURCES SAY...</b><p>${rumour}</p></article></div><p class="lpw-disclaimer">Rumours are based on anonymous sources and backstage speculation. LPW has not verified these claims.</p><button class="btn live-primary" onclick="lpw836CompleteMedia()">CONTINUE</button></section>`)
}
lpw836DirtSheet=lpw837DirtSheet;

function lpw837AvaPulse(){
 const c=lpw837Ensure(liveLoad()),p=liveFounder(c.active),r=liveFeudOpponent(c),last=c.world.lastResult;
 render(`<section class="panel live-world-screen lpw-media-screen"><div class="tv-kicker">LPW SOCIAL</div><h1>AVA'S PULSE</h1><div class="live-npc-scene large">${lpw836NpcVisual('ava-cross','full')}<div><small>SOCIAL MEDIA CORRESPONDENT</small><h2>Ava Cross</h2><p>“The audience is reacting now. Choose the message they hear from you.”</p></div></div><div class="lpw-media-grid"><article><small>TRENDING</small><b>#${p.name.replace(/[^A-Za-z0-9]/g,'')}</b><p>${last?.win?'Victory clips are spreading quickly.':'Fans are waiting for a response.'}</p></article><article><small>RIVALRY HEAT</small><b>${r?`${p.name} vs ${r.name}`:'OPEN CHALLENGE'}</b><p>${r?'The rivalry dominates discussion.':'The audience wants a new challenger.'}</p></article></div><div class="live-choice-grid"><button onclick="lpw837SocialChoice('YOUR POST GOES VIRAL',{popularity:4,momentum:2,feud:5},'A confident post is shared across the LPW audience.')"><b>POST A BOLD MESSAGE</b><span>Popularity, momentum and rivalry</span></button><button onclick="lpw837SocialChoice('FANS RESPECT THE FOCUS',{popularity:3,momentum:4},'A measured response earns respect without losing focus.')"><b>KEEP IT PROFESSIONAL</b><span>Popularity and momentum</span></button></div></section>`)
}
function lpw837SocialChoice(title,changes,reaction){lpw836ApplyOutcome('ava-cross',title,changes,reaction,'Commentary, the Dirt Sheet and your rival may reference this post later.')}
lpw836AvaPulse=lpw837AvaPulse;

function lpw837Medical(){
 const c=liveLoad(),p=liveFounder(c.active),prog=liveProgress(c.active,c),condition=c.world.injury?'Medical clearance is not yet guaranteed.':'No acute injury is currently preventing competition.';
 render(`<section class="panel live-world-screen lpw-npc-standard"><div class="tv-kicker">MEDICAL DEPARTMENT</div><h1>MEDICAL CHECK-IN</h1><div class="live-npc-scene large">${lpw836NpcVisual('dr-lena-hart','full')}<div><small>CHIEF MEDICAL OFFICER</small><h2>Dr. Lena Hart</h2><p>“${p.name}, I have reviewed your recent workload and recovery markers. ${condition} Your recovery rating is ${prog.stats.recovery}, so we need to balance readiness with long-term durability.”</p></div></div><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('dr-lena-hart','RECOVERY PLAN ACCEPTED',{recovery:1},'Dr. Hart records improved recovery compliance.','Better recovery can protect future availability and performance.')"><b>FOLLOW THE RECOVERY PLAN</b><span>Recovery +1</span></button><button onclick="lpw836ApplyOutcome('dr-lena-hart','CLEARANCE REQUESTED',{momentum:3},'Dr. Hart documents your request and schedules reassessment.','Determination increases momentum, but medical risk remains monitored.')"><b>REQUEST REASSESSMENT</b><span>Momentum +3</span></button></div></section>`)
}
function lpw837Competition(){
 const c=lpw8Init(liveLoad()),p=liveFounder(c.active),r=liveFeudOpponent(c),rows=lpw8Rankings(c),rank=Math.max(1,rows.findIndex(x=>x.id===c.active)+1),recent=c.world.lastResult,trend=recent?(recent.win?'rising after your latest victory':'under pressure after your latest defeat'):'still being established';
 render(`<section class="panel live-world-screen lpw-npc-standard"><div class="tv-kicker">COMPETITION OFFICE</div><h1>COMPETITION UPDATE</h1><div class="live-npc-scene large">${lpw836NpcVisual('ethan-brooks','full')}<div><small>DIRECTOR OF COMPETITION</small><h2>Ethan Brooks</h2><p>“${p.name}, you are currently ranked #${rank}. Your position is ${trend}.${r?` The rivalry with ${r.name} is influencing how officials view your next opportunity.`:''} Another strong result can move you toward a featured match.”</p></div></div><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('ethan-brooks','RANKING CHALLENGE ISSUED',{popularity:4},'Competition officials record your demand for stronger opposition.','Your next result will be judged as evidence that you belong higher than #${rank}.')"><b>PUSH FOR A HIGHER RANKING</b><span>Popularity +4</span></button><button onclick="lpw836ApplyOutcome('ethan-brooks','RESULTS FIRST',{momentum:4},'Ethan respects the commitment to earning advancement in the ring.','The next match carries added competitive significance.')"><b>EARN IT IN THE RING</b><span>Momentum +4</span></button></div></section>`)
}
const lenaEntry=LPW836_DEVELOPMENT.find(x=>x.id==='dr-lena-hart');if(lenaEntry)lenaEntry.run='lpw837Medical()';
const ethanEntry=LPW836_DEVELOPMENT.find(x=>x.id==='ethan-brooks');if(ethanEntry)ethanEntry.run='lpw837Competition()';

const _lpw837WorldRecap=gauntletLiveWorldRecap;
gauntletLiveWorldRecap=function(){
 const c=lpw837Ensure(liveLoad()),last=c.world.lastResult,p=liveFounder(c.active),r=liveFeudOpponent(c);if(!c.world.worldStories.length)liveSimulateWorld(c);const stories=c.world.worldStories.slice(0,4),rank=lpw8Rankings(lpw8Init(c)).findIndex(x=>x.id===c.active)+1;
 const surprise=stories[0]?.text||'A new contender has entered the conversation.',disappointment=stories[1]?.text||'One expected breakthrough failed to arrive.';
 render(`<section class="panel live-world-screen lpw-world-recap-830 lpw837-recap"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${last?(last.win?`${p.name}'s win leads the broadcast fallout.`:`The response to ${p.name}'s defeat is now the central question.`):'The LPW landscape continues to change around every result.'}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${r?`${r.name} will be studying every weakness before the next confrontation.`:`Somebody in that locker room is already planning the next challenge.`}</p></div></div><div class="lpw837-recap-cards"><article><small>CHAMPIONSHIP IMPLICATIONS</small><b>RANKED #${rank}</b><p>${p.name} needs sustained results to move toward the LEGACY World Championship.</p></article><article><small>BIGGEST SURPRISE</small><p>${surprise}</p></article><article><small>BIGGEST DISAPPOINTMENT</small><p>${disappointment}</p></article><article><small>RIVALRY WATCH</small><p>${r?`${p.name} and ${r.name} remain on a collision course.`:'A new rivalry has yet to be confirmed.'}</p></article></div><div class="live-world-results">${stories.map(s=>`<article><span>${s.a?imageWithFallback(liveFounder(s.a),'portrait','art-portrait','matchPortrait'):''}</span><p>${s.text}</p>${s.b?`<span>${imageWithFallback(liveFounder(s.b),'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`).join('')}</div><button class="btn live-primary" onclick="gauntletLiveCompleteWorldRecap()">CONTINUE</button></section>`)
};

const _lpw837ShowIntro=gauntletLiveShowIntro;
gauntletLiveShowIntro=function(){_lpw837ShowIntro();const c=liveLoad(),recent=lpw837Recent(c,null,2),list=document.querySelector('.show-card-list ul');if(list&&recent.length)list.insertAdjacentHTML('beforeend',recent.map(x=>`<li class="lpw837-continuity">FOLLOW-UP: ${x.text}</li>`).join(''))};

const _lpw837Finish=gauntletLiveFinishMatch65;
gauntletLiveFinishMatch65=function(win,oppId){const c=liveLoad(),p=liveFounder(c.active),o=liveFounder(oppId);if(c&&p&&o){lpw837Log(c,'match',`${win?p.name:o.name} defeated ${win?o.name:p.name}; the result will affect rankings, commentary and media coverage.`,{win,opponent:oppId});liveSave(c)}return _lpw837Finish(win,oppId)};

const _lpw837Home=gauntletLiveHome;
gauntletLiveHome=function(){_lpw837Home();const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent='VERSION 8.3.7';const tag=document.querySelector('.build-tag');if(tag)tag.textContent='VERSION 8.3.7'};

/* =============================================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 2 — CONSOLIDATED QA IMPLEMENTATION
   ============================================================================= */
const LPW837_BUILD='2';

function lpw837BeltGraphic(){
 return `<div class="lpw837-world-belt" aria-label="LEGACY World Championship belt"><span class="belt-strap left"></span><span class="belt-side">LPW</span><span class="belt-centre"><small>LEGACY</small><b>WORLD</b><em>CHAMPION</em></span><span class="belt-side">★</span><span class="belt-strap right"></span></div>`;
}

lpw837ChampionOnboarding=function(){
 const c=lpw837Ensure(liveLoad());if(!c)return gauntletLiveHome();
 const champ=liveFounder(c.championships?.world)||liveFounder('jack-mercer');
 c.world.championIntroSeen=true;
 lpw837Log(c,'champion',`${champ.name} begins the new season as reigning LEGACY World Champion.`);
 liveSave(c);
 render(`<section class="panel live-world-screen lpw837-champion-intro lpw837-champion-intro-b2">
  <button class="btn secondary lpw837-skip-month" onclick="gauntletLiveFeudOrigin()">SKIP / BEGIN MONTH ONE</button>
  <div class="tv-kicker">THE CHAMPIONSHIP ERA</div><h1>MEET THE WORLD CHAMPION</h1>
  <div class="lpw837-champion-stage">${imageWithFallback(champ,'victory','art-full','resultVictory')}<div><small>REIGNING LEGACY WORLD CHAMPION</small><h2>${champ.name}</h2>${lpw837BeltGraphic()}<p>“This championship is the standard. Every wrestler enters LEGACY Pro Wrestling believing they can reach me. Most discover how far away they really are.”</p><p class="lpw837-veronica-note"><b>Veronica Vale:</b> Every match, ranking point and rivalry can move your wrestler closer to this title.</p></div></div>
  <button class="btn live-primary" onclick="gauntletLiveFeudOrigin()">BEGIN MONTH ONE</button>
 </section>`);
};

/* Development choices now explain the decision and its consequences. */
function lpw837ChoiceSummary(changes){
 const labels={popularity:'Popularity',momentum:'Momentum',feud:'Rivalry intensity',power:'Power',speed:'Speed',technique:'Technique',charisma:'Charisma',recovery:'Recovery'};
 return Object.entries(changes).map(([k,v])=>`${v>0?'+':''}${v} ${labels[k]||k}`).join(' · ');
}
const madisonB2=LPW836_DEVELOPMENT.find(x=>x.id==='madison-price');
if(madisonB2){
 madisonB2.copy='Madison Price places a national campaign proposal on the table. Accepting will put your face in front of a larger audience, but declining keeps complete control of your public image.';
 madisonB2.a=['ACCEPT THE CAMPAIGN',{popularity:6},'The campaign expands your visibility.','You gain national exposure and sponsorship attention, but your image becomes tied to the campaign.'];
 madisonB2.b=['STAY INDEPENDENT',{momentum:3},'Fans respect the selective approach.','You keep full control of your identity and earn respect, but receive no sponsorship exposure.'];
}
lpw836CareerDevelopment=function(){
 const c=liveLoad(),bag=[];LPW836_DEVELOPMENT.forEach(e=>{for(let i=0;i<(e.weight||1);i++)bag.push(e)});let e=one(bag);if(e.id===c.world.lastDevelopmentNpc)e=one(LPW836_DEVELOPMENT.filter(x=>x.id!==e.id));c.world.lastDevelopmentNpc=e.id;liveSave(c);
 if(e.run)return window.eval(e.run);if(lpw836FirstMeeting(e.id,'lpw836CareerDevelopment()'))return;
 const option=(choice)=>`<button onclick='lpw836ApplyOutcome(${JSON.stringify(e.id)},${JSON.stringify(choice[0])},${JSON.stringify(choice[1])},${JSON.stringify(choice[2])},${JSON.stringify(choice[3])})'><b>${choice[0]}</b><span>${choice[3]}</span><small>${lpw837ChoiceSummary(choice[1])}</small></button>`;
 render(`<section class="panel live-world-screen lpw-npc-standard"><div class="tv-kicker">CAREER DEVELOPMENT</div><h1>${e.title}</h1><div class="live-npc-scene large">${lpw836NpcVisual(e.id,'full')}<div><small>${npc(e.id).role}</small><h2>${npc(e.id).name}</h2><p>${e.copy}</p></div></div><div class="live-choice-grid lpw837-explained-choices">${option(e.a)}${option(e.b)}</div></section>`)
};

/* Gradual rankings: champions are title holders, not contenders. */
function lpw837ChampionIds(c){return new Set(Object.values(c.championships||{}).flat().filter(Boolean))}
function lpw837SeedRankings(c,force=false){
 lpw8Init(c);const champIds=lpw837ChampionIds(c),contenders=WRESTLERS.filter(w=>!champIds.has(w.id));
 const invalid=!Array.isArray(c.rankings)||c.rankings.length!==contenders.length||c.rankings.some(r=>champIds.has(r.id));
 if(force||invalid){
  const ordered=[...contenders].sort((a,b)=>(b.overall-a.overall)||(a.name.localeCompare(b.name)));
  const activeIndex=ordered.findIndex(w=>w.id===c.active);
  if(activeIndex>=0){const [active]=ordered.splice(activeIndex,1);ordered.splice(Math.floor(ordered.length*.52),0,active)}
  c.rankings=ordered.map((w,i)=>({id:w.id,points:100-i*3,wins:0,losses:0}));
 }
 return c;
}
lpw8Rankings=function(c){lpw837SeedRankings(c);return [...c.rankings].sort((a,b)=>b.points-a.points)};
lpw8RankingScreen=function(){
 const c=lpw837SeedRankings(liveLoad());liveSave(c);const rows=lpw8Rankings(c);
 const championTile=t=>{const ids=(Array.isArray(c.championships[t.id])?c.championships[t.id]:[c.championships[t.id]]).filter(Boolean),ws=ids.map(liveFounder).filter(Boolean);return `<article class="lpw837-champion-tile"><div class="lpw837-champion-portraits ${ws.length>1?'tag':''}">${ws.map(w=>imageWithFallback(w,'portrait','art-portrait','matchPortrait')).join('')}</div><span><small>${t.short} CHAMPION${ws.length>1?'S':''}</small><b>${ws.map(w=>w.name).join(' & ')||'VACANT'}</b></span></article>`};
 render(`<section class="panel lpw8-rankings lpw837-rankings-b2">${shellBack()}<div class="tv-kicker">CHAMPIONSHIP ERA</div><h1>POWER RANKINGS</h1><p class="sub">The champions hold the gold. These rankings measure the chase behind them.</p><div class="lpw8-title-strip">${LPW8_TITLES.map(championTile).join('')}</div><div class="lpw8-ranking-list">${rows.map((r,i)=>{const w=liveFounder(r.id);return `<article><strong>${i+1}</strong>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<span><b>${w.name}</b><small>${w.title}</small></span><em>${r.points} PTS<br>${r.wins}-${r.losses}</em></article>`}).join('')}</div><button class="btn live-primary" onclick="gauntletLiveHome()">RETURN TO CAREER</button></section>`)
};

/* Replace the old large ranking jumps with controlled weekly movement. */
const _lpw837b2FinishRankings=gauntletLiveFinishMatch65;
gauntletLiveFinishMatch65=function(win,oppId){
 const c=lpw837SeedRankings(liveLoad()),me=c.rankings.find(x=>x.id===c.active),op=c.rankings.find(x=>x.id===oppId);
 if(me&&op){
  const playerUpset=win&&op.points>me.points+12,opponentUpset=!win&&me.points>op.points+12;
  const playerDelta=win?(playerUpset?11:5):-3,oppDelta=win?-3:(opponentUpset?10:5);
  me.points=Math.max(0,me.points+playerDelta);op.points=Math.max(0,op.points+oppDelta);me[win?'wins':'losses']++;op[win?'losses':'wins']++;
 }
 liveSave(c);return _lpw837b2FinishRankings(win,oppId);
};

/* World recap: winner is always left, loser right; disappointment describes the losing performer. */
gauntletLiveWorldRecap=function(){
 const c=lpw837Ensure(lpw837SeedRankings(liveLoad())),last=c.world.lastResult,p=liveFounder(c.active),r=liveFeudOpponent(c);if(!c.world.worldStories.length)liveSimulateWorld(c);
 const stories=c.world.worldStories.slice(0,4).map(s=>{if(!s.winner)return s;const winId=s.winner,loseId=s.a===winId?s.b:s.a;return {...s,a:winId,b:loseId}}),rank=Math.max(1,lpw8Rankings(c).findIndex(x=>x.id===c.active)+1);
 const surprise=stories[0]?.text||'A new contender has entered the conversation.';
 const dud=stories[1]||stories[0],loser=dud?.b?liveFounder(dud.b):null,disappointment=loser?`${loser.name} entered the night with an opportunity to build momentum, but the defeat leaves difficult questions before the next appearance.`:'One expected breakthrough failed to arrive.';
 render(`<section class="panel live-world-screen lpw-world-recap-830 lpw837-recap"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${last?(last.win?`${p.name}'s win leads the broadcast fallout.`:`The response to ${p.name}'s defeat is now the central question.`):'The LPW landscape continues to change around every result.'}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${r?`${r.name} will be studying every weakness before the next confrontation.`:`Somebody in that locker room is already planning the next challenge.`}</p></div></div><div class="lpw837-recap-cards"><article><small>CHAMPIONSHIP OUTLOOK</small><b>RANKED #${rank}</b><p>${rank>10?`${p.name} is building early momentum while management evaluates the next step.`:`Sustained results are beginning to move ${p.name} into the wider contender conversation.`}</p></article><article><small>BIGGEST SURPRISE</small><p>${surprise}</p></article><article><small>BIGGEST DISAPPOINTMENT</small><p>${disappointment}</p></article><article><small>RIVALRY WATCH</small><p>${r?`${p.name} and ${r.name} remain on a collision course.`:'A new rivalry has yet to be confirmed.'}</p></article></div><div class="live-world-results">${stories.map(s=>`<article><span>${s.a?imageWithFallback(liveFounder(s.a),'portrait','art-portrait','matchPortrait'):''}</span><p>${s.text}</p>${s.b?`<span>${imageWithFallback(liveFounder(s.b),'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`).join('')}</div><button class="btn live-primary" onclick="gauntletLiveCompleteWorldRecap()">CONTINUE</button></section>`)
};

/* Immersive show open: button immediately below logo, continuity without developer labels. */
gauntletLiveShowIntro=function(){
 const c=liveLoad(),item=livePlanItem(c),stories=liveSimulateWorld(c),venue=one(VENUES),attendance=Math.floor(rnd(11000,20500)).toLocaleString();liveSave(c);
 const show=liveIsSupercard(c)?liveCurrentSupercard(c).toUpperCase():liveShowName(c),recent=lpw837Recent(c,null,2);
 const card=stories.slice(0,2).map(s=>`<li>${s.text.replace(/ defeated .*?\./,' is scheduled to appear tonight.')}</li>`).join('')+recent.map(x=>`<li class="lpw837-continuity">${x.text}</li>`).join('');
 const p=liveFounder(c.active),r=liveFeudOpponent(c),last=c.world.lastResult;
 const mike=last?.win?`${p.name}'s victory earlier this week has shifted the mood around the locker room.`:`Tonight is an opportunity for ${p.name} to answer the questions raised earlier this week.`;
 const johnny=r?`${r.name} has seen the momentum change and will be looking for an answer tonight.`:'The pressure is rising, and nobody on this roster can afford to stand still.';
 render(`<section class="panel live-show-intro lpw-show-open lpw837-show-open-b2"><div class="show-intro-copy">${liveIsSupercard(c)?`<div class="lpw-ple-title">${show}</div>`:lpwShowLogo(show)}<button class="btn live-primary lpw837-start-first" onclick="gauntletLiveRunShowSegment()">START THE SHOW</button><div class="tv-kicker">LIVE FROM ${venue.toUpperCase()} · ${attendance} IN ATTENDANCE</div><div class="live-commentary-duo show-preview"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${mike}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${johnny}</p></div></div><div class="show-card-list"><small>TONIGHT ON LPW</small><ul>${card||'<li>Major developments from across LEGACY Pro Wrestling.</li>'}</ul><b>YOUR SEGMENT · ${liveIsSupercard(c)?'FEUD FINALE':item.type==='segment'?liveSegmentTitle(item.segment):item.type.toUpperCase()+' MATCH'}</b></div></div></section>`)
};

/* Current build label. */
const _lpw837b2Home=gauntletLiveHome;
gauntletLiveHome=function(){_lpw837b2Home();const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent='VERSION 8.3.7 BUILD 2';const tag=document.querySelector('.build-tag');if(tag)tag.textContent='VERSION 8.3.7 BUILD 2'};

/* Ranking correction: preserve the legacy match flow while replacing its old point jump. */
const _lpw837b2LegacyFinish=_lpw837b2FinishRankings;
gauntletLiveFinishMatch65=function(win,oppId){
 const before=lpw837SeedRankings(liveLoad());
 const me0=before.rankings.find(x=>x.id===before.active),op0=before.rankings.find(x=>x.id===oppId);
 const snapshot={me:me0?{points:me0.points,wins:me0.wins,losses:me0.losses}:null,op:op0?{points:op0.points,wins:op0.wins,losses:op0.losses}:null};
 const result=_lpw837b2LegacyFinish(win,oppId);
 const c=lpw837SeedRankings(liveLoad()),me=c.rankings.find(x=>x.id===c.active),op=c.rankings.find(x=>x.id===oppId);
 if(me&&op&&snapshot.me&&snapshot.op){
  const playerUpset=win&&snapshot.op.points>snapshot.me.points+12,opponentUpset=!win&&snapshot.me.points>snapshot.op.points+12;
  me.points=Math.max(0,snapshot.me.points+(win?(playerUpset?11:5):-3));
  op.points=Math.max(0,snapshot.op.points+(win?-3:(opponentUpset?10:5)));
  me.wins=snapshot.me.wins+(win?1:0);me.losses=snapshot.me.losses+(win?0:1);
  op.wins=snapshot.op.wins+(win?0:1);op.losses=snapshot.op.losses+(win?1:0);
  liveSave(c);
 }
 return result;
};


/* =============================================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 3 — WEEK 1–2 QA CONSOLIDATION
   ============================================================================= */
const LPW837_BUILD3='3';

function lpw837b3StatLabel(key){return ({feud:'Feud intensity',recovery:'Recovery',power:'Power',speed:'Speed',technique:'Technique',charisma:'Charisma',momentum:'Momentum',popularity:'Popularity'})[key]||key.replace(/(^|_)([a-z])/g,(_,a,b)=>`${a?' ':''}${b.toUpperCase()}`)}

/* Every old-style one-stat choice now receives the same outcome screen. */
gauntletLiveResolveDynamic=function(type,val,msg){
 const c=liveLoad();if(!c)return gauntletLiveHome();
 const p=liveProgress(c.active,c),f=liveFeud(c),before={};
 before[type]=['power','speed','technique','charisma','recovery'].includes(type)?p.stats[type]:type==='feud'?(f?.intensity||0):(c[type]||0);
 if(type==='feud'){if(f)f.intensity=liveClamp(f.intensity+val,0,100)}
 else if(['power','speed','technique','charisma','recovery'].includes(type))p.stats[type]=Math.min(p.caps[type],p.stats[type]+val);
 else c[type]=liveClamp((c[type]||0)+val,0,100);
 const after={};after[type]=['power','speed','technique','charisma','recovery'].includes(type)?p.stats[type]:type==='feud'?(f?.intensity||0):(c[type]||0);
 liveAwardXp(c,c.active,35,'Career activity');liveAdvanceDay(c);liveSave(c);
 const host=type==='feud'?'katie-morgan':type==='recovery'?'dr-lena-hart':'coach-hank-dawson';
 lpw836Outcome(msg.toUpperCase(),host,before,after,`${lpw837b3StatLabel(type)} changed because of your decision.`,`This result has been saved and can influence future broadcasts and events.`)
};

gauntletLiveClearInjury=function(type){
 const c=liveLoad();if(!c)return gauntletLiveHome();
 const diagnosis=c.world.injuryDetail||{name:'Bruised ribs',severity:'Minor',recovery:'3–5 days'};
 const before={momentum:c.momentum,'injury risk':type==='push'?'Moderate':'Moderate'};
 c.momentum=liveClamp(c.momentum+(type==='push'?5:-3),0,100);
 c.world.injury=type==='push'?{...diagnosis,active:true,risk:'High'}:null;
 const after={momentum:c.momentum,'injury risk':type==='push'?'High':'Reduced'};
 liveAwardXp(c,c.active,20,'Medical decision');liveAdvanceDay(c);liveSave(c);
 lpw836Outcome(type==='push'?'CLEARED TO COMPETE':'RECOVERY PLAN ACCEPTED','dr-lena-hart',before,after,type==='push'?'You have chosen to compete despite medical advice.':'Rest and treatment have reduced the chance of aggravating the injury.',type==='push'?'The injury remains active and may affect the next broadcast.':'The injury is expected to settle before your next appearance.')
};

gauntletLiveDoctorVisit=function(){
 const c=liveLoad();if(!c)return gauntletLiveHome();
 const detail=c.world.injuryDetail||{name:'Bruised ribs',severity:'Minor',recovery:'3–5 days',cause:'a hard landing during your previous match'};c.world.injuryDetail=detail;liveSave(c);
 render(`<section class="panel live-world-screen lpw-npc-standard lpw837b3-one-screen"><div class="tv-kicker">MEDICAL EVALUATION</div><h1>DOCTOR'S ORDERS</h1><div class="live-npc-scene large">${npcImage('dr-lena-hart','full')}<div><small>MEDICAL DIRECTOR</small><h2>Dr. Lena Hart</h2><p>“You suffered <b>${detail.name}</b> after ${detail.cause}. This is a <b>${detail.severity.toLowerCase()}</b> injury with an expected recovery of <b>${detail.recovery}</b>.”</p><div class="lpw837b3-diagnosis"><span>INJURY <b>${detail.name}</b></span><span>SEVERITY <b>${detail.severity}</b></span><span>RECOVERY <b>${detail.recovery}</b></span></div></div></div><div class="live-choice-grid"><button onclick="gauntletLiveClearInjury('rest')"><b>REST & RECOVER</b><span>Momentum -3 · injury risk reduced</span></button><button onclick="gauntletLiveClearInjury('push')"><b>COMPETE THROUGH IT</b><span>Momentum +5 · injury remains active</span></button></div></section>`)
};

/* Replace Ethan's competition-office role with Katie Morgan and connected answers. */
lpw837CompetitionOffice=function(){
 const c=liveLoad(),p=liveFounder(c.active),r=liveFeudOpponent(c),rank=Math.max(1,lpw8Rankings(lpw837SeedRankings(c)).findIndex(x=>x.id===c.active)+1);
 render(`<section class="panel live-world-screen lpw-npc-standard lpw837b3-one-screen"><div class="tv-kicker">BACKSTAGE INTERVIEW</div><h1>CAREER UPDATE</h1><div class="live-npc-scene large">${lpw836NpcVisual('katie-morgan','full')}<div><small>BACKSTAGE INTERVIEWER</small><h2>Katie Morgan</h2><p>“${p.name}, your latest result has moved you to #${rank}. Management is taking notice${r?`, and the rivalry with ${r.name} is adding pressure`:''}. Do you call for a bigger opportunity, or let your matches speak?”</p></div></div><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('katie-morgan','YOU CALLED YOUR SHOT',{popularity:4},'Your demand for stronger opposition becomes a talking point.','Management will judge your next result against the higher expectations you created.')"><b>CALL YOUR SHOT</b><span>Ask for tougher opposition · Popularity +4</span></button><button onclick="lpw836ApplyOutcome('katie-morgan','LET THE RESULTS SPEAK',{momentum:4},'The measured answer earns respect backstage.','Your next performance will carry added competitive significance.')"><b>LET THE MATCHES SPEAK</b><span>Stay focused on winning · Momentum +4</span></button></div></section>`)
};
const competitionB3=LPW836_DEVELOPMENT.find(x=>x.id==='ethan-brooks');if(competitionB3){competitionB3.id='katie-morgan';competitionB3.run='lpw837CompetitionOffice()';competitionB3.weight=2}

/* More specific Olivia copy. */
const oliviaB3=LPW836_DEVELOPMENT.find(x=>x.id==='olivia-chase');if(oliviaB3){
 oliviaB3.copy='A local fan event has requested an appearance before the next broadcast. Meeting supporters will build public goodwill, while declining gives you more time to prepare for the ring.';
 oliviaB3.a=['MEET THE FANS',{popularity:6},'Hundreds of supporters attended the appearance and shared photos across LPW Social.','The next live crowd begins slightly more receptive to you.'];
 oliviaB3.b=['PREPARE FOR THE RING',{momentum:3},'You used the extra time to study your next opponent and sharpen your preparation.','Your match focus improves, but you receive no additional fan exposure.'];
}

/* Clean wrestler decision language without mechanically prefixing names/themes. */
const _lpwCleanDecisionNameB3QA=typeof lpwCleanDecisionName==='function'?lpwCleanDecisionName:(x=>x);
lpwCleanDecisionName=function(name){
 let n=_lpwCleanDecisionNameB3QA(name||'');
 n=n.replace(/^Royal\s+(?=(Commit|Turn|Risk|Refuse|Leave))/i,'');
 n=n.replace(/^Victor Royale\s*[-:]?\s*/i,'');
 return n.replace(/\s{2,}/g,' ').trim();
};

/* First-show world state and evolving commentary. */
gauntletLiveShowIntro=function(){
 const c=liveLoad(),item=livePlanItem(c),firstShow=c.week===1&&c.day===0&&!c.world.lastResult,venue=one(VENUES),attendance=Math.floor(rnd(11000,20500)).toLocaleString(),show=liveIsSupercard(c)?liveCurrentSupercard(c).toUpperCase():liveShowName(c),p=liveFounder(c.active),r=liveFeudOpponent(c);
 let stories=[];if(!firstShow)stories=liveSimulateWorld(c);liveSave(c);
 const recent=firstShow?[]:lpw837Recent(c,null,2);
 const card=firstShow?`<li>${p.name} makes a first televised Career appearance tonight.</li><li>${r?`${r.name} is scheduled to appear as the opening rivalry begins.`:'The LEGACY World Championship picture begins to take shape.'}</li>`:stories.slice(0,2).map(s=>`<li>${s.text}</li>`).join('')+recent.map(x=>`<li class="lpw837-continuity">${x.text.replace(/^[A-Z ]+:\s*/,'')}</li>`).join('');
 const mike=firstShow?`Welcome to Monday Night Mayhem, LEGACY Pro Wrestling's flagship show—where rivalries begin, careers are made and anything can happen.`:c.week>1?`${p.name} enters Week ${c.week} with a ${c.wins}-${c.losses} record and growing expectations.`:(c.world.lastResult?.win?`${p.name}'s victory earlier this week has changed the conversation around the locker room.`:`Tonight gives ${p.name} a chance to respond after the previous result.`);
 const johnny=firstShow?`I cannot wait to see what unfolds tonight. Everybody on this roster has something to prove.`:r?`${r.name} is watching closely, and every decision now adds another layer to this rivalry.`:'The pressure is rising, and nobody can afford to stand still.';
 render(`<section class="panel live-show-intro lpw-show-open lpw837-show-open-b2"><div class="show-intro-copy">${liveIsSupercard(c)?`<div class="lpw-ple-title">${show}</div>`:lpwShowLogo(show)}<button class="btn live-primary lpw837-start-first" onclick="gauntletLiveRunShowSegment()">START THE SHOW</button><div class="tv-kicker">LIVE FROM ${venue.toUpperCase()} · ${attendance} IN ATTENDANCE</div><div class="live-commentary-duo show-preview"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${mike}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${johnny}</p></div></div><div class="show-card-list"><small>TONIGHT ON LPW</small><ul>${card}</ul><b>YOUR SEGMENT · ${liveIsSupercard(c)?'FEUD FINALE':item.type==='segment'?liveSegmentTitle(item.segment):item.type.toUpperCase()+' MATCH'}</b></div></div></section>`)
};

/* A promised public challenge must resolve before the next match. */
const _lpwBreakingNewsB3QA=lpwBreakingNews;
lpwBreakingNews=function(c){
 const rival=liveFeudOpponent(c),player=liveFounder(c.active);if(!rival||!player)return false;
 const result=_lpwBreakingNewsB3QA(c);
 if(result){const fresh=liveLoad();if(document.querySelector('.lpw-breaking-news p')?.textContent.includes('public challenge')){fresh.world.pendingPublicChallenge=true;liveSave(fresh)}}
 return result;
};
const _gauntletLiveRunShowSegmentB3QA=gauntletLiveRunShowSegment;
gauntletLiveRunShowSegment=function(){const c=liveLoad();if(c?.world?.pendingPublicChallenge)return lpw837b3PublicChallenge();return _gauntletLiveRunShowSegmentB3QA()};
function lpw837b3PublicChallenge(){const c=liveLoad(),p=liveFounder(c.active),r=liveFeudOpponent(c);render(`<section class="panel live-world-screen lpw837b3-one-screen"><div class="tv-kicker">LIVE ON ${liveShowName(c).toUpperCase()}</div><h1>PUBLIC CHALLENGE</h1><div class="lpw837b3-rival-pair">${imageWithFallback(p,'full','art-full','quickMatch')}${imageWithFallback(r,'full','art-full','quickMatch')}</div><p>${r.name} calls ${p.name} to the stage and demands an answer in front of the live audience.</p><div class="live-choice-grid"><button onclick="lpw837b3ResolveChallenge('ACCEPTED THE CHALLENGE',{momentum:4,feud:8},'You walked onto the stage and accepted without hesitation.')"><b>ACCEPT FACE TO FACE</b><span>Momentum +4 · Feud +8</span></button><button onclick="lpw837b3ResolveChallenge('MOCKED THE CHALLENGE',{popularity:5,feud:5},'You answered from the stage and turned the confrontation into a public spectacle.')"><b>MOCK YOUR RIVAL</b><span>Popularity +5 · Feud +5</span></button></div></section>`)}
function lpw837b3ResolveChallenge(title,changes,reaction){const c=liveLoad();c.world.pendingPublicChallenge=false;liveSave(c);const originalAdvance=liveAdvanceDay;liveAdvanceDay=function(){};lpw836ApplyOutcome('katie-morgan',title,changes,reaction,'The confrontation will be referenced later in the broadcast.');liveAdvanceDay=originalAdvance;const btn=document.querySelector('.lpw-consequence-screen button');if(btn)btn.setAttribute('onclick','gauntletLiveRunShowSegment()')}

/* Career-record and attribute-point reminders are always authoritative. */
const _gauntletLiveCareerCardB3QA=gauntletLiveCareerCard;
gauntletLiveCareerCard=function(id){const c=liveLoad();if(c){const use=id||c.active,p=liveProgress(use,c);if(use===c.active){p.wins=c.wins||0;p.losses=c.losses||0;liveSave(c)}}return _gauntletLiveCareerCardB3QA(id)};
const _gauntletLiveCalendarB3QA=gauntletLiveCalendar;
gauntletLiveCalendar=function(){const result=_gauntletLiveCalendarB3QA();setTimeout(()=>{const c=liveLoad();if(!c)return;const p=liveProgress(c.active,c);if(p.points>0&&!document.querySelector('.lpw837b3-points-reminder')){const today=document.querySelector('.live-today');today?.insertAdjacentHTML('afterend',`<button class="lpw837b3-points-reminder" onclick="gauntletLiveCareerCard()"><b>${p.points} ATTRIBUTE POINT${p.points===1?'':'S'} AVAILABLE</b><span>Spend now, or find them later in Career Menu → Manage Stable → My Career.</span></button>`) }},0);return result};

/* Level-up screen tells players where to return if they choose Later. */
gauntletLiveLevelCelebration=function(id,xp,nextDay,returnMode){const c=liveLoad(),w=liveFounder(id),p=liveProgress(id,c),ovr=liveOverall(p);render(`<section class="panel live-level-celebration"><div class="live-level-rays"></div><div class="tv-kicker">CAREER PROGRESSION</div><h1>LEVEL UP!</h1>${imageWithFallback(w,'victory','art-victory','postMatch')}<div class="live-celebration-level"><small>${w.name}</small><b>LEVEL ${p.level}</b><span>OVR ${ovr}</span></div><div class="live-celebration-rewards">${xp.pointsEarned?`<span><b>+${xp.pointsEarned}</b><small>ATTRIBUTE POINT${xp.pointsEarned===1?'':'S'}</small></span>`:''}${xp.milestonesEarned?`<span><b>TRAIT</b><small>MILESTONE CHOICE READY</small></span>`:''}</div><p class="lpw837b3-later-help">Choose Later to keep playing. Your points remain saved under <b>Career Menu → Manage Stable → My Career</b>, and a reminder stays on the Career Hub.</p><div class="live-result-actions">${p.points?`<button class="btn live-primary" onclick="gauntletLiveSpendPoints('${id}')">SPEND ATTRIBUTE POINTS</button>`:''}<button class="btn secondary" onclick="gauntletLiveCalendar()">LATER</button></div></section>`)};

/* Full-screen, persistent Career achievements instead of a buried report panel. */
const _postMatchFlowB3QA=postMatchFlow;
postMatchFlow=function(){const c=liveLoad(),m=milestoneData();if(S?.liveMode&&c&&m.length){c.world.awardedAchievements=c.world.awardedAchievements||[];const key=m[0][0];if(!c.world.awardedAchievements.includes(key)){c.world.awardedAchievements.push(key);c.world.pendingAchievement=m[0];liveSave(c);return lpw837b3AchievementScreen()}}return _postMatchFlowB3QA()};
function lpw837b3AchievementScreen(){const c=liveLoad(),m=c?.world?.pendingAchievement;if(!m)return _postMatchFlowB3QA();render(`<section class="panel lpw837b3-achievement"><div class="tv-kicker">ACHIEVEMENT UNLOCKED</div><div class="lpw837b3-trophy">★</div><h1>${m[0]}</h1><p>${m[1]}</p><button class="btn live-primary" onclick="lpw837b3ContinueAchievement()">CONTINUE</button></section>`)}
function lpw837b3ContinueAchievement(){const c=liveLoad();if(c){c.world.pendingAchievement=null;liveSave(c)}_postMatchFlowB3QA()}

/* Recap navigation appears before optional reading. */
const _gauntletLiveWorldRecapB3QA=gauntletLiveWorldRecap;
gauntletLiveWorldRecap=function(){const r=_gauntletLiveWorldRecapB3QA();setTimeout(()=>{const h=document.querySelector('.lpw837-recap h1');if(h&&!document.querySelector('.lpw837b3-recap-skip'))h.insertAdjacentHTML('afterend','<button class="btn live-primary lpw837b3-recap-skip" onclick="gauntletLiveCompleteWorldRecap()">CONTINUE TO NEXT DAY</button>')},0);return r};
const _lpw837DirtSheetB3QA=lpw837DirtSheet;
lpw837DirtSheet=function(supercard=false){const r=_lpw837DirtSheetB3QA(supercard);setTimeout(()=>{const h=document.querySelector('.lpw837-dirt h1');if(h&&!document.querySelector('.lpw837b3-recap-skip'))h.insertAdjacentHTML('afterend','<button class="btn live-primary lpw837b3-recap-skip" onclick="lpw836CompleteMedia()">CONTINUE TO NEXT DAY</button>')},0);return r};

/* Build label. */
const _gauntletLiveHomeB3QA=gauntletLiveHome;gauntletLiveHome=function(){const r=_gauntletLiveHomeB3QA();const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent='VERSION 8.3.7 BUILD 3';const tag=document.querySelector('.build-tag');if(tag)tag.textContent='VERSION 8.3.7 BUILD 3';return r};


/* LEGACY Pro Wrestling 8.3.7 BUILD 4 — integrated QA patch */
(function(){
 const cleanBase=lpwCleanDecisionName;
 lpwCleanDecisionName=function(name){
  let n=cleanBase(name||'');
  n=n.replace(/^(Rebel|Royal|Heroic|Primal|Olympian|Street|Rockstar|Playboy|Veteran|Legendary)\s+(?=[A-Z])/i,'');
  return n.replace(/\s{2,}/g,' ').trim();
 };

 function ensureWeekly(c){
  c.world=c.world||{};c.world.weeklyMatches=c.world.weeklyMatches||[];
  return c.world.weeklyMatches;
 }
 function logCareerMatch(c,opp,win){
  const list=ensureWeekly(c),rating=Number(M?.completedRating||0)||Number(c.world.lastResult?.rating||0)||3;
  const entry={week:c.week,month:c.month,day:c.day,a:c.active,b:opp?.id,win,rating:Number(rating.toFixed(2)),player:true,venue:currentVenue?.()||'',time:Date.now()};
  list.push(entry);c.world.weeklyMatches=list.slice(-40);
  if(c.world.lastResult)c.world.lastResult.rating=entry.rating;
 }
 const oldComplete=liveCompleteBroadcast;
 liveCompleteBroadcast=function(win){const c=liveLoad(),opp=c?.pending?liveFounder(c.pending.opponent):null;const r=oldComplete(win);const fresh=liveLoad();if(fresh&&opp){logCareerMatch(fresh,opp,win);liveSave(fresh)}return r};

 function fabricateWeekly(c){
  const list=ensureWeekly(c),existing=list.filter(x=>x.week===c.week&&x.month===c.month);
  if(existing.length>=4)return existing;
  const pool=liveOtherPool(c).filter(w=>w.id!==c.active);
  while(existing.length<4&&pool.length>1){
   const a=pool.splice(Math.floor(Math.random()*pool.length),1)[0],b=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
   existing.push({week:c.week,month:c.month,day:Math.floor(Math.random()*7),a:a.id,b:b.id,win:true,rating:Number((2.4+Math.random()*2.2).toFixed(2)),player:false,time:Date.now()});
  }
  c.world.weeklyMatches=[...list.filter(x=>!(x.week===c.week&&x.month===c.month)),...existing].slice(-40);return existing;
 }
 function weeklyBest(c){const rows=fabricateWeekly(c);return rows.sort((a,b)=>b.rating-a.rating)[0]||null}

 lpw837DirtSheet=function(supercard=false){
  const c=lpw837Ensure(liveLoad()),p=liveFounder(c.active),r=liveFeudOpponent(c),best=weeklyBest(c),pool=liveOtherPool(c).filter(w=>w.id!==p.id),rise=one(pool),fall=one(pool.filter(x=>x.id!==rise?.id)),a=best?liveFounder(best.a):one(pool),b=best?liveFounder(best.b):one(pool.filter(x=>x.id!==a?.id)),rating=best?.rating||3;
  const match=`${a?.name||p.name} vs ${b?.name||r?.name||'an LPW contender'}`;
  const rumour=r?`Sources say officials are considering a stipulation for ${p.name} and ${r.name}.`:`Sources say a major challenge is being prepared for ${p.name}.`;
  const body=`${match} earned ${rating.toFixed(2).replace(/0$/,'')} stars. ${rise?.name||p.name} is trending upward while ${fall?.name||r?.name||p.name} faces pressure.`;
  lpw836Archive(c,supercard?'supercard-reaction':'dirt-sheet',supercard?'SuperCard Instant Reaction':'Dirt Sheet Digest',body);lpw837Log(c,'media',body);liveSave(c);
  render(`<section class="panel live-world-screen lpw-media-screen lpw837-dirt"><div class="tv-kicker">${supercard?'SUPERCARD SPECIAL':'WEEKLY MEDIA'}</div><h1>${supercard?'INSTANT REACTION':'DIRT SHEET DIGEST 2.0'}</h1><button class="btn live-primary lpw837b3-recap-skip" onclick="lpw836CompleteMedia()">CONTINUE TO NEXT DAY</button><div class="live-npc-scene large lpw837-npc-portrait">${lpw836NpcVisual('derek-pierce','portrait')}<div><small>DIRT SHEET WRITER</small><h2>Derek Pierce</h2><p>“Results are public. Everything else depends on who is willing to talk.”</p></div></div><div class="lpw-media-grid lpw837-media-grid"><article><small>MATCH OF THE ${supercard?'NIGHT':'WEEK'}</small><b>${match}</b><p>${lpw837Stars(rating)} · ${rating.toFixed(2).replace(/0$/,'')} stars</p></article><article><small>SUPERSTAR OF THE ${supercard?'NIGHT':'WEEK'}</small><b>${best?.player&&best.win?p.name:(a?.name||p.name)}</b><p>The performance creating the loudest conversation.</p></article><article><small>DUD OF THE WEEK</small><b>${fall?.name||r?.name||'Undisclosed'}</b><p>A difficult week has raised uncomfortable questions.</p></article><article><small>STOCK RISING</small><b>${rise?.name||p.name}</b><p>Recent results and reactions are moving upward.</p></article><article><small>STOCK FALLING</small><b>${fall?.name||r?.name||p.name}</b><p>The next appearance now carries added pressure.</p></article><article><small>INJURY WATCH</small><b>${c.world.injury?p.name:'ROSTER CLEARED'}</b><p>${c.world.injury?'Medical clearance remains under review.':'No major absence has been confirmed this week.'}</p></article><article><small>CONTRACT GOSSIP</small><b>${a?.name||'A TOP CONTENDER'}</b><p>Talent Relations is believed to be discussing future opportunities.</p></article><article><small>RUMOUR OF THE WEEK</small><b>SOURCES SAY...</b><p>${rumour}</p></article></div><p class="lpw-disclaimer">Rumours are based on anonymous sources and backstage speculation. LPW has not verified these claims.</p><button class="btn live-primary" onclick="lpw836CompleteMedia()">CONTINUE</button></section>`)
 };
 lpw836DirtSheet=lpw837DirtSheet;

 lpwEventScene=function({kicker,title,npcId,copy,choices}){const p=npc(npcId);render(`<section class="panel live-world-screen lpw-expanded-event lpw837b4-event"><div class="tv-kicker">${kicker}</div><h1>${title}</h1><div class="live-npc-scene large expanded lpw837-npc-portrait">${npcImage(npcId,'portrait')}<div><small>${p?.role||''}</small><h2>${p?.name||''}</h2><p>${copy}</p></div></div><div class="live-choice-grid contextual">${choices.map((x,i)=>`<button onclick="gauntletLiveResolveExpanded(${i})"><b>${x.title}</b><span>${x.copy}</span><em>${x.effect}</em></button>`).join('')}</div></section>`)};
 gauntletLiveResolveExpanded=function(i){
  const c=liveLoad(),e=c.world.pendingExpanded,ch=e?.choices?.[i];if(!ch)return gauntletLiveCalendar();
  const before={};if(ch.type==='manager'){before.manager=c.world.manager||'None';c.world.manager=ch.value}
  else if(ch.type==='feud'){const f=liveFeud(c);before.feud=f?.intensity||0;if(f)f.intensity=liveClamp(f.intensity+ch.value,0,100)}
  else if(ch.type==='bonus'){before['next match bonus']=c.world.nextMatchBonus||0;c.world.nextMatchBonus=(c.world.nextMatchBonus||0)+ch.value}
  else {before[ch.type]=c[ch.type]||0;c[ch.type]=liveClamp((c[ch.type]||0)+ch.value,0,100)}
  liveAwardXp(c,c.active,35,e.title);c.world.pendingExpanded=null;liveAdvanceDay(c);liveSave(c);
  const after={};Object.keys(before).forEach(k=>{after[k]=k==='feud'?(liveFeud(c)?.intensity||before[k]+ch.value):k==='manager'?(npc(c.world.manager)?.name||c.world.manager):k==='next match bonus'?c.world.nextMatchBonus:c[k]});
  const cards=Object.keys(before).map(k=>`<div><small>${k.toUpperCase()}</small><b>${before[k]} → ${after[k]}</b><em>${typeof before[k]==='number'&&typeof after[k]==='number'?`${after[k]-before[k]>=0?'+':''}${after[k]-before[k]}`:''}</em></div>`).join('');
  render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">OUTCOME</div><h1>${ch.title}</h1><div class="lpw-consequence-host">${npcImage(e.npcId,'portrait')}<span><small>${npc(e.npcId)?.role||''}</small><b>${npc(e.npcId)?.name||''}</b></span></div><div class="lpw-change-grid">${cards}</div><div class="lpw-world-reaction"><small>WORLD REACTION</small><p>${ch.copy}</p></div><div class="lpw-ripple"><b>THE RIPPLE EFFECT</b><span>This decision has been saved and can influence future broadcasts and events.</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)
 };

 const oldShowIntro=gauntletLiveShowIntro;
 gauntletLiveShowIntro=function(){const r=oldShowIntro();setTimeout(()=>{const c=liveLoad(),box=document.querySelector('.show-card-list ul');if(!c||!box)return;const best=weeklyBest(c);const items=[...box.querySelectorAll('li')];const seen=new Set();items.forEach(li=>{let t=li.textContent.trim().replace(/YOUR POST GOES VIRAL\.?/gi,'a social media post went viral').replace(/POWER TRAINING COMPLETE\.?/gi,'training produced a measurable improvement');if(/earned\s+\d+(\.\d+)?\s+stars/i.test(t)&&best){const a=liveFounder(best.a),b=liveFounder(best.b);t=`${a?.name||'An LPW wrestler'} vs ${b?.name||'an opponent'} earned ${best.rating.toFixed(1)} stars.`}const key=t.replace(/[^a-z0-9]/gi,'').toLowerCase();if(seen.has(key))li.remove();else{seen.add(key);li.textContent=t}})},0);return r};

 const oldChampion=lpw837ChampionOnboarding;
 lpw837ChampionOnboarding=function(){const r=oldChampion();setTimeout(()=>document.querySelector('.lpw837-champion-stage')?.classList.add('lpw837b4-champion-fix'),0);return r};

 const oldPost=postMatchFlow;
 postMatchFlow=function(){const r=oldPost();setTimeout(()=>{const report=document.querySelector('.presentation-summary,.match-result');if(report&&!report.querySelector('.lpw837b4-bottom-continue'))report.insertAdjacentHTML('beforeend','<div class="lpw837-result-actions-bottom lpw837b4-bottom-continue" style="display:flex!important"><button class="btn live-primary" onclick="postMatchFlow()">CONTINUE BROADCAST</button></div>')},0);return r};

 const oldHome=gauntletLiveHome;gauntletLiveHome=function(){const r=oldHome();const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent='VERSION 8.3.7 BUILD 4';const tag=document.querySelector('.build-tag');if(tag)tag.textContent='VERSION 8.3.7 BUILD 4';return r};
})();

/* =============================================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 5 — GAMEPLAY & REGRESSION CONSOLIDATION
   ============================================================================= */
(function(){
 const BUILD='5';
 const archetypePrefixes=new Set([
  'Rebel','Royal','Heroic','Primal','Olympian','Street','Rockstar','Playboy','Veteran','Legendary','Heartbreaker',
  'Kingmaker','Iceman','Sentinel','Hollywood','Lunatic','Workhorse','Warlord','Showman','Strategist','Enforcer',
  'Powerhouse','Aerialist','Purist','Assassin','Hardcore','Megastar','Con Artist','Brawler','Supernatural','Undead','Dark','Masked','Canadian','Streetwise','Technical'
 ]);
 const stripDecisionPrefix=(name)=>{
  let n=String(name||'').replace(/[“”"]/g,'').trim();
  let parts=n.split(/\s+/);
  while(parts.length>1&&archetypePrefixes.has(parts[0]))parts.shift();
  return parts.join(' ').replace(/\s{2,}/g,' ').trim();
 };
 const priorCleaner=lpwCleanDecisionName;
 lpwCleanDecisionName=function(name){return stripDecisionPrefix(priorCleaner(name||''))};

 /* Equal-opportunity AI psychology. Every player choice now creates a real AI response. */
 const oldStoryChoice=storyChoice;
 storyChoice=function(token){
  oldStoryChoice(token);
  if(!S?.liveMode||!M?.decisionOutcome||M.ended)return;
  const player=S.team[M.activeP],opp=S.opp[M.activeO];
  const playerTier=M.decisionOutcome.key;
  const oppQuality=((opp.overall||75)+(opp.technique||75)+(opp.resilience||75))/3;
  const playerQuality=((player.overall||75)+(player.technique||75)+(player.resilience||75))/3;
  let chance=.38+(oppQuality-playerQuality)/220;
  if(playerTier==='failure')chance+=.08;if(playerTier==='major-failure')chance+=.14;
  if(playerTier==='major-success')chance-=.15;if(playerTier==='success')chance-=.09;
  const roll=Math.random();
  let tier=roll<chance*.22?'major-success':roll<chance*.72?'success':roll<chance+.14?'mixed':roll<.94?'failure':'major-failure';
  const impact={
   'major-success':{score:15,control:16,crowd:11,mom:16},success:{score:10,control:10,crowd:7,mom:10},
   mixed:{score:4,control:3,crowd:2,mom:3},failure:{score:-4,control:-5,crowd:-2,mom:-5},
   'major-failure':{score:-8,control:-9,crowd:-5,mom:-9}
  }[tier];
  if(impact.score>0)addMatchScore('opp',impact.score,'decision');else addMatchScore('player',Math.round(Math.abs(impact.score)*.45),'decision');
  shiftControl(-impact.control,`${opp.name} answered with a ${tier.replace('-',' ')}.`);
  heatCrowd(impact.crowd,impact.crowd>=0?'opp':'player');
  M.oppMom=clamp((M.oppMom||0)+Math.max(0,impact.mom)+Math.max(0,impact.control),0,100);
  if(impact.control>0)M.playerMom=clamp((M.playerMom||0)-Math.round(impact.control*.75),0,100);
  M.decisionOpp=(M.decisionOpp||0)+Math.max(0,impact.score);
  M.performanceOpp=(M.performanceOpp||0)+Math.max(0,Math.round(impact.control*.35));
  M.aiDecisionHistory=M.aiDecisionHistory||[];
  M.aiDecisionHistory.push({outcome:tier,score:impact.score,control:impact.control,momentum:impact.mom});
  if(tier==='major-success'||tier==='success')addBroadcast('counter',`${opp.name} strings together a strong response and takes control of the exchange.`,{highlight:true,weight:2.1});
  else if(tier==='mixed')addBroadcast('commentary',commentatorLine(COMMENTATORS.colour,`${opp.name} answers enough to keep the contest unsettled.`));
  renderMatch();
 };

 /* Final-balance pass: AI strength, form and decisions can now win matches. */
 const oldResolveFinish=resolveFinish;
 resolveFinish=function(){
  if(S?.liveMode&&M&&!M.ended){
   const c=liveLoad(),player=S.team[0],opp=S.opp[0];
   const pStrength=((player.overall||75)+(player.technique||75)+(player.resilience||75)+(player.power||75))/4;
   const oStrength=((opp.overall||75)+(opp.technique||75)+(opp.resilience||75)+(opp.power||75))/4;
   const aiCalls=(M.aiDecisionHistory||[]).length;
   const aiPositive=(M.aiDecisionHistory||[]).filter(x=>x.outcome==='success'||x.outcome==='major-success').length;
   const playerPositive=(M.decisionHistory||[]).filter(x=>/SUCCESS/.test(x.outcome)).length;
   const playerFailures=(M.decisionHistory||[]).filter(x=>/FAILURE/.test(x.outcome)).length;
   const strengthEdge=Math.round((oStrength-pStrength)*1.1);
   const volatility=Math.round(rnd(-12,14));
   M.performancePlayer=Math.round((M.performancePlayer||0)*.94);
   M.decisionPlayer=Math.round((M.decisionPlayer||0)*.90);
   M.performanceOpp=Math.max(M.performanceOpp||0,Math.round(18+(oStrength-70)*.55+aiPositive*3+playerFailures*2+volatility));
   M.decisionOpp=Math.max(M.decisionOpp||0,Math.round(18+aiCalls*3+aiPositive*4+Math.round(strengthEdge*.65)+Math.max(0,volatility)));
   M.crowdOpp=Math.max(M.crowdOpp||0,Math.round(11+aiPositive*4+Math.max(0,Math.round(strengthEdge*.45))));
   if(playerFailures>M.decisionHistory.length/2){M.performanceOpp+=6;M.decisionOpp+=8}
   if(playerPositive===M.decisionHistory.length&&M.decisionHistory.length>=4){M.decisionPlayer+=10}
   /* First career match remains onboarding-friendly, but only narrowly protected. */
   if(c&&c.history?.length===0){M.performancePlayer+=16;M.decisionPlayer+=12}
  }
  return oldResolveFinish();
 };

 /* Make 5-star ratings rare and tied to genuine competitive quality. */
 const oldShowSummary=showSummary;
 showSummary=function(win){
  if(S?.liveMode&&M){
   const originalHighlights=M.highlights;
   const gap=Math.abs((M.finalPlayer||0)-(M.finalOpp||0));
   if(gap>65)M.highlights=(M.highlights||[]).slice(-3);
   else if(gap>35)M.highlights=(M.highlights||[]).slice(-4);
   oldShowSummary(win);
   const competitive=Math.max(0,1-gap/90);
   const raw=Number(M.completedRating||3);
   let adjusted=1.8+(raw-1.8)*.58+competitive*.65;
   if(gap>55)adjusted-=.45;if(gap<12)adjusted+=.2;
   M.completedRating=Number(clamp(adjusted,1.3,4.85).toFixed(2));
   /* Update visible rating generated by the original renderer. */
   const ratingCard=[...document.querySelectorAll('.result-accolades article')].find(x=>/MATCH RATING/.test(x.textContent));
   if(ratingCard){const d=matchRatingData(M.completedRating);const s=ratingCard.querySelector('.result-stars'),b=ratingCard.querySelector('strong');if(s)s.textContent=d.stars;if(b)b.textContent=`${M.completedRating.toFixed(1)} · ${d.label}`}
   M.highlights=originalHighlights;
  }else oldShowSummary(win);
 };

 /* Level-up release gate: never allow the hub to silently reveal a new point. */
 const oldCalendar=gauntletLiveCalendar;
 gauntletLiveCalendar=function(){
  const c=liveLoad();
  if(c){const p=liveProgress(c.active,c);p.lastCelebratedLevel=p.lastCelebratedLevel||1;if(p.level>p.lastCelebratedLevel){const gained=p.level-p.lastCelebratedLevel;p.lastCelebratedLevel=p.level;liveSave(c);return gauntletLiveLevelCelebration(c.active,{levels:gained,pointsEarned:gained,milestonesEarned:0},LIVE_DAYS[c.day].toUpperCase(),'calendar')}}
  return oldCalendar();
 };

 /* Always append a real bottom action to long match reports. */
 const oldSummaryForButton=showSummary;
 showSummary=function(win){const r=oldSummaryForButton(win);setTimeout(()=>{const report=document.querySelector('.presentation-summary');if(!report)return;let bottom=report.querySelector('.lpw837-result-actions-bottom');if(!bottom){bottom=document.createElement('div');bottom.className='actions lpw837-result-actions-bottom';report.appendChild(bottom)}if(!bottom.querySelector('button'))bottom.innerHTML=`<button class="btn" onclick="${win?'postMatchFlow()':'handleLoss()'}">${win?'CONTINUE BROADCAST':'CONTINUE'}</button>`},0);return r};

 /* Universal event outcome for legacy television segments. */
 gauntletLiveResolveSegment=function(seg,choice){
  const c=liveLoad(),f=liveFeud(c),before={momentum:c.momentum,popularity:c.popularity,feud:f?.intensity||0};
  if(choice==='fight'){c.momentum=liveClamp(c.momentum+6,0,100);if(f)f.intensity=liveClamp(f.intensity+10,0,100)}else c.popularity=liveClamp(c.popularity+6,0,100);
  liveAwardXp(c,c.active,45,'Television segment');liveAdvanceDay(c);liveSave(c);
  const after={momentum:c.momentum,popularity:c.popularity,feud:f?.intensity||0};
  lpw836Outcome(choice==='fight'?'CONFRONTATION ESCALATED':'CONTROL MAINTAINED','katie-morgan',before,after,choice==='fight'?'The confrontation becomes one of the night’s most discussed moments.':'Your restraint keeps the broadcast under control.','The choice has been saved and can influence the rivalry and future coverage.');
 };

 /* Injury continuity and recovery clearance. */
 const careerDayIndex=c=>((c.month-1)*28+(c.week-1)*7+c.day);
 gauntletLiveClearInjury=function(type){
  const c=liveLoad(),detail=c.world.injuryDetail||{name:'Bruised ribs',severity:'Minor',recovery:'3–5 days'};
  const before={momentum:c.momentum,'injury status':'Active'};
  c.world.injury={...detail,active:true,risk:type==='push'?'High':'Reduced',until:careerDayIndex(c)+(type==='push'?5:4)};
  c.momentum=liveClamp(c.momentum+(type==='push'?5:-3),0,100);
  liveAwardXp(c,c.active,20,'Medical decision');liveAdvanceDay(c);liveSave(c);
  lpw836Outcome(type==='push'?'COMPETING AGAINST ADVICE':'RECOVERY PLAN ACCEPTED','dr-lena-hart',before,{momentum:c.momentum,'injury status':type==='push'?'Active · High risk':'Recovering'},type==='push'?'You have chosen to remain available despite the injury.':'Rest and treatment reduce the chance of aggravation.',type==='push'?'Physical activity remains restricted and the injury may affect future booking.':'You will not be booked in a match until medical clearance.');
 };
 const oldBeginDay=gauntletLiveBeginDay;
 gauntletLiveBeginDay=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();const injury=c.world?.injury;
  if(injury?.active&&careerDayIndex(c)>=injury.until){c.world.lastInjuryCleared=careerDayIndex(c);c.world.injury=null;c.world.injuryCooldownUntil=careerDayIndex(c)+56;liveSave(c);return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL CLEARANCE</div><h1>CLEARED TO COMPETE</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-world-reaction"><small>RECOVERY COMPLETE</small><p>Your ${injury.name||'injury'} has healed and all physical restrictions have been removed.</p></div><div class="lpw-ripple"><b>INJURY PROTECTION</b><span>You will not receive another random injury for the next two in-game months.</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)}
  if(injury?.active){
   if(c.day===0||c.day===3||liveIsSupercard(c))return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL RESTRICTION</div><h1>NON-WRESTLING APPEARANCE</h1><div class="lpw-consequence-host">${npcImage('katie-morgan','portrait')}<span><small>BACKSTAGE INTERVIEWER</small><b>Katie Morgan</b></span></div><p>You are still recovering from ${injury.name||'an injury'}, so tonight’s match has been replaced by an interview segment.</p><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('katie-morgan','RECOVERY UPDATE',{popularity:4},'Your honest update earns support from the audience.','Medical restrictions remain active until clearance.')"><b>ADDRESS THE INJURY</b><span>Popularity +4</span></button><button onclick="lpw836ApplyOutcome('katie-morgan','MESSAGE TO YOUR RIVAL',{feud:5},'You warn your rival that the injury has not changed your intentions.','The rivalry stays active while you recover.')"><b>SEND A WARNING</b><span>Feud +5</span></button></div></section>`);
   if(c.day===2)return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">RECOVERY DAY</div><h1>PHYSICAL TRAINING RESTRICTED</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><p>Coach Hank has cancelled physical drills. Choose a non-physical development activity.</p><div class="live-choice-grid"><button onclick="gauntletLiveCompleteChoice(0,[['Film study','Technique +1','technique',1]])"><b>FILM STUDY</b><span>Technique +1</span></button><button onclick="gauntletLiveCompleteChoice(0,[['Media interview','Popularity +6','popularity',6]])"><b>MEDIA INTERVIEW</b><span>Popularity +6</span></button></div></section>`);
  }
  return oldBeginDay();
 };

 /* Current build label. */
 const oldHome=gauntletLiveHome;gauntletLiveHome=function(){const r=oldHome();const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent=`VERSION 8.3.7 BUILD ${BUILD}`;const tag=document.querySelector('.build-tag');if(tag)tag.textContent=`VERSION 8.3.7 BUILD ${BUILD}`;return r};
})();

/* =============================================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 6 — INJURY LOOP HOTFIX
   ============================================================================= */
(function(){
 const BUILD='6';
 const dayIndex=c=>((c.month-1)*28+(c.week-1)*7+c.day);
 const remainingDays=(c,injury)=>Math.max(0,Number(injury?.until||dayIndex(c))-dayIndex(c));

 function renderRecoveryProgress(c,injury){
  const remaining=remainingDays(c,injury);
  const risk=injury.risk||'Reduced';
  render(`<section class="panel live-world-screen lpw-consequence-screen">
   <div class="tv-kicker">MEDICAL PROGRESS</div>
   <h1>RECOVERY CONTINUES</h1>
   <div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div>
   <div class="lpw-world-reaction"><small>${injury.name||'ACTIVE INJURY'}</small><p>Your original diagnosis has already been completed. Medical staff are continuing to monitor your recovery.</p></div>
   <div class="lpw-ripple"><b>EXPECTED CLEARANCE</b><span>${remaining<=1?'Final assessment is expected tomorrow.':`${remaining} days remaining`} · Current risk: ${risk}</span></div>
   <button class="btn live-primary" onclick="lpw837b6CompleteRecoveryDay()">CONTINUE TO NEXT DAY</button>
  </section>`);
 }

 window.lpw837b6CompleteRecoveryDay=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();
  const injury=c.world?.injury;
  if(injury?.active){
   injury.diagnosed=true;
   injury.lastProgressDay=dayIndex(c);
   c.world.injury=injury;
  }
  liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar();
 };

 /* The diagnosis screen is a one-time event. Active injuries can never reopen it. */
 const priorDoctorVisit=gauntletLiveDoctorVisit;
 gauntletLiveDoctorVisit=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();
  const injury=c.world?.injury;
  if(injury?.active&&injury.diagnosed)return renderRecoveryProgress(c,injury);
  return priorDoctorVisit();
 };

 /* Preserve the selected treatment state and mark the injury as diagnosed. */
 gauntletLiveClearInjury=function(type){
  const c=liveLoad();if(!c)return gauntletLiveHome();
  const detail=c.world.injuryDetail||c.world.injury||{name:'Bruised ribs',severity:'Minor',recovery:'3–5 days',cause:'a hard landing during your previous match'};
  const before={momentum:c.momentum,'injury status':'Active'};
  const duration=type==='push'?5:4;
  c.world.injury={...detail,active:true,diagnosed:true,treatment:type,risk:type==='push'?'High':'Reduced',started:dayIndex(c),until:dayIndex(c)+duration};
  c.momentum=liveClamp(c.momentum+(type==='push'?5:-3),0,100);
  liveAwardXp(c,c.active,20,'Medical decision');liveAdvanceDay(c);liveSave(c);
  lpw836Outcome(type==='push'?'COMPETING AGAINST ADVICE':'RECOVERY PLAN ACCEPTED','dr-lena-hart',before,{momentum:c.momentum,'injury status':type==='push'?'Active · High risk':'Recovering'},type==='push'?'You have chosen to remain available despite the injury.':'Rest and treatment reduce the chance of aggravation.',type==='push'?'Physical activity remains restricted and the injury may affect future booking.':'You will not be booked in a match until medical clearance.');
 };

 /* Fully consume every active-injury day so the legacy daily diagnosis branch cannot run. */
 const priorBeginDay=gauntletLiveBeginDay;
 gauntletLiveBeginDay=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();
  const injury=c.world?.injury;
  if(!injury?.active)return priorBeginDay();

  /* Repair saves created before this hotfix. */
  injury.diagnosed=true;
  if(!Number.isFinite(Number(injury.until)))injury.until=dayIndex(c)+(injury.treatment==='push'?5:4);
  c.world.injury=injury;liveSave(c);

  if(dayIndex(c)>=injury.until){
   c.world.lastInjuryCleared=dayIndex(c);
   c.world.injury=null;
   c.world.injuryDetail=null;
   c.world.injuryCooldownUntil=dayIndex(c)+56;
   liveSave(c);
   return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL CLEARANCE</div><h1>CLEARED TO COMPETE</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-world-reaction"><small>RECOVERY COMPLETE</small><p>Your ${injury.name||'injury'} has healed and all physical restrictions have been removed.</p></div><div class="lpw-ripple"><b>INJURY PROTECTION</b><span>You will not receive another random injury for the next two in-game months.</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`);
  }

  if(c.day===0||c.day===3||liveIsSupercard(c))return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL RESTRICTION</div><h1>NON-WRESTLING APPEARANCE</h1><div class="lpw-consequence-host">${npcImage('katie-morgan','portrait')}<span><small>BACKSTAGE INTERVIEWER</small><b>Katie Morgan</b></span></div><p>You are still recovering from ${injury.name||'an injury'}, so tonight’s match has been replaced by an interview segment.</p><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('katie-morgan','RECOVERY UPDATE',{popularity:4},'Your honest update earns support from the audience.','Medical restrictions remain active until clearance.')"><b>ADDRESS THE INJURY</b><span>Popularity +4</span></button><button onclick="lpw836ApplyOutcome('katie-morgan','MESSAGE TO YOUR RIVAL',{feud:5},'You warn your rival that the injury has not changed your intentions.','The rivalry stays active while you recover.')"><b>SEND A WARNING</b><span>Feud +5</span></button></div></section>`);

  if(c.day===2)return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">RECOVERY DAY</div><h1>PHYSICAL TRAINING RESTRICTED</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><p>Coach Hank has cancelled physical drills. Choose a non-physical development activity.</p><div class="live-choice-grid"><button onclick="gauntletLiveCompleteChoice(0,[['Film study','Technique +1','technique',1]])"><b>FILM STUDY</b><span>Technique +1</span></button><button onclick="gauntletLiveCompleteChoice(0,[['Media interview','Popularity +6','popularity',6]])"><b>MEDIA INTERVIEW</b><span>Popularity +6</span></button></div></section>`);

  return renderRecoveryProgress(c,injury);
 };

 /* Keep visible version labels accurate. */
 const priorHome=gauntletLiveHome;
 gauntletLiveHome=function(){const r=priorHome();const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent=`VERSION 8.3.7 BUILD ${BUILD}`;const tag=document.querySelector('.build-tag');if(tag)tag.textContent=`VERSION 8.3.7 BUILD ${BUILD}`;return r};
})();


/* =============================================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 7 — VERIFIED INJURY + BALANCE HOTFIX
   ============================================================================= */
(function(){
 const BUILD='7';
 const dayIndex=c=>((Number(c.month||1)-1)*28+(Number(c.week||1)-1)*7+Number(c.day||0));
 const injuryDuration=type=>type==='push'?5:4;
 function normalizeInjury(c){
  c.world=c.world||{};
  let i=c.world.injury;
  if(!i)return null;
  if(typeof i!=='object')i={severity:'Minor'};
  const detail=c.world.injuryDetail||{};
  i={name:i.name||detail.name||'Bruised ribs',severity:i.severity||detail.severity||'Minor',recovery:i.recovery||detail.recovery||'3–5 days',cause:i.cause||detail.cause||'a hard landing during your previous match',...i};
  /* Existing Build 5/6 saves with treatment data have already been diagnosed. */
  if(i.treatment||i.until||i.risk)i.diagnosed=true;
  if(i.diagnosed){
   i.active=true;
   i.treatment=i.treatment||'rest';
   i.risk=i.risk||(i.treatment==='push'?'High':'Reduced');
   if(!Number.isFinite(Number(i.started)))i.started=dayIndex(c)-1;
   if(!Number.isFinite(Number(i.until)))i.until=dayIndex(c)+injuryDuration(i.treatment);
  }
  c.world.injury=i;
  return i;
 }
 function clearInjury(c,i){
  c.world.lastInjuryCleared=dayIndex(c);
  c.world.lastClearedInjury=i.name||'injury';
  c.world.injury=null;c.world.injuryDetail=null;
  c.world.injuryCooldownUntil=dayIndex(c)+56;
  liveSave(c);
 }
 function clearance(c,i){
  clearInjury(c,i);
  render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL CLEARANCE</div><h1>CLEARED TO COMPETE</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-world-reaction"><small>RECOVERY COMPLETE</small><p>Your ${i.name||'injury'} has healed and all physical restrictions have been removed.</p></div><div class="lpw-ripple"><b>INJURY PROTECTION</b><span>No new random injury can occur for the next two in-game months.</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`);
 }
 function progress(c,i){
  const remain=Math.max(1,Number(i.until)-dayIndex(c));
  render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL PROGRESS</div><h1>RECOVERY CONTINUES</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-world-reaction"><small>${i.name}</small><p>Your diagnosis is complete. Medical staff are monitoring the recovery plan you selected.</p></div><div class="lpw-ripple"><b>EXPECTED CLEARANCE</b><span>${remain===1?'Final assessment tomorrow':`${remain} days remaining`} · Risk: ${i.risk}</span></div><button class="btn live-primary" onclick="lpw837b7AdvanceRecovery()">CONTINUE TO NEXT DAY</button></section>`);
 }
 window.lpw837b7AdvanceRecovery=function(){const c=liveLoad();if(!c)return gauntletLiveHome();const i=normalizeInjury(c);if(i){i.lastProgressDay=dayIndex(c);c.world.injury=i}liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()};
 const doctorOriginal=gauntletLiveDoctorVisit;
 gauntletLiveDoctorVisit=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();const i=normalizeInjury(c);liveSave(c);
  if(i?.diagnosed){if(dayIndex(c)>=Number(i.until))return clearance(c,i);return progress(c,i)}
  return doctorOriginal();
 };
 gauntletLiveClearInjury=function(type){
  const c=liveLoad();if(!c)return gauntletLiveHome();const pending=normalizeInjury(c)||c.world.injuryDetail||{};
  const before={momentum:c.momentum,'injury status':'Diagnosed'};
  c.world.injury={name:pending.name||'Bruised ribs',severity:pending.severity||'Minor',recovery:pending.recovery||'3–5 days',cause:pending.cause||'a hard landing during your previous match',active:true,diagnosed:true,treatment:type,risk:type==='push'?'High':'Reduced',started:dayIndex(c),until:dayIndex(c)+injuryDuration(type)};
  c.world.injuryDetail={name:c.world.injury.name,severity:c.world.injury.severity,recovery:c.world.injury.recovery,cause:c.world.injury.cause};
  c.momentum=liveClamp(c.momentum+(type==='push'?5:-3),0,100);
  liveAwardXp(c,c.active,20,'Medical decision');liveAdvanceDay(c);liveSave(c);
  lpw836Outcome(type==='push'?'COMPETING AGAINST ADVICE':'RECOVERY PLAN ACCEPTED','dr-lena-hart',before,{momentum:c.momentum,'injury status':type==='push'?'Active · High risk':'Recovering'},type==='push'?'You remain available, but medical restrictions stay active.':'Rest and treatment reduce the chance of aggravation.',type==='push'?'The original diagnosis will not repeat; future days show progress until clearance.':'The original diagnosis will not repeat; future days show progress until clearance.');
 };
 const beginOriginal=gauntletLiveBeginDay;
 gauntletLiveBeginDay=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();const i=normalizeInjury(c);if(!i)return beginOriginal();liveSave(c);
  /* Pending injury: initial diagnosis exactly once. */
  if(!i.diagnosed)return gauntletLiveDoctorVisit();
  if(dayIndex(c)>=Number(i.until))return clearance(c,i);
  if(c.day===0||c.day===3||liveIsSupercard(c))return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL RESTRICTION</div><h1>NON-WRESTLING APPEARANCE</h1><div class="lpw-consequence-host">${npcImage('katie-morgan','portrait')}<span><small>BACKSTAGE INTERVIEWER</small><b>Katie Morgan</b></span></div><p>You are still recovering from ${i.name}, so tonight’s match has been replaced by an interview segment.</p><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('katie-morgan','RECOVERY UPDATE',{popularity:4},'Your honest update earns support from the audience.','Medical restrictions remain active until clearance.')"><b>ADDRESS THE INJURY</b><span>Popularity +4</span></button><button onclick="lpw836ApplyOutcome('katie-morgan','MESSAGE TO YOUR RIVAL',{feud:5},'You warn your rival that the injury has not changed your intentions.','The rivalry stays active while you recover.')"><b>SEND A WARNING</b><span>Feud +5</span></button></div></section>`);
  if(c.day===2)return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">RECOVERY DAY</div><h1>PHYSICAL TRAINING RESTRICTED</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><p>Coach Hank has cancelled physical drills. Choose a non-physical development activity.</p><div class="live-choice-grid"><button onclick="gauntletLiveCompleteChoice(0,[['Film study','Technique +1','technique',1]])"><b>FILM STUDY</b><span>Technique +1</span></button><button onclick="gauntletLiveCompleteChoice(0,[['Media interview','Popularity +6','popularity',6]])"><b>MEDIA INTERVIEW</b><span>Popularity +6</span></button></div></section>`);
  return progress(c,i);
 };
 /* Injury generation respects the post-clearance cooldown. */
 const finishOriginal=gauntletLiveFinishMatch65;
 gauntletLiveFinishMatch65=function(win,oppId){
  const c=liveLoad();if(c?.world?.injuryCooldownUntil&&dayIndex(c)<Number(c.world.injuryCooldownUntil)&&c.world.injury&&!c.world.injury.diagnosed){c.world.injury=null;c.world.injuryDetail=null;liveSave(c)}
  return finishOriginal(win,oppId);
 };
 /* Center Level Up character consistently. */
 const levelOriginal=gauntletLiveLevelCelebration;
 gauntletLiveLevelCelebration=function(){const r=levelOriginal.apply(this,arguments);setTimeout(()=>{const img=document.querySelector('.lpw-level-up-art img,.lpw837-level-art img,.live-level-celebration img');if(img){img.style.display='block';img.style.marginLeft='auto';img.style.marginRight='auto';img.style.objectPosition='center center'}},0);return r};
 const homeOriginal=gauntletLiveHome;gauntletLiveHome=function(){const r=homeOriginal();const cycle=document.querySelector('.live-cycle b');if(cycle)cycle.textContent=`VERSION 8.3.7 BUILD ${BUILD}`;const tag=document.querySelector('.build-tag');if(tag)tag.textContent=`VERSION 8.3.7 BUILD ${BUILD}`;return r};
})();

/* =============================================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 8 — ONE-YEAR QA CONSOLIDATION
   ============================================================================= */
(function(){
 const BUILD='8';
 const DAY=c=>((Number(c.month||1)-1)*28+(Number(c.week||1)-1)*7+Number(c.day||0));
 const PREFIXES=new Set([
  'Rebel','Royal','Heroic','Primal','Olympian','Street','Rockstar','Playboy','Veteran','Legendary','Heartbreaker','Kingmaker','Iceman','Sentinel','Hollywood','Lunatic','Workhorse','Warlord','Showman','Strategist','Enforcer','Powerhouse','Aerialist','Purist','Assassin','Hardcore','Megastar','Con','Brawler','Supernatural','Undead','Dark','Masked','Canadian','Streetwise','Technical','Dominant','Fearless','Savage','Extreme','Iconic','Ruthless','Relentless','Precision','High-Flying','High','Cold-Blooded','Cold','Unbreakable','Unstoppable','Mysterious','Chaotic'
 ]);
 function cleanDecision(name){
  let words=String(name||'').replace(/[“”"]/g,'').trim().split(/\s+/);
  while(words.length>1&&PREFIXES.has(words[0]))words.shift();
  if(words[0]==='Con'&&words[1]==='Artist')words.splice(0,2);
  return words.join(' ').replace(/\s{2,}/g,' ').trim();
 }
 const priorClean=lpwCleanDecisionName;
 lpwCleanDecisionName=function(name){return cleanDecision(priorClean(name||''))};

 /* Clean choices before they are displayed or stored, and avoid repeats in one match. */
 const priorGetDecision=getDecision;
 getDecision=function(){
  let d=priorGetDecision();
  const used=new Set((M?.decisionHistory||[]).map(x=>cleanDecision(x.choice).toLowerCase()));
  d.options=(d.options||[]).map(x=>({...x,name:cleanDecision(x.name)}));
  const unique=[];
  for(const x of d.options){if(!used.has(x.name.toLowerCase())&&!unique.some(y=>y.name.toLowerCase()===x.name.toLowerCase()))unique.push(x)}
  if(unique.length<3){
   const fallback=['Change the Rhythm','Test Their Nerve','Create an Opening','Break Their Momentum','Risk the Counter','Steal the Finish','Refuse to Fold','Set the Tempo','End on the Hard Camera','Take the Final Bow'];
   for(const name of fallback){if(unique.length>=3)break;if(!used.has(name.toLowerCase())&&!unique.some(y=>y.name===name))unique.push({action:'control',name,desc:'Shift the match with a calculated choice.',exclusive:false,attr:75,token:`choice-${unique.length}`})}
  }
  d.options=unique.slice(0,3).map((x,i)=>({...x,token:`choice-${i}`}));
  return d;
 };
 const priorStoryChoice=storyChoice;
 storyChoice=function(token){
  if(M?.currentDecision?.options)M.currentDecision.options.forEach(x=>x.name=cleanDecision(x.name));
  const before=(M?.decisionHistory||[]).length;
  const r=priorStoryChoice(token);
  if(M?.decisionHistory?.length>before){const x=M.decisionHistory[M.decisionHistory.length-1];x.choice=cleanDecision(x.choice);if(M.decisionOutcome)M.decisionOutcome.choice=x.choice}
  return r;
 };

 /* Reports must agree with the final rating and score. */
 function crowdForRating(r,gap){
  if(r>=4.65)return ['THUNDEROUS OVATION',Math.min(100,Math.round(88+r*2.4))];
  if(r>=4.05)return ['STANDING OVATION',Math.round(77+r*3.2)];
  if(r>=3.25)return ['LOUD APPROVAL',Math.round(61+r*4.3)];
  if(r>=2.35)return ['RESPECTFUL APPLAUSE',Math.round(43+r*5.1)];
  return [gap<12?'TENSE SILENCE':'QUIET REACTION',Math.round(24+r*6.2)];
 }
 function resultHeadline(gap){return gap<=12?'A NARROW VICTORY':gap<=35?'A HARD-FOUGHT VICTORY':gap<=75?'A CONVINCING VICTORY':'A DOMINANT VICTORY'}
 function dynamicStory(win,gap){
  const player=S.team[0]?.name||'The player',opp=S.opp[0]?.name||'the opponent',winner=M.winner?.name||'',loser=M.loser?.name||'';
  const aiGood=(M.aiDecisionHistory||[]).filter(x=>/success/.test(x.outcome)).length;
  const pFails=(M.decisionHistory||[]).filter(x=>/FAILURE/.test(x.outcome)).length;
  if(gap<=12)return `${winner} survived a match that remained undecided until the final exchange. ${loser} was one opening away from changing the result.`;
  if(!win&&aiGood>=2)return `${opp} seized control through a run of successful responses. ${player} fought back, but could not erase the advantage before the finish.`;
  if(win&&pFails>=2)return `${player} recovered from several costly decisions and found the decisive opening late. ${opp} controlled meaningful stretches before the finish.`;
  if(gap>75)return `${winner} steadily widened the gap and controlled the decisive phases. ${loser} never found a sustained answer before ${M.winner?.finisher||'the finish'}.`;
  return `${winner} gained the stronger share of the key exchanges and converted the final opening. The result remained competitive until the closing phase.`;
 }
 const priorSummary=showSummary;
 showSummary=function(win){
  if(M?.decisionHistory)M.decisionHistory.forEach(x=>x.choice=cleanDecision(x.choice));
  const r=priorSummary(win);
  if(!S?.liveMode||!M)return r;
  setTimeout(()=>{
   const rating=Number(M.completedRating||3),gap=Math.abs(Number(M.finalPlayer||0)-Number(M.finalOpp||0));
   const [crowd,excitement]=crowdForRating(rating,gap);
   const cards=[...document.querySelectorAll('.result-accolades article')];
   const crowdCard=cards.find(x=>/CROWD REACTION/.test(x.textContent));
   if(crowdCard){const b=crowdCard.querySelector('b'),s=crowdCard.querySelector('strong');if(b)b.textContent=crowd;if(s)s.textContent=`EXCITEMENT ${excitement}%`}
   const header=document.querySelector('.result-broadcast-header h1');if(header)header.textContent=resultHeadline(gap);
   const story=document.querySelector('.match-story p');if(story)story.textContent=dynamicStory(win,gap);
   document.querySelectorAll('.psychology-breakdown article b').forEach(b=>b.textContent=cleanDecision(b.textContent));
   const bottom=document.querySelector('.summary-panel .actions:last-child');
   if(!bottom&&document.querySelector('.summary-panel'))document.querySelector('.summary-panel').insertAdjacentHTML('beforeend',`<div class="actions bottom-actions"><button class="btn" onclick="${win?'postMatchFlow()':'handleLoss()'}">${win?'CONTINUE BROADCAST':'CONTINUE'}</button></div>`);
  },0);
  return r;
 };

 /* Injury lifecycle: exactly one diagnosis, daily progress, one clearance. */
 function normalize(c){
  c.world=c.world||{};let i=c.world.injury;if(!i)return null;
  if(typeof i!=='object')i={name:'Bruised ribs',severity:'Minor'};
  const detail=c.world.injuryDetail||{};
  i={name:i.name||detail.name||'Bruised ribs',severity:i.severity||detail.severity||'Minor',recovery:i.recovery||detail.recovery||'3–5 days',cause:i.cause||detail.cause||'a hard landing during your previous match',...i};
  if(i.treatment||i.until||i.risk)i.diagnosed=true;
  if(i.diagnosed){i.active=true;i.treatment=i.treatment||'rest';i.risk=i.risk||(i.treatment==='push'?'High':'Reduced');i.started=Number.isFinite(Number(i.started))?Number(i.started):DAY(c)-1;i.until=Number.isFinite(Number(i.until))?Number(i.until):DAY(c)+(i.treatment==='push'?5:4)}
  c.world.injury=i;return i;
 }
 function clear(c,i){c.world.lastInjuryCleared=DAY(c);c.world.lastClearedInjury=i.name;c.world.injury=null;c.world.injuryDetail=null;c.world.injuryCooldownUntil=DAY(c)+56;liveSave(c)}
 function clearance(c,i){clear(c,i);render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL CLEARANCE</div><h1>CLEARED TO COMPETE</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-world-reaction"><small>RECOVERY COMPLETE</small><p>Your ${i.name} has healed and all physical restrictions have been removed.</p></div><div class="lpw-ripple"><b>INJURY PROTECTION</b><span>No new random injury can occur for the next two in-game months.</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)}
 function progress(c,i){const total=Math.max(1,Number(i.until)-Number(i.started)),elapsed=Math.max(0,DAY(c)-Number(i.started)),remain=Math.max(1,Number(i.until)-DAY(c)),pct=Math.min(100,Math.round(elapsed/total*100));render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL PROGRESS</div><h1>RECOVERY CONTINUES</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-world-reaction"><small>${i.name}</small><p>Your original diagnosis is complete. Medical staff are monitoring the recovery plan you selected.</p></div><div class="live-xp-track"><i style="width:${pct}%"></i></div><div class="lpw-ripple"><b>EXPECTED CLEARANCE</b><span>${remain===1?'Final assessment tomorrow':`${remain} days remaining`} · Risk: ${i.risk}</span></div><button class="btn live-primary" onclick="lpw837b8AdvanceRecovery()">CONTINUE TO NEXT DAY</button></section>`)}
 window.lpw837b8AdvanceRecovery=function(){const c=liveLoad();if(!c)return gauntletLiveHome();const i=normalize(c);if(i)i.lastProgressDay=DAY(c);liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()};
 const doctorBase=gauntletLiveDoctorVisit;
 gauntletLiveDoctorVisit=function(){const c=liveLoad();if(!c)return gauntletLiveHome();const i=normalize(c);liveSave(c);if(i?.diagnosed)return DAY(c)>=Number(i.until)?clearance(c,i):progress(c,i);return doctorBase()};
 gauntletLiveClearInjury=function(type){const c=liveLoad();if(!c)return gauntletLiveHome();const pending=normalize(c)||c.world.injuryDetail||{};const before={momentum:c.momentum,'injury status':'Diagnosed'};c.world.injury={name:pending.name||'Bruised ribs',severity:pending.severity||'Minor',recovery:pending.recovery||'3–5 days',cause:pending.cause||'a hard landing during your previous match',active:true,diagnosed:true,treatment:type,risk:type==='push'?'High':'Reduced',started:DAY(c),until:DAY(c)+(type==='push'?5:4)};c.world.injuryDetail={name:c.world.injury.name,severity:c.world.injury.severity,recovery:c.world.injury.recovery,cause:c.world.injury.cause};c.momentum=liveClamp(c.momentum+(type==='push'?5:-3),0,100);liveAwardXp(c,c.active,20,'Medical decision');liveAdvanceDay(c);liveSave(c);lpw836Outcome(type==='push'?'COMPETING AGAINST ADVICE':'RECOVERY PLAN ACCEPTED','dr-lena-hart',before,{momentum:c.momentum,'injury status':type==='push'?'Active · High risk':'Recovering'},type==='push'?'You remain available, but medical restrictions stay active.':'Rest and treatment reduce the chance of aggravation.','The original diagnosis will not repeat. Recovery progress continues until medical clearance.')};
 const beginBase=gauntletLiveBeginDay;
 gauntletLiveBeginDay=function(){const c=liveLoad();if(!c)return gauntletLiveHome();const i=normalize(c);if(!i)return beginBase();liveSave(c);if(!i.diagnosed)return gauntletLiveDoctorVisit();if(DAY(c)>=Number(i.until))return clearance(c,i);if(c.day===0||c.day===3||liveIsSupercard(c))return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL RESTRICTION</div><h1>NON-WRESTLING APPEARANCE</h1><div class="lpw-consequence-host">${npcImage('katie-morgan','portrait')}<span><small>BACKSTAGE INTERVIEWER</small><b>Katie Morgan</b></span></div><p>You are still recovering from ${i.name}, so tonight’s match has been replaced by an interview segment.</p><div class="live-choice-grid"><button onclick="lpw836ApplyOutcome('katie-morgan','RECOVERY UPDATE',{popularity:4},'Your honest update earns support from the audience.','Medical restrictions remain active until clearance.')"><b>ADDRESS THE INJURY</b><span>Popularity +4</span></button><button onclick="lpw836ApplyOutcome('katie-morgan','MESSAGE TO YOUR RIVAL',{feud:5},'You warn your rival that the injury has not changed your intentions.','The rivalry stays active while you recover.')"><b>SEND A WARNING</b><span>Feud +5</span></button></div></section>`);if(c.day===2)return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">RECOVERY DAY</div><h1>PHYSICAL TRAINING RESTRICTED</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><p>Coach Hank has cancelled physical drills. Choose a non-physical development activity.</p><div class="live-choice-grid"><button onclick="gauntletLiveCompleteChoice(0,[['Film study','Technique +1','technique',1]])"><b>FILM STUDY</b><span>Technique +1</span></button><button onclick="gauntletLiveCompleteChoice(0,[['Media interview','Popularity +6','popularity',6]])"><b>MEDIA INTERVIEW</b><span>Popularity +6</span></button></div></section>`);return progress(c,i)};

 /* Save migration and cooldown safety. */
 const loadBase=liveLoad;liveLoad=function(){const c=loadBase();if(!c)return c;const i=normalize(c);if(i?.diagnosed&&DAY(c)>=Number(i.until)+1){clear(c,i)}if(c.world?.injuryCooldownUntil&&DAY(c)<Number(c.world.injuryCooldownUntil)&&c.world.injury&&!c.world.injury.diagnosed){c.world.injury=null;c.world.injuryDetail=null}liveSave(c);return c};

 /* Exact version labels and centered Level Up art. */
 const levelBase=gauntletLiveLevelCelebration;gauntletLiveLevelCelebration=function(){const r=levelBase.apply(this,arguments);setTimeout(()=>{const img=document.querySelector('.live-level-celebration img');if(img){img.style.display='block';img.style.margin='0 auto';img.style.left='auto';img.style.right='auto';img.style.transform='none';img.style.objectPosition='center center'}},0);return r};
 const homeBase=gauntletLiveHome;gauntletLiveHome=function(){const r=homeBase();document.querySelectorAll('.build-tag,.live-cycle b').forEach(x=>x.textContent=`VERSION 8.3.7 BUILD ${BUILD}`);return r};
})();

/* Build 8 long-career balance guard: prevent momentum/form snowballs without scripting outcomes. */
(function(){
 const priorResolve=resolveFinish;
 resolveFinish=function(){
  if(S?.liveMode&&M&&!M.ended){
   const c=liveLoad(),recent=(c?.history||[]).slice(0,5),wins=recent.filter(x=>x.win).length,losses=recent.length-wins;
   if(recent.length>=3&&losses>=3){M.performancePlayer=(M.performancePlayer||0)+8;M.decisionPlayer=(M.decisionPlayer||0)+5}
   if(recent.length>=3&&wins>=4){M.performanceOpp=(M.performanceOpp||0)+6;M.decisionOpp=(M.decisionOpp||0)+4}
  }
  return priorResolve();
 };
 const priorComplete=liveCompleteBroadcast;
 liveCompleteBroadcast=function(win){const r=priorComplete(win);const c=liveLoad();if(c){c.momentum=liveClamp(Math.round(50+(c.momentum-50)*.82),20,85);liveSave(c)}return r};
})();

/* ============================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 9 — ACTUAL ENGINE YEAR QA
   ============================================================ */
(function(){
 const BUILD='9';
 const dayIndex=c=>((Number(c?.month||1)-1)*28+(Number(c?.week||1)-1)*7+Number(c?.day||0));
 function ensureMedical(c){
  c.world=c.world||{};
  let i=c.world.injury;
  if(!i)return null;
  if(typeof i!=='object')i={severity:'Minor'};
  const d=c.world.injuryDetail||{};
  i={name:i.name||d.name||'Bruised ribs',severity:i.severity||d.severity||'Minor',recovery:i.recovery||d.recovery||'3–5 days',cause:i.cause||d.cause||'a hard landing during your previous match',...i};
  i.id=i.id||`inj-${dayIndex(c)}-${Math.random().toString(36).slice(2,8)}`;
  if(i.treatment||i.until||i.risk)i.diagnosed=true;
  if(i.diagnosed){
   i.active=true;i.diagnosisShown=true;i.treatment=i.treatment||'rest';
   i.risk=i.risk||(i.treatment==='push'?'High':'Reduced');
   i.started=Number.isFinite(Number(i.started))?Number(i.started):dayIndex(c)-1;
   i.until=Number.isFinite(Number(i.until))?Number(i.until):dayIndex(c)+(i.treatment==='push'?5:4);
  }
  c.world.injury=i;c.world.injuryDetail={name:i.name,severity:i.severity,recovery:i.recovery,cause:i.cause,id:i.id};return i;
 }
 function finishClearance(c,i){
  c.world.lastInjuryCleared=dayIndex(c);c.world.lastClearedInjury=i.name;c.world.lastClearedInjuryId=i.id;
  c.world.injury=null;c.world.injuryDetail=null;c.world.injuryCooldownUntil=dayIndex(c)+56;liveSave(c);
 }
 const load0=liveLoad;
 liveLoad=function(){
  const c=load0();if(!c)return c;const i=ensureMedical(c);
  if(i?.diagnosed&&dayIndex(c)>Number(i.until)&&c.world.lastClearedInjuryId!==i.id)finishClearance(c,i);
  if(c.world?.injuryCooldownUntil&&dayIndex(c)<Number(c.world.injuryCooldownUntil)&&c.world.injury&&!c.world.injury.diagnosed){c.world.injury=null;c.world.injuryDetail=null}
  liveSave(c);return c;
 };
 const doctor0=gauntletLiveDoctorVisit;
 gauntletLiveDoctorVisit=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();const i=ensureMedical(c);liveSave(c);
  if(!i)return gauntletLiveCalendar();
  if(!i.diagnosed&&!i.diagnosisShown){i.diagnosisShown=true;c.world.injury=i;liveSave(c);return doctor0()}
  if(i.diagnosed&&dayIndex(c)>=Number(i.until)){
   finishClearance(c,i);
   return render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL CLEARANCE</div><h1>CLEARED TO COMPETE</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-world-reaction"><small>RECOVERY COMPLETE</small><p>Your ${i.name} has healed and all physical restrictions have been removed.</p></div><div class="lpw-ripple"><b>INJURY PROTECTION</b><span>No new random injury can occur for the next two in-game months.</span></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)
  }
  return typeof lpw837b8AdvanceRecovery==='function'?render(`<section class="panel live-world-screen lpw-consequence-screen"><div class="tv-kicker">MEDICAL PROGRESS</div><h1>RECOVERY CONTINUES</h1><div class="lpw-consequence-host">${npcImage('dr-lena-hart','portrait')}<span><small>CHIEF MEDICAL OFFICER</small><b>Dr. Lena Hart</b></span></div><div class="lpw-ripple"><b>EXPECTED CLEARANCE</b><span>${Math.max(1,Number(i.until)-dayIndex(c))} day${Math.max(1,Number(i.until)-dayIndex(c))===1?'':'s'} remaining · Risk: ${i.risk}</span></div><button class="btn live-primary" onclick="lpw837b8AdvanceRecovery()">CONTINUE TO NEXT DAY</button></section>`):gauntletLiveCalendar()
 };
 const clear0=gauntletLiveClearInjury;
 gauntletLiveClearInjury=function(type){
  const c=liveLoad();if(!c)return gauntletLiveHome();let i=ensureMedical(c)||{};
  i={...i,id:i.id||`inj-${dayIndex(c)}-${Math.random().toString(36).slice(2,8)}`,active:true,diagnosed:true,diagnosisShown:true,treatment:type,risk:type==='push'?'High':'Reduced',started:dayIndex(c),until:dayIndex(c)+(type==='push'?5:4)};
  c.world.injury=i;c.world.injuryDetail={name:i.name,severity:i.severity,recovery:i.recovery,cause:i.cause,id:i.id};liveSave(c);
  return clear0(type)
 };

 /* A medical restriction may postpone a SuperCard, but it may never erase one. */
 const begin0=gauntletLiveBeginDay;
 gauntletLiveBeginDay=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();const i=ensureMedical(c);
  if(i&&liveIsSupercard(c)){
   c.world.deferredSupercard=c.world.deferredSupercard||{name:liveCurrentSupercard(c),opponent:liveFeudOpponent(c)?.id||liveChooseStoryOpponent(c).id,originalMonth:c.month,originalWeek:c.week};
   liveSave(c);
  }
  if(!i&&c.world?.deferredSupercard){return gauntletLiveDeferredSupercardCard()}
  return begin0()
 };
 window.gauntletLiveDeferredSupercardCard=function(){
  const c=liveLoad();if(!c)return gauntletLiveHome();const d=c.world.deferredSupercard,player=liveFounder(c.active),opp=liveFounder(d.opponent)||liveChooseStoryOpponent(c);
  c.pending={opponent:opp.id,isSupercard:true,deferredSupercard:true,supercardName:d.name};liveSave(c);
  render(`<section class="panel live-match-card"><div class="tv-kicker">POSTPONED SUPERCARD · ${String(d.name||'SUPERCARD').toUpperCase()}</div><h1>MEDICALLY CLEARED FEUD FINALE</h1><div class="live-versus"><div>${imageWithFallback(player,'portrait','art-portrait','matchPortrait')}<b>${player.name}</b></div><strong>VS</strong><div>${imageWithFallback(opp,'portrait','art-portrait','matchPortrait')}<b>${opp.name}</b></div></div><p>The match postponed by medical restriction will now take place before the career moves on.</p><button class="btn live-primary" onclick="gauntletLiveLaunchBroadcast()">BEGIN MATCH BROADCAST</button></section>`)
 };
 const card0=gauntletLiveMatchCard;
 gauntletLiveMatchCard=function(){const c=liveLoad();if(c?.world?.deferredSupercard&&!c.world.injury)return gauntletLiveDeferredSupercardCard();return card0()};

 /* Persist real SuperCard records and avoid immediate rivalry recycling. */
 const complete0=liveCompleteBroadcast;
 liveCompleteBroadcast=function(win){
  const before=liveLoad(),pending=before?.pending?{...before.pending}:null,active=before?.active;
  const result=complete0(win);const c=liveLoad();if(!c||!pending)return result;
  if(pending.isSupercard){
   const p=liveProgress(active,c);p.supercardWins=Number(p.supercardWins)||0;p.supercardLosses=Number(p.supercardLosses)||0;
   if(win)p.supercardWins++;else p.supercardLosses++;
   c.world.supercardHistory=Array.isArray(c.world.supercardHistory)?c.world.supercardHistory:[];
   c.world.supercardHistory.unshift({month:pending.deferredSupercard?(c.world.deferredSupercard?.originalMonth||c.month):c.month,name:pending.supercardName||c.world.deferredSupercard?.name||liveCurrentSupercard(c),opponent:pending.opponent,win});
   c.world.supercardHistory=c.world.supercardHistory.slice(0,24);
   if(pending.deferredSupercard)c.world.deferredSupercard=null;
   liveSave(c)
  }
  return result
 };
 const pick0=livePickDifferent;
 livePickDifferent=function(c,exclude=[]){
  const recent=(c?.world?.supercardHistory||[]).slice(0,6).map(x=>x.opponent);
  const expanded=[...(Array.isArray(exclude)?exclude:[exclude]),...recent];
  return pick0(c,expanded)
 };

 /* Random injuries are uncommon and the two-month cooldown is absolute. */
 const completeInjuryGuard0=liveCompleteBroadcast;
 liveCompleteBroadcast=function(win){
  const before=liveLoad(),had=!!before?.world?.injury,cooldown=Number(before?.world?.injuryCooldownUntil||0),today=dayIndex(before||{});
  const result=completeInjuryGuard0(win);const c=liveLoad();if(!c)return result;
  if(!had&&c.world?.injury){
   if(today<cooldown||Math.random()>.035){c.world.injury=null;c.world.injuryDetail=null;liveSave(c)}
  }
  return result
 };

 /* Version and cache-visible identity. */
 const home0=gauntletLiveHome;gauntletLiveHome=function(){const r=home0();document.querySelectorAll('.build-tag,.live-cycle b').forEach(x=>x.textContent=`VERSION 8.3.7 BUILD ${BUILD}`);return r};
})();

/* ============================================================
   LEGACY PRO WRESTLING 8.3.7 BUILD 10 — BROADCAST AUTHENTICITY QA
   ============================================================ */
(function(){
 const BUILD='10';
 const NPC_IDS=['mike-sullivan','johnny-cannon','katie-morgan','veronica-vale','dr-lena-hart','coach-hank-dawson','leon-ward','raymond-briggs','ava-cross','derek-pierce','ethan-brooks','madison-price','noah-grant','marcus-steele','olivia-chase','tommy-sparks'];
 const PRESENTER_BY_SEGMENT={
  'commentary-confrontation':'mike-sullivan',interview:'katie-morgan','contract-signing':'veronica-vale',
  'medical-angle':'dr-lena-hart','backstage-attack':'leon-ward',promo:'katie-morgan',
  'locker-room':'leon-ward','video-message':'mike-sullivan'
 };
 function ensure10(c){c.world=c.world||{};c.world.npcUsage=c.world.npcUsage||{};c.world.eventHistory=Array.isArray(c.world.eventHistory)?c.world.eventHistory:[];return c}
 function rememberPresenter(c,id,source='event'){
  if(!c||!id)return;ensure10(c);c.world.activePresenter=id;c.world.npcUsage[id]=(Number(c.world.npcUsage[id])||0)+1;
  c.world.eventHistory.unshift({month:c.month,week:c.week,day:c.day,presenter:id,source});c.world.eventHistory=c.world.eventHistory.slice(0,160);liveSave(c)
 }
 function cleanBroadcastText(text=''){
  return String(text)
   .replace(/\bCareer appearance\b/gi,'LPW appearance')
   .replace(/\bCareer career\b/gi,'career')
   .replace(/The choice has been saved and can influence the rivalry and future coverage\.?/gi,'The fallout from tonight will follow this rivalry into the weeks ahead.')
   .replace(/This result has been saved and can influence future broadcasts and events\.?/gi,'What happened here may shape future opportunities and confrontations.')
   .replace(/Popularity changed because of your decision\.?/gi,'The audience responded immediately to what they heard.')
   .replace(/Momentum changed because of your decision\.?/gi,'The response added fresh energy heading into the next appearance.')
   .replace(/Feud intensity changed because of your decision\.?/gi,'The exchange pushed the rivalry closer to another confrontation.')
   .replace(/The technical repetitions produced a measurable improvement\.?/gi,'The final repetitions looked sharper, cleaner and more confident.')
   .replace(/The improved attribute will influence future match performance\.?/gi,'The work should be noticeable the next time the bell rings.')
 }
 function currentRank(c){try{const rows=lpw837Rankings(c);const i=rows.findIndex(x=>x.id===c.active);return i<0?99:i+1}catch(_){return 99}}
 function championIds(c){return new Set(Object.values(c.championships||{}).flat().filter(Boolean))}
 function playerCanFeudChampion(c,id){return currentRank(c)===1&&id===c.championships?.world}
 function safeRival(c,exclude=[]){
  const blocked=championIds(c),list=[...(Array.isArray(exclude)?exclude:[exclude]),c.active];
  WRESTLERS.forEach(w=>{if(blocked.has(w.id)&&!playerCanFeudChampion(c,w.id))list.push(w.id)});
  const pool=liveOtherPool(c,list);return one(pool)||liveOtherPool(c,[c.active])[0]
 }

 /* Capture the actual on-screen presenter before any choice is made. */
 const render0=render;
 render=function(html){
  const text=String(html||'');
  if(!/lpw-consequence-screen/.test(text)&&/(live-choice-grid|story-centre|lpw-npc-standard)/.test(text)){
   const found=NPC_IDS.find(id=>{const n=npc(id);return n&&(text.includes(id)||text.includes(n.name))});
   if(found){const c=liveLoad();if(c)rememberPresenter(c,found,'screen')}
  }
  return render0(cleanBroadcastText(text));
 };

 /* Champion protection: ordinary rival selection can never choose a champion before #1 contender status. */
 const pick0=livePickDifferent;
 livePickDifferent=function(c,exclude=[]){const r=safeRival(c,exclude);return r||pick0(c,exclude)};
 const start0=liveStartFeud;
 liveStartFeud=function(c,opponentId,reason){
  if(championIds(c).has(opponentId)&&!playerCanFeudChampion(c,opponentId)){const replacement=safeRival(c,[opponentId]);opponentId=replacement?.id||opponentId;reason='A rising contender stepped forward to begin a new rivalry.'}
  start0(c,opponentId,reason);ensure10(c);c.world.feudHistory=Array.isArray(c.world.feudHistory)?c.world.feudHistory:[];
  c.world.feudHistory.unshift({month:c.month,opponent:opponentId,championship:playerCanFeudChampion(c,opponentId)});c.world.feudHistory=c.world.feudHistory.slice(0,24)
 };

 /* Presenter continuity and in-universe outcome language. */
 const outcome0=lpw836Outcome;
 lpw836Outcome=function(title,npcId,before,after,reaction,ripple){
  const c=liveLoad(),presenter=c?.world?.activePresenter||npcId;
  if(c){rememberPresenter(c,presenter,'outcome');c.world.activePresenter=null;liveSave(c)}
  return outcome0(cleanBroadcastText(title),presenter,before,after,cleanBroadcastText(reaction),cleanBroadcastText(ripple));
 };
 const apply0=lpw836ApplyOutcome;
 lpw836ApplyOutcome=function(npcId,title,changes,reaction,ripple){const c=liveLoad();if(c){rememberPresenter(c,npcId,'choice');liveSave(c)}return apply0(npcId,title,changes,cleanBroadcastText(reaction),cleanBroadcastText(ripple))};

 gauntletLiveResolveDynamic=function(type,val,msg){
  const c=liveLoad();if(!c)return gauntletLiveHome();const p=liveProgress(c.active,c),f=liveFeud(c),before={};
  const presenter=c.world?.activePresenter||(type==='feud'?'katie-morgan':type==='recovery'?'dr-lena-hart':'coach-hank-dawson');rememberPresenter(c,presenter,'dynamic-choice');
  before[type]=['power','speed','technique','charisma','recovery'].includes(type)?p.stats[type]:type==='feud'?(f?.intensity||0):(c[type]||0);
  if(type==='feud'){if(f)f.intensity=liveClamp(f.intensity+val,0,100)}else if(['power','speed','technique','charisma','recovery'].includes(type))p.stats[type]=Math.min(p.caps[type],p.stats[type]+val);else c[type]=liveClamp((c[type]||0)+val,0,100);
  const after={};after[type]=['power','speed','technique','charisma','recovery'].includes(type)?p.stats[type]:type==='feud'?(f?.intensity||0):(c[type]||0);
  liveAwardXp(c,c.active,35,'Career activity');liveAdvanceDay(c);liveSave(c);
  const reaction={popularity:'The audience responded immediately, and the comments quickly became a talking point.',momentum:'The response added fresh energy heading into the next appearance.',feud:'The exchange pushed the rivalry closer to another confrontation.',recovery:'Medical staff noted steady progress without changing the current restrictions.'}[type]||cleanBroadcastText(msg);
  lpw836Outcome(cleanBroadcastText(msg).toUpperCase(),presenter,before,after,reaction,'The consequences will become clearer as the next show approaches.')
 };

 const story0=gauntletLiveStorySegment;
 gauntletLiveStorySegment=function(seg){const c=liveLoad();if(c){rememberPresenter(c,PRESENTER_BY_SEGMENT[seg]||'katie-morgan',seg);liveSave(c)}const r=story0(seg);setTimeout(()=>{
  document.querySelectorAll('.live-npc-scene compact span,.live-npc-scene.compact span').forEach(()=>{});
  const host=document.querySelector('.live-npc-scene.compact div');if(host){const small=host.querySelector('small'),b=host.querySelector('b');if(small&&b){small.style.display='block';b.style.display='block'}}
 },0);return r};
 gauntletLiveResolveSegment=function(seg,choice){
  const c=liveLoad(),f=liveFeud(c),presenter=PRESENTER_BY_SEGMENT[seg]||c.world?.activePresenter||'katie-morgan';rememberPresenter(c,presenter,`${seg}-choice`);
  const before={momentum:c.momentum,popularity:c.popularity,feud:f?.intensity||0};
  if(choice==='fight'){c.momentum=liveClamp(c.momentum+6,0,100);if(f)f.intensity=liveClamp(f.intensity+10,0,100)}else c.popularity=liveClamp(c.popularity+6,0,100);
  liveAwardXp(c,c.active,45,'Television segment');liveAdvanceDay(c);liveSave(c);
  const after={momentum:c.momentum,popularity:c.popularity,feud:f?.intensity||0};
  const escalated=choice==='fight';
  lpw836Outcome(escalated?'CONFRONTATION ESCALATED':'CONTROL MAINTAINED',presenter,before,after,escalated?'The confrontation became one of the night’s most discussed moments.':'The measured response earned respect and kept the segment from boiling over.',escalated?'The fallout from tonight will follow this rivalry into the weeks ahead.':'The restraint may change how your rival approaches the next encounter.')
 };

 /* First-show language and a more natural television rundown. */
 gauntletLiveShowIntro=function(){
  const c=liveLoad(),item=livePlanItem(c),firstShow=c.week===1&&c.day===0&&!c.world.lastResult,venue=one(VENUES),attendance=Math.floor(rnd(11000,20500)).toLocaleString(),show=liveIsSupercard(c)?liveCurrentSupercard(c).toUpperCase():liveShowName(c),p=liveFounder(c.active),r=liveFeudOpponent(c);
  let stories=[];if(!firstShow)stories=liveSimulateWorld(c);liveSave(c);
  const card=firstShow?`<li>${p.name} makes an LPW debut tonight.</li><li>${r?`${r.name} is expected to make a presence felt tonight.`:'The LEGACY World Championship picture begins to take shape.'}</li>`:stories.slice(0,3).map(s=>`<li>${cleanBroadcastText(s.text)}</li>`).join('');
  const mike=firstShow?`Welcome to Monday Night Mayhem, LPW's flagship show—where rivalries begin and reputations are made.`:`${p.name} enters tonight with a ${c.wins}-${c.losses} record, and every result now carries more weight.`;
  const johnny=firstShow?`Everybody on this roster has something to prove, and somebody is going to make an unforgettable first impression.`:r?`${r.name} is watching closely. One bad decision could change the entire rivalry.`:'The pressure is rising, and nobody can afford to stand still.';
  render(`<section class="panel live-show-intro lpw-show-open lpw837-show-open-b2"><div class="show-intro-copy">${liveIsSupercard(c)?`<div class="lpw-ple-title">${show}</div>`:lpwShowLogo(show)}<button class="btn live-primary lpw837-start-first" onclick="gauntletLiveRunShowSegment()">START THE SHOW</button><div class="tv-kicker">LIVE FROM ${venue.toUpperCase()} · ${attendance} IN ATTENDANCE</div><div class="live-commentary-duo show-preview"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${mike}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${johnny}</p></div></div><div class="show-card-list"><small>TONIGHT ON LPW</small><ul>${card}</ul><b>YOUR SEGMENT · ${liveIsSupercard(c)?'FEUD FINALE':item.type==='segment'?liveSegmentTitle(item.segment):item.type.toUpperCase()+' MATCH'}</b></div></div></section>`)
 };

 /* World Recap 2.0: editorial copy is distinct from factual results. */
 gauntletLiveWorldRecap=function(){
  const c=liveLoad(),p=liveFounder(c.active),r=liveFeudOpponent(c),last=c.world.lastResult;if(!c.world.worldStories?.length)liveSimulateWorld(c);
  const stories=(c.world.worldStories||[]).slice(0,5),rank=currentRank(c),lastOpp=last?liveFounder(last.opponent):null;
  const unique=[];const seen=new Set();for(const s of stories){const key=[s.a,s.b].filter(Boolean).sort().join('|')||s.text;if(!seen.has(key)){seen.add(key);unique.push(s)}}
  const featured=unique[0],surprise=featured&&featured.a&&featured.b?`Few expected ${liveFounder(featured.a)?.name} to seize the spotlight, but the result became one of the night's biggest talking points.`:'An unexpected result elsewhere on the card changed the mood of the entire broadcast.';
  const disappointment=unique[1]?.b?`${liveFounder(unique[1].b)?.name} missed an opportunity to build momentum and now faces added pressure before the next appearance.`:'One contender left the arena knowing an important opportunity had slipped away.';
  const resultRows=unique.map(s=>{const a=s.a?liveFounder(s.a):null,b=s.b?liveFounder(s.b):null;const factual=a&&b?`${a.name} defeated ${b.name}.`:cleanBroadcastText(s.text);return `<article><span>${a?imageWithFallback(a,'portrait','art-portrait','matchPortrait'):''}</span><p>${factual}</p>${b?`<span>${imageWithFallback(b,'portrait','art-portrait','matchPortrait')}</span>`:''}</article>`}).join('');
  const lead=last?(last.win?`${p.name}'s victory is the lead story coming out of the latest broadcast.`:`The response to ${p.name}'s defeat is now one of the week's central questions.`):'The LPW landscape continues to shift around every result.';
  render(`<section class="panel live-world-screen lpw-world-recap-830 lpw837-recap"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">AROUND LPW</div><h1>WORLD RECAP</h1><div class="live-commentary-duo"><div>${npcImage('mike-sullivan','portrait')}<b>Mike Sullivan</b><p>${lead}</p></div><div>${npcImage('johnny-cannon','portrait')}<b>Johnny Cannon</b><p>${r?`${r.name} is unlikely to let the latest chapter go unanswered.`:'Somebody in the locker room is already preparing the next challenge.'}</p></div></div><div class="lpw837-recap-cards"><article><small>CHAMPIONSHIP OUTLOOK</small><b>RANKED #${rank}</b><p>${rank===1?`${p.name} has reached the front of the line. A World Championship program can now begin.`:rank<=10?`${p.name} is in the wider contender conversation, but more sustained results are still required.`:`Management is watching the early progress, but the championship picture remains some distance away.`}</p></article><article><small>BIGGEST SURPRISE</small><p>${surprise}</p></article><article><small>BIGGEST DISAPPOINTMENT</small><p>${disappointment}</p></article><article><small>RIVALRY WATCH</small><p>${r?`${p.name} and ${r.name} appear destined for another confrontation.`:'A new rivalry has yet to be confirmed.'}</p></article></div><div class="live-world-results">${resultRows}</div><div class="lpw-ripple"><b>LOOKING AHEAD</b><span>${r?`${r.name} may respond before the next SuperCard.`:`The next broadcast could reshape the contender picture.`}</span></div><button class="btn live-primary" onclick="gauntletLiveCompleteWorldRecap()">CONTINUE</button></section>`)
 };

 /* Slight player-side control correction: competitive, not punitive. */
 const finish0=resolveFinish;
 resolveFinish=function(){if(S?.liveMode&&M&&!M.ended){M.performancePlayer=(M.performancePlayer||0)+5;M.decisionPlayer=(M.decisionPlayer||0)+4;M.performanceOpp=Math.max(0,(M.performanceOpp||0)-3);M.decisionOpp=Math.max(0,(M.decisionOpp||0)-2)}return finish0()};

 /* Result history explicitly records collection and feud outcome. */
 const complete0=liveCompleteBroadcast;
 liveCompleteBroadcast=function(win){
  const before=liveLoad(),pending=before?.pending?{...before.pending}:null,feud=before?liveFeudOpponent(before):null;const r=complete0(win);const c=liveLoad();if(c&&pending){ensure10(c);c.world.matchAudit=Array.isArray(c.world.matchAudit)?c.world.matchAudit:[];c.world.matchAudit.unshift({month:before.month,week:before.week,day:before.day,opponent:pending.opponent,win,supercard:!!pending.isSupercard,feudOpponent:feud?.id||null,collected:c.stable.includes(pending.opponent)});c.world.matchAudit=c.world.matchAudit.slice(0,160);liveSave(c)}return r
 };

 const home0=gauntletLiveHome;gauntletLiveHome=function(){const r=home0();document.querySelectorAll('.build-tag,.live-cycle b').forEach(x=>x.textContent=`VERSION 8.3.7 BUILD ${BUILD}`);return r};
})();

/* Build 10 QA follow-up: remove final system-language leak and rival recycling. */
(function(){
 const clean0=typeof cleanBroadcastText==='function'?cleanBroadcastText:(x=>String(x||''));
 const render0=render;
 render=function(html){return render0(String(html||'').replace(/This decision has been saved and can influence future broadcasts and events\.?/gi,'The consequences will become clearer as the next show approaches.').replace(/THE RIPPLE EFFECT/gi,'THE FALLOUT'))};
 const pick0=livePickDifferent;
 livePickDifferent=function(c,exclude=[]){
  const recent=(c?.world?.feudHistory||[]).slice(0,4).map(x=>x.opponent);return pick0(c,[...(Array.isArray(exclude)?exclude:[exclude]),...recent])
 };
 const start0=liveStartFeud;
 liveStartFeud=function(c,opponentId,reason){
  const recent=(c?.world?.feudHistory||[]).slice(0,3).map(x=>x.opponent);
  if(recent.includes(opponentId)){const replacement=livePickDifferent(c,[opponentId,...recent]);if(replacement)opponentId=replacement.id}
  return start0(c,opponentId,reason)
 };
 const launch0=gauntletLiveLaunchBroadcast;gauntletLiveLaunchBroadcast=function(){const c=liveLoad();if(c){c.world.activePresenter=null;liveSave(c)}return launch0()};
})();

/* =============================================================================
   LEGACY PRO WRESTLING 8.4 — LIVING CAREERS & #1 CONTENDER TOURNAMENT
   ============================================================================= */
(function(){
 const BUILD='8.4.1';
 const rosterIds=()=>WRESTLERS.map(w=>w.id);
 const monthKey=c=>String(c.month||1);
 function rankOf(c,id){const i=lpw8Rankings(c).findIndex(x=>x.id===id);return i<0?rosterIds().length:i+1}
 function ensureCareer(c,id){
  c.livingCareers=c.livingCareers||{};
  const row=(c.rankings||[]).find(x=>x.id===id)||{wins:0,losses:0,points:50};
  const p=liveProgress(id,c);
  const x=c.livingCareers[id]||(c.livingCareers[id]={id,wins:Number(row.wins)||0,losses:Number(row.losses)||0,streak:0,lastResult:null,momentum:50,popularity:20,rival:null,status:'Active',history:[],monthsControlled:0,monthsAI:0});
  x.wins=Number(x.wins)||0;x.losses=Number(x.losses)||0;x.streak=Number(x.streak)||0;x.history=Array.isArray(x.history)?x.history:[];
  x.level=p?.level||x.level||1;x.xp=p?.xp||x.xp||0;
  return x
 }
 /* Player-only progression rule: CPU-controlled Living Careers may change records,
    rankings, streaks and status, but can never gain XP, levels or attributes. */
 const awardXpBeforeLivingCareers=liveAwardXp;
 liveAwardXp=function(c,id,amount,reason){
  if(c?.world?.livingCareersEnabled&&id!==c.active){
   const p=liveProgress(id,c);
   return {amount:0,reason,levels:0,level:p.level,points:p.points,pointsEarned:0,milestonesEarned:0,cpuProgressionBlocked:true};
  }
  return awardXpBeforeLivingCareers(c,id,amount,reason);
 };

 function ensure84(c){
  if(!c)return c;lpw837SeedRankings(c);c.version=8.4;
  c.championships={world:c.championships?.world||'jack-mercer'};
  rosterIds().forEach(id=>ensureCareer(c,id));
  const active=ensureCareer(c,c.active);if(!active.synced){active.wins=Number(c.wins)||active.wins;active.losses=Number(c.losses)||active.losses;active.momentum=Number(c.momentum)||active.momentum;active.popularity=Number(c.popularity)||active.popularity;active.synced=true}
  c.wins=active.wins;c.losses=active.losses;c.momentum=active.momentum;c.popularity=active.popularity;
  c.world=c.world||{};c.world.livingCareersEnabled=true;c.world.monthSwitchOnly=true;
  return c
 }
 function syncActive(c){const x=ensureCareer(c,c.active);x.wins=Number(c.wins)||0;x.losses=Number(c.losses)||0;x.momentum=Number(c.momentum)||50;x.popularity=Number(c.popularity)||20;x.level=liveProgress(c.active,c)?.level||x.level;x.xp=liveProgress(c.active,c)?.xp||x.xp;return x}
 function setActive(c,id){syncActive(c);c.active=id;const x=ensureCareer(c,id);c.wins=x.wins;c.losses=x.losses;c.momentum=x.momentum;c.popularity=x.popularity;x.monthsControlled++;}
 function applyResult(c,id,win,opponent,source='AI'){const x=ensureCareer(c,id),row=c.rankings.find(r=>r.id===id);x.wins+=win?1:0;x.losses+=win?0:1;x.streak=win?Math.max(1,x.streak+1):Math.min(-1,x.streak-1);x.lastResult=win?'W':'L';x.history.unshift({month:c.month,opponent,win,source});x.history=x.history.slice(0,36);if(row){row.wins=x.wins;row.losses=x.losses;row.points=Math.max(0,row.points+(win?5:-3))}}
 function simulateInactiveMonth(c){
  if(c.world.lastAISimulatedMonth===c.month)return;c.world.lastAISimulatedMonth=c.month;
  const ids=rosterIds().filter(id=>id!==c.active);const shuffled=liveShuffle(ids);
  for(let i=0;i<shuffled.length;i+=2){const a=shuffled[i],b=shuffled[i+1];if(!b)break;const ar=c.rankings.find(r=>r.id===a),br=c.rankings.find(r=>r.id===b);const chance=.5+((ar?.points||50)-(br?.points||50))/180;const awin=Math.random()<Math.max(.25,Math.min(.75,chance));applyResult(c,a,awin,b);applyResult(c,b,!awin,a);}
  ids.forEach(id=>{const x=ensureCareer(c,id);x.monthsAI++;if(Math.random()<.22){const opp=one(ids.filter(z=>z!==id));x.rival=opp}x.status=x.streak>=3?'Rising':x.streak<=-3?'Slumping':'Active'});
 }
 function tournamentMonth(c){return Number(c?.world?.tournamentMonth||3)}
 function isTournamentMonth(c){return Number(c?.month)===tournamentMonth(c)}
 function tournamentSlots(){return [{w:1,d:0,r:'QF',n:1},{w:1,d:3,r:'QF',n:2},{w:2,d:0,r:'QF',n:3},{w:2,d:3,r:'QF',n:4},{w:3,d:0,r:'SF',n:1},{w:3,d:3,r:'SF',n:2},{w:4,d:0,r:'F',n:1},{w:4,d:3,r:'CONTRACT',n:1}]}
 function tournamentSlot(c){if(!isTournamentMonth(c))return null;return tournamentSlots().find(s=>s.w===liveMonthWeek(c)&&s.d===c.day)||null}
 function seedTournament(c){
  if(!isTournamentMonth(c))return null;if(c.world.tournament?.year===Math.ceil(c.month/12))return c.world.tournament;
  const champ=c.championships.world,ranked=lpw8Rankings(c).map(x=>x.id).filter(id=>id!==champ),field=[c.active,...ranked.filter(id=>id!==c.active).slice(0,7)];
  c.world.tournament={year:Math.ceil(c.month/12),name:'#1 Contender Tournament',field,round:'Quarter-finals',matches:[
   {round:'QF',a:field[0],b:field[7],winner:null},{round:'QF',a:field[3],b:field[4],winner:null},{round:'QF',a:field[1],b:field[6],winner:null},{round:'QF',a:field[2],b:field[5],winner:null}
  ],eliminated:[],winner:null,announced:false};return c.world.tournament
 }
 function getTournamentMatch(c,slot){const t=seedTournament(c);if(!slot||!t)return null;if(slot.r==='QF')return t.matches.filter(m=>m.round==='QF')[slot.n-1];if(slot.r==='SF'){let semis=t.matches.filter(m=>m.round==='SF');if(!semis.length&&t.matches.filter(m=>m.round==='QF').every(m=>m.winner)){const q=t.matches.filter(m=>m.round==='QF');semis=[{round:'SF',a:q[0].winner,b:q[1].winner,winner:null},{round:'SF',a:q[2].winner,b:q[3].winner,winner:null}];t.matches.push(...semis)}return semis[slot.n-1]||null}if(slot.r==='F'){let f=t.matches.find(m=>m.round==='F');const s=t.matches.filter(m=>m.round==='SF');if(!f&&s.length===2&&s.every(m=>m.winner)){f={round:'F',a:s[0].winner,b:s[1].winner,winner:null};t.matches.push(f)}return f||null}return null}
 function resolveAIMatch(c,m){if(!m||m.winner)return;const ar=c.rankings.find(r=>r.id===m.a),br=c.rankings.find(r=>r.id===m.b);m.winner=Math.random()<(.5+((ar?.points||50)-(br?.points||50))/200)?m.a:m.b;const loser=m.winner===m.a?m.b:m.a;applyResult(c,m.winner,true,loser,'Tournament');applyResult(c,loser,false,m.winner,'Tournament');c.world.tournament.eliminated.push(loser)}
 function tournamentAdvance(c,win){const p=c.pending;if(!p?.tournament)return;const t=seedTournament(c),m=t.matches[p.tournamentMatchIndex];if(!m||m.winner)return;const loser=win?p.opponent:c.active;m.winner=win?c.active:p.opponent;t.eliminated.push(loser);if(m.round==='F')t.winner=m.winner;}
 function tournamentLabel(c){const s=tournamentSlot(c);if(!s)return null;return s.r==='CONTRACT'?'WORLD CHAMPIONSHIP CONTRACT SIGNING':s.r==='F'?'#1 CONTENDER TOURNAMENT FINAL':s.r==='SF'?`TOURNAMENT SEMI-FINAL ${s.n}`:`TOURNAMENT QUARTER-FINAL ${s.n}`}

 const load0=liveLoad;liveLoad=function(){const c=load0();if(c){ensure84(c);liveSave(c)}return c};
 const save0=liveSave;liveSave=function(c){if(c)ensure84(c);return save0(c)};
 const choose0=gauntletLiveChooseFounder;gauntletLiveChooseFounder=function(id){choose0(id);const c=liveLoad();if(c){ensure84(c);ensureCareer(c,id).monthsControlled=1;liveSave(c)}};

 /* Only the World Championship exists in Career Mode. */
 lpw8Championships=function(){const c=ensure84(liveLoad()),w=liveFounder(c.championships.world);liveSave(c);render(`<section class="panel lpw8-championships">${shellBack()}<div class="tv-kicker">THE ULTIMATE PRIZE</div><h1>LPW WORLD CHAMPIONSHIP</h1><div class="lpw8-belt-grid lpw84-one-title"><article><div class="lpw8-belt">★</div><small>LPW WORLD CHAMPION</small><h2>${w?.name||'VACANT'}</h2><p>Every wrestler in the Power Rankings is chasing one championship.</p></article></div><button class="btn live-primary" onclick="lpw8RankingScreen()">VIEW POWER RANKINGS</button></section>`)};
 lpw8RankingScreen=function(){const c=ensure84(liveLoad()),rows=lpw8Rankings(c),champ=liveFounder(c.championships.world);liveSave(c);render(`<section class="panel lpw8-rankings lpw837-rankings-b2">${shellBack()}<div class="tv-kicker">WORLD CHAMPIONSHIP PICTURE</div><h1>POWER RANKINGS</h1><p class="sub">One roster. One ranking. One World Championship.</p><div class="lpw8-title-strip"><article class="lpw837-champion-tile"><div class="lpw837-champion-portraits">${imageWithFallback(champ,'portrait','art-portrait','matchPortrait')}</div><span><small>LPW WORLD CHAMPION</small><b>${champ?.name||'VACANT'}</b></span></article></div><div class="lpw8-ranking-list">${rows.map((r,i)=>{const w=liveFounder(r.id),x=ensureCareer(c,r.id);return `<article><strong>${i+1}</strong>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<span><b>${w.name}</b><small>${x.status}${''}</small></span><em>${r.points} PTS<br>${x.wins}-${x.losses}</em></article>`}).join('')}</div><button class="btn live-primary" onclick="gauntletLiveHome()">RETURN TO CAREER</button></section>`)};

 /* Tournament month presentation and booking. */
 const begin0=gauntletLiveBeginDay;gauntletLiveBeginDay=function(skip=false){const c=liveLoad();if(c&&isTournamentMonth(c)){const t=seedTournament(c);if(!t.announced){t.announced=true;liveSave(c);return render(`<section class="panel live-world-screen lpw84-tournament-news"><div class="tv-kicker">BREAKING NEWS · VERONICA VALE</div><h1>THE ROAD TO THE WORLD CHAMPIONSHIP</h1><div class="live-npc-scene large">${npcImage('veronica-vale','portrait')}<div><small>GENERAL MANAGER</small><h2>Veronica Vale</h2><p>Eight wrestlers will compete throughout the tournament month. The winner challenges the LPW World Champion at the SuperCard.</p></div></div><div class="lpw84-bracket-field">${t.field.map((id,i)=>`<span><b>${i+1}</b>${liveFounder(id).name}</span>`).join('')}</div><button class="btn live-primary" onclick="gauntletLiveBeginDay(true)">CONTINUE TO TODAY'S SHOW</button></section>`)}
   const s=tournamentSlot(c);if(s&&s.r==='CONTRACT')return lpw84ContractSigning();
  }return begin0(skip)};
 const label0=liveDayLabel;liveDayLabel=function(c,i){if(isTournamentMonth(c)){const temp={...c,day:i},lab=tournamentLabel(temp);if(lab)return lab;if(i===6&&liveMonthWeek(c)===4)return 'WORLD CHAMPIONSHIP SUPERCARD'}return label0(c,i)};
 const desc0=liveDayDescription;liveDayDescription=function(c){const lab=tournamentLabel(c);if(lab)return lab.includes('CONTRACT')?'The tournament winner and World Champion sign the contract for the tournament-month SuperCard.':`${lab} continues the month-long race for a World Championship opportunity.`;if(isTournamentMonth(c)&&liveIsSupercard(c))return 'The tournament winner challenges the LPW World Champion in the tournament-month main event.';return desc0(c)};
 const run0=gauntletLiveRunShowSegment;gauntletLiveRunShowSegment=function(){const c=liveLoad(),s=tournamentSlot(c);if(c&&isTournamentMonth(c)&&s&&s.r!=='CONTRACT')return lpw84TournamentBooking(s);return run0()};
 window.lpw84TournamentBooking=function(s){const c=liveLoad(),t=seedTournament(c),m=getTournamentMatch(c,s);if(!m)return render(`<section class="panel live-world-screen"><h1>TOURNAMENT UPDATE</h1><p>The bracket is being finalised.</p><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`);if(![m.a,m.b].includes(c.active)){resolveAIMatch(c,m);liveAdvanceDay(c);liveSave(c);const win=liveFounder(m.winner),lose=liveFounder(m.winner===m.a?m.b:m.a);return render(`<section class="panel live-day-complete"><div class="tv-kicker">${tournamentLabel(c)}</div><h1>${win.name} ADVANCES</h1><div class="live-versus"><div>${imageWithFallback(win,'victory','art-full','resultVictory')}<b>${win.name}</b></div><strong>DEFEATED</strong><div>${imageWithFallback(lose,'full','art-full','resultVictory')}<b>${lose.name}</b></div></div><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE</button></section>`)}const opp=m.a===c.active?m.b:m.a;c.pending={opponent:opp,isSupercard:false,tournament:true,tournamentRound:m.round,tournamentMatchIndex:t.matches.indexOf(m)};liveSave(c);return gauntletLiveMatchCard65()};
 window.lpw84ContractSigning=function(){const c=liveLoad(),t=seedTournament(c);if(!t.winner){const f=getTournamentMatch(c,{r:'F',n:1});resolveAIMatch(c,f);t.winner=f.winner}const winner=liveFounder(t.winner),champ=liveFounder(c.championships.world);render(`<section class="panel live-world-screen lpw84-contract"><div class="tv-kicker">THURSDAY NIGHT THROWDOWN</div><h1>WORLD CHAMPIONSHIP CONTRACT SIGNING</h1><div class="live-versus"><div>${imageWithFallback(winner,'portrait','art-portrait','matchPortrait')}<b>${winner.name}</b><small>TOURNAMENT WINNER</small></div><strong>VS</strong><div>${imageWithFallback(champ,'portrait','art-portrait','matchPortrait')}<b>${champ.name}</b><small>WORLD CHAMPION</small></div></div><div class="live-npc-scene compact">${npcImage('veronica-vale','portrait')}<div><small>GENERAL MANAGER</small><b>Veronica Vale</b><p>The contract is signed. The World Championship match is official.</p></div></div><button class="btn live-primary" onclick="lpw84FinishContract()">CONTINUE</button></section>`)};
 window.lpw84FinishContract=function(){const c=liveLoad();liveAdvanceDay(c);liveSave(c);gauntletLiveCalendar()};

 /* Persist player results into that wrestler's living career and tournament bracket. */
 const complete0=liveCompleteBroadcast;liveCompleteBroadcast=function(win){const before=liveLoad(),pending=before?.pending?{...before.pending}:null;if(before&&pending?.tournament)tournamentAdvance(before,win),liveSave(before);const result=complete0(win);const c=liveLoad();if(c){const x=syncActive(c),row=c.rankings.find(r=>r.id===c.active);if(row){x.wins=row.wins;x.losses=row.losses}x.streak=win?Math.max(1,x.streak+1):Math.min(-1,x.streak-1);x.lastResult=win?'W':'L';liveSave(c)}return result};

 /* End-of-month only character selection; everyone else lives a simulated month. */
 gauntletLiveMonthRosterChoice=function(){const c=ensure84(liveLoad());syncActive(c);simulateInactiveMonth(c);liveSave(c);const rows=lpw8Rankings(c);render(`<section class="panel live-founder-screen lpw84-living-careers"><div class="tv-kicker">MONTH COMPLETE · LIVING CAREERS</div><h1>WHOSE STORY WILL THE CAMERAS FOLLOW?</h1><p class="sub">This choice is locked for the entire next month. Every other wrestler continues under CPU control.</p><div class="live-founder-grid">${c.stable.map(id=>{const w=liveFounder(id),x=ensureCareer(c,id),rank=rows.findIndex(r=>r.id===id)+1,streak=x.streak>0?`W${x.streak}`:x.streak<0?`L${Math.abs(x.streak)}`:'—';return `<button class="live-founder-card lpw84-career-card" onclick="gauntletLiveStartNextMonth('${id}')">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<span><small>${id===c.active?'ACTIVE WRESTLER':'AVAILABLE CAREER'}</small><b>${w.name}</b><em>#${rank} · ${x.wins}-${x.losses} · ${streak}</em><i>${x.status}${x.rival?` · Rival: ${liveFounder(x.rival)?.name}`:''}</i></span></button>`}).join('')}</div></section>`)};
 gauntletLiveStartNextMonth=function(id){const c=ensure84(liveLoad());if(!c.stable.includes(id))return gauntletLiveMonthRosterChoice();setActive(c,id);c.world.katieThisWeek=0;c.monthSwitchLocked=true;const opp=livePickDifferent(c,c.stable);liveStartFeud(c,opp.id,'A new monthly rivalry begins.');liveGenerateMonthlyPlan(c);if(isTournamentMonth(c))seedTournament(c);liveSave(c);gauntletLiveCalendar()};

 /* Calendar and stable use wrestler-owned records instead of one shared record. */
 const cal0=gauntletLiveCalendar;gauntletLiveCalendar=function(){const c=liveLoad();if(c)syncActive(c);const r=cal0();setTimeout(()=>{const c2=liveLoad(),x=c2&&ensureCareer(c2,c2.active),hero=document.querySelector('.live-career-hero span');if(hero&&x)hero.textContent=`${x.wins}-${x.losses} record · Rank #${rankOf(c2,c2.active)} · ${c2.stable.length} roster members`;const small=document.querySelector('.live-career-hero small');if(small)small.textContent=c2.month===1?'LPW DEBUT':rankOf(c2,c2.active)===1?'#1 CONTENDER':c2.active===c2.championships.world?'WORLD CHAMPION':''},0);return r};
 gauntletLiveStable=function(){const c=ensure84(liveLoad()),rows=lpw8Rankings(c);render(`<section class="panel live-stable-screen">${shellBack()}<div class="tv-kicker">LIVING CAREERS</div><h1>YOUR ROSTER</h1><p class="sub">Wrestlers can only be selected after the monthly SuperCard.</p><div class="live-founder-grid">${c.stable.map(id=>{const w=liveFounder(id),x=ensureCareer(c,id),rank=rows.findIndex(r=>r.id===id)+1;return `<article class="live-founder-card lpw84-career-card">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<span><small>${id===c.active?'ACTIVE WRESTLER':'CPU CONTROLLED'}</small><b>${w.name}</b><em>Rank #${rank} · ${x.wins}-${x.losses}</em><i>${x.status}</i></span></article>`}).join('')}</div><button class="btn live-primary" onclick="gauntletLiveCalendar()">RETURN TO CALENDAR</button></section>`)};

 const home0=gauntletLiveHome;gauntletLiveHome=function(){const r=home0();document.querySelectorAll('.build-tag,.live-cycle b').forEach(x=>x.textContent='VERSION 8.4');const p=document.querySelector('.live-cycle span');if(p)p.textContent='Living Careers, one World Championship and the annual annual #1 Contender Tournament.';return r};
})();

/* 8.4 March SuperCard championship resolution. */
(function(){
 const begin84=gauntletLiveBeginDay;
 gauntletLiveBeginDay=function(skip=false){
  const c=liveLoad();
  if(c&&Number(c.month)===Number(c.world?.tournamentMonth||3)&&liveIsSupercard(c)){
   const t=c.world?.tournament,champId=c.championships?.world;
   if(t?.winner===c.active){c.pending={opponent:champId,isSupercard:true,worldTitle:true,tournamentTitleShot:true,supercardName:liveCurrentSupercard(c)};liveSave(c);return gauntletLiveShowIntro()}
   if(t?.winner&&t.titleResolved!==true){const challenger=liveFounder(t.winner),champ=liveFounder(champId),cr=c.rankings.find(r=>r.id===champId),rr=c.rankings.find(r=>r.id===t.winner),newChamp=Math.random()<Math.max(.3,Math.min(.65,.46+((rr?.points||50)-(cr?.points||50))/220));const winner=newChamp?challenger:champ,loser=newChamp?champ:challenger;t.titleResolved=true;t.titleWinner=winner.id;if(newChamp)c.championships.world=challenger.id;const apply=(id,win,opp)=>{const x=c.livingCareers[id],row=c.rankings.find(r=>r.id===id);x.wins+=win?1:0;x.losses+=win?0:1;x.streak=win?Math.max(1,x.streak+1):Math.min(-1,x.streak-1);if(row){row.wins=x.wins;row.losses=x.losses;row.points=Math.max(0,row.points+(win?8:-4))}};apply(winner.id,true,loser.id);apply(loser.id,false,winner.id);liveAdvanceDay(c);liveSave(c);return render(`<section class="panel live-supercard-result"><div class="tv-kicker">${liveCurrentSupercard(c).toUpperCase()} · WORLD CHAMPIONSHIP</div><h1>${winner.name} ${newChamp?'WINS THE WORLD CHAMPIONSHIP':'RETAINS THE WORLD CHAMPIONSHIP'}</h1><div class="supercard-result-art">${imageWithFallback(winner,'victory','art-full','resultVictory')}${imageWithFallback(loser,'full','art-full','resultVictory')}</div><p>${challenger.name} earned this opportunity by winning the annual #1 Contender Tournament. The title match has now reshaped the Power Rankings.</p><button class="btn live-primary" onclick="gauntletLiveMonthRosterChoice()">CONTINUE TO MONTH-END SELECTION</button></section>`)}
  }
  return begin84(skip)
 };
 const complete84=liveCompleteBroadcast;
 liveCompleteBroadcast=function(win){const c0=liveLoad(),title=!!c0?.pending?.worldTitle,challenger=c0?.active,champ=c0?.pending?.opponent;const r=complete84(win);const c=liveLoad();if(c&&title){if(win)c.championships.world=challenger;c.world.tournament.titleResolved=true;c.world.tournament.titleWinner=win?challenger:champ;liveSave(c)}return r};
})();

/* =============================================================================
   LEGACY PRO WRESTLING 8.4.2 — LIVING WORLD COMPLETION
   Broadcast package, career history, dashboard, news network and deeper memory.
   ============================================================================= */
(function(){
 const V='8.4.5';
 const ids=()=>WRESTLERS.map(w=>w.id);
 const career=(c,id)=>{c.livingCareers=c.livingCareers||{};return c.livingCareers[id]||(c.livingCareers[id]={id,wins:0,losses:0,streak:0,momentum:50,popularity:20,status:'Active',history:[],monthsControlled:0,monthsAI:0})};
 const rank=(c,id)=>Math.max(1,lpw8Rankings(c).findIndex(r=>r.id===id)+1);
 const wrestler=id=>liveFounder(id)||{id,name:'Unknown Wrestler'};
 const monthName=n=>['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'][(Math.max(1,n)-1)%12];
 function world(c){
  c.world=c.world||{};
  c.world.news=Array.isArray(c.world.news)?c.world.news:[];
  c.world.titleHistory=Array.isArray(c.world.titleHistory)?c.world.titleHistory:[];
  c.world.tournamentHistory=Array.isArray(c.world.tournamentHistory)?c.world.tournamentHistory:[];
  c.world.monthSummaries=c.world.monthSummaries||{};
  c.world.broadcastMemory=c.world.broadcastMemory||{};
  const champ=c.championships?.world;
  if(champ&&!c.world.titleHistory.length)c.world.titleHistory.push({champion:champ,month:c.month||1,reason:'Recognised as LPW World Champion',defences:0});
  ids().forEach(id=>{const x=career(c,id);x.history=Array.isArray(x.history)?x.history:[];x.highestRank=x.highestRank||rank(c,id);x.lowestRank=x.lowestRank||rank(c,id);x.longestStreak=x.longestStreak||Math.max(0,x.streak||0);x.supercards=x.supercards||0;x.tournamentWins=x.tournamentWins||0;x.titleReigns=x.titleReigns||0;x.titleDefences=x.titleDefences||0;x.injuryHistory=Array.isArray(x.injuryHistory)?x.injuryHistory:[];});
  return c.world;
 }
 function pushNews(c,type,headline,body,subject){
  const w=world(c);const key=`${c.month}-${c.week}-${c.day}-${headline}`;
  if(w.news.some(n=>n.key===key))return;
  w.news.unshift({key,type,headline,body,subject,month:c.month,week:liveMonthWeek(c),day:c.day,stamp:Date.now()});w.news=w.news.slice(0,80);
 }
 function recordSnapshot(c){
  world(c);ids().forEach(id=>{const x=career(c,id),r=rank(c,id);x.highestRank=Math.min(x.highestRank||r,r);x.lowestRank=Math.max(x.lowestRank||r,r);x.longestStreak=Math.max(x.longestStreak||0,Math.max(0,x.streak||0));});
 }
 function titleChange(c,newChamp,oldChamp,reason){
  if(!newChamp||newChamp===oldChamp)return;const w=world(c),prev=w.titleHistory[0];if(prev&&prev.champion===oldChamp)prev.endedMonth=c.month;
  w.titleHistory.unshift({champion:newChamp,defeated:oldChamp,month:c.month,reason:reason,defences:0});
  career(c,newChamp).titleReigns=(career(c,newChamp).titleReigns||0)+1;
  pushNews(c,'breaking',`${wrestler(newChamp).name} WINS THE WORLD CHAMPIONSHIP`,`${wrestler(newChamp).name} defeated ${wrestler(oldChamp).name} to begin a new era in LPW.`,newChamp);
 }
 function lastFive(x){return (x.history||[]).slice(0,5).map(h=>h.win?'W':'L').join(' ')||'—'}
 function summaryFor(c,id){
  const x=career(c,id),r=rank(c,id),prev=x.lastCameraRank||r,diff=prev-r;
  const movement=diff>0?`rose ${diff} place${diff===1?'':'s'}`:diff<0?`fell ${Math.abs(diff)} place${diff===-1?'':'s'}`:'held the same position';
  const ai=(x.history||[]).filter(h=>h.source==='AI'||h.source==='Tournament').slice(0,8),wins=ai.filter(h=>h.win).length,losses=ai.filter(h=>!h.win).length;
  return {movement,wins,losses,rank:r,from:prev,streak:x.streak,status:x.status};
 }
 function updateMonthlyNews(c){
  const rows=lpw8Rankings(c),top=rows[0],active=career(c,c.active),champ=c.championships.world;
  pushNews(c,'rankings','POWER RANKINGS UPDATED',`${wrestler(top.id).name} leads the contenders while ${wrestler(c.active).name} is ranked #${rank(c,c.active)}.`,top.id);
  if(active.streak>=3)pushNews(c,'form',`${wrestler(c.active).name.toUpperCase()} IS ON A ROLL`,`${active.streak} consecutive victories have changed the World Championship conversation.`,c.active);
  if(active.streak<=-3)pushNews(c,'form',`${wrestler(c.active).name.toUpperCase()} UNDER PRESSURE`,`${Math.abs(active.streak)} consecutive defeats have sent ${wrestler(c.active).name} down the Power Rankings.`,c.active);
  pushNews(c,'champion','THE CHAMPION WATCH',`${wrestler(champ).name} remains the standard every contender is trying to reach.`,champ);
 }
 function ensure(c){if(!c)return c;c.version=8.4;world(c);recordSnapshot(c);return c}
 const load=liveLoad;liveLoad=function(){const c=load();if(c)ensure(c);return c};
 const save=liveSave;liveSave=function(c){if(c)ensure(c);return save(c)};

 /* Persistent dashboard and navigation. */
 window.lpw84Dashboard=function(){
  const c=ensure(liveLoad()),a=wrestler(c.active),x=career(c,c.active),champ=wrestler(c.championships.world),r=rank(c,c.active),f=liveFeudOpponent(c),news=world(c).news.slice(0,3),t=c.world.tournament;
  render(`<section class="panel lpw84-dashboard"><button class="shell-back" onclick="gauntletLiveCalendar()">← CALENDAR</button><div class="tv-kicker">${monthName(c.month)} · LPW LIVING WORLD</div><h1>CAREER DASHBOARD</h1><div class="lpw84-dash-hero">${imageWithFallback(a,'portrait','art-portrait','matchPortrait')}<div>${c.active===c.championships.world?'<small>LPW WORLD CHAMPION</small>':r===1?'<small>#1 CONTENDER</small>':''}<h2>${a.name}</h2><p>Rank #${r} · ${x.wins}-${x.losses} · ${x.streak>0?'W'+x.streak:x.streak<0?'L'+Math.abs(x.streak):'No streak'}</p></div></div><div class="lpw84-dash-grid"><article><small>WORLD CHAMPION</small><b>${champ.name}</b><p>${career(c,champ.id).titleDefences||0} successful defence${career(c,champ.id).titleDefences===1?'':'s'}</p></article><article><small>CURRENT RIVAL</small><b>${f?.name||'No active rival'}</b><p>${f?'The rivalry continues this month.':'The next challenger is still emerging.'}</p></article><article><small>RECENT FORM</small><b>${lastFive(x)}</b><p>${x.status}</p></article><article><small>NEXT SHOW</small><b>${liveDayLabel(c,c.day)}</b><p>${LIVE_DAYS[c.day]}</p></article></div>${t&&c.month===3?`<button class="lpw84-feature-strip" onclick="lpw84TournamentBracket()"><small>MARCH FEATURE</small><b>#1 CONTENDER TOURNAMENT</b><span>View the live bracket →</span></button>`:''}<div class="lpw84-news-preview"><h2>LATEST HEADLINES</h2>${news.length?news.map(n=>`<article><small>${n.type.toUpperCase()}</small><b>${n.headline}</b><p>${n.body}</p></article>`).join(''):'<article><b>THE MONTH IS JUST BEGINNING</b><p>Headlines will develop as LPW moves forward.</p></article>'}</div><div class="lpw84-dashboard-actions"><button class="btn live-primary" onclick="gauntletLiveCalendar()">CONTINUE CAREER</button><button class="btn" onclick="lpw84NewsNetwork()">NEWS NETWORK</button><button class="btn" onclick="lpw84CareerHistory('${c.active}')">CAREER HISTORY</button><button class="btn" onclick="gauntletLiveStable()">YOUR ROSTER</button></div></section>`)
 };
 window.lpw84NewsNetwork=function(){const c=ensure(liveLoad()),items=world(c).news;render(`<section class="panel lpw84-news"><button class="shell-back" onclick="lpw84Dashboard()">← DASHBOARD</button><div class="tv-kicker">THE LPW NEWS CYCLE</div><h1>NEWS NETWORK</h1><div class="lpw84-news-tabs"><span>BREAKING NEWS</span><span>DIRT SHEET</span><span>LPW SOCIAL</span><span>POWER RANKINGS</span></div><div class="lpw84-news-list">${items.length?items.map(n=>`<article><small>MONTH ${n.month} · WEEK ${n.week} · ${n.type.toUpperCase()}</small><h2>${n.headline}</h2><p>${n.body}</p></article>`).join(''):'<article><h2>NO HEADLINES YET</h2><p>The news cycle begins with the next event.</p></article>'}</div></section>`)};
 window.lpw84CareerHistory=function(id){const c=ensure(liveLoad()),x=career(c,id),w=wrestler(id),r=rank(c,id),hist=(x.history||[]).slice(0,20);render(`<section class="panel lpw84-history"><button class="shell-back" onclick="gauntletLiveStable()">← ROSTER</button><div class="tv-kicker">LIVING CAREER</div><h1>${w.name.toUpperCase()}</h1><div class="lpw84-history-hero">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<div><b>Rank #${r}</b><span>${x.wins}-${x.losses} record</span><span>${id===c.championships.world?'LPW World Champion':x.status}</span></div></div><div class="lpw84-history-stats"><article><small>HIGHEST RANK</small><b>#${x.highestRank||r}</b></article><article><small>LONGEST STREAK</small><b>W${x.longestStreak||0}</b></article><article><small>WORLD TITLE REIGNS</small><b>${x.titleReigns||0}</b></article><article><small>TOURNAMENT WINS</small><b>${x.tournamentWins||0}</b></article><article><small>SUPERCARDS</small><b>${x.supercards||0}</b></article><article><small>MONTHS FOLLOWED</small><b>${x.monthsControlled||0}</b></article></div><h2>CAREER TIMELINE</h2><div class="lpw84-timeline">${hist.length?hist.map(h=>`<article class="${h.win?'win':'loss'}"><small>MONTH ${h.month||'?'} · ${h.source||'LPW'}</small><b>${h.win?'DEFEATED':'LOST TO'} ${wrestler(h.opponent).name}</b></article>`).join(''):'<article><b>THE STORY IS JUST BEGINNING</b></article>'}</div></section>`)};
 window.lpw84TournamentBracket=function(){const c=ensure(liveLoad()),t=c.world.tournament;if(!t)return lpw84Dashboard();const rounds=['QF','SF','F'];render(`<section class="panel lpw84-bracket"><button class="shell-back" onclick="lpw84Dashboard()">← DASHBOARD</button><div class="tv-kicker">MARCH SIGNATURE EVENT</div><h1>#1 CONTENDER TOURNAMENT</h1><p>The winner challenges the LPW World Champion at the March SuperCard.</p><div class="lpw84-bracket-rounds">${rounds.map(r=>`<div><h2>${r==='QF'?'QUARTER-FINALS':r==='SF'?'SEMI-FINALS':'FINAL'}</h2>${(t.matches||[]).filter(m=>m.round===r).map(m=>`<article><span>${wrestler(m.a).name}</span><b>${m.winner?`WINNER: ${wrestler(m.winner).name}`:'VS'}</b><span>${wrestler(m.b).name}</span></article>`).join('')||'<article><b>TO BE DETERMINED</b></article>'}</div>`).join('')}</div>${t.winner?`<div class="lpw84-tournament-winner"><small>TOURNAMENT WINNER</small><b>${wrestler(t.winner).name}</b></div>`:''}</section>`)};

 /* Calendar receives the persistent dashboard entry point and broadcast framing. */
 const cal=gauntletLiveCalendar;gauntletLiveCalendar=function(){const c=ensure(liveLoad());updateMonthlyNews(c);liveSave(c);const r=cal();setTimeout(()=>{const top=document.querySelector('.live-calendar-top');if(top&&!document.querySelector('.lpw84-dashboard-btn'))top.insertAdjacentHTML('beforeend','<button class="shell-back lpw84-dashboard-btn" onclick="lpw84Dashboard()">DASHBOARD</button>')},0);return r};

 /* Roster becomes a living-career management screen with history access. */
 gauntletLiveStable=function(){const c=ensure(liveLoad()),rows=lpw8Rankings(c);render(`<section class="panel live-stable-screen lpw84-roster"><button class="shell-back" onclick="lpw84Dashboard()">← DASHBOARD</button><div class="tv-kicker">LIVING CAREERS</div><h1>YOUR ROSTER</h1><p class="sub">Career focus can only change after the monthly SuperCard. CPU-controlled wrestlers never earn XP or improve attributes.</p><div class="live-founder-grid">${c.stable.map(id=>{const w=wrestler(id),x=career(c,id),r=rows.findIndex(z=>z.id===id)+1;return `<article class="live-founder-card lpw84-career-card">${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<span><small>${id===c.active?'ACTIVE WRESTLER':'CPU CONTROLLED'}</small><b>${w.name}</b><em>Rank #${r} · ${x.wins}-${x.losses} · ${x.streak>0?'W'+x.streak:x.streak<0?'L'+Math.abs(x.streak):'—'}</em><i>${x.status}</i><button onclick="lpw84CareerHistory('${id}')">VIEW CAREER</button></span></article>`}).join('')}</div></section>`)};

 /* Returning to a career now receives a factual "Previously on" summary. */
 const nextMonth=gauntletLiveStartNextMonth;gauntletLiveStartNextMonth=function(id){const c=ensure(liveLoad()),old=c.active,x=career(c,id),s=summaryFor(c,id);x.lastCameraRank=s.rank;nextMonth(id);const c2=ensure(liveLoad());c2.world.pendingReturnSummary={id,old,summary:s};liveSave(c2);return lpw84PreviouslyOn()};
 window.lpw84PreviouslyOn=function(){const c=ensure(liveLoad()),p=c.world.pendingReturnSummary;if(!p)return gauntletLiveCalendar();const w=wrestler(p.id),s=p.summary,returning=p.id!==p.old;render(`<section class="panel lpw84-previously"><div class="tv-kicker">${returning?'PREVIOUSLY ON':'A NEW MONTH BEGINS'}</div><h1>${w.name.toUpperCase()}</h1>${imageWithFallback(w,'portrait','art-portrait','matchPortrait')}<p>${returning?`While the cameras were elsewhere, ${w.name} went ${s.wins}-${s.losses} and ${s.movement} in the Power Rankings.`:`The cameras remain focused on ${w.name} for another month.`}</p><div><span><small>CURRENT RANK</small><b>#${s.rank}</b></span><span><small>FORM</small><b>${s.streak>0?'W'+s.streak:s.streak<0?'L'+Math.abs(s.streak):'EVEN'}</b></span><span><small>STATUS</small><b>${s.status}</b></span></div><button class="btn live-primary" onclick="lpw84ClosePreviously()">BEGIN THE MONTH</button></section>`)};
 window.lpw84ClosePreviously=function(){const c=ensure(liveLoad());c.world.pendingReturnSummary=null;liveSave(c);gauntletLiveCalendar()};

 /* Monthly selection generates history/news and keeps progression ownership with player. */
 const monthChoice=gauntletLiveMonthRosterChoice;gauntletLiveMonthRosterChoice=function(){const c=ensure(liveLoad()),active=career(c,c.active);recordSnapshot(c);updateMonthlyNews(c);c.world.monthSummaries[c.month]={active:c.active,rank:rank(c,c.active),record:`${active.wins}-${active.losses}`,champion:c.championships.world};pushNews(c,'monthly',`${monthName(c.month)} IS IN THE BOOKS`,`${wrestler(c.active).name} closes the month ranked #${rank(c,c.active)}. The LPW World Champion is ${wrestler(c.championships.world).name}.`,c.active);liveSave(c);return monthChoice()};

 /* Record championship lineage and tournament history at resolution. */
 const complete=liveCompleteBroadcast;liveCompleteBroadcast=function(win){const before=ensure(liveLoad()),oldChamp=before.championships.world,p={...(before.pending||{})},active=before.active;const r=complete(win);const c=ensure(liveLoad());if(p.isSupercard)career(c,active).supercards++;
  if(p.worldTitle){if(win)titleChange(c,active,oldChamp,'Won at SuperCard');else{career(c,oldChamp).titleDefences++;const reign=world(c).titleHistory.find(h=>h.champion===oldChamp&&!h.endedMonth);if(reign)reign.defences=(reign.defences||0)+1;pushNews(c,'champion',`${wrestler(oldChamp).name} RETAINS THE WORLD CHAMPIONSHIP`,`${wrestler(active).name} challenged at SuperCard, but the champion survived.`,oldChamp)}}
  if(p.tournament&&p.tournamentRound==='F'&&win){career(c,active).tournamentWins++;world(c).tournamentHistory.unshift({year:Math.ceil(c.month/12),winner:active,month:c.month});pushNews(c,'tournament',`${wrestler(active).name} WINS THE #1 CONTENDER TOURNAMENT`,`${wrestler(active).name} has earned a World Championship match at the March SuperCard.`,active)}recordSnapshot(c);liveSave(c);return r};

 /* Broadcast memory: show openings and media now surface current-world facts. */
 const intro=gauntletLiveShowIntro;gauntletLiveShowIntro=function(){const c=ensure(liveLoad()),a=wrestler(c.active),r=liveFeudOpponent(c),champ=wrestler(c.championships.world);pushNews(c,'preview',`${liveShowName(c).toUpperCase()}: ${a.name} IN ACTION`,r?`${a.name}'s rivalry with ${r.name} continues while World Champion ${champ.name} watches the rankings.`:`${a.name} looks to improve a #${rank(c,c.active)} ranking.`,c.active);liveSave(c);const out=intro();setTimeout(()=>{const sec=document.querySelector('.live-show-intro,.panel');if(sec&&!document.querySelector('.lpw84-earlier-tonight'))sec.insertAdjacentHTML('afterbegin',`<div class="lpw84-earlier-tonight"><small>TONIGHT ON LPW</small><b>${a.name} enters ranked #${rank(c,c.active)}</b><span>${r?`${r.name} remains the central threat.`:`The Power Rankings remain wide open.`}</span></div>`)},0);return out};

 const home=gauntletLiveHome;gauntletLiveHome=function(){const r=home();setTimeout(()=>{document.querySelectorAll('.build-tag,.live-cycle b').forEach(x=>x.textContent='VERSION 8.4.5');const menu=document.querySelector('.live-mode-actions,.live-home-actions');if(menu&&!document.querySelector('.lpw84-home-dashboard'))menu.insertAdjacentHTML('beforeend','<button class="btn lpw84-home-dashboard" onclick="lpw84Dashboard()">LIVING WORLD DASHBOARD</button>')},0);return r};

 /* Final language cleanup. */
 const render0=render;render=function(html){return render0(String(html||'').replace(/stable member(s)?/gi,'roster member$1').replace(/MANAGE STABLE/gi,'VIEW ROSTER').replace(/ACTIVE WRESTLER/gi,'ACTIVE WRESTLER'))};
})();

/* =============================================================
   LEGACY PRO WRESTLING 8.4.5 — 20-PERSON BATTLE ROYAL ENGINE
   Standalone main-menu test mode. Career integration intentionally
   deferred until the September SuperCard implementation is approved.
   ============================================================= */
(function(){
 const BR_SAVE_KEY='lpw_battle_royal_history_v1';
 let BR=null;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const wrestler=id=>WRESTLERS.find(w=>w.id===id);
 const score=w=>(Number(w?.overall)||75)+(Number(w?.resilience)||75)*.25+(Number(w?.power)||75)*.15;
 const portrait=w=>imageWithFallback(w,'portrait','art-portrait','matchPortrait');
 const active=()=>BR?.entrants.filter(e=>!e.eliminated)||[];
 const remaining=()=>active().length;
 const player=()=>BR?.entrants.find(e=>e.id===BR.playerId);
 const stateLabel=e=>e.stamina>75?'FRESH':e.stamina>50?'WINDED':e.stamina>25?'VULNERABLE':e.stamina>0?'IN DANGER':'CRITICAL';
 const phase=()=>remaining()>14?'OPENING':remaining()>7?'MIDDLE':remaining()>2?'CLOSING':'FINAL TWO';
 const histLoad=()=>{try{return JSON.parse(localStorage.getItem(BR_SAVE_KEY)||'[]')}catch{return []}};
 const histSave=r=>{const h=histLoad();h.unshift(r);localStorage.setItem(BR_SAVE_KEY,JSON.stringify(h.slice(0,30)))};

 function installMenuButton(){
  const nav=document.querySelector('.hub-menu');
  if(!nav||document.getElementById('battleRoyalMenuButton'))return;
  const b=document.createElement('button');b.id='battleRoyalMenuButton';b.className='hub-option battle-royal-menu';
  b.onclick=()=>window.battleRoyalHome();b.innerHTML='<b>20-PERSON BATTLE ROYAL</b><small>Twenty enter. One survives. Playable now.</small>';
  const career=nav.querySelector('button');career?.after(b);
 }
 const oldHome=window.home;
 window.home=function(){const r=oldHome.apply(this,arguments);setTimeout(installMenuButton,0);return r};

 window.battleRoyalHome=function(){
  const h=histLoad(),last=h[0];
  render(`<section class="panel br-home">${shellBack()}<div class="tv-kicker">PLAYABLE NOW · STANDALONE TEST MODE</div><h1>20-PERSON BATTLE ROYAL</h1><p>Twenty unique wrestlers. One ring. One survivor. This match uses a dedicated survival, stamina and elimination engine.</p><div class="br-home-card"><div><b>20</b><span>ENTRANTS</span></div><div><b>1</b><span>WINNER</span></div><div><b>${h.length}</b><span>MATCHES RECORDED</span></div></div>${last?`<div class="br-last-result"><small>LAST WINNER</small><b>${wrestler(last.winner)?.name||last.winner}</b><span>${last.mostEliminations||0} eliminations led the match</span></div>`:''}<button class="btn live-primary" onclick="battleRoyalChooseWrestler()">CHOOSE YOUR WRESTLER</button><button class="btn secondary" onclick="battleRoyalHistory()">BATTLE ROYAL HISTORY</button></section>`)
 };
 window.battleRoyalChooseWrestler=function(){
  render(`<section class="panel br-select">${shellBack()}<div class="tv-kicker">SELECT YOUR ENTRANT</div><h1>WHO WILL SURVIVE?</h1><p>The other nineteen entrants will be selected randomly with no duplicates.</p><div class="br-select-grid">${WRESTLERS.map(w=>`<button onclick="battleRoyalStart('${w.id}')">${portrait(w)}<b>${w.name}</b><small>OVR ${w.overall||'—'}</small></button>`).join('')}</div></section>`)
 };
 window.battleRoyalStart=function(playerId){
  const field=[wrestler(playerId),...shuffle(WRESTLERS.filter(w=>w.id!==playerId)).slice(0,19)].filter(Boolean);
  BR={playerId,round:0,entrants:field.map((w,i)=>({id:w.id,stamina:100,eliminated:false,place:null,eliminations:0,survival:0,entry:i+1,lastAction:'Fresh'})),eliminationOrder:[],log:[],watching:false,finished:false,flash:null};
  battleRoyalRender();
 };
 function tile(e){const w=wrestler(e.id),isPlayer=e.id===BR.playerId;return `<article class="br-tile ${isPlayer?'player':''} ${e.eliminated?'out':''}" data-br-id="${e.id}">${portrait(w)}<b>${w.name}</b><div class="br-fatigue"><i style="width:${clamp(e.stamina,0,100)}%"></i></div><small>${stateLabel(e)}${isPlayer?' · YOU':''}</small></article>`}
 function latestLog(){return BR.log.slice(-3).reverse().map(x=>`<p>${x}</p>`).join('')||'<p>The bell rings and twenty wrestlers collide.</p>'}
 window.battleRoyalRender=function(){
  if(!BR)return battleRoyalHome();
  if(BR.finished)return battleRoyalResults();
  const p=player(),rem=remaining(),finalTwo=rem===2;
  render(`<section class="panel br-match ${finalTwo?'br-final-two':''}"><div class="br-top"><button class="shell-back" onclick="battleRoyalConfirmExit()">← MAIN MENU</button><div><small>${phase()}</small><b>${rem} REMAIN</b></div><div><small>ROUND</small><b>${BR.round}</b></div></div><div class="tv-kicker">20-PERSON BATTLE ROYAL</div><h1>${finalTwo?'FINAL TWO':'SURVIVE THE CHAOS'}</h1>${finalTwo?battleRoyalFinalTwoHeader():''}<div class="br-grid">${active().map(tile).join('')}</div><div class="br-commentary">${latestLog()}</div>${p.eliminated&&!BR.finished?battleRoyalSpectatorControls():battleRoyalDecisionPanel()}${BR.flash?`<div class="br-elimination-flash"><small>ELIMINATED</small><b>${BR.flash.text}</b><span>${remaining()} WRESTLERS REMAIN</span></div>`:''}</section>`)
 };
 function battleRoyalFinalTwoHeader(){const a=active();return `<div class="br-final-head">${a.map(e=>`<div>${portrait(wrestler(e.id))}<b>${wrestler(e.id).name}</b><small>${Math.round(e.stamina)}% STAMINA</small></div>`).join('<strong>VS</strong>')}</div>`}
 function battleRoyalSpectatorControls(){return `<div class="br-decisions"><h2>YOU FINISHED #${player().place}</h2><p>The battle continues without you.</p><button onclick="battleRoyalWatchRound()">WATCH THE NEXT ROUND</button><button onclick="battleRoyalSimToWinner()">SIMULATE TO WINNER</button><button onclick="home()">RETURN TO MAIN MENU</button></div>`}
 function vulnerableTargets(){return active().filter(e=>e.id!==BR.playerId).sort((a,b)=>a.stamina-b.stamina)}
 function decisionPool(){
  const p=player(),targets=vulnerableTargets(),pool=[];
  if(remaining()===2)return battleRoyalFinalChoices();
  pool.push({id:'conserve',label:'CONSERVE YOUR STAMINA',desc:'Recover while the field fights around you.'});
  pool.push({id:'scarce',label:'MAKE YOURSELF SCARCE',desc:'Lower your profile and avoid becoming a target.'});
  pool.push({id:'attack',label:'GO ON THE ATTACK',desc:'Pressure a nearby opponent and drain their stamina.'});
  pool.push({id:'crowd',label:'RALLY THE CROWD',desc:'Build momentum, but risk being caught celebrating.'});
  pool.push({id:'brawl',label:'START A BRAWL',desc:'Create chaos that can damage several wrestlers.'});
  pool.push({id:'letfight',label:'LET THEM FIGHT',desc:'Stay back while the CPU field tears itself apart.'});
  if(p.stamina<45)pool.push({id:'hangon',label:'HANG ON',desc:'Survive an immediate attempt to throw you out.'});
  if(p.stamina>35)pool.push({id:'finisher',label:`GO FOR ${wrestler(p.id).finisher||wrestler(p.id).signature||'YOUR FINISHER'}`,desc:'Create a major elimination opportunity.'});
  if(targets[0]?.stamina<62)pool.push({id:'eliminate',target:targets[0].id,label:`ELIMINATE ${wrestler(targets[0].id).name.toUpperCase()}`,desc:'Attempt to throw out one of the most vulnerable wrestlers.'});
  if(targets[1]?.stamina<50)pool.push({id:'eliminate',target:targets[1].id,label:`ELIMINATE ${wrestler(targets[1].id).name.toUpperCase()}`,desc:'A second vulnerable target is near the ropes.'});
  if(targets.length>3)pool.push({id:'alliance',target:targets[targets.length-1].id,label:`FORM A TEMPORARY ALLIANCE`,desc:`Work briefly with ${wrestler(targets[targets.length-1].id).name}. Betrayal is possible.`});
  if(targets.filter(x=>x.stamina<35).length>=2)pool.push({id:'double',label:'DUMP THEM BOTH',desc:'A rare, high-risk attempt at a double elimination.'});
  const unique=[];shuffle(pool).forEach(x=>{if(unique.length<3&&!unique.some(y=>y.label===x.label))unique.push(x)});return unique;
 }
 function battleRoyalFinalChoices(){const opp=active().find(e=>e.id!==BR.playerId);return shuffle([
  {id:'final-wear',target:opp?.id,label:'WEAR THEM DOWN',desc:'Reduce their stamina before trying to finish it.'},
  {id:'final-send',target:opp?.id,label:`SEND ${wrestler(opp?.id)?.name?.toUpperCase()||'THEM'} OVER`,desc:'Go directly for the winning elimination.'},
  {id:'final-counter',target:opp?.id,label:'COUNTER THEIR CHARGE',desc:'Invite the attack and redirect their momentum.'},
  {id:'crowd',label:'RALLY THE CROWD',desc:'Draw on the audience for one final surge.'},
  {id:'finisher',target:opp?.id,label:`GO FOR ${wrestler(player().id).finisher||'YOUR FINISHER'}`,desc:'Use your biggest weapon to set up the victory.'}
 ]).slice(0,3)}
 function battleRoyalDecisionPanel(){const choices=decisionPool();return `<div class="br-decisions"><small>YOUR CALL</small><h2>${remaining()===2?'HOW DO YOU WIN IT?':'CHOOSE YOUR NEXT MOVE'}</h2>${choices.map((c,i)=>`<button onclick='battleRoyalChoose(${JSON.stringify(c)})'><b>${c.label}</b><span>${c.desc}</span></button>`).join('')}</div>`}

 window.battleRoyalChoose=function(choice){
  if(!BR||player().eliminated)return;BR.round++;active().forEach(e=>e.survival++);
  const p=player(),w=wrestler(p.id),roll=Math.random(),quality=roll>.88?'majorSuccess':roll>.38?'success':roll>.12?'failure':'majorFailure';
  resolvePlayerChoice(choice,quality,w,p);
  if(!p.eliminated&&remaining()>1)cpuRound();
  if(remaining()===1)return finishBattleRoyal();
  battleRoyalRender();
 };
 function fatigue(e,n){e.stamina=clamp(e.stamina+n,0,100)}
 function log(s){BR.log.push(s);BR.log=BR.log.slice(-12)}
 function resolvePlayerChoice(c,q,w,p){
  const target=BR.entrants.find(e=>e.id===c.target&&!e.eliminated),tn=target?wrestler(target.id).name:'';
  if(c.id==='conserve'){if(q==='majorSuccess'){fatigue(p,22);log(`${w.name} disappears into the traffic and recovers valuable stamina.`)}else if(q==='success'){fatigue(p,13);log(`${w.name} conserves energy while the battle continues.`)}else if(q==='failure'){fatigue(p,-5);log(`${w.name}'s recovery is interrupted.`)}else{fatigue(p,-15);log(`${w.name} is trapped in the corner while trying to rest.`)}}
  else if(c.id==='scarce'||c.id==='letfight'){if(q==='majorSuccess'){fatigue(p,8);p.hidden=2;log(`${w.name} stays completely out of danger as the field attacks itself.`)}else if(q==='success'){p.hidden=1;log(`${w.name} wisely lowers their profile.`)}else if(q==='failure'){fatigue(p,-8);log(`${w.name} is spotted and dragged back into the fight.`)}else{fatigue(p,-18);log(`The entire field notices ${w.name} hiding and swarms them.`)}}
  else if(c.id==='attack'||c.id==='final-wear'){const t=target||pick(vulnerableTargets());if(t){const dmg=q==='majorSuccess'?28:q==='success'?18:q==='failure'?8:-12;if(dmg>=0){fatigue(t,-dmg);log(`${w.name} unloads on ${wrestler(t.id).name}, draining ${dmg} stamina.`)}else{fatigue(p,dmg);log(`${wrestler(t.id).name} counters ${w.name}'s attack.`)}}}
  else if(c.id==='crowd'){if(q==='majorSuccess'){fatigue(p,14);p.momentum=(p.momentum||0)+2;log(`The crowd erupts and ${w.name} finds a second wind.`)}else if(q==='success'){fatigue(p,7);p.momentum=(p.momentum||0)+1;log(`${w.name} feeds off the crowd.`)}else{fatigue(p,q==='failure'?-9:-18);log(`${w.name} is attacked while playing to the audience.`)}}
  else if(c.id==='finisher'){const t=target||pick(vulnerableTargets());if(t){if(q==='majorSuccess'){fatigue(t,-36);log(`${w.name} hits ${w.finisher||w.signature}! ${wrestler(t.id).name} is left near elimination.`)}else if(q==='success'){fatigue(t,-25);fatigue(p,-5);log(`${w.name} lands the finisher but spends valuable energy.`)}else if(q==='failure'){fatigue(p,-12);log(`${wrestler(t.id).name} escapes the finisher.`)}else{fatigue(p,-24);log(`${w.name}'s finisher is reversed into a dangerous position.`);attemptCpuEliminate(t,p,.38)}}}
  else if(c.id==='eliminate'||c.id==='final-send'){attemptPlayerEliminate(target,q,c.id==='final-send')}
  else if(c.id==='hangon'||c.id==='final-counter'){if(q==='majorSuccess'){fatigue(p,8);const t=pick(vulnerableTargets());if(t)fatigue(t,-20);log(`${w.name} hangs on and turns defence into a counterattack.`)}else if(q==='success'){fatigue(p,-5);log(`${w.name} survives by inches.`)}else if(q==='failure'){fatigue(p,-18);log(`${w.name} barely escapes elimination.`)}else eliminate(p,pick(active().filter(e=>e.id!==p.id)),'A desperate escape fails.')}
  else if(c.id==='brawl'){const others=shuffle(active().filter(e=>e.id!==p.id)).slice(0,4);if(q==='majorSuccess'){others.forEach(e=>fatigue(e,-18));log(`${w.name} cleans house and four opponents are rocked.`)}else if(q==='success'){others.forEach(e=>fatigue(e,-10));fatigue(p,-6);log(`${w.name} starts a wild brawl.`)}else{fatigue(p,q==='failure'?-14:-25);log(`${w.name} loses control of the chaos.`)}}
  else if(c.id==='alliance'){const t=target||pick(active().filter(e=>e.id!==p.id));if(q==='majorSuccess'){const victim=pick(active().filter(e=>![p.id,t.id].includes(e.id)));if(victim){fatigue(victim,-28);log(`${w.name} and ${wrestler(t.id).name} combine to overwhelm ${wrestler(victim.id).name}.`)}}else if(q==='success'){fatigue(t,5);fatigue(p,4);log(`A temporary alliance gives ${w.name} breathing room.`)}else{fatigue(p,q==='failure'?-12:-24);log(`${wrestler(t.id).name} betrays ${w.name} without warning.`)}}
  else if(c.id==='double'){const ts=vulnerableTargets().slice(0,2);if(q==='majorSuccess'&&ts.length===2){ts.forEach(t=>eliminate(t,p,'Double elimination!'));log(`${w.name} dumps two wrestlers at once!`)}else if(q==='success'){ts.forEach(t=>fatigue(t,-20));log(`${w.name} nearly pulls off a double elimination.`)}else{fatigue(p,q==='failure'?-18:-30);log(`The double elimination attempt collapses and ${w.name} is punished.`);if(q==='majorFailure'&&Math.random()<.35)eliminate(p,pick(ts),'Both targets turn on the player.')}}
 }
 function attemptPlayerEliminate(t,q,final){if(!t)return;const p=player(),pw=wrestler(p.id),tw=wrestler(t.id),base=.25+(100-t.stamina)/150+(score(pw)-score(tw))/300+(final ? .12 : 0);let chance=clamp(base,0.12,.9);if(q==='majorSuccess')chance+=.28;if(q==='success')chance+=.08;if(q==='failure')chance-=.18;if(q==='majorFailure')chance-=.35;if(Math.random()<chance){eliminate(t,p,`${pw.name} completes the elimination.`)}else if(q==='majorFailure'){fatigue(p,-24);log(`${tw.name} reverses the elimination attempt on ${pw.name}.`);if(Math.random()<clamp((100-p.stamina)/120,.1,.65))eliminate(p,t,'The reversal sends the player over the top rope.')}else{fatigue(t,-12);fatigue(p,-8);log(`${tw.name} survives ${pw.name}'s elimination attempt.`)}}
 function cpuRound(){
  const list=shuffle(active().filter(e=>e.id!==BR.playerId));
  list.forEach(e=>{if(e.eliminated)return;e.hidden=Math.max(0,(e.hidden||0)-1);const targets=active().filter(t=>t.id!==e.id&&!t.hidden);if(!targets.length)return;const t=pick(targets);const aggression=.35+(100-e.stamina)/400;if(Math.random()<aggression&&t.stamina<58){attemptCpuEliminate(e,t,.12)}else{fatigue(t,-(3+Math.random()*9));if(Math.random()<.12)fatigue(e,3)}});
  const p=player();if(!p.eliminated&&!p.hidden){const attackers=active().filter(e=>e.id!==p.id);const targetChance=.10+(100-p.stamina)/500;if(Math.random()<targetChance&&p.stamina<45)attemptCpuEliminate(pick(attackers),p,.05)}
 }
 function attemptCpuEliminate(attacker,target,bonus=0){if(!attacker||!target||attacker.eliminated||target.eliminated)return;const aw=wrestler(attacker.id),tw=wrestler(target.id);let chance=.08+(100-target.stamina)/170+(score(aw)-score(tw))/420+bonus;chance=clamp(chance,.03,.72);if(Math.random()<chance)eliminate(target,attacker,`${aw.name} throws ${tw.name} over the top rope.`);else{fatigue(target,-5);fatigue(attacker,-4);if(Math.random()<.18)log(`${tw.name} hangs on after ${aw.name}'s elimination attempt.`)}}
 function eliminate(victim,by,reason){if(!victim||victim.eliminated)return;victim.eliminated=true;victim.place=remaining()+1;victim.stamina=0;if(by&&by.id!==victim.id)by.eliminations++;BR.eliminationOrder.push({id:victim.id,by:by?.id||null,place:victim.place,round:BR.round});const text=`${wrestler(victim.id).name}${by?` · eliminated by ${wrestler(by.id).name}`:''}`;log(reason||text);BR.flash={text};setTimeout(()=>{if(BR){BR.flash=null;battleRoyalRender()}},900)}
 function finishBattleRoyal(){const win=active()[0];if(!win)return;win.place=1;BR.finished=true;const most=[...BR.entrants].sort((a,b)=>b.eliminations-a.eliminations)[0],longest=[...BR.entrants].sort((a,b)=>b.survival-a.survival)[0];histSave({date:new Date().toISOString(),winner:win.id,player:BR.playerId,playerPlace:player().place,playerEliminations:player().eliminations,mostEliminations:most.eliminations,mostEliminationsId:most.id,longestSurvivalId:longest.id,rounds:BR.round,order:BR.eliminationOrder});battleRoyalResults()}
 window.battleRoyalWatchRound=function(){if(!BR||BR.finished)return;BR.round++;active().forEach(e=>e.survival++);cpuRound();if(remaining()===1)finishBattleRoyal();else battleRoyalRender()};
 window.battleRoyalSimToWinner=function(){let guard=0;while(BR&&!BR.finished&&remaining()>1&&guard++<250){BR.round++;active().forEach(e=>e.survival++);cpuRound();if(remaining()===1)finishBattleRoyal()}if(!BR.finished&&remaining()===1)finishBattleRoyal();else battleRoyalRender()};
 window.battleRoyalResults=function(){if(!BR)return battleRoyalHome();const win=active()[0]||BR.entrants.find(e=>e.place===1),p=player(),most=[...BR.entrants].sort((a,b)=>b.eliminations-a.eliminations)[0],longest=[...BR.entrants].sort((a,b)=>b.survival-a.survival)[0];render(`<section class="panel br-results"><div class="tv-kicker">BATTLE ROYAL RESULT</div><h1>${wrestler(win.id).name} WINS</h1><div class="br-winner">${imageWithFallback(wrestler(win.id),'victory','art-full','resultVictory')}<div><small>LAST WRESTLER STANDING</small><b>${wrestler(win.id).name}</b><span>${win.eliminations} eliminations · survived ${win.survival} rounds</span></div></div><div class="br-result-stats"><article><small>YOUR FINISH</small><b>#${p.place}</b><span>${p.eliminations} eliminations</span></article><article><small>MOST ELIMINATIONS</small><b>${wrestler(most.id).name}</b><span>${most.eliminations}</span></article><article><small>LONGEST SURVIVAL</small><b>${wrestler(longest.id).name}</b><span>${longest.survival} rounds</span></article></div><h2>ELIMINATION ORDER</h2><div class="br-order">${[...BR.eliminationOrder].reverse().map(x=>`<span><b>#${x.place}</b>${wrestler(x.id).name}<small>${x.by?`by ${wrestler(x.by).name}`:'—'}</small></span>`).join('')}<span><b>#1</b>${wrestler(win.id).name}<small>WINNER</small></span></div><div class="br-result-actions"><button class="btn live-primary" onclick="battleRoyalStart('${BR.playerId}')">RUN IT BACK</button><button class="btn secondary" onclick="battleRoyalChooseWrestler()">CHOOSE ANOTHER WRESTLER</button><button class="btn secondary" onclick="home()">MAIN MENU</button></div></section>`)};
 window.battleRoyalHistory=function(){const h=histLoad();render(`<section class="panel br-history">${shellBack()}<div class="tv-kicker">STANDALONE RECORD BOOK</div><h1>BATTLE ROYAL HISTORY</h1>${h.length?`<div class="br-history-list">${h.map((r,i)=>`<article><b>${i+1}. ${wrestler(r.winner)?.name||r.winner}</b><span>Winner · ${r.mostEliminations} most eliminations · ${r.rounds} rounds</span><small>You finished #${r.playerPlace} with ${r.playerEliminations} eliminations</small></article>`).join('')}</div>`:'<p>No completed Battle Royals yet.</p>'}<button class="btn live-primary" onclick="battleRoyalHome()">BACK</button></section>`)};
 window.battleRoyalConfirmExit=function(){if(confirm('Leave this Battle Royal and lose the current match?')){BR=null;home()}};
 setTimeout(installMenuButton,0);
})();

/* ============================================================
   LEGACY PRO WRESTLING 8.5.1 HOTFIX — RANKINGS & RECORDS
   Fixes #99 fallback rankings, records AI match results, repairs
   existing Career saves, and corrects first-show grammar.
   ============================================================ */
(function(){
 const HOTFIX_VERSION='8.5.1-hotfix';

 function hfChampionIds(c){return new Set(Object.values(c?.championships||{}).flat().filter(Boolean))}
 function hfContenders(c){const champs=hfChampionIds(c);return WRESTLERS.filter(w=>!champs.has(w.id))}
 function hfCareer(c,id){
  c.livingCareers=c.livingCareers||{};
  return c.livingCareers[id]||(c.livingCareers[id]={id,wins:0,losses:0,streak:0,momentum:50,popularity:20,status:'Active',history:[],monthsControlled:0,monthsAI:0});
 }
 function hfHistoryRecord(c,id){
  let wins=0,losses=0;
  for(const h of Array.isArray(c?.history)?c.history:[]){
   if(id===c.active){if(h?.win===true)wins++;else if(h?.win===false)losses++}
   if(h?.opponent===id){if(h?.win===true)losses++;else if(h?.win===false)wins++}
  }
  return {wins,losses};
 }
 function hfEnsureRankings(c){
  if(!c)return c;
  const contenders=hfContenders(c),old=new Map((Array.isArray(c.rankings)?c.rankings:[]).map(r=>[r.id,r]));
  const validIds=new Set(contenders.map(w=>w.id));
  const needsRepair=!Array.isArray(c.rankings)||c.rankings.length!==contenders.length||c.rankings.some(r=>!validIds.has(r.id));
  if(needsRepair){
   const ordered=[...contenders].sort((a,b)=>(b.overall-a.overall)||a.name.localeCompare(b.name));
   const activeIndex=ordered.findIndex(w=>w.id===c.active);
   if(activeIndex>=0&&!old.has(c.active)){const [active]=ordered.splice(activeIndex,1);ordered.splice(Math.floor(ordered.length*.52),0,active)}
   c.rankings=ordered.map((w,i)=>{
    const prior=old.get(w.id),career=hfCareer(c,w.id),hist=hfHistoryRecord(c,w.id);
    const wins=Math.max(Number(prior?.wins)||0,Number(career.wins)||0,hist.wins);
    const losses=Math.max(Number(prior?.losses)||0,Number(career.losses)||0,hist.losses);
    career.wins=wins;career.losses=losses;
    return {id:w.id,points:Number.isFinite(Number(prior?.points))?Number(prior.points):100-i*3,wins,losses};
   });
  }else{
   c.rankings.forEach(row=>{
    const career=hfCareer(c,row.id),hist=hfHistoryRecord(c,row.id);
    row.wins=Math.max(Number(row.wins)||0,Number(career.wins)||0,hist.wins);
    row.losses=Math.max(Number(row.losses)||0,Number(career.losses)||0,hist.losses);
    career.wins=row.wins;career.losses=row.losses;
   });
  }
  return c;
 }
 function hfApplyResult(c,winnerId,loserId,points=true){
  if(!c||!winnerId||!loserId||winnerId===loserId)return;
  hfEnsureRankings(c);
  const winner=c.rankings.find(r=>r.id===winnerId),loser=c.rankings.find(r=>r.id===loserId);
  const wc=hfCareer(c,winnerId),lc=hfCareer(c,loserId);
  if(winner){winner.wins=(Number(winner.wins)||0)+1;if(points)winner.points=Math.max(0,(Number(winner.points)||0)+5)}
  if(loser){loser.losses=(Number(loser.losses)||0)+1;if(points)loser.points=Math.max(0,(Number(loser.points)||0)-3)}
  wc.wins=(Number(wc.wins)||0)+1;lc.losses=(Number(lc.losses)||0)+1;
 }
 function hfApplyWorldStories(c){
  if(!c?.world)return;
  const stories=Array.isArray(c.world.worldStories)?c.world.worldStories:[];
  stories.forEach((s,index)=>{
   if(!s||s._recordsApplied||!s.winner||!s.a||!s.b)return;
   const loser=s.winner===s.a?s.b:s.a;
   hfApplyResult(c,s.winner,loser,true);
   s._recordsApplied=true;
  });
 }
 function hfRepair(c){hfEnsureRankings(c);hfApplyWorldStories(c);return c}

 /* Replace the broken #99 fallback with the actual contender table. */
 currentRank=function(c){
  try{
   hfRepair(c);
   const rows=[...c.rankings].sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0));
   const i=rows.findIndex(x=>x.id===c.active);
   return i>=0?i+1:Math.max(1,rows.length);
  }catch(_){return 1}
 };

 /* Preserve records whenever roster expansion forces rankings to be reseeded. */
 const seed0=lpw837SeedRankings;
 lpw837SeedRankings=function(c,force=false){
  if(!c)return c;
  hfEnsureRankings(c);
  if(force)return seed0(c,true),hfRepair(c);
  return hfRepair(c);
 };
 lpw8Rankings=function(c){hfRepair(c);return [...c.rankings].sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0))};

 /* Every simulated AI match now updates both rankings and living-career records. */
 const simulate0=liveSimulateWorld;
 liveSimulateWorld=function(c){
  const stories=simulate0(c)||[];
  hfApplyWorldStories(c);
  liveSave(c);
  return stories;
 };

 /* Repair existing saves before the affected screens render. */
 const recap0=gauntletLiveWorldRecap;
 gauntletLiveWorldRecap=function(){const c=liveLoad();if(c){hfRepair(c);liveSave(c)}return recap0()};
 const rankings0=lpw8RankingScreen;
 lpw8RankingScreen=function(){const c=liveLoad();if(c){hfRepair(c);liveSave(c)}return rankings0()};
 const calendar0=gauntletLiveCalendar;
 gauntletLiveCalendar=function(){const c=liveLoad();if(c){hfRepair(c);liveSave(c)}return calendar0()};

 /* Correct the two first-show grammar lines without disturbing the layout. */
 const intro0=gauntletLiveShowIntro;
 gauntletLiveShowIntro=function(){
  const result=intro0();
  document.querySelectorAll('.show-card-list li').forEach(li=>{
   li.textContent=li.textContent.replace(' makes an LPW debut tonight.',' makes his LPW debut tonight.').replace(' is expected to make a presence felt tonight.',' is expected to make his presence felt tonight.');
  });
  return result;
 };

 window.LPW_HOTFIX_VERSION=HOTFIX_VERSION;
})();

/* ============================================================
   LEGACY PRO WRESTLING 8.5.2 HOTFIX — RESULT ORIENTATION
   Stores AI result stories winner-first, repairs saves affected by
   reversed AI records, and forces World Recap to show the real rank.
   ============================================================ */
(function(){
 const HOTFIX_KEY='lpw852ResultOrientation';
 function career(c,id){
  c.livingCareers=c.livingCareers||{};
  return c.livingCareers[id]||(c.livingCareers[id]={id,wins:0,losses:0,streak:0,momentum:50,popularity:20,status:'Active',history:[],monthsControlled:0,monthsAI:0});
 }
 function row(c,id){return Array.isArray(c.rankings)?c.rankings.find(r=>r.id===id):null}
 function adjust(obj,key,delta){if(obj)obj[key]=Math.max(0,(Number(obj[key])||0)+delta)}
 function realRank(c){
  const rows=Array.isArray(c?.rankings)?[...c.rankings].sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0)):[];
  const index=rows.findIndex(r=>r.id===c.active);
  return index>=0?index+1:Math.max(1,rows.length||1);
 }
 function normalizeStories(c,repairRecords){
  const stories=Array.isArray(c?.world?.worldStories)?c.world.worldStories:[];
  stories.forEach(s=>{
   if(!s?.winner||!s.a||!s.b)return;
   if(s.a!==s.winner){
    const oldA=s.a,oldB=s.b;
    if(repairRecords&&!s._orientationRecordsRepaired){
     /* The previous build credited the first stored participant rather
        than the declared winner. Transfer that single result. */
     const oldARow=row(c,oldA),oldBRow=row(c,oldB),oldACareer=career(c,oldA),oldBCareer=career(c,oldB);
     adjust(oldARow,'wins',-1);adjust(oldARow,'losses',1);
     adjust(oldBRow,'losses',-1);adjust(oldBRow,'wins',1);
     adjust(oldACareer,'wins',-1);adjust(oldACareer,'losses',1);
     adjust(oldBCareer,'losses',-1);adjust(oldBCareer,'wins',1);
     s._orientationRecordsRepaired=true;
    }
    s.a=s.winner;s.b=oldA;
   }
   s._recordsApplied=true;
  });
 }

 const sim=liveSimulateWorld;
 liveSimulateWorld=function(c){
  const stories=sim(c)||[];
  normalizeStories(c,false);
  return stories;
 };

 const recap=gauntletLiveWorldRecap;
 gauntletLiveWorldRecap=function(){
  const c=liveLoad();
  if(c){
   const alreadyFixed=c.world?.[HOTFIX_KEY]===true;
   normalizeStories(c,!alreadyFixed);
   c.world=c.world||{};c.world[HOTFIX_KEY]=true;
   liveSave(c);
  }
  const result=recap();
  setTimeout(()=>{
   const latest=liveLoad(),rank=latest?realRank(latest):1;
   document.querySelectorAll('.lpw837-recap-cards b').forEach(el=>{
    if(/^RANKED #(?:99|\d+)$/.test(el.textContent.trim()))el.textContent=`RANKED #${rank}`;
   });
  },0);
  return result;
 };

 const rankingScreen=lpw8RankingScreen;
 lpw8RankingScreen=function(){
  const c=liveLoad();if(c){normalizeStories(c,c.world?.[HOTFIX_KEY]!==true);c.world=c.world||{};c.world[HOTFIX_KEY]=true;liveSave(c)}
  return rankingScreen();
 };
})();

/* ============================================================
   LEGACY PRO WRESTLING 8.5.3 — CAREER RECORD INTEGRITY HOTFIX
   One authoritative player record, single-application AI results,
   live recap ranking, Camera Focus removal, and Noah Grant polish.
   ============================================================ */
(function(){
 const BUILD='8.5.3';
 const dayKey=c=>`${Number(c?.month)||1}:${Number(c?.week)||1}:${Number(c?.day)||0}`;
 function career(c,id){
  c.livingCareers=c.livingCareers||{};
  return c.livingCareers[id]||(c.livingCareers[id]={id,wins:0,losses:0,streak:0,lastResult:null,momentum:50,popularity:20,rival:null,status:'Active',history:[],monthsControlled:0,monthsAI:0});
 }
 function rankingRow(c,id){return Array.isArray(c?.rankings)?c.rankings.find(r=>r.id===id):null}
 function activeHistoryRecord(c){
  let wins=0,losses=0;
  for(const h of Array.isArray(c?.history)?c.history:[]){
   if(h?.win===true)wins++;
   else if(h?.win===false)losses++;
  }
  return {wins,losses,total:wins+losses};
 }
 function reconcileActive(c){
  if(!c?.active)return c;
  const exact=activeHistoryRecord(c),x=career(c,c.active),row=rankingRow(c,c.active);
  /* Career history is the authoritative source for the user-controlled wrestler. */
  c.wins=exact.wins;c.losses=exact.losses;
  x.wins=exact.wins;x.losses=exact.losses;
  if(row){row.wins=exact.wins;row.losses=exact.losses}
  return c;
 }
 function sortedRankings(c){
  reconcileActive(c);
  return [...(Array.isArray(c?.rankings)?c.rankings:[])].sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0)||String(a.id).localeCompare(String(b.id)));
 }
 function actualRank(c){
  const rows=sortedRankings(c),i=rows.findIndex(r=>r.id===c.active);
  return i>=0?i+1:Math.max(1,rows.length||1);
 }
 function applyAIResult(c,winnerId,loserId,key){
  if(!winnerId||!loserId||winnerId===loserId||winnerId===c.active||loserId===c.active)return;
  c.world=c.world||{};c.world.resultLedger=c.world.resultLedger||{};
  if(c.world.resultLedger[key])return;
  const w=career(c,winnerId),l=career(c,loserId),wr=rankingRow(c,winnerId),lr=rankingRow(c,loserId);
  w.wins=(Number(w.wins)||0)+1;l.losses=(Number(l.losses)||0)+1;
  w.streak=Math.max(1,(Number(w.streak)||0)+1);l.streak=Math.min(-1,(Number(l.streak)||0)-1);
  w.lastResult='W';l.lastResult='L';
  w.history=Array.isArray(w.history)?w.history:[];l.history=Array.isArray(l.history)?l.history:[];
  w.history.unshift({month:c.month,week:c.week,day:c.day,opponent:loserId,win:true,source:'WORLD_SIM',key});
  l.history.unshift({month:c.month,week:c.week,day:c.day,opponent:winnerId,win:false,source:'WORLD_SIM',key});
  w.history=w.history.slice(0,60);l.history=l.history.slice(0,60);
  if(wr){wr.wins=w.wins;wr.losses=w.losses;wr.points=Math.max(0,(Number(wr.points)||0)+5)}
  if(lr){lr.wins=l.wins;lr.losses=l.losses;lr.points=Math.max(0,(Number(lr.points)||0)-3)}
  c.world.resultLedger[key]=true;
 }

 /* Generate one factual AI result batch per Career day and record it once. */
 liveSimulateWorld=function(c){
  if(!c)return [];
  c.world=c.world||{};
  const key=dayKey(c);
  if(c.world.worldStoriesDayKey===key&&Array.isArray(c.world.worldStories)&&c.world.worldStories.length)return c.world.worldStories;
  const pool=liveShuffle(liveOtherPool(c)).slice(0,8),stories=[];
  for(let i=0;i+1<pool.length&&stories.length<3;i+=2){
   const first=pool[i],second=pool[i+1],winner=Math.random()<.5?first:second,loser=winner===first?second:first;
   const storyKey=`${key}:${winner.id}>${loser.id}`;
   applyAIResult(c,winner.id,loser.id,storyKey);
   stories.push({a:winner.id,b:loser.id,winner:winner.id,loser:loser.id,_recordsApplied:true,_lpw853Key:storyKey,text:typeof lpwWorldResultText==='function'?lpwWorldResultText(winner,loser):`${winner.name} defeated ${loser.name}.`});
  }
  const newsTemplates=[
   (a,b)=>`Social media erupted after ${a.name} publicly called out ${b.name}.`,
   (a,b)=>`${a.name} and ${b.name} had to be separated backstage.`,
   ()=>`Championship rankings shifted after another unpredictable night.`,
   ()=>`Medical staff confirmed that the roster will be evaluated before the next broadcast.`,
   ()=>`Fans are already debating which match stole the show.`,
   ()=>`Ticket demand increased following the latest LPW broadcast.`
  ];
  if(pool.length>=2){const a=one(pool),b=one(pool.filter(x=>x.id!==a.id));stories.push({a:a.id,b:b.id,text:one(newsTemplates)(a,b)})}
  c.world.worldStories=stories;c.world.worldStoriesDayKey=key;
  stories.forEach(s=>liveAddNews(c,s.text));reconcileActive(c);liveSave(c);return stories;
 };

 /* All ranking consumers now read the same table and exact player record. */
 currentRank=actualRank;
 lpw8Rankings=function(c){return sortedRankings(c)};
 const save0=liveSave;
 liveSave=function(c){if(c)reconcileActive(c);return save0(c)};
 const load0=liveLoad;
 liveLoad=function(){const c=load0();if(c)reconcileActive(c);return c};

 /* Remove Camera Focus wording everywhere without disturbing status text. */
 const render853=render;
 render=function(html){
  return render853(String(html||'')
   .replace(/\s*·\s*CAMERA FOCUS/gi,'')
   .replace(/<small>\s*CURRENT CAMERA FOCUS\s*<\/small>/gi,'<small>ACTIVE WRESTLER</small>')
   .replace(/<small>\s*CAMERA FOCUS\s*<\/small>/gi,'')
   .replace(/>\s*CAMERA FOCUS\s*</gi,'><'));
 };

 /* Ensure affected screens repair and persist before rendering. */
 ['lpw8RankingScreen','gauntletLiveWorldRecap','gauntletLiveCalendar','lpw84Dashboard'].forEach(name=>{
  const prior=window[name];if(typeof prior!=='function')return;
  window[name]=function(){const c=liveLoad();if(c){reconcileActive(c);liveSave(c)}return prior.apply(this,arguments)};
 });

 /* Noah Grant: name first, role beneath in gold. */
 const dev0=lpw836CareerDevelopment;
 lpw836CareerDevelopment=function(){
  const out=dev0();
  setTimeout(()=>{
   document.querySelectorAll('.live-npc-scene.large').forEach(scene=>{
    const name=scene.querySelector('h2'),role=scene.querySelector('small');
    if(name?.textContent.trim()==='Noah Grant'&&role){
     const box=name.parentElement;box.insertBefore(name,role);
     name.style.margin='0 0 6px';role.style.display='block';role.style.color='#f4c542';role.style.fontWeight='800';role.style.letterSpacing='.12em';role.style.textTransform='uppercase';
    }
   });
  },0);return out;
 };

 window.LPW_CAREER_INTEGRITY_VERSION=BUILD;
})();


/* ============================================================
   LEGACY PRO WRESTLING 8.5.4 — SINGLE MATCH ACCOUNTING HOTFIX
   Deduplicates player match history, limits AI wrestlers to one
   result per day, rebuilds records from authoritative histories,
   and removes all remaining Camera Focus labels.
   ============================================================ */
(function(){
 const BUILD='8.5.4';
 const n=v=>Number(v)||0;
 const career=(c,id)=>{c.livingCareers=c.livingCareers||{};return c.livingCareers[id]||(c.livingCareers[id]={id,wins:0,losses:0,streak:0,lastResult:null,momentum:50,popularity:20,status:'Active',history:[],monthsControlled:0,monthsAI:0})};
 const row=(c,id)=>Array.isArray(c?.rankings)?c.rankings.find(r=>r.id===id):null;
 const playerKey=(c,h)=>[n(h?.month)||n(c?.month)||1,n(h?.week),n(h?.day),h?.opponent||'',h?.supercard?'SC':'TV',h?.tournamentRound||''].join(':');
 const aiDayKey=h=>[n(h?.month)||1,n(h?.week),n(h?.day),h?.source||'AI'].join(':');
 function dedupePlayerHistory(c){
  const seen=new Set(),out=[];
  for(const h of Array.isArray(c?.history)?c.history:[]){
   if(h?.win!==true&&h?.win!==false)continue;
   const key=playerKey(c,h);if(seen.has(key))continue;seen.add(key);out.push(h);
  }
  c.history=out.slice(0,60);return out;
 }
 function dedupeCareerHistory(c,id){
  const x=career(c,id),seenExact=new Set(),seenDay=new Set(),out=[];
  for(const h of Array.isArray(x.history)?x.history:[]){
   if(h?.win!==true&&h?.win!==false)continue;
   const exact=[n(h.month)||1,n(h.week),n(h.day),h.opponent||'',h.win?'W':'L',h.source||'AI'].join(':');
   if(seenExact.has(exact))continue;
   const source=String(h.source||'');
   if(source==='WORLD_SIM'){
    const day=aiDayKey(h);if(seenDay.has(day))continue;seenDay.add(day);
   }
   seenExact.add(exact);out.push(h);
  }
  x.history=out.slice(0,60);return out;
 }
 function rebuild(c){
  if(!c)return c;
  const ph=dedupePlayerHistory(c),px=career(c,c.active),pr=row(c,c.active);
  px.wins=ph.filter(h=>h.win===true).length;px.losses=ph.filter(h=>h.win===false).length;
  c.wins=px.wins;c.losses=px.losses;if(pr){pr.wins=px.wins;pr.losses=px.losses}
  for(const id of Object.keys(c.livingCareers||{})){
   if(id===c.active)continue;
   const x=career(c,id),hist=dedupeCareerHistory(c,id);
   if(hist.length){x.wins=hist.filter(h=>h.win===true).length;x.losses=hist.filter(h=>h.win===false).length;const r=row(c,id);if(r){r.wins=x.wins;r.losses=x.losses}}
  }
  return c;
 }
 const load=liveLoad;liveLoad=function(){const c=load();if(c)rebuild(c);return c};
 const save=liveSave;liveSave=function(c){if(c)rebuild(c);return save(c)};
 const cleanDom=()=>document.querySelectorAll('*').forEach(el=>{if(el.children.length===0&&/CAMERA FOCUS/i.test(el.textContent||''))el.textContent=(el.textContent||'').replace(/\s*·?\s*CAMERA FOCUS/gi,'').trim()});
 const r0=render;render=function(html){const out=r0(String(html||'').replace(/\s*·?\s*CAMERA FOCUS/gi,'').replace(/CURRENT CAMERA FOCUS/gi,'ACTIVE WRESTLER'));setTimeout(cleanDom,0);return out};
 ['gauntletLiveCalendar','lpw8RankingScreen','lpw84Dashboard','gauntletLiveStable','gauntletLiveWorldRecap'].forEach(name=>{const prior=window[name];if(typeof prior!=='function')return;window[name]=function(){const c=liveLoad();if(c)liveSave(rebuild(c));const out=prior.apply(this,arguments);setTimeout(cleanDom,0);return out}});
 window.LPW_SINGLE_MATCH_ACCOUNTING_VERSION=BUILD;
})();


/* ============================================================
   LEGACY PRO WRESTLING 8.5.5 — CHAMPIONSHIP PATH HOTFIX
   Protects the World Champion from random simulation, displays
   the champion record, schedules the #1 contender title feud for
   the following month, and defers the March tournament to April
   when a player championship programme takes priority.
   ============================================================ */
(function(){
 const BUILD='8.5.5';
 const career=(c,id)=>{c.livingCareers=c.livingCareers||{};return c.livingCareers[id]||(c.livingCareers[id]={id,wins:0,losses:0,streak:0,lastResult:null,momentum:50,popularity:20,status:'Active',history:[]})};
 const row=(c,id)=>Array.isArray(c?.rankings)?c.rankings.find(r=>r.id===id):null;
 const contenderRows=c=>[...(c?.rankings||[])].filter(r=>r.id!==c?.championships?.world).sort((a,b)=>(Number(b.points)||0)-(Number(a.points)||0)||String(a.id).localeCompare(String(b.id)));
 const contenderRank=(c,id)=>{const i=contenderRows(c).findIndex(r=>r.id===id);return i<0?Math.max(1,contenderRows(c).length):i+1};
 const titleFeudActive=c=>!!(c?.world?.titleFeud&&c.world.titleFeud.month===Number(c.month)&&c.world.titleFeud.challenger===c.active&&c.world.titleFeud.champion===c.championships?.world);
 function stripRandomChampionResults(c){
  if(!c?.championships?.world)return c;
  const id=c.championships.world,x=career(c,id);
  x.history=(Array.isArray(x.history)?x.history:[]).filter(h=>!['WORLD_SIM','AI'].includes(String(h?.source||'').toUpperCase()));
  const legitimate=x.history.filter(h=>h?.win===true||h?.win===false);
  if(legitimate.length){x.wins=legitimate.filter(h=>h.win===true).length;x.losses=legitimate.filter(h=>h.win===false).length;const r=row(c,id);if(r){r.wins=x.wins;r.losses=x.losses}}
  return c;
 }
 function snapshotChampion(c){const id=c?.championships?.world,x=id?career(c,id):null,r=id?row(c,id):null;return id?{id,wins:x.wins,losses:x.losses,streak:x.streak,lastResult:x.lastResult,history:JSON.parse(JSON.stringify(x.history||[])),points:r?.points,rowWins:r?.wins,rowLosses:r?.losses}:null}
 function restoreChampion(c,s){if(!c||!s)return;const x=career(c,s.id),r=row(c,s.id);x.wins=s.wins;x.losses=s.losses;x.streak=s.streak;x.lastResult=s.lastResult;x.history=s.history;if(r){r.points=s.points;r.wins=s.rowWins;r.losses=s.rowLosses}}

 /* The champion is never available to ordinary random opponent or world-story pools. */
 const pool0=liveOtherPool;
 liveOtherPool=function(c,exclude=[]){const blocked=[...(Array.isArray(exclude)?exclude:[exclude])];if(c?.championships?.world)blocked.push(c.championships.world);return pool0(c,[...new Set(blocked)])};

 /* Repair old random champion entries when saves are read or written. */
 const load0=liveLoad;liveLoad=function(){const c=load0();if(c)stripRandomChampionResults(c);return c};
 const save0=liveSave;liveSave=function(c){if(c)stripRandomChampionResults(c);return save0(c)};

 /* Protect the champion from the older month-end inactive-roster simulator. */
 const monthChoice0=gauntletLiveMonthRosterChoice;
 gauntletLiveMonthRosterChoice=function(){
  const before=liveLoad(),snap=snapshotChampion(before);
  if(before&&before.active!==before.championships?.world&&contenderRank(before,before.active)===1){
   before.world=before.world||{};
   before.world.titleFeudNextMonth={month:Number(before.month),challenger:before.active,champion:before.championships.world};
   if(Number(before.month)===3)before.world.tournamentMonth=4;
   liveSave(before);
  }
  const out=monthChoice0.apply(this,arguments);
  const after=liveLoad();if(after&&snap){restoreChampion(after,snap);stripRandomChampionResults(after);liveSave(after)}
  return out;
 };

 /* After the monthly wrestler selection, replace the ordinary feud with the champion when earned. */
 const startMonth0=gauntletLiveStartNextMonth;
 gauntletLiveStartNextMonth=function(id){
  const out=startMonth0.apply(this,arguments),c=liveLoad(),q=c?.world?.titleFeudNextMonth;
  if(c&&q&&q.month===Number(c.month)&&q.challenger===id&&q.champion===c.championships?.world){
   c.world.titleFeud={month:Number(c.month),challenger:id,champion:q.champion,earnedRank:1};
   c.world.titleFeudNextMonth=null;
   c.world.feud={opponent:q.champion,intensity:35,playerWins:0,rivalWins:0,chapter:1,reason:`${liveFounder(id).name} finished the previous month as the #1 contender and now challenges ${liveFounder(q.champion).name} for the LPW World Championship.`};
   liveGenerateMonthlyPlan(c);
   c.world.monthPlan=(c.world.monthPlan||[]).map(item=>{const ids=[...(item?.opponents||[]),item?.partner].filter(Boolean);return ids.includes(q.champion)?{type:'segment',segment:'championship-confrontation',week:item.week,day:item.day}:item});
   liveSave(c);gauntletLiveCalendar();
  }
  return out;
 };

 /* The title feud culminates only at the SuperCard; no random champion match is possible. */
 const begin0=gauntletLiveBeginDay;
 gauntletLiveBeginDay=function(skip=false){
  const c=liveLoad();
  if(c&&titleFeudActive(c)&&liveIsSupercard(c)){
   c.pending={opponent:c.championships.world,isSupercard:true,worldTitle:true,numberOneContenderTitleShot:true,supercardName:liveCurrentSupercard(c)};
   c.world.tournament=c.world.tournament||{titleResolved:false};
   liveSave(c);return gauntletLiveShowIntro();
  }
  return begin0(skip);
 };

 /* Resolve the championship only in the protected title match. */
 const complete0=liveCompleteBroadcast;
 liveCompleteBroadcast=function(win){
  const before=liveLoad(),p=before?.pending?{...before.pending}:null,oldChamp=before?.championships?.world;
  if(before&&p?.worldTitle)before.world.tournament=before.world.tournament||{titleResolved:false};
  const out=complete0(win),c=liveLoad();
  if(c&&p?.worldTitle){
   if(win)c.championships.world=c.active;
   else c.championships.world=oldChamp;
   c.world.titleFeud=null;c.world.titleFeudNextMonth=null;
   if(c.world.tournament){c.world.tournament.titleResolved=true;c.world.tournament.titleWinner=win?c.active:oldChamp}
   liveSave(c);
  }
  return out;
 };

 /* Add the champion's real record to the championship tile. */
 const rankScreen0=lpw8RankingScreen;
 lpw8RankingScreen=function(){
  const out=rankScreen0.apply(this,arguments);
  setTimeout(()=>{
   const c=liveLoad(),champId=c?.championships?.world,x=champId?career(c,champId):null,tile=document.querySelector('.lpw837-champion-tile span');
   if(tile&&x&&!tile.querySelector('.lpw855-champion-record'))tile.insertAdjacentHTML('beforeend',`<em class="lpw855-champion-record">${Number(x.wins)||0}-${Number(x.losses)||0} RECORD</em>`);
  },0);return out;
 };
 window.LPW_CHAMPIONSHIP_PATH_VERSION=BUILD;
})();

/* LEGACY Pro Wrestling 8.6.2 — Collections Bio & Unlock Audit */
(function(){
 const BUILD='8.6.4';
 const UNLOCK_KEY='lpw_unlockables_v1';
 const PENDING_KEY='lpw_pending_unlocks_v1';
 const JETT_CARDS=[
  ['break-their-heart','Break Their Heart','Win your first match as Jett Valentine.'],
  ['heart-of-gold','Heart of Gold','Complete 2 matches as Jett Valentine.'],
  ['one-last-encore','One Last Encore','Build a 2-match winning streak as Jett Valentine.'],
  ['tune-up-the-band','Tune Up the Band','Win a Singles match as Jett Valentine.'],
  ['showstopper','Showstopper','Win 3 matches as Jett Valentine.'],
  ['picture-perfect','Picture Perfect','Earn a match rating of 3 stars or higher as Jett Valentine.'],
  ['feed-off-the-attention','Feed Off the Attention','Win a Tag Team match as Jett Valentine.'],
  ['raise-the-tempo','Raise the Tempo','Complete 5 matches as Jett Valentine.'],
  ['flash-of-brilliance','Flash of Brilliance','Earn a match rating of 4 stars or higher as Jett Valentine.'],
  ['steal-the-spotlight','Steal the Spotlight','Defeat 4 different opponents as Jett Valentine.'],
  ['high-risk','High Risk','Win 6 matches as Jett Valentine.'],
  ['never-misses','Never Misses','Build a 3-match winning streak as Jett Valentine.'],
  ['stolen-moment','Stolen Moment','Complete 10 matches as Jett Valentine.'],
  ['believe-the-hype','Believe the Hype','Win 12 matches as Jett Valentine.'],
  ['heartbreaker','Heartbreaker','Complete 20 matches as Jett Valentine.']
 ];
 const LOCATIONS={
  'jack-mercer':'Austin, Texas','victor-royale':'Greenwich, Connecticut','jett-valentine':'San Antonio, Texas','revenant':'Death Valley','nightwatch':'Venice Beach, California','titan':'Miami, Florida','mason-marks':'Calgary, Alberta','hollowman':'Parts Unknown','damian-black':'St. Louis, Missouri','elias-crowe':'Long Island, New York','el-rey-del-cielo':'Mexico City, Mexico','max-justice':'Boston, Massachusetts','primal':'Washington, D.C.','lucas-bennett':'Pittsburgh, Pennsylvania','marcus-king':'Harlem, New York','mateo-vega':'El Paso, Texas','ryder-phoenix':'Winnipeg, Manitoba','sterling-sinclair':'Charlotte, North Carolina','dave-maddox':'Atlanta, Georgia','logan-steele':'Tampa, Florida',
  'ace-riot':'Chicago, Illinois','axel-voss':'Berlin, Germany','bianca-balboa':'New York City, New York','chloe-carter':'Orlando, Florida','jasmine-monroe':'Knoxville, Tennessee','kaori-mizuno':'Tokyo, Japan','valkyrie-hale':'Adelaide, Australia','sienna':'Norwich, England'
 };
 const SIZES={
  'jett-valentine':['6\'1\"','225 lb'],'jack-mercer':['6\'2\"','252 lb'],'victor-royale':['6\'4\"','270 lb'],'revenant':['6\'9\"','315 lb'],'nightwatch':['6\'3\"','255 lb'],'titan':['6\'5\"','275 lb'],'mason-marks':['6\'0\"','235 lb'],'hollowman':['6\'8\"','326 lb'],'damian-black':['6\'3\"','245 lb'],'elias-crowe':['6\'2\"','287 lb'],'el-rey-del-cielo':['5\'6\"','175 lb'],'max-justice':['6\'1\"','251 lb'],'primal':['6\'5\"','290 lb'],'lucas-bennett':['6\'1\"','238 lb'],'marcus-king':['6\'3\"','250 lb'],'mateo-vega':['5\'9\"','228 lb'],'ryder-phoenix':['6\'0\"','227 lb'],'sterling-sinclair':['6\'1\"','243 lb'],'dave-maddox':['6\'4\"','248 lb'],'logan-steele':['6\'7\"','302 lb']
 };
 function profileData(w){
  const size=SIZES[w.id]||[w.power>=90?'6\'4\"':w.speed>=90?'5\'10\"':'6\'1\"',w.power>=90?'275 lb':w.speed>=90?'205 lb':'235 lb'];
  const style=(typeof profileFor==='function'?profileFor(w).archetype:'Professional Wrestler');
  const raw=(BIOS[w.id]||'').replace(/Tag Team Gauntlet|the Gauntlet|Gauntlet/gi,'LPW').replace(/Founding Twenty|founding wrestler/gi,'LPW roster member').trim();
  const opener=raw||`${w.name} has established a distinct identity within the LPW roster.`;
  const bio=`${opener} ${w.name} approaches every contest with a style built around ${style.toLowerCase()}, combining personality and ring awareness with the ability to create a decisive opening. ${w.signature} remains the move opponents fear most, while the pursuit of bigger matches and championship success continues to shape every appearance in LPW.`;
  return {height:size[0],weight:size[1],from:LOCATIONS[w.id]||'United States',style,bio};
 }
 function unlocked(){try{return JSON.parse(localStorage.getItem(UNLOCK_KEY)||'{}')}catch(e){return {}}}
 function saveUnlocked(x){try{localStorage.setItem(UNLOCK_KEY,JSON.stringify(x))}catch(e){}}
 function pending(){try{return JSON.parse(sessionStorage.getItem(PENDING_KEY)||'[]')}catch(e){return []}}
 function savePending(x){try{sessionStorage.setItem(PENDING_KEY,JSON.stringify(x))}catch(e){}}
 function jettProgress(){try{return JSON.parse(localStorage.getItem('lpw_jett_unlock_progress_v2')||'{"singlesWins":0,"tagWins":0,"opponents":[],"bestStreak":0}')}catch(e){return {singlesWins:0,tagWins:0,opponents:[],bestStreak:0}}}
 function saveJettProgress(p){try{localStorage.setItem('lpw_jett_unlock_progress_v2',JSON.stringify(p))}catch(e){}}
 function jettStats(){const s=loadStats(),j=s.wrestlers?.['jett-valentine']||{matches:0,wins:0,losses:0};const p=jettProgress();return {matches:j.matches||0,wins:j.wins||0,rating:s.highestRated?.rating||0,singlesWins:p.singlesWins||0,tagWins:p.tagWins||0,opponents:(p.opponents||[]).length,bestStreak:Math.max(p.bestStreak||0,s.bestWinStreak||0)};}
 function requirementMet(id,st){switch(id){
  case'break-their-heart':return st.wins>=1;
  case'heart-of-gold':return st.matches>=2;
  case'one-last-encore':return st.bestStreak>=2;
  case'tune-up-the-band':return st.singlesWins>=1;
  case'showstopper':return st.wins>=3;
  case'picture-perfect':return st.rating>=3;
  case'feed-off-the-attention':return st.tagWins>=1;
  case'raise-the-tempo':return st.matches>=5;
  case'flash-of-brilliance':return st.rating>=4;
  case'steal-the-spotlight':return st.opponents>=4;
  case'high-risk':return st.wins>=6;
  case'never-misses':return st.bestStreak>=3;
  case'stolen-moment':return st.matches>=10;
  case'believe-the-hype':return st.wins>=12;
  case'heartbreaker':return st.matches>=20;
  default:return false}}
 function trackJettUnlockProgress(win){
  if(!M||!S||!Array.isArray(S.team)||!S.team.some(w=>w.id==='jett-valentine'))return;
  const p=jettProgress(),singles=isSinglesMatch();
  if(win){if(singles)p.singlesWins=(p.singlesWins||0)+1;else p.tagWins=(p.tagWins||0)+1}
  p.bestStreak=Math.max(p.bestStreak||0,loadStats().currentStreak||0);
  p.opponents=[...new Set([...(p.opponents||[]),...((S.opp||[]).map(w=>w.id).filter(Boolean))])];
  saveJettProgress(p);
 }
 function auditUnlocks(){const u=unlocked(),st=jettStats(),newOnes=[];JETT_CARDS.forEach(c=>{const key='jett-valentine.'+c[0];if(!u[key]&&requirementMet(c[0],st)){u[key]={unlockedAt:new Date().toISOString()};newOnes.push(c[0])}});if(newOnes.length){saveUnlocked(u);savePending([...pending(),...newOnes])}return newOnes}
 window.lpwShowUnlockCelebration=function(returnAction='collectionProfile(\'jett-valentine\',\'unlockables\')'){
  const q=pending();if(!q.length){eval(returnAction);return}const id=q.shift();savePending(q);const c=JETT_CARDS.find(x=>x[0]===id);
  render(`<section class="panel unlock-celebration"><div class="unlock-rays"></div><div class="tv-kicker">NEW UNLOCKABLE</div><h1>${c[1]}</h1><div class="unlock-celebration-card foil-card"><img src="assets/decisions/jett-valentine/${id}.webp" alt="${c[1]}"><i></i></div><p>${c[2]}</p><div class="live-result-actions"><button class="btn live-primary" onclick="collectionProfile('jett-valentine','unlockables')">VIEW IN COLLECTION</button><button class="btn secondary" onclick="${q.length?`lpwShowUnlockCelebration(\`${returnAction}\`)`:returnAction}">CONTINUE</button></div></section>`)
 };
 const originalRecord=recordCompletedMatch;recordCompletedMatch=function(win,rating){originalRecord(win,rating);trackJettUnlockProgress(win);auditUnlocks()};
 const originalRender=render;render=function(x){originalRender(x);setTimeout(()=>{
  if(!pending().length)return;const result=document.querySelector('.match-result,.live-day-complete');if(!result||result.dataset.unlockHooked)return;result.dataset.unlockHooked='1';const btn=[...result.querySelectorAll('button')].find(b=>/CONTINUE|NEXT|CALENDAR|REWARD/i.test(b.textContent));if(btn){const action=btn.getAttribute('onclick')||'home()';btn.setAttribute('onclick',`lpwShowUnlockCelebration(\`${action.replace(/`/g,'')}\`)`)}
 },0)};
 window.collection=function(){setActiveGameMode(ACTIVE_GAME_MODE==='career'?'career':'home');const managers=Object.values(SUPPORT_CAST).filter(x=>x.group==='Managers'),broadcast=Object.values(SUPPORT_CAST).filter(x=>x.group==='Broadcast Team');const supportTiles=list=>list.map(x=>`<article class="collection-tile support-tile">${npcImage(x.id,'full')}<span><small>${x.role}</small><b>${x.name}</b></span></article>`).join('');render(`<section class="collection-screen">${shellBack()}<header class="section-heading"><div><h1>CHARACTER DATABASE</h1><p>Wrestlers, managers and the broadcast team.</p></div></header><h2 class="collection-section-title">WRESTLERS</h2><div class="collection-grid standardized-collection">${[...WRESTLERS].sort((a,b)=>a.name.replace(/["']/g,'').localeCompare(b.name.replace(/["']/g,''))).map(w=>`<button class="collection-tile" onclick="collectionProfile('${w.id}')"><div class="collection-waist-crop">${imageWithFallback(w,'full','art-full','collection')}</div><span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div><h2 class="collection-section-title">MANAGERS</h2><div class="collection-grid support-grid">${supportTiles(managers)}</div><h2 class="collection-section-title">BROADCAST TEAM</h2><div class="collection-grid support-grid">${supportTiles(broadcast)}</div></section>`)};
 window.collectionProfile=function(id,tab='profile'){const w=WRESTLERS.find(x=>x.id===id);if(!w)return collection();const d=profileData(w),u=unlocked();const unlockBody=id==='jett-valentine'?`<div class="unlockables-grid">${JETT_CARDS.map(c=>{const on=!!u['jett-valentine.'+c[0]];return `<button class="unlockable-card ${on?'unlocked foil-card':'locked'}" ${on?`onclick="lpwOpenUnlockable('${c[0]}')"`:''}><img src="assets/decisions/jett-valentine/${c[0]}.webp" alt="${c[1]}"><i></i><span><b>${c[1]}</b><small>${on?'UNLOCKED':c[2]}</small></span></button>`}).join('')}</div>`:`<div class="unlockables-coming"><h2>COMING SOON</h2><p>Unlockable artwork for ${w.name} will be added in a future update.</p></div>`;
 render(`<section class="profile-screen redesigned-profile"><div class="profile-nav"><button class="shell-back" onclick="collection()">← COLLECTION</button></div><div class="profile-tabs"><button class="${tab==='profile'?'active':''}" onclick="collectionProfile('${id}','profile')">PROFILE</button><button class="${tab==='unlockables'?'active':''}" onclick="collectionProfile('${id}','unlockables')">UNLOCKABLES</button></div>${tab==='profile'?`<div class="profile-art image-framework-profile">${imageWithFallback(w,'full','art-full','profile')}</div><div class="profile-copy"><small>${w.title}</small><h1>${w.name}</h1><div class="profile-signature"><span>SIGNATURE MOVE</span><b>${w.signature}</b></div><p>${d.bio}</p><div class="profile-facts modern"><div><small>HEIGHT</small><b>${d.height}</b></div><div><small>WEIGHT</small><b>${d.weight}</b></div><div><small>FROM</small><b>${d.from}</b></div><div><small>STYLE</small><b>${d.style}</b></div></div></div>`:`<div class="profile-copy unlockables-panel"><small>${w.title}</small><h1>${w.name}</h1>${unlockBody}</div>`}</section>`)};
 window.lpwOpenUnlockable=function(id){const c=JETT_CARDS.find(x=>x[0]===id);if(!c)return;overlay.innerHTML=`<div class="overlay unlock-lightbox" onclick="if(event.target===this)this.innerHTML='' "><div><button onclick="overlay.innerHTML=''">×</button><div class="foil-card"><img src="assets/decisions/jett-valentine/${id}.webp" alt="${c[1]}"><i></i></div><h2>${c[1]}</h2></div></div>`};
 const careerHome=gauntletLiveHome;gauntletLiveHome=function(){setActiveGameMode('career');const r=careerHome();setTimeout(()=>{const menu=document.querySelector('.live-mode-actions,.live-home-actions,.hub-menu');if(menu&&!menu.querySelector('.lpw-collection-link'))menu.insertAdjacentHTML('beforeend','<button class="btn secondary lpw-collection-link" onclick="collection()">COLLECTION</button>')},0);return r};
 document.querySelectorAll('.build-tag').forEach(x=>x.textContent='VERSION '+BUILD);
 window.LPW_COLLECTIONS_VERSION=BUILD;
})();

/* =============================================================================
   LEGACY PRO WRESTLING 8.6.3 — JETT CARD RESOLUTION RENDER FIX
   ============================================================================= */
(function(){
 const BUILD='8.6.2';
 const VALID_JETT_DECISIONS=new Set([
  'Break Their Heart','Heartbreaker','Heart of Gold','One Last Encore','Tune Up the Band',
  'Showstopper','Picture Perfect','Feed Off the Attention','Raise the Tempo','Never Misses',
  'Flash of Brilliance','Steal the Spotlight','Believe the Hype','High Risk','Stolen Moment'
 ]);
 function jettActive(){return !!(S&&M&&Array.isArray(S.team)&&S.team[M.activeP]?.id==='jett-valentine')}
 function jettOption(card){return {
  ...card,desc:'',exclusive:true,
  attr:Math.round(attributeValue(S.team[M.activeP],card.action)),
  image:`assets/decisions/jett-valentine/${card.slug}.webp`
 }}
 const previousGetDecision=getDecision;
 getDecision=function(){
  if(!jettActive())return previousGetDecision();
  const wrestler=S.team[M.activeP],phase=decisionPhase();
  const situation=one(DECISION_SITUATIONS[phase]);
  const phaseCards=JETT_DECISION_CARDS[phase];
  if(!Array.isArray(phaseCards)||phaseCards.length<3)throw new Error(`Jett decision phase "${phase}" is missing its assigned card pool.`);
  const pool=phaseCards.map(jettOption);
  const options=freshOptions(pool,3).map((option,index)=>({...option,token:`choice-${index}`}));
  if(options.some(option=>!VALID_JETT_DECISIONS.has(option.name)))throw new Error('Unassigned decision entered Jett Valentine decision pool.');
  return {phase,title:situation[0],text:situation[1](wrestler.name),options};
 };
 const previousStoryChoice=storyChoice;
 storyChoice=function(token){
  const selected=jettActive()?M.currentDecision?.options?.find(option=>option.token===token):null;
  // Store the selected illustrated card before the legacy handler renders the result screen.
  // The legacy handler calls renderMatch() synchronously, so attaching the artwork afterwards
  // is too late for the first render.
  if(selected&&M){
   M.jettSelectedDecision={choice:selected.name,image:selected.image,slug:selected.slug};
  }
  return previousStoryChoice(token);
 };
 const previousDecisionHTML=decisionHTML;
 decisionHTML=function(){
  const outcome=M?.decisionOutcome;
  const selected=M?.jettSelectedDecision;
  if(!outcome||!selected?.image||!jettActive())return previousDecisionHTML();
  outcome.choice=selected.choice;
  outcome.image=selected.image;
  outcome.slug=selected.slug;
  const sign=value=>value>0?`+${value}`:`${value}`;
  return `<div class="story-decision psychology-v2-foundation decision-outcome jett-decision-outcome outcome-${outcome.key}">
   <div class="your-call-label">YOUR CALL</div>
   <h2>${outcome.label}</h2>
   <p>${outcome.summary}</p>
   <div class="jett-resolution-card"><img src="${outcome.image}" alt="${outcome.choice}" loading="eager"><span><small>JETT VALENTINE</small><b>${outcome.choice}</b></span></div>
   <div class="outcome-deltas jett-outcome-rewards"><span><b>${sign(outcome.score)}</b><small>MATCH SCORE</small></span><span><b>${sign(outcome.control)}</b><small>CONTROL</small></span><span><b>${sign(outcome.crowd)}</b><small>CROWD</small></span></div>
   <div class="outcome-progress">RESULT APPLIED</div>
   <button type="button" class="btn outcome-continue" onclick="continueDecisionOutcome()">CONTINUE MATCH</button>
  </div>`;
 };
 window.LPW_JETT_DECISION_POOL_VERSION=BUILD;
})();


/* =============================================================================
   LEGACY PRO WRESTLING 8.6.4 — JETT DECISION INTERACTION POLISH
   ============================================================================= */
(function(){
 const BUILD='8.6.4';
 const SEEN_KEY='lpw_jett_seen_decision_cards_v1';
 const outcomeCopy={
  'major-success':{status:'MOMENTUM SHIFTS',extra:'The arena comes alive as Jett turns the choice into a defining swing.'},
  'success':{status:'ADVANTAGE GAINED',extra:'Jett keeps the pressure on and forces the match further into his rhythm.'},
  'mixed':{status:'THE MATCH CONTINUES',extra:'The gamble creates movement, but neither competitor has full control yet.'},
  'mixed-result':{status:'THE MATCH CONTINUES',extra:'The gamble creates movement, but neither competitor has full control yet.'},
  'failure':{status:'OPPONENT CAPITALISES',extra:'The opening disappears, and Jett must recover before the damage grows.'},
  'major-failure':{status:'DANGER DEEPENS',extra:'The decision backfires badly and hands the opponent a major opportunity.'}
 };
 function seenCards(){try{return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'))}catch(e){return new Set()}}
 function markSeen(slug){const seen=seenCards();seen.add(slug);localStorage.setItem(SEEN_KEY,JSON.stringify([...seen]))}
 const priorCardHTML=jettDecisionCardHTML;
 jettDecisionCardHTML=function(option,index){
  const label=String(option.name||'Decision').replace(/"/g,'&quot;');
  const isNew=!seenCards().has(option.slug);
  return `<button type="button" class="jett-decision-card${isNew?' is-new':''}" onclick="jettChooseDecision('choice-${index}',this)" aria-label="Choose ${label}"><span class="jett-card-art"><img src="${option.image}" alt="${label}" loading="eager"></span><span class="jett-card-shade"></span>${isNew?'<em class="jett-card-new">NEW</em>':''}<span class="jett-card-copy"><small>JETT VALENTINE</small><b>${option.name}</b></span></button>`;
 };
 window.jettChooseDecision=function(token,button){
  if(!button||button.dataset.choosing==='1')return;
  const option=M?.currentDecision?.options?.find(item=>item.token===token);
  if(!option)return storyChoice(token);
  button.dataset.choosing='1';
  markSeen(option.slug);
  const grid=button.closest('.jett-decision-grid');
  if(grid){grid.classList.add('is-resolving');[...grid.querySelectorAll('.jett-decision-card')].forEach(card=>card.classList.toggle('is-selected',card===button))}
  window.setTimeout(()=>storyChoice(token),420);
 };
 const priorDecisionHTML=decisionHTML;
 decisionHTML=function(){
  const outcome=M?.decisionOutcome;
  const selected=M?.jettSelectedDecision;
  const active=!!(S&&M&&Array.isArray(S.team)&&S.team[M.activeP]?.id==='jett-valentine');
  if(!outcome||!selected?.image||!active)return priorDecisionHTML();
  const key=outcome.key||'mixed';
  const copy=outcomeCopy[key]||outcomeCopy.mixed;
  const target=value=>Number.isFinite(Number(value))?Number(value):0;
  return `<div class="story-decision psychology-v2-foundation decision-outcome jett-decision-outcome outcome-${key}">
   <div class="your-call-label">YOUR CALL</div>
   <h2>${outcome.label}</h2>
   <p>${outcome.summary} ${copy.extra}</p>
   <div class="jett-resolution-card"><img src="${selected.image}" alt="${selected.choice}" loading="eager"><span><small>JETT VALENTINE</small><b>${selected.choice}</b></span></div>
   <div class="outcome-deltas jett-outcome-rewards"><span><b data-target="${target(outcome.score)}">0</b><small>MATCH SCORE</small></span><span><b data-target="${target(outcome.control)}">0</b><small>CONTROL</small></span><span><b data-target="${target(outcome.crowd)}">0</b><small>CROWD</small></span></div>
   <div class="outcome-progress">${copy.status}</div>
   <button type="button" class="btn outcome-continue" onclick="continueDecisionOutcome()">CONTINUE MATCH</button>
  </div>`;
 };
 function animateNumber(node){
  if(node.dataset.counted==='1')return;
  node.dataset.counted='1';
  const target=Number(node.dataset.target||0),duration=620,start=performance.now();
  const sign=value=>value>0?`+${value}`:`${value}`;
  function frame(now){const p=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-p,3);node.textContent=sign(Math.round(target*eased));if(p<1)requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
 }
 const observer=new MutationObserver(()=>document.querySelectorAll('.jett-outcome-rewards b[data-target]').forEach(animateNumber));
 observer.observe(document.documentElement,{childList:true,subtree:true});
 window.LPW_JETT_INTERACTION_POLISH_VERSION=BUILD;
})();


/* =============================================================================
   LEGACY PRO WRESTLING 8.6.6 — BRAND IDENTITY INTEGRATION
   ============================================================================= */
(function(){
 window.LPW_DECISION_SCORE_AUDIT_VERSION='8.6.6';
 document.querySelectorAll('.build-tag').forEach(node=>node.textContent='VERSION 8.6.6');
})();


/* ============================================================
   LEGACY PRO WRESTLING 8.6.6 — BRAND IDENTITY INTEGRATION
   ============================================================ */
window.LPW_BRAND_VERSION='8.6.6';
function lpwBrandLogo(size='header',extra=''){
 const file=size==='main'?'lpw-logo-main-menu-1200.webp':size==='compact'?'lpw-logo-compact-400.webp':'lpw-logo-header-800.webp';
 return `<img class="lpw-brand-logo lpw-brand-logo-${size} ${extra}" src="assets/branding/${file}" alt="LEGACY Pro Wrestling">`;
}
const _lpw866Render=render;
render=function(html){
 const result=_lpw866Render(html);
 const main=document.querySelector('#app .lpw-home');
 if(main&&!main.querySelector('.lpw-main-brand')){
   const copy=main.querySelector('.hub-copy');
   if(copy){copy.insertAdjacentHTML('afterbegin',lpwBrandLogo('main','lpw-main-brand'));const oldTitle=copy.querySelector('h1');if(oldTitle)oldTitle.classList.add('lpw-visually-hidden-brand-title');}
 }
 const careerTarget=document.querySelector('#app .lpw-career-home,#app .live-calendar-screen,#app .live-show-intro,#app .live-match-card,#app .live-world-screen,#app .live-career-card-screen,#app .live-stable-screen,#app .lpw8-rankings,#app .lpw8-championships');
 if(careerTarget&&!careerTarget.querySelector('.lpw-career-brand'))careerTarget.insertAdjacentHTML('afterbegin',lpwBrandLogo('compact','lpw-career-brand'));
 return result;
};
