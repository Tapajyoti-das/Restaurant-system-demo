// ============================================================
//  SUPABASE CONFIG — Orders Migration
// ============================================================
const SUPABASE_URL = 'https://dbdstcfgfetvrawzkgoh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZHN0Y2ZnZmV0dnJhd3prZ29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0Nzc3NTIsImV4cCI6MjA5NjA1Mzc1Mn0.xorPGjFbodyieYjSoc6UtdaYlVtX_n0GnWi-2STrHHc';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
//  GLOBAL ERROR ISOLATION SYSTEM
//  Ek feature me error aaye toh baaki sab safe rahein
//
//  Bug #7 fix: pehle errors POORI tarah silent the — user/developer ko
//  kabhi pata nahi chalta tha ki kuch toota hai (isi wajah se kai bugs
//  mahino tak invisible rahe). Ab:
//   - Har error window._sgErrorLog mein save hota hai (last 50)
//   - User ko ek chhota throttled toast dikhta hai (spam nahi hoga:
//     max 1 toast / 10 sec, same message repeat nahi)
//   - Console mein sgErrors() type karke poora log dekh sakte ho
//  Isolation pehle jaisa hi hai — page crash ab bhi nahi hoga.
// ============================================================

window._sgErrorLog = window._sgErrorLog || [];
var _sgLastToastAt = 0;
var _sgLastToastMsg = '';

function _sgErrorToast(msg) {
  try {
    var m = String(msg || '');
    // Benign/noise errors pe toast mat dikhao
    if(/ResizeObserver|Script error\.?$/i.test(m)) return;
    var now = Date.now();
    if(now - _sgLastToastAt < 10000) return;           // throttle: max 1 / 10s
    if(m === _sgLastToastMsg && now - _sgLastToastAt < 60000) return; // same msg dedupe
    _sgLastToastAt = now; _sgLastToastMsg = m;
    if(typeof window.showToast === 'function') {
      window.showToast('⚠️ Kuch galat hua — kaam continue karo, detail console (F12) mein hai', 'error');
      return;
    }
    // showToast abhi load nahi hua toh fallback mini-toast
    if(document && document.body) {
      var d = document.createElement('div');
      d.textContent = '⚠️ Kuch galat hua — detail console (F12) mein hai';
      d.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#c62828;color:#fff;padding:10px 18px;border-radius:10px;font-size:0.85rem;z-index:999999;box-shadow:0 4px 14px rgba(0,0,0,0.3);font-family:inherit;';
      document.body.appendChild(d);
      setTimeout(function(){ try { d.remove(); } catch(e){} }, 4000);
    }
  } catch(e) {}
}

function _sgLogError(kind, msg, detail) {
  try {
    window._sgErrorLog.push({
      time: new Date().toLocaleString('en-IN'),
      kind: kind,
      msg: String(msg || ''),
      detail: String(detail || '')
    });
    if(window._sgErrorLog.length > 50) window._sgErrorLog.shift();
    _sgErrorToast(msg);
  } catch(e) {}
}

// Console debug helper — sgErrors() likho toh saare recent errors table mein dikhenge
window.sgErrors = function() {
  if(!window._sgErrorLog.length) { console.log('✅ Koi error log nahi hai'); return; }
  console.table(window._sgErrorLog);
  return window._sgErrorLog.length + ' errors (latest last)';
};

// Unhandled JS errors ko catch karo — crash mat karo, lekin ab VISIBLE rakho
window.onerror = function(msg, src, line, col, err) {
  console.error('[SG Error]', msg, 'at', src, line+':'+col, err);
  _sgLogError('js', msg, (src||'') + ':' + line + ':' + col);
  return true; // page crash prevent — error upar log + toast ho chuka hai
};

// Async/Promise errors ko catch karo
window.addEventListener('unhandledrejection', function(e) {
  console.error('[SG Async Error]', e.reason);
  _sgLogError('async', (e.reason && (e.reason.message || e.reason)) || 'Promise rejection');
  e.preventDefault(); // page crash prevent karo
});

// ============================================================
// Bug #9 fix — localStorage QUOTA GUARD
// Pehle storage full hone pe setItem silently fail hota tha
// (menu/images/data save nahi hote the, kisi ko pata nahi chalta).
// Ab har setItem wrap hai: quota full => clear warning toast +
// error log entry. Error phir bhi throw hota hai taaki existing
// try/catch blocks ka behavior na badle.
// ============================================================
(function(){
  try {
    var _origSetItem = Storage.prototype.setItem;
    var _lastQuotaToast = 0;
    Storage.prototype.setItem = function(key, value) {
      try {
        return _origSetItem.call(this, key, value);
      } catch(e) {
        var isQuota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
        console.error('[SG Storage] setItem fail "' + key + '"' + (isQuota ? ' — STORAGE FULL' : ''), e);
        // Error log mein entry (direct push — generic toast dobara na aaye)
        try {
          if(window._sgErrorLog) {
            window._sgErrorLog.push({ time:new Date().toLocaleString('en-IN'), kind:'storage', msg:(isQuota?'localStorage FULL':'setItem fail')+' — "'+key+'"', detail:'' });
            if(window._sgErrorLog.length > 50) window._sgErrorLog.shift();
          }
        } catch(_l) {}
        // Quota full => user ko clearly batao (max 1 warning / 30 sec)
        if(isQuota) {
          var now = Date.now();
          if(now - _lastQuotaToast > 30000) {
            _lastQuotaToast = now;
            var wmsg = '⚠️ Browser storage FULL — data save nahi ho raha! Menu images kam/chhoti karo ya Supabase "sg-uploads" bucket setup karo.';
            try {
              if(typeof window.showToast === 'function') window.showToast(wmsg, 'error');
              else if(document && document.body) {
                var d = document.createElement('div');
                d.textContent = wmsg;
                d.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#c62828;color:#fff;padding:10px 18px;border-radius:10px;font-size:0.85rem;z-index:999999;box-shadow:0 4px 14px rgba(0,0,0,0.3);max-width:90%;text-align:center;';
                document.body.appendChild(d);
                setTimeout(function(){ try { d.remove(); } catch(_r){} }, 6000);
              }
            } catch(_t) {}
          }
        }
        throw e; // existing try/catch semantics preserve raho
      }
    };
  } catch(e) { console.error('[SG] storage guard install fail:', e); }
})();

