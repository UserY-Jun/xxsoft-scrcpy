export function injectAppStyles() {
  const styleId = 'app-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
:root{
  --bg: #0b1220;
  --surface: #0f1b2d;
  --card: #111f33;
  --card-elev: #142641;
  --border: #263b5a;

  --text: #f8fafc;
  --muted: #cbd5e1;
  --subtle: #94a3b8;

  --primary: #6d28d9;
  --primary-hover: #5b21b6;
  --accent: #0891b2;
  --accent-hover: #0e7490;

  --success: #22c55e;
  --warning: #fbbf24;
  --danger: #ef4444;
  --info: #38bdf8;

  --shadow: 0 10px 30px rgba(0,0,0,.35);
  --shadow-soft: 0 6px 18px rgba(0,0,0,.25);

  --r-6: 6px;
  --r-10: 10px;
  --r-14: 14px;

  --sp-2: 2px;
  --sp-4: 4px;
  --sp-6: 6px;
  --sp-8: 8px;
  --sp-10: 10px;
  --sp-12: 12px;
  --sp-16: 16px;
  --sp-20: 20px;

  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --fs-12: 12px;
  --fs-13: 13px;
  --fs-14: 14px;
  --fs-16: 16px;
  --fs-18: 18px;
  --fs-22: 22px;

  --ring: 0 0 0 3px rgba(56, 189, 248, .35);
}

*{ box-sizing:border-box; }
html, body { height:100%; }
body{
  margin:0;
  font-family: var(--font);
  background: radial-gradient(900px 500px at 20% 10%, rgba(109, 40, 217, .18), transparent 70%),
              radial-gradient(900px 500px at 80% 30%, rgba(8, 145, 178, .14), transparent 70%),
              var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
}

.bg-waves{ position:fixed; inset:0; overflow:hidden; pointer-events:none; opacity:.22; z-index:-1; }
.wave{
  position:absolute; inset:-40%;
  background: radial-gradient(circle at 30% 30%, rgba(109,40,217,.6), transparent 60%),
              radial-gradient(circle at 70% 40%, rgba(8,145,178,.5), transparent 55%);
  filter: blur(40px);
  animation: wave 18s linear infinite;
  transform-origin: center;
}
.wave:nth-child(2){ animation-duration: 24s; opacity: .7; }
.wave:nth-child(3){ animation-duration: 30s; opacity: .55; }
@keyframes wave{
  0%{ transform: rotate(0deg) translate3d(0,0,0); }
  50%{ transform: rotate(180deg) translate3d(0,-2%,0); }
  100%{ transform: rotate(360deg) translate3d(0,0,0); }
}

.window-drag-top{ position:fixed; top:0; left:0; right:0; height: 10px; -webkit-app-region: drag; }

.app-container{ height:100vh; display:flex; flex-direction:column; padding: var(--sp-12); gap: var(--sp-10); }

.title-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  background: rgba(17, 31, 51, .65);
  border: 1px solid rgba(38, 59, 90, .65);
  border-radius: var(--r-14);
  padding: var(--sp-10) var(--sp-12);
  box-shadow: var(--shadow-soft);
  -webkit-app-region: drag;
}
.title-bar-left{ display:flex; align-items:center; gap: var(--sp-10); }
.title-bar-icon{
  width: 34px; height:34px; border-radius: 10px;
  display:flex; align-items:center; justify-content:center;
  background: linear-gradient(135deg, rgba(109,40,217,.35), rgba(8,145,178,.25));
  border: 1px solid rgba(38,59,90,.8);
}
.title-bar-title h1{
  margin:0;
  font-size: var(--fs-18);
  font-weight: 650;
  letter-spacing: .2px;
}
.title-bar-right{ display:flex; align-items:center; gap: var(--sp-10); }
.titlebar-interactive{ -webkit-app-region: no-drag; }
.control-buttons{ -webkit-app-region: no-drag; }

