import random, statistics, json

DAYS_PER_MONTH=28

def day_index(c): return (c['month']-1)*28+(c['week']-1)*7+c['day']
def advance(c):
    c['day'] += 1
    if c['day'] > 6:
        c['day']=0; c['week'] += 1
        if c['week'] > 4: c['week']=1; c['month'] += 1

def injury_month_sim(treatment='rest'):
    c={'day':1,'week':1,'month':1,'world':{'injury':{'name':'Bruised ribs','severity':'Minor','diagnosed':False}}}
    events=[]
    # initial diagnosis once
    i=c['world']['injury']; events.append('diagnosis'); i.update(active=True,diagnosed=True,treatment=treatment,risk='High' if treatment=='push' else 'Reduced',started=day_index(c),until=day_index(c)+(5 if treatment=='push' else 4))
    advance(c)
    while day_index(c)<28:
        i=c['world'].get('injury')
        if i:
            if day_index(c)>=i['until']:
                events.append('clearance'); c['world']['injury']=None; c['world']['injuryCooldownUntil']=day_index(c)+56
            elif c['day'] in (0,3): events.append('non-wrestling')
            elif c['day']==2: events.append('restricted-training')
            else: events.append('recovery-progress')
        else: events.append('normal-day')
        advance(c)
    return events,c

def sim_match(first=False):
    n=random.choice([4,5])
    outcomes=random.choices(['ms','s','m','f','mf'],weights=[15,35,25,20,5],k=n)
    impact={'ms':15,'s':10,'m':4,'f':-4,'mf':-8}
    player_dec=max(0,sum(impact[o] for o in outcomes))*.90
    player_perf=random.uniform(28,64)*.94
    failures=sum(o in ('f','mf') for o in outcomes)
    ai_pos=0
    for o in outcomes:
        chance=.38+(.08 if o=='f' else .14 if o=='mf' else -.15 if o=='ms' else -.09 if o=='s' else 0)
        if random.random()<max(.10,min(.68,chance*.68)): ai_pos+=1
    vol=random.uniform(-12,14)
    opp_perf=max(random.uniform(12,32),18+ai_pos*3+failures*2+vol)
    opp_dec=max(random.uniform(18,36),18+n*3+ai_pos*4+max(0,vol))
    player=98+player_perf+player_dec+random.uniform(3,13)+(28 if first else 0)
    opp=98+opp_perf+opp_dec+random.uniform(2,12)
    return player>=opp

rest_events,rest_state=injury_month_sim('rest')
push_events,push_state=injury_month_sim('push')
assert rest_events.count('diagnosis')==1
assert push_events.count('diagnosis')==1
assert rest_events.count('clearance')==1
assert push_events.count('clearance')==1
assert rest_state['world']['injury'] is None and push_state['world']['injury'] is None

rates=[]; months_win=months_loss=0
for _ in range(5000):
    wins=[sim_match(first=(i==0)) for i in range(8)]
    rates.append(sum(wins)/8)
    months_win += any(wins)
    months_loss += not all(wins)
summary={
 'injury_rest':{'diagnoses':rest_events.count('diagnosis'),'clearances':rest_events.count('clearance'),'loop':rest_events.count('diagnosis')>1},
 'injury_push':{'diagnoses':push_events.count('diagnosis'),'clearances':push_events.count('clearance'),'loop':push_events.count('diagnosis')>1},
 'balance':{'simulated_months':5000,'matches_per_month':8,'mean_win_rate':round(statistics.mean(rates),3),'median_win_rate':round(statistics.median(rates),3),'months_with_win':round(months_win/5000,3),'months_with_loss':round(months_loss/5000,3)}
}
assert .35 <= summary['balance']['mean_win_rate'] <= .70
assert summary['balance']['months_with_win'] > .95
print(json.dumps(summary,indent=2))
open('/mnt/data/lpw_build7/BUILD-7-FIRST-MONTH-SIMULATION.json','w').write(json.dumps(summary,indent=2))