// Safe function wrapper — kisi bhi function ko safely call karo
function _safe(fn, fallback) {
  try {
    var result = fn();
    if(result && typeof result.catch === 'function') {
      result.catch(function(e) {
        console.error('[SG Safe Async]', e);
      });
    }
    return result;
  } catch(e) {
    console.error('[SG Safe]', e);
    if(typeof fallback === 'function') fallback(e);
    return null;
  }
}

// Safe render wrapper — render fail ho toh tbody mein error dikhao
function _safeRender(fn, tbodyId, sectionName) {
  try {
    var result = fn();
    if(result && typeof result.catch === 'function') {
      result.catch(function(e) {
        console.error('[SG Render Error] '+sectionName+':', e);
        var el = tbodyId ? document.getElementById(tbodyId) : null;
        if(el) el.innerHTML = '<tr><td colspan="20" style="text-align:center;color:#e74c3c;padding:20px;">⚠️ '+sectionName+' load karne mein error. Page refresh karo.</td></tr>';
      });
    }
    return result;
  } catch(e) {
    console.error('[SG Render Error] '+sectionName+':', e);
    var el = tbodyId ? document.getElementById(tbodyId) : null;
    if(el) el.innerHTML = '<tr><td colspan="20" style="text-align:center;color:#e74c3c;padding:20px;">⚠️ '+sectionName+' load karne mein error. Page refresh karo.</td></tr>';
    return null;
  }
}


// ============================================================
//  ORDERS — Supabase Helper Functions
// ============================================================

// Fetch all orders from Supabase
// ============================================================
// UNIVERSAL DATE PARSER — handles all order date formats
// Returns YYYY-MM-DD string, or '' if unparseable
// ============================================================
function parseAnyDate(o) {
  // For order objects: check each field in priority order
  if (o && typeof o === 'object') {

    // 1. 'time' field: IST locale "06/06/2026, 9:23 am" — most reliable for live orders
    var t = String(o.time || '').trim();
    if (t) {
      var tp = t.split(',')[0].trim().split('/');
      if (tp.length === 3 && tp[2].trim().length === 4 && !isNaN(tp[2].trim())) {
        return tp[2].trim() + '-' + tp[1].trim().padStart(2,'0') + '-' + tp[0].trim().padStart(2,'0');
      }
    }

    // 2. 'date' field: plain YYYY-MM-DD (imported orders) — use as-is, no UTC shift
    var dt = String(o.date || '').trim();
    if (dt && /^\d{4}-\d{2}-\d{2}/.test(dt)) return dt.substring(0, 10);
    // date as DD/MM/YYYY
    if (dt) {
      var dp = dt.split('/');
      if (dp.length === 3 && dp[2].trim().length === 4)
        return dp[2].trim() + '-' + dp[1].trim().padStart(2,'0') + '-' + dp[0].trim().padStart(2,'0');
    }

    // 3. 'created_at' (Supabase UTC timestamp) — convert to IST
    var ca = String(o.created_at || o.createdAt || '').trim();
    if (ca) {
      try {
        // Supabase returns "+00" not "+00:00" - fix for JS Date parsing
        var caFixed = ca.replace(/([+-]\d{2})$/, '$1:00').replace(' ', 'T');
        var utc = new Date(caFixed);
        if (!isNaN(utc.getTime())) {
          var ist = new Date(utc.getTime() + 5.5 * 60 * 60000);
          return ist.getUTCFullYear() + '-' +
            String(ist.getUTCMonth()+1).padStart(2,'0') + '-' +
            String(ist.getUTCDate()).padStart(2,'0');
        }
      } catch(e) {}
    }
    return '';
  }

  // Plain string input
  var s = String(o || '').trim();
  if (!s) return '';
  // DD/MM/YYYY
  var sp = s.split(',')[0].trim().split('/');
  if (sp.length === 3 && sp[2].trim().length === 4 && !isNaN(sp[2].trim()))
    return sp[2].trim() + '-' + sp[1].trim().padStart(2,'0') + '-' + sp[0].trim().padStart(2,'0');
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return '';
}

// Get TODAY in IST (Indian Standard Time) as YYYY-MM-DD
function getTodayIST() {
  var now = new Date();
  var istOffset = 5.5 * 60 * 60000;
  var istNow = new Date(now.getTime() + istOffset);
  // Use UTC methods on the shifted time (equivalent to IST local)
  var y = istNow.getUTCFullYear();
  var m = String(istNow.getUTCMonth()+1).padStart(2,'0');
  var d = String(istNow.getUTCDate()).padStart(2,'0');
  return y+'-'+m+'-'+d;
}

// Get week range (Mon-Sun) for a given date
function getWeekRange(date) {
  // Bug #8 fix: ab 'date' param actually use hota hai (pehle ignore hota tha).
  // Input ko IST calendar-date (YYYY-MM-DD) mein resolve karte hain, phir us
  // hafte ka Mon..Sun nikaalte hain. Saara math UTC-anchored hai taaki runtime
  // ke local timezone se din shift na ho (pehle 'new Date(str)' local-TZ pe
  // depend karta tha).
  var istStr;
  if (date == null) {
    istStr = getTodayIST();                       // default: aaj (IST)
  } else if (typeof date === 'string') {
    istStr = /^\d{4}-\d{2}-\d{2}/.test(date)
      ? date.substring(0, 10)
      : (parseAnyDate(date) || getTodayIST());
  } else {
    // Date object ya timestamp: us instant ko IST date mein convert karo
    var t = (date instanceof Date) ? date.getTime() : new Date(date).getTime();
    if (isNaN(t)) {
      istStr = getTodayIST();
    } else {
      var ist = new Date(t + 5.5 * 60 * 60000);
      istStr = ist.getUTCFullYear() + '-' +
        String(ist.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(ist.getUTCDate()).padStart(2, '0');
    }
  }
  // Mon..Sun nikaalo (UTC-anchored, no local-TZ drift)
  var base = new Date(istStr + 'T00:00:00Z');
  var day = base.getUTCDay();                      // 0=Sun, 1=Mon ... 6=Sat
  var diffToMon = (day === 0) ? -6 : 1 - day;      // Monday tak peeche
  var mon = new Date(base.getTime() + diffToMon * 86400000);
  var sun = new Date(mon.getTime() + 6 * 86400000);
  function fmt(dt) {
    return dt.getUTCFullYear() + '-' +
      String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getUTCDate()).padStart(2, '0');
  }
  return { from: fmt(mon), to: fmt(sun) };
}

