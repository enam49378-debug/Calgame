// Ventanitas propias (alert / confirm / prompt): algunos navegadores no las tienen
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_UI = window.CF_UI || {};

window.CF_UI.crearVentanitas = function crearVentanitas(D) {
  'use strict';
  const { $ } = D;

function uiDialog(o) {
  return new Promise(res => {
    if (!$('uidlg')) {
      const st = document.createElement('style');
      st.textContent = `#uidlg{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:#05060ccc;padding:16px}#uidlg.hidden{display:none}
#uidlg .box{width:min(440px,100%);background:#10131f;border:3px solid #000;border-top:6px solid #ffd400;box-shadow:8px 8px 0 #000;padding:20px 22px;color:#fff;font:15px/1.5 system-ui,sans-serif}
#uidlg h3{margin:0 0 10px;font:italic 900 24px var(--display,sans-serif);color:#ffd400}#uidlg p{margin:0 0 14px;white-space:pre-line}
#uidlg input{width:100%;box-sizing:border-box;background:#05060c;border:2px solid #ffffff33;color:#fff;font:700 16px monospace;padding:9px 12px;margin-bottom:14px}
#uidlg .row{display:flex;gap:10px;justify-content:flex-end}#uidlg button{border:0;padding:9px 20px;font:700 15px system-ui,sans-serif;cursor:pointer;background:#222842;color:#fff}
#uidlg button.ok{background:#ffd400;color:#000}#uidlg button.danger{background:#ff4d4d;color:#fff}`;
      document.head.appendChild(st);
      const d = document.createElement('div'); d.id = 'uidlg'; d.className = 'hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
      d.innerHTML = '<div class="box"><h3></h3><p></p><input type="password" autocomplete="off" spellcheck="false"><div class="row"><button type="button" class="no"></button><button type="button" class="ok"></button></div></div>'; document.body.appendChild(d);
    }
    const d = $('uidlg'), h = d.querySelector('h3'), pp = d.querySelector('p'), inp = d.querySelector('input'), ok = d.querySelector('.ok'), no = d.querySelector('.no');
    h.textContent = o.title || ''; h.style.display = o.title ? '' : 'none'; pp.textContent = o.msg || ''; inp.style.display = o.input ? '' : 'none'; inp.type = o.input === 'text' ? 'text' : 'password'; inp.value = '';
    ok.textContent = o.ok || 'Aceptar'; ok.className = 'ok' + (o.danger ? ' danger' : ''); no.textContent = o.cancel || 'Cancelar'; no.style.display = o.cancel === false ? 'none' : '';
    d.classList.remove('hidden');
    const done = v => { d.classList.add('hidden'); ok.onclick = no.onclick = null; removeEventListener('keydown', key, true); res(v); };
    const key = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); done(o.input ? null : false); } else if (e.code === 'Enter' && (e.target === inp || e.target === ok)) { e.preventDefault(); e.stopImmediatePropagation(); done(o.input ? inp.value : true); } };
    addEventListener('keydown', key, true);
    ok.onclick = () => done(o.input ? inp.value : true); no.onclick = () => done(o.input ? null : false);
    setTimeout(() => (o.input ? inp : ok).focus(), 30);
  });
}
const uiPrompt = (msg, secret = true, title = '') => uiDialog({ title, msg, input: secret ? 'password' : 'text', ok: 'Entrar' });
const uiConfirm = (msg, danger = false, title = '') => uiDialog({ title, msg, danger, ok: danger ? 'Sí, seguir' : 'Aceptar' });
const uiAlert = (msg, title = '') => uiDialog({ title, msg, cancel: false });

  return { uiAlert, uiConfirm, uiDialog, uiPrompt };
};
