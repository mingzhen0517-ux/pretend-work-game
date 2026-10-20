import { PERSONA_BY_ID } from '../data/personas.js';
import { ENDING_BY_ID } from '../data/endings.js';
import { formatMoney } from '../core/game.js';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawAvatar(ctx, persona, x, y, s) {
  const c = persona.colors || { bg: '#d8cbb4', shirt: '#5c6470', hair: '#2a2622', skin: '#e4c3a0', accent: '#e2602e' };
  ctx.save();
  ctx.fillStyle = c.bg;
  ctx.fillRect(x, y, s, s * 1.12);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.fillRect(x, y, s, s * 0.06);
  const u = s / 64;
  ctx.fillStyle = c.hair;
  ctx.fillRect(x + 13 * u, y + 12 * u, 38 * u, 38 * u);
  ctx.fillStyle = c.skin;
  ctx.fillRect(x + 21 * u, y + 14 * u, 22 * u, 32 * u);
  ctx.fillStyle = c.shirt;
  ctx.fillRect(x + 17 * u, y + 44 * u, 30 * u, 22 * u);
  ctx.fillStyle = c.skin;
  ctx.fillRect(x + 25 * u, y + 44 * u, 14 * u, 6 * u);
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(x + 23 * u, y + 28 * u, 6 * u, 4 * u);
  ctx.fillRect(x + 35 * u, y + 28 * u, 6 * u, 4 * u);
  ctx.fillStyle = '#211f1c';
  ctx.fillRect(x + 25 * u, y + 29 * u, 2 * u, 2 * u);
  ctx.fillRect(x + 37 * u, y + 29 * u, 2 * u, 2 * u);
  ctx.fillStyle = '#8a5a4a';
  ctx.fillRect(x + 28 * u, y + 45 * u, 8 * u, 2 * u);
  ctx.restore();
}

export function getShareUrl(run) {
  try {
    const base = location.protocol === 'file:' ? location.href : `${location.origin}${location.pathname}`;
    const url = new URL(base);
    if (run?.referralCode) url.searchParams.set('ref', run.referralCode);
    url.searchParams.set('utm_source', 'share');
    return url.toString();
  } catch {
    return '';
  }
}