async function sbGetOrders() {
  try {
    const { data, error } = await _supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000);
    if (error) { console.error('sbGetOrders error:', error); return []; }
    return data || [];
  } catch(e) { console.error('sbGetOrders exception:', e); return []; }
}

// Bandwidth fix — polling ke liye SIRF recent orders lao (poori history nahi).
// Full history sirf login/load pe ek baar aati hai (sbGetOrders); ye wala
// har poll pe chalta hai isliye chhota rakha hai => Supabase egress ~95% kam.
// Error pe null return karta hai (genuine khaali list se alag pehchan ke liye).
async function sbGetRecentOrders(hoursBack) {
  try {
    const since = new Date(Date.now() - (hoursBack||48)*3600*1000).toISOString();
    const { data, error } = await _supabase
      .from('orders')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) { console.error('sbGetRecentOrders error:', error); return null; }
    return data || [];
  } catch(e) { console.error('sbGetRecentOrders exception:', e); return null; }
}

// Save a single new order to Supabase
async function sbInsertOrder(order) {
  try {
    // Only send fields that exist in the orders table
    const clean = {
      id: order.id,
      name: order.name || '',
      mobile: order.mobile || '',
      whatsapp: order.whatsapp || '',
      email: order.email || '',
      address: order.address || '',
      type: order.type || 'Takeaway',
      pay: order.pay || 'Cash',
      note: order.note || '',
      items: order.items || [],
      subtotal: order.subtotal || 0,
      gstAmt: order.gstAmt || 0,
      total: order.total || 0,
      grandTotal: order.grandTotal || order.total || 0,
      status: order.status || 'Pending',
      time: order.time || new Date().toLocaleString('en-IN'),
      tableNum: order.tableNum || '',
      tableId: order.tableId || '',
      cancelReason: order.cancelReason || '',
      statusHistory: order.statusHistory || [],
      cookReadyAt: order.cookReadyAt || '',
      dineInDate: order.dineInDate || '',
      dineInTime: order.dineInTime || '',
      dineInGuests: order.dineInGuests || '',
      dineInRequest: order.dineInRequest || '',
      dineInSlots: order.dineInSlots || [],
      dineInReservCharge: order.dineInReservCharge || 0,
      imported: order.imported || false,
      created_at: order.created_at || new Date().toISOString(),
    };
    const { data, error } = await _supabase
      .from('orders')
      .upsert([clean], { onConflict: 'id' })
      .select();
    if (error) { console.warn('sbInsertOrder skip:', error.message); return null; }
    return data?.[0] || null;
  } catch(e) { console.warn('sbInsertOrder exception:', e); return null; }
}

// Update an existing order by id
async function sbUpdateOrder(id, updates) {
  try {
    const { data, error } = await _supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) { console.error('sbUpdateOrder error:', error); return null; }
    return data?.[0] || null;
  } catch(e) { console.error('sbUpdateOrder exception:', e); return null; }
}

// Delete an order by id
async function sbDeleteOrder(id) {
  try {
    const { error } = await _supabase
      .from('orders')
      .delete()
      .eq('id', id);
    if (error) { console.error('sbDeleteOrder error:', error); return false; }
    return true;
  } catch(e) { console.error('sbDeleteOrder exception:', e); return false; }
}

// Load orders from Supabase into global `orders` array + refresh UI
async function loadOrdersFromSupabase() {
  try {
  orders = await sbGetOrders();
  return orders;
  } catch(_e) { console.error("[SG] loadOrdersFromSupabase:", _e); }
}

// Supabase Realtime — auto-refresh orders on any change
// ============================================================
//  Realtime EGRESS fix: pehle har change pe poori table refetch hoti thi
//  (har tab ke liye) — yeh Supabase egress ka sabse bada kharcha tha.
//  Ab realtime payload se sirf badli hui EK row apply karte hain.
//  Return: true = apply ho gaya, false = fallback (caller full refetch kare).
// ============================================================
function _applyRealtimeChange(arr, payload) {
  try {
    var ev = payload && (payload.eventType || payload.event);
    if(ev === 'INSERT' && payload.new) {
      if(!arr.some(function(x){ return String(x.id) === String(payload.new.id); })) arr.unshift(payload.new);
      return true;
    }
    if(ev === 'UPDATE' && payload.new) {
      var ix = arr.findIndex(function(x){ return String(x.id) === String(payload.new.id); });
      if(ix >= 0) arr[ix] = payload.new; else arr.unshift(payload.new);
      return true;
    }
    if(ev === 'DELETE' && payload.old && payload.old.id != null) {
      var i2 = arr.findIndex(function(x){ return String(x.id) === String(payload.old.id); });
      if(i2 >= 0) arr.splice(i2, 1);
      return true;
    }
    return false; // unknown/malformed -> caller fallback kare
  } catch(e) { return false; }
}

async function subscribeOrdersRealtime() {
  try {
  // Bug #10 fix: channel reference save karo taaki logout pe band kar sakein;
  // pehle se subscribed ho toh purani channel hatao (double-subscribe guard)
  if(window._sgOrdersChannel) { try { _supabase.removeChannel(window._sgOrdersChannel); } catch(e) {} window._sgOrdersChannel = null; }
  window._sgOrdersChannel = _supabase
    .channel('orders-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      if(!Array.isArray(orders)) orders = [];
      var _rerender = function(){
        try { updateStats(); } catch(e) {}
        try { renderOrders(); } catch(e) {}
        try { loadKDS(); } catch(e) {}
        try { updatePendingBadge(); } catch(e) {}
      };
      if(_applyRealtimeChange(orders, payload)) {
        _rerender();
      } else {
        // fallback: full refetch (safety — koi order atke na)
        sbGetOrders().then(function(d){ orders = d; _rerender(); }).catch(function(){});
      }
    })
    .subscribe();
  } catch(_e) { console.error("[SG] subscribeOrdersRealtime:", _e); }
}

// Supabase Realtime — auto-refresh customers on any change
async function subscribeCustomersRealtime() {
  try {
  // Bug #10 fix: channel reference save karo taaki logout pe band kar sakein;
  // pehle se subscribed ho toh purani channel hatao (double-subscribe guard)
  if(window._sgCustomersChannel) { try { _supabase.removeChannel(window._sgCustomersChannel); } catch(e) {} window._sgCustomersChannel = null; }
  window._sgCustomersChannel = _supabase
    .channel('customers-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
      if(!Array.isArray(customers)) customers = [];
      var _rerender = function(){
        try { updateStats(); } catch(e) {}
        try { renderCustomers(); } catch(e) {}
      };
      if(_applyRealtimeChange(customers, payload)) {
        _rerender();
      } else {
        sbGetCustomers().then(function(d){ customers = d; _rerender(); }).catch(function(){});
      }
    })
    .subscribe();
  } catch(_e) { console.error("[SG] subscribeCustomersRealtime:", _e); }
}

