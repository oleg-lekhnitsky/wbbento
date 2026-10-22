from pathlib import Path
from base64 import b64encode
assets=Path(__file__).resolve().parents[1]/'public/assets/figma'
def image(name,attrs):
 data=b64encode((assets/(name+'.png')).read_bytes()).decode()
 return f'<image href="data:image/png;base64,{data}" {attrs}/>'
body=image('taxi-side-right','x="-1.751953125" y="-154.8984375" width="1115.59228515625" height="627.5206298828125"')
reflection=image('taxi-side-left','x="-1.751953125" y="-154.8984375" width="1115.59228515625" height="627.5206298828125" opacity=".2"')
roof=image('taxi-roof-sign','width="1390.07666015625" height="781.918212890625" transform="matrix(.9958153367 -.0913888663 .0913888663 .9958153367 -238.451171875 -138.412109375)"')
shadow=image('taxi-shadow','x="-122.880859375" y="-295.11328125" width="1115.59228515625" height="627.5206298828125"')
checks=''.join(f'<rect x="{x}" y="{y}" width="8.89863" height="8.89863"/>' for x,y in [(0,0),(8.8996,8.9017),(26.6949,8.9016),(17.7953,0),(35.5925,0)])
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="440" height="418" viewBox="0 0 440 418"><defs><clipPath id="shadow"><rect width="869.8307495" height="240.7567444"/></clipPath></defs><g transform="translate(-32 30.837890625)"><g transform="translate(-56.720703125 34.7421875)">{roof}<g transform="translate(121.126953125 140.216796875)" clip-path="url(#shadow)">{shadow}</g>{body}{reflection}<g fill="#202020" opacity=".8" transform="matrix(-.999761641 -.021832721 -.021832721 .999761641 289.4669 119.06815)">{checks}</g></g></g></svg>'''
(assets/'taxi-composed.svg').write_text(svg)
print('Rebuilt taxi composition from exact Figma transforms.')
