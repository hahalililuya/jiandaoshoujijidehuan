/* Shared zero-dependency phone runtime and standalone exporter. */
window.PhoneStory = (function PhoneStoryFactory() {
  'use strict';
  const icons = {
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 10h8M8 14h5"/>',
    photo: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    note: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M10 19h4"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    arrow: '<path d="m15 18-6-6 6-6"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    signal: '<path stroke-width="3" d="M3 19v-3M8 19v-6M13 19V9M18 19V5"/>',
    wifi: '<path d="M3 9a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0M9 15a5 5 0 0 1 6 0"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>',
    battery: '<rect x="1" y="6" width="19" height="12" rx="3" stroke-opacity=".55"/><path d="M23 10v4"/><rect x="3" y="8" width="15" height="8" rx="1.5" fill="currentColor" stroke="none"/>'
  };
  const svg = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.phone}</svg>`;
  // Original vector artwork; no external assets required by standalone exports.
  const appIcon = name => {
    const petals = ['#ffb52d','#ff862d','#ff5366','#db62ae','#9472d4','#59a7e8','#65caa2','#b7d858'];
    const art = name === 'chat'
      ? '<path fill="#fff" d="M48 17c-19 0-33 12-33 27 0 9 5 17 13 22l-4 13 17-9 7 1c19 0 33-12 33-27S67 17 48 17Z"/>'
      : name === 'photo'
        ? petals.map((color,i)=>`<ellipse cx="48" cy="29" rx="12" ry="21" fill="${color}" fill-opacity=".83" transform="rotate(${i*45} 48 48)"/>`).join('')
        : '<path fill="#ffd52d" d="M0 0h96v29H0z"/><path stroke="#e6e6e8" stroke-width="2" d="M13 44h70M13 59h70M13 74h70"/><path stroke="#e4bd25" stroke-dasharray="2 3" d="M0 27h96"/>';
    return `<svg viewBox="0 0 96 96" fill="none" aria-hidden="true">${art}</svg>`;
  };
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const id = () => 'id-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  const defaults = () => ({
    version: 1,
    phone: {name: '林间来信', useSystemTime: true, autoLock: 0, time: '09:41', date: '2026-10-21', password: '0000', wallpaper: '', lockBackground: {image:'',scale:100,x:50,y:50}, homeBackground: {image:'',scale:100,x:50,y:50}},
    notifications: [{id: id(), title: '林间来信', text: '你有一条来自明天的消息。', time: '现在'}],
    contacts: [
      {id: id(), name: '许星河', avatar: '', messages: [
        {id: id(), side: 'left', text: '昨晚的流星，你看到了吗？', time: '09:38'},
        {id: id(), side: 'right', text: '看到了。我许了一个很长的愿望。', time: '09:39'},
        {id: id(), side: 'left', text: '那就慢慢实现。今晚，老地方见。', time: '09:41'}
      ]},
      {id: id(), name: '海边书店', avatar: '', messages: [{id: id(), side: 'left', text: '你预订的书到了，夹着一张特别的明信片。', time: '昨天'}]}
    ],
    photos: [],
    notes: [{id: id(), title: '给明天的自己', text: '去海边，等一场日落。\n\n把没说出口的话写下来。\n记得带上那台旧相机。', time: '10月21日'}]
  });
  const MAX_IMAGE = 8 * 1024 * 1024;
  const MAX_JSON = 32 * 1024 * 1024;
  function validate(raw) {
    const fail = msg => { throw new Error('数据校验失败：' + msg); };
    const obj = (v, label) => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(label + '格式不正确'); return v; };
    const str = (v, max, label) => { if (typeof v !== 'string' || v.length > max) fail(label + '必须是长度不超过 ' + max + ' 的文本'); return v; };
    const image = (v, label) => { str(v, MAX_IMAGE, label); if (v && !/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(v)) fail(label + '仅支持内嵌 PNG/JPEG/WebP/GIF'); return v; };
    const seen = new Set();
    const uid = v => { str(v, 100, 'ID'); if (!/^[\w-]+$/.test(v) || seen.has(v)) fail('ID 无效或重复'); seen.add(v); return v; };
    const array = (v, max, label, map) => { if (!Array.isArray(v) || v.length > max) fail(label + '数量超过限制或格式错误'); return v.map((x) => map(obj(x, label))); };
    obj(raw, '项目'); if (raw.version !== 1) fail('不支持的版本');
    const p = obj(raw.phone, '手机');
    if (!/^\d{4}$/.test(p.password)) fail('密码必须是4位数字');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) fail('时间必须是 HH:MM');
    if (typeof p.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !Number.isFinite(Date.parse(p.date)) || new Date(p.date).toISOString().slice(0, 10) !== p.date) fail('日期无效');
    const background = (value, label) => {
      const b = value === undefined ? {image:p.wallpaper || '',scale:100,x:50,y:50} : obj(value,label);
      const number = (key,min,max) => { if(typeof b[key] !== 'number' || !Number.isFinite(b[key]) || b[key]<min || b[key]>max) fail(label+'位置或缩放无效'); return b[key]; };
      return {image:image(b.image,label),scale:number('scale',50,300),x:number('x',0,100),y:number('y',0,100)};
    };
    const result = {
      version: 1,
      phone: {name: str(p.name, 80, '手机名'), useSystemTime: p.useSystemTime === undefined ? true : typeof p.useSystemTime === 'boolean' ? p.useSystemTime : fail('时间开关无效'), autoLock: p.autoLock === undefined ? 0 : [0,30,60,120,300].includes(p.autoLock) ? p.autoLock : fail('锁屏间隔无效'), time: p.time, date: p.date, password: p.password, wallpaper: '', lockBackground: background(p.lockBackground,'锁屏背景'), homeBackground: background(p.homeBackground,'桌面背景')},
      notifications: array(raw.notifications, 30, '通知', n => ({id: uid(n.id), title: str(n.title, 100, '通知标题'), text: str(n.text, 2000, '通知内容'), time: str(n.time, 40, '通知时间')})),
      contacts: array(raw.contacts, 100, '联系人', c => ({id: uid(c.id), name: str(c.name, 80, '联系人名称'), avatar: image(c.avatar, '头像'), messages: array(c.messages, 500, '消息', m => ({id: uid(m.id), side: ['left','right'].includes(m.side) ? m.side : fail('消息方向无效'), text: str(m.text, 10000, '消息文本'), time: str(m.time, 40, '消息时间')}))})),
      photos: array(raw.photos, 100, '照片', p => ({id: uid(p.id), name: str(p.name, 200, '照片名称'), src: image(p.src, '照片'), date: p.date === undefined ? '' : str(p.date, 10, '照片日期'), location: p.location === undefined ? '' : str(p.location, 200, '照片地点'), tags: p.tags === undefined ? '' : str(p.tags, 500, '照片标签')})),
      notes: array(raw.notes, 200, '备忘录', n => ({id: uid(n.id), title: str(n.title, 200, '备忘录标题'), text: str(n.text, 20000, '备忘录内容'), time: str(n.time, 40, '备忘录时间')}))
    };
    if(raw.photos.some(p=>p.date!==undefined&&p.date!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date))||new Date(p.date).toISOString().slice(0,10)!==p.date)))fail('照片日期无效');
    if (extensions.validate) extensions.validate(raw, result);
    if (JSON.stringify(result).length > MAX_JSON) fail('项目总大小不能超过32MB');
    return result;
  }
  const css = `
.ps{--ink:#18212e;position:relative;width:310px;max-width:100%;aspect-ratio:310/642;padding:9px;border-radius:48px;background:#080a0d;box-shadow:0 0 0 1px #555a64,0 0 0 4px #1b1e25,0 25px 65px #0007;color:var(--ink);font:14px -apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;text-align:left;box-sizing:border-box}
.ps *{box-sizing:border-box}.ps button{font:inherit;cursor:pointer;border:0}.ps svg{width:20px;height:20px;flex-shrink:0}.ps-display{position:relative;height:100%;width:100%;overflow:hidden;border-radius:39px;background:#f6f7fb;isolation:isolate}.ps-island{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:89px;height:25px;border-radius:20px;background:#050608;z-index:20}.ps-island:after{content:'';position:absolute;right:9px;top:8px;width:8px;height:8px;border-radius:50%;background:#101827;box-shadow:inset 0 0 2px #426084}.ps-status{height:47px;padding:15px 21px 0;display:flex;justify-content:space-between;align-items:flex-start;font-size:11px;font-weight:700;position:relative;z-index:10;pointer-events:none}.ps-status-icons{display:flex;align-items:center;gap:4px}.ps-status svg{width:17px;height:13px}.ps-status .ps-bat{width:23px}.ps-wall{position:absolute;inset:0;background:radial-gradient(ellipse at 25% 20%,#4c4e86aa,transparent 45%),radial-gradient(ellipse at 80% 70%,#227d8b88,transparent 60%),linear-gradient(155deg,#121728,#233353 60%,#496577);background-size:cover;background-position:center;z-index:-2}.ps-stars{position:absolute;inset:0;background-image:radial-gradient(1px 1px at 20% 15%,#fff,transparent),radial-gradient(1px 1px at 70% 30%,#fff,transparent),radial-gradient(1px 1px at 40% 70%,#fff9,transparent);background-size:73px 97px,119px 153px,157px 119px;z-index:-1;pointer-events:none}.ps-light{color:#fff}.ps-page{height:calc(100% - 47px);display:flex;flex-direction:column;position:relative;padding-bottom:25px}.ps-lock-open{color:inherit;background:none;width:100%;padding:16px 5px 20px;display:flex;align-items:center;flex-direction:column}.ps-lock-open svg{width:19px;height:19px;margin-bottom:17px}.ps-date{font-size:15px;font-weight:500}.ps-clock{font-size:66px;font-weight:650;letter-spacing:-3px;line-height:1.15}.ps-owner{font-size:12px;margin-top:10px;opacity:.65;letter-spacing:2px}.ps-notifications{padding:8px 12px;overflow:auto;flex:1}.ps-notification{background:#d8e1f5c9;color:#172333;padding:12px;border-radius:17px;margin:0 0 8px;backdrop-filter:blur(16px);font-size:12px;overflow-wrap:anywhere;cursor:pointer}.ps-notification-head{display:flex;gap:7px;align-items:center;margin-bottom:6px}.ps-notification-head svg{width:15px;height:15px}.ps-notification-head span{margin-left:auto;font-size:10px;opacity:.65}.ps-notification p{margin:0;line-height:1.5}.ps-unlock-hint{border:0;background:none;color:inherit;text-align:center;font-size:11px;padding:20px 0;opacity:.8}.ps-homebar{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:100px;height:5px;border-radius:5px;background:currentColor;z-index:30;padding:0;opacity:.8}.ps-homebar:before{content:'';position:absolute;inset:-10px -15px}.ps-pin-title{text-align:center;font-size:17px;margin:35px 0 12px}.ps-pin-help{text-align:center;font-size:11px;opacity:.7;margin:0 15px 18px}.ps-dots{display:flex;gap:20px;justify-content:center;margin:0 0 17px}.ps-dot{width:11px;height:11px;border:1px solid #fff;border-radius:50%}.ps-dot.filled{background:#fff}.ps-pin-error{min-height:23px;text-align:center;font-size:11px;color:#ffcccf}.ps-keypad{display:grid;grid-template-columns:repeat(3,64px);gap:14px 22px;justify-content:center}.ps-key{width:64px;height:64px;background:#ffffff29;color:#fff;border-radius:50%;font-size:28px!important;backdrop-filter:blur(5px)}.ps-key:active{background:#ffffff70}.ps-key small{display:block;font-size:8px;letter-spacing:2px}.ps-key.empty{visibility:hidden}.ps-pin-actions{display:flex;justify-content:space-around;margin-top:18px}.ps-pin-actions button{background:none;color:inherit;font-size:12px;padding:9px}.ps-desktop-title{padding:30px 20px 8px;font-size:24px;font-weight:650;letter-spacing:-1px}.ps-desktop-sub{padding:0 20px;opacity:.65;font-size:11px}.ps-app-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:25px 10px;padding:32px 17px}.ps-app{background:none;color:inherit;display:flex;align-items:center;flex-direction:column;gap:9px;font-size:11px!important}.ps-app-icon{width:55px;height:55px;border-radius:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 7px 15px #0002}.ps-app-icon svg{width:29px;height:29px}.ps-app-icon.chat{background:linear-gradient(145deg,#64dbb5,#1b9f7a)}.ps-app-icon.photo{background:linear-gradient(145deg,#e6ad88,#c37c9a)}.ps-app-icon.note{background:linear-gradient(145deg,#f5d58c,#cb9c45)}.ps-dock{margin:auto 14px 18px;background:#ffffff26;border:1px solid #fff2;border-radius:25px;padding:15px;display:flex;justify-content:space-around;backdrop-filter:blur(20px)}.ps-dock button{background:none;color:inherit;padding:4px 18px}.ps-toolbar{display:flex;align-items:center;gap:8px;min-height:48px;padding:2px 14px 10px;border-bottom:1px solid #e5e7ec;flex-shrink:0}.ps-toolbar strong{font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ps-back{display:flex;align-items:center;justify-content:center;width:28px;height:30px;color:#5871a1;background:none;padding:0;flex-shrink:0}.ps-top-home{margin-left:auto!important}.ps-scroll{overflow:auto;flex:1;min-height:0;overscroll-behavior:contain;scrollbar-width:thin}.ps-avatar{width:43px;height:43px;flex-shrink:0;border-radius:14px;background:linear-gradient(145deg,#d9d9ed,#a8c0d2);display:flex;align-items:center;justify-content:center;color:#496078;font-size:16px;font-weight:600;overflow:hidden}.ps-avatar img{width:100%;height:100%;object-fit:cover}.ps-contact{width:100%;display:flex;gap:11px;align-items:center;padding:15px 16px;background:none;color:inherit;text-align:left;border-bottom:1px solid #e9ebf0!important}.ps-contact-copy{flex:1;min-width:0}.ps-contact-copy strong{display:block;font-size:13px;font-weight:600}.ps-contact-copy p{margin:6px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#8b929f;font-size:11px}.ps-contact-time{font-size:9px;color:#8b929f;flex-shrink:0;max-width:50px;overflow:hidden}.ps-messages{padding:12px 11px;background:#eef1f5}.ps-message{margin:0 0 15px;display:flex;flex-direction:column;align-items:flex-start}.ps-message.right{align-items:flex-end}.ps-message-time{font-size:9px;color:#8f98a6;align-self:center;margin-bottom:8px;max-width:100%;overflow-wrap:anywhere}.ps-message-row{display:flex;gap:7px;align-items:flex-start;max-width:100%;width:100%}.ps-message.right .ps-message-row{flex-direction:row-reverse}.ps-message .ps-avatar{width:28px;height:28px;font-size:11px;border-radius:10px}.ps-bubble{max-width:78%;padding:10px 12px;background:#fff;line-height:1.65;border-radius:3px 13px 13px 13px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;box-shadow:0 2px 3px #00000003}.ps-message.right .ps-bubble{background:#cce9e0;border-radius:13px 3px 13px 13px}.ps-chat-footer{text-align:center;font-size:10px;color:#9aa3af;padding:13px 0;background:#f4f6f8}.ps-photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:3px}.ps-photo-grid button{aspect-ratio:1;padding:0;background:#e1e6ed;overflow:hidden}.ps-photo-grid img{width:100%;height:100%;object-fit:cover}.ps-photo-full{background:#10131a;display:flex;align-items:center;justify-content:center}.ps-photo-full img{max-width:100%;max-height:100%;object-fit:contain}.ps-photo-caption{padding:10px 15px;font-size:11px;overflow-wrap:anywhere;background:#fff}.ps-note-row{display:block;width:100%;background:#fff;text-align:left;padding:16px;border-bottom:1px solid #eee!important;color:inherit}.ps-note-row strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ps-note-row p{font-size:11px;color:#8c929d;margin:8px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ps-note-detail{padding:18px;background:#fffbed;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.9}.ps-note-detail h2{font-size:21px;line-height:1.5;margin:0 0 5px}.ps-note-detail small{font-size:10px;color:#9b916f}.ps-empty{padding:45px 20px;text-align:center;color:#939caa;font-size:12px;line-height:1.8}.ps-button:focus-visible,.ps button:focus-visible{outline:2px solid #8abcf9;outline-offset:3px}.ps-title-wrap{min-width:0;overflow:hidden;text-overflow:ellipsis}.ps-desktop-title,.ps-owner{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* Runtime-only system styling; editor layout remains untouched. */
.ps{--ink:#1c1c1e;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','Segoe UI','Microsoft YaHei',sans-serif}
.ps-display{background:#fff}.ps-status{padding:15px 18px 0 23px;font-size:12px;letter-spacing:-.3px}.ps-status-icons{gap:3px}.ps-status svg{width:15px;height:13px}.ps-status .ps-bat{width:22px}.ps-island{width:88px;height:25px;box-shadow:0 0 0 1px #000}.ps-wall{background:radial-gradient(ellipse at 12% 10%,#f5acb8 0,transparent 52%),radial-gradient(ellipse at 90% 78%,#4097dd 0,transparent 60%),linear-gradient(155deg,#4c3776,#1b356a 60%,#143a61)}.ps-stars{display:none}
.ps-lock-open{padding:14px 5px 10px;text-shadow:0 1px 15px #0002}.ps-lock-open svg{margin-bottom:12px;width:16px;height:18px}.ps-date{font-size:17px;font-weight:550;letter-spacing:-.4px}.ps-clock{font-size:76px;font-weight:650;letter-spacing:-4px;line-height:1.12;font-variant-numeric:tabular-nums}.ps-owner{font-size:11px;letter-spacing:.4px;opacity:.8;max-width:90%}.ps-notifications{display:flex;flex-direction:column;justify-content:flex-start;min-height:0;padding:10px 10px 0;gap:7px}.ps-notification:first-child{margin-top:auto}.ps-notification{flex-shrink:0;margin:0;background:#f2f2f2c9;border:1px solid #ffffff36;border-radius:19px;padding:11px 12px;color:#1c1c1e;backdrop-filter:blur(28px) saturate(1.5);-webkit-backdrop-filter:blur(28px) saturate(1.5)}.ps-notification-head{gap:6px;margin-bottom:4px}.ps-notification-head .ps-mini-icon{width:21px;height:21px;border-radius:5px;background:#30cc59;overflow:hidden;display:inline-flex}.ps-notification-head .ps-mini-icon svg{width:100%;height:100%}.ps-notification-head b{flex:1;min-width:0;overflow-wrap:anywhere}.ps-notification-head span:last-child{flex-shrink:0}.ps-unlock-hint{font-size:10px;padding:19px 0 14px;flex-shrink:0}
.ps-screen-pin .ps-wall:after{content:'';position:absolute;inset:0;background:#13203a80;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.ps-pin-title{font-size:19px;margin:38px 0 10px;font-weight:500}.ps-pin-help{font-size:10px;margin-bottom:22px}.ps-dots{gap:22px;margin-bottom:15px}.ps-dot{width:10px;height:10px;border-width:1.5px}.ps-keypad{grid-template-columns:repeat(3,63px);gap:14px 23px}.ps-key{width:63px;height:63px;font-weight:400;font-size:29px!important;background:#ffffff30;line-height:1.05;padding:7px 0 5px}.ps-key small{font-size:8px;letter-spacing:1.7px;margin-top:3px;line-height:1}.ps-pin-actions{margin-top:17px}.ps-pin-actions button{min-height:36px;min-width:64px}
.ps-app-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 5px;padding:21px 12px}.ps-app{gap:6px;padding:0;font-size:10px!important;text-shadow:0 1px 4px #0006;min-width:0}.ps-app-icon{width:51px;height:51px;border-radius:12px;overflow:hidden;box-shadow:0 3px 7px #0002}.ps-app-icon svg{width:100%;height:100%}.ps-app-icon.chat{background:linear-gradient(#5ee777,#16bd41)}.ps-app-icon.photo,.ps-app-icon.note{background:#fff}.ps-home-lock{align-self:center;background:#0002;color:#fff;border-radius:20px;padding:7px 13px;display:flex;align-items:center;gap:5px;font-size:10px!important;margin:auto 0 12px;backdrop-filter:blur(15px)}.ps-home-lock svg{width:12px;height:12px}.ps-dock{margin:0 9px 9px;min-height:77px;border-radius:26px;padding:13px 15px;gap:22px;justify-content:center;background:#ffffff40;border:1px solid #ffffff28;backdrop-filter:blur(28px) saturate(1.6);-webkit-backdrop-filter:blur(28px) saturate(1.6)}.ps-dock button{padding:0;background:none;display:block}.ps-homebar{width:106px;opacity:1}
.ps-toolbar{height:34px;min-height:34px;flex-shrink:0;padding:0 10px;border-bottom:1px solid #d1d1d680;background:#f9f9f9ed;gap:7px}.ps-toolbar strong{font-size:15px;font-weight:600}.ps-back{color:#007aff;width:30px;min-height:34px}.ps-top-home svg{width:18px;height:18px}.ps-large-title{font-size:28px;letter-spacing:-1px;margin:9px 17px 15px;line-height:1.15;font-weight:750}.ps-section-meta{color:#8e8e93;font-size:11px;margin:0 17px 14px}.ps-avatar{border-radius:50%;background:linear-gradient(#b5bac4,#8a929f);color:#fff;font-weight:500}.ps-contact{padding:13px 14px;gap:10px;border-bottom-color:#e5e5ea!important}.ps-contact-copy strong{font-size:14px}.ps-contact-copy p{margin-top:5px;font-size:12px;color:#8e8e93}.ps-contact-time{color:#8e8e93;font-size:10px}.ps-messages{background:#fff;padding:15px 12px}.ps-message-row{width:auto;max-width:89%;gap:0}.ps-message .ps-avatar{display:none}.ps-message-time{font-size:9px;color:#8e8e93}.ps-bubble{max-width:100%;border-radius:17px 17px 17px 5px;background:#e9e9eb;padding:8px 12px;line-height:1.5;font-size:13px;box-shadow:none}.ps-message.right .ps-bubble{background:#32c75a;color:#fff;border-radius:17px 17px 5px 17px}.ps-chat-footer{background:#f8f8fa;border-top:1px solid #e5e5ea;color:#8e8e93;padding:12px}.ps-photo-grid{gap:2px;padding:0}.ps-photo-caption{text-align:center;color:#636366}.ps-screen-photo .ps-display,.ps-screen-photo .ps-toolbar{background:#000;color:#fff}.ps-screen-photo .ps-back{color:#fff}.ps-photo-full,.ps-screen-photo .ps-photo-caption{background:#000;color:#fff}.ps-screen-notes .ps-display{background:#f2f2f7}.ps-screen-notes .ps-toolbar,.ps-screen-note .ps-toolbar{background:transparent}.ps-screen-notes .ps-back,.ps-screen-note .ps-back{color:#b58500}.ps-note-list{margin:0 13px;border-radius:12px;overflow:hidden}.ps-note-row{padding:14px 15px;border-bottom-color:#e5e5ea!important}.ps-note-row strong{font-size:14px}.ps-note-row p{color:#8e8e93;line-height:1.4;margin-top:5px}.ps-note-detail{background:#fff;padding:16px 18px;line-height:1.7}.ps-note-detail h2{font-size:24px;letter-spacing:-.6px}.ps-note-detail small{display:block;text-align:center;color:#8e8e93;margin:8px 0 20px}.ps-note-detail p{margin:0}.ps-empty{color:#8e8e93}.ps button:focus-visible,.ps [role="button"]:focus-visible{outline:3px solid #007aff;outline-offset:2px}.ps-light button:focus-visible,.ps-light [role="button"]:focus-visible{outline-color:#fff}.ps-scroll{scroll-behavior:smooth}
.ps-screen-lock .ps-page{touch-action:pan-x}.ps .ps-avatar .ps-person{width:100%;height:100%}
/* SMS layout also ships in standalone exports. */
.ps-sms-list{display:flex;flex-direction:column;flex:1;min-height:0;background:white}.ps-sms-list header{display:flex;align-items:center;padding:0 10px;height:44px}.ps-sms-list header span{flex:1}.ps-sms-list header button,.ps-sms-thread-head>button{background:none;color:#007aff;min-width:44px;min-height:44px;padding:10px}.ps-sms-list h1{font-size:30px;margin:4px 17px 10px;letter-spacing:-1px}.ps-sms-search{display:flex;align-items:center;gap:6px;background:#eeeef0;border-radius:9px;margin:0 16px 12px;padding:7px;color:#8e8e93}.ps-sms-search input{border:0;background:none;min-width:0;width:100%;outline:none;color:#222}.ps-sms-list .ps-contact{position:relative;align-items:start;min-height:76px;border:0!important;padding:12px 16px}.ps-sms-list .ps-contact:after{content:'';position:absolute;left:68px;right:0;bottom:0;height:1px;background:#e5e5ea}.ps-sms-list .ps-contact-copy p{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35;padding-right:8px}.ps-sms-list .ps-contact-time{position:absolute;right:14px;top:13px;max-width:100px}.ps-sms-list .ps-contact-copy strong{padding-right:75px}.ps-sms-thread-head{position:relative;background:#f5f5f7;border-bottom:1px solid #ddd;min-height:90px;flex-shrink:0;padding:2px 0 8px}.ps-sms-thread-head>button{position:absolute;left:0;top:8px}.ps-sms-thread-head>div{display:flex;align-items:center;flex-direction:column;gap:5px}.ps-sms-thread-head .ps-avatar{width:49px;height:49px;background:#aaaeb6}.ps-sms-thread-head strong{font-size:11px;font-weight:500}.ps-compose{display:flex;align-items:center;gap:7px;padding:5px 10px;background:#fafafa;flex-shrink:0}.ps-compose .ps-story-input{flex:1;min-width:0;min-height:36px;margin:0;padding:7px 11px!important;overflow:hidden;white-space:pre-wrap}.ps-compose>span{color:#929298;display:flex}.ps-compose .ps-send{padding:0;min-width:44px;min-height:44px;background:none;color:#32c75a}.ps-message{margin-bottom:5px}.ps-message-time{margin:6px 0;font-size:9px;line-height:1.3}.ps-bubble{padding:7px 11px;line-height:1.4}.ps-sms-messages .ps-bubble{position:relative;border-radius:16px;background:#e9e9eb}.ps-sms-messages .ps-message.right .ps-bubble{background:#34c759;border-radius:16px}.ps-sms-messages .ps-bubble:before{content:'';position:absolute;left:-4px;bottom:0;width:10px;height:11px;background:#e9e9eb;border-bottom-right-radius:8px}.ps-sms-messages .right .ps-bubble:before{left:auto;right:-4px;background:#34c759;border-radius:0 0 0 8px}.ps-sms-messages{padding:10px 14px}.ps-sms-messages .ps-message-row{max-width:82%}
/* Match existing Weibo toolbar geometry; normalized SMS reference, not pixel tracing. */
.ps-sms-list{container-type:inline-size}.ps-sms-list header{position:relative;display:block;height:38px;min-height:38px;padding:0;flex-shrink:0}.ps-sms-list header button{position:absolute;top:0;width:29px;min-width:29px;height:38px;min-height:38px;padding:0;display:flex;align-items:center;justify-content:center}.ps-sms-list header button:before{content:'';position:absolute;inset:-3px -7px}.ps-sms-list header button:first-child{left:8px}.ps-sms-list header button:nth-last-child(2){right:37px}.ps-sms-list header button:last-child{right:8px}.ps-sms-list header svg{width:20px;height:20px}.ps-sms-list h1{font-size:6cqw;line-height:1.2;margin:4px 16px 8px}.ps-sms-search{height:8cqw;min-height:0;padding:0 7px;margin-bottom:10px;flex-shrink:0}.ps .ps-sms-search input,.ps .ps-sms-search input:focus{border:0!important;background:transparent!important;outline:none!important;box-shadow:none;padding:0;height:100%;font-size:3.6cqw}.ps-sms-search svg{width:4.6cqw;height:4.6cqw}
.ps-sms-list .ps-contact{display:grid;grid-template-columns:43px minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:10px;row-gap:5px;align-items:start;min-height:76px;padding:16px}.ps-sms-list .ps-contact-avatar{grid-column:1;grid-row:1/3;align-self:center}.ps-sms-list .ps-contact-copy{display:contents;padding:0}.ps-sms-list .ps-contact-copy strong{grid-column:2;grid-row:1;padding:0;min-width:0;line-height:1.35}.ps-sms-list .ps-contact-copy p{grid-column:2/4;grid-row:2;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;width:100%;padding:0;margin:0;line-height:1.35;-webkit-line-clamp:unset}.ps-sms-list .ps-contact-time{position:static;grid-column:3;grid-row:1;align-self:start;justify-self:end;max-width:none;white-space:nowrap;margin:0;line-height:1.89}
/* Conversation geometry uses the cropped reference width; status/home stay outside. */
.ps-sms-thread{container-type:inline-size;display:flex;flex-direction:column;flex:1;min-height:0;background:#fff;color:#000}
.ps-sms-thread .ps-sms-thread-head{height:19cqw;min-height:19cqw;padding:.7cqw 0 0;background:#f3f3f3;border-bottom:1px solid #d6d6d8}
.ps-sms-thread-head>div{gap:1.1cqw}.ps-sms-thread .ps-sms-thread-head .ps-avatar{width:11.8cqw;height:11.8cqw;background:#aaaeb6}
.ps-sms-thread-head strong{font-size:3.1cqw;line-height:4cqw;font-weight:400;max-width:75%;white-space:normal;overflow-wrap:anywhere;text-align:center}
.ps-sms-list .ps-contact-copy strong{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;-webkit-line-clamp:unset}
.ps-sms-thread .ps-sms-thread-head>button{left:-.1cqw;top:1.5cqw;width:10cqw;height:12cqw;min-width:0;min-height:0;padding:0;display:grid;place-items:center}
.ps-sms-thread-head>button svg{width:10.8cqw;height:9.4cqw;stroke-width:1.8}
.ps-sms-thread .ps-sms-messages{padding:2cqw 4.67cqw;min-height:0;scroll-behavior:auto}.ps-sms-messages .ps-message{margin-bottom:2.8cqw}.ps-sms-messages .ps-message-time{font-size:2.57cqw;line-height:3.4cqw;margin:1.4cqw 0;color:#8e8e93}
.ps-sms-messages .ps-message-row{max-width:84%;width:fit-content}.ps-sms-thread .ps-bubble{font-size:3.74cqw;line-height:4.55cqw;padding:1.87cqw 2.8cqw;border-radius:4.3cqw;background:#e9e9eb;white-space:pre-wrap;overflow-wrap:anywhere}
.ps-sms-thread .ps-message.right .ps-bubble{background:#32d151;border-radius:4.3cqw;color:white}
/* v18: no protruding tails; rounded bubbles avoid mask-edge kinks. */
.ps-sms-compose{height:auto;min-height:8.76cqw;padding:.28cqw 4.55cqw .28cqw 3.9cqw;gap:4.78cqw;background:#fafafa;align-items:center}
.ps-sms-compose>span:first-child svg{width:7.1cqw;height:7.1cqw}.ps-sms-compose>span:nth-child(2) svg{width:8.2cqw;height:8.2cqw}.ps-sms-compose>span{color:#85858b;flex-shrink:0}
.ps-sms-input-pill{display:flex;align-items:center;flex:1;min-width:0;min-height:7.94cqw;border:1px solid #c7c7cc;border-radius:4cqw;background:#fff;overflow:hidden}
.ps .ps-sms-input-pill .ps-story-input{font-size:3.74cqw!important;line-height:4.55cqw;min-height:7.2cqw;border:0!important;border-radius:0;background:transparent;margin:0;padding:1.2cqw 1cqw 1.2cqw 2.8cqw!important;color:#8e8e93;max-height:21cqw;overflow:auto}
.ps-sms-input-pill .ps-send{position:relative;width:7.4cqw;height:7.4cqw;min-width:7.4cqw;min-height:7.4cqw;display:grid;place-items:center;flex-shrink:0;color:#32d151}
.ps-sms-input-pill .ps-send svg{width:6.84cqw;height:6.84cqw}.ps-sms-input-pill .ps-send:disabled{opacity:.4;cursor:default}
/* v15 compact SMS geometry and offline interactions. */
.ps-sms-thread .ps-sms-thread-head{height:auto;min-height:0;padding:2cqw 0;display:flex;align-items:center;justify-content:center}
.ps-sms-thread-head>div{gap:1.1cqw;min-width:0;width:calc(100% - 88px)}.ps-sms-thread-head strong{font-size:3.5cqw;line-height:4.4cqw;max-width:100%;overflow:visible;text-overflow:clip}
.ps-sms-list .ps-contact-copy{min-width:0;flex:1;padding-right:85px}.ps-sms-list .ps-contact-copy strong{display:block;padding-right:0;max-width:none}
.ps-sms-thread .ps-sms-thread-head>button{left:8px;top:0;width:29px;height:38px;min-height:38px;padding:0}
.ps-sms-thread-head>button svg{width:20px;height:20px}
.ps-sms-messages .ps-message-time{font-size:2.9cqw;line-height:3.8cqw}
.ps-sms-thread .ps-bubble{font-size:4.1cqw;line-height:5.1cqw}
.ps-sms-messages .ps-bubble:before,.ps-sms-messages .ps-bubble:after{content:none}
.ps-sms-compose{gap:2.2cqw}.ps-sms-compose>span:first-child svg,.ps-sms-compose>span:nth-child(2) svg{width:7.2cqw;height:7.2cqw;display:block}
.ps-keyboard{background:#d1d5db;padding:8px 4px 6px;flex-shrink:0;user-select:none;animation:ps-keyboard-rise 180ms ease-out}
.ps-keyboard>div{display:flex;justify-content:center;gap:4px;margin-bottom:7px}.ps-keyboard span{display:grid;place-items:center;background:#fff;border-radius:5px;box-shadow:0 1px 1px #77818c;width:8.5%;height:32px;font:14px/1 system-ui;color:#111;transition:background 50ms,transform 50ms}
.ps-keyboard .ps-key-hit{background:#9bbfff;transform:translateY(-3px) scale(1.08)}.ps-keyboard-bottom span{width:18%;font-size:11px}.ps-keyboard-bottom span:nth-child(2){width:49%}
@keyframes ps-keyboard-rise{from{transform:translateY(50%);opacity:0}to{transform:translateY(0);opacity:1}}
.ps .ps-banner{position:absolute;top:3px;left:8px;right:8px;bottom:auto;z-index:30;display:flex;gap:9px;align-items:center;padding:11px 12px;border-radius:22px;background:rgba(247,247,245,.9);color:#171719;text-align:left;box-shadow:0 5px 20px #0003;backdrop-filter:blur(20px);touch-action:none;transition:transform 180ms ease-out,opacity 180ms ease-out}
.ps-banner-avatar{position:relative;display:block;width:34.2px;height:34.2px;flex:0 0 34.2px;align-self:flex-start}.ps-banner-avatar>.ps-avatar{display:flex;width:34.2px;height:34.2px;border-radius:50%;overflow:hidden}.ps-banner-source{position:absolute;right:-3px;bottom:-3px;display:block;width:16px;height:16px;padding:0;border-radius:3px;background:transparent;overflow:hidden;box-shadow:none}.ps .ps-banner-source>svg,.ps .ps-banner-source>img,.ps .ps-banner-source>.ps-brand-icon{display:block;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;object-fit:contain;border-radius:3px;transform:none;flex-shrink:0}
.ps-banner-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px;font-size:12px;align-self:flex-start}.ps-banner-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0;line-height:1.3}.ps-banner-top b{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600}.ps-banner-top time{flex:0 0 auto;color:#777;font-size:9px;white-space:nowrap}.ps-banner-copy>.ps-banner-text{display:-webkit-box;width:100%;min-width:0;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;white-space:normal;line-height:1.4}
/* Shared list toolbar: SMS, recent calls, gallery. */
.ps .ps-shared-toolbar{position:relative;display:block;height:38px;min-height:38px;padding:0;flex-shrink:0;background:transparent;border:0}.ps .ps-shared-toolbar button{position:absolute;top:0;width:29px;min-width:29px;height:38px;min-height:38px;padding:0;display:flex;align-items:center;justify-content:center;background:none;color:#007aff}.ps .ps-shared-toolbar button:before{content:'';position:absolute;inset:-3px -7px}.ps .ps-shared-toolbar button:first-child{left:8px}.ps .ps-shared-toolbar button:nth-last-child(2){right:37px}.ps .ps-shared-toolbar button:last-child{right:8px}.ps .ps-shared-toolbar button:first-child{right:auto;left:8px}.ps .ps-shared-toolbar svg{width:20px;height:20px;display:block}.ps .ps-shared-toolbar .ps-toolbar-label{width:auto;padding:0 8px;font-size:14px}
@media(prefers-reduced-motion:reduce){.ps *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
  `;
  const displayDate = phone => {
    if (!phone.useSystemTime) return phone.date;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const extensions = {};
  function create(root, initial, options = {}) {
    let data = initial;
    let nav = {screen:'lock', id:null};
    let pin = '', error = '', renderedScreen = null, editMode=!!options.editing;
    let pageMotion=null;
    function cancelPageMotion(){if(!pageMotion)return;const m=pageMotion;pageMotion=null;clearTimeout(m.timer);m.animations.forEach(a=>a.cancel());m.old.remove();m.page.inert=false;}
    function transitionPage(kind,change){
      if(pageMotion)return;
      const old=root.querySelector('.ps-page')?.cloneNode(true);
      change();
      const page=root.querySelector('.ps-page');
      if(!old||!page||editMode||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      old.inert=true;old.setAttribute('aria-hidden','true');
      Object.assign(old.style,{position:'absolute',top:'47px',left:'0',width:'100%',zIndex:'8',pointerEvents:'none'});
      if(kind==='call-exit')old.style.background='linear-gradient(160deg,#424d61,#252e40 60%,#17202d)';
      page.parentNode.append(old);page.inert=true;
      const duration=kind==='unlock'?280:220;
      const animations=[old.animate(kind==='unlock'?[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-65px)'}]:[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.88)'}],{duration,easing:'ease-out',fill:'forwards'}),page.animate(kind==='unlock'?[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}]:[{opacity:0},{opacity:1}],{duration,easing:'ease-out',fill:'forwards'})];
      pageMotion={old,page,animations,timer:setTimeout(cancelPageMotion,duration)};
    }
    const onTransition=e=>transitionPage(e.detail.kind,e.detail.change);
    root.addEventListener('phone-page-transition',onTransition);
    let clockStart=Date.now(), idleStart=Date.now(),clockKey=data.phone.time+'|'+data.phone.useSystemTime;
    const clockText=()=>{const d=session?.clock?.()||(data.phone.useSystemTime?new Date():new Date(new Date(data.phone.date+'T'+data.phone.time+':00').getTime()+Date.now()-clockStart));return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});};
    const touch=()=>{idleStart=Date.now();};
    ['pointerdown','keydown','input','touchstart'].forEach(type=>root.addEventListener(type,touch,{passive:true}));
    let renderedDate=displayDate(data.phone);
    const ticker=setInterval(()=>{
      if(!root.isConnected){clearInterval(ticker);session?.dispose?.();return;}
      const live=session?.clock?.(),today=live?`${live.getFullYear()}-${String(live.getMonth()+1).padStart(2,'0')}-${String(live.getDate()).padStart(2,'0')}`:displayDate(data.phone);if(today!==renderedDate)render();
      root.querySelectorAll('.ps-status>span:first-child,.ps-clock,[data-live-clock]').forEach(el=>{el.textContent=clockText();});
      const editing=document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
      if(editing)idleStart=Date.now();
      if(data.phone.autoLock&&!editMode&&!editing&&!session?.busy?.()&&!['lock','pin','call-detail','incoming'].includes(nav.screen)&&Date.now()-idleStart>=data.phone.autoLock*1000)action('lock');
    },1000);
    const session = extensions.session?.(initial, () => render(), root);
    session?.setEditing?.(editMode);
    const avatar = (name, src) => `<span class="ps-avatar">${src ? `<img src="${escape(src)}" alt="${escape(name)}的头像">` : name?.trim() ? escape(Array.from(name.trim())[0]) : '<svg class="ps-person" viewBox="0 0 100 100" aria-hidden="true" fill="currentColor"><circle cx="50" cy="35" r="13"/><path d="M24 77v-6c0-12 12-19 26-19s26 7 26 19v6Z"/></svg>'}</span>`;
    const homeToolbar = (right='') => `<header class="ps-shared-toolbar"><button data-act="home" aria-label="返回桌面">${svg('arrow')}</button><span></span>${right}</header>`;
    const toolbar = (title, back) => `<div class="ps-toolbar"><button class="ps-back" data-act="${back}" aria-label="返回">${svg('arrow')}</button><strong>${escape(title)}</strong><button class="ps-back ps-top-home" data-act="home" aria-label="返回桌面">${svg('home')}</button></div>`;
    function render() {
      cancelPageMotion();
      pagerMotion?.finish();
      swipe=null;
      const liveDate=session?.clock?.();renderedDate=liveDate?`${liveDate.getFullYear()}-${String(liveDate.getMonth()+1).padStart(2,'0')}-${String(liveDate.getDate()).padStart(2,'0')}`:displayDate(data.phone);
      const light = ['lock','pin','home'].includes(nav.screen);
      let body = '';
      if (nav.screen === 'lock') {
        const date = new Date(renderedDate + 'T12:00:00');
        const label = Number.isNaN(date.getTime()) ? data.phone.date : date.toLocaleDateString('zh-CN', {month:'long',day:'numeric',weekday:'long'});
        body = `<button class="ps-lock-open" data-act="unlock" aria-label="打开密码键盘">${svg('lock')}<span class="ps-date">${escape(label)}</span><span class="ps-clock">${escape(clockText())}</span><span class="ps-owner">${escape(data.phone.name)}</span></button><div class="ps-notifications">${data.notifications.map(n => `<div class="ps-notification" role="button" tabindex="0" data-act="unlock"><div class="ps-notification-head"><span class="ps-mini-icon">${appIcon('chat')}</span><b>${escape(n.title)}</b><span>${escape(n.time)}</span></div><p>${escape(n.text)}</p></div>`).join('')}</div><button class="ps-unlock-hint" data-act="unlock">向上轻扫或点击解锁</button>`;
      } else if (nav.screen === 'pin') {
        body = `<div class="ps-pin-title">输入密码</div><p class="ps-pin-help">4 位剧情密码 · 非加密保护</p><div class="ps-dots" aria-label="已输入 ${pin.length} 位">${[0,1,2,3].map(i=>`<span class="ps-dot ${i<pin.length?'filled':''}"></span>`).join('')}</div><div class="ps-pin-error" role="status">${escape(error)}</div><div class="ps-keypad">${['1','2','3','4','5','6','7','8','9','','0'].map((n,i)=>`<button class="ps-key ${!n?'empty':''}" data-digit="${n}" ${!n?'tabindex="-1" aria-hidden="true"':`aria-label="数字 ${n}"`}>${n}<small>${['','ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ','',''][i] || '&nbsp;'}</small></button>`).join('')}</div><div class="ps-pin-actions"><button data-act="lock">取消</button><button data-act="erase">删除</button></div>`;
      } else if (nav.screen === 'home') {
        body = `<div class="ps-app-grid">${[['chat','短信','chats'],['photo','照片','photos'],['note','备忘录','notes']].map(([icon,title,act])=>`<button class="ps-app" data-act="${act}"><span class="ps-app-icon ${icon}">${appIcon(icon)}</span>${title}</button>`).join('')}</div><button class="ps-home-lock" data-act="lock">${svg('lock')}锁定手机</button><div class="ps-dock">${[['chat','短信','chats'],['photo','照片','photos'],['note','备忘录','notes']].map(([icon,title,act])=>`<button data-act="${act}" aria-label="打开${title}"><span class="ps-app-icon ${icon}">${appIcon(icon)}</span></button>`).join('')}</div>`;
      } else if (nav.screen === 'chats') {
        body = toolbar('短信', 'home') + `<div class="ps-scroll"><h1 class="ps-large-title">短信</h1>${data.contacts.map(c=>{const m=c.messages.at(-1);return `<button class="ps-contact" data-act="chat" data-id="${escape(c.id)}">${avatar(c.name,c.avatar)}<span class="ps-contact-copy"><strong>${escape(c.name || '未命名联系人')}</strong><p>${escape(m?.text || '暂无消息')}</p></span><span class="ps-contact-time">${escape(m?.time || '')}</span></button>`;}).join('') || '<div class="ps-empty">还没有联系人<br>在编辑器里写下第一段对话</div>'}</div>`;
      } else if (nav.screen === 'chat') {
        const c = data.contacts.find(c=>c.id===nav.id);
        if (!c) {nav.screen='chats';render();return;}
        body = toolbar(c.name || '未命名联系人', 'chats') + `<div class="ps-scroll ps-messages">${c.messages.map(m=>`<div class="ps-message ${m.side}"><div class="ps-message-time">${escape(m.time)}</div><div class="ps-message-row">${avatar(m.side==='left'?c.name:'我',m.side==='left'?c.avatar:'')}<div class="ps-bubble">${escape(m.text)}</div></div></div>`).join('') || '<div class="ps-empty">这段故事，等待开始</div>'}</div><div class="ps-chat-footer">剧情回放 · 只读对话</div>`;
      } else if (nav.screen === 'photos') {
        body = toolbar('照片', 'home') + `<div class="ps-scroll"><h1 class="ps-large-title">图库</h1><p class="ps-section-meta">${data.photos.length} 张照片</p>${data.photos.length?`<div class="ps-photo-grid">${data.photos.map(p=>`<button data-act="photo" data-id="${escape(p.id)}" aria-label="查看 ${escape(p.name)}"><img src="${escape(p.src)}" alt="${escape(p.name)}"></button>`).join('')}</div>`:'<div class="ps-empty">相册还是空的<br>上传照片，把回忆放进口袋</div>'}</div>`;
      } else if (nav.screen === 'photo') {
        const p = data.photos.find(p=>p.id===nav.id);
        if(!p){nav.screen='photos';render();return;}
        body = toolbar('照片','photos') + `<div class="ps-scroll ps-photo-full"><img src="${escape(p.src)}" alt="${escape(p.name)}"></div><div class="ps-photo-caption">${escape(p.name)}</div>`;
      } else if (nav.screen === 'notes') {
        body = toolbar('备忘录', 'home') + `<div class="ps-scroll"><h1 class="ps-large-title">备忘录</h1><p class="ps-section-meta">${data.notes.length} 则备忘录</p><div class="ps-note-list">${data.notes.map(n=>`<button class="ps-note-row" data-act="note" data-id="${escape(n.id)}"><strong>${escape(n.title || '未命名备忘录')}</strong><p>${escape(n.time)}　${escape(n.text)}</p></button>`).join('') || '<div class="ps-empty">还没有备忘录</div>'}</div></div>`;
      } else if (nav.screen === 'note') {
        const n = data.notes.find(n=>n.id===nav.id);
        if(!n){nav.screen='notes';render();return;}
        body = toolbar('备忘录','notes') + `<div class="ps-scroll ps-note-detail"><h2>${escape(n.title)}</h2><small>${escape(n.time)}</small><p>${escape(n.text)}</p></div>`;
      }
      if (session) body = session.render(nav, body, {toolbar, homeToolbar, avatar, appIcon});
      const scroll = renderedScreen===nav.screen ? root.querySelector('.ps-scroll')?.scrollTop || 0 : 0;
      renderedScreen=nav.screen;
      const focused = root.contains(document.activeElement) ? document.activeElement : null;
      const focusAct = focused?.getAttribute('data-act');
      const focusId = focused?.getAttribute('data-id');
      const focusDigit = focused?.getAttribute('data-digit');
      root.innerHTML = `<style>${css}</style><div class="ps ps-screen-${nav.screen} ${light?'ps-light':''}"><div class="ps-display">${light?'<div class="ps-wall"></div>'+(data.phone[nav.screen==='home'?'homeBackground':'lockBackground'].image?'':'<div class="ps-stars"></div>'):''}<div class="ps-island"></div><div class="ps-status"><span>${escape(clockText())}</span><span class="ps-status-icons">${svg('signal')}${svg('wifi')}${svg('battery','ps-bat')}</span></div><div class="ps-page">${body}</div><button class="ps-homebar" data-act="${['lock','pin'].includes(nav.screen)?'unlock':'home'}" aria-label="${['lock','pin'].includes(nav.screen)?'解锁':'返回桌面'}"></button></div></div>`;
      const wall = root.querySelector('.ps-wall');
      if (wall) {
        const b=data.phone[nav.screen==='home'?'homeBackground':'lockBackground'];
        if(b.image) {
          const img=document.createElement('img');img.src=b.image;img.alt='';
          Object.assign(img.style,{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${b.x}% ${b.y}%`,transform:`scale(${b.scale/100})`,transformOrigin:`${b.x}% ${b.y}%`,display:'block'});
          wall.append(img);
        }
      }
      const scroller=root.querySelector('.ps-scroll');
      if(scroller) {
        if(!session||!scroller.matches('.ps-messages'))scroller.scrollTop=scroll;
        const compact=()=>{
          const shell=scroller.closest('.weibo'),profile=scroller.querySelector('.ps-profile-cover');
          if(shell&&profile)shell.classList.toggle('is-compact',scroller.scrollTop>=profile.offsetHeight-34);
        };
        scroller.addEventListener('scroll',compact,{passive:true});compact();
      }
      session?.afterRender?.({messageScroll:scroll});
      if (focused) {
        const next = Array.from(root.querySelectorAll('[data-act],[data-digit]')).find(el =>
          focusDigit !== null ? el.getAttribute('data-digit') === focusDigit :
            el.getAttribute('data-act') === focusAct && el.getAttribute('data-id') === focusId);
        (next || root.querySelector('.ps-key, .ps-app, .ps-back, .ps-lock-open') || root).focus({preventScroll:true});
      }
    }
    function action(act, targetId) {
      touch();
      if(pageMotion){if(act==='unlock')return;cancelPageMotion();}
      if(act==='unlock'&&nav.screen==='lock'){transitionPage('unlock',()=>{nav={screen:'pin',id:null};pin='';error='';render();});return;}
      if(act==='unlock'&&nav.screen==='pin')return;
      if(act==='desktop-page'&&nav.screen==='home'&&slidePage(targetId))return;
      if (session?.action(act, targetId, nav)) {render();return;}
      if (act==='unlock') {nav={screen:'pin',id:null};pin='';error='';}
      else if (act==='erase') {pin=pin.slice(0,-1);error='';}
      else if (['lock','home','chats','chat','photos','photo','notes','note'].includes(act)) {nav={screen:act,id:targetId};pin='';error='';}
      render();
    }
    function digit(n) {
      if(pageMotion||nav.screen!=='pin'||!/^[0-9]$/.test(n))return;
      pin+=n;error='';
      if(pin.length===4){if(pin===data.phone.password){nav={screen:'home',id:null};}else{error='密码不正确，请重试';}pin='';}
      render();
    }
    root.addEventListener('change',e=>{const key=e.target.dataset.phoneSetting;if(!['autoLock','useSystemTime'].includes(key))return;data.phone[key]=key==='autoLock'?Number(e.target.value):e.target.value==='true';clockStart=Date.now();touch();root.dispatchEvent(new CustomEvent('phone-settings-change',{bubbles:true}));});
    root.addEventListener('input',e=>{if(e.target.matches('[data-contact-filter]')){const q=e.target.value.toLocaleLowerCase();root.querySelectorAll('[data-contact-name]').forEach(el=>el.hidden=!el.dataset.contactName.includes(q));}});
    function filterCalls(){const q=(root.querySelector('[data-call-search]')?.value||'').toLowerCase(),missed=root.querySelector('[data-phone-filter="missed"]')?.getAttribute('aria-pressed')==='true';root.querySelectorAll('[data-call-name]').forEach(el=>el.hidden=!el.dataset.callName.includes(q)||(missed&&el.dataset.missed!=='true'));}
    root.addEventListener('input',e=>{if(e.target.matches('[data-call-search]'))filterCalls();});
    root.addEventListener('click',e=>{const b=e.target.closest('[data-phone-filter]');if(!b)return;root.querySelectorAll('[data-phone-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));filterCalls();});
    root.addEventListener('submit',e=>{if(e.target.matches('.ps-search-form')){e.preventDefault();session?.search?.(new FormData(e.target).get('query')||'');render();}});
    let swipe=null,suppressClickUntil=0,pagerMotion=null;
    function slidePage(target) {
      const pager=root.querySelector('.ps-pager'),track=pager?.querySelector('.ps-page-track');
      if(!track)return false;
      pagerMotion?.finish();
      const pages=Array.from(track.children),page=Math.max(0,Math.min(pages.length-1,Number(target)||0));
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const finish=()=>{
        clearTimeout(timer);track.removeEventListener('transitionend',ended);
        track.style.transition='none';track.style.transform=`translateX(-${page*100}%)`;
        pager.dataset.page=page;
        pages.forEach((el,i)=>el.inert=i!==page);
        root.querySelectorAll('[data-act="desktop-page"]').forEach(el=>el.setAttribute('aria-current',Number(el.dataset.id)===page?'page':'false'));
        session?.action('desktop-page',String(page),nav);
        if(pagerMotion?.finish===finish)pagerMotion=null;
      };
      const ended=e=>{if(e.target===track&&e.propertyName==='transform')finish();};
      let timer;
      pagerMotion={finish};
      // Commit only after settling; keep DOM and keyboard focus intact.
      void track.offsetWidth;
      track.style.transition=reduced?'none':'transform 250ms ease-out';
      track.style.transform=`translateX(-${page*100}%)`;
      if(reduced)finish();else{track.addEventListener('transitionend',ended);timer=setTimeout(finish,280);}
      return true;
    }
    root.addEventListener('pointerdown',e=>{
      const pager=e.target.closest('.ps-pager');
      if(nav.screen!=='home'||!e.isPrimary||e.button!==0||!pager)return;
      pagerMotion?.finish();
      const track=pager.querySelector('.ps-page-track');
      swipe={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastTime:e.timeStamp,velocity:0,axis:null,pager,track,page:Number(pager.dataset.page),width:pager.getBoundingClientRect().width};
    });
    root.addEventListener('pointermove',e=>{
      const s=swipe;if(!s||s.id!==e.pointerId)return;
      const dx=e.clientX-s.x,dy=e.clientY-s.y;
      if(!s.axis&&Math.max(Math.abs(dx),Math.abs(dy))>8){
        s.axis=Math.abs(dx)>Math.abs(dy)*1.3?'x':'y';
        if(s.axis==='x'){s.pager.setPointerCapture(e.pointerId);s.track.style.transition='none';}
      }
      if(s.axis!=='x')return;
      e.preventDefault();
      const dt=e.timeStamp-s.lastTime;if(dt>0)s.velocity=(e.clientX-s.lastX)/dt;
      s.lastX=e.clientX;s.lastTime=e.timeStamp;
      const edge=(s.page===0&&dx>0)||(s.page===s.track.children.length-1&&dx<0);
      const offset=edge?dx*.28:Math.max(-s.width,Math.min(s.width,dx));
      s.track.style.transform=`translateX(calc(-${s.page*100}% + ${offset}px))`;
    },{passive:false});
    function endSwipe(e,cancelled=false){
      const s=swipe;if(!s||s.id!==e.pointerId)return;swipe=null;
      if(s.pager.hasPointerCapture(e.pointerId))s.pager.releasePointerCapture(e.pointerId);
      if(s.axis==='x'){
        suppressClickUntil=Date.now()+400;
        const dx=e.clientX-s.x,velocity=e.timeStamp-s.lastTime<100?s.velocity:0;
        const step=!cancelled&&(Math.abs(dx)>s.width*.22||(Math.abs(dx)>12&&Math.abs(velocity)>.5))?(dx<0?1:-1):0;
        slidePage(s.page+step);
      }else if(s.axis==='y')suppressClickUntil=Date.now()+400;
    }
    root.addEventListener('pointercancel',e=>endSwipe(e,true));
    root.addEventListener('lostpointercapture',e=>endSwipe(e,true));
    root.addEventListener('pointerup',e=>endSwipe(e));
    root.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();return;}const el=e.target.closest('[data-act],[data-digit]');if(!el||!root.contains(el))return;if(el.hasAttribute('data-digit'))digit(el.dataset.digit);else action(el.dataset.act,el.dataset.id);});
    root.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;if(nav.screen==='pin'&&/^\d$/.test(e.key)){e.preventDefault();digit(e.key);}else if(nav.screen==='pin'&&e.key==='Backspace'){e.preventDefault();action('erase');}else if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"]')){e.preventDefault();action(e.target.dataset.act,e.target.dataset.id);}});
    let lockGesture=null;
    root.addEventListener('pointerdown',e=>{if(nav.screen==='lock'&&e.isPrimary&&e.button===0)lockGesture={id:e.pointerId,x:e.clientX,y:e.clientY};});
    root.addEventListener('pointerup',e=>{const g=lockGesture;lockGesture=null;if(g&&g.id===e.pointerId&&nav.screen==='lock'&&g.y-e.clientY>45&&g.y-e.clientY>Math.abs(g.x-e.clientX)*1.3){suppressClickUntil=Date.now()+400;action('unlock');}});
    root.addEventListener('pointercancel',()=>{lockGesture=null;});
    root.tabIndex=0;root.setAttribute('aria-label','交互手机预览');
    render();
    return {dispose(){cancelPageMotion();root.removeEventListener('phone-page-transition',onTransition);clearInterval(ticker);session?.dispose?.();},setEditing(value){editMode=!!value;session?.setEditing?.(editMode);touch();render();},update(next){if(next.phone.time+'|'+next.phone.useSystemTime!==clockKey){clockStart=Date.now();clockKey=next.phone.time+'|'+next.phone.useSystemTime;}data=next;session?.update(next);render();},reset(){clockStart=Date.now();touch();session?.reset();nav={screen:'lock',id:null};render();},show(screen, targetId){action(screen,targetId);},getScreen(){return {...nav};}};
  }
  function standalone(data) {
    const clean = validate(data);
    const json = JSON.stringify(clean).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(clean.phone.name)+' · 互动故事</title><style>*{box-sizing:border-box}body{margin:0;min-height:100svh;background:radial-gradient(ellipse at 50% 30%,#263440,#11151d 70%);display:flex;align-items:center;justify-content:center;padding:24px 16px;color:#a6b5c7;font:12px system-ui}.viewer{display:flex;flex-direction:column;align-items:center;gap:20px;width:100%}.viewer>p{margin:0;opacity:.7;text-align:center}#phone{width:310px;max-width:100%}@media(max-width:360px){body{padding:16px 12px}}</style></head><body><main class="viewer"><div id="phone"></div><p>点击或上滑解锁 · 剧情密码仅用于互动，非加密保护</p></main><script>const kit=('+PhoneStoryFactory.toString()+')();'+(extensions.install?'window.PhoneBrandAssets='+JSON.stringify(extensions.brandAssets||{}).replace(/</g,'\\u003c')+';('+extensions.install.toString()+')(kit);':'')+'kit.create(document.getElementById("phone"),'+json+');<\/script></body></html>';
  }
  return {create, defaults, validate, standalone, displayDate, svg, escape, id, MAX_JSON, MAX_IMAGE, extensions};
})();
