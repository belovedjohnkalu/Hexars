# Isolated QA states from the native executable; never load user-supplied state via HTTP.
import json,subprocess,uuid,secrets,hashlib
from pathlib import Path
p=subprocess.Popen(['engines/engine-1/engine-one'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
def ask(**message):
 p.stdin.write(json.dumps(dict(protocolVersion=1,requestId='horizontal-qa',**message))+'\n');p.stdin.flush();out=json.loads(p.stdout.readline());assert out['type']!='error',out;return out
rows=[];metadata={}
for variant in ('brusky','devasa'):
 initial=ask(type='new_game',variant=variant);cells=initial['game']['board']['cells'];brusky=variant=='brusky'
 def fixture(parts,active=0):
  state=json.loads(json.dumps(initial['state']));state.update(occupants=[None]*len(cells),activePlayer=active,positionHistory=[])
  for notation,type,player,moved in parts:state['occupants'][next(i for i,c in enumerate(cells) if c['notation']==notation)]=dict(type=type,player=player,hasMoved=moved)
  return ask(type='position',state=state)
 fixtures={
 'castle':fixture([('f1','king',0,False),('g8' if brusky else 'd9','king',1,False),('a1','rook',0,False),('i1','rook',0,False)]),
 'promotion':fixture([('a1','king',0,True),('a5','king',1,True),('g7' if brusky else 'g8','pawn',0,True)]),
 'mate':fixture([('a5' if brusky else 'a9','king',0,True),('l4' if brusky else 'i1','king',1,True),('j4' if brusky else 'g1','queen',0,True)],1),
 'stalemate':fixture([('h2' if brusky else 'a9','king',0,True),('l4' if brusky else 'i1','king',1,True),('k6' if brusky else 'g2','queen',0,True)],1)}
 ep=fixture([('a1','king',0,True),('l8' if brusky else 'i9','king',1,True),('f7','pawn',1,False),('g5','pawn',0,True)],1)
 move=next(m for m in ep['game']['legalMoves'] if m['fromNotation']=='f7' and m['toNotation']=='f5');fixtures['ep']=ask(type='play_move',stateId=ep['game']['stateId'],move=move)
 metadata[variant]={}
 for name,f in fixtures.items():
  id=str(uuid.uuid4());token=secrets.token_hex(32);hashed=hashlib.sha256(token.encode()).hexdigest();state=json.dumps(f['state'],separators=(',',':')).replace("'","''")
  rows.append(f"('{id}','{hashed}','two_players',0,'{state}'::jsonb,'[]'::jsonb,'[]'::jsonb,0,3)");metadata[variant][name]=dict(gameId=id,accessToken=token)
Path('/tmp/ion-horizontal-fixtures.json').write_text(json.dumps(metadata));Path('/tmp/ion-horizontal-fixtures.sql').write_text('INSERT INTO hexchess_games(id,access_token_hash,mode,human_player,state,timeline,moves,version,difficulty) VALUES '+',\n'.join(rows)+';')
p.stdin.write('quit\n');p.stdin.flush();p.wait();print('Prepared ten isolated horizontal-variant fixtures')