.window-controls{ display:flex; align-items:center; gap: 6px; }
.window-control-btn{
  width: 36px; height: 30px;
  display:flex; align-items:center; justify-content:center;
  border-radius: 10px;
  border: 1px solid rgba(38,59,90,.9);
  background: rgba(15, 27, 45, .7);
  color: var(--text);
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease;
}
.window-control-btn:hover{ transform: translateY(-1px); background: rgba(17, 31, 51, .9); border-color: rgba(56, 189, 248, .35); }
.window-control-btn:focus-visible{ outline:none; box-shadow: var(--ring); }
.window-close:hover{ background: rgba(239, 68, 68, .22); border-color: rgba(239, 68, 68, .45); }

.app-shell{
  flex:1;
  display:grid;
  grid-template-columns: 92px 1fr;
  min-height: 0;
  gap: var(--sp-10);
}

.app-nav{
  display:flex;
  flex-direction:column;
  gap: 8px;
  padding: var(--sp-10);
  border-radius: var(--r-14);
  border: 1px solid rgba(38, 59, 90, .65);
  background: rgba(17, 31, 51, .55);
  box-shadow: var(--shadow-soft);
  min-height: 0;
}
.nav-item{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  cursor:pointer;
  transition: background .12s ease, color .12s ease, border-color .12s ease, transform .12s ease;
}
.nav-item i{ font-size: 18px; }
.nav-item span{ font-size: var(--fs-12); }
.nav-item:hover{ background: rgba(15, 27, 45, .75); color: var(--text); transform: translateY(-1px); }
.nav-item[aria-current="page"]{
  background: linear-gradient(135deg, rgba(109,40,217,.28), rgba(8,145,178,.18));
  border-color: rgba(56, 189, 248, .25);
  color: var(--text);
}
.nav-item:focus-visible{ outline:none; box-shadow: var(--ring); }

.app-main{
  min-height: 0;
  overflow: auto;
  border-radius: var(--r-14);
  border: 1px solid rgba(38, 59, 90, .65);
  background: rgba(17, 31, 51, .55);
  box-shadow: var(--shadow-soft);
  padding: var(--sp-12);
}

.workspace-header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: var(--sp-12);
  margin-bottom: var(--sp-12);
}
.workspace-title h2{
  margin:0;
  font-size: var(--fs-22);
  letter-spacing: .2px;
}
.workspace-actions{ display:flex; align-items:center; gap: 8px; }

.view{ min-height: 0; }

.grid-2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-10);
  align-items:start;
}

.card{
  background: rgba(17, 31, 51, .65);
  border: 1px solid rgba(38, 59, 90, .75);
  border-radius: var(--r-14);
  box-shadow: var(--shadow-soft);
  overflow:hidden;
}
.card-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: var(--sp-10);
  padding: var(--sp-10) var(--sp-12);
  border-bottom: 1px solid rgba(38, 59, 90, .65);
  background: rgba(15, 27, 45, .55);
}
.card-title{
  margin:0;
  font-size: var(--fs-16);
  font-weight: 650;
}
.card-actions{ display:flex; align-items:center; gap: 8px; }
.card-content{ padding: var(--sp-12); }
.card-footer{
  padding: var(--sp-10) var(--sp-12);
  border-top: 1px solid rgba(38, 59, 90, .65);
  background: rgba(15, 27, 45, .45);
  display:flex;
  justify-content:flex-end;
}

.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap: 8px;
  height: 34px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(38, 59, 90, .9);
  background: rgba(15, 27, 45, .7);
  color: var(--text);
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, border-color .12s ease, opacity .12s ease;
  font-size: var(--fs-13);
  font-weight: 600;
}
.btn:hover{ transform: translateY(-1px); border-color: rgba(56, 189, 248, .35); background: rgba(17, 31, 51, .85); }
.btn:active{ transform: translateY(0px); }
.btn:disabled{ opacity: .45; cursor: not-allowed; transform:none; }
.btn:focus-visible{ outline:none; box-shadow: var(--ring); }

