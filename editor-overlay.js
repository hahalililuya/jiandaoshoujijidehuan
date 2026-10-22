/* Editor-only overlay. Never serialized into standalone projects. */
(function () {
  'use strict';
  window.createPhoneEditorOverlay = function ({root, preview, getData, commit, readImage, toast}) {
    const E=PhoneStory.escape;
    let editing=true, origin=null, target=null, draft=null, busy=false, token=0;
    const dialog=document.createElement('dialog');
    dialog.className='phone-edit-dialog';document.body.append(dialog);
    const labels={name:'名称',avatar:'头像',app:'转移至应用',text:'正文',side:'消息方向',time:'时间',trigger:'触发方式',delay:'延迟秒数',unread:'未读',title:'标题',date:'日期',location:'地点',tags:'标签',bio:'简介',handle:'用户号',following:'关注',followers:'粉丝',likes:'获赞',comments:'评论数',reposts:'转发数',author:'作者',image:'配图',cover:'主页封面',gender:'性别',ip:'IP属地',vip:'VIP徽章',summary:'统计摘要',saves:'收藏数',source:'来源设备',topics:'话题',quoteAuthor:'引用作者',quoteText:'引用正文'};
    const apps=[['sms','短信'],['wechat','微信'],['qq','QQ']];
    const choices={app:apps,side:[['left','对方 · 左侧'],['right','自己 · 右侧']],trigger:[['initial','初始显示'],['open','打开对话'],['input','点击输入栏发送'],['delay','上一条完成后延时']],unread:[['false','已读'],['true','未读']]};
    function resolve(data,t){
      if(t.kind==='contact')return data.contacts.find(x=>x.id===t.id);
      if(t.kind==='message')return data.contacts.find(x=>x.id===t.parent)?.messages.find(x=>x.id===t.id);
      if(t.kind==='new-message')return null;
      if(t.kind==='photo'||t.kind==='note')return data[t.kind==='photo'?'photos':'notes'].find(x=>x.id===t.id);
      if(t.kind==='profile')return data.extra[t.app].profile;
      if(t.kind==='account')return data.extra.accounts[t.app];
      if(t.kind==='post')return data.extra[t.app].posts.find(x=>x.id===t.id);
    }
    function postGallery(){const sources=PhoneStory.extensions.postImages(draft);return `<div class="overlay-post-gallery field full" data-image-gallery><span>帖子配图 · ${sources.length} / 9（可多选，每张最大5MB）</span><input name="post-images" type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif"><div>${sources.map((src,i)=>`<span data-image-index="${i}" style="display:inline-block"><img draggable="true" data-image-handle class="overlay-image" src="${E(src)}" alt="配图 ${i+1}"><button type="button" class="button" data-move-post-image="${i}" data-step="-1" ${i===0?'disabled':''}>前移</button><button type="button" class="button" data-move-post-image="${i}" data-step="1" ${i===sources.length-1?'disabled':''}>后移</button><button type="button" class="button" data-remove-post-image="${i}">移除 ${i+1}</button></span>`).join('')}</div></div>`;}
    function moveImage(from,to){if(busy||!PhoneStory.extensions.movePostImage(draft,from,to))return;const top=dialog.scrollTop;dialog.querySelector('.overlay-post-gallery').outerHTML=postGallery();dialog.scrollTop=top;}
    PhoneStory.extensions.bindImageDrag(dialog,(_group,from,to)=>moveImage(from,to));
    function close(){token++;dialog.close();const next=origin?.isConnected?origin:root.querySelector('[data-message-id="'+(target?.id||'')+'"]')||root;if(!next.matches('button,input,textarea,select,a,[tabindex]'))next.tabIndex=-1;next.focus({preventScroll:true});}
    function open(t,el){
      const item=resolve(getData(),t);if(!item&&t.kind!=='new-message')return;
      target=t;origin=el;busy=false;draft=JSON.parse(JSON.stringify(item||{id:PhoneStory.id(),text:'',side:'left',time:getData().phone.time,trigger:'initial',delay:2,unread:false}));token++;
      let fields=({contact:['name','avatar','app'],message:['text','side','time','trigger','delay','unread'],'new-message':['text','side','time','trigger','delay','unread'],photo:['name','date','location','tags'],note:['title','time','text'],profile:['name','avatar','cover','handle','bio','location','ip','gender','vip','summary','following','followers','likes'],account:['name','avatar'],post:['title','text','author','avatar','time','source','topics','likes','saves','comments','reposts','quoteAuthor','quoteText','image']})[t.kind];
      if(t.app==='weibo'&&t.kind==='post'){fields=fields.filter(k=>!['title','author','avatar','topics','saves'].includes(k));if(!String(draft.text||'').trim())draft.text=draft.title||'';fields=['reposts','comments','likes','time','source','text','quoteAuthor','quoteText','image'];}
      if(t.app==='weibo'&&t.kind==='profile'){fields=['avatar','name','gender','vip','followers','following','likes','cover','summary','bio'];draft.gender=PhoneStory.extensions.gender(draft.gender);}
      dialog.classList.toggle('weibo-editor',t.app==='weibo');
      dialog.innerHTML=`<form><h2 id="phone-edit-title">${({contact:'联系人',message:'消息','new-message':'新增消息',photo:'照片信息',note:'备忘录',profile:'社交主页',account:'社交账号',post:'社交帖子'})[t.kind]}</h2><p>保存后同步预览和草稿；保存修改会重播剧情。取消不提交。</p><div class="field-grid">${fields.map(k=>{
        if(k==='image'&&t.kind==='post')return postGallery();
        const v=draft[k]??(k==='unread'?false:'');const max=['text','quoteText'].includes(k)?(t.kind==='note'?20000:t.kind==='post'?20000:1000):['bio','topics'].includes(k)?2000:k==='name'?80:k==='time'?80:k==='tags'?500:200;
        let input;
        if(t.app==='weibo'&&['avatar','cover'].includes(k))return `<div class="compact-media" data-field="${k}"><span>${labels[k]}</span><label class="compact-upload ${k==='avatar'?'round':''}">${v?`<img src="${E(v)}" alt="当前图片">`:'<b>＋</b>'}<input name="${k}" type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="替换${labels[k]}"></label><button type="button" data-clear="${k}" class="button">移除</button></div>`;
        if(k==='gender'&&t.app==='weibo')input=`<select name="gender">${[['','无'],['男','男'],['女','女']].map(([key,label])=>`<option value="${key}" ${v===key?'selected':''}>${label}</option>`).join('')}</select>`;
        else if(['avatar','image','cover'].includes(k))input=`${v?`<img class="overlay-image" src="${E(v)}" alt="当前图片">`:''}<input name="${k}" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><button type="button" data-clear="${k}" class="button">移除图片</button>`;
        else if(choices[k])input=`<select name="${k}">${choices[k].map(([key,label])=>`<option value="${key}" ${String(v)===key?'selected':''}>${label}</option>`).join('')}</select>`;
        else if(['text','bio','quoteText','topics'].includes(k))input=`<textarea name="${k}" rows="${t.app==='weibo'?2:5}" maxlength="${max}">${E(v)}</textarea>`;
        else input=`<input name="${k}" type="${k==='delay'?'number':k==='date'?'date':'text'}" ${k==='delay'?'min="0" max="86400" step="1"':''} maxlength="${max}" value="${E(v)}">`;
        return `<label data-field="${k}" class="field ${t.app==='weibo'&&k==='source'?'weibo-source-field ':''}${['text','bio','quoteText','avatar','image'].includes(k)?'full':''}"><span>${t.app==='weibo'&&k==='likes'&&t.kind==='profile'?'转评赞':labels[k]}</span>${input}</label>`;
      }).join('')}</div><p class="overlay-error" role="alert"></p><div class="overlay-actions">${t.kind==='message'?'<button type="button" data-delete class="button">删除消息</button>':''}<button type="button" data-cancel class="button">取消</button><button type="submit" class="button primary">保存</button></div></form>`;
      if(t.app==='weibo'){const grid=dialog.querySelector('.field-grid');const group=(keys,cls)=>{const nodes=keys.map(k=>grid.querySelector(`[data-field="${k}"]`)).filter(Boolean);if(!nodes.length)return;const row=document.createElement('div');row.className=cls;nodes[0].before(row);nodes.forEach(n=>row.append(n));};if(t.kind==='post'){group(['reposts','comments','likes'],'weibo-three');group(['time','source'],'weibo-two');}if(t.kind==='profile'){group(['followers','following','likes'],'weibo-three');group(['name','gender','vip'],'weibo-short-fields');const middle=grid.querySelector('.weibo-short-fields');middle.append(grid.querySelector('.weibo-three'));const identity=document.createElement('div');identity.className='weibo-identity-editor';const avatar=grid.querySelector('[data-field="avatar"]'),cover=grid.querySelector('[data-field="cover"]');avatar.before(identity);identity.append(avatar,middle,cover);}}
      dialog.setAttribute('aria-labelledby','phone-edit-title');dialog.showModal();dialog.querySelector('textarea,input,select,button')?.focus();
    }
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const a=[...dialog.querySelectorAll('input,textarea,select,button')].filter(x=>!x.disabled),first=a[0],last=a.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
    dialog.addEventListener('click',e=>{
      if(e.target.closest('[data-cancel]'))close();
      const move=e.target.closest('[data-move-post-image]');if(move)moveImage(Number(move.dataset.movePostImage),Number(move.dataset.movePostImage)+Number(move.dataset.step));
      const removeImage=e.target.closest('[data-remove-post-image]');if(removeImage&&!busy){const sources=[draft.image,...(draft.images||[])].filter(Boolean);sources.splice(Number(removeImage.dataset.removePostImage),1);draft.image=sources[0]||'';draft.images=sources.slice(1);const top=dialog.scrollTop;removeImage.closest('.overlay-post-gallery').outerHTML=postGallery();dialog.scrollTop=top;}
      const clear=e.target.closest('[data-clear]');if(clear){draft[clear.dataset.clear]='';clear.closest('.compact-media,.field').querySelector('img')?.remove();clear.closest('.compact-media,.field').querySelector('input').value='';}
      if(e.target.closest('[data-delete]')&&confirm('删除这条消息？')){try{const next=JSON.parse(JSON.stringify(getData()));const c=next.contacts.find(x=>x.id===target.parent);if(!c)throw new Error('联系人已删除');c.messages=c.messages.filter(x=>x.id!==target.id);commit(next);close();}catch(err){toast(err.message);}}
    });
    dialog.addEventListener('change',async e=>{if(e.target.type!=='file'||!e.target.files[0])return;if(busy){e.target.value='';return;}const version=token,input=e.target;busy=true;dialog.querySelector('[type="submit"]').disabled=true;
      try{if(input.name==='post-images'){const files=[...input.files],sources=[draft.image,...(draft.images||[])].filter(Boolean),remaining=9-sources.length;if(files.length>remaining)throw new Error('帖子最多9张图片，当前剩余 '+remaining+' 张名额；未添加任何图片');if(files.reduce((n,f)=>n+Math.ceil(f.size*4/3),JSON.stringify(getData()).length)>PhoneStory.MAX_JSON)throw new Error('图片合计超过项目32MB限制');const batch=[];for(const file of files)batch.push(await readImage(file));if(version!==token)return;sources.push(...batch);draft.image=sources[0]||'';draft.images=sources.slice(1);const top=dialog.scrollTop;input.closest('.overlay-post-gallery').outerHTML=postGallery();dialog.scrollTop=top;return;}const src=await readImage(input.files[0]);if(version!==token)return;draft[input.name]=src;let img=input.parentElement.querySelector('img');if(!img){img=document.createElement('img');img.className='overlay-image';img.alt='待保存图片';input.before(img);}img.src=src;}
      catch(err){if(version===token)dialog.querySelector('[role="alert"]').textContent=err.message;}
      finally{if(version===token){busy=false;input.value='';dialog.querySelector('[type="submit"]').disabled=false;}}
    });
    dialog.addEventListener('submit',e=>{e.preventDefault();if(busy)return;
      try{const next=JSON.parse(JSON.stringify(getData()));for(const input of dialog.querySelectorAll('[name]')){if(input.type==='file')continue;draft[input.name]=input.name==='delay'?Number(input.value):input.name==='unread'?input.value==='true':input.value;}
        if(target.kind==='new-message'){const c=next.contacts.find(x=>x.id===target.parent);if(!c)throw new Error('联系人已删除');if(c.messages.length>=500)throw new Error('消息最多500条');c.messages.push(draft);}else{const item=resolve(next,target);if(!item)throw new Error('内容已删除');Object.assign(item,draft);}commit(next);close();
      }catch(err){dialog.querySelector('[role="alert"]').textContent=err.message;}
    });
    root.addEventListener('click',e=>{
      if(!editing)return;const el=e.target,nav=preview.getScreen(),data=getData();let t;
      const row=el.closest('.ps-contact');
      if(row&&el.closest('.ps-avatar,.ps-contact-copy strong,.ps-contact>strong'))t={kind:'contact',id:row.dataset.id};
      if(nav.screen==='chat'){
        const m=el.closest('[data-message-id]');if(m)t=el.closest('.ps-avatar')?{kind: m.classList.contains('right')?'account':'contact',id:nav.id,app:data.contacts.find(x=>x.id===nav.id)?.app||'chat'}:{kind:'message',id:m.dataset.messageId,parent:nav.id};
        else if(el.closest('.ps-toolbar strong'))t={kind:'contact',id:nav.id};
      }
      if(nav.screen==='photo'&&el.closest('.ps-photo-full,.ps-photo-caption'))t={kind:'photo',id:nav.id};
      if(nav.screen==='note'&&el.closest('.ps-note-detail'))t={kind:'note',id:nav.id};
      const app=nav.screen.split('-')[0];if(['redbook','weibo'].includes(app)){
        if(el.closest('.ps-profile-cover'))t={kind:'profile',app};
        const post=el.closest('[data-post-id]');if(post)t={kind:'post',app,id:post.dataset.postId};
      }
      if(el.closest('.ps-account')&&data.extra.accounts[app])t={kind:'account',app};
      if(!t||!resolve(data,t))return;e.preventDefault();e.stopImmediatePropagation();open(t,el);
    },true);
    document.querySelector('#preview-mode').addEventListener('click',()=>{if(dialog.open)close();editing=!editing;preview.setEditing(editing);document.querySelector('#preview-mode').textContent=editing?'编辑模式 · 切换体验':'体验模式 · 切换编辑';document.querySelector('#preview-mode').setAttribute('aria-pressed',String(editing));document.querySelector('#preview-edit-help').textContent=editing?'点击姓名/头像、消息、照片详情、备忘录正文、社交主页或帖子编辑。计时和自动锁屏暂停。':'剧情计时与自动锁屏已恢复。切换模式不重置剧情。';});
    document.querySelector('#preview-add-message').addEventListener('click',e=>{if(!editing){toast('请先切换编辑模式');return;}const nav=preview.getScreen();if(nav.screen!=='chat'){toast('请先打开一段会话');return;}open({kind:'new-message',parent:nav.id},e.target);});
  };
})();
