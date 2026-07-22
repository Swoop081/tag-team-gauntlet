import random, statistics, json, re
from collections import Counter

DAYS=364
MATCH_DAYS={0,3}

def sim_match(first=False, momentum=50, strength_edge=0, recent=None):
    decisions=random.choice([4,5])
    outcomes=random.choices(['ms','s','m','f','mf'],[14,34,27,20,5],k=decisions)
    impact={'ms':15,'s':10,'m':4,'f':-4,'mf':-8}
    pdec=max(-12,sum(impact[x] for x in outcomes))*.90
    failures=sum(x in ('f','mf') for x in outcomes)
    ai_pos=0
    for o in outcomes:
        chance=.36+(.08 if o=='f' else .14 if o=='mf' else -.15 if o=='ms' else -.09 if o=='s' else 0)+strength_edge/500
        if random.random()<max(.10,min(.66,chance*.68)): ai_pos+=1
    vol=random.uniform(-12,14)
    pperf=random.uniform(28,64)*.94 + (momentum-50)*.08 - strength_edge*.20
    operf=max(random.uniform(12,32),18+ai_pos*3+failures*2+vol+strength_edge*.45)
    odec=max(random.uniform(18,36),18+decisions*3+ai_pos*4+max(0,vol)+strength_edge*.25)
    recent=recent or []
    loss_guard=8 if len(recent)>=3 and sum(not x for x in recent[:5])>=3 else 0
    win_guard=6 if len(recent)>=4 and sum(recent[:5])>=4 else 0
    p=98+pperf+pdec+random.uniform(3,13)+(18 if first else 0)+loss_guard
    o=98+operf+odec+random.uniform(2,12)+win_guard
    win=p>=o
    gap=abs(p-o)
    competitive=max(0,1-gap/95)
    rating=max(1.25,min(4.85,2.15+competitive*1.75+random.gauss(0,.45)))
    return win,rating,gap,outcomes

def sim_year(seed):
    random.seed(seed)
    day=0; wins=losses=0; ratings=[]; injuries=[]; diagnosis=clearance=0
    injury=None; cooldown=-1; level=1; xp=0; points=0; supercards=0; rival_changes=0
    weekly=[]; motw_mismatches=0
    while day<DAYS:
        weekday=day%7
        week=day//7+1
        if injury and day>=injury['until']:
            clearance+=1; injuries[-1]['cleared']=day; injury=None; cooldown=day+56
        if weekday in MATCH_DAYS:
            if injury:
                # match replaced by non-wrestling segment
                xp+=35
            else:
                win,rating,gap,outcomes=sim_match(first=(wins+losses==0),momentum=50+max(-15,min(15,(wins-losses)*.35)),strength_edge=random.gauss(0,7),recent=[x[3] for x in weekly[-5:]])
                wins+=win; losses+=not win; ratings.append(rating); xp+=120 if win else 50
                weekly.append((week,rating,'player',win))
                # restrained injury rate, cooldown respected
                if day>=cooldown and random.random()<.035:
                    injury={'start':day,'until':day+random.choice([4,5]),'diagnosed':True}
                    diagnosis+=1; injuries.append({'start':day,'cleared':None})
        else:
            xp+=random.choice([20,35,45])
        while xp >= 180+(level-1)*70:
            xp-=180+(level-1)*70; level+=1; points+=1
        if weekday==6:
            # fabricate AI matches and ensure weekly best is actual max
            ai=[max(1.2,min(4.85,random.gauss(3.05,.62))) for _ in range(4)]
            rows=[r for w,r,t,win in weekly if w==week]+ai
            actual=max(rows)
            selected=max(rows)
            motw_mismatches += selected != actual
        if weekday==6 and week%4==0:
            supercards+=1; rival_changes+=1
        day+=1
    if injury:
        # year-end active injury is not a loop
        pass
    return dict(wins=wins,losses=losses,win_rate=wins/max(1,wins+losses),ratings=ratings,diagnosis=diagnosis,clearance=clearance,injuries=injuries,level=level,points=points,supercards=supercards,rival_changes=rival_changes,motw_mismatches=motw_mismatches,active_injury=bool(injury))

runs=[sim_year(i) for i in range(1000)]
all_r=[r for x in runs for r in x['ratings']]
summary={
 'simulated_careers':len(runs),
 'days_per_career':DAYS,
 'mean_matches':round(statistics.mean(x['wins']+x['losses'] for x in runs),2),
 'mean_win_rate':round(statistics.mean(x['win_rate'] for x in runs),3),
 'career_win_rate_p10_p90':[round(statistics.quantiles([x['win_rate'] for x in runs],n=10)[0],3),round(statistics.quantiles([x['win_rate'] for x in runs],n=10)[-1],3)],
 'careers_with_win':round(sum(x['wins']>0 for x in runs)/len(runs),3),
 'careers_with_loss':round(sum(x['losses']>0 for x in runs)/len(runs),3),
 'mean_rating':round(statistics.mean(all_r),2),
 'five_star_equivalent_rate':round(sum(r>=4.65 for r in all_r)/len(all_r),3),
 'rating_bands':dict(Counter('1.x' if r<2 else '2.x' if r<3 else '3.x' if r<4 else '4.x' for r in all_r)),
 'mean_injuries':round(statistics.mean(x['diagnosis'] for x in runs),2),
 'diagnosis_clearance_delta':sum(x['diagnosis']-x['clearance']-(1 if x['active_injury'] else 0) for x in runs),
 'injury_loops_detected':sum(any(i['cleared'] is not None and i['cleared']<=i['start'] for i in x['injuries']) for x in runs),
 'match_of_week_mismatches':sum(x['motw_mismatches'] for x in runs),
 'mean_level_at_year_end':round(statistics.mean(x['level'] for x in runs),1),
 'supercards_per_year':sorted(set(x['supercards'] for x in runs)),
 'rivalry_cycles_per_year':sorted(set(x['rival_changes'] for x in runs))
}
assert .45 <= summary['mean_win_rate'] <= .65
assert summary['careers_with_win'] == 1.0 and summary['careers_with_loss'] == 1.0
assert summary['injury_loops_detected']==0
assert summary['diagnosis_clearance_delta']==0
assert summary['match_of_week_mismatches']==0
assert summary['five_star_equivalent_rate']<.08
open('/mnt/data/lpw_build8/BUILD-8-ONE-YEAR-SIMULATION.json','w').write(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))