.btn-icon{ width: 36px; padding:0; }
.btn-primary{ background: rgba(109, 40, 217, .88); border-color: rgba(109, 40, 217, .95); }
.btn-primary:hover{ background: rgba(91, 33, 182, .95); border-color: rgba(91, 33, 182, 1); }
.btn-secondary{ background: rgba(15, 27, 45, .6); }
.btn-accent{ background: rgba(8, 145, 178, .8); border-color: rgba(8, 145, 178, .95); }
.btn-accent:hover{ background: rgba(14, 116, 144, .95); border-color: rgba(14, 116, 144, 1); }
.btn-error{ background: rgba(239, 68, 68, .75); border-color: rgba(239, 68, 68, .95); }
.btn-error:hover{ background: rgba(220, 38, 38, .95); border-color: rgba(220, 38, 38, 1); }

.form-group{ display:flex; flex-direction:column; gap: 8px; margin-bottom: var(--sp-12); }
.form-label{ font-size: var(--fs-13); color: var(--muted); font-weight: 650; }
.form-row{ display:flex; gap: 8px; align-items:center; }
.form-control{
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid rgba(38, 59, 90, .9);
  background: rgba(11, 18, 32, .7);
  color: var(--text);
  font-size: var(--fs-13);
  outline: none;
}
.form-control:focus{ box-shadow: var(--ring); border-color: rgba(56, 189, 248, .45); }
.form-control::placeholder{ color: rgba(203, 213, 225, .65); }
select.form-control{ padding-right: 28px; }

.form-checkbox{
  display:flex;
  align-items:center;
  gap: 10px;
  color: var(--muted);
  font-size: var(--fs-13);
  user-select:none;
}
.form-checkbox input{ accent-color: var(--primary); }

.device-list{ display:flex; flex-direction:column; gap: 8px; }
.device-item{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(38, 59, 90, .8);
  background: rgba(11, 18, 32, .55);
  transition: background .12s ease, border-color .12s ease, transform .12s ease;
}
.device-item:hover{ transform: translateY(-1px); border-color: rgba(56, 189, 248, .28); background: rgba(15, 27, 45, .7); }
.device-item.selected{ border-color: rgba(109, 40, 217, .65); background: rgba(109, 40, 217, .12); }
.device-info{ min-width: 0; }
.device-name{ font-weight: 650; font-size: var(--fs-13); }
.device-status{ color: var(--subtle); font-size: var(--fs-12); margin-top: 2px; }
.status-online{ color: rgba(34, 197, 94, .95); }
.device-actions{ display:flex; gap: 8px; align-items:center; flex-shrink: 0; }

.kv-list{ display:flex; flex-direction:column; gap: 8px; }
.kv-row{
  display:grid;
  grid-template-columns: 110px 1fr;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(38, 59, 90, .8);
  background: rgba(11, 18, 32, .45);
}
.kv-key{ color: var(--subtle); font-size: var(--fs-12); font-weight: 650; }
.kv-val{ color: var(--text); font-size: var(--fs-13); word-break: break-all; }

.alert{
  display:flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--r-14);
  border: 1px solid rgba(38, 59, 90, .75);
  background: rgba(15, 27, 45, .55);
  margin-top: var(--sp-10);
}
.alert-icon{ color: var(--info); font-size: 18px; padding-top: 1px; }
.alert-content{ color: var(--muted); font-size: var(--fs-13); }
.alert-content p{ margin: 0 0 8px 0; }
.alert-content p:last-child{ margin-bottom: 0; }
.alert-content strong{ color: var(--text); }
.alert-warning .alert-icon{ color: var(--warning); }
.alert-error .alert-icon{ color: var(--danger); }
.alert-success .alert-icon{ color: var(--success); }
.alert-info .alert-icon{ color: var(--info); }

