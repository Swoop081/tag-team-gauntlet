const app=document.getElementById('app'),overlay=document.getElementById('overlay');
let S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:false,quickType:null,quickPlayer:null,quickSelections:[]};
let M=null,storyTimer=null;
const pick=(a,n=1)=>[...a].sort(()=>Math.random()-.5).slice(0,n);
const one=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rnd=(min,max)=>Math.random()*(max-min)+min;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VENUES=['Liberty Arena','Crown Coliseum','MetroPlex Pavilion','Titan Dome','Victory Gardens Arena','Iron City Center','Skyline Stadium'];
const MATCH_LABELS=['MAIN EVENT','FEATURED CONTEST','GAUNTLET SHOWCASE','PRIME-TIME MATCH'];
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
 const matchRecord={rating:Number(rating.toFixed(1)),type:singles?'Singles':'Tag Team',mode:S.exhibition?'Exhibition':'Classic Gauntlet',winner:teamName(win?S.team:S.opp),date:new Date().toISOString()};stats.lastMatch=matchRecord;if(!stats.highestRated||matchRecord.rating>stats.highestRated.rating)stats.highestRated=matchRecord;saveStats(stats)}
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
function characterImageConfig(w){return CHARACTER_IMAGE_MANAGER[w.id]||null}
function legacyWrestlerImage(w){return `assets/${w.id}.png`}
function wrestlerImageCandidates(w,type='full'){
 const config=characterImageConfig(w),set=config?.assets;
 const list=[];
 if(set)list.push(set[type]||set.full);
 list.push(`assets/${w.id}.png`,`assets/${w.id}.webp`,`assets/wrestlers/${w.id}.png`,`assets/wrestlers/${w.id}.webp`);
 return [...new Set(list.filter(Boolean))];
}
function wrestlerImage(w,type='full'){return wrestlerImageCandidates(w,type)[0]}
function advanceImageFallback(img){
 const candidates=(img.dataset.sources||'').split('|').filter(Boolean);
 const next=Number(img.dataset.sourceIndex||0)+1;
 if(next<candidates.length){img.dataset.sourceIndex=String(next);img.src=candidates[next];return;}
 img.style.display='none';img.parentElement?.classList.add('missing-art');
}
function imageTransform(config,type='full'){
 const map=config?.transforms||{};
 return map[type]||map.full||config?.transform||{scale:1,x:0,y:0};
}
function imageWithFallback(w,type,extraClass=''){
 const sources=wrestlerImageCandidates(w,type),config=characterImageConfig(w),t=imageTransform(config,type);
 const custom=config?' framework-custom':'';
 const st=`--custom-scale:${t.scale??1};--custom-x:${t.x??0}px;--custom-y:${t.y??0}px;`;
 return `<img class="wrestler-art wrestler-${w.id}${custom} ${extraClass}" style="${st}" data-art-type="${type}" src="${sources[0]}" data-sources="${sources.join('|')}" data-source-index="0" alt="${w.name}" onerror="advanceImageFallback(this)">`;
}
function wrestlerPng(w){return wrestlerImage(w,'full')}
function heroPortrait(w,side='',artType='full'){return `<article class="hero-portrait ${side} image-framework ${characterImageConfig(w)?'has-render':'legacy-render'}">${imageWithFallback(w,artType,`art-${artType}`)}<div><small>${w.title}</small><h3>${w.name}</h3><span>${w.finisher}</span></div></article>`}
function tvSting(label,title,subtitle=''){overlay.innerHTML=`<div class="overlay tv-sting-overlay"><section class="tv-sting"><small>${label}</small><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}<div class="tv-scan"></div></section></div>`;setTimeout(()=>{if(overlay.querySelector('.tv-sting-overlay'))overlay.innerHTML=''},850)}
function rel(a,b){return RELATIONSHIPS.find(r=>(r.a===a.id&&r.b===b.id)||(r.a===b.id&&r.b===a.id))}
function chemistry(a,b){let r=rel(a,b);return r?r.chemistry:Math.round((a.versatility+b.versatility)/2)}
function score(t){let[a,b]=t;if(!b)return a.overall*.34+a.technique*.2+a.power*.14+a.speed*.12+a.charisma*.1+a.resilience*.1+S.momentum;let av=k=>(a[k]+b[k])/2;return av('overall')*.3+av('tag')*.25+(chemistry(a,b)+S.chem)*.2+av('technique')*.1+av('power')*.05+av('speed')*.05+av('charisma')*.05+S.momentum}
function imageFallback(img,name){const wrap=img.closest('.card');if(!wrap)return;img.style.display='none';wrap.classList.add('missing-art');let ph=wrap.querySelector('.art-placeholder');if(!ph){ph=document.createElement('div');ph.className='art-placeholder';ph.innerHTML=`<b>${name.split(/\s+/).map(x=>x.replace(/[^A-Za-z]/g,'')[0]||'').join('').slice(0,3)}</b><small>ADD WRESTLER ART</small>`;wrap.insertBefore(ph,wrap.firstChild)}}
function card(w,onclick='',compact=false){const upgraded=!!characterImageConfig(w),artType=compact&&upgraded?'portrait':'full';return `<article class="card character-tile${compact?' compact':''}${upgraded?' image-framework-card':' legacy-card'}" ${onclick?`onclick="${onclick}"`:''}>${imageWithFallback(w,artType,`art-${artType}`)}<div class="name">${w.name}<small>${w.title} · ${w.faction}</small></div></article>`}
function render(x){app.classList.remove('screen-enter');app.innerHTML=x;document.getElementById('streak').textContent=S.streak;requestAnimationFrame(()=>app.classList.add('screen-enter'))}
function clearStoryTimer(){if(storyTimer){clearTimeout(storyTimer);storyTimer=null}}
const FEATURE_LINES={
'jack-mercer':'Cold as ice. Tough as steel.','victor-royale':'Every kingdom needs a Kingmaker.','jett-valentine':'The spotlight always finds the Heartbreaker.','revenant':'You cannot defeat what refuses to die.','nightwatch':'When darkness falls, the Sentinel is watching.','titan':'Every match is another Hollywood blockbuster.','mason-marks':'Precision is the difference between good and excellent.','hollowman':'Some legends are better left undiscovered.','damian-blackwell':'One opening. One strike. One Kill Shot.','elias-crowe':'Chaos is not a strategy. It is a lifestyle.','el-rey-del-cielo':'The sky has only one king.','max-justice':'When the fight is hardest, the Hero stands tallest.','primal':'There is no plan for surviving raw instinct.','lucas-bennett':'Gold is earned through flawless preparation.','marcus-king':'The streets taught him how to survive.','mateo-vega':'By the time you see the trick, the match is over.','ryder-phoenix':'Every arena becomes his stage.','sterling-sinclair':'Class, confidence and the Golden Touch.','dave-maddox':'Nobody outworks the Workhorse.','logan-steele':'Legends do not fade. They set the standard.'};
const BIOS={
'jack-mercer':'A rebellious brawler who thrives under pressure, Jack Mercer fights with equal parts toughness, instinct and defiance.','victor-royale':'The calculating leader of Royal Dynasty treats every contest like a kingdom to be conquered.','jett-valentine':'Charisma, speed and swagger make Jett Valentine one of the most magnetic stars in the Gauntlet.','revenant':'The silent ruler of Dark Dominion absorbs punishment and advances with supernatural calm.','nightwatch':'Dark Dominion’s patient enforcer waits for the exact moment to deliver Midnight Mass.','titan':'A blockbuster personality with main-event power, Titan believes every camera belongs to him.','mason-marks':'The Canadian Icon turns technical wrestling into an exact science.','hollowman':'A masked urban legend whose relentless advance turns every arena into a horror story.','damian-blackwell':'Royal Dynasty’s silent assassin wastes no motion and never misses an opening.','elias-crowe':'The Lunatic embraces danger, pain and disorder with a smile that unsettles everyone around him.','el-rey-del-cielo':'A heroic luchador whose speed and aerial brilliance make the impossible look effortless.','max-justice':'The Guardians’ inspirational hero meets every challenge with courage and overwhelming strength.','primal':'An untamed powerhouse who grows more dangerous as the fight becomes more physical.','lucas-bennett':'The Olympian combines discipline, athleticism and championship-level precision.','marcus-king':'A battle-tested street veteran who earned his reputation through toughness and grit.','mateo-vega':'The Con Artist wins with aerial skill, misdirection and one more trick than his opponent expects.','ryder-phoenix':'A fearless Rockstar who transforms every entrance and every comeback into a headline moment.','sterling-sinclair':'The Playboy brings effortless luxury, athleticism and supreme self-confidence to Royal Dynasty.','dave-maddox':'The Workhorse earns every victory through stamina, reliability and the decisive Maddox Cutter.','logan-steele':'The Living Legend carries decades of experience and the respect of an entire generation.'};
function resetClassicState(){clearStoryTimer();M=null;S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:false,quickType:null,quickPlayer:null,quickSelections:[],venue:null,attendance:null,previewCaptain:null};}
function shellBack(){return `<button class="shell-back" onclick="home()">← MAIN MENU</button>`}
function featuredSuperstar(){return one(WRESTLERS)}
function home(){
 clearStoryTimer();M=null;overlay.innerHTML='';
 const w=featuredSuperstar();
 render(`<section class="game-hub"><div class="hub-copy"><div class="tv-kicker">WELCOME TO THE GAUNTLET</div><h1>TAG TEAM <span>GAUNTLET</span></h1><p>Build a team, survive the broadcast and unlock the Founding Twenty.</p><nav class="hub-menu"><button class="hub-option primary" onclick="classicHome()"><b>CLASSIC GAUNTLET</b><small>One loss ends the run.</small></button><button class="hub-option" onclick="quickMatchMenu()"><b>QUICK MATCH</b><small>Singles and Tag Team exhibition framework.</small></button><button class="hub-option" onclick="collection()"><b>COLLECTION</b><small>Explore the Founding Twenty.</small></button><button class="hub-option" onclick="statisticsMenu()"><b>STATISTICS</b><small>Your legacy framework.</small></button><button class="hub-option muted" onclick="optionsMenu()"><b>OPTIONS</b><small>Presentation settings coming soon.</small></button></nav></div><article class="featured-superstar"><div class="live-chip">FEATURED SUPERSTAR</div>${imageWithFallback(w,'full','art-full')}<div class="featured-lower-third"><small>${w.title}</small><h2>${w.name}</h2><p>${FEATURE_LINES[w.id]||w.signature}</p><button onclick="collectionProfile('${w.id}')">VIEW PROFILE</button></div></article></section>`)
}
function classicHome(){
 resetClassicState();S.previewCaptain=one(WRESTLERS);const captain=S.previewCaptain;
 render(`<section class="panel mode-landing"><div class="actions top-actions"><button class="btn" onclick="start()">START GAUNTLET</button>${shellBack()}</div><div class="mode-landing-art">${imageWithFallback(captain,'full','art-full')}<div class="mode-preview-label"><small>YOUR STARTING WRESTLER</small><b>${captain.name}</b></div></div><div class="mode-landing-copy"><div class="tv-kicker">CLASSIC MODE</div><h1>SURVIVE THE GAUNTLET</h1><p>Your run begins with <strong>${captain.name}</strong>. Choose a partner and survive as long as possible. Every broadcast, decision and reward matters. Lose once and the run is over.</p></div></section>`)
}
function collection(){
 render(`<section class="collection-screen">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">THE FOUNDING TWENTY</div><h1>COLLECTION</h1><p>Character profiles, signatures and future career history.</p></div><strong>${WRESTLERS.length}/${WRESTLERS.length}</strong></header><div class="collection-grid">${WRESTLERS.map(w=>`<button class="collection-tile" onclick="collectionProfile('${w.id}')">${imageWithFallback(w,'full','art-full')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)
}
function collectionProfile(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w)return collection();
 render(`<section class="profile-screen"><div class="profile-nav"><button class="shell-back" onclick="collection()">← COLLECTION</button><button class="profile-play" onclick="playNowFromCollection('${w.id}')">PLAY NOW · SINGLES</button></div><div class="profile-art image-framework-profile">${imageWithFallback(w,'full','art-full')}</div><div class="profile-copy"><div class="profile-status">FOUNDING TWENTY · AVAILABLE</div><small>${w.title}</small><h1>${w.name}</h1><div class="profile-signature"><span>SIGNATURE MOVE</span><b>${w.signature}</b></div><p>${BIOS[w.id]||`${w.name} is a ${w.faction} competitor in Tag Team Gauntlet.`}</p><div class="profile-facts"><div><small>FACTION</small><b>${w.faction}</b></div><div><small>STYLE</small><b>${(typeof profileFor==='function'?profileFor(w).archetype:'Wrestler')}</b></div><div><small>OVERALL</small><b>${w.overall}</b></div><div><small>RARITY</small><b>${w.rarity}</b></div></div></div></section>`)
}
function playNowFromCollection(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w)return collection();
 clearStoryTimer();M=null;overlay.innerHTML='';
 S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:true,quickType:'singles',quickPlayer:w,quickSelections:[],quickSourceProfile:id,venue:null,attendance:null};
 quickSinglesOpponentSelect();
}
function quickMatchMenu(){
 const w=one(WRESTLERS);
 render(`<section class="framework-screen quick-framework">${shellBack()}<div class="framework-art image-framework-profile">${imageWithFallback(w,'full','art-full')}</div><div class="framework-copy"><div class="tv-kicker">EXHIBITION</div><h1>QUICK MATCH</h1><p>Create a dream match using any wrestlers from the Founding Twenty.</p><div class="framework-options"><button onclick="beginQuickSingles()"><b>SINGLES MATCH</b><small>Choose one wrestler and one opponent.</small><em>PLAYABLE</em></button><button onclick="beginQuickTag()"><b>TAG TEAM MATCH</b><small>Choose two wrestlers and an opposing team.</small><em>NEW · PLAYABLE</em></button></div></div></section>`)
}
function beginQuickSingles(){
 clearStoryTimer();M=null;overlay.innerHTML='';
 S={team:[],streak:0,chem:0,momentum:0,wind:false,windAwarded:false,challengeSeen:false,specialSingles:false,tagBackup:null,exhibition:true,quickType:'singles',quickPlayer:null,quickSelections:[],quickSourceProfile:null,venue:null,attendance:null};
 quickSinglesPlayerSelect();
}
function quickSinglesPlayerSelect(){
 render(`<section class="panel"><div class="actions top-actions"><button class="btn secondary" onclick="quickMatchMenu()">← QUICK MATCH</button></div><div class="tv-kicker">QUICK MATCH · SINGLES</div><h1 class="title">Choose Your Wrestler</h1><p class="sub">Select the wrestler you want to control.</p><div class="collection-grid">${WRESTLERS.map(w=>`<button class="collection-tile" onclick="selectQuickPlayer('${w.id}')">${imageWithFallback(w,'full','art-full')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)
}
function selectQuickPlayer(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w)return quickSinglesPlayerSelect();S.quickPlayer=w;S.quickSourceProfile=null;quickSinglesOpponentSelect();
}
function quickSinglesOpponentSelect(){
 const player=S.quickPlayer;if(!player)return quickSinglesPlayerSelect();
 const opponents=WRESTLERS.filter(w=>w.id!==player.id);
 const backAction=S.quickSourceProfile?`collectionProfile('${S.quickSourceProfile}')`:'quickSinglesPlayerSelect()';
 const backLabel=S.quickSourceProfile?'PROFILE':'CHANGE WRESTLER';
 render(`<section class="panel"><div class="actions top-actions"><button class="btn secondary" onclick="${backAction}">← ${backLabel}</button></div><div class="tv-kicker">QUICK MATCH · SINGLES</div><h1 class="title">Choose Your Opponent</h1><p class="sub">${player.name} is ready. Select the opposition.</p><div class="collection-grid">${opponents.map(w=>`<button class="collection-tile" onclick="selectQuickOpponent('${w.id}')">${imageWithFallback(w,'full','art-full')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)
}
function selectQuickOpponent(id){
 const opponent=WRESTLERS.find(x=>x.id===id),player=S.quickPlayer;if(!player||!opponent||player.id===opponent.id)return quickSinglesOpponentSelect();
 S.team=[player];S.opp=[opponent];S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));
 render(`<section class="panel singles-intro television-card"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN SINGLES BROADCAST</button><button class="btn secondary" onclick="quickSinglesOpponentSelect()">CHANGE OPPONENT</button></div><div class="tv-kicker">QUICK MATCH · SINGLES</div><div class="cinematic-versus singles-cinematic"><div class="hero-team hero-left">${heroPortrait(player,'left')}</div><div class="giant-vs">VS</div><div class="hero-team hero-right">${heroPortrait(opponent,'right')}</div></div><div class="event-details"><span>🏟 ${currentVenue()}</span><span>👥 ${attendance()} · SOLD OUT</span><span>EXHIBITION</span></div></section>`)
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
 render(`<section class="panel"><div class="actions top-actions"><button class="btn secondary" onclick="${slot?'undoQuickTagSelection()':'quickMatchMenu()'}">← ${slot?'UNDO LAST PICK':'QUICK MATCH'}</button></div><div class="tv-kicker">QUICK MATCH · TAG TEAM</div><h1 class="title">Choose ${slots[slot]}</h1><p class="sub">${slot?`${S.quickSelections.map(w=>w.name).join(' · ')} selected`:'Build your team first, then choose the opposition.'}</p><div class="collection-grid">${WRESTLERS.filter(w=>!chosen.has(w.id)).map(w=>`<button class="collection-tile" onclick="selectQuickTagWrestler('${w.id}')">${imageWithFallback(w,'full','art-full')}<span><small>${w.title}</small><b>${w.name}</b></span></button>`).join('')}</div></section>`)
}
function selectQuickTagWrestler(id){
 const w=WRESTLERS.find(x=>x.id===id);if(!w||S.quickSelections.some(x=>x.id===id))return quickTagSelect();
 S.quickSelections.push(w);quickTagSelect();
}
function undoQuickTagSelection(){S.quickSelections.pop();quickTagSelect()}
function confirmQuickTag(){
 const [a,b,c,d]=S.quickSelections;if(!a||!b||!c||!d)return quickTagSelect();
 S.team=[a,b];S.opp=[c,d];S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));
 render(`<section class="panel television-card"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN TAG TEAM BROADCAST</button><button class="btn secondary" onclick="beginQuickTag()">CHANGE TEAMS</button></div><div class="tv-kicker">QUICK MATCH · TAG TEAM</div><h1 class="match-card-title">EXHIBITION SHOWCASE</h1><div class="cinematic-versus"><div class="hero-team hero-left">${S.team.map(w=>heroPortrait(w,'left')).join('')}<h2>${teamName(S.team)}</h2></div><div class="giant-vs">VS</div><div class="hero-team hero-right">${S.opp.map(w=>heroPortrait(w,'right')).join('')}<h2>${teamName(S.opp)}</h2></div></div><div class="event-details"><span>🏟 ${currentVenue()}</span><span>👥 ${attendance()} · SOLD OUT</span><span>EXHIBITION</span></div></section>`)
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
 render(`<section class="stats-framework">${shellBack()}<header class="section-heading"><div><div class="tv-kicker">YOUR LEGACY</div><h1>STATISTICS</h1><p>Persistent records from Classic Gauntlet and Quick Match.</p></div></header><div class="stat-cards"><article><small>CAREER</small><b>${stats.total}</b><span>Total Matches</span></article><article><small>RECORD</small><b>${record}</b><span>Wins & Losses</span></article><article><small>BEST RUN</small><b>${stats.bestGauntlet}</b><span>Longest Gauntlet Streak</span></article><article><small>COLLECTION</small><b>${WRESTLERS.length}</b><span>Founding Twenty Profiles</span></article></div><div class="stats-tabs"><button class="${tab==='career'?'active':''}" onclick="statisticsMenu('career')">CAREER</button><button class="${tab==='wrestlers'?'active':''}" onclick="statisticsMenu('wrestlers')">WRESTLERS</button><button class="${tab==='teams'?'active':''}" onclick="statisticsMenu('teams')">TEAMS</button><button class="${tab==='records'?'active':''}" onclick="statisticsMenu('records')">RECORDS</button></div><div class="stats-detail">${detail}</div></section>`)
}
function optionsMenu(){
 render(`<section class="panel mode-landing">${shellBack()}<div class="mode-landing-copy"><div class="tv-kicker">COMING SOON</div><h1>OPTIONS</h1><p>Broadcast speed, animation, audio and accessibility controls will live here.</p></div></section>`)
}
function start(){let captain=S.previewCaptain||one(WRESTLERS);S.previewCaptain=null;S.team=[captain];window.opts=pick(WRESTLERS.filter(w=>w.id!==captain.id),2);render(`<section class="panel"><h1 class="title">Choose Your Partner</h1><p class="sub">Your first wrestler is ${captain.name}. Choose one partner to begin the Gauntlet.</p><div class="cards two">${opts.map((w,i)=>card(w,`partner(${i})`)).join('')}</div></section>`)}
function partner(i){S.team.push(opts[i]);discover(()=>team())}
function discover(next){let r=S.team.length>1?rel(...S.team):null;if(r&&r.type==='legendary'){overlay.innerHTML=`<div class="overlay unlock-overlay"><div class="discover unlock-discover"><div class="actions top-actions"><button class="btn" id="continue">CONTINUE</button></div><div class="tv-kicker">FOUNDING TWENTY</div><p>LEGENDARY TEAM DISCOVERED</p><div class="pair unlock-pair">${card(S.team[0])}${card(S.team[1])}</div><h1>${r.teamName}</h1></div></div>`;document.getElementById('continue').onclick=()=>{overlay.innerHTML='';next()}}else next()}
function team(){clearStoryTimer();render(`<section class="panel"><h1 class="title">Your Team</h1><p class="sub">${rel(...S.team)?.teamName||S.team.map(x=>x.name).join(' & ')}</p><div class="cards two">${S.team.map(x=>card(x)).join('')}</div><div class="actions team-actions"><button class="btn" onclick="opponent()">FIND OPPONENT</button></div></section>`)}
function opponent(){
 let ids=new Set(S.team.map(x=>x.id)),eligible=WRESTLERS.filter(x=>!ids.has(x.id));S.opp=pick(eligible,2);S.venue=one(VENUES);S.attendance=Math.floor(rnd(11800,19800));
 const label=one(MATCH_LABELS),left=teamName(S.team),right=teamName(S.opp);
 const show=one(SHOW_BRANDS);render(`<section class="panel television-card atmosphere-card"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN BROADCAST</button></div><div class="show-brand"><small>TAG TEAM GAUNTLET PRESENTS</small><h3>${show}</h3></div><div class="tv-kicker">${label}</div><h1 class="match-card-title">TONIGHT'S CHALLENGERS</h1><p class="opponent-hook">${factionIdentity(S.opp)}</p><div class="cinematic-versus"><div class="hero-team hero-left">${S.team.map(w=>heroPortrait(w,'left')).join('')}<h2>${left}</h2><p>${factionIdentity(S.team)}</p></div><div class="giant-vs">VS</div><div class="hero-team hero-right">${S.opp.map(w=>heroPortrait(w,'right')).join('')}<h2>${right}</h2><p>${factionIdentity(S.opp)}</p></div></div><div class="entrance-preview">${S.team.concat(S.opp).map(w=>`<p><b>${w.name}</b> — ${entranceLine(w)}</p>`).join('')}</div><div class="broadcast-desk-preview"><p>${commentatorLine(COMMENTATORS.play,preMatchStatLine())}</p><p>${commentatorLine(COMMENTATORS.colour,`This matchup has the personality to become the story of the night.`)}</p></div><div class="event-details"><span>🏟 ${currentVenue()}</span><span>👥 ${attendance()} · SOLD OUT</span><span>🔥 STREAK ${S.streak}</span></div></section>`)
}
function walkout(){if(S.team.length<2)return null;let[a,b]=S.team,c=chemistry(a,b),risk=((100-(a.loyalty+b.loyalty)/2)*.0007)+Math.max(0,75-c)*.0008;if(rel(a,b)?.type==='rivalry')risk+=.018;if(rel(a,b)?.type==='legendary')risk*=.08;return Math.random()<risk?(a.loyalty<b.loyalty?a:b):null}