// ============================================================
//  MENU ITEMS — Supabase Helper Functions
// ============================================================

async function sbGetMenuItems() {
  try {
    const localStr = localStorage.getItem('sg_menu_items');
    const localItems = localStr ? JSON.parse(localStr) : [];

    const { data, error } = await _supabase
      .from('menu_items')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('sbGetMenuItems error:', error);
      return localItems.length ? localItems : null;
    }
    if (!data || !data.length) return localItems.length ? localItems : [];

    // MERGE: Supabase data + any local-only items (new liquor/dish not yet synced)
    const sbIds = new Set(data.map(i => String(i.id)));
    const localOnly = localItems.filter(i => !sbIds.has(String(i.id)));
    // For items in both, prefer local version (has extra fields like isLiquor, exciseDuty)
    const localMap = {};
    localItems.forEach(i => { localMap[String(i.id)] = i; });
    const merged = [
      ...data.map(i => localMap[String(i.id)] ? Object.assign({}, i, localMap[String(i.id)]) : i),
      ...localOnly
    ];
    localStorage.setItem('sg_menu_items', JSON.stringify(merged));
    return merged;
  } catch(e) {
    console.error('sbGetMenuItems exception:', e);
    const local = localStorage.getItem('sg_menu_items');
    return local ? JSON.parse(local) : null;
  }
}

async function sbUpsertMenuItem(item) {
  try {
    // Always save to localStorage as fallback
    const stored = JSON.parse(localStorage.getItem('sg_menu_items')||'[]');
    const idx = stored.findIndex(m => m.id == item.id);
    if(idx>=0) stored[idx]=item; else stored.push(item);
    localStorage.setItem('sg_menu_items', JSON.stringify(stored));
    // Try Supabase
    const { data, error } = await _supabase
      .from('menu_items')
      .upsert([item], { onConflict: 'id' })
      .select();
    if (error) { console.error('sbUpsertMenuItem error:', error); return null; }
    return data?.[0] || null;
  } catch(e) { console.error('sbUpsertMenuItem exception:', e); return null; }
}

async function sbDeleteMenuItem(id) {
  try {
    // Remove from localStorage
    const stored = JSON.parse(localStorage.getItem('sg_menu_items')||'[]');
    localStorage.setItem('sg_menu_items', JSON.stringify(stored.filter(m=>m.id!=id)));
    const { error } = await _supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    if (error) { console.error('sbDeleteMenuItem error:', error); return false; }
    return true;
  } catch(e) { console.error('sbDeleteMenuItem exception:', e); return false; }
}

// ============================================================
//  CATEGORIES — Supabase (stored as single row in settings)
// ============================================================

async function sbGetCategories() {
  try {
    const { data, error } = await _supabase
      .from('sg_settings')
      .select('value')
      .eq('key', 'sg_categories')
      .maybeSingle();
    if (error || !data) return null;
    return JSON.parse(data.value);
  } catch(e) { return null; }
}

async function sbSaveCategories(cats) {
  try {
    await _supabase.from('sg_settings')
      .upsert([{ key: 'sg_categories', value: JSON.stringify(cats) }], { onConflict: 'key' });
  } catch(e) { console.error('sbSaveCategories error:', e); }
}

// ============================================================
//  GST RATE — Supabase (stored as single row in settings)
// ============================================================

async function sbGetGST() {
  try {
    const { data, error } = await _supabase
      .from('sg_settings')
      .select('value')
      .eq('key', 'sg_gst')
      .maybeSingle();
    if (error || !data) return 5;
    return parseFloat(data.value) || 5;
  } catch(e) { return 5; }
}

async function sbSaveGST(rate) {
  try {
    await _supabase.from('sg_settings')
      .upsert([{ key: 'sg_gst', value: rate.toString() }], { onConflict: 'key' });
  } catch(e) { console.error('sbSaveGST error:', e); }
}

// In-memory GST cache
let _gstRateCache = 5;

// ============================================================
//  INVENTORY — Supabase Helper Functions
// ============================================================

// Generic inventory table helper (replaces getInvData/setInvData)
async function sbGetInv(table) {
  try {
    const { data, error } = await _supabase
      .from(table)
      .select('*')
      .limit(10000);
    if (error) {
      console.error('sbGetInv error ['+table+']:', error);
      try { const ls = localStorage.getItem('sb_'+table); return ls ? JSON.parse(ls) : []; } catch(e2) { return []; }
    }
    try { localStorage.setItem('sb_'+table, JSON.stringify(data||[])); } catch(e2) {}
    return data || [];
  } catch(e) {
    console.warn('sbGetInv offline fallback ['+table+']:', e.message);
    try { const ls = localStorage.getItem('sb_'+table); return ls ? JSON.parse(ls) : []; } catch(e2) { return []; }
  }
}

async function sbUpsertInv(table, rows, conflictKey='id') {
  try {
  if (!rows || !rows.length) return false;
  let ok = true;
  try {
    const { error } = await _supabase.from(table).upsert(rows, { onConflict: conflictKey });
    if (error) { console.error('sbUpsertInv error ['+table+']:', error); ok = false; }
  } catch(e) {
    console.warn('sbUpsertInv offline ['+table+']:', e.message);
    ok = false;
  }
  // localStorage cache HAMESHA update karo — chahe Supabase fail ho ya error de
  // (pehle yeh sirf success case mein hota tha, isliye Supabase fail hone par
  // data localStorage mein bhi nahi bachta tha aur cache clear hote hi gayab ho jata tha)
  try {
    const existing = JSON.parse(localStorage.getItem('sb_'+table)||'[]');
    rows.forEach(row => {
      const idx = existing.findIndex(r => r[conflictKey] === row[conflictKey]);
      if(idx >= 0) existing[idx] = {...existing[idx], ...row};
      else existing.push(row);
    });
    localStorage.setItem('sb_'+table, JSON.stringify(existing));
  } catch(e2) {}
  // Supabase write fail hui to is table ko "pending sync" mein mark karo,
  // taaki Supabase wapas active hote hi auto-sync isko uthaa le
  if (!ok) markTablePendingSync(table, conflictKey); else clearTablePendingSync(table);
  return ok;
  } catch(_e) { console.error("[SG] sbUpsertInv:", _e); return false; }
}