.loading{ display:flex; align-items:center; justify-content:center; padding: 12px; }
.loading-spinner{
  width: 22px; height:22px;
  border-radius: 50%;
  border: 3px solid rgba(248, 250, 252, .22);
  border-top-color: rgba(56, 189, 248, .9);
  animation: spin 1s linear infinite;
}
@keyframes spin{ to { transform: rotate(360deg); } }

.status-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--r-14);
  border: 1px solid rgba(38, 59, 90, .65);
  background: rgba(17, 31, 51, .55);
  box-shadow: var(--shadow-soft);
}
.status-message{ color: var(--muted); font-size: var(--fs-13); transition: color .15s ease; }
.status-error{ color: rgba(239, 68, 68, .95); }
.status-success{ color: rgba(34, 197, 94, .95); }
.status-warning{ color: rgba(251, 191, 36, .95); }
.status-highlight{ font-weight: 700; }

.tooltip{ position:relative; }
.tooltip:hover::after{
  content: attr(data-tooltip);
  position:absolute;
  top: 42px;
  right: 0;
  white-space:nowrap;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(38,59,90,.9);
  background: rgba(11, 18, 32, .92);
  color: var(--text);
  font-size: var(--fs-12);
  box-shadow: var(--shadow-soft);
  pointer-events:none;
}

.empty-state{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding: 38px 16px;
  border-radius: var(--r-14);
  border: 1px dashed rgba(38, 59, 90, .85);
  background: rgba(11, 18, 32, .35);
}
.empty-icon{ font-size: 28px; color: rgba(56, 189, 248, .9); margin-bottom: 10px; }
.empty-title{ font-size: var(--fs-16); font-weight: 750; margin-bottom: 6px; }
.empty-desc{ font-size: var(--fs-13); color: var(--muted); margin-bottom: 14px; max-width: 44ch; }
/* 当已有选中设备时，强制隐藏投屏页的空状态提示 */
#viewMirroring.has-device #mirroringEmpty{ display:none !important; }

.toast-region{
  position: fixed;
  right: 14px;
  bottom: 14px;
  display:flex;
  flex-direction:column;
  gap: 10px;
  z-index: 50;
}
.toast{
  width: min(380px, calc(100vw - 28px));
  border-radius: var(--r-14);
  border: 1px solid rgba(38, 59, 90, .75);
  background: rgba(11, 18, 32, .92);
  box-shadow: var(--shadow);
  padding: 10px 12px;
  display:flex;
  gap: 10px;
  align-items:flex-start;
  animation: toastIn .16s ease-out;
}
.toast-icon{ padding-top: 1px; font-size: 18px; color: var(--info); }
.toast-body{ min-width:0; }
.toast-title{ font-weight: 800; font-size: var(--fs-13); margin: 0 0 2px 0; }
.toast-desc{ font-size: var(--fs-13); color: var(--muted); margin: 0; }
.toast.success .toast-icon{ color: var(--success); }
.toast.error .toast-icon{ color: var(--danger); }
.toast.warning .toast-icon{ color: var(--warning); }
@keyframes toastIn{ from { transform: translateY(6px); opacity: .0; } to { transform: translateY(0); opacity: 1; } }

::-webkit-scrollbar{ width: 10px; height: 10px; }
::-webkit-scrollbar-track{ background: rgba(11, 18, 32, .35); border-radius: 10px; }
::-webkit-scrollbar-thumb{ background: rgba(38, 59, 90, .8); border-radius: 10px; border: 2px solid rgba(11, 18, 32, .35); }
::-webkit-scrollbar-thumb:hover{ background: rgba(56, 189, 248, .35); }

@media (max-width: 980px){
  .app-shell{ grid-template-columns: 1fr; }
  .app-nav{
    flex-direction:row;
    justify-content:space-between;
  }
  .nav-item{ flex:1; flex-direction:row; justify-content:center; }
  .grid-2{ grid-template-columns: 1fr; }
  .workspace-header{ flex-direction:column; align-items:stretch; }
  .workspace-actions{ justify-content:flex-end; }
}
`;

  document.head.appendChild(style);
}