// 3.8.0 Build 3 — Atmosphere & Personality
const SHOW_BRANDS=['GAUNTLET NIGHT','FRIDAY NIGHT GAUNTLET','SURVIVAL SHOWCASE','PRIME-TIME GAUNTLET'];
const COMMENTATORS={play:{name:'Mike Sullivan',role:'PLAY-BY-PLAY'},colour:{name:'Danny Graves',role:'COLOUR COMMENTARY'}};
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
 'damian-blackwell':'Damian Blackwell enters without theatrics, already searching for the opening that ends the match.',
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
function preMatchStatLine(){const h=loadHistory(),opp=S.opp.map(w=>h.opponents[w.id]||0),best=Math.max(0,...opp);if(best>1){const w=S.opp[opp.indexOf(best)];return `${w.name} has crossed paths with you ${best} times before.`}if(S.streak>=5)return `Your team enters with a ${S.streak}-match Gauntlet streak.`;if(S.streak===0)return 'A new run begins tonight, and the first statement matters.';return `Your team has survived ${S.streak} match${S.streak===1?'':'es'} in this run.`}
function updateAtmosphereHistory(win){if(S.exhibition||!M)return;const h=loadHistory();h.matches++;S.opp.forEach(w=>h.opponents[w.id]=(h.opponents[w.id]||0)+1);S.team.forEach(w=>h.partners[w.id]=(h.partners[w.id]||0)+1);const tk=teamKey(S.team);h.teams[tk]=(h.teams[tk]||0)+1;S.opp.forEach(w=>h.factions[w.faction]=(h.factions[w.faction]||0)+1);saveHistory(h)}
function milestoneData(){const stats=loadStats(),items=[];if(S.streak===1)items.push(['FIRST VICTORY','The Gauntlet journey is officially underway.']);if(S.streak===5)items.push(['FIVE MATCH STREAK','Momentum is becoming a legacy.']);if(S.streak===10)items.push(['DOMINATING THE GAUNTLET','Ten straight victories have changed the entire broadcast.']);if(S.streak>0&&S.streak===stats.bestGauntlet)items.push(['NEW PERSONAL BEST',`A new standard has been set at ${S.streak} victories.`]);return items.slice(0,2)}
function commentatorExchange(){const p=S.team[M.activeP],o=S.opp[M.activeO];const play=one([`${p.name} is trying to dictate the pace.`,`${o.name} is cutting off every escape route.`,`This match is changing with every exchange.`]);const colour=one([`${profileFor(p).archetype} instincts are taking over now.`,`${o.faction} never arrives without a plan.`,`The crowd can feel that one mistake will decide this.`]);return [commentatorLine(COMMENTATORS.play,play),commentatorLine(COMMENTATORS.colour,colour)]}

