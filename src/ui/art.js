const px = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;

function esc(s = '') {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function portraitSVG(persona, size = 64, mood = 'normal') {
  const c = persona.colors || { bg: '#d8cbb4', shirt: '#5c6470', hair: '#2a2622', skin: '#e4c3a0', accent: '#e2602e' };
  const seed = [...(persona.id || 'npc')].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const longHair = ['chen', 'su', 'li', 'fang', 'liu'].includes(persona.id) || seed % 3 === 0;
  const glasses = ['zhou', 'fang', 'ma', 'lin'].includes(persona.id);
  const tie = ['zhou', 'ma', 'zhao'].includes(persona.id);
  const mouth = mood === 'sad' ? px(27, 45, 10, 2, '#8a5a4a') : mood === 'smile' ? px(27, 45, 10, 2, '#8a5a4a') : px(28, 45, 8, 2, '#8a5a4a');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72" width="${size}" height="${Math.round(size * 1.125)}" shape-rendering="crispEdges" role="img" aria-label="${esc(persona.name || '角色')}">
    ${px(0, 0, 64, 72, c.bg)}
    ${px(0, 0, 64, 6, 'rgba(255,255,255,.12)')}
    ${px(4, 4, 2, 2, 'rgba(33,31,28,.1)')}${px(58, 6, 2, 2, 'rgba(33,31,28,.1)')}
    ${longHair ? px(13, 12, 38, 38, c.hair) : ''}
    ${px(21, 14, 22, 32, c.skin)}
    ${px(17, 44, 30, 22, c.shirt)}
    ${px(25, 44, 14, 6, c.skin)}
    ${tie ? px(30, 48, 4, 14, c.accent) + px(28, 48, 8, 4, c.accent) : ''}
    ${px(12, 13, 40, 10, c.hair)}
    ${longHair ? px(12, 20, 8, 26, c.hair) : px(13, 18, 6, 8, c.hair)}
    ${longHair ? px(44, 20, 8, 26, c.hair) : px(45, 18, 6, 8, c.hair)}
    ${px(23, 28, 6, 4, '#fffaf0')}${px(35, 28, 6, 4, '#fffaf0')}
    ${px(25, 29, 2, 2, '#211f1c')}${px(37, 29, 2, 2, '#211f1c')}
    ${glasses ? px(22, 27, 8, 1, '#211f1c') + px(34, 27, 8, 1, '#211f1c') + px(30, 28, 4, 1, '#211f1c') : ''}
    ${px(30, 35, 4, 3, 'rgba(138,90,74,.45)')}
    ${mouth}
    ${px(24, 52, 16, 2, 'rgba(255,255,255,.25)')}
    ${px(8, 64, 48, 8, 'rgba(33,31,28,.28)')}
  </svg>`;
}

export function npcPortraitSVG(name, color = '#8a6f5a', size = 48) {
  const seed = [...String(name)].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const skin = '#e0bfa0';
  const hair = '#2b2825';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${esc(name)}">
    ${px(0, 0, 64, 64, color)}
    ${px(0, 0, 64, 5, 'rgba(255,255,255,.14)')}
    ${px(18, 10, 28, 36, hair)}
    ${px(21, 14, 22, 30, skin)}
    ${px(18, 42, 28, 22, '#2b333f')}
    ${px(24, 22, 6, 4, '#fffaf0')}${px(34, 22, 6, 4, '#fffaf0')}
    ${px(26, 23, 2, 2, '#211f1c')}${px(36, 23, 2, 2, '#211f1c')}
    ${px(28, 34, 8, 2, '#8a5a4a')}
    ${seed % 2 ? px(20, 18, 4, 10, hair) : px(40, 18, 4, 10, hair)}
  </svg>`;
}

export function locationSVG(id, w = 160, h = 120) {
  const base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">`;
  const close = '</svg>';
  if (id === 'library') {
    return `${base}${px(0,0,160,120,'#d9c9ab')}${px(0,0,160,20,'#b9a584')}${px(8,24,44,86,'#8a6f5a')}${[0,1,2,3].map(i=>px(10,28+i*20,40,14,'#6f5748')+[0,1,2,3,4].map(j=>px(12+j*7,30+i*20,4,10,['#e2602e','#6f8f4d','#344a63','#d9a441','#9a6f8d'][(i+j)%5])).join('')).join('')}${px(60,20,90,76,'#c9d8e8')}${px(66,26,78,64,'#eaf2f8')}${px(104,26,2,64,'#b9a584')}${px(66,58,78,2,'#b9a584')}${px(58,96,96,20,'#b9a584')}${px(84,68,40,28,'#8a6f5a')}${px(88,72,32,24,'#e8dcc4')}${px(100,76,8,16,'#6f5748')}${px(16,104,10,12,'#4f4a40')}${close}`;
  }
  if (id === 'cafe') {
    return `${base}${px(0,0,160,120,'#e8dcc4')}${px(0,0,160,16,'#8a6f5a')}${px(14,24,58,64,'#c9d8e8')}${px(18,28,50,56,'#eaf2f8')}${px(18,56,50,2,'#b9a584')}${px(90,44,54,48,'#8a6f5a')}${px(94,40,46,8,'#6f5748')}${px(100,52,10,16,'#fffaf0')}${px(116,52,10,16,'#fffaf0')}${px(132,52,8,16,'#fffaf0')}${px(0,96,160,24,'#b9a584')}${px(70,76,18,20,'#344a63')}${px(74,66,10,10,'#d9a441')}${close}`;
  }
  if (id === 'park') {
    return `${base}${px(0,0,160,120,'#cfe3ea')}${px(0,74,160,46,'#9bbf6a')}${px(0,92,160,28,'#7b9c4d')}${px(120,18,26,26,'#f2d6a0')}${px(16,40,10,50,'#6f5748')}${px(4,26,34,22,'#6f8f4d')}${px(46,30,8,58,'#6f5748')}${px(34,16,32,24,'#6f8f4d')}${px(70,84,52,8,'#8a6f5a')}${px(76,92,4,16,'#6f5748')}${px(112,92,4,16,'#6f5748')}${px(78,74,36,10,'#8a6f5a')}${px(68,66,3,8,'#4f4a40')}${close}`;
  }
  if (id === 'cowork') {
    return `${base}${px(0,0,160,120,'#d7e2ec')}${px(0,0,160,18,'#58789a')}${px(8,28,44,26,'#eaf2f8')}${px(12,32,36,18,'#344a63')}${px(62,28,44,26,'#eaf2f8')}${px(66,32,36,18,'#344a63')}${px(116,28,36,26,'#eaf2f8')}${px(120,32,28,18,'#344a63')}${px(0,66,160,8,'#8a6f5a')}${px(8,74,52,8,'#b9a584')}${px(64,74,52,8,'#b9a584')}${px(120,74,40,8,'#b9a584')}${px(0,86,160,34,'#b9a584')}${px(18,64,16,12,'#211f1c')}${px(78,64,16,12,'#211f1c')}${px(130,64,14,12,'#211f1c')}${close}`;
  }
  if (id === 'mall') {
    return `${base}${px(0,0,160,120,'#e6d3cb')}${px(0,0,160,24,'#9a6f8d')}${px(10,28,42,60,'#fffaf0')}${px(14,34,34,20,'#d9a441')}${px(14,60,34,20,'#e2602e')}${px(58,28,42,60,'#fffaf0')}${px(62,34,34,20,'#6f8f4d')}${px(62,60,34,20,'#58789a')}${px(106,28,44,60,'#fffaf0')}${px(110,34,36,20,'#b64a3b')}${px(110,60,36,20,'#9a6f8d')}${px(0,90,160,30,'#b9a584')}${px(22,100,12,20,'#6f5748')}${px(70,100,12,20,'#6f5748')}${px(120,100,12,20,'#6f5748')}${close}`;
  }
  if (id === 'oldoffice') {
    return `${base}${px(0,0,160,120,'#c9d8e8')}${px(0,0,160,14,'#58789a')}${px(20,18,38,86,'#344a63')}${px(28,26,22,6,'#eaf2f8')}${px(28,38,22,6,'#eaf2f8')}${px(28,50,22,6,'#eaf2f8')}${px(28,62,22,6,'#eaf2f8')}${px(28,74,22,6,'#eaf2f8')}${px(70,26,36,78,'#5c6470')}${px(76,34,24,6,'#eaf2f8')}${px(76,46,24,6,'#eaf2f8')}${px(76,58,24,6,'#eaf2f8')}${px(114,34,34,70,'#8a6f5a')}${px(120,42,22,6,'#eaf2f8')}${px(120,54,22,6,'#eaf2f8')}${px(0,104,160,16,'#4f4a40')}${px(66,90,44,14,'#2b333f')}${close}`;
  }
  if (id === 'jobfair') {
    return `${base}${px(0,0,160,120,'#e8dcc4')}${px(0,0,160,16,'#b64a3b')}${px(8,26,42,70,'#fffaf0')}${px(12,32,34,8,'#b64a3b')}${px(12,44,34,4,'#c9b997')}${px(12,52,34,4,'#c9b997')}${px(12,60,34,4,'#c9b997')}${px(58,26,42,70,'#fffaf0')}${px(62,32,34,8,'#344a63')}${px(62,44,34,4,'#c9b997')}${px(62,52,34,4,'#c9b997')}${px(62,60,34,4,'#c9b997')}${px(108,26,44,70,'#fffaf0')}${px(112,32,36,8,'#6f8f4d')}${px(112,44,36,4,'#c9b997')}${px(112,52,36,4,'#c9b997')}${px(112,60,36,4,'#c9b997')}${px(0,96,160,24,'#b9a584')}${px(18,88,20,8,'#6f5748')}${px(70,88,20,8,'#6f5748')}${px(120,88,20,8,'#6f5748')}${close}`;
  }
  if (id === 'nightmarket') {
    return `${base}${px(0,0,160,120,'#1b2431')}${px(0,0,160,8,'#151b24')}${[0,1,2,3,4].map(i=>px(10+i*30,10,22,4,'#d9a441')+px(14+i*30,14,2,6,'#8a6f5a')).join('')}${px(8,34,42,52,'#8a6f5a')}${px(12,40,34,20,'#e2602e')}${px(12,64,34,16,'#d9a441')}${px(58,40,42,46,'#6f5748')}${px(62,46,34,16,'#9bbf6a')}${px(62,66,34,12,'#e8dcc4')}${px(108,30,44,56,'#8a6f5a')}${px(112,36,36,18,'#58789a')}${px(112,58,36,20,'#d9a441')}${px(0,92,160,28,'#2b333f')}${px(20,96,120,4,'#4f4a40')}${close}`;
  }
  return `${base}${px(0,0,160,120,'#e8dcc4')}${px(0,0,160,20,'#b9a584')}${px(18,30,58,52,'#c9d8e8')}${px(22,34,50,44,'#eaf2f8')}${px(22,56,50,2,'#b9a584')}${px(84,50,58,48,'#8a6f5a')}${px(88,46,50,8,'#6f5748')}${px(0,98,160,22,'#b9a584')}${px(100,64,20,12,'#fffaf0')}${px(104,60,12,4,'#d9a441')}${close}`;
}

export function endingArtSVG(ending) {
  const color = ending?.color || '#344a63';
  const icon = ending?.icon || '✦';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" width="360" height="210" shape-rendering="crispEdges" aria-hidden="true">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#141a22"/></linearGradient></defs>
    <rect width="360" height="210" fill="url(#sky)"/>
    <circle cx="280" cy="66" r="32" fill="#f2d6a0" opacity=".85"/>
    <rect x="0" y="150" width="360" height="60" fill="#11161d"/>
    <rect x="18" y="92" width="46" height="58" fill="#1b2430"/><rect x="70" y="72" width="58" height="78" fill="#202a36"/><rect x="136" y="104" width="42" height="46" fill="#1b2430"/><rect x="186" y="84" width="62" height="66" fill="#202a36"/><rect x="256" y="112" width="44" height="38" fill="#1b2430"/><rect x="308" y="96" width="34" height="54" fill="#202a36"/>
    <g fill="#d9a441" opacity=".55">${Array.from({length: 18}, (_, i) => `<rect x="${24 + (i * 17) % 316}" y="${100 + (i * 23) % 48}" width="4" height="5"/>`).join('')}</g>
    <text x="180" y="130" font-size="64" text-anchor="middle" opacity=".9">${icon}</text>
    <text x="180" y="190" font-size="11" font-family="monospace" fill="#f2d6a0" text-anchor="middle" letter-spacing="4">PRETEND TO WORK / ENDING ${String(ending?.num || 0).padStart(2, '0')}</text>
  </svg>`;
}

export function shareBadgeSVG(persona, title = '空档专员') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200" shape-rendering="crispEdges">
    <rect width="320" height="200" fill="#f2e8d5"/>
    <rect x="0" y="0" width="320" height="12" fill="#211f1c"/>
    <rect x="0" y="188" width="320" height="12" fill="#211f1c"/>
    <rect x="16" y="28" width="92" height="92" fill="#d8cbb4" stroke="#211f1c" stroke-width="2"/>
    <text x="62" y="88" font-size="42" text-anchor="middle">🪪</text>
    <text x="124" y="48" font-size="11" font-family="monospace" fill="#857b68" letter-spacing="2">LINJIANG CITY / TEMP BADGE</text>
    <text x="124" y="78" font-size="22" font-weight="700" fill="#211f1c">${esc(persona?.name || '空档者')}</text>
    <text x="124" y="98" font-size="12" fill="#e2602e">${esc(title)}</text>
    <text x="124" y="118" font-size="10" font-family="monospace" fill="#4f4a40">STATUS: STANDBY · DAY 21</text>
    <rect x="124" y="130" width="176" height="3" fill="#c9b997"/>
    <text x="124" y="150" font-size="9" fill="#857b68">本工牌仅为游戏道具，不具备任何门禁功能。</text>
    <text x="124" y="166" font-size="10" font-family="monospace" fill="#211f1c">#假装上班</text>
  </svg>`;
}

export function svgDataURI(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