export function renderPoster(run, endingId, kind = 'ending') {
  const persona = PERSONA_BY_ID[run.personaId] || PERSONA_BY_ID.zhou;
  const ending = ENDING_BY_ID[endingId] || ENDING_BY_ID.e_halfway;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  const W = 1080;
  // background
  const bg = ctx.createLinearGradient(0, 0, 0, 1440);
  bg.addColorStop(0, '#f2e8d5');
  bg.addColorStop(1, '#e3d3b6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, 1440);
  // subtle grid
  ctx.strokeStyle = 'rgba(33,31,28,0.035)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * 36); ctx.lineTo(W, i * 36); ctx.stroke();
  }
  // header
  ctx.fillStyle = '#211f1c';
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = '#f2e8d5';
  ctx.font = '900 62px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('假装上班', 64, 100);
  ctx.font = '700 20px monospace';
  ctx.fillStyle = '#d9a441';
  ctx.fillText('PRETEND TO WORK / BREAK REPORT', 66, 128);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2e8d5';
  ctx.font = '700 26px monospace';
  ctx.fillText(`DAY ${String(run.day || 21).padStart(2, '0')}`, W - 64, 88);
  ctx.fillStyle = '#9bbf6a';
  ctx.font = '600 18px monospace';
  ctx.fillText(kind === 'day' ? '空档中' : '结局已生成', W - 64, 120);
  ctx.textAlign = 'left';
  // card
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#211f1c';
  ctx.lineWidth = 6;
  rr(ctx, 56, 196, W - 112, 1040, 24);
  ctx.fill();
  ctx.stroke();
  // avatar
  ctx.save();
  rr(ctx, 100, 244, 232, 260, 14);
  ctx.clip();
  drawAvatar(ctx, persona, 100, 244, 232);
  ctx.restore();
  ctx.strokeStyle = '#211f1c';
  ctx.lineWidth = 5;
  rr(ctx, 100, 244, 232, 260, 14);
  ctx.stroke();
  // name / job
  ctx.fillStyle = '#211f1c';
  ctx.font = '900 52px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(persona.name, 372, 300);
  ctx.fillStyle = '#e2602e';
  ctx.font = '700 24px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(`${persona.age} 岁 · ${persona.job}`, 372, 342);
  ctx.fillStyle = '#4f4a40';
  ctx.font = '400 22px "PingFang SC","Microsoft YaHei",sans-serif';
  const tag = `${kind === 'day' ? '空档第 ' + run.day + ' 天' : '结局 · ' + ending.name}`;
  ctx.fillText(tag, 372, 386);
  // suspicion meter
  ctx.fillStyle = '#c9b997';
  ctx.font = '600 18px monospace';
  ctx.fillText('露馅风险', 372, 434);
  ctx.fillStyle = '#d9c9ab';
  rr(ctx, 372, 450, 500, 18, 9); ctx.fill();
  ctx.fillStyle = run.stats.suspicion > 70 ? '#b64a3b' : '#e2602e';
  rr(ctx, 372, 450, Math.max(10, 5 * (run.stats.suspicion || 0)), 18, 9); ctx.fill();
  ctx.fillStyle = '#211f1c';
  ctx.font = '700 18px monospace';
  ctx.fillText(`${Math.round(run.stats.suspicion || 0)}%`, 888, 466);
  // stats
  const stats = [
    ['现金', formatMoney(run.stats.cash), '#4f6f45'],
    ['体面', String(Math.round(run.stats.face)), '#344a63'],
    ['心气', String(Math.round(run.stats.spirit)), '#b64a3b'],
  ];
  stats.forEach(([k, v, color], i) => {
    const x = 100 + i * 294;
    ctx.fillStyle = '#f2e8d5';
    rr(ctx, x, 560, 266, 112, 14); ctx.fill();
    ctx.strokeStyle = '#211f1c'; ctx.lineWidth = 3; rr(ctx, x, 560, 266, 112, 14); ctx.stroke();
    ctx.fillStyle = '#857b68';
    ctx.font = '600 18px "PingFang SC",sans-serif';
    ctx.fillText(k, x + 18, 592);
    ctx.fillStyle = color;
    ctx.font = '900 36px monospace';
    ctx.fillText(v, x + 18, 642);
  });
  // quote
  ctx.fillStyle = '#211f1c';
  ctx.font = '700 34px "PingFang SC","Microsoft YaHei",sans-serif';
  const quote = kind === 'day'
    ? (run.day < 7 ? '我还没想好怎么跟家里说。' : run.day < 14 ? '我开始习惯在图书馆“上班”了。' : '纸快包不住火了。')
    : ending.quote;
  wrapText(ctx, quote, 100, 760, 850, 52, 3);
  // fake badge title
  const titles = ['图书馆首席内容官', '城市漫游研究员', '家庭首席情绪官', '空档期人生教练', '体面维持专员'];
  const fakeTitle = titles[(run.day || 0) % titles.length];
  ctx.fillStyle = '#f2e8d5';
  rr(ctx, 100, 920, 700, 70, 10); ctx.fill();
  ctx.strokeStyle = '#211f1c'; ctx.lineWidth = 3; rr(ctx, 100, 920, 700, 70, 10); ctx.stroke();
  ctx.fillStyle = '#857b68'; ctx.font = '600 16px monospace'; ctx.fillText('NEW BADGE TITLE', 118, 946);
  ctx.fillStyle = '#211f1c'; ctx.font = '800 28px "PingFang SC",sans-serif'; ctx.fillText(fakeTitle, 118, 978);
  // ending label
  ctx.fillStyle = '#211f1c';
  ctx.font = '900 22px "PingFang SC",sans-serif';
  ctx.fillText(kind === 'day' ? '今日空档报告' : '我的空档结局', 100, 1060);
  ctx.fillStyle = '#857b68';
  ctx.font = '400 19px "PingFang SC",sans-serif';
  ctx.fillText(`空档人格：${run.personality || '体面表演家'} · 清单 ${run.checklistCount ?? 0}/24`, 100, 1096);
  ctx.fillStyle = '#e2602e';
  ctx.font = '800 26px "PingFang SC",sans-serif';
  ctx.fillText(kind === 'day' ? '你能撑到第几天？' : `《${ending.name}》`, 100, 1140);
  // footer
  ctx.fillStyle = '#211f1c';
  ctx.fillRect(0, 1300, W, 140);
  ctx.fillStyle = '#f2e8d5';
  ctx.font = '700 20px monospace';
  ctx.fillText('OPEN / TYPE TO PLAY', 64, 1350);
  ctx.fillStyle = '#d9a441';
  ctx.font = '600 18px monospace';
  const url = getShareUrl(run).replace(/^https?:\/\//, '');
  ctx.fillText(url.slice(0, 58), 64, 1384);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9bbf6a';
  ctx.font = '700 20px monospace';
  ctx.fillText(`CODE ${run.referralCode || '------'}`, W - 64, 1350);
  ctx.textAlign = 'left';
  // tiny note
  ctx.fillStyle = 'rgba(33,31,28,0.5)';
  ctx.font = '400 13px monospace';
  ctx.fillText('* 本图为游戏道具，不是真实工牌 / 离职证明', 64, 1392);
  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const chars = [...String(text)];
  let line = '';
  let lines = 0;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines++;
      line = ch;
      if (lines >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines < maxLines && line) ctx.fillText(line, x, y + lines * lineHeight);
}

export async function shareOrDownload(canvas, run, kind = 'ending') {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return { ok: false, reason: '无法生成图片' };
  const file = new File([blob], `假装上班-空档第${run.day}天.png`, { type: 'image/png' });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: '假装上班 · 空档报告',
        text: kind === 'day' ? '你能撑到第几天？' : '我的空档结局是……',
        files: [file],
      });
      return { ok: true, method: 'share' };
    } catch (e) {
      if (e?.name === 'AbortError') return { ok: false, reason: '已取消' };
    }
  }
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `假装上班-空档第${run.day}天.png`;
  a.click();
  return { ok: true, method: 'download' };
}

export function shareText(run, endingId, kind = 'ending') {
  const persona = PERSONA_BY_ID[run.personaId];
  const ending = ENDING_BY_ID[endingId];
  const url = getShareUrl(run);
  if (kind === 'day') {
    return `空档第 ${run.day} 天，我在图书馆当上了首席内容官。露馅风险 ${Math.round(run.stats.suspicion)}%。你能撑到第几天？\n${url}`;
  }
  return `我演了 21 天，最后是《${ending?.name || '半途'}》。${ending?.quote || ''}\n${persona?.name || ''}的空档报告：${url}`;
}