const PERSONALITY_PROFILES={"jack-mercer":{"archetype":"Rebel Brawler","events":["raises a fist and invites the opposition to hit harder","turns the exchange into a rough Southern brawl","fires back with heavy right hands as the crowd chants Iceman","shrugs off the shot and dares the opponent to try again","drags the fight toward the ropes and makes it ugly","stomps to the centre of the ring and refuses to back down"]},"victor-royale":{"archetype":"Royal Strategist","events":["orders the ring around him with a royal gesture","slows the pace and dictates every movement","smirks after escaping danger and points to his crown","uses the referee as a shield before reclaiming control","demands his partner follow the plan","turns a simple counter into a statement of superiority"]},"jett-valentine":{"archetype":"Heartbreaker Showman","events":["blows a kiss to the crowd and steals the spotlight","poses for the cameras before snapping back into the fight","fixes his hair after a dazzling escape","spins away from danger and points at himself","plays to the crowd instead of making the cover","turns the ropes into a stage and the match into his show"]},"revenant":{"archetype":"Supernatural Force","events":["sits straight up as the arena lights flicker","walks through the punishment without expression","raises his head slowly and the crowd falls silent","stands motionless while the opponent hesitates","surges forward as green light flashes across the arena","absorbs the strike as though pain means nothing"]},"nightwatch":{"archetype":"Dark Enforcer","events":["appears from the blind side with perfect timing","raises the black bat from ringside and fixes a cold stare on the ring","stalks the legal wrestler without wasting a step","points toward The Revenant before striking","uses the ropes to cut off every escape route","lets the face paint and silence do the intimidating"]},"titan":{"archetype":"Hollywood Megastar","events":["grins for the cameras before landing a blockbuster shot","turns the arena into his personal main event","pauses for the hard camera and then explodes forward","talks to the crowd while controlling the exchange","throws his arms wide as if accepting an award","delivers the hit and immediately checks which camera caught it"]},"mason-marks":{"archetype":"Technical Purist","events":["dissects the opponent with flawless technique","counters as though he planned the exchange three moves ago","targets a limb and refuses to lose position","transitions from hold to hold without giving space","uses perfect balance to reverse the momentum","turns the contest into a clinic in precision"]},"hollowman":{"archetype":"Urban Legend","events":["slowly rises again, refusing to stay down","stalks forward while the front row backs away","tilts the stitched mask and keeps advancing","absorbs a huge shot without changing expression","stands in the corner breathing heavily before charging","makes the entire arena feel like the woods after midnight"]},"damian-blackwell":{"archetype":"Silent Assassin","events":["waits patiently, then strikes without warning","finds the smallest opening and exploits it","circles quietly until the perfect angle appears","cuts off the comeback with one precise blow","never changes expression as control shifts his way","turns stillness into sudden violence"]},"elias-crowe":{"archetype":"Unhinged Hardcore","events":["laughs through the pain and creates total chaos","pulls at the loose straps of the straitjacket and charges","welcomes the punishment with a crooked grin","rolls outside and turns the match into a street fight","scrapes at the canvas and crawls back toward danger","looks happiest when the match becomes impossible to control"]},"el-rey-del-cielo":{"archetype":"Lucha Aerialist","events":["springs into the air with impossible balance","turns the ropes into a launchpad","lands on his feet and points toward the sky","changes direction in mid-air and leaves everyone stunned","flies across the ring before the opponent can react","makes gravity look optional"]},"max-justice":{"archetype":"Heroic Powerhouse","events":["rallies the crowd and refuses to surrender","fights back for everyone who believes in him","checks on his partner before charging into danger","raises a fist and the arena answers","absorbs the punishment and stands for one more fight","turns courage into a powerful comeback"]},"primal":{"archetype":"Apex Beast","events":["lets out a roar and overwhelms the opposition","hunts the opponent across the ring","drops low like a predator before exploding forward","drives through the defence with raw force","paces behind the opponent and waits to strike","abandons technique and unleashes pure instinct"]},"lucas-bennett":{"archetype":"Elite Olympian","events":["shoots for a takedown with championship precision","turns the match into an elite wrestling clinic","chains two takedowns together without losing control","forces the opponent to wrestle at his pace","uses world-class conditioning to win the scramble","treats every exchange like the final of a tournament"]},"marcus-king":{"archetype":"Street Fighter","events":["fires off a rapid street-fighting combination","feeds off the crowd and finishes the exchange standing tall","slips a strike and answers with a heavy combination","turns the centre of the ring into his neighbourhood","talks through the exchange and keeps swinging","fights with rhythm, power and complete confidence"]},"mateo-vega":{"archetype":"Aerial Con Artist","events":["fakes one direction and attacks from another","distracts the referee just long enough to steal control","pretends to be hurt before springing into the air","points behind the opponent and steals the opening","turns a rope escape into a flying counter","smiles because everybody fell for the trick again"]},"ryder-phoenix":{"archetype":"Rockstar Ego","events":["grabs the microphone at ringside and mouths off mid-match","turns a basic exchange into a sold-out concert moment","plays air guitar after a successful counter","demands the spotlight before delivering a sharp strike","shouts that the crowd came to see him","misses a cover because he is busy performing"]},"sterling-sinclair":{"archetype":"Luxury Playboy","events":["checks his hair after a perfectly executed counter","wrestles with effortless, expensive-looking confidence","dusts off his shoulder and looks offended by the contact","waves dismissively before taking control","smiles as if the result has already been purchased","makes every movement look tailored and exclusive"]},"dave-maddox":{"archetype":"Veteran Workhorse","events":["finds another gear when everyone thinks he is finished","keeps grinding forward through sheer work rate","drags himself up and immediately asks for more","wins a long exchange through patience and effort","refuses the easy way out and keeps working","turns exhaustion into one more burst of offence"]},"logan-steele":{"archetype":"Living Legend","events":["cups an ear to the crowd and draws on their energy","powers back like the living legend he is","points around the arena as the noise rises","shakes off the damage and stands taller","uses veteran timing to land the perfect counter","reminds everyone why generations still believe"]}};
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
const WRESTLER_DECISIONS={"jack-mercer":[["Throw the First Punch","Invite the Brawl","Cold-Stare the Challenger","Take the Centre","Make It a Bar Fight"],["Ice-Cold Pressure","Hammer the Body","Drag It to the Ropes","Trade Heavy Hands","Refuse to Back Down"],["Fight Through the Freeze","Dare Him to Hit Harder","Southern Grit","Brawl Back to Life","Plant Both Boots"],["Call for Ice Breaker","End It with a Right Hand","Freeze the Comeback","Settle This Like a Brawler","One Last Bar-Room Swing"]],"victor-royale":[["Issue a Royal Decree","Command the Opening","Make Him Bow","Dictate the Pace","Claim the Centre"],["Rule the Ring","Execute the Royal Plan","Use the Referee","Slow the Peasant Down","Protect the Crown"],["Restore the Kingdom","Escape with Royal Timing","Order a Counterattack","Never Show Panic","Reclaim the Throne"],["Call for Royal Decree","Crown the Challenger","Finish by Royal Order","Seal the Kingdom","Demand the Final Bow"]],"jett-valentine":[["Steal the Spotlight","Blow a Kiss","Pose Before Contact","Dance Out of Danger","Make the Cameras Watch"],["Heartbreaker Sequence","Turn the Ropes into a Stage","Dazzle the Front Row","Showboat and Strike","Keep the Spotlight"],["Find the Camera","Break Their Heart","Spin Back into Control","Feed Off the Attention","Refuse to Leave the Stage"],["Call for Heartbreaker","End on the Hard Camera","Take the Final Bow","Steal the Finish","Make It Picture Perfect"]],"revenant":[["Walk Through the First Shot","Rise from the Darkness","Stand Motionless","Let the Lights Flicker","Invite the Fear"],["Absorb the Punishment","Stalk Without Emotion","Turn Pain into Power","Darken the Arena","Refuse to Stay Down"],["Sit Straight Up","Return from the Dead","Silence the Crowd","Walk Through the Storm","Rise Again"],["Call for Final Reckoning","End It in Darkness","Claim Another Soul","Make the Lights Go Out","Deliver the Last Omen"]],"nightwatch":[["Strike from the Blind Side","Control the Shadows","Cut Off Every Exit","Raise the Black Bat","Wait in Silence"],["Enforce the Darkness","Trap Him by the Ropes","Stalk the Legal Man","Use Perfect Timing","Protect the Sentinel"],["Disappear and Return","Counter from the Shadows","Stand Guard","Turn Silence into Violence","Find the Blind Side"],["Call for Midnight Verdict","Deliver the Final Warning","End the Watch","Strike at Midnight","Close Every Escape"]],"titan":[["Find the Hard Camera","Make a Blockbuster Entrance","Own the Main Event","Pose Before the Hit","Start the Show"],["Direct the Action","Hit the Blockbuster Beat","Work the Camera Angle","Turn It into a Spectacle","Steal the Scene"],["Rewrite the Ending","Find Another Take","Play to the Balcony","Make the Comeback Cinematic","Refuse a Bad Ending"],["Call for Box Office Bomb","Deliver the Final Scene","Win the Main Event","Take the Closing Shot","Roll the Credits"]],"mason-marks":[["Win the First Exchange","Test the Balance","Target the Wrist","Set the Technical Pace","Force a Clean Lock-Up"],["Dissect the Arm","Chain the Holds","Control the Hips","Transition Without Space","Turn It into a Clinic"],["Find the Technical Escape","Reverse Three Moves Ahead","Rebuild the Base","Counter with Precision","Trust the Fundamentals"],["Call for Perfect Execution","Finish the Clinic","Trap the Final Hold","Execute the Winning Sequence","Leave No Technical Error"]],"hollowman":[["Stalk from the Corner","Tilt the Stitched Mask","Invite the Nightmare","Walk Through the Opening","Make the Arena Uneasy"],["Drag Him into the Woods","Absorb the Impact","Keep Advancing","Turn Fear into Control","Breathe Behind the Mask"],["Rise from the Canvas","Refuse the Last Breath","Stalk Through the Pain","Make Him Doubt Reality","Return from the Dark"],["Call for Last Breath","End the Urban Legend","Take Him into the Woods","Close the Final Chapter","Leave No Witness"]],"damian-blackwell":[["Wait for One Opening","Circle in Silence","Measure the Distance","Strike Without Warning","Hide the Kill Shot"],["Exploit the Smallest Error","Cut Off the Angle","Stay Emotionless","Control with Precision","Make Stillness Dangerous"],["Disappear from Danger","Counter in One Motion","Reset the Target","Find the Blind Angle","Turn Defence into a Strike"],["Call for Kill Shot","End It Without Warning","Take the Perfect Angle","One Opening, One Strike","Finish in Silence"]],"elias-crowe":[["Laugh at the First Hit","Start the Chaos","Welcome the Pain","Rush the Corner","Make the Referee Nervous"],["Turn It into a Street Fight","Rip at the Straitjacket","Make Order Impossible","Fight Outside the Rules","Smile Through the Damage"],["Laugh Back to Life","Crawl Toward Danger","Beg for More","Turn Pain into Madness","Break the Match Open"],["Call for Beautiful Disaster","Finish in Total Chaos","Make the Ending Unhinged","Crash Through the Limit","Leave the Ring in Ruins"]],"el-rey-del-cielo":[["Take to the Sky","Test the Ropes","Spin Past the Lock-Up","Make Gravity Optional","Launch Before He Blinks"],["Own the Airspace","Change Direction Mid-Flight","Use the Ropes as Wings","Fly Over the Defence","Keep the Pace Impossible"],["Spring Back to Life","Escape Through the Air","Land on His Feet","Reach for the Sky","Turn the Fall into Flight"],["Call for Crown of the Sky","Finish from Above","Take the Final Flight","Rule the Air One Last Time","Drop from the Heavens"]],"max-justice":[["Stand for the Crowd","Raise the Heroic Fist","Meet Him Head On","Fight the Right Way","Protect the Centre"],["Heroic Pressure","Rally the Arena","Power Through the Defence","Keep Fighting Fair","Turn Courage into Control"],["Rise for Everyone","Launch the Hero\u2019s Return","Refuse to Surrender","Fight Through the Pain","Stand Tall Again"],["Call for Hero\u2019s End","Deliver Street Justice","Finish for the People","One Final Act of Courage","End It Like a Hero"]],"primal":[["Hunt from the Bell","Let Out the Roar","Drop into a Predator Stance","Charge on Instinct","Claim the Territory"],["Overwhelm the Prey","Abandon Technique","Use Raw Force","Pace Behind the Target","Tear Through the Defence"],["Unleash the Beast","Roar Through the Pain","Fight on Pure Instinct","Break Free of the Trap","Turn Wounds into Rage"],["Call for Apex Assault","Finish the Hunt","Devour the Final Opening","Strike Like the Apex","End It with Raw Instinct"]],"lucas-bennett":[["Shoot for the Takedown","Set an Olympic Pace","Win the Scramble","Test the Base","Wrestle for Position"],["Chain the Takedowns","Use Elite Conditioning","Force the Mat Game","Control Every Scramble","Turn It into a Final"],["Rebuild the Base","Wrestle Out of Danger","Trust the Conditioning","Reverse the Position","Win the Desperate Scramble"],["Call for Gold Standard","Finish the Tournament","Execute the Medal Sequence","Win the Final Exchange","Seal It with Elite Wrestling"]],"marcus-king":[["Throw the First Punch","Rule the Streets","Take the Block","Talk and Swing","Start a Street Fight"],["Street-King Pressure","Back Him into the Corner","Fight with Rhythm","Own the Neighbourhood","Unload the Combination"],["Fight Back from the Streets","Dig into Street Grit","Swing Until It Changes","Refuse to Be Run Off","Turn Pain into Confidence"],["Call for Street Justice","End It on His Block","Deliver the King\u2019s Verdict","Finish with the Combination","Rule the Final Exchange"]],"mateo-vega":[["Sell the Fake","Point Behind Him","Make Him Guess","Pretend to Slip","Steal the First Opening"],["Run the Con","Distract the Referee","Attack from the Other Side","Fake the Injury","Smile Through the Trick"],["Play Possum","Escape with a Lie","Make Him Chase the Wrong Target","Spring the Counter","Turn Panic into a Con"],["Call for Grand Illusion","Steal the Finish","End It with Misdirection","Pull the Final Trick","Make the Pin Disappear"]],"ryder-phoenix":[["Start the Concert","Demand the Spotlight","Play to the Front Row","Mouth Off Before Contact","Hit the Opening Riff"],["Rockstar Pressure","Play Air Guitar","Turn the Ring into a Stage","Keep the Crowd Singing","Make Every Hit a Chorus"],["Find the Encore","Rise for One More Song","Feed Off the Noise","Refuse to Leave the Stage","Turn the Boos into Fuel"],["Call for Final Encore","Drop the Last Note","End the Show Loud","Take the Closing Solo","Finish the Concert"]],"sterling-sinclair":[["Flash the Gold","Outclass the Challenger","Make Him Chase","Dust Off the Shoulder","Set an Expensive Pace"],["Apply the Golden Touch","Wrestle with Luxury","Humiliate the Opposition","Keep the Suit Clean","Make It Look Effortless"],["Protect the Investment","Escape with Class","Restore the Golden Image","Never Show Desperation","Buy Time with Style"],["Call for Golden Touch","Close the Deal","Finish with First-Class Precision","Cash In the Final Opening","Make the Ending Exclusive"]],"dave-maddox":[["Outwork Him Early","Set the Veteran Pace","Make Him Earn Everything","Start the Long Shift","Win the First Grind"],["Keep Grinding Forward","Use Veteran Timing","Turn Work Rate into Control","Refuse the Easy Way","Wear Him Down Honestly"],["Find Another Gear","Work Through the Exhaustion","Drag Himself Up","Give One More Effort","Outlast the Storm"],["Call for Final Shift","Finish the Long Night","Empty the Tank","Win with Veteran Grit","One Last Workhorse Burst"]],"logan-steele":[["Cup an Ear to the Crowd","Fire Up the Arena","Point to the People","Stand Like a Legend","Test His Strength"],["Legendary Pressure","Feed Off the Noise","Shake Off the Damage","Use Veteran Timing","Make the Arena Believe"],["Hulk Up","The Legend Won\u2019t Die","Rise with the Crowd","Stand Taller","Find the Heroic Second Wind"],["Call for Icon Slam","Finish the Story","End It Like a Legend","Give the Crowd the Moment","Deliver One More Icon Slam"]]};

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
 tvSting(isSinglesMatch()?'FEATURED SINGLES MATCH':(S.exhibition?'TAG TEAM EXHIBITION':'TAG TEAM GAUNTLET'),isSinglesMatch()?'ONE-ON-ONE':'THE BELL IS NEXT',`${currentVenue()} · ${attendance()} fans`);
 clearStoryTimer();const isOpeningGauntlet=!S.exhibition&&S.streak===0;const q=(S.exhibition||isOpeningGauntlet)?null:walkout();if(q)return lose(`${q.name} walks away before the bell!`);
 let storyKey=chooseStory();
 if(isOpeningGauntlet&&['comeback','upset'].includes(storyKey))storyKey=one(['classic','war','tagClinic']);
 const story=STORY_TYPES[storyKey],eventTarget=Math.round(rnd(story.min,story.max));
 const teamPower=score(S.team),oppPower=score(S.opp)+S.streak*.7;
 let hiddenEdge=(teamPower-oppPower)/7+story.bias+rnd(-8,8);
 if(isOpeningGauntlet)hiddenEdge=Math.max(18,hiddenEdge+22);
 if(story.upset)hiddenEdge=teamPower>=oppPower?rnd(-10,-3):rnd(3,10);
 const startPlayer=Math.round(teamPower),startOpp=Math.round(oppPower);
 M={storyKey,story,eventTarget,eventIndex:0,phaseIndex:0,activeP:0,activeO:0,playerControl:50+hiddenEdge,playerMom:12+S.momentum*2,oppMom:12+S.streak,log:[],highlights:[],nearFalls:0,finishers:0,tags:0,decisionsMade:0,nextDecisionAt:decisionPoints(eventTarget,story.decisions),waiting:false,ended:false,latest:'',winner:null,loser:null,turningPoint:'',bestMoment:'',mvp:null,matchSeconds:Math.round(rnd(330,900)),phaseLabel:'Opening Bell',spotlight:null,personalityMoments:{},startPlayer,startOpp,performancePlayer:0,performanceOpp:0,decisionPlayer:0,decisionOpp:0,crowd:8,crowdPlayer:0,crowdOpp:0,finalPlayer:0,finalOpp:0,finishType:'',decisionSeen:[],currentDecision:null};
 addBroadcast('broadcast',`${isSinglesMatch()?'YOUR WRESTLER':'YOUR TEAM'}: ${S.team.map(wrestlerIntro).join(' / ')}`); addBroadcast('broadcast',`${isSinglesMatch()?'OPPONENT':'OPPOSITION'}: ${S.opp.map(wrestlerIntro).join(' / ')}`);
 addBroadcast('phase','OPENING BELL');
 S.team.forEach(w=>addBroadcast('entrance',entranceLine(w)));
 S.opp.forEach(w=>addBroadcast('entrance',entranceLine(w)));
 addBroadcast('commentary',commentatorLine(COMMENTATORS.play,one(isSinglesMatch()?BROADCAST_COMMENTARY.openingSingles:BROADCAST_COMMENTARY.openingTag)));
 addBroadcast('commentary',commentatorLine(COMMENTATORS.colour,factionIdentity(S.opp)));
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
 <div class="broadcast-layout"><div class="broadcast-card">${card(p,'',true)}<small>${isSinglesMatch()?'YOUR WRESTLER':'LEGAL WRESTLER'}</small></div><div id="broadcastFeed" class="broadcast-feed">${M.log.slice(-10).map((e,i)=>`<div class="broadcast-line ${e.type} ${i===M.log.slice(-10).length-1?'latest':''}">${e.type==='phase'?'<b>'+e.text+'</b>':e.text}</div>`).join('')}</div><div class="broadcast-card">${card(o,'',true)}<small>${isSinglesMatch()?'OPPONENT':'LEGAL WRESTLER'}</small></div></div>
 ${M.spotlight?`<div class="signature-spotlight"><small>★ SIGNATURE MOVE ★</small><h2>${M.spotlight.move}</h2><h3>${M.spotlight.name}</h3><p>${M.spotlight.tagline}</p></div>`:''}<div class="broadcast-status"><span>Moment ${Math.min(M.eventIndex+1,M.eventTarget)} of ${M.eventTarget}</span><span>${formatTime(Math.round(M.matchSeconds*(M.eventIndex/Math.max(1,M.eventTarget))))}</span></div>
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
function shiftControl(amount,reason){const before=M.playerControl;M.playerControl=clamp(M.playerControl+amount,5,95);if(!S.exhibition&&S.streak===0)M.playerControl=Math.max(56,M.playerControl);if(Math.abs(M.playerControl-before)>=9&&!M.turningPoint)M.turningPoint=reason}
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
 if(Math.random()<.58){const line=personalityEvent(actor);M.personalityMoments[actor.id]=(M.personalityMoments[actor.id]||0)+1;addMatchScore(playerActs?'player':'opp',1);heatCrowd(2,playerActs?'player':'opp');addBroadcast('personality',`${actor.name} ${line}.`,{highlight:true,weight:1.25});if(Math.random()<.28){const factionLine=factionBroadcast(actor);if(factionLine)addBroadcast('faction',factionLine,{highlight:false,weight:1.1});}}
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
function storyChoice(token){if(!M||!M.waiting)return;const choice=M.currentDecision?.options?.find(x=>x.token===token);if(!choice)return;M.waiting=false;M.decisionsMade++;const p=S.team[M.activeP],o=S.opp[M.activeO],id=choice.action;let chance=decisionChance(p,o,id);if(!S.exhibition&&S.streak===0)chance=Math.max(.82,chance);const success=Math.random()<chance;
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
 if(openingGauntletMatch&&M.finalPlayer<=M.finalOpp){
   const winningMargin=Math.max(8,Math.round(rnd(8,14)));
   M.performancePlayer+=(M.finalOpp+winningMargin)-M.finalPlayer;
   M.finalPlayer=Math.round(M.startPlayer+M.performancePlayer+M.decisionPlayer+crowdBonusPlayer);
   addBroadcast('commentary','The opening gauntlet match becomes the perfect introduction—and your team finds a way through!');
 }
 const gap=Math.abs(M.finalPlayer-M.finalOpp);M.finishType=gap>=22?'Decisive Finish':gap>=10?'Competitive Finish':'Photo Finish';
 const win=openingGauntletMatch||M.finalPlayer>=M.finalOpp;const side=win?'player':'opp';const winnerTeam=win?S.team:S.opp,loserTeam=win?S.opp:S.team;
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
 'damian-blackwell':'walks away without celebration—the assignment is complete.',
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
 const rating=clamp(2.15+M.highlights.length*.16+M.nearFalls*.28+M.finishers*.2+M.tags*.08+M.eventTarget*.055,1,5);
 const ratingData=matchRatingData(rating),highlights=[...M.highlights].slice(-5),story=buildSummaryStory();
 recordCompletedMatch(win,rating);
 M.lossMessage=`${M.winner.name} wins after a ${rating.toFixed(1)}-star match.`;
 const playerCrowd=Math.round(M.crowdPlayer*.12),oppCrowd=Math.round(M.crowdOpp*.12);
 const winningSide=win?S.team:S.opp;
 const resultArt=winningSide.map(w=>heroPortrait(w,'winner',characterImageConfig(w)?'victory':'full')).join('');
 render(`<section class="panel match-result summary-panel presentation-summary">
 <div class="actions top-actions">${S.exhibition?`<button class="btn" onclick="quickRematch()">REMATCH</button><button class="btn secondary" onclick="quickMatchMenu()">QUICK MATCH MENU</button>`:(win?`<button class="btn" onclick="postMatchFlow()">${S.specialSingles?'RETURN TO GAUNTLET':'CONTINUE BROADCAST'}</button>`:`<button class="btn" onclick="handleLoss()">CONTINUE</button>`)}</div>
 <div class="result-broadcast-header"><small>${S.exhibition?'EXHIBITION RESULT':'GAUNTLET RESULT'} · ${isSinglesMatch()?'SINGLES':'TAG TEAM'}</small><h1>${finishHeadline()}</h1><p>${currentVenue()} · ${length}</p></div>
 <div class="winner-celebration television-winners result-${win?'win':'loss'}"><div class="confetti-field"></div><div class="winning-team-art ${isSinglesMatch()?'singles-winner':''}">${resultArt}</div><div class="winner-copy"><small>${isSinglesMatch()?'MATCH WINNER':'WINNING TEAM'}</small><h2>${teamName(winningSide)}</h2><p>${victoryCelebration(M.winner)}</p></div></div>
 <div class="result-accolades"><article><small>MATCH RATING</small><span class="result-stars">${ratingData.stars}</span><strong>${rating.toFixed(1)} · ${ratingData.label}</strong></article><article><small>CROWD REACTION</small><b>${crowdReaction()}</b><strong>EXCITEMENT ${Math.round(M.crowd)}%</strong></article><article><small>FINISH</small><b>${M.finishType.toUpperCase()}</b><strong>${M.winner.name} · ${M.winner.finisher}</strong></article></div>
 <div class="match-breakdown"><h3>Match Score Breakdown</h3><div class="breakdown-head"><strong>${S.team.map(x=>x.name).join(' & ')}</strong><b>${M.finalPlayer} – ${M.finalOpp}</b><strong>${S.opp.map(x=>x.name).join(' & ')}</strong></div><div class="breakdown-row"><span>Starting Score</span><b>${M.startPlayer}</b><i>${M.startOpp}</i></div><div class="breakdown-row"><span>Performance</span><b>${Math.round(M.performancePlayer)}</b><i>${Math.round(M.performanceOpp)}</i></div><div class="breakdown-row"><span>Crowd Bonus</span><b>${playerCrowd}</b><i>${oppCrowd}</i></div><div class="breakdown-row"><span>Decision Bonus</span><b>${Math.round(M.decisionPlayer)}</b><i>${Math.round(M.decisionOpp)}</i></div></div>
 <div class="summary-grid"><article><small>MATCH STORY</small><p>${story}</p></article><article><small>MATCH MVP</small><h2>${M.mvp.name}</h2><p>${mvpReason(M.mvp)}</p></article><article><small>TURNING POINT</small><p>${M.turningPoint||'The match remained balanced until the final exchange.'}</p></article><article><small>BEST MOMENT</small><p>${M.bestMoment||`${M.winner.name} delivered ${M.winner.finisher} to end the match.`}</p></article></div>
 <div class="highlight-reel"><h3>Broadcast Highlights</h3>${highlights.map(x=>`<p>${x}</p>`).join('')}</div>${milestoneData().length?`<div class="milestone-grid">${milestoneData().map(m=>`<article><small>ACHIEVEMENT ANNOUNCER</small><h2>${m[0]}</h2><p>${m[1]}</p></article>`).join('')}</div>`:''}</section>`)
}

