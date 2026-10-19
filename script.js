/* Public content and existing local-only project brief. No internal strategy is loaded. */
'use strict';
const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>[...root.querySelectorAll(s)];
let lang='en';
const arabic=window.PWContent.arabic,services=window.PWContent.services;
const english=Object.fromEntries($$('[data-i]').map(el=>[el.dataset.i,el.innerHTML]));
const t=(en,ar)=>lang==='ar'?ar:en;
function renderContent(){
 const selected=$('#service-select').value;
 $('#service-select').innerHTML=services.map((s,i)=>`<option value="${i}">${t(s.en,s.ar)}</option>`).join('')+`<option value="other">${t('Something else','حل آخر')}</option>`;
 if(selected)$('#service-select').value=selected;
 $$('[data-service-jump]').forEach((b,i)=>b.setAttribute('aria-label',t(services[i].en,services[i].ar)));
 $('#service-prev').setAttribute('aria-label',t('Previous service','الخدمة السابقة'));$('#service-next').setAttribute('aria-label',t('Next service','الخدمة التالية'));
 document.dispatchEvent(new Event('pw:content'));
}
function setLanguage(value){
 lang=value;document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
 $$('[data-i]').forEach(el=>el.innerHTML=lang==='ar'?arabic[el.dataset.i]:english[el.dataset.i]);
 $('#language').textContent=lang==='ar'?'EN':'عربي';$('#language').setAttribute('aria-label',t('Switch to Arabic','التبديل إلى الإنجليزية'));
 $('#navigation').setAttribute('aria-label',t('Main navigation','التنقل الرئيسي'));$$('.dialog-close').forEach(el=>el.setAttribute('aria-label',t('Close dialog','إغلاق النافذة')));
 renderContent();updateMenuLabel();try{localStorage.setItem('pw-language',lang)}catch{}
 document.dispatchEvent(new Event('pw:language'));
}
$('#language').addEventListener('click',()=>setLanguage(lang==='en'?'ar':'en'));
const menu=$('#navigation'), menuButton=$('#menu-toggle');
function updateMenuLabel(){menuButton.setAttribute('aria-label',menu.classList.contains('open')?t('Close menu','إغلاق القائمة'):t('Open menu','فتح القائمة'))}
function closeMenu(){menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');updateMenuLabel()}
menuButton.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));updateMenuLabel()});
$$('a',menu).forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){closeMenu();menuButton.focus()}});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu()});
window.addEventListener('resize',()=>{if(innerWidth>1000)closeMenu()},{passive:true});
const detail=$('#detail-dialog'), inquiry=$('#inquiry-dialog');
let lastFocus=null;
function openDialog(dialog){lastFocus=document.activeElement;closeMenu();dialog.showModal()}
$$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>{if(lastFocus?.isConnected)lastFocus.focus()})});
function openInquiry(service){if(detail.open)detail.close();if(service!==undefined)$('#service-select').value=String(service);openDialog(inquiry)}
$$('[data-inquiry]').forEach(b=>b.addEventListener('click',()=>openInquiry()));
let detailService='other';
$('#detail-inquiry').addEventListener('click',()=>openInquiry(detailService));
function showDetail(title,copy,list,label,service){$('#detail-title').textContent=title;$('#detail-copy').textContent=copy;$('#detail-label').textContent=label;$('#detail-list').innerHTML='';list.forEach(item=>{const li=document.createElement('li');li.textContent=item;$('#detail-list').append(li)});detailService=service;$('#detail-inquiry').hidden=false;openDialog(detail)}
$('#service-grid').addEventListener('click',e=>{const b=e.target.closest('[data-service]');if(!b)return;const i=Number(b.dataset.service),s=services[i];showDetail(t(s.en,s.ar),t(...s.copy),s.items.map(v=>t(...v)),t('OUR SERVICES','خدماتنا'),i)});
$$('[data-legal]').forEach(b=>b.addEventListener('click',()=>{showDetail(t('Privacy information','معلومات الخصوصية'),t('The project brief is prepared in your browser and is not submitted to a server. Your language preference and a session intro flag are stored on your device. Instagram applies its own privacy policy when you open it.','يُجهَّز ملخص المشروع في متصفحك ولا يُرسل إلى خادم. يُحفظ تفضيل اللغة ومؤشر المقدمة الخاص بالجلسة على جهازك. يطبّق إنستغرام سياسة الخصوصية الخاصة به عند فتحه.'),[],t('YOUR INFORMATION','معلوماتك'),'other');$('#detail-inquiry').hidden=true}));
$('#inquiry-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);const s=data.get('service'),service=s==='other'?t('Custom solution','حل مخصص'):t(services[Number(s)].en,services[Number(s)].ar);$('#brief-text').value=t(`Hi Programming Worlds!\n\nMy name is ${data.get('name').trim()}.\nI’m interested in: ${service}.\n\nMy project:\n${data.get('idea').trim()}`,`مرحباً بروغرامينغ وورلدز!\n\nاسمي ${data.get('name').trim()}.\nأحتاج إلى: ${service}.\n\nفكرة مشروعي:\n${data.get('idea').trim()}`);$('#inquiry-form').hidden=true;$('#brief-result').hidden=false;$('#copy-status').textContent='';$('#brief-text').focus()});
$('#copy-brief').addEventListener('click',async()=>{const field=$('#brief-text');try{await navigator.clipboard.writeText(field.value);$('#copy-status').textContent=t('Copied. Open Instagram and paste your brief into a message.','تم النسخ. افتح إنستغرام والصق الملخص في رسالة.')}catch{field.focus();field.select();$('#copy-status').textContent=t('Select and copy the highlighted brief, then paste it into Instagram.','انسخ الملخص المحدد، ثم الصقه في إنستغرام.')}});
$('#edit-brief').addEventListener('click',()=>{$('#brief-result').hidden=true;$('#inquiry-form').hidden=false;$('input[name=name]').focus()});
$('#year').textContent=new Date().getFullYear();
// The experience controller owns all animation; content remains usable independently.
let saved='en';try{saved=localStorage.getItem('pw-language')==='ar'?'ar':'en'}catch{}
setLanguage(saved);
