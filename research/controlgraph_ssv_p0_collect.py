#!/usr/bin/env python3
import json, urllib.request, hashlib, math, statistics, datetime, sys
from pathlib import Path
from collections import Counter, defaultdict
from itertools import combinations

BASE="https://api.ssv.network/api/v4/mainnet"
OUT=Path("ssv_p0_full")
RAW=OUT/"raw"
RAW.mkdir(parents=True,exist_ok=True)

def fetch_json(path, save=None):
    url=BASE+path
    req=urllib.request.Request(url,headers={"Accept":"application/json","User-Agent":"ControlGraph-SSV-P0/1.0"})
    with urllib.request.urlopen(req,timeout=90) as r:
        raw=r.read()
    if save:
        (RAW/save).write_bytes(raw)
    return json.loads(raw), raw

meta={}
for path,name in [
    ("/clusters/count","clusters_count.json"),
    ("/validators/countActiveValidators","active_validators_count.json"),
    ("/statistics/totalEffectiveBalance","total_effective_balance.json"),
    ("/statistics/operators","operators_statistics.json"),
]:
    obj,raw=fetch_json(path,name)
    meta[path]=obj

first,raw=fetch_json("/clusters?page=1&perPage=100","clusters_page_001.json")
pag=first["pagination"]
pages=pag["pages"]
clusters=list(first["clusters"])
for p in range(2,pages+1):
    obj,raw=fetch_json(f"/clusters?page={p}&perPage=100",f"clusters_page_{p:03d}.json")
    clusters.extend(obj["clusters"])

supported={4:2,7:3,10:4,13:5}
active=[]
unsupported=[]
for c in clusters:
    try:
        vc=int(c.get("validatorCount") or 0)
        eb=float(c.get("effectiveBalance") or 0)
        ops=tuple(sorted(int(x) for x in c.get("operators",[])))
    except Exception:
        continue
    if bool(c.get("active")) and not bool(c.get("isLiquidated")) and vc>0 and eb>0:
        rec={
            "id":c.get("id"),"clusterId":c.get("clusterId"),"validatorCount":vc,
            "effectiveBalance":eb,"operators":ops,"n":len(ops),
            "ownerAddress":c.get("ownerAddress"),"blockNumber":c.get("blockNumber"),
            "createdAt":c.get("createdAt"),"updatedAt":c.get("updatedAt"),
        }
        if len(ops) in supported:
            rec["q_fail"]=supported[len(ops)]
            active.append(rec)
        else:
            unsupported.append(rec)

# Exact aggregation at cluster level is lossless for liveness because validators
# in a cluster share operator set and threshold.
operator_weight=defaultdict(float)
operator_clusters=defaultdict(int)
neighbors=defaultdict(set)
certificate_count=0
pair_exposure=defaultdict(float)
pair_validators=defaultdict(int)

for c in active:
    ops=c["operators"]; w=c["effectiveBalance"]; vc=c["validatorCount"]; q=c["q_fail"]
    certificate_count += math.comb(len(ops),q)
    for op in ops:
        operator_weight[op]+=w
        operator_clusters[op]+=1
        neighbors[op].update(x for x in ops if x!=op)
    if q==2:
        for a,b in combinations(ops,2):
            pair_exposure[(a,b)] += w
            pair_validators[(a,b)] += vc

degrees={op:len(neighbors[op]) for op in operator_weight}
vals=sorted(degrees.values())
def pct(xs,p):
    if not xs:return None
    if len(xs)==1:return xs[0]
    x=(len(xs)-1)*p
    lo=int(x); hi=min(lo+1,len(xs)-1); frac=x-lo
    return xs[lo]*(1-frac)+xs[hi]*frac

top_pair=max(pair_exposure.items(),key=lambda kv:(kv[1],tuple(-x for x in kv[0]))) if pair_exposure else (None,0)
total_weight=sum(c["effectiveBalance"] for c in active)
total_validators=sum(c["validatorCount"] for c in active)
size_dist=Counter(c["n"] for c in active)
q_dist=Counter(c["q_fail"] for c in active)
delta=max(vals) if vals else 0
top_degree=sorted(degrees.items(),key=lambda kv:(-kv[1],kv[0]))[:50]

summary={
    "snapshot_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source_base":BASE,
    "api_meta":meta,
    "raw_cluster_count":len(clusters),
    "active_supported_clusters":len(active),
    "active_unsupported_clusters":len(unsupported),
    "active_supported_validators_sum":total_validators,
    "active_supported_effective_balance_sum":total_weight,
    "active_operator_count":len(operator_weight),
    "cluster_size_distribution":dict(sorted(size_dist.items())),
    "failure_threshold_distribution":dict(sorted(q_dist.items())),
    "minimal_certificate_count":certificate_count,
    "delta_g":delta,
    "degree_summary":{
        "min":min(vals) if vals else None,
        "median":statistics.median(vals) if vals else None,
        "p90":pct(vals,.90),"p95":pct(vals,.95),"p99":pct(vals,.99),
        "max":max(vals) if vals else None,
    },
    "top_degree_operators":[{"operator":op,"degree":d,"clusters":operator_clusters[op],"incident_weight":operator_weight[op]} for op,d in top_degree],
    "exact_E2":{
        "pair":list(top_pair[0]) if top_pair[0] else None,
        "effective_balance":top_pair[1],
        "share_of_active_supported_weight":(top_pair[1]/total_weight if total_weight else None),
        "validator_count":pair_validators.get(top_pair[0],0) if top_pair[0] else 0,
    },
    "unsupported_active_cluster_sizes":dict(Counter(c["n"] for c in unsupported)),
}

OUT.mkdir(exist_ok=True)
(OUT/"clusters_all.json").write_text(json.dumps(clusters,separators=(",",":")),encoding="utf-8")
(OUT/"active_supported_clusters.json").write_text(json.dumps(active,indent=2),encoding="utf-8")
(OUT/"active_unsupported_clusters.json").write_text(json.dumps(unsupported,indent=2),encoding="utf-8")
(OUT/"structural_summary.json").write_text(json.dumps(summary,indent=2),encoding="utf-8")

# CSV exports
import csv
with (OUT/"active_clusters.csv").open("w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["id","clusterId","validatorCount","effectiveBalance","n","q_fail","operators"])
    for c in active:
        w.writerow([c["id"],c["clusterId"],c["validatorCount"],c["effectiveBalance"],c["n"],c["q_fail"],";".join(map(str,c["operators"]))])
with (OUT/"operator_degrees.csv").open("w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["operator","degree","clusters","incident_effective_balance"])
    for op,d in sorted(degrees.items(),key=lambda kv:(-kv[1],kv[0])):
        w.writerow([op,d,operator_clusters[op],operator_weight[op]])
with (OUT/"q2_pair_exposure.csv").open("w",newline="",encoding="utf-8") as f:
    w=csv.writer(f); w.writerow(["operator_a","operator_b","effective_balance","validator_count"])
    for (a,b),v in sorted(pair_exposure.items(),key=lambda kv:(-kv[1],kv[0])):
        w.writerow([a,b,v,pair_validators[(a,b)]])

# raw/data hashes
files=[p for p in OUT.rglob("*") if p.is_file()]
with (OUT/"SHA256SUMS.txt").open("w",encoding="utf-8") as f:
    for p in sorted(files):
        if p.name=="SHA256SUMS.txt": continue
        h=hashlib.sha256(p.read_bytes()).hexdigest()
        f.write(f"{h}  {p.relative_to(OUT)}\n")

print(json.dumps(summary,indent=2))
