"""Extract original, uncropped branded angle images from the local Figma cars frame."""
from pathlib import Path
import zipfile,json,sys
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else root.parents[1]/'wb bento.fig'
angles=[('front-left','Front left','5b6149d049c2a330ef0295fa323b8040041aa744',444),('front-right','Front right','9fc81153aafe002f08cad9ebdb63df1f62a1200f',451),('rear-left','Rear left','dc68c301b40cbc3686c780522e31ebfdd6b91ac0',458),('rear-right','Rear right','91bccf6e0dc04e2d53eb27f0dff45233bed32f0e',465),('side-left','Left side','18fbfe2ec50d6ca4e3780a21640ac8f74d564a40',473),('side-right','Right side','ea7645eb8bba44d01c9e754b56115260bbbe9b58',480)]
out=root/'public/assets/figma/cars';out.mkdir(exist_ok=True)
with zipfile.ZipFile(source) as archive:
 for key,label,hash,node in angles:(out/(key+'.png')).write_bytes(archive.read('images/'+hash))
(root/'data/car-references.json').write_text(json.dumps([{'id':key,'name':label,'src':'/assets/figma/cars/'+key+('-no-plate' if (out/(key+'-no-plate.png')).exists() else '')+'.png','figmaNode':'33:'+str(node),'imageHash':hash} for key,label,hash,node in angles],indent=2)+'\n')
print('Extracted 6 original uncropped references from cars frame 33:426.')
