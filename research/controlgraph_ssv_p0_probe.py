#!/usr/bin/env python3
import json, os, urllib.request, urllib.parse, time, sys
from pathlib import Path

BASE="https://api.ssv.network/api/v4/mainnet"
OUT=Path("ssv_probe")
OUT.mkdir(exist_ok=True)

def get(path):
    url=BASE+path
    req=urllib.request.Request(url,headers={"Accept":"application/json","User-Agent":"ControlGraph-SSV-P0/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw=r.read()
        return r.status, dict(r.headers), raw

endpoints=[
    "/health",
    "/clusters/count",
    "/validators/countActiveValidators",
    "/statistics/totalEffectiveBalance",
    "/statistics/operators",
    "/clusters",
    "/clusters?page=1",
    "/clusters?limit=5&page=1",
    "/clusters?page=1&perPage=5",
    "/validators?limit=5&page=1",
    "/operators?limit=5&page=1",
]
summary=[]
for i,ep in enumerate(endpoints):
    try:
        st,h,raw=get(ep)
        name=f"{i:02d}_{ep.strip('/').replace('/','_').replace('?','_').replace('&','_').replace('=','-') or 'root'}"
        (OUT/f"{name}.bin").write_bytes(raw)
        text=raw.decode("utf-8","replace")
        rec={"endpoint":ep,"status":st,"bytes":len(raw),"content_type":h.get("Content-Type"),"text_head":text[:1000]}
        try:
            obj=json.loads(text)
            rec["json_type"]=type(obj).__name__
            if isinstance(obj,dict):
                rec["keys"]=sorted(obj.keys())
                for k,v in obj.items():
                    if isinstance(v,list): rec[f"len_{k}"]=len(v)
            elif isinstance(obj,list):
                rec["len"]=len(obj)
                if obj and isinstance(obj[0],dict): rec["item_keys"]=sorted(obj[0].keys())
        except Exception as e:
            rec["json_error"]=str(e)
        summary.append(rec)
        print(json.dumps(rec,ensure_ascii=False))
    except Exception as e:
        summary.append({"endpoint":ep,"error":repr(e)})
        print(ep,repr(e),file=sys.stderr)

(OUT/"probe_summary.json").write_text(json.dumps(summary,indent=2),encoding="utf-8")
