"""Generate the original vector artwork and short demo music bundled with the page.

Run with Python 3 and NumPy. The website itself needs no dependencies.
"""
from pathlib import Path
import math
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
ASSETS.mkdir(exist_ok=True)
(ASSETS / 'audio').mkdir(exist_ok=True)

def svg(name, content, background, title):
    data = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title">
<title id="title">{title} — original cover art</title>
<defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".12"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter></defs>
<rect width="600" height="600" fill="{background}"/>{content}<rect width="600" height="600" opacity=".14" filter="url(#grain)"/>
</svg>'''
    (ASSETS / f'{name}.svg').write_text(data, encoding='utf-8')

grid = ''.join(f'<ellipse cx="300" cy="340" rx="{r}" ry="175"/>' for r in [35,75,115,150,175])
grid += ''.join(f'<ellipse cx="300" cy="340" rx="175" ry="{r}"/>' for r in [35,70,105,140,170])
svg('nightflight', f'''
<defs><radialGradient id="chrome" cx="32%" cy="25%"><stop offset="0" stop-color="#fffdf0"/><stop offset=".28" stop-color="#979484"/><stop offset=".47" stop-color="#e2e1d2"/><stop offset=".63" stop-color="#4a4a43"/><stop offset=".82" stop-color="#c4c2b0"/><stop offset="1" stop-color="#202622"/></radialGradient><clipPath id="ball"><circle cx="300" cy="340" r="175"/></clipPath></defs>
<g fill="none" stroke="#f8bd7c" opacity=".35"><circle cx="300" cy="340" r="227"/><circle cx="300" cy="340" r="245"/><circle cx="300" cy="340" r="265"/></g>
<text x="30" y="80" fill="#261e18" font-family="Arial,sans-serif" font-weight="900" font-size="64" letter-spacing="-3">NIGHT FLIGHT</text>
<text x="33" y="112" fill="#261e18" font-family="monospace" font-size="12" letter-spacing="2">CITY LIGHTS / AFTER HOURS / SIDE A</text>
<ellipse cx="315" cy="533" rx="175" ry="15" fill="#281e18" opacity=".25"/>
<circle cx="300" cy="340" r="175" fill="url(#chrome)"/>
<g clip-path="url(#ball)" fill="none" stroke="#222b25" stroke-width="1.5" opacity=".66">{grid}<path d="M125 290H475M125 390H475M125 245H475M125 435H475M125 205H475M125 475H475"/></g>
<path d="m190 205 5 20 20 5-20 5-5 20-5-20-20-5 20-5zM420 335l3 13 13 3-13 3-3 13-3-13-13-3 13-3z" fill="#fff8db"/>
<text x="32" y="566" fill="#261e18" font-family="monospace" font-size="12">33⅓ RPM</text><text x="475" y="566" fill="#261e18" font-family="monospace" font-size="12">VOL. 001</text>
''', '#ee593a', 'Night Flight')

waves = ''.join(f'<path d="M0 {340+y} Q75 {300+y} 150 {340+y} T300 {340+y} T450 {340+y} T600 {340+y}" fill="none" stroke="#ffc091" stroke-width="2" opacity="{.8-i*.075}"/>' for i,y in enumerate(range(0,210,18)))
svg('coastline', f'''
<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#ee877d"/><stop offset="1" stop-color="#fbb386"/></linearGradient><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#2d5454"/><stop offset="1" stop-color="#0e302e"/></linearGradient><clipPath id="sunclip"><rect x="0" y="0" width="600" height="310"/></clipPath></defs>
<rect width="600" height="350" fill="url(#sky)"/><g clip-path="url(#sunclip)"><circle cx="300" cy="280" r="116" fill="#fff0b7"/><g stroke="#ee877d" stroke-width="5"><path d="M160 285H440M160 300H440M160 313H440M160 327H440"/></g></g>
<rect y="311" width="600" height="289" fill="url(#sea)"/>{waves}
<path d="M0 530 125 510 197 560 250 538 335 580 420 560 485 535 600 540V600H0Z" fill="#142620"/>
<text x="30" y="60" fill="#20372f" font-family="monospace" font-size="12" letter-spacing="3">A LITTLE CLOSER TO THE SEA.</text>
<text x="25" y="142" fill="#20372f" font-family="Arial,sans-serif" font-weight="900" font-size="87" letter-spacing="-5">COASTLINE</text>
<text x="32" y="568" fill="#f3c8a3" font-family="monospace" font-size="12" letter-spacing="2">SLOW DOWN. BREATHE IN.</text>
''', '#f09a7e', 'Coastline')

svg('daylight', '''
<defs><linearGradient id="day" x2="1" y2="1"><stop stop-color="#b6dbc9"/><stop offset="1" stop-color="#759bab"/></linearGradient></defs><rect width="600" height="600" fill="url(#day)"/>
<path d="M0 410Q150 280 310 420T600 400V600H0Z" fill="#a8be64"/><path d="M0 490Q140 355 320 475T600 440V600H0Z" fill="#d1d784"/>
<circle cx="397" cy="227" r="124" fill="#f5e59e"/>
<g fill="none" stroke="#234b41" stroke-width="2"><path d="M80 600Q90 210 280 180M67 410Q170 410 217 315M83 343Q28 298 0 282M97 280Q150 235 182 228"/></g>
<g fill="#234b41"><ellipse cx="158" cy="380" rx="67" ry="21" transform="rotate(-37 158 380)"/><ellipse cx="52" cy="312" rx="65" ry="19" transform="rotate(35 52 312)"/><ellipse cx="177" cy="248" rx="72" ry="20" transform="rotate(-30 177 248)"/><ellipse cx="228" cy="202" rx="58" ry="15" transform="rotate(-15 228 202)"/></g>
<text x="29" y="75" fill="#234b41" font-family="Arial,sans-serif" font-weight="900" font-size="70" letter-spacing="-4">DAYLIGHT</text><text x="32" y="105" fill="#234b41" font-family="monospace" font-size="12" letter-spacing="2">LET THE GOOD DAYS IN.</text>
<text x="32" y="567" fill="#234b41" font-family="monospace" font-size="12" letter-spacing="2">06:30 AM / A NEW BEGINNING</text>
''', '#b6dbc9', 'Daylight')

rings = ''.join(f'<ellipse cx="306" cy="309" rx="{r}" ry="{int(r*.78)}" fill="none" stroke="{color}" stroke-width="{width}"/>' for r,color,width in [(290,'#3c6950',2),(252,'#3c6950',10),(224,'#3c6950',2),(203,'#3c6950',18),(174,'#3c6950',2),(155,'#3c6950',22),(118,'#3c6950',2),(95,'#3c6950',19),(58,'#3c6950',2)])
svg('echo', f'''
<defs><linearGradient id="echo" x2="1" y2="1"><stop stop-color="#dfdc8d"/><stop offset="1" stop-color="#b1cb95"/></linearGradient><radialGradient id="orb" cx="35%" cy="25%"><stop stop-color="#fcffcc"/><stop offset=".4" stop-color="#aad88b"/><stop offset=".68" stop-color="#2a6045"/><stop offset="1" stop-color="#173d2c"/></radialGradient></defs>
<rect width="600" height="600" fill="url(#echo)"/><g transform="rotate(-32 306 309)">{rings}</g>
<ellipse cx="305" cy="310" rx="62" ry="50" fill="url(#orb)" transform="rotate(-32 305 310)"/>
<text x="25" y="87" fill="#254f3b" font-family="Arial,sans-serif" font-weight="900" font-size="92" letter-spacing="-5">ECHOES</text><text x="32" y="115" fill="#254f3b" font-family="monospace" font-size="12" letter-spacing="3">SOME SOUNDS STAY WITH YOU.</text>
<text x="32" y="566" fill="#254f3b" font-family="monospace" font-size="12" letter-spacing="2">A MOMENT TO YOURSELF / VOL. 004</text>
''', '#d5d796', 'Echoes')

stripes = ''.join(f'<circle cx="430" cy="300" r="{r}" fill="none" stroke="{color}" stroke-width="{width}"/>' for r,color,width in [(380,'#b78ff2',50),(310,'#b78ff2',38),(252,'#b78ff2',28),(204,'#b78ff2',21),(165,'#b78ff2',16),(132,'#b78ff2',12),(105,'#b78ff2',9),(81,'#b78ff2',6),(61,'#b78ff2',4)])
svg('violet', f'''
{stripes}<path d="M0 0H200V600H0Z" fill="#351e54" opacity=".2"/>
<text x="30" y="59" fill="#efdebd" font-family="monospace" font-size="12" letter-spacing="3">NO PLANS. JUST RHYTHM.</text>
<g fill="#efdebd" font-family="Arial,sans-serif" font-weight="900" font-size="112" letter-spacing="-7"><text x="27" y="191">VIOLET</text><text x="27" y="297">ROOM</text></g>
<path d="m65 407 9 29 29 9-29 9-9 29-9-29-29-9 29-9z" fill="#efdebd"/>
<text x="32" y="567" fill="#efdebd" font-family="monospace" font-size="12" letter-spacing="2">FIND YOUR OWN FREQUENCY.</text>
''', '#351e54', 'Violet Room')

petals = ''.join(f'<ellipse cx="300" cy="239" rx="45" ry="128" fill="#e6a7c1" transform="rotate({angle} 300 335)"/>' for angle in range(0,360,45))
svg('orbit', f'''
<g stroke="#8b897d" fill="none" stroke-width="1" opacity=".5"><ellipse cx="300" cy="335" rx="273" ry="117" transform="rotate(-27 300 335)"/><ellipse cx="300" cy="335" rx="273" ry="117" transform="rotate(27 300 335)"/><circle cx="300" cy="335" r="258"/></g>
{petals}<circle cx="300" cy="335" r="57" fill="#1b2420"/><circle cx="300" cy="335" r="34" fill="#eae6cc"/><circle cx="300" cy="335" r="7" fill="#1b2420"/>
<text x="28" y="71" fill="#eae6cc" font-family="Arial,sans-serif" font-weight="900" font-size="62" letter-spacing="-3">SLOW ORBIT</text><text x="32" y="104" fill="#eae6cc" font-family="monospace" font-size="12" letter-spacing="3">MOVE AT YOUR OWN PACE.</text>
<text x="32" y="566" fill="#eae6cc" font-family="monospace" font-size="12" letter-spacing="2">23:59 / THE QUIET SIDE OF LIFE</text>
''', '#1b2420', 'Slow Orbit')

(ASSETS / 'favicon.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#fb493c"/><path d="M40 12v31c0 8-12 14-19 6-7-8 2-19 12-13M40 13l11 7" fill="none" stroke="#f2f0e8" stroke-width="5" stroke-linecap="round"/></svg>''', encoding='utf-8')

