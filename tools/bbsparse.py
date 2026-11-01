import gzip, struct, sys, json
class R:
    def __init__(s,b): s.b=b; s.i=0
    def u8(s): v=s.b[s.i]; s.i+=1; return v
    def i8(s): v=struct.unpack_from('>b',s.b,s.i)[0]; s.i+=1; return v
    def u16(s): v=struct.unpack_from('>H',s.b,s.i)[0]; s.i+=2; return v
    def i16(s): v=struct.unpack_from('>h',s.b,s.i)[0]; s.i+=2; return v
    def i32(s): v=struct.unpack_from('>i',s.b,s.i)[0]; s.i+=4; return v
    def i64(s): v=struct.unpack_from('>q',s.b,s.i)[0]; s.i+=8; return v
    def f32(s): v=struct.unpack_from('>f',s.b,s.i)[0]; s.i+=4; return v
    def f64(s): v=struct.unpack_from('>d',s.b,s.i)[0]; s.i+=8; return v
    def utf(s): n=s.u16(); v=s.b[s.i:s.i+n].decode('utf-8','replace'); s.i+=n; return v
def load(path, cw_map=None):
    raw=open(path,'rb').read()
    try: raw=gzip.decompress(raw)
    except Exception: pass
    assert raw[:4]==b'BBS1'
    r=R(raw); r.i=4
    kt=r.u8(); rd={0:r.u8,1:r.u16,2:r.i32}[kt]
    n=rd(); keys={}
    for _ in range(n):
        k=rd(); keys[k]=r.utf()
    def val():
        t=r.u8()
        if t==0:
            c=r.i32(); d={}
            for _ in range(c): k=keys[rd()]; d[k]=val()
            return d
        if t==1:
            c=r.i32(); return [val() for _ in range(c)]
        if t==2: return r.utf()
        if t==3: return r.i8()
        if t==4: return r.i16()
        if t==5: return r.i32()
        if t==6: return r.f32()
        if t==7: return r.i64()
        if t==8: return r.f64()
        if t==9: c=r.i32(); return [r.i8() for _ in range(c)]
        if t==10: c=r.i32(); return [r.i16() for _ in range(c)]
        if t==11: c=r.i32(); return [r.i32() for _ in range(c)]
        raise Exception('tipo %d en %d'%(t,r.i-1))
    return val(), r.i, len(raw), keys
if __name__=='__main__':
    d,i,n,keys=load(sys.argv[1]); print('consumido',i,'de',n, 'claves',len(keys))
    json.dump(d,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,indent=1)