// ============================================================
//  AUTO-SYNC ENGINE — Supabase down hone par local mein hua
//  saara kaam, Supabase wapas active hote hi automatically
//  push kar deta hai. Manual "Sync Now" button bhi available hai.
// ============================================================

// Sirf woh table jiski write Supabase par fail hui thi
function markTablePendingSync(table, conflictKey) {
  try {
    const pending = JSON.parse(localStorage.getItem('sg_pending_sync')||'{}');
    pending[table] = conflictKey || 'id';
    localStorage.setItem('sg_pending_sync', JSON.stringify(pending));
    updateSyncBanner();
  } catch(e) {}
}
function clearTablePendingSync(table) {
  try {
    const pending = JSON.parse(localStorage.getItem('sg_pending_sync')||'{}');
    if (pending[table]) { delete pending[table]; localStorage.setItem('sg_pending_sync', JSON.stringify(pending)); }
    updateSyncBanner();
  } catch(e) {}
}

// Inventory section ke top par ek warning banner dikhao/chupao,
// jisme bataya jaaye ki kitne tables ka data abhi Supabase par sync nahi hai
function updateSyncBanner() {
  try {
    const pending = JSON.parse(localStorage.getItem('sg_pending_sync')||'{}');
    const count = Object.keys(pending).length;
    const banner = document.getElementById('invSyncBanner');
    const msgEl  = document.getElementById('invSyncMsg');
    if (!banner) return;
    if (count > 0) {
      banner.style.display = 'flex';
      if (msgEl) msgEl.textContent = count + ' table(s) ka data abhi Supabase par save nahi hai (local mode mein bana tha). Supabase wapas active hote hi yahan se "Sync Now" kar do — ya app khud bhi try karta rahega.';
    } else {
      banner.style.display = 'none';
    }
  } catch(e) { console.error('[SG] updateSyncBanner:', e); }
}

// Halka sa connectivity check — Supabase abhi reachable hai ya nahi
async function isSupabaseReachable() {
  try {
    const { error } = await _supabase.from('sg_settings').select('key').limit(1);
    return !error;
  } catch(e) { return false; }
}

// Pending tables ka saara local data Supabase par push karo
async function syncLocalDataToSupabase(verbose) {
  try {
    const pending = JSON.parse(localStorage.getItem('sg_pending_sync')||'{}');
    const tables  = Object.keys(pending);
    if (!tables.length) { if (verbose) showToast('✅ Sab kuch already Supabase mein sync hai — pending kuch nahi hai.'); return true; }

    if (verbose) showToast('🔄 Supabase check ho raha hai...');
    const reachable = await isSupabaseReachable();
    if (!reachable) { if (verbose) showToast('❌ Supabase abhi bhi available nahi hai. Thodi der baad try karo.', 'error'); return false; }

    let totalPushed = 0;
    const failedTables = [];
    for (const table of tables) {
      const conflictKey = pending[table];
      let rows = [];
      try { rows = JSON.parse(localStorage.getItem('sb_'+table) || '[]'); } catch(e) { rows = []; }
      if (!rows.length) { clearTablePendingSync(table); continue; }
      const ok = await sbUpsertInv(table, rows, conflictKey); // yeh khud hi success par pending clear kar dega
      if (ok) totalPushed += rows.length; else failedTables.push(table);
    }

    invInvalidate(); // fresh Supabase data dobara fetch ho

    if (failedTables.length) {
      showToast('⚠️ Kuch tables sync nahi ho paye: ' + failedTables.join(', ') + '. Dobara try karo.', 'error');
    } else {
      localStorage.setItem('sg_last_sync', new Date().toLocaleString('en-IN'));
      showToast('✅ Sync complete! ' + totalPushed + ' records Supabase mein push ho gaye.');
    }
    if (typeof renderInventory === 'function') renderInventory();
    return failedTables.length === 0;
  } catch(e) {
    console.error('[SG] syncLocalDataToSupabase:', e);
    if (verbose) showToast('Sync failed: ' + e.message, 'error');
    return false;
  }
}

// Background mein silently check karte raho — jaise hi Supabase wapas
// active milta hai aur pending data hota hai, automatically sync kar do
async function autoSyncCheck() {
  try {
    const pending = JSON.parse(localStorage.getItem('sg_pending_sync')||'{}');
    if (!Object.keys(pending).length) return; // kuch pending hi nahi hai
    const reachable = await isSupabaseReachable();
    if (!reachable) return; // abhi bhi down hai, chup-chap wait karo
    await syncLocalDataToSupabase(true); // mil gaya — ab sync karo aur user ko batao
  } catch(e) { console.error('[SG] autoSyncCheck:', e); }
}

// Page load ke thodi der baad ek baar check karo, fir har 2 minute mein
setTimeout(() => { updateSyncBanner(); autoSyncCheck(); }, 8000);
setInterval(autoSyncCheck, 2 * 60 * 1000);

async function sbDeleteInv(table, id) {
  try {
    const { error } = await _supabase.from(table).delete().eq('id', id);
    if (error) console.error('sbDeleteInv error ['+table+']:', error);
  } catch(e) { console.error('sbDeleteInv exception:', e); }
}

// Specific wrappers
const sbGetPurchases     = () => sbGetInv('inv_purchases');
const sbGetStock         = () => sbGetInv('inv_stock');
const sbGetRawmats       = () => sbGetInv('inv_rawmats');
const sbGetProducts      = () => sbGetInv('inv_products');
const sbGetVendors       = () => sbGetInv('inv_vendors');
const sbGetWaste         = () => sbGetInv('sg_waste');
const sbGetEmergency     = () => sbGetInv('sg_emergency_stock');
const sbGetSgPurchases   = () => sbGetInv('sg_purchases');

async function sbGetRecipes() {
  try {
    const { data, error } = await _supabase.from('sg_settings').select('value').eq('key','sg_recipes').maybeSingle();
    if (error || !data) return {};
    return JSON.parse(data.value);
  } catch(e) { return {}; }
}
async function sbSaveRecipes(obj) {
  try {
    await _supabase.from('sg_settings').upsert([{key:'sg_recipes', value: JSON.stringify(obj)}], {onConflict:'key'});
  } catch(e) { console.error('sbSaveRecipes error:', e); }
}