SAMPLE_RATE = 22050
DURATION = 16
sample_count = SAMPLE_RATE * DURATION
configurations = [
    ('nightflight', 120, [45, 48, 52, 55], [69, 72, 76, 79, 76, 72, 67, 72], True),
    ('coastline', 90, [48, 52, 55, 59], [72, 76, 79, 83, 79, 76, 74, 71], False),
    ('daylight', 120, [53, 57, 60, 64], [77, 81, 84, 81, 79, 76, 72, 76], False),
    ('echo', 90, [50, 53, 57, 60], [74, 77, 81, 84, 81, 77, 72, 69], False),
    ('violet', 120, [43, 46, 50, 53], [67, 70, 74, 77, 74, 70, 65, 62], True),
    ('orbit', 90, [47, 50, 54, 57], [71, 74, 78, 81, 78, 74, 69, 66], False),
]

def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)

for seed, (name, bpm, chord, melody, electronic) in enumerate(configurations):
    rng = np.random.default_rng(seed + 2026)
    t = np.arange(sample_count) / SAMPLE_RATE
    sound = np.zeros(sample_count)
    # A quiet original harmonic bed.
    for i, note in enumerate(chord):
        f = frequency(note)
        sound += .035 * (np.sin(2*np.pi*f*t + i*.7) + .15*np.sin(2*np.pi*f*2.003*t)) * (.8 + .2*np.sin(2*np.pi*.1*t))
    beat = 60 / bpm
    interval = beat / 2 if electronic else beat
    for step, start in enumerate(np.arange(0, DURATION, interval)):
        length = min(int(SAMPLE_RATE * 1.8), sample_count - int(start*SAMPLE_RATE))
        nt = np.arange(length) / SAMPLE_RATE
        f = frequency(melody[step % len(melody)])
        envelope = np.minimum(nt/.012, 1) * np.exp(-nt * (5 if electronic else 3.7))
        note_wave = (np.sin(2*np.pi*f*nt) + .22*np.sin(2*np.pi*f*2*nt) + .08*np.sin(2*np.pi*f*3*nt)) * envelope * .14
        at = int(start*SAMPLE_RATE)
        sound[at:at+length] += note_wave
    if electronic:
        for step, start in enumerate(np.arange(0, DURATION, beat)):
            at = int(start*SAMPLE_RATE)
            length = min(int(SAMPLE_RATE*.25), sample_count-at)
            dt = np.arange(length)/SAMPLE_RATE
            phase = 2*np.pi*(50*dt + 65*.025*(1-np.exp(-dt/.025)))
            sound[at:at+length] += .18*np.sin(phase)*np.exp(-dt*20)
            if step % 2:
                sound[at:at+length] += .035*rng.standard_normal(length)*np.exp(-dt*40)
    # A short, soft stereo-like delay folded to mono, plus fades for quiet starts.
    delay = int(SAMPLE_RATE * .24)
    sound[delay:] += .18 * sound[:-delay].copy()
    fade = int(SAMPLE_RATE*.25)
    sound[:fade] *= np.linspace(0,1,fade)
    sound[-fade:] *= np.linspace(1,0,fade)
    sound = np.tanh(sound * 1.25) * .68
    pcm = (sound*32767).astype('<i2')
    with wave.open(str(ASSETS / 'audio' / f'{name}.wav'), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())

print('Created 6 original SVG covers, favicon, and 6 original 16-second audio loops.')
