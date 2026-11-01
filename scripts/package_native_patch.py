"""Package compiled GameMaker edits as small, hash-checked copy/insert patches.
Usage: python3 scripts/package_native_patch.py ORIGINAL MODIFIED OUTPUT
"""
import sys,struct,gzip,hashlib,json
from pathlib import Path
old=Path(sys.argv[1]).read_bytes();new=Path(sys.argv[2]).read_bytes()
def chunks(data):
 p=8;out=[]
 while p<len(data):
  name,n=struct.unpack_from('<4sI',data,p);out.append((name,p,n+8));p+=8+n
 assert p==len(data)
 return out
def prefix(a,b):
 i=0;n=min(len(a),len(b))
 while i+65536<=n and a[i:i+65536]==b[i:i+65536]:i+=65536
 while i<n and a[i]==b[i]:i+=1
 return i
def suffix(a,b):return prefix(a[::-1],b[::-1])
ops=[]
def literal(b):
 if b:ops.append((1,b))
def copy(p,n):
 if n:ops.append((0,p,n))
literal(new[:8]);oc={name:(p,n) for name,p,n in chunks(old)}
for name,p,n in chunks(new):
 if name not in oc:literal(new[p:p+n]);continue
 op,on=oc[name];a=old[op:op+on];b=new[p:p+n]
 if a==b:copy(op,on);continue
 if name==b'AUDO':
  oldcount=struct.unpack_from('<I',old,op+8)[0];count=struct.unpack_from('<I',new,p+8)[0];cursor=p
  for i in range(count):
   start=struct.unpack_from('<I',new,p+12+4*i)[0];size=4+struct.unpack_from('<I',new,start)[0]
   literal(new[cursor:start])
   if i<oldcount:
    previous=struct.unpack_from('<I',old,op+12+4*i)[0];previous_size=4+struct.unpack_from('<I',old,previous)[0]
    if previous_size==size and old[previous:previous+size]==new[start:start+size]:copy(previous,size)
    else:literal(new[start:start+size])
   else:literal(new[start:start+size])
   cursor=start+size
  literal(new[cursor:p+n]);continue
 left=prefix(a,b);right=suffix(a[left:],b[left:])
 copy(op,left);literal(b[left:len(b)-right if right else len(b)]);copy(op+len(a)-right,right)
raw=bytearray(b'BRP1'+hashlib.sha256(old).digest()+hashlib.sha256(new).digest()+struct.pack('<II',len(new),len(ops)))
result=bytearray()
for op in ops:
 raw.append(op[0])
 if op[0]==0:
  raw.extend(struct.pack('<II',op[1],op[2]));result.extend(old[op[1]:op[1]+op[2]])
 else:raw.extend(struct.pack('<I',len(op[1])));raw.extend(op[1]);result.extend(op[1])
assert result==new,'Delta reconstruction differs from the compiled game'
output=Path(sys.argv[3]);output.parent.mkdir(exist_ok=True,parents=True)
compressed=gzip.compress(raw,mtime=0)
if len(compressed)>20*1024*1024:
 parts=[]
 for i,start in enumerate(range(0,len(compressed),20*1024*1024),1):
  part=output.with_name(output.name+'.part'+str(i));part.write_bytes(compressed[start:start+20*1024*1024]);parts.append(part.name)
 output.with_name('battle.patch.json').write_text(json.dumps({'parts':parts,'compressed_sha256':hashlib.sha256(compressed).hexdigest()}))
 output.unlink(missing_ok=True)
else:output.write_bytes(compressed)
print(output.name,'compressed bytes',len(compressed),'verified sha256',hashlib.sha256(result).hexdigest())