// In-memory inventory caches
let _invCache = {
  purchases: null, stock: null, rawmats: null, products: null,
  vendors: null, waste: null, emergency: null, sg_purchases: null, recipes: null,
  locations: null
};

async function invGet(key) {
  try {
  if (_invCache[key] !== null && _invCache[key] !== undefined) return _invCache[key];
  const tableMap = {
    purchases: 'inv_purchases', stock: 'inv_stock', rawmats: 'inv_rawmats',
    products: 'inv_products', vendors: 'inv_vendors', waste: 'sg_waste',
    wastes: 'sg_waste',  // alias
    emergency: 'sg_emergency_stock', sg_purchases: 'sg_purchases',
    locations: 'inv_locations'
  };
  if (key === 'recipes') { _invCache.recipes = await sbGetRecipes(); return _invCache.recipes; }
  const table = tableMap[key];
  if (!table) return [];
  _invCache[key] = await sbGetInv(table);
  return _invCache[key];
  } catch(_e) { console.error("[SG] invGet:", _e); }
}
function invInvalidate(key) {
  try { if (key) _invCache[key] = null; else Object.keys(_invCache).forEach(k=>_invCache[k]=null);
  } catch(_e) { console.error("[SG] invInvalidate:", _e); }
}

// ============================================================
//  SETTINGS — Supabase Helper Functions (all via sg_settings table)
// ============================================================

async function sbGetSetting(key, def=null) {
  try {
    const { data, error } = await _supabase
      .from('sg_settings').select('value').eq('key', key).maybeSingle();
    if (error || !data) return def;
    try { return JSON.parse(data.value); } catch(e) { return data.value; }
  } catch(e) { return def; }
}

async function sbSetSetting(key, val) {
  try {
    const value = typeof val === 'string' ? val : JSON.stringify(val);
    await _supabase.from('sg_settings')
      .upsert([{ key, value }], { onConflict: 'key' });
  } catch(e) { console.error('sbSetSetting error ['+key+']:', e); }
}

// In-memory settings cache
const _settingsCache = {};

async function getSetting(key, def=null) {
  try {
  if (_settingsCache[key] !== undefined) return _settingsCache[key];
  const val = await sbGetSetting(key, def);
  _settingsCache[key] = val !== null ? val : def;
  return _settingsCache[key];
  } catch(_e) { console.error("[SG] getSetting:", _e); }
}

async function setSetting(key, val) {
  try {
  _settingsCache[key] = val;
  await sbSetSetting(key, val).catch(e => console.error('setSetting fail ['+key+']:', e));
  } catch(_e) { console.error("[SG] setSetting:", _e); }
}

// ============================================================
//  REMAINING MODULES — Supabase via sg_settings + localStorage dual-write
//  Strategy: Write to BOTH localStorage + Supabase sg_settings table
//  so data is available on all devices
// ============================================================

function _sbSync(key, val) {
  // Dual-write: localStorage + Supabase sg_settings
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  sbSetSetting(key, val).catch(()=>{});
}

async function _sbLoad(key, def) {
  try {
  // Try Supabase first, then localStorage
  try {
    const v = await sbGetSetting(key, null);
    if (v !== null) { try { localStorage.setItem(key, JSON.stringify(v)); } catch(e) {} return v; }
  } catch(e) {}
  try { const l = localStorage.getItem(key); if(l) return JSON.parse(l); } catch(e) {}
  return def;
  } catch(_e) { console.error("[SG] _sbLoad:", _e); }
}

// ============================================================
//  SUPPORT — Tickets, WebChats, Complaints
// ============================================================
function getTickets() {
  try { return JSON.parse(localStorage.getItem('sg_tickets')||'[]'); } catch(e) { return []; }
}
function setTickets(t) {
  try { _sbSync('sg_tickets', t);
  } catch(_e) { console.error("[SG] setTickets:", _e); }
}

function getWebChats() {
  try { return JSON.parse(localStorage.getItem('sg_webchats')||'{}'); } catch(e) { return {}; }
}
function setWebChats(d) {
  try { _sbSync('sg_webchats', d);
  } catch(_e) { console.error("[SG] setWebChats:", _e); }
}

// ============================================================
//  HR — Attendance, Leaves, Schedule, Tasks, Swaps, Delegations
// ============================================================
function getAttendance() {
  try { return JSON.parse(localStorage.getItem('sg_attendance')||'[]'); } catch(e) { return []; }
}
function saveAttendance(d) {
  try { _sbSync('sg_attendance', d);
  } catch(_e) { console.error("[SG] saveAttendance:", _e); }
}

function getTasks() {
  try { return JSON.parse(localStorage.getItem('sg_tasks')||'[]'); } catch(e) { return []; }
}
function saveTasks(arr) {
  try { _sbSync('sg_tasks', arr);
  } catch(_e) { console.error("[SG] saveTasks:", _e); }
}

function getShiftTypes() {
  try { return JSON.parse(localStorage.getItem('sg_shift_types')||'[]'); } catch(e) { return []; }
}
function saveShiftTypes(d) {
  try { _sbSync('sg_shift_types', d);
  } catch(_e) { console.error("[SG] saveShiftTypes:", _e); }
}

function getSchedule() {
  try { return JSON.parse(localStorage.getItem('sg_schedule')||'[]'); } catch(e) { return []; }
}
function saveSchedule(d) {
  try { _sbSync('sg_schedule', d);
  } catch(_e) { console.error("[SG] saveSchedule:", _e); }
}

function getLeaveRequests() {
  try { return JSON.parse(localStorage.getItem('sg_leaves')||'[]'); } catch(e) { return []; }
}
function saveLeaveRequests(d) {
  try { _sbSync('sg_leaves', d);
  } catch(_e) { console.error("[SG] saveLeaveRequests:", _e); }
}

function getSwapRequests() {
  try { return JSON.parse(localStorage.getItem('sg_swaps')||'[]'); } catch(e) { return []; }
}
function saveSwapRequests(d) {
  try { _sbSync('sg_swaps', d);
  } catch(_e) { console.error("[SG] saveSwapRequests:", _e); }
}

// ============================================================
//  DELIVERY & ASSIGNMENTS
// ============================================================
function getDeliveryBoys() {
  try { return JSON.parse(localStorage.getItem('sg_delivery_boys')||'[]'); } catch(e) { return []; }
}
function setDeliveryBoys(d) {
  try { _sbSync('sg_delivery_boys', d);
  } catch(_e) { console.error("[SG] setDeliveryBoys:", _e); }
}

