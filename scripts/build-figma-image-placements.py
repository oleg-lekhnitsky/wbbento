"""Rebuild per-preset image geometry from the decoded, tracked Figma audit."""
from pathlib import Path
import json, math, base64, html
root=Path(__file__).resolve().parents[1]
audit=json.loads((root/'design/figma-layouts.json').read_text())
assets=root/'public/assets/figma'
manifest=json.loads((assets/'manifest.json').read_text())
byhash={a['figma_image_hash']:a for a in manifest['assets']}
photos={0:31,2:64,3:241,4:167,5:265}
art={1:(80,77),2:(50,49),3:(248,247),4:(179,171),5:(275,273),6:(123,122),7:(198,197)}
photo_defaults={0:'driver-purple',1:'driver-purple',2:'driver-blue',3:'driver-phone',4:'driver-purple-phone',5:'driving-taxi',6:'driver-purple',7:'driver-purple'}
presets={name:i for i,name in enumerate(['Driver introduction','Vehicle rental','Rental & driver','Start today','Driver recruitment','Photo & payments','Your own car','Rental offer'])}
placements={};all_images=[]
def matrix(t):return 'matrix('+ ' '.join(str(t.get(k,v)) for k,v in [('m00',1),('m10',0),('m01',0),('m11',1),('m02',0),('m12',0)])+')'
for layout in audit['layouts']:
 idx=presets[layout['preset']];nodes={};parents={}
 def visit(n,parent=None):
  nodes[int(n['id'].split(':')[1])]=n
  if parent:parents[n['id']]=parent
  for c in n.get('children',[]):visit(c,n)
 visit(layout['frame']);result={}
 for n in nodes.values():
  for im in n.get('images',[]):
   ancestors=[];cur=n
   while cur['id'] in parents:
    cur=parents[cur['id']];ancestors.append({'id':cur['id'],'size':cur.get('size'),'transform':cur.get('transform'),'clips':cur.get('frameMaskDisabled') is False})
   all_images.append({'preset':idx,'node':n['id'],'name':n['name'],'size':n.get('size'),'transform':n.get('transform'),'opacity':n.get('opacity',1),'paint':im,'ancestors':ancestors})
 if idx in photos:
  n=nodes[photos[idx]];frame=parents[n['id']];im=n['images'][0];a=byhash[im['hash']];size=n['size'];fs=frame['size'];t=n['transform']
  cover=max(fs['x']/a['width'],fs['y']/a['height'])
  controls={'photoZoom':size['x']/(a['width']*cover)*100,'position':t['m02']/(fs['x']-size['x'])*100,'positionY':t['m12']/(fs['y']-size['x']/a['width']*a['height'])*100}
  result['photo']={'node':n['id'],'frame':fs,'imageSize':size,'transform':t,'source':'/assets/figma/'+a['file'],'defaultControls':{k:round(v,5) for k,v in controls.items()}}
 if idx in art:
  nodeid,frameid=art[idx];n=nodes[nodeid];frame=nodes[frameid];fs=frame['size'];chain=[];cur=n
  while cur['id']!=frame['id']:
   chain.append(cur);cur=parents[cur['id']]
  # Include overflow from the source's intentionally unclipped frames.
  viewport={1:(0,0,456.58,296.704),4:(0,0,536.51940918,291),5:(0,-274.509765625,893,530.509765625)}.get(idx,(0,0,fs['x'],fs['y']))
  x,y,w,h=viewport;paint=n['images'][0];a=byhash[paint['hash']];raw=base64.b64encode((assets/a['file']).read_bytes()).decode();uri='data:image/png;base64,'+raw
  ns=n['size'];pt=paint.get('transform') or {};uvy=pt.get('m12',0);uvh=pt.get('m11',1)
  content=f'<svg width="{ns["x"]}" height="{ns["y"]}" viewBox="0 {uvy*a["height"]} {a["width"]} {uvh*a["height"]}" preserveAspectRatio="none"><image href="{uri}" width="{a["width"]}" height="{a["height"]}"/></svg>'
  for i,item in enumerate(chain):
   clip=''
   if item is not n and item.get('frameMaskDisabled') is False:
    cs=item['size'];clip=f'<defs><clipPath id="clip{i}"><rect width="{cs["x"]}" height="{cs["y"]}"/></clipPath></defs>'
    content=f'{clip}<g clip-path="url(#clip{i})">{content}</g>'
   content=f'<g transform="{matrix(item.get("transform",{}))}">{content}</g>'
  filename=f'artwork-preset-{idx}.svg'
  (assets/filename).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{x} {y} {w} {h}">{content}</svg>')
  result['artwork']={'node':n['id'],'frame':fs,'frameClips':frame.get('frameMaskDisabled') is False,'source':'/assets/figma/'+a['file'],'rendered':'/assets/figma/'+filename,'style':{'left':str(x/fs['x']*100)+'%','top':str(y/fs['y']*100)+'%','width':str(w/fs['x']*100)+'%','height':str(h/fs['y']*100)+'%','right':'auto','bottom':'auto','objectFit':'fill','maxWidth':'none'},'chain':[{'id':item['id'],'size':item.get('size'),'transform':item.get('transform'),'clips':item.get('frameMaskDisabled') is False} for item in chain]}
 placements[str(idx)]=result
(root/'data/figma-image-placements.json').write_text(json.dumps(placements,ensure_ascii=False,indent=2)+'\n')
(root/'design/figma-image-audit.json').write_text(json.dumps({'source':'wb bento.fig','imageNodeCount':len(all_images),'images':all_images},ensure_ascii=False,indent=2)+'\n')
print(f'Audited {len(all_images)} image nodes; generated {len(photos)} photo crops and {len(art)} individual artwork placements.')
