/* Editor: local state, targeted form updates, validated portable exports. */
(function () {
  'use strict';
  const K = window.PhoneStory;
  const E = K.escape;
  const KEY = 'pocket-story-studio-v1';
  const $ = selector => document.querySelector(selector);
  const sections = [
    ['phone','phone','手机设定','设置这部手机的身份，营造故事的第一印象。'],
    ['apps','home','桌面应用','统一编辑桌面、短信、相册、备忘录、通话事件与各应用。']
  ];
  let data = K.defaults();
  let startupWarning = '';
  try { const saved = localStorage.getItem(KEY); if(saved) { if(saved.length>K.MAX_JSON) throw new Error('草稿过大'); const parsed=JSON.parse(saved); if(K.extensions.legacyChats(parsed))startupWarning='小红书 / 微博旧会话已转移至短信；联系人、消息和事件引用均保留。'; data=K.validate(parsed); } }
  catch(e){startupWarning='无法读取本地草稿，已打开原创示例。原草稿未主动删除。请检查浏览器存储或导入备份。';}
  let section = 'phone', selectedContact = data.contacts[0]?.id;
  let saveTimer, toastTimer, pendingUploads = 0;
  const preview = K.create($('#phone-preview'), data, {editing:true});
  createPhoneEditorOverlay({root:$('#phone-preview'),preview,getData:()=>data,readImage,toast,commit(next){const moved=next.contacts.find(c=>data.contacts.some(old=>old.id===c.id&&old.app!==c.app));data=K.validate(next);if(moved){selectedContact=moved.id;section='apps';K.extensions.editor.navigate(moved.app);preview.show('chat',moved.id);}changed();render();save();}});
  function toast(text) { const el=$('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),5000); }
  function save() {
    clearTimeout(saveTimer);
    try {
      const clean=K.validate(data);
      localStorage.setItem(KEY,JSON.stringify(clean));
      $('#save-state').textContent='已自动保存 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
      $('#save-state').classList.remove('error');
      return true;
    } catch(e) {
      $('#save-state').textContent=e.name==='QuotaExceededError'?'存储已满 · 请导出备份':e.message;
      $('#save-state').classList.add('error');
      return false;
    }
  }
  function changed() {
    preview.update(data);
    $('#project-name').textContent=data.phone.name || '未命名剧情';
    $('#save-state').textContent='正在保存…';
    clearTimeout(saveTimer);saveTimer=setTimeout(save,450);
  }
  function iconize(root=document) { root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=K.svg(el.dataset.icon)); }
  const button = (act,label,icon='plus',extra='') => `<button class="button ${extra}" data-action="${act}">${K.svg(icon)}${label}</button>`;
  const field = (label,scope,key,value,opts={}) => {
    const attrs=`${opts.disabled?'disabled':''} data-scope="${scope}" data-key="${key}" ${opts.id?`data-id="${E(opts.id)}"`:''} ${opts.parent?`data-parent="${E(opts.parent)}"`:''}`;
    const max=opts.max||200;
    let input=opts.area?`<textarea ${attrs} maxlength="${max}" rows="${scope==='message'?1:opts.rows||3}" ${scope==='message'?'data-autogrow':''}>${E(value)}</textarea>`:opts.select?`<select ${attrs}>${opts.select.map(([v,l])=>`<option value="${v}" ${value===v?'selected':''}>${l}</option>`).join('')}</select>`:`<input ${attrs} type="${opts.type||'text'}" ${opts.type==='datetime-local'?'step="1" required':''} value="${E(value)}" ${opts.type==='date'||opts.type==='time'?'':`maxlength="${max}"`} ${opts.numeric?'inputmode="numeric" pattern="[0-9]{4}"':''}>`;
    return `<label class="field ${opts.full?'full':''}"><span>${label}</span>${input}${opts.help?`<small>${opts.help}</small>`:''}</label>`;
  };
  const heading = (title,icon,label='') => `<div class="card-heading"><h2 class="card-title">${K.svg(icon)}${title}</h2><span class="card-label">${label}</span></div>`;
  const remove = (act,id,parent) => `<button class="icon-button" data-action="${act}" data-id="${E(id)}" ${parent?`data-parent="${E(parent)}"`:''} aria-label="删除${act==='delete-contact'?'联系人及全部消息':act==='delete-message'?'消息':act==='delete-photo'?'照片':act==='delete-note'?'备忘录':'通知'}" title="删除">${K.svg('trash')}</button>`;
  function backgroundCard(key,title) {
    const b=data.phone[key];
    return `<div class="card">${heading(title,'photo','BACKGROUND')}<p class="section-intro">图片按覆盖屏幕适配；缩放可放大，水平与垂直位置控制裁切。仅调整当前背景。</p><label class="upload-zone">${K.svg('upload')}<strong>上传${title}</strong><small>PNG / JPG / WebP / GIF · 最大 5MB · 自动内嵌</small><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="${key}" aria-label="上传${title}"></label>${b.image?`<div class="wallpaper-row"><img class="wall-preview" src="${E(b.image)}" alt="${title}"><button class="button subtle" data-action="clear-background" data-id="${key}">恢复默认背景</button></div>`:''}<div class="field-grid">${[['scale','缩放',50,300],['x','水平位置',0,100],['y','垂直位置',0,100]].map(([k,label,min,max])=>`<label class="field full"><span>${label} <output>${b[k]}%</output></span><input type="range" min="${min}" max="${max}" step="1" value="${b[k]}" data-scope="background" data-id="${key}" data-key="${k}" aria-label="${title}${label}"></label>`).join('')}</div><button class="button subtle" data-action="reset-background" data-id="${key}">重置大小和位置</button></div>`;
  }
  function nav() {
    $('#navigation').innerHTML=sections.map(([key,icon,title],i)=>`<button class="nav-item ${section===key?'active':''}" data-section="${key}" ${section===key?'aria-current="page"':''} title="${title}">${K.svg(icon)}<span>${title}</span><span class="nav-count">${({phone:'01',apps:'02',events:'06'})[key]}</span></button>`).join('');
  }
  function editorView() {
    const editor=$('#editor'), pane=editor.closest('.editor-pane'), containers=[];
    for(let el=pane;el;el=el.parentElement)if(el.scrollHeight>el.clientHeight&&/(auto|scroll)/.test(getComputedStyle(el).overflowY))containers.push({el,top:el.scrollTop,left:el.scrollLeft});
    const viewportTop=Math.max(0,...containers.map(x=>x.el.getBoundingClientRect().top));
    const identify=el=>{
      const card=el.closest('[data-editor-item]');
      return {item:card?.dataset.editorItem,attrs:['id','data-path','data-scope','data-key','data-id','data-parent','data-action','data-upload','data-index','data-section'].filter(k=>el.hasAttribute(k)).map(k=>[k,el.getAttribute(k)]),tag:el.tagName};
    };
    const controls=[...editor.querySelectorAll('input,textarea,select,button,[data-editor-item]')];
    const anchors=controls.filter(el=>!el.closest('.phone-contact-sidebar')&&el.getBoundingClientRect().bottom>viewportTop&&el.getBoundingClientRect().top<innerHeight).map(el=>({key:identify(el),y:el.getBoundingClientRect().top}));
    const active=document.activeElement,focus=editor.contains(active)&&active.type!=='file'?{key:identify(active),start:active.selectionStart,end:active.selectionEnd}:null;
    return {containers,innerScroll:[...editor.querySelectorAll('.phone-editor-tabs')].map(el=>({selector:'.'+el.className.split(' ')[0],top:el.scrollTop,left:el.scrollLeft})),x:scrollX,y:scrollY,anchors,focus,tabs:editor.querySelector('.app-editor-tabs')?.scrollLeft||0};
  }
  function restoreEditor(view,reset) {
    const editor=$('#editor');
    const find=key=>[...editor.querySelectorAll(key.tag)].find(el=>(!key.item||el.closest('[data-editor-item]')?.dataset.editorItem===key.item)&&key.attrs.every(([k,v])=>el.getAttribute(k)===v));
    const focus=view.focus&&find(view.focus.key);
    if(!reset&&focus){focus.focus({preventScroll:true});if((typeof view.focus.start==='number'&&/^(text|search|url|tel|password)$/.test(focus.type))||focus.tagName==='TEXTAREA'){try{focus.setSelectionRange(view.focus.start,view.focus.end);}catch(e){}}}
    view.containers.forEach(({el,top,left})=>{el.scrollTop=reset?0:top;el.scrollLeft=left;});
    window.scrollTo(view.x,reset?0:view.y);
    if(!reset){
      for(const anchor of view.anchors){const el=find(anchor.key);if(!el)continue;const delta=el.getBoundingClientRect().top-anchor.y;if(view.containers.length)view.containers[0].el.scrollTop+=delta;else window.scrollBy(0,delta);break;}
    }
    for(const saved of view.innerScroll||[]){const el=editor.querySelector(saved.selector);if(el&&saved.selector!=='.phone-contact-content'){el.scrollTop=reset?0:saved.top;el.scrollLeft=reset?0:saved.left;}}
    const tabs=editor.querySelector('.app-editor-tabs'),tab=tabs?.querySelector('[aria-pressed="true"]');
    if(tabs){tabs.scrollLeft=view.tabs;if(tab){const l=tab.offsetLeft-tabs.offsetLeft,r=l+tab.offsetWidth;if(l<tabs.scrollLeft)tabs.scrollLeft=l;else if(r>tabs.scrollLeft+tabs.clientWidth)tabs.scrollLeft=r-tabs.clientWidth;}}
  }
  let smsSubtab='initial';
  function smsWorkspace(contacts,c){
    let html=`<section class="call-editor sms-editor"><aside class="phone-contact-sidebar"><button class="button phone-add-contact" data-action="add-contact">添加联系人</button><nav class="phone-editor-tabs">${contacts.map(x=>`<button class="button contact-tab" data-action="select-contact" data-id="${E(x.id)}" aria-pressed="${x.id===selectedContact}">${E(x.name||x.number||'未命名')}</button>`).join('')}</nav></aside><div class="phone-contact-content">`;
    if(c){c.number??='';html+=`<div class="card"><div class="item-heading"><strong>联系人档案</strong>${remove('delete-contact',c.id)}</div><div class="contact-profile"><div class="compact-media"><span>头像</span><label class="compact-upload round">${c.avatar?`<img src="${E(c.avatar)}" alt="头像">`:'<b>＋</b>'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="avatar" data-id="${E(c.id)}" aria-label="上传头像"></label>${c.avatar?`<button class="button" data-action="clear-avatar" data-id="${E(c.id)}">移除</button>`:''}</div><div class="contact-identity">${field('转移至应用','contact','app',c.app||'sms',{id:c.id,select:[['sms','短信'],['wechat','微信'],['qq','QQ']]})}${field('姓名','contact','name',c.name,{id:c.id,max:80})}${field('号码','contact','number',c.number,{id:c.id,max:80})}</div></div></div><nav class="phone-sub-tabs">${[['initial','初始显示'],['events','短信事件']].map(([key,title])=>`<button class="button" data-action="sms-subtab" data-tab="${key}" aria-pressed="${smsSubtab===key}">${title}</button>`).join('')}</nav>`;
    if(smsSubtab==='events')html+=K.extensions.smsEditor(data,c);else html+=`<div class="section-heading"><h2>初始显示</h2></div>`+c.messages.map(m=>`<div class="message-card" data-editor-item="${E(m.id)}" data-sort-path="contacts.${data.contacts.indexOf(c)}.messages" data-sort-id="${E(m.id)}" data-sms-sort><div class="compact-row sms-initial-meta">${m.side==='left'?`<label class="field inline-check"><span>未读</span><input type="checkbox" data-scope="message" data-key="unread" data-id="${E(m.id)}" data-parent="${E(c.id)}" ${m.unread?'checked':''}></label>`:''}${field('时间','message','time',K.extensions.smsDateTime(m.time,data.phone),{id:m.id,parent:c.id,type:'datetime-local',help:K.extensions.smsDateTime(m.time,data.phone)?'':`原值：${E(m.time)}`})}${field('方向','message','side',m.side,{id:m.id,parent:c.id,select:[['left','对方'],['right','我']]})}${field('内容','message','text',m.text,{id:m.id,parent:c.id,area:true,full:true,rows:1,max:10000})}<div class="card-moves">${[['up','上移'],['down','下移']].map(([direction,label])=>`<button class="button" data-action="move-message" data-id="${E(m.id)}" data-parent="${E(c.id)}" data-direction="${direction}" aria-label="${label}消息">${label}</button>`).join('')}${remove('delete-message',m.id,c.id)}</div></div></div>`).join('');}
    if(c&&smsSubtab==='initial')html+=`<div class="list-bottom">${button('add-message','添加消息')}</div>`;
    return html+'</div></section>';
  }
  function render({reset=false}={}) {
    const view=editorView();
    nav();
    const index=sections.findIndex(s=>s[0]===section);
    $('#section-title').textContent=sections[index][2];$('#section-description').textContent=sections[index][3];$('#chapter-number').textContent=({phone:'01',apps:'02',events:'06'})[section];
    let html='';
    const appTab=K.extensions.editor.current();
    const contactApp=['sms','qq','wechat'].includes(appTab)?appTab:null;
    const contentSection=section==='apps'&&(contactApp||['photos','notes'].includes(appTab))?(contactApp?'contacts':appTab):section;
    if(contentSection==='phone') {
      const p=data.phone;
      html=`<div class="card">${heading('基础信息','phone','01 / IDENTITY')}<div class="field-grid phone-info-grid">${field('手机名称','phone','name',p.name,{full:true,max:80,help:'显示在锁屏与桌面，也会成为导出作品的标题。'})}${field('时间来源','phone','useSystemTime',String(p.useSystemTime??true),{select:[['true','读取本机时间'],['false','剧情时间（从下方时间起走）']],help:'本机模式同步本地日期与时间；剧情模式正常走时，重置回到设定起点。'})}${field('自动锁屏','phone','autoLock',String(p.autoLock||0),{select:[['0','永不'],['30','30秒'],['60','1分钟'],['120','2分钟'],['300','5分钟']]})}${field('时间','phone','time',p.useSystemTime?new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):p.time,{type:'time',disabled:p.useSystemTime})}${field('日期','phone','date',K.displayDate(p),{type:'date',disabled:p.useSystemTime})}${field('解锁密码','phone','password',p.password,{full:true,max:4,numeric:true,help:'默认 0000；仅支持 4 位数字。导出文件中可读取密码，不用于隐私保护。'})}</div></div>${backgroundCard('lockBackground','锁屏背景')}${backgroundCard('homeBackground','桌面壁纸')}<div class="card">${heading('创作小贴士','note','STORY NOTES')}<p class="help">先设定手机身份，再写对话与线索。右侧手机支持真实解锁、进入应用、返回桌面。导出的单 HTML 不含编辑器，适合分享给读者。</p><p class="help warning-text">草稿依赖当前浏览器和访问地址。无痕模式、清理站点数据、修改服务端口都可能导致草稿不可用。JSON 备份可再次导入编辑。</p></div>`;
    } else if(contentSection==='contacts') {
      const contacts=data.contacts.filter(c=>c.app===contactApp||contactApp==='sms'&&(!c.app||c.app==='chat'));
      if(!contacts.some(c=>c.id===selectedContact))selectedContact=contacts[0]?.id;
      const c=contacts.find(c=>c.id===selectedContact);
      html=(contactApp!=='sms'?K.extensions.editor.render(data,{embedded:true}):'')+`<div class="section-heading"><h2>${({sms:'短信',qq:'QQ',wechat:'微信'})[contactApp]}联系人 <span class="count-pill">${contacts.length} / 100</span></h2>${button('add-contact','添加联系人')}</div><div class="contact-tabs">${contacts.map(c=>`<button class="contact-tab ${c.id===selectedContact?'active':''}" data-action="select-contact" data-id="${E(c.id)}">${E(c.name||'未命名')}</button>`).join('')}</div>`;
      if(contactApp==='sms')html=smsWorkspace(contacts,c);
      else if(c) html+=`<div class="card"><div class="item-heading"><strong>联系人档案</strong>${remove('delete-contact',c.id)}</div><div class="avatar-editor">${c.avatar?`<img src="${E(c.avatar)}" alt="联系人头像">`:`<span class="avatar-placeholder">${K.svg('phone')}</span>`}<label class="field"><span>联系人头像</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="avatar" data-id="${E(c.id)}" aria-label="上传联系人头像"></label>${c.avatar?`<button class="icon-button" data-action="clear-avatar" data-id="${E(c.id)}" aria-label="移除头像">${K.svg('trash')}</button>`:''}</div>${field('转移至应用','contact','app',c.app||'sms',{id:c.id,select:[['sms','短信'],['wechat','微信'],['qq','QQ']]})}${field('联系人名称','contact','name',c.name,{id:c.id,max:80})}<div class="inline-actions">${button('view-chat','在手机中查看','chat','subtle')}</div></div><div class="section-heading"><h2>对话编排 <span class="count-pill">${c.messages.length} / 500</span></h2>${button('add-message','添加消息')}</div>${c.messages.map((m,i)=>`<div class="message-card"><div class="item-heading">${remove('delete-message',m.id,c.id)}</div><div class="field-grid">${field('触发类型','message','trigger',m.trigger||'initial',{id:m.id,parent:c.id,select:[['initial','初始显示（仍遵守顺序）'],['open','打开对话时'],['input','点击输入栏模拟发送'],['delay','上一条完成后延时']]})}${field('延时秒数（0–86400）','message','delay',m.delay??2,{id:m.id,parent:c.id,type:'number'})}${field('未读（己方消息不计数）','message','unread',String(m.unread??false),{id:m.id,parent:c.id,select:[['false','已读'],['true','未读']]})}${field('气泡方向','message','side',m.side,{id:m.id,parent:c.id,select:[['left','对方 · 左侧'],['right','自己 · 右侧']]})}${field('消息时间','message','time',m.time,{id:m.id,parent:c.id,max:40})}${field('消息内容','message','text',m.text,{id:m.id,parent:c.id,area:true,full:true,max:10000})}</div></div>`).join('') || '<div class="list-empty">还没有消息。添加第一句对白。</div>'}`;
      else html+='<div class="list-empty">新建联系人，开启一段对话。</div>';
    } else if(contentSection==='photos') {
      html=`<div class="card photo-editor">${heading('记忆画廊','photo',data.photos.length+' / 100')}<label class="button photo-upload">${K.svg('upload')}选择照片<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple data-upload="photos" aria-label="选择照片"></label><div class="photo-editor-grid">${data.photos.map(p=>`<div class="photo-card"><button class="photo-open" data-action="view-photo" data-id="${E(p.id)}" aria-label="在手机查看照片"><img src="${E(p.src)}" alt="${E(p.name)}"></button><div class="photo-card-controls">${field('标题','photo','name',p.name,{id:p.id,max:200})}${field('日期','photo','date',p.date||'',{id:p.id,type:'date'})}${remove('delete-photo',p.id)}</div></div>`).join('')}</div>${!data.photos.length?'<p class="help">当前相册为空，选择照片后可在手机中打开大图。</p>':''}</div>`;
    } else if(contentSection==='notes') {
      html=`<div class="section-heading"><h2>故事手记 <span class="count-pill">${data.notes.length} / 200</span></h2>${button('add-note','新建备忘录')}</div>${data.notes.map((n,i)=>`<div class="card"><div class="item-heading"><strong>备忘录 ${String(i+1).padStart(2,'0')}</strong>${remove('delete-note',n.id)}</div><div class="field-grid">${field('标题','note','title',n.title,{id:n.id,full:true,max:200})}${field('记录时间','note','time',n.time,{id:n.id,full:true,max:40})}${field('正文','note','text',n.text,{id:n.id,full:true,area:true,rows:7,max:20000})}</div><div class="inline-actions"><button class="button subtle" data-action="view-note" data-id="${E(n.id)}">${K.svg('note')}在手机中查看</button></div></div>`).join('') || '<div class="list-empty">写下一段备忘，留给故事里的人。</div>'}`;
    } else if(contentSection==='events') {
      html=K.extensions.storyEditor(data);
    } else if(contentSection==='apps') {
      html=K.extensions.editor.render(data);
    }
    if(section==='apps'&&contentSection!=='apps')html=K.extensions.editor.tabs()+html;
    const expanded=new Set([...$('#editor').querySelectorAll('details[open][data-editor-item]')].map(el=>el.dataset.editorItem));
    $('#editor').innerHTML=html;
    $('#editor').querySelectorAll('details[data-editor-item]').forEach(el=>{el.open=expanded.has(el.dataset.editorItem);});
    K.extensions.growTextareas($('#editor'));
    restoreEditor(view,reset);
  }
  $('#navigation').addEventListener('click',e=>{const b=e.target.closest('[data-section]');if(!b)return;section=b.dataset.section;render({reset:true});});
  K.extensions.bindImageDrag($('#editor'),(group,from,to)=>{const post=group.dataset.path.split('.').reduce((o,k)=>o?.[k],data);if(post&&K.extensions.movePostImage(post,from,to)){changed();render();}});
  let sortSource=null;
  $('#editor').addEventListener('click',e=>{if(e.target.closest('.summary-actions button'))e.preventDefault();});
  $('#editor').addEventListener('click',e=>{const el=e.target;if(el.matches('input[type="datetime-local"]')&&el.showPicker){try{el.showPicker();}catch(err){}}});
  $('#editor').addEventListener('pointerdown',e=>{const card=e.target.closest('[data-sort-id]');if(card){const area=e.target.closest('.card-moves');card.draggable=!e.target.closest('input,textarea,button,label,select,a')&&(!card.hasAttribute('data-sms-sort')||!!area);if(area&&card.hasAttribute('data-sms-sort'))area.draggable=card.draggable;}});
  $('#editor').addEventListener('dragstart',e=>{const card=e.target.closest('[data-sort-id]');if(!card)return;if(!card.draggable||e.target.closest('input,textarea,button,label,select,a')){e.preventDefault();return;}sortSource={path:card.dataset.sortPath,id:card.dataset.sortId};e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',sortSource.id);});
  $('#editor').addEventListener('dragover',e=>{const card=e.target.closest('[data-sort-id]');if(sortSource&&card?.dataset.sortPath===sortSource.path)e.preventDefault();});
  $('#editor').addEventListener('drop',e=>{const card=e.target.closest('[data-sort-id]');if(sortSource&&card?.dataset.sortPath===sortSource.path){e.preventDefault();const items=sortSource.path.split('.').reduce((o,k)=>o?.[k],data),from=items?.findIndex(x=>x.id===sortSource.id),to=items?.findIndex(x=>x.id===card.dataset.sortId);if(from>=0&&to>=0&&from!==to){items.splice(to,0,items.splice(from,1)[0]);changed();render();}}sortSource=null;});
  $('#editor').addEventListener('dragend',()=>{sortSource=null;});
  $('#editor').addEventListener('input',e=>{if(e.target.matches('textarea[data-autogrow]'))K.extensions.growTextareas(e.target);});
  $('#editor').addEventListener('toggle',e=>{if(e.target.open)K.extensions.growTextareas(e.target);},true);
  new ResizeObserver(()=>K.extensions.growTextareas($('#editor'))).observe($('.editor-pane'));
  function focusNew(id){const item=[...$('#editor').querySelectorAll('[data-editor-item]')].find(el=>el.dataset.editorItem===id);if(!item)return;for(let el=item;el&&el!==$('#editor');el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;K.extensions.growTextareas(item);const input=item.querySelector('textarea')||item.querySelector('input:not([type=checkbox]),select');input?.focus({preventScroll:true});(input||item).scrollIntoView({block:'nearest',behavior:'instant'});}
  $('#editor').addEventListener('input',e=>{
    const el=e.target, {scope,key,id,parent}=el.dataset;
    if(scope==='extra'){if(K.extensions.editor.input(data,el)){changed();if(/^extra\.smsEvents\.\d+\.title$/.test(el.dataset.path||'')){const title=el.closest('details[data-editor-item]')?.querySelector('[data-sms-event-title]');if(title)title.textContent=el.value;}if(/\.(direction|record|targetApp|contact)$/.test(el.dataset.path||''))render();}return;}
    if(!scope)return;
    if(scope==='phone'&&data.phone.useSystemTime&&['time','date'].includes(key))return;
    let target;
    if(scope==='background')target=data.phone[id];
    else if(scope==='phone')target=data.phone;
    else if(scope==='contact')target=data.contacts.find(c=>c.id===id);
    else if(scope==='message')target=data.contacts.find(c=>c.id===parent)?.messages.find(m=>m.id===id);
    else target=data[({photo:'photos',note:'notes',notification:'notifications'})[scope]]?.find(x=>x.id===id);
    if(scope==='photo'&&['date','location','tags'].includes(key)&&!Object.hasOwn(target||{},key))target[key]='';
    if(scope==='message'&&key==='unread'&&target&&!Object.hasOwn(target,key))target[key]=false;
    if(!target||!Object.hasOwn(target,key))return;
    if(scope==='message'&&key==='time'&&el.type==='datetime-local'&&(!el.value||!el.validity.valid||!K.extensions.smsDateTime(el.value,data.phone)))return;
    target[key]=['useSystemTime','unread'].includes(key)?(el.type==='checkbox'?el.checked:el.value==='true'):key==='autoLock'?Number(el.value):scope==='background'||(scope==='message'&&key==='delay')?Number(el.value):el.value;
    if(scope==='background') {
      el.closest('label').querySelector('output').textContent=el.value+'%';
      preview.show(id==='homeBackground'?'home':'lock');
    }
    if(scope==='contact'&&key==='name') {
      const tab=Array.from($('#editor').querySelectorAll('.contact-tab')).find(b=>b.dataset.id===id);if(tab)tab.textContent=el.value||'未命名';
    }
    changed();
    if(scope==='message'&&key==='side'){if(target.side==='right')target.unread=false;render();}
    if(scope==='contact'&&key==='app'){selectedContact=id;K.extensions.editor.navigate(el.value);render();}
    if(scope==='phone'&&key==='useSystemTime')syncPhoneFields();
  });
  function syncPhoneFields() {
    if(section!=='phone')return;
    for(const key of ['time','date']) {
      const el=$(`#editor [data-scope="phone"][data-key="${key}"]`);
      if(!el)continue;
      el.disabled=data.phone.useSystemTime;
      if(data.phone.useSystemTime)el.value=key==='date'?K.displayDate(data.phone):new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
      else el.value=data.phone[key];
    }
  }
  setInterval(()=>{if(data.phone.useSystemTime)syncPhoneFields();},1000);
  $('#editor').addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const {action,id,parent}=b.dataset;
    if(action==='sms-subtab'){smsSubtab=b.dataset.tab;render();return;}
    if(action==='sms-add-event'){if(data.extra.smsEvents.length>=200)return;const item={id:K.id(),contact:id,title:'新短信事件',enabled:true,auto:true,delay:0,timeout:180,messages:[],replies:[],replyTargets:[],timeoutTargets:[]};data.extra.smsEvents.push(item);changed();render();focusNew(item.id);return;}
    if(action==='extra-editor-tab'){K.extensions.editor.navigate(b.dataset.section);render();return;}
    const addList=action==='extra-add'?b.dataset.path?.split('.').reduce((o,k)=>o?.[k],data):null,oldLength=addList?.length;
    if(K.extensions.editor.action(data,b)){changed();render();if(addList?.length>oldLength)focusNew(addList.at(-1).id);return;}
    const c=data.contacts.find(c=>c.id===selectedContact);
    const cap=(items,n)=>{if(items.length>=n){toast('数量已达上限 '+n);return true;}return false;};
    if(action==='select-contact'){selectedContact=id;render();return;}
    if(action==='view-chat'){preview.show('chat',selectedContact);return;}
    if(action==='view-photo'){preview.show('photo',id);return;}
    if(action==='view-note'){preview.show('note',id);return;}
    if(action==='add-contact'){if(cap(data.contacts,100))return;const item={id:K.id(),name:'新联系人',avatar:'',app:K.extensions.editor.current(),messages:[]};data.contacts.push(item);selectedContact=item.id;}
    else if(action==='delete-contact'){if(!confirm('删除这个联系人及其全部消息？'))return;data.contacts=data.contacts.filter(x=>x.id!==id);}
    else if(action==='clear-avatar'){const target=data.contacts.find(x=>x.id===id);if(target)target.avatar='';}
    else if(action==='add-message'){if(!c||cap(c.messages,500))return;c.messages.push({id:K.id(),side:'left',text:'',time:c.app==='sms'?K.extensions.smsNow(data.phone):data.phone.time,trigger:'initial',delay:2});}
    else if(action==='move-message'){const items=data.contacts.find(x=>x.id===parent)?.messages;if(!items)return;const from=items.findIndex(x=>x.id===id),to=from+(b.dataset.direction==='up'?-1:1);if(from<0||to<0||to>=items.length)return;[items[from],items[to]]=[items[to],items[from]];}
    else if(action==='delete-message'){const target=data.contacts.find(x=>x.id===parent);if(target)target.messages=target.messages.filter(x=>x.id!==id);}
    else if(action==='clear-background'||action==='reset-background') {
      if(!['lockBackground','homeBackground'].includes(id))return;
      data.phone[id]={image:action==='clear-background'?'':data.phone[id].image,scale:100,x:50,y:50};
      preview.show(id==='homeBackground'?'home':'lock');
    }
    else if(action==='delete-photo')data.photos=data.photos.filter(x=>x.id!==id);
    else if(action==='add-note'){if(cap(data.notes,200))return;data.notes.push({id:K.id(),title:'新的备忘录',text:'',time:data.phone.date});}
    else if(action==='delete-note'){if(!confirm('删除这条备忘录？'))return;data.notes=data.notes.filter(x=>x.id!==id);}
    else return;
    changed();render();if(action==='add-message')focusNew(c.messages.at(-1).id);
  });
  async function readImage(file) {
    if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw new Error('仅支持 PNG、JPEG、WebP、GIF 图片');
    if(file.size>5*1024*1024)throw new Error('单张图片不能超过5MB，请压缩后重试');
    if(!file.size)throw new Error('图片文件为空');
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('图片读取失败'));r.readAsDataURL(file);});
    await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{if(image.width*image.height>40e6)reject(new Error('图片尺寸过大，请缩小至4000万像素以内'));else resolve();};image.onerror=()=>reject(new Error('图片内容无效'));image.src=src;});
    return src;
  }
  $('#editor').addEventListener('change',async e=>{
    const el=e.target; if(!el.dataset.upload || !el.files.length)return;
    const kind=el.dataset.upload,targetId=el.dataset.id,files=Array.from(el.files);
    const postId=kind==='post-images'?el.closest('[data-editor-item]')?.dataset.editorItem:null;
    if(pendingUploads){toast('正在处理图片，请稍候');el.value='';return;}
    pendingUploads++;el.disabled=true;toast('正在读取并内嵌图片…');
    try {
      if(kind==='post-images'){const remaining=9-K.extensions.editor.postImageCount(data,el.dataset.path);if(files.length>remaining)throw new Error('帖子最多9张图片，当前剩余 '+remaining+' 张名额，本次选择 '+files.length+' 张；未添加任何图片');}
      if(kind==='photos'&&data.photos.length+files.length>100)throw new Error('相册最多100张照片');
      let total=JSON.stringify(data).length;
      if(files.reduce((sum,f)=>sum+Math.ceil(f.size*4/3),total)>K.MAX_JSON)throw new Error('图片合计超过项目32MB限制，请先压缩图片');
      const sources=[];
      for(const f of (['photos','post-images'].includes(kind)?files:files.slice(0,1))) {
        if(kind==='audio'){
          if(!['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/webm'].includes(f.type)||!f.size||f.size>12*1024*1024)throw new Error('音频需为 MP3/WAV/OGG/MP4/WebM，最大12MB');
          sources.push(await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('音频读取失败'));r.readAsDataURL(f);}));
        }else sources.push(await readImage(f));
      }
      // Apply to latest state, not state captured before asynchronous reads.
      const next=JSON.parse(JSON.stringify(data));
      if(kind==='lockBackground'||kind==='homeBackground')next.phone[kind]={image:sources[0],scale:100,x:50,y:50};
      else if(kind==='post-images')K.extensions.editor.appendPostImages(next,el.dataset.path,sources,postId);
      else if(kind==='extra'||kind==='audio')K.extensions.editor.image(next,el.dataset.path,sources[0]);
      else if(kind==='avatar'){const c=next.contacts.find(c=>c.id===targetId);if(!c)throw new Error('联系人已删除，头像未应用');c.avatar=sources[0];}
      else next.photos.push(...sources.map((src,i)=>({id:K.id(),name:files[i].name.slice(0,200)||'照片 '+(next.photos.length+i+1),date:next.phone.date,src})));
      data=K.validate(next);if(kind==='lockBackground'||kind==='homeBackground')preview.show(kind==='homeBackground'?'home':'lock');changed();render();save();toast('图片已内嵌；若本地存储不足，请立即导出备份');
    } catch(err){toast(err.message);}finally{pendingUploads--;el.disabled=false;el.value='';}
  });
  function filename(ext){return (data.phone.name||'手机剧情').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,60)+ext;}
  function download(content,type,name) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function ready() {if(pendingUploads)throw new Error('图片正在处理，请完成后导出');return K.validate(data);}
  $('#export-json').addEventListener('click',()=>{try{download(JSON.stringify(ready(),null,2),'application/json',filename('.json'));toast('JSON 备份已生成，可重新导入编辑');}catch(e){toast(e.message);}});
  $('#export-html').addEventListener('click',()=>{try{download(K.standalone(ready()),'text/html;charset=utf-8',filename('.html'));toast('独立 HTML 已生成，双击即可离线体验');}catch(e){toast(e.message);}});
  $('#import-json').addEventListener('click',()=>$('#json-file').click());
  $('#json-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try {
      if(pendingUploads)throw new Error('图片正在处理，请稍后导入');
      if(file.size>K.MAX_JSON)throw new Error('JSON文件过大，最大32MB');
      const parsed=JSON.parse(await file.text()),migrated=K.extensions.legacyChats(parsed);
      const clean=K.validate(parsed);
      if(!confirm('用导入项目替换当前草稿？建议先备份当前项目。'))return;
      data=clean;selectedContact=data.contacts[0]?.id;preview.show('lock');changed();render();save();toast(migrated?'项目已导入；小红书 / 微博旧会话已转移至短信，消息与事件引用保留。':'项目已导入');
    }catch(err){toast('导入失败：'+err.message);}finally{e.target.value='';}
  });
  $('#phone-preview').addEventListener('phone-settings-change',()=>{save();if(section==='phone')render();});
  $('#preview-reset').addEventListener('click',()=>{preview.reset();toast('剧情已重置，延时从现在重新计时');});
  $('#preview-lock').addEventListener('click',()=>preview.show('lock'));
  $('#preview-home').addEventListener('click',()=>preview.show('home'));
  window.addEventListener('pagehide',save);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  iconize();render();$('#project-name').textContent=data.phone.name;
  if(startupWarning){toast(startupWarning);if(startupWarning.startsWith('无法')){$('#save-state').textContent='草稿读取失败 · 请检查备份';$('#save-state').classList.add('error');}else save();}
})();
