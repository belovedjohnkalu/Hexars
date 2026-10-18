# Run from repository root after npm run build:engine. Writes isolated QA SQL and caps to /tmp only.
import json,subprocess,uuid,secrets,hashlib
from pathlib import Path
p=subprocess.Popen(['engines/engine-1/engine-one'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
seq=0
def ask(**packet):
 global seq
 seq+=1;p.stdin.write(json.dumps(dict(protocolVersion=1,requestId=str(seq),**packet))+'\n');p.stdin.flush();out=json.loads(p.stdout.readline());assert out['type']!='error',out;return out
initial=ask(type='new_game',variant='shafran');cells=initial['game']['board']['cells']
def fixture(parts,active=0):
 state=json.loads(json.dumps(initial['state']));state.update(occupants=[None]*70,activePlayer=active,positionHistory=[])
 for notation,type,player,moved in parts:
  state['occupants'][next(i for i,c in enumerate(cells) if c['notation']==notation)]=dict(type=type,player=player,hasMoved=moved)
 return ask(type='position',state=state)
fixtures={}
fixtures['castle']=fixture([('e1','king',0,False),('e10','king',1,False),('a1','rook',0,False),('i5','rook',0,False)])
fixtures['promotion']=fixture([('a1','king',0,True),('i10','king',1,True),('e9','pawn',0,True)])
fixtures['mate']=fixture([('a1','king',0,True),('e8','queen',0,True),('e10','king',1,True)],1)
fixtures['stalemate']=fixture([('b7','king',0,True),('g9','queen',0,True),('e10','king',1,True)],1)
ep=fixture([('a1','king',0,True),('i10','king',1,True),('d8','pawn',1,False),('e6','pawn',0,True),('c4','pawn',0,True)],1)
move=next(m for m in ep['game']['legalMoves'] if m['fromNotation']=='d8' and m['toNotation']=='d5')
fixtures['ep']=ask(type='play_move',stateId=ep['game']['stateId'],move=move)
rows=[];metadata={}
for name,f in fixtures.items():
 id=str(uuid.uuid4());token=secrets.token_hex(32);hashed=hashlib.sha256(token.encode()).hexdigest()
 state=json.dumps(f['state'],separators=(',',':')).replace("'","''")
 rows.append(f"('{id}','{hashed}','two_players',0,'{state}'::jsonb,'[]'::jsonb,'[]'::jsonb,0,3)")
 metadata[name]=dict(gameId=id,accessToken=token,expected=f['game'])
Path('/tmp/ion-shafran-fixtures.json').write_text(json.dumps(metadata))
Path('/tmp/ion-shafran-fixtures.sql').write_text('INSERT INTO hexchess_games(id,access_token_hash,mode,human_player,state,timeline,moves,version,difficulty) VALUES '+',\n'.join(rows)+';')
p.stdin.write('quit\n');p.stdin.flush();p.wait();print('Prepared isolated Shafran QA fixtures:',', '.join(fixtures))