function getOrderAssignments() {
  try { return JSON.parse(localStorage.getItem('sg_order_assignments')||'{}'); } catch(e) { return {}; }
}
function setOrderAssignments(d) {
  try { _sbSync('sg_order_assignments', d);
  } catch(_e) { console.error("[SG] setOrderAssignments:", _e); }
}

// ============================================================
//  FINANCE — Expenses, Budgets
// ============================================================
function getBudgets() {
  try { return JSON.parse(localStorage.getItem('sg_budgets')||'[]'); } catch(e) { return []; }
}
function saveBudgets(d) {
  try { _sbSync('sg_budgets', d);
  } catch(_e) { console.error("[SG] saveBudgets:", _e); }
}

function getExpenses() {
  try { return JSON.parse(localStorage.getItem('sg_expenses')||'[]'); } catch(e) { return []; }
}
function saveExpenses(d) {
  try { _sbSync('sg_expenses', d);
  } catch(_e) { console.error("[SG] saveExpenses:", _e); }
}

// ============================================================
//  CLASSIFICATIONS & DELEGATIONS
// ============================================================
function saveClassifications(cl) {
  try { _sbSync('sg_classifications', cl);
  } catch(_e) { console.error("[SG] saveClassifications:", _e); }
}

// ============================================================
//  STAFF — Supabase Helper Functions
// ============================================================
async function sbGetStaff() {
  try {
    const { data, error } = await _supabase.from('sg_staff').select('*');
    if (error) { console.warn('sg_staff table:', error.message); return null; }
    return data || [];
  } catch(e) { return null; }
}
async function sbUpsertStaff(s) {
  try { await _supabase.from('sg_staff').upsert([s], {onConflict:'id'}); } catch(e) {}
}
async function sbSaveAllStaff(arr) {
  try { await _supabase.from('sg_staff').upsert(arr, {onConflict:'id'}); } catch(e) {}
}
async function sbDeleteStaff(id) {
  try { await _supabase.from('sg_staff').delete().eq('id', id); } catch(e) {}
}

// ============================================================
//  TABLES & RESERVATIONS — Supabase Helper Functions
// ============================================================
async function sbGetTables() {
  try {
    const { data, error } = await _supabase.from('sg_tables').select('*');
    if (error) { console.warn('sg_tables:', error.message); return null; }
    return data || [];
  } catch(e) { return null; }
}
async function sbSaveAllTables(arr) {
  try { await _supabase.from('sg_tables').upsert(arr, {onConflict:'id'}); } catch(e) {}
}
async function sbGetReservations() {
  try {
    const { data, error } = await _supabase.from('tbl_reservations').select('*').order('created_at', {ascending:false});
    if (error) { console.warn('tbl_reservations:', error.message); return null; }
    return data || [];
  } catch(e) { return null; }
}
async function sbSaveAllReservations(arr) {
  try { await _supabase.from('tbl_reservations').upsert(arr, {onConflict:'id'}); } catch(e) {}
}
async function sbUpsertReservation(r) {
  try { await _supabase.from('tbl_reservations').upsert([r], {onConflict:'id'}); } catch(e) {}
}
async function sbDeleteReservation(id) {
  try { await _supabase.from('tbl_reservations').delete().eq('id', id); } catch(e) {}
}

// ============================================================
//  GENERIC localStorage FALLBACK HELPER
// ============================================================
// For any remaining localStorage key — reads from Supabase sg_settings first
async function lsGet(key, def=[]) {
  try {
  // Check in-memory cache first
  if (_settingsCache[key] !== undefined) return _settingsCache[key];
  // Try localStorage
  try {
    const local = localStorage.getItem(key);
    if (local) { const v = JSON.parse(local); _settingsCache[key]=v; return v; }
  } catch(e) {}
  return def;
  } catch(_e) { console.error("[SG] lsGet:", _e); }
}
function lsSet(key, val) {
  try {
  _settingsCache[key] = val;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  // Also persist to sg_settings for cross-device sync
  sbSetSetting(key, val).catch(()=>{});
  } catch(_e) { console.error("[SG] lsSet:", _e); }
}

// ============================================================
//  MENU REALTIME
// ============================================================
async function subscribeMenuRealtime() {
  try {
  _supabase
    .channel('menu-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async () => {
      const fresh = await sbGetMenuItems();
      if (fresh && fresh.length) {
        menuItems = fresh;
        // Re-merge liquor items
        const _liq = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
        if(_liq.length) {
          const _ids = new Set(menuItems.map(i=>String(i.id)));
          _liq.forEach(li=>{ if(!_ids.has(String(li.id))) menuItems.push(li); });
        }
      }
      try { renderMenu(); } catch(e) {}
      try { renderMenuMgmt(); } catch(e) {}
    })
    .subscribe();
  } catch(_e) { console.error("[SG] subscribeMenuRealtime:", _e); }
}

// ============================================================
//  CUSTOMERS — Supabase Helper Functions
// ============================================================

async function sbGetCustomers() {
  try {
    const { data, error } = await _supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10000);
    if (error) { console.error('sbGetCustomers error:', error); return []; }
    return data || [];
  } catch(e) { console.error('sbGetCustomers exception:', e); return []; }
}

async function sbUpsertCustomer(customer) {
  try {
    // Sirf valid Supabase columns bhejo
    const joinedDate = customer.joinedAt || customer.joined_at || customer.joined || customer.createdAt || '';
    const clean = {
      mobile:   customer.mobile || '',
      name:     customer.name || '',
      email:    customer.email || '',
      address:  customer.address || '',
      orders:   parseInt(customer.orders || customer.totalOrders || 0),
      spent:    parseFloat(customer.spent || customer.totalSpent || 0),
      blocked:  customer.blocked || false,
      status:   customer.status || 'Active',
      imported: customer.imported || false,
      joinedAt: joinedDate,
      joined:   joinedDate,
    };
    if (customer.id && !String(customer.id).startsWith('CUST_')) clean.id = customer.id;
    const { data, error } = await _supabase
      .from('customers')
      .upsert([clean], { onConflict: 'mobile' })
      .select();
    if (error) { console.error('sbUpsertCustomer error:', error); return null; }
    return data?.[0] || null;
  } catch(e) { console.error('sbUpsertCustomer exception:', e); return null; }
}

