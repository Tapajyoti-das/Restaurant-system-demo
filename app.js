
// ===== DATA =====
const defaultMenuItems = [
  {id:1,name:"Butter Chicken",desc:"Creamy tomato-based curry with tender chicken",price:320,emoji:"🍛",type:"Non-Veg",cat:"Main Course",image:null,startTime:"00:00",endTime:"23:59",available:true},
  {id:2,name:"Paneer Tikka",desc:"Marinated cottage cheese grilled to perfection",price:260,emoji:"🧀",type:"Veg",cat:"Starters",image:null,startTime:"00:00",endTime:"23:59",available:true},
  {id:3,name:"Dal Makhani",desc:"Black lentils slow-cooked overnight in spices",price:220,emoji:"🫘",type:"Veg",cat:"Main Course",image:null,startTime:"00:00",endTime:"23:59",available:true},
  {id:4,name:"Biryani",desc:"Aromatic basmati rice with saffron and spices",price:350,emoji:"🍚",type:"Non-Veg",cat:"Rice",image:null,startTime:"00:00",endTime:"23:59",available:true},
  {id:5,name:"Garlic Naan",desc:"Soft bread topped with garlic and butter",price:60,emoji:"🫓",type:"Veg",cat:"Breads",image:null,startTime:"00:00",endTime:"23:59",available:true},
  {id:6,name:"Mango Lassi",desc:"Sweet yogurt drink with fresh Alphonso mango",price:120,emoji:"🥭",type:"Veg",cat:"Drinks",image:null,startTime:"00:00",endTime:"23:59",available:true},
  {id:7,name:"Gulab Jamun",desc:"Soft milk dumplings in rose-flavored syrup",price:90,emoji:"🍮",type:"Veg",cat:"Desserts",image:null,startTime:"00:00",endTime:"23:59",available:true},
  {id:8,name:"Chicken Tikka",desc:"Tandoor-grilled chicken with mint chutney",price:290,emoji:"🍗",type:"Non-Veg",cat:"Starters",image:null,startTime:"00:00",endTime:"23:59",available:true},
];

function getMenuItems() {
  // Returns in-memory menuItems (loaded from Supabase on startup)
  return menuItems;
}
async function saveMenuItems(items) {
  try {
  menuItems = items;
  // Upsert all items to Supabase
  for (const item of items) {
    await sbUpsertMenuItem(item).catch(e => console.error('saveMenuItems upsert fail:', e));
  }
  } catch(_e) { console.error("[SG] saveMenuItems:", _e); }
}
function getGSTRate() { return _gstRateCache; }
let menuItems = defaultMenuItems; // Will be overwritten from Supabase on load

// Granular permissions with categories
const allPerms = [
  // View Orders
  "View Orders - Basic",
  "View Orders - Mobile",
  "View Orders - Email",
  // Update Order Status
  "Status - Pending",
  "Status - Confirmed",
  "Status - Preparing",
  "Status - Ready",
  "Status - Delivered",
  "Status - Cancelled",
  // Customers
  "View Customers",
  "View Customers - Mobile",
  "View Customers - Email",
  // Orders management
  "Delete Orders",
  // Menu Management
  "Menu - Change Image",
  "Menu - Edit Dish Name",
  "Menu - Edit Description",
  "Menu - Edit Emoji",
  "Menu - Edit Price",
  "Menu - Edit Category",
  "Menu - Edit Type",
  "Menu - Edit Timing",
  "Menu - Edit Available Days",
  "Menu - Remove Dish",
  "Menu - Delete Dish",
  // Staff
  "Staff - View",
  "Staff - Add",
  "Staff - Remove",
  "Staff - Edit Permissions",
  "Staff - Approve/Reject",
  // Tables
  "Tables - View",
  "Tables - Manage Setup",
  "Tables - Take Order",
  "Tables - Billing",
  "Tables - Reservations",
  "Tables - Reports",
  // Tables
  "Tables - View",
  "Tables - Manage Setup",
  "Tables - Take Order",
  "Tables - Update Status",
  "Tables - Generate Bill",
  "Tables - Reservations",
  // Tables
  "Tables - View",
  "Tables - Manage Setup",
  "Tables - Take Order",
  "Tables - Transfer/Merge",
  "Tables - Generate Bill",
  "Tables - Reservations",
  // Table Management
  "Table - View",
  "Table - Manage Setup",
  "Table - Take Order",
  "Table - Billing",
  "Table - Reservations",
  "Table - Transfer/Merge",
  "Table - Reports",
  "Table - Set Charges",
  // KDS
  "KDS - View",
  "KDS - Update Status",
  "KDS - Edit Order",
  // Inventory
  "Inventory - View",
  "Inventory - Manage Vendors",
  "Inventory - Add Purchase",
  "Inventory - Manage Stock",
  "Inventory - Waste Entry",
  "Inventory - View Reports",
  // Orders assignment
  "Orders - Assign",
  "Orders - Delivery Assign",
];

// Permission groups for display
const permGroups = [
  { label:"👁️ View Orders", perms:["View Orders - Basic","View Orders - Mobile","View Orders - Email"] },
  { label:"🔄 Update Order Status", perms:[
    "Status - Pending - Home Delivery","Status - Pending - Takeaway","Status - Pending - Dine-In",
    "Status - Confirmed - Home Delivery","Status - Confirmed - Takeaway","Status - Confirmed - Dine-In",
    "Status - Preparing - Home Delivery","Status - Preparing - Takeaway","Status - Preparing - Dine-In",
    "Status - Ready - Home Delivery","Status - Ready - Takeaway","Status - Ready - Dine-In",
    "Status - Delivered - Home Delivery","Status - Delivered - Takeaway","Status - Delivered - Dine-In",
    "Status - Cancelled - Home Delivery","Status - Cancelled - Takeaway","Status - Cancelled - Dine-In"
  ], nested:true },
  { label:"👥 Customers", perms:["View Customers","View Customers - Mobile","View Customers - Email"] },
  { label:"🗑️ Orders", perms:["Delete Orders"] },
  { label:"🍽️ Menu Management", perms:["Menu - Change Image","Menu - Edit Dish Name","Menu - Edit Description","Menu - Edit Emoji","Menu - Edit Price","Menu - Edit Category","Menu - Edit Type","Menu - Edit Timing","Menu - Edit Available Days","Menu - Remove Dish","Menu - Delete Dish"] },
  { label:"👨‍💼 Staff", perms:["Staff - View","Staff - Add","Staff - Remove","Staff - Edit Permissions","Staff - Approve/Reject"] },
  { label:"🖥️ Kitchen Display (KDS)", perms:["KDS - View","KDS - Update Status","KDS - Edit Order"] },
  { label:"📦 Inventory", perms:["Inventory - View","Inventory - Manage Vendors","Inventory - Add Purchase","Inventory - Manage Stock","Inventory - Waste Entry","Inventory - View Reports"] },
  { label:"🪑 Table Management", perms:["Table - View","Table - Manage Setup","Table - Take Order","Table - Billing","Table - Reservations","Table - Transfer/Merge","Table - Reports","Table - Set Charges"] },
  { label:"📋 Order Assignment", perms:["Orders - Assign","Orders - Delivery Assign"] },
  { label:"📊 KPI Dashboard", perms:["KPI - View","KPI - Set Targets"] },
  { label:"🗓️ Staff Scheduling", perms:["Schedule - View","Schedule - Manage"] },
  { label:"💰 Budget Control", perms:["Budget - View","Budget - Manage"] },
  { label:"📋 Auto Reports", perms:["Reports - View","Reports - Export"] },
];

let cart = {};
let orders = []; // Loaded from Supabase async
let customers = []; // Loaded from Supabase async
let staff = JSON.parse(localStorage.getItem('sg_staff')||JSON.stringify([
  {id:'s1',name:'Ravi Kumar',username:'staff1',password:'staff123',role:'Kitchen Staff',color:'#e74c3c',perms:["View Orders - Basic","Status - Confirmed","Status - Preparing","Status - Ready"]},
  {id:'s2',name:'Priya Sharma',username:'staff2',password:'staff123',role:'Delivery Staff',color:'#3498db',perms:["View Orders - Basic","View Orders - Mobile","Status - Ready","Status - Delivered","View Customers"]},
])); // Will be overwritten from Supabase on load

const users = {
  admin:{name:'Admin (Full Access)',role:'Admin',perms:allPerms},
};
// dynamic staff users
let currentUser = null;

function getUsers() {
  const u = {...users};
  staff.forEach(s => u[s.username]={name:s.name,role:s.role,perms:s.perms,password:s.password});
  return u;
}

// ===== PAGE NAVIGATION =====
function showPage(p) {
  try {
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(x=>x.classList.remove('active'));
  const pg = document.getElementById(p+'Page');
  if(pg) pg.classList.add('active');
  const navEl = document.getElementById('nav'+p.charAt(0).toUpperCase()+p.slice(1));
  if(navEl) navEl.classList.add('active');
  if(p==='menu') renderMenu();
  if(p==='order') renderCart();
  if(p==='myorders') renderMyOrders();
  } catch(e) { console.error("[SG] showPage error:", e); }
}

// ===== MENU =====
function renderMenu() {
  try {
  menuItems = getMenuItems();
  const gst = getGSTRate();
  const g = document.getElementById('menuGrid');
  if(!g) return;
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayName = dayNames[new Date().getDay()];
  // Apply tab filter
  let availableItems = menuItems.filter(item => isItemAvailableNow(item));
  if(_custMenuTab === 'liquor') {
    availableItems = availableItems.filter(i => i.isLiquor === true);
  } else if(_custMenuTab === 'combo') {
    availableItems = availableItems.filter(i => i.isCombo === true);
  } else if(_custMenuTab === 'food') {
    availableItems = availableItems.filter(i => !i.isLiquor && !i.isCombo);
  }
  // _custMenuTab === 'all' shows everything
  const totalItems = menuItems.filter(item => item.available !== false).length;
  const hiddenCount = totalItems - availableItems.length;

  // Show today's day banner if some items are hidden
  const banner = document.getElementById('todayMenuBanner');
  if(banner) {
    if(hiddenCount > 0) {
      banner.innerHTML = `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:0.83rem;display:flex;align-items:center;gap:8px;">
        📅 <b>Today's ${todayName} menu</b> — ${hiddenCount} dish${hiddenCount>1?'es':''} not available today.
      </div>`;
    } else {
      banner.innerHTML = `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:0.83rem;display:flex;align-items:center;gap:8px;">
        ✅ <b>Full menu available today (${todayName})!</b>
      </div>`;
    }
  }

  if(!availableItems.length) {
    g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);"><div style="font-size:3rem;margin-bottom:12px;">🍽️</div><p>No dishes available today. Please check back laterin!</p></div>';
    return;
  }
  g.innerHTML = availableItems.map(item=>{
    const isBestSeller = item.bestSeller === true;
    const hasSizes = !item.isCombo && item.sizes && item.sizes.length > 1;
    const gstAmt = item.isLiquor ? 0 : parseFloat((item.price*gst/100).toFixed(2));
    const total  = item.price + gstAmt;

    // Size buttons for multi-size food & liquor items
    // Liquor: koi tax display mein add nahi hota (bill mein bhi charge nahi hota)
    const taxRate = item.isLiquor ? 0 : gst;
    const taxLbl  = item.isLiquor ? '' : 'GST';
    const sizeBtns = hasSizes ? `
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
        ${item.sizes.map(s => {
          const sTotal = fmtPrice(s.price + s.price*taxRate/100);
          const col = s.label==='Large'?'#1b5e20':s.label==='Medium'?'#e65100':'#c62828';
          const icon = s.label==='Large'?'🟢':s.label==='Medium'?'🟡':'🔴';
          return `<button id="szBtn-${item.id}-${s.label}"
            onclick="selectItemSize('${item.id}','${s.label}',${s.price})"
            style="flex:1;padding:6px 4px;border:2px solid ${col};border-radius:8px;background:#fff;color:${col};font-size:0.75rem;font-weight:700;cursor:pointer;transition:all 0.15s;">
            ${icon} ${s.label}<br><span style="font-size:0.82rem;">₹${sTotal}</span>
          </button>`;
        }).join('')}
      </div>` : '';

    return `
    <div class="menu-card" data-name="${(item.name||'').toLowerCase()}" data-type="${item.type}" data-cat="${(item.cat||'').toLowerCase()}" data-bestseller="${isBestSeller}">
      <div class="menu-card-img" style="${item.image?'padding:0;':''}position:relative;">
        ${item.image ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;border-radius:0;">` : item.emoji}
        ${isBestSeller ? `<div style="position:absolute;top:8px;left:8px;background:var(--gold);color:#fff;font-size:0.68rem;font-weight:800;padding:3px 8px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.2);">⭐ Best Seller</div>` : ''}
      </div>
      <div class="menu-card-body">
        <div class="menu-card-footer" style="margin-bottom:4px;">
          <h3>${item.name}</h3>
          <span class="${item.type==='Veg'?'badge-veg':'badge-nonveg'}">${item.type==='Veg'?'🟢':'🔴'} ${item.type}</span>
        </div>
        <p>${item.desc}</p>
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px;">${item.cat}</div>
        ${sizeBtns}
        <div class="menu-card-footer">
          <div>
            <span class="price" id="dispPrice-${item.id}">₹${fmtPrice(total)}</span>
            <br><span style="font-size:0.7rem;color:var(--muted);" id="dispTax-${item.id}">${item.isLiquor ? '(No tax)' : '₹'+item.price+' + '+gst+'% GST'}</span>
          </div>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
            <span id="qty-${item.id}">${Object.keys(cart).filter(k=>k.startsWith(item.id+'__')).reduce((s,k)=>s+(cart[k]||0),0) || cart[item.id]||0}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
  if(menuTypeFilter && menuTypeFilter !== 'all') filterMenu();
  const searchVal = document.getElementById('menuSearchInput')?.value;
  if(searchVal) filterMenu();
  // Restore size button highlights for items already in cart
  Object.keys(cart).forEach(key => {
    if(!key.includes('__')) return;
    const parts  = key.split('__');
    const itemId = parts[0];
    const sizeLbl= parts[1];
    if(cart[key] > 0) selectItemSize(itemId, sizeLbl, 0);
  });
  } catch(e) { console.error("[SG] renderMenu error:", e); }
}


// ===== LIQUOR DELIVERY SETTING =====
let _liquorDeliverySetting = localStorage.getItem('sg_liquor_delivery') || 'allowed';

function getLiquorDeliverySetting() { return _liquorDeliverySetting; }

function saveLiquorDeliverySetting() {
  try {
  const val = document.getElementById('liquorDeliveryToggle').value;
  _liquorDeliverySetting = val;
  localStorage.setItem('sg_liquor_delivery', val);
  const msg = document.getElementById('liquorDeliverySavedMsg');
  if(msg) {
    msg.textContent = val === 'restricted'
      ? '🚫 Liquor delivery restricted!'
      : '✅ Liquor delivery allowed!';
    msg.style.color = val === 'restricted' ? '#c62828' : '#2e7d32';
    msg.style.display = 'inline';
    setTimeout(() => msg.style.display = 'none', 2500);
  }
  } catch(e) { console.error('[SG] saveLiquorDeliverySetting:', e); }
}

// Extra Bug #5 fix: yahan ek purana cartHasLiquor() tha jo comboDishIds handle
// nahi karta tha aur baad wali (itemHasLiquor-based) definition se override ho
// jaata tha — dead duplicate. Hata diya. Neeche wala version hi use hota hai.

function itemHasLiquor(item) {
  if(!item) return false;
  if(item.isLiquor) return true;
  if(item.isCombo) {
    if(item.comboDishes && item.comboDishes.some(d => d.isLiquor)) return true;
    if(item.comboDishIds) return menuItems.some(m => item.comboDishIds.includes(String(m.id)) && m.isLiquor);
  }
  return false;
}

function cartHasLiquor() {
  return Object.keys(cart).some(id => {
    const item = menuItems.find(m => String(m.id) === String(id));
    return itemHasLiquor(item);
  });
}


const _selectedSizes = {};

function selectItemSize(itemId, sizeLabel, sizePrice) {
  // Update button styles
  const item = menuItems.find(m=>String(m.id)===String(itemId));
  if(!item || !item.sizes) return;
  item.sizes.forEach(s => {
    const btn = document.getElementById('szBtn-'+itemId+'-'+s.label);
    if(!btn) return;
    const col = s.label==='Large'?'#1b5e20':s.label==='Medium'?'#e65100':'#c62828';
    if(s.label === sizeLabel) {
      btn.style.background = col;
      btn.style.color = '#fff';
      btn.style.transform = 'scale(1.05)';
    } else {
      btn.style.background = '#fff';
      btn.style.color = col;
      btn.style.transform = 'scale(1)';
    }
  });
  // Update displayed price (liquor: no tax added — bill se match kare)
  const selRate2 = item.isLiquor ? 0 : getGSTRate();
  const sTotal   = fmtPrice(sizePrice + sizePrice * selRate2 / 100);
  const priceEl  = document.getElementById('dispPrice-'+itemId);
  const taxEl   = document.getElementById('dispTax-'+itemId);
  if(priceEl) priceEl.textContent = '₹' + sTotal;
  if(taxEl) taxEl.textContent = item.isLiquor ? '(No tax)' : ('₹' + sizePrice + ' + ' + getGSTRate() + '% GST');
  // Store selected size in global dict
  _selectedSizes[String(itemId)] = sizeLabel;
  item._selectedSize = sizeLabel;
  item._selectedPrice = sizePrice;
}

function changeQty(id, d) {
  try {
  const item = menuItems.find(m => String(m.id) === String(id));

  // Handle multi-size items (food & liquor) for both + and -
  if(item && !item.isCombo && item.sizes && item.sizes.length > 1) {
    if(d > 0 && item.isLiquor && getLiquorDeliverySetting() === 'restricted') {
      showLiquorOrderOptions(id, item); return;
    }
    const sel     = _selectedSizes[String(item.id)] || item.sizes[0].label;
    const selSize = item.sizes.find(s=>s.label===sel) || item.sizes[0];
    const cartKey = item.id + '__' + selSize.label;
    cart[cartKey] = Math.max(0,(cart[cartKey]||0)+d);
    if(cart[cartKey]===0) delete cart[cartKey];
    const el = document.getElementById('qty-'+item.id);
    if(el) el.textContent = Object.keys(cart).filter(k=>k.startsWith(item.id+'__')).reduce((s,k)=>s+(cart[k]||0),0);
    selectItemSize(String(item.id), selSize.label, selSize.price);
    updateCartBadge();
    return;
  }

  if(d > 0) {
    // Liquor check for single-size liquor items
    if(getLiquorDeliverySetting() === 'restricted' && itemHasLiquor(item)) {
      showLiquorOrderOptions(id, item); return;
    }
    // Size selector for combos only
    if(item && item.isCombo && item.hasSizes && item.sizes && item.sizes.length > 0) {
      showSizeSelector(id, item); return;
    }
  }

  cart[id] = Math.max(0,(cart[id]||0)+d);
  if(cart[id]===0) delete cart[id];
  const el = document.getElementById('qty-'+id);
  if(el) el.textContent = cart[id]||0;
  updateCartBadge();
  } catch(_e) { console.error('[SG] changeQty:', _e); }
}


// ===== LIQUOR KEYWORDS FOR SPECIAL INSTRUCTIONS =====
const LIQUOR_KEYWORDS = [
  'beer','wine','whisky','whiskey','rum','vodka','gin','brandy','champagne',
  'tequila','bourbon','scotch','alcohol','liquor','booze','shot','cocktail',
  'peg','kingfisher','old monk','bacardi','jack daniel','johnnie walker',
  'corona','heineken','budweiser','carlsberg','tuborg','foster','bira',
  'haywards','royal stag','imperial blue','officer choice','mcdowell',
  'blenders pride','black label','red label','white rum','dark rum'
];

function isLiquorNote(text) {
  const lower = (text||'').toLowerCase();
  return LIQUOR_KEYWORDS.some(kw => lower.includes(kw));
}

function checkLiquorInNote(val) {
  const warn = document.getElementById('liquorNoteWarn');
  const orderType = document.getElementById('orderType')?.value || '';
  if(warn) {
    const show = getLiquorDeliverySetting()==='restricted' && orderType==='Home Delivery' && isLiquorNote(val);
    warn.style.display = show ? 'block' : 'none';
  }
}

function updateLiquorBanner() {
  const banner = document.getElementById('liquorHomeDeliveryBanner');
  const orderType = document.getElementById('orderType')?.value || '';
  if(banner) {
    banner.style.display = (getLiquorDeliverySetting()==='restricted' && orderType==='Home Delivery')
      ? 'block' : 'none';
  }
  const note = document.getElementById('custNote');
  if(note) checkLiquorInNote(note.value);
}


// ===== SIZE SELECTOR FOR CUSTOMER =====
function showSizeSelector(itemId, item) {
  const existing = document.getElementById('sizeSelectorPopup');
  if(existing) existing.remove();
  const gst = getGSTRate();
  const isLiquorItem = item.isLiquor === true;
  // Liquor: koi tax display nahi (bill mein bhi charge nahi hota)
  const dutyRate = isLiquorItem ? 0 : gst;
  const dutyLabel = isLiquorItem ? '' : `GST ${gst}%`;
  const popup = document.createElement('div');
  popup.id = 'sizeSelectorPopup';
  popup.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
  popup.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:24px;max-width:380px;width:100%;box-shadow:0 12px 48px rgba(0,0,0,0.25);">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:2rem;">${item.emoji||'🍽️'}</div>
        <div style="font-weight:800;font-size:1.05rem;margin-top:6px;">${item.name}</div>
        <div style="font-size:0.82rem;color:var(--muted);">Size choose karo:</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${item.sizes.map(s => {
          const total = fmtPrice(s.price + s.price * dutyRate / 100);
          return `<button onclick="addSizeToCart('${itemId}','${s.label}',${s.price})"
            style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;
            border:2px solid ${isLiquorItem?'#ce93d8':'#e8d5c8'};border-radius:10px;background:#fff;cursor:pointer;
            font-size:0.9rem;transition:all 0.15s;"
            onmouseover="this.style.borderColor='${isLiquorItem?'#4a148c':'var(--fire)'}';this.style.background='${isLiquorItem?'#f3e5f5':'#fff5f0'}'"
            onmouseout="this.style.borderColor='${isLiquorItem?'#ce93d8':'#e8d5c8'}';this.style.background='#fff'">
            <span style="font-weight:700;">📏 ${s.label}</span>
            <span>
              <span style="font-weight:800;color:${isLiquorItem?'#4a148c':'var(--fire)'};">₹${total}</span>
              ${isLiquorItem ? '' : `<span style="font-size:0.72rem;color:var(--muted);margin-left:4px;">(₹${s.price}+${dutyLabel})</span>`}
            </span>
          </button>`;
        }).join('')}
      </div>
      <button onclick="document.getElementById('sizeSelectorPopup').remove()"
        style="width:100%;margin-top:14px;padding:10px;border:none;border-radius:8px;background:#f5f5f5;color:#666;font-weight:700;cursor:pointer;">
        Cancel
      </button>
    </div>`;
  document.body.appendChild(popup);
  popup.addEventListener('click', e => { if(e.target===popup) popup.remove(); });
}

function addSizeToCart(itemId, sizeLabel, sizePrice) {
  // Use composite key: itemId__SizeLabel
  const cartKey = itemId + '__' + sizeLabel;
  cart[cartKey] = (cart[cartKey]||0) + 1;
  // Store size info for order
  if(!window._sizeCartMeta) window._sizeCartMeta = {};
  window._sizeCartMeta[cartKey] = { itemId, sizeLabel, sizePrice };
  // Update qty display (show total of all sizes)
  const allQty = Object.keys(cart).filter(k=>k.startsWith(itemId+'__')).reduce((s,k)=>s+cart[k],0);
  const el = document.getElementById('qty-'+itemId);
  if(el) el.textContent = allQty;
  document.getElementById('sizeSelectorPopup')?.remove();
  updateCartBadge();
  showToast('✅ ' + sizeLabel + ' added!');
}

function showLiquorOrderOptions(itemId, item) {
  const existing = document.getElementById('liquorOrderPopup');
  if(existing) existing.remove();

  // Get liquor dish names for combo
  let liquorNames = '';
  if(item.isCombo && item.comboDishes) {
    const liqDishes = item.comboDishes.filter(d => d.isLiquor).map(d => d.name);
    if(liqDishes.length) liquorNames = `<div style="font-size:0.8rem;color:#7b1fa2;background:#f3e5f5;border-radius:6px;padding:6px 10px;margin:8px 0;">
      🍾 Liquor included: <strong>${liqDishes.join(', ')}</strong>
    </div>`;
  }

  const popup = document.createElement('div');
  popup.id = 'liquorOrderPopup';
  popup.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);
    z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;`;

  popup.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:28px 24px;max-width:400px;width:100%;
      box-shadow:0 12px 48px rgba(0,0,0,0.3);text-align:center;border-top:5px solid #c62828;">
      <div style="font-size:2.2rem;margin-bottom:10px;">🍾</div>
      <div style="font-weight:800;font-size:1.05rem;color:#c62828;margin-bottom:6px;">Liquor Item Notice</div>
      <div style="font-size:0.88rem;color:#444;margin-bottom:4px;">
        <strong>${item.name}</strong>
      </div>
      ${liquorNames}
      <div style="font-size:0.83rem;color:#666;margin-bottom:20px;line-height:1.5;">
        ${item._noteAlert ? `<div style="background:#fff8e1;border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:0.8rem;color:#e65100;font-weight:600;">📝 ${item._noteAlert}</div>` : ''}
        Aapke state/region ke rules ke hisaab se<br>
        <strong style="color:#c62828;">liquor ki Home Delivery restricted hai.</strong><br>
        Neeche se order type choose karo:
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="document.getElementById('liquorOrderPopup').remove()"
          style="padding:12px;border-radius:10px;border:2px solid #e0e0e0;background:#f5f5f5;
          font-weight:700;cursor:pointer;font-size:0.9rem;color:#c62828;">
          🚫 Home Delivery — Restricted (Cancel)
        </button>
        <button onclick="chooseLiquorOrderType('Takeaway','${itemId}')"
          style="padding:12px;border-radius:10px;border:none;background:#e65100;
          color:#fff;font-weight:700;cursor:pointer;font-size:0.9rem;">
          🛵 Takeaway — Allow karo
        </button>
        <button onclick="chooseLiquorOrderType('Dine-In','${itemId}')"
          style="padding:12px;border-radius:10px;border:none;background:#1b5e20;
          color:#fff;font-weight:700;cursor:pointer;font-size:0.9rem;">
          🍽️ Dine-In — Allow karo
        </button>
      </div>
    </div>`;

  document.body.appendChild(popup);
  // Close on backdrop click
  popup.addEventListener('click', e => { if(e.target === popup) popup.remove(); });
}

function chooseLiquorOrderType(type, itemId) {
  try {
  const sel = document.getElementById('orderType');
  if(sel) { sel.value = type; handleOrderTypeChange(type); }
  const popup = document.getElementById('liquorOrderPopup');
  if(popup) popup.remove();

  if(itemId === '__note__') {
    // Note case: just switch order type, don't add to cart
    showToast('✅ Order type ' + type + ' set kiya. Ab order place karo!');
    return;
  }
  // Normal case: add item to cart with selected size if applicable
  const item = menuItems.find(m=>String(m.id)===String(itemId));
  if(item && !item.isCombo && item.sizes && item.sizes.length > 1) {
    const sel     = _selectedSizes[String(itemId)] || item.sizes[0].label;
    const selSize = item.sizes.find(s=>s.label===sel) || item.sizes[0];
    const cartKey = itemId + '__' + selSize.label;
    cart[cartKey] = (cart[cartKey]||0) + 1;
    const el = document.getElementById('qty-'+itemId);
    if(el) el.textContent = Object.keys(cart).filter(k=>k.startsWith(itemId+'__')).reduce((s,k)=>s+(cart[k]||0),0);
    selectItemSize(String(itemId), selSize.label, selSize.price);
  } else {
    cart[itemId] = (cart[itemId]||0) + 1;
    const el = document.getElementById('qty-'+itemId);
    if(el) el.textContent = cart[itemId];
  }
  updateCartBadge();
  showToast('✅ ' + type + ' order type set. Item cart mein add ho gaya!');
  } catch(e) { console.error('[SG] chooseLiquorOrderType:', e); }
}

function showLiquorDeliveryWarning() {
  showLiquorOrderOptions('', { name: 'Liquor Item', isLiquor: true, comboDishes: [] });
}

function getTotalCartCount() {
  return Object.values(cart).reduce((s,v)=>s+v,0);
}

function updateCartBadge() {
  try {
  const total = Object.keys(cart).length;
  const badge = document.getElementById('cartBadge');
  if(!badge) return;
  badge.textContent = total;
  if(total>0) badge.classList.add('visible');
  else badge.classList.remove('visible');
  } catch(e) { console.error("[SG] updateCartBadge error:", e); }
}

function renderCart() {
  try {
  // Resolve size cart entries into display items
  if(!window._sizeCartMeta) window._sizeCartMeta = {};
  // Show liquor restriction warning in cart if needed
  const cartWarn = document.getElementById('cartLiquorWarn');
  const orderTypeEl = document.getElementById('orderType');
  const currentType = orderTypeEl ? orderTypeEl.value : '';
  if(cartWarn) {
    if(currentType === 'Home Delivery' && getLiquorDeliverySetting() === 'restricted' && cartHasLiquor()) {
      cartWarn.style.display = 'block';
    } else {
      cartWarn.style.display = 'none';
    }
  }
  // Filter: if composite keys (id__Size) exist for an item, skip plain id entry
  const allKeys = Object.keys(cart);
  const itemsRaw = Object.entries(cart).filter(([id,qty]) => {
    if(!id.includes('__')) {
      // Check if any composite key exists for this item
      return !allKeys.some(k => k.startsWith(id+'__'));
    }
    return true;
  });
  const items = itemsRaw;
  const container = document.getElementById('cartItems');
  if(!items.length) {
    container.innerHTML='<p style="color:var(--muted);font-size:0.85rem;">No items added. Please go to Menu first.</p>';
    return;
  }
  const gstRate = getGSTRate();
  let html = '';

  // ── Step 1: Resolve each cart entry ──────────────────────────────
  let foodBaseTotal   = 0;                 // all food (singles + combo food)
  let liquorGroups    = {};                // { itemId_excRate: {name, total, excRate} }
  const displayRows   = [];               // rows to show in the cart

  items.forEach(([cartKey, qty]) => {
    const parts   = String(cartKey).split('__');
    const itemId  = parts[0];
    const sizeLbl = parts[1] || null;
    const item    = menuItems.find(m => String(m.id) === itemId);
    if(!item) return;

    let price = item.price;
    if(sizeLbl && item.sizes) { const sz = item.sizes.find(s=>s.label===sizeLbl); if(sz) price=sz.price; }
    const lineTotal = parseFloat((price * qty).toFixed(2));
    const sizeTag   = sizeLbl ? ' (' + sizeLbl + ')' : '';

    displayRows.push({ emoji: item.emoji||'🍽️', name: item.name, sizeTag, qty, lineTotal });

    if(item.isCombo) {
      // Decompose combo dishes into food & liquor
      let dishes = item.comboDishes || [];
      if(sizeLbl && item.sizes) {
        const sz = item.sizes.find(s=>s.label===sizeLbl);
        if(sz && sz.dishes) dishes = sz.dishes;
      }
      dishes.forEach(d => {
        const dTotal = parseFloat(((d.comboPrice||0)*(d.qty||1)*qty).toFixed(2));
        if(d.isLiquor) {
          // Lookup actual menu item excise rate for correct grouping
          const actualItem = menuItems.find(m=>String(m.id)===String(d.id));
          const excR = actualItem ? (actualItem.exciseDuty||actualItem.excisePct||0)
                                  : (d.dutyPct||d.exciseDuty||d.excisePct||0);
          const gKey  = String(d.id) + '_' + excR;
          if(!liquorGroups[gKey]) liquorGroups[gKey] = { name: d.name, total:0, excRate: excR };
          liquorGroups[gKey].total = parseFloat((liquorGroups[gKey].total + dTotal).toFixed(2));
        } else {
          foodBaseTotal = parseFloat((foodBaseTotal + dTotal).toFixed(2));
        }
      });
    } else if(item.isLiquor) {
      const excR  = item.exciseDuty || item.excisePct || 0;
      const gKey  = itemId + '_' + excR;
      if(!liquorGroups[gKey]) liquorGroups[gKey] = { name: item.name, total:0, excRate: excR };
      liquorGroups[gKey].total = parseFloat((liquorGroups[gKey].total + lineTotal).toFixed(2));
    } else {
      foodBaseTotal = parseFloat((foodBaseTotal + lineTotal).toFixed(2));
    }
  });

  // ── Step 2: Only GST on food, no excise ─────────────────────────
  const liquorBaseTotal = parseFloat(Object.values(liquorGroups).reduce((s,g)=>s+g.total,0).toFixed(2));
  const subtotal   = parseFloat((foodBaseTotal + liquorBaseTotal).toFixed(2));
  const gstAmt     = parseFloat((foodBaseTotal * gstRate / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal + gstAmt).toFixed(2));

  // ── Step 3: Build display ─────────────────────────────────────────
  displayRows.forEach(r => {
    html += '<div class="cart-item"><span>' + r.emoji + ' ' + r.name + r.sizeTag + ' ×' + r.qty + '</span>';
    html += '<span>₹' + r.lineTotal + '</span></div>';
  });
  html += '<div class="cart-item" style="border-top:1px dashed #ddd;margin:4px 0;padding-top:4px;">';
  html += '<span style="color:var(--muted);">Subtotal</span><span>₹' + subtotal + '</span></div>';
  if(foodBaseTotal > 0)
    html += '<div class="cart-item" style="font-size:0.8rem;color:#2e7d32;"><span>🧾 GST ' + gstRate + '% on Food &amp; Beverage (₹' + foodBaseTotal + ')</span><span>+₹' + gstAmt + '</span></div>';
  html += '<div class="cart-item" style="font-size:0.82rem;"><span style="color:var(--muted);">Total Tax (GST)</span><span style="color:var(--muted);">+₹' + gstAmt + '</span></div>';
  html += '<div class="cart-item" style="font-size:1.05rem;font-weight:800;border-top:2px solid #e8d5c8;margin-top:4px;padding-top:6px;"><span>Grand Total</span><span style="color:var(--fire);">₹' + grandTotal + '</span></div>';
  container.innerHTML = html;
  container.setAttribute('data-total', grandTotal);
  container.setAttribute('data-subtotal', subtotal);
  container.setAttribute('data-gst', gstAmt);
  } catch(e) { console.error("[SG] renderCart error:", e); }
}

// ===== SUBMIT ORDER =====
function toggleSameNumber(cb) {
  try {
  const waField = document.getElementById('custWhatsapp');
  if(cb.checked) {
    waField.value = document.getElementById('custMobile').value;
    waField.disabled = true;
    waField.style.opacity = '0.6';
  } else {
    waField.value = '';
    waField.disabled = false;
    waField.style.opacity = '1';
  }
  } catch(_e) { console.error("[SG] toggleSameNumber:", _e); }
}

// Feature 2: Payment method card selector
function selectPayMethod(method, el) {
  try {
  document.querySelectorAll('#payMethodCards label').forEach(l => {
    l.style.borderColor = '#e8d5c8';
    l.style.background = '#fff';
    l.style.boxShadow = 'none';
  });
  el.style.borderColor = 'var(--fire)';
  el.style.background = '#fff5f0';
  el.style.boxShadow = '0 2px 8px rgba(232,64,12,0.15)';
  document.getElementById('payMethod').value = method;
  } catch(_e) { console.error("[SG] selectPayMethod:", _e); }
}

// Initialize payment method selection on page load
document.addEventListener('DOMContentLoaded', function() {
  const cashEl = document.getElementById('pm-cash');
  if(cashEl) selectPayMethod('Cash on Delivery', cashEl);

  // Restore admin session on refresh
  restoreAdminSession();

  // AUTO INJECT PURCHASE + STOCK DATA (runs only once)
  if(!localStorage.getItem('sg_data_injected_v5')) {
    var purchases = [{"id":"PUR0001","date":"2026-03-10","vendorId":"V002","vendorName":"Spice Kingdom","itemType":"solid","itemId":"P001","itemName":"Paneer 1kg","qty":20,"unitWt":"","totalWt":"20 packet","mfgDate":"","expDate":"","batch":"BILL0001","mrp":"","price":100,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":2000,"total":2000,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0001","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0002","date":"2026-05-02","vendorId":"V003","vendorName":"Meat Masters","itemType":"rawmat","itemId":"R002","itemName":"Cabbage","qty":10,"unitWt":"","totalWt":"10 kg","mfgDate":"","expDate":"","batch":"BILL0002","mrp":"","price":35,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":350,"total":350,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0002","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0003","date":"2026-03-16","vendorId":"V007","vendorName":"Veggie World","itemType":"solid","itemId":"P003","itemName":"Cooking Oil 5L","qty":18,"unitWt":"","totalWt":"18 bottle","mfgDate":"","expDate":"","batch":"BILL0003","mrp":"","price":500,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":9000,"total":9000,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0003","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0004","date":"2026-05-01","vendorId":"V009","vendorName":"Packaging Plus","itemType":"rawmat","itemId":"R002","itemName":"Cabbage","qty":17,"unitWt":"","totalWt":"17 kg","mfgDate":"","expDate":"","batch":"BILL0004","mrp":"","price":35,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":595,"total":595,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0004","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0005","date":"2026-03-08","vendorId":"V009","vendorName":"Packaging Plus","itemType":"solid","itemId":"P004","itemName":"Basmati Rice 25kg","qty":42,"unitWt":"","totalWt":"42 bag","mfgDate":"","expDate":"","batch":"BILL0005","mrp":"","price":2500,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":105000,"total":105000,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0005","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0006","date":"2026-04-25","vendorId":"V001","vendorName":"Fresh Farm Supplies","itemType":"rawmat","itemId":"R005","itemName":"Tomato","qty":49,"unitWt":"","totalWt":"49 kg","mfgDate":"","expDate":"","batch":"BILL0006","mrp":"","price":25,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":1225,"total":1225,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0006","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0007","date":"2026-04-06","vendorId":"V006","vendorName":"Oil & Essentials","itemType":"solid","itemId":"P006","itemName":"Soy Sauce 750ml","qty":26,"unitWt":"","totalWt":"26 bottle","mfgDate":"","expDate":"","batch":"BILL0007","mrp":"","price":75,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":1950,"total":1950,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0007","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0008","date":"2026-05-17","vendorId":"V002","vendorName":"Spice Kingdom","itemType":"solid","itemId":"P007","itemName":"Mozzarella 500g","qty":27,"unitWt":"","totalWt":"27 packet","mfgDate":"","expDate":"","batch":"BILL0008","mrp":"","price":50,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":1350,"total":1350,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0008","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0009","date":"2026-03-14","vendorId":"V005","vendorName":"Grain Gate","itemType":"rawmat","itemId":"R008","itemName":"Cream","qty":39,"unitWt":"","totalWt":"39 L","mfgDate":"","expDate":"","batch":"BILL0009","mrp":"","price":180,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":7020,"total":7020,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0009","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0010","date":"2026-05-15","vendorId":"V007","vendorName":"Veggie World","itemType":"solid","itemId":"P001","itemName":"Paneer 1kg","qty":45,"unitWt":"","totalWt":"45 packet","mfgDate":"","expDate":"","batch":"BILL0010","mrp":"","price":100,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":4500,"total":4500,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0010","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0011","date":"2026-03-12","vendorId":"V006","vendorName":"Oil & Essentials","itemType":"rawmat","itemId":"R009","itemName":"Fish (Rohu)","qty":7,"unitWt":"","totalWt":"7 kg","mfgDate":"","expDate":"","batch":"BILL0011","mrp":"","price":180,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":1260,"total":1260,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0011","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0012","date":"2026-03-07","vendorId":"V004","vendorName":"Dairy Direct","itemType":"rawmat","itemId":"R009","itemName":"Fish (Rohu)","qty":19,"unitWt":"","totalWt":"19 kg","mfgDate":"","expDate":"","batch":"BILL0012","mrp":"","price":180,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":3420,"total":3420,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0012","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0013","date":"2026-05-18","vendorId":"V007","vendorName":"Veggie World","itemType":"solid","itemId":"P010","itemName":"Salt 1kg","qty":28,"unitWt":"","totalWt":"28 packet","mfgDate":"","expDate":"","batch":"BILL0013","mrp":"","price":100,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":2800,"total":2800,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0013","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0014","date":"2026-05-10","vendorId":"V006","vendorName":"Oil & Essentials","itemType":"solid","itemId":"P010","itemName":"Salt 1kg","qty":22,"unitWt":"","totalWt":"22 packet","mfgDate":"","expDate":"","batch":"BILL0014","mrp":"","price":100,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":2200,"total":2200,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0014","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0015","date":"2026-03-02","vendorId":"V002","vendorName":"Spice Kingdom","itemType":"rawmat","itemId":"R005","itemName":"Tomato","qty":39,"unitWt":"","totalWt":"39 kg","mfgDate":"","expDate":"","batch":"BILL0015","mrp":"","price":25,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":975,"total":975,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0015","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0016","date":"2026-04-29","vendorId":"V003","vendorName":"Meat Masters","itemType":"solid","itemId":"P001","itemName":"Paneer 1kg","qty":45,"unitWt":"","totalWt":"45 packet","mfgDate":"","expDate":"","batch":"BILL0016","mrp":"","price":100,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":4500,"total":4500,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0016","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0017","date":"2026-03-03","vendorId":"V009","vendorName":"Packaging Plus","itemType":"solid","itemId":"P007","itemName":"Mozzarella 500g","qty":8,"unitWt":"","totalWt":"8 packet","mfgDate":"","expDate":"","batch":"BILL0017","mrp":"","price":50,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":400,"total":400,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0017","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0018","date":"2026-05-01","vendorId":"V001","vendorName":"Fresh Farm Supplies","itemType":"rawmat","itemId":"R011","itemName":"Milk (Fresh)","qty":22,"unitWt":"","totalWt":"22 L","mfgDate":"","expDate":"","batch":"BILL0018","mrp":"","price":55,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":1210,"total":1210,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0018","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0019","date":"2026-05-22","vendorId":"V004","vendorName":"Dairy Direct","itemType":"rawmat","itemId":"R012","itemName":"Carrot","qty":50,"unitWt":"","totalWt":"50 kg","mfgDate":"","expDate":"","batch":"BILL0019","mrp":"","price":45,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":2250,"total":2250,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0019","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0020","date":"2026-04-20","vendorId":"V004","vendorName":"Dairy Direct","itemType":"rawmat","itemId":"R011","itemName":"Milk (Fresh)","qty":46,"unitWt":"","totalWt":"46 L","mfgDate":"","expDate":"","batch":"BILL0020","mrp":"","price":55,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":2530,"total":2530,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0020","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0021","date":"2026-04-02","vendorId":"V003","vendorName":"Meat Masters","itemType":"solid","itemId":"P006","itemName":"Soy Sauce 750ml","qty":40,"unitWt":"","totalWt":"40 bottle","mfgDate":"","expDate":"","batch":"BILL0021","mrp":"","price":75,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":3000,"total":3000,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0021","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0022","date":"2026-03-23","vendorId":"V005","vendorName":"Grain Gate","itemType":"rawmat","itemId":"R013","itemName":"Curd","qty":42,"unitWt":"","totalWt":"42 kg","mfgDate":"","expDate":"","batch":"BILL0022","mrp":"","price":70,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":2940,"total":2940,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0022","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0023","date":"2026-04-09","vendorId":"V006","vendorName":"Oil & Essentials","itemType":"solid","itemId":"P014","itemName":"Tomato Ketchup 1kg","qty":37,"unitWt":"","totalWt":"37 bottle","mfgDate":"","expDate":"","batch":"BILL0023","mrp":"","price":100,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":3700,"total":3700,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0023","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0024","date":"2026-03-28","vendorId":"V002","vendorName":"Spice Kingdom","itemType":"rawmat","itemId":"R015","itemName":"Prawns","qty":14,"unitWt":"","totalWt":"14 kg","mfgDate":"","expDate":"","batch":"BILL0024","mrp":"","price":450,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":6300,"total":6300,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0024","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0025","date":"2026-03-11","vendorId":"V003","vendorName":"Meat Masters","itemType":"rawmat","itemId":"R013","itemName":"Curd","qty":43,"unitWt":"","totalWt":"43 kg","mfgDate":"","expDate":"","batch":"BILL0025","mrp":"","price":70,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":3010,"total":3010,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0025","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0026","date":"2026-05-22","vendorId":"V007","vendorName":"Veggie World","itemType":"solid","itemId":"P004","itemName":"Basmati Rice 25kg","qty":38,"unitWt":"","totalWt":"38 bag","mfgDate":"","expDate":"","batch":"BILL0026","mrp":"","price":2500,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":95000,"total":95000,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0026","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0027","date":"2026-04-28","vendorId":"V009","vendorName":"Packaging Plus","itemType":"rawmat","itemId":"R016","itemName":"Chicken (Fresh)","qty":48,"unitWt":"","totalWt":"48 kg","mfgDate":"","expDate":"","batch":"BILL0027","mrp":"","price":280,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":13440,"total":13440,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0027","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0028","date":"2026-05-16","vendorId":"V009","vendorName":"Packaging Plus","itemType":"rawmat","itemId":"R017","itemName":"Coriander Leaves","qty":600,"unitWt":"","totalWt":"600 g","mfgDate":"","expDate":"","batch":"BILL0028","mrp":"","price":0.4,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":240,"total":240,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0028","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0029","date":"2026-04-23","vendorId":"V007","vendorName":"Veggie World","itemType":"solid","itemId":"P018","itemName":"Amul Butter 500g","qty":21,"unitWt":"","totalWt":"21 packet","mfgDate":"","expDate":"","batch":"BILL0029","mrp":"","price":500,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":10500,"total":10500,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0029","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"},{"id":"PUR0030","date":"2026-03-27","vendorId":"V003","vendorName":"Meat Masters","itemType":"rawmat","itemId":"R015","itemName":"Prawns","qty":45,"unitWt":"","totalWt":"45 kg","mfgDate":"","expDate":"","batch":"BILL0030","mrp":"","price":450,"discount":0,"gstPct":0,"gstAmt":0,"subtotal":20250,"total":20250,"payMode":"Cash","payStatus":"Paid","billNo":"BILL0030","billFile":"","receivedBy":"Admin","notes":"","addedBy":"CSV Import","addedAt":"02/06/2026"}];
    var stock = {"solid_P001":{"type":"solid","itemId":"P001","qty":110,"lastUpdated":"02/06/2026"},"rawmat_R002":{"type":"rawmat","itemId":"R002","qty":27,"lastUpdated":"02/06/2026"},"solid_P003":{"type":"solid","itemId":"P003","qty":18,"lastUpdated":"02/06/2026"},"solid_P004":{"type":"solid","itemId":"P004","qty":80,"lastUpdated":"02/06/2026"},"rawmat_R005":{"type":"rawmat","itemId":"R005","qty":88,"lastUpdated":"02/06/2026"},"solid_P006":{"type":"solid","itemId":"P006","qty":66,"lastUpdated":"02/06/2026"},"solid_P007":{"type":"solid","itemId":"P007","qty":35,"lastUpdated":"02/06/2026"},"rawmat_R008":{"type":"rawmat","itemId":"R008","qty":39,"lastUpdated":"02/06/2026"},"rawmat_R009":{"type":"rawmat","itemId":"R009","qty":26,"lastUpdated":"02/06/2026"},"solid_P010":{"type":"solid","itemId":"P010","qty":50,"lastUpdated":"02/06/2026"},"rawmat_R011":{"type":"rawmat","itemId":"R011","qty":68,"lastUpdated":"02/06/2026"},"rawmat_R012":{"type":"rawmat","itemId":"R012","qty":50,"lastUpdated":"02/06/2026"},"rawmat_R013":{"type":"rawmat","itemId":"R013","qty":85,"lastUpdated":"02/06/2026"},"solid_P014":{"type":"solid","itemId":"P014","qty":37,"lastUpdated":"02/06/2026"},"rawmat_R015":{"type":"rawmat","itemId":"R015","qty":59,"lastUpdated":"02/06/2026"},"rawmat_R016":{"type":"rawmat","itemId":"R016","qty":48,"lastUpdated":"02/06/2026"},"rawmat_R017":{"type":"rawmat","itemId":"R017","qty":12,"lastUpdated":"02/06/2026"},"solid_P018":{"type":"solid","itemId":"P018","qty":21,"lastUpdated":"02/06/2026"}};
    // Seed to Supabase (async, fire and forget)
    sbUpsertInv('inv_purchases', purchases).catch(e=>console.error('seed purchases fail:',e));
    var stockArr = Object.entries(stock).map(([k,v])=>{ return {...v, stock_key:k}; });
    sbUpsertInv('inv_stock', stockArr, 'stock_key').catch(e=>{});

    // Also seed directly to localStorage cache so file:// mode works immediately
    try {
      var lsPurchases = JSON.parse(localStorage.getItem('sb_inv_purchases')||'[]');
      if(!lsPurchases.length) localStorage.setItem('sb_inv_purchases', JSON.stringify(purchases));
      var lsStock = JSON.parse(localStorage.getItem('sb_inv_stock')||'[]');
      if(!lsStock.length) localStorage.setItem('sb_inv_stock', JSON.stringify(stockArr));
    } catch(e) {}

    // Inject Raw Materials if IDs missing
    sbGetRawmats().then(existingRM => {
    var rmToAdd = [
      {id:'R002',name:'Cabbage',cat:'Vegetables',unit:'kg',minStock:5,perishable:'yes',shelfLife:'7',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R005',name:'Tomato',cat:'Vegetables',unit:'kg',minStock:5,perishable:'yes',shelfLife:'5',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R008',name:'Cream',cat:'Dairy',unit:'L',minStock:3,perishable:'yes',shelfLife:'5',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R009',name:'Fish (Rohu)',cat:'Seafood',unit:'kg',minStock:3,perishable:'yes',shelfLife:'2',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R011',name:'Milk (Fresh)',cat:'Dairy',unit:'L',minStock:10,perishable:'yes',shelfLife:'2',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R012',name:'Carrot',cat:'Vegetables',unit:'kg',minStock:5,perishable:'yes',shelfLife:'7',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R013',name:'Curd',cat:'Dairy',unit:'kg',minStock:5,perishable:'yes',shelfLife:'3',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R015',name:'Prawns',cat:'Seafood',unit:'kg',minStock:3,perishable:'yes',shelfLife:'2',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R016',name:'Chicken (Fresh)',cat:'Meat',unit:'kg',minStock:5,perishable:'yes',shelfLife:'2',storage:'Refrigerated',notes:'',currentStock:0},
      {id:'R017',name:'Coriander Leaves',cat:'Herbs',unit:'g',minStock:5,perishable:'yes',shelfLife:'3',storage:'Refrigerated',notes:'',currentStock:0}
    ];
    rmToAdd.forEach(function(rm) {
      if(!existingRM.find(function(r){return r.id===rm.id;})) existingRM.push(rm);
    });
    sbUpsertInv('inv_rawmats', existingRM, 'id').catch(e=>console.error('seed rawmats fail:',e));
    }).catch(e=>console.error('seed rawmats load fail:',e));

    // Inject Products - replace fully to avoid duplicates
    var pToAdd = [
      {id:'P001',type:'solid',name:'Paneer 1kg',brand:'',cat:'Dairy',unitType:'Packet',unitWt:'1',wtUnit:'kg',minStock:5,storage:'Refrigerated',location:'',hsn:'',currentStock:0},
      {id:'P003',type:'solid',name:'Cooking Oil 5L',brand:'',cat:'Cooking Oil',unitType:'Bottle',unitWt:'5',wtUnit:'liter',minStock:3,storage:'Dry/Room Temp',location:'',hsn:'',currentStock:0},
      {id:'P004',type:'solid',name:'Basmati Rice 25kg',brand:'',cat:'Grains & Flour',unitType:'Bag',unitWt:'25',wtUnit:'kg',minStock:2,storage:'Dry/Room Temp',location:'',hsn:'',currentStock:0},
      {id:'P006',type:'solid',name:'Soy Sauce 750ml',brand:'',cat:'Sauce & Condiments',unitType:'Bottle',unitWt:'750',wtUnit:'ml',minStock:3,storage:'Dry/Room Temp',location:'',hsn:'',currentStock:0},
      {id:'P007',type:'solid',name:'Mozzarella 500g',brand:'',cat:'Dairy',unitType:'Packet',unitWt:'500',wtUnit:'gram',minStock:3,storage:'Refrigerated',location:'',hsn:'',currentStock:0},
      {id:'P010',type:'solid',name:'Salt 1kg',brand:'',cat:'Spices',unitType:'Packet',unitWt:'1',wtUnit:'kg',minStock:5,storage:'Dry/Room Temp',location:'',hsn:'',currentStock:0},
      {id:'P014',type:'solid',name:'Tomato Ketchup 1kg',brand:'',cat:'Sauce & Condiments',unitType:'Bottle',unitWt:'1',wtUnit:'kg',minStock:3,storage:'Dry/Room Temp',location:'',hsn:'',currentStock:0},
      {id:'P018',type:'solid',name:'Amul Butter 500g',brand:'Amul',cat:'Dairy',unitType:'Packet',unitWt:'500',wtUnit:'gram',minStock:3,storage:'Refrigerated',location:'',hsn:'',currentStock:0}
    ];
    sbUpsertInv('inv_products', pToAdd, 'id').catch(e=>console.error('seed products fail:',e));

    localStorage.setItem('sg_data_injected_v5', '1');
    console.log('✅ Purchase + Stock + Products + Raw Materials injected!');
  }
});

// Feature 5 & 7: Veg/Non-Veg filter and search
let menuTypeFilter = 'all';
let menuCatFilter = '';

function setMenuFilter(type, btn) {
  try {
  menuTypeFilter = type;
  document.querySelectorAll('#menuPage button[onclick^="setMenuFilter"]').forEach(b => {
    b.style.background = '#fff';
    b.style.color = b.id === 'mfVeg' ? '#2e7d32' : b.id === 'mfNonVeg' ? '#c62828' : b.id === 'mfBest' ? '#b8860b' : 'var(--muted)';
    b.style.borderColor = b.id === 'mfVeg' ? '#4caf50' : b.id === 'mfNonVeg' ? '#e53935' : b.id === 'mfBest' ? 'var(--gold)' : '#ddd';
  });
  if(type === 'all') { btn.style.background = 'var(--fire)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--fire)'; }
  else if(type === 'Veg') { btn.style.background = '#4caf50'; btn.style.color = '#fff'; btn.style.borderColor = '#4caf50'; }
  else if(type === 'Non-Veg') { btn.style.background = '#e53935'; btn.style.color = '#fff'; btn.style.borderColor = '#e53935'; }
  else if(type === 'bestseller') { btn.style.background = 'var(--gold)'; btn.style.color = '#fff'; btn.style.borderColor = 'var(--gold)'; }
  filterMenu();
  } catch(_e) { console.error("[SG] setMenuFilter:", _e); }
}

function setCatFilter(cat, btn) {
  try {
  menuCatFilter = cat;
  document.querySelectorAll('#menuCatFilters button').forEach(b => { b.style.background='#fff'; b.style.color='var(--muted)'; b.style.borderColor='#e8d5c8'; });
  if(btn) { btn.style.background='var(--fire)'; btn.style.color='#fff'; btn.style.borderColor='var(--fire)'; }
  filterMenu();
  } catch(_e) { console.error("[SG] setCatFilter:", _e); }
}

function filterMenu() {
  try {
  const searchVal = (document.getElementById('menuSearchInput')?.value || '').toLowerCase().trim();
  const cards = document.querySelectorAll('#menuGrid .menu-card');
  let visible = 0;
  cards.forEach(card => {
    const name = (card.getAttribute('data-name') || '').toLowerCase();
    const type = card.getAttribute('data-type') || '';
    const cat = (card.getAttribute('data-cat') || '').toLowerCase();
    const isBest = card.getAttribute('data-bestseller') === 'true';
    const matchSearch = !searchVal || name.includes(searchVal) || cat.includes(searchVal);
    const matchType = menuTypeFilter === 'all' || (menuTypeFilter === 'bestseller' && isBest) || type === menuTypeFilter;
    const matchCat = !menuCatFilter || cat === menuCatFilter.toLowerCase();
    if(matchSearch && matchType && matchCat) { card.style.display = ''; visible++; }
    else card.style.display = 'none';
  });
  const noRes = document.getElementById('menuNoResults');
  if(noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
  } catch(_e) { console.error("[SG] filterMenu:", _e); }
}

// Feature 3: Employee address permission toggle style
function toggleAddrPermStyle(checkbox) {
  try {
  const slider = document.getElementById('editSAddrSlider');
  const thumb = document.getElementById('editSAddrThumb');
  if(slider) slider.style.background = checkbox.checked ? '#4caf50' : '#ddd';
  if(thumb) thumb.style.transform = checkbox.checked ? 'translateX(20px)' : 'translateX(0)';
  } catch(_e) { console.error("[SG] toggleAddrPermStyle:", _e); }
}

function submitOrder() {
  try {
  // Pre-fill from customer account if logged in
  if(currentCustomer) {
    const fnEl = document.getElementById('custFirstName');
    const lnEl = document.getElementById('custLastName');
    if(fnEl && !fnEl.value) {
      const parts = (currentCustomer.name||currentCustomer.firstName||'').split(' ');
      fnEl.value = parts[0]||'';
      if(lnEl && !lnEl.value) lnEl.value = parts.slice(1).join(' ')||parts[0]||'';
    }
    const mEl = document.getElementById('custMobile');
    if(mEl && !mEl.value) mEl.value = currentCustomer.mobile||'';
    const wEl = document.getElementById('custWhatsapp');
    if(wEl && !wEl.value) wEl.value = currentCustomer.whatsapp||currentCustomer.mobile||'';
    const eEl = document.getElementById('custEmail');
    if(eEl && !eEl.value) eEl.value = currentCustomer.email||'';
  }
  const firstName=document.getElementById('custFirstName')?.value.trim()||'';
  const lastName=document.getElementById('custLastName')?.value.trim()||'';
  const name=(firstName+' '+lastName).trim() || document.getElementById('custName')?.value.trim()||'';
  const mobile=document.getElementById('custMobile').value.trim();
  const whatsapp=document.getElementById('custWhatsapp').value.trim()||mobile;
  const email=document.getElementById('custEmail').value.trim();
  const type=document.getElementById('orderType').value;

  // Safety check: liquor delivery restriction
  if(type === 'Home Delivery' && getLiquorDeliverySetting() === 'restricted') {
    if(cartHasLiquor()) { showLiquorDeliveryWarning(); return; }
    // Check Special Instructions for liquor keywords
    const noteVal = document.getElementById('custNote')?.value || '';
    if(isLiquorNote(noteVal)) {
      // Show same 3-option popup style
      const fakeItem = { name: 'Special Instructions mein liquor detect hua', isLiquor: true, comboDishes: [],
        _noteAlert: 'Special Instructions se liquor mention hatao ya order type change karo.' };
      showLiquorOrderOptions('__note__', fakeItem);
      return;
    }
  }

  // Build address from new fields
  const addrLine = document.getElementById('custAddrLine')?.value.trim()||'';
  const addrPlace = document.getElementById('custAddrPlace')?.value.trim()||'';
  const addrCity = document.getElementById('custAddrCity')?.value.trim()||'';
  const addrState = document.getElementById('custAddrState')?.value.trim()||'';
  const addrPin = document.getElementById('custAddrPin')?.value.trim()||'';
  const addrCountry = document.getElementById('custAddrCountry')?.value.trim()||'India';
  
  // Combine address
  const address = [addrLine, addrPlace, addrCity, addrState, addrPin, addrCountry]
    .filter(Boolean).join(', ');
  
  // Update hidden field
  const hiddenAddr = document.getElementById('custAddress');
  if(hiddenAddr) hiddenAddr.value = address;

  // Dine-In validation
  if(type === 'Dine-In') {
    const dineDate = document.getElementById('dineInDate').value;
    const dineGuests = document.getElementById('dineInGuests').value;
    if(!dineDate) { showToast('Please select a date for Dine-In','error'); return; }
    if(!dineGuests) { showToast('Please enter number of guests','error'); return; }
    if(!selectedTableId) { showToast('Please select a table','error'); return; }
    // Check if reservation table needs slot
    const allTables = JSON.parse(localStorage.getItem('sg_tables')||'[]');
    const selT = allTables.find(x=>x.id===selectedTableId);
    if(selT && selT.reservationOnly && selT.dateSlots && selT.dateSlots[dineDate]) {
      if(selectedSlots.length === 0) { showToast('Please select at least one time slot','error'); return; }
    }
  }
  const pay=document.getElementById('payMethod').value;
  const note=document.getElementById('custNote').value.trim();
  // Dine-In extra fields
  const dineInDate = type==='Dine-In' ? document.getElementById('dineInDate').value : '';
  const dineInTime = type==='Dine-In' ? (selectedSlots.length>0?selectedSlots[0].start:document.getElementById('dineInTime').value) : '';
  const dineInGuests = type==='Dine-In' ? document.getElementById('dineInGuests').value : '';
  const dineInRequest = type==='Dine-In' ? document.getElementById('dineInRequest').value : '';
  const dineInTableId = type==='Dine-In' ? selectedTableId : '';
  const dineInSlots = type==='Dine-In' ? selectedSlots : [];
  const dineInReservCharge = dineInSlots.reduce((s,sl)=>s+(sl.charge||0),0);
  // Get table number
  let dineInTableNum = '';
  if(dineInTableId) {
    const tables = JSON.parse(localStorage.getItem('sg_tables')||'[]');
    const t = tables.find(x=>x.id===dineInTableId);
    if(t) dineInTableNum = t.num;
  }
  // Validate name fields
  if(!firstName && !lastName && !name){showToast('Please enter your name','error');return;}
  if(!firstName){showToast('Please enter your first name','error');return;}
  if(!mobile||!email){showToast('Please fill all required fields','error');return;}
  
  // Validate address fields for Home Delivery
  if(type === 'Home Delivery') {
    if(!addrLine){showToast('Please enter address line','error');return;}
    if(!addrPlace){showToast('Please enter place/locality','error');return;}
    if(!addrCity){showToast('Please enter city/district','error');return;}
    if(!addrState){showToast('Please enter state','error');return;}
    if(!addrPin||!/^\d{6}$/.test(addrPin)){showToast('Please enter valid 6-digit PIN code','error');return;}
    if(!address){showToast('Delivery address is required','error');return;}
  }
  if(!/^\d{10}$/.test(mobile)){showToast('Please enter a valid 10-digit mobile number','error');return;}
  if(document.getElementById('custWhatsapp').value.trim() && !/^\d{10}$/.test(whatsapp)){showToast('Please enter a valid WhatsApp number','error');return;}
  if(!Object.keys(cart).length){showToast('Please add items to your order','error');return;}

  const items = Object.entries(cart).filter(([id]) => {
    const allK = Object.keys(cart);
    return id.includes('__') || !allK.some(k=>k.startsWith(id+'__'));
  }).map(([id,qty])=>{
    const parts   = String(id).split('__');
    const itemId  = parts[0];
    const sizeLbl = parts[1] || null;
    const item    = menuItems.find(m=>String(m.id)===itemId);
    if(!item) return null;
    let price = item.price;
    if(sizeLbl && item.sizes) { const sz=item.sizes.find(s=>s.label===sizeLbl); if(sz) price=sz.price; }
    const name2 = sizeLbl ? item.name+' ('+sizeLbl+')' : item.name;
    return {name:name2, qty, price, isLiquor:item.isLiquor||false, isCombo:item.isCombo||false,
            exciseDuty:item.exciseDuty||item.excisePct||0, comboDishes:item.comboDishes||[],
            sizes:item.sizes||[], sizeLabel:sizeLbl, total:price*qty};
  }).filter(Boolean);

  // Same logic as renderCart for accurate tax
  let foodBaseTotal = 0, liquorGroupsO = {};
  items.forEach(i => {
    const lineTotal = i.price * i.qty;
    if(i.isCombo) {
      let dishes = i.comboDishes;
      if(i.sizeLabel && i.sizes) { const sz=i.sizes.find(s=>s.label===i.sizeLabel); if(sz&&sz.dishes) dishes=sz.dishes; }
      dishes.forEach(d => {
        const dTotal = parseFloat(((d.comboPrice||0)*(d.qty||1)*i.qty).toFixed(2));
        if(d.isLiquor) {
          const aItem=menuItems.find(m=>String(m.id)===String(d.id));
          const excR=aItem?(aItem.exciseDuty||aItem.excisePct||0):(d.dutyPct||d.exciseDuty||d.excisePct||0);
          const gKey=String(d.id)+'_'+excR;
          if(!liquorGroupsO[gKey]) liquorGroupsO[gKey]={name:d.name,total:0,excRate:excR};
          liquorGroupsO[gKey].total=parseFloat((liquorGroupsO[gKey].total+dTotal).toFixed(2));
        } else { foodBaseTotal=parseFloat((foodBaseTotal+dTotal).toFixed(2)); }
      });
    } else if(i.isLiquor) {
      const gKey=i.name+'_'+i.exciseDuty;
      if(!liquorGroupsO[gKey]) liquorGroupsO[gKey]={name:i.name,total:0,excRate:i.exciseDuty};
      liquorGroupsO[gKey].total=parseFloat((liquorGroupsO[gKey].total+lineTotal).toFixed(2));
    } else { foodBaseTotal=parseFloat((foodBaseTotal+lineTotal).toFixed(2)); }
  });
  const liqTotal = parseFloat(Object.values(liquorGroupsO).reduce((s,g)=>s+g.total,0).toFixed(2));
  const subtotal = parseFloat((foodBaseTotal + liqTotal).toFixed(2));
  const gstAmt   = parseFloat((foodBaseTotal * getGSTRate()/100).toFixed(2));
  const taxTotal = gstAmt;
  const total    = parseFloat((subtotal + gstAmt).toFixed(2));
  // Bug fix: pehle sirf Date.now() ke last-6 digits the jo ~16 min mein repeat ho sakte hain
  // Ab: full timestamp (base36) + 2-char random => duplicate ID practically impossible
  const orderId='ORD'+Date.now().toString(36).toUpperCase()+Math.floor(Math.random()*1296).toString(36).toUpperCase().padStart(2,'0');
  const order={
    id:orderId,name:_cleanText(name),mobile,whatsapp,email:_cleanText(email),address:_cleanText(address),type,pay,note:_cleanText(note),items,subtotal,gstAmt:taxTotal,total,
    status:'Pending',time:new Date().toLocaleString('en-IN'),
    tableNum:dineInTableNum, tableId:dineInTableId,
    dineInDate, dineInTime, dineInGuests, dineInRequest:_cleanText(dineInRequest),
    dineInSlots, dineInReservCharge,
    grandTotal: total + (dineInReservCharge||0)
  };
  orders.unshift(order);
  // Save to Supabase (async, non-blocking)
  sbInsertOrder(order).catch(e => console.error('Order save failed:', e));
  // Auto-assign to Cook (equal distribution)
  try { autoAssignCookToOrder(orderId); } catch(e) {}
  // Auto-create reservation for Dine-In orders
  if(type==='Dine-In' && dineInTableId && dineInDate && dineInTime) {
    const reservations = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
    reservations.push({
      id:'R'+Date.now(), name:_cleanText(name), phone:mobile, date:dineInDate, time:dineInTime,
      table:dineInTableId, guests:dineInGuests||1, notes:_cleanText(dineInRequest||'Online booking - Order #'+orderId),
      status:'confirmed', createdAt:new Date().toLocaleString('en-IN'), orderId
    });
    localStorage.setItem('tbl_reservations', JSON.stringify(reservations)); sbSaveAllReservations(reservations).catch(()=>{});
    // Reset dine-in selection
    selectedTableId = null;
  }

  // update customer + award loyalty points
  let cust=customers.find(c=>c.mobile===mobile);
  if(cust){
    cust.orders++;cust.spent+=total;cust.address=_cleanText(address);cust.whatsapp=whatsapp;
    // Award loyalty points using customer's unique id
    try { awardLoyaltyPoints(cust.id||mobile, total, orderId, name); } catch(e){}
  } else {
    const newCustId = 'c'+Date.now();
    customers.unshift({id:newCustId,name:_cleanText(name),mobile,whatsapp,email:_cleanText(email),address:_cleanText(address),orders:1,spent:total});
    try { awardLoyaltyPoints(newCustId, total, orderId, name); } catch(e){}
  }
  // Bug #6 fix: pehle yahan customers.forEach se SAARE customers upsert hote the
  // (1000 customers = har order pe 1000 API calls). Ab sirf isi order ka
  // customer Supabase pe sync hota hai.
  const _orderCust = customers.find(c => c.mobile === mobile);
  if(_orderCust) sbUpsertCustomer(_orderCust).catch(e => console.error('Customer upsert failed:', e));

  cart={};
  document.querySelectorAll('[id^="qty-"]').forEach(e=>e.textContent='0');
  updateCartBadge();
  ['custFirstName','custLastName','custMobile','custWhatsapp','custEmail','custAddress','custAddrLine','custAddrPlace','custAddrCity','custAddrState','custAddrPin','custNote'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const addrCountryEl=document.getElementById('custAddrCountry');if(addrCountryEl)addrCountryEl.value='India';
  document.getElementById('sameAsMobile').checked=false;
  renderCart();
  try {
    showOrderConfirmation(orderId, name, mobile, whatsapp, email, items, subtotal, gstAmt, total, type, {
      address, pay, dineInTableNum, dineInDate, dineInTime, dineInGuests,
      dineInSlots, dineInReservCharge, dineInRequest
    });
  } catch(err) {
    console.error('showOrderConfirmation error:', err);
    // Fallback - force open modal with basic data
    document.getElementById('confirmOrderId').textContent = orderId;
    document.getElementById('confirmName').textContent = name;
    document.getElementById('confirmType').textContent = type;
    document.getElementById('confirmItems').innerHTML = items.map(i=>'<li>'+i.name+' x'+i.qty+' — ₹'+i.total+'</li>').join('');
    document.getElementById('confirmSubtotal').textContent = '₹'+subtotal;
    document.getElementById('confirmGST').textContent = '₹'+gstAmt;
    document.getElementById('confirmTotal').textContent = '₹'+total;
    lastOrderData = {orderId,name,mobile,email,whatsapp,type,items,subtotal,gstAmt,total,time:new Date().toLocaleString('en-IN')};
    document.getElementById('confirmModal').classList.add('open');
  }
  updateStats();
  } catch(_e) { console.error("[SG] submitOrder:", _e); }
}

function showOrderConfirmation(orderId, name, mobile, whatsapp, email, items, subtotal, gstAmt, total, type, extraData) {
  try {
  // Extract extraData variables
  const ed = extraData || {};
  const dineInTableNum    = ed.dineInTableNum || '';
  const dineInDate        = ed.dineInDate || '';
  const dineInTime        = ed.dineInTime || '';
  const dineInGuests      = ed.dineInGuests || '';
  const dineInSlots       = ed.dineInSlots || [];
  const dineInReservCharge= ed.dineInReservCharge || 0;
  const dineInRequest     = ed.dineInRequest || '';
  const address           = ed.address || '';
  const payment           = ed.pay || '';

  // Fill confirm modal
  document.getElementById('confirmOrderId').textContent = orderId;
  document.getElementById('confirmName').textContent = name;
  document.getElementById('confirmWhatsapp').textContent = '💬 ' + whatsapp;
  document.getElementById('confirmType').textContent = type;
  document.getElementById('confirmItems').innerHTML = items.map(i=>'<li style="padding:4px 0;border-bottom:1px solid #f0ebe5;">'+i.name+' x'+i.qty+' — ₹'+i.total+'</li>').join('');
  document.getElementById('confirmSubtotal').textContent = '₹'+subtotal;
  document.getElementById('confirmGST').textContent = '₹'+gstAmt;

  // Dine-In reservation details
  const confirmDineDiv = document.getElementById('confirmDineInDetails');
  const confirmReservRow = document.getElementById('confirmReservRow');
  const confirmReservChargeEl = document.getElementById('confirmReservCharge');
  if(type === 'Dine-In' && confirmDineDiv) {
    let dineHtml = '<b style="color:#f57c00;">🪑 Reservation Details:</b><br>';
    if(dineInTableNum) dineHtml += '🪑 Table: <b>'+dineInTableNum+'</b><br>';
    if(dineInDate) dineHtml += '📅 Date: <b>'+new Date(dineInDate).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long',year:'numeric'})+'</b><br>';
    if(dineInGuests) dineHtml += '👥 Guests: <b>'+dineInGuests+'</b><br>';
    if(dineInSlots && dineInSlots.length > 0) {
      dineHtml += '⏰ Slots:<br>';
      dineInSlots.forEach(s => {
        dineHtml += '&nbsp;&nbsp;' + to12hr(s.start) + ' – ' + to12hr(s.end);
        if(s.charge > 0) dineHtml += ' (₹'+s.charge+')';
        dineHtml += '<br>';
      });
    }
    if(dineInRequest) dineHtml += '📝 ' + dineInRequest;
    confirmDineDiv.innerHTML = dineHtml;
    confirmDineDiv.style.display = 'block';
    if(confirmReservRow && dineInReservCharge > 0) {
      confirmReservRow.style.display = 'flex';
      if(confirmReservChargeEl) confirmReservChargeEl.textContent = '₹'+dineInReservCharge+' (No GST)';
    }
    document.getElementById('confirmTotal').textContent = '₹'+(total + dineInReservCharge);
  } else {
    if(confirmDineDiv) confirmDineDiv.style.display = 'none';
    if(confirmReservRow) confirmReservRow.style.display = 'none';
    document.getElementById('confirmTotal').textContent = '₹'+total;
  }

  // Save for invoice
  lastOrderData = {
    orderId, name, mobile, email, whatsapp, type, items, subtotal, gstAmt, total,
    address, payment, tableNum: dineInTableNum,
    dineInDate, dineInTime, dineInGuests,
    dineInSlots, dineInReservCharge, dineInRequest,
    time: new Date().toLocaleString('en-IN')
  };

  document.getElementById('confirmModal').classList.add('open');

  // WhatsApp message
  let dineInDetails = '';
  if(type === 'Dine-In') {
    dineInDetails += '\n🪑 *Reservation Details:*\n';
    if(dineInTableNum) dineInDetails += 'Table: ' + dineInTableNum + '\n';
    if(dineInDate) dineInDetails += 'Date: ' + new Date(dineInDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) + '\n';
    if(dineInGuests) dineInDetails += 'Guests: ' + dineInGuests + '\n';
    if(dineInSlots && dineInSlots.length > 0) {
      dineInDetails += 'Time Slot(s):\n';
      dineInSlots.forEach(s => {
        dineInDetails += '  ⏰ ' + to12hr(s.start) + ' - ' + to12hr(s.end);
        if(s.charge > 0) dineInDetails += ' (Rs.' + s.charge + ')';
        dineInDetails += '\n';
      });
    }
    if(dineInReservCharge > 0) dineInDetails += '*Reservation Charge: Rs.' + dineInReservCharge + '* (No GST)\n';
    if(dineInRequest) dineInDetails += 'Special Request: ' + dineInRequest + '\n';
  }

  const waMsg = encodeURIComponent(
    'Hi ' + name + ', thank you for your order at SpiceGarden!\n\n' +
    'Your Order ID is: *' + orderId + '*\n' +
    'Order Type: ' + type + '\n' +
    dineInDetails +
    '\n🍽️ *Items Ordered:*\n' + items.map(i=>'- '+i.name+' x'+i.qty+' = Rs.'+i.total).join('\n') + '\n\n' +
    'Subtotal: Rs.' + subtotal + '\n' +
    'GST (' + (gstAmt>0?Math.round(gstAmt/subtotal*100):5) + '%): Rs.' + gstAmt + '\n' +
    (dineInReservCharge > 0 ? 'Reservation Charge: Rs.' + dineInReservCharge + ' (No GST)\n' : '') +
    '*Total Amount: Rs.' + (total + (dineInReservCharge||0)) + '*\n\n' +
    'Your order has been placed successfully. We will call you shortly.\n' +
    'Please save your Order ID for reference.\n\n' +
    'Thank you for choosing SpiceGarden! 🌶️'
  );
  // Clean whatsapp number - remove spaces, dashes, +91
  const cleanWA = whatsapp.replace(/[\s\-]/g,'').replace(/^\+91/,'').replace(/^91/,'').slice(-10);
  const waLink = 'https://wa.me/91' + cleanWA + '?text=' + waMsg;
  document.getElementById('whatsappBtn').onclick = () => window.open(waLink, '_blank');

  // EmailJS send
  sendEmailJS(orderId, name, mobile, email, items, subtotal, gstAmt, total, type);
  } catch(_e) { console.error("[SG] showOrderConfirmation:", _e); }
}

function sendEmailJS(orderId, name, mobile, email, items, subtotal, gstAmt, total, type) {
  try {
  // EmailJS not configured - skipping email
  console.log('Email notification skipped - will be active after server deployment');
  } catch(_e) { console.error("[SG] sendEmailJS:", _e); }
}

// ===== PASSWORD CHANGE =====
function saveSecurityQuestion() {
  try {
  const q = document.getElementById('secQuestion').value;
  const a = document.getElementById('secAnswer').value.trim();
  if(!q) { showToast('Please select a security question','error'); return; }
  if(!a) { showToast('Enter your answer','error'); return; }

  if(currentUser.username === 'admin') {
    setSetting('sg_secq_admin', {q, a: a.toLowerCase()});
  } else {
    const staff = JSON.parse(localStorage.getItem('sg_staff')||'[]');
    const s = staff.find(x => x.username === currentUser.username);
    if(s) { s.secQuestion=q; s.secAnswer=a.toLowerCase(); localStorage.setItem('sg_staff',JSON.stringify(staff)); sbSaveAllStaff(staff).catch(()=>{}); }
  }
  document.getElementById('secQSavedMsg').style.display = 'block';
  setTimeout(()=>document.getElementById('secQSavedMsg').style.display='none', 3000);
  showToast('✅ Security question saved successfully!');
  } catch(_e) { console.error("[SG] saveSecurityQuestion:", _e); }
}

function togglePassVis(fieldId, icon) {
  try {
  const field = document.getElementById(fieldId);
  if(field.type === 'password') {
    field.type = 'text';
    icon.textContent = '🙈';
  } else {
    field.type = 'password';
    icon.textContent = '👁️';
  }
  } catch(_e) { console.error("[SG] togglePassVis:", _e); }
}

document.addEventListener('input', function(e) {
  if(e.target.id === 'newPass') {
    const val = e.target.value;
    const el = document.getElementById('passStrength');
    if(!val) { el.innerHTML=''; return; }
    let strength = 0;
    if(val.length >= 6) strength++;
    if(val.length >= 10) strength++;
    if(/[A-Z]/.test(val)) strength++;
    if(/[0-9]/.test(val)) strength++;
    if(/[^A-Za-z0-9]/.test(val)) strength++;
    const labels = ['','Very Weak 🔴','Weak 🟠','Fair 🟡','Strong 🟢','Very Strong 💪'];
    const colors = ['','#e74c3c','#f39c12','#f1c40f','#2ecc71','#27ae60'];
    el.innerHTML = `<span style="color:${colors[strength]}">Password: ${labels[strength]}</span>`;
  }
});

function changePassword() {
  try {
  const oldPass = document.getElementById('oldPass').value.trim();
  const newPass = document.getElementById('newPass').value.trim();
  const confirmPass = document.getElementById('confirmPass').value.trim();

  if(!oldPass || !newPass || !confirmPass) {
    showToast('Please fill all fields', 'error'); return;
  }
  if(newPass.length < 6) {
    showToast('New password must be at least 6 characters', 'error'); return;
  }
  if(newPass !== confirmPass) {
    showToast('New passwords do not match', 'error'); return;
  }
  if(oldPass === newPass) {
    showToast('New password must be different from current', 'error'); return;
  }

  // Verify current password
  let verified = false;
  if(currentUser.username === 'admin') {
    const savedPass = (_settingsCache['sg_pass_admin']) || _DEFAULT_ADMIN_PW_HASH;
    if(_pwVerify(oldPass, savedPass)) verified = true;
  } else {
    const s = staff.find(x => x.username === currentUser.username);
    if(s && _pwVerify(oldPass, s.password)) verified = true;
  }

  if(!verified) {
    showToast('Current password is incorrect', 'error'); return;
  }

  // Save new password (hashed — Bug #1 fix)
  if(currentUser.username === 'admin') {
    setSetting('sg_pass_admin', _pwHash(newPass));
  } else {
    const s = staff.find(x => x.username === currentUser.username);
    if(s) {
      s.password = _pwHash(newPass);
      localStorage.setItem('sg_staff', JSON.stringify(staff)); sbSaveAllStaff(staff.length?staff:JSON.parse(localStorage.getItem('sg_staff')||'[]')).catch(()=>{});
    }
  }

  // Clear fields
  ['oldPass','newPass','confirmPass'].forEach(id => document.getElementById(id).value = '');
  showToast('✅ Password updated successfully!');

  // Show success message in form
  document.getElementById('passSuccessMsg').style.display = 'block';
  setTimeout(() => {
    document.getElementById('passSuccessMsg').style.display = 'none';
  }, 4000);
  } catch(_e) { console.error("[SG] changePassword:", _e); }
}

// ===== ADMIN =====
function openAdminLogin() {
  try {
  document.getElementById('customerSite').style.display='none';
  document.getElementById('adminLoginPage').style.display='block';
  document.getElementById('adminDashboard').style.display='none';
  } catch(e) { console.error("[SG] openAdminLogin error:", e); }
}
function showCustomerSite() {
  try {
  document.getElementById('customerSite').style.display='block';
  document.getElementById('adminLoginPage').style.display='none';
  document.getElementById('adminDashboard').style.display='none';
  } catch(e) { console.error("[SG] showCustomerSite error:", e); }
}
// ============================================================
//  PASSWORD SECURITY — SHA-256 hashing (Bug #1 fix)
//  Plaintext passwords ab kabhi store/compare nahi hote.
//  Purane plaintext passwords pehle successful login pe
//  automatically hash ho jaate hain (koi lockout nahi).
//  NOTE: Yeh client-side bypass (DevTools) ko fix NAHI karta —
//  uske liye Supabase Auth + RLS chahiye. Yeh sirf plaintext
//  leakage aur password-reuse risk band karta hai.
// ============================================================
function _sgSha256(ascii){
  function rightRotate(value,amount){return(value>>>amount)|(value<<(32-amount));}
  var mathPow=Math.pow,maxWord=mathPow(2,32),result='';
  var words=[],asciiBitLength=ascii.length*8;
  var hash=_sgSha256.h=_sgSha256.h||[];
  var k=_sgSha256.k=_sgSha256.k||[];
  var primeCounter=k.length;
  var isComposite={};
  for(var candidate=2;primeCounter<64;candidate++){
    if(!isComposite[candidate]){
      for(var i=0;i<313;i+=candidate){isComposite[i]=candidate;}
      hash[primeCounter]=(mathPow(candidate,0.5)*maxWord)|0;
      k[primeCounter++]=(mathPow(candidate,1/3)*maxWord)|0;
    }
  }
  ascii+='\x80';
  while(ascii.length%64-56)ascii+='\x00';
  for(var i=0;i<ascii.length;i++){
    var j=ascii.charCodeAt(i);
    if(j>>8)return;
    words[i>>2]|=j<<((3-i)%4)*8;
  }
  words[words.length]=((asciiBitLength/maxWord)|0);
  words[words.length]=(asciiBitLength);
  for(var j=0;j<words.length;){
    var w=words.slice(j,j+=16),oldHash=hash;
    hash=hash.slice(0,8);
    for(var i=0;i<64;i++){
      var w15=w[i-15],w2=w[i-2];
      var a=hash[0],e=hash[4];
      var temp1=hash[7]
        +(rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25))
        +((e&hash[5])^((~e)&hash[6]))
        +k[i]
        +(w[i]=i<16?w[i]:(
            w[i-16]
            +(rightRotate(w15,7)^rightRotate(w15,18)^(w15>>>3))
            +w[i-7]
            +(rightRotate(w2,17)^rightRotate(w2,19)^(w2>>>10))
          )|0
        );
      var temp2=(rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22))
        +((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash=[(temp1+temp2)|0].concat(hash);
      hash[4]=(hash[4]+temp1)|0;
    }
    for(var i=0;i<8;i++){hash[i]=(hash[i]+oldHash[i])|0;}
  }
  for(var i=0;i<8;i++){
    for(var j=3;j+1;j--){
      var b=(hash[i]>>(j*8))&255;
      result+=((b<16)?0:'')+b.toString(16);
    }
  }
  return result;
}
function _pwHash(p){
  var s = (typeof unescape!=='undefined')
    ? unescape(encodeURIComponent(String(p==null?'':p)))
    : String(p==null?'':p);
  return 'sha256$' + _sgSha256(s);
}
function _pwIsHashed(v){ return typeof v === 'string' && v.indexOf('sha256$') === 0; }
function _pwVerify(entered, stored){
  if(stored == null) return false;
  if(_pwIsHashed(stored)) return _pwHash(entered) === stored;
  return String(entered) === String(stored); // legacy plaintext (migrate after match)
}
// 'admin123' default ab sirf hash form mein — plaintext literal source se hata diya
var _DEFAULT_ADMIN_PW_HASH = _pwHash('admin123');

// ============================================================
//  XSS INPUT SANITIZER (Bug #2 fix)
//  Untrusted customer text store hone se pehle yahan se guzarta hai.
//  '<' '>' '"' hata dete hain — taaki koi HTML tag ya attribute
//  breakout na ban sake. Apostrophe (') jaan-bujhke rakha hai
//  taaki O'Brien / D'Souza jaise naam na tootein (ye render mein
//  safe hai kyunki attributes double-quoted hain).
// ============================================================
// Bug fix (XSS): escHtml extra.js mein define hai jo sabse baad load hoti hai —
// safety ke liye yahan bhi fallback (same implementation)
if(typeof window.escHtml !== 'function') {
  window.escHtml = function(str) {
    return String(str==null?'':str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;');
  };
}

// Bug #11 fix — Menu pe dikhne wala price bill jitna EXACT ho.
// Pehle display Math.round (poore rupaye) karta tha jabki bill paise-exact
// hai => ₹99 + 5% GST menu pe ₹104 dikhta tha, bill ₹103.95 banta tha.
// Whole rupee ho toh "104", warna "103.95" format.
function fmtPrice(n) {
  const v = Math.round((Number(n)||0) * 100) / 100;
  return (v % 1 === 0) ? String(v) : v.toFixed(2);
}

function _cleanText(s){
  if(s == null) return s;
  return String(s).replace(/[<>"]/g, '');
}

// ============================================================
// Bug fix: o.time "15/7/2026, 3:45:12 pm" (en-IN) format mein store hota hai.
// new Date() isse MM/DD samajhta tha => 13-31 tarikh pe Invalid Date,
// 1-12 pe month/day swap. Ye parser DD/MM sahi handle karta hai.
// ============================================================
function parseOrderTime(o) {
  try {
    if(!o) return null;
    if(o.created_at) { const d = new Date(o.created_at); if(!isNaN(d)) return d; }
    const t = (typeof o === 'string') ? o : (o.time || '');
    if(!t) return null;
    const m = String(t).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
    if(m) {
      let hh = parseInt(m[4]||'0',10);
      const ap = (m[7]||'').toLowerCase();
      if(ap==='pm' && hh<12) hh += 12;
      if(ap==='am' && hh===12) hh = 0;
      const d = new Date(parseInt(m[3],10), parseInt(m[2],10)-1, parseInt(m[1],10), hh, parseInt(m[5]||'0',10), parseInt(m[6]||'0',10));
      return isNaN(d) ? null : d;
    }
    const d = new Date(t);
    return isNaN(d) ? null : d;
  } catch(e) { return null; }
}

async function doLogin() {
  try {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  if(!u || !p) { showToast('Please enter username and password', 'error'); return; }

  const allUsers = getUsers();
  let valid = false;
  let authSession = false;

  // ============================================
  // Step 1: Supabase Auth se login try karo (asli security)
  // ============================================
  try {
    const { data: aData, error: aErr } = await sgAuthSignIn(u, p);
    if(!aErr && aData && aData.session) authSession = true;
  } catch(e) { console.error('[SG] auth signin:', e); }

  if(authSession) {
    if(u === 'admin') {
      currentUser = {...allUsers.admin, username:'admin'};
      valid = true;
    } else {
      let su = staff.find(s => s.username === u);
      if(!su) { try { const fresh = await sbGetStaff(); if(fresh && fresh.length) { staff = fresh; su = staff.find(s => s.username === u); } } catch(e) {} }
      if(su) { currentUser = {name:su.name, role:su.role, perms:su.perms, username:u}; }
      else { currentUser = {name:u, role:'Staff', perms:[], username:u}; } // auth sahi hai, record baad mein sync hoga
      valid = true;
    }
  } else {
    // ============================================
    // Step 2: Legacy check (purane users — pehli baar login pe
    // inka Supabase Auth account automatically ban jayega)
    // ============================================
    let adminPass = _settingsCache['sg_pass_admin'] || _DEFAULT_ADMIN_PW_HASH;
    try {
      const result = await sbGetSetting('sg_pass_admin', null);
      if(result) adminPass = result;
    } catch(e) { /* keep cached value */ }

    if(u === 'admin' && _pwVerify(p, adminPass)) {
      currentUser = {...allUsers.admin, username:'admin'};
      valid = true;
      if(!_pwIsHashed(adminPass)) setSetting('sg_pass_admin', _pwHash(p)); // migrate legacy plaintext
    } else {
      const su = staff.find(s => s.username === u && _pwVerify(p, s.password));
      if(su) {
        currentUser = {name:su.name, role:su.role, perms:su.perms, username:u};
        valid = true;
        if(!_pwIsHashed(su.password)) { // migrate legacy plaintext staff password
          su.password = _pwHash(p);
          try { localStorage.setItem('sg_staff', JSON.stringify(staff)); sbSaveAllStaff(staff).catch(()=>{}); } catch(_m){}
        }
      }
    }

    // Auto-migration: legacy login sahi tha → Supabase Auth account banao
    if(valid) {
      try {
        const { error: sErr } = await sgAuthSignUp(u, p);
        if(sErr) {
          if(/password/i.test(sErr.message||'') && !/already/i.test(sErr.message||'')) {
            showToast('⚠️ Password kam se kam 6 characters ka hona chahiye — Supabase account nahi bana. Password change karke dobara login karna.', 'warning');
          } else if(/already/i.test(sErr.message||'')) {
            // Account hai lekin password match nahi hua — stale password
            showToast('⚠️ Password sync issue — admin se password reset karwao.', 'warning');
          }
        } else {
          try { const { data: rIn } = await sgAuthSignIn(u, p); if(rIn && rIn.session) authSession = true; } catch(_i){}
        }
      } catch(_s) { console.error('[SG] auth migrate:', _s); }
    }
  }

  if(!valid) { showToast('Invalid credentials', 'error'); return; }

  sessionStorage.setItem('sg_session', JSON.stringify({username:u, time:Date.now()}));
  localStorage.setItem('sg_last_section', 'overview');
  document.getElementById('adminLoginPage').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'block';
  setupDashboard('overview');
  // Fresh login: orders/customers ab load karo (startup pe session nahi tha,
  // isliye wo tab skip hue the). Guard se double-subscribe nahi hoga.
  if(!window._staffRTOn){
    window._staffRTOn = true;
    Promise.all([sbGetOrders(), sbGetCustomers()]).then(function(r){
      orders = r[0]||[]; customers = r[1]||[];
      subscribeOrdersRealtime(); subscribeCustomersRealtime();
      try{updateStats();}catch(e){} try{renderOrders();}catch(e){} try{updatePendingBadge();}catch(e){}
    }).catch(function(e){ console.error('[SG] post-login load:', e); });
  }
  } catch(_e) { console.error("[SG] doLogin:", _e); }
}

function doLogout() {
  try {
  currentUser=null;
  sessionStorage.removeItem('sg_session');
  localStorage.removeItem('sg_last_section');
  // Bug #10 fix: logout pe orders/customers realtime channels band karo
  // (pehle chalti rehti thin) aur _staffRTOn reset karo — warna same tab
  // mein dobara login karne pe fresh data refetch skip ho jata tha (stale data).
  try { if(window._sgOrdersChannel) { _supabase.removeChannel(window._sgOrdersChannel); window._sgOrdersChannel = null; } } catch(e) {}
  try { if(window._sgCustomersChannel) { _supabase.removeChannel(window._sgCustomersChannel); window._sgCustomersChannel = null; } } catch(e) {}
  window._staffRTOn = false;
  sgAuthSignOut(); // Supabase Auth session bhi band karo
  showCustomerSite();
  } catch(_e) { console.error("[SG] doLogout:", _e); }
}

// Restore session on page refresh
function restoreAdminSession() {
  try {
    const sessStr = sessionStorage.getItem('sg_session');
    if(!sessStr) return false;
    const sess = JSON.parse(sessStr);
    if(!sess || !sess.username) return false;
    // Restore user
    const allUsers = getUsers();
    if(sess.username === 'admin') {
      currentUser = {...allUsers.admin, username:'admin'};
    } else {
      const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
      const su = staffList.find(s=>s.username===sess.username);
      if(!su) return false;
      currentUser = {name:su.name, role:su.role, perms:su.perms, username:su.username};
    }
    // Show dashboard
    document.getElementById('customerSite').style.display='none';
    document.getElementById('adminLoginPage').style.display='none';
    document.getElementById('adminDashboard').style.display='block';
    // Restore last section
    const lastSection = localStorage.getItem('sg_last_section') || 'overview';
    setupDashboard(lastSection);
    return true;
  } catch(e) {
    console.warn('Session restore failed:', e);
    return false;
  }
}

// ===== DASHBOARD =====
function setupDashboard(targetSection) {
  try {
  document.getElementById('loggedUserChip').textContent=currentUser.name;
  document.getElementById('sidebarRole').textContent=currentUser.role;
  const isAdmin=currentUser.role==='Admin';
  // show/hide staff and menu tabs
  document.getElementById('siStaff').style.display=(isAdmin||(currentUser.perms||[]).some(p=>p.startsWith('Staff -')))?'flex':'none';
  document.getElementById('siMenu').style.display=(isAdmin||(currentUser.perms||[]).some(p=>p.startsWith('Menu -')))?'flex':'none';
  const siInv=document.getElementById('siInventory');
  if(siInv) siInv.style.display=(isAdmin||(currentUser.perms||[]).some(p=>p.startsWith('Inventory -')))?'flex':'none';
  const siKDS=document.getElementById('siKDS');
  if(siKDS) siKDS.style.display=(isAdmin||(currentUser.perms||[]).some(p=>p.startsWith('KDS -')))?'flex':'none';
  const siTable=document.getElementById('siTable');
  if(siTable) siTable.style.display=(isAdmin||(currentUser.perms||[]).some(p=>p.startsWith('Table -')))?'flex':'none';
  if(!isAdmin && !(currentUser.perms||[]).includes('View Customers'))
    document.getElementById('siCustomers').style.display='none';
  else document.getElementById('siCustomers').style.display='flex';

  // Only update stats immediately (lightweight)
  try { updateStats(); } catch(e) { console.warn('updateStats error:', e); }
  try { updatePendingBadge(); } catch(e) { console.warn('pendingBadge error:', e); }
  try { setupNewSidebarItems(); } catch(e) {}

  // Only show a section if explicitly passed
  if(targetSection) showDash(targetSection);
  } catch(e) { console.error("[SG] setupDashboard error:", e); }
}

// ===== MOBILE SIDEBAR =====
function toggleSiteNav() {
  const nav = document.getElementById('siteNavLinks');
  if(nav) nav.classList.toggle('site-nav-open');
}
function closeSiteNav() {
  const nav = document.getElementById('siteNavLinks');
  if(nav) nav.classList.remove('site-nav-open');
}

function openMobileSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const closeBtn = document.querySelector('.mobile-close-btn');
  if(sidebar) sidebar.classList.add('mobile-open');
  if(overlay) overlay.classList.add('active');
  if(closeBtn) closeBtn.style.display = 'block';
}
function closeMobileSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const closeBtn = document.querySelector('.mobile-close-btn');
  if(sidebar) sidebar.classList.remove('mobile-open');
  if(overlay) overlay.classList.remove('active');
  if(closeBtn) closeBtn.style.display = 'none';
}
function setMobileActive(el) {
  document.querySelectorAll('.mobile-bottom-nav a').forEach(a => a.classList.remove('mob-nav-active'));
  if(el) el.classList.add('mob-nav-active');
  // Close sidebar if open
  closeMobileSidebar();
}

async function showDash(s) {
  try { updateTableHeaders(); } catch(e) {}
  document.querySelectorAll('.dash-section').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(x=>x.classList.remove('active'));

  // Scroll main-content to top so header is always visible
  const mc = document.querySelector('.main-content');
  if(mc) mc.scrollTop = 0;

  // Show correct section
  const sec = document.getElementById('sec-'+s);
  if(sec) sec.classList.add('active');

  // Sidebar ID map
  const sidebarIdMap = {
    overview: 'siOverview',
    orders: 'siOrders',
    customers: 'siCustomers',
    staff: 'siStaff',
    myteam: 'siMyTeam',
    menuMgmt: 'siMenu',
    inventory: 'siInventory',
    kds: 'siKDS',
    table: 'siTable',
    password: 'siChangePassword',
    settings: 'siSettings',
    reports: 'siReports',
    coupons: 'siCoupons',
    loyalty: 'siLoyalty',
    attendance: 'siAttendance',
    support: 'siSupport',
  };
  const sidebarEl = document.getElementById(sidebarIdMap[s]);
  if(sidebarEl) sidebarEl.classList.add('active');

  // Save current section to session
  try {
    const sessStr = sessionStorage.getItem('sg_session');
    if(sessStr) {
      const sessData = JSON.parse(sessStr);
      sessData.lastSection = s;
      sessionStorage.setItem('sg_session', JSON.stringify(sessData));
    }
    localStorage.setItem('sg_last_section', s);
  } catch(e) {}

  // Update title and subtitle
  const titles = {
    overview:  {title:'Dashboard Overview',    sub:'Welcome back! Here is what is happening today.'},
    orders:    {title:'Order Management',      sub:'Manage and track all customer orders.'},
    customers: {title:'Customer Records',      sub:'View and manage customer information.'},
    staff:     {title:'Staff Access Control',  sub:'Manage staff accounts and permissions.'},
    myteam:    {title:'My Team',               sub:'Staff members who report to you.'},
    menuMgmt:  {title:'Menu Management',       sub:'Add, edit and manage your menu items.'},
    inventory: {title:'Inventory Management',   sub:'Track stock, vendors, purchases and waste.'},
    kds:       {title:'Kitchen Display System',   sub:'Real-time order tracking for kitchen staff.'},
    table:     {title:'Table Management',          sub:'Walk-in table management for dine-in orders.'},
    password:  {title:'Change Password',       sub:'Update your login password securely.'},
    settings:  {title:'Restaurant Settings',    sub:'Operating hours, delivery charges, categories, classifications.'},
    reports:   {title:'Reports & Analytics',   sub:'Revenue insights, top items, GST reports.'},
    coupons:   {title:'Coupons & Promo Codes', sub:'Create and manage discount codes.'},
    loyalty:   {title:'Loyalty Points',        sub:'Reward customers with points on every order.'},
    attendance:{title:'Staff Attendance',      sub:'Track daily check-in/check-out records.'},
    support:   {title:'Support',               sub:'Complaints, inquiries & omnichannel tickets.'},
  };
  const t = titles[s] || {title:s, sub:''};
  document.getElementById('dashTitle').textContent = t.title;
  document.getElementById('dashSubtitle').textContent = t.sub;

  // Section specific render
  if(s==='menuMgmt') setTimeout(function(){ try{renderMenuMgmt();}catch(e){} }, 0);
  if(s==='inventory') setTimeout(function(){ try{renderInventory();}catch(e){} }, 0);
  if(s==='kds') setTimeout(function(){ try{renderKDS();}catch(e){} }, 0);
  if(s==='table') setTimeout(function(){ try{renderTableMgmt();}catch(e){} }, 0);
  if(s==='orders') setTimeout(function(){ try{renderOrders();}catch(e){} try{renderDeliveryBoys();}catch(e){} }, 0);
  if(s==='customers') setTimeout(function(){ try{renderCustomers();}catch(e){} }, 0);
  if(s==='staff') setTimeout(function(){ try{renderStaff();}catch(e){} }, 0);
  if(s==='kpi') setTimeout(async function(){
    try {
      // Refresh orders from Supabase for accurate KPI data
      const freshOrders = await sbGetOrders();
      if(freshOrders && freshOrders.length) orders = freshOrders;
      const freshCustomers = await sbGetCustomers();
      if(freshCustomers && freshCustomers.length) customers = freshCustomers;
      const fresh = await sbGetSetting('sg_kpi_targets', null);
      if(fresh) { _settingsCache['sg_kpi_targets']=fresh; localStorage.setItem('sg_kpi_targets', JSON.stringify(fresh)); }
      setKPIPeriod(window._kpiPeriod||'weekly');
    } catch(e) { try{setKPIPeriod('weekly');}catch(e2){} }
  }, 0);
  if(s==='taskHistory') setTimeout(async function(){
    try {
      const fresh = await sbGetSetting('sg_tasks', null);
      if(fresh && Array.isArray(fresh)) { localStorage.setItem('sg_tasks', JSON.stringify(fresh)); }
      renderTaskHistory();
    } catch(e) { try{renderTaskHistory();}catch(e2){} }
  }, 0);
  if(s==='taskLoad') setTimeout(async function(){
    try {
      const fresh = await sbGetSetting('sg_tasks', null);
      if(fresh && Array.isArray(fresh)) { localStorage.setItem('sg_tasks', JSON.stringify(fresh)); }
      renderTaskLoad();
    } catch(e) { try{renderTaskLoad();}catch(e2){} }
  }, 0);
  if(s==='schedule') setTimeout(function(){ try{initDefaultShifts();showSchedTab('weekly');}catch(e){} }, 0);
  if(s==='budget') setTimeout(async function(){
    try {
      const fresh = await sbGetSetting('sg_budgets', null);
      if(fresh && Array.isArray(fresh)) { localStorage.setItem('sg_budgets', JSON.stringify(fresh)); }
      const freshExp = await sbGetSetting('sg_expenses', null);
      if(freshExp && Array.isArray(freshExp)) { localStorage.setItem('sg_expenses', JSON.stringify(freshExp)); }
      setBudgetPeriod(window._budgetPeriod||'monthly');
    } catch(e) { try{setBudgetPeriod('monthly');}catch(e2){} }
  }, 0);
  if(s==='autoReport') setTimeout(async function(){
    try {
      const freshOrders = await sbGetOrders();
      if(freshOrders && freshOrders.length) orders = freshOrders;
      setReportPeriod(window._repPeriod||'daily');
    } catch(e) { try{setReportPeriod('daily');}catch(e2){} }
  }, 0);
  if(s==='settings') setTimeout(function(){ try{renderSettingsSection();}catch(e){} }, 0);
  if(s==='reports') setTimeout(async function(){
    try {
      const freshOrders = await sbGetOrders();
      if(freshOrders && freshOrders.length) orders = freshOrders;
      renderReports();
    } catch(e) { try{renderReports();}catch(e2){} }
  }, 0);
  if(s==='support') setTimeout(async function(){
    try {
      const freshTickets = await sbGetSetting('sg_tickets', null);
      if(freshTickets && Array.isArray(freshTickets)) {
        localStorage.setItem('sg_tickets', JSON.stringify(freshTickets));
      }
      const freshChats = await sbGetSetting('sg_webchats', null);
      if(freshChats) {
        localStorage.setItem('sg_webchats', JSON.stringify(freshChats));
      }
      showSupportTab('tickets');
    } catch(e) { try{showSupportTab('tickets');}catch(e2){} }
  }, 0);
  if(s==='coupons') setTimeout(async function(){
    try {
      const fresh = await sbGetSetting('sg_coupons', null);
      if(fresh) { _settingsCache['sg_coupons']=fresh; localStorage.setItem('sg_coupons', JSON.stringify(fresh)); }
      renderCoupons();
    } catch(e) { try{renderCoupons();}catch(e2){} }
  }, 0);
  if(s==='loyalty') setTimeout(async function(){
    try {
      const freshL = await sbGetSetting('sg_loyalty', null);
      if(freshL) { _settingsCache['sg_loyalty']=freshL; localStorage.setItem('sg_loyalty', JSON.stringify(freshL)); }
      const freshLS = await sbGetSetting('sg_loyalty_settings', null);
      if(freshLS) { _settingsCache['sg_loyalty_settings']=freshLS; localStorage.setItem('sg_loyalty_settings', JSON.stringify(freshLS)); }
      loadLoyaltySettings(); renderLoyaltyTable(); renderLoyaltySummary();
    } catch(e) { try{loadLoyaltySettings();renderLoyaltyTable();renderLoyaltySummary();}catch(e2){} }
  }, 0);
  if(s==='attendance') setTimeout(async function(){
    try {
      const fresh = await sbGetSetting('sg_attendance', null);
      if(fresh && Array.isArray(fresh)) { localStorage.setItem('sg_attendance', JSON.stringify(fresh)); }
      populateAttStaffFilter(); renderAttendance(); renderAttTodayStatus();
    } catch(e) { try{populateAttStaffFilter();renderAttendance();renderAttTodayStatus();}catch(e2){} }
  }, 0);
  if(s==='myteam') setTimeout(function(){ try{renderMyTeam();}catch(e){} }, 0);
}

function updateStats() {
  try {
  // orders + customers already loaded in memory from Supabase
  const pending=orders.filter(o=>o.status==='Pending').length;
  document.getElementById('statTotal').textContent=orders.length;
  document.getElementById('statPending').textContent=pending;
  document.getElementById('statDelivered').textContent=orders.filter(o=>o.status==='Delivered').length;
  document.getElementById('statCustomers').textContent=customers.length;
  document.getElementById('pendingCount').textContent=pending;
  // recent
  const tbody=document.getElementById('recentOrdersBody');
  tbody.innerHTML=orders.slice(0,6).map((o,idx)=>`
    <tr>
      <td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${idx+1}</td>
      <td><b>${o.id}</b></td><td>${escHtml(o.name)}</td>
      <td>${o.items.map(i=>i.name).join(', ')}</td>
      <td><b>₹${o.total}</b></td>
      <td><span class="status ${(o.status||'').toLowerCase().replace(' ','-')}">${o.status}</span></td>
    </tr>`).join('');
  if(!orders.length) tbody.innerHTML='<tr><td colspan="6"><div class="empty"><div class="empty-icon">🧾</div><p>No orders yet</p></div></td></tr>';
  } catch(e) { console.error("[SG] updateStats error:", e); }
}

function updatePendingBadge() {
  try {
    const pending = orders.filter(o=>o.status==='Pending').length;
    const badge = document.getElementById('pendingOrderBadge');
    if(badge) {
      badge.textContent = pending;
      badge.style.display = pending > 0 ? 'inline-flex' : 'none';
    }
    // Also update staff pending badge
    const staffBadge = document.getElementById('pendingStaffBadge');
    if(staffBadge) {
      const staff = JSON.parse(localStorage.getItem('sg_staff')||'[]');
      const pendingStaff = staff.filter(s=>s.status==='pending').length;
      staffBadge.textContent = pendingStaff;
      staffBadge.style.display = pendingStaff > 0 ? 'inline-flex' : 'none';
    }
  } catch(e) { console.warn('updatePendingBadge error:', e); }
}

async function renderOrders() {
  try { updateTableHeaders(); } catch(e) {}
  orders = await sbGetOrders();
  if(!customers.length) customers = await sbGetCustomers();

  // Show loading immediately
  const tbody=document.getElementById('ordersTableBody');
  if(tbody) tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:30px;"><div style="font-size:1.5rem;">⏳</div><div style="color:var(--muted);margin-top:8px;">Loading orders...</div></td></tr>';

  // Defer heavy render
  setTimeout(function() {
  const search=(document.getElementById('orderSearch')?.value||'').toLowerCase();
  const filter=document.getElementById('orderFilter')?.value||'';
  const typeFilter=document.getElementById('orderTypeFilter')?.value||'';
  const dateFilter=document.getElementById('orderDateFilter')?.value||'';
  let filtered=orders;
  if(search) filtered=filtered.filter(o=>(o.name||'').toLowerCase().includes(search)||(o.id||'').toLowerCase().includes(search)||(o.mobile||'').includes(search));
  if(filter) filtered=filtered.filter(o=>o.status===filter);
  if(typeFilter) filtered=filtered.filter(o=>o.type===typeFilter);
  if(dateFilter) {
    const now=new Date();
    if(dateFilter==='today') {
      const td=now.toLocaleDateString('en-IN');
      filtered=filtered.filter(o=>(o.time||'').includes(td));
    } else if(dateFilter==='week') {
      const wa=new Date(now-7*86400000);
      filtered=filtered.filter(o=>{const d=parseOrderTime(o);return d?d>=wa:true;});
    } else if(dateFilter==='month') {
      const ma=new Date(now-30*86400000);
      filtered=filtered.filter(o=>{const d=parseOrderTime(o);return d?d>=ma:true;});
    } else if(dateFilter==='custom') {
      const from=document.getElementById('orderDateFrom')?.value;
      const to=document.getElementById('orderDateTo')?.value;
      if(from||to) filtered=filtered.filter(o=>{
        const d=parseOrderTime(o);if(!d)return true;if(from&&d<new Date(from))return false;if(to&&d>new Date(to+'T23:59:59'))return false;return true;
      });
    }
  }
  const assignments = getOrderAssignments();
  document.getElementById('orderCount').textContent=filtered.length+' orders';
  const isAdmin=currentUser?.role==='Admin';
  const canUpdate=isAdmin||currentUser?.perms?.some(p=>p.startsWith('Status -'));
  const canDelete=isAdmin||currentUser?.perms?.includes('Delete Orders');
  // Sort by date: latest first
  filtered = [...filtered].sort(function(a,b){
    var da = a.date || (a.time ? (function(){try{var p=a.time.split(',')[0].split('/');return p.length===3?p[2].trim()+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'):'';} catch(e){return '';}})() : '');
    var db = b.date || (b.time ? (function(){try{var p=b.time.split(',')[0].split('/');return p.length===3?p[2].trim()+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'):'';} catch(e){return '';}})() : '');
    return db > da ? 1 : db < da ? -1 : 0;
  });

  if(!filtered.length){tbody.innerHTML='<tr><td colspan="9"><div class="empty"><div class="empty-icon">🧾</div><p>No orders found</p></div></td></tr>';return;}

  // Pagination — 25 per page
  const PAGE_SIZE = 25;
  window._orderPage = window._orderPage || 1;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if(window._orderPage > totalPages) window._orderPage = 1;
  const pageOrders = filtered.slice((window._orderPage-1)*PAGE_SIZE, window._orderPage*PAGE_SIZE);

  const allCustomers = customers; // from Supabase in-memory
  const _orderColsDef = typeof getColumns==='function' ? getColumns('orders') : [{id:'orderId',field:'id'},{id:'customer',field:'name'},{id:'mobile',field:'mobile'},{id:'items',field:'items'},{id:'total',field:'grandTotal'},{id:'type',field:'type'},{id:'status',field:'status'},{id:'actions',field:'actions'}];
  const visibleOrderCols = _orderColsDef.filter(function(c){return !c.hidden;});

  tbody.innerHTML=pageOrders.map(o=>{
    const a = assignments[o.id]||{};
    // Build assigned cell
    let assignedHtml = '<span style="color:#ccc;font-size:0.75rem;">—</span>';
    if(a.cookName || a.assignedName || a.handedToName || a.deliveryBoyName) {
      let lines = [];
      if(a.cookName) lines.push(`<div style="display:flex;align-items:center;gap:4px;"><span style="background:#fff3e0;color:#e65100;font-size:0.68rem;padding:1px 5px;border-radius:8px;font-weight:700;">👨‍🍳</span><span style="font-size:0.78rem;font-weight:600;">${escHtml(a.cookName)}</span></div>`);
      if(a.assignedName && a.assignedName!==a.cookName) lines.push(`<div style="display:flex;align-items:center;gap:4px;"><span style="background:#e3f2fd;color:#1565c0;font-size:0.68rem;padding:1px 5px;border-radius:8px;font-weight:700;">👤</span><span style="font-size:0.78rem;font-weight:600;">${escHtml(a.assignedName)}</span></div>`);
      if(a.handedToName) lines.push(`<div style="display:flex;align-items:center;gap:4px;"><span style="background:#e8f5e9;color:#2e7d32;font-size:0.68rem;padding:1px 5px;border-radius:8px;font-weight:700;">✋</span><span style="font-size:0.78rem;font-weight:600;">${escHtml(a.handedToName)}</span></div>`);
      if(a.deliveryBoyName) lines.push(`<div style="display:flex;align-items:center;gap:4px;"><span style="background:#f3e5f5;color:#7b1fa2;font-size:0.68rem;padding:1px 5px;border-radius:8px;font-weight:700;">🚴</span><span style="font-size:0.78rem;font-weight:600;">${escHtml(a.deliveryBoyName)}</span></div>`);
      if(a.reassignStatus==='pending') lines.push(`<div style="font-size:0.65rem;color:#f57c00;font-weight:700;">⏳ Pending Accept</div>`);
      assignedHtml = lines.join('');
    }
    // Customer class
    const _oc = getCustomerClass(allCustomers.find(c=>c.mobile===o.mobile)||{mobile:o.mobile,name:o.name}, window._custPeriod||'');
    const _oN = _oc&&(_oc.name==='Normal'||(!_oc.minWeekly&&!_oc.minMonthly&&!_oc.minYearly));
    const _rowBg = _oc&&!_oN ? 'background:'+_oc.color+'55;border-left:5px solid '+_oc.color+';' : '';
    const _oCls = _oc&&!_oN ? '<span style="font-size:0.65rem;background:'+_oc.color+';color:#fff;padding:1px 6px;border-radius:8px;display:inline-block;margin-left:4px;font-weight:700;">'+_oc.name+'</span>' : '';
    const orderCols = visibleOrderCols;
    const cells = orderCols.map(function(col){
      switch(col.field){
        case 'id': return '<td><b style="color:var(--fire)">'+o.id+'</b></td>';
        case 'name': return '<td>'+escHtml(o.name)+_oCls+'</td>';
        case 'mobile': return '<td>'+((isAdmin||currentUser&&currentUser.perms&&currentUser.perms.includes('View Orders - Mobile'))?escHtml(o.mobile):'••••••••••')+'</td>';
        case 'items': return '<td style="max-width:130px;font-size:0.8rem;">'+(o.items||[]).map(function(i){return escHtml(i.name)+' x'+i.qty;}).join(', ')+'</td>';
        case 'grandTotal': return '<td><b>₹'+(o.grandTotal||o.total)+'</b>'+(o.dineInReservCharge>0?'<div style="font-size:0.68rem;color:var(--muted);">incl. ₹'+o.dineInReservCharge+' resv.</div>':'')+'</td>';
        case 'type': return '<td>'+o.type+(o.type==='Dine-In'&&(o.tableNum||o.dineInDate)?'<div style="font-size:0.72rem;color:var(--muted);">'+(o.tableNum?'🪑 Table '+escHtml(o.tableNum):'')+' '+(o.dineInDate?'📅'+new Date(o.dineInDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'')+'</div>':'')+(o.type==='Home Delivery'&&o.address?'<div style="font-size:0.72rem;color:var(--muted);">📍 '+escHtml(o.address.substring(0,30))+'...</div>':'')+'</td>';
        case 'assigned': return '<td style="min-width:110px;">'+assignedHtml+'</td>';
        case 'address': return '<td style="font-size:0.82rem;">'+escHtml(o.address||'—')+'</td>';
          case 'date': {
            var dv=o.date||'';
            if(!dv&&o.time){try{var tp2=o.time.split(',')[0].split('/');if(tp2.length===3) dv=tp2[0].padStart(2,'0')+'/'+tp2[1].padStart(2,'0')+'/'+tp2[2].trim();}catch(e2){}}
            if(dv&&dv.includes('-')&&dv.length===10){var dp2=dv.split('-');dv=dp2[2]+'/'+dp2[1]+'/'+dp2[0];}
            return '<td style="font-size:0.82rem;white-space:nowrap;">'+(dv||'—')+'</td>';
          }
        case 'internalStatus': {
          return '<td data-col="internalStatus">'+buildInternalStatusCellHtml(o)+'</td>';
        }
        case 'status': {
          return '<td data-col="status">'+buildStatusCellHtml(o, canUpdate, isAdmin)+'</td>';
        }
        case 'actions': {
          var oid = o.id;
          var btns = '<button class="act-btn act-view" onclick="viewOrder(&quot;'+oid+'&quot;)">View</button>';
          btns += '<button class="act-btn" onclick="openPrintSlip(&quot;'+oid+'&quot;)" style="background:#e8eaf6;color:#3949ab;border:1px solid #9fa8da;" title="Print Slip">🖨️</button>';
          if(canDelete) btns += '<button class="act-btn act-delete" onclick="deleteOrder(&quot;'+oid+'&quot;)">Del</button>';
          if(isAdmin||isManager(currentUser)||isAuthorizedEmployee(currentUser)) btns += '<button class="act-btn" onclick="openReassignOrderModal(&quot;'+oid+'&quot;)" style="background:#e3f2fd;color:#1565c0;border:1px solid #bee3f8;font-size:0.72rem;">🔄</button>';
          if((isAdmin||isManager(currentUser)||isAuthorizedEmployee(currentUser))&&o.type==='Home Delivery'&&o.status==='Ready'&&!a.deliveryBoyId) btns += '<button class="act-btn" onclick="openManualDeliveryAssign(&quot;'+oid+'&quot;)" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;font-size:0.72rem;">🚴</button>';
          var staffList=JSON.parse(localStorage.getItem('sg_staff')||'[]');
          var me2=staffList.find(function(s){return currentUser&&s.username===currentUser.username;});
          if(a.reassignStatus==='pending'&&me2&&me2.id===a.pendingReassignTo){
            btns += '<button class="act-btn" onclick="respondToReassign(&quot;'+oid+'&quot;,true)" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;font-size:0.7rem;">✅ Accept</button>';
            btns += '<button class="act-btn" onclick="respondToReassign(&quot;'+oid+'&quot;,false)" style="background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;font-size:0.7rem;">❌ Reject</button>';
          }
          return '<td><div class="action-btns" style="flex-wrap:wrap;gap:3px;">'+btns+'</div></td>';
        }
        default: {
          if(typeof col.field==='string' && col.field.indexOf('custom:')===0) {
            const ckey = (col.field.slice(7) + ' ' + (col.description||'')).toLowerCase();
            const isKnownConcept = /size|address|delivery|mobile|phone|contact|email|status|total|amount|bill|price|note|remark|instruction|time|timing|booking|booked/.test(ckey);
            if(isKnownConcept) {
              // Resolves to real order data — show as read-only text
              return '<td style="font-size:0.82rem;">'+escHtml(getFieldValue?getFieldValue(o,col.field,'orders'):'—')+'</td>';
            }
            // True custom field — manually entered per row
            const cval = (o.customData && o.customData[col.field.slice(7)]) || '';
            return '<td><input type="text" value="'+(cval+'').replace(/"/g,'&quot;')+'" placeholder="—" '+
              'onchange="updateOrderCustomField(\''+o.id+'\',\''+col.field.slice(7)+'\',this.value)" '+
              'style="width:100%;min-width:90px;padding:4px 6px;border:1px solid #e8d5c8;border-radius:6px;font-size:0.8rem;background:#fffdf9;"></td>';
          }
          return '<td style="font-size:0.82rem;">'+escHtml(getFieldValue?getFieldValue(o,col.field,'orders'):'—')+'</td>';
        }
      }
    }).join('');
    const _sno = (window._orderPage-1)*PAGE_SIZE + pageOrders.indexOf(o) + 1;
    const _snoCell = '<td style="position:sticky;left:0;z-index:1;background:'+ (_rowBg ? '#fff9f0' : '#fff') +';border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;min-width:50px;">'+_sno+'</td>';
    return '<tr data-order-id="'+o.id+'" style="'+_rowBg+'">'+_snoCell+cells+'</tr>';
  }).join('');

  // Pagination controls
  if(totalPages > 1) {
    var paginationEl = document.getElementById('ordersPagination');
    if(!paginationEl) {
      paginationEl = document.createElement('div');
      paginationEl.id = 'ordersPagination';
      tbody.parentElement.parentElement.appendChild(paginationEl);
    }
    paginationEl.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;padding:14px;flex-wrap:wrap;';
    paginationEl.innerHTML =
      '<button onclick="window._orderPage=Math.max(1,window._orderPage-1);renderOrders();" style="padding:6px 14px;border-radius:8px;border:2px solid #e8d5c8;background:#fff;cursor:pointer;font-weight:700;" '+(window._orderPage===1?'disabled':'')+'>← Prev</button>' +
      '<span style="font-size:0.85rem;color:var(--muted);">Page '+window._orderPage+' of '+totalPages+' ('+filtered.length+' orders)</span>' +
      '<button onclick="window._orderPage=Math.min('+totalPages+',window._orderPage+1);renderOrders();" style="padding:6px 14px;border-radius:8px;border:2px solid #e8d5c8;background:#fff;cursor:pointer;font-weight:700;" '+(window._orderPage===totalPages?'disabled':'')+'>Next →</button>';
  } else {
    var pEl = document.getElementById('ordersPagination');
    if(pEl) pEl.innerHTML = '';
  }

  }, 0); // end setTimeout
}


// ===== NESTED PERMISSION ACCORDION HELPER =====
function renderPermAccordionHTML(grp, gi, staffPerms, staffId, canEdit, prefix) {
  try {
  const activePerms = grp.perms.filter(p => staffPerms.includes(p));
  const accId = prefix+'_'+gi;

  // If nested (Update Order Status) - group by status type
  if(grp.nested) {
    const statusGroups = [
      {name:'⏳ Pending',   statuses:['Pending']},
      {name:'✅ Confirmed', statuses:['Confirmed']},
      {name:'👨‍🍳 Preparing', statuses:['Preparing']},
      {name:'🟢 Ready',     statuses:['Ready']},
      {name:'🚴 Delivered', statuses:['Delivered']},
      {name:'❌ Cancelled', statuses:['Cancelled']},
    ];
    const orderTypes = [
      {key:'Home Delivery', icon:'🚴'},
      {key:'Takeaway',      icon:'🥡'},
      {key:'Dine-In',       icon:'🪑'},
    ];

    const innerHTML = statusGroups.map((sg, sgi) => {
      const sgPerms = grp.perms.filter(p => sg.statuses.some(s => p.includes('Status - '+s+' - ')));
      const sgActive = sgPerms.filter(p => staffPerms.includes(p));
      const subAccId = accId+'_sg'+sgi;
      return `<div style="border:1px solid #e8ddd5;border-radius:8px;overflow:hidden;margin-bottom:6px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#faf7f4;cursor:pointer;" onclick="toggleAcc('${subAccId}')">
          <span style="font-weight:600;font-size:0.85rem;">${sg.name}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="acc-count ${sgActive.length===0?'zero':''}" style="font-size:0.7rem;">${sgActive.length}/${sgPerms.length}</span>
            <span style="color:#aaa;font-size:0.7rem;" id="arrow_${subAccId}">▼</span>
          </div>
        </div>
        <div class="acc-body" id="${subAccId}">
          ${orderTypes.map(ot => {
            const perm = 'Status - '+sg.statuses[0]+' - '+ot.key;
            const has = staffPerms.includes(perm);
            return `<div class="perm-item" style="padding:7px 12px;border-bottom:1px solid #faf7f4;">
              <span style="font-size:0.82rem;color:${has?'var(--dark)':'#aaa'};">${ot.icon} ${ot.key}</span>
              ${canEdit ?
                `<button class="toggle ${has?'on':'off'}" onclick="togglePerm('${staffId}','${perm}')"></button>` :
                `<span class="toggle ${has?'on':'off'}" style="cursor:not-allowed;opacity:0.6;"></span>`
              }
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');

    return `<div class="acc-group">
      <div class="acc-header" onclick="toggleAcc('${accId}')">
        <div class="acc-header-left"><span>${grp.label}</span></div>
        <div class="acc-header-right">
          <span class="acc-count ${activePerms.length===0?'zero':''}">${activePerms.length}/${grp.perms.length}</span>
          <span class="acc-arrow" id="arrow_${accId}">▼</span>
        </div>
      </div>
      <div class="acc-body" id="${accId}">
        ${innerHTML}
      </div>
    </div>`;
  }

  // Normal accordion
  return `<div class="acc-group">
    <div class="acc-header" onclick="toggleAcc('${accId}')">
      <div class="acc-header-left"><span>${grp.label}</span></div>
      <div class="acc-header-right">
        <span class="acc-count ${activePerms.length===0?'zero':''}">${activePerms.length}/${grp.perms.length}</span>
        <span class="acc-arrow" id="arrow_${accId}">▼</span>
      </div>
    </div>
    <div class="acc-body" id="${accId}">
      ${grp.perms.map(p => {
        const has = staffPerms.includes(p);
        let label = p.replace(/^(View Orders - |View Customers - |Menu - |Inventory - |Staff - |KDS - |Table - |Status - )/, '');
        return `<div class="perm-item" style="padding:5px 0;border-bottom:1px solid #faf7f4;">
          <span style="font-size:0.82rem;color:${has?'var(--dark)':'#aaa'};">${label}</span>
          ${canEdit ?
            `<button class="toggle ${has?'on':'off'}" onclick="togglePerm('${staffId}','${p}')"></button>` :
            `<span class="toggle ${has?'on':'off'}" style="cursor:not-allowed;opacity:0.6;"></span>`
          }
        </div>`;
      }).join('')}
    </div>
  </div>`;
  } catch(_e) { console.error("[SG] renderPermAccordionHTML:", _e); }
}

// ══════════════════════════════════════════════════════════════
// ITEM-WISE INTERNAL STATUS SYSTEM
// 4 states per item: Pending → Confirm → Preparing → Ready
// Final order Status (Pending/Confirmed/Preparing/Ready) auto-computes
// from the highest item status, EXCEPT Ready needs ALL items Ready.
// Status is stored ON each item object (o.items[idx].itemStatus) so it
// persists inside the existing 'items' JSON column — no new DB column needed.
// ══════════════════════════════════════════════════════════════
const ITEM_STATUS_LIST = ['Pending','Confirm','Preparing','Ready'];
const ITEM_STATUS_COLORS = {
  Pending:  {bg:'#f5f5f5', text:'#757575', border:'#bdbdbd'},
  Confirm:  {bg:'#e3f2fd', text:'#1565c0', border:'#64b5f6'},
  Preparing:{bg:'#fff3e0', text:'#e65100', border:'#ffb74d'},
  Ready:    {bg:'#e8f5e9', text:'#2e7d32', border:'#81c784'}
};

function computeFinalStatusFromItems(o) {
  const levels = {Pending:0, Confirm:1, Preparing:2, Ready:3};
  const itemList = o.items || [];
  if(!itemList.length) return null;
  const statuses = itemList.map(it => it.itemStatus || 'Pending');
  let maxLevel = 0;
  statuses.forEach(s => { maxLevel = Math.max(maxLevel, levels[s] !== undefined ? levels[s] : 0); });
  const allReady = statuses.every(s => s === 'Ready');
  if(maxLevel === 3 && !allReady) maxLevel = 2; // Ready needs ALL items ready, else cap at Preparing
  const levelToOrderStatus = ['Pending','Confirmed','Preparing','Ready'];
  return levelToOrderStatus[maxLevel];
}

// Shared cell-content builders (used both on initial table render AND targeted row patch)
function buildInternalStatusCellHtml(o) {
  const itemList = o.items || [];
  const statuses = itemList.map(it => it.itemStatus || 'Pending');
  const readyCount = statuses.filter(s=>s==='Ready').length;
  const summaryColor = readyCount===itemList.length && itemList.length>0 ? '#2e7d32'
    : statuses.some(s=>s!=='Pending') ? '#e65100' : '#9e9e9e';
  return '<button onclick="openItemStatusModal(\''+o.id+'\')" '+
    'style="background:'+summaryColor+'1a;color:'+summaryColor+';border:1.5px solid '+summaryColor+';padding:5px 10px;border-radius:8px;font-weight:700;font-size:0.74rem;cursor:pointer;white-space:nowrap;">'+
    '🔧 '+readyCount+'/'+itemList.length+' Ready</button>';
}

function buildStatusCellHtml(o, canUpdate, isAdmin) {
  const statusOpts = ['Pending','Confirmed','Preparing','Ready','Delivered','Cancelled'];
  if(canUpdate){
    const opts = statusOpts.map(function(s){
      const isAllowed=isAdmin||(currentUser&&currentUser.perms&&currentUser.perms.includes('Status - '+s));
      return '<option '+(o.status===s?'selected':'')+' value="'+s+'" '+(isAllowed?'':'disabled style="color:#ccc;"')+'>'+s+(isAllowed?'':' 🔒')+'</option>';
    }).join('');
    return '<select class="status ' + (o.status||'').toLowerCase() + '" onchange="updateStatus(\'' + o.id + '\',this.value)" style="border:none;font-size:0.75rem;font-weight:700;cursor:pointer;padding:4px 8px;border-radius:20px;background:transparent;">' + opts + '</select>';
  }
  return '<span class="status '+(o.status||'').toLowerCase()+'">'+o.status+'</span>';
}

// Patch just this one row's two cells — no full table reload, no Supabase refetch race
function patchOrderRowStatus(o) {
  try {
  const row = document.querySelector('tr[data-order-id="'+o.id+'"]');
  if(!row) return;
  const isAdmin = currentUser?.role === 'Admin';
  const canUpdate = isAdmin || currentUser?.perms?.some(p=>p.startsWith('Status -'));
  const intCell = row.querySelector('td[data-col="internalStatus"]');
  if(intCell) intCell.innerHTML = buildInternalStatusCellHtml(o);
  const statCell = row.querySelector('td[data-col="status"]');
  if(statCell) statCell.innerHTML = buildStatusCellHtml(o, canUpdate, isAdmin);
  } catch(_e) { console.error("[SG] patchOrderRowStatus:", _e); }
}

function openItemStatusModal(orderId) {
  try {
  const o = orders.find(x => x.id === orderId);
  if(!o) return;
  let modal = document.getElementById('itemStatusModal');
  if(modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'itemStatusModal';
  modal.className = 'modal-overlay open';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = buildItemStatusModalHtml(o);
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openItemStatusModal:", _e); }
}

// Disposition options for a READY item whose order is being cancelled/returned:
// 1) Order Replace → redirect to another order with the same item
// 2) Employee Use   → consumed internally
// 3) Waste          → discarded
function buildDispositionRow(o, item, idx) {
  // Order kisi bhi stage par cancel ho sakta hai — buttons hamesha available

  // Already dispositioned? Show the result instead of buttons.
  if(item.disposition) {
    const labels = {
      replace:  '🔁 Replaced → Order #' + (item.replacedToOrder || '?'),
      employee: '👤 Employee Use',
      waste:    '🗑️ Wasted'
    };
    const cols = { replace:'#1565c0', employee:'#6a1b9a', waste:'#c62828' };
    return '<div style="margin:-4px 0 8px 0;padding:7px 12px;background:'+cols[item.disposition]+'14;'+
      'border:1px dashed '+cols[item.disposition]+';border-radius:8px;font-size:0.76rem;font-weight:700;color:'+cols[item.disposition]+';'+
      'display:flex;justify-content:space-between;align-items:center;">'+
      '<span>'+(labels[item.disposition]||'')+'</span>'+
      '<button onclick="clearDisposition(\''+o.id+'\','+idx+')" style="background:none;border:none;color:#999;cursor:pointer;font-size:0.72rem;text-decoration:underline;">Undo</button>'+
      '</div>';
  }

  return '<div style="margin:-4px 0 8px 0;padding:8px 12px;background:#fff;border:1px solid #eee;border-radius:8px;">'+
    '<div style="font-size:0.7rem;color:var(--muted);margin-bottom:5px;">⚠️ Order cancel hua? Is ready item ka kya karein:</div>'+
    '<div style="display:flex;gap:5px;flex-wrap:wrap;">'+
      '<button onclick="dispositionReplace(\''+o.id+'\','+idx+')" '+
        'style="padding:5px 10px;border-radius:7px;font-size:0.74rem;font-weight:700;cursor:pointer;border:1.5px solid #1565c0;background:#e3f2fd;color:#1565c0;">🔁 Order Replace</button>'+
      '<button onclick="dispositionSet(\''+o.id+'\','+idx+',\'employee\')" '+
        'style="padding:5px 10px;border-radius:7px;font-size:0.74rem;font-weight:700;cursor:pointer;border:1.5px solid #6a1b9a;background:#f3e5f5;color:#6a1b9a;">👤 Employee Use</button>'+
      '<button onclick="dispositionSet(\''+o.id+'\','+idx+',\'waste\')" '+
        'style="padding:5px 10px;border-radius:7px;font-size:0.74rem;font-weight:700;cursor:pointer;border:1.5px solid #c62828;background:#ffebee;color:#c62828;">🗑️ Waste</button>'+
    '</div></div>';
}

// Find OTHER orders that contain the same item and are still open (not Delivered/Cancelled)
function findReplaceTargets(currentOrderId, itemName) {
  const terminal = ['Delivered','Served','Collected','Cancelled'];
  const baseName = String(itemName).replace(/\s*\([^)]*\)\s*$/,'').trim().toLowerCase(); // strip size suffix
  return (orders||[]).filter(o2 => {
    if(o2.id === currentOrderId) return false;
    if(terminal.includes(o2.status)) return false;
    return (o2.items||[]).some(it => String(it.name).replace(/\s*\([^)]*\)\s*$/,'').trim().toLowerCase() === baseName);
  });
}

function dispositionReplace(orderId, idx) {
  try {
  const o = orders.find(x => x.id === orderId);
  if(!o || !o.items[idx]) return;
  const item = o.items[idx];
  const targets = findReplaceTargets(orderId, item.name);
  if(!targets.length) {
    showToast('Koi dusra open order nahi mila jisme "'+item.name+'" ho. Employee Use ya Waste choose karo.','error');
    return;
  }
  // Build a small picker
  const opts = targets.map(t => {
    const cust = t.name || t.mobile || t.id;
    return '<button onclick="confirmReplace(\''+orderId+'\','+idx+',\''+t.id+'\')" '+
      'style="display:block;width:100%;text-align:left;padding:9px 12px;margin-bottom:6px;border:1.5px solid #1565c0;background:#e3f2fd;color:#1565c0;border-radius:8px;font-weight:700;font-size:0.8rem;cursor:pointer;">'+
      '🔁 Order #'+t.id+' — '+cust+'</button>';
  }).join('');
  let picker = document.getElementById('replacePicker');
  if(picker) picker.remove();
  picker = document.createElement('div');
  picker.id = 'replacePicker';
  picker.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:10000;';
  picker.innerHTML = '<div style="background:#fff;border-radius:14px;padding:20px;max-width:420px;width:90%;max-height:80vh;overflow-y:auto;">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><h3 style="margin:0;font-size:1rem;">🔁 Replace mein kis order ko bhejein?</h3>'+
    '<button onclick="document.getElementById(\'replacePicker\').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#999;">✕</button></div>'+
    '<p style="font-size:0.76rem;color:var(--muted);margin-bottom:12px;">"'+item.name+'" — yeh ready item jis order ko dena hai woh choose karo:</p>'+
    opts +
    '<button onclick="document.getElementById(\'replacePicker\').remove()" style="width:100%;margin-top:6px;padding:9px;background:#f5f5f5;border:none;border-radius:8px;cursor:pointer;font-weight:700;">Cancel</button>'+
    '</div>';
  document.body.appendChild(picker);
  } catch(_e) { console.error("[SG] dispositionReplace:", _e); }
}

function confirmReplace(orderId, idx, targetOrderId) {
  try {
  const o = orders.find(x => x.id === orderId);
  if(!o || !o.items[idx]) return;
  o.items[idx].disposition = 'replace';
  o.items[idx].replacedToOrder = targetOrderId;
  sbUpdateOrder(o.id, { items: o.items })
    .then(r => { if(r===null) showToast('⚠️ Server save fail!','error'); })
    .catch(e => { console.error(e); showToast('⚠️ Save fail: '+(e?.message||''),'error'); });
  const picker = document.getElementById('replacePicker'); if(picker) picker.remove();
  const modal = document.getElementById('itemStatusModal'); if(modal) modal.innerHTML = buildItemStatusModalHtml(o);
  patchOrderRowStatus(o);
  showToast('✅ Item Order #'+targetOrderId+' ko replace ke liye assign kiya!');
  } catch(_e) { console.error("[SG] confirmReplace:", _e); }
}

function dispositionSet(orderId, idx, kind) {
  try {
  const o = orders.find(x => x.id === orderId);
  if(!o || !o.items[idx]) return;
  o.items[idx].disposition = kind; // 'employee' | 'waste'
  delete o.items[idx].replacedToOrder;
  sbUpdateOrder(o.id, { items: o.items })
    .then(r => { if(r===null) showToast('⚠️ Server save fail!','error'); })
    .catch(e => { console.error(e); showToast('⚠️ Save fail: '+(e?.message||''),'error'); });
  const modal = document.getElementById('itemStatusModal'); if(modal) modal.innerHTML = buildItemStatusModalHtml(o);
  patchOrderRowStatus(o);
  showToast(kind==='employee' ? '👤 Employee Use mark kiya!' : '🗑️ Waste mark kiya!');
  } catch(_e) { console.error("[SG] dispositionSet:", _e); }
}

function clearDisposition(orderId, idx) {
  try {
  const o = orders.find(x => x.id === orderId);
  if(!o || !o.items[idx]) return;
  delete o.items[idx].disposition;
  delete o.items[idx].replacedToOrder;
  sbUpdateOrder(o.id, { items: o.items })
    .then(r => { if(r===null) showToast('⚠️ Server save fail!','error'); })
    .catch(e => { console.error(e); showToast('⚠️ Save fail: '+(e?.message||''),'error'); });
  const modal = document.getElementById('itemStatusModal'); if(modal) modal.innerHTML = buildItemStatusModalHtml(o);
  patchOrderRowStatus(o);
  showToast('↩️ Disposition hata diya');
  } catch(_e) { console.error("[SG] clearDisposition:", _e); }
}

function buildItemStatusModalHtml(o) {
  const ITEM_LEVELS = {Pending:0, Confirm:1, Preparing:2, Ready:3};
  const itemList = o.items || [];
  const rows = itemList.map((item, idx) => {
    const cur = item.itemStatus || 'Pending';
    const curLevel = ITEM_LEVELS[cur] !== undefined ? ITEM_LEVELS[cur] : 0;
    const btns = ITEM_STATUS_LIST.map(s => {
      const c = ITEM_STATUS_COLORS[s];
      const active = (s === cur);
      const sLevel = ITEM_LEVELS[s];
      // One-way progression: once an item moves forward, earlier stages are locked
      if(sLevel < curLevel) {
        return '<button disabled title="Pichhe jaana allowed nahi hai" '+
          'style="padding:6px 12px;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:not-allowed;'+
          'border:2px solid #e0e0e0;background:#f5f5f5;color:#bbb;opacity:0.7;">'+s+' 🔒</button>';
      }
      return '<button onclick="updateItemStatus(\''+o.id+'\','+idx+',\''+s+'\')" '+
        'style="padding:6px 12px;border-radius:8px;font-size:0.78rem;font-weight:700;cursor:pointer;'+
        'border:2px solid '+c.border+';background:'+(active?c.border:c.bg)+';color:'+(active?'#fff':c.text)+';">'+s+'</button>';
    }).join('');
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:#fafafa;border-radius:10px;margin-bottom:8px;border:1px solid #eee;">'+
      '<div style="flex:1;"><div style="font-weight:700;font-size:0.88rem;">'+(item.emoji||'🍽️')+' '+item.name+'</div>'+
      '<div style="font-size:0.72rem;color:var(--muted);">Qty: '+(item.qty||1)+'</div></div>'+
      '<div style="display:flex;gap:5px;flex-wrap:wrap;">'+btns+'</div></div>' + buildDispositionRow(o, item, idx);
  }).join('');

  const finalStatus = computeFinalStatusFromItems(o) || o.status;
  const fc = ITEM_STATUS_COLORS[finalStatus] || ITEM_STATUS_COLORS.Pending;

  return '<div style="background:#fff;border-radius:16px;padding:22px;max-width:520px;width:92%;max-height:88vh;overflow-y:auto;">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'+
      '<h3 style="margin:0;">🔧 Item-wise Status</h3>'+
      '<button onclick="document.getElementById(\'itemStatusModal\').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#999;">✕</button>'+
    '</div>'+
    '<p style="font-size:0.8rem;color:var(--muted);margin-bottom:14px;">Order #'+o.id+' — har item ka status alag set karo</p>'+
    '<div id="itemStatusRows">'+rows+'</div>'+
    '<div style="margin-top:14px;padding:12px;background:'+fc.bg+';border-radius:10px;border:2px solid '+fc.border+';display:flex;justify-content:space-between;align-items:center;">'+
      '<span style="font-weight:700;font-size:0.85rem;color:'+fc.text+';">📊 Final Order Status (Auto)</span>'+
      '<span style="font-weight:800;font-size:0.95rem;color:'+fc.text+';">'+finalStatus+'</span>'+
    '</div>'+
    '<button onclick="document.getElementById(\'itemStatusModal\').remove()" '+
      'style="margin-top:14px;width:100%;padding:10px;background:#f5f5f5;border:none;border-radius:8px;cursor:pointer;font-weight:700;">Close</button>'+
  '</div>';
}

function updateItemStatus(orderId, itemIdx, newStatus) {
  try {
  const o = orders.find(x => x.id === orderId);
  if(!o || !o.items || !o.items[itemIdx]) return;

  const ITEM_LEVELS = {Pending:0, Confirm:1, Preparing:2, Ready:3};
  const curStatus = o.items[itemIdx].itemStatus || 'Pending';
  const curLevel  = ITEM_LEVELS[curStatus] !== undefined ? ITEM_LEVELS[curStatus] : 0;
  const newLevel  = ITEM_LEVELS[newStatus] !== undefined ? ITEM_LEVELS[newStatus] : 0;
  if(newLevel < curLevel) {
    showToast('🔒 Item pichhe nahi ja sakta — "'+curStatus+'" se "'+newStatus+'" allowed nahi hai!','error');
    return;
  }

  // Status lives ON the item itself (inside the 'items' JSON column — no new DB column needed)
  o.items[itemIdx].itemStatus = newStatus;

  const computed = computeFinalStatusFromItems(o);
  const terminalStates = ['Delivered','Served','Collected','Cancelled'];
  let statusChanged = false;
  if(computed && !terminalStates.includes(o.status) && o.status !== computed) {
    o.status = computed;
    o.statusHistory = o.statusHistory || [];
    o.statusHistory.push({ status: computed, updatedBy: (currentUser?.name||'Staff')+' (auto, item status)', time: new Date().toLocaleString('en-IN') });
    statusChanged = true;
  }

  // Persist via the EXISTING 'items' + 'status' columns only — avoids unknown-column errors
  sbUpdateOrder(o.id, { items: o.items, status: o.status, statusHistory: o.statusHistory })
    .then(result => {
      if(result === null) {
        showToast('⚠️ Server par save nahi hua — DB permission/policy check karo!','error');
      }
    })
    .catch(e => {
      console.error('[SG] updateItemStatus save fail:', e);
      showToast('⚠️ Save fail hua: '+(e?.message||'unknown error'),'error');
    });

  // Refresh modal in-place (uses local, already-correct in-memory data — no refetch needed)
  const modal = document.getElementById('itemStatusModal');
  if(modal) modal.innerHTML = buildItemStatusModalHtml(o);
  // Patch ONLY this row's two cells — no full table reload, no race condition
  patchOrderRowStatus(o);
  if(statusChanged) showToast('✅ Order status auto-updated to "'+computed+'"!');
  } catch(_e) { console.error("[SG] updateItemStatus:", _e); }
}

function updateStatus(id,status) {
  try {
  // Security check — block if No Permission
  const isAdm = currentUser?.role==='Admin';
  const orderObj = orders.find(o=>o.id===id);
  const oType = orderObj?.type||'Home Delivery';
  const hasNewPerm = currentUser?.perms?.includes('Status - '+status+' - '+oType);
  const hasOldPerm = currentUser?.perms?.includes('Status - '+status);
  if(!isAdm && !hasNewPerm && !hasOldPerm) {
    showToast('No permission to set '+status+' for '+oType+' orders 🔒','error');
    renderOrders();
    return;
  }

  if(status==='Cancelled') {
    // Require reason for cancellation
    document.getElementById('reasonModalTitle').textContent = '❌ Order Cancel Reason';
    document.getElementById('reasonModalDesc').textContent = 'Please provide a reason for cancellation — the customer will be informed.';
    document.getElementById('reasonActionType').value = 'cancel';
    document.getElementById('reasonOrderId').value = id;
    document.getElementById('reasonSelect').value = '';
    document.getElementById('customReasonGroup').style.display='none';
    document.getElementById('customReason').value='';
    document.getElementById('reasonModal').classList.add('open');
    renderOrders();
    return;
  }
  const o=orders.find(o=>o.id===id);
  if(o){
    const prevStatus = o.status;
    o.status=status;
    o.statusHistory = o.statusHistory||[];
    o.statusHistory.push({
      status, 
      updatedBy: currentUser?.name||'Unknown',
      time: new Date().toLocaleString('en-IN')
    });
    sbUpdateOrder(o.id, { status, statusHistory: o.statusHistory }).catch(e => console.error('Status update failed:', e));
    // Stock deduct sirf tab:
    // Preparing/Ready ke baad → Delivered/Served/Collected
    // Cancelled before Preparing/Ready → koi deduct nahi
    // Cancelled after Preparing/Ready → manually waste entry + order ID replace
    const wasInKitchen = ['Preparing','Ready'].includes(prevStatus);
    const isCompleted  = ['Delivered','Served','Collected'].includes(status);
    if(isCompleted && wasInKitchen) {
      autoDeductStockForOrder(o.items||[], o.id, currentUser?.name||'Unknown').catch(e => console.error('[SG] autoDeduct fail:', e));
    }
  // Extra Bug #2 fix: yahan ek "Auto-create reservation" block tha jo submitOrder
  // se galat copy-paste hua tha — woh 'type', 'name', 'dineInRequest', 'orderId'
  // jaise variables use karta tha jo updateStatus ke scope mein defined HI nahi.
  // Har status update pe ReferenceError throw hota tha, jisse neeche ke
  // updateStats()/renderOrders()/success-toast kabhi chalte hi nahi the (UI
  // refresh nahi hota tha). Block hata diya — reservation logic pehle se
  // submitOrder mein sahi hai.
    updateStats();
    renderOrders();
    showToast('✅ Order '+id+' → '+status+' (by '+currentUser?.name+')');
  }
  } catch(_e) { console.error("[SG] updateStatus:", _e); }
}

function deleteOrder(id) {
  try {
  document.getElementById('reasonModalTitle').textContent = '🗑️ Order Delete Reason';
  document.getElementById('reasonModalDesc').textContent = 'Order permanently delete reason for this action.';
  document.getElementById('reasonActionType').value = 'delete';
  document.getElementById('reasonOrderId').value = id;
  document.getElementById('reasonSelect').value = '';
  document.getElementById('customReasonGroup').style.display='none';
  document.getElementById('customReason').value='';
  document.getElementById('reasonModal').classList.add('open');
  } catch(_e) { console.error("[SG] deleteOrder:", _e); }
}

function toggleCustomReason(val) {
  try {
  document.getElementById('customReasonGroup').style.display = val==='Other' ? 'block':'none';
  } catch(_e) { console.error("[SG] toggleCustomReason:", _e); }
}

function confirmReasonAction() {
  try {
  const type = document.getElementById('reasonActionType').value;
  const id = document.getElementById('reasonOrderId').value;
  const selected = document.getElementById('reasonSelect').value;
  const custom = document.getElementById('customReason').value.trim();
  const reason = selected==='Other' ? custom : selected;

  if(!reason) { showToast('Please select or enter a reason','error'); return; }

  if(type==='delete') {
    orders = orders.filter(o => o.id !== id);
    sbDeleteOrder(id).catch(e => console.error('Delete failed:', e));
    updateStats();
    renderOrders();
    showToast('✅ Order deleted — Reason: '+reason);
  } else if(type==='cancel') {
    const o=orders.find(x=>x.id===id);
    if(o){
      const prevSt = o.status; // status before cancel
      o.status='Cancelled';
      o.cancelReason=reason;
      sbUpdateOrder(id, {status:'Cancelled', cancelReason:reason}).catch(e=>console.error('Cancel failed:',e));
      updateStats();
      renderOrders();
      showToast('Order cancelled — Reason: '+reason);
      // Agar Preparing/Ready ke baad cancel hua toh popup dikhao
      if(['Preparing','Ready'].includes(prevSt)) {
        showCancelAssignModal(id, o.items||[]);
      }
    }
  }
  closeModal('reasonModal');
  } catch(_e) { console.error("[SG] confirmReasonAction:", _e); }
}
// ── CANCEL ASSIGNMENT POPUP FUNCTIONS ──────────────────────
let _cancelAssignOrderItems = [];
let _cancelledOrderId = '';

function showCancelAssignModal(cancelledId, items) {
  try {
  _cancelledOrderId = cancelledId;
  _cancelAssignOrderItems = items;

  // Fill dropdown with Pending/Confirmed/Preparing/Ready orders (not the cancelled one)
  const eligibleOrders = orders.filter(o =>
    o.id !== cancelledId &&
    ['Pending','Confirmed','Preparing','Ready'].includes(o.status)
  );

  const sel = document.getElementById('cancelAssignOrderId');
  sel.innerHTML = '<option value="">-- Koi order select karo --</option>';

  if(eligibleOrders.length === 0) {
    sel.innerHTML = '<option value="">Koi eligible order nahi hai</option>';
  } else {
    // Group by status
    ['Preparing','Ready','Confirmed','Pending'].forEach(st => {
      const grp = eligibleOrders.filter(o => o.status === st);
      if(!grp.length) return;
      const optgrp = document.createElement('optgroup');
      optgrp.label = '── ' + st + ' ──';
      grp.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id;
        const itemNames = (o.items||[]).map(i=>i.name).join(', ');
        opt.textContent = o.id + ' | ' + (o.name||'Customer') + ' | ' + st + ' | ' + itemNames.substring(0,40);
        optgrp.appendChild(opt);
      });
      sel.appendChild(optgrp);
    });
  }

  document.getElementById('cancelAssignModal').style.display = 'flex';
  } catch(e) { console.error('[SG] showCancelAssignModal:', e); }
}

function closeCancelAssignModal() {
  document.getElementById('cancelAssignModal').style.display = 'none';
  _cancelAssignOrderItems = [];
  _cancelledOrderId = '';
}

async function confirmCancelAssign() {
  try {
  const targetId = document.getElementById('cancelAssignOrderId').value;
  if(!targetId) { showToast('Pehle ek order select karo', 'error'); return; }

  const targetOrder = orders.find(o => o.id === targetId);
  if(!targetOrder) { showToast('Order nahi mila', 'error'); return; }

  // Stock deduct for target order
  await autoDeductStockForOrder(_cancelAssignOrderItems, targetId, currentUser?.name||'Unknown');
  showToast('✅ Ingredients Order ' + targetId + ' mein assign ho gaye — Stock deduct hua!');
  closeCancelAssignModal();
  renderStock && renderStock();
  } catch(e) { console.error('[SG] confirmCancelAssign:', e); showToast('Error', 'error'); }
}

function confirmCancelWaste() {
  try {
  closeCancelAssignModal();
  // Open waste entry modal pre-filled with cancelled order items
  // Navigate to Inventory → Waste tab
  showDash('inventory');
  setTimeout(function() {
    showInvTab('waste');
    setTimeout(function() {
      openInvModal('waste');
      showToast('ℹ️ Waste entry form khula — cancelled order ke items manually add karo', 'error');
    }, 400);
  }, 300);
  } catch(e) { console.error('[SG] confirmCancelWaste:', e); }
}

function viewOrder(id) {
  try {
  const o=orders.find(o=>o.id===id);
  if(!o) return;
  const isAdm = currentUser?.role==='Admin';
  const canSeeMobile = isAdm || currentUser?.perms?.includes('View Orders - Mobile');
  const canSeeEmail = isAdm || currentUser?.perms?.includes('View Orders - Email');
  document.getElementById('orderDetailContent').innerHTML=`
    <div class="detail-row"><span class="detail-key">Order ID</span><span class="detail-val"><b style="color:var(--fire)">${o.id}</b></span></div>
    <div class="detail-row"><span class="detail-key">Customer</span><span class="detail-val">${escHtml(o.name)}</span></div>
    <div class="detail-row"><span class="detail-key">Mobile</span><span class="detail-val">${canSeeMobile ? escHtml(o.mobile) : '<span style="color:#ccc;font-style:italic;">🔒 Access Denied</span>'}</span></div>
    <div class="detail-row"><span class="detail-key">WhatsApp</span><span class="detail-val">${canSeeMobile ? '💬 '+escHtml(o.whatsapp||o.mobile) : '<span style="color:#ccc;font-style:italic;">🔒 Access Denied</span>'}</span></div>
    <div class="detail-row"><span class="detail-key">Email</span><span class="detail-val">${canSeeEmail ? escHtml(o.email) : '<span style="color:#ccc;font-style:italic;">🔒 Access Denied</span>'}</span></div>
    <div class="detail-row"><span class="detail-key">Address</span><span class="detail-val">${escHtml(o.address)}</span></div>
    <div class="detail-row"><span class="detail-key">Order Type</span><span class="detail-val">${o.type}</span></div>
    ${o.type==='Dine-In' ? `
    <div class="detail-row" style="background:#fff8e1;border-radius:8px;padding:10px;margin:4px 0;flex-direction:column;align-items:flex-start;">
      <div style="font-weight:700;color:#f57c00;margin-bottom:8px;">🪑 Reservation Details</div>
      ${o.tableNum?`<div style="font-size:0.85rem;margin-bottom:4px;"><b>Table:</b> ${o.tableNum}</div>`:''}
      ${o.dineInDate?`<div style="font-size:0.85rem;margin-bottom:4px;"><b>Date:</b> ${new Date(o.dineInDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`:''}
      ${o.dineInGuests?`<div style="font-size:0.85rem;margin-bottom:4px;"><b>Guests:</b> ${o.dineInGuests}</div>`:''}
      ${o.dineInSlots&&o.dineInSlots.length?`<div style="font-size:0.85rem;margin-bottom:4px;"><b>Time Slots:</b><br>${o.dineInSlots.map(s=>'⏰ '+to12hr(s.start)+' – '+to12hr(s.end)+(s.charge>0?' (₹'+s.charge+')':' (Free)')).join('<br>')}</div>`:(o.dineInTime?`<div style="font-size:0.85rem;margin-bottom:4px;"><b>Time:</b> ${to12hr(o.dineInTime)}</div>`:'')}
      ${o.dineInReservCharge>0?`<div style="font-size:0.88rem;font-weight:700;color:var(--fire);margin-top:4px;">Reservation Charge: ₹${o.dineInReservCharge} <span style="font-size:0.72rem;color:var(--muted);font-weight:400;">(No GST)</span></div>`:''}
      ${o.dineInRequest?`<div style="font-size:0.82rem;color:var(--muted);margin-top:4px;">📝 ${escHtml(o.dineInRequest)}</div>`:''}
    </div>` : ''}
    <div class="detail-row"><span class="detail-key">Payment</span><span class="detail-val">${o.pay}</span></div>
    <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="status ${(o.status||'').toLowerCase()}">${o.status}</span></span></div>
    <div class="detail-row"><span class="detail-key">Ordered At</span><span class="detail-val">${o.time}</span></div>
    <div class="detail-row"><span class="detail-key">Items</span><span class="detail-val">${o.items.map(i=>`${escHtml(i.name)} x${i.qty} — ₹${i.total}`).join('<br>')}</span></div>
    <div class="detail-row"><span class="detail-key">Subtotal</span><span class="detail-val">₹${o.subtotal||o.total}</span></div>
    <div class="detail-row"><span class="detail-key">GST (5%)</span><span class="detail-val" style="color:var(--muted);">₹${o.gstAmt||0}</span></div>
    ${o.dineInReservCharge>0?`<div class="detail-row"><span class="detail-key">Reservation Charge</span><span class="detail-val" style="color:var(--fire);">₹${o.dineInReservCharge} <span style="font-size:0.72rem;color:var(--muted);">(No GST)</span></span></div>`:''}
    <div class="detail-row"><span class="detail-key">Grand Total</span><span class="detail-val"><b style="font-size:1.1rem;color:var(--fire)">₹${o.total + (o.dineInReservCharge||0)}</b></span></div>
    ${o.note?`<div class="detail-row"><span class="detail-key">Note</span><span class="detail-val">${escHtml(o.note)}</span></div>`:''}
    ${o.cancelReason?`<div class="detail-row"><span class="detail-key" style="color:var(--danger);">Cancel Reason</span><span class="detail-val" style="color:var(--danger);font-weight:600;">❌ ${escHtml(o.cancelReason)}</span></div>`:''}
    ${o.statusHistory&&o.statusHistory.length?`
    <div class="detail-row" style="align-items:flex-start;">
      <span class="detail-key">Status History</span>
      <div style="flex:1;">
        ${o.statusHistory.map(h=>`
          <div style="font-size:0.82rem;padding:4px 0;border-bottom:1px solid #f5f0eb;display:flex;justify-content:space-between;gap:8px;">
            <span><b style="color:var(--fire);">${escHtml(h.status)}</b> — ${escHtml(h.updatedBy)}</span>
            <span style="color:var(--muted);font-size:0.75rem;">${h.time}</span>
          </div>`).join('')}
      </div>
    </div>`:''}
  `;
  document.getElementById('orderDetailModal').classList.add('open');
  } catch(_e) { console.error("[SG] viewOrder:", _e); }
}

function setCustPeriod(period) {
  try {
  // Update active button styles
  ['All','Weekly','Monthly','Yearly'].forEach(p => {
    const btn = document.getElementById('custPeriod'+(p));
    if(!btn) return;
    const isActive = (period==='' && p==='All') || period===p.toLowerCase();
    btn.style.background = isActive ? 'var(--fire)' : '#fff';
    btn.style.color = isActive ? '#fff' : '#333';
    btn.style.borderColor = isActive ? 'var(--fire)' : '#e8d5c8';
  });
  // Store period and re-render
  window._custPeriod = period;
  renderCustomers();
  } catch(_e) { console.error("[SG] setCustPeriod:", _e); }
}

async function renderCustomers() {
  try { updateTableHeaders(); } catch(e) {}
  customers = await sbGetCustomers();

  // Show loading spinner immediately
  const tbody2 = document.getElementById('customersTableBody');
  if(tbody2) tbody2.innerHTML='<tr><td colspan="8" style="text-align:center;padding:30px;"><div style="font-size:1.5rem;">⏳</div><div style="color:var(--muted);margin-top:8px;">Loading customers...</div></td></tr>';

  setTimeout(function() {
  const isAdm = currentUser?.role === 'Admin';
  const canMobile = isAdm || (currentUser?.perms?.includes('View Customers - Mobile') === true);
  const canEmail  = isAdm || (currentUser?.perms?.includes('View Customers - Email') === true);
  const LOCK = '<span style="color:#bbb;font-size:0.8rem;">🔒</span>';
  const search = (document.getElementById('custSearch')?.value||'').toLowerCase();
  const statusFilter = document.getElementById('custStatusFilter')?.value||'';
  let filtered = customers;
  if(search) filtered = filtered.filter(c=>{
    if((c.name||'').toLowerCase().includes(search)) return true;
    if(canMobile && (c.mobile||'').includes(search)) return true;
    if(canEmail && (c.email||'').toLowerCase().includes(search)) return true;
    // Search by customer class (VIP, Regular, Average etc)
    const custClass = getCustomerClass(c, window._custPeriod||'');
    if(custClass && custClass.name && (custClass.name||'').toLowerCase().includes(search)) return true;
    // Search by city/address
    if((c.address||'').toLowerCase().includes(search)) return true;
    return false;
  });

  // Sort by class: VIP → Regular → Average → Normal
  const _period = window._custPeriod||'';
  const _classes = getClassifications();
  const _classOrder = {};
  _classes.forEach((cl,i)=>{ _classOrder[cl.name] = i; });
  filtered = [...filtered].sort((a,b)=>{
    const clA = getCustomerClass(a, _period);
    const clB = getCustomerClass(b, _period);
    const oA = _classOrder[clA.name] !== undefined ? _classOrder[clA.name] : 999;
    const oB = _classOrder[clB.name] !== undefined ? _classOrder[clB.name] : 999;
    return oA - oB;
  });
  if(statusFilter==='blocked') filtered = filtered.filter(c=>c.blocked);
  if(statusFilter==='active') filtered = filtered.filter(c=>!c.blocked);

  // Period filter - filter customers who ordered in this period
  const custPeriod = window._custPeriod || '';
  if(custPeriod) {
    const allOrders = orders; // from Supabase in-memory
    const now = new Date();
    let fromDate;
    if(custPeriod==='weekly') fromDate = new Date(now - 7*864e5);
    else if(custPeriod==='monthly') fromDate = new Date(now - 30*864e5);
    else if(custPeriod==='yearly') fromDate = new Date(now - 365*864e5);

    filtered = filtered.filter(c => {
      return allOrders.some(o => {
        if(o.mobile !== c.mobile) return false;
        if(o.status === 'Cancelled') return false;
        try {
          const oDate = new Date(o.created_at || o.time || o.createdAt || o.date);
          return oDate >= fromDate;
        } catch(e) { return false; }
      });
    });
  }
  const tbody = document.getElementById('customersTableBody');
  if(!filtered.length){tbody.innerHTML='<tr><td colspan="8"><div class="empty"><div class="empty-icon">👥</div><p>No customers found</p></div></td></tr>';return;}
  const custCols = typeof getColumns==='function' ? getColumns('customers') : [{id:'name',field:'name',hidden:false},{id:'mobile',field:'mobile',hidden:false},{id:'email',field:'email',hidden:false},{id:'orders',field:'orders',hidden:false},{id:'spent',field:'spent',hidden:false},{id:'class',field:'class',hidden:false},{id:'status',field:'status',hidden:false},{id:'action',field:'action',hidden:false}];
  const visibleCustCols = custCols.filter(col=>!col.hidden);

  tbody.innerHTML = filtered.map(c=>{
    const _period = window._custPeriod || '';
    const cl = getCustomerClass(c, _period);
    const isNormal = cl.name==='Normal' || (!cl.minWeekly && !cl.minMonthly && !cl.minYearly);
    const rowStyle = c.blocked ? 'background:#fce4ec;border-left:4px solid #e74c3c;' : 
                     !isNormal ? `background:${cl.color}55;border-left:5px solid ${cl.color};` : '';
    
    const cells = visibleCustCols.map(col => {
      switch(col.field) {
        case 'name':
          const displayName = (c.firstName||c.lastName) ? ((c.firstName||'')+' '+(c.lastName||'')).trim() : (c.name||'—');
          return `<td><b>${escHtml(displayName)}</b>${c.blocked?'<br><span style="font-size:0.68rem;background:#c62828;color:#fff;padding:1px 6px;border-radius:10px;">🚫 Blocked</span>':''}</td>`;
        case 'mobile':
          return `<td>${canMobile?escHtml(c.mobile):LOCK}</td>`;
        case 'email':
          return `<td>${canEmail?escHtml(c.email):LOCK}</td>`;
        case 'orders':
          const allOrds=orders; // from Supabase in-memory
          const sysOrdCount=allOrds.filter(o=>o.mobile===c.mobile&&o.status!=='Cancelled').length;
          const totalOrdCount=(parseInt(c.orders)||0)+sysOrdCount;
          return `<td style="text-align:center;">${totalOrdCount}</td>`;
        case 'spent':
          return `<td><b style="color:var(--fire)">₹${c.spent||0}</b></td>`;
        case 'class':
          return `<td><span style="background:${cl.color};color:#fff;padding:2px 10px;border-radius:10px;font-size:0.75rem;font-weight:700;">
            ${cl.name}${_period?'<span style="font-size:0.65rem;opacity:0.8;">('+(_period==='weekly'?'W':_period==='monthly'?'M':'Y')+')</span>':''}
          </span></td>`;
        case 'status':
          return `<td><span class="status ${c.blocked?'cancelled':'confirmed'}">${c.blocked?'Blocked':'Active'}</span></td>`;
        case 'action':
          return `<td><button class="act-btn act-view" onclick="viewCustomerDetail('${escHtml(c.mobile)}')">View</button></td>`;
        case 'address':
          return `<td style="font-size:0.82rem;">${escHtml(c.address||'—')}</td>`;
        case 'permanentAddress':
          return `<td style="font-size:0.82rem;">${escHtml(c.permanentAddress||c.address||'—')}</td>`;
        default: {
          if(typeof col.field==='string' && col.field.indexOf('custom:')===0) {
            const rawKey = col.field.slice(7);
            const key = (rawKey + ' ' + (col.description||'')).toLowerCase();
            let resolved;
            if(/size/.test(key)) resolved = c.size;
            else if(/address/.test(key)) resolved = c.address || c.permanentAddress;
            else if(/mobile|phone/.test(key)) resolved = c.mobile;
            else if(/email/.test(key)) resolved = c.email;
            else if(/status/.test(key)) resolved = c.blocked ? 'Blocked' : 'Active';
            else if(/note|remark/.test(key)) resolved = c.notes;
            else if(/first.*order|order.*date|^date$|joined|since/.test(key)) {
              const custOrders = (orders||[]).filter(o => o.mobile === c.mobile && o.status !== 'Cancelled');
              if(custOrders.length) {
                const dates = custOrders.map(o => {
                  try { return new Date(o.created_at || o.time || o.date); } catch(e) { return null; }
                }).filter(d => d && !isNaN(d));
                if(dates.length) {
                  const earliest = new Date(Math.min(...dates));
                  resolved = earliest.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
                }
              }
              if(!resolved) resolved = '—';
            }
            if(resolved !== undefined && resolved !== null && resolved !== '') {
              return `<td style="font-size:0.82rem;">${escHtml(resolved)}</td>`;
            }
            const cval = (c.customData && c.customData[rawKey]) || '';
            const safeKey = rawKey.replace(/'/g,"\\'");
            return `<td><input type="text" value="${(cval+'').replace(/"/g,'&quot;')}" placeholder="—"
              onchange="updateSectionCustomField('customers','${escHtml(c.mobile)}','${safeKey}',this.value)"
              style="width:100%;min-width:90px;padding:4px 6px;border:1px solid #e8d5c8;border-radius:6px;font-size:0.8rem;background:#fffdf9;"></td>`;
          }
          return `<td>${escHtml(getFieldValue(c, col.field, 'customers'))}</td>`;
        }
      }
    }).join('');
    
    const _csno = filtered.indexOf(c) + 1;
    const _csnoBg = c.blocked ? '#fce4ec' : (!isNormal ? cl.color+'22' : '#fff');
    const _csnoCell = `<td style="position:sticky;left:0;z-index:1;background:${_csnoBg};border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;min-width:55px;">${_csno}</td>`;
    return `<tr style="${rowStyle}">${_csnoCell}${cells}</tr>`;
  }).join('');

  }, 0); // end setTimeout
}

async function viewCustomerDetail(mobile) {
  try {
  customers = await sbGetCustomers();
  const isAdm = currentUser?.role === 'Admin';
  const canMobile = isAdm || (currentUser?.perms?.includes('View Customers - Mobile') === true);
  const canEmail  = isAdm || (currentUser?.perms?.includes('View Customers - Email') === true);
  const LOCK = '<span style="color:#bbb;font-style:italic;">🔒 Access Denied</span>';
  const c = customers.find(x => x.mobile === mobile);
  if(!c) return;
  const cl = getCustomerClass(c);
  const allOrders = orders; // from Supabase in-memory
  const custOrds = allOrders.filter(o=>o.mobile===mobile||o.email===c.email).reverse().slice(0,10);
  const modal = document.getElementById('custDetailModal');
  if(!modal) return;
  document.getElementById('custDetailContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <div style="width:48px;height:48px;border-radius:50%;background:${cl.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;flex-shrink:0;">${escHtml(c.name.charAt(0))}</div>
      <div>
        <div style="font-weight:800;font-size:1.1rem;">${escHtml(c.name)}</div>
        <span style="background:${cl.color}22;color:${cl.color};border:1px solid ${cl.color}55;padding:2px 8px;border-radius:10px;font-size:0.78rem;font-weight:700;">${cl.name}</span>
        ${c.blocked?'<span style="margin-left:6px;background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;padding:2px 8px;border-radius:10px;font-size:0.78rem;font-weight:700;">🚫 Blocked</span>':''}
      </div>
    </div>
    <div class="detail-row"><span class="detail-key">Mobile</span><span class="detail-val">${canMobile?escHtml(c.mobile):LOCK}</span></div>
    <div class="detail-row"><span class="detail-key">WhatsApp</span><span class="detail-val">${canMobile?'💬 '+escHtml(c.whatsapp||c.mobile):LOCK}</span></div>
    <div class="detail-row"><span class="detail-key">Email</span><span class="detail-val">${canEmail?escHtml(c.email):LOCK}</span></div>
    <div class="detail-row"><span class="detail-key">Address</span><span class="detail-val">${escHtml(c.address||'—')}</span></div>
    <div class="detail-row"><span class="detail-key">Total Orders</span><span class="detail-val"><b>${c.orders||0}</b></span></div>
    <div class="detail-row"><span class="detail-key">Total Spent</span><span class="detail-val"><b style="color:var(--fire)">₹${c.spent||0}</b></span></div>
    ${custOrds.length?`
    <div style="margin-top:14px;"><div style="font-weight:700;font-size:0.88rem;margin-bottom:8px;">📋 Order History (Last 10)</div>
      ${custOrds.map(o=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f5f0eb;font-size:0.82rem;">
        <div><b style="color:var(--fire);">#${o.id}</b> — ${o.items.map(i=>i.name).join(', ').substring(0,35)}</div>
        <div style="text-align:right;flex-shrink:0;margin-left:8px;"><b>₹${o.total}</b> <span class="status ${(o.status||'').toLowerCase()}" style="font-size:0.68rem;padding:2px 5px;">${o.status}</span></div>
      </div>`).join('')}
    </div>`:''}
    ${isAdm?`
    <div style="margin-top:16px;border-top:2px dashed #e8d5c8;padding-top:14px;">
      <div style="font-weight:700;font-size:0.88rem;margin-bottom:8px;">🔒 Admin Notes (Private)</div>
      ${adminNotes.map((n,i)=>`<div style="background:#fff8e1;border-radius:6px;padding:8px 10px;margin-bottom:6px;font-size:0.82rem;border-left:3px solid var(--gold);">
        <div style="display:flex;justify-content:space-between;"><span>${n.note}</span><button onclick="deleteAdminNote('${mobile}',${i})" style="background:none;border:none;cursor:pointer;color:#c62828;font-size:0.8rem;">✕</button></div>
        <div style="font-size:0.72rem;color:var(--muted);margin-top:3px;">— ${n.by} • ${n.at}</div>
      </div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:8px;">
        <input type="text" id="adminNoteInput" placeholder="Add private note..." style="flex:1;padding:8px 12px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;font-size:0.85rem;">
        <button onclick="saveAdminNote('${mobile}')" style="background:var(--fire);color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;">Add</button>
      </div>
    </div>
    <div style="margin-top:12px;">
      <button onclick="toggleBlockCustomer('${mobile}')" style="width:100%;padding:10px;border:none;border-radius:8px;font-weight:700;cursor:pointer;${c.blocked?'background:#e8f5e9;color:#2e7d32;':'background:#fce4ec;color:#c62828;'}">
        ${c.blocked?'✅ Unblock Customer':'🚫 Block Customer'}
      </button>
    </div>`:''}
  `;
  modal.classList.add('open');
  } catch(_e) { console.error("[SG] viewCustomerDetail:", _e); }
}

async function renderStaff() {
  try { const sb=await sbGetStaff(); if(sb&&sb.length){staff=sb;localStorage.setItem('sg_staff',JSON.stringify(sb));}else{staff=JSON.parse(localStorage.getItem('sg_staff')||'[]');} } catch(e) { staff=[]; } sbSaveAllStaff(staff.length?staff:JSON.parse(localStorage.getItem('sg_staff')||'[]')).catch(()=>{});
  const isAdm = currentUser?.role==='Admin';
  const canView = isAdm || currentUser?.perms?.includes('Staff - View');
  const canAdd = isAdm || currentUser?.perms?.includes('Staff - Add');
  const canRemove = isAdm || currentUser?.perms?.includes('Staff - Remove');
  const canEditPerms = isAdm || currentUser?.perms?.includes('Staff - Edit Permissions');

  // Show/hide Add Staff button
  const addBtn = document.getElementById('addStaffHeaderBtn');
  if(addBtn) addBtn.style.display = canAdd ? '' : 'none';

  // Render pending approvals section
  try { renderPendingApprovals(); } catch(e) {}

  // Show security note for non-admin
  const noteEl = document.getElementById('staffSecurityNote');
  if(noteEl) noteEl.style.display = isAdm ? 'none' : 'block';

  const g=document.getElementById('staffGrid');
  if(!g) return;
  if(!staff.length){g.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-icon">👨‍💼</div><p>No staff members added yet</p></div>';return;}
  if(!canView){g.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🔒</div><p>Access Denied — you cannot view staff</p></div>';return;}

  // SECURITY: Non-admin can only see staff they manage
  // Rules:
  // 1. Own profile will not be shown
  // 2. Only show staff whose reportingTo = currentUser.username
  //    or whose addedBy = currentUser.username
  // 3. Admin can see everyone
  let visibleStaff;
  if(isAdm) {
    visibleStaff = staff;
  } else {
    visibleStaff = staff.filter(s => {
      // Hide own profile
      if(s.username === currentUser?.username) return false;
      // Only show staff who report to this user
      // or added by this user
      const reportsToMe = s.reportingTo === currentUser?.username;
      const addedByMe = s.addedBy === currentUser?.username;
      return reportsToMe || addedByMe;
    });
  }

  if(!visibleStaff.length){
    g.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-icon">👨‍💼</div><p>No other staff members found</p></div>';
    return;
  }

  g.innerHTML=visibleStaff.map(s=>`
    <div class="staff-card">
      <!-- Compact Header -->
      <div class="staff-card-header">
        <div class="staff-avatar" style="background:${s.color||'#8B6F5E'}">${escHtml(s.name.charAt(0))}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(s.name)}</div>
          <div style="font-size:0.75rem;color:var(--muted);">${s.role} • @${s.username}</div>
          <div style="margin-top:2px;">
            ${s.status&&s.status!=='active'?`<span style="font-size:0.7rem;padding:2px 7px;border-radius:10px;font-weight:700;background:${s.status==='transfer'?'#e3f2fd':s.status==='resigned'||s.status==='terminated'?'#fce4ec':'#fff8e1'};color:${s.status==='transfer'?'#1565c0':s.status==='resigned'||s.status==='terminated'?'#c62828':'#f57c00'};">${s.status==='transfer'?'🔄 Transferred':s.status==='resigned'?'📤 Resigned':s.status==='terminated'?'❌ Terminated':s.status==='onleave'?'🏖️ On Leave':''}</span>`:'<span style="font-size:0.7rem;color:#2e7d32;font-weight:600;">✅ Active</span>'}
          </div>
          ${s.dept?`<div style="font-size:0.72rem;color:#3498db;margin-top:1px;">🏢 ${s.dept}</div>`:''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.72rem;color:var(--muted);">Perms</div>
          <div style="font-size:1rem;font-weight:800;color:var(--fire);">${s.perms.length}</div>
        </div>
      </div>
      <!-- Reporting Info -->
      <div style="background:#f0f7ff;border-radius:6px;padding:7px 10px;margin-bottom:10px;font-size:0.78rem;display:flex;gap:16px;flex-wrap:wrap;">
        <div>
          <span style="color:var(--muted);">📋 Reports to: </span>
          <b style="color:var(--dark);">${s.reportingTo==='admin'?'👑 Admin (Owner)':(staff.find(x=>x.username===s.reportingTo)?.name||s.reportingTo)}</b>
        </div>
        ${s.addedBy?`<div><span style="color:var(--muted);">➕ Added by: </span><b style="color:var(--dark);">${s.addedBy==='admin'?'Admin':staff.find(x=>x.username===s.addedBy)?.name||s.addedBy}</b></div>`:''}
      </div>

      <!-- Accordion Permissions -->
      <div class="perms-list">
        ${permGroups.map((grp,gi)=>renderPermAccordionHTML(grp,gi,s.perms,s.id,canEditPerms,'acc_'+s.id)).join('')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
        ${(isAdm||canEditPerms)?`<button class="act-btn act-edit" style="padding:7px;font-size:0.8rem;" onclick="openEditStaff('${s.id}')">✏️ Edit Staff</button>`:'<div></div>'}
        ${canRemove?`<button class="act-btn act-delete" style="padding:7px;font-size:0.8rem;" onclick="deleteStaff('${s.id}')">🗑️ Remove</button>`:'<div></div>'}
      </div>
    </div>`).join('');
}

function updateNCount(grpIdx, total) {
  try {
  const checked = document.querySelectorAll(`input[data-grp="${grpIdx}"]:checked`).length;
  const el = document.getElementById('ncount_'+grpIdx);
  if(el) {
    el.textContent = checked+'/'+total;
    el.className = 'acc-count'+(checked===0?' zero':'');
  }
  } catch(_e) { console.error("[SG] updateNCount:", _e); }
}

function toggleAcc(id) {
  try {
  const body = document.getElementById(id);
  const arrow = document.getElementById('arrow_'+id);
  if(!body||!arrow) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  arrow.classList.toggle('open', !isOpen);
  } catch(_e) { console.error("[SG] toggleAcc:", _e); }
}

function togglePerm(sid,perm) {
  try {
  const s=staff.find(x=>x.id===sid);
  if(!s) return;

  // SECURITY: Cannot change own permissions
  if(s.username === currentUser?.username && currentUser?.role !== 'Admin') {
    showToast('🔒 You cannot change your own permissions!','error');
    renderStaff(); // Reset toggle visually
    return;
  }

  if(s.perms.includes(perm)) s.perms=s.perms.filter(p=>p!==perm);
  else s.perms.push(perm);
  localStorage.setItem('sg_staff',JSON.stringify(staff)); sbSaveAllStaff(staff).catch(()=>{});
  renderStaff();
  showToast('✅ Permission updated for '+s.name);
  } catch(_e) { console.error("[SG] togglePerm:", _e); }
}
function deleteStaff(sid) {
  try {
  const s = staff.find(x=>x.id===sid);
  if(!s) return;

  // SECURITY: Cannot delete own account
  if(s.username === currentUser?.username && currentUser?.role !== 'Admin') {
    showToast('🔒 You cannot remove yourself!','error');
    return;
  }

  if(!confirm(s.name+' — confirm removal?')) return;
  staff=staff.filter(x=>x.id!==sid);
  localStorage.setItem('sg_staff',JSON.stringify(staff)); sbSaveAllStaff(staff.length?staff:JSON.parse(localStorage.getItem('sg_staff')||'[]')).catch(()=>{});
  renderStaff();
  showToast('Staff member removed successfully: '+s.name);
  } catch(_e) { console.error("[SG] deleteStaff:", _e); }
}
// Feature 3: Employee address permission - openEditStaff with address toggle
function openEditStaff(sid) {
  try {
  const s = staff.find(x => x.id === sid);
  if(!s) return;
  document.getElementById('editStaffId').value = s.id;
  document.getElementById('editSName').value = s.name;
  document.getElementById('editSUser').value = s.username;
  document.getElementById('editSPass').value = '';
  document.getElementById('editSRole').value = s.role || '';
  document.getElementById('editSColor').value = s.color || '#e74c3c';
  if(document.getElementById('editSDept')) document.getElementById('editSDept').value = s.dept || '';
  if(document.getElementById('editSStatus')) document.getElementById('editSStatus').value = s.status || 'active';
  if(document.getElementById('editSBranch')) document.getElementById('editSBranch').value = s.branch || '';
  if(document.getElementById('editSNotes')) document.getElementById('editSNotes').value = s.notes || '';

  // Address permission toggle
  const addrCb = document.getElementById('editSAddrPerm');
  if(addrCb) {
    addrCb.checked = s.perms?.includes('View Customer Address') || false;
    toggleAddrPermStyle(addrCb);
  }

  // Reporting Manager dropdown
  const repSel = document.getElementById('editSReporting');
  if(repSel) {
    repSel.innerHTML = '<option value="admin">👑 Admin (Owner)</option>';
    staff.filter(x => x.id !== sid).forEach(x => {
      const opt = document.createElement('option');
      opt.value = x.username;
      opt.textContent = x.name + ' (' + x.role + ')';
      opt.selected = x.username === s.reportingTo;
      repSel.appendChild(opt);
    });
    repSel.value = s.reportingTo || 'admin';
  }

  // Permissions accordion
  const isAdm = currentUser?.role === 'Admin';
  const canEditPerms = isAdm || currentUser?.perms?.includes('Staff - Edit Permissions');
  const permsDiv = document.getElementById('editStaffPerms');
  if(permsDiv) permsDiv.innerHTML = permGroups.map((grp, gi) => renderPermAccordionHTML(grp, gi, s.perms, s.id, canEditPerms, 'eacc_' + s.id)).join('');

  document.getElementById('editStaffModal').classList.add('open');
  } catch(_e) { console.error("[SG] openEditStaff:", _e); }
}

function saveEditedStaff() {
  try {
  const sid = document.getElementById('editStaffId').value;
  const s = staff.find(x => x.id === sid);
  if(!s) return;

  const name = document.getElementById('editSName').value.trim();
  const newPass = document.getElementById('editSPass').value.trim();
  const role = document.getElementById('editSRole').value.trim();
  const color = document.getElementById('editSColor').value;
  const dept = document.getElementById('editSDept')?.value || '';
  const status = document.getElementById('editSStatus')?.value || 'active';
  const branch = document.getElementById('editSBranch')?.value.trim() || '';
  const notes = document.getElementById('editSNotes')?.value.trim() || '';
  const reportingTo = document.getElementById('editSReporting')?.value || 'admin';

  if(!name || !role) { showToast('Name and role are required','error'); return; }

  s.name = name;
  s.role = role;
  s.color = color;
  s.dept = dept;
  s.status = status;
  s.branch = branch;
  s.notes = notes;
  s.reportingTo = reportingTo;
  if(newPass) s.password = newPass;

  // Feature 3: Save address permission
  const addrCb = document.getElementById('editSAddrPerm');
  if(addrCb) {
    const hasPerm = s.perms.includes('View Customer Address');
    if(addrCb.checked && !hasPerm) s.perms.push('View Customer Address');
    else if(!addrCb.checked && hasPerm) s.perms = s.perms.filter(p => p !== 'View Customer Address');
  }

  localStorage.setItem('sg_staff', JSON.stringify(staff)); sbSaveAllStaff(staff.length?staff:JSON.parse(localStorage.getItem('sg_staff')||'[]')).catch(()=>{});
  closeModal('editStaffModal');
  renderStaff();
  showToast('✅ ' + name + ' staff info updated!');
  } catch(_e) { console.error("[SG] saveEditedStaff:", _e); }
}

function openAddStaff() {
  try {
  const isAdm = currentUser?.role==='Admin';
  const canAdd = isAdm || currentUser?.perms?.includes('Staff - Add');
  if(!canAdd) { showToast('You do not have permission to add staff','error'); return; }
  document.getElementById('newStaffName').value='';
  document.getElementById('newStaffUser').value='';
  document.getElementById('newStaffPass').value='';
  document.getElementById('newStaffRole').value='';
  document.getElementById('newStaffColor').value='#e74c3c';
  document.getElementById('newStaffDept').value='';
  // Load small restaurant templates + custom templates in dropdown
  loadTemplateDropdown();
  document.getElementById('templateRoleDesc').textContent='';

  // Populate reporting manager dropdown — ALL staff + Admin
  populateReportingDropdown('newStaffReporting', '');
  const pp=document.getElementById('newStaffPerms');
  const statusGroups_n=[
    {name:'⏳ Pending',st:'Pending'},{name:'✅ Confirmed',st:'Confirmed'},
    {name:'👨‍🍳 Preparing',st:'Preparing'},{name:'🟢 Ready',st:'Ready'},
    {name:'🚴 Delivered',st:'Delivered'},{name:'❌ Cancelled',st:'Cancelled'},
  ];
  const orderTypes_n=[{key:'Home Delivery',icon:'🚴'},{key:'Takeaway',icon:'🥡'},{key:'Dine-In',icon:'🪑'}];

  pp.innerHTML=permGroups.map((grp,gi)=>{
    const accId='nacc_'+gi;
    if(grp.nested) {
      return `<div class="acc-group">
        <div class="acc-header" onclick="toggleAcc('${accId}')">
          <div class="acc-header-left">${grp.label}</div>
          <div class="acc-header-right">
            <span class="acc-count zero" id="ncount_${gi}">0/${grp.perms.length}</span>
            <span class="acc-arrow" id="arrow_${accId}">▼</span>
          </div>
        </div>
        <div class="acc-body" id="${accId}">
          ${statusGroups_n.map((sg,sgi)=>{
            const subId='nacc_'+gi+'_s'+sgi;
            const sgPerms=grp.perms.filter(p=>p.includes('Status - '+sg.st+' - '));
            return `<div style="border:1px solid #e8ddd5;border-radius:8px;overflow:hidden;margin-bottom:6px;">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#faf7f4;cursor:pointer;" onclick="toggleAcc('${subId}')">
                <span style="font-weight:600;font-size:0.85rem;">${sg.name}</span>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="acc-count zero" id="nsc_${gi}_${sgi}">0/${sgPerms.length}</span>
                  <span class="acc-arrow" style="font-size:0.75rem;" id="arrow_${subId}">▼</span>
                </div>
              </div>
              <div class="acc-body" id="${subId}">
                ${orderTypes_n.map(ot=>{
                  const p='Status - '+sg.st+' - '+ot.key;
                  const cbId='np-'+p.replace(/ /g,'-');
                  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #faf7f4;">
                    <label for="${cbId}" style="font-size:0.82rem;cursor:pointer;">${ot.icon} ${ot.key}</label>
                    <input type="checkbox" id="${cbId}" value="${p}" data-grp="${gi}"
                      style="width:18px;height:18px;cursor:pointer;accent-color:var(--fire);"
                      onchange="updateNCount(${gi},${grp.perms.length}); updateNSubCountMain(${gi},${sgi},${sgPerms.length})">
                  </div>`;
                }).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }
    return `<div class="acc-group">
      <div class="acc-header" onclick="toggleAcc('${accId}')">
        <div class="acc-header-left">${grp.label}</div>
        <div class="acc-header-right">
          <span class="acc-count zero" id="ncount_${gi}">0/${grp.perms.length}</span>
          <span class="acc-arrow" id="arrow_${accId}">▼</span>
        </div>
      </div>
      <div class="acc-body" id="${accId}">
        ${grp.perms.map(p=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #faf7f4;">
            <label for="np-${p.replace(/ /g,'-')}" style="font-size:0.82rem;cursor:pointer;color:var(--dark);">${p.replace(/^(View Orders - |View Customers - |Status - |Menu - |Inventory - |Staff - )/,'')}</label>
            <input type="checkbox" id="np-${p.replace(/ /g,'-')}" value="${p}" data-grp="${gi}"
              style="width:18px;height:18px;cursor:pointer;accent-color:var(--fire);"
              onchange="updateNCount(${gi},${grp.perms.length})">
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
  document.getElementById('addStaffModal').classList.add('open');
  } catch(_e) { console.error("[SG] openAddStaff:", _e); }
}
function saveNewStaff() {
  try {
  const name=document.getElementById('newStaffName').value.trim();
  const user=document.getElementById('newStaffUser').value.trim();
  const pass=document.getElementById('newStaffPass').value.trim();
  const role=document.getElementById('newStaffRole').value;
  if(!name||!user||!pass){showToast('Please fill all fields','error');return;}

  // Check duplicate username
  const allStaff = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  if(allStaff.find(s=>s.username===user)) {
    showToast('This username is already taken!','error'); return;
  }

  const perms=[...document.querySelectorAll('#newStaffPerms input:checked')].map(c=>c.value);
  const color=document.getElementById('newStaffColor').value||'#e74c3c';
  const reportingTo=document.getElementById('newStaffReporting').value||'admin';
  const dept=document.getElementById('newStaffDept').value||'';
  const addedBy=currentUser?.username||'admin';
  const addedAt=new Date().toLocaleString('en-IN');

  if(!reportingTo){showToast('Please select a Reporting Manager','error');return;}

  const isAdm = currentUser?.role==='Admin';
  const newEmployee = {
    id:'s'+Date.now(), name, username:user, password:pass,
    role, perms, color, reportingTo, dept,
    addedBy, addedAt, status:'active'
  };

  if(isAdm) {
    // Admin direct approve
    newEmployee.approvalStatus = 'approved';
    newEmployee.approvedBy = 'admin';
    newEmployee.approvedAt = addedAt;
    staff.push(newEmployee);
    localStorage.setItem('sg_staff',JSON.stringify(staff)); sbSaveAllStaff(staff.length?staff:JSON.parse(localStorage.getItem('sg_staff')||'[]')).catch(()=>{});
    // Security: naye staff ka Supabase Auth account bhi banao (login iske bina nahi chalega)
    if(pass.length < 6) {
      showToast('⚠️ Password 6 characters se chhota hai — Supabase login account nahi banega. Staff edit karke lamba password rakho.', 'warning');
    } else {
      sgAuthSignUp(user, pass).then(({error}) => {
        if(error && !/already/i.test(error.message||'')) console.error('[SG] staff auth signup:', error.message);
      }).catch(e => console.error('[SG] staff auth signup:', e));
    }
    // Reset form fields
    ['newStaffName','newStaffUser','newStaffPass','newStaffRole'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    document.getElementById('newStaffColor').value='#e74c3c';
    document.getElementById('newStaffDept').value='';
    document.getElementById('templateRestType') && (document.getElementById('templateRestType').value='');
    document.getElementById('templateRoleSelect').innerHTML='<option value="">-- Select a template --</option>';
    document.getElementById('templateRoleDesc').textContent='';
    document.querySelectorAll('#newStaffPerms input[type="checkbox"]').forEach(cb=>cb.checked=false);
    closeModal('addStaffModal');
    renderStaff();
    showToast('✅ '+name+' added to staff successfully!');
  } else {
    // Non-admin → pending approval
    newEmployee.approvalStatus = 'pending';
    const pending = JSON.parse(localStorage.getItem('sg_pending_staff')||'[]');
    pending.unshift(newEmployee);
    localStorage.setItem('sg_pending_staff', JSON.stringify(pending));
    // Reset form fields
    ['newStaffName','newStaffUser','newStaffPass','newStaffRole'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    document.getElementById('newStaffColor').value='#e74c3c';
    document.getElementById('newStaffDept').value='';
    document.getElementById('templateRoleSelect').innerHTML='<option value="">-- Select a template --</option>';
    document.getElementById('templateRoleDesc').textContent='';
    document.querySelectorAll('#newStaffPerms input[type="checkbox"]').forEach(cb=>cb.checked=false);
    closeModal('addStaffModal');
    // Show waiting message
    document.getElementById('pendingApprovalMsg').style.display='block';
    document.getElementById('pendingEmpName').textContent = name;
    document.getElementById('pendingApprovalModal').classList.add('open');
    renderStaff();
    updatePendingBadge();
  }
  } catch(_e) { console.error("[SG] saveNewStaff:", _e); }
}

function isItemAvailableNow(item) {
  if(!item.available) return false;
  const now = new Date();
  const cur = now.getHours()*60 + now.getMinutes();
  const [sh,sm] = (item.startTime||'00:00').split(':').map(Number);
  const [eh,em] = (item.endTime||'23:59').split(':').map(Number);
  const start = sh*60+sm, end = eh*60+em;
  if(!(cur >= start && cur <= end)) return false;
  // Feature 8: Day-wise availability check
  if(item.availableDays && item.availableDays.length > 0 && !item.availableDays.includes('All')) {
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = dayNames[new Date().getDay()];
    if(!item.availableDays.includes(today)) return false;
  }
  return true;
}


// ===== ADMIN MENU MGMT TABS =====
let _mgmtTab = 'food';

function setMgmtTab(tab) {
  _mgmtTab = tab;
  const tabs = { food: 'var(--fire)', liquor: '#4a148c', combo: '#1b5e20' };
  ['food','liquor','combo'].forEach(t => {
    const btn = document.getElementById('mgmtTab_' + t);
    if(!btn) return;
    const active = t === tab;
    btn.style.background = active ? tabs[t] : '#f5f5f5';
    btn.style.color = active ? '#fff' : '#666';
    btn.style.borderBottom = active ? '3px solid ' + tabs[t] : '3px solid transparent';
  });
  renderMenuMgmt();
}


// ===== CUSTOMER MENU TABS =====
let _custMenuTab = 'all';

function setCustMenuTab(tab) {
  _custMenuTab = tab;
  const colors = { all: 'var(--fire)', food: 'var(--fire)', liquor: '#4a148c', combo: '#1b5e20' };
  ['all','food','liquor','combo'].forEach(t => {
    const btn = document.getElementById('custTab_' + t);
    if(!btn) return;
    const active = t === tab;
    btn.style.background = active ? colors[t] : '#fff';
    btn.style.color = active ? '#fff' : '#666';
    btn.style.borderColor = active ? colors[t] : '#e8d5c8';
  });
  renderMenu();
}


// ===== SIZE VARIANTS =====
function getSizesFromModal() {
  const pL = parseFloat(document.getElementById('priceL')?.value) || 0;
  const pM = parseFloat(document.getElementById('priceM')?.value) || 0;
  const pS = parseFloat(document.getElementById('priceS')?.value) || 0;
  const sizes = [];
  if(pL > 0) sizes.push({ label: 'Large',  price: pL });
  if(pM > 0) sizes.push({ label: 'Medium', price: pM });
  if(pS > 0) sizes.push({ label: 'Small',  price: pS });
  return sizes;
}

function resetSizeSection() {
  ['priceL','priceM','priceS'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
}

function normalizeComboLabel(label) {
  const map = {'Large':'Premium','Medium':'Gold','Small':'Silver'};
  return map[label] || label || 'Premium';
}
function normalizeSizes(sizes) {
  if(!sizes) return sizes;
  return sizes.map(s => ({
    ...s,
    label: normalizeComboLabel(s.label),
    dishes: (s.dishes||[]).map(d => ({...d, sizeLabel: normalizeComboLabel(d.sizeLabel)}))
  }));
}

function renderMenuMgmt() {
  try {
  const gst = getGSTRate();
  const isAdmin = currentUser?.role === 'Admin';
  const grid = document.getElementById('menuMgmtGrid');
  if(!grid) return;

  if(!menuItems.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);"><div style="font-size:3rem;margin-bottom:12px;">🍽️</div><p>No dishes found. Add a new dish!</p></div>';
    return;
  }
  // Set default tab if not set
  if(!_mgmtTab) _mgmtTab = 'food';

  // Filter by active tab
  const filteredItems = menuItems.filter(item => {
    if(_mgmtTab === 'liquor') return item.isLiquor === true;
    if(_mgmtTab === 'combo')  return item.isCombo === true;
    // food tab: everything except liquor and combo
    return !item.isLiquor && !item.isCombo;
  });

  if(!filteredItems.length) {
    const tabNames = { food:'Food & Beverage', liquor:'Liquor', combo:'Combo' };
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);"><div style="font-size:3rem;margin-bottom:12px;">' +
      (_mgmtTab==='liquor'?'🍾':_mgmtTab==='combo'?'🍱':'🍽️') +
      '</div><p>Koi ' + tabNames[_mgmtTab] + ' item nahi hai. Upar se add karo!</p></div>';
    return;
  }

  grid.innerHTML = filteredItems.map(item => {
    // For combo: base price = sum of dish prices WITHOUT tax
    const base = (item.isCombo && item.comboDishes && item.comboDishes.length)
      ? parseFloat(item.comboDishes.reduce((s,d)=>s+(d.comboPrice||0)*(d.qty||1),0).toFixed(2))
      : item.price;
    const isLiquor = item.isLiquor === true;
    // Synthesize sizes for old combos + normalize labels
    if(item.isCombo && item.comboDishes && item.comboDishes.length && (!item.hasSizes || !item.sizes || !item.sizes.length)) {
      const synthDishes = item.comboDishes.map(d=>({...d, qty:d.qty||1, sizeLabel:normalizeComboLabel(d.sizeLabel||'Premium')}));
      item.sizes = [{ label:'Premium', price:item.price, dishes:synthDishes }];
      item.hasSizes = true;
    } else if(item.isCombo && item.sizes) {
      item.sizes = normalizeSizes(item.sizes);
      if(item.comboDishes) item.comboDishes = item.comboDishes.map(d=>({...d,sizeLabel:normalizeComboLabel(d.sizeLabel)}));
    }

    const isComboWithLiquor = item.isCombo && item.comboDishes &&
      item.comboDishes.some(d => d.isLiquor);

    // Calculate duties from client-set per-dish prices
    let gstAmt = 0, exciseAmt = 0, dutyAmt = 0;
    if(item.isCombo && item.comboDishes && item.comboDishes.length) {
      const excRate = getExciseDutyRate();
      item.comboDishes.forEach(d => {
        if(d.isLiquor) exciseAmt += Math.round((d.comboPrice||0) * excRate / 100);
        else gstAmt += Math.round((d.comboPrice||0) * gst / 100);
      });
      dutyAmt = gstAmt + exciseAmt;
    } else if(isLiquor) {
      dutyAmt = Math.round(base * getExciseDutyRate() / 100);
    } else {
      gstAmt = Math.round(base * gst / 100);
      dutyAmt = gstAmt;
    }
    const dutyPct = isLiquor ? getExciseDutyRate() : gst;
    const total   = base + dutyAmt;
    const avail    = item.available !== false;
    const canImg   = isAdmin || (currentUser?.perms||[]).includes('Menu - Change Image');
    const canEdit  = isAdmin || (currentUser?.perms||[]).some(p => p.startsWith('Menu - Edit'));
    const canDel   = isAdmin || (currentUser?.perms||[]).includes('Menu - Delete Dish');
    const canToggle= isAdmin || (currentUser?.perms||[]).includes('Menu - Remove Dish');
    const days     = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const border   = avail ? '#e8f5e9' : '#fce4ec';

    return `<div id="card-${item.id}" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:2px solid ${border};display:flex;flex-direction:column;">

      <!-- IMAGE AREA -->
      <div style="height:140px;background:${item.image?'#000':'linear-gradient(135deg,#fff5ee,#ffe8d6)'};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;flex-shrink:0;">
        ${item.image
          ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;">`
          : `<span style="font-size:3.5rem;line-height:1;">${item.emoji||'🍽️'}</span>`}
        <span style="position:absolute;top:8px;right:8px;background:${avail?'#2e7d32':'#c62828'};color:#fff;padding:4px 10px;border-radius:20px;font-size:0.7rem;font-weight:700;">
          ${avail?'✅ Available':'❌ Unavailable'}
        </span>
        ${item.bestSeller ? '<span style="position:absolute;top:8px;left:8px;background:#b8860b;color:#fff;padding:3px 8px;border-radius:20px;font-size:0.68rem;font-weight:800;">⭐ Best Seller</span>' : ''}
        ${canImg ? `<label style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.65);color:#fff;padding:5px 10px;border-radius:6px;font-size:0.72rem;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:4px;">📷 Change Image<input type="file" accept="image/*" style="display:none;" onchange="uploadImage('${item.id}',this)"></label>` : ''}
      </div>

      <!-- CARD BODY -->
      <div style="padding:16px;display:flex;flex-direction:column;flex:1;">

        <!-- Name + Badge -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="font-weight:700;font-size:1rem;line-height:1.2;">${item.name}</div>
            <div style="font-size:0.78rem;color:var(--muted);margin-top:2px;">${item.cat||''}</div>
          </div>
          ${item.isCombo
            ? `<span style="flex-shrink:0;margin-left:8px;background:#e8f5e9;color:#1b5e20;padding:3px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;">🍱 Combo</span>`
            : isLiquor
            ? `<span style="flex-shrink:0;margin-left:8px;background:#f3e5f5;color:#4a148c;padding:3px 8px;border-radius:20px;font-size:0.72rem;font-weight:700;">🍾 Liquor</span>`
            : `<span class="${item.type==='Veg'?'badge-veg':'badge-nonveg'}" style="flex-shrink:0;margin-left:8px;">${item.type==='Veg'?'🟢':'🔴'} ${item.type}</span>`}
        </div>

        <!-- Price + Type -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          ${(item.sizes && item.sizes.length > 1) ? `
          <div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(${item.sizes.length},1fr);gap:6px;">
            ${item.sizes.map(s=>{
              const sBase = s.dishes
                ? parseFloat(s.dishes.reduce((sum,d)=>sum+(d.comboPrice||0)*(d.qty||1),0).toFixed(2))
                : s.price;
              const col = s.label==='Premium'?'#1b5e20':s.label==='Gold'?'#e65100':'#c62828';
              const bg  = s.label==='Premium'?'#f1f8e9':s.label==='Gold'?'#fff8e1':'#fff5f5';
              return `<div>
                <div style="font-size:0.7rem;font-weight:700;color:${col};margin-bottom:3px;">
                  ${s.label==='Premium'?'🥇':s.label==='Gold'?'🥈':'🥉'} ${s.label} Base
                </div>
                <input type="number" value="${sBase}" readonly style="width:100%;padding:6px 8px;border:2px solid ${col};border-radius:8px;font-size:0.88rem;font-weight:700;background:${bg};box-sizing:border-box;color:${col};">
              </div>`;
            }).join('')}
          </div>` : `
          <div>
            <div style="font-size:0.72rem;color:var(--muted);font-weight:600;margin-bottom:3px;">Base Price (₹)</div>
            <input type="number" value="${base}" readonly style="width:100%;padding:7px 10px;border:2px solid #e8d5c8;border-radius:8px;font-size:0.9rem;font-weight:700;background:#faf7f4;box-sizing:border-box;">
          </div>`}
          <div ${(item.sizes && item.sizes.length > 1) ? 'style="grid-column:1/-1;"' : ''}>
            <div style="font-size:0.72rem;color:var(--muted);font-weight:600;margin-bottom:3px;">Type</div>
            <select disabled style="width:100%;padding:7px 8px;border:2px solid #e8d5c8;border-radius:8px;font-size:0.85rem;background:#faf7f4;box-sizing:border-box;">
              <option>${item.type}</option>
            </select>
          </div>
        </div>

        <!-- Read-only hint -->
        <div style="font-size:0.73rem;color:var(--muted);background:#faf7f4;border-radius:6px;padding:5px 8px;margin-bottom:10px;">
          🔒 Fields are read-only — use <span style="color:var(--fire);cursor:pointer;" onclick="openEditItemModal('${item.id}')">✏️ Edit button</span> to make changes
        </div>

        <!-- Size Variants Display -->
        ${item.hasSizes && item.sizes && item.sizes.length ? `
        <div style="background:#e8f5e9;border-radius:8px;padding:8px 12px;margin-bottom:10px;">
          <div style="font-weight:700;font-size:0.78rem;color:#2e7d32;margin-bottom:6px;">📏 Size Variants:</div>
          ${item.sizes.map(s=>{
            const excRate = getExciseDutyRate();
            if(s.dishes && s.dishes.length) {
              const foodDishes   = s.dishes.filter(d=>!d.isLiquor);
              const liquorDishes = s.dishes.filter(d=>d.isLiquor);
              const foodSubtotal = parseFloat(foodDishes.reduce((sum,d)=>sum+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));
              const foodGST      = parseFloat((foodSubtotal * gst / 100).toFixed(2));
              const foodTotal    = parseFloat((foodSubtotal + foodGST).toFixed(2));
              const liquorRows   = liquorDishes.map(d=>{
                const lAmt    = parseFloat(((d.comboPrice||0)*(d.qty||1)).toFixed(2));
                const lExcise = parseFloat((lAmt * excRate / 100).toFixed(2));
                const lTotal  = parseFloat((lAmt + lExcise).toFixed(2));
                return {name:d.name, amt:lAmt, excise:lExcise, total:lTotal};
              });
              const liquorSubtotal = parseFloat(liquorRows.reduce((s,r)=>s+r.total,0).toFixed(2));
              const grandTotal     = parseFloat((foodTotal + liquorSubtotal).toFixed(2));
              // Savings = size-specific MRP total vs combo price total (base, no tax)
              // Savings: use origPrice if set, else look up size price from menuItems
              const origTotal = parseFloat(s.dishes.reduce((sum,d)=>{
                let op = d.origPrice||0;
                if(!op) {
                  const mi = menuItems.find(m=>String(m.id)===String(d.id));
                  if(mi && mi.sizes && mi.sizes.length) {
                    const szDef = mi.sizes.find(sz=>sz.label===d.sizeLabel);
                    op = szDef ? szDef.price : (mi.price||0);
                  } else if(mi) { op = mi.price||0; }
                }
                return sum + op*(d.qty||1);
              },0).toFixed(2));
              const comboBase  = parseFloat(s.dishes.reduce((sum,d)=>sum+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));
              const savings    = origTotal > 0 ? parseFloat((origTotal - comboBase).toFixed(2)) : 0;

              return `<div style="background:#fff;border:1px solid #c8e6c9;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:0.78rem;">
                <div style="display:flex;justify-content:space-between;font-weight:800;font-size:0.82rem;margin-bottom:6px;color:#1b5e20;">
                  <span>📏 ${s.label}</span>
                  ${savings>0?`<span style="color:#e65100;">💰 Save ₹${savings} (MRP ₹${origTotal} → ₹${comboBase})</span>`:''}
                </div>
                ${foodDishes.length ? `
                  <div style="display:grid;grid-template-columns:1fr 40px 40px 80px;gap:4px;font-size:0.68rem;font-weight:700;color:var(--muted);padding:2px 0;border-bottom:1px dashed #e0e0e0;margin-bottom:3px;">
                    <span>Item</span><span style="text-align:center;">Size</span><span style="text-align:center;">Qty</span><span style="text-align:right;">Amt</span>
                  </div>
                  ${foodDishes.map(d=>`<div style="display:grid;grid-template-columns:1fr 40px 40px 80px;gap:4px;padding:2px 0;color:#333;font-size:0.78rem;align-items:center;">
                    <span>🍽️ ${d.name}</span>
                    <span style="text-align:center;font-weight:700;color:#1b5e20;font-size:0.72rem;">${(d.sizeLabel||'L')[0]}</span>
                    <span style="text-align:center;font-weight:700;color:#555;">${d.qty||1}</span>
                    <span style="text-align:right;">₹${((d.comboPrice||0)*(d.qty||1)).toFixed(2)}</span>
                  </div>`).join('')}
                  <div style="border-top:1px dashed #a5d6a7;margin:4px 0;padding-top:4px;display:flex;justify-content:space-between;color:#2e7d32;font-weight:600;font-size:0.76rem;">
                    <span>🧾 GST ${gst}% on Food (₹${foodSubtotal})</span>
                    <span>+₹${foodGST} = ₹${foodTotal}</span>
                  </div>` : ''}
                ${liquorRows.length ? `
                  <div style="border-top:1px solid #e0e0e0;margin:4px 0;"></div>
                  <div style="display:grid;grid-template-columns:1fr 40px 40px 80px;gap:4px;font-size:0.68rem;font-weight:700;color:var(--muted);padding:2px 0;border-bottom:1px dashed #e0e0e0;margin-bottom:3px;">
                    <span>Item</span><span style="text-align:center;">Size</span><span style="text-align:center;">Qty</span><span style="text-align:right;">Amt</span>
                  </div>
                  ${liquorDishes.map((d,i)=>`<div style="display:grid;grid-template-columns:1fr 40px 40px 80px;gap:4px;padding:2px 0;color:#333;font-size:0.78rem;align-items:center;">
                    <span>🍾 ${d.name}</span>
                    <span style="text-align:center;font-weight:700;color:#c62828;font-size:0.72rem;">${(d.sizeLabel||'S')[0]}</span>
                    <span style="text-align:center;font-weight:700;color:#555;">${d.qty||1}</span>
                    <span style="text-align:right;">₹${liquorRows[i].amt.toFixed(2)}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;color:#4a148c;font-weight:600;font-size:0.76rem;padding:2px 0;">
                    <span>🏛️ Excise ${excRate}% on ${d.name} (₹${liquorRows[i].amt})</span>
                    <span>+₹${liquorRows[i].excise} = ₹${liquorRows[i].total}</span>
                  </div>`).join('')}` : ''}
                <div style="border-top:1px solid #a5d6a7;margin-top:5px;padding-top:5px;">
                  ${foodDishes.length && liquorRows.length ? `<div style="display:flex;justify-content:space-between;color:#555;font-size:0.75rem;">
                    <span>Food & Beverage (₹${foodTotal}) + Liquor (₹${liquorSubtotal})</span>
                  </div>` : ''}
                  <div style="display:flex;justify-content:space-between;font-weight:800;color:var(--fire);font-size:0.82rem;margin-top:3px;">
                    <span>Total Cost</span><span>₹${grandTotal}</span>
                  </div>
                </div>
              </div>`;
            }
            // Simple size (non-combo item)
            const excRate2 = getExciseDutyRate();
            const dutyRate = isLiquor ? excRate2 : gst;
            const dutyAmt2 = Math.round(s.price * dutyRate / 100);
            const dutyLabel = isLiquor ? 'Excise '+excRate2+'%' : 'GST '+gst+'%';
            return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed ${isLiquor?'#ce93d8':'#c8e6c9'};font-size:0.82rem;">
              <span>${s.label}</span>
              <span style="font-weight:700;">₹${s.price} <span style="color:var(--muted);font-size:0.72rem;">(+₹${dutyAmt2} ${dutyLabel} = ₹${s.price+dutyAmt2})</span></span>
            </div>`;
          }).join('')}
        </div>` : ''}

        <!-- Combo Includes removed - shown in Size Variants -->

        <!-- Price Breakdown (non-combo only) -->
        ${!item.isCombo ? `
        <div style="background:${isLiquor?'#f3e5f5':'#faf7f4'};border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:0.83rem;${isLiquor?'border-left:3px solid #7b1fa2;':''}">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span style="color:var(--muted);">Base Price</span><span>₹${base}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="color:${isLiquor?'#4a148c':'var(--muted)'};">${isLiquor?'🏛️ Excise Duty ('+dutyPct+'%)':'🧾 GST ('+gst+'%)'}</span>
            <span style="color:${isLiquor?'#4a148c':'var(--muted)'};">+₹${dutyAmt}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:700;border-top:1px solid #e8d5c8;padding-top:5px;">
            <span>Total Price</span><span style="color:var(--fire);">₹${total}</span>
          </div>
        </div>` : ''}

        <!-- Start / End Time -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <div>
            <div style="font-size:0.7rem;color:var(--muted);font-weight:600;margin-bottom:3px;">⏰ Start Time</div>
            <input type="time" value="${item.startTime||'00:00'}" readonly style="width:100%;padding:6px 8px;border:2px solid #e8d5c8;border-radius:8px;font-size:0.83rem;background:#faf7f4;box-sizing:border-box;">
          </div>
          <div>
            <div style="font-size:0.7rem;color:var(--muted);font-weight:600;margin-bottom:3px;">⏰ End Time</div>
            <input type="time" value="${item.endTime||'23:59'}" readonly style="width:100%;padding:6px 8px;border:2px solid #e8d5c8;border-radius:8px;font-size:0.83rem;background:#faf7f4;box-sizing:border-box;">
          </div>
        </div>

        <!-- Available Days -->
        <div style="margin-bottom:14px;">
          <div style="font-size:0.7rem;color:var(--muted);font-weight:600;margin-bottom:5px;">📅 Available Days</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${days.map(d => {
              const on = !item.availDays||!item.availDays.length||item.availDays.includes(d);
              return `<span style="padding:3px 7px;border-radius:20px;font-size:0.68rem;font-weight:700;border:1px solid ${on?'var(--fire)':'#ddd'};background:${on?'#fff5f0':'#f5f5f5'};color:${on?'var(--fire)':'#aaa'};">${d}</span>`;
            }).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:8px;margin-top:auto;">
          ${canEdit   ? `<button onclick="openEditItemModal('${item.id}')" style="flex:1;padding:9px;background:#e3f2fd;color:#1565c0;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.82rem;">✏️ Edit</button>` : ''}
          ${canToggle ? `<button onclick="toggleDishAvailable('${item.id}')" style="flex:1;padding:9px;background:${avail?'#fff3e0':'#e8f5e9'};color:${avail?'#e65100':'#2e7d32'};border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.82rem;">${avail?'🔴 Unavail':'✅ Avail'}</button>` : ''}
          ${canDel    ? `<button onclick="deleteMenuItem('${item.id}')" style="flex:1;padding:9px;background:#fce4ec;color:#c62828;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.82rem;">🗑️ Delete</button>` : ''}
        </div>

      </div>
    </div>`;
  }).join('');
  } catch(e) { console.error('[SG] renderMenuMgmt:', e); }
}

function updatePricePreview(id) {
  try {
  const price = parseFloat(document.getElementById('price-'+id).value)||0;
  const gst = getGSTRate();
  const gstAmt = Math.round(price*gst/100);
  document.getElementById('prev-base-'+id).textContent = price;
  document.getElementById('prev-gst-'+id).textContent = gstAmt;
  document.getElementById('prev-total-'+id).textContent = price+gstAmt;
  } catch(_e) { console.error("[SG] updatePricePreview:", _e); }
}

async function saveMenuItem(id) {
  try {
  const item = menuItems.find(m=>String(m.id)==String(id));
  if(!item) return;
  item.price = parseFloat(document.getElementById('price-'+id).value)||item.price;
  item.type = document.getElementById('type-'+id).value;
  item.startTime = document.getElementById('start-'+id).value;
  item.endTime = document.getElementById('end-'+id).value;
  await sbUpsertMenuItem(item).catch(e=>console.error('saveMenuItem fail:',e));
  renderMenuMgmt();
  renderMenu();
  showToast('✅ '+item.name+' saved!');
  } catch(_e) { console.error("[SG] saveMenuItem:", _e); }
}

async function toggleItemAvailable(id) {
  try {
  const item = menuItems.find(m=>String(m.id)==String(id));
  if(!item) return;
  item.available = !item.available;
  await sbUpsertMenuItem(item).catch(e=>console.error('toggleAvail fail:',e));
  renderMenuMgmt();
  renderMenu();
  showToast(item.available ? '🟢 '+item.name+' is now available!' : '🔴 '+item.name+' has been removed!');
  } catch(_e) { console.error("[SG] toggleItemAvailable:", _e); }
}

// Feature 4: Dish available/unavailable toggle (alias)
async function toggleDishAvailable(id) {
  try {
  const sid = String(id);
  const item = menuItems.find(m=>String(m.id)==sid);
  if(!item) return;
  item.available = item.available === false ? true : false;
  // Persist to correct localStorage key
  if(item.isLiquor) {
    const liq = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
    const idx = liq.findIndex(m=>String(m.id)==sid);
    if(idx>=0) { liq[idx]=item; localStorage.setItem('sg_liquor_items', JSON.stringify(liq)); }
  } else if(item.isCombo) {
    const cmb = JSON.parse(localStorage.getItem('sg_combo_items')||'[]');
    const idx = cmb.findIndex(m=>String(m.id)==sid);
    if(idx>=0) { cmb[idx]=item; localStorage.setItem('sg_combo_items', JSON.stringify(cmb)); }
  } else {
    await sbUpsertMenuItem(item).catch(e=>console.error('toggleDish fail:',e));
  }
  renderMenuMgmt();
  renderMenu();
  showToast(item.available ? '🟢 '+item.name+' is now Available!' : '🔴 '+item.name+' marked Unavailable!');
  } catch(_e) { console.error("[SG] toggleDishAvailable:", _e); }
}

// Feature 6: Best seller toggle
async function toggleBestSeller(id, state) {
  try {
  const item = menuItems.find(m=>String(m.id)==String(id));
  if(!item) return;
  item.bestSeller = state;
  await sbUpsertMenuItem(item).catch(e=>console.error('toggleBestSeller fail:',e));
  renderMenuMgmt();
  renderMenu();
  showToast(state ? '⭐ '+item.name+' marked as Best Seller!' : item.name+' Best Seller tag removed');
  } catch(_e) { console.error("[SG] toggleBestSeller:", _e); }
}

async function deleteMenuItem(id) {
  try {
  if(!confirm('Permanently delete this dish?')) return;
  const sid = String(id);
  menuItems = menuItems.filter(m=>String(m.id)!=sid);
  // Remove from liquor localStorage if applicable
  const liq = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
  const liqFiltered = liq.filter(m=>String(m.id)!=sid);
  if(liq.length !== liqFiltered.length) localStorage.setItem('sg_liquor_items', JSON.stringify(liqFiltered));
  // Remove from combo localStorage if applicable
  const cmb = JSON.parse(localStorage.getItem('sg_combo_items')||'[]');
  const cmbFiltered = cmb.filter(m=>String(m.id)!=sid);
  if(cmb.length !== cmbFiltered.length) localStorage.setItem('sg_combo_items', JSON.stringify(cmbFiltered));
  await sbDeleteMenuItem(id).catch(e=>console.error('deleteMenuItem fail:',e));
  renderMenuMgmt();
  renderMenu();
  showToast('Dish deleted successfully!');
  } catch(_e) { console.error("[SG] deleteMenuItem:", _e); }
}

// ============================================================
//  Usage/Storage fix: files ab Supabase Storage bucket 'sg-uploads'
//  mein jaate hain (base64 DB mein NAHI). DB mein sirf chhota URL
//  save hota hai — 512MB storage aur 5GB egress dono bachta hai.
//  Agar bucket set nahi hua toh base64 fallback (kuch toota nahi).
// ============================================================
async function uploadFileToStorage(file, folder){
  try {
    if(!file) return null;
    var ext = (file.name && file.name.indexOf('.')>=0) ? file.name.split('.').pop().toLowerCase() : 'png';
    var path = (folder||'misc') + '/' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.' + ext;
    var up = await _supabase.storage.from('sg-uploads').upload(path, file, { upsert:true, cacheControl:'3600' });
    if(up.error){ console.warn('[SG] storage upload failed (base64 fallback):', up.error.message); return null; }
    var pub = _supabase.storage.from('sg-uploads').getPublicUrl(path);
    return (pub && pub.data && pub.data.publicUrl) ? pub.data.publicUrl : null;
  } catch(e){ console.warn('[SG] uploadFileToStorage error (base64 fallback):', e); return null; }
}

function _fileToBase64(file){
  return new Promise(function(res){ var r=new FileReader(); r.onload=function(e){res(e.target.result);}; r.readAsDataURL(file); });
}

// Bug #9 fix — base64 fallback se pehle image compress karo.
// 2MB ki raw base64 (~2.7MB string) 2-3 images mein hi localStorage (~5MB)
// bhar deti thi. Ab canvas se resize + JPEG compress => ~50-150KB per image.
// Compress fail ho toh original base64 fallback.
function _compressImageToBase64(file, maxDim, quality) {
  return new Promise(function(res) {
    try {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function() {
        try {
          var w = img.width, h = img.height;
          var scale = Math.min(1, (maxDim||800) / Math.max(w, h));
          var cw = Math.max(1, Math.round(w*scale)), ch = Math.max(1, Math.round(h*scale));
          var cv = document.createElement('canvas');
          cv.width = cw; cv.height = ch;
          cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
          URL.revokeObjectURL(url);
          res(cv.toDataURL('image/jpeg', quality||0.75));
        } catch(e) { try { URL.revokeObjectURL(url); } catch(_u){} _fileToBase64(file).then(res); }
      };
      img.onerror = function() { try { URL.revokeObjectURL(url); } catch(_u){} _fileToBase64(file).then(res); };
      img.src = url;
    } catch(e) { _fileToBase64(file).then(res); }
  });
}

async function uploadImage(id, input) {
  try {
  const file = input.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024) { showToast('Image must be less than 2MB','error'); return; }
  const item = menuItems.find(m=>String(m.id)==String(id));
  if(!item) return;
  // Storage pe daalo; fail hue toh COMPRESSED base64 fallback (Bug #9 fix)
  const url = await uploadFileToStorage(file, 'menu');
  item.image = url ? url : await _compressImageToBase64(file, 800, 0.75);
  sbUpsertMenuItem(item).catch(e=>console.error('uploadImage fail:',e));
  renderMenuMgmt(); renderMenu();
  showToast(url ? '✅ Image uploaded successfully!' : '✅ Image saved (tip: set up "sg-uploads" storage bucket to save space)');
  } catch(_e) { console.error("[SG] uploadImage:", _e); }
}


function openEditComboModal(item) {
  try {
  document.getElementById('editComboId').value   = String(item.id);
  document.getElementById('editComboName').value  = item.name || '';
  document.getElementById('editComboDesc').value  = item.desc || '';
  document.getElementById('editComboEmoji').value = item.emoji || '🍱';
  document.getElementById('editComboStart').value = item.startTime || '00:00';
  document.getElementById('editComboEnd').value   = item.endTime   || '23:59';

  // Days picker
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dp = document.getElementById('editComboDaysPicker');
  if(dp) {
    const activeDays = item.availDays || [];
    dp.innerHTML = days.map(d => {
      const on = !activeDays.length || activeDays.includes(d);
      return `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 8px;border:1px solid #e0e0e0;border-radius:6px;font-size:0.8rem;">
        <input type="checkbox" value="${d}" ${on?'checked':''} class="editComboDaysCb"> ${d}</label>`;
    }).join('');
  }

  // Populate dish picker with all non-combo items
  const picker = document.getElementById('editComboDishPicker');
  const regularItems = menuItems.filter(i => !i.isCombo);
  const existingDishIds = (item.comboDishes||[]).map(d=>String(d.id));
  if(picker) {
    if(!regularItems.length) {
      picker.innerHTML = '<div style="color:var(--muted);">No dishes available.</div>';
    } else {
      picker.innerHTML = regularItems.map(mi => {
        const isLiq = mi.isLiquor||false;
        const tag = isLiq ? '🍾 Liquor' : mi.type==='Veg' ? '🟢 Veg' : '🔴 Non-Veg';
        const checked = existingDishIds.includes(String(mi.id));
        return `<label style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border:1px solid ${isLiq?'#ce93d8':'#e8d5c8'};border-radius:8px;cursor:pointer;">
          <input type="checkbox" id="ecdish_${mi.id}" value="${mi.id}"
            data-name="${mi.name.replace(/"/g,'&quot;')}"
            data-isliquor="${isLiq}" data-origprice="${mi.price}"
            onchange="updateEditComboBreakdown()"
            style="cursor:pointer;width:16px;height:16px;" ${checked?'checked':''}>
          <span style="flex:1;font-size:0.85rem;font-weight:600;">${mi.emoji||'🍽️'} ${mi.name}</span>
          <span style="font-size:0.72rem;padding:2px 7px;border-radius:10px;background:${isLiq?'#f3e5f5':'#f5f5f5'};color:${isLiq?'#4a148c':'#666'};">${tag}</span>
        </label>`;
      }).join('');
    }
  }

  // Build variant sections then restore existing prices
  updateEditComboBreakdown();

  // Restore existing prices from saved combo
  if(item.sizes && item.sizes.length) {
    item.sizes.forEach(sz => {
      (sz.dishes||[]).forEach(d => {
        const grpMap = {'Premium':'PremiumGoldSilver','Gold':'GoldSilver','Silver':'Silver'};
        const grpKey = grpMap[sz.label]||'PremiumGoldSilver';
        const inp = document.getElementById('evp_'+grpKey+'_'+d.id);
        if(inp) {
          inp.value = d.comboPrice||'';
          const radios = document.querySelectorAll(`input[name="evar${grpKey}_${d.id}"]`);
          radios.forEach(r => { if(r.value === (d.sizeLabel||'Large')) r.checked=true; });
          // Restore qty
          const qtyInp = document.getElementById('evq_'+grpKey+'_'+d.id);
          if(qtyInp && d.qty) qtyInp.value = d.qty;
          // Update total display
          const taxR = parseFloat(inp.getAttribute('data-taxrate'))||0;
          updateEditItemTotal('evp_'+grpKey+'_'+d.id,'evq_'+grpKey+'_'+d.id,'evt_'+grpKey+'_'+d.id,taxR,grpKey);
        }
      });
    });
  } else if(item.comboDishes) {
    item.comboDishes.forEach(d => {
      const inp = document.getElementById('evp_PremiumGoldSilver_'+d.id);
      if(inp) {
        inp.value = d.comboPrice||'';
        const qtyInp = document.getElementById('evq_PremiumGoldSilver_'+d.id);
        if(qtyInp && d.qty) qtyInp.value = d.qty;
        const taxR = parseFloat(inp.getAttribute('data-taxrate'))||0;
        updateEditItemTotal('evp_PremiumGoldSilver_'+d.id,'evq_PremiumGoldSilver_'+d.id,'evt_PremiumGoldSilver_'+d.id,taxR,'PremiumGoldSilver');
      }
    });
  }

  recalcEditVariantTotal('PremiumGoldSilver');
  recalcEditVariantTotal('GoldSilver');
  recalcEditVariantTotal('Silver');

  document.getElementById('editComboModal').classList.add('open');
  } catch(e) { console.error('[SG] openEditComboModal:', e); alert('Error: '+e.message); }
}

function updateEditComboBreakdown() {
  try {
  const checkedCbs = [...document.querySelectorAll('#editComboDishPicker input[type=checkbox]:checked')];
  const gst = getGSTRate(); const excRate = getExciseDutyRate();
  const empty = '<div style="color:var(--muted);font-size:0.8rem;font-style:italic;">Pehle Step 1 mein dishes select karo...</div>';

  // Save existing prices
  const saved = {};
  ['PremiumGoldSilver','GoldSilver','Silver'].forEach(grp => {
    checkedCbs.forEach(cb => {
      const inp = document.getElementById('evp_'+grp+'_'+cb.value);
      if(inp && inp.value) saved[grp+'_'+cb.value] = inp.value;
    });
  });

  ['editComboLargeVariant','editComboMediumVariant','editComboSmallVariant'].forEach(id=>{
    const el=document.getElementById(id); if(el&&!checkedCbs.length) el.innerHTML=empty;
  });

  if(!checkedCbs.length) {
    const cp=document.getElementById('editComboPrice'); if(cp) cp.value='';
    return;
  }

  function buildEditRow(dishId, dishName, isLiq, origPrice, sizes) {
    const taxR = isLiq ? excRate : gst;
    const dish = menuItems.find(m=>String(m.id)===String(dishId));
    const szPrices = {};
    if(dish && dish.sizes) dish.sizes.forEach(s=>{szPrices[s.label]=s.price;});
    if(!szPrices['Large'])  szPrices['Large']  = origPrice;
    if(!szPrices['Medium']) szPrices['Medium'] = origPrice;
    if(!szPrices['Silver'])  szPrices['Silver']  = origPrice;
    const grpKey = sizes.join('');
    const inputId = `evp_${grpKey}_${dishId}`;
    const sizeOpts = sizes.map(sz => {
      const p = szPrices[sz]||origPrice;
      return `<label style="display:flex;align-items:center;gap:3px;cursor:pointer;padding:3px 6px;border-radius:6px;border:1px solid ${sz==='Premium'?'#c8e6c9':sz==='Gold'?'#ffe0b2':'#ffcdd2'};">
        <input type="radio" name="evar${grpKey}_${dishId}" value="${sz}" data-szprice="${p}"
          onchange="editAutoFillPrice('${inputId}',this,'${grpKey}')" style="cursor:pointer;">
        <span style="font-size:0.7rem;font-weight:700;color:${sz==='Premium'?'#1b5e20':sz==='Gold'?'#e65100':'#c62828'};">${sz[0]}</span>
        <span style="font-size:0.68rem;color:var(--muted);">₹${p}</span>
      </label>`;
    }).join('');
    const qtyEId   = `evq_${grpKey}_${dishId}`;
    const totalEId = `evt_${grpKey}_${dishId}`;
    return `<div style="display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;padding:7px 8px;background:#fff;border:1px solid ${isLiq?'#ce93d8':'#e8d5c8'};border-radius:8px;margin-bottom:4px;">
      <span style="font-size:0.78rem;font-weight:700;">${isLiq?'🍾':'🍽️'} ${dishName}</span>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">${sizeOpts}</div>
      <div style="display:flex;align-items:center;gap:5px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="font-size:0.65rem;color:var(--muted);">Price</span>
          <input type="number" id="${inputId}" min="0" data-isliquor="${isLiq}" data-taxrate="${taxR}"
            step="any"
            style="width:75px;padding:4px 5px;border:2px solid #a5d6a7;border-radius:6px;font-size:0.82rem;font-weight:700;text-align:center;color:var(--fire);"
            oninput="updateEditItemTotal('${inputId}','${qtyEId}','${totalEId}','${taxR}','${grpKey}')">
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="font-size:0.65rem;color:var(--muted);">Qty</span>
          <input type="number" id="${qtyEId}" value="1" min="1" max="99"
            style="width:50px;padding:4px 5px;border:2px solid #b0bec5;border-radius:6px;font-size:0.82rem;font-weight:700;text-align:center;"
            oninput="updateEditItemTotal('${inputId}','${qtyEId}','${totalEId}','${taxR}','${grpKey}')">
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="font-size:0.65rem;color:var(--muted);">Total</span>
          <span id="${totalEId}" style="font-size:0.82rem;font-weight:800;color:#1b5e20;min-width:55px;text-align:right;">₹0</span>
        </div>
      </div>
    </div>`;
  }

  let lvH='',mvH='',svH='';
  checkedCbs.forEach(cb=>{
    const id=cb.value, name=cb.getAttribute('data-name'), isLiq=cb.getAttribute('data-isliquor')==='true', orig=parseFloat(cb.getAttribute('data-origprice'))||0;
    lvH+=buildEditRow(id,name,isLiq,orig,['Premium','Gold','Silver']);
    mvH+=buildEditRow(id,name,isLiq,orig,['Gold','Silver']);
    svH+=buildEditRow(id,name,isLiq,orig,['Silver']);
  });

  const lv=document.getElementById('editComboLargeVariant');  if(lv)lv.innerHTML=lvH;
  const mv=document.getElementById('editComboMediumVariant'); if(mv)mv.innerHTML=mvH;
  const sv=document.getElementById('editComboSmallVariant');  if(sv)sv.innerHTML=svH;

  // Default radios + auto-fill
  ['PremiumGoldSilver','GoldSilver','Silver'].forEach(grp=>{
    checkedCbs.forEach(cb=>{
      const first=document.querySelector(`input[name="evar${grp}_${cb.value}"]`);
      if(first&&!document.querySelector(`input[name="evar${grp}_${cb.value}"]:checked`)){
        first.checked=true; editAutoFillPrice(`evp_${grp}_${cb.value}`,first,grp);
      }
      // Restore saved prices
      const k=grp+'_'+cb.value;
      if(saved[k]){const inp=document.getElementById('evp_'+grp+'_'+cb.value);if(inp)inp.value=saved[k];}
    });
  });

  recalcEditVariantTotal('PremiumGoldSilver');
  recalcEditVariantTotal('GoldSilver');
  recalcEditVariantTotal('Silver');
  } catch(e){console.error('[SG] updateEditComboBreakdown:',e);}
}

function editAutoFillPrice(inputId, radio, grpKey) {
  const inp=document.getElementById(inputId);
  if(inp){ inp.value=radio.getAttribute('data-szprice')||''; }
  const dishId=inputId.replace('evp_'+grpKey+'_','');
  updateEditItemTotal(inputId,'evq_'+grpKey+'_'+dishId,'evt_'+grpKey+'_'+dishId,0,grpKey);
}

function updateEditItemTotal(priceId,qtyId,totalId,taxR,grpKey) {
  const p=parseFloat(document.getElementById(priceId)?.value)||0;
  const qty=parseInt(document.getElementById(qtyId)?.value)||1;
  const tot=parseFloat((p*qty).toFixed(2));
  const el=document.getElementById(totalId); if(el) el.textContent='₹'+tot;
  recalcEditVariantTotal(grpKey);
}

function recalcEditVariantTotal(grpKey) {
  const totalIds={'PremiumGoldSilver':'editComboLargeTotal','GoldSilver':'editComboMediumTotal','Silver':'editComboSmallTotal'};
  const el=document.getElementById(totalIds[grpKey]); if(!el) return;
  let total=0;
  document.querySelectorAll(`input[id^="evp_${grpKey}_"]`).forEach(inp=>{
    const dishId=inp.id.replace('evp_'+grpKey+'_','');
    const p=parseFloat(inp.value)||0;
    const qty=parseInt(document.getElementById('evq_'+grpKey+'_'+dishId)?.value)||1;
    total=parseFloat((total+p*qty).toFixed(2));
  });
  el.textContent=total;
  if(grpKey==='PremiumGoldSilver'){const cp=document.getElementById('editComboPrice');if(cp)cp.value=total||'';}
  else if(grpKey==='GoldSilver'){const cp=document.getElementById('editComboMediumTotalField');if(cp)cp.value=total||'';}
  else if(grpKey==='Silver'){const cp=document.getElementById('editComboSmallTotalField');if(cp)cp.value=total||'';}
}

async function saveEditedCombo() {
  try {
  const id   = document.getElementById('editComboId').value;
  const name = document.getElementById('editComboName').value.trim();
  const desc = document.getElementById('editComboDesc').value.trim();
  const emoji= document.getElementById('editComboEmoji').value.trim() || '🍱';
  const startTime = document.getElementById('editComboStart').value || '00:00';
  const endTime   = document.getElementById('editComboEnd').value   || '23:59';
  if(!name) { alert('Combo name required!'); return; }

  const item = menuItems.find(m=>String(m.id)===String(id));
  if(!item) return;

  // Get checked dishes
  const checkedCbs = [...document.querySelectorAll('#editComboDishPicker input[type=checkbox]:checked')];
  if(!checkedCbs.length) { alert('Kam se kam 1 dish select karo!'); return; }

  const gst2 = getGSTRate();
  const comboDishes = [];
  for(const cb of checkedCbs) {
    const dishId=String(cb.value), dishName=cb.getAttribute('data-name'), isLiquor=cb.getAttribute('data-isliquor')==='true';
    const origMRP=parseFloat(cb.getAttribute('data-origprice'))||0, dutyPct=isLiquor?getExciseDutyRate():gst2;
    const inpL=document.getElementById('evp_PremiumGoldSilver_'+dishId);
    const priceL=parseFloat(inpL?.value)||0;
    if(!priceL){alert(dishName+' ka Large combo price daalo!');return;}
    const szR=document.querySelector(`input[name="evarPremiumGoldSilver_${dishId}"]:checked`);
    const sz=szR?.value||'Large', da=Math.round(priceL*dutyPct/100);
    const qtyL=parseInt(document.getElementById('evq_PremiumGoldSilver_'+dishId)?.value)||1;
    const dObj2=menuItems.find(m=>String(m.id)===dishId);
    let szOrigP=origMRP;
    if(dObj2&&dObj2.sizes&&dObj2.sizes.length){const sd=dObj2.sizes.find(s=>s.label===sz);if(sd)szOrigP=sd.price;}
    comboDishes.push({id:dishId,name:dishName,sizeLabel:sz,comboPrice:priceL,qty:qtyL,origPrice:szOrigP,savedPerDish:Math.max(0,szOrigP-priceL),isLiquor,exciseDuty:getExciseDutyRate(),dutyPct,dutyAmt:da,total:(priceL+da)*qtyL});
  }

  // Medium/Small variants
  const medDishes=[],smlDishes=[];
  checkedCbs.forEach(cb=>{
    const id=cb.value, isLiq=cb.getAttribute('data-isliquor')==='true', dt=isLiq?getExciseDutyRate():gst2;
    const mkD=(grp)=>{const inp=document.getElementById('evp_'+grp+'_'+id);const p=parseFloat(inp?.value)||0;if(!p)return null;const qty=parseInt(document.getElementById('evq_'+grp+'_'+id)?.value)||1;const r=document.querySelector(`input[name="evar${grp}_${id}"]:checked`);const sz=r?.value||'';const da=Math.round(p*dt/100);const dO=menuItems.find(m=>String(m.id)===id);let szO=parseFloat(cb.getAttribute('data-origprice'))||0;if(dO&&dO.sizes&&dO.sizes.length){const sd=dO.sizes.find(s=>s.label===sz);if(sd)szO=sd.price;}return{id,name:cb.getAttribute('data-name'),sizeLabel:sz,comboPrice:p,qty,origPrice:szO,savedPerDish:Math.max(0,szO-p),isLiquor:isLiq,dutyPct:dt,dutyAmt:da,total:(p+da)*qty};};
    const md=mkD('GoldSilver');if(md)medDishes.push(md);
    const sd=mkD('Silver');if(sd)smlDishes.push(sd);
  });

  // Base price = sum of comboPrice × qty (WITHOUT tax)
  const largeBase=parseFloat(comboDishes.reduce((s,d)=>s+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));
  const medBase  =parseFloat(medDishes.reduce((s,d)=>s+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));
  const smlBase  =parseFloat(smlDishes.reduce((s,d)=>s+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));
  const largeTotal=largeBase;
  const medTotal  =medBase;
  const smlTotal  =smlBase;
  const comboSizes=[{label:'Premium',price:largeBase,dishes:comboDishes}];
  if(medBase>0) comboSizes.push({label:'Gold',price:medBase,dishes:medDishes});
  if(smlBase>0) comboSizes.push({label:'Silver',price:smlBase,dishes:smlDishes});

  const origMRPTotal=comboDishes.reduce((s,d)=>s+(d.origPrice||0),0);
  const hasLiquor=comboDishes.some(d=>d.isLiquor);
  const hasNonVeg=comboDishes.some(d=>{const m=menuItems.find(i=>String(i.id)===d.id);return m&&m.type==='Non-Veg';});

  // Available days
  const dayCbs=[...document.querySelectorAll('.editComboDaysCb:checked')];
  const availDays=dayCbs.map(c=>c.value);

  Object.assign(item,{name,desc,emoji,startTime,endTime,availDays,price:largeBase,
    comboDishes,comboDishIds:comboDishes.map(d=>d.id),comboDishNames:comboDishes.map(d=>d.name),
    origMRPTotal,savings:Math.max(0,origMRPTotal-largeTotal),
    hasSizes:comboSizes.length>1,sizes:comboSizes,
    type:hasLiquor?'Mixed':hasNonVeg?'Non-Veg':'Veg'});

  const combos=JSON.parse(localStorage.getItem('sg_combo_items')||'[]');
  const idx=combos.findIndex(m=>String(m.id)===String(id));
  if(idx>=0){combos[idx]=item;localStorage.setItem('sg_combo_items',JSON.stringify(combos));}

  closeModal('editComboModal');
  renderMenuMgmt(); renderMenu();
  showToast('✅ Combo updated!');
  } catch(e){console.error('[SG] saveEditedCombo:',e);alert('Error: '+e.message);}
}

function openEditItemModal(id) {
  try {
  menuItems = getMenuItems();
  const item = menuItems.find(m=>String(m.id)==String(id));
  if(!item) return;

  // Combo items get a simple name/desc/emoji edit only
  if(item.isCombo) {
    openEditComboModal(item);
    return;
  }

  const gst = getGSTRate();
  const isAdm = currentUser?.role==='Admin';

  document.getElementById('editItemId').value = id;
  document.getElementById('editItemName').value = item.name;
  document.getElementById('editItemDesc').value = item.desc||'';
  document.getElementById('editItemEmoji').value = item.emoji||'🍽️';
  const eLarge = item.sizes?.find(s=>s.label==='Premium')?.price || item.price;
  const eMed   = item.sizes?.find(s=>s.label==='Medium')?.price || '';
  const eSmall = item.sizes?.find(s=>s.label==='Small')?.price  || '';
  document.getElementById('editItemPrice').value = eLarge;
  const ePL2 = document.getElementById('editPriceL'); if(ePL2) ePL2.value = eLarge;
  const ePM2 = document.getElementById('editPriceM'); if(ePM2) ePM2.value = eMed;
  const ePS2 = document.getElementById('editPriceS'); if(ePS2) ePS2.value = eSmall;

  // Show Excise Duty field only for liquor items
  const excRow = document.getElementById('editExciseDutyRow');
  const excInp = document.getElementById('editExciseDuty');
  if(excRow) excRow.style.display = item.isLiquor ? 'block' : 'none';
  if(excInp) excInp.value = item.isLiquor ? (item.exciseDuty||item.excisePct||'') : '';
  document.getElementById('editItemType').value = item.type;
  document.getElementById('editItemStart').value = item.startTime||'00:00';
  document.getElementById('editItemEnd').value = item.endTime||'23:59';

  // Feature 8: Build days picker via JS
  buildDaysPicker('editItemDaysPicker', item.availableDays||[], true);

  // Set available toggle
  const avEl = document.getElementById('editItemAvailable');
  if(avEl) {
    avEl.checked = item.available !== false;
    const slid = avEl.nextElementSibling;
    if(slid) slid.style.background = avEl.checked ? 'var(--success)' : '#e53935';
  }
  // Set best seller toggle
  const bsEl = document.getElementById('editItemBestSeller');
  if(bsEl) {
    bsEl.checked = item.bestSeller === true;
    const slid = bsEl.nextElementSibling;
    if(slid) slid.style.background = bsEl.checked ? 'var(--gold)' : '#ddd';
  }

  // Apply field-level permissions
  const fieldPerms = {
    'editItemName': 'Menu - Edit Dish Name',
    'editItemDesc': 'Menu - Edit Description',
    'editItemEmoji': 'Menu - Edit Emoji',
    'editItemPrice': 'Menu - Edit Price',
    'editItemCat': 'Menu - Edit Category',
    'editItemType': 'Menu - Edit Type',
    'editItemStart': 'Menu - Edit Timing',
    'editItemEnd': 'Menu - Edit Timing',
  };
  Object.entries(fieldPerms).forEach(([fid, perm]) => {
    const el = document.getElementById(fid);
    if(!el) return;
    const allowed = isAdm || currentUser?.perms.includes(perm);
    el.disabled = !allowed;
    el.style.background = allowed ? '#fff' : '#f5f5f5';
    el.style.cursor = allowed ? 'auto' : 'not-allowed';
    el.style.opacity = allowed ? '1' : '0.6';
  });

  // Feature 8: Days picker permission — Menu - Edit Available Days
  const canEditDays = isAdm || currentUser?.perms?.includes('Menu - Edit Available Days');
  const daysPicker = document.getElementById('editItemDaysPicker');
  if(daysPicker) {
    daysPicker.querySelectorAll('label').forEach(lbl => {
      lbl.style.pointerEvents = canEditDays ? 'auto' : 'none';
      lbl.style.opacity = canEditDays ? '1' : '0.5';
      lbl.style.cursor = canEditDays ? 'pointer' : 'not-allowed';
    });
    const daysRow = daysPicker.closest('.form-group');
    if(daysRow) {
      let lockNote = daysRow.querySelector('.days-lock-note');
      if(!canEditDays) {
        if(!lockNote) {
          lockNote = document.createElement('div');
          lockNote.className = 'days-lock-note';
          lockNote.style.cssText = 'font-size:0.72rem;color:#e53935;margin-top:4px;';
          lockNote.textContent = '🔒 You don\'t have permission to edit available days';
          daysRow.appendChild(lockNote);
        }
      } else {
        if(lockNote) lockNote.remove();
      }
    }
  }

  // GST preview
  document.getElementById('editGstPct').textContent = gst;

  // Load existing sizes
  const ePL = document.getElementById('editPriceL');
  const ePM = document.getElementById('editPriceM');
  const ePS = document.getElementById('editPriceS');
  if(ePL) ePL.value = '';
  if(ePM) ePM.value = '';
  if(ePS) ePS.value = '';
  if(item.sizes && item.sizes.length) {
    item.sizes.forEach(s => {
      if(s.label==='Premium'  && ePL) ePL.value = s.price;
      if(s.label==='Medium' && ePM) ePM.value = s.price;
      if(s.label==='Small'  && ePS) ePS.value = s.price;
    });
  } else {
    // existing item without sizes — set Large = base price
    if(ePL) ePL.value = item.price;
  }

  updateEditPreview();
  document.getElementById('editItemModal').classList.add('open');
  } catch(_e) { console.error("[SG] openEditItemModal:", _e); }
}

function updateEditPreview() {
  try {
  const price = parseFloat(document.getElementById('editItemPrice').value)||0;
  const gst = getGSTRate();
  const gstAmt = Math.round(price*gst/100);
  document.getElementById('editPrevBase').textContent = price;
  document.getElementById('editPrevGst').textContent = gstAmt;
  document.getElementById('editPrevTotal').textContent = price+gstAmt;
  } catch(_e) { console.error("[SG] updateEditPreview:", _e); }
}

// Live preview on price input in edit modal
document.addEventListener('input', function(e) {
  if(e.target.id === 'editItemPrice') updateEditPreview();
});

async function saveEditedItem() {
  try {
  const id = document.getElementById('editItemId').value; // keep as string for LIQ_/COMBO_ ids
  const name = document.getElementById('editItemName').value.trim();
  const desc = document.getElementById('editItemDesc').value.trim();
  const emoji = document.getElementById('editItemEmoji').value||'🍽️';
  const price = parseFloat(document.getElementById('editItemPrice').value)||0;
  const cat = document.getElementById('editItemCat').value;
  const type = document.getElementById('editItemType').value;
  const startTime = document.getElementById('editItemStart').value||'00:00';
  const endTime = document.getElementById('editItemEnd').value||'23:59';

  if(!name) { showToast('Dish name daalo','error'); return; }

  const item = menuItems.find(m=>String(m.id)==String(id));
  if(!item) return;

  // Read sizes from edit modal
  const ePL = parseFloat(document.getElementById('editPriceL')?.value)||0;
  const ePM = parseFloat(document.getElementById('editPriceM')?.value)||0;
  const ePS = parseFloat(document.getElementById('editPriceS')?.value)||0;
  const largePrice = ePL || price;
  const newSizes = [];
  if(largePrice > 0) newSizes.push({ label:'Large',  price:largePrice });
  if(ePM > 0)        newSizes.push({ label:'Medium', price:ePM });
  if(ePS > 0)        newSizes.push({ label:'Small',  price:ePS });

  item.name = name;
  item.desc = desc;
  item.emoji = emoji;
  item.price = largePrice || price;
  item.cat = cat;
  item.type = type;
  item.startTime = startTime;
  item.endTime = endTime;
  item.availableDays = getDaysFromPicker('editItemDaysPicker');
  item.sizes = newSizes;
  // Save excise duty for liquor items
  if(item.isLiquor) {
    const ed = parseFloat(document.getElementById('editExciseDuty')?.value)||0;
    item.exciseDuty = ed;
    item.excisePct  = ed;
  }
  item.hasSizes = newSizes.length > 1;
  // Feature 4 & 6: save available and bestSeller
  const avEl = document.getElementById('editItemAvailable');
  if(avEl) item.available = avEl.checked;
  const bsEl = document.getElementById('editItemBestSeller');
  if(bsEl) item.bestSeller = bsEl.checked;

  await sbUpsertMenuItem(item).catch(e=>console.error('saveEditedItem fail:',e));
  // Update correct localStorage
  if(item.isLiquor) {
    const liq = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
    const idx = liq.findIndex(m=>String(m.id)==String(id));
    if(idx>=0) { liq[idx]=item; localStorage.setItem('sg_liquor_items', JSON.stringify(liq)); }
  } else if(item.isCombo) {
    const cmb = JSON.parse(localStorage.getItem('sg_combo_items')||'[]');
    const idx = cmb.findIndex(m=>String(m.id)==String(id));
    if(idx>=0) { cmb[idx]=item; localStorage.setItem('sg_combo_items', JSON.stringify(cmb)); }
  } else {
    // Regular food item — update sg_menu_items localStorage
    const stored = JSON.parse(localStorage.getItem('sg_menu_items')||'[]');
    const idx = stored.findIndex(m=>String(m.id)==String(id));
    if(idx>=0) { stored[idx]=item; localStorage.setItem('sg_menu_items', JSON.stringify(stored)); }
  }
  closeModal('editItemModal');
  renderMenuMgmt();
  renderMenu();
  showToast('✅ '+name+' successfully edit done!');
  } catch(_e) { console.error("[SG] saveEditedItem:", _e); }
}

async function saveGSTRate() {
  try {
  const rate = parseFloat(document.getElementById('gstRateInput').value)||5;
  _gstRateCache = rate;
  await sbSaveGST(rate).catch(e=>console.error('saveGST fail:',e));
  renderMenuMgmt();
  renderMenu();
  const msg = document.getElementById('gstSavedMsg');
  msg.style.display='inline'; setTimeout(()=>msg.style.display='none',2000);
  } catch(_e) { console.error("[SG] saveGSTRate:", _e); }
}

let _exciseDutyCache = parseFloat(localStorage.getItem('sg_excise_rate')||'0');
function getExciseDutyRate() { return _exciseDutyCache; }

function saveExciseDutyRate() {
  try {
  const rate = parseFloat(document.getElementById('exciseDutyInput').value)||0;
  _exciseDutyCache = rate;
  localStorage.setItem('sg_excise_rate', rate.toString());
  // Update all existing liquor items with new global excise rate
  menuItems.forEach(item => {
    if(item.isLiquor) item.exciseDuty = rate;
  });
  // Update liquor localStorage
  const liq = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
  liq.forEach(item => { item.exciseDuty = rate; });
  localStorage.setItem('sg_liquor_items', JSON.stringify(liq));
  renderMenuMgmt();
  renderMenu();
  const msg = document.getElementById('exciseSavedMsg');
  if(msg) { msg.style.display='inline'; setTimeout(()=>msg.style.display='none',2000); }
  showToast('🏛️ Excise Duty ' + rate + '% set for all liquor items!');
  } catch(e) { console.error('[SG] saveExciseDutyRate:', e); }
}

function openAddItemModal() {
  try {
  resetSizeSection();
  document.getElementById('addItemModal').classList.add('open');
  buildDaysPicker('newItemDaysPicker', [], true);
  } catch(_e) { console.error("[SG] openAddItemModal:", _e); }
}



function openAddComboModal() {
  try {
  // Init days picker
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dp = document.getElementById('comboDaysPicker');
  if(dp) dp.innerHTML = days.map(d=>`<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 8px;border:1px solid #e0e0e0;border-radius:6px;font-size:0.8rem;">
    <input type="checkbox" value="${d}" checked> ${d}</label>`).join('');

  // Populate dish picker - each dish gets its own price input
  const picker = document.getElementById('comboDishPicker');
  if(picker) {
    const regularItems = menuItems.filter(i => !i.isCombo);
    if(!regularItems.length) {
      picker.innerHTML = '<div style="color:var(--muted);font-size:0.82rem;">No dishes available. Add dishes first.</div>';
    } else {
      picker.innerHTML = regularItems.map(item => {
        const isLiq = item.isLiquor||false;
        const tag = isLiq
          ? '<span style="background:#f3e5f5;color:#4a148c;padding:1px 6px;border-radius:10px;font-size:0.72rem;font-weight:700;">🍾 Liquor</span>'
          : item.type==='Veg'
          ? '<span style="color:#2e7d32;font-size:0.72rem;font-weight:700;">🟢 Veg</span>'
          : '<span style="color:#c62828;font-size:0.72rem;font-weight:700;">🔴 Non-Veg</span>';
        return `<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid ${isLiq?'#ce93d8':'#e8d5c8'};border-radius:8px;cursor:pointer;">
          <input type="checkbox" id="cdish_${item.id}" value="${item.id}"
            data-name="${item.name.replace(/"/g,'&quot;')}"
            data-isliquor="${isLiq}"
            data-origprice="${item.price}"
            onchange="updateComboBreakdown()"
            style="cursor:pointer;width:16px;height:16px;flex-shrink:0;">
          <span style="flex:1;font-size:0.85rem;font-weight:600;">${item.emoji||'🍽️'} ${item.name}</span>
          ${tag}
        </label>`;
      }).join('');
    }
  }

  // Reset fields
  ['comboName','comboDesc','comboPrice'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const ee=document.getElementById('comboEmoji'); if(ee) ee.value='🍱';
  const bp=document.getElementById('comboBreakdownPreview'); if(bp) bp.style.display='none';
  document.getElementById('addComboModal').classList.add('open');
  } catch(e) { console.error('[SG] openAddComboModal:', e); }
}

function updateComboBreakdown() {
  try {
  const checkedCbs = [...document.querySelectorAll('#comboDishPicker input[type=checkbox]:checked')];
  const gst     = getGSTRate();
  const excRate = getExciseDutyRate();
  const empty   = '<div style="color:var(--muted);font-size:0.8rem;font-style:italic;">Pehle Step 1 mein dishes select karo...</div>';

  const lvDiv = document.getElementById('comboLargeVariant');
  const mvDiv = document.getElementById('comboMediumVariant');
  const svDiv = document.getElementById('comboSmallVariant');

  if(!checkedCbs.length) {
    [lvDiv,mvDiv,svDiv].forEach(d=>{if(d)d.innerHTML=empty;});
    ['comboLargeTotal','comboMediumTotal','comboSmallTotal'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='0';});
    const cp=document.getElementById('comboPrice'); if(cp) cp.value='';
    return;
  }

  // Save existing user-entered prices before rebuilding
  const savedPrices = {};
  ['PremiumGoldSilver','GoldSilver','Silver'].forEach(grp => {
    checkedCbs.forEach(cb => {
      const inp = document.getElementById('vp_'+grp+'_'+cb.value);
      if(inp && inp.value) savedPrices[grp+'_'+cb.value] = inp.value;
    });
  });

  // Build one row per dish for each variant section
  function buildRow(dishId, dishName, isLiq, origPrice, sizes) {
    const taxR = isLiq ? excRate : gst;
    const dish = menuItems.find(m=>String(m.id)===String(dishId));
    const szPrices = {};
    if(dish && dish.sizes && dish.sizes.length) {
      dish.sizes.forEach(s=>{ szPrices[s.label]=s.price; });
    }
    if(!szPrices['Large'])  szPrices['Large']  = origPrice;
    if(!szPrices['Medium']) szPrices['Medium'] = origPrice;
    if(!szPrices['Silver'])  szPrices['Silver']  = origPrice;

    const grpKey  = sizes.join('');
    const priceId = `vp_${grpKey}_${dishId}`;
    const qtyId   = `vq_${grpKey}_${dishId}`;
    const totalId = `vt_${grpKey}_${dishId}`;

    const sizeOpts = sizes.map(sz => {
      const szPrice = szPrices[sz]||origPrice;
      return `<label style="display:flex;align-items:center;gap:3px;cursor:pointer;padding:3px 6px;border-radius:6px;border:1px solid ${sz==='Premium'?'#c8e6c9':sz==='Gold'?'#ffe0b2':'#ffcdd2'};">
        <input type="radio" name="var${grpKey}_${dishId}" value="${sz}" data-szprice="${szPrice}"
          onchange="autoFillSizePrice('${priceId}','${qtyId}','${totalId}',this,'${grpKey}')" style="cursor:pointer;">
        <span style="font-size:0.72rem;font-weight:700;color:${sz==='Premium'?'#1b5e20':sz==='Gold'?'#e65100':'#c62828'};">${sz==='Premium'?'P':sz==='Gold'?'G':'S'} ₹${szPrice}</span>
      </label>`;
    }).join('');

    const defaultPrice = szPrices[sizes[0]]||origPrice;
    return `<div style="display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;padding:7px 8px;background:#fff;border:1px solid ${isLiq?'#ce93d8':'#e8d5c8'};border-radius:8px;margin-bottom:4px;">
      <span style="font-size:0.78rem;font-weight:700;min-width:80px;">${isLiq?'🍾':'🍽️'} ${dishName}</span>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">${sizeOpts}</div>
      <div style="display:flex;align-items:center;gap:5px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="font-size:0.65rem;color:var(--muted);">Price</span>
          <input type="number" id="${priceId}" value="${defaultPrice}" min="0" step="any"
            data-isliquor="${isLiq}" data-taxrate="${taxR}"
            style="width:75px;padding:4px 5px;border:2px solid ${isLiq?'#ce93d8':'#a5d6a7'};border-radius:6px;font-size:0.82rem;font-weight:700;text-align:center;color:var(--fire);"
            oninput="updateItemTotal('${priceId}','${qtyId}','${totalId}',0,'${grpKey}')">
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="font-size:0.65rem;color:var(--muted);">Qty</span>
          <input type="number" id="${qtyId}" value="1" min="1" max="99"
            style="width:50px;padding:4px 5px;border:2px solid #b0bec5;border-radius:6px;font-size:0.82rem;font-weight:700;text-align:center;"
            oninput="updateItemTotal('${priceId}','${qtyId}','${totalId}',0,'${grpKey}')">
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <span style="font-size:0.65rem;color:var(--muted);">Total</span>
          <span id="${totalId}" style="font-size:0.82rem;font-weight:800;color:#1b5e20;min-width:55px;text-align:right;">₹${defaultPrice}</span>
        </div>
      </div>
    </div>`;
  }

  let lvHtml='', mvHtml='', svHtml='';
  checkedCbs.forEach(cb => {
    const id    = cb.value;
    const name  = cb.getAttribute('data-name');
    const isLiq = cb.getAttribute('data-isliquor')==='true';
    const orig  = cb.getAttribute('data-origprice');
    lvHtml += buildRow(id, name, isLiq, orig, ['Premium','Gold','Silver']);
    mvHtml += buildRow(id, name, isLiq, orig, ['Gold','Silver']);
    svHtml += buildRow(id, name, isLiq, orig, ['Silver']);
  });

  if(lvDiv) lvDiv.innerHTML = lvHtml;
  if(mvDiv) mvDiv.innerHTML = mvHtml;
  if(svDiv) svDiv.innerHTML = svHtml;

  // Restore saved prices or auto-fill defaults
  ['PremiumGoldSilver','GoldSilver','Silver'].forEach(grpKey => {
    checkedCbs.forEach(cb => {
      const id = cb.value;
      const first = document.querySelector(`input[name="var${grpKey}_${id}"]`);
      if(first && !document.querySelector(`input[name="var${grpKey}_${id}"]:checked`)) {
        first.checked = true;
        autoFillSizePrice(`vp_${grpKey}_${id}`,`vq_${grpKey}_${id}`,`vt_${grpKey}_${id}`,first,grpKey);
      }
      // Restore user-entered price if saved
      const savedKey = grpKey+'_'+id;
      if(savedPrices[savedKey]) {
        const inp = document.getElementById('vp_'+grpKey+'_'+id);
        if(inp) { inp.value = savedPrices[savedKey]; updateItemTotal(`vp_${grpKey}_${id}`,`vq_${grpKey}_${id}`,`vt_${grpKey}_${id}`,0,grpKey); }
      }
    });
  });

  recalcVariantTotalById('PremiumGoldSilver');
  recalcVariantTotalById('GoldSilver');
  recalcVariantTotalById('Silver');
  } catch(e) { console.error('[SG] updateComboBreakdown:', e); }
}


function autoFillSizePrice(priceId, qtyId, totalId, radio, grpKey) {
  const inp = document.getElementById(priceId);
  if(inp) {
    inp.value = radio.getAttribute('data-szprice')||'';
    inp.style.borderColor = radio.value==='Large'?'#a5d6a7':radio.value==='Medium'?'#ffb74d':'#ef9a9a';
  }
  updateItemTotal(priceId, qtyId, totalId, 0, grpKey);
}

function updateItemTotal(priceId, qtyId, totalId, taxR, grpKey) {
  const p   = parseFloat(document.getElementById(priceId)?.value)||0;
  const qty = parseInt(document.getElementById(qtyId)?.value)||1;
  const tot = parseFloat((p * qty).toFixed(2));
  const el  = document.getElementById(totalId);
  if(el) el.textContent = '₹' + tot;
  recalcVariantTotalById(grpKey);
}

function recalcVariantTotalById(grpKey) {
  try {
  const totalIds = {'PremiumGoldSilver':'comboLargeTotal','GoldSilver':'comboMediumTotal','Silver':'comboSmallTotal'};
  const totalEl  = document.getElementById(totalIds[grpKey]);
  if(!totalEl) return;
  let total = 0;
  document.querySelectorAll(`input[id^="vp_${grpKey}_"]`).forEach(inp => {
    const dishId = inp.id.replace('vp_'+grpKey+'_','');
    const p      = parseFloat(inp.value)||0;
    const qty    = parseInt(document.getElementById('vq_'+grpKey+'_'+dishId)?.value)||1;
    total        = parseFloat((total + p * qty).toFixed(2));
  });
  totalEl.textContent = total;
  if(grpKey==='PremiumGoldSilver') {
    const cp = document.getElementById('comboPrice');
    if(cp) cp.value = total;
  }
  } catch(e){}
}


function recalcVariantTotal(secId, totalId) {
  try {
  const sec = document.getElementById(secId);
  const totalEl = document.getElementById(totalId);
  if(!sec || !totalEl) return;
  let total = 0;
  sec.querySelectorAll('input[type=radio]:checked').forEach(r => {
    total += (parseInt(r.getAttribute('data-price'))||0) + (parseInt(r.getAttribute('data-tax'))||0);
  });
  totalEl.textContent = total;
  // Update comboPrice from Large total
  if(totalId === 'comboLargeTotal') {
    const cp = document.getElementById('comboPrice');
    if(cp) cp.value = total;
  }
  } catch(e){}
}


function updateSizeTotal(secId) {
  // Could add live total calculation here if needed
}

function saveComboItem() {
  try {
  const nameEl  = document.getElementById('comboName');
  const priceEl = document.getElementById('comboPrice');
  const descEl  = document.getElementById('comboDesc');
  const emojiEl = document.getElementById('comboEmoji');
  const startEl = document.getElementById('comboStart');
  const endEl   = document.getElementById('comboEnd');

  const name  = nameEl  ? nameEl.value.trim()         : '';
  const price = priceEl ? parseFloat(priceEl.value)||0 : 0;
  const desc  = descEl  ? descEl.value.trim()          : '';
  const emoji = emojiEl ? (emojiEl.value.trim()||'🍱') : '🍱';
  const startTime = startEl ? (startEl.value||'00:00') : '00:00';
  const endTime   = endEl   ? (endEl.value  ||'23:59') : '23:59';

  if(!name)  { alert('Combo name required!'); return; }

  // Get selected dishes with their CLIENT-SET prices
  const checkedCbs = [...document.querySelectorAll('#comboDishPicker input[type="checkbox"]:checked')];
  if(checkedCbs.length < 1) { alert('Please select at least 1 dish!'); return; }

  const gst2 = getGSTRate();
  const comboDishes = [];

  for(const cb of checkedCbs) {
    const dishId   = String(cb.value);
    const dishName = cb.getAttribute('data-name') || dishId;
    const isLiquor = cb.getAttribute('data-isliquor') === 'true';
    const origMRP  = parseFloat(cb.getAttribute('data-origprice'))||0;
    const dutyPct  = isLiquor ? getExciseDutyRate() : gst2;

    // Read price from Large variant section
    const inpL = document.getElementById('vp_PremiumGoldSilver_'+dishId);
    const priceL = parseFloat(inpL?.value)||0;
    if(!priceL) { alert(dishName + ' ka Large combo price daalo!'); return; }

    const szRadio = document.querySelector(`input[name="varPremiumGoldSilver_${dishId}"]:checked`);
    const sizeLabel = szRadio?.value || 'Large';
    const qtyL = parseInt(document.getElementById('vq_PremiumGoldSilver_'+dishId)?.value)||1;
    const dutyAmt = Math.round(priceL * dutyPct / 100);

    // Use size-specific MRP (not base dish MRP)
    const dishObj = menuItems.find(m=>String(m.id)===dishId);
    let sizeOrigPrice = origMRP;
    if(dishObj && dishObj.sizes && dishObj.sizes.length) {
      const szDef = dishObj.sizes.find(s=>s.label===sizeLabel);
      if(szDef) sizeOrigPrice = szDef.price;
    }

    comboDishes.push({
      id: dishId, name: dishName, sizeLabel,
      comboPrice: priceL, qty: qtyL,
      origPrice: sizeOrigPrice,
      savedPerDish: Math.max(0, sizeOrigPrice - priceL),
      isLiquor, exciseDuty: getExciseDutyRate(),
      dutyPct, dutyAmt, total: (priceL + dutyAmt) * qtyL
    });
  }

  const comboDishIds   = comboDishes.map(d => d.id);
  const comboDishNames = comboDishes.map(d => d.name);
  const sumComboPrices = comboDishes.reduce((s,d) => s + d.comboPrice, 0);
  // Savings = original MRP total - combo price total (client-set)
  const origMRPTotal   = comboDishes.reduce((s,d) => s + (d.origPrice||0), 0);
  const savings        = Math.max(0, origMRPTotal - sumComboPrices);

  // Days
  const dpDiv  = document.getElementById('comboDaysPicker');
  const dayCbs = dpDiv ? dpDiv.querySelectorAll('input[type=checkbox]:checked') : [];
  const availDays = dayCbs.length > 0
    ? [...dayCbs].map(c => c.value)
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // Type detection
  const hasNonVeg = comboDishes.some(d => {
    const m = menuItems.find(i => String(i.id)===d.id);
    return m && m.type === 'Non-Veg';
  });
  const hasLiquor = comboDishes.some(d => d.isLiquor);
  const comboType = hasLiquor ? 'Mixed' : hasNonVeg ? 'Non-Veg' : 'Veg';

  // Build Medium/Small variant dishes
  const medDishes=[], smlDishes=[];
  checkedCbs.forEach(cb => {
    const id = cb.value, name = cb.getAttribute('data-name'), isLiq = cb.getAttribute('data-isliquor')==='true';
    const dutyR = isLiq ? getExciseDutyRate() : gst2;
    const mkD = (grp) => {
      const inp = document.getElementById('vp_'+grp+'_'+id);
      const p = parseFloat(inp?.value)||0; if(!p) return null;
      const sz = document.querySelector(`input[name="var${grp}_${id}"]:checked`)?.value||'';
      return {id,name,sizeLabel:sz,comboPrice:p,isLiquor:isLiq,exciseDuty:getExciseDutyRate(),dutyPct:dutyR,dutyAmt:Math.round(p*dutyR/100),total:p+Math.round(p*dutyR/100)};
    };
    const md=mkD('GoldSilver'); if(md) medDishes.push(md);
    const sd=mkD('Silver'); if(sd) smlDishes.push(sd);
  });
  // Base price = WITHOUT tax
  const largeBase2 = parseFloat(comboDishes.reduce((s,d)=>s+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));
  const medBase2   = parseFloat(medDishes.reduce((s,d)=>s+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));
  const smlBase2   = parseFloat(smlDishes.reduce((s,d)=>s+(d.comboPrice||0)*(d.qty||1),0).toFixed(2));

  const comboSizes = [{ label:'Premium', price:largeBase2, dishes:comboDishes }];
  if(medBase2>0) comboSizes.push({ label:'Gold', price:medBase2, dishes:medDishes });
  if(smlBase2>0) comboSizes.push({ label:'Silver',  price:smlBase2, dishes:smlDishes });
  const comboHasSizes = comboSizes.length > 1;

  const newId = 'COMBO_' + Date.now();
  const newItem = {
    id: newId, name, desc, price: largeBase2, emoji, type: comboType,
    cat: 'Combos', image: null, startTime, endTime,
    available: true, bestSeller: false, availDays,
    isCombo: true,
    comboDishes, comboDishIds, comboDishNames,
    origMRPTotal, indvTotal: sumComboPrices, savings,
    hasSizes: comboHasSizes, sizes: comboSizes
  };

  // Save to localStorage
  const combos = JSON.parse(localStorage.getItem('sg_combo_items') || '[]');
  combos.push(newItem);
  localStorage.setItem('sg_combo_items', JSON.stringify(combos));
  menuItems.push(newItem);

  // Close + reset
  const modal = document.getElementById('addComboModal');
  if(modal) modal.classList.remove('open');
  if(nameEl)  nameEl.value  = '';
  if(priceEl) priceEl.value = '';
  if(descEl)  descEl.value  = '';
  if(emojiEl) emojiEl.value = '🍱';
  // Reset L/M/S price inputs
  document.querySelectorAll('#comboLargeVariant input, #comboMediumVariant input, #comboSmallVariant input').forEach(el=>{if(el.type!=='radio')el.value='';});

  setMgmtTab('combo');
  renderMenu();
  showToast('🍱 ' + name + ' combo added!');
  } catch(e) {
    console.error('[SG] saveComboItem error:', e);
    alert('Save failed: ' + e.message);
  }
}


function openAddLiquorModal() {
  try {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const picker = document.getElementById('liqDaysPicker');
  if(picker) {
    picker.innerHTML = days.map(d=>`<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 8px;border:1px solid #e0e0e0;border-radius:6px;font-size:0.8rem;">
      <input type="checkbox" value="${d}" checked style="cursor:pointer;"> ${d}</label>`).join('');
  }
  // Show current global excise rate
  const exciseRate = getExciseDutyRate();
  const disp = document.getElementById('liqExciseDisplay');
  if(disp) disp.textContent = exciseRate + '% (Menu Management se change karo)';
  // Reset size fields
  ['liqPriceL','liqPriceM','liqPriceS'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('addLiquorModal').classList.add('open');
  } catch(e) { console.error('[SG] openAddLiquorModal:', e); }
}

function saveLiquorItem() {
  try {
  const name   = document.getElementById('liqName').value.trim();
  const desc   = document.getElementById('liqDesc').value.trim();
  const cat    = document.getElementById('liqCat').value;
  const emoji  = document.getElementById('liqEmoji').value||'🍺';
  const excise = getExciseDutyRate();
  const startTime = document.getElementById('liqStart').value||'11:00';
  const endTime   = document.getElementById('liqEnd').value||'23:00';

  // Read size prices
  const pL = parseFloat(document.getElementById('liqPriceL')?.value)||0;
  const pM = parseFloat(document.getElementById('liqPriceM')?.value)||0;
  const pS = parseFloat(document.getElementById('liqPriceS')?.value)||0;
  const basePrice = parseFloat(document.getElementById('liqPrice')?.value)||0;
  const largePrice = pL || basePrice;

  if(!name) { alert('Name required!'); return; }
  if(!largePrice) { alert('Kam se kam Large price daalo!'); return; }

  // Build sizes
  const sizes = [];
  sizes.push({ label:'Large',  price:largePrice });
  if(pM > 0) sizes.push({ label:'Medium', price:pM });
  if(pS > 0) sizes.push({ label:'Small',  price:pS });
  const hasSizes = sizes.length > 1;

  // Collect selected days
  const picker = document.getElementById('liqDaysPicker');
  const availDays = picker
    ? [...picker.querySelectorAll('input[type=checkbox]:checked')].map(c=>c.value)
    : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  const newId = 'LIQ_' + Date.now();
  const newItem = {
    id: newId, name, desc, price: largePrice, emoji,
    type: 'Liquor', cat, image: null,
    startTime, endTime, available: true,
    bestSeller: false, availDays,
    isLiquor: true, exciseDuty: excise,
    hasSizes, sizes
  };

  // Save to dedicated liquor localStorage key (completely independent of Supabase)
  const liquorItems = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
  liquorItems.push(newItem);
  localStorage.setItem('sg_liquor_items', JSON.stringify(liquorItems));

  // Add to in-memory menuItems
  menuItems.push(newItem);

  // Close modal and render
  document.getElementById('addLiquorModal').classList.remove('open');
  ['liqName','liqDesc','liqPrice','liqPriceL','liqPriceM','liqPriceS'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('liqEmoji').value='🍺';

  setMgmtTab('liquor');
  renderMenu();
  showToast('🍾 ' + name + ' added to liquor menu!');
  } catch(e) { console.error('[SG] saveLiquorItem:', e); alert('Error: '+e.message); }
}

async function saveNewItem() {
  try {
  const name = document.getElementById('newItemName').value.trim();
  const desc = document.getElementById('newItemDesc').value.trim();
  const cat = document.getElementById('newItemCat').value;
  const type = document.getElementById('newItemType').value;
  const emoji = document.getElementById('newItemEmoji').value||'🍽️';
  const startTime = document.getElementById('newItemStart').value||'00:00';
  const endTime = document.getElementById('newItemEnd').value||'23:59';

  // Read size prices
  const pL = parseFloat(document.getElementById('priceL')?.value)||0;
  const pM = parseFloat(document.getElementById('priceM')?.value)||0;
  const pS = parseFloat(document.getElementById('priceS')?.value)||0;
  // Base Price fallback
  const basePriceField = parseFloat(document.getElementById('newItemPrice')?.value)||0;
  const largePrice = pL || basePriceField;

  if(!name) { alert('Dish name required!'); return; }
  if(!largePrice) { alert('Kam se kam Large price daalo!'); return; }

  // Build sizes array
  const sizes = [];
  sizes.push({ label: 'Large',  price: largePrice });
  if(pM > 0) sizes.push({ label: 'Medium', price: pM });
  if(pS > 0) sizes.push({ label: 'Small',  price: pS });
  const hasSizes = sizes.length > 1; // true if Medium or Small also defined

  const bestSeller = document.getElementById('newItemBestSeller')?.checked || false;
  const availableDays = getDaysFromPicker('newItemDaysPicker');
  const newId = Date.now();
  const newItem = {
    id:newId, name, desc, price:largePrice, emoji, type, cat,
    image:null, startTime, endTime, available:true, bestSeller, availableDays,
    hasSizes, sizes
  };

  // Save to localStorage FIRST
  const stored2 = JSON.parse(localStorage.getItem('sg_menu_items')||'[]');
  stored2.push(newItem);
  localStorage.setItem('sg_menu_items', JSON.stringify(stored2));
  menuItems.push(newItem);
  setMgmtTab('food');
  sbUpsertMenuItem(newItem).catch(e=>console.error('saveNewItem fail:',e));
  closeModal('addItemModal');
  resetSizeSection();
  renderMenu();
  showToast('✅ '+name+' added successfully!');
  ['newItemName','newItemDesc','newItemPrice','newItemEmoji','priceL','priceM','priceS']
    .forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  } catch(_e) { console.error("[SG] saveNewItem:", _e); alert('Error: '+_e.message); }
}

// Auto-refresh menu every minute (for time-based availability)
setInterval(async ()=>{ try {
  const fresh=await sbGetMenuItems();
  if(fresh&&fresh.length) {
    menuItems=fresh;
    // Re-merge liquor items after Supabase refresh
    const _liq = JSON.parse(localStorage.getItem('sg_liquor_items')||'[]');
    if(_liq.length) {
      const _ids = new Set(menuItems.map(i=>String(i.id)));
      _liq.forEach(li=>{ if(!_ids.has(String(li.id))) menuItems.push(li); });
    }
    const _cmb = JSON.parse(localStorage.getItem('sg_combo_items')||'[]');
    if(_cmb.length) {
      const _ids2 = new Set(menuItems.map(i=>String(i.id)));
      _cmb.forEach(ci=>{ if(!_ids2.has(String(ci.id))) menuItems.push(ci); });
    }
  }
  // Blink fix: menu mein kuch badla ho tabhi re-render karo
  const _msig = JSON.stringify(menuItems);
  if(_msig !== window._lastMenuSig) { window._lastMenuSig = _msig; renderMenu(); }
} catch(e){ console.error('[SG] menu interval error:',e); } }, 600000); // Bandwidth fix: 60s => 10 min (menu realtime already hai)

// Auto-refresh orders (realtime ka backup — offline/missed events ke liye)
// Bandwidth fix: har poll pe poori history (MBs) ki jagah sirf last 48h ke
// orders aate hain aur id se merge hote hain. Interval 15s => 60s
// (instant updates ke liye realtime subscription already hai).
setInterval(async ()=>{
  if(currentUser && document.getElementById('adminDashboard').style.display!=='none') {
    const activeSec = document.querySelector('.dash-section.active');
    if(activeSec) {
      const fresh = await sbGetRecentOrders(48);
      if(!fresh) return; // fetch fail — purani list bani rahe, blink nahi
      // Merge by id: naya order add karo, badla hua update karo
      let changed = false;
      const byId = new Map(orders.map(o=>[o.id,o]));
      fresh.forEach(f=>{
        const old = byId.get(f.id);
        if(!old || JSON.stringify(old) !== JSON.stringify(f)) { byId.set(f.id, f); changed = true; }
      });
      if(!changed) return; // kuch nahi badla — re-render mat karo (blink fix)
      orders = Array.from(byId.values()).sort((a,b)=>{
        const da = parseOrderTime(a), db = parseOrderTime(b);
        return (db?db.getTime():0) - (da?da.getTime():0);
      });
      if(activeSec.id==='sec-orders') renderOrders();
      if(activeSec.id==='sec-overview') updateStats();
    }
  }
}, 60000);

function closeModal(id) {
  try { document.getElementById(id).classList.remove('open');
  } catch(_e) { console.error("[SG] closeModal:", _e); }
}
function openModal(id) {
  try { document.getElementById(id).classList.add('open');
  } catch(_e) { console.error("[SG] openModal:", _e); }
}
function showToast(msg, type) {
  try {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  } catch(_e) { console.error("[SG] showToast:", _e); }
}

// ===== PDF EXPORT FUNCTIONS =====
function exportPDF(title, tableId, extraInfo) {
  try {
  var style = `
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #333; margin: 20px; }
      h1 { color: #E8400C; font-size: 20px; margin-bottom: 4px; }
      .meta { color: #777; font-size: 11px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th { background: #E8400C; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
      td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
      tr:nth-child(even) { background: #f9f5f0; }
      .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: center; }
      .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; }
    </style>`;

  var table = document.getElementById(tableId);
  var tableHTML = table ? table.outerHTML : '<p>No data available</p>';
  var date = new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});
  var time = new Date().toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'});

  var html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>${style}</head><body>
    <h1>🌶️ SpiceGarden Restaurant</h1>
    <h2 style="font-size:15px;margin:4px 0;">${title}</h2>
    <div class="meta">Generated: ${date} at ${time} ${extraInfo ? '| ' + extraInfo : ''}</div>
    ${tableHTML}
    <div class="footer">SpiceGarden Restaurant Management System &mdash; Confidential</div>
  </body></html>`;

  var win = window.open('', '_blank');
  if(!win) { showToast('Popup blocked! Allow popups aur try karo.', 'error'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(function(){ win.print(); }, 500);
  } catch(_e) { console.error("[SG] exportPDF:", _e); }
}

function exportOrdersPDF() {
  try {
  exportPDF('Orders Report', 'ordersTableBody', 'Admin: ' + (currentUser?.name||'Admin'));
  } catch(_e) { console.error("[SG] exportOrdersPDF:", _e); }
}
function exportCustomersPDF() {
  try {
  exportPDF('Customer Records', 'customersTableBody', 'Admin: ' + (currentUser?.name||'Admin'));
  } catch(_e) { console.error("[SG] exportCustomersPDF:", _e); }
}
function exportTaskHistoryPDF() {
  try {
  exportPDF('Task History', 'thTableBody', 'Admin: ' + (currentUser?.name||'Admin'));
  } catch(_e) { console.error("[SG] exportTaskHistoryPDF:", _e); }
}
function exportKPIPDF() {
  try {
  // KPI has cards not a table — print the whole section
  var sec = document.getElementById('sec-kpi');
  if(!sec) { showToast('KPI data nahi mila','error'); return; }
  var style = '<style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;} h1{color:#E8400C;} h2{font-size:15px;} .kpi-card,.stat-card{display:inline-block;margin:8px;padding:12px 16px;border:1px solid #eee;border-radius:8px;min-width:150px;} .footer{margin-top:20px;font-size:10px;color:#aaa;text-align:center;}</style>';
  var date = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>KPI Dashboard</title>'+style+'</head><body>';
  html += '<h1>🌶️ SpiceGarden Restaurant</h1><h2>📊 KPI Dashboard</h2><p style="color:#777;font-size:11px;">Generated: '+date+'</p>';
  html += sec.innerHTML;
  html += '<div class="footer">SpiceGarden Restaurant Management System — Confidential</div></body></html>';
  var win = window.open('','_blank');
  if(!win){showToast('Popup blocked!','error');return;}
  win.document.write(html); win.document.close(); win.focus();
  setTimeout(function(){win.print();},500);
  } catch(_e) { console.error("[SG] exportKPIPDF:", _e); }
}
function exportBudgetPDF() {
  try {
  var sec = document.getElementById('sec-budget');
  if(!sec){showToast('Budget data nahi mila','error');return;}
  var style = '<style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;} h1{color:#E8400C;} h2{font-size:15px;} table{width:100%;border-collapse:collapse;margin-top:12px;} th{background:#E8400C;color:#fff;padding:8px;text-align:left;font-size:11px;} td{padding:7px;border-bottom:1px solid #eee;font-size:11px;} .footer{margin-top:20px;font-size:10px;color:#aaa;text-align:center;}</style>';
  var date = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Budget Control</title>'+style+'</head><body>';
  html += '<h1>🌶️ SpiceGarden Restaurant</h1><h2>💰 Budget Control</h2><p style="color:#777;font-size:11px;">Generated: '+date+'</p>';
  html += sec.innerHTML;
  html += '<div class="footer">SpiceGarden Restaurant Management System — Confidential</div></body></html>';
  var win = window.open('','_blank');
  if(!win){showToast('Popup blocked!','error');return;}
  win.document.write(html); win.document.close(); win.focus();
  setTimeout(function(){win.print();},500);
  } catch(_e) { console.error("[SG] exportBudgetPDF:", _e); }
}
function exportSchedulePDF() {
  try {
  var grid = document.getElementById('weeklyScheduleGrid');
  var style = '<style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px;} h1{color:#E8400C;} h2{font-size:15px;} table{width:100%;border-collapse:collapse;} th{background:#E8400C;color:#fff;padding:6px;font-size:10px;} td{padding:5px;border:1px solid #eee;font-size:10px;} .footer{margin-top:20px;font-size:10px;color:#aaa;text-align:center;}</style>';
  var date = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Staff Schedule</title>'+style+'</head><body>';
  html += '<h1>🌶️ SpiceGarden Restaurant</h1><h2>🗓️ Staff Scheduling</h2><p style="color:#777;font-size:11px;">Generated: '+date+'</p>';
  html += (grid ? grid.innerHTML : '<p>No schedule data</p>');
  html += '<div class="footer">SpiceGarden Restaurant Management System — Confidential</div></body></html>';
  var win = window.open('','_blank');
  if(!win){showToast('Popup blocked!','error');return;}
  win.document.write(html); win.document.close(); win.focus();
  setTimeout(function(){win.print();},500);
  } catch(_e) { console.error("[SG] exportSchedulePDF:", _e); }
}
function exportTaskLoadPDF() {
  try {
  exportPDF('Task Load Report', 'tlTableBody', 'Admin: ' + (currentUser?.name||'Admin'));
  } catch(_e) { console.error("[SG] exportTaskLoadPDF:", _e); }
}
function exportInventoryPDF(section) {
  try {
  var tableIds = {
    vendors: 'vendorTableBody', products: 'productTableBody',
    rawmats: 'rawmatTableBody', purchases: 'purchaseTableBody', stock: 'stockTableBody'
  };
  var titles = {
    vendors: 'Vendors List', products: 'Products Master',
    rawmats: 'Raw Materials', purchases: 'Purchase Entries', stock: 'Current Stock'
  };
  exportPDF(titles[section]||'Inventory', tableIds[section]||'', '');
  } catch(_e) { console.error("[SG] exportInventoryPDF:", _e); }
}
// Bug #4 fix: yahan ek duplicate exportReportPDF() thi (auto-report version) jo
// kabhi call nahi hoti thi aur baad wali definition (Revenue Report) se silently
// override ho jaati thi. Hata di — Auto Report section apna downloadReportPDF() use
// karta hai, aur Reports section ki Revenue-Report wali exportReportPDF() neeche hai.
function exportAttendancePDF() {
  try {
  exportPDF('Attendance Report', 'attTableBody', '');
  } catch(_e) { console.error("[SG] exportAttendancePDF:", _e); }
}
function exportPerfPDF() {
  try {
  exportPDF('Performance Report', 'perfTableBody', '');
  } catch(_e) { console.error("[SG] exportPerfPDF:", _e); }
}


// =============================================
// ========== INVENTORY SYSTEM =================
// =============================================

// --- DATA HELPERS (now async via Supabase) ---
async function getInvData(key, def=[]) {
  try {
  const data = await invGet(key).catch(()=>null);
  return data !== null ? data : def;
  } catch(_e) { console.error("[SG] getInvData:", _e); }
}
async function setInvData(key, val) {
  try {
  _invCache[key] = val;
  const tableMap = {
    purchases:'inv_purchases', stock:'inv_stock', rawmats:'inv_rawmats',
    products:'inv_products', vendors:'inv_vendors', waste:'sg_waste',
    wastes:'sg_waste',  // alias
    emergency:'sg_emergency_stock', sg_purchases:'sg_purchases'
  };
  const table = tableMap[key];
  if (!table) return;
  // Special handling for stock: always save as array with stock_key
  if (key === 'stock') {
    let arr;
    if (Array.isArray(val)) {
      arr = val.map(r => ({ ...r, stock_key: r.stock_key || (r.type + '_' + r.itemId) }));
    } else {
      arr = Object.entries(val).map(([k, v]) => ({ ...v, stock_key: k }));
    }
    await sbUpsertInv('inv_stock', arr, 'stock_key').catch(e => console.error('setInvData stock fail:', e));
    return;
  }
  // Upsert all rows
  if (Array.isArray(val)) await sbUpsertInv(table, val).catch(e=>console.error('setInvData fail:',e));
  else await _supabase.from(table).upsert([val], {onConflict:'id'}).catch(e=>console.error('setInvData obj fail:',e));
  } catch(_e) { console.error("[SG] setInvData:", _e); }
}

async function getVendors()   { return await invGet('vendors'); }
async function getProducts()  { return await invGet('products'); }
async function getRawmats()   { return await invGet('rawmats'); }
async function getPurchases() { return await invGet('purchases'); }
async function getLocations() { return await invGet('locations'); }
async function getStock() {
  const arr = await invGet('stock');
  if (Array.isArray(arr)) {
    const obj = {};
    arr.forEach(function(row) {
      const key = row.stock_key || (row.type + '_' + row.itemId);
      if (key) obj[key] = row;
    });
    return obj;
  }
  return arr || {};
}
async function getWastes() {
  try {
    const arr = await sbGetWaste();
    if(arr && arr.length) {
      // Cache in localStorage
      localStorage.setItem('sb_sg_waste', JSON.stringify(arr));
      return arr;
    }
  } catch(e) { console.warn('getWastes Supabase fail:', e); }
  // Fallback to localStorage
  try { return JSON.parse(localStorage.getItem('sb_sg_waste')||'[]'); } catch(e) { return []; }
}
function getConsumptions() { return getInvData('consumptions'); }

// --- PERMISSION HELPERS ---
function invCan(perm) {
  try {
  if(currentUser?.role==='Admin') return true;
  return currentUser?.perms?.includes(perm) === true;
  } catch(_e) { console.error("[SG] invCan:", _e); }
}
function invCanView()     { return invCan('Inventory - View'); }
function invCanVendor()   { return invCan('Inventory - Manage Vendors'); }
function invCanPurchase() { return invCan('Inventory - Add Purchase'); }
function invCanStock()    { return invCan('Inventory - Manage Stock'); }
function invCanWaste()    { return invCan('Inventory - Waste Entry'); }
function invCanReports()  { return invCan('Inventory - View Reports'); }

// --- TAB SWITCHING ---
async function showInvTab(tab) {
  try {
  document.querySelectorAll('.inv-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.inv-section').forEach(s=>s.classList.remove('active'));
  const tabEl = document.getElementById('invTab-'+tab);
  const secEl = document.getElementById('inv-'+tab);
  if(tabEl) tabEl.classList.add('active');
  if(secEl) secEl.classList.add('active');
  // Render correct section
  if(tab==='vendors')   renderVendors();
  if(tab==='products')  renderProducts();
  if(tab==='rawmat')    renderRawmats();
  if(tab==='purchases') renderPurchases();
  if(tab==='stock')     { switchStockSubTab('current'); renderStock(); }
  if(tab==='waste')     renderWaste();
  if(tab==='reports')   renderInvReports();
  if(tab==='recipe')    renderRecipeDeduct();
  if(tab==='consumlog') { _activeConsumTab='recipe'; switchConsumTab('recipe'); }
  if(tab==='expiry')         { switchExpiryTab('products'); }
  if(tab==='expiredpending') { renderExpiredPending(); }
  if(tab==='emergency')      renderEmergencyStock();
  if(tab==='import')    renderImportEmergency();
  } catch(e) { console.error("[SG] showInvTab error:", e); }
}

// --- OPEN MODAL ---
async function openInvModal(type) {
  try {
  // Set today's date defaults
  const today = new Date().toISOString().split('T')[0];
  if(type==='vendor') {
    if(!invCanVendor()) { showToast('Access Denied','error'); return; }
    document.getElementById('vendorModalTitle').textContent='🏪 Add Vendor';
    document.getElementById('editVendorId').value='';
    ['vName','vCompany','vContact','vContact2','vEmail','vAddress','vGST','vNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('vPayTerms').value='';
    document.getElementById('vRating').value='3';
    document.getElementById('invVendorModal').classList.add('open');
  }
  else if(type==='solid' || type==='liquid' || type==='product') {
    if(!invCanVendor()) { showToast('Access Denied','error'); return; }
    openProductModal(type==='liquid' ? 'liquid' : 'solid');
  }
  else if(type==='rawmat') {
    if(!invCanVendor()) { showToast('Access Denied','error'); return; }
    document.getElementById('rawmatModalTitle').textContent='🥬 Add Raw Material';
    document.getElementById('editRawmatId').value='';
    ['rmName','rmMinStock','rmShelfLife','rmNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('invRawmatModal').classList.add('open');
  }
  else if(type==='purchase') {
    if(!invCanPurchase()) { showToast('Access Denied','error'); return; }
    // Reset header fields
    document.getElementById('pDate').value=today;
    ['pBillNo','pReceivedBy','pNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('pVendor').value='';
    document.getElementById('pSubtotal').textContent='0.00';
    document.getElementById('pGSTAmt').textContent='0.00';
    document.getElementById('pTotalAmt').textContent='0.00';
    // Clear item rows
    document.getElementById('purchaseItemsContainer').innerHTML='';
    // Populate vendor dropdown
    const vendors = await getVendors();
    const vSel = document.getElementById('pVendor');
    vSel.innerHTML='<option value="">-- Select Vendor --</option>';
    vendors.forEach(v=>{ const o=document.createElement('option'); o.value=v.id; o.textContent=v.name+(v.company?' ('+v.company+')':''); vSel.appendChild(o); });
    // Warm item cache then add first row
    await _warmPurchaseCache();
    addPurchaseItemRow();
    document.getElementById('invPurchaseModal').classList.add('open');
  }
  else if(type==='consumption') {
    if(!invCanStock()) { showToast('Access Denied','error'); return; }
    document.getElementById('cDate').value=today;
    const _now = new Date();
    const _dtEl = document.getElementById('cAutoDateTime');
    if(_dtEl) _dtEl.textContent = _now.toLocaleDateString('en-IN') + ' ' + _now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    ['cQty','cPerWeight','cPurpose','cApprovedBy','cHandoverTo'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    const _rb = document.getElementById('cRecordedBy'); if(_rb) _rb.value = currentUser?.name || '';
    document.getElementById('cItemType').value='';
    document.getElementById('cItem').innerHTML='<option value="">-- Select Item --</option>';
    resetConsumptionAutoFields();
    document.getElementById('invConsumptionModal').classList.add('open');
  }
  else if(type==='waste') {
    if(!invCanWaste()) { showToast('Access Denied','error'); return; }
    const _wNow = new Date();
    // Date field auto-fill (readonly — system set karega)
    document.getElementById('wDate').value = _wNow.toISOString().slice(0,10);
    // Auto DateTime display
    const _wDtEl = document.getElementById('wAutoDateTime');
    if(_wDtEl) _wDtEl.textContent = _wNow.toLocaleDateString('en-IN') + ' ' + _wNow.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    // Exact open timestamp store karo — saveWaste mein use hoga as addedAt
    document.getElementById('invWasteModal').dataset.openedAt = _wNow.toISOString();
    ['wQty','wCost','wApproved','wNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('wItemType').value='';
    document.getElementById('wItem').innerHTML='<option value="">-- Select Item --</option>';
    document.getElementById('invWasteModal').classList.add('open');
  }
  } catch(_e) { console.error("[SG] openInvModal:", _e); }
}

// --- VENDOR CRUD ---
async function saveVendor() {
  try {
  const id = document.getElementById('editVendorId').value || 'V'+Date.now();
  const name = document.getElementById('vName').value.trim();
  const contact = document.getElementById('vContact').value.trim();
  if(!name||!contact) { showToast('Vendor name and contact are required','error'); return; }
  const vendors = await getVendors();
  const existing = vendors.findIndex(v=>v.id===id);
  const vendor = {
    id, name, company:document.getElementById('vCompany').value.trim(),
    contact, contact2:document.getElementById('vContact2').value.trim(),
    email:document.getElementById('vEmail').value.trim(),
    address:document.getElementById('vAddress').value.trim(),
    gst:document.getElementById('vGST').value.trim(),
    payTerms:document.getElementById('vPayTerms').value||'0',
    rating:document.getElementById('vRating').value,
    notes:document.getElementById('vNotes').value.trim(),
    createdAt: existing>=0 ? vendors[existing].createdAt : new Date().toLocaleString('en-IN')
  };
  if(existing>=0) vendors[existing]=vendor; else vendors.push(vendor);
  setInvData('vendors', vendors);
  await sbUpsertInv('vendors',[vendor]);
  closeModal('invVendorModal');
  renderVendors();
  showToast('✅ Vendor saved successfully!');
  } catch(_e) { console.error("[SG] saveVendor:", _e); }
}

// ===== CSV IMPORT / EXPORT =====

// --- CSV field definitions for each section ---
var CSV_SCHEMAS = {
  vendors: {
    headers: ['id','name','company','contact','contact2','email','address','gst','payTerms','rating','notes'],
    label: 'Vendors',
    fileName: 'spicegarden_vendors',
    sampleRow: ['V001','Raju Traders','Raju & Sons','9876543210','9876543211','raju@email.com','Mumbai, MH','27ABCDE1234F1Z5','Net 30','4','Regular supplier'],
    toRow: function(v) {
      return [v.id||'',v.name||'',v.company||'',v.contact||'',v.contact2||'',v.email||'',v.address||'',v.gst||'',v.payTerms||'',v.rating||'3',v.notes||''];
    },
    fromRow: function(row, headers) {
      var obj = mapRowToObj(row, headers);
      return { id: obj.id||'V'+Date.now(), name: obj.name||'', company: obj.company||'', contact: obj.contact||'', contact2: obj.contact2||'', email: obj.email||'', address: obj.address||'', gst: obj.gst||'', payTerms: obj.payTerms||'', rating: obj.rating||'3', notes: obj.notes||'' };
    },
    validate: function(obj) { return obj.name ? null : 'name column is required'; },
    storageKey: 'vendors'
  },
  products: {
    headers: ['id','type','name','brand','cat','unitType','unitWt_or_unitVol','wtUnit_or_volUnit','minStock','storage','location','hsn'],
    label: 'Products',
    fileName: 'spicegarden_products',
    sampleRow: ['P001','solid','Basmati Rice','India Gate','Grains & Flour','Bag','25','kg','5','Dry/Room Temp','Shelf A','1006'],
    toRow: function(p) {
      var measVal = p.type==='solid' ? (p.unitWt||'') : (p.unitVol||'');
      var measUnit = p.type==='solid' ? (p.wtUnit||'') : (p.volUnit||'');
      return [p.id||'',p.type||'solid',p.name||'',p.brand||'',p.cat||'',p.unitType||'',measVal,measUnit,p.minStock||'0',p.storage||'',p.location||'',p.hsn||''];
    },
    fromRow: function(row, headers) {
      var obj = mapRowToObj(row, headers);
      var type = (obj.type||'solid').toLowerCase().trim();
      var prod = { id: obj.id||'P'+Date.now(), type: type, name: obj.name||'', brand: obj.brand||'', cat: obj.cat||'Other', unitType: obj.unitType||'Packet', minStock: parseFloat(obj.minStock)||0, storage: obj.storage||'Dry/Room Temp', location: obj.location||'', hsn: obj.hsn||'', currentStock: 0 };
      var mv = obj['unitWt_or_unitVol']||obj['unitWt']||obj['unitVol']||'';
      var mu = obj['wtUnit_or_volUnit']||obj['wtUnit']||obj['volUnit']||'gram';
      if(type==='solid') { prod.unitWt=mv; prod.wtUnit=mu; } else { prod.unitVol=mv; prod.volUnit=mu; }
      return prod;
    },
    validate: function(obj) { return obj.name ? null : 'name column is required'; },
    storageKey: 'products'
  },
  rawmats: {
    headers: ['id','name','cat','unit','minStock','perishable','shelfLife','storage','notes'],
    label: 'Raw Materials',
    fileName: 'spicegarden_rawmaterials',
    sampleRow: ['R001','Tomato','Vegetables','kg','10','yes','3','Refrigerated','Fresh tomatoes'],
    toRow: function(r) {
      return [r.id||'',r.name||'',r.cat||'',r.unit||'',r.minStock||'0',r.perishable||'no',r.shelfLife||'',r.storage||'',r.notes||''];
    },
    fromRow: function(row, headers) {
      var obj = mapRowToObj(row, headers);
      return { id: obj.id||'R'+Date.now(), name: obj.name||'', cat: obj.cat||'Vegetables', unit: obj.unit||'kg', minStock: parseFloat(obj.minStock)||0, perishable: obj.perishable||'no', shelfLife: obj.shelfLife||'', storage: obj.storage||'Dry/Room Temp', notes: obj.notes||'', currentStock: 0 };
    },
    validate: function(obj) { return obj.name ? null : 'name column is required'; },
    storageKey: 'rawmats'
  },
  purchases: {
    headers: ['S.No.','id','date','vendorName','itemName','itemType','itemId','qty','unitWt','totalWt','price','discount','gstPct','gstAmt','total','payMode','payStatus','billNo','batch','mfgDate','expDate','receivedBy','notes'],
    label: 'Purchases',
    fileName: 'spicegarden_purchases',
    sampleRow: ['1','PUR001','2025-05-31','Raju Traders','Basmati Rice','solid','P001','10','250kg','250kg','450','5','5','213.75','4286.25','Cash','Paid','INV-001','B001','2025-05-01','2026-05-01','Ramesh',''],
    toRow: function(p, idx) {
      return [(idx!=null?idx+1:''),p.id||'',p.date||'',p.vendorName||'',p.itemName||'',p.itemType||'',p.itemId||'',p.qty||'',p.unitWt||'',p.totalWt||'',p.price||'',p.discount||'0',p.gstPct||'0',p.gstAmt||'0',p.total||'',p.payMode||'Cash',p.payStatus||'Paid',p.billNo||'',p.batch||'',p.mfgDate||'',p.expDate||'',p.receivedBy||'',p.notes||''];
    },
    fromRow: function(row, headers) {
      var obj = mapRowToObj(row, headers);
      return { id: obj.id||'PUR'+Date.now(), date: obj.date||new Date().toISOString().split('T')[0], vendorName: obj.vendorName||'', itemName: obj.itemName||'', itemType: obj.itemType||'solid', itemId: obj.itemId||'', qty: parseFloat(obj.qty)||0, totalWt: obj.totalWt||'', price: parseFloat(obj.price)||0, discount: parseFloat(obj.discount)||0, gstPct: parseFloat(obj.gstPct)||0, gstAmt: parseFloat(obj.gstAmt)||0, total: parseFloat(obj.total)||0, payMode: obj.payMode||'Cash', payStatus: obj.payStatus||'Paid', billNo: obj.billNo||'', batch: obj.batch||'', mfgDate: obj.mfgDate||'', expDate: obj.expDate||'', receivedBy: obj.receivedBy||'', notes: obj.notes||'', addedBy: 'CSV Import', billFile: null };
    },
    validate: function(obj) { return obj.itemName ? null : 'itemName column is required'; },
    storageKey: 'purchases'
  },
  stock: {
    headers: ['itemKey','type','itemId','itemName','unit','currentStock','minLevel','lastUpdated'],
    label: 'Stock',
    fileName: 'spicegarden_stock',
    sampleRow: [],
    toRow: function(s, key) {
      return [key, s.type||'', s.itemId||'', getItemName(s.type,s.itemId), getItemUnit(s.type,s.itemId), s.qty||'0', getItemMinStock(s.type,s.itemId), s.lastUpdated||''];
    },
    storageKey: 'stock'
  }
};

// Helper: map CSV row array to object using headers
function mapRowToObj(row, headers) {
  try {
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = (row[i]||'').trim(); });
  return obj;
  } catch(_e) { console.error("[SG] mapRowToObj:", _e); }
}

// Helper: escape CSV cell value
function csvEscape(val) {
  try {
  var s = String(val===null||val===undefined?'':val);
  if(s.indexOf(',')>=0 || s.indexOf('"')>=0 || s.indexOf('\n')>=0) {
    return '"' + s.replace(/"/g,'""') + '"';
  }
  return s;
  } catch(_e) { console.error("[SG] csvEscape:", _e); }
}

// Helper: parse a CSV line respecting quoted fields
// Extra Bug #5 fix: yahan ek duplicate parseCSVLine() tha jo baad wali equivalent
// definition se override ho jaata tha — dead code. Hata diya.

// EXPORT CSV
async function exportCSV(section) {
  try {
  var schema = CSV_SCHEMAS[section];
  if(!schema) { showToast('Export not supported','error'); return; }

  var rows = [];
  rows.push(schema.headers.map(csvEscape).join(','));

  if(schema.sampleRow && schema.sampleRow.length) {
    rows.push('# Sample: ' + schema.sampleRow.map(csvEscape).join(','));
  }

  if(section === 'stock') {
    var stock = await getStock();
    Object.keys(stock).forEach(function(key) {
      rows.push(schema.toRow(stock[key], key).map(csvEscape).join(','));
    });
  } else {
    var data = await getInvData(schema.storageKey) || [];
    data.forEach(function(item, idx) {
      rows.push(schema.toRow(item, idx).map(csvEscape).join(','));
    });
  }

  var csvContent = rows.join('\r\n');
  var blob = new Blob(['\uFEFF'+csvContent], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = schema.fileName + '_' + new Date().toISOString().split('T')[0] + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✅ ' + schema.label + ' CSV export ho gaya!');
  } catch(_e) { console.error("[SG] exportCSV:", _e); }
}

// TRIGGER file input
function triggerCSVImport(section) {
  try {
  var inp = document.getElementById('csvImport-'+section);
  if(inp) { inp.value=''; inp.click(); }
  } catch(_e) { console.error("[SG] triggerCSVImport:", _e); }
}

// IMPORT CSV
async function importCSV(section, input) {
  try {
  var schema = CSV_SCHEMAS[section];
  if(!schema || !input.files[0]) return;
  if(section === 'stock') { showToast('Stock can only be exported. It updates automatically via Purchases.','error'); return; }

  var reader = new FileReader();
  reader.onload = async function(e) {
    try {
      var text = e.target.result;
      if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
      var lines = text.split(/\r?\n/).filter(function(l){ return l.trim() && !l.trim().startsWith('#'); });
      if(lines.length < 2) { showToast('CSV must have at least 1 data row','error'); return; }

      var fileHeaders = parseCSVLine(lines[0]).map(function(h){ return h.trim(); });

      var imported=0, skipped=0, errors=[];

      // Load existing data from Supabase/localStorage
      var existing = [];
      try { existing = await getInvData(schema.storageKey) || []; } catch(e2) { existing = []; }

      var toUpsert = [];

      lines.slice(1).forEach(function(line, idx) {
        if(!line.trim()) return;
        var row = parseCSVLine(line);
        var obj;
        try { obj = schema.fromRow(row, fileHeaders); } catch(err) {
          errors.push('Row '+(idx+2)+': parse error'); skipped++; return;
        }
        var err = schema.validate(obj);
        if(err) { errors.push('Row '+(idx+2)+': '+err); skipped++; return; }

        var idx2 = existing.findIndex(function(x){ return x.id===obj.id; });
        if(idx2>=0) {
          if(existing[idx2].currentStock!==undefined) obj.currentStock = existing[idx2].currentStock;
          existing[idx2] = obj;
        } else {
          existing.push(obj);
        }
        toUpsert.push(obj);
        imported++;
      });

      // Save to Supabase
      if(toUpsert.length) {
        showToast('⏳ Saving '+imported+' rows to Supabase...');
        const tableMap = {
          vendors:'inv_vendors', products:'inv_products',
          rawmats:'inv_rawmats', purchases:'inv_purchases'
        };
        const table = tableMap[section];
        if(table) {
          try {
            await sbUpsertInv(table, toUpsert);
            invInvalidate(section);
          } catch(e3) { console.warn('Supabase save failed, using localStorage:', e3); }
        }
        // Also update localStorage cache
        try { localStorage.setItem('inv_'+schema.storageKey, JSON.stringify(existing)); } catch(e4) {}
      }

      // Re-render + update stock from purchases
      if(section==='vendors') renderVendors();
      else if(section==='products') renderProducts();
      else if(section==='rawmats') renderRawmats();
      else if(section==='purchases') {
        renderPurchases();
        // Recalculate stock from all purchases
        showToast('⏳ Updating stock from purchases...');
        setTimeout(async function() {
          try {
            await rebuildStockFromPurchases();
            renderStock();
            showToast('✅ Stock updated from purchases!');
          } catch(e) {
            console.error('Stock rebuild error:', e);
            renderStock();
          }
        }, 500);
      }

      var msg = '✅ ' + imported + ' rows import hue!';
      if(skipped) msg += ' (' + skipped + ' skip hue)';
      showToast(msg, imported>0?'success':'error');
      if(errors.length) console.warn('CSV Import errors:', errors);

    } catch(e) {
      showToast('Error parsing CSV: '+e.message,'error');
    }
  };
  reader.readAsText(input.files[0]);
  } catch(_e) { console.error("[SG] importCSV:", _e); }
}

async function renderVendors() {
  try {
  const vendors = await getVendors();
  const cols = getColumns('vendors').filter(c => !c.hidden);
  const thead = document.querySelector('#inv-vendors table thead tr');
  if(thead) {
    thead.innerHTML = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>' + cols.map(c=>'<th>'+c.label+(c.description?' <span title="'+c.description.replace(/"/g,'&quot;')+'" style="cursor:help;font-size:0.78rem;opacity:0.7;">ℹ️</span>':'')+'</th>').join('');
  }
  const tbody = document.getElementById('vendorTableBody');
  const stars = n => '⭐'.repeat(parseInt(n)||0);
  if(!vendors.length) { tbody.innerHTML='<tr><td colspan="'+(cols.length+1)+'"><div class="empty"><div class="empty-icon">🏪</div><p>No vendors found</p></div></td></tr>'; return; }
  tbody.innerHTML = vendors.map(function(v, idx){
    var vid = v.id;
    var snoCell = '<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">'+(idx+1)+'</td>';
    return '<tr>' + snoCell + cols.map(function(c){
      if(c.field==='actions') return '<td><div class="action-btns">'+(invCanVendor()?'<button class="act-btn act-edit" onclick="editVendor(\'' +vid+ '\')">Edit</button>':'')+(invCanVendor()?'<button class="act-btn act-delete" onclick="deleteInvItem(\'vendors\',\'' +vid+ '\',renderVendors)">Del</button>':'')+'</div></td>';
      if(c.field==='id') return '<td><b style="color:var(--fire);font-size:0.8rem;">'+(v.id||'—')+'</b></td>';
      if(c.field==='name') return '<td><b>'+(v.name||'—')+'</b></td>';
      if(c.field==='rating') return '<td>'+stars(v.rating||3)+'</td>';
      var smartV = renderInvCustomCell(v, c, 'vendors', vid); if(smartV) return smartV;
      return '<td>'+(v[c.field]||'—')+'</td>';
    }).join('') + '</tr>';
  }).join('');
  } catch(e) { console.error("[SG] renderVendors error:", e); }
}

async function editVendor(id) {
  try {
  const v = (await getVendors()).find(x=>x.id===id);
  if(!v) return;
  document.getElementById('editVendorId').value=v.id;
  document.getElementById('vendorModalTitle').textContent='✏️ Edit Vendor';
  document.getElementById('vName').value=v.name;
  document.getElementById('vCompany').value=v.company||'';
  document.getElementById('vContact').value=v.contact;
  document.getElementById('vContact2').value=v.contact2||'';
  document.getElementById('vEmail').value=v.email||'';
  document.getElementById('vAddress').value=v.address||'';
  document.getElementById('vGST').value=v.gst||'';
  document.getElementById('vPayTerms').value=v.payTerms||'';
  document.getElementById('vRating').value=v.rating||'3';
  document.getElementById('vNotes').value=v.notes||'';
  document.getElementById('invVendorModal').classList.add('open');
  } catch(_e) { console.error("[SG] editVendor:", _e); }
}

// --- COMBINED PRODUCT MODAL FUNCTIONS ---
var SOLID_CONFIG = {
  cats: ['Spices','Grains & Flour','Dairy','Snacks & Packaged','Cleaning Supplies','Packaging','Other'],
  unitTypes: ['Packet','Box','Bag','Tin','Piece'],
  measureLabel: 'Weight per Unit',
  measureUnitLabel: 'Weight Unit',
  measureUnits: ['gram','kg'],
  storageOpts: ['Dry/Room Temp','Refrigerated','Frozen'],
  measureKey: 'unitWt', measureUnitKey: 'wtUnit'
};
var LIQUID_CONFIG = {
  cats: ['Cooking Oil','Sauce & Condiments','Beverages','Cleaning Liquid','Other'],
  unitTypes: ['Bottle','Can','Drum','Pouch','Jerrycan'],
  measureLabel: 'Volume per Unit',
  measureUnitLabel: 'Volume Unit',
  measureUnits: ['ml','liter'],
  storageOpts: ['Room Temp','Refrigerated','Cool & Dry'],
  measureKey: 'unitVol', measureUnitKey: 'volUnit'
};

function switchProductType(type) {
  document.getElementById('currentProductType').value = type;
  var cfg = type==='solid' ? SOLID_CONFIG : LIQUID_CONFIG;
  var solidBtn = document.getElementById('typeSolidBtn');
  var liquidBtn = document.getElementById('typeLiquidBtn');
  // Toggle button styles
  if(type==='solid') {
    solidBtn.style.background='var(--fire)'; solidBtn.style.borderColor='var(--fire)'; solidBtn.style.color='#fff';
    liquidBtn.style.background='#fff'; liquidBtn.style.borderColor='#ddd'; liquidBtn.style.color='#555';
    document.getElementById('productModalTitle').textContent = document.getElementById('editProductId').value ? '✏️ Edit Product' : '📦 Add Product';
  } else {
    liquidBtn.style.background='#3498db'; liquidBtn.style.borderColor='#3498db'; liquidBtn.style.color='#fff';
    solidBtn.style.background='#fff'; solidBtn.style.borderColor='#ddd'; solidBtn.style.color='#555';
    document.getElementById('productModalTitle').textContent = document.getElementById('editProductId').value ? '✏️ Edit Liquid Product' : '🧴 Add Liquid Product';
  }
  // Repopulate dynamic dropdowns
  function fillSelect(id, opts, val) {
    var sel = document.getElementById(id); var prev = val||sel.value;
    sel.innerHTML = opts.map(o=>'<option'+(o===prev?' selected':'')+'>'+o+'</option>').join('');
  }
  fillSelect('pCat', cfg.cats);
  fillSelect('pUnitType', cfg.unitTypes);
  fillSelect('pMeasureUnit', cfg.measureUnits);
  fillSelect('pStorage', cfg.storageOpts);
  document.getElementById('pMeasureLabel').textContent = cfg.measureLabel;
  document.getElementById('pMeasureUnitLabel').textContent = cfg.measureUnitLabel;
}

function openProductModal(type, existingProduct) {
  try {
  var isEdit = !!existingProduct;
  document.getElementById('editProductId').value = isEdit ? existingProduct.id : '';
  document.getElementById('productModalTitle').textContent = isEdit ? '✏️ Edit Product' : '📦 Add Product';
  // Clear fields
  ['pName','pBrand','pMeasureVal','pMinStock','pLocation','pHSN'].forEach(function(id){ document.getElementById(id).value=''; });
  if(isEdit) {
    document.getElementById('pName').value = existingProduct.name||'';
    document.getElementById('pBrand').value = existingProduct.brand||'';
    document.getElementById('pMinStock').value = existingProduct.minStock||'';
    document.getElementById('pLocation').value = existingProduct.location||'';
    document.getElementById('pHSN').value = existingProduct.hsn||'';
    // Set category
    var catSel=document.getElementById('pCat');
    for(var i=0;i<catSel.options.length;i++){if(catSel.options[i].value===existingProduct.cat)catSel.selectedIndex=i;}
    // Set unit type
    var utSel=document.getElementById('pUnitType');
    for(var i=0;i<utSel.options.length;i++){if(utSel.options[i].value===existingProduct.unitType)utSel.selectedIndex=i;}
    // Set storage
    var stSel=document.getElementById('pStorage');
    for(var i=0;i<stSel.options.length;i++){if(stSel.options[i].value===existingProduct.storage)stSel.selectedIndex=i;}
    // Set measure
    var measVal = existingProduct.unitWt||existingProduct.unitVol||'';
    var measUnit = existingProduct.wtUnit||existingProduct.volUnit||'gram';
    document.getElementById('pMeasureVal').value = measVal;
    var muSel=document.getElementById('pMeasureUnit');
    for(var i=0;i<muSel.options.length;i++){if(muSel.options[i].value===measUnit)muSel.selectedIndex=i;}
  }
  document.getElementById('invProductModal').classList.add('open');
  } catch(_e) { console.error("[SG] openProductModal:", _e); }
}

async function saveProductCombined() {
  try {
  var editId = document.getElementById('editProductId').value || 'P'+Date.now();
  var name = document.getElementById('pName').value.trim();
  if(!name) { showToast('Product name is required!','error'); return; }
  var products = await getProducts();
  var existing = products.findIndex(function(p){ return p.id===editId; });
  var measureVal = document.getElementById('pMeasureVal').value;
  var measureUnit = document.getElementById('pMeasureUnit').value;
  var product = {
    id: editId,
    type: 'solid',
    name: name,
    brand: document.getElementById('pBrand').value.trim(),
    cat: document.getElementById('pCat').value,
    unitType: document.getElementById('pUnitType').value,
    unitWt: measureVal,
    wtUnit: measureUnit,
    minStock: parseFloat(document.getElementById('pMinStock').value)||0,
    storage: document.getElementById('pStorage').value,
    location: document.getElementById('pLocation').value.trim(),
    hsn: document.getElementById('pHSN').value.trim(),
    currentStock: existing>=0 ? products[existing].currentStock : 0
  };
  if(existing>=0) products[existing]=product; else products.push(product);
  setInvData('products', products);
  await sbUpsertInv('inv_products',[product]);
  closeModal('invProductModal');
  renderProducts();
  showToast('✅ Product save ho gaya!');
  } catch(_e) { console.error("[SG] saveProductCombined:", _e); }
}

// --- PRODUCT CRUD (kept for backward compat, now delegates) ---
function saveProduct(type) {
  try {
  saveProductCombined();
  } catch(_e) { console.error("[SG] saveProduct:", _e); }
}

async function renderProducts() {
  try {
  const products = await getProducts();
  const cols = getColumns('products').filter(c => !c.hidden);
  const thead = document.querySelector('#inv-products table thead tr');
  if(thead) {
    thead.innerHTML = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>' + cols.map(c=>'<th>'+c.label+(c.description?' <span title="'+c.description.replace(/"/g,'&quot;')+'" style="cursor:help;font-size:0.78rem;opacity:0.7;">ℹ️</span>':'')+'</th>').join('');
  }
  const tbody = document.getElementById('productTableBody');
  if(!products.length) { tbody.innerHTML='<tr><td colspan="'+(cols.length+1)+'"><div class="empty"><div class="empty-icon">📦</div><p>No products found</p></div></td></tr>'; return; }
  tbody.innerHTML = products.map((p,idx)=>{
    const snoCell = '<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">'+(idx+1)+'</td>';
    return '<tr>' + snoCell + cols.map(c=>{
      if(c.field==='actions') { var pid=p.id; return `<td><div class="action-btns">${invCanVendor()?`<button class="act-btn act-edit" onclick="editProduct('${pid}')">Edit</button>`:''} ${invCanVendor()?`<button class="act-btn act-delete" onclick="deleteInvItem('products','${pid}',renderProducts)">Del</button>`:''}</div></td>`; }
      if(c.field==='id') return '<td><b style="color:var(--fire);font-size:0.8rem;">'+(p.id||'—')+'</b></td>';
      if(c.field==='name') return '<td><b>'+(p.name||'—')+'</b></td>';
      if(c.field==='brand') return '<td>'+(p.brand?'<span class="status confirmed">'+p.brand+'</span>':'—')+'</td>';
      if(c.field==='unitType') return '<td><span class="status confirmed">COMPANY PRODUCT</span></td>';
      if(c.field==='unitWt') return '<td>'+(p.type==='solid'?(p.unitWt+' '+p.wtUnit+'/'+(p.unitType||'')):(p.unitVol+' '+p.volUnit+'/'+(p.unitType||'')))+'</td>';
      var smartP = renderInvCustomCell(p, c, 'products', p.id); if(smartP) return smartP;
      return '<td>'+(p[c.field]||'—')+'</td>';
    }).join('') + '</tr>';
  }).join('');
  } catch(e) { console.error("[SG] renderProducts error:", e); }
}

async function editProduct(id) {
  try {
  const p = (await getProducts()).find(x=>x.id===id);
  if(!p) return;
  openProductModal(p.type, p);
  } catch(_e) { console.error("[SG] editProduct:", _e); }
}

// --- RAW MATERIAL CRUD ---
async function saveRawmat() {
  try {
  const id = document.getElementById('editRawmatId').value || 'R'+Date.now();
  const name = document.getElementById('rmName').value.trim();
  if(!name) { showToast('Material name is required','error'); return; }
  const rawmats = await getRawmats();
  const existing = rawmats.findIndex(r=>r.id===id);
  const rm = {
    id, name, cat:document.getElementById('rmCat').value,
    unit:document.getElementById('rmUnit').value,
    minStock:parseFloat(document.getElementById('rmMinStock').value)||0,
    perishable:document.getElementById('rmPerishable').value,
    shelfLife:document.getElementById('rmShelfLife').value,
    storage:document.getElementById('rmStorage').value,
    notes:document.getElementById('rmNotes').value.trim(),
    currentStock:existing>=0?rawmats[existing].currentStock:0
  };
  if(existing>=0) rawmats[existing]=rm; else rawmats.push(rm);
  setInvData('rawmats', rawmats);
  closeModal('invRawmatModal');
  renderRawmats();
  showToast('✅ Raw Material saved successfully!');
  } catch(_e) { console.error("[SG] saveRawmat:", _e); }
}

async function renderRawmats() {
  try {
  const rawmats = await getRawmats();
  const cols = getColumns('rawmats').filter(c => !c.hidden);
  const thead = document.querySelector('#inv-rawmat table thead tr');
  if(thead) {
    thead.innerHTML = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>' + cols.map(c=>'<th>'+c.label+(c.description?' <span title="'+c.description.replace(/"/g,'&quot;')+'" style="cursor:help;font-size:0.78rem;opacity:0.7;">ℹ️</span>':'')+'</th>').join('');
  }
  const tbody = document.getElementById('rawmatTableBody');
  if(!rawmats.length) { tbody.innerHTML='<tr><td colspan="'+(cols.length+1)+'"><div class="empty"><div class="empty-icon">🥬</div><p>No raw materials found</p></div></td></tr>'; return; }
  tbody.innerHTML = rawmats.map((r,idx)=>{
    const snoCell = '<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">'+(idx+1)+'</td>';
    return '<tr>' + snoCell + cols.map(c=>{
      if(c.field==='actions') { var rid=r.id; return `<td><div class="action-btns">${invCanVendor()?`<button class="act-btn act-edit" onclick="editRawmat('${rid}')">Edit</button>`:''} ${invCanVendor()?`<button class="act-btn act-delete" onclick="deleteInvItem('rawmats','${rid}',renderRawmats)">Del</button>`:''}</div></td>`; }
      if(c.field==='id') return '<td><b style="color:var(--fire);font-size:0.8rem;">'+(r.id||'—')+'</b></td>';
      if(c.field==='name') return '<td><b>'+(r.name||'—')+'</b></td>';
      if(c.field==='perishable') return '<td><span class="status '+(r.perishable==='yes'?'pending':'confirmed')+'">'+(r.perishable==='yes'?'⚠️ Yes':'✅ No')+'</span></td>';
      if(c.field==='shelfLife') return '<td>'+(r.shelfLife?r.shelfLife+' days':'—')+'</td>';
      var smartR = renderInvCustomCell(r, c, 'rawmats', r.id); if(smartR) return smartR;
      return '<td>'+(r[c.field]||'—')+'</td>';
    }).join('') + '</tr>';
  }).join('');
  } catch(e) { console.error("[SG] renderRawmats error:", e); }
}

async function editRawmat(id) {
  try {
  const r = (await getRawmats()).find(x=>x.id===id);
  if(!r) return;
  document.getElementById('editRawmatId').value=r.id;
  document.getElementById('rawmatModalTitle').textContent='✏️ Raw Material Edit';
  document.getElementById('rmName').value=r.name;
  document.getElementById('rmCat').value=r.cat;
  document.getElementById('rmUnit').value=r.unit;
  document.getElementById('rmMinStock').value=r.minStock;
  document.getElementById('rmPerishable').value=r.perishable;
  document.getElementById('rmShelfLife').value=r.shelfLife||'';
  document.getElementById('rmStorage').value=r.storage;
  document.getElementById('rmNotes').value=r.notes||'';
  document.getElementById('invRawmatModal').classList.add('open');
  } catch(_e) { console.error("[SG] editRawmat:", _e); }
}

// --- PURCHASE ---
// ============================================================
//  MULTI-ITEM PURCHASE — helper cache
// ============================================================
// ============================================================
//  MULTI-ITEM + MULTI-BATCH PURCHASE SYSTEM
//  Structure: Purchase (1 bill) → Items → each Item → multiple Batches/HRN lots
//  Each batch row = 1 purchase record in inv_purchases
// ============================================================

let _purchaseItemsCache = { solid:[], liquid:[], rawmat:[] };

async function _warmPurchaseCache() {
  try {
    // If _invCache already has data (from inventory page load), use it directly
    if (!_invCache.products) await invGet('products');
    if (!_invCache.rawmats)  await invGet('rawmats');
    // _purchaseItemsCache is now just a mirror for saveQuickAddItem
    const prods = _invCache.products || [];
    const raws  = _invCache.rawmats  || [];
    _purchaseItemsCache.solid  = prods.filter(p=>p.type==='solid');
    _purchaseItemsCache.liquid = prods.filter(p=>p.type==='liquid');
    _purchaseItemsCache.rawmat = raws;
  } catch(e) { console.error('[SG] _warmPurchaseCache:', e); }
}

function _purchaseItemOptions(type) {
  const allProds = _invCache.products || [];
  const allRaws  = _invCache.rawmats  || [];

  let list = [];
  if (type === 'company') {
    // Only solid + liquid products (not raw materials)
    list = allProds.filter(p => p.type === 'solid' || p.type === 'liquid');
  } else if (type === 'rawmat') {
    list = allRaws;
  }

  let html = '<option value="">-- Select Item --</option>';
  list.forEach(it => {
    let unitwt = '';
    if (it.type === 'solid')       unitwt = (it.unitWt||'') + ' ' + (it.wtUnit||'');
    else if (it.type === 'liquid') unitwt = (it.unitVol||'') + ' ' + (it.volUnit||'');
    else                           unitwt = it.unit||'';
    const brand = it.brand ? it.brand.trim() : '';
    html += `<option value="${it.id}" data-unitwt="${unitwt.trim()}" data-brand="${brand}">${it.name}</option>`;
  });
  return html;
}

function onPurchaseTypeChange(sel) {
  try {
    const card = sel.closest('.pur-item-card');
    const type = sel.value;
    card.querySelector('.pur-item-sel').innerHTML = _purchaseItemOptions(type);
    card.querySelectorAll('.pur-batch-row').forEach(b => {
      b.querySelector('.pur-unitwt').value  = '';
      b.querySelector('.pur-totalwt').value = '';
      _recalcBatchRow(b);
    });
    _recalcItemCard(card);
    calcPurchaseGrandTotal();
  } catch(e) { console.error('[SG] onPurchaseTypeChange:', e); }
}

function onPurchaseItemChange(sel) {
  try {
    const card   = sel.closest('.pur-item-card');
    const opt    = sel.options[sel.selectedIndex];
    const unitwt = opt ? (opt.dataset.unitwt||'') : '';
    card.querySelectorAll('.pur-batch-row').forEach(b => {
      b.querySelector('.pur-unitwt').value = unitwt;
      _recalcBatchRow(b);
    });
    _recalcItemCard(card);
    calcPurchaseGrandTotal();
  } catch(e) { console.error('[SG] onPurchaseItemChange:', e); }
}

// ── Quick Add Item — opens mini modal above purchase form ──
// After save, auto-selects the new item in the triggering dropdown
let _quickAddTargetSel = null;

function openQuickAddItem(type, triggerSel) {
  try {
    _quickAddTargetSel = triggerSel;
    // Reset fields
    document.getElementById('qaType').value   = type;
    document.getElementById('qaName').value   = '';
    document.getElementById('qaBrand').value  = '';
    document.getElementById('qaUnit').value   = '';
    document.getElementById('qaUnitVal').value= '';
    document.getElementById('qaMinStock').value= '0';
    // Show correct unit label based on type
    const unitLabel = document.getElementById('qaUnitLabel');
    const unitValWrap = document.getElementById('qaUnitValWrap');
    const brandWrap = document.getElementById('qaBrandWrap');
    if (type === 'rawmat') {
      unitLabel.textContent    = 'Unit (kg/litre/gram…)';
      unitValWrap.style.display= 'none';
      brandWrap.style.display  = 'none'; // raw materials usually don't have a brand
    } else {
      // company type = solid/liquid both
      unitLabel.textContent    = 'Unit (g/kg/ml/litre…)';
      unitValWrap.style.display= '';
      brandWrap.style.display  = '';
    }
    document.getElementById('quickAddItemModal').classList.add('open');
    document.getElementById('qaName').focus();
  } catch(e) { console.error('[SG] openQuickAddItem:', e); }
}

async function saveQuickAddItem() {
  try {
    const type     = document.getElementById('qaType').value;
    const name     = document.getElementById('qaName').value.trim();
    const brand    = document.getElementById('qaBrand').value.trim();
    const unit     = document.getElementById('qaUnit').value.trim();
    const unitVal  = document.getElementById('qaUnitVal').value.trim();
    const minStock = parseFloat(document.getElementById('qaMinStock').value)||0;
    if (!name) { showToast('Item naam required hai', 'error'); return; }

    let newItem, unitwt = '';

    if (type === 'rawmat') {
      if (!unit) { showToast('Unit required hai (kg/litre/gram…)', 'error'); return; }
      newItem = {
        id: 'R' + Date.now(),
        name, cat: 'Other', unit, minStock,
        perishable: 'no', shelfLife: '', storage: 'Dry', notes: '',
        currentStock: 0
      };
      unitwt = unit;
      const rawmats = await getRawmats();
      rawmats.push(newItem);
      setInvData('rawmats', rawmats);
      await sbUpsertInv('inv_rawmats', [newItem]);
      if (!_invCache.rawmats) _invCache.rawmats = [];
      _invCache.rawmats.push(newItem);
      _purchaseItemsCache.rawmat.push(newItem);
    } else {
      if (!unit)    { showToast('Unit required hai', 'error'); return; }
      if (!unitVal) { showToast('Quantity per unit required hai (e.g. 1, 500, 5)', 'error'); return; }
      // "company" type saved as "solid" in DB (covers both solid+liquid company products)
      const saveType = (type === 'company') ? 'solid' : type;
      newItem = {
        id: 'P' + Date.now(),
        type: saveType, name,
        brand, cat: 'Other',
        unitType: 'packet',
        unitWt:   unitVal,
        wtUnit:   unit,
        unitVol:  '',
        volUnit:  '',
        minStock, storage: 'Dry', location: '', hsn: '',
        currentStock: 0
      };
      unitwt = unitVal + ' ' + unit;
      const products = await getProducts();
      products.push(newItem);
      setInvData('products', products);
      await sbUpsertInv('inv_products', [newItem]);
      // Update both caches
      if (!_invCache.products) _invCache.products = [];
      _invCache.products.push(newItem);
      _purchaseItemsCache.solid.push(newItem);
    }

    // Close modal
    document.getElementById('quickAddItemModal').classList.remove('open');

    // Auto-select the new item in the triggering dropdown
    if (_quickAddTargetSel) {
      const sel = _quickAddTargetSel;
      // Rebuild options for this type
      sel.innerHTML = _purchaseItemOptions(type);
      // Select new item
      sel.value = newItem.id;
      // Fill unitwt in all batch rows of this card
      const card = sel.closest('.pur-item-card');
      if (card) {
        card.querySelectorAll('.pur-batch-row').forEach(b => {
          b.querySelector('.pur-unitwt').value = unitwt.trim();
          _recalcBatchRow(b);
        });
        _recalcItemCard(card);
        calcPurchaseGrandTotal();
      }
      _quickAddTargetSel = null;
    }
    showToast('✅ "' + name + '" add ho gaya aur select ho gaya!');
  } catch(e) { console.error('[SG] saveQuickAddItem:', e); showToast('Error saving item', 'error'); }
}

// ============================================================
//  LOCATION MANAGER — Godown > Room/Floor > Rack > Column > Row
//  Tracks where each purchase batch is physically stored.
//  Table: inv_locations
//    { id, itemType, itemId, itemName, batch, purchaseId,
//      expDate, qty, godown, room, rack, column, row, addedBy, addedAt }
// ============================================================

let _pendingLocationBatches = []; // batches passed from the last purchase save

function openLocationManager(purchaseBatches) {
  try {
    _pendingLocationBatches = purchaseBatches || [];
    const container = document.getElementById('locationItemsContainer');
    container.innerHTML = '';

    if (!_pendingLocationBatches.length) {
      container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">Koi item nahi mila.</p>';
    }

    _pendingLocationBatches.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'loc-item-card';
      card.dataset.idx = idx;
      card.style.cssText = 'background:#fff;border:2px solid #e8d5c8;border-radius:10px;padding:12px 14px;';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
          <div>
            <div style="font-weight:700;font-size:0.95rem;">${escHtml(p.itemName || '(Unnamed Item)')}${p.brand ? ' <span style="color:#1565c0;font-weight:600;">— '+p.brand+'</span>' : ''}</div>
            <div style="font-size:0.78rem;color:var(--muted);">
              Batch: <b>${p.batch || '—'}</b> &nbsp;|&nbsp; Qty: <b>${p.qty}</b> &nbsp;|&nbsp; Expiry: <b>${p.expDate ? formatDateDMY(p.expDate) : '—'}</b>
            </div>
          </div>
          <span style="background:#fff3e0;color:#e65100;font-size:0.72rem;font-weight:700;padding:3px 9px;border-radius:12px;">Purchase ID: ${p.id}</span>
        </div>
        <div class="loc-slots-cont"></div>
        <button onclick="addLocationSlot(${idx})" style="margin-top:6px;background:#e8f5e9;color:#2e7d32;border:1.5px solid #a5d6a7;padding:5px 14px;border-radius:6px;font-size:0.8rem;font-weight:700;cursor:pointer;">+ Location Add Karo (split qty)</button>
      `;
      container.appendChild(card);
      addLocationSlot(idx); // first slot auto-added with full qty
    });
  } catch(e) { console.error('[SG] openLocationManager:', e); }
  document.getElementById('locationManagerModal').classList.add('open');
}

function formatDateDMY(d) {
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return String(dt.getDate()).padStart(2,'0') + '/' + String(dt.getMonth()+1).padStart(2,'0') + '/' + dt.getFullYear();
  } catch(e) { return d; }
}

// HRN type karte hi matching purchase record dhoondh kar uska brand auto-fill karo
function onLocBatchInput(input) {
  try {
    const hrn = input.value.trim();
    const slot = input.closest('.loc-slot-row');
    const brandField = slot ? slot.querySelector('.loc-brand') : null;
    if (!brandField) return;

    if (!hrn) { brandField.value = '—'; return; }

    // Search in already-loaded purchases (fast, sync lookup)
    const allPurchases = _invCache.purchases || [];
    const match = allPurchases.find(p => (p.batch||'').trim().toLowerCase() === hrn.toLowerCase());

    if (match) {
      brandField.value = match.brand || '—';
      // Bonus: also refresh expiry if it's empty/placeholder, since same batch = same expiry
      const expField = slot.querySelector('.loc-exp');
      if (expField && match.expDate) expField.value = formatDateDMY(match.expDate);
    } else {
      brandField.value = '—';
    }
  } catch(e) { console.error('[SG] onLocBatchInput:', e); }
}

function addLocationSlot(itemIdx) {
  try {
    const card  = document.querySelector(`.loc-item-card[data-idx="${itemIdx}"]`);
    if (!card) return;
    const cont  = card.querySelector('.loc-slots-cont');
    const slotId= 'locslot_' + Date.now() + '_' + Math.random().toString(36).slice(2,5);
    const p     = _pendingLocationBatches[itemIdx];

    const div = document.createElement('div');
    div.className = 'loc-slot-row';
    div.id = slotId;
    div.style.cssText = 'background:#f8fbff;border:1px solid #d0e8ff;border-radius:8px;padding:10px;margin-bottom:8px;';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:0.75rem;font-weight:700;color:#1a6fa8;">📦 Storage Location</span>
        <button onclick="document.getElementById('${slotId}').remove()" style="background:#fff0f0;border:1px solid #f5c6c6;border-radius:5px;color:#c0392b;font-size:0.78rem;cursor:pointer;padding:2px 8px;">✕ Hatao</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:8px;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Godown Naam/No.</label>
          <input type="text" class="form-input loc-godown" placeholder="e.g. Godown A" style="font-size:0.8rem;padding:5px 6px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Room / Floor No.</label>
          <input type="text" class="form-input loc-room" placeholder="e.g. Floor 1" style="font-size:0.8rem;padding:5px 6px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Rack Name/No.</label>
          <input type="text" class="form-input loc-rack" placeholder="e.g. Rack 3" style="font-size:0.8rem;padding:5px 6px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Column Name/No.</label>
          <input type="text" class="form-input loc-column" placeholder="e.g. Col B" style="font-size:0.8rem;padding:5px 6px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Row Name/No.</label>
          <input type="text" class="form-input loc-row" placeholder="e.g. Row 2" style="font-size:0.8rem;padding:5px 6px;">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Batch / Purchase No.</label>
          <input type="text" class="form-input loc-batch" value="${p.batch || ''}" placeholder="HRN / Batch No. likho" style="font-size:0.8rem;padding:5px 6px;" oninput="onLocBatchInput(this)" title="HRN type karo, brand automatically aa jayega">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Brand Naam (auto)</label>
          <input type="text" class="form-input loc-brand" value="${p.brand || '—'}" readonly style="font-size:0.8rem;padding:5px 6px;background:#f0f0f0;" title="HRN match hone par automatically aata hai">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Expiry Date (auto)</label>
          <input type="text" class="form-input loc-exp" value="${p.expDate ? formatDateDMY(p.expDate) : '—'}" readonly style="font-size:0.8rem;padding:5px 6px;background:#f0fff4;color:#2e7d32;font-weight:700;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.72rem;">Qty rakhi yahan *</label>
          <input type="number" class="form-input loc-qty" placeholder="0" min="0" step="0.01" value="${p.qty}" style="font-size:0.8rem;padding:5px 6px;">
        </div>
      </div>
    `;
    cont.appendChild(div);
  } catch(e) { console.error('[SG] addLocationSlot:', e); }
}

async function saveAllLocations() {
  try {
    const cards = document.querySelectorAll('.loc-item-card');
    const allRecords = [];
    let hasError = false;

    cards.forEach(card => {
      const idx = parseInt(card.dataset.idx);
      const p   = _pendingLocationBatches[idx];
      const slots = card.querySelectorAll('.loc-slot-row');

      slots.forEach(slot => {
        const godown = slot.querySelector('.loc-godown').value.trim();
        const room   = slot.querySelector('.loc-room').value.trim();
        const rack   = slot.querySelector('.loc-rack').value.trim();
        const column = slot.querySelector('.loc-column').value.trim();
        const row    = slot.querySelector('.loc-row').value.trim();
        const qty    = parseFloat(slot.querySelector('.loc-qty').value) || 0;
        // Read what's actually typed/shown in the slot (may differ from original purchase if employee edited it)
        const batchTyped = slot.querySelector('.loc-batch').value.trim();
        const brandShown = slot.querySelector('.loc-brand').value.trim();

        if (!godown || !qty) { hasError = true; return; }

        allRecords.push({
          id: 'LOC' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
          itemType: p.itemType, itemId: p.itemId, itemName: p.itemName,
          batch: batchTyped || p.batch,
          brand: (brandShown && brandShown !== '—') ? brandShown : (p.brand || ''),
          purchaseId: p.id, expDate: p.expDate,
          qty, godown, room, rack, column, row,
          addedBy: currentUser?.name || 'Admin',
          addedAt: new Date().toLocaleString('en-IN')
        });
      });
    });

    if (hasError) { showToast('Har location mein Godown naam aur Qty zaroori hai','error'); return; }
    if (!allRecords.length) { showToast('Koi location entry nahi mili','error'); return; }

    // Save to Supabase (with localStorage fallback baked into sbUpsertInv)
    const savedOk = await sbUpsertInv('inv_locations', allRecords);

    // Merge directly into cache too (in case Supabase table doesn't exist yet / is offline)
    if (!_invCache.locations) _invCache.locations = [];
    allRecords.forEach(rec => {
      const idx = _invCache.locations.findIndex(r => r.id === rec.id);
      if (idx >= 0) _invCache.locations[idx] = rec;
      else _invCache.locations.push(rec);
    });

    closeModal('locationManagerModal');
    renderLocations();
    if (savedOk) {
      showToast('✅ ' + allRecords.length + ' location entry save ho gayi!');
    } else {
      showToast('💾 ' + allRecords.length + ' location entry local mein save ho gayi (Supabase abhi available nahi hai — wapas active hote hi sync karna na bhoolo)');
    }
  } catch(e) {
    console.error('[SG] saveAllLocations:', e);
    showToast('Error: ' + (e.message || 'location save nahi hui'), 'error');
  }
}

function _syncRemQty(qtyInput) {
  try {
    const brow = qtyInput.closest('.pur-batch-row');
    if(!brow) return;
    const remEl = brow.querySelector('.pur-remqty');
    if(!remEl) return;
    // Sirf tab auto-fill karo jab user ne manually kuch nahi likha ho
    if(!remEl.dataset.manuallyEdited) remEl.value = qtyInput.value;
  } catch(e) {}
}

function _recalcBatchRow(brow) {
  try {
    const qty    = parseFloat(brow.querySelector('.pur-qty').value)||0;
    const price  = parseFloat(brow.querySelector('.pur-price').value)||0;
    const disc   = parseFloat(brow.querySelector('.pur-disc').value)||0;
    const gstPct = parseFloat(brow.querySelector('.pur-gst').value)||0;
    const unitwt = brow.querySelector('.pur-unitwt').value||'';
    const uwNum  = parseFloat(unitwt)||0;
    const uwUnit = unitwt.replace(/[\d.\s]/g,'').trim();
    brow.querySelector('.pur-totalwt').value = (uwNum&&qty) ? (uwNum*qty).toFixed(2)+' '+uwUnit : '';
    const sub  = qty * price * (1 - disc/100);
    const gstA = sub * gstPct / 100;
    const tot  = sub + gstA;
    brow.querySelector('.pur-bamt').textContent = '\u20b9' + tot.toFixed(2);
    brow.dataset.sub = sub.toFixed(2);
    brow.dataset.gst = gstA.toFixed(2);
    brow.dataset.tot = tot.toFixed(2);
  } catch(e) {}
}

function _recalcItemCard(card) {
  try {
    let sub=0, gst=0, tot=0;
    card.querySelectorAll('.pur-batch-row').forEach(b => {
      sub += parseFloat(b.dataset.sub||0);
      gst += parseFloat(b.dataset.gst||0);
      tot += parseFloat(b.dataset.tot||0);
    });
    card.dataset.sub = sub.toFixed(2);
    card.dataset.gst = gst.toFixed(2);
    card.dataset.tot = tot.toFixed(2);
    const el = card.querySelector('.pur-item-total');
    if(el) el.textContent = '\u20b9' + tot.toFixed(2);
  } catch(e) {}
}

function calcPurchaseGrandTotal() {
  let sub=0, gst=0, tot=0;
  document.querySelectorAll('.pur-item-card').forEach(card => {
    sub += parseFloat(card.dataset.sub||0);
    gst += parseFloat(card.dataset.gst||0);
    tot += parseFloat(card.dataset.tot||0);
  });
  document.getElementById('pSubtotal').textContent = sub.toFixed(2);
  document.getElementById('pGSTAmt').textContent   = gst.toFixed(2);
  document.getElementById('pTotalAmt').textContent = tot.toFixed(2);
}

function addBatchRow(cardId) {
  try {
    const card   = document.getElementById(cardId);
    const bCont  = card.querySelector('.pur-batches-cont');
    const bId    = 'pbatch_' + Date.now() + '_' + Math.random().toString(36).slice(2,5);
    const iSel   = card.querySelector('.pur-item-sel');
    const opt    = iSel ? iSel.options[iSel.selectedIndex] : null;
    const unitwt = opt ? (opt.dataset.unitwt||'') : '';
    const itemBrand = opt ? (opt.dataset.brand||'') : '';
    const bDiv   = document.createElement('div');
    bDiv.className = 'pur-batch-row';
    bDiv.id = bId;
    bDiv.dataset.sub='0'; bDiv.dataset.gst='0'; bDiv.dataset.tot='0';
    bDiv.style.cssText = 'background:#f8fbff;border:1px solid #d0e8ff;border-radius:8px;padding:10px;margin-bottom:8px;';
    bDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:0.75rem;font-weight:700;color:#1a6fa8;">📋 Batch / HRN Lot</span>
        <button onclick="removeBatchRow('${bId}','${cardId}')" style="background:#fff0f0;border:1px solid #f5c6c6;border-radius:5px;color:#c0392b;font-size:0.8rem;cursor:pointer;padding:2px 8px;">✕ Hatao</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">HRN / Batch No.</label>
          <input type="text" class="form-input pur-hrn" placeholder="e.g. HRN-2024-001" style="font-size:0.82rem;padding:5px 8px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Brand Naam</label>
          <input type="text" class="form-input pur-brand" value="${itemBrand}" placeholder="e.g. Maggi, Fortune" style="font-size:0.82rem;padding:5px 8px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Qty (units) *</label>
          <input type="number" class="form-input pur-qty" placeholder="0" min="0" step="0.01" style="font-size:0.82rem;padding:5px 8px;" oninput="_recalcBatchRow(this.closest('.pur-batch-row'));_recalcItemCard(this.closest('.pur-item-card'));calcPurchaseGrandTotal();_syncRemQty(this);">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Remaining Qty (units)</label>
          <input type="number" class="form-input pur-remqty" placeholder="auto" min="0" step="0.01" style="font-size:0.82rem;padding:5px 8px;background:#f0fff4;color:#2e7d32;font-weight:700;" title="Qty se auto-fill hota hai — zaroorat par edit kar sakte ho">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Manufacture Date</label>
          <input type="date" class="form-input pur-mfg" style="font-size:0.82rem;padding:5px 8px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Expiry Date</label>
          <input type="date" class="form-input pur-exp" style="font-size:0.82rem;padding:5px 8px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Wt/Vol per unit</label>
          <input type="text" class="form-input pur-unitwt" value="${unitwt}" placeholder="e.g. 1 kg, 500 ml" style="font-size:0.82rem;padding:5px 8px;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Total Wt/Vol (auto)</label>
          <input type="text" class="form-input pur-totalwt" readonly placeholder="auto" style="font-size:0.82rem;padding:5px 8px;background:#f0fff4;color:#2e7d32;font-weight:700;">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 80px 80px auto;gap:8px;align-items:end;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Price per unit (₹) *</label>
          <input type="number" class="form-input pur-price" placeholder="0.00" min="0" step="0.01" style="font-size:0.82rem;padding:5px 8px;" oninput="_recalcBatchRow(this.closest('.pur-batch-row'));_recalcItemCard(this.closest('.pur-item-card'));calcPurchaseGrandTotal()">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Disc%</label>
          <input type="number" class="form-input pur-disc" value="0" min="0" max="100" style="font-size:0.82rem;padding:5px 8px;" oninput="_recalcBatchRow(this.closest('.pur-batch-row'));_recalcItemCard(this.closest('.pur-item-card'));calcPurchaseGrandTotal()">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">GST%</label>
          <select class="form-input pur-gst" style="font-size:0.82rem;padding:5px 8px;" onchange="_recalcBatchRow(this.closest('.pur-batch-row'));_recalcItemCard(this.closest('.pur-item-card'));calcPurchaseGrandTotal()">
            <option value="0">0%</option><option value="5" selected>5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
          </select>
        </div>
        <div style="text-align:right;padding-bottom:2px;">
          <div style="font-size:0.72rem;color:var(--muted);">Amount</div>
          <div class="pur-bamt" style="font-weight:700;font-size:1rem;color:var(--fire);">₹0.00</div>
        </div>
      </div>
    `;
    bDiv.querySelector('.pur-unitwt').oninput = function() {
      _recalcBatchRow(this.closest('.pur-batch-row'));
      _recalcItemCard(this.closest('.pur-item-card'));
      calcPurchaseGrandTotal();
    };
    const remQtyEl = bDiv.querySelector('.pur-remqty');
    if(remQtyEl) {
      remQtyEl.addEventListener('input', function() {
        this.dataset.manuallyEdited = '1';
      });
    }
    bCont.appendChild(bDiv);
  } catch(e) { console.error('[SG] addBatchRow:', e); }
}

function removeBatchRow(bId, cardId) {
  try {
    const b = document.getElementById(bId);
    if(b) b.remove();
    const card = document.getElementById(cardId);
    if(card) { _recalcItemCard(card); calcPurchaseGrandTotal(); }
  } catch(e) {}
}

function addPurchaseItemRow() {
  try {
    const container = document.getElementById('purchaseItemsContainer');
    const cardId    = 'purcard_' + Date.now() + '_' + Math.random().toString(36).slice(2,5);
    const card      = document.createElement('div');
    card.className  = 'pur-item-card';
    card.id         = cardId;
    card.dataset.sub='0'; card.dataset.gst='0'; card.dataset.tot='0';
    card.style.cssText = 'background:#fff;border:2px solid #e8d5c8;border-radius:10px;padding:10px 12px;margin-bottom:10px;';
    card.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
        <select class="form-input pur-type-sel" style="font-size:0.85rem;padding:7px 10px;min-width:160px;" onchange="onPurchaseTypeChange(this)">
          <option value="">-- Item Type --</option>
          <option value="company">🏢 Company Product</option>
          <option value="rawmat">🌿 Raw Material</option>
        </select>
        <select class="form-input pur-item-sel" style="font-size:0.85rem;padding:7px 10px;flex:1;min-width:160px;" onchange="onPurchaseItemChange(this)">
          <option value="">-- Select Item --</option>
        </select>
        <button onclick="(function(btn){var card=btn.closest('.pur-item-card');var type=card.querySelector('.pur-type-sel').value;if(!type){showToast('Pehle Item Type select karo','error');return;}openQuickAddItem(type,card.querySelector('.pur-item-sel'));})(this)" style="background:#e8f0fe;color:#1565c0;border:1.5px solid #90caf9;border-radius:6px;font-size:0.82rem;font-weight:700;cursor:pointer;padding:7px 12px;white-space:nowrap;">+ Naya Item</button>
        <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
          <span style="font-size:0.8rem;color:var(--muted);">Total: <b class="pur-item-total" style="color:var(--fire);">₹0.00</b></span>
          <button onclick="removePurchaseItemCard('${cardId}')" style="background:#fff0f0;border:1.5px solid #f5c6c6;border-radius:6px;color:#c0392b;font-size:0.82rem;cursor:pointer;padding:5px 10px;white-space:nowrap;">✕ Hatao</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:120px 120px 70px 100px 100px 75px 55px 55px 90px 30px;gap:5px;padding:4px 8px;background:#eaf3ff;border-radius:5px;font-size:0.68rem;font-weight:700;color:#1a6fa8;margin-bottom:6px;">
        <span>HRN / Batch No.</span><span>Mfg \u2192 Exp Date</span><span>Qty</span><span>Wt/Vol per unit</span><span>Total Wt/Vol</span><span>Price/unit \u20b9</span><span>Disc%</span><span>GST%</span><span>Amount</span><span></span>
      </div>
      <div class="pur-batches-cont"></div>
      <button onclick="addBatchRow('${cardId}')" style="margin-top:4px;background:#e8f5e9;color:#2e7d32;border:1.5px solid #a5d6a7;padding:5px 14px;border-radius:6px;font-size:0.8rem;font-weight:700;cursor:pointer;">+ Add Batch / HRN Lot</button>
    `;
    container.appendChild(card);
    addBatchRow(cardId);
  } catch(e) { console.error('[SG] addPurchaseItemRow:', e); }
}

function removePurchaseItemCard(cardId) {
  const card = document.getElementById(cardId);
  if(card) { card.remove(); calcPurchaseGrandTotal(); }
}

// Legacy stubs
async function loadPurchaseItems() {}
function calcPurchaseTotal() { calcPurchaseGrandTotal(); }
function removePurchaseRow(id) { removePurchaseItemCard(id); }

async function savePurchase(manageAfter) {
  try {
    const date       = document.getElementById('pDate').value;
    const vendorId   = document.getElementById('pVendor').value;
    const receivedBy = document.getElementById('pReceivedBy').value.trim();
    const cards      = document.querySelectorAll('.pur-item-card');

    if (!date)        { showToast('Purchase date required','error'); return; }
    if (!receivedBy)  { showToast('Received By (employee name) required','error'); return; }
    if (!cards.length){ showToast('Add at least one item','error'); return; }

    for (const card of cards) {
      const type   = card.querySelector('.pur-type-sel').value;
      const itemId = card.querySelector('.pur-item-sel').value;
      if (!type || !itemId) { showToast('Select Item Type and Item for each row','error'); return; }
      const batches = card.querySelectorAll('.pur-batch-row');
      if (!batches.length) { showToast('Each item needs at least one batch/lot','error'); return; }
      for (const b of batches) {
        const qty   = parseFloat(b.querySelector('.pur-qty').value)||0;
        const price = parseFloat(b.querySelector('.pur-price').value)||0;
        if (!qty || !price) { showToast('Qty and Price required for every batch row','error'); return; }
      }
    }

    const fileInput = document.getElementById('pBillFile');
    let billData = '';

    const doSave = async () => {
      try {
        const vendors  = await getVendors();
        const vendor   = vendors.find(v=>v.id===vendorId);
        const products = await getProducts();
        const rawmats  = await getRawmats();
        const billNo   = document.getElementById('pBillNo').value;
        const payMode  = document.getElementById('pPayMode').value;
        const payStatus= document.getElementById('pPayStatus').value;
        const notes    = document.getElementById('pNotes').value;
        const ts       = Date.now();
        const newPurchases = [];
        let idx = 0;

        for (const card of cards) {
          const itemType = card.querySelector('.pur-type-sel').value;
          const itemId   = card.querySelector('.pur-item-sel').value;
          let itemName = '', resolvedType = itemType;
          if (itemType === 'company') {
            // Find in solid or liquid
            const allProds = [...(_purchaseItemsCache.solid||[]), ...(_purchaseItemsCache.liquid||[])];
            const p = allProds.find(x=>x.id===itemId);
            itemName = p ? p.name : '';
            resolvedType = p ? p.type : 'solid';
          } else if (itemType==='rawmat') {
            const r = rawmats.find(x=>x.id===itemId); itemName = r?r.name:'';
          }
          const batches = card.querySelectorAll('.pur-batch-row');
          for (const b of batches) {
            const qty     = parseFloat(b.querySelector('.pur-qty').value)||0;
            const remQty  = b.querySelector('.pur-remqty')?.value.trim();
            const remainingQty = (remQty !== '' && remQty !== undefined && remQty !== null) ? parseFloat(remQty) : qty;
            const price   = parseFloat(b.querySelector('.pur-price').value)||0;
            const disc    = parseFloat(b.querySelector('.pur-disc').value)||0;
            const gstPct  = parseFloat(b.querySelector('.pur-gst').value)||0;
            const unitWt  = b.querySelector('.pur-unitwt').value;
            const totalWt = b.querySelector('.pur-totalwt').value;
            const hrn     = b.querySelector('.pur-hrn').value.trim();
            const brandEntered = b.querySelector('.pur-brand').value.trim();
            const mfgDate = b.querySelector('.pur-mfg').value;
            const expDate = b.querySelector('.pur-exp').value;
            const sub     = qty * price * (1 - disc/100);
            const gstA    = sub * gstPct / 100;
            const total   = sub + gstA;

            const purchase = {
              id: 'PUR' + ts + '_' + (++idx),
              date, vendorId,
              vendorName: vendor ? vendor.name : '',
              itemType: resolvedType, itemId, itemName, qty,
              remainingQty,
              brand: brandEntered,
              unitWt, totalWt,
              mfgDate, expDate,
              batch: hrn,
              mrp: '',
              price, discount: disc, gstPct,
              gstAmt:   Math.round(gstA),
              subtotal: Math.round(sub),
              total:    Math.round(total),
              payMode, payStatus, billNo,
              billFile: idx===1 ? billData : '',
              receivedBy, notes,
              addedBy: currentUser?.name||'Admin',
              addedAt: new Date().toLocaleString('en-IN')
            };
            newPurchases.push(purchase);

            if (expDate) {
              const diff = Math.ceil((new Date(expDate) - new Date()) / 86400000);
              if (diff <= 30) showToast('\u26a0\ufe0f ' + itemName + ' (' + (hrn||'batch '+idx) + ') expires in ' + diff + ' days!', 'error');
            }
          }
        }

        const allPurchases = await getPurchases();
        newPurchases.forEach(p => allPurchases.unshift(p));
        setInvData('purchases', allPurchases);
        for (const p of newPurchases) await updateStock(p.itemType, p.itemId, p.qty, 'add');

        // ✅ AUTO-LINK: qty - remainingQty = diff
        // Diff > 0 matlab purchase se pehle kuch use ho gaya tha.
        // Emergency entries mein item/date/vendor/HRN match dhoondho
        // aur Track Records mein original emergency date+time ke saath push karo.
        try {
          const emergencyEntries = await sbGetEmergency();
          const consumptions     = await getConsumptions();
          const existingTrackIds = new Set(consumptions.map(c => c.id));
          let totalLinked = 0;

          for (const pur of newPurchases) {
            const diff = (pur.qty||0) - (pur.remainingQty!=null ? pur.remainingQty : pur.qty);
            if (diff <= 0) continue;

            const purItem   = (pur.itemName||'').toLowerCase().trim();
            const purVendor = (pur.vendorName||'').toLowerCase().trim();
            const purDate   = (pur.date||'').trim();
            const purHRN    = (pur.batch||'').toLowerCase().trim();

            // .filter() — same item ki SAARI matching emergency entries lo
            // Process 1: item name + purchase date + vendor name
            // Process 2: item name + HRN
            const allMatched = emergencyEntries.filter(e => {
              const eItem   = (e.name||'').toLowerCase().trim();
              const eVendor = (e.supplier||'').toLowerCase().trim();
              const eDate   = (e.purchaseDate||'').trim();
              const eHRN    = (e.batch||'').toLowerCase().trim();
              if (!purItem || !eItem || purItem !== eItem) return false;

              const process1 = purDate   && eDate   && purDate   === eDate   &&
                               purVendor && eVendor && purVendor === eVendor;
              const process2 = purHRN    && eHRN    && purHRN    === eHRN;

              return process1 || process2;
            });

            if (!allMatched.length) continue;

            // Har matched emergency entry ke liye alag Track Record row banao
            // (apni original date + time ke saath)
            allMatched.forEach(matched => {
              const trackId = 'EC_' + matched.id + '_' + pur.id;
              if (existingTrackIds.has(trackId)) return; // duplicate avoid

              const eOriginal = matched.createdAt ? new Date(matched.createdAt) : new Date();
              const eDate     = matched.purchaseDate || eOriginal.toISOString().slice(0,10);
              const eTime     = matched.autoDateTime
                ? matched.autoDateTime.replace(/.*?(\d{1,2}:\d{2}\s*[AP]M).*/i,'$1').trim()
                : eOriginal.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});

              consumptions.unshift({
                id:               trackId,
                date:             eDate,
                time:             eTime,
                type:             pur.itemType    || matched.type    || 'rawmat',
                itemName:         pur.itemName    || matched.name,
                itemId:           pur.itemId      || '',
                qty:              matched.qty,          // har entry ki apni qty
                perWeight:        pur.unitWt       || matched.unit   || '',
                purchaseId:       pur.id,
                hrn:              pur.batch        || matched.batch  || '—',
                brand:            pur.brand        || matched.supplier || '—',
                purpose:          matched.reason   || 'Emergency Usage',
                recordedBy:       matched.takenBy  || '',
                approvedBy:       currentUser?.name || '—',
                handoverTo:       matched.takenBy  || '—',
                source:           'emergency',
                linkedPurchaseId: pur.id,
                addedAt:          new Date().toLocaleString('en-IN')
              });
              existingTrackIds.add(trackId);

              // Emergency entry reconciled mark karo
              matched.reconciled       = true;
              matched.reconciledAt     = new Date().toLocaleString('en-IN');
              matched.linkedPurchaseId = pur.id;
              totalLinked++;
            });

            // Summary: kitni entries mili, total qty kitni thi
            const totalEmergencyQty = allMatched.reduce((s,e) => s+(parseFloat(e.qty)||0), 0);
            if (totalEmergencyQty !== diff) {
              console.warn(`[SG] ${pur.itemName}: diff=${diff} but emergency total=${totalEmergencyQty}`);
            }
          }

          if (totalLinked > 0) {
            setInvData('consumptions', consumptions);
            await sbUpsertInv('sg_emergency_stock', emergencyEntries)
              .catch(e => console.warn('[SG] emergency reconcile save:', e));
            showToast('🔗 ' + totalLinked + ' emergency entr' + (totalLinked>1?'ies':'y') + ' Purchase ID se auto-link hokar Track Records mein aa gayi!');
          }
        } catch(ex) { console.warn('[SG] purchase→emergency diff-link fail:', ex); }

        closeModal('invPurchaseModal');
        renderPurchases();
        renderStock();
        showToast('\u2705 Purchase saved! ' + cards.length + ' item(s), ' + newPurchases.length + ' batch record(s) added to stock.');

        if (manageAfter) {
          openLocationManager(newPurchases);
        }
      } catch(e) { console.error('[SG] savePurchase doSave:', e); showToast('Error saving purchase','error'); }
    };

    if (fileInput.files[0]) {
      // Bill image Storage pe daalo; fail hue toh COMPRESSED base64 fallback (Bug #9 fix)
      uploadFileToStorage(fileInput.files[0], 'bills').then(function(url){
        if(url){ billData = url; doSave(); }
        else {
          _compressImageToBase64(fileInput.files[0], 1200, 0.72).then(function(b64){ billData = b64; doSave(); });
        }
      });
    } else { doSave(); }
  } catch(_e) { console.error('[SG] savePurchase:', _e); }
}

// ============================================================
//  REMAINING PURCHASE STOCK — sub-tab switch + render
// ============================================================
function switchStockSubTab(tab) {
  try {
    const tabs   = ['current','remaining','track'];
    const panels = ['current','remaining','track'];
    tabs.forEach(t => {
      const btn = document.getElementById('stockSubTab-'+t);
      const pan = document.getElementById('stockPanel-'+t);
      if(!btn||!pan) return;
      const active = (t===tab);
      btn.style.borderBottomColor = active ? 'var(--fire)' : 'transparent';
      btn.style.color = active ? 'var(--fire)' : 'var(--muted)';
      pan.style.display = active ? '' : 'none';
    });
    if(tab==='remaining') renderRemainingStock();
    if(tab==='track')     renderTrackRecords();
  } catch(e) { console.error('[SG] switchStockSubTab:', e); }
}

async function renderTrackRecords() {
  try {
    const tbody = document.getElementById('trackTableBody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:20px;color:#aaa;">⏳ Loading...</td></tr>';

    const searchRaw  = (document.getElementById('trackSearch')?.value||'').toLowerCase().trim();
    const typeFilter = (document.getElementById('trackFilterType')?.value||'');
    const consumptions = await getConsumptions();

    let rows = (consumptions||[]).filter(c => {
      if(typeFilter && (c.source||'manual') !== typeFilter) return false;
      if(searchRaw) {
        const hay = [c.itemName,c.purchaseId,c.hrn,c.brand,c.type,c.approvedBy,c.handoverTo,c.recordedBy].join(' ').toLowerCase();
        if(!hay.includes(searchRaw)) return false;
      }
      return true;
    });

    if(!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:30px;color:#aaa;">Koi usage record nahi mila' + (searchRaw ? ' for "'+searchRaw+'"' : '') + '</td></tr>';
      return;
    }

    const typeColors = { solid:'#1565c0', liquid:'#6a1b9a', rawmat:'#2e7d32' };
    const typeLabels = { solid:'🧴 Solid', liquid:'🧃 Liquid', rawmat:'🌾 Raw Mat' };

    let _trkIdx=0;
    tbody.innerHTML = rows.map(c => {
      _trkIdx++;
      const isEmergency = (c.source==='emergency');
      const rowBg = isEmergency ? 'background:linear-gradient(90deg,#fff3e0 0%,#fff 60%);' : '';
      const sourceTag = isEmergency
        ? `<span style="background:#ff6f00;color:#fff;font-size:0.68rem;font-weight:800;padding:2px 8px;border-radius:20px;">🚨 EMERGENCY</span>`
        : `<span style="background:#1565c018;color:#1565c0;font-size:0.68rem;font-weight:800;padding:2px 8px;border-radius:20px;">📝 Manual</span>`;
      const typeKey  = c.type||'';
      const typeLbl  = typeLabels[typeKey] || typeKey || '—';
      const typeCol  = typeColors[typeKey] || '#555';
      const _trkSno = '<td style="position:sticky;left:0;z-index:1;background:'+(isEmergency?'#fff9f0':'#fff')+';border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">'+_trkIdx+'</td>';
      return `<tr style="${rowBg}">
        ${_trkSno}<td>${sourceTag}</td>
        <td style="font-family:monospace;font-size:0.78rem;color:#1b5e20;font-weight:700;">${c.purchaseId||'—'}</td>
        <td style="font-family:monospace;font-size:0.78rem;color:#6a1b9a;font-weight:700;">${c.hrn||'—'}</td>
        <td style="font-weight:600;">${c.itemName||'—'}</td>
        <td style="font-size:0.82rem;color:#555;">${c.brand||'—'}</td>
        <td><span style="background:${typeCol}18;color:${typeCol};font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:20px;">${typeLbl}</span></td>
        <td style="font-size:0.82rem;">${c.date||'—'}</td>
        <td style="font-size:0.82rem;color:#555;">${c.time||'—'}</td>
        <td style="font-weight:800;color:#c62828;">${c.qty||0} <span style="font-size:0.72rem;color:#888;">${c.perWeight||c.unit||''}</span></td>
        <td style="font-size:0.82rem;color:#2e7d32;font-weight:600;">${c.approvedBy||'—'}</td>
        <td style="font-size:0.82rem;color:#1565c0;">${c.handoverTo||c.recordedBy||'—'}</td>
      </tr>`;
    }).join('');
  } catch(e) { console.error('[SG] renderTrackRecords:', e); }
}

function exportTrackRecordsCSV() {
  try {
    const rows = [...document.querySelectorAll('#trackTableBody tr')];
    if(!rows.length) { showToast('Export karne ke liye data nahi hai','error'); return; }
    const headers = ['Source','Purchase ID','HRN/Batch','Item Name','Brand','Type','Date','Time','Qty Used','Approved By','Handover To'];
    const csvRows = rows.map(r => [...r.querySelectorAll('td')].map(td=>'"'+td.innerText.replace(/\n.*/,'').trim().replace(/"/g,'""')+'"').join(','));
    const blob = new Blob([headers.join(',')+'\n'+csvRows.join('\n')],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='track_records_usage_'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
    showToast('✅ CSV export ho gaya!');
  } catch(e) { showToast('Export failed','error'); }
}



async function renderRemainingStock() {
  try {
    const tbody = document.getElementById('remStockTableBody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:#aaa;">⏳ Loading...</td></tr>';

    const searchRaw = (document.getElementById('remStockSearch')?.value||'').toLowerCase().trim();
    const purchases  = await getPurchases();
    const locations  = await getLocations();
    const products   = await getProducts();
    const rawmats    = await getRawmats();
    const today = new Date(); today.setHours(0,0,0,0);

    // Location lookup map: purchaseId → location record
    const locMap = {};
    (locations||[]).forEach(l => { if(l.purchaseId) locMap[l.purchaseId] = l; });

    // Item detail lookup
    const allItems = [...(products||[]), ...(rawmats||[])];
    const itemMap = {};
    allItems.forEach(it => { itemMap[String(it.id)] = it; });

    // Filter: sirf woh batches jinkaa remaining > 0 aur expired nahi
    let rows = (purchases||[]).filter(p => {
      const rem = (p.remainingQty!==undefined&&p.remainingQty!==null&&p.remainingQty!=='')
        ? parseFloat(p.remainingQty) : parseFloat(p.qty)||0;
      if(rem <= 0) return false;
      if(p.expDate) {
        const ed = new Date(p.expDate); ed.setHours(0,0,0,0);
        if(!isNaN(ed.getTime()) && ed < today) return false;
      }
      // Search filter
      if(searchRaw) {
        const haystack = [p.id, p.batch, p.itemName, p.brand, p.itemType,
          locMap[p.id]?.godown, locMap[p.id]?.room, locMap[p.id]?.rack,
          locMap[p.id]?.column, locMap[p.id]?.row].join(' ').toLowerCase();
        if(!haystack.includes(searchRaw)) return false;
      }
      return true;
    });

    if(!rows.length) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;color:#aaa;">No remaining purchase stock found' + (searchRaw ? ' for "'+searchRaw+'"' : '') + '</td></tr>';
      return;
    }

    // Sort: item name → date (FIFO oldest first)
    rows.sort((a,b) => (a.itemName||'').localeCompare(b.itemName||'') || new Date(a.date)-new Date(b.date));

    const typeColors = { solid:'#1565c0', liquid:'#6a1b9a', rawmat:'#2e7d32' };
    const typeLabels = { solid:'🧴 Solid', liquid:'🧃 Liquid', rawmat:'🌾 Raw Mat' };

    let _remIdx=0;
    tbody.innerHTML = rows.map(p => {
      _remIdx++;
      const rem = (p.remainingQty!==undefined&&p.remainingQty!==null&&p.remainingQty!=='')
        ? parseFloat(p.remainingQty) : parseFloat(p.qty)||0;
      const loc = locMap[p.id] || {};
      const item= itemMap[String(p.itemId)] || {};
      const brand = p.brand || item.brand || '—';
      const col = typeColors[p.itemType]||'#555';
      const lbl = typeLabels[p.itemType]||p.itemType||'—';
      const remPct = p.qty ? Math.round((rem/parseFloat(p.qty))*100) : 0;
      const barColor = remPct>50?'#43a047':remPct>20?'#fb8c00':'#e53935';
      const _remSno = '<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">'+_remIdx+'</td>';
      return `<tr>
        ${_remSno}<td style="font-family:monospace;font-size:0.78rem;color:#1b5e20;font-weight:700;">${p.id||'—'}</td>
        <td style="font-family:monospace;font-size:0.78rem;color:#6a1b9a;font-weight:700;">${p.batch||'—'}</td>
        <td style="font-weight:600;">${escHtml(p.itemName||'—')}</td>
        <td style="font-size:0.82rem;color:#555;">${brand}</td>
        <td><span style="background:${col}18;color:${col};font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:20px;">${lbl}</span></td>
        <td>
          <div style="font-weight:800;color:${barColor};font-size:0.95rem;">${rem} <span style="font-size:0.72rem;color:#888;">${p.unitWt||''} ${p.wtUnit||''}</span></div>
          <div style="background:#eee;border-radius:4px;height:4px;width:80px;margin-top:3px;">
            <div style="background:${barColor};height:4px;border-radius:4px;width:${Math.min(remPct,100)}%;"></div>
          </div>
        </td>
        <td style="font-size:0.8rem;">${p.unitWt||'—'} ${p.wtUnit||''}</td>
        <td style="font-weight:600;color:#1565c0;">${loc.godown||'—'}</td>
        <td style="color:#6a1b9a;">${loc.room||'—'}</td>
        <td>${loc.rack||'—'}</td>
        <td>${loc.column||'—'}</td>
        <td>${loc.row||'—'}</td>
      </tr>`;
    }).join('');
  } catch(e) { console.error('[SG] renderRemainingStock:', e); }
}

function exportRemainingStockCSV() {
  try {
    const rows = [...document.querySelectorAll('#remStockTableBody tr')];
    if(!rows.length) { showToast('Export karne ke liye data nahi hai', 'error'); return; }
    const headers = ['Purchase ID','HRN/Batch No.','Item Name','Brand','Type','Remaining Stock','Unit Wt','Godown','Room/Floor','Rack','Column','Row'];
    const csvRows = rows.map(r => [...r.querySelectorAll('td')].map(td=>'"'+td.innerText.replace(/\n.*/,'').trim().replace(/"/g,'""')+'"').join(','));
    const blob = new Blob([headers.join(',')+'\n'+csvRows.join('\n')], {type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='remaining_purchase_stock_'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
    showToast('✅ CSV export ho gaya!');
  } catch(e) { console.error('[SG] exportRemainingStockCSV:', e); showToast('Export failed','error'); }
}

function switchPurchaseSubTab(tab) {
  try {
    const entriesBtn   = document.getElementById('purSubTab-entries');
    const locationsBtn = document.getElementById('purSubTab-locations');
    const entriesPanel   = document.getElementById('purSubPanel-entries');
    const locationsPanel = document.getElementById('purSubPanel-locations');

    if (tab === 'entries') {
      entriesPanel.style.display   = '';
      locationsPanel.style.display = 'none';
      entriesBtn.classList.add('active');
      entriesBtn.style.borderBottomColor = 'var(--fire)';
      entriesBtn.style.color = 'var(--fire)';
      locationsBtn.classList.remove('active');
      locationsBtn.style.borderBottomColor = 'transparent';
      locationsBtn.style.color = 'var(--muted)';
      renderPurchases();
    } else {
      entriesPanel.style.display   = 'none';
      locationsPanel.style.display = '';
      locationsBtn.classList.add('active');
      locationsBtn.style.borderBottomColor = 'var(--fire)';
      locationsBtn.style.color = 'var(--fire)';
      entriesBtn.classList.remove('active');
      entriesBtn.style.borderBottomColor = 'transparent';
      entriesBtn.style.color = 'var(--muted)';
      renderLocations();
    }
  } catch(e) { console.error('[SG] switchPurchaseSubTab:', e); }
}

async function renderPurchases() {
  try {
  const allPurchases = await getPurchases();
  // Latest first — date descending
  const purchases = [...allPurchases].sort((a,b) => {
    const da = parseExpiryDate(a.date) || new Date(0);
    const db = parseExpiryDate(b.date) || new Date(0);
    return db - da;
  });
  const cols = getColumns('purchases').filter(c => !c.hidden && c.field !== 'sno');
  const thead = document.querySelector('#inv-purchases table thead tr');
  if(thead) {
    thead.innerHTML = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>' + cols.map(c=>'<th>'+c.label+(c.description?' <span title="'+c.description.replace(/"/g,'&quot;')+'" style="cursor:help;font-size:0.78rem;opacity:0.7;">ℹ️</span>':'')+'</th>').join('');
  }
  const tbody=document.getElementById('purchaseTableBody');
  if(!purchases.length){tbody.innerHTML='<tr><td colspan="'+(cols.length+1)+'"><div class="empty"><div class="empty-icon">🧾</div><p>No purchase entries found</p></div></td></tr>';return;}
  tbody.innerHTML=purchases.map((p,idx)=>{
    const snoCell='<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">'+(idx+1)+'</td>';
    return '<tr>'+snoCell+cols.map(c=>{
      if(c.field==='sno') return '';
      if(c.field==='actions') { var ppid=p.id; return `<td><div class="action-btns"><button class="act-btn act-view" onclick="viewPurchaseDetail('${ppid}')">View</button> ${invCanPurchase()?`<button class="act-btn act-delete" onclick="deletePurchase('${ppid}')">Del</button>`:''}</div></td>`; }
      if(c.field==='id') return '<td><b style="color:var(--fire);font-size:0.78rem;">'+(p.id||'—')+'</b></td>';
      if(c.field==='itemName') return '<td><b>'+(p.itemName||'—')+'</b><br><span style="font-size:0.72rem;color:var(--muted);">'+(p.itemType||'')+'</span></td>';
      if(c.field==='total') return '<td><b style="color:var(--fire)">₹'+(p.total||0)+'</b></td>';
      if(c.field==='payStatus') return '<td><span class="status '+(p.payStatus==='Paid'?'confirmed':p.payStatus==='Pending'?'pending':'preparing')+'">'+(p.payStatus||'—')+'</span></td>';
      if(c.field==='payMode') return '<td><span class="status '+(p.payMode==='Cash'?'delivered':'confirmed')+'">'+(p.payMode||'—')+'</span></td>';
      if(c.field==='billNo') { var bid=p.id; return `<td>${p.billFile?`<button class="act-btn act-view" onclick="viewBill('${bid}')">View</button>`:'—'}</td>`; }
      var smartPu = renderInvCustomCell(p, c, 'purchases', p.id); if(smartPu) return smartPu;
      return '<td>'+(p[c.field]||'—')+'</td>';
    }).join('')+'</tr>';
  }).join('');
  } catch(e) { console.error("[SG] renderPurchases error:", e); }
}

async function renderLocations() {
  try {
    const allLocations = await getLocations();
    // Latest first
    const locations = [...(allLocations||[])].sort((a,b) => {
      const da = new Date(a.addedAt||0).getTime() || 0;
      const db = new Date(b.addedAt||0).getTime() || 0;
      return db - da;
    });
    const tbody = document.getElementById('locationTableBody');
    if (!tbody) return;
    if (!locations.length) {
      tbody.innerHTML = '<tr><td colspan="11"><div class="empty"><div class="empty-icon">📍</div><p>Koi location entry nahi mili</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = locations.map((l, idx) => {
      return '<tr>'
        + '<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">' + (idx+1) + '</td>'
        + '<td><b style="color:var(--fire);font-size:0.78rem;">' + (l.purchaseId||'—') + '</b></td>'
        + '<td><b>' + (l.itemName||'—') + '</b></td>'
        + '<td>' + (l.batch||'—') + '</td>'
        + '<td>' + (l.brand||'—') + '</td>'
        + '<td>' + (l.godown||'—') + '</td>'
        + '<td>' + (l.room||'—') + '</td>'
        + '<td>' + (l.rack||'—') + '</td>'
        + '<td>' + (l.column||'—') + '</td>'
        + '<td>' + (l.row||'—') + '</td>'
        + '<td>' + (l.addedBy||'—') + '</td>'
        + '</tr>';
    }).join('');
  } catch(e) { console.error('[SG] renderLocations error:', e); }
}

async function viewPurchaseDetail(id) {
  try {
  const p=(await getPurchases()).find(x=>x.id===id);
  if(!p) return;
  document.getElementById('orderDetailContent').innerHTML=`
    <div class="detail-row"><span class="detail-key">Purchase ID</span><span class="detail-val"><b style="color:var(--fire)">${p.id}</b></span></div>
    <div class="detail-row"><span class="detail-key">Date</span><span class="detail-val">${p.date}</span></div>
    <div class="detail-row"><span class="detail-key">Vendor</span><span class="detail-val">${escHtml(p.vendorName||'—')}</span></div>
    <div class="detail-row"><span class="detail-key">Item</span><span class="detail-val"><b>${escHtml(p.itemName)}</b> (${p.itemType})</span></div>
    <div class="detail-row"><span class="detail-key">Quantity</span><span class="detail-val">${p.qty} units</span></div>
    <div class="detail-row"><span class="detail-key">Total Weight</span><span class="detail-val">${p.totalWt||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Mfg Date</span><span class="detail-val">${p.mfgDate||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Expiry Date</span><span class="detail-val" style="color:${p.expDate&&new Date(p.expDate)<new Date()?'var(--danger)':'inherit'}">${p.expDate||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Batch No</span><span class="detail-val">${p.batch||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Purchase Price</span><span class="detail-val">₹${p.price}/unit</span></div>
    <div class="detail-row"><span class="detail-key">Discount</span><span class="detail-val">${p.discount||0}%</span></div>
    <div class="detail-row"><span class="detail-key">GST (${p.gstPct}%)</span><span class="detail-val">₹${p.gstAmt}</span></div>
    <div class="detail-row"><span class="detail-key">Total Amount</span><span class="detail-val"><b style="color:var(--fire)">₹${p.total}</b></span></div>
    <div class="detail-row"><span class="detail-key">Payment</span><span class="detail-val">${p.payMode} — ${p.payStatus}</span></div>
    <div class="detail-row"><span class="detail-key">Bill No</span><span class="detail-val">${p.billNo||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Received By</span><span class="detail-val">${p.receivedBy||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Added By</span><span class="detail-val">${p.addedBy}</span></div>
  `;
  document.getElementById('orderDetailModal').classList.add('open');
  } catch(_e) { console.error("[SG] viewPurchaseDetail:", _e); }
}

async function viewBill(id) {
  try {
  const p=(await getPurchases()).find(x=>x.id===id);
  if(!p||!p.billFile) return;
  const w=window.open();
  w.document.write('<img src="'+p.billFile+'" style="max-width:100%;">');
  } catch(_e) { console.error("[SG] viewBill:", _e); }
}

async function deletePurchase(id) {
  try {
  if(!confirm('Purchase are you sure you want to delete?')) return;
  const purchases=(await getPurchases()).filter(x=>x.id!==id);
  setInvData('purchases',purchases);
  renderPurchases();
  showToast('Purchase deleted');
  } catch(_e) { console.error("[SG] deletePurchase:", _e); }
}

// --- STOCK ---
async function updateStock(type, itemId, qty, action) {
  try {
  const stock = await getStock();
  const key = type + '_' + itemId;
  if (!stock[key]) stock[key] = {type, itemId, qty: 0, lastUpdated: '', stock_key: key};
  if (action === 'add') stock[key].qty += qty;
  else if (action === 'remove') stock[key].qty = Math.max(0, stock[key].qty - qty);
  stock[key].lastUpdated = new Date().toLocaleString('en-IN');
  stock[key].stock_key = key; // ensure stock_key always set for Supabase upsert
  // Save as array to Supabase (inv_stock uses stock_key as conflict key)
  const arr = Object.entries(stock).map(([k, v]) => ({ ...v, stock_key: k }));
  _invCache['stock'] = null; // invalidate cache
  await sbUpsertInv('inv_stock', arr, 'stock_key').catch(e => console.error('updateStock save fail:', e));
  } catch(_e) { console.error("[SG] updateStock:", _e); }
}

function getItemName(type,id,_products=[],_rawmats=[]) {
  if(type==='solid'||type==='liquid') { const p=_products.find(x=>x.id===id); return p?p.name:'Unknown'; }
  const r=_rawmats.find(x=>x.id===id); return r?r.name:'Unknown';
}

function getItemUnit(type,id,_products=[],_rawmats=[]) {
  if(type==='solid') { const p=_products.find(x=>x.id===id); return p?p.unitType:'unit'; }
  if(type==='liquid') { const p=_products.find(x=>x.id===id); return p?p.unitType:'unit'; }
  const r=_rawmats.find(x=>x.id===id); return r?r.unit:'unit';
}

function getItemMinStock(type,id,_products=[],_rawmats=[]) {
  if(type==='solid'||type==='liquid') { const p=_products.find(x=>x.id===id); return p?p.minStock:0; }
  const r=_rawmats.find(x=>x.id===id); return r?r.minStock:0;
}

// ============================================================
// REBUILD STOCK FROM ALL PURCHASES
// Called after purchase import to populate inv_stock table
// ============================================================
async function doRebuildStock() {
  try {
  showToast('⏳ Cache clear ho raha hai...');

  // Step 1: Memory cache poora clear
  invInvalidate();

  // Step 2: localStorage cache clear — saari inv tables
  ['inv_purchases','inv_stock','inv_rawmats','inv_products',
   'inv_vendors','sg_waste','sg_emergency_stock','sg_purchases',
   'sb_inv_purchases','sb_inv_stock','sb_inv_rawmats','sb_inv_products',
   'sb_inv_vendors','sb_sg_waste','sb_sg_emergency_stock'
  ].forEach(k => { try { localStorage.removeItem(k); } catch(e){} });

  showToast('⏳ Supabase se fresh data fetch ho raha hai...');

  // Step 3: Rebuild
  await rebuildStockFromPurchases();

  // Step 4: Re-render
  _invCache['stock'] = null;
  await renderStock();
  showToast('✅ Stock successfully rebuilt!');
  } catch(e) {
    console.error('[SG] doRebuildStock:', e);
    showToast('❌ Rebuild failed: ' + e.message, 'error');
  }
}

async function rebuildStockFromPurchases() {
  try {
  // Fresh data ensure karo — cache bypass
  invInvalidate('purchases');
  invInvalidate('wastes');
  invInvalidate('waste');
  invInvalidate('stock');

  const purchases = await getPurchases();
  const wastes    = await getWastes();

  // Step 0: Consumptions fetch
  let consumptions = [];
  try {
    const { data: cdata } = await _supabase
      .from('inv_consumptions')
      .select('itemId,itemType,qty')
      .limit(10000);
    if(cdata) consumptions = cdata;
  } catch(e) { console.warn('[SG] consumptions fetch failed in rebuild:', e); }

  if(!purchases || !purchases.length) return;

  // Step 1: Purchases se stock ADD karo
  const today_rb = new Date();
  today_rb.setHours(0,0,0,0);

  const stockMap = {};
  purchases.forEach(function(p) {
    if(!p.itemId || !p.itemType) return;

    const key = p.itemType + '_' + p.itemId;

    // Item ko stockMap mein register karo (chahe expired ho)
    if(!stockMap[key]) {
      stockMap[key] = {
        stock_key: key,
        type: p.itemType,
        itemId: p.itemId,
        qty: 0,
        lastUpdated: new Date().toLocaleString('en-IN')
      };
    }

    // Expired batch ki qty add mat karo — lekin item register rahega
    if(p.expDate && p.expDate.trim()) {
      let expD;
      const raw = p.expDate.trim();
      if(/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const parts = raw.split('/');
        expD = new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
      } else if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        expD = new Date(raw);
      } else {
        expD = new Date(raw);
      }
      if(!isNaN(expD.getTime())) {
        expD.setHours(0,0,0,0);
        if(expD < today_rb) return; // Expired batch — qty skip
      }
    }

    stockMap[key].qty += parseFloat(p.qty) || 0;
  });

  // Step 2: Waste entries se MINUS karo
  wastes.forEach(function(w) {
    if(!w.itemId || !w.type) return;
    const key = w.type + '_' + w.itemId;
    if(stockMap[key]) {
      stockMap[key].qty -= parseFloat(w.qty) || 0;
      stockMap[key].lastUpdated = w.addedAt || new Date().toLocaleString('en-IN');
    }
  });

  // Step 3: Recipe consumptions se MINUS karo
  consumptions.forEach(function(c) {
    if(!c.itemId || !c.itemType) return;
    const key = c.itemType + '_' + c.itemId;
    if(stockMap[key]) {
      stockMap[key].qty -= parseFloat(c.qty) || 0;
    }
  });

  // Step 4: Negative qty 0 karo
  Object.values(stockMap).forEach(function(s) {
    if(s.qty < 0) s.qty = 0;
  });

  // Step 5: Save to Supabase + localStorage
  const stockArr = Object.values(stockMap);
  if(stockArr.length) {
    try {
      await _supabase.from('inv_stock').delete().neq('stock_key','__none__');
    } catch(e) { console.warn('Stock clear failed:', e); }

    try {
      await sbUpsertInv('inv_stock', stockArr, 'stock_key');
      localStorage.setItem('sb_inv_stock', JSON.stringify(stockArr));
      _invCache['stock'] = null;
      console.log('Stock rebuilt:', stockArr.length, 'items');
    } catch(e) {
      console.error('Stock rebuild save failed:', e);
      localStorage.setItem('sb_inv_stock', JSON.stringify(stockArr));
      _invCache['stock'] = null;
    }
  }
  } catch(_e) { console.error("[SG] rebuildStockFromPurchases:", _e); }
}

// ============================================================
// AUTO-WASTE: Company Products jo expire ho gaye
// Sirf solid/liquid type items (Company Products) ke liye
// Current stock jo bacha hai wahi waste mein jayega
// ============================================================
async function autoExpireCompanyProducts() {
  try {
  const today = new Date();
  const tY = today.getFullYear();
  const tM = today.getMonth() + 1; // 1-12
  const tD = today.getDate();

  // Helper: check if purchase is expired per aapka logic
  function isPurchaseExpired(expDate) {
    if(!expDate || !expDate.trim()) return false;
    let d, m, y;
    const raw = expDate.trim();
    if(/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const parts = raw.split('/');
      d = parseInt(parts[0]); m = parseInt(parts[1]); y = parseInt(parts[2]);
    } else if(/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split('-');
      y = parseInt(parts[0]); m = parseInt(parts[1]); d = parseInt(parts[2]);
    } else return false;

    if(isNaN(y)||isNaN(m)||isNaN(d)) return false;

    // Step 3: Year compare
    if(y < tY) return true;   // expire YYYY < current YYYY → expired
    if(y > tY) return false;  // expire YYYY > current YYYY → not expired
    // y === tY → check month
    if(m < tM) return true;   // expire MM < current MM → expired
    if(m > tM) return false;  // expire MM > current MM → not expired
    // m === tM → check day
    if(d < tD) return true;   // expire DD < current DD → expired
    return false;              // expire DD = current DD or > → not expired
  }

  // Step 1: Get all data
  const purchases  = await getPurchases();
  const wastes     = await getWastes();
  const _prods     = await getProducts();
  const _rawmts    = await getRawmats();
  const stock      = await getStock();

  // Already auto-wasted purchase IDs (from notes field)
  const wastedPurchaseIds = new Set();
  wastes.forEach(w => {
    if(w.reason && w.reason === 'Auto - Expired' && w.notes) {
      const match = w.notes.match(/Purchase\s+(PUR\w+)/i);
      if(match) wastedPurchaseIds.add(match[1]);
    }
  });

  const now = new Date();
  let autoWasteCount = 0;
  const newWasteEntries = [];

  for(const p of purchases) {
    // Step 2: Check type — sirf solid/liquid (Company Products)
    if(p.itemType !== 'solid' && p.itemType !== 'liquid') continue;

    // Step 3: Check expire date per exact logic
    if(!isPurchaseExpired(p.expDate)) continue;

    // Step 4: Check qty
    const purchaseQty = parseFloat(p.qty) || 0;
    if(purchaseQty <= 0) continue;

    // Step 5: Check purchase ID — already wasted?
    if(wastedPurchaseIds.has(p.id)) continue;

    // Step 6: Check item name
    if(!p.itemName || !p.itemName.trim()) continue;

    // Step 7 & 8: Go to product — check purchase item = product name
    const matchedProduct = _prods.find(function(pr) {
      return pr.name === p.itemName || pr.id === p.itemId;
    });
    if(!matchedProduct) continue; // Product nahi mila — skip

    // Step 9: Get product ID
    const productId = matchedProduct.id;
    const productType = matchedProduct.type || p.itemType;

    // Step 10 & 11: Go to stock — check purchase type = stock type
    const stockKey = productType + '_' + productId;
    const stockEntry = stock[stockKey];
    if(!stockEntry) continue; // Stock entry nahi mili — skip

    // Step 12: Check product item = stock item
    if(stockEntry.itemId !== productId) continue;

    // Step 13: Calculate waste qty = current stock - purchase qty
    const currentStock = parseFloat(stockEntry.qty) || 0;
    const wasteQty = Math.min(purchaseQty, currentStock); // stock se zyada waste nahi
    if(wasteQty <= 0) continue;

    // Cost calculate karo — multiple fallbacks
    let purchasePrice = parseFloat(p.price) || 0;
    // price field zero ya missing hai to total/qty se calculate karo
    if(!purchasePrice && p.qty) {
      const purTotal = parseFloat(p.total) || parseFloat(p.subtotal) || 0;
      purchasePrice = purTotal / parseFloat(p.qty);
    }
    const wasteCost = Math.round(wasteQty * purchasePrice * 100) / 100;

    // Waste entry banao
    const wId = 'W_AUTO_' + p.id + '_' + Date.now();
    const unit = getItemUnit(productType, productId, _prods, _rawmts);
    const wasteEntry = {
      id: wId,
      item: p.itemName,
      qty: wasteQty,
      unit: unit,
      reason: 'Auto - Expired',
      date: now.toLocaleString('en-IN'),
      by: 'System',
      type: productType,
      itemId: productId,
      itemName: p.itemName,
      cost: wasteCost,
      approvedBy: 'System',
      notes: 'Auto waste | Purchase ' + p.id + ' expired on ' + p.expDate + ' | Price: ₹' + purchasePrice + '/unit',
      addedBy: 'System',
      addedAt: now.toISOString()
    };

    newWasteEntries.push(wasteEntry);
    wastedPurchaseIds.add(p.id); // Mark as wasted taaki loop mein dobara na ho
    autoWasteCount++;
  }

  if(autoWasteCount > 0) {
    // Supabase mein save karo
    try {
      await sbUpsertInv('sg_waste', newWasteEntries, 'id');
      // Stock update karo
      for(const w of newWasteEntries) {
        await updateStock(w.type, w.itemId, w.qty, 'remove');
      }
      showToast('🗑️ ' + autoWasteCount + ' expired Company Product(s) automatically waste mein add ho gaye!', 'error');
      await renderStock();
      renderWaste();
    } catch(e) {
      console.error('[SG] auto-waste save error:', e);
    }
  }

  } catch(e) { console.error('[SG] autoExpireCompanyProducts:', e); }
}

async function renderStock() {
  try {
  const stock=await getStock();
  const _products = await getProducts();
  const _rawmats = await getRawmats();
  const keys=Object.keys(stock);
  const tbody=document.getElementById('stockTableBody');
  const alertsDiv=document.getElementById('stockAlerts');

  if(!keys.length){
    tbody.innerHTML='<tr><td colspan="7"><div class="empty"><div class="empty-icon">📊</div><p>No stock data yet. Please add purchases first.</p></div></td></tr>';
    alertsDiv.innerHTML='';
    return;
  }

  // Separate counters for each status
  let nilCount=0, minCount=0, avgCount=0, maxCount=0, overstockCount=0, expiredCount=0, expirySoonCount=0;
  let rows='';

  const cols = getColumns('stock').filter(c => !c.hidden);
  const thead = document.querySelector('#inv-stock table thead tr');
  if(thead) {
    thead.innerHTML = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>' + cols.map(c=>'<th>'+c.label+(c.description?' <span title="'+c.description.replace(/"/g,'&quot;')+'" style="cursor:help;font-size:0.78rem;opacity:0.7;">ℹ️</span>':'')+'</th>').join('');
  }

  let _snoIdx = 0;
  keys.forEach(key=>{
    const s=stock[key];
    const name=getItemName(s.type,s.itemId,_products,_rawmats);
    const unit=getItemUnit(s.type,s.itemId,_products,_rawmats);
    const min=getItemMinStock(s.type,s.itemId,_products,_rawmats);
    const thresh = getEffectiveThreshold(s.type, s.itemId);
    const qty = parseFloat(s.qty)||0;
    let statusClass='stock-ok', statusText='🟢 Maximum';
    if(qty===0){statusClass='stock-critical';statusText='⚫ Nil';nilCount++;}
    else if(qty<=thresh.min){statusClass='stock-critical';statusText='🟠 Minimum';minCount++;}
    else if(qty<=thresh.avg){statusClass='stock-low';statusText='🟡 Average';avgCount++;}
    else if(qty>=thresh.overstock){statusClass='stock-overstock';statusText='🔵 Overstock';overstockCount++;}
    else{statusClass='stock-ok';statusText='🟢 Maximum';maxCount++;}
    _snoIdx++;
    const _snoCell='<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">'+_snoIdx+'</td>';
    rows+='<tr>'+_snoCell+cols.map(c=>{
      if(c.field==='name') return '<td><b>'+name+'</b></td>';
      if(c.field==='type') return '<td><span class="status '+(s.type==='rawmat'?'pending':'confirmed')+'">'+(s.type==='rawmat'?'RAWMAT':'COMPANY PRODUCT')+'</span></td>';
      if(c.field==='qty') return '<td style="font-size:1.1rem;font-weight:800;color:var(--fire)">'+s.qty+'</td>';
      if(c.field==='unit') return '<td>'+unit+'</td>';
      if(c.field==='min') return '<td>'+min+'</td>';
      if(c.field==='status') return '<td><span class="'+statusClass+'" style="padding:3px 10px;border-radius:12px;font-size:0.78rem;font-weight:700;">'+statusText+'</span></td>';
      if(c.field==='lastUpdated') return '<td style="font-size:0.78rem;color:var(--muted)">'+(s.lastUpdated||'—')+'</td>';
      var smartS = renderInvCustomCell(s, c, 'stock', key); if(smartS) return smartS;
      return '<td>'+(s[c.field]||'—')+'</td>';
    }).join('')+'</tr>';
  });
  tbody.innerHTML=rows;

  // Check expiry alerts separately
  // Expiry: count unique items (by itemId) not purchase entries
  const purchases=await getPurchases();
  const wastes=await getWastes();
  const today=new Date();
  const expiredItems=new Set();
  const expirySoonItems=new Set();

  // Waste mein jo items hain unka set banao (itemId ya itemName se)
  const wastedItemKeys = new Set();
  wastes.forEach(w=>{
    const wKey = (w.itemId && w.itemId.trim()) ? w.itemId : (w.itemName||'');
    if(wKey) wastedItemKeys.add(wKey);
    // itemName se bhi match karo (backup)
    if(w.itemName && w.itemName.trim()) wastedItemKeys.add(w.itemName.trim());
  });

  purchases.forEach(p=>{
    if(!p.expDate || !p.expDate.trim()) return;
    // Parse DD/MM/YYYY or YYYY-MM-DD both
    let expD;
    const raw = p.expDate.trim();
    if(/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
      const parts = raw.split('/');
      expD = new Date(parts[2]+'-'+parts[1]+'-'+parts[0]);
    } else {
      expD = new Date(raw);
    }
    if(isNaN(expD.getTime())) return;
    const uniqueKey = (p.itemId && p.itemId.trim()) ? p.itemId : (p.itemName||'unk');
    if(!uniqueKey || uniqueKey==='unk') return;
    const diff = Math.ceil((expD - today)/(1000*60*60*24));
    if(diff<0) {
      // Agar waste entry ho chuki hai toh expired count mein mat dalo
      const alreadyWasted = wastedItemKeys.has(uniqueKey) || wastedItemKeys.has(p.itemName||'');
      if(!alreadyWasted) expiredItems.add(uniqueKey);
    }
    else if(diff<=7) expirySoonItems.add(uniqueKey);
  });
  expiredCount = expiredItems.size;
  expirySoonCount = expirySoonItems.size;

  alertsDiv.innerHTML=`
    <div class="alert-card danger" style="border-left:4px solid #c62828;">
      <div style="font-size:1.5rem;font-weight:800;color:#c62828">${nilCount}</div>
      <div style="font-size:0.8rem;color:var(--muted);">⚫ Nil (Out of Stock)</div>
    </div>
    <div class="alert-card" style="border-left:4px solid #e65100;">
      <div style="font-size:1.5rem;font-weight:800;color:#e65100">${minCount}</div>
      <div style="font-size:0.8rem;color:var(--muted);">🟠 Minimum</div>
    </div>
    <div class="alert-card warn" style="border-left:4px solid var(--warning);">
      <div style="font-size:1.5rem;font-weight:800;color:var(--warning)">${avgCount}</div>
      <div style="font-size:0.8rem;color:var(--muted);">🟡 Average</div>
    </div>
    <div class="alert-card" style="border-left:4px solid #2e7d32;">
      <div style="font-size:1.5rem;font-weight:800;color:#2e7d32">${maxCount}</div>
      <div style="font-size:0.8rem;color:var(--muted);">🟢 Maximum</div>
    </div>
    <div class="alert-card" style="border-left:4px solid #1565c0;">
      <div style="font-size:1.5rem;font-weight:800;color:#1565c0">${overstockCount}</div>
      <div style="font-size:0.8rem;color:var(--muted);">🔵 Overstock</div>
    </div>
    <div class="alert-card purple" style="border-left:4px solid #9b59b6;">
      <div style="font-size:1.5rem;font-weight:800;color:#9b59b6">${expirySoonCount}</div>
      <div style="font-size:0.8rem;color:var(--muted);">⏳ Expiry Soon (7 days)</div>
    </div>
    <div class="alert-card" style="border-left:4px solid #c62828;">
      <div style="font-size:1.5rem;font-weight:800;color:#c62828">${expiredCount}</div>
      <div style="font-size:0.8rem;color:var(--muted);">🗓️ Expired Items</div>
    </div>
    <div class="alert-card" style="border-left:4px solid var(--success);">
      <div style="font-size:1.5rem;font-weight:800;color:var(--success)">${keys.length}</div>
      <div style="font-size:0.8rem;color:var(--muted);">📦 Total Items Tracked</div>
    </div>
  `;
  } catch(e) { console.error("[SG] renderStock error:", e); }
}

// --- CONSUMPTION ---
async function loadConsumptionItems() {
  try {
  const type=document.getElementById('cItemType').value;
  const sel=document.getElementById('cItem');
  sel.innerHTML='<option value="">-- Select Item --</option>';
  resetConsumptionAutoFields();
  if(!type) return;
  let items=[];
  if(type==='solid') items=(await getProducts()).filter(p=>p.type==='solid');
  else if(type==='liquid') items=(await getProducts()).filter(p=>p.type==='liquid');
  else items=await getRawmats();
  items.forEach(it=>{const o=document.createElement('option');o.value=it.id;o.textContent=it.name;sel.appendChild(o);});
  } catch(_e) { console.error("[SG] loadConsumptionItems:", _e); }
}

// ============================================================
// RECORD USAGE — AUTO BATCH + LOCATION MATCHING
// Item + Quantity + Per-Unit-Weight ke basis par backend mein
// purchase batches check karke sahi HRN/Godown/Room/Rack/Column/Row
// automatically fill kar deta hai.
// ============================================================

// "100 gram", "1 kg", "500 ml", "1.5 litre" jaise text ko ek
// common base unit (gram ya ml) ke number mein convert karta hai
// taaki do alag-alag likhe hue weights compare ho sakein
function parseWeightToBase(str) {
  if(!str) return null;
  const s = String(str).trim().toLowerCase();
  const m = s.match(/^([\d.]+)\s*([a-z]*)$/);
  if(!m) return null;
  const num = parseFloat(m[1]);
  if(isNaN(num)) return null;
  let unit = (m[2]||'').trim();
  if(!unit) unit = 'g'; // unit nahi likha to gram/piece man lo
  if(unit==='kg'||unit==='kgs') return num*1000;
  if(unit==='g'||unit==='gm'||unit==='gram'||unit==='grams') return num;
  if(unit==='l'||unit==='ltr'||unit==='litre'||unit==='liter'||unit==='litres'||unit==='liters') return num*1000;
  if(unit==='ml'||unit==='mls') return num;
  return num; // anjaan unit — raw number se hi compare karo
}

// Modal khulte/item-change hote waqt auto-filled fields clear karo
function resetConsumptionAutoFields() {
  try {
  ['cMatchPurchaseId','cMatchHRN','cMatchGodown','cMatchRoom','cMatchRack','cMatchColumn','cMatchRow'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value='';
  });
  const status = document.getElementById('cMatchStatus');
  if(status) { status.style.display='none'; status.innerHTML=''; }
  const qtyEl = document.getElementById('cQty');
  if(qtyEl) qtyEl.style.outline='';
  } catch(_e) { console.error("[SG] resetConsumptionAutoFields:", _e); }
}

// Item Type + Item + Quantity + Per-Weight teeno bharte hi
// backend (purchases + locations) check karke best matching
// batch dhoondh ke uski location auto-fill kar deta hai
async function onConsumptionMatchInputs() {
  try {
  const itemType = document.getElementById('cItemType').value;
  const itemId   = document.getElementById('cItem').value;
  const perWt    = document.getElementById('cPerWeight').value.trim();
  resetConsumptionAutoFields();
  if(!itemType || !itemId || !perWt) return;

  const wanted = parseWeightToBase(perWt);
  if(wanted===null) return;

  const allPurchases = await getPurchases();
  const today = new Date(); today.setHours(0,0,0,0);

  // Sirf isi item ki, stock bachi hui, non-expired batches
  const candidates = allPurchases.filter(p => {
    if(p.itemType !== itemType || String(p.itemId) !== String(itemId)) return false;
    const avail = (p.remainingQty!==undefined && p.remainingQty!==null && p.remainingQty!=='') ? parseFloat(p.remainingQty) : parseFloat(p.qty);
    if(!avail || avail <= 0) return false;
    if(p.expDate) {
      const ed = new Date(p.expDate);
      if(!isNaN(ed.getTime())) { ed.setHours(0,0,0,0); if(ed < today) return false; }
    }
    return true;
  }).map(p => ({ p, base: parseWeightToBase(p.unitWt) })).filter(x => x.base !== null);

  if(!candidates.length) { showConsumptionMatchStatus('none', perWt); return; }

  // 1) Exact weight match — sabse purani date wali (FIFO) batch lo
  const exact = candidates.filter(c => Math.abs(c.base - wanted) < 0.01)
                           .sort((a,b)=> new Date(a.p.date) - new Date(b.p.date));
  let chosen=null, matchType='';

  if(exact.length) { chosen = exact[0].p; matchType='exact'; }
  else {
    // 2) Requested se chhoti weight wali, sabse bada wala (closest niche)
    const below = candidates.filter(c => c.base < wanted).sort((a,b)=> b.base - a.base);
    if(below.length) { chosen = below[0].p; matchType='below'; }
    else {
      // 3) Requested se badi weight wali, sabse chhota wala (closest upar)
      const above = candidates.filter(c => c.base > wanted).sort((a,b)=> a.base - b.base);
      if(above.length) { chosen = above[0].p; matchType='above'; }
    }
  }

  if(!chosen) { showConsumptionMatchStatus('none', perWt); return; }

  // Matched purchase ki storage location dhoondo (godown/room/rack/column/row)
  const locations = await getLocations();
  const matchedLocs = (locations||[]).filter(l => l.purchaseId === chosen.id);
  const loc = matchedLocs.sort((a,b)=> (parseFloat(b.qty)||0)-(parseFloat(a.qty)||0))[0];

  document.getElementById('cMatchPurchaseId').value = chosen.id || '—';
  // Raw Material ke liye HRN na ho to koi baat nahi — blank/'—' chalega
  document.getElementById('cMatchHRN').value = chosen.batch || '—';
  document.getElementById('cMatchGodown').value = loc?.godown || '—';
  document.getElementById('cMatchRoom').value   = loc?.room   || '—';
  document.getElementById('cMatchRack').value   = loc?.rack   || '—';
  document.getElementById('cMatchColumn').value = loc?.column || '—';
  document.getElementById('cMatchRow').value    = loc?.row    || '—';

  showConsumptionMatchStatus(matchType, perWt, chosen);
  } catch(_e) { console.error("[SG] onConsumptionMatchInputs:", _e); }
}

function showConsumptionMatchStatus(type, perWt, chosen) {
  try {
  const status = document.getElementById('cMatchStatus');
  const qtyEl  = document.getElementById('cQty');
  if(!status) return;
  status.style.display='block';
  if(type==='exact') {
    if(qtyEl) qtyEl.style.outline='';
    status.innerHTML = `<div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:8px 12px;font-size:0.8rem;color:#2e7d32;">✅ Exact match mil gaya — ${perWt} wali batch (Purchase ID: ${chosen.id})</div>`;
  } else if(type==='below') {
    if(qtyEl) qtyEl.style.outline='2px solid #ff9800';
    status.innerHTML = `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:8px 12px;font-size:0.8rem;color:#e65100;">⚠️ ${perWt} ka exact match nahi mila — isse chhoti weight wali batch (${chosen.unitWt}) select hui hai. <b>Quantity number adjust kar sakte ho.</b></div>`;
  } else if(type==='above') {
    if(qtyEl) qtyEl.style.outline='2px solid #ff9800';
    status.innerHTML = `<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:8px 12px;font-size:0.8rem;color:#e65100;">⚠️ ${perWt} ka exact match nahi mila — isse badi weight wali batch (${chosen.unitWt}) select hui hai. <b>Quantity number adjust kar sakte ho.</b></div>`;
  } else {
    if(qtyEl) qtyEl.style.outline='';
    status.innerHTML = `<div style="background:#ffebee;border:1px solid #ef9a9a;border-radius:8px;padding:8px 12px;font-size:0.8rem;color:#c62828;">❌ Iss weight (${perWt}) ki koi batch stock mein nahi mili. Purchase entry check karo.</div>`;
  }
  } catch(_e) { console.error("[SG] showConsumptionMatchStatus:", _e); }
}


async function saveConsumption() {
  try {
  const date=document.getElementById('cDate').value;
  const time=document.getElementById('cAutoDateTime').textContent || '';
  const type=document.getElementById('cItemType').value;
  const itemId=document.getElementById('cItem').value;
  const qty=parseFloat(document.getElementById('cQty').value)||0;
  const perWeight=document.getElementById('cPerWeight').value.trim();
  if(!date||!type||!itemId||!qty){showToast('Please fill all required fields','error');return;}

  const _products = await getProducts();
  const _rawmats  = await getRawmats();

  const matchPurchaseId = document.getElementById('cMatchPurchaseId').value || '';
  const matchHRN     = document.getElementById('cMatchHRN').value || '';
  const matchGodown  = document.getElementById('cMatchGodown').value || '';
  const matchRoom    = document.getElementById('cMatchRoom').value || '';
  const matchRack    = document.getElementById('cMatchRack').value || '';
  const matchColumn  = document.getElementById('cMatchColumn').value || '';
  const matchRow     = document.getElementById('cMatchRow').value || '';

  const consumption={
    id:'C'+Date.now(), date, time, type, itemId,
    itemName:getItemName(type,itemId,_products,_rawmats), qty, perWeight,
    purchaseId: matchPurchaseId, hrn: matchHRN,
    godown: matchGodown, room: matchRoom, rack: matchRack, column: matchColumn, row: matchRow,
    purpose:document.getElementById('cPurpose').value,
    recordedBy:document.getElementById('cRecordedBy').value||currentUser?.name,
    approvedBy:document.getElementById('cApprovedBy').value||'',
    handoverTo:document.getElementById('cHandoverTo').value||'',
    source:'manual',
    addedAt:new Date().toLocaleString('en-IN')
  };
  const consumptions=await getConsumptions(); consumptions.unshift(consumption);
  setInvData('consumptions',consumptions);
  await updateStock(type,itemId,qty,'remove');

  // Matched purchase batch ki remainingQty bhi ghatao (FIFO accuracy ke liye)
  if(matchPurchaseId) {
    try {
      const allPurchases = await getPurchases();
      const matchedP = allPurchases.find(p=>p.id===matchPurchaseId);
      if(matchedP) {
        const curRemaining = (matchedP.remainingQty!==undefined && matchedP.remainingQty!==null && matchedP.remainingQty!=='') ? parseFloat(matchedP.remainingQty) : parseFloat(matchedP.qty)||0;
        const newRemaining = Math.max(0, curRemaining - qty);
        await _supabase.from('inv_purchases').update({ remainingQty: newRemaining }).eq('id', matchPurchaseId);
      }
    } catch(e) { console.warn('[SG] saveConsumption remainingQty update fail:', e); }
  }

  closeModal('invConsumptionModal');
  renderStock();
  showToast('✅ Usage recorded successfully!' + (matchPurchaseId ? ' (Batch: '+matchHRN+')' : ''));
  } catch(_e) { console.error("[SG] saveConsumption:", _e); }
}

// --- WASTE ---
async function loadWasteItems() {
  try {
  const type=document.getElementById('wItemType').value;
  const sel=document.getElementById('wItem');
  sel.innerHTML='<option value="">-- Select Item --</option>';
  if(!type) return;
  let items=[];
  if(type==='solid') items=(await getProducts()).filter(p=>p.type==='solid');
  else if(type==='liquid') items=(await getProducts()).filter(p=>p.type==='liquid');
  else items=await getRawmats();
  if(!items || !Array.isArray(items)) items=[];
  items.forEach(it=>{const o=document.createElement('option');o.value=it.id;o.textContent=it.name;sel.appendChild(o);});
  } catch(_e) { console.error("[SG] loadWasteItems:", _e); }
}

async function saveWaste() {
  try {
  const date=document.getElementById('wDate').value;
  const type=document.getElementById('wItemType').value;
  const itemId=document.getElementById('wItem').value;
  const qty=parseFloat(document.getElementById('wQty').value)||0;
  const reason=document.getElementById('wReason').value;
  if(!date||!type||!itemId||!qty){showToast('Please fill all required fields','error');return;}
  // Products aur rawmats pehle fetch karo taaki naam sahi aaye
  const _products = await getProducts();
  const _rawmats  = await getRawmats();
  // Modal khulne ka exact timestamp use karo — sort ke liye ID aur addedAt dono consistent rahenge
  const _wOpenedAt = document.getElementById('invWasteModal')?.dataset?.openedAt;
  const _wTs = _wOpenedAt ? new Date(_wOpenedAt) : new Date();
  const waste={
    id:'W'+_wTs.getTime(), date, type, itemId,
    itemName:getItemName(type,itemId,_products,_rawmats), qty,
    unit:getItemUnit(type,itemId,_products,_rawmats),
    reason, cost:parseFloat(document.getElementById('wCost').value)||0,
    approvedBy:document.getElementById('wApproved').value,
    notes:document.getElementById('wNotes').value,
    addedBy:currentUser?.name||'Admin',
    addedAt:_wTs.toISOString()
  };
  const wastes=await getWastes(); wastes.unshift(waste);
  setInvData('wastes',wastes);
  await updateStock(type,itemId,qty,'remove');
  closeModal('invWasteModal');
  renderWaste();
  renderStock();
  showToast('✅ Waste entry saved successfully!');
  } catch(_e) { console.error("[SG] saveWaste:", _e); }
}

async function renderWaste() {
  try {
  const allWastes = await getWastes();
  // Sort: addedAt full datetime — ISO aur Indian locale dono handle karo
  function parseWasteTime(w) {
    function parse(s) {
      if(!s) return 0;
      s = String(s).trim();
      // ISO format detect: starts with YYYY- (e.g. 2026-06-25T13:34:16.000Z)
      if(/^\d{4}-/.test(s)) {
        const t = new Date(s);
        return isNaN(t.getTime()) ? 0 : t.getTime();
      }
      // Indian locale format: DD/MM/YYYY, H:MM:SS am/pm
      // e.g. "25/6/2026, 1:34:16 pm" or "10/6/2026, 9:12:47 pm"
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}),?\s*(\d{1,2}):(\d{2}):?(\d{2})?\s*(am|pm)?/i);
      if(m) {
        let h = parseInt(m[4]);
        const mn = parseInt(m[5])||0, sc = parseInt(m[6])||0;
        if(m[7] && m[7].toLowerCase()==='pm' && h!==12) h+=12;
        if(m[7] && m[7].toLowerCase()==='am' && h===12) h=0;
        // m[1]=day, m[2]=month, m[3]=year (Indian format DD/MM/YYYY)
        return new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]), h, mn, sc).getTime();
      }
      return 0;
    }
    // addedAt try first (most accurate)
    const fromAddedAt = parse(w.addedAt);
    if(fromAddedAt > 0) return fromAddedAt;
    // ID timestamp fallback (W1750823105000)
    const idNum = parseInt((w.id||'').replace(/\D/g,''))||0;
    if(idNum > 1000000000000) return idNum;
    // date field last resort
    return parse(w.date);
  }
  const wastes = [...allWastes].sort((a,b) => parseWasteTime(b) - parseWasteTime(a));
  const tbody=document.getElementById('wasteTableBody');
  if(!wastes.length){tbody.innerHTML='<tr><td colspan="8"><div class="empty"><div class="empty-icon">🗑️</div><p>No waste entries found</p></div></td></tr>';return;}
  tbody.innerHTML=wastes.map((w,idx)=>{
    let displayDT = w.date || '—';
    if(w.addedAt) {
      const t = new Date(w.addedAt);
      if(!isNaN(t.getTime())) {
        displayDT = t.toLocaleDateString('en-IN') + ', ' + t.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      } else {
        displayDT = w.addedAt;
      }
    }
    return `
    <tr>
      <td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${idx+1}</td>
      <td>${displayDT}</td>
      <td><b>${escHtml(w.itemName)}</b></td>
      <td>${w.qty}</td>
      <td>${w.unit}</td>
      <td><span class="status cancelled">${escHtml(w.reason)}</span></td>
      <td><b style="color:var(--danger)">₹${w.cost||0}</b></td>
      <td>${w.approvedBy||'—'}</td>
    </tr>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderWaste:", _e); }
}

// --- REPORTS ---
async function renderInvReports() {
  try {
  if(!invCanReports()&&currentUser?.role!=='Admin'){
    document.getElementById('invReportCards').innerHTML='<div class="empty"><div class="empty-icon">🔒</div><p>No permission to view reports - Access Denied</p></div>';
    return;
  }
  const purchases=await getPurchases();
  const wastes=await getWastes();
  const totalPurchaseAmt=purchases.reduce((s,p)=>s+p.total,0);
  const totalWasteCost=wastes.reduce((s,w)=>s+w.cost,0);
  const pendingPayments=purchases.filter(p=>p.payStatus==='Pending').reduce((s,p)=>s+p.total,0);
  const today=new Date();
  const expiringItems=purchases.filter(p=>{
    if(!p.expDate) return false;
    const diff=Math.ceil((new Date(p.expDate)-today)/(1000*60*60*24));
    return diff>=0&&diff<=30;
  }).length;

  document.getElementById('invReportCards').innerHTML=`
    <div class="stat-card orange" style="cursor:pointer;" onclick="showInvReport('purchases')">
      <div class="stat-icon">🧾</div>
      <div class="stat-num">₹${totalPurchaseAmt.toLocaleString('en-IN')}</div>
      <div class="stat-label">Total Purchase Amount</div>
    </div>
    <div class="stat-card gold" style="cursor:pointer;" onclick="showInvReport('pending')">
      <div class="stat-icon">⏳</div>
      <div class="stat-num">₹${pendingPayments.toLocaleString('en-IN')}</div>
      <div class="stat-label">Pending Payments</div>
    </div>
    <div class="stat-card" style="cursor:pointer;border-top:4px solid var(--danger);" onclick="showInvReport('waste')">
      <div class="stat-icon">🗑️</div>
      <div class="stat-num">₹${totalWasteCost.toLocaleString('en-IN')}</div>
      <div class="stat-label">Total Waste Cost</div>
    </div>
    <div class="stat-card" style="cursor:pointer;border-top:4px solid #9b59b6;" onclick="showInvReport('expiry')">
      <div class="stat-icon">⚠️</div>
      <div class="stat-num">${expiringItems}</div>
      <div class="stat-label">Expiring in 30 Days</div>
    </div>
    <div class="stat-card green" style="cursor:pointer;" onclick="showInvReport('vendor')">
      <div class="stat-icon">🏪</div>
      <div class="stat-num" id="vendorStatCount">—</div>
      <div class="stat-label">Total Vendors — Click for Report</div>
    </div>
    <div class="stat-card blue" style="cursor:pointer;" onclick="showInvReport('stock')">
      <div class="stat-icon">📦</div>
      <div class="stat-num" id="stockStatCount">—</div>
      <div class="stat-label">Items in Stock — Click for Report</div>
    </div>
  `;
  // Async update stat counts
  getStock().then(stock => {
    const el = document.getElementById('stockStatCount');
    if(el) el.textContent = Object.keys(stock).length;
  });
  getVendors().then(vendors => {
    const el = document.getElementById('vendorStatCount');
    if(el) el.textContent = vendors.length;
  });
  } catch(e) { console.error("[SG] renderInvReports error:", e); }
}

async function showInvReport(type) {
  try {
  const detail=document.getElementById('invReportDetail');
  detail.style.display='block';
  const head=document.getElementById('invReportHead');
  const body=document.getElementById('invReportBody');
  const title=document.getElementById('invReportTitle');

  if(type==='purchases') {
    title.textContent='🧾 Purchase Report';
    head.innerHTML='<tr><th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;min-width:50px;">S.No.</th><th>Date</th><th>Vendor</th><th>Item</th><th>Qty</th><th>Amount</th><th>Payment</th><th>Status</th></tr>';
    const _purData = await getPurchases();
    body.innerHTML=_purData.map((p,i)=>`<tr><td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${i+1}</td><td>${p.date}</td><td>${escHtml(p.vendorName||'—')}</td><td>${escHtml(p.itemName)}</td><td>${p.qty}</td><td><b style="color:var(--fire)">₹${p.total}</b></td><td>${p.payMode}</td><td><span class="status ${p.payStatus==='Paid'?'confirmed':'pending'}">${p.payStatus}</span></td></tr>`).join('');
  }
  else if(type==='pending') {
    title.textContent='⏳ Pending Payment Report';
    head.innerHTML='<tr><th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;min-width:50px;">S.No.</th><th>Date</th><th>Vendor</th><th>Item</th><th>Amount</th><th>Payment Mode</th></tr>';
    const _purPending = await getPurchases();
    body.innerHTML=_purPending.filter(p=>p.payStatus==='Pending'||p.payStatus==='Partial').map((p,i)=>`<tr><td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${i+1}</td><td>${p.date}</td><td>${escHtml(p.vendorName||'—')}</td><td>${escHtml(p.itemName)}</td><td><b style="color:var(--danger)">₹${p.total}</b></td><td>${p.payMode}</td></tr>`).join('');
  }
  else if(type==='waste') {
    title.textContent='🗑️ Waste Report';
    head.innerHTML='<tr><th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;min-width:50px;">S.No.</th><th>Date</th><th>Item</th><th>Qty</th><th>Reason</th><th>Cost</th><th>Approved By</th></tr>';
    body.innerHTML=getWastes().map((w,i)=>`<tr><td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${i+1}</td><td>${w.date}</td><td>${escHtml(w.itemName)}</td><td>${w.qty} ${w.unit}</td><td>${escHtml(w.reason)}</td><td><b style="color:var(--danger)">₹${w.cost||0}</b></td><td>${w.approvedBy||'—'}</td></tr>`).join('');
  }
  else if(type==='expiry') {
    title.textContent='⚠️ Expiry Alert Report (30 Days)';
    head.innerHTML='<tr><th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;min-width:50px;">S.No.</th><th>Item</th><th>Vendor</th><th>Expiry Date</th><th>Days Left</th><th>Batch</th></tr>';
    const today=new Date();
    const _purExp = await getPurchases();
    body.innerHTML=_purExp.filter(p=>{
      if(!p.expDate) return false;
      const diff=Math.ceil((new Date(p.expDate)-today)/(1000*60*60*24));
      return diff<=30;
    }).map((p,i)=>{
      const diff=Math.ceil((new Date(p.expDate)-today)/(1000*60*60*24));
      return `<tr><td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${i+1}</td><td><b>${escHtml(p.itemName)}</b></td><td>${escHtml(p.vendorName||'—')}</td><td>${p.expDate}</td><td style="color:${diff<=0?'var(--danger)':diff<=7?'var(--warning)':'var(--success)'}"><b>${diff<=0?'EXPIRED':diff+' days'}</b></td><td>${p.batch||'—'}</td></tr>`;
    }).join('');
  }
  else if(type==='vendor') {
    title.textContent='🏪 Vendor Report';
    head.innerHTML='<tr><th>Vendor</th><th>Company</th><th>Contact</th><th>Total Purchases</th><th>Total Amount</th><th>Pending</th></tr>';
    const purchases=await getPurchases();
    const _vens=await getVendors();
    head.innerHTML='<tr><th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;min-width:50px;">S.No.</th><th>Vendor</th><th>Company</th><th>Contact</th><th>Total Purchases</th><th>Total Amount</th><th>Pending</th></tr>';
    body.innerHTML=_vens.map((v,i)=>{const vPurchases=purchases.filter(p=>p.vendorId===v.id);const total=vPurchases.reduce((s,p)=>s+p.total,0);const pending=vPurchases.filter(p=>p.payStatus==='Pending').reduce((s,p)=>s+p.total,0);return `<tr><td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${i+1}</td><td><b>${escHtml(v.name)}</b></td><td>${escHtml(v.company||'—')}</td><td>${escHtml(v.contact)}</td><td>${vPurchases.length}</td><td><b style="color:var(--fire)">₹${total}</b></td><td style="color:var(--danger)">₹${pending}</td></tr>`;}).join('');
  }
  else if(type==='stock') {
    title.textContent='📦 Current Stock Report';
    head.innerHTML='<tr><th>Item</th><th>Type</th><th>Stock</th><th>Unit</th><th>Min Level</th><th>Status</th></tr>';
    const stock=await getStock();
    head.innerHTML='<tr><th style="position:sticky;left:0;z-index:4;background:#faf7f4;border-right:2px solid #e8d5c8;text-align:center;min-width:50px;">S.No.</th><th>Item</th><th>Type</th><th>Stock</th><th>Unit</th><th>Min Level</th><th>Status</th></tr>';
    body.innerHTML=Object.values(stock).map((s,i)=>{const name=getItemName(s.type,s.itemId,_products,_rawmats);const unit=getItemUnit(s.type,s.itemId,_products,_rawmats);const min=getItemMinStock(s.type,s.itemId,_products,_rawmats);let status='✅ OK';if(s.qty===0)status='❌ Out';else if(s.qty<=min*0.5)status='🚨 Critical';else if(s.qty<=min)status='⚠️ Low';return `<tr><td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${i+1}</td><td><b>${name}</b></td><td>${s.type}</td><td><b style="color:var(--fire)">${s.qty}</b></td><td>${unit}</td><td>${min}</td><td>${status}</td></tr>`;}).join('');
  }
  detail.scrollIntoView({behavior:'smooth'});
  } catch(_e) { console.error("[SG] showInvReport:", _e); }
}

// --- GENERIC DELETE ---
async function deleteInvItem(key, id, callback) {
  try {
  if(!confirm('Are you sure you want to delete?')) return;
  const items=getInvData(key).filter(x=>x.id!==id);
  setInvData(key,items);
  // Supabase table map
  const tableMap = { vendors:'vendors', products:'inv_products', rawmats:'inv_rawmats', purchases:'inv_purchases', locations:'inv_locations' };
  const tbl = tableMap[key];
  if(tbl) {
    try { await _supabase.from(tbl).delete().eq('id',id); } catch(e) { console.warn('[SG] deleteInvItem Supabase:',e); }
  }
  if(callback) callback();
  showToast('Deleted successfully!');
  } catch(_e) { console.error("[SG] deleteInvItem:", _e); }
}

// --- RENDER INVENTORY (called from showDash) ---
function renderInventory() {
  try {
  // Show/hide buttons based on permissions
  const btns={
    addVendorBtn: invCanVendor(),
    addSolidBtn: invCanVendor(),
    addLiquidBtn: invCanVendor(),
    addRawBtn: invCanVendor(),
    addPurchaseBtn: invCanPurchase(),
    addConsumptionBtn: invCanStock(),
    addWasteBtn: invCanWaste(),
  };
  Object.entries(btns).forEach(([id,show])=>{
    const el=document.getElementById(id);
    if(el) el.style.display=show?'':'none';
  });
  renderVendors();
  } catch(_e) { console.error("[SG] renderInventory:", _e); }
}


// =============================================
// ======= ROLE TEMPLATES SYSTEM ===============
// =============================================

const RESTAURANT_TYPES = {
  small: {
    label: '🏪 Small Restaurant',
    desc: '1 outlet, 5-15 staff',
    roles: [
      {
        role: 'Manager',
        desc: 'Manage all operations',
        color: '#e74c3c',
        perms: [
          'View Orders - Basic','View Orders - Mobile','View Orders - Email',
          'Status - Pending - Home Delivery','Status - Pending - Takeaway','Status - Pending - Dine-In','Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In','Status - Cancelled - Home Delivery','Status - Cancelled - Takeaway','Status - Cancelled - Dine-In',
          'View Customers','View Customers - Mobile','View Customers - Email',
          'Delete Orders',
          'Menu - Change Image','Menu - Edit Dish Name','Menu - Edit Description','Menu - Edit Emoji','Menu - Edit Price','Menu - Edit Category','Menu - Edit Type','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish',
          'Inventory - View','Inventory - Manage Vendors','Inventory - Add Purchase','Inventory - Manage Stock','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Cashier',
        desc: 'Handles billing and payments',
        color: '#f39c12',
        perms: [
          'View Orders - Basic',
          'Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In',
          'View Customers','View Customers - Email'
        ]
      },
      {
        role: 'Kitchen Staff',
        desc: 'Prepares orders',
        color: '#e67e22',
        perms: [
          'View Orders - Basic',
          'Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In',
          'Inventory - View'
        ]
      },
      {
        role: 'Delivery Staff',
        desc: 'Delivers orders to customers',
        color: '#27ae60',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Delivered'
        ]
      },
      {
        role: 'Waiter',
        desc: 'Serves customers at tables',
        color: '#1abc9c',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Delivered',
          'Table - View','Table - Take Order'
        ]
      }
    ]
  },
  middle: {
    label: '🏬 Middle Restaurant',
    desc: '1-3 outlets, 15-50 staff',
    roles: [
      {
        role: 'General Manager',
        desc: 'Oversees all branches',
        color: '#8e44ad',
        perms: [
          'View Orders - Basic','View Orders - Mobile','View Orders - Email',
          'Status - Pending - Home Delivery','Status - Pending - Takeaway','Status - Pending - Dine-In','Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In','Status - Cancelled - Home Delivery','Status - Cancelled - Takeaway','Status - Cancelled - Dine-In',
          'View Customers','View Customers - Mobile','View Customers - Email',
          'Delete Orders',
          'Menu - Change Image','Menu - Edit Dish Name','Menu - Edit Description','Menu - Edit Emoji','Menu - Edit Price','Menu - Edit Category','Menu - Edit Type','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish','Menu - Delete Dish',
          'Staff - View','Staff - Add','Staff - Remove','Staff - Edit Permissions',
          'Inventory - View','Inventory - Manage Vendors','Inventory - Add Purchase','Inventory - Manage Stock','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Branch Manager',
        desc: 'Manages own branch',
        color: '#2980b9',
        perms: [
          'View Orders - Basic','View Orders - Mobile','View Orders - Email',
          'Status - Pending - Home Delivery','Status - Pending - Takeaway','Status - Pending - Dine-In','Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In','Status - Cancelled - Home Delivery','Status - Cancelled - Takeaway','Status - Cancelled - Dine-In',
          'View Customers','View Customers - Mobile','View Customers - Email',
          'Delete Orders',
          'Menu - Change Image','Menu - Edit Dish Name','Menu - Edit Description','Menu - Edit Price','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish',
          'Inventory - View','Inventory - Manage Vendors','Inventory - Add Purchase','Inventory - Manage Stock','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Floor Supervisor',
        desc: 'Supervises daily operations',
        color: '#16a085',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Confirmed','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered',
          'View Customers','View Customers - Mobile',
          'Delete Orders',
          'Inventory - View','Inventory - View Reports'
        ]
      },
      {
        role: 'Head Chef',
        desc: 'Manages kitchen and menu',
        color: '#d35400',
        perms: [
          'View Orders - Basic',
          'Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In',
          'Menu - Change Image','Menu - Edit Dish Name','Menu - Edit Description','Menu - Edit Emoji','Menu - Edit Category','Menu - Edit Type','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish',
          'Inventory - View','Inventory - Manage Stock','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Cashier / Billing',
        desc: 'Handles billing and payments',
        color: '#f39c12',
        perms: [
          'View Orders - Basic',
          'Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In',
          'View Customers','View Customers - Email'
        ]
      },
      {
        role: 'Kitchen Staff',
        desc: 'Prepares orders',
        color: '#e67e22',
        perms: [
          'View Orders - Basic',
          'Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In',
          'Menu - Remove Dish',
          'Inventory - View'
        ]
      },
      {
        role: 'Service Staff / Waiter',
        desc: 'Handles customer service',
        color: '#27ae60',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Delivered'
        ]
      },
      {
        role: 'Delivery Staff',
        desc: 'Delivers orders',
        color: '#1abc9c',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Delivered'
        ]
      }
    ]
  },
  enterprise: {
    label: '🏢 Enterprise Restaurant',
    desc: 'Chain, 3+ outlets, 50+ staff',
    roles: [
      {
        role: 'Operations Head',
        desc: 'Oversees all operations',
        color: '#8e44ad',
        perms: [
          'View Orders - Basic','View Orders - Mobile','View Orders - Email',
          'Status - Pending - Home Delivery','Status - Pending - Takeaway','Status - Pending - Dine-In','Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In','Status - Cancelled - Home Delivery','Status - Cancelled - Takeaway','Status - Cancelled - Dine-In',
          'View Customers','View Customers - Mobile','View Customers - Email',
          'Delete Orders',
          'Menu - Change Image','Menu - Edit Dish Name','Menu - Edit Description','Menu - Edit Emoji','Menu - Edit Price','Menu - Edit Category','Menu - Edit Type','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish','Menu - Delete Dish',
          'Staff - View','Staff - Add','Staff - Remove','Staff - Edit Permissions',
          'Inventory - View','Inventory - Manage Vendors','Inventory - Add Purchase','Inventory - Manage Stock','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Purchase Manager',
        desc: 'Manages vendors and purchases',
        color: '#2c3e50',
        perms: [
          'Inventory - View','Inventory - Manage Vendors','Inventory - Add Purchase','Inventory - View Reports'
        ]
      },
      {
        role: 'Regional Manager',
        desc: 'Oversees branches in the zone',
        color: '#2980b9',
        perms: [
          'View Orders - Basic','View Orders - Mobile','View Orders - Email',
          'Status - Pending - Home Delivery','Status - Pending - Takeaway','Status - Pending - Dine-In','Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In','Status - Cancelled - Home Delivery','Status - Cancelled - Takeaway','Status - Cancelled - Dine-In',
          'View Customers','View Customers - Mobile','View Customers - Email',
          'Delete Orders',
          'Menu - Edit Price','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish',
          'Inventory - View','Inventory - View Reports'
        ]
      },
      {
        role: 'Branch Manager',
        desc: 'Full control of own branch',
        color: '#1a5276',
        perms: [
          'View Orders - Basic','View Orders - Mobile','View Orders - Email',
          'Status - Pending - Home Delivery','Status - Pending - Takeaway','Status - Pending - Dine-In','Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In','Status - Cancelled - Home Delivery','Status - Cancelled - Takeaway','Status - Cancelled - Dine-In',
          'View Customers','View Customers - Mobile','View Customers - Email',
          'Delete Orders',
          'Menu - Change Image','Menu - Edit Dish Name','Menu - Edit Description','Menu - Edit Price','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish',
          'Inventory - View','Inventory - Manage Stock','Inventory - Add Purchase','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Kitchen Manager / Head Chef',
        desc: 'Full control of kitchen and menu',
        color: '#d35400',
        perms: [
          'View Orders - Basic',
          'Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In',
          'Menu - Change Image','Menu - Edit Dish Name','Menu - Edit Description','Menu - Edit Emoji','Menu - Edit Category','Menu - Edit Type','Menu - Edit Timing','Menu - Edit Available Days','Menu - Remove Dish',
          'Inventory - View','Inventory - Manage Stock','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Accounts Manager',
        desc: 'Manages finance and billing',
        color: '#1e8bc3',
        perms: [
          'View Orders - Basic','View Orders - Email',
          'View Customers','View Customers - Email',
          'Inventory - View','Inventory - View Reports'
        ]
      },
      {
        role: 'Floor Supervisor',
        desc: 'Manages daily floor operations',
        color: '#16a085',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Confirmed','Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In','Status - Delivered',
          'View Customers','View Customers - Mobile',
          'Delete Orders',
          'Inventory - View'
        ]
      },
      {
        role: 'Cashier / Billing',
        desc: 'Handles billing and payments',
        color: '#f39c12',
        perms: [
          'View Orders - Basic',
          'Status - Confirmed - Home Delivery','Status - Confirmed - Takeaway','Status - Confirmed - Dine-In','Status - Delivered - Home Delivery','Status - Delivered - Takeaway','Status - Delivered - Dine-In',
          'View Customers','View Customers - Email'
        ]
      },
      {
        role: 'Inventory Incharge',
        desc: 'Manages stock and inventory',
        color: '#6c3483',
        perms: [
          'Inventory - View','Inventory - Add Purchase','Inventory - Manage Stock','Inventory - Waste Entry','Inventory - View Reports'
        ]
      },
      {
        role: 'Senior Kitchen Staff',
        desc: 'Kitchen in senior role',
        color: '#ca6f1e',
        perms: [
          'View Orders - Basic',
          'Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In',
          'Menu - Remove Dish',
          'Inventory - View'
        ]
      },
      {
        role: 'Kitchen Staff',
        desc: 'Prepares orders',
        color: '#e67e22',
        perms: [
          'View Orders - Basic',
          'Status - Preparing - Home Delivery','Status - Preparing - Takeaway','Status - Preparing - Dine-In','Status - Ready - Home Delivery','Status - Ready - Takeaway','Status - Ready - Dine-In',
          'Inventory - View'
        ]
      },
      {
        role: 'Service Staff / Waiter',
        desc: 'Handles customer service',
        color: '#27ae60',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Delivered'
        ]
      },
      {
        role: 'Delivery Staff',
        desc: 'Delivers orders',
        color: '#1abc9c',
        perms: [
          'View Orders - Basic','View Orders - Mobile',
          'Status - Delivered'
        ]
      }
    ]
  }
};

function applyRoleTemplate(restType, roleIndex) {
  try {
  const type = RESTAURANT_TYPES[restType];
  if(!type) return;
  const roleData = type.roles[roleIndex];
  if(!roleData) return;

  // Set role name
  const roleInput = document.getElementById('newStaffRole');
  if(roleInput) roleInput.value = roleData.role;

  // Set color
  const colorInput = document.getElementById('newStaffColor');
  if(colorInput) colorInput.value = roleData.color;

  // Uncheck all first
  document.querySelectorAll('#newStaffPerms input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  // Check permissions from template
  roleData.perms.forEach(perm => {
    const cbId = 'np-' + perm.replace(/ /g,'-');
    const cb = document.getElementById(cbId);
    if(cb) cb.checked = true;
  });

  // Update all group counts
  permGroups.forEach((grp, gi) => {
    updateNCount(gi, grp.perms.length);
  });

  showToast('✅ '+roleData.role+' template applied — customize permissions as needed!');
  } catch(_e) { console.error("[SG] applyRoleTemplate:", _e); }
}

function onRestTypeChange(val) {
  try {
  const roleSelect = document.getElementById('templateRoleSelect');
  const roleDesc = document.getElementById('templateRoleDesc');
  roleSelect.innerHTML = '<option value="">-- Select a role --</option>';
  roleDesc.textContent = '';
  if(!val) return;
  const type = RESTAURANT_TYPES[val];
  if(!type) return;
  type.roles.forEach((r, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = r.role;
    roleSelect.appendChild(o);
  });
  } catch(_e) { console.error("[SG] onRestTypeChange:", _e); }
}

function onRoleTemplateChange(restType, roleIndex) {
  try {
  const roleDesc = document.getElementById('templateRoleDesc');
  if(!restType || roleIndex === '') { roleDesc.textContent=''; return; }
  const type = RESTAURANT_TYPES[restType];
  if(!type) return;
  const r = type.roles[roleIndex];
  if(r) {
    roleDesc.textContent = r.desc + ' — ' + r.perms.length + ' permissions pre-set';
    roleDesc.style.color = r.color;
  }
  } catch(_e) { console.error("[SG] onRoleTemplateChange:", _e); }
}








// =============================================
// ========= CUSTOMER AUTH SYSTEM ==============
// =============================================

let currentCustomer = null;

// Data helpers — now async via Supabase
async function getCustomerAccounts() {
  return await getCustAccountsCached();
}
async function setCustomerAccounts(d) {
  try {
  // Bulk upsert all accounts
  invalidateCustAccountsCache();
  for (const acc of d) {
    await sbUpsertCustAccount(acc).catch(e => console.error('setCustomerAccounts error:', e));
  }
  } catch(_e) { console.error("[SG] setCustomerAccounts:", _e); }
}
function getCustSession() {
  try { return JSON.parse(localStorage.getItem('cust_session')||'null'); } catch(e) { return null; }
}

// Open auth modal
function openAuthModal(tab) {
  try {
  document.getElementById('authOverlay').style.display = 'flex';
  switchAuthTab(tab || 'signin');
  // Clear errors
  ['siError','suError'].forEach(id => {
    const el = document.getElementById(id);
    if(el) { el.style.display='none'; el.textContent=''; }
  });
  } catch(e) { console.error("[SG] openAuthModal error:", e); }
}

function closeAuth() {
  try {
  document.getElementById('authOverlay').style.display = 'none';
  } catch(_e) { console.error("[SG] closeAuth:", _e); }
}

function switchAuthTab(tab) {
  try {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById('tab'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('active');
  document.getElementById('form'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('active');
  } catch(_e) { console.error("[SG] switchAuthTab:", _e); }
}

function toggleAuthVis(id, btn) {
  try {
  const el = document.getElementById(id);
  if(!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
  btn.textContent = el.type === 'password' ? '👁️' : '🙈';
  } catch(_e) { console.error("[SG] toggleAuthVis:", _e); }
}

function showAuthError(formId, msg) {
  try {
  const el = document.getElementById(formId+'Error');
  if(el) { el.textContent = msg; el.style.display = 'block'; }
  } catch(_e) { console.error("[SG] showAuthError:", _e); }
}

// SIGN UP
async function doCustomerSignUp() {
  try {
  const first   = document.getElementById('suFirst').value.trim();
  const last    = document.getElementById('suLast').value.trim();
  const mobile  = document.getElementById('suMobile').value.trim();
  const wa      = document.getElementById('suWhatsapp').value.trim() || mobile;
  const email   = document.getElementById('suEmail').value.trim();
  const pass    = document.getElementById('suPassword').value.trim();
  const confirm = document.getElementById('suConfirm').value.trim();

  // Address fields
  const addrLine    = document.getElementById('suAddrLine')?.value.trim()||'';
  const addrPlace   = document.getElementById('suAddrPlace')?.value.trim()||'';
  const addrCity    = document.getElementById('suAddrCity')?.value.trim()||'';
  const addrState   = document.getElementById('suAddrState')?.value.trim()||'';
  const addrPin     = document.getElementById('suAddrPin')?.value.trim()||'';
  const addrCountry = document.getElementById('suAddrCountry')?.value.trim()||'India';
  const address     = [addrLine,addrPlace,addrCity,addrState,addrPin,addrCountry].filter(Boolean).join(', ');

  // Validations
  if(!first||!last) return showAuthError('su','Please enter your first and last name.');
  if(!/^\d{10}$/.test(mobile)) return showAuthError('su','Please enter a valid 10-digit mobile number.');
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAuthError('su','Please enter a valid email address.');
  if(!addrLine) return showAuthError('su','Please enter your address line.');
  if(!addrPlace) return showAuthError('su','Please enter your place/locality.');
  if(!addrCity) return showAuthError('su','Please enter your city/district.');
  if(!addrState) return showAuthError('su','Please enter your state.');
  if(!addrPin||!/^\d{6}$/.test(addrPin)) return showAuthError('su','Please enter a valid 6-digit PIN code.');
  if(pass.length < 6) return showAuthError('su','Password must be at least 6 characters.');
  if(pass !== confirm) return showAuthError('su','Passwords do not match.');

  const accounts = await sbGetCustAccounts();

  // Check duplicates
  if(accounts.find(a => a.mobile === mobile))
    return showAuthError('su','This mobile number is already registered.');
  if(accounts.find(a => a.email && (a.email||'').toLowerCase() === email.toLowerCase()))
    return showAuthError('su','This email is already registered.');

  const newAccount = {
    id: 'CUST'+Date.now(),
    firstName: _cleanText(first), lastName: _cleanText(last),
    name: _cleanText(first+' '+last),
    mobile, whatsapp: wa, email: _cleanText(email),
    address: _cleanText(address), addrLine: _cleanText(addrLine), addrPlace: _cleanText(addrPlace), addrCity: _cleanText(addrCity), addrState: _cleanText(addrState), addrPin, addrCountry: _cleanText(addrCountry),
    password: _pwHash(pass),
    createdAt: new Date().toLocaleString('en-IN'),
    verified: false
  };

  try {
    // Save to Supabase (if table exists)
    await sbUpsertCustAccount(newAccount).catch(e => console.warn('Supabase account save skipped:', e.message));
    await sbUpsertCustomer({
      id: newAccount.id, name: newAccount.name, mobile, whatsapp: wa, email,
      address, orders: 0, spent: 0, blocked: false,
      joinedAt: new Date().toLocaleDateString('en-IN')
    }).catch(e => console.warn('Supabase customer save skipped:', e.message));

    // Always save to localStorage as fallback
    const localAccounts = JSON.parse(localStorage.getItem('cust_accounts')||'[]');
    localAccounts.push(newAccount);
    localStorage.setItem('cust_accounts', JSON.stringify(localAccounts));

    invalidateCustAccountsCache();
    customers = await sbGetCustomers().catch(()=>customers);
  } catch(e) {
    // Last resort — localStorage only
    const localAccounts = JSON.parse(localStorage.getItem('cust_accounts')||'[]');
    localAccounts.push(newAccount);
    localStorage.setItem('cust_accounts', JSON.stringify(localAccounts));
  }

  loginCustomer(newAccount);
  closeAuth();
  showToast('✅ Welcome, '+first+'! Your account has been created.');
  showPage('menu');
  } catch(_e) { console.error("[SG] doCustomerSignUp:", _e); }
}


// SIGN IN
async function doCustomerSignIn() {
  try {
  const identifier = document.getElementById('siIdentifier').value.trim();
  const pass = document.getElementById('siPassword').value.trim();
  if(!identifier || !pass) return showAuthError('si','Please fill all fields.');

  try {
    // Try Supabase first, fallback to localStorage
    let accounts = await sbGetCustAccounts();
    if(!accounts.length) {
      // Supabase table empty ya exist nahi — localStorage se try karo
      try { accounts = JSON.parse(localStorage.getItem('cust_accounts')||'[]'); } catch(e) { accounts = []; }
    }

    const account = accounts.find(a =>
      a.mobile === identifier ||
      (a.email && (a.email||'').toLowerCase() === identifier.toLowerCase())
    );

    if(!account) return showAuthError('si','No account found with this mobile or email.');
    if(!_pwVerify(pass, account.password)) return showAuthError('si','Incorrect password.');
    if(account.blocked) return showAuthError('si','Your account has been blocked.');

    // Extra Bug #6 fix: legacy plaintext password ko hash mein migrate karo
    if(!_pwIsHashed(account.password)) {
      account.password = _pwHash(pass);
      try {
        sbUpsertCustAccount(account).catch(()=>{});
        var _la = JSON.parse(localStorage.getItem('cust_accounts')||'[]');
        var _ix = _la.findIndex(function(a){ return a.id === account.id; });
        if(_ix >= 0) { _la[_ix].password = account.password; } else { _la.push(account); }
        localStorage.setItem('cust_accounts', JSON.stringify(_la));
        if(typeof invalidateCustAccountsCache === 'function') invalidateCustAccountsCache();
      } catch(_m){}
    }

    loginCustomer(account);
    closeAuth();
    showToast('✅ Welcome back, '+account.firstName+'!');
  } catch(e) {
    console.error('SignIn error:', e);
    showAuthError('si','Sign in failed. Please try again.');
  }
  } catch(_e) { console.error("[SG] doCustomerSignIn:", _e); }
}

function loginCustomer(account) {
  try {
  currentCustomer = account;
  localStorage.setItem('cust_session', JSON.stringify({id: account.id, time: Date.now()}));
  updateCustNav();
  } catch(_e) { console.error("[SG] loginCustomer:", _e); }
}

function custLogout() {
  try {
  currentCustomer = null;
  localStorage.removeItem('cust_session');
  updateCustNav();
  showPage('home');
  showToast('You have been signed out.');
  } catch(_e) { console.error("[SG] custLogout:", _e); }
}

function updateCustNav() {
  try {
  const guestBtns = document.getElementById('navGuestBtns');
  const custBtns  = document.getElementById('navCustBtns');
  const custName  = document.getElementById('navCustName');
  const navMenu   = document.getElementById('navMenu');
  const navOrder  = document.getElementById('navOrder');

  if(currentCustomer) {
    if(guestBtns) guestBtns.style.display = 'none';
    if(custBtns)  custBtns.style.display  = 'flex';
    if(custName)  custName.textContent     = currentCustomer.firstName;
  } else {
    if(guestBtns) guestBtns.style.display = 'flex';
    if(custBtns)  custBtns.style.display  = 'none';
  }
  } catch(_e) { console.error("[SG] updateCustNav:", _e); }
}

// Gate menu and order for logged-in customers only
function custMenuClick() {
  try {
  if(!currentCustomer) {
    openAuthModal('signin');
    return;
  }
  showPage('menu');
  } catch(_e) { console.error("[SG] custMenuClick:", _e); }
}

function custOrderClick() {
  try {
  if(!currentCustomer) {
    openAuthModal('signin');
    return;
  }
  showPage('order');
  } catch(_e) { console.error("[SG] custOrderClick:", _e); }
}

// Restore customer session on page load
async function restoreCustomerSession() {
  try {
  const sess = getCustSession();
  if(!sess) return;
  try {
    let accounts = await sbGetCustAccounts();
    if(!accounts.length) {
      try { accounts = JSON.parse(localStorage.getItem('cust_accounts')||'[]'); } catch(e) { accounts = []; }
    }
    const account = accounts.find(a => a.id === sess.id);
    if(account) {
      currentCustomer = account;
      updateCustNav();
    } else {
      localStorage.removeItem('cust_session');
    }
  } catch(e) {
    localStorage.removeItem('cust_session');
  }
  } catch(_e) { console.error("[SG] restoreCustomerSession:", _e); }
}

// MY ORDERS page
function renderMyOrders() {
  try {
  if(!currentCustomer) {
    openAuthModal('signin');
    return;
  }
  const list = document.getElementById('myOrdersList');
  if(!list) return;

  // Get orders placed by this customer (match by mobile)
  const allOrders = orders; // from Supabase in-memory
  const myOrders = allOrders.filter(o =>
    o.mobile === currentCustomer.mobile ||
    o.email === currentCustomer.email
  );

  if(!myOrders.length) {
    list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--muted);"><div style="font-size:3rem;margin-bottom:12px;">📋</div><p>You have no orders yet.</p><button class="btn-primary" style="margin-top:16px;padding:12px 28px;" onclick="showPage('menu')">Browse Menu</button></div>`;
    return;
  }

  const statusSteps = ['Pending','Confirmed','Preparing','Ready','Delivered'];
  const statusIdx = s => statusSteps.indexOf(s);

  list.innerHTML = myOrders.map(o => {
    const isCancelled = o.status === 'Cancelled';
    const curIdx = isCancelled ? -1 : statusIdx(o.status);

    return `<div class="track-card">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:14px;">
        <div>
          <div style="font-weight:800;font-size:1rem;color:var(--fire);">#${o.id}</div>
          <div style="font-size:0.8rem;color:var(--muted);">${o.time} • ${o.type}</div>
        </div>
        <span class="status ${isCancelled?'cancelled':(o.status||'').toLowerCase()}">${o.status}</span>
      </div>

      <!-- Order items -->
      <div style="margin-bottom:14px;">
        ${o.items.map(i=>`<div style="display:flex;justify-content:space-between;font-size:0.88rem;padding:4px 0;border-bottom:1px solid #f5f0eb;">
          <span>${i.name} ×${i.qty}</span><span>₹${i.total}</span>
        </div>`).join('')}
        <div style="display:flex;justify-content:space-between;font-weight:800;padding:8px 0 0;color:var(--fire);">
          <span>Total</span><span>₹${o.total}</span>
        </div>
      </div>

      <!-- Tracking steps -->
      ${!isCancelled ? `
      <div class="track-steps">
        ${statusSteps.map((step,i) => `
          <div class="track-step">
            <div class="track-dot ${i<curIdx?'done':i===curIdx?'active':''}">
              ${i<curIdx?'✓':i===curIdx?'●':'○'}
            </div>
            <div class="track-label ${i<curIdx?'done':i===curIdx?'active':''}">${step}</div>
          </div>`).join('')}
      </div>` : `
      <div style="background:#fce4ec;border-radius:8px;padding:10px 14px;font-size:0.85rem;color:#c62828;">
        ❌ Order Cancelled${o.cancelReason?' — '+o.cancelReason:''}
      </div>`}

      <!-- Cancel button (only for Pending orders) -->
      ${o.status==='Pending' ? `
      <button onclick="cancelMyOrder('${o.id}')"
        style="margin-top:12px;width:100%;padding:10px;background:#fce4ec;color:#c62828;border:2px solid #ef9a9a;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.85rem;">
        ❌ Cancel Order
      </button>` : ''}
    </div>`;
  }).join('');
  } catch(e) { console.error("[SG] renderMyOrders error:", e); }
}

function cancelMyOrder(orderId) {
  try {
  if(!confirm('Are you sure you want to cancel this order?')) return;
  const o = orders.find(x => x.id === orderId);
  if(!o || o.status !== 'Pending') {
    showToast('This order cannot be cancelled.','error'); return;
  }
  o.status = 'Cancelled';
  o.cancelReason = 'Cancelled by customer';
  sbUpdateOrder(orderId, {status:'Cancelled', cancelReason:'Cancelled by customer'}).catch(e=>console.error('Cancel failed:',e));
  renderMyOrders();
  showToast('Your order has been cancelled.');
  } catch(_e) { console.error("[SG] cancelMyOrder:", _e); }
}

// Enter key support for auth forms
document.addEventListener('keydown', e => {
  if(e.key === 'Enter' && document.getElementById('authOverlay').style.display !== 'none') {
    const activeForm = document.querySelector('.auth-form.active');
    if(activeForm?.id === 'formSignin') doCustomerSignIn();
    else if(activeForm?.id === 'formSignup') doCustomerSignUp();
  }
});




// =============================================
// ========= TABLE CHARGES SYSTEM ==============
// =============================================

function getTableCharges() {
  return (_settingsCache['sg_table_charges'])||{normal:0,vip:0,minSpend:0,chargeType:'adjust',note:'',enabled:false};
}

function saveTableCharges() {
  try {
  const canSetCharges = currentUser?.role==='Admin' || currentUser?.perms?.includes('Table - Set Charges');
  if(!canSetCharges) { showToast('You do not have permission to set charges','error'); return; }

  const charges = {
    normal: parseFloat(document.getElementById('normalTableCharge').value)||0,
    vip: parseFloat(document.getElementById('vipTableCharge').value)||0,
    minSpend: parseFloat(document.getElementById('minSpendCharge').value)||0,
    chargeType: document.getElementById('chargeType').value,
    note: document.getElementById('chargeNote').value.trim(),
    enabled: true,
    updatedBy: currentUser?.name||'Admin',
    updatedAt: new Date().toLocaleString('en-IN')
  };
  setSetting('sg_table_charges', charges);
  renderTableChargesSection();
  showToast('✅ Table charges saved!');
  } catch(_e) { console.error("[SG] saveTableCharges:", _e); }
}

function renderTableChargesSection() {
  try {
  const isAdmin = currentUser?.role==='Admin';
  const canSet = isAdmin || currentUser?.perms?.includes('Table - Set Charges');
  const charges = getTableCharges();

  // Show/hide form based on permission
  const form = document.getElementById('tableChargesForm');
  const toggleBtn = document.getElementById('chargesToggleBtn');

  if(canSet) {
    if(toggleBtn) toggleBtn.innerHTML = `
      <button onclick="toggleChargesForm()" 
        style="background:var(--fire);color:#fff;border:none;padding:7px 14px;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">
        ✏️ Edit Charges
      </button>`;
    // Fill form values
    if(document.getElementById('normalTableCharge')) {
      document.getElementById('normalTableCharge').value = charges.normal||0;
      document.getElementById('vipTableCharge').value = charges.vip||0;
      document.getElementById('minSpendCharge').value = charges.minSpend||0;
      document.getElementById('chargeType').value = charges.chargeType||'adjust';
      document.getElementById('chargeNote').value = charges.note||'';
    }
  } else {
    if(toggleBtn) toggleBtn.innerHTML = '';
  }

  // Current charges display
  const display = document.getElementById('currentChargesDisplay');
  if(display) {
    if(!charges.enabled && !charges.vip && !charges.normal) {
      display.innerHTML = '<div style="font-size:0.82rem;color:var(--muted);">No charges set yet.</div>';
    } else {
      display.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
          <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:1.1rem;font-weight:800;color:var(--fire);">₹${charges.normal||0}</div>
            <div style="font-size:0.7rem;color:var(--muted);">Normal Table</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;border:1px solid gold;">
            <div style="font-size:1.1rem;font-weight:800;color:var(--fire);">₹${charges.vip||0}</div>
            <div style="font-size:0.7rem;color:var(--muted);">⭐ VIP Table</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:1.1rem;font-weight:800;color:var(--fire);">₹${charges.minSpend||0}</div>
            <div style="font-size:0.7rem;color:var(--muted);">Min Spend/person</div>
          </div>
        </div>
        ${charges.note?`<div style="font-size:0.78rem;color:var(--muted);margin-top:8px;padding:6px 10px;background:#fff;border-radius:6px;">📝 ${charges.note}</div>`:''}
        ${charges.updatedBy?`<div style="font-size:0.72rem;color:var(--muted);margin-top:6px;">Last updated by: ${charges.updatedBy} • ${charges.updatedAt}</div>`:''}`;
    }
  }
  } catch(_e) { console.error("[SG] renderTableChargesSection:", _e); }
}

function toggleChargesForm() {
  try {
  const form = document.getElementById('tableChargesForm');
  if(form) form.style.display = form.style.display==='none' ? 'block' : 'none';
  } catch(_e) { console.error("[SG] toggleChargesForm:", _e); }
}



// =============================================
// ========= FORGOT PASSWORD SYSTEM ============
// =============================================
let forgotAccountMobile = null;

function showForgotPassword() {
  try {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('formForgot').classList.add('active');
  // Reset steps
  document.getElementById('forgotStep1').style.display = 'block';
  document.getElementById('forgotStep2').style.display = 'none';
  document.getElementById('forgotIdentifier').value = '';
  document.getElementById('forgotError').style.display = 'none';
  forgotAccountMobile = null;
  } catch(_e) { console.error("[SG] showForgotPassword:", _e); }
}

async function forgotFindAccount() {
  try {
  const identifier = document.getElementById('forgotIdentifier').value.trim();
  const errEl = document.getElementById('forgotError');
  if(!identifier) {
    errEl.textContent = 'Please enter your mobile number or email';
    errEl.style.display = 'block'; return;
  }
  const accounts = await sbGetCustAccounts();
  const acc = accounts.find(a =>
    a.mobile === identifier ||
    a.email?.toLowerCase() === identifier.toLowerCase()
  );
  if(!acc) {
    errEl.textContent = 'No account found with this mobile or email. Please check and try again.';
    errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';
  forgotAccountMobile = acc.mobile;
  // Show step 2
  document.getElementById('forgotStep1').style.display = 'none';
  document.getElementById('forgotStep2').style.display = 'block';
  document.getElementById('forgotNewPass').value = '';
  document.getElementById('forgotConfPass').value = '';
  document.getElementById('forgotStep2Error').style.display = 'none';
  } catch(_e) { console.error("[SG] forgotFindAccount:", _e); }
}

async function forgotResetPassword() {
  try {
  const newPass = document.getElementById('forgotNewPass').value.trim();
  const confPass = document.getElementById('forgotConfPass').value.trim();
  const errEl = document.getElementById('forgotStep2Error');

  if(!newPass || newPass.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters';
    errEl.style.display = 'block'; return;
  }
  if(newPass !== confPass) {
    errEl.textContent = 'Passwords do not match';
    errEl.style.display = 'block'; return;
  }
  if(!forgotAccountMobile) {
    errEl.textContent = 'Session expired. Please start again.';
    errEl.style.display = 'block'; return;
  }

  // Update password in Supabase
  await sbUpdateCustAccount(forgotAccountMobile, { password: newPass }).catch(e=>console.error('Reset pwd fail:',e));
  invalidateCustAccountsCache();

  // Success - go to sign in
  forgotAccountMobile = null;
  switchAuthTab('signin');
  showToast('✅ Password reset successful! Please sign in with your new password.','success');
  } catch(_e) { console.error("[SG] forgotResetPassword:", _e); }
}




// =============================================
// ============= INVOICE GENERATOR =============
// =============================================

let lastOrderData = {}; // Store order data for invoice

function printInvoice() {
  try {
  console.log('=== PRINT INVOICE ===', JSON.stringify(lastOrderData));
  const o = lastOrderData;
  if(!o || !o.orderId) { 
    console.log('lastOrderData empty or no orderId');
    showToast('No order data available','error'); 
    return; 
  }

  const settings = (_settingsCache['sg_settings'])||{};
  const restName = settings.name || 'SpiceGarden';
  const tagline = settings.tagline || 'Authentic Indian Cuisine';
  const gstRate = settings.gst || 5;

  const dineInSection = o.type === 'Dine-In' && (o.tableNum || o.dineInSlots?.length) ? `
    <div style="margin:12px 0;padding:10px;background:#fff8e1;border-radius:8px;border:1px solid #ffe082;">
      <div style="font-weight:700;color:#f57c00;margin-bottom:6px;">🪑 Reservation Details</div>
      ${o.tableNum ? '<div>Table: <b>'+o.tableNum+'</b></div>' : ''}
      ${o.dineInDate ? '<div>Date: <b>'+new Date(o.dineInDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'</b></div>' : ''}
      ${o.dineInGuests ? '<div>Guests: <b>'+o.dineInGuests+'</b></div>' : ''}
      ${o.dineInSlots && o.dineInSlots.length ? '<div>Time Slots:<br>'+o.dineInSlots.map(s=>'&nbsp;&nbsp;⏰ '+to12hr(s.start)+' – '+to12hr(s.end)+(s.charge>0?' (₹'+s.charge+')':' (Free)')).join('<br>')+'</div>' : ''}
      ${o.dineInRequest ? '<div>Special Request: '+o.dineInRequest+'</div>' : ''}
    </div>` : '';

  const reservCharge = o.dineInReservCharge || 0;
  const grandTotal = o.total + reservCharge;

  const invoiceHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${o.orderId}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color: #333; background: #fff; }
    .invoice { max-width: 600px; margin: 0 auto; padding: 30px; }
    .header { text-align: center; border-bottom: 3px solid #E8400C; padding-bottom: 16px; margin-bottom: 16px; }
    .logo { font-size: 2rem; font-weight: 900; color: #1A0A00; letter-spacing: -1px; }
    .logo span { color: #E8400C; }
    .tagline { font-size: 0.8rem; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
    .invoice-title { background: #E8400C; color: #fff; text-align: center; padding: 10px; border-radius: 8px; font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 0.88rem; }
    .meta div { line-height: 1.6; }
    .meta b { display: block; font-size: 0.72rem; color: #888; text-transform: uppercase; }
    .section-title { font-size: 0.72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .items-table th { background: #f5f0eb; padding: 8px 10px; text-align: left; font-size: 0.82rem; color: #666; }
    .items-table td { padding: 9px 10px; border-bottom: 1px solid #f0ebe5; font-size: 0.88rem; }
    .items-table tr:last-child td { border: none; }
    .totals { border-top: 2px solid #E8400C; padding-top: 12px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 0.9rem; }
    .total-row.grand { font-weight: 900; font-size: 1.1rem; color: #E8400C; border-top: 1px solid #eee; margin-top: 6px; padding-top: 8px; }
    .footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #ddd; font-size: 0.82rem; color: #888; }
    .badge { display: inline-block; background: #E8400C; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .resv-box { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 12px; margin-bottom: 14px; font-size: 0.85rem; line-height: 1.7; }
    .resv-box .resv-title { font-weight: 700; color: #f57c00; margin-bottom: 6px; }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice">

    <!-- Header -->
    <div class="header">
      <div class="logo">${restName.split('').map((c,i)=>i===0?'<span>'+c+'</span>':c).join('')} 🌶️</div>
      <div class="tagline">${tagline}</div>
    </div>

    <!-- Invoice Title -->
    <div class="invoice-title">🧾 ORDER INVOICE</div>

    <!-- Meta Info -->
    <div class="meta">
      <div>
        <b>Order ID</b>
        <span style="font-size:1.1rem;font-weight:800;color:#E8400C;">${o.orderId}</span>
      </div>
      <div>
        <b>Order Date</b>
        ${o.time || new Date().toLocaleString('en-IN')}
      </div>
      <div style="text-align:right;">
        <b>Order Type</b>
        <span class="badge">${o.type}</span>
      </div>
    </div>

    <!-- Customer Info -->
    <div style="background:#f9f7f5;border-radius:8px;padding:12px;margin-bottom:14px;">
      <div class="section-title">Customer Details</div>
      <div style="font-size:0.88rem;line-height:1.8;">
        <div><b>Name:</b> ${escHtml(o.name)}</div>
        <div><b>Mobile:</b> ${escHtml(o.mobile)}</div>
        ${o.email ? '<div><b>Email:</b> '+o.email+'</div>' : ''}
        ${o.address && o.type==='Home Delivery' ? '<div><b>Address:</b> '+escHtml(o.address)+'</div>' : ''}
      </div>
    </div>

    <!-- Reservation Details (Dine-In only) -->
    ${dineInSection}

    <!-- Items -->
    <div class="section-title">Items Ordered</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${o.items.map((item, i) => `
          <tr>
            <td style="color:#aaa;">${i+1}</td>
            <td>${item.name}</td>
            <td style="text-align:center;">${item.qty}</td>
            <td style="text-align:right;">₹${Math.round(item.total/item.qty)}</td>
            <td style="text-align:right;font-weight:600;">₹${item.total}</td>
          </tr>`).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="total-row">
        <span>Subtotal</span>
        <span>₹${o.subtotal}</span>
      </div>
      <div class="total-row" style="color:#888;">
        <span>GST (${gstRate}%)</span>
        <span>₹${o.gstAmt}</span>
      </div>
      ${reservCharge > 0 ? `
      <div class="total-row" style="color:#f57c00;">
        <span>Reservation Charge <small style="font-size:0.72rem;">(No GST)</small></span>
        <span>₹${reservCharge}</span>
      </div>` : ''}
      <div class="total-row grand">
        <span>Grand Total</span>
        <span>₹${grandTotal}</span>
      </div>
    </div>

    <!-- Payment -->
    <div style="margin-top:12px;font-size:0.85rem;color:#666;">
      <b>Payment Method:</b> ${o.payment || 'Cash on Delivery'}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div style="font-size:1.2rem;margin-bottom:6px;">🙏 Thank you for dining with us!</div>
      <div>${restName} — ${tagline}</div>
      <div style="margin-top:6px;color:#ccc;">Please keep this invoice for your reference</div>
    </div>

    <!-- Print Button -->
    <div class="no-print" style="text-align:center;margin-top:20px;">
      <button onclick="window.print()" style="background:#E8400C;color:#fff;border:none;padding:12px 30px;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;margin-right:8px;">🖨️ Print Invoice</button>
      <button onclick="window.close()" style="background:#f5f0eb;color:#333;border:none;padding:12px 30px;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;">✕ Close</button>
    </div>

  </div>

<!-- EMERGENCY STOCK ENTRY MODAL -->
<div class="modal-overlay" id="emergencyStockModal" style="z-index:9500;">
  <div class="modal" style="max-width:560px;max-height:90vh;overflow-y:auto;">
    <h3>🚨 Emergency Stock Entry</h3>

    <!-- Type Selection -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <button onclick="setEmergencyType('packaged')" id="typePackaged"
        style="padding:10px;border:2px solid var(--fire);border-radius:8px;background:var(--fire);color:#fff;font-weight:700;cursor:pointer;">
        📦 Packaged Product
      </button>
      <button onclick="setEmergencyType('rawmat')" id="typeRawmat"
        style="padding:10px;border:2px solid #ddd;border-radius:8px;background:#fff;font-weight:700;cursor:pointer;">
        🥬 Raw Material
      </button>
    </div>

    <input type="hidden" id="emergencyType" value="packaged">

    <!-- Product/Item Name -->
    <div class="form-group">
      <label>Product/Item Name *</label>
      <input type="text" id="emergencyName" class="form-input" placeholder="e.g. Cold Drink, Chicken...">
    </div>

    <!-- Batch Number -->
    <div class="form-group">
      <label>Batch Number <span style="font-size:0.75rem;color:var(--muted);">(optional)</span></label>
      <input type="text" id="emergencyBatch" class="form-input" placeholder="Leave empty if no batch number"
        oninput="toggleEmergencyFields()">
    </div>

    <!-- Supplier + Purchase Date (show only if no batch) -->
    <div id="emergencySupplierSection">
      <div class="form-group">
        <label>Supplier Name *</label>
        <input type="text" id="emergencySupplier" class="form-input" placeholder="Supplier name">
      </div>
      <div class="form-group">
        <label>Purchase Date *</label>
        <input type="date" id="emergencyPurchaseDate" class="form-input">
      </div>
    </div>

    <!-- Quantity -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="form-group">
        <label>Quantity *</label>
        <input type="number" id="emergencyQty" class="form-input" placeholder="0" min="0" step="0.01">
      </div>
      <div class="form-group">
        <label>Unit *</label>
        <select id="emergencyUnit" class="form-input">
          <option value="">-- Select --</option>
          <optgroup label="Packaged">
            <option value="bottle">Bottle</option>
            <option value="packet">Packet</option>
            <option value="can">Can</option>
            <option value="box">Box</option>
            <option value="piece">Piece</option>
            <option value="carton">Carton</option>
          </optgroup>
          <optgroup label="Raw Material">
            <option value="kg">Kg</option>
            <option value="gram">Gram</option>
            <option value="litre">Litre</option>
            <option value="ml">ML</option>
            <option value="dozen">Dozen</option>
          </optgroup>
        </select>
      </div>
    </div>

    <!-- Auto Date & Time -->
    <div style="background:#e8f5e9;border-radius:8px;padding:10px;margin-bottom:12px;font-size:0.85rem;">
      🤖 Auto Date & Time: <b id="emergencyAutoDateTime"></b>
    </div>

    <!-- Taken By -->
    <div class="form-group">
      <label>Taken By *</label>
      <input type="text" id="emergencyTakenBy" class="form-input" placeholder="Staff name">
    </div>

    <!-- Reason -->
    <div class="form-group">
      <label>Reason *</label>
      <textarea id="emergencyReason" class="form-input" placeholder="Emergency reason..." style="min-height:70px;resize:none;"></textarea>
    </div>

    <div class="modal-btns">
      <button class="btn-cancel" onclick="closeModal('emergencyStockModal')">Cancel</button>
      <button class="btn-save" onclick="saveEmergencyEntry()">Save Entry</button>
    </div>
  </div>
</div>

<!-- RECIPE SETUP MODAL -->
<div class="modal-overlay" id="recipeSetupModal" style="z-index:9500;">
  <div class="modal" style="max-width:520px;max-height:90vh;overflow-y:auto;">
    <h3>🍽️ Set Dish Recipe</h3>
    <div class="form-group">
      <label>Select Dish *</label>
      <select id="recipeDish" class="form-input"></select>
    </div>
    <div style="font-weight:700;margin-bottom:8px;">Ingredients:</div>
    <div id="recipeIngredients"></div>
    <button onclick="addRecipeIngredient()" style="background:#f0f7ff;color:#1a6fa8;border:2px solid #bee3f8;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer;margin-bottom:12px;">+ Add Ingredient</button>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="closeModal('recipeSetupModal')">Cancel</button>
      <button class="btn-save" onclick="saveRecipe()">Save Recipe</button>
    </div>
  </div>
</div>

<!-- CANCEL ASSIGNMENT POPUP -->
<div id="cancelAssignModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:99999;align-items:center;justify-content:center;">
  <div style="background:#fff;border-radius:16px;padding:28px;max-width:520px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
    <div style="font-size:1.2rem;font-weight:800;margin-bottom:6px;">⚠️ Order Preparing/Ready ke baad Cancel hua</div>
    <div style="font-size:0.85rem;color:var(--muted);margin-bottom:20px;">Ingredients already use ho chuke hain. Kya karna chahoge?</div>
    
    <!-- Option 1: Assign to another order -->
    <div style="background:#e8f5e9;border-radius:12px;padding:16px;margin-bottom:14px;border:2px solid #a5d6a7;">
      <div style="font-weight:700;font-size:0.95rem;margin-bottom:10px;">✅ Option 1: Doosre order mein assign karo</div>
      <div style="font-size:0.82rem;color:#2e7d32;margin-bottom:10px;">Ingredients doosre order mein use honge — stock deduct hoga us order ke liye</div>
      <select id="cancelAssignOrderId" style="width:100%;padding:10px;border:2px solid #a5d6a7;border-radius:8px;font-family:inherit;font-size:0.88rem;margin-bottom:10px;">
        <option value="">-- Koi order select karo --</option>
      </select>
      <button onclick="confirmCancelAssign()" style="background:#2e7d32;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;width:100%;font-size:0.9rem;">✅ Is Order mein Assign Karo → Stock Deduct</button>
    </div>
    
    <!-- Option 2: Manual waste entry -->
    <div style="background:#fce4ec;border-radius:12px;padding:16px;border:2px solid #ef9a9a;">
      <div style="font-weight:700;font-size:0.95rem;margin-bottom:10px;">🗑️ Option 2: Manually waste entry karo</div>
      <div style="font-size:0.82rem;color:#c62828;margin-bottom:10px;">Ingredients waste ho gaye — stock minus hoga</div>
      <button onclick="confirmCancelWaste()" style="background:#c62828;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;width:100%;font-size:0.9rem;">🗑️ Waste Entry Karo → Stock Minus</button>
    </div>
    
    <button onclick="closeCancelAssignModal()" style="margin-top:14px;width:100%;padding:8px;border:1px solid #ddd;border-radius:8px;background:#f5f5f5;color:var(--muted);cursor:pointer;font-family:inherit;">Baad mein decide karunga</button>
  </div>
</div>

</body>
</html>`;

  // Show invoice in a full-screen overlay instead of popup (avoids popup blockers)
  let invoiceDiv = document.getElementById('invoiceOverlay');
  if(!invoiceDiv) {
    invoiceDiv = document.createElement('div');
    invoiceDiv.id = 'invoiceOverlay';
    invoiceDiv.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:99999;overflow-y:auto;';
    document.body.appendChild(invoiceDiv);
  }
  invoiceDiv.innerHTML = invoiceHTML + `
    <style>
      #invoiceCloseBtn {
        position:fixed;top:16px;right:16px;
        background:#E8400C;color:#fff;border:none;
        padding:10px 20px;border-radius:10px;font-size:0.9rem;
        font-weight:700;cursor:pointer;z-index:100000;
        box-shadow:0 4px 12px rgba(232,64,12,0.4);
      }
    </style>
    <button id="invoiceCloseBtn" onclick="document.getElementById('invoiceOverlay').style.display='none'">✕ Close Invoice</button>`;
  invoiceDiv.style.display = 'block';
  } catch(_e) { console.error("[SG] printInvoice:", _e); }
}


// =============================================
// ===== DINE-IN STEP BY STEP FLOW =============
// =============================================

// selectedSlots declared globally above

function onDineInDateChange() {
  try {
  const date = document.getElementById('dineInDate').value;
  if(!date) return;
  // Show step 2
  document.getElementById('dineInStep2').style.display = 'block';
  // Reset step 3
  document.getElementById('dineInStep3').style.display = 'none';
  document.getElementById('selectedTableInfo').style.display = 'none';
  selectedTableId = null;
  selectedSlots = [];
  // Render tables for this date
  renderTablePicker();
  } catch(_e) { console.error("[SG] onDineInDateChange:", _e); }
}

function renderTimeSlotPicker(tableId) {
  try {
  const tables = JSON.parse(localStorage.getItem('sg_tables')||'[]');
  const t = tables.find(x=>x.id===tableId);
  const date = document.getElementById('dineInDate').value;
  const div = document.getElementById('timeSlotPicker');
  if(!div) return;

  if(!t || !t.reservationOnly || !t.dateSlots || !t.dateSlots[date]) {
    // Normal table - no slots needed, just show info
    div.innerHTML = '<div style="font-size:0.88rem;color:var(--muted);padding:8px;">This is a walk-in table. No time slot needed.</div>';
    updateDineInSummary(tableId, []);
    return;
  }

  const slots = t.dateSlots[date];
  const reservations = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');

  div.innerHTML = `
    <div style="font-size:0.85rem;color:var(--muted);margin-bottom:10px;">Select one or more time slots for <b>Table ${t.num}</b>:</div>
    ${slots.map((s,i) => {
      // Check if slot already booked
      const booked = reservations.some(r => {
        if(r.table !== tableId || r.date !== date || r.status === 'cancelled') return false;
        // Check r.slots (old format)
        if(r.slots && r.slots.some(rs => rs.start === s.start)) return true;
        // Check r.dineInSlots (new format)
        if(r.dineInSlots && r.dineInSlots.some(rs => rs.start === s.start)) return true;
        // Check r.time (simple time format)
        if(r.time && r.time === s.start) return true;
        return false;
      });
      const slotLabel = to12hr(s.start) + ' – ' + to12hr(s.end);
      const chargeLabel = s.charge > 0 ? ' — ₹'+s.charge : ' — Free';
      return `<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:8px;cursor:${booked?'not-allowed':'pointer'};background:${booked?'#f5f5f5':'#fff'};border:2px solid ${booked?'#ddd':'#e8d5c8'};">
        <input type="checkbox" value="${i}" ${booked?'disabled':''} 
          onchange="onSlotCheck(${i},'${tableId}')"
          style="width:18px;height:18px;accent-color:var(--fire);cursor:${booked?'not-allowed':'pointer'};">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:0.9rem;color:${booked?'#aaa':'var(--dark)'};">⏰ ${slotLabel}</div>
          <div style="font-size:0.78rem;color:${booked?'#aaa':'var(--fire)'};font-weight:600;">${chargeLabel}${booked?' — 🔒 Already Booked':''}</div>
        </div>
      </label>`;
    }).join('')}
    <div id="slotTotalDisplay" style="background:#fff3e0;border-radius:8px;padding:10px;border:1px solid #ffe082;margin-top:8px;display:none;">
      <div style="display:flex;justify-content:space-between;font-weight:800;font-size:0.95rem;">
        <span>Total Reservation Charge:</span>
        <span style="color:var(--fire);" id="slotTotalAmt">₹0</span>
      </div>
      <div style="font-size:0.75rem;color:var(--muted);margin-top:4px;">No GST on reservation charges</div>
    </div>`;
  } catch(_e) { console.error("[SG] renderTimeSlotPicker:", _e); }
}

function onSlotCheck(slotIdx, tableId) {
  try {
  const tables = JSON.parse(localStorage.getItem('sg_tables')||'[]');
  const t = tables.find(x=>x.id===tableId);
  const date = document.getElementById('dineInDate').value;
  if(!t || !t.dateSlots || !t.dateSlots[date]) return;

  const slots = t.dateSlots[date];
  // Get all checked slots
  selectedSlots = [];
  document.querySelectorAll('#timeSlotPicker input[type="checkbox"]:checked').forEach(cb => {
    selectedSlots.push(slots[parseInt(cb.value)]);
  });

  // Calculate total
  const total = selectedSlots.reduce((s,sl) => s + (sl.charge||0), 0);
  const totalDiv = document.getElementById('slotTotalDisplay');
  const totalAmt = document.getElementById('slotTotalAmt');
  if(totalDiv) totalDiv.style.display = selectedSlots.length > 0 ? 'block' : 'none';
  if(totalAmt) totalAmt.textContent = '₹' + total;

  // Set dineInTime to first slot start
  const timeHid = document.getElementById('dineInTime');
  if(timeHid && selectedSlots.length > 0) timeHid.value = selectedSlots[0].start;

  updateDineInSummary(tableId, selectedSlots);
  } catch(_e) { console.error("[SG] onSlotCheck:", _e); }
}

function updateDineInSummary(tableId, slots) {
  try {
  const tables = JSON.parse(localStorage.getItem('sg_tables')||'[]');
  const t = tables.find(x=>x.id===tableId);
  if(!t) return;
  const date = document.getElementById('dineInDate').value;
  const guests = document.getElementById('dineInGuests').value || 1;
  const request = document.getElementById('dineInRequest').value;
  const info = document.getElementById('selectedTableInfo');
  const detail = document.getElementById('selectedTableDetail');
  if(!info || !detail) return;

  const total = slots.reduce((s,sl) => s + (sl.charge||0), 0);
  const isVIP = t.section === 'VIP';
  const dateStr = date ? new Date(date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';

  detail.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
      <div><span style="color:var(--muted);font-size:0.78rem;">Table</span><br><b>${t.num}</b> ${isVIP?'⭐':''} ${t.section?'('+t.section+')':''}</div>
      <div><span style="color:var(--muted);font-size:0.78rem;">Capacity</span><br><b>${t.cap} seats</b></div>
      <div><span style="color:var(--muted);font-size:0.78rem;">Date</span><br><b>${dateStr}</b></div>
      <div><span style="color:var(--muted);font-size:0.78rem;">Guests</span><br><b>${guests}</b></div>
    </div>
    ${slots.length > 0 ? `
      <div style="margin-bottom:8px;">
        <span style="color:var(--muted);font-size:0.78rem;">Selected Slots</span>
        ${slots.map(s => '<div style="font-weight:600;font-size:0.88rem;">⏰ '+to12hr(s.start)+' – '+to12hr(s.end)+(s.charge>0?' — ₹'+s.charge:' — Free')+'</div>').join('')}
      </div>
      ${total > 0 ? `
        <div style="display:flex;justify-content:space-between;background:#fff;border-radius:8px;padding:8px 12px;font-weight:800;font-size:1rem;">
          <span>Reservation Charge:</span>
          <span style="color:var(--fire);">₹${total}</span>
        </div>
        <div style="font-size:0.72rem;color:var(--muted);text-align:right;margin-top:3px;">No GST on reservation charges</div>` : ''}` :
      '<div style="font-size:0.85rem;color:var(--muted);">Walk-in table — No reservation charge</div>'
    }
    ${request ? '<div style="font-size:0.82rem;color:var(--muted);margin-top:6px;">📝 '+request+'</div>' : ''}`;

  info.style.display = 'block';
  } catch(_e) { console.error("[SG] updateDineInSummary:", _e); }
}


// =============================================
// ========= DINE-IN BOOKING SYSTEM ============
// =============================================

let selectedTableId = null;
let selectedSlots = []; // Customer selected time slots for dine-in
let tablePickerFilter = 'all';

function handleOrderTypeChange(type) {
  try {
  // Update liquor banner visibility
  setTimeout(updateLiquorBanner, 50);
  // If switching to Home Delivery with liquor restriction ON + liquor in cart
  if(type === 'Home Delivery' && getLiquorDeliverySetting() === 'restricted' && cartHasLiquor()) {
    // Remove liquor items from cart automatically
    const removedNames = [];
    Object.keys(cart).forEach(id => {
      const item = menuItems.find(m => String(m.id) === String(id));
      if(itemHasLiquor(item)) {
        removedNames.push(item.name);
        delete cart[id];
        const el = document.getElementById('qty-'+id);
        if(el) el.textContent = '0';
      }
    });
    updateCartBadge();
    if(removedNames.length) {
      showToast('🚫 Home Delivery restricted hai — liquor items remove kiye: ' + removedNames.join(', '), 'error');
    }
  }
  const section = document.getElementById('dineInSection');
  const addressRow = document.getElementById('addressRow');
  const paymentRow = document.getElementById('paymentMethodRow');

  if(type === 'Dine-In') {
    section.classList.add('show');
    // Hide address for dine-in
    if(addressRow) addressRow.style.display = 'none';
    // Update payment label for dine-in
    if(paymentRow) paymentRow.querySelector('label').innerHTML = '💳 Payment Method <span style="font-size:0.75rem;color:var(--muted);font-weight:400;">(Pay at restaurant)</span>';
    // Set min date to today
    const dateEl = document.getElementById('dineInDate');
    if(dateEl) dateEl.min = new Date().toISOString().split('T')[0];
    // Set default time
    const timeEl = document.getElementById('dineInTime');
    if(timeEl && !timeEl.value) timeEl.value = '19:00';
    // Load tables
    renderTablePicker();
    document.getElementById('dineInStep2').style.display = 'none';
    document.getElementById('dineInStep3').style.display = 'none';
    selectedSlots = [];
  } else if(type === 'Takeaway') {
    section.classList.remove('show');
    selectedTableId = null;
    // Hide address for takeaway too
    if(addressRow) addressRow.style.display = 'none';
    if(paymentRow) paymentRow.querySelector('label').innerHTML = '💳 Payment Method';
  } else {
    // Home Delivery
    section.classList.remove('show');
    selectedTableId = null;
    // Show address for delivery
    if(addressRow) addressRow.style.display = '';
    if(paymentRow) paymentRow.querySelector('label').innerHTML = '💳 Payment Method';
  }
  } catch(_e) { console.error("[SG] handleOrderTypeChange:", _e); }
}

function filterTablePicker(section, btn) {
  try {
  tablePickerFilter = section;
  document.querySelectorAll('#tableFilterBtns button').forEach(b => {
    b.style.background = '#fff';
    b.style.color = 'var(--muted)';
    b.style.borderColor = 'var(--border)';
  });
  if(btn) {
    btn.style.background = 'var(--fire)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'var(--fire)';
  }
  renderTablePicker();
  } catch(_e) { console.error("[SG] filterTablePicker:", _e); }
}

function renderTablePicker() {
  try {
  const tables = JSON.parse(localStorage.getItem('sg_tables')||'[]');
  const reservations = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const selectedDate = document.getElementById('dineInDate')?.value;
  const selectedTime = document.getElementById('dineInTime')?.value;
  const guests = parseInt(document.getElementById('dineInGuests')?.value)||1;
  const grid = document.getElementById('tablePickerGrid');
  if(!grid) return;

  // Filter by section
  let filtered = tables;
  if(tablePickerFilter !== 'all') {
    filtered = tables.filter(t => t.section === tablePickerFilter);
  }

  if(!filtered.length) {
    grid.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);grid-column:1/-1;"><div style="font-size:2rem;">🪑</div><p>No tables available in this section</p></div>';
    return;
  }

  // Show time slot selector for reservation-only tables if time selected
  const hasSlotTables = filtered.some(t => t.reservationOnly && t.timeSlots?.length);

  // Check which tables are reserved for selected date/time
  const reservedTableIds = new Set();
  if(selectedDate && selectedTime) {
    reservations.forEach(r => {
      if(r.date === selectedDate && r.status !== 'cancelled') {
        // Check if time overlaps (within 2 hours)
        const rTime = r.time ? parseInt(r.time.split(':')[0])*60+parseInt(r.time.split(':')[1]) : 0;
        const sTime = parseInt(selectedTime.split(':')[0])*60+parseInt(selectedTime.split(':')[1]);
        if(Math.abs(rTime - sTime) < 120) {
          reservedTableIds.add(r.table);
        }
      }
    });
  }

  grid.innerHTML = filtered.map(t => {
    const isOccupied = t.status === 'occupied';
    const isReserved = t.status === 'reserved' || reservedTableIds.has(t.id);
    const isCleaning = t.status === 'cleaning';
    const isUnavailable = isOccupied || isReserved || isCleaning;
    const isSelected = selectedTableId === t.id;
    const canFit = !guests || (t.cap >= guests);

    let statusClass = 'available';
    let statusText = '✅ Available';
    let statusColor = '#2e7d32';

    if(isSelected) {
      statusText = '✓ Selected';
    } else if(isOccupied) {
      statusClass = 'occupied';
      statusText = '❌ Occupied';
      statusColor = '#c62828';
    } else if(isReserved) {
      statusClass = 'reserved';
      statusText = '🔒 Reserved';
      statusColor = '#f57c00';
    } else if(isCleaning) {
      statusClass = 'reserved';
      statusText = '🔄 Cleaning';
      statusColor = '#1565c0';
    } else if(!canFit) {
      statusClass = 'reserved';
      statusText = '👥 Too Small';
      statusColor = '#f57c00';
    }

    const sectionBadge = t.section ? `<div class="tpick-section">${t.section}</div>` : '';
    const isVIP = t.section === 'VIP';
    const isReservOnly = t.reservationOnly;

    // For reservation-only: check if date has any slots at all
    let slotAvailable = true;
    let slotCharge = 0;
    let slotsForDate = [];
    if(isReservOnly) {
      const ds = t.dateSlots||{};
      if(!selectedDate) {
        // No date selected yet - still show as clickable
        statusText = '📅 Pick Date First';
        statusColor = '#f57c00';
      } else if(!ds[selectedDate] || ds[selectedDate].length === 0) {
        // No slots for this date - not available
        slotAvailable = false;
        statusText = '❌ Not Available';
        statusColor = '#c62828';
        statusClass = 'reserved';
      } else {
        // Has slots for this date - show available
        slotsForDate = ds[selectedDate];
        const totalCharge = slotsForDate.reduce((s,sl)=>s+(sl.charge||0),0);
        statusText = '✅ ' + slotsForDate.length + ' Slot' + (slotsForDate.length>1?'s':'') + ' Available';
        statusColor = '#2e7d32';
        statusClass = 'available';
        if(totalCharge > 0) slotCharge = slotsForDate[0].charge||0;
      }
    }

    const finalUnavailable = isUnavailable || (isReservOnly && !slotAvailable);

    return `<div class="table-pick-card ${statusClass} ${isSelected?'selected':''}"
      onclick="${finalUnavailable||(!canFit)?'':` selectTable('${t.id}','${slotCharge}')`}"
      style="${isVIP?'border-width:3px;':''}">
      ${isVIP?'<div style="font-size:0.6rem;font-weight:800;color:gold;margin-bottom:2px;">⭐ VIP</div>':''}
      ${isReservOnly?'<div style="font-size:0.58rem;color:#1565c0;font-weight:700;margin-bottom:2px;">📅 RESERVATION</div>':''}
      <div class="tpick-num" style="color:${isSelected?'#fff':'var(--dark)'};">${t.num}</div>
      <div class="tpick-cap" style="color:${isSelected?'rgba(255,255,255,0.8)':'var(--muted)'};">👥 ${t.cap} seats</div>
      ${sectionBadge}
      ${slotCharge>0&&slotAvailable?`<div style="font-size:0.65rem;color:${isSelected?'#fff':'var(--fire)'};font-weight:700;">₹${slotCharge}</div>`:''}
      <div class="tpick-status" style="color:${isSelected?'#fff':statusColor};margin-top:4px;">${isSelected?'✓ Selected':statusText}</div>
    </div>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderTablePicker:", _e); }
}

function selectTable(tableId, slotCharge=0) {
  try {
  const tables = JSON.parse(localStorage.getItem('sg_tables')||'[]');
  const t = tables.find(x=>x.id===tableId);
  if(!t) return;
  // Show step 3 - time slots
  selectedSlots = [];
  const step3 = document.getElementById('dineInStep3');
  if(step3) {
    step3.style.display = 'block';
    renderTimeSlotPicker(tableId);
  }
  // If normal table (no slots) show summary directly
  if(!t.reservationOnly) updateDineInSummary(tableId, []);

  selectedTableId = tableId;
  renderTablePicker();

  // Show selected info
  const info = document.getElementById('selectedTableInfo');
  const detail = document.getElementById('selectedTableDetail');
  if(info && detail) {
    info.style.display = 'block';
    const date = document.getElementById('dineInDate')?.value;
    const time = document.getElementById('dineInTime')?.value;
    const guests = parseInt(document.getElementById('dineInGuests')?.value)||1;

    // Get applicable charges
    const globalCharges = (_settingsCache['sg_table_charges'])||{};
    const isVIP = t.section === 'VIP';
    // Use slot charge if set, else global charge
    const parsedSlotCharge = parseFloat(slotCharge)||0;
    const tableCharge = parsedSlotCharge > 0 ? parsedSlotCharge : (isVIP ? (globalCharges.vip||0) : (globalCharges.normal||0));
    const charges = {...globalCharges, vip: tableCharge, normal: tableCharge};
    const minSpend = globalCharges.minSpend||0;
    const totalMinSpend = minSpend * guests;

    let chargeHTML = '';
    if(tableCharge > 0 || minSpend > 0) {
      chargeHTML = `
        <div style="background:#fff3e0;border:1px solid #ffe082;border-radius:8px;padding:10px;margin-top:8px;">
          <div style="font-weight:700;font-size:0.85rem;color:#e65100;margin-bottom:6px;">💰 Reservation Charges</div>
          ${tableCharge>0?`<div style="font-size:0.82rem;display:flex;justify-content:space-between;"><span>${isVIP?'⭐ VIP':'Normal'} Table Charge:</span><span style="font-weight:700;color:var(--fire);">₹${tableCharge}</span></div>`:''}
          ${minSpend>0?`<div style="font-size:0.82rem;display:flex;justify-content:space-between;"><span>Min Spend (${guests} guest${guests>1?'s':''}):</span><span style="font-weight:700;color:var(--fire);">₹${totalMinSpend}</span></div>`:''}
          ${charges.chargeType?`<div style="font-size:0.75rem;color:var(--muted);margin-top:4px;">Type: ${charges.chargeType==='advance'?'Advance payment':'Adjust in bill'}</div>`:''}
          ${charges.note?`<div style="font-size:0.75rem;color:var(--muted);margin-top:2px;">📝 ${charges.note}</div>`:''}
        </div>`;
    }

    detail.innerHTML = `
      <div style="margin-bottom:6px;"><b>Table ${t.num}</b> ${t.section?'<span style="background:#f3e5f5;color:#7b1fa2;padding:2px 6px;border-radius:4px;font-size:0.72rem;">${t.section}</span>':''} • Capacity: ${t.cap} seats</div>
      ${date?`<div style="font-size:0.82rem;">📅 ${date} &nbsp; ⏰ ${time}</div>`:''}
      <div style="font-size:0.82rem;">👥 ${guests} guest${guests>1?'s':''}</div>
      ${t.note?`<div style="font-size:0.78rem;color:var(--muted);">📝 ${t.note}</div>`:''}
      ${chargeHTML}
    `;
  }
  showToast('🪑 Table '+t.num+' selected!');
  } catch(_e) { console.error("[SG] selectTable:", _e); }
}

// Refresh table picker when date/time/guests change
document.addEventListener('change', function(e) {
  if(['dineInDate','dineInTime','dineInGuests'].includes(e.target.id)) {
    renderTablePicker();
  }
});


// =============================================
// ========= TABLE MANAGEMENT SYSTEM ===========
// =============================================

function getTables() { return JSON.parse(localStorage.getItem('sg_tables')||'[]'); }
function setTables(d) {
  try { localStorage.setItem('sg_tables',JSON.stringify(d)); sbSaveAllTables(d).catch(()=>{});
  } catch(_e) { console.error("[SG] setTables:", _e); }
}
function getReservations() { return JSON.parse(localStorage.getItem('sg_reservations')||'[]'); }
function setReservations(d) {
  try { localStorage.setItem('sg_reservations',JSON.stringify(d)); sbSaveAllReservations(d).catch(()=>{});
  } catch(_e) { console.error("[SG] setReservations:", _e); }
}
function getTblOrders() { return JSON.parse(localStorage.getItem('sg_tbl_orders')||'[]'); }
function setTblOrders(d) {
  try { localStorage.setItem('sg_tbl_orders',JSON.stringify(d));
  } catch(_e) { console.error("[SG] setTblOrders:", _e); }
}
function tblCan(p)          { return currentUser?.role==='Admin' || currentUser?.perms?.includes(p); }

let tblTimerInterval = null;
let tblAddTableId = null;
let tblAddCart = {};

// Sub-tab switching
function showTblTab(tab, btn) {
  try {
  document.querySelectorAll('.tbl-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tbl-sub-tab').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('tbl-'+tab);
  if(sec) sec.classList.add('active');
  if(btn) btn.classList.add('active');
  if(tab==='floor')        renderFloorPlan();
  if(tab==='reservations') renderReservations();
  if(tab==='setup') {
    renderSetupTable();
    renderTableChargesSection();
  }
  if(tab==='reports')      renderTblReports();
  } catch(_e) { console.error("[SG] showTblTab:", _e); }
}

// ===== FLOOR PLAN =====
function renderFloorPlan() {
  try {
  const tables = getTables();
  const grid = document.getElementById('floorGrid');
  if(!grid) return;

  updateTblStats(tables);

  if(!tables.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--muted);"><div style="font-size:3rem;">🪑</div><p>No tables found. Add tables from Setup tab.</p></div>';
    return;
  }

  const tblOrds = getTblOrders();

  grid.innerHTML = tables.map(t => {
    const st = t.status || 'available';
    const activeOrds = tblOrds.filter(o => o.tableId === t.id && o.status === 'active');
    const ordTotal = activeOrds.reduce((s,o) => s + o.items.reduce((ss,i) => ss + i.price*i.qty, 0), 0);
    const elapsed = t.occupiedAt ? Math.floor((Date.now()-t.occupiedAt)/60000) : 0;
    const stColors = {available:'#4caf50', occupied:'#f44336', reserved:'#ff9800', cleaning:'#2196f3'};
    const stBg = {available:'#e8f5e9', occupied:'#fce4ec', reserved:'#fff8e1', cleaning:'#e3f2fd'};
    const shapeStyle = t.shape==='round' ? 'border-radius:50%;' : '';

    return `<div style="background:${stBg[st]};border:3px solid ${stColors[st]};border-radius:14px;${shapeStyle}padding:16px;cursor:pointer;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.08);transition:transform 0.2s;position:relative;"
      onclick="openTableAction('${t.id}')"
      onmouseover="this.style.transform='translateY(-3px)'"
      onmouseout="this.style.transform='translateY(0)'">
      <div style="position:absolute;top:8px;right:8px;width:10px;height:10px;border-radius:50%;background:${stColors[st]};"></div>
      <div style="font-size:1.6rem;font-weight:900;color:var(--dark);">${t.num}</div>
      <div style="font-size:0.75rem;color:var(--muted);">👥 ${t.cap} seats${t.section?' • '+t.section:''}</div>
      <div style="font-size:0.72rem;font-weight:700;color:${stColors[st]};text-transform:uppercase;margin-top:2px;">${st}</div>
      ${st==='occupied' && t.occupiedAt ? `<div style="font-size:0.75rem;color:#666;font-family:monospace;margin-top:3px;">${elapsed}m</div>` : ''}
      ${ordTotal > 0 ? `<div style="font-size:0.82rem;font-weight:800;color:var(--fire);margin-top:3px;">₹${ordTotal}</div>` : ''}
    </div>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderFloorPlan:", _e); }
}

function updateTblStats(tables) {
  try {
  const el = id => document.getElementById(id);
  if(el('tblTotalCount'))  el('tblTotalCount').textContent  = tables.length;
  if(el('tblAvailCount'))  el('tblAvailCount').textContent  = tables.filter(t=>t.status==='available'||!t.status).length;
  if(el('tblOccupCount'))  el('tblOccupCount').textContent  = tables.filter(t=>t.status==='occupied').length;
  if(el('tblReservCount')) el('tblReservCount').textContent = tables.filter(t=>t.status==='reserved').length;
  if(el('tblCleanCount'))  el('tblCleanCount').textContent  = tables.filter(t=>t.status==='cleaning').length;
  // Reservation badge
  const today = new Date().toISOString().split('T')[0];
  const todayR = getReservations().filter(r=>r.date===today&&r.status!=='cancelled').length;
  const badge = document.getElementById('tableReservBadge');
  if(badge){ badge.textContent=todayR; badge.style.display=todayR>0?'flex':'none'; }
  } catch(_e) { console.error("[SG] updateTblStats:", _e); }
}

function changeTableStatus(tableId, newStatus) {
  try {
  const tables = getTables();
  const t = tables.find(x=>x.id===tableId);
  if(!t) return;
  t.status = newStatus;
  if(newStatus==='occupied' && !t.occupiedAt) t.occupiedAt = Date.now();
  if(newStatus==='available') { t.occupiedAt=null; }
  setTables(tables);
  closeModal('tblActionModal');
  renderFloorPlan();
  showToast('Table '+t.num+' → '+newStatus);
  } catch(_e) { console.error("[SG] changeTableStatus:", _e); }
}

// ===== TABLE ACTION MODAL =====
function openTableAction(tableId) {
  try {
  const tables = getTables();
  const t = tables.find(x=>x.id===tableId);
  if(!t) return;

  document.getElementById('tblActionId').value = tableId;

  const stColors = {available:'#e8f5e9', occupied:'#fce4ec', reserved:'#fff8e1', cleaning:'#e3f2fd'};
  const icon = document.getElementById('tblActionIcon');
  icon.textContent = t.num;
  icon.style.background = stColors[t.status||'available'];

  document.getElementById('tblActionTitle').textContent = 'Table ' + t.num;
  document.getElementById('tblActionSub').textContent = (t.cap||'?')+' seats'+(t.section?' • '+t.section:'')+(t.status?' • '+(t.status||'').toUpperCase():'');

  // Current order
  const activeOrds = getTblOrders().filter(o=>o.tableId===tableId&&o.status==='active');
  const orderDiv = document.getElementById('tblCurrentOrder');
  if(activeOrds.length) {
    const allItems = activeOrds.flatMap(o=>o.items);
    const total = allItems.reduce((s,i)=>s+i.price*i.qty, 0);
    orderDiv.innerHTML = allItems.map(i=>`
      <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:3px 0;">
        <span>${i.name} ×${i.qty}</span><span>₹${i.price*i.qty}</span>
      </div>`).join('') +
      `<div style="border-top:1px dashed #ddd;margin-top:6px;padding-top:6px;font-weight:700;display:flex;justify-content:space-between;">
        <span>Total</span><span style="color:var(--fire);">₹${total}</span>
      </div>`;
  } else {
    orderDiv.innerHTML = '<p style="color:var(--muted);font-size:0.82rem;">No active orders</p>';
  }

  document.getElementById('tblActionModal').classList.add('open');
  } catch(_e) { console.error("[SG] openTableAction:", _e); }
}

// ===== QUICK WALK-IN =====
function quickWalkIn(tableId) {
  try {
  const tables = getTables();
  const t = tables.find(x=>x.id===tableId);
  if(!t) return;
  t.status = 'occupied';
  t.occupiedAt = t.occupiedAt || Date.now();
  setTables(tables);
  closeModal('tblActionModal');
  openAddItemsToTable(tableId);
  } catch(_e) { console.error("[SG] quickWalkIn:", _e); }
}

// ===== ADD ITEMS TO TABLE =====
function openAddItemsToTable(tableId) {
  try {
  tblAddTableId = tableId;
  tblAddCart = {};
  const tables = getTables();
  const t = tables.find(x=>x.id===tableId);
  document.getElementById('tblAddItemsTitle').textContent = 'Table ' + (t?t.num:'');
  document.getElementById('tblItemNote').value = '';

  const menuItems = getMenuItems().filter(m=>isItemAvailableNow(m));
  const grid = document.getElementById('tblMenuItemsGrid');

  grid.innerHTML = menuItems.map(item => `
    <div style="background:var(--cream);border-radius:10px;padding:12px;text-align:center;border:2px solid transparent;cursor:pointer;transition:all 0.2s;" id="tblMCard_${item.id}">
      <div style="font-size:2rem;">${item.emoji||'🍽️'}</div>
      <div style="font-weight:700;font-size:0.85rem;margin-top:4px;">${item.name}</div>
      <div style="color:var(--fire);font-weight:700;font-size:0.85rem;">₹${item.price}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;">
        <button onclick="tblMenuQty(${item.id},-1)" style="width:26px;height:26px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;font-weight:700;font-size:1rem;">−</button>
        <span id="tblMQty_${item.id}" style="font-weight:800;min-width:18px;text-align:center;">0</span>
        <button onclick="tblMenuQty(${item.id},1)" style="width:26px;height:26px;border-radius:50%;border:1px solid #ddd;background:#fff;cursor:pointer;font-weight:700;font-size:1rem;">+</button>
      </div>
    </div>`).join('');

  updateTblSelectedItems();
  document.getElementById('tblAddItemsModal').classList.add('open');
  } catch(_e) { console.error("[SG] openAddItemsToTable:", _e); }
}

function tblMenuQty(id, delta) {
  try {
  tblAddCart[id] = Math.max(0, (tblAddCart[id]||0) + delta);
  if(tblAddCart[id]===0) delete tblAddCart[id];
  const el = document.getElementById('tblMQty_'+id);
  if(el) el.textContent = tblAddCart[id]||0;
  const card = document.getElementById('tblMCard_'+id);
  if(card) card.style.borderColor = tblAddCart[id]>0 ? 'var(--fire)' : 'transparent';
  updateTblSelectedItems();
  } catch(_e) { console.error("[SG] tblMenuQty:", _e); }
}

function updateTblSelectedItems() {
  try {
  const sel = document.getElementById('tblSelectedItems');
  if(!sel) return;
  const entries = Object.entries(tblAddCart);
  if(!entries.length) { sel.innerHTML='<p style="color:var(--muted);font-size:0.82rem;">No items selected</p>'; return; }
  const menuItems = getMenuItems();
  sel.innerHTML = entries.map(([id,qty]) => {
    const item = menuItems.find(m=>String(m.id)==String(id));
    return item ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:0.85rem;"><span>${item.name} ×${qty}</span><span>₹${item.price*qty}</span></div>` : '';
  }).join('');
  } catch(_e) { console.error("[SG] updateTblSelectedItems:", _e); }
}

function addItemsToTable() {
  try {
  if(!tblAddTableId) return;
  if(!Object.keys(tblAddCart).length) { showToast('No items selected','error'); return; }
  const menuItems = getMenuItems();
  const items = Object.entries(tblAddCart).map(([id,qty]) => {
    const item = menuItems.find(m=>String(m.id)==String(id));
    return {name:item.name, qty, price:item.price};
  });
  const tblOrders = getTblOrders();
  tblOrders.push({
    id:'TO'+Date.now(), tableId:tblAddTableId,
    items, note:document.getElementById('tblItemNote').value,
    status:'active', createdAt:new Date().toLocaleString('en-IN')
  });
  setTblOrders(tblOrders);
  closeModal('tblAddItemsModal');
  renderFloorPlan();
  showToast('✅ Items add ho gaye!');
  } catch(_e) { console.error("[SG] addItemsToTable:", _e); }
}

// ===== BILLING =====
function generateBill(tableId) {
  try {
  const tables = getTables();
  const t = tables.find(x=>x.id===tableId);
  if(!t) return;
  const activeOrds = getTblOrders().filter(o=>o.tableId===tableId&&o.status==='active');
  if(!activeOrds.length) { showToast('No orders yet','error'); return; }
  const allItems = activeOrds.flatMap(o=>o.items);
  const subtotal = allItems.reduce((s,i)=>s+i.price*i.qty, 0);
  const gstAmt = Math.round(subtotal * getGSTRate()/100);
  const total = subtotal + gstAmt;
  document.getElementById('billTableTitle').textContent = 'Table '+t.num;
  document.getElementById('billTableId').value = tableId;
  document.getElementById('billContent').innerHTML = `
    <div style="border:1px solid #f0ebe5;border-radius:8px;overflow:hidden;">
      <div style="background:#faf7f4;padding:8px 14px;font-size:0.78rem;font-weight:700;color:var(--muted);">ITEMS</div>
      <div style="padding:10px 14px;">
        ${allItems.map(i=>`
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #fafafa;font-size:0.85rem;">
            <span>${i.name} ×${i.qty}</span><span>₹${i.price*i.qty}</span>
          </div>`).join('')}
        <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.85rem;"><span style="color:var(--muted)">Subtotal</span><span>₹${subtotal}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.85rem;"><span style="color:var(--muted)">GST (${getGSTRate()}%)</span><span>₹${gstAmt}</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0 0;font-weight:800;font-size:1rem;border-top:2px solid #e8d5c8;"><span>Total</span><span style="color:var(--fire);">₹${total}</span></div>
      </div>
    </div>`;
  document.getElementById('billSplitCount').value=1;
  document.getElementById('splitInfo').innerHTML='';
  closeModal('tblActionModal');
  document.getElementById('tblBillModal').classList.add('open');
  } catch(_e) { console.error("[SG] generateBill:", _e); }
}

function updateSplitBill() {
  try {
  const count = parseInt(document.getElementById('billSplitCount').value)||1;
  const tableId = document.getElementById('billTableId').value;
  const activeOrds = getTblOrders().filter(o=>o.tableId===tableId&&o.status==='active');
  const allItems = activeOrds.flatMap(o=>o.items);
  const subtotal = allItems.reduce((s,i)=>s+i.price*i.qty, 0);
  const total = subtotal + Math.round(subtotal*getGSTRate()/100);
  if(count>1) document.getElementById('splitInfo').innerHTML = `Each person: <b style="color:var(--fire);">₹${Math.ceil(total/count)}</b>`;
  else document.getElementById('splitInfo').innerHTML='';
  } catch(_e) { console.error("[SG] updateSplitBill:", _e); }
}

function confirmPayment() {
  try {
  const tableId = document.getElementById('billTableId').value;
  const payMode = document.getElementById('billPayMode').value;
  const tblOrders = getTblOrders();
  tblOrders.forEach(o=>{
    if(o.tableId===tableId && o.status==='active') {
      o.status='paid'; o.payMode=payMode; o.paidAt=new Date().toLocaleString('en-IN');
    }
  });
  setTblOrders(tblOrders);
  // Set table to cleaning
  const tables = getTables();
  const t = tables.find(x=>x.id===tableId);
  if(t) { t.status='cleaning'; t.occupiedAt=null; setTables(tables); }
  closeModal('tblBillModal');
  renderFloorPlan();
  showToast('✅ Payment complete! Table set to Cleaning.');
  } catch(_e) { console.error("[SG] confirmPayment:", _e); }
}

// ===== TRANSFER =====
function openTransferModal(tableId) {
  try {
  const tables = getTables();
  const t = tables.find(x=>x.id===tableId);
  document.getElementById('transferFromId').value = tableId;
  document.getElementById('transferFromLabel').value = 'Table '+t.num;
  const sel = document.getElementById('transferToId');
  sel.innerHTML = '<option value="">-- Select an available table --</option>';
  tables.filter(x=>x.id!==tableId && (x.status==='available'||!x.status)).forEach(x=>{
    const o=document.createElement('option'); o.value=x.id; o.textContent='Table '+x.num+' ('+x.cap+' seats)'; sel.appendChild(o);
  });
  closeModal('tblActionModal');
  document.getElementById('tblTransferModal').classList.add('open');
  } catch(_e) { console.error("[SG] openTransferModal:", _e); }
}

function confirmTransfer() {
  try {
  const fromId=document.getElementById('transferFromId').value;
  const toId=document.getElementById('transferToId').value;
  if(!toId){showToast('Please select a table','error');return;}
  const tables=getTables();
  const from=tables.find(x=>x.id===fromId);
  const to=tables.find(x=>x.id===toId);
  to.status='occupied'; to.occupiedAt=from.occupiedAt||Date.now();
  from.status='available'; from.occupiedAt=null;
  setTables(tables);
  const tblOrds=getTblOrders();
  tblOrds.forEach(o=>{if(o.tableId===fromId&&o.status==='active') o.tableId=toId;});
  setTblOrders(tblOrds);
  closeModal('tblTransferModal');
  renderFloorPlan();
  showToast('✅ Table '+from.num+' transferred to Table '+to.num+'!');
  } catch(_e) { console.error("[SG] confirmTransfer:", _e); }
}

// ===== MERGE =====
function openMergeModal(tableId) {
  try {
  const tables=getTables();
  const t=tables.find(x=>x.id===tableId);
  document.getElementById('mergeMainId').value=tableId;
  document.getElementById('mergeMainLabel').value='Table '+t.num;
  const sel=document.getElementById('mergeWithId');
  sel.innerHTML='<option value="">-- Please select a table --</option>';
  tables.filter(x=>x.id!==tableId).forEach(x=>{
    const o=document.createElement('option');o.value=x.id;o.textContent='Table '+x.num+' ('+x.status+')';sel.appendChild(o);
  });
  closeModal('tblActionModal');
  document.getElementById('tblMergeModal').classList.add('open');
  } catch(_e) { console.error("[SG] openMergeModal:", _e); }
}

function confirmMerge() {
  try {
  const mainId=document.getElementById('mergeMainId').value;
  const withId=document.getElementById('mergeWithId').value;
  if(!withId){showToast('Please select a table','error');return;}
  const tables=getTables();
  const withT=tables.find(x=>x.id===withId);
  if(withT){withT.status='occupied'; withT.mergedWith=mainId;}
  setTables(tables);
  closeModal('tblMergeModal');
  renderFloorPlan();
  showToast('✅ Tables merged successfully!');
  } catch(_e) { console.error("[SG] confirmMerge:", _e); }
}

// ===== TABLE SETUP =====
function openTblModal(type) {
  try {
  if(type==='setup') {
    document.getElementById('tblSetupTitle').textContent='🪑 Add Table';
    document.getElementById('editTableId').value='';
    ['tblNum','tblNote'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    const cap=document.getElementById('tblCap'); if(cap) cap.value='';
    const shape=document.getElementById('tblShape'); if(shape) shape.value='square';
    const sec=document.getElementById('tblSection'); if(sec) sec.value='';
    document.getElementById('tblSetupModal').classList.add('open');
  } else if(type==='reservation') {
    document.getElementById('reservModalTitle').textContent='📅 New Reservation';
    document.getElementById('editReservId').value='';
    ['reservName','reservPhone','reservGuests','reservNotes'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    const emailEl=document.getElementById('reservEmail'); if(emailEl) emailEl.value='';
    const addrEl=document.getElementById('reservAddress'); if(addrEl) addrEl.value='';
    const rd=document.getElementById('reservDate'); if(rd) rd.value=new Date().toISOString().split('T')[0];
    const rt=document.getElementById('reservTime'); if(rt) rt.value='';
    const sel=document.getElementById('reservTable');
    if(sel) {
      sel.innerHTML='<option value="">-- Select Table --</option>';
      getTables().forEach(t=>{ 
        const o=document.createElement('option');
        o.value=t.id;
        o.textContent=(t.name||'Table '+t.num)+' ('+t.cap+' seats)';
        sel.appendChild(o); 
      });
    }
    const slotDiv=document.getElementById('reservSlotPicker');
    if(slotDiv) slotDiv.innerHTML='<div style="font-size:0.85rem;color:var(--muted);padding:10px;background:#f9f7f5;border-radius:8px;">Please select a table and date first</div>';
    document.getElementById('tblReservModal').classList.add('open');
  }
  } catch(_e) { console.error("[SG] openTblModal:", _e); }
}



// ===== AM/PM TIME HELPERS =====
function setSlotTime(inputId, val) {
  try {
  const el = document.getElementById(inputId);
  if(el) {
    el.value = val;
    // Show AM/PM label
    const labelId = inputId + 'AMPM';
    const lbl = document.getElementById(labelId);
    if(lbl) lbl.textContent = to12hr(val);
    // Highlight active button
    const btnContainer = el.previousElementSibling?.previousElementSibling;
  }
  } catch(_e) { console.error("[SG] setSlotTime:", _e); }
}

function buildSlotTime(type) {
  try {
  const prefix = type === 'start' ? 's' : 'e';
  const hour   = document.getElementById(prefix + 'Hour').value;
  const min    = document.getElementById(prefix + 'Min').value;
  const ampm   = document.getElementById(prefix + 'AmPm').value;
  const dispId = type === 'start' ? 'startDisplay' : 'endDisplay';
  const hidId  = type === 'start' ? 'newSlotStart' : 'newSlotEnd';
  const disp   = document.getElementById(dispId);
  const hid    = document.getElementById(hidId);

  if(!hour || !min || !ampm) {
    if(disp) disp.textContent = '';
    if(hid) hid.value = '';
    return;
  }

  // Convert to 24hr for storage
  let h24 = parseInt(hour);
  if(ampm === 'AM' && h24 === 12) h24 = 0;
  if(ampm === 'PM' && h24 !== 12) h24 += 12;
  const time24 = String(h24).padStart(2,'0') + ':' + min;

  if(hid) hid.value = time24;
  if(disp) disp.textContent = hour + ':' + min + ' ' + ampm;
  } catch(_e) { console.error("[SG] buildSlotTime:", _e); }
}

function applyQuickTime(inputId, selectId, labelId) {
  try {
  const sel = document.getElementById(selectId);
  const inp = document.getElementById(inputId);
  const lbl = document.getElementById(labelId);
  if(sel && inp && sel.value) {
    inp.value = sel.value;
    if(lbl) lbl.textContent = to12hr(sel.value);
  }
  } catch(_e) { console.error("[SG] applyQuickTime:", _e); }
}

function updateSlotAMPM(val, labelId) {
  try {
  const lbl = document.getElementById(labelId);
  if(lbl) lbl.textContent = to12hr(val);
  } catch(_e) { console.error("[SG] updateSlotAMPM:", _e); }
}

function to12hr(time24) {
  try {
  if(!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return h12 + ':' + String(m).padStart(2,'0') + ' ' + ampm;
  } catch(_e) { console.error("[SG] to12hr:", _e); }
}

function formatSlotLabel(start, end) {
  return to12hr(start) + ' – ' + to12hr(end);
}


// =============================================
// ===== TABLE DATE-WISE SLOTS SYSTEM ==========
// =============================================

let currentTableDateSlots = {}; // {date: [{start,end,charge}]}
let currentEditingDate = null;
let tempDaySlots = []; // slots being added for current date

function toggleReservOnlySection() {
  try {
  const cb = document.getElementById('tblReservOnly');
  const slotsSection = document.getElementById('tblTimeSlotsSection');
  const slider = document.getElementById('tblReservSlider');
  const thumb = document.getElementById('tblReservThumb');
  if(cb.checked) {
    slotsSection.style.display = 'block';
    slider.style.background = '#e44d1a';
    thumb.style.transform = 'translateX(22px)';
  } else {
    slotsSection.style.display = 'none';
    slider.style.background = '#ddd';
    thumb.style.transform = 'translateX(0)';
  }
  renderAllDates();
  } catch(_e) { console.error("[SG] toggleReservOnlySection:", _e); }
}

// Extra Bug #1 fix: yahan renderSlotTimePickers() thi jo purane dropdown-style
// selects (id newSlotStart/newSlotEnd) inject karti thi. Woh function kabhi call
// hi nahi hoti (dead code) aur static hidden inputs se id collision banati thi.
// Hata di — live UI hidden inputs + buildSlotTime()/sHour picker use karta hai.



// ===== TABLE SETUP FUNCTIONS =====

function saveTableSetup() {
  try {
  const id = document.getElementById('editTableId').value || 'tbl_'+Date.now();
  const num = document.getElementById('tblNum').value.trim();
  const cap = document.getElementById('tblCap').value;
  if(!num) { showToast('Table number required','error'); return; }
  if(!cap) { showToast('Capacity required','error'); return; }
  const reservOnly = document.getElementById('tblReservOnly')?.checked || false;
  const tables = getTables();
  const existing = tables.findIndex(t => t.id === id);
  const table = {
    id, num, cap: parseInt(cap),
    shape: document.getElementById('tblShape').value,
    section: document.getElementById('tblSection').value,
    note: document.getElementById('tblNote') ? document.getElementById('tblNote').value : '',
    status: existing >= 0 ? tables[existing].status : 'available',
    reservationOnly: reservOnly,
    dateSlots: reservOnly ? JSON.parse(JSON.stringify(currentTableDateSlots)) : {}
  };
  if(existing >= 0) tables[existing] = table;
  else tables.push(table);
  setTables(tables);
  currentTableDateSlots = {};
  tempDaySlots = [];
  ['tblNum','tblNote'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  const capEl = document.getElementById('tblCap'); if(capEl) capEl.value = '';
  const shapeEl = document.getElementById('tblShape'); if(shapeEl) shapeEl.value = 'square';
  const secEl = document.getElementById('tblSection'); if(secEl) secEl.value = '';
  const roCb = document.getElementById('tblReservOnly');
  if(roCb) { roCb.checked = false; toggleReservOnlySection(); }
  document.getElementById('editTableId').value = '';
  const modal = document.getElementById('tblSetupModal');
  if(modal) modal.classList.remove('open');
  renderSetupTable();
  renderFloorPlan();
  showToast('✅ Table ' + num + ' saved!');
  } catch(_e) { console.error("[SG] saveTableSetup:", _e); }
}

function renderSetupTable() {
  try {
  const tables = getTables();
  const tbody = document.getElementById('setupTableBody');
  if(!tbody) return;
  if(!tables.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><div class="empty-icon">🪑</div><p>No tables yet. Click Add Table.</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = tables.map((t, idx) => `
    <tr>
      <td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${idx+1}</td>
      <td><b style="font-size:1.1rem;">${t.num}</b>${t.reservationOnly ? '<br><span style="font-size:0.65rem;color:#1565c0;background:#e3f2fd;padding:1px 5px;border-radius:4px;">🔒 Reservation</span>' : ''}</td>
      <td>👥 ${t.cap}</td>
      <td>${t.shape || 'square'}</td>
      <td>${t.section || '—'}</td>
      <td>${t.reservationOnly && t.dateSlots && Object.keys(t.dateSlots).length ?
        '<span style="font-size:0.72rem;color:#2e7d32;font-weight:600;">' + Object.keys(t.dateSlots).length + ' dates</span>' :
        '<span class="status ' + (t.status === 'available' ? 'confirmed' : t.status === 'occupied' ? 'cancelled' : t.status === 'reserved' ? 'pending' : 'preparing') + '">' + (t.status || 'available') + '</span>'
      }</td>
      <td>
        <div class="action-btns">
          <button class="act-btn act-edit" onclick="editTable('${t.id}')">Edit</button>
          <button class="act-btn act-delete" onclick="deleteTable('${t.id}')">Delete</button>
        </div>
      </td>
    </tr>`).join('');
  } catch(_e) { console.error("[SG] renderSetupTable:", _e); }
}

function editTable(id) {
  try {
  const t = getTables().find(x => x.id === id);
  if(!t) return;
  document.getElementById('editTableId').value = t.id;
  document.getElementById('tblSetupTitle').textContent = '✏️ Edit Table';
  document.getElementById('tblNum').value = t.num;
  document.getElementById('tblCap').value = t.cap;
  document.getElementById('tblShape').value = t.shape || 'square';
  document.getElementById('tblSection').value = t.section || '';
  if(document.getElementById('tblNote')) document.getElementById('tblNote').value = t.note || '';
  currentTableDateSlots = t.dateSlots ? JSON.parse(JSON.stringify(t.dateSlots)) : {};
  tempDaySlots = [];
  const roCb = document.getElementById('tblReservOnly');
  if(roCb) { roCb.checked = t.reservationOnly || false; toggleReservOnlySection(); }
  document.getElementById('tblSetupModal').classList.add('open');
  } catch(_e) { console.error("[SG] editTable:", _e); }
}

function deleteTable(id) {
  try {
  if(!confirm('Are you sure you want to delete this table?')) return;
  setTables(getTables().filter(t => t.id !== id));
  renderSetupTable();
  renderFloorPlan();
  showToast('Table deleted');
  } catch(_e) { console.error("[SG] deleteTable:", _e); }
}


// ===== SLOT AVAILABILITY CHECK =====

function clearCancelledReservations() {
  try {
  if(!confirm('Delete all CANCELLED reservations?')) return;
  let res = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const before = res.length;
  res = res.filter(r => r.status !== 'cancelled');
  localStorage.setItem('tbl_reservations', JSON.stringify(res)); sbSaveAllReservations(res).catch(()=>{});
  renderReservations();
  showToast('✅ ' + (before - res.length) + ' cancelled reservations deleted!');
  } catch(_e) { console.error("[SG] clearCancelledReservations:", _e); }
}

function clearAllReservations() {
  try {
  if(!confirm('⚠️ Delete ALL reservations? This cannot be undone!')) return;
  if(!confirm('Are you sure? ALL reservations will be deleted!')) return;
  localStorage.setItem('tbl_reservations', '[]'); sbSaveAllReservations([]).catch(()=>{});
  renderReservations();
  showToast('✅ All reservations cleared!');
  } catch(_e) { console.error("[SG] clearAllReservations:", _e); }
}


// ===== OFFLINE RESERVATION SLOT PICKER =====
function loadReservSlots() {
  try {
  const tableId = document.getElementById('reservTable').value;
  const date = document.getElementById('reservDate').value;
  const div = document.getElementById('reservSlotPicker');
  if(!div) return;

  if(!tableId || !date) {
    div.innerHTML = '<div style="font-size:0.85rem;color:var(--muted);padding:10px;background:#f9f7f5;border-radius:8px;">Please select a table and date first</div>';
    return;
  }

  const tables = getTables();
  const table = tables.find(t=>t.id===tableId);
  const reservations = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const editId = document.getElementById('editReservId').value || null;

  // Check if table has date slots
  if(!table || !table.dateSlots || !table.dateSlots[date] || !table.dateSlots[date].length) {
    // No predefined slots - show simple time input
    div.innerHTML = `
      <div style="background:#fff8e1;border-radius:8px;padding:10px;margin-bottom:8px;font-size:0.82rem;color:#e65100;">
        ℹ️ No time slots defined for this table on this date. Enter time manually:
      </div>
      <input type="time" id="reservManualTime" class="form-input" 
        onchange="document.getElementById('reservTime').value=this.value"
        style="width:100%;">`;
    return;
  }

  const slots = table.dateSlots[date];

  div.innerHTML = `
    <div style="font-size:0.82rem;color:var(--muted);margin-bottom:8px;">
      Select a time slot for <b>${table.name||table.id}</b> on <b>${date}</b>:
    </div>
    ${slots.map((s,i) => {
      // Check if booked
      const booked = reservations.some(r => {
        if(r.id === editId) return false;
        if(r.status === 'cancelled') return false;
        if(r.table !== tableId || r.date !== date) return false;
        if(r.time === s.start) return true;
        if(r.dineInSlots && r.dineInSlots.some(rs=>rs.start===s.start)) return true;
        return false;
      });

      const label = to12hr(s.start) + ' – ' + to12hr(s.end);
      const charge = s.charge > 0 ? ' · ₹'+s.charge : ' · Free';

      return `<div onclick="${!booked ? 'selectReservSlot(this,\''+s.start+'\')' : ''}"
        style="display:flex;align-items:center;gap:10px;padding:10px 14px;
               border-radius:10px;margin-bottom:8px;
               cursor:${booked?'not-allowed':'pointer'};
               background:${booked?'#f5f5f5':'#fff'};
               border:2px solid ${booked?'#ddd':'#e8d5c8'};"
        id="reservSlot_${i}">
        <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${booked?'#ccc':'var(--fire)'};
             background:${booked?'#eee':'#fff'};flex-shrink:0;" id="reservSlotDot_${i}"></div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:0.9rem;color:${booked?'#aaa':'var(--dark)'};">⏰ ${label}</div>
          <div style="font-size:0.78rem;color:${booked?'#aaa':'var(--fire)'};font-weight:600;">
            ${charge}${booked?' · 🔒 Already Booked':''}
          </div>
        </div>
      </div>`;
    }).join('')}`;
  } catch(_e) { console.error("[SG] loadReservSlots:", _e); }
}

function selectReservSlot(el, startTime) {
  try {
  // Deselect all
  document.querySelectorAll('[id^="reservSlot_"]').forEach(d => {
    d.style.background = '#fff';
    d.style.borderColor = '#e8d5c8';
  });
  document.querySelectorAll('[id^="reservSlotDot_"]').forEach(d => {
    d.style.background = '#fff';
    d.style.borderColor = 'var(--fire)';
  });

  // Select this
  el.style.background = 'var(--fire)';
  el.style.borderColor = 'var(--fire)';
  el.style.color = '#fff';
  const dot = el.querySelector('[id^="reservSlotDot_"]');
  if(dot) { dot.style.background = '#fff'; dot.style.borderColor = '#fff'; }

  // Set hidden time value
  document.getElementById('reservTime').value = startTime;
  } catch(_e) { console.error("[SG] selectReservSlot:", _e); }
}

function isSlotBooked(tableId, date, time, excludeReservId) {
  try {
  const reservations = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  return reservations.some(r => {
    if(r.id === excludeReservId) return false; // exclude current reservation (for edit/reschedule)
    if(r.status === 'cancelled') return false; // cancelled slots are free
    if(r.table !== tableId) return false;
    if(r.date !== date) return false;
    // Check time match - handle both single time and slot range
    if(r.time === time) return true;
    // Check dineInSlots overlap
    if(r.dineInSlots && r.dineInSlots.length) {
      return r.dineInSlots.some(s => s.start === time || s.end === time);
    }
    return false;
  });
  } catch(_e) { console.error("[SG] isSlotBooked:", _e); }
}

function getSlotAvailability(tableId, date) {
  try {
  // Returns list of booked times for this table+date
  const reservations = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const booked = [];
  reservations.forEach(r => {
    if(r.status === 'cancelled') return;
    if(r.table !== tableId || r.date !== date) return;
    booked.push(r.time);
    if(r.dineInSlots) r.dineInSlots.forEach(s => { booked.push(s.start); booked.push(s.end); });
  });
  return booked;
  } catch(_e) { console.error("[SG] getSlotAvailability:", _e); }
}

// ===== RESERVATIONS =====
function saveReservation() {
  try {
  const name = document.getElementById('reservName').value.trim();
  const phone = document.getElementById('reservPhone').value.trim();
  const email = document.getElementById('reservEmail')?.value.trim() || '';
  const address = document.getElementById('reservAddress')?.value.trim() || '';
  const date = document.getElementById('reservDate').value;
  const time = document.getElementById('reservTime').value;
  const tableId = document.getElementById('reservTable').value;
  const guests = document.getElementById('reservGuests').value;
  const notes = document.getElementById('reservNotes').value;

  // Validation
  if(!name) { showToast('Guest name required','error'); return; }
  if(!phone) { showToast('Mobile number required','error'); return; }
  if(!tableId) { showToast('Please select a table','error'); return; }
  if(!date) { showToast('Please select a date','error'); return; }
  if(!time) { showToast('Please select a time slot','error'); return; }

  const id = document.getElementById('editReservId').value || 'R'+Date.now();
  const reservations = JSON.parse(localStorage.getItem('tbl_reservations') || '[]');
  const existing = reservations.findIndex(r => r.id === id);

  // Check slot availability before saving
  const editId = existing >= 0 ? id : null;
  if(isSlotBooked(tableId, date, time, editId)) {
    showToast('❌ This slot is already booked! Please select another date or time.','error');
    return;
  }

  const resv = { 
    id, name, phone, email, address, date, time, 
    table: tableId, guests, notes, 
    status: 'confirmed', 
    createdAt: new Date().toLocaleString('en-IN') 
  };
  if(existing >= 0) reservations[existing] = resv;
  else reservations.push(resv);
  localStorage.setItem('tbl_reservations', JSON.stringify(reservations));
  closeModal('tblReservModal');
  renderReservations();
  showToast('✅ Reservation saved!');
  } catch(_e) { console.error("[SG] saveReservation:", _e); }
}

// ===== DATE-WISE SLOTS =====
function loadDateForSlots() {
  try {
  const date = document.getElementById('newSlotDate').value;
  if(!date) { showToast('Please select a date','error'); return; }
  currentEditingDate = date;
  tempDaySlots = currentTableDateSlots[date] ? [...currentTableDateSlots[date]] : [];
  const adder = document.getElementById('tblSlotAdder');
  const label = document.getElementById('tblSlotDateLabel');
  if(adder) adder.style.display = 'block';
  if(label) label.textContent = '📅 Slots for: ' + new Date(date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  renderTempDaySlots();
  } catch(_e) { console.error("[SG] loadDateForSlots:", _e); }
}

function addTableSlot() {
  try {
  const start = document.getElementById('newSlotStart').value;
  const end = document.getElementById('newSlotEnd').value;
  const charge = parseFloat(document.getElementById('newSlotCharge').value) || 0;
  if(!start || !end) { showToast('Please select start and end time','error'); return; }
  if(start >= end) { showToast('End time must be after start time','error'); return; }
  const overlap = tempDaySlots.some(s => !(end <= s.start || start >= s.end));
  if(overlap) { showToast('This slot overlaps with existing slot','error'); return; }
  tempDaySlots.push({start, end, charge});
  tempDaySlots.sort((a,b) => a.start.localeCompare(b.start));
  document.getElementById('newSlotStart').value = '';
  document.getElementById('newSlotEnd').value = '';
  document.getElementById('newSlotCharge').value = '';
  renderTempDaySlots();
  showToast('Slot added!');
  } catch(_e) { console.error("[SG] addTableSlot:", _e); }
}

function saveCurrentDateSlots() {
  try {
  if(!currentEditingDate) { showToast('No date selected','error'); return; }
  if(!tempDaySlots.length) { showToast('Add at least one slot first','error'); return; }
  currentTableDateSlots[currentEditingDate] = [...tempDaySlots];
  tempDaySlots = [];
  currentEditingDate = null;
  document.getElementById('tblSlotAdder').style.display = 'none';
  document.getElementById('newSlotDate').value = '';
  renderAllDates();
  showToast("✅ Date's slots saved! Add more dates or Save Table.");
  } catch(_e) { console.error("[SG] saveCurrentDateSlots:", _e); }
}

function removeDate(date) {
  try {
  delete currentTableDateSlots[date];
  renderAllDates();
  showToast('Date removed');
  } catch(_e) { console.error("[SG] removeDate:", _e); }
}

function renderTempDaySlots() {
  try {
  const div = document.getElementById('tblCurrentDateSlots');
  if(!div) return;
  if(!tempDaySlots.length) {
    div.innerHTML = '<div style="font-size:0.82rem;color:#aaa;text-align:center;padding:8px;">No slots added for this date yet</div>';
    return;
  }
  div.innerHTML = tempDaySlots.map((s,i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #ffe082;flex-wrap:wrap;">
      <span style="font-size:0.85rem;font-weight:700;">⏰ ${to12hr(s.start)} – ${to12hr(s.end)}</span>
      <span style="font-size:0.72rem;color:#aaa;">(${s.start}–${s.end})</span>
      ${s.charge > 0 ? '<span style="font-size:0.78rem;color:var(--fire);font-weight:700;">₹'+s.charge+'</span>' : '<span style="font-size:0.75rem;color:#aaa;">Free</span>'}
      <button onclick="removeTempSlot(${i})" style="margin-left:auto;background:#fce4ec;color:#c62828;border:none;padding:3px 8px;border-radius:6px;font-size:0.75rem;cursor:pointer;">✕</button>
    </div>`).join('');
  } catch(_e) { console.error("[SG] renderTempDaySlots:", _e); }
}

function removeTempSlot(idx) {
  try {
  tempDaySlots.splice(idx, 1);
  renderTempDaySlots();
  } catch(_e) { console.error("[SG] removeTempSlot:", _e); }
}

function renderAllDates() {
  try {
  const div = document.getElementById('tblAllDatesView');
  const countEl = document.getElementById('tblDateCount');
  if(!div) return;
  const dates = Object.keys(currentTableDateSlots).sort();
  if(countEl) countEl.textContent = dates.length + ' date' + (dates.length !== 1 ? 's' : '');
  if(!dates.length) {
    div.innerHTML = '<div style="font-size:0.82rem;color:#888;text-align:center;padding:8px;">No dates added yet. Select a date above.</div>';
    return;
  }
  div.innerHTML = dates.map(date => {
    const slots = currentTableDateSlots[date];
    const dateStr = new Date(date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
    return `<div style="background:#fff;border-radius:8px;padding:10px;margin-bottom:8px;border:1px solid #c8e6c9;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="font-weight:700;color:#1b5e20;">📅 ${dateStr}</div>
        <button onclick="removeDate('${date}')" style="background:#fce4ec;color:#c62828;border:none;padding:2px 8px;border-radius:6px;font-size:0.75rem;cursor:pointer;">✕ Remove</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">
        ${slots.map(s => '<span style="font-size:0.75rem;background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;padding:3px 8px;font-weight:600;" title="' + s.start + '–' + s.end + '">⏰' + to12hr(s.start) + '–' + to12hr(s.end) + (s.charge > 0 ? ' ₹' + s.charge : '') + '</span>').join('')}
      </div>
    </div>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderAllDates:", _e); }
}



// ===== MISSING STAFF FUNCTIONS =====

function loadTemplateDropdown() {
  try {
  const sel = document.getElementById('templateRoleSelect') || document.getElementById('newStaffTemplate');
  if(!sel) return;
  const builtIn = [
    {id:'manager', name:'Manager', desc:'Full access except billing'},
    {id:'cashier', name:'Cashier', desc:'Orders, payments, customers'},
    {id:'kitchen', name:'Kitchen Staff', desc:'KDS and order status'},
    {id:'delivery', name:'Delivery Staff', desc:'Delivery orders only'},
    {id:'waiter', name:'Waiter', desc:'Dine-in orders and tables'},
    {id:'supervisor', name:'Floor Supervisor', desc:'Tables and staff oversight'},
  ];
  const custom = (_settingsCache['sg_custom_templates'])||[];
  sel.innerHTML = '<option value="">-- Select Template (Optional) --</option>' +
    '<optgroup label="Built-in Templates">' +
    builtIn.map(t=>`<option value="${t.id}">${t.name}</option>`).join('') +
    '</optgroup>' +
    (custom.length ? '<optgroup label="Custom Templates">' +
    custom.map(t=>`<option value="custom_${t.id}">${t.name}</option>`).join('') +
    '</optgroup>' : '');
  } catch(_e) { console.error("[SG] loadTemplateDropdown:", _e); }
}

function openAddTemplateModal() {
  try {
  // Reset form
  const nameEl = document.getElementById('tmplName');
  const descEl = document.getElementById('tmplDesc');
  const colorEl = document.getElementById('tmplColor');
  if(nameEl) nameEl.value = '';
  if(descEl) descEl.value = '';
  if(colorEl) colorEl.value = '#16a085';
  // Open proper modal
  document.getElementById('addTemplateModal').classList.add('open');
  } catch(_e) { console.error("[SG] openAddTemplateModal:", _e); }
}

function saveCustomTemplate() {
  try {
  var name = document.getElementById("tmplName").value.trim();
  var desc = document.getElementById("tmplDesc").value.trim();
  var color = document.getElementById("tmplColor").value;
  if(!name) { alert("Template name is required!"); return; }
  var templates = (_settingsCache['sg_custom_templates'])||[];
  if(templates.find(function(t){ return (t.name||'').toLowerCase()===name.toLowerCase(); })) {
    alert("Yeh template already exists!"); return;
  }
  templates.push({id: "ct_"+Date.now(), name: name, desc: desc, color: color, perms:[]});
  _settingsCache['sg_custom_templates']=templates; setSetting('sg_custom_templates', templates);
  document.getElementById("tmplName").value = "";
  document.getElementById("tmplDesc").value = "";
  var addM = document.getElementById("addTemplateModal");
  var manM = document.getElementById("manageTemplatesModal");
  if(addM) { addM.classList.remove("open"); addM.style.display="none"; }
  if(manM) { manM.classList.remove("open"); manM.style.display="none"; }
  setTimeout(function() {
    if(addM) addM.style.display="";
    if(manM) manM.style.display="";
    openManageTemplates();
  }, 200);
  } catch(_e) { console.error("[SG] saveCustomTemplate:", _e); }
}

function openManageTemplates() {
  try {
  const isAdm = currentUser?.role==='Admin';
  if(!isAdm) { showToast('Only Admin can manage templates','error'); return; }
  
  // Remove any old injected modals
  const old = document.getElementById('templateMgmtModal');
  if(old) old.remove();
  
  // Use existing modal
  const templates = (_settingsCache['sg_custom_templates'])||[];
  const builtIn = ['Manager','Cashier','Kitchen Staff','Delivery Staff','Waiter','Floor Supervisor'];
  
  let html = '<div style="margin-bottom:14px;">';
  html += '<div style="font-weight:700;margin-bottom:8px;font-size:0.88rem;">Built-in Templates</div>';
  html += builtIn.map(t=>`<div style="padding:8px 12px;background:#f9f7f5;border-radius:8px;margin-bottom:6px;font-size:0.85rem;">👤 ${t}</div>`).join('');
  html += '</div>';
  
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  html += '<div style="font-weight:700;font-size:0.88rem;">Custom Templates</div>';
  html += '<button onclick="openAddTemplateModal()" style="background:var(--fire);color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;">+ Add</button>';
  html += '</div>';
  
  if(templates.length) {
    html += templates.map((t,i)=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#e3f2fd;border-radius:8px;margin-bottom:6px;">
        <span style="font-size:0.85rem;font-weight:600;">⭐ ${t.name}</span>
        <button onclick="deleteCustomTemplate('${t.id||i}')" style="background:#fce4ec;color:#c62828;border:none;padding:3px 8px;border-radius:6px;font-size:0.75rem;cursor:pointer;">Delete</button>
      </div>`).join('');
  } else {
    html += '<div style="font-size:0.85rem;color:var(--muted);text-align:center;padding:12px;">No custom templates yet</div>';
  }
  
  const listDiv = document.getElementById('templatesList');
  if(listDiv) listDiv.innerHTML = html;
  
  document.getElementById('manageTemplatesModal').classList.add('open');
  } catch(_e) { console.error("[SG] openManageTemplates:", _e); }
}


function addCustomTemplate() {
  try {
  const name = prompt('Template name:');
  if(!name || !name.trim()) return;
  const templates = (_settingsCache['sg_custom_templates'])||[];
  templates.push({id: 'ct_'+Date.now(), name: name.trim(), perms: []});
  _settingsCache['sg_custom_templates']=templates; setSetting('sg_custom_templates', templates);
  closeModal('templateMgmtModal');
  openManageTemplates();
  showToast('✅ Template added!');
  } catch(_e) { console.error("[SG] addCustomTemplate:", _e); }
}

function deleteCustomTemplate(id) {
  try {
  if(!confirm('Delete this template?')) return;
  var templates = (_settingsCache['sg_custom_templates'])||[];
  // Filter by id, or by index if id is numeric
  var filtered = templates.filter(function(t,i){ return t.id !== id && String(i) !== String(id); });
  _settingsCache['sg_custom_templates']=filtered; setSetting('sg_custom_templates', filtered);
  closeModal('manageTemplatesModal');
  setTimeout(function(){ openManageTemplates(); }, 150);
  showToast('✅ Template deleted!');
  } catch(_e) { console.error("[SG] deleteCustomTemplate:", _e); }
}

function populateReportingDropdown(selectId, currentVal) {
  try {
  const sel = document.getElementById(selectId);
  if(!sel) return;
  const staff = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  sel.innerHTML = '<option value="">-- Select Reporting Manager --</option>' +
    '<option value="Admin">Admin</option>' +
    staff.map(s=>`<option value="${s.username}" ${s.username===currentVal?'selected':''}>${escHtml(s.name)} (${s.role||'Staff'})</option>`).join('');
  } catch(_e) { console.error("[SG] populateReportingDropdown:", _e); }
}

// =============================================
// ===== KDS FUNCTIONS =====
// =============================================
let kdsOrderFilter='all';
function renderKDS() { loadKDS(); }
function loadKDS() {
  try {
  const allOrders = orders; // from Supabase in-memory
  const active = allOrders.filter(o=>['Pending','Confirmed','Preparing','Ready'].includes(o.status));
  const grid = document.getElementById('kdsGrid');
  const clock = document.getElementById('kdsClock');
  const dateEl = document.getElementById('kdsDate');
  if(clock) clock.textContent = new Date().toLocaleTimeString('en-IN');
  if(dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
  const search = (document.getElementById('kdsSearchInput')?.value||'').toLowerCase();
  let filtered = active;
  if(kdsOrderFilter && kdsOrderFilter!=='all') filtered = filtered.filter(o=>o.status===kdsOrderFilter||o.type===kdsOrderFilter);
  if(search) filtered = filtered.filter(o=>(o.id||'').toLowerCase().includes(search));
  const el = id => document.getElementById(id);
  if(el('kdsNewCount')) el('kdsNewCount').textContent = active.filter(o=>o.status==='Pending').length;
  if(el('kdsPreparingCount')) el('kdsPreparingCount').textContent = active.filter(o=>o.status==='Preparing').length;
  if(el('kdsReadyCount')) el('kdsReadyCount').textContent = active.filter(o=>o.status==='Ready').length;
  if(!grid) return;
  if(!filtered.length){grid.innerHTML='<div class="kds-empty"><div class="kds-empty-icon">🍽️</div><p style="color:#555;">No active orders</p></div>';renderKDSHistory();return;}
  grid.innerHTML = filtered.map(o=>{
    const _kd = parseOrderTime(o);
    const mins = _kd ? Math.max(0, Math.floor((Date.now()-_kd)/60000)) : 0;
    const tc = mins<10?'ok':mins<20?'warn':'late';
    const sc = o.status==='Preparing'?'status-preparing':o.status==='Ready'?'status-ready':'status-new';
    return `<div class="kds-card ${sc}">
      <div class="kds-card-header">
        <div><div class="kds-order-id">#${o.id}</div><div class="kds-table">${o.type} • ${escHtml(o.name)}</div></div>
        <div class="kds-timer ${tc}">${mins}m</div>
      </div>
      <div class="kds-items">${o.items.map(i=>`<div class="kds-item"><span class="kds-item-name">${escHtml(i.name)}</span><span class="kds-item-qty">×${i.qty}</span></div>`).join('')}</div>
      ${o.note?`<div class="kds-note">📝 ${escHtml(o.note)}</div>`:''}
      <div class="kds-actions">
        ${o.status==='Pending'?`<button class="kds-action-btn preparing" onclick="updateStatus('${o.id}','Preparing');loadKDS()">▶ Preparing</button>`:'<span></span>'}
        ${o.status==='Preparing'?`<button class="kds-action-btn ready" onclick="updateStatus('${o.id}','Ready');loadKDS()">✅ Ready</button>`:'<span></span>'}
      </div>
    </div>`;
  }).join('');
  renderKDSHistory();
  } catch(_e) { console.error("[SG] loadKDS:", _e); }
}
function renderKDSHistory() {
  try {
  const hist = document.getElementById('kdsHistoryList'); if(!hist) return;
  const done = orders.filter(o=>['Delivered','Cancelled'].includes(o.status)).reverse().slice(0,10);
  const search=(document.getElementById('kdsHistorySearch')?.value||'').toLowerCase();
  const filtered = search?done.filter(o=>(o.id||'').toLowerCase().includes(search)||(o.name||'').toLowerCase().includes(search)):done;
  hist.innerHTML = filtered.map(o=>`<div style="display:flex;justify-content:space-between;align-items:center;background:#1a1a1a;border-radius:8px;padding:8px 12px;margin-bottom:6px;"><span style="color:#aaa;font-size:0.82rem;">#${o.id} — ${escHtml(o.name)}</span><span class="status ${(o.status||'').toLowerCase()}" style="font-size:0.72rem;">${o.status}</span></div>`).join('')||'<div style="color:#444;font-size:0.82rem;text-align:center;padding:12px;">No history yet</div>';
  } catch(_e) { console.error("[SG] renderKDSHistory:", _e); }
}
function filterKDS(f,btn){
  try {kdsOrderFilter=f;document.querySelectorAll('.kds-filter-btn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');loadKDS();
  } catch(_e) { console.error("[SG] filterKDS:", _e); }
}
function toggleKDSStation(s){
  try {['all','food','beverage'].forEach(x=>{const b=document.getElementById('kdsStation'+x.charAt(0).toUpperCase()+x.slice(1));if(b)b.classList.toggle('active',x===s);});loadKDS();
  } catch(_e) { console.error("[SG] toggleKDSStation:", _e); }
}
function toggleKDSSound(){
  try {const btn=document.getElementById('kdsSoundBtn');if(btn)btn.textContent=btn.textContent.includes('ON')?'🔕 Sound OFF':'🔔 Sound ON';
  } catch(_e) { console.error("[SG] toggleKDSSound:", _e); }
}
// KDS refresh: sirf tab re-render karo jab orders badle ya minute tick ho
// (timer update ke liye) — pehle har 15 sec full rebuild se screen blink karti thi
setInterval(()=>{
  if(document.getElementById('sec-kds')?.classList.contains('active')) {
    const sig = (orders||[]).map(o=>o.id+':'+o.status).join(',') + '|' + Math.floor(Date.now()/60000);
    if(sig === window._lastKdsSig) return;
    window._lastKdsSig = sig;
    loadKDS();
  }
},15000);

// =============================================
// ===== TABLE MANAGEMENT FUNCTIONS =====
// =============================================
function renderTableMgmt(){
  try {renderFloorPlan();
  } catch(_e) { console.error("[SG] renderTableMgmt:", _e); }
}
function renderReservations(){
  try {
  updateTableHeaders();
  const reservations=JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const tbody=document.getElementById('reservTableBody');if(!tbody)return;
  if(!reservations.length){tbody.innerHTML='<tr><td colspan="10"><div class="empty"><div class="empty-icon">📅</div><p>No reservations yet</p></div></td></tr>';return;}
  const isAdm=currentUser?.role==='Admin';
  const canCancel=isAdm||currentUser?.perms?.includes('Table - Manage Reservations');
  const tables=JSON.parse(localStorage.getItem('sg_tables')||'[]');
  tbody.innerHTML=[...reservations].reverse().map((r,idx)=>`
    <tr style="${r.status==='cancelled'?'opacity:0.6;':''}">
      <td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${idx+1}</td>
      <td>${r.date}</td><td>${r.time}</td><td><b>${escHtml(r.name)}</b></td><td>${r.phone||'—'}</td>
      <td>${r.table?(tables.find(t=>t.id===r.table)?.num||r.table):'—'}</td>
      <td>${r.guests||1}</td>
      <td><span class="status ${r.status==='confirmed'?'confirmed':r.status==='cancelled'?'cancelled':'pending'}">${r.status||'confirmed'}</span></td>
      <td style="max-width:120px;font-size:0.8rem;">${escHtml(r.notes||'—')}</td>
      <td style="display:flex;gap:6px;">
        ${r.status!=='cancelled'&&canCancel?`
          <button class="act-btn act-edit" onclick="openRescheduleModal('${r.id}')">🔄 Reschedule</button>
          <button class="act-btn act-delete" onclick="cancelReservation('${r.id}')">Cancel</button>
        `:'—'}
      </td>
    </tr>`).join('');
  } catch(e) { console.error("[SG] renderReservations error:", e); }
}

// ===== RESCHEDULE RESERVATION =====
function openRescheduleModal(id) {
  try {
  const reservations = JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const r = reservations.find(x=>x.id===id);
  if(!r) return;
  
  // Store reschedule id
  document.getElementById('editReservId').value = id;
  document.getElementById('reservName').value = r.name;
  document.getElementById('reservPhone').value = r.phone;
  document.getElementById('reservDate').value = r.date;
  document.getElementById('reservTime').value = r.time;
  document.getElementById('reservGuests').value = r.guests||'';
  document.getElementById('reservNotes').value = r.notes||'';
  
  // Set table
  const tableSelect = document.getElementById('reservTable');
  if(tableSelect) {
    const tables = getTables();
    tableSelect.innerHTML = tables.map(t=>`<option value="${t.id}" ${t.id===r.table?'selected':''}>${t.name||t.id}</option>`).join('');
  }
  
  document.getElementById('reservModalTitle').textContent = '🔄 Reschedule Reservation';
  document.getElementById('tblReservModal').classList.add('open');
  } catch(_e) { console.error("[SG] openRescheduleModal:", _e); }
}

function cancelReservation(id){
  try {
  if(!(currentUser?.role==='Admin'||currentUser?.perms?.includes('Table - Manage Reservations'))){showToast('No permission','error');return;}
  if(!confirm('Cancel this reservation?'))return;
  const res=JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const r=res.find(x=>x.id===id);if(r){r.status='cancelled';r.cancelledBy=currentUser?.name;r.cancelledAt=new Date().toLocaleString('en-IN');}
  localStorage.setItem('tbl_reservations',JSON.stringify(res));
  renderReservations();showToast('Reservation cancelled');
  } catch(_e) { console.error("[SG] cancelReservation:", _e); }
}
function renderTblReports(){
  try {
  const cards=document.getElementById('tblReportCards');if(!cards)return;
  const res=JSON.parse(localStorage.getItem('tbl_reservations')||'[]');
  const td=new Date().toISOString().split('T')[0];
  cards.innerHTML=`
    <div class="stat-card orange"><div class="stat-icon">📅</div><div class="stat-num">${res.length}</div><div class="stat-label">Total Reservations</div></div>
    <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-num">${res.filter(r=>r.status==='confirmed').length}</div><div class="stat-label">Confirmed</div></div>
    <div class="stat-card" style="border-top:4px solid var(--danger)"><div class="stat-icon">❌</div><div class="stat-num">${res.filter(r=>r.status==='cancelled').length}</div><div class="stat-label">Cancelled</div></div>
    <div class="stat-card blue"><div class="stat-icon">📆</div><div class="stat-num">${res.filter(r=>r.date===td&&r.status==='confirmed').length}</div><div class="stat-label">Today</div></div>`;
  } catch(_e) { console.error("[SG] renderTblReports:", _e); }
}

// =============================================
// ===== FEATURE 8: DAY TOGGLE HELPER =====
// =============================================
function buildDaysPicker(containerId, selectedDays, includeAll) {
  try {
  const cont = document.getElementById(containerId);
  if(!cont) return;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const sel = selectedDays || [];
  // If empty or contains 'All', treat as all days selected
  const isAllMode = sel.length === 0 || sel.includes('All');

  let html = '';
  // "All Days" button
  html += `<label id="dayBtn-All-${containerId}" onclick="toggleDayPickerAll('${containerId}')" style="display:inline-flex;align-items:center;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.83rem;font-weight:800;border:2px solid ${isAllMode?'var(--fire)':'#e8d5c8'};background:${isAllMode?'var(--fire)':'#fff'};color:${isAllMode?'#fff':'var(--muted)'};user-select:none;margin-right:4px;">
    <input type="checkbox" value="All" ${isAllMode?'checked':''} style="display:none;"> All Days
  </label>`;
  // Individual day buttons
  days.forEach(d => {
    const isActive = !isAllMode && sel.includes(d);
    html += `<label id="dayBtn-${d}-${containerId}" onclick="toggleDayPickerDay('${containerId}','${d}')" style="display:inline-flex;align-items:center;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:0.83rem;font-weight:700;border:2px solid ${isActive?'var(--fire)':'#e8d5c8'};background:${isActive?'var(--fire)':'#fff'};color:${isActive?'#fff':'var(--dark)'};user-select:none;">
      <input type="checkbox" value="${d}" ${isActive?'checked':''} style="display:none;"> ${d}
    </label>`;
  });
  cont.innerHTML = html;
  } catch(_e) { console.error("[SG] buildDaysPicker:", _e); }
}

function toggleDayPickerAll(containerId) {
  try {
  // Select "All" → deselect all individual days
  const cont = document.getElementById(containerId);
  if(!cont) return;
  const allBtn = cont.querySelector('input[value="All"]');
  if(!allBtn) return;
  // Toggle All on
  allBtn.checked = true;
  styleDay(allBtn.closest('label'), true);
  // Deselect all individual days
  cont.querySelectorAll('input[type="checkbox"]:not([value="All"])').forEach(cb => {
    cb.checked = false;
    styleDay(cb.closest('label'), false);
  });
  } catch(_e) { console.error("[SG] toggleDayPickerAll:", _e); }
}

function toggleDayPickerDay(containerId, day) {
  try {
  const cont = document.getElementById(containerId);
  if(!cont) return;
  const allBtn = cont.querySelector('input[value="All"]');
  const dayBtn = cont.querySelector(`input[value="${day}"]`);
  if(!dayBtn) return;

  // Toggle this day
  dayBtn.checked = !dayBtn.checked;
  styleDay(dayBtn.closest('label'), dayBtn.checked);

  // If any individual day selected → deselect "All"
  const anyDaySelected = [...cont.querySelectorAll('input[type="checkbox"]:not([value="All"])')].some(cb => cb.checked);
  if(anyDaySelected && allBtn) {
    allBtn.checked = false;
    styleDay(allBtn.closest('label'), false);
  }
  // If no day selected at all → revert to "All"
  if(!anyDaySelected && allBtn) {
    allBtn.checked = true;
    styleDay(allBtn.closest('label'), true);
  }
  } catch(_e) { console.error("[SG] toggleDayPickerDay:", _e); }
}

function styleDay(label, active) {
  try {
  if(!label) return;
  label.style.background = active ? 'var(--fire)' : '#fff';
  label.style.color = active ? '#fff' : 'var(--dark)';
  label.style.borderColor = active ? 'var(--fire)' : '#e8d5c8';
  } catch(_e) { console.error("[SG] styleDay:", _e); }
}

function getDaysFromPicker(containerId) {
  try {
  const cont = document.getElementById(containerId);
  if(!cont) return [];
  const allCb = cont.querySelector('input[value="All"]');
  if(allCb && allCb.checked) return []; // empty = all days
  return [...cont.querySelectorAll('input[type="checkbox"]:not([value="All"]):checked')].map(cb => cb.value);
  } catch(_e) { console.error("[SG] getDaysFromPicker:", _e); }
}

function toggleDayLabel(label) {
  try {
  const cb = label.querySelector('input[type="checkbox"]');
  if(!cb) return;
  cb.checked = !cb.checked;
  styleDay(label, cb.checked);
  } catch(_e) { console.error("[SG] toggleDayLabel:", _e); }
}

function toggleDayBtn(cb) {
  try {
  styleDay(cb.closest('label'), cb.checked);
  } catch(_e) { console.error("[SG] toggleDayBtn:", _e); }
}

// =============================================
// ===== FEATURE 9: CATEGORY MANAGEMENT =====
// =============================================
const _defaultCats = ['Starters','Main Course','Rice','Breads','Desserts','Drinks','Special'].map(n=>({name:n,emoji:'🍽️'}));
let _catsCache = null;
function getCategories(){
  return _catsCache || _defaultCats;
}
function saveCategories(cats){
  try { _catsCache=cats; sbSaveCategories(cats).catch(e=>console.error('saveCategories fail:',e));
  } catch(_e) { console.error("[SG] saveCategories:", _e); }
}
function populateCategorySelects(){
  try {
  const cats=getCategories();
  ['newItemCat','editItemCat'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    const cur=sel.value;
    sel.innerHTML=cats.map(c=>`<option value="${escHtml(c.name)}" ${c.name===cur?'selected':''}>${c.emoji||'🍽️'} ${escHtml(c.name)}</option>`).join('');
  });
  const cf=document.getElementById('menuCatFilters');
  if(cf){
    cf.innerHTML=`<button onclick="setCatFilter('',this)" style="padding:5px 14px;border-radius:20px;border:2px solid var(--fire);background:var(--fire);color:#fff;cursor:pointer;font-weight:700;font-size:0.8rem;font-family:inherit;">All</button>`+
      cats.map(c=>`<button onclick="setCatFilter('${escHtml(c.name)}',this)" style="padding:5px 14px;border-radius:20px;border:2px solid #e8d5c8;background:#fff;color:var(--muted);cursor:pointer;font-weight:600;font-size:0.8rem;font-family:inherit;">${c.emoji||''} ${escHtml(c.name)}</button>`).join('');
  }
  renderCategoriesList();
  } catch(_e) { console.error("[SG] populateCategorySelects:", _e); }
}
function renderCategoriesList(){
  try {
  const cats=getCategories();const div=document.getElementById('categoriesList');if(!div)return;
  if(!cats.length){div.innerHTML='<div style="text-align:center;color:var(--muted);padding:20px;">No categories yet</div>';return;}
  div.innerHTML=cats.map((c,i)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f9f7f5;border-radius:8px;margin-bottom:6px;">
    <span style="font-weight:600;">${c.emoji||'🍽️'} ${escHtml(c.name)}</span>
    <div style="display:flex;gap:6px;">
      <button onclick="editCategory(${i})" style="background:#e3f2fd;color:#1565c0;border:none;padding:4px 10px;border-radius:6px;font-size:0.78rem;font-weight:700;cursor:pointer;">✏️</button>
      <button onclick="deleteCategory(${i})" style="background:#fce4ec;color:#c62828;border:none;padding:4px 10px;border-radius:6px;font-size:0.78rem;font-weight:700;cursor:pointer;">🗑️</button>
    </div></div>`).join('');
  } catch(_e) { console.error("[SG] renderCategoriesList:", _e); }
}
function openAddCategoryModal(){
  try {
  document.getElementById('catModalTitle').textContent='🏷️ Add Category';
  document.getElementById('catName').value='';document.getElementById('catEmoji').value='';
  document.getElementById('editCatOldName').value='';
  document.getElementById('addCategoryModal').classList.add('open');
  } catch(_e) { console.error("[SG] openAddCategoryModal:", _e); }
}
function editCategory(idx){
  try {
  const c=getCategories()[idx];
  document.getElementById('catModalTitle').textContent='✏️ Edit Category';
  document.getElementById('catName').value=c.name;document.getElementById('catEmoji').value=c.emoji||'';
  document.getElementById('editCatOldName').value=c.name;
  document.getElementById('addCategoryModal').classList.add('open');
  } catch(_e) { console.error("[SG] editCategory:", _e); }
}
function saveCategory(){
  try {
  const name=document.getElementById('catName').value.trim();
  const emoji=document.getElementById('catEmoji').value.trim()||'🍽️';
  const oldName=document.getElementById('editCatOldName').value;
  if(!name){showToast('Category name required','error');return;}
  let cats=getCategories();
  if(oldName){
    const idx=cats.findIndex(c=>c.name===oldName);if(idx>=0)cats[idx]={name,emoji};
    const items=getMenuItems();items.forEach(it=>{if(it.cat===oldName)it.cat=name;});items.forEach(it=>{if(it.cat===name)sbUpsertMenuItem(it).catch(e=>console.error('cat rename fail:',e));});
  }else{
    if(cats.find(c=>c.name===name)){showToast('Category already exists','error');return;}
    cats.push({name,emoji});
  }
  saveCategories(cats);closeModal('addCategoryModal');populateCategorySelects();renderMenuMgmt();showToast('✅ Category saved!');
  } catch(_e) { console.error("[SG] saveCategory:", _e); }
}
function deleteCategory(idx){
  try {
  if(!confirm('Delete this category?'))return;
  let cats=getCategories();cats.splice(idx,1);saveCategories(cats);populateCategorySelects();showToast('Category deleted');
  } catch(_e) { console.error("[SG] deleteCategory:", _e); }
}

// =============================================
// ===== FEATURES 10/11: ORDER DATE FILTER =====
// =============================================
function handleOrderDateFilter(){
  try {
  const val=document.getElementById('orderDateFilter').value;
  const div=document.getElementById('customDateRange');
  if(div)div.style.display=val==='custom'?'flex':'none';
  renderOrders();
  } catch(_e) { console.error("[SG] handleOrderDateFilter:", _e); }
}

// =============================================
// ===== FEATURE 13/14: CUSTOMER BLOCK + NOTES =====
// =============================================
async function toggleBlockCustomer(mobile){
  try {
  if(currentUser?.role!=='Admin'){showToast('Only Admin can block customers','error');return;}
  customers = await sbGetCustomers();
  const c=customers.find(x=>x.mobile===mobile);if(!c)return;
  c.blocked=!c.blocked;
  await sbUpdateCustomer(mobile, {blocked: c.blocked}).catch(e=>console.error('Block update fail:',e));
  await sbUpdateCustAccount(mobile, {blocked: c.blocked}).catch(e=>console.error('Account block fail:',e));
  invalidateCustAccountsCache();
  closeModal('custDetailModal');renderCustomers();
  showToast(c.blocked?'🚫 Customer blocked!':'✅ Customer unblocked!');
  } catch(_e) { console.error("[SG] toggleBlockCustomer:", _e); }
}
async function saveAdminNote(mobile){
  try {
  if(currentUser?.role!=='Admin'){showToast('Only Admin can add notes','error');return;}
  const note=document.getElementById('adminNoteInput')?.value.trim();if(!note){showToast('Note empty','error');return;}
  customers = await sbGetCustomers();
  const c=customers.find(x=>x.mobile===mobile);if(!c)return;
  c.adminNotes=c.adminNotes||[];
  c.adminNotes.push({note,by:currentUser?.name||'Admin',at:new Date().toLocaleString('en-IN')});
  await sbUpdateCustomer(mobile, {adminNotes: c.adminNotes}).catch(e=>console.error('Note save fail:',e));
  viewCustomerDetail(mobile);showToast('Note saved!');
  } catch(_e) { console.error("[SG] saveAdminNote:", _e); }
}
async function deleteAdminNote(mobile,noteIdx){
  try {
  if(currentUser?.role!=='Admin')return;
  customers = await sbGetCustomers();
  const c=customers.find(x=>x.mobile===mobile);
  if(c&&c.adminNotes){c.adminNotes.splice(noteIdx,1);await sbUpdateCustomer(mobile,{adminNotes:c.adminNotes}).catch(e=>console.error('Note delete fail:',e));viewCustomerDetail(mobile);}
  } catch(_e) { console.error("[SG] deleteAdminNote:", _e); }
}

// =============================================
// ===== FEATURE 15: PRINT ORDER SLIP =====
// =============================================
function openPrintSlip(orderId){
  try {
  // orders already loaded from Supabase
  const o=orders.find(x=>x.id===orderId);if(!o)return;
  const div=document.getElementById('printSlipContent');
  if(div)div.innerHTML=`<div style="background:#f9f7f5;border-radius:8px;padding:12px;font-size:0.85rem;">
    <div><b>Order #${o.id}</b> — ${o.type} • <span class="status ${(o.status||'').toLowerCase()}">${o.status}</span></div>
    <div style="color:var(--muted);font-size:0.78rem;">${o.time}</div>
    <div style="margin-top:6px;"><b>${escHtml(o.name)}</b> • ${escHtml(o.mobile)}</div>
    ${o.address&&o.type==='Home Delivery'?`<div style="font-size:0.78rem;color:var(--muted);">📍 ${escHtml(o.address)}</div>`:''}
    <div style="margin-top:8px;border-top:1px dashed #ddd;padding-top:8px;">
      ${o.items.map(i=>`<div style="display:flex;justify-content:space-between;font-size:0.85rem;">${i.name} ×${i.qty}<span>₹${i.total}</span></div>`).join('')}
    </div>
  </div>`;
  const modal=document.getElementById('printSlipModal');
  if(modal){modal._orderId=orderId;modal.classList.add('open');}
  } catch(_e) { console.error("[SG] openPrintSlip:", _e); }
}
function doPrintSlip(type){
  try {
  // orders already loaded from Supabase
  const modal=document.getElementById('printSlipModal');
  const orderId=modal?._orderId;
  const o=orders.find(x=>x.id===orderId);if(!o)return;
  const restName=((_settingsCache['sg_settings'])||{}).name||'SpiceGarden';
  const isK=type==='kitchen';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${isK?'Kitchen':'Delivery'} Slip</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:monospace;font-size:13px;padding:12px;max-width:300px;}
.hdr{text-align:center;border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:8px;font-weight:900;font-size:1.1rem;}
.row{display:flex;justify-content:space-between;padding:3px 0;}.sep{border:none;border-top:1px dashed #000;margin:6px 0;}
@media print{body{max-width:none;}}</style></head><body>
<div class="hdr">${isK?'🍳 KITCHEN':'🚴 DELIVERY'} SLIP<br><span style="font-size:0.8rem;font-weight:400;">${restName}</span></div>
<div class="row"><span>Order #</span><b>${o.id}</b></div>
<div class="row"><span>Type</span><span>${o.type}</span></div>
<div class="row"><span>Time</span><span>${o.time}</span></div>
<hr class="sep">
${!isK?`<div class="row"><span>Customer</span><span>${escHtml(o.name)}</span></div><div class="row"><span>Phone</span><span>${escHtml(o.mobile)}</span></div>${o.address&&o.type==='Home Delivery'?`<div><b>Address:</b> ${escHtml(o.address)}</div>`:''}
<hr class="sep">`:''}
<b>ITEMS:</b>
${o.items.map(i=>`<div class="row"><span>${i.name}</span><span>×${i.qty}</span></div>`).join('')}
<hr class="sep">
${!isK?`<div class="row"><span>Total</span><b>₹${o.total}</b></div><div class="row"><span>Payment</span><span>${o.pay||'Cash'}</span></div><hr class="sep">`:''}
${o.note?`<div><b>Note:</b> ${o.note}</div>`:''}
<div style="text-align:center;margin-top:10px;font-size:0.85rem;">*** ${isK?'KITCHEN COPY':'DELIVERY COPY'} ***</div>
<script>window.onload=()=>{window.print();setTimeout(window.close,800);}<\/script>
</body></html>`;
  const w=window.open('','_blank','width=400,height=600');
  if(w){w.document.write(html);w.document.close();}
  closeModal('printSlipModal');
  } catch(_e) { console.error("[SG] doPrintSlip:", _e); }
}

// =============================================
// ===== FEATURE 16: EXPORT ORDERS CSV =====
// =============================================
function exportOrdersCSV(){
  try {
  // orders already loaded from Supabase
  if(currentUser?.role!=='Admin'&&!currentUser?.perms?.includes('View Orders - Basic')){showToast('No permission','error');return;}
  const headers=['Order ID','Customer','Mobile','Items','Subtotal','GST','Total','Type','Status','Payment','Address','Date'];
  let csv=headers.join(',')+'\n';
  orders.forEach(o=>{
    const row=[o.id,o.name,o.mobile,o.items.map(i=>i.name+' x'+i.qty).join('; '),o.subtotal||o.total,o.gstAmt||0,o.total,o.type,o.status,o.pay||'',o.address||'',o.time];
    csv+=row.map(v=>'"'+(String(v||'').replace(/"/g,'""'))+'"').join(',')+'\n';
  });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download='orders_'+new Date().toISOString().split('T')[0]+'.csv';
  a.click();showToast('✅ CSV exported! ('+orders.length+' orders)');
  } catch(_e) { console.error("[SG] exportOrdersCSV:", _e); }
}

// =============================================
// ===== FEATURE 19: OPERATING HOURS =====
// =============================================
// ============================================================
// IMPORT / EXPORT — ORDERS & CUSTOMERS
// ============================================================

function importOrdersCSV(event) {
  try {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter(l=>l.trim());
      if(lines.length < 2) { showToast('CSV empty or invalid','error'); return; }
      
      const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,'').toLowerCase());
      // Use global orders array from Supabase
      const existingIds = new Set(orders.map(o=>o.id));
      
      let added = 0, skipped = 0;
      
      for(let i=1; i<lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        if(!vals.length) continue;
        
        const row = {};
        headers.forEach((h,idx) => { row[h] = (vals[idx]||'').trim(); });
        
        const id = row['order id'] || row['id'] || ('IMP_'+Date.now()+'_'+i);
        
        if(existingIds.has(id)) { skipped++; continue; }
        
        // CSV date ko sahi format mein convert karo
        var rawDate = row['date'] || row['order date'] || row['orderdate'] || '';
        var importedCreatedAt = '';
        var importedTime = '';
        if (rawDate) {
          try {
            // Handle DD/MM/YYYY format
            var dp = rawDate.split('/');
            var dm = rawDate.split('-');
            var parsedDate;
            if (dp.length === 3 && dp[2].length === 4) {
              // DD/MM/YYYY -> YYYY-MM-DD
              parsedDate = new Date(dp[2]+'-'+dp[1].padStart(2,'0')+'-'+dp[0].padStart(2,'0')+'T12:00:00+05:30');
            } else if (dm.length === 3 && dm[0].length === 4) {
              // YYYY-MM-DD
              parsedDate = new Date(rawDate+'T12:00:00+05:30');
            } else {
              parsedDate = new Date(rawDate);
            }
            if (!isNaN(parsedDate.getTime())) {
              // created_at = order ki actual date (IST noon) — Supabase mein sahi date jayegi
              importedCreatedAt = parsedDate.toISOString();
              // time field = DD/MM/YYYY format
              var dd = String(parsedDate.getDate()).padStart(2,'0');
              var mm = String(parsedDate.getMonth()+1).padStart(2,'0');
              var yyyy = parsedDate.getFullYear();
              importedTime = dd+'/'+mm+'/'+yyyy+', 12:00 pm';
            }
          } catch(e) {}
        }
        if (!importedTime) importedTime = row['time'] || new Date().toLocaleString('en-IN');

        orders.unshift({
          id:          id,
          name:        row['customer'] || row['name'] || '',
          mobile:      row['mobile'] || row['phone'] || '',
          email:       row['email'] || '',
          address:     row['address'] || '',
          type:        row['type'] || '',
          status:      row['status'] || '',
          subtotal:    parseFloat(row['subtotal'] || 0),
          gstAmt:      parseFloat(row['gst'] || 0),
          total:       parseFloat(row['total'] || row['amount'] || 0),
          grandTotal:  parseFloat(row['total'] || row['amount'] || 0),
          pay:         row['payment'] || row['pay'] || '',
          date:        rawDate,
          time:        rawDate, // CSV ki original date/time as-is
          created_at:  importedCreatedAt || undefined,
          items:       row['items'] ? [{name: row['items'], qty: 1, price: 0}] : [],
          note:        row['note'] || '',
          imported:    true
        });
        existingIds.add(id);
        added++;
      }
      
      // Save to Supabase in batches of 50 (no per-row screen refresh)
      const newOrders = orders.filter(o=>o.imported && !o._saved);
      showToast('⏳ Saving '+added+' orders... please wait');
      (async function() {
        const batchSize = 500;
        for(let b=0; b<newOrders.length; b+=batchSize) {
          const batch = newOrders.slice(b, b+batchSize);
          await Promise.all(batch.map(o => sbInsertOrder(o).catch(()=>{})));
        }
        const fresh = await sbGetOrders();
        if(fresh && fresh.length) orders = fresh;
        renderOrders();
        showToast('✅ '+added+' orders imported successfully!');
      })();
    } catch(err) {
      showToast('Import failed: '+err.message,'error');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
  } catch(_e) { console.error("[SG] importOrdersCSV:", _e); }
}

function importCustomersCSV(event) {
  try {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const text = e.target.result;
      const lines = text.split('\n').filter(l=>l.trim());
      if(lines.length < 2) { showToast('CSV empty or invalid','error'); return; }
      
      const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,'').toLowerCase());
      const customers = window.customers||[];
      const existingMobiles = new Set(customers.map(c=>c.mobile));
      
      let added = 0, updated = 0, skipped = 0;
      
      for(let i=1; i<lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        if(!vals.length) continue;
        
        const row = {};
        headers.forEach((h,idx) => { row[h] = (vals[idx]||'').trim(); });
        
        const mobile = row['mobile'] || row['phone'] || '';
        if(!mobile) { skipped++; continue; }
        
        const existing = customers.find(c=>c.mobile===mobile);
        
        if(existing) {
          // Update existing customer
          existing.name = row['name'] || existing.name;
          existing.email = row['email'] || existing.email;
          existing.address = row['address'] || existing.address;
          existing.orders = parseInt(row['orders']||existing.orders||0);
          existing.spent = parseFloat(row['spent']||row['total spent']||existing.spent||0);
          updated++;
        } else {
          customers.push({
            id: 'CUST_'+Date.now()+'_'+i,
            name: row['name'] || 'Unknown',
            mobile,
            email: row['email'] || '',
            address: row['address'] || '',
            orders: parseInt(row['orders']||0),
            spent: parseFloat(row['spent']||row['total spent']||0),
            blocked: false,
            joinedAt: row['Joined'] || row['joined'] || row['joined_at'] || '',
            createdAt: row['Joined'] || row['joined'] || row['joined_at'] || '',
            imported: true
          });
          existingMobiles.add(mobile);
          added++;
        }
      }
      
      // Upsert to Supabase
      Promise.all(customers.filter(c=>c.imported).map(c=>sbUpsertCustomer(c).catch(()=>{}))).then(()=>sbGetCustomers()).then(fresh=>{customers=fresh;renderCustomers();}).catch(()=>renderCustomers());
      showToast('✅ '+added+' added, '+updated+' updated, '+skipped+' skipped');
    } catch(err) {
      showToast('Import failed: '+err.message,'error');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
  } catch(_e) { console.error("[SG] importCustomersCSV:", _e); }
}

async function exportCustomersCSV() {
  try {
  const customers = await sbGetCustomers();
  if(!customers.length) { showToast('No customers to export','error'); return; }
  
  const headers = ['Name','Mobile','Email','Address','Orders','Spent','Status','Joined'];
  const rows = customers.map(c => [
    c.name||'', c.mobile||'', c.email||'', c.address||'',
    c.orders||0, c.spent||0,
    c.blocked?'Blocked':'Active',
    c.joinedAt||''
  ]);
  
  const csv = [headers, ...rows].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'customers_'+new Date().toLocaleDateString('en-IN').replace(/\//g,'-')+'.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Customers exported!');
  } catch(_e) { console.error("[SG] exportCustomersCSV:", _e); }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for(let i=0; i<line.length; i++) {
    const ch = line[i];
    if(ch==='"') {
      if(inQuotes && line[i+1]==='"') { current+='"'; i++; }
      else inQuotes = !inQuotes;
    } else if(ch===',' && !inQuotes) {
      result.push(current); current='';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}


function saveOperatingHours(){
  try {
  if(currentUser?.role!=='Admin'){showToast('Only Admin','error');return;}
  const cont=document.getElementById('settOpenDaysContainer');
  const openDays=cont?[...cont.querySelectorAll('input[type="checkbox"]:checked')].map(cb=>cb.value):['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const s=(_settingsCache['sg_restaurant_settings'])||{};
  s.openTime=document.getElementById('settOpenTime')?.value||'09:00';
  s.closeTime=document.getElementById('settCloseTime')?.value||'23:00';
  s.openDays=openDays;s.restStatus=document.getElementById('settRestStatus')?.value||'open';
  setSetting('sg_restaurant_settings', s);
  const msg=document.getElementById('settHoursSaved');if(msg){msg.style.display='block';setTimeout(()=>msg.style.display='none',2500);}
  showToast('✅ Operating hours saved!');
  } catch(_e) { console.error("[SG] saveOperatingHours:", _e); }
}
function loadOperatingHoursUI(){
  try {
  const s=(_settingsCache['sg_restaurant_settings'])||{};
  const el=id=>document.getElementById(id);
  if(el('settOpenTime'))el('settOpenTime').value=s.openTime||'09:00';
  if(el('settCloseTime'))el('settCloseTime').value=s.closeTime||'23:00';
  if(el('settRestStatus'))el('settRestStatus').value=s.restStatus||'open';
  // Build days checkboxes via JS (not template literals in HTML)
  const openDays=s.openDays||['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  buildDaysPicker('settOpenDaysContainer', openDays, false);
  } catch(_e) { console.error("[SG] loadOperatingHoursUI:", _e); }
}

// =============================================
// ===== FEATURE 20: DELIVERY CHARGE =====
// =============================================
function saveDeliverySettings(){
  try {
  if(currentUser?.role!=='Admin'){showToast('Only Admin','error');return;}
  const s=(_settingsCache['sg_restaurant_settings'])||{};
  s.deliveryCharge=parseFloat(document.getElementById('settDeliveryCharge')?.value)||0;
  s.freeDeliveryAbove=parseFloat(document.getElementById('settFreeDeliveryAbove')?.value)||0;
  setSetting('sg_restaurant_settings', s);
  const msg=document.getElementById('settDeliverySaved');if(msg){msg.style.display='block';setTimeout(()=>msg.style.display='none',2500);}
  showToast('✅ Delivery settings saved!');
  } catch(_e) { console.error("[SG] saveDeliverySettings:", _e); }
}
// =============================================
// RESTAURANT TYPE SETTING
// =============================================
function saveRestaurantType() {
  try {
  if(currentUser?.role!=='Admin'){showToast('Only Admin','error');return;}
  const type = document.getElementById('settRestType')?.value || 'small';
  const s = (_settingsCache['sg_settings']) || {};
  s.restaurantType = type;
  _settingsCache['sg_settings'] = s;
  setSetting('sg_settings', s);
  const msg = document.getElementById('settRestTypeSaved');
  if(msg){msg.style.display='block';setTimeout(()=>msg.style.display='none',2500);}
  showToast('✅ Restaurant type saved as: ' + type);
  } catch(_e) { console.error("[SG] saveRestaurantType:", _e); }
}

function loadRestaurantTypeUI() {
  try {
  const s = (_settingsCache['sg_settings']) || {};
  const el = document.getElementById('settRestType');
  if(el) el.value = s.restaurantType || 'small';
  } catch(_e) { console.error("[SG] loadRestaurantTypeUI:", _e); }
}

function loadDeliverySettingsUI(){
  try {
  const s=(_settingsCache['sg_restaurant_settings'])||{};
  const el=id=>document.getElementById(id);
  if(el('settDeliveryCharge'))el('settDeliveryCharge').value=s.deliveryCharge||0;
  if(el('settFreeDeliveryAbove'))el('settFreeDeliveryAbove').value=s.freeDeliveryAbove||0;
  } catch(_e) { console.error("[SG] loadDeliverySettingsUI:", _e); }
}

// =============================================
// ===== FEATURE 21: CUSTOMER CLASSIFICATION =====
// =============================================
function getClassifications(){
  try {
  const def=[
    {id:'vip',name:'VIP',color:'#9b59b6',minWeekly:10,minMonthly:30,minYearly:100},
    {id:'regular',name:'Regular',color:'#27ae60',minWeekly:3,minMonthly:8,minYearly:30},
    {id:'average',name:'Average',color:'#f39c12',minWeekly:1,minMonthly:3,minYearly:10},
    {id:'normal',name:'Normal',color:'#95a5a6',minWeekly:0,minMonthly:0,minYearly:0},
  ];
  const cached = JSON.parse(localStorage.getItem('sg_classifications')||'null');
  return cached || def;
  } catch(_e) { console.error("[SG] getClassifications:", _e); }
}
// saveClassifications defined above with Supabase sync

function hexToLightBg(hex) {
  try {
  // Convert hex to RGB
  hex = hex.replace('#','');
  if(hex.length===3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const r = parseInt(hex.substring(0,2),16);
  const g = parseInt(hex.substring(2,4),16);
  const b = parseInt(hex.substring(4,6),16);
  // Create light background: mix with white (90% white, 10% color)
  const lr = Math.round(r * 0.15 + 255 * 0.85);
  const lg = Math.round(g * 0.15 + 255 * 0.85);
  const lb = Math.round(b * 0.15 + 255 * 0.85);
  return 'rgb('+lr+','+lg+','+lb+')';
  } catch(_e) { console.error("[SG] hexToLightBg:", _e); }
}

function getCustomerClass(customer, period){
  try {
  const classes=getClassifications();
  const allOrders=orders; // from Supabase in-memory
  const custOrds=allOrders.filter(o=>o.mobile===customer.mobile&&o.status!=='Cancelled');
  const now=new Date();
  const wk=new Date(now-7*864e5),mo=new Date(now-30*864e5),yr=new Date(now-365*864e5);
  const pd=s=>{
    if(!s) return new Date(0);
    try {
      // Try Indian locale format: "25/05/2026, 14:30:00"
      const parts = s.toString().split(',')[0].split('/');
      if(parts.length===3) {
        return new Date(parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0'));
      }
      return new Date(s);
    } catch(e) { return new Date(0); }
  };
  const wc=custOrds.filter(o=>pd(o.created_at||o.time||o.date||o.createdAt)>=wk).length;
  const mc=custOrds.filter(o=>pd(o.created_at||o.time||o.date||o.createdAt)>=mo).length;
  const yc=custOrds.filter(o=>pd(o.created_at||o.time||o.date||o.createdAt)>=yr).length;

  // Total orders = CSV imported orders + actual system orders
  const csvOrders = parseInt(customer.orders||0);
  const systemOrders = custOrds.length;
  const totalLifetime = csvOrders + systemOrders;

  // For classification:
  // If period selected → use actual period counts + proportional CSV
  // Yearly: total lifetime orders
  // Monthly: actual mc + (csvOrders/12)
  // Weekly: actual wc + (csvOrders/52)
  const effYc = yc + (csvOrders > systemOrders ? csvOrders - systemOrders : 0) + systemOrders;
  // Actually: use total lifetime for yearly comparison
  const finalYc = Math.max(yc, totalLifetime);
  const finalMc = mc + Math.ceil(csvOrders/12);
  const finalWc = wc + Math.ceil(csvOrders/52);

  for(const cl of classes){
    if(period==='weekly'  && cl.minWeekly  && finalWc>=cl.minWeekly)  return cl;
    if(period==='monthly' && cl.minMonthly && finalMc>=cl.minMonthly) return cl;
    if(period==='yearly'  && cl.minYearly  && finalYc>=cl.minYearly)  return cl;
    if(!period){
      if((cl.minWeekly&&finalWc>=cl.minWeekly)||(cl.minMonthly&&finalMc>=cl.minMonthly)||(cl.minYearly&&finalYc>=cl.minYearly))return cl;
    }
  }
  return classes[classes.length-1]||{name:'Normal',color:'#95a5a6'};
  } catch(_e) { console.error("[SG] getCustomerClass:", _e); }
}
function renderClassificationsList(){
  try {
  const classes=getClassifications();const div=document.getElementById('classificationsList');if(!div)return;
  div.innerHTML=classes.map((c,i)=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;margin-bottom:6px;background:#f9f7f5;border-left:4px solid ${c.color};">
    <span style="width:12px;height:12px;border-radius:50%;background:${c.color};flex-shrink:0;"></span>
    <span style="font-weight:700;flex:1;">${escHtml(c.name)}</span>
    <span style="font-size:0.72rem;color:var(--muted);">W≥${c.minWeekly} M≥${c.minMonthly} Y≥${c.minYearly}</span>
    <button onclick="editClassification(${i})" style="background:#e3f2fd;color:#1565c0;border:none;padding:3px 8px;border-radius:6px;font-size:0.75rem;cursor:pointer;">✏️</button>
    <button onclick="deleteClassification(${i})" style="background:#fce4ec;color:#c62828;border:none;padding:3px 8px;border-radius:6px;font-size:0.75rem;cursor:pointer;">🗑️</button>
  </div>`).join('');
  } catch(_e) { console.error("[SG] renderClassificationsList:", _e); }
}
function openAddClassModal(){
  try {
  document.getElementById('classModalTitle').textContent='🎖️ Add Classification';
  ['editClassId','className','classMinWeekly','classMinMonthly','classMinYearly'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  const cc=document.getElementById('classColor');if(cc)cc.value='#27ae60';
  document.getElementById('addClassModal').classList.add('open');
  } catch(_e) { console.error("[SG] openAddClassModal:", _e); }
}
function editClassification(idx){
  try {
  const cl=getClassifications()[idx];
  document.getElementById('classModalTitle').textContent='✏️ Edit Classification';
  document.getElementById('editClassId').value=idx;
  document.getElementById('className').value=cl.name;
  document.getElementById('classColor').value=cl.color||'#27ae60';
  document.getElementById('classMinWeekly').value=cl.minWeekly||0;
  document.getElementById('classMinMonthly').value=cl.minMonthly||0;
  document.getElementById('classMinYearly').value=cl.minYearly||0;
  document.getElementById('addClassModal').classList.add('open');
  } catch(_e) { console.error("[SG] editClassification:", _e); }
}
function saveClassification(){
  try {
  const name=document.getElementById('className').value.trim();if(!name){showToast('Name required','error');return;}
  const color=document.getElementById('classColor').value;
  const entry={id:'cl'+Date.now(),name,color,minWeekly:parseInt(document.getElementById('classMinWeekly').value)||0,minMonthly:parseInt(document.getElementById('classMinMonthly').value)||0,minYearly:parseInt(document.getElementById('classMinYearly').value)||0};
  const idxStr=document.getElementById('editClassId').value;
  let classes=getClassifications();
  // Check duplicate name (ignore current editing index)
  if(idxStr===''){
    const dup=classes.find(c=>(c.name||'').toLowerCase()===name.toLowerCase());
    if(dup){showToast('Classification "'+name+'" already exists!','error');return;}
  }
  if(idxStr!=='')classes[parseInt(idxStr)]={...classes[parseInt(idxStr)],...entry};else classes.push(entry);
  saveClassifications(classes);closeModal('addClassModal');renderClassificationsList();showToast('✅ Classification saved!');
  } catch(_e) { console.error("[SG] saveClassification:", _e); }
}

function cleanDuplicateClassifications(){
  try {
  let classes=getClassifications();
  const seen={};
  classes=classes.filter(c=>{
    const key=(c.name||'').toLowerCase();
    if(seen[key]) return false;
    seen[key]=true;
    return true;
  });
  saveClassifications(classes);
  renderClassificationsList();
  showToast('✅ Duplicates removed!');
  } catch(_e) { console.error("[SG] cleanDuplicateClassifications:", _e); }
}
function deleteClassification(idx){
  try {if(!confirm('Delete?'))return;let cl=getClassifications();cl.splice(idx,1);saveClassifications(cl);renderClassificationsList();showToast('Deleted');
  } catch(_e) { console.error("[SG] deleteClassification:", _e); }
}
function openCustClassSettings(){
  try {
  const modal=document.getElementById('addClassModal');if(modal){openAddClassModal();}
  } catch(_e) { console.error("[SG] openCustClassSettings:", _e); }
}

// =============================================
// ===== SETTINGS SECTION RENDER =====
// =============================================
function renderSettingsSection(){
  try {
  loadOperatingHoursUI();
  loadDeliverySettingsUI();
  loadRestaurantTypeUI();
  populateCategorySelects();
  renderClassificationsList();
  loadTaskThresholdsUI();
  loadInvGlobalThresholdsUI();
  renderInvThresholdTable().catch(function(e){ console.error('[SG] renderInvThresholdTable:',e); });
  } catch(_e) { console.error("[SG] renderSettingsSection:", _e); }
}

// ============================================================
//  INVENTORY STOCK LEVEL SETTINGS
// ============================================================

function getInvGlobalThresholds() {
  try {
  return (_settingsCache['sg_inv_global_thresh']) || { min:5, avg:15, max:50, overstock:100 };
  } catch(e) { return { min:5, avg:15, max:50, overstock:100 }; }
}

function getInvItemThresholds() {
  try {
  return (_settingsCache['sg_inv_item_thresh']) || {};
  } catch(e) { return {}; }
}

function loadInvGlobalThresholdsUI() {
  try {
  const t = getInvGlobalThresholds();
  var minEl = document.getElementById('invGlobalMin');
  var avgEl = document.getElementById('invGlobalAvg');
  var maxEl = document.getElementById('invGlobalMax');
  var ovEl  = document.getElementById('invGlobalOverstock');
  if(minEl) minEl.value = t.min;
  if(avgEl) avgEl.value = t.avg;
  if(maxEl) maxEl.value = t.max;
  if(ovEl)  ovEl.value  = t.overstock;
  } catch(e) { console.error('[SG] loadInvGlobalThresholdsUI:', e); }
}

function saveInvGlobalThresholds() {
  try {
  if(currentUser && currentUser.role !== 'Admin' && !(currentUser.perms||[]).includes('Inventory - Manage Stock')) {
    showToast('Sirf Admin ya authorized employee save kar sakta hai', 'error'); return;
  }
  var t = {
    min:       parseFloat(document.getElementById('invGlobalMin').value)       || 5,
    avg:       parseFloat(document.getElementById('invGlobalAvg').value)       || 15,
    max:       parseFloat(document.getElementById('invGlobalMax').value)       || 50,
    overstock: parseFloat(document.getElementById('invGlobalOverstock').value) || 100
  };
  if(t.min >= t.avg || t.avg >= t.max || t.max >= t.overstock) {
    showToast('❌ Sequence sahi rakho: Min < Average < Max < Overstock', 'error'); return;
  }
  _settingsCache['sg_inv_global_thresh'] = t;
  setSetting('sg_inv_global_thresh', t);
  var s = document.getElementById('invGlobalSaved');
  if(s) { s.style.display='block'; setTimeout(function(){ s.style.display='none'; }, 2500); }
  showToast('✅ Global thresholds save ho gaye!');
  renderInvThresholdTable();
  try { renderStock(); } catch(e) {}
  } catch(e) { console.error('[SG] saveInvGlobalThresholds:', e); }
}

async function renderInvThresholdTable() {
  try {
  var tbody = document.getElementById('invThresholdTableBody');
  if(!tbody) return;

  var search = (document.getElementById('invThresholdSearch')||{}).value || '';
  var typeFilter = (document.getElementById('invThresholdType')||{}).value || '';
  var globalT = getInvGlobalThresholds();
  var itemT   = getInvItemThresholds();
  var canEdit = currentUser && (currentUser.role === 'Admin' || (currentUser.perms||[]).includes('Inventory - Manage Stock'));

  // Combine products + rawmats — await because these are async
  var allItems = [];
  try {
    var prods = (await getProducts()) || [];
    prods.forEach(function(p) {
      // Stock key uses actual type (solid/liquid), NOT 'product'
      allItems.push({ id:p.id, name:p.name, type:p.type||'solid', unit:p.unitType||'unit', itype:'Products' });
    });
  } catch(e) {}
  try {
    var raws = (await getRawmats()) || [];
    raws.forEach(function(r) {
      allItems.push({ id:r.id, name:r.name, type:'rawmat', unit:r.unit||'unit', itype:'Raw Material' });
    });
  } catch(e) {}

  // Filter
  if(search) allItems = allItems.filter(function(i){ return (i.name||'').toLowerCase().includes(search.toLowerCase()); });
  if(typeFilter === 'product') allItems = allItems.filter(function(i){ return i.type === 'solid' || i.type === 'liquid'; });
  else if(typeFilter === 'rawmat') allItems = allItems.filter(function(i){ return i.type === 'rawmat'; });

  if(!allItems.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted);">Koi item nahi mila. Pehle Inventory mein Products ya Raw Materials add karo.</td></tr>';
    return;
  }

  tbody.innerHTML = allItems.map(function(item) {
    var key = item.type + '_' + item.id;
    var custom = itemT[key] || {};
    var hasCustom = !!itemT[key];
    var minVal  = hasCustom ? (custom.min  !== undefined ? custom.min  : '') : '';
    var avgVal  = hasCustom ? (custom.avg  !== undefined ? custom.avg  : '') : '';
    var maxVal  = hasCustom ? (custom.max  !== undefined ? custom.max  : '') : '';
    var ovVal   = hasCustom ? (custom.overstock !== undefined ? custom.overstock : '') : '';

    var typeTag = (item.type === 'solid' || item.type === 'liquid' || item.type === 'product')
      ? '<span style="background:#e8f0fe;color:#1565c0;padding:2px 8px;border-radius:10px;font-size:0.72rem;font-weight:700;">Product</span>'
      : '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:0.72rem;font-weight:700;">Raw Mat</span>';

    var customBadge = hasCustom
      ? '<span style="background:#e8f5e9;color:#2e7d32;font-size:0.68rem;font-weight:700;padding:1px 6px;border-radius:8px;margin-left:4px;">Custom</span>'
      : '<span style="background:#f5f5f5;color:var(--muted);font-size:0.68rem;padding:1px 6px;border-radius:8px;margin-left:4px;">Global</span>';

    var inputStyle = 'width:68px;padding:5px;border:1px solid #ddd;border-radius:6px;text-align:center;font-family:inherit;font-size:0.83rem;';
    var placeholder = function(gVal) { return 'def:'+gVal; };

    if(!canEdit) {
      return '<tr style="border-bottom:1px solid #f0f0f0;">'
        + '<td style="padding:8px 12px;font-weight:600;">' + item.name + customBadge + '</td>'
        + '<td style="padding:8px 8px;">' + typeTag + '</td>'
        + '<td style="padding:8px 8px;color:var(--muted);font-size:0.8rem;">' + item.unit + '</td>'
        + '<td style="padding:8px;text-align:center;color:#c62828;font-weight:700;">' + (minVal !== '' ? minVal : '<span style="color:#ccc">'+globalT.min+'</span>') + '</td>'
        + '<td style="padding:8px;text-align:center;color:#f57c00;font-weight:700;">' + (avgVal !== '' ? avgVal : '<span style="color:#ccc">'+globalT.avg+'</span>') + '</td>'
        + '<td style="padding:8px;text-align:center;color:#2e7d32;font-weight:700;">' + (maxVal !== '' ? maxVal : '<span style="color:#ccc">'+globalT.max+'</span>') + '</td>'
        + '<td style="padding:8px;text-align:center;color:#1565c0;font-weight:700;">' + (ovVal  !== '' ? ovVal  : '<span style="color:#ccc">'+globalT.overstock+'</span>') + '</td>'
        + '<td style="padding:8px;text-align:center;color:var(--muted);font-size:0.75rem;">View Only</td>'
        + '</tr>';
    }

    return '<tr style="border-bottom:1px solid #f0f0f0;" id="invTRow_' + key + '">'
      + '<td style="padding:8px 12px;font-weight:600;">' + item.name + customBadge + '</td>'
      + '<td style="padding:8px 8px;">' + typeTag + '</td>'
      + '<td style="padding:8px 8px;color:var(--muted);font-size:0.8rem;">' + item.unit + '</td>'
      + '<td style="padding:8px;text-align:center;"><input type="number" min="0" placeholder="' + placeholder(globalT.min) + '" value="' + minVal + '" id="iMin_' + key + '" style="' + inputStyle + 'border-color:#ef9a9a;"></td>'
      + '<td style="padding:8px;text-align:center;"><input type="number" min="0" placeholder="' + placeholder(globalT.avg) + '" value="' + avgVal + '" id="iAvg_' + key + '" style="' + inputStyle + 'border-color:#ffe082;"></td>'
      + '<td style="padding:8px;text-align:center;"><input type="number" min="0" placeholder="' + placeholder(globalT.max) + '" value="' + maxVal + '" id="iMax_' + key + '" style="' + inputStyle + 'border-color:#a5d6a7;"></td>'
      + '<td style="padding:8px;text-align:center;"><input type="number" min="0" placeholder="' + placeholder(globalT.overstock) + '" value="' + ovVal  + '" id="iOv_'  + key + '" style="' + inputStyle + 'border-color:#90caf9;"></td>'
      + '<td style="padding:8px;text-align:center;">'
        + `<button onclick="saveInvItemThreshold('${key}')" style="background:var(--fire);color:#fff;border:none;padding:5px 12px;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.78rem;">💾</button>`
        + (hasCustom ? `<button onclick="clearInvItemThreshold('${key}')" style="background:#f5f5f5;color:var(--muted);border:1px solid #ddd;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:0.78rem;" title="Custom hatao, Global use karo">✕</button>` : '')
      + '</td>'
      + '</tr>';
  }).join('');
  } catch(e) { console.error('[SG] renderInvThresholdTable:', e); }
}

function saveInvItemThreshold(key) {
  try {
  if(currentUser && currentUser.role !== 'Admin' && !(currentUser.perms||[]).includes('Inventory - Manage Stock')) {
    showToast('Sirf Admin ya authorized employee save kar sakta hai', 'error'); return;
  }
  var minV = parseFloat(document.getElementById('iMin_'+key).value);
  var avgV = parseFloat(document.getElementById('iAvg_'+key).value);
  var maxV = parseFloat(document.getElementById('iMax_'+key).value);
  var ovV  = parseFloat(document.getElementById('iOv_' +key).value);

  // Empty = use global
  var hasAny = !isNaN(minV) || !isNaN(avgV) || !isNaN(maxV) || !isNaN(ovV);
  if(!hasAny) { showToast('Koi value nahi dali — pehle number daalo', 'error'); return; }

  // Validate only filled values
  var g = getInvGlobalThresholds();
  var fMin = isNaN(minV) ? g.min : minV;
  var fAvg = isNaN(avgV) ? g.avg : avgV;
  var fMax = isNaN(maxV) ? g.max : maxV;
  var fOv  = isNaN(ovV)  ? g.overstock : ovV;

  if(fMin >= fAvg || fAvg >= fMax || fMax >= fOv) {
    showToast('❌ Sequence sahi rakho: Min < Average < Max < Overstock', 'error'); return;
  }

  var allT = getInvItemThresholds();
  allT[key] = {
    min:       isNaN(minV) ? undefined : minV,
    avg:       isNaN(avgV) ? undefined : avgV,
    max:       isNaN(maxV) ? undefined : maxV,
    overstock: isNaN(ovV)  ? undefined : ovV
  };
  _settingsCache['sg_inv_item_thresh'] = allT;
  setSetting('sg_inv_item_thresh', allT);
  showToast('✅ Saved!');
  renderInvThresholdTable();
  try { renderStock(); } catch(e) {}
  } catch(e) { console.error('[SG] saveInvItemThreshold:', e); showToast('Save error', 'error'); }
}

function clearInvItemThreshold(key) {
  try {
  if(!confirm('Is item ka custom setting hatao aur Global Default use karo?')) return;
  var allT = getInvItemThresholds();
  delete allT[key];
  _settingsCache['sg_inv_item_thresh'] = allT;
  setSetting('sg_inv_item_thresh', allT);
  showToast('✅ Custom setting hata diya — Global Default use hoga');
  renderInvThresholdTable();
  try { renderStock(); } catch(e) {}
  } catch(e) { console.error('[SG] clearInvItemThreshold:', e); }
}

async function saveAllInvThresholds() {
  try {
  if(currentUser && currentUser.role !== 'Admin' && !(currentUser.perms||[]).includes('Inventory - Manage Stock')) {
    showToast('Sirf Admin ya authorized employee save kar sakta hai', 'error'); return;
  }

  var allT = getInvItemThresholds();
  var g = getInvGlobalThresholds();
  var savedCount = 0;
  var errorItems = [];

  // Get all visible rows in the table
  var tbody = document.getElementById('invThresholdTableBody');
  if(!tbody) return;
  var rows = tbody.querySelectorAll('tr[id^="invTRow_"]');

  rows.forEach(function(row) {
    var key = row.id.replace('invTRow_', '');
    var minEl = document.getElementById('iMin_' + key);
    var avgEl = document.getElementById('iAvg_' + key);
    var maxEl = document.getElementById('iMax_' + key);
    var ovEl  = document.getElementById('iOv_'  + key);
    if(!minEl) return; // view-only row, skip

    var minV = parseFloat(minEl.value);
    var avgV = parseFloat(avgEl.value);
    var maxV = parseFloat(maxEl.value);
    var ovV  = parseFloat(ovEl.value);

    // Skip completely empty rows
    var hasAny = !isNaN(minV) || !isNaN(avgV) || !isNaN(maxV) || !isNaN(ovV);
    if(!hasAny) return;

    // Validate sequence
    var fMin = isNaN(minV) ? g.min : minV;
    var fAvg = isNaN(avgV) ? g.avg : avgV;
    var fMax = isNaN(maxV) ? g.max : maxV;
    var fOv  = isNaN(ovV)  ? g.overstock : ovV;

    if(fMin >= fAvg || fAvg >= fMax || fMax >= fOv) {
      // Get item name from row
      var nameEl = row.querySelector('td:first-child');
      var name = nameEl ? nameEl.textContent.replace('CustomGlobal','').trim() : key;
      errorItems.push(name);
      return;
    }

    allT[key] = {
      min:       isNaN(minV) ? undefined : minV,
      avg:       isNaN(avgV) ? undefined : avgV,
      max:       isNaN(maxV) ? undefined : maxV,
      overstock: isNaN(ovV)  ? undefined : ovV
    };
    savedCount++;
  });

  if(errorItems.length) {
    showToast('❌ Sequence error: ' + errorItems.join(', ') + ' — Min < Avg < Max < Over hona chahiye', 'error');
    if(savedCount === 0) return;
  }

  if(savedCount === 0) {
    showToast('Koi bhi row mein value nahi dali — pehle numbers daalo', 'error');
    return;
  }

  _settingsCache['sg_inv_item_thresh'] = allT;
  setSetting('sg_inv_item_thresh', allT);
  showToast('✅ ' + savedCount + ' items save ho gaye!');
  renderInvThresholdTable();
  try { renderStock(); } catch(e) {}
  } catch(e) { console.error('[SG] saveAllInvThresholds:', e); showToast('Save error', 'error'); }
}

// Helper: kisi bhi item ka effective threshold nikalo
function getEffectiveThreshold(itemType, itemId) {
  try {
  var allT = getInvItemThresholds();
  var g    = getInvGlobalThresholds();
  // Stock uses solid/liquid/rawmat as type — try exact key first, then aliases
  var key = itemType + '_' + itemId;
  var altKey = (itemType === 'solid' || itemType === 'liquid') ? 'product_' + itemId : null;
  var custom = allT[key] || (altKey && allT[altKey]) || {};
  return {
    min:       custom.min       !== undefined ? custom.min       : g.min,
    avg:       custom.avg       !== undefined ? custom.avg       : g.avg,
    max:       custom.max       !== undefined ? custom.max       : g.max,
    overstock: custom.overstock !== undefined ? custom.overstock : g.overstock
  };
  } catch(e) { return { min:5, avg:15, max:50, overstock:100 }; }
}

function loadTaskThresholdsUI() {
  try {
  const th = (_settingsCache['sg_task_thresholds'])||{underloaded:2, normal:5, average:8, overloaded:9};
  const u=document.getElementById('thUnderloaded'); if(u) u.value = th.underloaded !== undefined ? th.underloaded : 2;
  const n=document.getElementById('thNormal'); if(n) n.value = th.normal !== undefined ? th.normal : 5;
  const a=document.getElementById('thAverage'); if(a) a.value = th.average !== undefined ? th.average : 8;
  const o=document.getElementById('thOverloaded'); if(o) o.value = th.overloaded !== undefined ? th.overloaded : 9;
  } catch(_e) { console.error("[SG] loadTaskThresholdsUI:", _e); }
}

// Populate categories on menu page load
document.addEventListener('DOMContentLoaded',function(){
  setTimeout(()=>populateCategorySelects(),600);

  // ===== AUTO-MIGRATION: Add new permissions to existing staff =====
  // When new permissions are added to the system, existing staff in localStorage
  // who have related permissions should get the new ones automatically.
  migrateStaffPermissions();
});


// =============================================
// ===== FEATURE 23: REPORTS & ANALYTICS =======
// =============================================

function getReportOrders() {
  try {
  let o = orders;
  const period = document.getElementById('rptPeriod')?.value||'monthly';
  const today = getTodayIST();
  const now = new Date(today);
  const fromEl = document.getElementById('rptFrom');
  const toEl = document.getElementById('rptTo');
  if(fromEl) fromEl.style.display = period==='custom'?'inline-block':'none';
  if(toEl) toEl.style.display = period==='custom'?'inline-block':'none';

  let from = today, to = today;

  if(period==='daily') {
    from = to = today;
  } else if(period==='weekly') {
    const wr = getWeekRange(now);
    from = wr.from; to = wr.to;
  } else if(period==='monthly') {
    const last = new Date(now.getFullYear(), now.getMonth()+1, 0);
    from = today.substring(0,7)+'-01';
    to = today.substring(0,7)+'-'+String(last.getDate()).padStart(2,'0');
  } else if(period==='yearly') {
    from = now.getFullYear()+'-01-01';
    to = now.getFullYear()+'-12-31';
  } else if(period==='custom') {
    from = document.getElementById('rptFrom')?.value || today;
    to = document.getElementById('rptTo')?.value || today;
  }

  o = o.filter(x => {
    const d = parseAnyDate(x);
    if(!d) return false;
    return d >= from && d <= to;
  });
  return o.filter(x=>x.status!=='Cancelled');
  } catch(_e) { console.error("[SG] getReportOrders:", _e); }
}

function renderReports() {
  try {
  const o = getReportOrders();
  const gst = getGSTRate()/100;
  const total = o.reduce((s,x)=>s+(x.grandTotal||x.total||0),0);
  const gstAmt = o.reduce((s,x)=>{
    const sub = x.subtotal || Math.round((x.grandTotal||x.total||0)/(1+gst));
    return s + Math.round(sub*gst);
  },0);

  // Summary cards
  const cards = document.getElementById('rptSummaryCards');
  if(cards) cards.innerHTML = `
    <div class="stat-card orange"><div class="stat-icon">🧾</div><div class="stat-num">₹${total.toLocaleString('en-IN')}</div><div class="stat-label">Total Revenue</div></div>
    <div class="stat-card gold"><div class="stat-icon">📦</div><div class="stat-num">${o.length}</div><div class="stat-label">Orders</div></div>
    <div class="stat-card green"><div class="stat-icon">🧾</div><div class="stat-num">₹${gstAmt.toLocaleString('en-IN')}</div><div class="stat-label">GST Collected</div></div>
    <div class="stat-card blue"><div class="stat-icon">💰</div><div class="stat-num">₹${o.length?Math.round(total/o.length):0}</div><div class="stat-label">Avg Order Value</div></div>`;

  // Revenue by type chart
  const types = ['Home Delivery','Takeaway','Dine-In'];
  const colors = ['#e8400c','#f5a623','#3498db'];
  const typeRevs = types.map(t=>({type:t, rev:o.filter(x=>x.type===t).reduce((s,x)=>s+(x.grandTotal||x.total||0),0)}));
  const maxRev = Math.max(...typeRevs.map(x=>x.rev),1);
  const chartEl = document.getElementById('rptTypeChart');
  if(chartEl) chartEl.innerHTML = typeRevs.map((t,i)=>`
    <div style="text-align:center;flex:1;min-width:80px;">
      <div style="font-weight:800;font-size:0.9rem;margin-bottom:6px;color:${colors[i]};">₹${t.rev.toLocaleString('en-IN')}</div>
      <div style="background:${colors[i]};border-radius:8px 8px 0 0;height:${Math.max(20,Math.round(t.rev/maxRev*120))}px;"></div>
      <div style="font-size:0.78rem;color:var(--muted);margin-top:6px;">${t.type}</div>
      <div style="font-size:0.72rem;color:var(--muted);">${o.filter(x=>x.type===t.type).length} orders</div>
    </div>`).join('');

  // Top selling items
  const itemMap = {};
  o.forEach(x=>(x.items||[]).forEach(it=>{
    if(!itemMap[it.name]) itemMap[it.name]={qty:0,rev:0};
    itemMap[it.name].qty+=(it.qty||1);
    itemMap[it.name].rev+=((it.price||0)*(it.qty||1));
  }));
  const topItems = Object.entries(itemMap).sort((a,b)=>b[1].qty-a[1].qty).slice(0,10);
  const topBody = document.getElementById('rptTopItems');
  if(topBody) topBody.innerHTML = topItems.length ? topItems.map(([name,d],i)=>`
    <tr><td><b>#${i+1}</b></td><td>${name}</td><td><b>${d.qty}</b></td><td>₹${d.rev.toLocaleString('en-IN')}</td></tr>`).join('')
    : '<tr><td colspan="4"><div class="empty"><p>No data</p></div></td></tr>';

  // GST report
  const period = document.getElementById('rptPeriod')?.value||'monthly';
  const taxable = o.reduce((s,x)=>s+(x.subtotal||Math.round((x.grandTotal||x.total||0)/(1+gst))),0);
  const gstBody = document.getElementById('rptGSTBody');
  if(gstBody) gstBody.innerHTML = `<tr>
    <td>${period.charAt(0).toUpperCase()+period.slice(1)}</td>
    <td>₹${taxable.toLocaleString('en-IN')}</td>
    <td>${(gst*100).toFixed(0)}%</td>
    <td><b style="color:var(--fire);">₹${gstAmt.toLocaleString('en-IN')}</b></td>
    <td><b>₹${total.toLocaleString('en-IN')}</b></td>
  </tr>`;
  } catch(e) { console.error("[SG] renderReports error:", e); }
}

function exportReportCSV() {
  try {
  const o = getReportOrders();
  const rows = [['Order ID','Customer','Type','Items','Subtotal','GST','Grand Total','Date']];
  const gst = getGSTRate()/100;
  o.forEach(x=>{
    const sub = x.subtotal||Math.round((x.grandTotal||x.total||0)/(1+gst));
    const gstAmt = Math.round(sub*gst);
    rows.push([x.id,x.name,x.type,(x.items||[]).map(i=>i.name+'x'+i.qty).join(';'),sub,gstAmt,x.grandTotal||x.total,x.time]);
  });
  downloadCSV(rows, 'report.csv');
  } catch(_e) { console.error("[SG] exportReportCSV:", _e); }
}

function exportReportPDF() {
  const o = getReportOrders();
  const gst = getGSTRate()/100;
  const total = o.reduce((s,x)=>s+(x.grandTotal||x.total||0),0);
  const w = window.open('','_blank');
  w.document.write(`<html><head><title>Revenue Report</title>
  <style>body{font-family:sans-serif;padding:24px;}table{width:100%;border-collapse:collapse;margin-top:16px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f5f0eb;}h2{color:#e8400c;}</style></head>
  <body><h2>📊 Revenue Report</h2><p><b>Period:</b> ${document.getElementById('rptPeriod')?.value||'monthly'} | <b>Total:</b> ₹${total.toLocaleString('en-IN')} | <b>Orders:</b> ${o.length}</p>
  <table><thead><tr><th>Order ID</th><th>Customer</th><th>Type</th><th>Total</th><th>Date</th></tr></thead>
  <tbody>${o.map(x=>`<tr><td>${x.id}</td><td>${x.name}</td><td>${x.type}</td><td>₹${x.grandTotal||x.total}</td><td>${x.time||''}</td></tr>`).join('')}</tbody></table>
  </body></html>`);
  w.document.close();
  w.print();
}

function downloadCSV(rows, filename) {
  try {
  const csv = rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  } catch(_e) { console.error("[SG] downloadCSV:", _e); }
}

// =============================================
// ===== FEATURE 24: COUPONS / PROMO CODES =====
// =============================================

function getCoupons() { return (_settingsCache['sg_coupons'])||[]; }
function saveCoupons(d) {
  try { _settingsCache['sg_coupons']=d; setSetting('sg_coupons',d);
  } catch(_e) { console.error("[SG] saveCoupons:", _e); }
}

function renderCoupons() {
  try {
  const coupons = getCoupons();
  const tbody = document.getElementById('couponsTableBody');
  if(!tbody) return;
  if(!coupons.length) {
    tbody.innerHTML='<tr><td colspan="8"><div class="empty"><div class="empty-icon">🎟️</div><p>No coupons yet. Create one!</p></div></td></tr>';
    return;
  }
  const now = new Date();
  tbody.innerHTML = coupons.map((c,i)=>{
    const expired = c.validity && new Date(c.validity) < now;
    const usedUp = c.usageLimit && c.usedCount >= c.usageLimit;
    const active = !expired && !usedUp && c.active!==false;
    return `<tr>
      <td><b style="color:var(--fire);font-size:1rem;letter-spacing:1px;">${c.code}</b></td>
      <td><b>${c.discount}${c.type==='percent'?'%':'₹'}</b></td>
      <td>${c.type==='percent'?'Percentage':'Flat Amount'}</td>
      <td>${c.minOrder?'₹'+c.minOrder:'—'}</td>
      <td>${c.usedCount||0}${c.usageLimit?'/'+c.usageLimit:' (unlimited)'}</td>
      <td>${c.validity||'—'}</td>
      <td><span class="status ${active?'confirmed':'cancelled'}">${active?'Active':expired?'Expired':'Used Up'}</span></td>
      <td>
        <div class="action-btns">
          <button class="act-btn act-edit" onclick="editCoupon(${i})">Edit</button>
          <button class="act-btn act-delete" onclick="deleteCoupon(${i})">Del</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderCoupons:", _e); }
}

function openAddCouponModal(editIdx) {
  try {
  const c = editIdx!==undefined ? getCoupons()[editIdx] : null;
  document.body.insertAdjacentHTML('beforeend',`
    <div class="modal-overlay open" id="couponModalOverlay" onclick="if(event.target===this)document.getElementById('couponModalOverlay').remove()">
      <div class="modal" style="max-width:440px;">
        <h3>${c?'✏️ Edit':'🎟️ New'} Coupon</h3>
        <div class="form-group"><label>Coupon Code *</label>
          <input type="text" id="cpCode" value="${c?.code||''}" placeholder="e.g. SAVE20" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;text-transform:uppercase;">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group"><label>Discount *</label>
            <input type="number" id="cpDiscount" value="${c?.discount||''}" min="1" placeholder="20" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
          </div>
          <div class="form-group"><label>Type</label>
            <select id="cpType" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
              <option value="percent" ${c?.type==='percent'?'selected':''}>% Percentage</option>
              <option value="flat" ${c?.type==='flat'?'selected':''}>₹ Flat Amount</option>
            </select>
          </div>
          <div class="form-group"><label>Min Order (₹)</label>
            <input type="number" id="cpMinOrder" value="${c?.minOrder||''}" min="0" placeholder="0" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
          </div>
          <div class="form-group"><label>Usage Limit</label>
            <input type="number" id="cpUsageLimit" value="${c?.usageLimit||''}" min="1" placeholder="Unlimited" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
          </div>
        </div>
        <div class="form-group"><label>Validity (Date)</label>
          <input type="date" id="cpValidity" value="${c?.validity||''}" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
        </div>
        <div class="modal-btns">
          <button class="btn-cancel" onclick="document.getElementById('couponModalOverlay').remove()">Cancel</button>
          <button class="btn-save" onclick="saveCoupon(${editIdx!==undefined?editIdx:'undefined'})">💾 Save</button>
        </div>
      </div>
    </div>`);
  document.getElementById('cpCode').addEventListener('input',function(){this.value=(this.value||'').toUpperCase();});
  } catch(_e) { console.error("[SG] openAddCouponModal:", _e); }
}

function saveCoupon(editIdx) {
  try {
  const code = document.getElementById('cpCode').value.trim().toUpperCase();
  const discount = parseFloat(document.getElementById('cpDiscount').value);
  const type = document.getElementById('cpType').value;
  if(!code||!discount) { showToast('Code and discount required','error'); return; }
  const coupons = getCoupons();
  // Check duplicate code
  const dupIdx = coupons.findIndex((c,i)=>c.code===code&&i!==editIdx);
  if(dupIdx>=0) { showToast('Code already exists!','error'); return; }
  const entry = {
    code, discount, type,
    minOrder: parseFloat(document.getElementById('cpMinOrder').value)||0,
    usageLimit: parseInt(document.getElementById('cpUsageLimit').value)||null,
    validity: document.getElementById('cpValidity').value||null,
    usedCount: editIdx!==undefined ? (coupons[editIdx]?.usedCount||0) : 0,
    active: true, createdAt: editIdx!==undefined ? coupons[editIdx]?.createdAt : new Date().toLocaleString('en-IN')
  };
  if(editIdx!==undefined) coupons[editIdx]=entry; else coupons.push(entry);
  saveCoupons(coupons);
  document.getElementById('couponModalOverlay').remove();
  renderCoupons();
  showToast(`✅ Coupon ${code} saved!`);
  } catch(_e) { console.error("[SG] saveCoupon:", _e); }
}

function editCoupon(i) {
  try { openAddCouponModal(i);
  } catch(_e) { console.error("[SG] editCoupon:", _e); }
}
function deleteCoupon(i) {
  try {
  if(!confirm('Delete this coupon?')) return;
  const c = getCoupons(); c.splice(i,1); saveCoupons(c); renderCoupons();
  showToast('Deleted');
  } catch(_e) { console.error("[SG] deleteCoupon:", _e); }
}

// Apply coupon at checkout (called from cart)
function applyCoupon(code, orderTotal) {
  try {
  const coupons = getCoupons();
  const now = new Date();
  const c = coupons.find(x=>x.code===code.toUpperCase());
  if(!c) return {valid:false, msg:'Invalid coupon code'};
  if(c.active===false) return {valid:false, msg:'Coupon is inactive'};
  if(c.validity && new Date(c.validity) < now) return {valid:false, msg:'Coupon expired'};
  if(c.usageLimit && c.usedCount >= c.usageLimit) return {valid:false, msg:'Coupon usage limit reached'};
  if(c.minOrder && orderTotal < c.minOrder) return {valid:false, msg:`Min order ₹${c.minOrder} required`};
  const disc = c.type==='percent' ? Math.round(orderTotal*c.discount/100) : Math.min(c.discount, orderTotal);
  return {valid:true, discount:disc, msg:`🎉 Coupon applied! You save ₹${disc}`};
  } catch(_e) { console.error("[SG] applyCoupon:", _e); }
}

// =============================================
// ===== FEATURE 25: LOYALTY POINTS ============
// =============================================

function getLoyaltySettings() {
  return (_settingsCache['sg_loyalty_settings'])||{rupees:100,points:10,redeemVal:0.5,minRedeem:100};
}
function saveLoyaltySettingsData(d) {
  try { _settingsCache['sg_loyalty_settings']=d; setSetting('sg_loyalty_settings',d);
  } catch(_e) { console.error("[SG] saveLoyaltySettingsData:", _e); }
}
function getLoyaltyData() { return (_settingsCache['sg_loyalty'])||{}; }
function saveLoyaltyData(d) {
  try { _settingsCache['sg_loyalty']=d; setSetting('sg_loyalty',d);
  } catch(_e) { console.error("[SG] saveLoyaltyData:", _e); }
}

function loadLoyaltySettings() {
  try {
  const s = getLoyaltySettings();
  const el = id=>document.getElementById(id);
  if(el('loyaltyRupees')) el('loyaltyRupees').value = s.rupees;
  if(el('loyaltyPoints')) el('loyaltyPoints').value = s.points;
  if(el('loyaltyRedeemVal')) el('loyaltyRedeemVal').value = s.redeemVal;
  if(el('loyaltyMinRedeem')) el('loyaltyMinRedeem').value = s.minRedeem;
  } catch(_e) { console.error("[SG] loadLoyaltySettings:", _e); }
}

function saveLoyaltySettings() {
  try {
  const rupees = parseInt(document.getElementById('loyaltyRupees').value)||100;
  const points = parseInt(document.getElementById('loyaltyPoints').value)||10;
  const redeemVal = parseFloat(document.getElementById('loyaltyRedeemVal').value)||0.5;
  const minRedeem = parseInt(document.getElementById('loyaltyMinRedeem').value)||100;
  saveLoyaltySettingsData({rupees,points,redeemVal,minRedeem});
  const msg = document.getElementById('loyaltySavedMsg');
  if(msg){msg.style.display='block';setTimeout(()=>msg.style.display='none',3000);}
  showToast('✅ Loyalty settings saved!');
  } catch(_e) { console.error("[SG] saveLoyaltySettings:", _e); }
}

// Award points after order
function awardLoyaltyPoints(customerId, orderTotal, orderId, customerName) {
  try {
  const s = getLoyaltySettings();
  const pts = Math.floor(orderTotal / s.rupees) * s.points;
  if(!pts) return 0;
  const data = getLoyaltyData();
  if(!data[customerId]) data[customerId] = {earned:0, redeemed:0, history:[]};
  data[customerId].earned += pts;
  data[customerId].history.unshift({
    type: 'earn',
    pts,
    note: `Order ${orderId||''} — ₹${orderTotal} spent`,
    date: new Date().toLocaleString('en-IN')
  });
  saveLoyaltyData(data);
  return pts;
  } catch(_e) { console.error("[SG] awardLoyaltyPoints:", _e); }
}

// Redeem points for a customer
function redeemLoyaltyPoints(customerId, pointsToRedeem) {
  try {
  const s = getLoyaltySettings();
  const data = getLoyaltyData();
  if(!data[customerId]) return {valid:false,msg:'No points found'};
  const balance = (data[customerId].earned||0)-(data[customerId].redeemed||0);
  if(pointsToRedeem > balance) return {valid:false,msg:`Only ${balance} points available`};
  if(pointsToRedeem < s.minRedeem) return {valid:false,msg:`Minimum ${s.minRedeem} points required`};
  const discountAmt = Math.round(pointsToRedeem * s.redeemVal);
  data[customerId].redeemed += pointsToRedeem;
  data[customerId].history.unshift({type:'redeem',pts:-pointsToRedeem,note:`Redeemed for ₹${discountAmt} discount`,date:new Date().toLocaleString('en-IN')});
  saveLoyaltyData(data);
  return {valid:true,discount:discountAmt,msg:`✅ ${pointsToRedeem} points redeemed for ₹${discountAmt} off`};
  } catch(_e) { console.error("[SG] redeemLoyaltyPoints:", _e); }
}


async function renderLoyaltyTable() {
  try {
  const search = (document.getElementById('loyaltySearch')?.value||'').toLowerCase();
  const custs = customers.length ? customers : await sbGetCustomers();
  const data = getLoyaltyData();
  const s = getLoyaltySettings();
  const tbody = document.getElementById('loyaltyTableBody');
  if(!tbody) return;
  if(!custs.length) {
    tbody.innerHTML='<tr><td colspan="7"><div class="empty"><div class="empty-icon">⭐</div><p>No customers registered yet.</p></div></td></tr>';
    return;
  }
  let list = custs;
  if(search) list = list.filter(c=>(c.name||'').toLowerCase().includes(search)||(c.mobile||'').includes(search)||(c.email||'').toLowerCase().includes(search));
  if(!list.length) { tbody.innerHTML='<tr><td colspan="7"><div class="empty"><p>No customers found matching your search.</p></div></td></tr>'; return; }
  tbody.innerHTML = list.map(c=>{
    const custId = c.id || c.mobile; // old customers may not have id, use mobile
    const d = data[custId]||{earned:0,redeemed:0,history:[]};
    // c.spent = actual spent (updated on order submit), c.totalSpent fallback
    const totalSpent = c.spent || c.totalSpent || 0;
    const orderCount = c.orders || 0;
    const earned = d.earned || Math.floor(totalSpent / s.rupees) * s.points;
    const redeemed = d.redeemed||0;
    const balance = earned - redeemed;
    return `<tr>
      <td>
        <div style="font-weight:700;">${escHtml(c.name||'—')}</div>
        <div style="font-size:0.72rem;color:var(--muted);">${escHtml(c.email||'')}</div>
      </td>
      <td>${escHtml(c.mobile||'—')}</td>
      <td>₹${totalSpent.toLocaleString('en-IN')}
        <div style="font-size:0.72rem;color:var(--muted);">${orderCount} orders</div>
      </td>
      <td><span style="color:#2e7d32;font-weight:700;">+${earned}</span></td>
      <td><span style="color:var(--fire);">-${redeemed}</span></td>
      <td><b style="font-size:1rem;">${balance} pts</b>
        <div style="font-size:0.72rem;color:var(--muted);">≈ ₹${Math.round(balance*s.redeemVal)}</div></td>
      <td>
        <button class="act-btn act-view" onclick="viewLoyaltyHistory('${custId}','${escHtml(c.name)}')">History</button>
        ${balance>0?`<button class="act-btn" onclick="manualRedeemPoints('${custId}','${escHtml(c.name)}',${balance})" style="background:#fff8e1;color:#f57c00;">Redeem</button>`:''}
      </td>
    </tr>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderLoyaltyTable:", _e); }
}

async function renderLoyaltySummary() {
  try {
  const custs = customers.length ? customers : await sbGetCustomers();
  const data = getLoyaltyData();
  const s = getLoyaltySettings();
  let totalEarned=0,totalRedeemed=0;
  custs.forEach(c=>{
    const custId = c.id || c.mobile;
    const d=data[custId]||{};
    const totalSpent = c.spent || c.totalSpent || 0;
    totalEarned+=(d.earned||Math.floor(totalSpent/s.rupees)*s.points);
    totalRedeemed+=(d.redeemed||0);
  });
  const el = document.getElementById('loyaltySummary');
  if(!el) return;
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;justify-content:space-between;padding:10px;background:#e8f5e9;border-radius:8px;">
        <span style="font-weight:600;">Total Points Earned</span><b style="color:#2e7d32;">+${totalEarned.toLocaleString()}</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:#fff8e1;border-radius:8px;">
        <span style="font-weight:600;">Total Points Redeemed</span><b style="color:var(--fire);">-${totalRedeemed.toLocaleString()}</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px;background:#f5f0eb;border-radius:8px;">
        <span style="font-weight:600;">Points Outstanding</span><b>${(totalEarned-totalRedeemed).toLocaleString()}</b>
      </div>
      <div style="font-size:0.78rem;color:var(--muted);margin-top:4px;">Formula: ₹${s.rupees} = ${s.points} pts | 1pt = ₹${s.redeemVal}</div>
    </div>`;
  } catch(_e) { console.error("[SG] renderLoyaltySummary:", _e); }
}

function viewLoyaltyHistory(custId, custName) {
  try {
  const data = getLoyaltyData();
  const hist = data[custId]?.history||[];
  document.body.insertAdjacentHTML('beforeend',`
    <div class="modal-overlay open" id="loyHist" onclick="if(event.target===this)document.getElementById('loyHist').remove()">
      <div class="modal" style="max-width:420px;max-height:80vh;overflow-y:auto;">
        <h3>⭐ Points History — ${custName}</h3>
        ${hist.length ? `<div style="display:flex;flex-direction:column;gap:6px;">${hist.map(h=>`
          <div style="display:flex;justify-content:space-between;padding:8px 12px;background:${h.type==='earn'?'#e8f5e9':'#fff8e1'};border-radius:8px;">
            <span style="font-size:0.85rem;">${h.note}</span>
            <b style="color:${h.type==='earn'?'#2e7d32':'var(--fire)'};">${h.pts>0?'+':''}${h.pts}</b>
          </div>
          <div style="font-size:0.72rem;color:var(--muted);text-align:right;margin-top:-4px;">${h.date}</div>`).join('')}</div>`
          : '<p style="color:var(--muted);text-align:center;">No history yet</p>'}
        <button class="btn-cancel" style="width:100%;margin-top:16px;" onclick="document.getElementById('loyHist').remove()">Close</button>
      </div>
    </div>`);
  } catch(_e) { console.error("[SG] viewLoyaltyHistory:", _e); }
}

function manualRedeemPoints(custId, custName, balance) {
  try {
  const s = getLoyaltySettings();
  document.body.insertAdjacentHTML('beforeend',`
    <div class="modal-overlay open" id="redeemModal" onclick="if(event.target===this)document.getElementById('redeemModal').remove()">
      <div class="modal" style="max-width:380px;">
        <h3>🎁 Redeem Points — ${custName}</h3>
        <p style="color:var(--muted);font-size:0.85rem;margin-bottom:14px;">Balance: <b>${balance} pts</b> (≈ ₹${Math.round(balance*s.redeemVal)})</p>
        <div class="form-group"><label>Points to Redeem (min ${s.minRedeem})</label>
          <input type="number" id="redeemPtsInput" min="${s.minRedeem}" max="${balance}" value="${Math.min(balance,s.minRedeem)}" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
        </div>
        <div class="modal-btns">
          <button class="btn-cancel" onclick="document.getElementById('redeemModal').remove()">Cancel</button>
          <button class="btn-save" onclick="confirmRedeem('${custId}',${balance})">✅ Redeem</button>
        </div>
      </div>
    </div>`);
  } catch(_e) { console.error("[SG] manualRedeemPoints:", _e); }
}

function confirmRedeem(custId, balance) {
  try {
  const pts = parseInt(document.getElementById('redeemPtsInput').value)||0;
  const result = redeemLoyaltyPoints(custId, pts);
  if(!result.valid) { showToast(result.msg,'error'); return; }
  document.getElementById('redeemModal').remove();
  showToast(result.msg);
  renderLoyaltyTable();
  renderLoyaltySummary();
  } catch(_e) { console.error("[SG] confirmRedeem:", _e); }
}

// =============================================
// ===== FEATURE 26: STAFF ATTENDANCE ==========
// =============================================

// getAttendance/saveAttendance defined above with Supabase sync

function populateAttStaffFilter() {
  try {
  const sel = document.getElementById('attStaffFilter');
  if(!sel) return;
  const isAdmin = currentUser?.role==='Admin';
  if(!isAdmin) { sel.style.display='none'; return; }
  sel.innerHTML = '<option value="">All Staff</option>'
    + staff.filter(s=>s.approvalStatus==='approved').map(s=>`<option value="${s.id}">${escHtml(s.name)}</option>`).join('');
  } catch(_e) { console.error("[SG] populateAttStaffFilter:", _e); }
}

function doCheckIn() {
  try {
  const att = getAttendance();
  const today = new Date().toISOString().split('T')[0];
  const userId = currentUser?.username;
  // Check if already checked in today
  const existing = att.find(a=>a.userId===userId&&a.date===today);
  if(existing && !existing.checkOut) { showToast('Already checked in!','error'); return; }
  att.push({
    id:'att'+Date.now(), userId, staffName:currentUser?.name,
    date:today, checkIn:new Date().toLocaleTimeString('en-IN'), checkOut:null, hours:null
  });
  saveAttendance(att);
  showToast('✅ Checked in at '+new Date().toLocaleTimeString('en-IN'));
  renderAttendance(); renderAttTodayStatus();
  } catch(_e) { console.error("[SG] doCheckIn:", _e); }
}

function doCheckOut() {
  try {
  const att = getAttendance();
  const today = new Date().toISOString().split('T')[0];
  const userId = currentUser?.username;
  const rec = att.slice().reverse().find(a=>a.userId===userId&&a.date===today&&!a.checkOut);
  if(!rec) { showToast('No active check-in found','error'); return; }
  const recOrig = att.find(a=>a.id===rec.id);
  recOrig.checkOut = new Date().toLocaleTimeString('en-IN');
  // Calculate hours
  try {
    const ci = new Date(today+' '+rec.checkIn);
    const co = new Date(today+' '+recOrig.checkOut);
    recOrig.hours = ((co-ci)/3600000).toFixed(2);
  } catch(e) { recOrig.hours = '—'; }
  saveAttendance(att);
  showToast('🚪 Checked out at '+recOrig.checkOut+' ('+recOrig.hours+'h)');
  renderAttendance(); renderAttTodayStatus();
  } catch(_e) { console.error("[SG] doCheckOut:", _e); }
}

function renderAttTodayStatus() {
  try {
  const att = getAttendance();
  const today = new Date().toISOString().split('T')[0];
  const userId = currentUser?.username;
  const todayRec = att.slice().reverse().find(a=>a.userId===userId&&a.date===today);
  const el = document.getElementById('attTodayStatus');
  if(!el) return;
  if(!todayRec) {
    el.innerHTML = '<div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;font-size:0.88rem;">⏰ You have not checked in today.</div>';
  } else if(!todayRec.checkOut) {
    el.innerHTML = `<div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:10px;padding:12px 16px;font-size:0.88rem;">✅ <b>Checked in</b> at ${todayRec.checkIn} — Session active</div>`;
  } else {
    el.innerHTML = `<div style="background:#f5f0eb;border:1px solid #e8d5c8;border-radius:10px;padding:12px 16px;font-size:0.88rem;">🏁 <b>Shift complete:</b> ${todayRec.checkIn} → ${todayRec.checkOut} (${todayRec.hours}h)</div>`;
  }
  } catch(_e) { console.error("[SG] renderAttTodayStatus:", _e); }
}

function renderAttendance() {
  try {
  const att = getAttendance();
  const period = document.getElementById('attFilter')?.value||'daily';
  const staffFilter = document.getElementById('attStaffFilter')?.value||'';
  const isAdmin = currentUser?.role==='Admin';
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  let filtered = att;
  // Non-admin: only own records
  if(!isAdmin) filtered = filtered.filter(a=>a.userId===currentUser?.username);
  else if(staffFilter) {
    const s = staff.find(x=>x.id===staffFilter);
    if(s) filtered = filtered.filter(a=>a.userId===s.username||a.userId===s.id);
  }

  if(period==='daily') filtered = filtered.filter(a=>a.date===today);
  else if(period==='weekly') {
    const wa = new Date(now-7*86400000).toISOString().split('T')[0];
    filtered = filtered.filter(a=>a.date>=wa);
  } else if(period==='monthly') {
    const ma = new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
    filtered = filtered.filter(a=>a.date>=ma);
  }

  filtered = filtered.slice().reverse();
  const tbody = document.getElementById('attendanceTableBody');
  if(!tbody) return;
  if(!filtered.length) {
    tbody.innerHTML='<tr><td colspan="6"><div class="empty"><div class="empty-icon">🕐</div><p>No records found</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(a=>{
    const hrs = a.hours ? parseFloat(a.hours) : null;
    const hrsLabel = hrs ? `${hrs.toFixed(2)}h` : (a.checkOut ? '—' : '<span style="color:var(--fire);">Active</span>');
    const statusLabel = a.checkOut ? `<span class="status confirmed">Complete</span>` : `<span class="status preparing">On Duty</span>`;
    return `<tr>
      <td>${a.date}</td>
      <td><b>${a.staffName||a.userId}</b></td>
      <td>${a.checkIn||'—'}</td>
      <td>${a.checkOut||'—'}</td>
      <td>${hrsLabel}</td>
      <td>${statusLabel}</td>
    </tr>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderAttendance:", _e); }
}

function exportAttendanceCSV() {
  try {
  const att = getAttendance();
  const rows = [['Date','Staff','Check In','Check Out','Hours']];
  att.forEach(a=>rows.push([a.date,a.staffName||a.userId,a.checkIn,a.checkOut||'',a.hours||'']));
  downloadCSV(rows,'attendance.csv');
  } catch(_e) { console.error("[SG] exportAttendanceCSV:", _e); }
}

// Show/hide new sidebar items — called after setupDashboard
function setupNewSidebarItems() {
  try {
  const isAdmin = currentUser?.role==='Admin';
  const showEl = (id,show) => { const el=document.getElementById(id); if(el) el.style.display=show?'flex':'none'; };
  showEl('siReports', isAdmin);
  showEl('siCoupons', isAdmin);
  showEl('siLoyalty', isAdmin);
  showEl('siAttendance', true);
  showEl('siEmpPerf', true);
  showEl('siTaskHistory', true);
  showEl('siTaskLoad', isAdmin);
  } catch(_e) { console.error("[SG] setupNewSidebarItems:", _e); }
}

function migrateStaffPermissions() {
  try {
    const staffList = JSON.parse(localStorage.getItem('sg_staff') || '[]');
    let changed = false;

    const migrationRules = [
      { hasAny: ['Menu - Edit Timing'], addIfMissing: 'Menu - Edit Available Days' },
      { hasAll: ['Menu - Edit Dish Name', 'Menu - Edit Price'], addIfMissing: 'Menu - Edit Available Days' },
    ];

    staffList.forEach(s => {
      if(!s.perms) return;
      migrationRules.forEach(rule => {
        if(s.perms.includes(rule.addIfMissing)) return;
        let shouldAdd = false;
        if(rule.hasAny) {
          shouldAdd = rule.hasAny.some(p => s.perms.includes(p));
        } else if(rule.hasAll) {
          shouldAdd = rule.hasAll.every(p => s.perms.includes(p));
        }
        if(shouldAdd) {
          const timingIdx = s.perms.indexOf('Menu - Edit Timing');
          if(timingIdx >= 0) {
            s.perms.splice(timingIdx + 1, 0, rule.addIfMissing);
          } else {
            s.perms.push(rule.addIfMissing);
          }
          changed = true;
        }
      });
    });

    if(changed) {
      localStorage.setItem('sg_staff', JSON.stringify(staffList)); sbSaveAllStaff(staff.length?staff:JSON.parse(localStorage.getItem('sg_staff')||'[]')).catch(()=>{});
    }
  } catch(e) {
    console.warn('Staff migration error:', e);
  }
}

// =============================================
// ===== ORDER DISTRIBUTION & WORKFLOW SYSTEM =====
// =============================================

// ── DATA HELPERS ──
// getDeliveryBoys/setDeliveryBoys/getOrderAssignments/setOrderAssignments defined above with Supabase sync
function getNotifications() { return (_settingsCache['sg_notifications'])||[]; }
function addNotification(msg, type='info', forUser=null) {
  try {
  const notifs = getNotifications();
  notifs.unshift({ id:'N'+Date.now(), msg, type, forUser, time: new Date().toLocaleString('en-IN'), read:false });
  const trimmed=notifs.slice(0,100); _settingsCache['sg_notifications']=trimmed; setSetting('sg_notifications',trimmed);
  renderNotifBadge();
  } catch(_e) { console.error("[SG] addNotification:", _e); }
}
function renderNotifBadge() {
  try {
  const unread = getNotifications().filter(n=>!n.read && (!n.forUser || n.forUser===currentUser?.username)).length;
  const badge = document.getElementById('notifBadge');
  if(badge) { badge.textContent=unread; badge.style.display=unread>0?'flex':'none'; }
  } catch(_e) { console.error("[SG] renderNotifBadge:", _e); }
}
function getCooks() {
  try {
  const s = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  return s.filter(x => x.role && ((x.role||'').toLowerCase().includes('cook') || (x.role||'').toLowerCase().includes('kitchen') || (x.role||'').toLowerCase().includes('chef')));
  } catch(_e) { console.error("[SG] getCooks:", _e); }
}
function isManager(user) {
  try {
  if(!user) return false;
  if(user.role==='Admin') return true;
  return user.role && ((user.role||'').toLowerCase().includes('manager') || user.perms?.includes('Orders - Assign'));
  } catch(_e) { console.error("[SG] isManager:", _e); }
}
function isAuthorizedEmployee(user) {
  try {
  if(!user) return false;
  if(isManager(user)) return true;
  return user.perms?.includes('Orders - Assign') || user.perms?.includes('Orders - Delivery Assign');
  } catch(_e) { console.error("[SG] isAuthorizedEmployee:", _e); }
}

// ── EQUAL DISTRIBUTION (Round Robin) ──
function distributeOrdersEqually(orderIds, assigneeIds) {
  try {
  if(!assigneeIds.length) return {};
  const result = {};
  assigneeIds.forEach(id => result[id] = []);
  const counts = Object.fromEntries(assigneeIds.map(id=>[id,0]));
  orderIds.forEach((oid, i) => {
    // Sort by count ascending for equal distribution
    const sorted = [...assigneeIds].sort((a,b)=>counts[a]-counts[b]);
    const chosen = sorted[0];
    result[chosen].push(oid);
    counts[chosen]++;
  });
  return result;
  } catch(_e) { console.error("[SG] distributeOrdersEqually:", _e); }
}

// Example: 13 orders + 4 cooks → [4,3,3,3] (round robin extra)
function getDistributionPreview(total, slots) {
  try {
  if(!slots) return [];
  const base = Math.floor(total/slots);
  const extra = total % slots;
  return Array.from({length:slots}, (_,i) => base + (i < extra ? 1 : 0));
  } catch(_e) { console.error("[SG] getDistributionPreview:", _e); }
}

// ── COOK AUTO-ASSIGN ──
function autoAssignCookToOrder(orderId) {
  try {
  const allOrders = orders; // from Supabase in-memory
  const assignments = getOrderAssignments();
  const cooks = getCooks();
  if(!cooks.length) return null; // No cooks available

  // Count current assignments per cook
  const counts = Object.fromEntries(cooks.map(c=>[c.id, 0]));
  Object.values(assignments).forEach(a => {
    if(a.cookId && counts[a.cookId] !== undefined) counts[a.cookId]++;
  });

  // Pick cook with fewest assignments (equal distribution)
  const sorted = [...cooks].sort((a,b)=>counts[a.id]-counts[b.id]);
  const cook = sorted[0];

  if(!assignments[orderId]) assignments[orderId] = {};
  assignments[orderId].cookId = cook.id;
  assignments[orderId].cookName = cook.name;
  assignments[orderId].cookAssignedAt = new Date().toLocaleString('en-IN');
  setOrderAssignments(assignments);

  addNotification(`📋 Order #${orderId} assigned to Cook: ${cook.name}`, 'assign', cook.username);
  return cook;
  } catch(_e) { console.error("[SG] autoAssignCookToOrder:", _e); }
}

// ── MANAGER: DISTRIBUTE MULTIPLE ORDERS TO EMPLOYEES ──
function openDistributeOrdersModal() {
  try {
  if(!isManager(currentUser)) { showToast('Only Manager can distribute orders 🔒','error'); return; }
  const allOrders = orders; // from Supabase in-memory
  const pending = allOrders.filter(o=>o.status==='Pending'||o.status==='Confirmed');
  const cooks = getCooks();
  const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');

  let html = `<div style="margin-bottom:12px;background:#fff3e0;border-radius:10px;padding:12px;font-size:0.85rem;color:#e65100;">
    <b>📋 Equal Distribution — Round Robin Logic</b><br>
    Manager can distribute multiple orders to cooks/employees. Employees cannot reject.
  </div>`;

  if(!pending.length) { showToast('No pending orders to distribute','error'); return; }

  html += `<div style="margin-bottom:10px;">
    <label style="font-weight:700;font-size:0.88rem;">Select Orders to Distribute</label>
    <div id="distOrderList" style="max-height:160px;overflow-y:auto;border:1px solid #e8d5c8;border-radius:8px;padding:8px;margin-top:6px;">
    ${pending.map(o=>`<label style="display:flex;align-items:center;gap:8px;padding:5px;cursor:pointer;">
      <input type="checkbox" value="${o.id}" class="dist-order-cb">
      <span><b>#${o.id}</b> — ${escHtml(o.name)} — ${o.type} <span style="font-size:0.72rem;background:#f0f0f0;padding:1px 7px;border-radius:8px;font-weight:700;">${o.status}</span></span>
    </label>`).join('')}
    </div>
  </div>`;

  const employees = [...cooks, ...staffList.filter(s=>!cooks.find(c=>c.id===s.id))];
  html += `<div style="margin-bottom:10px;">
    <label style="font-weight:700;font-size:0.88rem;">Select Employees to Assign</label>
    <div id="distEmpList" style="max-height:130px;overflow-y:auto;border:1px solid #e8d5c8;border-radius:8px;padding:8px;margin-top:6px;">
    ${employees.map(e=>`<label style="display:flex;align-items:center;gap:8px;padding:5px;cursor:pointer;">
      <input type="checkbox" value="${e.id}" data-name="${e.name}" class="dist-emp-cb">
      <span>${e.name} <span style="color:var(--muted);font-size:0.78rem;">(${e.role})</span></span>
    </label>`).join('')}
    </div>
  </div>`;

  html += `<div id="distPreview" style="background:#e8f5e9;border-radius:8px;padding:10px;font-size:0.82rem;margin-bottom:10px;display:none;"></div>`;

  const modal = document.createElement('div');
  modal.id = 'distributeModal';
  modal.className = 'modal-overlay open';
  modal.style.zIndex = '9999';
  modal.innerHTML = `<div class="modal" style="max-width:560px;max-height:85vh;overflow-y:auto;">
    <h3>📋 Distribute Orders</h3>
    ${html}
    <div class="modal-btns">
      <button class="btn-cancel" onclick="document.getElementById('distributeModal').remove()">Cancel</button>
      <button onclick="previewDistribution()" style="background:#1565c0;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;">👁️ Preview</button>
      <button class="btn-save" onclick="confirmDistributeOrders()">✅ Distribute</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openDistributeOrdersModal:", _e); }
}

function previewDistribution() {
  try {
  const orders = [...document.querySelectorAll('.dist-order-cb:checked')].map(cb=>cb.value);
  const emps = [...document.querySelectorAll('.dist-emp-cb:checked')];
  if(!orders.length||!emps.length) { showToast('Select at least 1 order and 1 employee','error'); return; }
  const dist = getDistributionPreview(orders.length, emps.length);
  const prev = document.getElementById('distPreview');
  if(prev) {
    prev.style.display='block';
    prev.innerHTML = `<b>Distribution Preview: ${orders.length} orders → ${emps.length} employees</b><br>
    ${emps.map((e,i)=>`${e.getAttribute('data-name')}: <b>${dist[i]} orders</b>`).join(' | ')}`;
  }
  } catch(_e) { console.error("[SG] previewDistribution:", _e); }
}

function confirmDistributeOrders() {
  try {
  const orderIds = [...document.querySelectorAll('.dist-order-cb:checked')].map(cb=>cb.value);
  const empEls = [...document.querySelectorAll('.dist-emp-cb:checked')];
  if(!orderIds.length||!empEls.length) { showToast('Select orders and employees','error'); return; }

  const empIds = empEls.map(e=>e.value);
  const empMap = Object.fromEntries(empEls.map(e=>[e.value, e.getAttribute('data-name')]));
  const distribution = distributeOrdersEqually(orderIds, empIds);
  const assignments = getOrderAssignments();
  const allOrders = orders; // from Supabase in-memory

  Object.entries(distribution).forEach(([empId, oids]) => {
    const empName = empMap[empId];
    const empStaff = JSON.parse(localStorage.getItem('sg_staff')||'[]').find(s=>s.id===empId);
    oids.forEach(oid => {
      if(!assignments[oid]) assignments[oid] = {};
      assignments[oid].assignedTo = empId;
      assignments[oid].assignedName = empName;
      assignments[oid].assignedAt = new Date().toLocaleString('en-IN');
      assignments[oid].assignedBy = currentUser?.name;
      addNotification(`📋 Order #${oid} assigned to you by ${currentUser?.name}`, 'assign', empStaff?.username);
    });
  });
  setOrderAssignments(assignments);
  document.getElementById('distributeModal')?.remove();
  renderOrders();
  showToast(`✅ ${orderIds.length} orders distributed to ${empIds.length} employees!`);
  } catch(_e) { console.error("[SG] confirmDistributeOrders:", _e); }
}

// ── COOK READY → REASSIGN ──
function openCookReassignModal(orderId) {
  try {
  const o = orders.find(x=>x.id===orderId);
  if(!o) return;
  const assignments = getOrderAssignments();
  const assignment = assignments[orderId]||{};
  const isCook = currentUser && getCooks().find(c=>c.username===currentUser.username);
  if(!isCook && currentUser?.role!=='Admin') { showToast('Only cook can reassign from kitchen','error'); return; }

  const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  let targets = [];
  if(o.type==='Home Delivery') {
    // Counter Manager / Parcel Manager / Authorized Employee
    targets = staffList.filter(s => isAuthorizedEmployee({role:s.role, perms:s.perms}));
  } else if(o.type==='Takeaway') {
    targets = staffList.filter(s => isAuthorizedEmployee({role:s.role, perms:s.perms}));
  } else if(o.type==='Dine-In' || o.type==='Walk-In') {
    // Reassign to Waiter
    targets = staffList.filter(s => s.role && (s.role||'').toLowerCase().includes('waiter'));
    if(!targets.length) targets = staffList.filter(s => s.perms?.includes('Status - Delivered'));
  }
  if(!targets.length) targets = staffList;

  const modal = document.createElement('div');
  modal.id = 'cookReassignModal';
  modal.className = 'modal-overlay open';
  modal.style.zIndex = '9999';
  modal.innerHTML = `<div class="modal" style="max-width:440px;">
    <h3>👨‍🍳 Order #${orderId} Ready — Reassign</h3>
    <div style="background:#e8f5e9;border-radius:8px;padding:10px;margin-bottom:14px;font-size:0.85rem;">
      ✅ Food is ready! Assign to next responsible person.
      <div style="margin-top:4px;color:var(--muted);font-size:0.78rem;">A timestamp will be recorded.</div>
    </div>
    <div class="form-group">
      <label>Assign To</label>
      <select id="cookReassignTarget" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
        <option value="">-- Select Employee --</option>
        ${targets.map(t=>`<option value="${t.id}" data-name="${t.name}">${t.name} (${t.role})</option>`).join('')}
      </select>
    </div>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="document.getElementById('cookReassignModal').remove()">Cancel</button>
      <button class="btn-save" onclick="confirmCookReassign('${orderId}')">✅ Reassign</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openCookReassignModal:", _e); }
}

function confirmCookReassign(orderId) {
  try {
  const sel = document.getElementById('cookReassignTarget');
  if(!sel||!sel.value) { showToast('Select an employee','error'); return; }
  const empId = sel.value;
  const empName = sel.options[sel.selectedIndex].getAttribute('data-name');
  const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  const emp = staffList.find(s=>s.id===empId);

  const assignments = getOrderAssignments();
  if(!assignments[orderId]) assignments[orderId] = {};
  assignments[orderId].cookReadyAt = new Date().toLocaleString('en-IN');
  assignments[orderId].handedTo = empId;
  assignments[orderId].handedToName = empName;
  setOrderAssignments(assignments);

  // Update order status to Ready
  const o = orders.find(x=>x.id===orderId);
  if(o) { o.status='Ready'; o.cookReadyAt=new Date().toLocaleString('en-IN'); sbUpdateOrder(orderId, {status:'Ready', cookReadyAt:o.cookReadyAt}).catch(e=>console.error('Cook ready update failed:',e)); }

  addNotification(`🍳 Order #${orderId} is Ready — Assigned to you (${empName})`, 'assign', emp?.username);
  document.getElementById('cookReassignModal')?.remove();
  renderOrders();
  showToast(`✅ Order #${orderId} handed to ${empName}, status → Ready`);
  } catch(_e) { console.error("[SG] confirmCookReassign:", _e); }
}

// ── DELIVERY BOY MANAGEMENT ──
const DB_STATUS_LABELS = { free:'🟢 Free', on_delivery:'🚴 On Delivery', returning:'🔄 Returning', offline:'📴 Offline' };

function renderDeliveryBoys() {
  try {
  const boys = getDeliveryBoys();
  const div = document.getElementById('deliveryBoysGrid');
  if(!div) return;
  if(!boys.length) {
    div.innerHTML='<div class="empty"><div class="empty-icon">🚴</div><p>No delivery boys added yet</p></div>';
    return;
  }
  const assignments = getOrderAssignments();
  div.innerHTML = boys.map(b => {
    const taskCount = Object.values(assignments).filter(a=>a.deliveryBoyId===b.id && a.deliveryStatus!=='delivered').length;
    return `<div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 10px rgba(0,0,0,0.07);display:flex;align-items:center;gap:12px;">
      <div style="width:44px;height:44px;border-radius:50%;background:${b.status==='free'?'#4caf50':b.status==='on_delivery'?'#ff9800':b.status==='returning'?'#2196f3':'#9e9e9e'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;font-weight:800;">${b.name.charAt(0)}</div>
      <div style="flex:1;">
        <div style="font-weight:700;">${b.name}</div>
        <div style="font-size:0.78rem;color:var(--muted);">${b.mobile||''}</div>
        <div style="font-size:0.82rem;margin-top:2px;">${DB_STATUS_LABELS[b.status]||'🟢 Free'} <span style="color:var(--muted);font-size:0.75rem;">· ${taskCount}/5 tasks</span></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${(isManager(currentUser)||isAuthorizedEmployee(currentUser)) ? `
        <select onchange="updateDeliveryBoyStatus('${b.id}',this.value)" style="font-size:0.78rem;padding:4px 8px;border:2px solid #e8d5c8;border-radius:6px;cursor:pointer;" title="Change Status">
          ${Object.entries(DB_STATUS_LABELS).map(([k,v])=>`<option value="${k}" ${b.status===k?'selected':''}>${v}</option>`).join('')}
        </select>
        <button onclick="deleteDeliveryBoy('${b.id}')" style="background:#fce4ec;color:#c62828;border:none;padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:700;cursor:pointer;">🗑️ Remove</button>` : ''}
      </div>
    </div>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderDeliveryBoys:", _e); }
}

function updateDeliveryBoyStatus(boyId, status) {
  try {
  if(!isManager(currentUser)&&!isAuthorizedEmployee(currentUser)) { showToast('No permission','error'); return; }
  const boys = getDeliveryBoys();
  const b = boys.find(x=>x.id===boyId);
  if(b) { b.status=status; b.statusUpdatedAt=new Date().toLocaleString('en-IN'); }
  setDeliveryBoys(boys);
  renderDeliveryBoys();
  showToast(`✅ ${b?.name} → ${DB_STATUS_LABELS[status]}`);
  } catch(_e) { console.error("[SG] updateDeliveryBoyStatus:", _e); }
}

function openAddDeliveryBoyModal() {
  try {
  if(!isManager(currentUser)) { showToast('Only Manager can add delivery boys','error'); return; }
  const modal = document.createElement('div');
  modal.id = 'addDbModal';
  modal.className = 'modal-overlay open';
  modal.style.zIndex='9999';
  modal.innerHTML = `<div class="modal" style="max-width:400px;">
    <h3>🚴 Add Delivery Boy</h3>
    <div class="form-group"><label>Name *</label><input type="text" id="dbName" class="form-input" placeholder="Full name"></div>
    <div class="form-group"><label>Mobile *</label><input type="tel" id="dbMobile" class="form-input" placeholder="10-digit mobile"></div>
    <div class="form-group"><label>Area / Zone</label><input type="text" id="dbArea" class="form-input" placeholder="Delivery area"></div>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="document.getElementById('addDbModal').remove()">Cancel</button>
      <button class="btn-save" onclick="saveDeliveryBoy()">✅ Add</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openAddDeliveryBoyModal:", _e); }
}

function saveDeliveryBoy() {
  try {
  const name=document.getElementById('dbName')?.value.trim();
  const mobile=document.getElementById('dbMobile')?.value.trim();
  const area=document.getElementById('dbArea')?.value.trim();
  if(!name||!mobile) { showToast('Name and mobile required','error'); return; }
  const boys = getDeliveryBoys();
  boys.push({ id:'DB'+Date.now(), name, mobile, area, status:'free', addedBy:currentUser?.name, addedAt:new Date().toLocaleString('en-IN') });
  setDeliveryBoys(boys);
  document.getElementById('addDbModal')?.remove();
  renderDeliveryBoys();
  showToast('✅ Delivery boy added: '+name);
  } catch(_e) { console.error("[SG] saveDeliveryBoy:", _e); }
}

function deleteDeliveryBoy(id) {
  try {
  if(!confirm('Remove this delivery boy?')) return;
  setDeliveryBoys(getDeliveryBoys().filter(b=>b.id!==id));
  renderDeliveryBoys();
  showToast('Delivery boy removed');
  } catch(_e) { console.error("[SG] deleteDeliveryBoy:", _e); }
}

// ── AUTO-ASSIGN DELIVERY BOY (radius expansion) ──
function autoAssignDeliveryBoy(orderId) {
  try {
  if(!isAuthorizedEmployee(currentUser)) { showToast('No permission to assign delivery','error'); return; }
  const boys = getDeliveryBoys();
  const assignments = getOrderAssignments();
  const radiusSteps = [50,100,200,300,400,500];

  // Filter by availability and max 5 tasks
  const available = boys.filter(b => {
    if(b.status==='offline') return false;
    const tasks = Object.values(assignments).filter(a=>a.deliveryBoyId===b.id && a.deliveryStatus!=='delivered').length;
    return tasks < 5;
  });

  // Free boys first, then returning
  let chosen = available.find(b=>b.status==='free') || available.find(b=>b.status==='returning');

  if(!chosen && boys.length) {
    // All busy — pick returning boy with fewest tasks
    const returning = boys.filter(b=>b.status==='returning');
    if(returning.length) {
      chosen = returning.sort((a,b) => {
        const ta = Object.values(assignments).filter(x=>x.deliveryBoyId===a.id).length;
        const tb = Object.values(assignments).filter(x=>x.deliveryBoyId===b.id).length;
        return ta-tb;
      })[0];
    }
  }

  if(!chosen) { showToast('No delivery boy available currently','error'); return; }

  if(!assignments[orderId]) assignments[orderId]={};
  assignments[orderId].deliveryBoyId = chosen.id;
  assignments[orderId].deliveryBoyName = chosen.name;
  assignments[orderId].deliveryAssignedAt = new Date().toLocaleString('en-IN');
  assignments[orderId].deliveryAssignedBy = currentUser?.name;
  setOrderAssignments(assignments);

  // Mark boy as on_delivery
  const updatedBoys = getDeliveryBoys();
  const boy = updatedBoys.find(b=>b.id===chosen.id);
  if(boy) boy.status='on_delivery';
  setDeliveryBoys(updatedBoys);

  addNotification(`🚴 You have been assigned Order #${orderId} for delivery`, 'delivery', chosen.username||chosen.id);
  renderDeliveryBoys();
  renderOrders();
  showToast(`✅ Order #${orderId} auto-assigned to ${chosen.name}`);
  } catch(_e) { console.error("[SG] autoAssignDeliveryBoy:", _e); }
}

function openManualDeliveryAssign(orderId) {
  try {
  if(!isAuthorizedEmployee(currentUser)) { showToast('No permission','error'); return; }
  const boys = getDeliveryBoys();
  const assignments = getOrderAssignments();
  const modal = document.createElement('div');
  modal.id = 'manualDbModal';
  modal.className = 'modal-overlay open';
  modal.style.zIndex = '9999';
  modal.innerHTML = `<div class="modal" style="max-width:440px;">
    <h3>🚴 Assign Delivery Boy — Order #${orderId}</h3>
    <div style="margin-bottom:14px;display:flex;gap:8px;">
      <button onclick="autoAssignDeliveryBoy('${orderId}');document.getElementById('manualDbModal').remove();"
        style="flex:1;padding:10px;background:#27ae60;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
        ⚡ Auto Assign
      </button>
    </div>
    <div class="form-group">
      <label>Manual Selection</label>
      <select id="manualDbSelect" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
        <option value="">-- Select Delivery Boy --</option>
        ${boys.map(b=>{
          const tasks=Object.values(assignments).filter(a=>a.deliveryBoyId===b.id&&a.deliveryStatus!=='delivered').length;
          const avail=b.status!=='offline'&&tasks<5;
          return `<option value="${b.id}" data-name="${b.name}" ${!avail?'disabled':''}>
            ${DB_STATUS_LABELS[b.status]||'🟢'} ${b.name} — ${tasks}/5 tasks ${!avail?'(Unavailable)':''}
          </option>`;
        }).join('')}
      </select>
    </div>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="document.getElementById('manualDbModal').remove()">Cancel</button>
      <button class="btn-save" onclick="confirmManualDeliveryAssign('${orderId}')">✅ Assign</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openManualDeliveryAssign:", _e); }
}

function confirmManualDeliveryAssign(orderId) {
  try {
  const sel = document.getElementById('manualDbSelect');
  if(!sel||!sel.value) { showToast('Select a delivery boy','error'); return; }
  const boyId = sel.value;
  const boyName = sel.options[sel.selectedIndex].getAttribute('data-name');
  const assignments = getOrderAssignments();
  if(!assignments[orderId]) assignments[orderId]={};
  assignments[orderId].deliveryBoyId = boyId;
  assignments[orderId].deliveryBoyName = boyName;
  assignments[orderId].deliveryAssignedAt = new Date().toLocaleString('en-IN');
  assignments[orderId].deliveryAssignedBy = currentUser?.name;
  setOrderAssignments(assignments);
  const boys = getDeliveryBoys();
  const boy = boys.find(b=>b.id===boyId);
  if(boy) boy.status='on_delivery';
  setDeliveryBoys(boys);
  addNotification(`🚴 Order #${orderId} assigned to you for delivery`, 'delivery', boy?.username||boyId);
  document.getElementById('manualDbModal')?.remove();
  renderDeliveryBoys();
  renderOrders();
  showToast(`✅ Order #${orderId} assigned to ${boyName}`);
  } catch(_e) { console.error("[SG] confirmManualDeliveryAssign:", _e); }
}

// ── EMPLOYEE A → EMPLOYEE B REASSIGNMENT ──
function openReassignOrderModal(orderId) {
  try {
  const isMgr = isManager(currentUser);
  const isAuth = isAuthorizedEmployee(currentUser);
  if(!isMgr && !isAuth) { showToast('No permission to reassign','error'); return; }
  const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  const assignments = getOrderAssignments();
  const current = assignments[orderId]||{};

  const modal = document.createElement('div');
  modal.id = 'reassignModal';
  modal.className = 'modal-overlay open';
  modal.style.zIndex='9999';
  modal.innerHTML = `<div class="modal" style="max-width:440px;">
    <h3>🔄 Reassign Order #${orderId}</h3>
    <div style="background:#fff3e0;border-radius:8px;padding:10px;margin-bottom:14px;font-size:0.83rem;color:#e65100;">
      ${current.assignedName ? `Currently assigned to: <b>${current.assignedName}</b><br>` : ''}
      Employee B has <b>10 minutes</b> to accept/reject. Auto-approved after 10 min.
    </div>
    <div class="form-group">
      <label>Reassign To</label>
      <select id="reassignTarget" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
        <option value="">-- Select Employee --</option>
        ${staffList.filter(s=>s.id!==current.assignedTo).map(s=>`
          <option value="${s.id}" data-name="${escHtml(s.name)}">${escHtml(s.name)} (${s.role})</option>`).join('')}
      </select>
    </div>
    <div class="modal-btns">
      <button class="btn-cancel" onclick="document.getElementById('reassignModal').remove()">Cancel</button>
      <button class="btn-save" onclick="confirmReassignOrder('${orderId}')">✅ Reassign</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openReassignOrderModal:", _e); }
}

function confirmReassignOrder(orderId) {
  try {
  const sel = document.getElementById('reassignTarget');
  if(!sel||!sel.value) { showToast('Select an employee','error'); return; }
  const empId = sel.value;
  const empName = sel.options[sel.selectedIndex].getAttribute('data-name');
  const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  const emp = staffList.find(s=>s.id===empId);
  const assignments = getOrderAssignments();
  if(!assignments[orderId]) assignments[orderId]={};

  // Set pending reassign
  assignments[orderId].pendingReassignTo = empId;
  assignments[orderId].pendingReassignName = empName;
  assignments[orderId].pendingReassignAt = Date.now();
  assignments[orderId].pendingReassignBy = currentUser?.name;
  assignments[orderId].reassignStatus = 'pending';
  setOrderAssignments(assignments);

  // Auto-approve after 10 minutes
  setTimeout(() => {
    const a = getOrderAssignments();
    if(a[orderId]?.reassignStatus==='pending') {
      a[orderId].assignedTo = a[orderId].pendingReassignTo;
      a[orderId].assignedName = a[orderId].pendingReassignName;
      a[orderId].reassignStatus = 'auto_approved';
      a[orderId].autoApprovedAt = new Date().toLocaleString('en-IN');
      setOrderAssignments(a);
      addNotification(`⏰ Order #${orderId} auto-approved → ${empName}`, 'auto_approve', emp?.username);
      addNotification(`⏰ Order #${orderId} auto-approved to ${empName}`, 'auto_approve', assignments[orderId]?.pendingReassignBy);
      renderOrders();
    }
  }, 10*60*1000); // 10 minutes

  addNotification(`🔄 Order #${orderId} reassignment pending — Accept or Reject within 10 min`, 'reassign', emp?.username);
  document.getElementById('reassignModal')?.remove();
  renderOrders();
  showToast(`🔄 Reassignment sent to ${empName} — 10 min window`);
  } catch(_e) { console.error("[SG] confirmReassignOrder:", _e); }
}

function respondToReassign(orderId, accept) {
  try {
  const assignments = getOrderAssignments();
  const a = assignments[orderId];
  if(!a || a.reassignStatus!=='pending') { showToast('No pending reassignment','error'); return; }
  if(a.pendingReassignTo !== currentUser?.perms && currentUser?.username) {
    // Check if current user is the target
    const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
    const me = staffList.find(s=>s.username===currentUser?.username);
    if(me?.id !== a.pendingReassignTo) { showToast('This reassignment is not for you','error'); return; }
  }
  if(accept) {
    a.assignedTo = a.pendingReassignTo;
    a.assignedName = a.pendingReassignName;
    a.reassignStatus = 'accepted';
    a.acceptedAt = new Date().toLocaleString('en-IN');
    addNotification(`✅ ${a.pendingReassignName} accepted Order #${orderId}`, 'accept', a.pendingReassignBy);
  } else {
    a.reassignStatus = 'rejected';
    a.rejectedAt = new Date().toLocaleString('en-IN');
    addNotification(`❌ ${a.pendingReassignName} rejected Order #${orderId} — Please reassign`, 'reject', a.pendingReassignBy);
    showToast(`❌ Reassignment rejected — Manager escalation needed`);
  }
  setOrderAssignments(assignments);
  renderOrders();
  showToast(accept ? `✅ Order #${orderId} accepted!` : `❌ Order #${orderId} rejected`);
  } catch(_e) { console.error("[SG] respondToReassign:", _e); }
}

// ── MANAGER ABSENCE: DELEGATE AUTHORITY ──
function openDelegateAuthorityModal() {
  try {
  if(currentUser?.role!=='Admin' && !isManager(currentUser)) { showToast('Only Manager can delegate authority','error'); return; }
  const staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
  const delegations = JSON.parse(localStorage.getItem('sg_delegations')||'[]');
  const today = new Date().toISOString().split('T')[0];

  const modal = document.createElement('div');
  modal.id = 'delegateModal';
  modal.className = 'modal-overlay open';
  modal.style.zIndex = '9999';
  modal.innerHTML = `<div class="modal" style="max-width:500px;">
    <h3>👑 Delegate Manager Authority</h3>
    <div style="background:#e3f2fd;border-radius:8px;padding:10px;margin-bottom:14px;font-size:0.83rem;color:#1565c0;">
      When you're absent, delegate your authority to an employee. Authority ends only when you manually remove it.
    </div>
    <div class="form-group">
      <label>Delegate To *</label>
      <select id="delegateEmpSel" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
        <option value="">-- Select Employee --</option>
        ${staffList.map(s=>`<option value="${s.id}" data-name="${escHtml(s.name)}">${escHtml(s.name)} (${s.role})</option>`).join('')}
      </select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="form-group"><label>From Date *</label><input type="date" id="delegateFrom" class="form-input" value="${today}"></div>
      <div class="form-group"><label>Until (optional)</label><input type="date" id="delegateTo" class="form-input"></div>
    </div>
    <div class="form-group"><label>Reason</label><input type="text" id="delegateReason" class="form-input" placeholder="Planned leave / Emergency..."></div>
    
    ${delegations.length ? `<div style="margin-top:12px;"><b style="font-size:0.85rem;">Active Delegations:</b>
    ${delegations.filter(d=>!d.removedAt).map(d=>`
      <div style="background:#fff8e1;border-radius:8px;padding:8px 12px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;font-size:0.83rem;">
        <span>👑 <b>${d.empName}</b> — from ${d.from}${d.to?' to '+d.to:' (until removed)'}</span>
        <button onclick="removeDelegate('${d.id}')" style="background:#fce4ec;color:#c62828;border:none;padding:3px 8px;border-radius:6px;font-size:0.75rem;cursor:pointer;">Remove</button>
      </div>`).join('')}
    </div>` : ''}

    <div class="modal-btns">
      <button class="btn-cancel" onclick="document.getElementById('delegateModal').remove()">Close</button>
      <button class="btn-save" onclick="saveDelegate()">✅ Delegate Authority</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openDelegateAuthorityModal:", _e); }
}

function saveDelegate() {
  try {
  const sel = document.getElementById('delegateEmpSel');
  if(!sel||!sel.value) { showToast('Select an employee','error'); return; }
  const empId = sel.value;
  const empName = sel.options[sel.selectedIndex].getAttribute('data-name');
  const from = document.getElementById('delegateFrom')?.value;
  const to = document.getElementById('delegateTo')?.value;
  const reason = document.getElementById('delegateReason')?.value.trim();
  if(!from) { showToast('Start date required','error'); return; }

  const delegations = JSON.parse(localStorage.getItem('sg_delegations')||'[]');
  delegations.push({ id:'D'+Date.now(), empId, empName, from, to, reason, delegatedBy:currentUser?.name, delegatedAt:new Date().toLocaleString('en-IN') });
  _sbSync('sg_delegations', delegations);
  addNotification(`👑 Manager authority delegated to you by ${currentUser?.name}`, 'delegate', empName);
  document.getElementById('delegateModal')?.remove();
  showToast(`✅ Authority delegated to ${empName}`);
  } catch(_e) { console.error("[SG] saveDelegate:", _e); }
}

function removeDelegate(delegId) {
  try {
  const delegations = JSON.parse(localStorage.getItem('sg_delegations')||'[]');
  const d = delegations.find(x=>x.id===delegId);
  if(d) { d.removedAt=new Date().toLocaleString('en-IN'); d.removedBy=currentUser?.name; }
  _sbSync('sg_delegations', delegations);
  document.getElementById('delegateModal')?.remove();
  openDelegateAuthorityModal();
  showToast('Delegation removed');
  } catch(_e) { console.error("[SG] removeDelegate:", _e); }
}

// ── CUSTOMER ORDER TRACKING (type-based status) ──
function getOrderStatusSteps(orderType) {
  try {
  if(orderType==='Home Delivery') return ['Pending','Confirmed','Preparing','Ready','Delivered'];
  if(orderType==='Takeaway') return ['Pending','Confirmed','Preparing','Ready','Collected'];
  if(orderType==='Dine-In') return ['Pending','Confirmed','Preparing','Ready','Served'];
  if(orderType==='Walk-In') return ['Pending','Confirmed','Preparing','Ready','Served'];
  return ['Pending','Confirmed','Preparing','Ready','Delivered'];
  } catch(_e) { console.error("[SG] getOrderStatusSteps:", _e); }
}

function getDeliveryBoyForOrder(orderId) {
  try {
  const assignments = getOrderAssignments();
  const a = assignments[orderId];
  if(!a||!a.deliveryBoyId) return null;
  return getDeliveryBoys().find(b=>b.id===a.deliveryBoyId)||null;
  } catch(_e) { console.error("[SG] getDeliveryBoyForOrder:", _e); }
}

// ── NOTIFICATIONS PANEL ──
function openNotificationsPanel() {
  try {
  const notifs = getNotifications().filter(n=>!n.forUser || n.forUser===currentUser?.username);
  // Mark all as read
  const all = getNotifications();
  all.forEach(n=>{if(!n.forUser||n.forUser===currentUser?.username) n.read=true;});
  _settingsCache['sg_notifications']=all; setSetting('sg_notifications',all);
  renderNotifBadge();

  const iconMap = {assign:'📋',delivery:'🚴',reassign:'🔄',auto_approve:'⏰',accept:'✅',reject:'❌',delegate:'👑',info:'🔔'};

  const modal = document.createElement('div');
  modal.id = 'notifPanel';
  modal.className = 'modal-overlay open';
  modal.style.zIndex='9999';
  modal.innerHTML = `<div class="modal" style="max-width:500px;max-height:80vh;overflow-y:auto;">
    <h3>🔔 Notifications</h3>
    ${notifs.length ? notifs.map(n=>`
      <div style="padding:10px 12px;border-radius:8px;background:#f9f7f5;margin-bottom:8px;border-left:3px solid var(--fire);">
        <div style="font-size:0.88rem;">${iconMap[n.type]||'🔔'} ${n.msg}</div>
        <div style="font-size:0.72rem;color:var(--muted);margin-top:4px;">${n.time}</div>
      </div>`).join('') : '<div class="empty"><div class="empty-icon">🔔</div><p>No notifications</p></div>'}
    <div class="modal-btns"><button class="btn-cancel" onclick="document.getElementById('notifPanel').remove()">Close</button></div>
  </div>`;
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openNotificationsPanel:", _e); }
}

// renderOrders now has assignment column built in directly

// ── INIT: hook auto-assign on order submission ──
const _origSubmitOrder = submitOrder;
// After order is saved, auto-assign to cook
const _sg_origSubmitOrder = window.submitOrder;
window._hookOrderAutoAssign = function(orderId) {
  autoAssignCookToOrder(orderId);
};

// Delivery Boys section already in HTML — no dynamic injection needed

// ── ADD ACTION BUTTONS TO ORDER ROWS ──
// patchOrderRowActions removed — actions now rendered directly in renderOrders rows

// patchOrderRowActions removed — actions rendered inline in renderOrders

// Bug #7 fix: yahan initNotifButton() thi jo navbar mein ek bell button + ek
// DOOSRA notifBadge span inject karti thi (duplicate id). Uska selector
// ('.admin-topbar, #adminPanel nav, #adminSite nav') kisi bhi element se match
// nahi karta (ye UI sidebar-based hai, koi topbar nahi), isliye woh button kabhi
// banta hi nahi tha — dead code + invalid duplicate id. Hata diya. Notification
// badge ab sirf Workflow Bar wala single static notifBadge span hai, jise
// renderNotifBadge() sahi update karta hai.

// Auto-hook submitOrder to assign cook after order creation
(function() {
  const origSubmit = window.submitOrder;
  if(origSubmit) {
    window.submitOrder = function() {
      origSubmit.apply(this, arguments);
      // Find latest order and assign cook
      setTimeout(()=>{
        if(orders.length) { const latest=orders[0]; if(latest) autoAssignCookToOrder(latest.id); }
      }, 200);
    };
  }
})();

// ══════════════════════════════════════════
//  MISSING FUNCTIONS — Bug Fix
// ══════════════════════════════════════════

// 1. Hold Bill (Table Management)
async function holdBill(tableId) {
  try {
  if(!tableId) return showToast('No table selected','error');
  const tableOrders = orders.filter(o => o.tableId === tableId && o.status !== 'Cancelled');
  if(!tableOrders.length) return showToast('No active orders for this table','error');
  tableOrders.forEach(async o => {
    o.status = 'Hold';
    await sbUpdateOrder(o.id, { status: 'Hold' });
  });
  showToast('⏸️ Bill put on hold for table ' + tableId);
  closeModal('tblActionModal');
  try { renderOrders(); } catch(e) {}
  } catch(_e) { console.error("[SG] holdBill:", _e); }
}

// 2. Save KDS Edit
async function saveKDSEdit() {
  try {
  const orderId = document.getElementById('kdsEditOrderId')?.value;
  if(!orderId) return showToast('No order selected','error');
  const note = document.getElementById('kdsEditNote')?.value || '';
  const itemEls = document.querySelectorAll('#kdsEditItems [data-item-id]');
  const order = orders.find(o => o.id === orderId);
  if(!order) return showToast('Order not found','error');
  // Update quantities
  itemEls.forEach(el => {
    const itemId = el.dataset.itemId;
    const qty = parseInt(el.querySelector('input')?.value) || 0;
    const item = (order.items || []).find(i => i.id == itemId || i.name == itemId);
    if(item) item.qty = qty;
  });
  order.note = note;
  order.items = (order.items || []).filter(i => (i.qty || 0) > 0);
  await sbUpdateOrder(orderId, { items: order.items, note });
  showToast('✅ Order updated');
  closeModal('kdsEditModal');
  try { loadKDS(); } catch(e) {}
  } catch(_e) { console.error("[SG] saveKDSEdit:", _e); }
}

// ============================================================
// Bug #4 fix — Staff Reject flow pehle adhoora tha:
// toggleRejectCustom undefined tha ("Other" select karne pe custom
// textarea kabhi nahi dikhta tha => reject deadlock), aur reject
// modal kholne wala function + renderPendingApprovals exist hi
// nahi karte the. Ab poora flow complete hai.
// ============================================================

// "Other" reason select karne pe custom textarea dikhao/chhupao
function toggleRejectCustom(val) {
  try {
    const div = document.getElementById('rejectCustomDiv');
    if(div) div.style.display = (val === 'Other') ? 'block' : 'none';
  } catch(_e) { console.error("[SG] toggleRejectCustom:", _e); }
}

// Reject modal kholo — staff select karke, fields reset karke
function openRejectStaffModal(staffId) {
  try {
    const s = staff.find(x => x.id === staffId);
    if(!s) return showToast('Staff not found','error');
    const idEl = document.getElementById('rejectStaffId');
    if(idEl) idEl.value = staffId;
    const infoEl = document.getElementById('rejectStaffInfo');
    if(infoEl) infoEl.innerHTML = '👤 <b>' + escHtml(s.name||'—') + '</b>' + (s.role ? ' — ' + escHtml(s.role) : '') + (s.mobile ? '<br>📱 ' + escHtml(s.mobile) : '');
    // Fields reset
    const sel = document.getElementById('rejectReason'); if(sel) sel.value = '';
    const cust = document.getElementById('rejectCustomReason'); if(cust) cust.value = '';
    const com = document.getElementById('rejectComment'); if(com) com.value = '';
    toggleRejectCustom('');
    document.getElementById('rejectStaffModal')?.classList.add('open');
  } catch(_e) { console.error("[SG] openRejectStaffModal:", _e); }
}

// Staff application approve karo
async function approveStaffApplication(staffId) {
  try {
    const idx = staff.findIndex(s => s.id === staffId);
    if(idx === -1) return showToast('Staff not found','error');
    staff[idx].status = 'active';
    staff[idx].rejectReason = '';
    localStorage.setItem('sg_staff', JSON.stringify(staff));
    try { await _supabase.from('staff').update({ status:'active', rejectReason:'' }).eq('id', staffId); } catch(e) {}
    showToast('✅ ' + (staff[idx].name||'Staff') + ' approved!');
    try { renderStaff(); } catch(e) {}
  } catch(_e) { console.error("[SG] approveStaffApplication:", _e); }
}

// Pending staff applications ka section (staffGrid ke upar)
function renderPendingApprovals() {
  try {
    const grid = document.getElementById('staffGrid');
    if(!grid) return;
    const isAdm = currentUser?.role === 'Admin';
    const canApprove = isAdm || currentUser?.perms?.includes('Staff - Approve/Reject');
    // Container banao agar nahi hai
    let box = document.getElementById('pendingApprovalsBox');
    if(!box) {
      box = document.createElement('div');
      box.id = 'pendingApprovalsBox';
      grid.parentElement.insertBefore(box, grid);
    }
    const pending = (staff||[]).filter(s => String(s.status||'').toLowerCase() === 'pending');
    if(!pending.length || !canApprove) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = 'block';
    box.innerHTML = '<div style="background:#fff8e1;border:2px solid #ffe082;border-radius:12px;padding:14px 16px;margin-bottom:16px;">' +
      '<div style="font-weight:800;color:#f57c00;margin-bottom:10px;">⏳ Pending Approvals (' + pending.length + ')</div>' +
      pending.map(s =>
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;background:#fff;border-radius:8px;padding:10px 12px;margin-bottom:6px;flex-wrap:wrap;">' +
          '<div style="font-size:0.85rem;"><b>' + escHtml(s.name||'—') + '</b>' + (s.role ? ' <span style="color:var(--muted);">— ' + escHtml(s.role) + '</span>' : '') + (s.mobile ? '<br><span style="font-size:0.75rem;color:var(--muted);">📱 ' + escHtml(s.mobile) + '</span>' : '') + '</div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button onclick="approveStaffApplication(\'' + s.id + '\')" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;padding:6px 14px;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:700;">✅ Approve</button>' +
            '<button onclick="openRejectStaffModal(\'' + s.id + '\')" style="background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;padding:6px 14px;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:700;">❌ Reject</button>' +
          '</div>' +
        '</div>').join('') +
      '</div>';
  } catch(_e) { console.error("[SG] renderPendingApprovals:", _e); }
}

// 3. Confirm Reject Staff
async function confirmRejectStaff() {
  try {
  const staffId = document.getElementById('rejectStaffId')?.value;
  const reasonSelect = document.getElementById('rejectReason');
  const customReason = document.getElementById('rejectCustomReason')?.value?.trim();
  const comment = document.getElementById('rejectComment')?.value?.trim();
  if(!staffId) return showToast('No staff selected','error');
  const reason = (reasonSelect?.value === 'Other' ? customReason : reasonSelect?.value) || 'Rejected by admin';
  if(reasonSelect?.value === 'Other' && !customReason) return showToast('Please enter a reason','error');
  const idx = staff.findIndex(s => s.id === staffId);
  if(idx !== -1) {
    staff[idx].status = 'Rejected';
    staff[idx].rejectReason = reason + (comment ? ' — ' + comment : '');
    localStorage.setItem('sg_staff', JSON.stringify(staff));
    try { await _supabase.from('staff').update({ status:'Rejected', rejectReason: staff[idx].rejectReason }).eq('id', staffId); } catch(e) {}
  }
  showToast('❌ Staff application rejected');
  closeModal('rejectStaffModal');
  try { renderStaff(); } catch(e) {}
  } catch(_e) { console.error("[SG] confirmRejectStaff:", _e); }
}

// 4. Apply Small Role Template (in Add Staff modal)
// ============================================================
// Bug #5 fix — Template dropdown values string IDs hain
// ('manager', 'cashier', 'custom_ct_123'...) lekin:
//   (a) onSmallRoleTemplateChange (description dikhane wala) undefined tha
//   (b) applySmallRoleTemplate parseInt('manager')=NaN karta tha => Apply
//       button bhi silently kuch nahi karta tha
// Ab resolver teeno value types handle karta hai: builtin id,
// custom_ id, aur numeric index (purana path).
// ============================================================
function _resolveTemplateSelection(val) {
  try {
    if(val === '' || val === null || val === undefined) return null;
    const v = String(val);
    // Numeric index (onRestTypeChange wala purana path)
    if(/^\d+$/.test(v)) {
      const restTypeEl = document.getElementById('restTypeSelect');
      const restType = restTypeEl ? restTypeEl.value : Object.keys(RESTAURANT_TYPES||{})[0];
      const r = RESTAURANT_TYPES[restType] && RESTAURANT_TYPES[restType].roles && RESTAURANT_TYPES[restType].roles[parseInt(v,10)];
      return r ? { kind:'builtin', restType, roleIndex:parseInt(v,10), role:r } : null;
    }
    // Custom template
    if(v.indexOf('custom_') === 0) {
      const id = v.slice(7);
      const t = ((_settingsCache['sg_custom_templates'])||[]).find(x => String(x.id) === id);
      return t ? { kind:'custom', tmpl:t } : null;
    }
    // Built-in string id -> RESTAURANT_TYPES mein role name se match karo
    const nameMap = { manager:'Manager', cashier:'Cashier', kitchen:'Kitchen Staff', delivery:'Delivery Staff', waiter:'Waiter', supervisor:'Floor Supervisor' };
    const wanted = nameMap[v.toLowerCase()];
    if(!wanted) return null;
    for(const rt of Object.keys(RESTAURANT_TYPES||{})) {
      const roles = RESTAURANT_TYPES[rt].roles || [];
      const idx = roles.findIndex(r => (r.role||'') === wanted || (r.role||'').indexOf(wanted) === 0);
      if(idx >= 0) return { kind:'builtin', restType:rt, roleIndex:idx, role:roles[idx] };
    }
    return null;
  } catch(e) { return null; }
}

// Template select karne pe description dikhao (pehle undefined tha)
function onSmallRoleTemplateChange(val) {
  try {
    const desc = document.getElementById('templateRoleDesc');
    if(!desc) return;
    const sel = _resolveTemplateSelection(val);
    if(!sel) { desc.textContent = ''; return; }
    if(sel.kind === 'builtin') {
      desc.textContent = (sel.role.desc||'') + ' — ' + (sel.role.perms||[]).length + ' permissions pre-set';
      desc.style.color = sel.role.color || 'var(--muted)';
    } else {
      desc.textContent = (sel.tmpl.desc || 'Custom template') + ' — role name & color set honge, permissions manually choose karo';
      desc.style.color = sel.tmpl.color || 'var(--muted)';
    }
  } catch(_e) { console.error("[SG] onSmallRoleTemplateChange:", _e); }
}

function applySmallRoleTemplate(val) {
  try {
  if(val === '' || val === null || val === undefined) {
    return showToast('Please select a template first','error');
  }
  const sel = _resolveTemplateSelection(val);
  if(!sel) return showToast('Template not found','error');
  if(sel.kind === 'builtin') {
    applyRoleTemplate(sel.restType, sel.roleIndex);
    return;
  }
  // Custom template: role name + color set karo
  const roleInput = document.getElementById('newStaffRole');
  if(roleInput) roleInput.value = sel.tmpl.name || '';
  const colorInput = document.getElementById('newStaffColor');
  if(colorInput) colorInput.value = sel.tmpl.color || '#16a085';
  // Agar custom template mein perms saved hain toh lagao, warna clear karo
  document.querySelectorAll('#newStaffPerms input[type="checkbox"]').forEach(cb => { cb.checked = false; });
  if(sel.tmpl.perms && sel.tmpl.perms.length) {
    sel.tmpl.perms.forEach(perm => {
      const cb = document.getElementById('np-' + perm.replace(/ /g,'-'));
      if(cb) cb.checked = true;
    });
  }
  try { permGroups.forEach((grp, gi) => { updateNCount(gi, grp.perms.length); }); } catch(e) {}
  showToast('✅ ' + (sel.tmpl.name||'Template') + ' applied — permissions manually select karo!');
  } catch(_e) { console.error("[SG] applySmallRoleTemplate:", _e); }
}

// ── ON ADMIN LOGIN INIT ──
const _origSetupDashboard = window.setupDashboard;
window.setupDashboard = function() {
  if(_origSetupDashboard) _origSetupDashboard.apply(this,arguments);
  setTimeout(()=>{ renderNotifBadge(); }, 300);
};