function postMatchFlow(){
 if(S.specialSingles){restoreTagTeams();return rewards();}
 // The first Gauntlet victory always pays out immediately so new players
 // experience the reward loop before any optional singles challenge.
 if(!S.exhibition&&S.streak===1)return rewards();
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
 render(`<section class="panel singles-intro television-card"><div class="actions top-actions"><button class="btn broadcast-button" onclick="match()">BEGIN SINGLES BROADCAST</button></div><div class="tv-kicker">FEATURED SINGLES MATCH</div><div class="cinematic-versus singles-cinematic"><div class="hero-team hero-left">${heroPortrait(chosen,'left')}</div><div class="giant-vs">VS</div><div class="hero-team hero-right">${heroPortrait(challenger,'right')}</div></div><p>${challenger.title} issued the challenge. ${chosen.title} accepted it.</p></section>`);
}
function declineSinglesChallenge(){overlay.innerHTML='';S.pendingChallenger=null;rewards();}
function restoreTagTeams(){if(S.tagBackup){S.team=S.tagBackup.team;S.opp=S.tagBackup.opp}S.tagBackup=null;S.specialSingles=false;}
function mvpReason(w){const moments=M.personalityMoments[w.id]||0;const reasons=[];if(w.id===M.winner.id)reasons.push(`sealed the victory with ${w.finisher}`);if(moments)reasons.push(`delivered ${moments} signature personality moment${moments===1?'':'s'}`);if(M.nearFalls>1)reasons.push('survived a match filled with near falls');if(!isSinglesMatch()&&M.tags>2)reasons.push('made a major impact in the tag exchanges');return reasons.length?reasons.slice(0,2).join(' and ')+'.':`${w.title} controlled the defining stretch of the match.`}
function buildSummaryStory(){const playerWon=M.winner&&S.team.some(x=>x.id===M.winner.id);if(isSinglesMatch()){const winnerSide=playerWon?'Your wrestler':'The opponent';const opener=M.storyKey==='comeback'?'The match became an underdog survival story':M.storyKey==='war'?'Both wrestlers traded control in a relentless battle':M.storyKey==='sprint'?'The contest exploded into a frantic sprint':M.storyKey==='domination'?'One wrestler seized control early and refused to release it':M.storyKey==='upset'?'The favourite was dragged into a dangerous upset attempt':'Both wrestlers built the contest carefully through every phase';return `${opener}. ${M.turningPoint||'The decisive momentum swing came late'}. ${winnerSide} closed the match when ${M.winner.name} landed ${M.winner.finisher}.`}const winnerSide=playerWon?'Your team':'The opposition';const opener=M.storyKey==='comeback'?'The match became an underdog survival story':M.storyKey==='war'?'Both teams traded control in a relentless war':M.storyKey==='sprint'?'The contest exploded into a frantic sprint':M.storyKey==='domination'?'One team seized control early and refused to release it':M.storyKey==='tagClinic'?'Quick tags and team combinations defined the match':M.storyKey==='upset'?'The favourites were dragged into a dangerous upset attempt':'Both teams built the contest carefully through every phase';return `${opener}. ${M.turningPoint||'The decisive momentum swing came late'}. ${winnerSide} closed the story when ${M.winner.name} landed ${M.winner.finisher}.`}
function formatTime(total){const m=Math.floor(total/60),s=String(total%60).padStart(2,'0');return `${m}:${s}`}
function handleLoss(){if(S.exhibition)return quickMatchMenu();if(S.specialSingles)restoreTagTeams();lose(M.lossMessage)}
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
function lose(msg){clearStoryTimer();if(S.wind){render(`<section class="panel home"><div class="actions top-actions"><button class="btn" onclick="useWind()">CONTINUE RUN</button></div><h1>SECOND WIND</h1><p>${msg}</p></section>`)}else render(`<section class="panel home"><div class="actions top-actions"><button class="btn" onclick="home()">PLAY AGAIN</button></div><h1>GAUNTLET OVER</h1><p>${msg}</p><h2>FINAL STREAK: ${S.streak}</h2></section>`)}
function useWind(){S.wind=false;rewards()}
function rosterStatus(){
 const upgraded=new Set(Object.keys(CHARACTER_IMAGE_MANAGER));
 render(`<section class="panel roster-status"><div class="actions top-actions"><button class="btn" onclick="home()">BACK</button></div><div class="tv-kicker">DEVELOPER TOOLS</div><h1 class="title">ROSTER STATUS</h1><p>Artwork checks update automatically. Green means the configured file loaded successfully; fallback means the original roster art remains available.</p><div class="roster-status-grid">${WRESTLERS.map(w=>{const c=characterImageConfig(w);return `<article class="roster-status-row" data-status-id="${w.id}"><div><b>${w.name}</b><small>${w.faction} · ${w.signature}</small></div><span class="status-pill ${c?'configured':'legacy'}">${c?'CONFIGURED':'LEGACY'}</span><span data-check="full">${c?'Checking full…':'Fallback art'}</span><span data-check="portrait">${c?'Checking portrait…':'Fallback art'}</span><span data-check="victory">${c?'Checking victory…':'Fallback art'}</span></article>`}).join('')}</div></section>`);
 upgraded.forEach(id=>{const w=WRESTLERS.find(x=>x.id===id),c=characterImageConfig(w);['full','portrait','victory'].forEach(type=>{const el=document.querySelector(`[data-status-id="${id}"] [data-check="${type}"]`);if(!el)return;const probe=new Image();probe.onload=()=>{el.textContent=`✓ ${type}`;el.className='asset-ok'};probe.onerror=()=>{el.textContent=`✕ ${type}`;el.className='asset-bad'};probe.src=c.assets[type]})});
}
home();


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