async function sbUpdateCustomer(mobile, updates) {
  try {
    const { data, error } = await _supabase
      .from('customers')
      .update(updates)
      .eq('mobile', mobile)
      .select();
    if (error) { console.error('sbUpdateCustomer error:', error); return null; }
    return data?.[0] || null;
  } catch(e) { console.error('sbUpdateCustomer exception:', e); return null; }
}

// ============================================================
//  CUSTOMER ACCOUNTS — Supabase Helper Functions
// ============================================================

async function sbGetCustAccounts() {
  try {
    const { data, error } = await _supabase
      .from('cust_accounts')
      .select('*');
    if (error) {
      console.warn('cust_accounts table may not exist yet:', error.message);
      return [];
    }
    return data || [];
  } catch(e) { console.error('sbGetCustAccounts exception:', e); return []; }
}

async function sbUpsertCustAccount(account) {
  try {
    const { data, error } = await _supabase
      .from('cust_accounts')
      .upsert([account], { onConflict: 'mobile' })
      .select();
    if (error) { console.error('sbUpsertCustAccount error:', error); return null; }
    return data?.[0] || null;
  } catch(e) { console.error('sbUpsertCustAccount exception:', e); return null; }
}

async function sbUpdateCustAccount(mobile, updates) {
  try {
    const { data, error } = await _supabase
      .from('cust_accounts')
      .update(updates)
      .eq('mobile', mobile)
      .select();
    if (error) { console.error('sbUpdateCustAccount error:', error); return null; }
    return data?.[0] || null;
  } catch(e) { console.error('sbUpdateCustAccount exception:', e); return null; }
}

// In-memory cache for customer accounts (loaded on demand)
let _custAccountsCache = null;
async function getCustAccountsCached() {
  try {
  if (!_custAccountsCache) _custAccountsCache = await sbGetCustAccounts();
  return _custAccountsCache;
  } catch(_e) { console.error("[SG] getCustAccountsCached:", _e); }
}
function invalidateCustAccountsCache() {
  try { _custAccountsCache = null;
  } catch(_e) { console.error("[SG] invalidateCustAccountsCache:", _e); }
}

// ============================================================
//  CUSTOMER SESSION — keep in localStorage (device-local)
// ============================================================
// Extra Bug #5 fix: yahan ek async getCustSession() thi jo baad wali sync
// definition se override ho jaati thi (dead). Ek-maatra caller ise sync treat
// karta hai, isliye async version hata di.

// Start realtime subscription when page loads
window._dataReady = false;
window.addEventListener('DOMContentLoaded', async () => {
  // Load all settings from Supabase into cache first
  try {
    const { data: settingsRows } = await _supabase.from('sg_settings').select('key,value');
    if (settingsRows) {
      settingsRows.forEach(row => {
        try { _settingsCache[row.key] = JSON.parse(row.value); }
        catch(e) { _settingsCache[row.key] = row.value; }
      });
    }
  } catch(e) { console.warn('Settings load failed:', e); }

  // Load orders + customers + menu + tickets from Supabase on startup
  try {
    // Egress+privacy fix: orders/customers (badi + sensitive tables) sirf
    // admin/staff session hone pe fetch karo. Customer (jo sirf menu dekhta hai)
    // ke liye skip — na saari orders download hongi, na sabka personal data leak.
    const _isStaff = !!sessionStorage.getItem('sg_session');
    const [o, c, m, gst, cats, sbStaff, sbTables, sbRes] = await Promise.all([
      _isStaff ? sbGetOrders() : Promise.resolve([]),
      _isStaff ? sbGetCustomers() : Promise.resolve([]),
      sbGetMenuItems(), sbGetGST(), sbGetCategories(),
      sbGetStaff(), sbGetTables(), sbGetReservations()
    ]);
    orders = o;
    customers = c;
    if (m && m.length) menuItems = m;
    // Merge in locally-saved liquor items (not in Supabase)
    const _liquorLocal = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
    if(_liquorLocal.length) {
      const _existIds = new Set(menuItems.map(i=>String(i.id)));
      _liquorLocal.forEach(li=>{ if(!_existIds.has(String(li.id))) menuItems.push(li); });
    }
    // Merge in locally-saved combo items
    const _comboLocal = JSON.parse(localStorage.getItem('sg_combo_items')||'[]');
    if(_comboLocal.length) {
      const _existIds2 = new Set(menuItems.map(i=>String(i.id)));
      _comboLocal.forEach(ci=>{ if(!_existIds2.has(String(ci.id))) menuItems.push(ci); });
    }
    _gstRateCache = gst;
    // Restore excise duty rate in input
    const excInput = document.getElementById('exciseDutyInput');
    if(excInput) excInput.value = _exciseDutyCache;
    // Restore liquor delivery setting
    const liqDel = document.getElementById('liquorDeliveryToggle');
    if(liqDel) liqDel.value = _liquorDeliverySetting;
    if (cats && cats.length) _catsCache = cats;
    // Staff
    if (sbStaff && sbStaff.length) {
      staff = sbStaff;
      localStorage.setItem('sg_staff', JSON.stringify(staff));
    }
    // Tables
    if (sbTables && sbTables.length) localStorage.setItem('sg_tables', JSON.stringify(sbTables));
    // Reservations
    if (sbRes && sbRes.length) localStorage.setItem('tbl_reservations', JSON.stringify(sbRes));
    try { updateStats(); } catch(e) {}
    try { updatePendingBadge(); } catch(e) {}
  } catch(e) { console.error('Initial data load failed:', e); }

  // Load tickets (complaints/inquiries/omnichannel) from Supabase
  try {
    const freshTickets = await sbGetSetting('sg_tickets', null);
    if(freshTickets && Array.isArray(freshTickets)) {
      localStorage.setItem('sg_tickets', JSON.stringify(freshTickets));
    }
  } catch(e) { console.warn('Tickets load failed:', e); }

  // Load webchats for omnichannel inbox
  try {
    const freshChats = await sbGetSetting('sg_webchats', null);
    if(freshChats) {
      localStorage.setItem('sg_webchats', JSON.stringify(freshChats));
    }
  } catch(e) { console.warn('Webchats load failed:', e); }

  window._dataReady = true;
  subscribeMenuRealtime();
  // orders/customers realtime sirf logged-in admin/staff ke liye
  if(sessionStorage.getItem('sg_session')) {
    window._staffRTOn = true;
    subscribeOrdersRealtime();
    subscribeCustomersRealtime();
  }
  // Auto-waste for expired Company Products
  setTimeout(autoExpireCompanyProducts, 3000);
});