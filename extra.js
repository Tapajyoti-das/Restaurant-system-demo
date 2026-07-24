// ============================================================
// FEATURE 27 — Employee Performance Tracking
// ============================================================
function getAttendanceData() { try { return JSON.parse(localStorage.getItem('sg_attendance')||'[]'); } catch(e){return[];} }
// getTasks/saveTasks defined above with Supabase sync
function getOrders() { return orders; } // from Supabase in-memory
function getStaffList() { try { return staff.length ? staff : JSON.parse(localStorage.getItem('sg_staff')||'[]'); } catch(e){return[];} }

function getPerfDateRange(period) {
  try {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (period==='daily') return { from: today, to: today };
  if (period==='weekly') {
    const wa = new Date(now - 7*86400000).toISOString().split('T')[0];
    return { from: wa, to: today };
  }
  if (period==='monthly') {
    const ma = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return { from: ma, to: today };
  }
  if (period==='yearly') {
    return { from: now.getFullYear()+'-01-01', to: today };
  }
  return { from: today, to: today };
  } catch(_e) { console.error("[SG] getPerfDateRange:", _e); }
}

function populatePerfFilters() {
  try {
  const isAdmin = currentUser?.role==='Admin';
  const isMgr = currentUser?.role==='Supervisor'||currentUser?.role==='Reporting Manager';
  const staffList = getStaffList();
  let visible = staffList.filter(s=>s.active!==false);

  if (isMgr) {
    visible = visible.filter(s => s.reportingTo === currentUser?.username || s.reportingTo === currentUser?.id);
  }

  ['perfStaffFilter','thStaffFilter'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">All Employees</option>';
    visible.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name + ' (' + (s.role||'Staff') + ')';
      sel.appendChild(opt);
    });
    if (cur) sel.value = cur;
  });

  // taskAssignTo in modal
  const tas = document.getElementById('taskAssignTo');
  if (tas) {
    tas.innerHTML = '';
    visible.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name + ' (' + (s.role||'Staff') + ')';
      tas.appendChild(opt);
    });
  }
  } catch(_e) { console.error("[SG] populatePerfFilters:", _e); }
}

function calcEmpStats(staffId, range) {
  try {
  const tasks = getTasks().filter(t => t.assignedTo === staffId && t.date >= range.from && t.date <= range.to);

  // Orders from sg_order_assignments (new system)
  const allOrders = getOrders();
  const assignments = getOrderAssignments();

  // Bug #3 fix: removed the nested getOrderDate (which took a UTC substring of
  // created_at and counted late-night IST orders on the wrong day).
  // Now the calls resolve to the global getOrderDate() -> parseAnyDate(), which
  // gives priority to 'time' (IST locale) and converts created_at from UTC->IST.

  const assignedOrders = allOrders.filter(o => {
    const a = assignments[o.id];
    if(!a) return false;
    const isAssigned = a.cookId===staffId || a.assignedTo===staffId || 
                       a.handedTo===staffId || a.deliveryBoyId===staffId ||
                       a.waiterId===staffId;
    const orderDate = getOrderDate(o);
    return isAssigned && orderDate >= range.from && orderDate <= range.to;
  });

  // Also check direct assignment on order
  const directOrders = allOrders.filter(o => {
    const orderDate = getOrderDate(o);
    return o.assignedTo === staffId && orderDate >= range.from && orderDate <= range.to;
  });

  // Merge deduplicated
  const orderIds = new Set([...assignedOrders.map(o=>o.id), ...directOrders.map(o=>o.id)]);
  const orders = allOrders.filter(o=>orderIds.has(o.id));

  const att = getAttendanceData().filter(a => (a.userId===staffId||a.staffName===staffId) && a.date >= range.from && a.date <= range.to);

  // Tasks Done = manual tasks + orders
  const completedManualTasks = tasks.filter(t=>t.status==='completed').length;
  const totalManualTasks = tasks.length;
  
  // Orders count as tasks
  const completedOrderTasks = orders.filter(o=>['Delivered','Collected','Served'].includes(o.status)).length;
  const totalOrderTasks = orders.length;
  
  const completedTasks = completedManualTasks + completedOrderTasks;
  const totalTasks = totalManualTasks + totalOrderTasks;
  const onTimeTasks = tasks.filter(t=>t.status==='completed'&&t.dueDate&&t.completedAt&&t.completedAt<=t.dueDate).length;
  const onTimeRate = completedTasks > 0 ? Math.round((onTimeTasks/completedTasks)*100) : 0;

  const fromD = new Date(range.from), toD = new Date(range.to);
  const totalDays = Math.max(1, Math.round((toD-fromD)/86400000)+1);
  const presentDays = att.filter(a=>a.checkIn).length;
  const attPct = Math.round((presentDays/totalDays)*100);

  const ratings = orders.filter(o=>o.rating).map(o=>o.rating);
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : '—';

  const taskScore = totalTasks ? Math.min(100, Math.round((completedTasks/totalTasks)*100)) : 0;
  const ratingScore = ratings.length ? Math.round(((parseFloat(avgRating)||0)/5)*100) : 50;
  const score = Math.round(taskScore*0.4 + onTimeRate*0.3 + attPct*0.2 + ratingScore*0.1);

  return { ordersHandled: orders.length, completedTasks, totalTasks, onTimeRate, avgRating, attPct, score };
  } catch(_e) { console.error("[SG] calcEmpStats:", _e); }
}

function renderEmpPerf() {
  try {
  const period = document.getElementById('perfPeriod')?.value || 'weekly';
  const staffFilter = document.getElementById('perfStaffFilter')?.value || '';
  const range = getPerfDateRange(period);
  const isAdmin = currentUser?.role==='Admin';
  const isMgr = currentUser?.role==='Supervisor'||currentUser?.role==='Reporting Manager';
  const isEmp = !isAdmin && !isMgr;

  let staffList = getStaffList().filter(s=>s.active!==false);
  if (isMgr) staffList = staffList.filter(s=>s.reportingTo===currentUser?.username||s.reportingTo===currentUser?.id);
  if (isEmp) staffList = staffList.filter(s=>s.id===currentUser?.id||s.username===currentUser?.username);
  if (staffFilter) staffList = staffList.filter(s=>s.id===staffFilter);

  const noteEl = document.getElementById('perfTableNote');
  if (noteEl) noteEl.textContent = isEmp ? '(Your data only)' : isMgr ? '(Your team data)' : '';

  const rows = staffList.map(s => {
    const st = calcEmpStats(s.id, range);
    const scoreColor = st.score>=80?'var(--success)':st.score>=50?'var(--warning)':'var(--danger)';
    const badge = st.score>=80?'🟢 Excellent':st.score>=60?'🟡 Good':st.score>=40?'🟠 Average':'🔴 Needs Improvement';
    return `<tr>
      <td><b>${escHtml(s.name)}</b></td>
      <td>${s.role||'Staff'}</td>
      <td style="text-align:center;">${st.ordersHandled}</td>
      <td style="text-align:center;">${st.completedTasks}/${st.totalTasks}</td>
      <td style="text-align:center;">${st.onTimeRate}%</td>
      <td style="text-align:center;">${st.avgRating}⭐</td>
      <td style="text-align:center;">${st.attPct}%</td>
      <td style="text-align:center;"><span style="background:${scoreColor}22;color:${scoreColor};padding:4px 10px;border-radius:20px;font-weight:800;">${st.score} — ${badge}</span></td>
    </tr>`;
  });

  const tbody = document.getElementById('perfTableBody');
  if (tbody) tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="8"><div class="empty"><div class="empty-icon">🏆</div><p>No data found</p></div></td></tr>';

  // Summary cards
  const sumEl = document.getElementById('perfSummaryCards');
  if (sumEl && staffList.length) {
    const allStats = staffList.map(s=>calcEmpStats(s.id, range));
    const avgScore = Math.round(allStats.reduce((a,b)=>a+b.score,0)/allStats.length);
    const topIdx = allStats.reduce((maxI,s,i,arr)=>s.score>arr[maxI].score?i:maxI,0);
    const totalOrders = allStats.reduce((a,b)=>a+b.ordersHandled,0);
    const totalTasks = allStats.reduce((a,b)=>a+b.completedTasks,0);
    sumEl.innerHTML = `
      <div class="stat-card gold"><div class="stat-icon">⭐</div><div class="stat-num">${avgScore}</div><div class="stat-label">Avg Performance Score</div></div>
      <div class="stat-card green"><div class="stat-icon">🏆</div><div class="stat-num" style="font-size:1.2rem;">${staffList[topIdx]?.name||'—'}</div><div class="stat-label">Top Performer</div></div>
      <div class="stat-card orange"><div class="stat-icon">🧾</div><div class="stat-num">${totalOrders}</div><div class="stat-label">Total Orders Handled</div></div>
      <div class="stat-card blue"><div class="stat-icon">✅</div><div class="stat-num">${totalTasks}</div><div class="stat-label">Tasks Completed</div></div>`;
  }
  } catch(_e) { console.error("[SG] renderEmpPerf:", _e); }
}

function exportPerfCSV() {
  try {
  const period = document.getElementById('perfPeriod')?.value||'weekly';
  const range = getPerfDateRange(period);
  const staffList = getStaffList().filter(s=>s.active!==false);
  const rows = [['Employee','Role','Orders','Tasks Done','On-Time %','Avg Rating','Attendance %','Score']];
  staffList.forEach(s=>{
    const st = calcEmpStats(s.id, range);
    rows.push([s.name, s.role||'Staff', st.ordersHandled, `${st.completedTasks}/${st.totalTasks}`, st.onTimeRate+'%', st.avgRating, st.attPct+'%', st.score]);
  });
  downloadCSV(rows, 'employee_performance.csv');
  } catch(_e) { console.error("[SG] exportPerfCSV:", _e); }
}

// ============================================================
// FEATURE 28 — Task Complete/Incomplete History
// ============================================================
function openAddTaskModal(taskId) {
  try {
  populatePerfFilters();
  const today = new Date().toISOString().split('T')[0];
  if (taskId) {
    const task = getTasks().find(t=>t.id===taskId);
    if (!task) return;
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('addTaskModalTitle').textContent = '✏️ Edit Task';
    document.getElementById('taskTitle').value = task.title||'';
    document.getElementById('taskDesc').value = task.desc||'';
    document.getElementById('taskAssignTo').value = task.assignedTo||'';
    document.getElementById('taskPriority').value = task.priority||'medium';
    document.getElementById('taskDueDate').value = task.dueDate||'';
    document.getElementById('taskDueTime').value = task.dueTime||'';
  } else {
    document.getElementById('editTaskId').value = '';
    document.getElementById('addTaskModalTitle').textContent = '📋 Add Task';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskDueDate').value = today;
    document.getElementById('taskDueTime').value = '';
  }
  openModal('addTaskModal');
  } catch(_e) { console.error("[SG] openAddTaskModal:", _e); }
}

function saveTask() {
  try {
  const title = document.getElementById('taskTitle').value.trim();
  const assignedTo = document.getElementById('taskAssignTo').value;
  if (!title) { alert('Task title is required!'); return; }
  if (!assignedTo) { alert('Please select an employee!'); return; }

  const tasks = getTasks();
  const editId = document.getElementById('editTaskId').value;
  const today = new Date().toISOString().split('T')[0];
  const assignedStaff = getStaffList().find(s=>s.id===assignedTo);

  if (editId) {
    const idx = tasks.findIndex(t=>t.id===editId);
    if (idx>=0) {
      tasks[idx] = { ...tasks[idx],
        title,
        desc: document.getElementById('taskDesc').value.trim(),
        assignedTo, assignedToName: assignedStaff?.name||'',
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value,
        dueTime: document.getElementById('taskDueTime').value
      };
    }
  } else {
    tasks.push({
      id: 'T'+Date.now(),
      title,
      desc: document.getElementById('taskDesc').value.trim(),
      assignedTo, assignedToName: assignedStaff?.name||'',
      assignedBy: currentUser?.name || currentUser?.username,
      date: today,
      priority: document.getElementById('taskPriority').value,
      dueDate: document.getElementById('taskDueDate').value,
      dueTime: document.getElementById('taskDueTime').value,
      status: 'pending',
      completedAt: null
    });
  }
  saveTasks(tasks);
  closeModal('addTaskModal');
  renderTaskHistory();
  renderTaskLoad();
  showToast('Task saved!');
  } catch(_e) { console.error("[SG] saveTask:", _e); }
}

function updateTaskStatus(taskId, newStatus) {
  try {
  const tasks = getTasks();
  const idx = tasks.findIndex(t=>t.id===taskId);
  if (idx<0) return;
  tasks[idx].status = newStatus;
  if (newStatus==='completed') tasks[idx].completedAt = new Date().toISOString().split('T')[0];
  else if (newStatus!=='completed') tasks[idx].completedAt = null;
  saveTasks(tasks);
  renderTaskHistory();
  renderTaskLoad();
  renderEmpPerf();
  showToast('Task updated!');
  } catch(_e) { console.error("[SG] updateTaskStatus:", _e); }
}

function deleteTask(taskId) {
  try {
  if (!confirm('Delete this task?')) return;
  saveTasks(getTasks().filter(t=>t.id!==taskId));
  renderTaskHistory();
  renderTaskLoad();
  showToast('Task deleted!');
  } catch(_e) { console.error("[SG] deleteTask:", _e); }
}

function renderTaskHistory() {
  try {
  const period = document.getElementById('thPeriod')?.value || 'weekly';
  const staffFilter = document.getElementById('thStaffFilter')?.value || '';
  const statusFilter = document.getElementById('thStatusFilter')?.value || '';
  const range = getPerfDateRange(period);
  const isAdmin = currentUser?.role==='Admin';
  const isMgr = currentUser?.role==='Supervisor'||currentUser?.role==='Reporting Manager';
  const isEmp = !isAdmin && !isMgr;

  let tasks = getTasks().filter(t => t.date >= range.from && t.date <= range.to);

  // Also include orders from sg_order_assignments as "tasks"
  const allOrders = getOrders();
  const assignments = getOrderAssignments();
  // Helper to get order date
  function getODate(o) {
    try {
    if(o.created_at) return o.created_at.substring(0,10);
    if(o.date) return o.date.substring(0,10);
    if(o.createdAt) return o.createdAt.substring(0,10);
    if(o.time) {
      try {
        const parts = o.time.split(',')[0].split('/');
        if(parts.length===3) return parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0');
      } catch(e) {}
      try { return new Date(o.time).toISOString().substring(0,10); } catch(e) {}
    }
    return new Date().toISOString().substring(0,10);
    } catch(_e) { console.error("[SG] getODate:", _e); }
}

  const orderTasks = allOrders.filter(o=>{
    const a = assignments[o.id];
    if(!a) return false;
    const orderDate = getODate(o);
    return orderDate >= range.from && orderDate <= range.to;
  }).map(o=>{
    const a = assignments[o.id];
    const assignedId = a.cookId||a.assignedTo||a.handedTo||a.waiterId||a.deliveryBoyId||'';
    const assignedName = a.cookName||a.assignedName||a.handedToName||a.waiterName||a.deliveryBoyName||'—';
    const isDone = ['Delivered','Collected','Served'].includes(o.status);
    return {
      id: 'ORD_'+o.id,
      title: `Order #${o.id} — ${o.type}`,
      desc: o.items?.map(i=>i.name+' x'+i.qty).join(', ')||'',
      assignedTo: assignedId,
      assignedToName: assignedName,
      assignedBy: a.assignedBy||a.cookAssignedAt?'System':'—',
      date: getODate(o),
      dueDate: null,
      status: isDone ? 'completed' : o.status==='Cancelled' ? 'incomplete' : 'pending',
      completedAt: isDone ? (o.cookReadyAt||'') : '',
      priority: 'medium',
      isOrder: true
    };
  });

  // Merge tasks + order-tasks
  let allTaskItems = [...tasks, ...orderTasks];

  if (isEmp) allTaskItems = allTaskItems.filter(t=>t.assignedTo===currentUser?.id||t.assignedTo===currentUser?.username);
  else if (isMgr) {
    const myTeam = getStaffList().filter(s=>s.reportingTo===currentUser?.username||s.reportingTo===currentUser?.id).map(s=>s.id);
    allTaskItems = allTaskItems.filter(t=>myTeam.includes(t.assignedTo));
  }
  if (staffFilter) allTaskItems = allTaskItems.filter(t=>t.assignedTo===staffFilter);
  if (statusFilter) allTaskItems = allTaskItems.filter(t=>t.status===statusFilter);

  const noteEl = document.getElementById('thTableNote');
  if (noteEl) noteEl.textContent = isEmp ? '(Your own)' : isMgr ? '(Team)' : '';

  const completed = allTaskItems.filter(t=>t.status==='completed').length;
  const incomplete = allTaskItems.filter(t=>t.status==='incomplete').length;
  const pending = allTaskItems.filter(t=>t.status==='pending').length;
  const total = allTaskItems.length;
  const rate = total ? Math.round((completed/total)*100) : 0;
  const sumEl = document.getElementById('thSummaryCards');
  if (sumEl) sumEl.innerHTML = `
    <div class="stat-card green"><div class="stat-icon">✅</div><div class="stat-num">${completed}</div><div class="stat-label">Completed Tasks</div></div>
    <div class="stat-card orange"><div class="stat-icon">❌</div><div class="stat-num">${incomplete}</div><div class="stat-label">Incomplete</div></div>
    <div class="stat-card gold"><div class="stat-icon">⏳</div><div class="stat-num">${pending}</div><div class="stat-label">Pending</div></div>
    <div class="stat-card blue"><div class="stat-icon">📈</div><div class="stat-num">${rate}%</div><div class="stat-label">Completion Rate</div></div>`;

  const priorityColor = {high:'#e74c3c',medium:'#f39c12',low:'#27ae60'};
  const statusBadge = {
    completed:'<span class="status confirmed">✅ Completed</span>',
    incomplete:'<span class="status cancelled">❌ Incomplete</span>',
    pending:'<span class="status pending">⏳ Pending</span>'
  };
  const canEdit = isAdmin || isMgr;
  const tbody = document.getElementById('thTableBody');
  if (!tbody) return;
  if (!allTaskItems.length) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty"><div class="empty-icon">📋</div><p>No tasks found</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = allTaskItems.slice().reverse().map(t=>{
    const pc = priorityColor[t.priority]||'#999';
    const overdue = t.dueDate && t.status!=='completed' && t.dueDate < new Date().toISOString().split('T')[0];
    const dueLabel = t.dueDate ? `${t.dueDate}${t.dueTime?' '+t.dueTime:''}` : '—';
    const isOrderTask = t.isOrder;
    return `<tr${overdue?' style="background:#fff5f5;"':''}>
      <td>
        ${isOrderTask?'<span style="background:#e3f2fd;color:#1565c0;font-size:0.68rem;padding:1px 6px;border-radius:8px;font-weight:700;margin-right:4px;">🧾 Order</span>':''}
        <b>${t.title}</b>${t.desc?`<div style="font-size:0.75rem;color:var(--muted);">${t.desc}</div>`:''}
        ${!isOrderTask?`<span style="background:${pc}22;color:${pc};font-size:0.7rem;padding:2px 7px;border-radius:10px;font-weight:700;">${(t.priority||'medium').toUpperCase()}</span>`:''}
      </td>
      <td>${t.assignedToName||t.assignedTo||'—'}</td>
      <td>${t.assignedBy||'Admin'}</td>
      <td>${t.date||'—'}</td>
      <td>${overdue?'<b style="color:var(--danger);">⚠️ '+dueLabel+'</b>':dueLabel}</td>
      <td>${statusBadge[t.status]||t.status}</td>
      <td>${t.completedAt||'—'}</td>
      <td>
        ${canEdit&&!isOrderTask?`<div class="action-btns">
          ${t.status!=='completed'?`<button class="act-btn act-approve" onclick="updateTaskStatus('${t.id}','completed')">✅</button>`:''}
          ${t.status!=='incomplete'&&t.status!=='completed'?`<button class="act-btn act-delete" onclick="updateTaskStatus('${t.id}','incomplete')">❌</button>`:''}
          <button class="act-btn act-edit" onclick="openAddTaskModal('${t.id}')">✏️</button>
          <button class="act-btn act-delete" onclick="deleteTask('${t.id}')">🗑️</button>
        </div>`:isOrderTask?`<span style="font-size:0.72rem;color:var(--muted);">Order #${t.id.replace('ORD_','')}</span>`:'—'}
      </td>
    </tr>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderTaskHistory:", _e); }
}

function exportTaskHistoryCSV() {
  try {
  const tasks = getTasks();
  const rows = [['Title','Assigned To','Assigned By','Date','Due Date','Status','Completed At','Priority']];
  tasks.forEach(t=>rows.push([t.title, t.assignedToName||t.assignedTo, t.assignedBy, t.date, t.dueDate||'', t.status, t.completedAt||'', t.priority]));
  downloadCSV(rows,'task_history.csv');
  } catch(_e) { console.error("[SG] exportTaskHistoryCSV:", _e); }
}

// ============================================================
// FEATURE 29 — Task Load Measurement + Alert (Admin Only)
// ============================================================
function renderTaskLoad() {
  try {
  initTaskLoad();
  const period = window._tlPeriod || 'weekly';
  const {from, to} = getTLDateRange();
  const range = {from, to};
  const thresholds = getTaskThresholds(period);
  const staffList = getStaffList().filter(s=>s.active!==false);
  const tasks = getTasks().filter(t=>t.date>=range.from&&t.date<=range.to);

  // Update date range label
  const label = document.getElementById('tlDateRangeLabel');
  if(label) label.textContent = '📅 '+from+(from!==to?' → '+to:'');

  // Update thOverloaded display
  const th = (_settingsCache['sg_task_thresholds'])||{underloaded:2,normal:5,average:8};
  const oEl = document.getElementById('thOverloaded');
  if(oEl) oEl.value = (th.average||8)+'+ per day';

  const loads = staffList.map(s=>{
    const myTasks = tasks.filter(t=>t.assignedTo===s.id);
    // Also count orders assigned via sg_order_assignments
    const allOrders = getOrders();
    const assignments = getOrderAssignments();
    const myOrders = allOrders.filter(o=>{
      const a = assignments[o.id];
      if(!a) return false;
      const isAssigned = a.cookId===s.id || a.assignedTo===s.id || 
                         a.handedTo===s.id || a.waiterId===s.id || 
                         a.deliveryBoyId===s.id;
      // Bug #8 fix: earlier (o.time).substring(0,10) gave garbage like "15/7/2026,"
      // which never matched the YYYY-MM-DD range — local orders were dropped.
      // Now the same canonical getOrderDate() is used that the rest of the performance code uses.
      const orderDate = getOrderDate(o);
      return isAssigned && orderDate >= range.from && orderDate <= range.to;
    });
    const completed = myTasks.filter(t=>t.status==='completed').length + myOrders.filter(o=>['Delivered','Collected','Served'].includes(o.status)).length;
    const pending = myTasks.filter(t=>t.status!=='completed').length + myOrders.filter(o=>!['Delivered','Collected','Served','Cancelled'].includes(o.status)).length;
    const total = myTasks.length + myOrders.length;
    return { s, total, completed, pending };
  }).filter(x=>x.total>0||staffList.length<=10);

  const maxLoad = Math.max(1, ...loads.map(x=>x.total));
  const avgLoad = loads.length ? (loads.reduce((a,b)=>a+b.total,0)/loads.length) : 0;

  // Alert banner
  const overloaded = loads.filter(x=>x.total>=thresholds.overloaded);
  const underloaded = loads.filter(x=>x.total<thresholds.normal&&x.total>=0);
  const alertBanner = document.getElementById('tlAlertBanner');
  const alertContent = document.getElementById('tlAlertContent');
  if (overloaded.length||underloaded.length) {
    if (alertBanner) alertBanner.style.display='block';
    let msg = '';
    if (overloaded.length) msg += `<b>🔴 Overloaded:</b> ${escHtml(overloaded.map(x=>x.s.name).join(', '))} — Task load is too high, please redistribute.<br>`;
    if (underloaded.length) msg += `<b>🟡 Underloaded:</b> ${escHtml(underloaded.map(x=>x.s.name).join(', '))} — Can assign more tasks to them.`;
    if (alertContent) alertContent.innerHTML = msg;
  } else {
    if (alertBanner) alertBanner.style.display='none';
  }

  // Summary
  const sumEl = document.getElementById('tlSummaryCards');
  if (sumEl) sumEl.innerHTML = `
    <div class="stat-card orange"><div class="stat-icon">👥</div><div class="stat-num">${loads.filter(x=>x.total>0).length}</div><div class="stat-label">Active Employees</div></div>
    <div class="stat-card gold"><div class="stat-icon">📊</div><div class="stat-num">${Math.round(avgLoad)}</div><div class="stat-label">Avg Tasks per Employee</div></div>
    <div class="stat-card danger" style="--stat-color:var(--danger)"><div class="stat-icon">🔴</div><div class="stat-num">${overloaded.length}</div><div class="stat-label">Overloaded</div></div>
    <div class="stat-card blue"><div class="stat-icon">🟡</div><div class="stat-num">${underloaded.length}</div><div class="stat-label">Underloaded</div></div>`;

  // Bar chart
  const chartEl = document.getElementById('tlChartWrap');
  if (chartEl) {
    chartEl.innerHTML = loads.length ? `<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;min-height:120px;">
      ${loads.map(x=>{
        const pct = Math.round((x.total/maxLoad)*100);
        const xSt = getTaskStatus(x.total, thresholds);
        const isOver = xSt.status === 'Overloaded';
        const isUnder = xSt.status === 'Underloaded' || xSt.status === 'No Tasks';
        const color = isOver ? '#c62828' : isUnder ? '#f9a825' : xSt.status==='Average' ? '#2e7d32' : '#1565c0';
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px;">
          <div style="font-size:0.78rem;font-weight:700;color:${color};">${x.total}</div>
          <div style="width:50px;height:${Math.max(8,pct)}px;background:${color};border-radius:4px 4px 0 0;transition:height 0.3s;"></div>
          <div style="font-size:0.72rem;color:var(--muted);text-align:center;max-width:60px;word-break:break-word;">${escHtml(x.s.name.split(' ')[0])}</div>
          ${isOver?'<div style="font-size:0.65rem;color:#c62828;font-weight:700;">🔴 Overloaded</div>':isUnder?'<div style="font-size:0.65rem;color:#f9a825;font-weight:700;">🟡 Underloaded</div>':xSt.status==='Normal'?'<div style="font-size:0.65rem;color:#1565c0;font-weight:700;">🔵 Normal</div>':'<div style="font-size:0.65rem;color:#2e7d32;font-weight:700;">🟢 Average</div>'}
        </div>`;
      }).join('')}
      <div style="display:flex;flex-direction:column;justify-content:flex-end;gap:6px;margin-left:16px;font-size:0.75rem;border-left:1px dashed #e8d5c8;padding-left:12px;">
        <div style="color:#c62828;">🔴 Overloaded (>=${thresholds.overloaded} tasks)</div>
        <div style="color:#2e7d32;">🟢 Average (>=${thresholds.average} tasks)</div>
        <div style="color:#1565c0;">🔵 Normal (>=${thresholds.normal} tasks)</div>
        <div style="color:#f9a825;">🟡 Underloaded (>=${thresholds.underloaded} tasks)</div>
        <div style="color:var(--muted);">📊 Avg: ${Math.round(avgLoad)} tasks</div>
      </div>
    </div>` : '<p style="color:var(--muted);text-align:center;padding:20px;">No task data available</p>';
  }

  // Table
  const tbody = document.getElementById('tlTableBody');
  if (!tbody) return;
  if (!loads.length) {
    tbody.innerHTML='<tr><td colspan="8"><div class="empty"><div class="empty-icon">⚖️</div><p>No data available</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = loads.sort((a,b)=>b.total-a.total).map(x=>{
    const xSt2 = getTaskStatus(x.total, thresholds);
    const isOver = xSt2.status === 'Overloaded';
    const isUnder = xSt2.status === 'Underloaded' || xSt2.status === 'No Tasks';
    const isAvg = xSt2.status === 'Average';
    const loadPct = maxLoad ? Math.round((x.total/maxLoad)*100) : 0;
    const statusBadge = '<span style="background:'+xSt2.color+';color:#fff;padding:3px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;">'+xSt2.icon+' '+xSt2.status+'</span>';
    const suggestion = isOver
      ? '⚠️ Redistribute tasks'
      : isUnder
        ? '📋 Assign more tasks'
        : isAvg ? '✅ Load balanced' : '👍 Normal';
    return `<tr${isOver?' style="background:#fff5f5;"':isUnder?' style="background:#fffde7;"':isAvg?' style="background:#f1f8e9;"':''}>
      <td><b>${escHtml(x.s.name)}</b></td>
      <td>${x.s.role||'Staff'}</td>
      <td style="text-align:center;font-weight:800;">${x.total}</td>
      <td style="text-align:center;color:var(--success);font-weight:700;">${x.completed}</td>
      <td style="text-align:center;color:var(--warning);font-weight:700;">${x.pending}</td>
      <td style="text-align:center;">
        <div style="background:#f0f0f0;border-radius:20px;height:8px;width:100px;display:inline-block;overflow:hidden;">
          <div style="height:100%;width:${loadPct}%;background:${xSt2.color};border-radius:20px;"></div>
        </div>
        <span style="font-size:0.75rem;margin-left:6px;">${loadPct}%</span>
      </td>
      <td>${statusBadge}</td>
      <td style="font-size:0.82rem;color:var(--muted);">${suggestion}</td>
    </tr>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderTaskLoad:", _e); }
}

function sendTaskLoadAlert() {
  try {
  renderTaskLoad();
  const alertBanner = document.getElementById('tlAlertBanner');
  if (alertBanner&&alertBanner.style.display!=='none') {
    alertBanner.style.animation='none';
    setTimeout(()=>alertBanner.style.animation='',10);
    showToast('⚠️ Task load alert sent! (Simulated — check banner above)');
  } else {
    showToast('✅ Task load is balanced for all employees!');
  }
  } catch(_e) { console.error("[SG] sendTaskLoadAlert:", _e); }
}

// Auto alert check — weekly (simulated)
function checkTaskLoadAutoAlert() {
  try {
  const lastAlert = localStorage.getItem('sg_taskload_lastAlert');
  const now = Date.now();
  if (!lastAlert || now - parseInt(lastAlert) > 7*24*60*60*1000) {
    localStorage.setItem('sg_taskload_lastAlert', now.toString());
    // Would show notification in real system; here just logs
    console.log('[Task Load] Weekly auto-alert check triggered');
  }
  } catch(_e) { console.error("[SG] checkTaskLoadAutoAlert:", _e); }
}

// ============================================================
// Hook into existing showDash + setupNewSidebarItems
// ============================================================
const _origShowDash27 = typeof showDash === 'function' ? showDash : null;
(function() {
  const orig = window.showDash;
  window.showDash = function(section) {
    try { if(typeof orig === 'function') orig(section); } catch(e) { console.error('[SG] showDash orig:', e); }
    if (section==='empPerf') { populatePerfFilters(); renderEmpPerf(); }
    if (section==='taskHistory') { populatePerfFilters(); renderTaskHistory(); }
    if (section==='taskLoad') { renderTaskLoad(); checkTaskLoadAutoAlert(); }
  };
})();

const _origSetupNewSidebar27 = window.setupNewSidebarItems;
window.setupNewSidebarItems = function() {
  try { if(typeof _origSetupNewSidebar27 === 'function') _origSetupNewSidebar27(); } catch(e) {}
  const isAdmin = currentUser?.role==='Admin';
  const isMgr = currentUser?.role==='Supervisor'||currentUser?.role==='Reporting Manager';
  const showEl = (id,show) => { const el=document.getElementById(id); if(el) el.style.display=show?'flex':'none'; };
  showEl('siEmpPerf', true);       // Admin, Mgr, Employee — filtered in render
  showEl('siTaskHistory', true);   // All — filtered in render
  showEl('siTaskLoad', isAdmin);   // Admin only
};

// ============================================================
// PHASE 5 — INVENTORY SPECIAL FEATURES
// ============================================================

// ===== FEATURE 30: RECIPE-BASED AUTO STOCK DEDUCT =====

// Consumption Log Column Manager
// Consumption Log visible columns
let _consumLogCols = {
  date: true, time: true, orderid: true, purchaseids: true,
  dishname: true, ingredientname: true, ingredienttype: true,
  qty: true, unit: true, unitcost: true, totalcost: true, servedby: true
};

function openConsumLogColManager() {
  // Remove existing modal if any
  document.getElementById('consumColModal')?.remove();

  const cols = [
    {key:'date',           label:'Date'},
    {key:'time',           label:'Time'},
    {key:'orderid',        label:'Order ID'},
    {key:'purchaseids',    label:'Purchase IDs'},
    {key:'dishname',       label:'Dish'},
    {key:'ingredientname', label:'Ingredient'},
    {key:'ingredienttype', label:'Type'},
    {key:'qty',            label:'Qty'},
    {key:'unit',           label:'Unit'},
    {key:'unitcost',       label:'Unit Cost'},
    {key:'totalcost',      label:'Total Cost'},
    {key:'servedby',       label:'Served By'},
  ];

  const checkboxes = cols.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #f0f0f0;">
      <input type="checkbox" id="clcol_${c.key}" ${_consumLogCols[c.key]!==false?'checked':''} 
        style="width:16px;height:16px;cursor:pointer;accent-color:#E8400C;">
      <label for="clcol_${c.key}" style="cursor:pointer;font-size:0.9rem;flex:1;">${c.label}</label>
    </div>`).join('');

  const modal = document.createElement('div');
  modal.id = 'consumColModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:360px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:1rem;font-weight:800;">⚙️ Consumption Log Columns</h3>
        <button onclick="document.getElementById('consumColModal').remove()" 
          style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666;line-height:1;">✕</button>
      </div>
      <div style="margin-bottom:16px;">${checkboxes}</div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button onclick="resetConsumLogCols()" 
          style="flex:1;padding:10px;background:#fff3e0;color:#e65100;border:2px solid #ffcc80;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;">
          ↺ Reset
        </button>
        <button onclick="saveConsumLogCols()" 
          style="flex:2;padding:10px;background:#E8400C;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;">
          ✅ Save & Close
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function saveConsumLogCols() {
  const keys = ['date','time','orderid','purchaseids','dishname','ingredientname','ingredienttype','qty','unit','unitcost','totalcost','servedby'];
  keys.forEach(k => {
    const el = document.getElementById('clcol_'+k);
    if(el) _consumLogCols[k] = el.checked;
  });
  document.getElementById('consumColModal')?.remove();
  renderConsumptionLog();
}

function resetConsumLogCols() {
  const keys = ['date','time','orderid','purchaseids','dishname','ingredientname','ingredienttype','qty','unit','unitcost','totalcost','servedby'];
  keys.forEach(k => _consumLogCols[k] = true);
  document.getElementById('consumColModal')?.remove();
  renderConsumptionLog();
}

// ===== CONSUMPTION LOG TAB SWITCHING =====
let _activeConsumTab = 'recipe';

function switchConsumTab(tab) {
  _activeConsumTab = tab;
  // Tab buttons
  const recipeBtn = document.getElementById('consumTab-recipe');
  const ingredBtn = document.getElementById('consumTab-ingred');
  if(recipeBtn) {
    recipeBtn.style.background = tab==='recipe' ? 'var(--fire)' : '#f0ebe5';
    recipeBtn.style.color      = tab==='recipe' ? '#fff' : 'var(--muted)';
    recipeBtn.style.borderBottom = tab==='recipe' ? '3px solid var(--fire)' : '3px solid transparent';
  }
  if(ingredBtn) {
    ingredBtn.style.background = tab==='ingred' ? '#2e7d32' : '#f0ebe5';
    ingredBtn.style.color      = tab==='ingred' ? '#fff' : 'var(--muted)';
    ingredBtn.style.borderBottom = tab==='ingred' ? '3px solid #2e7d32' : '3px solid transparent';
  }
  // Panels
  const recipePanel = document.getElementById('consumPanel-recipe');
  const ingredPanel = document.getElementById('consumPanel-ingred');
  if(recipePanel) recipePanel.style.display = tab==='recipe' ? 'block' : 'none';
  if(ingredPanel) ingredPanel.style.display = tab==='ingred' ? 'block' : 'none';
  // Dish filter — show it only on the recipe tab
  const dishWrap = document.getElementById('consumDishFilterWrap');
  if(dishWrap) dishWrap.style.display = tab==='recipe' ? 'flex' : 'none';
  // Render
  if(tab==='recipe') renderConsumptionLog();
  else renderIngredientTotalConsumption();
}

function refreshConsumTab() {
  if(_activeConsumTab==='recipe') renderConsumptionLog();
  else renderIngredientTotalConsumption();
}

// ===== INGREDIENT TOTAL CONSUMPTION =====

let _ingredTotalCols = { date: true, ingredientname: true, totalqty: true, totalcost: true };

function openIngredTotalColManager() {
  document.getElementById('ingredTotalColModal')?.remove();
  const cols = [
    {key:'date',           label:'Date'},
    {key:'ingredientname', label:'Ingredient Name'},
    {key:'totalqty',       label:'Total Qty'},
    {key:'totalcost',      label:'Total Cost'},
  ];
  const checkboxes = cols.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #f0f0f0;">
      <input type="checkbox" id="itcol_${c.key}" ${_ingredTotalCols[c.key]!==false?'checked':''} style="width:16px;height:16px;cursor:pointer;accent-color:#2e7d32;">
      <label for="itcol_${c.key}" style="cursor:pointer;font-size:0.9rem;flex:1;">${c.label}</label>
    </div>`).join('');
  const modal = document.createElement('div');
  modal.id = 'ingredTotalColModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:340px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;font-size:1rem;font-weight:800;">⚙️ Ingredient Total Columns</h3>
        <button onclick="document.getElementById('ingredTotalColModal').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666;line-height:1;">✕</button>
      </div>
      <div style="margin-bottom:16px;">${checkboxes}</div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button onclick="resetIngredTotalCols()" style="flex:1;padding:10px;background:#fff3e0;color:#e65100;border:2px solid #ffcc80;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;">↺ Reset</button>
        <button onclick="saveIngredTotalCols()" style="flex:2;padding:10px;background:#2e7d32;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;">✅ Save & Close</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function saveIngredTotalCols() {
  ['date','ingredientname','totalqty','totalcost'].forEach(k => {
    const el = document.getElementById('itcol_'+k);
    if(el) _ingredTotalCols[k] = el.checked;
  });
  document.getElementById('ingredTotalColModal')?.remove();
  renderIngredientTotalConsumption();
}

function resetIngredTotalCols() {
  ['date','ingredientname','totalqty','totalcost'].forEach(k => _ingredTotalCols[k] = true);
  document.getElementById('ingredTotalColModal')?.remove();
  renderIngredientTotalConsumption();
}

async function renderIngredientTotalConsumption() {
  try {
    const tbody = document.getElementById('ingredTotalBody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted);">⏳ Loading...</td></tr>';

    // Fetch all data
    const { data, error } = await _supabase
      .from('inv_consumptions')
      .select('*')
      .order('createdat', { ascending: true })
      .limit(10000);

    if(error || !data || !data.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted);">No data found</td></tr>';
      return;
    }

    // Date parse helper
    function parseD(d) {
      if(!d) return null;
      d = String(d).trim();
      if(/^\d{2}\/\d{2}\/\d{4}$/.test(d)) { const p=d.split('/'); return new Date(p[2]+'-'+p[1]+'-'+p[0]); }
      if(d.includes(',')) d = d.split(',')[0].trim();
      if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) { const p=d.split('/'); return new Date(p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0')); }
      return new Date(d);
    }

    // Apply date filter if set, else all-time
    const fromDate = document.getElementById('consumLogFrom')?.value;
    const toDate   = document.getElementById('consumLogTo')?.value;
    let filtered = data;
    if(fromDate && fromDate.trim()) {
      const from = new Date(fromDate);
      filtered = filtered.filter(r => { const d=parseD(r.date); return d && d>=from; });
    }
    if(toDate && toDate.trim()) {
      const to = new Date(toDate); to.setHours(23,59,59,999);
      filtered = filtered.filter(r => { const d=parseD(r.date); return d && d<=to; });
    }

    // Date range validation
    if(fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#e74c3c;">⚠️ The start date is after the end date — fix the date range</td></tr>';
      const summary = document.getElementById('ingredTotalSummary');
      if(summary) summary.style.display = 'none';
      return;
    }

    if(!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted);">No record found in this date range</td></tr>';
      const summary = document.getElementById('ingredTotalSummary');
      if(summary) summary.style.display = 'none';
      return;
    }

    // Current date (IST)
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' });

    // Group by ingredient name — filtered total
    const grouped = {};
    filtered.forEach(r => {
      const name = r.ingredientname || r.ingredientName || '—';
      const unit = r.unit || '';
      if(!grouped[name]) grouped[name] = { ingredientname: name, unit, totalqty: 0, totalcost: 0 };
      grouped[name].totalqty  += parseFloat(r.qty || 0);
      grouped[name].totalcost += parseFloat(r.totalcost || r.totalCost || 0);
    });

    const rows = Object.values(grouped).sort((a,b) => a.ingredientname.localeCompare(b.ingredientname));

    // Update thead based on visible cols
    const colDefs = [
      {key:'date',           label:'Date',            align:'left'},
      {key:'ingredientname', label:'Ingredient Name', align:'left'},
      {key:'totalqty',       label:'Total Qty',       align:'center'},
      {key:'totalcost',      label:'Total Cost',      align:'right'},
    ];
    const thead = document.querySelector('#ingredTotalBody')?.closest('table')?.querySelector('thead');
    if(thead) {
      const vis = colDefs.filter(c => _ingredTotalCols[c.key] !== false);
      thead.innerHTML = `<tr style="background:#f9f7f5;"><th style="position:sticky;left:0;z-index:4;background:#f9f7f5;border-right:2px solid #e8d5c8;text-align:center;padding:10px 8px;">S.No.</th>${vis.map(c =>
        `<th style="padding:10px 12px;text-align:${c.align};border-bottom:2px solid #e8d5c8;">${c.label}</th>`
      ).join('')}</tr>`;
    }

    tbody.innerHTML = rows.map((r, _idx) => {
      const allCells = {
        date:           `<td style="padding:8px 12px;font-size:0.82rem;color:var(--muted);">${currentDate}</td>`,
        ingredientname: `<td style="padding:8px 12px;font-weight:600;">${r.ingredientname}</td>`,
        totalqty:       `<td style="padding:8px 8px;text-align:center;font-weight:700;">${r.totalqty.toFixed(3)} ${r.unit}</td>`,
        totalcost:      `<td style="padding:8px 8px;text-align:right;font-weight:700;color:#2e7d32;">₹${r.totalcost.toFixed(2)}</td>`,
      };
      const vis = Object.keys(allCells).filter(k => _ingredTotalCols[k] !== false);
      const _sno = `<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${_idx+1}</td>`;
      return `<tr style="border-bottom:1px solid #f0f0f0;">${_sno}${vis.map(k => allCells[k]).join('')}</tr>`;
    }).join('');

    // Summary
    const grandTotal = rows.reduce((s,r) => s+r.totalcost, 0);
    const summary = document.getElementById('ingredTotalSummary');
    if(summary) {
      summary.style.display = 'block';
      summary.innerHTML = `<b>📊 Summary:</b> ${rows.length} ingredient entries | Grand Total Cost: <b style="color:#2e7d32;">₹${grandTotal.toFixed(2)}</b>`;
    }
  } catch(e) { console.error('[SG] renderIngredientTotalConsumption:', e); }
}

async function renderConsumptionLog() {
  try {
  const tbody = document.getElementById('consumLogBody');
  if(!tbody) return;

  tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:var(--muted);">⏳ Loading...</td></tr>';

  // Fetch from Supabase
  console.log('[SG] Fetching consumption log...');
  const { data, error } = await _supabase
    .from('inv_consumptions')
    .select('*')
    .order('createdat', { ascending: false })
    .limit(10000);

  console.log('[SG] Consumption log result:', { dataLen: data?.length, error: error?.message });

  if(error) {
    console.error('[SG] consumption log error:', error);
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:#e74c3c;">Error: ' + (error.message||'Unknown') + '</td></tr>';
    return;
  }
  if(!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:var(--muted);">No consumption record found. (data length: 0)</td></tr>';
    return;
  }

  // Populate dish filter
  const dishSel = document.getElementById('consumLogDish');
  if(dishSel && dishSel.options.length <= 1) {
    const dishes = [...new Set(data.map(d => d.dishname || d.dishName).filter(Boolean))].sort();
    dishes.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      dishSel.appendChild(opt);
    });
  }

  // Filter
  const fromDate = document.getElementById('consumLogFrom')?.value; // YYYY-MM-DD
  const toDate   = document.getElementById('consumLogTo')?.value;   // YYYY-MM-DD
  const dishFilter = document.getElementById('consumLogDish')?.value;

  // Helper: parse date from DD/MM/YYYY or YYYY-MM-DD or any string
  function parseConsumDate(d) {
    if(!d) return null;
    d = String(d).trim();
    // DD/MM/YYYY
    if(/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const p = d.split('/');
      return new Date(p[2]+'-'+p[1]+'-'+p[0]);
    }
    // M/D/YYYY, h:mm:ss am/pm
    if(d.includes(',')) d = d.split(',')[0].trim();
    // D/M/YYYY
    if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(d)) {
      const p = d.split('/');
      return new Date(p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'));
    }
    return new Date(d);
  }

  let filtered = data;
  if(dishFilter) filtered = filtered.filter(r => (r.dishname||r.dishName) === dishFilter);
  // Only filter by date if explicitly set
  if(fromDate && fromDate.trim()) {
    const from = new Date(fromDate);
    filtered = filtered.filter(r => {
      const d = parseConsumDate(r.date);
      return d && d >= from;
    });
  }
  if(toDate && toDate.trim()) {
    const to = new Date(toDate);
    to.setHours(23,59,59,999);
    filtered = filtered.filter(r => {
      const d = parseConsumDate(r.date);
      return d && d <= to;
    });
  }

  // Date range validation
  if(fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:#e74c3c;">⚠️ The start date is after the end date — fix the date range</td></tr>';
    const summary = document.getElementById('consumLogSummary');
    if(summary) summary.style.display = 'none';
    return;
  }

  if(!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:var(--muted);">No record found for this filter</td></tr>';
    const summary = document.getElementById('consumLogSummary');
    if(summary) summary.style.display = 'none';
    return;
  }

  // Render header based on visible columns
  const thead = document.querySelector('#consumLogBody')?.closest('table')?.querySelector('thead');
  if(thead) {
    const colDefs = [
      {key:'date',           label:'Date',         align:'left'},
      {key:'time',           label:'Time',         align:'left'},
      {key:'orderid',        label:'Order ID',     align:'left'},
      {key:'purchaseids',    label:'Purchase IDs', align:'left'},
      {key:'dishname',       label:'Dish',         align:'left'},
      {key:'ingredientname', label:'Ingredient',   align:'left'},
      {key:'ingredienttype', label:'Type',         align:'center'},
      {key:'qty',            label:'Qty',          align:'center'},
      {key:'unit',           label:'Unit',         align:'center'},
      {key:'unitcost',       label:'Unit Cost',    align:'right'},
      {key:'totalcost',      label:'Total Cost',   align:'right'},
      {key:'servedby',       label:'Served By',    align:'left'},
    ];
    const visibleCols = colDefs.filter(c => _consumLogCols[c.key] !== false);
    thead.innerHTML = `<tr style="background:#f9f7f5;"><th style="position:sticky;left:0;z-index:4;background:#f9f7f5;border-right:2px solid #e8d5c8;text-align:center;padding:10px 8px;">S.No.</th>${visibleCols.map(c =>
      `<th style="padding:10px 12px;text-align:${c.align};border-bottom:2px solid #e8d5c8;">${c.label}</th>`
    ).join('')}</tr>`;
  }

  // Render rows
  tbody.innerHTML = filtered.map((r, _idx) => {
    // Support both camelCase and lowercase column names
    const itype = r.ingredienttype || r.ingredientType || '';
    const typeTag = itype === 'rawmat'
      ? '<span style="background:#fff3e0;color:#e65100;padding:2px 7px;border-radius:8px;font-size:0.72rem;font-weight:700;">RAW</span>'
      : '<span style="background:#e8f0fe;color:#1565c0;padding:2px 7px;border-radius:8px;font-size:0.72rem;font-weight:700;">PROD</span>';
    const unitcost = parseFloat(r.unitcost || r.unitCost || 0);
    const totalcost = parseFloat(r.totalcost || r.totalCost || 0);
    const allCells = {
      date:           `<td style="padding:8px 12px;">${r.date||'—'}</td>`,
      time:           `<td style="padding:8px 12px;color:var(--muted);font-size:0.8rem;">${r.time||'—'}</td>`,
      orderid:        `<td style="padding:8px 12px;"><span style="color:var(--fire);font-weight:700;font-size:0.8rem;">${r.orderid||r.orderId||'—'}</span></td>`,
      purchaseids:    `<td style="padding:8px 12px;font-size:0.75rem;color:#666;">${r.purchaseids||r.purchaseIds||'—'}</td>`,
      dishname:       `<td style="padding:8px 12px;font-weight:600;">${r.dishname||r.dishName||'—'}</td>`,
      ingredientname: `<td style="padding:8px 12px;">${r.ingredientname||r.ingredientName||'—'}</td>`,
      ingredienttype: `<td style="padding:8px 8px;text-align:center;">${typeTag}</td>`,
      qty:            `<td style="padding:8px 8px;text-align:center;font-weight:700;">${r.qty||0}</td>`,
      unit:           `<td style="padding:8px 8px;text-align:center;color:var(--muted);">${r.unit||'—'}</td>`,
      unitcost:       `<td style="padding:8px 8px;text-align:right;">₹${unitcost.toFixed(2)}</td>`,
      totalcost:      `<td style="padding:8px 8px;text-align:right;font-weight:700;color:var(--fire);">₹${totalcost.toFixed(2)}</td>`,
      servedby:       `<td style="padding:8px 12px;color:var(--muted);font-size:0.82rem;">${r.servedby||r.servedBy||'—'}</td>`,
    };
    const visibleKeys = Object.keys(allCells).filter(k => _consumLogCols[k] !== false);
    const _snoTd = `<td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${_idx+1}</td>`;
    return `<tr style="border-bottom:1px solid #f0f0f0;">${_snoTd}${visibleKeys.map(k => allCells[k]).join('')}</tr>`;
  }).join('');

  // Summary
  const totalCost = filtered.reduce((s,r) => s+(parseFloat(r.totalcost||r.totalCost)||0), 0);
  const summary = document.getElementById('consumLogSummary');
  if(summary) {
    summary.style.display = 'block';
    summary.innerHTML = `<b>📊 Summary:</b> ${filtered.length} entries | Total Ingredient Cost: <b style="color:var(--fire);">₹${totalCost.toFixed(2)}</b>`;
  }
  } catch(e) { console.error('[SG] renderConsumptionLog:', e); }
}

async function renderRecipeDeduct() {
  try {
  const div = document.getElementById('recipeList');
  if(!div) return;
  const recipes = await sbGetRecipes();
  const menuItems = getMenuItems();
  const keys = Object.keys(recipes);
  if(!keys.length) {
    div.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);">No recipes set yet. Click "+ Set Dish Recipe" to start.</div>';
    return;
  }
  div.innerHTML = keys.map(dishId => {
    const dish = menuItems.find(m=>m.id==dishId);
    const recipe = recipes[dishId];
    return `<div style="background:#f9f7f5;border-radius:10px;padding:14px;margin-bottom:10px;border:1px solid #e8d5c8;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-weight:700;">${dish?dish.name:'Unknown Dish'}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="editRecipe('${dishId}')" class="act-btn act-edit">Edit</button>
          <button onclick="deleteRecipe('${dishId}')" class="act-btn act-delete">Delete</button>
        </div>
      </div>
      <div style="font-size:0.82rem;color:var(--muted);">
        ${recipe.map(r=>`<span style="background:#fff;border:1px solid #e8d5c8;border-radius:6px;padding:2px 8px;margin:2px;display:inline-block;">
          ${escHtml(r.name)}: ${r.qty} ${r.unit}
        </span>`).join('')}
      </div>
    </div>`;
  }).join('');
  } catch(_e) { console.error("[SG] renderRecipeDeduct:", _e); }
}

async function openRecipeSetup(dishId=null) {
  try {
  const menuItems = getMenuItems();
  const sel = document.getElementById('recipeDish');
  if(sel) {
    sel.innerHTML = '<option value="">-- Select Dish --</option>' +
      menuItems.map(m=>`<option value="${m.id}" ${m.id==dishId?'selected':''}>${m.name}</option>`).join('');
  }
  const recipes = await sbGetRecipes();
  const existing = dishId && recipes[dishId] ? recipes[dishId] : [];
  renderRecipeIngredients(existing);
  document.getElementById('recipeSetupModal').classList.add('open');
  } catch(_e) { console.error("[SG] openRecipeSetup:", _e); }
}

function editRecipe(dishId) {
  try {
  openRecipeSetup(dishId);
  } catch(_e) { console.error("[SG] editRecipe:", _e); }
}

async function deleteRecipe(dishId) {
  try {
  if(!confirm('Delete this recipe?')) return;
  const recipes = await sbGetRecipes();
  delete recipes[dishId];
  await sbSaveRecipes(recipes);
  renderRecipeDeduct();
  showToast('Recipe deleted');
  } catch(_e) { console.error("[SG] deleteRecipe:", _e); }
}

async function renderRecipeIngredients(existing=[]) {
  try {
  const div = document.getElementById('recipeIngredients');
  if(!div) return;
  // Use products + rawmats (which have 'name' field) instead of inv_stock
  const products = await getProducts();
  const rawmats = await getRawmats();
  const allItems = [
    ...products.map(p => ({name: p.name, id: p.id, type: 'product'})),
    ...rawmats.map(r => ({name: r.name, id: r.id, type: 'rawmat'}))
  ].filter(i => i.name); // remove undefined names
  const itemOpts = '<option value="">-- Select Item --</option>' +
    allItems.map(i=>`<option value="${i.name}">${i.name}</option>`).join('');

  div.innerHTML = (existing.length ? existing : [{}]).map((ing, idx) => `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:8px;" id="ingRow_${idx}">
      <select onchange="" style="padding:8px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;" id="ingName_${idx}">
        ${itemOpts.replace(`value="${ing.name||''}"`, `value="${ing.name||''}" selected`)}
      </select>
      <input type="number" placeholder="Qty" value="${ing.qty||''}" min="0" step="0.01"
        id="ingQty_${idx}" style="padding:8px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
      <select id="ingUnit_${idx}" style="padding:8px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
        <option value="kg" ${ing.unit==='kg'?'selected':''}>Kg</option>
        <option value="gram" ${ing.unit==='gram'?'selected':''}>Gram</option>
        <option value="litre" ${ing.unit==='litre'?'selected':''}>Litre</option>
        <option value="ml" ${ing.unit==='ml'?'selected':''}>ML</option>
        <option value="piece" ${ing.unit==='piece'?'selected':''}>Piece</option>
        <option value="bottle" ${ing.unit==='bottle'?'selected':''}>Bottle</option>
        <option value="packet" ${ing.unit==='packet'?'selected':''}>Packet</option>
      </select>
      <button onclick="removeIngRow(${idx})" style="background:#fce4ec;color:#c62828;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">✕</button>
    </div>`).join('');
  } catch(_e) { console.error("[SG] renderRecipeIngredients:", _e); }
}

async function addRecipeIngredient() {
  try {
  const div = document.getElementById('recipeIngredients');
  if(!div) return;
  const rows = div.querySelectorAll('[id^="ingRow_"]');
  const idx = rows.length;
  // Get same item options as renderRecipeIngredients
  const products = await getProducts();
  const rawmats = await getRawmats();
  const allItems = [
    ...products.map(p => ({name: p.name})),
    ...rawmats.map(r => ({name: r.name}))
  ].filter(i => i.name);
  const itemOpts = '<option value="">-- Select Item --</option>' +
    allItems.map(i=>`<option value="${i.name}">${i.name}</option>`).join('');
  const newRow = document.createElement('div');
  newRow.id = 'ingRow_' + idx;
  newRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:8px;';
  newRow.innerHTML = `
    <select id="ingName_${idx}" style="padding:8px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
      ${itemOpts}
    </select>
    <input type="number" placeholder="Qty" min="0" step="0.01" id="ingQty_${idx}"
      style="padding:8px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
    <select id="ingUnit_${idx}" style="padding:8px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;">
      <option value="kg">Kg</option><option value="gram">Gram</option>
      <option value="litre">Litre</option><option value="ml">ML</option>
      <option value="piece">Piece</option><option value="bottle">Bottle</option>
      <option value="packet">Packet</option>
    </select>
    <button onclick="removeIngRow(${idx})" style="background:#fce4ec;color:#c62828;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;">✕</button>`;
  div.appendChild(newRow);
  } catch(_e) { console.error("[SG] addRecipeIngredient:", _e); }
}

function removeIngRow(idx) {
  try {
  const row = document.getElementById('ingRow_' + idx);
  if(row) row.remove();
  } catch(_e) { console.error("[SG] removeIngRow:", _e); }
}

async function saveRecipe() {
  try {
  const dishId = document.getElementById('recipeDish').value;
  if(!dishId) { showToast('Please select a dish','error'); return; }
  const div = document.getElementById('recipeIngredients');
  const rows = div.querySelectorAll('[id^="ingRow_"]');
  const ingredients = [];
  rows.forEach((row, i) => {
    const nameEl = document.getElementById('ingName_' + i);
    const qtyEl = document.getElementById('ingQty_' + i);
    const unitEl = document.getElementById('ingUnit_' + i);
    if(nameEl && qtyEl && nameEl.value && qtyEl.value) {
      ingredients.push({
        name: nameEl.value,
        qty: parseFloat(qtyEl.value),
        unit: unitEl ? unitEl.value : 'piece'
      });
    }
  });
  if(!ingredients.length) { showToast('Add at least one ingredient','error'); return; }
  const recipes = await sbGetRecipes();
  recipes[dishId] = ingredients;
  await sbSaveRecipes(recipes);
  closeModal('recipeSetupModal');
  renderRecipeDeduct();
  showToast('✅ Recipe saved!');
  } catch(_e) { console.error("[SG] saveRecipe:", _e); }
}

// Auto-deduct when order is placed (for Mid/Large)
// Purchase unit per ingredient
const _purchaseUnitMap = {
  'R002': 'kg',
  'R005': 'kg',
  'R008': 'L',
  'R009': 'kg',
  'R011': 'L',
  'R012': 'kg',
  'R013': 'kg',
  'R015': 'kg',
  'R016': 'kg',
  'R017': 'g',
  'RM002': 'kg',
  'RM005': 'kg',
  'RM007': 'kg',
  'RM008': 'kg',
  'RM009': 'kg',
  'RM010': 'kg',
  'RM012': 'kg',
  'RM016': 'piece',
  'RM017': 'kg',
  'RM020': 'kg',
  'R018': 'kg',
  'R019': 'kg',
  'R020': 'g',
  'R021': 'g',
  'R022': 'g',
  'R023': 'ml',
  'P001': 'packet',
  'P003': 'bottle',
  'P004': 'bag',
  'P006': 'bottle',
  'P007': 'packet',
  'P010': 'packet',
  'P014': 'bottle',
  'P018': 'packet',
  'P020': 'bag',
  'P021': 'bag',
  'P022': 'bag',
  'P023': 'packet',
  'P024': 'packet',
  'P025': 'bag',
  'P026': 'bottle',
  'P027': 'bag',
  'P028': 'can'
};

// Average ingredient cost per unit (calculated from purchase history)
const _ingredientCostMap = {
  'R016': 246.67,
  'R011': 57.34,
  'P018': 129.79,
  'R018': 82.81,
  'RM017': 60.0,
  'R019': 92.14,
  'RM012': 80.0,
  'R023': 200.0,
  'R005': 31.08,
  'R008': 180.0,
  'R013': 75.85,
  'RM009': 120.0,
  'RM005': 35.0,
  'RM008': 180.0,
  'R020': 1.2,
  'R021': 0.8,
  'R022': 0.15,
  'P020': 18.0,
  'P021': 25.0,
  'P022': 22.0,
  'P023': 35.0,
  'P024': 20.0,
  'P025': 28.0,
  'P026': 180.0,
  'P027': 42.0,
  'P028': 95.0,
  'P007': 50.0,
  'R009': 180.0,
  'P004': 2500.0,
  'P001': 100.0,
  'P003': 500.0,
  'R015': 450.0,
  'P006': 75.0,
  'P014': 100.0,
  'R002': 35.0,
  'P010': 100.0,
  'R017': 0.4,
  'R012': 45.0
};

// Get latest avg cost from Supabase purchases (live calculation)
async function getIngredientCost(itemId) {
  try {
  if(_ingredientCostMap[itemId]) return _ingredientCostMap[itemId];
  const purchases = await getPurchases();
  const itemPurchases = purchases.filter(p => {
    const pid = p.itemId || p["itemId"] || '';
    return pid === itemId && parseFloat(p.qty||0) > 0;
  });
  if(!itemPurchases.length) return 0;

  // basePricePerUnit is already per gram/ml
  const withBPP = itemPurchases.filter(p => parseFloat(p.basePricePerUnit||p["basePricePerUnit"]||0) > 0);
  if(withBPP.length) {
    const avg = withBPP.reduce((s,p) => s + parseFloat(p.basePricePerUnit||p["basePricePerUnit"]||0), 0) / withBPP.length;
    return Math.round(avg * 10000) / 10000;
  }

  // Fallback: calculate from price + totalWt
  let totalCostGram = 0, totalGrams = 0;
  itemPurchases.forEach(p => {
    const price    = parseFloat(p.price||0);
    const qty      = parseFloat(p.qty||1);
    const totalWt  = p.totalWt || p["totalWt"] || '';
    let grams = qty;
    if(totalWt.includes('kg')) grams = qty * 1000;
    else if(totalWt.includes(' L')) grams = qty * 1000;
    totalCostGram += price;
    totalGrams    += grams;
  });
  return totalGrams > 0 ? Math.round((totalCostGram/totalGrams) * 10000) / 10000 : 0;
  } catch(e) { return 0; }
}

// ── FIFO Cost Helper ─────────────────────────────────────────
// Fetch the item's purchases from Supabase in FIFO order
async function getFIFOCost(itemId, neededQty) {
  try {
  // Fetch purchases from Supabase in FIFO order
  const { data: purs, error } = await _supabase
    .from('inv_purchases')
    .select('id, "itemId", "basePricePerUnit", "remainingQty", qty, price, "totalWt", date')
    .eq('itemId', itemId)
    .gt('remainingQty', 0)
    .order('date', { ascending: true });

  if(error || !purs || !purs.length) {
    const avgCost = await getIngredientCost(itemId);
    const totalCost = Math.round(avgCost * neededQty * 100) / 100;
    return { unitCost: avgCost, totalCost, purchaseIds: [], usedPurchases: [] };
  }

  let remainingNeeded = neededQty;
  let totalCost = 0;
  const purchaseIds = [];
  const usedPurchases = [];

  for(const pur of purs) {
    if(remainingNeeded <= 0) break;
    const available    = parseFloat(pur.remainingQty) || 0;
    const pricePerUnit = parseFloat(pur.basePricePerUnit) || 0;
    const useQty       = Math.min(available, remainingNeeded);
    totalCost         += useQty * pricePerUnit;
    purchaseIds.push(pur.id);
    usedPurchases.push({ id: pur.id, useQty, newRemaining: available - useQty });
    remainingNeeded   -= useQty;
  }

  if(remainingNeeded > 0) {
    const avgCost = await getIngredientCost(itemId);
    totalCost += remainingNeeded * avgCost;
  }

  const unitCost = neededQty > 0 ? Math.round((totalCost / neededQty) * 10000) / 10000 : 0;
  totalCost = Math.round(totalCost * 100) / 100;
  return { unitCost, totalCost, purchaseIds, usedPurchases };
  } catch(e) {
    console.error('[SG] getFIFOCost:', e);
    try {
      const avgCost = await getIngredientCost(itemId);
      const totalCost = Math.round(avgCost * neededQty * 100) / 100;
      return { unitCost: avgCost, totalCost, purchaseIds: [], usedPurchases: [] };
    } catch(e2) {
      return { unitCost: 0, totalCost: 0, purchaseIds: [], usedPurchases: [] };
    }
  }
}
// Convert recipe unit to base unit (gram/ml)
function convertToBaseQty(qty, recipeUnit) {
  const u = (recipeUnit||'').toLowerCase();
  if(u === 'kg') return qty * 1000;
  if(u in {'l':1,'liter':1,'litre':1,'ltr':1}) return qty * 1000;
  return qty; // gram, ml, g — already base unit
}

async function autoDeductStockForOrder(orderItems, orderId, servedBy) {
  try {
  const settings = (_settingsCache['sg_settings'])||{};
  const restType = settings.restaurantType || 'small';
  if(restType === 'small') return;

  // Duplicate check — if the orderId has already been consumed, skip it
  try {
    const { data: existing, error: dupErr } = await _supabase
      .from('inv_consumptions')
      .select('id')
      .eq('orderid', orderId)
      .limit(1);
    if(!dupErr && existing && existing.length > 0) {
      console.log('[SG] autoDeduct skipped — already consumed for order:', orderId);
      return;
    }
    if(dupErr) console.warn('[SG] duplicate check error (proceeding):', dupErr.message);
  } catch(e) { console.warn('[SG] duplicate check failed (proceeding):', e); }

  const recipes  = await sbGetRecipes();
  const _prods   = await getProducts();
  const _rawmts  = await getRawmats();
  const stockMap = await getStock();

  // Build a name → id mapping from the menu items
  const menuItems = await sbGetMenuItems();
  const nameToId = {};
  menuItems.forEach(m => {
    if(m.name && m.id) nameToId[(m.name||'').toLowerCase().trim()] = String(m.id);
  });

  // Recipe lookup helper — id se ya name→id se
  function getRecipe(item) {
    // Direct id match
    if(item.id && recipes[item.id]) return recipes[item.id];
    if(item.id && recipes[String(item.id)]) return recipes[String(item.id)];
    // Name se id dhundo
    if(item.name) {
      const mappedId = nameToId[(item.name||'').toLowerCase().trim()];
      if(mappedId && recipes[mappedId]) return recipes[mappedId];
    }
    // Direct name match (fallback)
    if(item.name && recipes[item.name]) return recipes[item.name];
    return null;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN');
  const timeStr = now.toLocaleTimeString('en-IN');

  let changed = false;
  const updatedEntries = [];
  const consumptionLogs = [];
  const allPurchaseUpdates = []; // FIFO remainingQty updates

  for(const item of orderItems) {
    const recipe = getRecipe(item);
    if(!recipe || !recipe.length) {
      console.warn('[SG] No recipe found for:', item.name, item.id);
      continue;
    }

    for(const ing of recipe) {
      const prod = _prods.find(p => (p.name||'').toLowerCase() === (ing.name||'').toLowerCase());
      const raw  = _rawmts.find(r => (r.name||'').toLowerCase() === (ing.name||'').toLowerCase());
      const ingItem = prod || raw;
      if(!ingItem) continue;

      const ingType = prod ? (prod.type||'solid') : 'rawmat';
      const stockKey = ingType + '_' + ingItem.id;
      const stockEntry = stockMap[stockKey];
      if(!stockEntry) continue;

      const deductQty = (parseFloat(ing.qty)||0) * (parseFloat(item.qty)||1);
      stockEntry.qty = Math.max(0, (parseFloat(stockEntry.qty)||0) - deductQty);
      updatedEntries.push(stockEntry);
      changed = true;

      // Convert recipe qty to base unit (gram/ml)
      const baseDeductQty = convertToBaseQty(deductQty, ing.unit);

      // FIFO cost calculation from Supabase purchases
      const { unitCost, totalCost, purchaseIds, usedPurchases } = await getFIFOCost(ingItem.id, baseDeductQty);

      // Track purchase remainingQty updates
      usedPurchases.forEach(u => allPurchaseUpdates.push(u));

      // Consumption log entry
      consumptionLogs.push({
        id:              'CON_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
        orderid:         orderId || '—',
        dishid:          item.id || '—',
        dishname:        item.name || '—',
        ingredientname:  ingItem.name,
        ingredientid:    ingItem.id,
        ingredienttype:  ingType,
        qty:             deductQty,
        unit:            ing.unit || '',
        unitcost:        unitCost,
        totalcost:       totalCost,
        purchaseids:     purchaseIds.join(','),
        date:            dateStr,
        time:            timeStr,
        servedby:        servedBy || 'Unknown',
        createdat:       now.toISOString()
      });
    }
  }

  if(changed) {
    await sbUpsertInv('inv_stock', updatedEntries, 'stock_key');
    invInvalidate('stock');

    // Update FIFO remainingQty in purchases
    if(allPurchaseUpdates.length) {
      for(const upd of allPurchaseUpdates) {
        try {
          await _supabase.from('inv_purchases')
            .update({ remainingQty: Math.max(0, upd.newRemaining) })
            .eq('id', upd.id);
        } catch(e) { console.error('[SG] remainingQty update fail:', upd.id, e); }
      }
    }

    // Save consumption logs
    if(consumptionLogs.length) {
      try {
        await _supabase.from('inv_consumptions').insert(consumptionLogs);
        const totalCost = consumptionLogs.reduce((s,l) => s+(l.totalCost||0), 0);
        console.log('[SG] Consumption log saved:', consumptionLogs.length, 'entries, total: ₹'+totalCost.toFixed(2));
      } catch(e) {
        console.error('[SG] Consumption log save failed:', e);
      }
    }
  }
  } catch(_e) { console.error("[SG] autoDeductStockForOrder:", _e); }
}

// ===== FEATURE 31: AUTO STOCK ALERT =====

async function checkStockAlerts() {
  try {
  const settings = (_settingsCache['sg_settings'])||{};
  const restType = settings.restaurantType || 'small';
  if(restType === 'small') return;
  const stock = await sbGetStock();
  const alerts = stock.filter(s => {
    const qty = parseFloat(s.quantity)||0;
    const minQty = parseFloat(s.minQuantity)||0;
    return minQty > 0 && qty <= minQty;
  });
  if(alerts.length) {
    const alertDiv = document.getElementById('stockAlertBanner');
    if(alertDiv) {
      alertDiv.style.display = 'block';
      alertDiv.innerHTML = `<b>⚠️ Low Stock Alert!</b> ${alerts.map(a=>a.name+' ('+a.quantity+' '+a.unit+' left)').join(', ')}`;
    }
  }
  } catch(_e) { console.error("[SG] checkStockAlerts:", _e); }
}

// ===== FEATURE 32: EMERGENCY STOCK ENTRY =====

// ===== EXPIRY COMING SOON =====

let _activeExpiryTab = 'products';

function switchExpiryTab(tab) {
  _activeExpiryTab = tab;
  const prodBtn  = document.getElementById('expiryTab-products');
  const rawBtn   = document.getElementById('expiryTab-rawmat');
  const prodPanel = document.getElementById('expiryPanel-products');
  const rawPanel  = document.getElementById('expiryPanel-rawmat');

  if(prodBtn) {
    prodBtn.style.background   = tab==='products' ? 'var(--fire)' : '#f0ebe5';
    prodBtn.style.color        = tab==='products' ? '#fff' : 'var(--muted)';
    prodBtn.style.borderBottom = tab==='products' ? '3px solid var(--fire)' : '3px solid transparent';
  }
  if(rawBtn) {
    rawBtn.style.background   = tab==='rawmat' ? '#2e7d32' : '#f0ebe5';
    rawBtn.style.color        = tab==='rawmat' ? '#fff' : 'var(--muted)';
    rawBtn.style.borderBottom = tab==='rawmat' ? '3px solid #2e7d32' : '3px solid transparent';
  }
  if(prodPanel) prodPanel.style.display = tab==='products' ? 'block' : 'none';
  if(rawPanel)  rawPanel.style.display  = tab==='rawmat'   ? 'block' : 'none';

  if(tab==='products') renderExpiryProducts();
  else                 renderExpiryRawmat();
}

function parseExpiryDate(d) {
  if(!d) return null;
  d = String(d).trim();
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const p = d.split('/');
    return new Date(p[2]+'-'+p[1]+'-'+p[0]);
  }
  if(/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d);
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
}

function daysLeft(expDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = expDate - today;
  return Math.ceil(diff / (1000*60*60*24));
}

function daysLeftBadge(days) {
  if(days <= 7)  return `<span style="background:#fdecea;color:#c62828;padding:3px 10px;border-radius:12px;font-weight:700;font-size:0.78rem;">${days}d</span>`;
  if(days <= 30) return `<span style="background:#fff3e0;color:#e65100;padding:3px 10px;border-radius:12px;font-weight:700;font-size:0.78rem;">${days}d</span>`;
  return `<span style="background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:12px;font-weight:700;font-size:0.78rem;">${days}d</span>`;
}

async function renderExpiryProducts() {
  try {
    const tbody = document.getElementById('expiryProductsBody');
    const countEl = document.getElementById('expiryProductsCount');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted);">⏳ Loading...</td></tr>';

    const purchases = await getPurchases();
    const today = new Date(); today.setHours(0,0,0,0);

    // Products (solid/liquid type) with future expiry — NOT expired yet
    const rows = purchases
      .filter(p => p.itemType === 'solid' || p.itemType === 'liquid' || p.itemType === 'product')
      .filter(p => p.expDate && !isExpiredByDate(p.expDate))
      .map(p => ({ ...p, _expDate: parseExpiryDate(p.expDate), _days: daysLeft(parseExpiryDate(p.expDate)) }))
      .sort((a,b) => a._expDate - b._expDate);

    if(countEl) countEl.textContent = rows.length + ' items';

    if(!rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--muted);">No future-expiry product found</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((p,idx) => `
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${idx+1}</td>
        <td style="padding:8px 12px;font-size:0.82rem;color:var(--muted);">${p.date||'—'}</td>
        <td style="padding:8px 12px;font-weight:600;color:var(--fire);">${p.id||'—'}</td>
        <td style="padding:8px 12px;font-size:0.82rem;">${p.itemId||'—'}</td>
        <td style="padding:8px 12px;font-weight:600;">${escHtml(p.itemName||'—')}</td>
        <td style="padding:8px 8px;text-align:center;">
          <span style="background:#e3f2fd;color:#1565c0;padding:3px 8px;border-radius:8px;font-size:0.78rem;font-weight:600;">${(p.itemType||'').toUpperCase()}</span>
        </td>
        <td style="padding:8px 8px;text-align:center;font-weight:700;">${p.qty||'—'}</td>
        <td style="padding:8px 12px;font-size:0.82rem;">${p.mfgDate||p.mfg_date||'—'}</td>
        <td style="padding:8px 12px;font-size:0.82rem;font-weight:600;color:#c62828;">${p.expDate||'—'}</td>
        <td style="padding:8px 8px;text-align:center;">${daysLeftBadge(p._days)}</td>
      </tr>`).join('');
  } catch(e) { console.error('[SG] renderExpiryProducts:', e); }
}

async function renderExpiryRawmat() {
  try {
    const tbody = document.getElementById('expiryRawmatBody');
    const countEl = document.getElementById('expiryRawmatCount');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted);">⏳ Loading...</td></tr>';

    const purchases = await getPurchases();
    const today = new Date(); today.setHours(0,0,0,0);

    // Raw materials with future expiry — NOT expired yet
    const rows = purchases
      .filter(p => p.itemType === 'rawmat' || p.itemType === 'raw')
      .filter(p => p.expDate && !isExpiredByDate(p.expDate))
      .map(p => ({ ...p, _expDate: parseExpiryDate(p.expDate), _days: daysLeft(parseExpiryDate(p.expDate)) }))
      .sort((a,b) => a._expDate - b._expDate);

    if(countEl) countEl.textContent = rows.length + ' items';

    if(!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--muted);">No future-expiry raw material found</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((p,idx) => `
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="position:sticky;left:0;z-index:1;background:#fff;border-right:2px solid #e8d5c8;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${idx+1}</td>
        <td style="padding:8px 12px;font-size:0.82rem;color:var(--muted);">${p.date||'—'}</td>
        <td style="padding:8px 12px;font-weight:600;color:var(--fire);">${p.id||'—'}</td>
        <td style="padding:8px 12px;font-size:0.82rem;">${p.itemId||'—'}</td>
        <td style="padding:8px 12px;font-weight:600;">${escHtml(p.itemName||'—')}</td>
        <td style="padding:8px 8px;text-align:center;">
          <span style="background:#f3e5f5;color:#6a1b9a;padding:3px 8px;border-radius:8px;font-size:0.78rem;font-weight:600;">${(p.itemType||'').toUpperCase()}</span>
        </td>
        <td style="padding:8px 8px;text-align:center;font-weight:700;">${p.qty||'—'}</td>
        <td style="padding:8px 12px;font-size:0.82rem;font-weight:600;color:#c62828;">${p.expDate||'—'}</td>
        <td style="padding:8px 8px;text-align:center;">${daysLeftBadge(p._days)}</td>
      </tr>`).join('');
  } catch(e) { console.error('[SG] renderExpiryRawmat:', e); }
}

// ===== EXPIRED PENDING WASTE ENTRY =====

function isExpiredByDate(expDateStr) {
  if(!expDateStr) return false;
  // Parse date — support DD/MM/YYYY and YYYY-MM-DD
  let day, month, year;
  const s = String(expDateStr).trim();
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const p = s.split('/');
    day = parseInt(p[0]); month = parseInt(p[1]); year = parseInt(p[2]);
  } else if(/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const p = s.split('-');
    year = parseInt(p[0]); month = parseInt(p[1]); day = parseInt(p[2]);
  } else {
    const d = new Date(s);
    if(isNaN(d)) return false;
    day = d.getDate(); month = d.getMonth()+1; year = d.getFullYear();
  }
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth()+1;
  const cd = now.getDate();

  // Year check
  if(cy > year) return true;
  if(cy < year) return false;
  // cy === year → Month check
  if(cm > month) return true;
  if(cm < month) return false;
  // cm === month → Day check
  if(cd > day) return true;
  return false; // cd === day or cd < day → not expired
}

function daysOver(expDateStr) {
  const s = String(expDateStr).trim();
  let expDate;
  if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const p = s.split('/');
    expDate = new Date(p[2]+'-'+p[1]+'-'+p[0]);
  } else {
    expDate = new Date(s);
  }
  const today = new Date(); today.setHours(0,0,0,0);
  expDate.setHours(0,0,0,0);
  return Math.floor((today - expDate) / (1000*60*60*24));
}

async function renderExpiredPending() {
  try {
    const tbody   = document.getElementById('expiredPendingBody');
    const countEl = document.getElementById('expiredPendingCount');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--muted);">⏳ Loading...</td></tr>';

    const purchases = await getPurchases();
    const wastes    = await getWastes();

    let consumptions = [];
    try {
      const { data: cdata } = await _supabase
        .from('inv_consumptions')
        .select('itemId,itemType,qty')
        .limit(10000);
      if(cdata) consumptions = cdata;
    } catch(e) { console.warn('[SG] consumptions fetch in expiredPending:', e); }

    const consumedMap = {};
    consumptions.forEach(c => {
      const key = (c.itemType||'') + '_' + (c.itemId||'');
      consumedMap[key] = (consumedMap[key] || 0) + parseFloat(c.qty || 0);
    });

    const wastedMap = {};
    wastes.forEach(w => {
      const key = (w.type||w.itemType||'') + '_' + (w.itemId||'');
      wastedMap[key] = (wastedMap[key] || 0) + parseFloat(w.qty || 0);
    });

    const grouped = {};
    purchases
      .filter(p => (p.itemType === 'rawmat' || p.itemType === 'raw') && isExpiredByDate(p.expDate))
      .forEach(p => {
        const key = (p.itemType||'') + '_' + (p.itemId||'');
        if(!grouped[p.itemId]) {
          grouped[p.itemId] = { ...p, _totalPurchased: 0, _key: key };
        }
        grouped[p.itemId]._totalPurchased += parseFloat(p.qty || 0);
        const existDate = parseExpiryDate(grouped[p.itemId].date) || new Date(0);
        const newDate   = parseExpiryDate(p.date) || new Date(0);
        if(newDate > existDate) {
          const saved = grouped[p.itemId]._totalPurchased;
          const savedKey = grouped[p.itemId]._key;
          grouped[p.itemId] = { ...grouped[p.itemId], ...p, _totalPurchased: saved, _key: savedKey };
        }
      });

    const rows = Object.values(grouped)
      .map(p => {
        const consumed  = consumedMap[p._key] || 0;
        const wasted    = wastedMap[p._key] || 0;
        const remaining = p._totalPurchased - consumed - wasted;
        return { ...p, _remaining: remaining, _daysOver: daysOver(p.expDate) };
      })
      .filter(p => p._remaining > 0)
      .sort((a,b) => b._daysOver - a._daysOver);

    if(countEl) countEl.textContent = rows.length + ' items expired';

    if(!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:24px;color:#2e7d32;font-weight:600;">✅ No expired raw material is pending</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((p,idx) => {
      const safeP = encodeURIComponent(JSON.stringify({
        id: p.id, itemId: p.itemId, itemName: p.itemName,
        itemType: p.itemType, expDate: p.expDate, mfgDate: p.mfgDate||p.mfg_date||'',
        _remaining: p._remaining
      }));
      return `
      <tr style="border-bottom:1px solid #fdecea;background:${p._daysOver > 30 ? '#fff8f8' : '#fff'};">
        <td style="position:sticky;left:0;z-index:1;background:${p._daysOver > 30 ? '#fff8f8' : '#fff'};border-right:2px solid #f5c6c6;text-align:center;font-weight:700;color:var(--muted);font-size:0.82rem;">${idx+1}</td>
        <td style="padding:9px 12px;font-size:0.82rem;color:var(--muted);">${p.date||'—'}</td>
        <td style="padding:9px 12px;font-weight:600;color:var(--fire);font-size:0.82rem;">${p.id||'—'}</td>
        <td style="padding:9px 12px;font-size:0.82rem;color:#555;">${p.itemId||'—'}</td>
        <td style="padding:9px 12px;font-weight:700;">${escHtml(p.itemName||'—')}</td>
        <td style="padding:9px 8px;text-align:center;">
          <span style="background:#f3e5f5;color:#6a1b9a;padding:3px 8px;border-radius:8px;font-size:0.75rem;font-weight:600;">${(p.itemType||'').toUpperCase()}</span>
        </td>
        <td style="padding:9px 8px;text-align:center;font-weight:700;color:#c62828;">${p._remaining.toFixed(2)}</td>
        <td style="padding:9px 12px;font-size:0.82rem;color:var(--muted);">${p.mfgDate||p.mfg_date||'—'}</td>
        <td style="padding:9px 12px;font-size:0.82rem;font-weight:600;color:#c62828;">${p.expDate||'—'}</td>
        <td style="padding:9px 8px;text-align:center;">
          <span style="background:#fdecea;color:#b71c1c;padding:4px 10px;border-radius:12px;font-weight:700;font-size:0.8rem;">+${p._daysOver}d</span>
        </td>
        <td style="padding:9px 8px;text-align:center;">
          <button onclick="openWasteFromExpired('${safeP}')"
            style="background:#e74c3c;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.78rem;">
            🗑️ Waste
          </button>
        </td>
      </tr>`;
    }).join('');

  } catch(e) { console.error('[SG] renderExpiredPending:', e); }
}

async function openWasteFromExpired(encodedP) {
  try {
    const p = JSON.parse(decodeURIComponent(encodedP));

    // Waste tab open
    showInvTab('waste');

    // Short wait — for the DOM update
    await new Promise(r => setTimeout(r, 250));

    // Date — aaj
    const todayStr = new Date().toISOString().split('T')[0];
    const wDate = document.getElementById('wDate');
    if(wDate) wDate.value = todayStr;

    // Set the Item Type
    const wItemType = document.getElementById('wItemType');
    if(wItemType) wItemType.value = p.itemType || 'rawmat';

    // Load the items — await
    await loadWasteItems();

    // Item select
    const wItem = document.getElementById('wItem');
    if(wItem) {
      wItem.value = p.itemId || '';
      // If the option is not found, add it manually
      if(!wItem.value && p.itemId) {
        const opt = document.createElement('option');
        opt.value = p.itemId;
        opt.textContent = p.itemName || p.itemId;
        opt.selected = true;
        wItem.appendChild(opt);
        wItem.value = p.itemId;
      }
    }

    // Reason = Expired
    const wReason = document.getElementById('wReason');
    if(wReason) wReason.value = 'Expired';

    // Qty blank
    const wQty = document.getElementById('wQty');
    if(wQty) { wQty.value = ''; }

    // Notes
    const wNotes = document.getElementById('wNotes');
    if(wNotes) wNotes.value = `Expired item | Purchase ID: ${p.id||'—'} | Exp: ${p.expDate||'—'} | Remaining: ${p._remaining||'—'}`;

    // Cost blank
    const wCost = document.getElementById('wCost');
    if(wCost) wCost.value = '';

    // Modal open - use openModal so that closeModal works
    openModal('invWasteModal');

    // Focus qty
    if(wQty) wQty.focus();

    showToast('✅ Waste form ready — just fill in the quantity');
  } catch(e) { console.error('[SG] openWasteFromExpired:', e); }
}

async function renderEmergencyStock() {
  try {
  const div = document.getElementById('emergencyStockList');
  if(!div) return;
  const isManager = currentUser?.role==='Admin' || currentUser?.perms?.includes('Inventory - Emergency Entries');
  if(!isManager) {
    div.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);">⚠️ Only Manager/Supervisor can access this</div>';
    return;
  }
  const entries = await sbGetEmergency();
  if(!entries.length) {
    div.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);">No emergency entries yet</div>';
    return;
  }
  // Group pending and reconciled
  const pending = entries.filter(e=>!e.reconciled);
  const done = entries.filter(e=>e.reconciled);
  let html = '';
  if(pending.length) {
    html += '<div style="font-weight:700;margin-bottom:8px;color:#c62828;">🔴 Pending Reconciliation ('+pending.length+')</div>';
    html += pending.map((e,i) => renderEmergencyRow(e, i, entries)).join('');
  }
  if(done.length) {
    html += '<div style="font-weight:700;margin:16px 0 8px;color:#2e7d32;">✅ Reconciled ('+done.length+')</div>';
    html += done.map((e,i) => renderEmergencyRow(e, i, entries, true)).join('');
  }
  div.innerHTML = html;
  } catch(_e) { console.error("[SG] renderEmergencyStock:", _e); }
}

function renderEmergencyRow(e, i, allEntries, done=false) {
  try {
  return `<div style="background:${done?'#f9f9f9':'#fff8e1'};border-radius:10px;padding:14px;margin-bottom:10px;border:1px solid ${done?'#ddd':'#ffe082'};">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-weight:700;font-size:0.95rem;">${e.type==='packaged'?'📦':'🥬'} ${e.name}</div>
        <div style="font-size:0.8rem;color:var(--muted);">
          ${e.batch?'Batch: '+e.batch+' • ':''}
          ${e.supplier?'Supplier: '+e.supplier+' • ':''}
          ${e.purchaseDate?'Purchase: '+e.purchaseDate+' • ':''}
          Qty: ${e.qty} ${e.unit}
        </div>
        <div style="font-size:0.78rem;color:var(--muted);">
          🕐 ${e.autoDateTime} • 👤 ${e.takenBy}
        </div>
        <div style="font-size:0.78rem;color:var(--muted);">Reason: ${e.reason}</div>
      </div>
      ${!done ? `<button onclick="openEndOfDay('${e.id}')" 
        style="background:#2e7d32;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.82rem;">
        End of Day ▶
      </button>` : `<span style="color:#2e7d32;font-weight:700;">✅ Done</span>`}
    </div>
    ${e.usedQty ? `<div style="margin-top:8px;font-size:0.82rem;background:#e8f5e9;border-radius:6px;padding:6px 10px;">
      Used: ${e.usedQty} ${e.unit} → Stock | Wasted: ${e.wastedQty||0} ${e.unit} → Waste
    </div>` : ''}
  </div>`;
  } catch(_e) { console.error("[SG] renderEmergencyRow:", _e); }
}

function openEmergencyEntry() {
  try {
  const isManager = currentUser?.role==='Admin' || currentUser?.perms?.includes('Inventory - Emergency Entries');
  if(!isManager) { showToast('Only Manager/Supervisor can use this','error'); return; }
  // Set auto date time
  const now = new Date();
  const dtStr = now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const dtEl = document.getElementById('emergencyAutoDateTime');
  if(dtEl) dtEl.textContent = dtStr;
  // Reset form
  ['emergencyName','emergencyBatch','emergencySupplier','emergencyTakenBy','emergencyReason'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value='';
  });
  const qtyEl = document.getElementById('emergencyQty'); if(qtyEl) qtyEl.value='';
  document.getElementById('emergencyType').value = 'packaged';
  setEmergencyType('packaged');
  document.getElementById('emergencyStockModal').classList.add('open');
  } catch(_e) { console.error("[SG] openEmergencyEntry:", _e); }
}

function setEmergencyType(type) {
  try {
  document.getElementById('emergencyType').value = type;
  const pkgBtn = document.getElementById('typePackaged');
  const rawBtn = document.getElementById('typeRawmat');
  if(type==='packaged') {
    pkgBtn.style.background = 'var(--fire)'; pkgBtn.style.color = '#fff'; pkgBtn.style.borderColor = 'var(--fire)';
    rawBtn.style.background = '#fff'; rawBtn.style.color = '#333'; rawBtn.style.borderColor = '#ddd';
  } else {
    rawBtn.style.background = 'var(--fire)'; rawBtn.style.color = '#fff'; rawBtn.style.borderColor = 'var(--fire)';
    pkgBtn.style.background = '#fff'; pkgBtn.style.color = '#333'; pkgBtn.style.borderColor = '#ddd';
  }
  } catch(_e) { console.error("[SG] setEmergencyType:", _e); }
}

function toggleEmergencyFields() {
  try {
  const batch = document.getElementById('emergencyBatch').value.trim();
  const section = document.getElementById('emergencySupplierSection');
  if(section) section.style.display = batch ? 'none' : 'block';
  } catch(_e) { console.error("[SG] toggleEmergencyFields:", _e); }
}

async function saveEmergencyEntry() {
  try {
  const type = document.getElementById('emergencyType').value;
  const name = document.getElementById('emergencyName').value.trim();
  const batch = document.getElementById('emergencyBatch').value.trim();
  const supplier = document.getElementById('emergencySupplier').value.trim();
  const purchaseDate = document.getElementById('emergencyPurchaseDate').value;
  const qty = document.getElementById('emergencyQty').value;
  const unit = document.getElementById('emergencyUnit').value;
  const takenBy = document.getElementById('emergencyTakenBy').value.trim();
  const reason = document.getElementById('emergencyReason').value.trim();
  const autoDateTime = document.getElementById('emergencyAutoDateTime').textContent;

  if(!name) { showToast('Product name required','error'); return; }
  if(!qty) { showToast('Quantity required','error'); return; }
  if(!unit) { showToast('Unit required','error'); return; }
  if(!takenBy) { showToast('Taken By required','error'); return; }
  if(!reason) { showToast('Reason required','error'); return; }
  if(!batch && !supplier) { showToast('Supplier name required (no batch number)','error'); return; }
  if(!batch && !purchaseDate) { showToast('Purchase date required (no batch number)','error'); return; }

  const entry = {
    id: 'ESE_' + Date.now(),
    type, name, batch, supplier, purchaseDate,
    qty: parseFloat(qty), unit, takenBy, reason,
    autoDateTime, reconciled: false,
    createdAt: new Date().toISOString()
  };
  const entries = await sbGetEmergency();
  entries.unshift(entry);
  await sbUpsertInv('sg_emergency_stock',[entry]).catch(e=>console.error('saveEmergency fail:',e));

  invInvalidate('emergency');
  closeModal('emergencyStockModal');
  renderEmergencyStock();
  showToast('✅ Emergency entry saved!');
  } catch(_e) { console.error("[SG] saveEmergencyEntry:", _e); }
}

async function openEndOfDay(entryId) {
  try {
  const entries = await sbGetEmergency();
  const entry = entries.find(e=>e.id===entryId);
  if(!entry) return;
  const usedQty = prompt(`End of Day Reconciliation

Product: ${entry.name}
Total Qty: ${entry.qty} ${entry.unit}

Quantity USED (goes to Main Stock):`);
  if(usedQty === null) return;
  const wastedQty = prompt(`Quantity WASTED (goes to Waste Feature):
(Remaining: ${entry.qty - parseFloat(usedQty||0)} ${entry.unit})`);
  if(wastedQty === null) return;

  const used = parseFloat(usedQty)||0;
  const wasted = parseFloat(wastedQty)||0;

  if(used + wasted > entry.qty) {
    showToast('Used + Wasted cannot exceed total quantity','error'); return;
  }

  // Update entry
  entry.usedQty = used;
  entry.wastedQty = wasted;
  entry.reconciled = true;
  entry.reconciledAt = new Date().toLocaleString('en-IN');
  await sbUpsertInv('sg_emergency_stock',[entry]).catch(e=>console.error('reconcile save fail:',e));
  invInvalidate('emergency');

  // Add to waste if wasted > 0
  if(wasted > 0) {
    const wasteEntry = { id:'W_'+Date.now(), item:entry.name, qty:wasted, unit:entry.unit, reason:'Emergency Entry - '+entry.reason, date:new Date().toLocaleDateString('en-IN'), by:currentUser?.name||'Manager' };
    await sbUpsertInv('sg_waste',[wasteEntry]).catch(e=>console.error('waste save fail:',e));
    invInvalidate('waste');
  }

  renderEmergencyStock();
  showToast('✅ Reconciled! Used→Stock, Wasted→Waste');
  } catch(_e) { console.error("[SG] openEndOfDay:", _e); }
}

// ===== FEATURE 33: IMPORT EMERGENCY STOCK =====

async function renderImportEmergency() {
  try {
  const div = document.getElementById('importAnalysisResult');
  if(!div) return;
  const entries = await sbGetEmergency();
  const pending = entries.filter(e=>!e.reconciled);
  if(!pending.length) {
    div.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);">No pending emergency entries to import</div>';
  }
  } catch(_e) { console.error("[SG] renderImportEmergency:", _e); }
}

async function analyseEmergencyImport() {
  try {
  const isManager = currentUser?.role==='Admin' || currentUser?.perms?.includes('Inventory - Emergency Entries');
  if(!isManager) { showToast('Only Manager/Admin can access this','error'); return; }

  const entries = await sbGetEmergency();
  const pending = entries.filter(e=>!e.reconciled);
  const purchases = await sbGetSgPurchases();
  const div = document.getElementById('importAnalysisResult');
  if(!div) return;

  if(!pending.length) {
    div.innerHTML = '<div style="background:#e8f5e9;border-radius:10px;padding:16px;text-align:center;color:#2e7d32;font-weight:700;">✅ No pending entries. All reconciled!</div>';
    return;
  }

  let html = '<div style="font-weight:700;font-size:1rem;margin-bottom:16px;">🔍 Analysis Report:</div>';
  let allOk = true;

  pending.forEach(entry => {
    // STEP 1: Find matching purchase (by batch or supplier+date)
    let matchedPurchase = null;
    if(entry.batch) {
      matchedPurchase = purchases.find(p=>p.batch===entry.batch && p.item===entry.name);
    } else {
      matchedPurchase = purchases.find(p=>
        p.item===entry.name &&
        p.supplier===entry.supplier &&
        p.date===entry.purchaseDate
      );
    }

    // STEP 2: Auto date check
    const entryDate = entry.autoDateTime.split(' ')[0];

    // STEP 3: Product name match
    const nameMatch = matchedPurchase ? matchedPurchase.item === entry.name : null;

    // STEP 4: Auto time
    const entryTime = entry.autoDateTime.split(' ')[1];

    // FIFO check
    const fifoOk = matchedPurchase ? true : null;

    const hasIssue = !matchedPurchase || !nameMatch;
    if(hasIssue) allOk = false;

    html += `<div style="background:${hasIssue?'#fce4ec':'#e8f5e9'};border-radius:10px;padding:14px;margin-bottom:10px;border:1px solid ${hasIssue?'#ef9a9a':'#a5d6a7'};">
      <div style="font-weight:700;margin-bottom:8px;">${hasIssue?'⚠️':'✅'} ${entry.name} — ${entry.qty} ${entry.unit}</div>
      <div style="font-size:0.82rem;line-height:1.8;">
        <div>Step 1: ${entry.batch?'Batch: '+entry.batch:'Supplier: '+entry.supplier+' | Purchase: '+entry.purchaseDate} 
          → ${matchedPurchase?'✅ Match found':'❌ No match in purchases'}</div>
        <div>Step 2: Auto Date: ${entryDate} ✅</div>
        <div>Step 3: Product Name: ${entry.name} → ${nameMatch===null?'⚠️ No purchase to compare':nameMatch?'✅ Match':'❌ Mismatch'}</div>
        <div>Step 4: Auto Time: ${entryTime} ✅</div>
      </div>
      ${hasIssue?`<div style="font-size:0.8rem;color:#c62828;margin-top:6px;font-weight:600;">
        ⚠️ Manual review recommended before importing
      </div>`:''}
    </div>`;
  });

  // Confirm button
  html += `<div style="display:flex;gap:10px;margin-top:8px;">
    <button onclick="confirmImportAll()" 
      style="flex:1;padding:12px;background:#2e7d32;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;">
      ✅ Confirm & Import All to Main Stock
    </button>
    ${!allOk?`<button onclick="confirmImportOkOnly()"
      style="flex:1;padding:12px;background:#1565c0;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:0.9rem;">
      Import Only ✅ Matched
    </button>`:''}
  </div>`;

  div.innerHTML = html;
  } catch(_e) { console.error("[SG] analyseEmergencyImport:", _e); }
}

async function confirmImportAll() {
  try {
  const entries = await sbGetEmergency();
  const pending = entries.filter(e=>!e.reconciled);
  importEntriesToStock(pending, entries);
  } catch(_e) { console.error("[SG] confirmImportAll:", _e); }
}

async function confirmImportOkOnly() {
  try {
  // Import only matched entries
  const entries = await sbGetEmergency();
  const purchases = await sbGetSgPurchases();
  const pending = entries.filter(e=>{
    if(e.reconciled) return false;
    if(e.batch) return purchases.some(p=>p.batch===e.batch && p.item===e.name);
    return purchases.some(p=>p.item===e.name && p.supplier===e.supplier && p.date===e.purchaseDate);
  });
  importEntriesToStock(pending, entries);
  } catch(_e) { console.error("[SG] confirmImportOkOnly:", _e); }
}

async function importEntriesToStock(toImport, allEntries) {
  try {
  if(!toImport.length) { showToast('Nothing to import','error'); return; }
  const stock = await sbGetStock();

  toImport.forEach(entry => {
    // Find or create stock item
    let stockItem = stock.find(s=>(s.name||'').toLowerCase()===(entry.name||'').toLowerCase());
    if(stockItem) {
      stockItem.quantity = (parseFloat(stockItem.quantity)||0) + entry.qty;
    } else {
      stock.push({
        id: 'STK_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        name: entry.name,
        quantity: entry.qty,
        unit: entry.unit,
        addedAt: new Date().toLocaleString('en-IN'),
        source: 'Emergency Import'
      });
    }
    // Mark as reconciled
    const e = allEntries.find(x=>x.id===entry.id);
    if(e) { e.reconciled = true; e.reconciledAt = new Date().toLocaleString('en-IN'); }
  });

  await sbUpsertInv('inv_stock', stock).catch(e=>console.error('importStock save fail:',e));
  await sbUpsertInv('sg_emergency_stock', allEntries).catch(e=>console.error('importEmergency save fail:',e));

  // ✅ Push to Track Records Usage only AFTER the purchase import completes
  try {
    const now = new Date();
    const consumptions = await getConsumptions();
    const existingIds = new Set(consumptions.map(c=>c.id));

    toImport.forEach(entry => {
      const trackId = 'EC_' + entry.id;
      if(existingIds.has(trackId)) return; // already pushed — avoid duplicates
      consumptions.unshift({
        id: trackId,
        date: entry.purchaseDate || now.toISOString().slice(0,10),
        time: new Date(entry.createdAt||now).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
        type: entry.type || 'rawmat',
        itemName: entry.name,
        itemId: '',
        qty: entry.qty,
        perWeight: entry.unit,
        purchaseId: '—',
        hrn: entry.batch || '—',
        brand: entry.supplier || '—',
        purpose: entry.reason,
        recordedBy: entry.takenBy,
        approvedBy: currentUser?.name || '—',
        handoverTo: entry.takenBy,
        source: 'emergency',
        reconciledAt: entry.reconciledAt || now.toLocaleString('en-IN'),
        addedAt: now.toLocaleString('en-IN')
      });
    });
    setInvData('consumptions', consumptions);
  } catch(ex) { console.warn('[SG] importEntriesToStock→trackRecords push fail:', ex); }

  invInvalidate('stock'); invInvalidate('emergency');

  document.getElementById('importAnalysisResult').innerHTML =
    '<div style="background:#e8f5e9;border-radius:10px;padding:16px;text-align:center;color:#2e7d32;font-weight:700;font-size:1rem;">✅ '+toImport.length+' entries imported to Main Stock successfully!</div>';

  showToast('✅ Emergency stock imported to Main Stock!');
  } catch(_e) { console.error("[SG] importEntriesToStock:", _e); }
}


// ============================================================
// COLUMN CUSTOMIZATION & AUTO MAPPING SYSTEM
// ============================================================

// Default column definitions for each section
const DEFAULT_COLUMNS = {
  orders: [
    {id:'orderId', label:'Order ID', field:'id', removable:false},
    {id:'customer', label:'Customer', field:'name', removable:true},
    {id:'mobile', label:'Mobile', field:'mobile', removable:true},
    {id:'items', label:'Items', field:'items', removable:true},
    {id:'total', label:'Total', field:'grandTotal', removable:true},
    {id:'type', label:'Type', field:'type', removable:true},
    {id:'date', label:'Date', field:'date', removable:true},
    {id:'internalStatus', label:'Internal Status', field:'internalStatus', removable:true},
    {id:'status', label:'Status', field:'status', removable:false},
    {id:'actions', label:'Actions', field:'actions', removable:false}
  ],
  vendors: [
    {id:'id', label:'Vendor ID', field:'id', removable:false},
    {id:'name', label:'Name', field:'name', removable:false},
    {id:'company', label:'Company', field:'company', removable:true},
    {id:'contact', label:'Contact', field:'contact', removable:true},
    {id:'email', label:'Email', field:'email', removable:true},
    {id:'gst', label:'GST No', field:'gst', removable:true},
    {id:'rating', label:'Rating', field:'rating', removable:true},
    {id:'actions', label:'Actions', field:'actions', removable:false}
  ],
  products: [
    {id:'id', label:'Product ID', field:'id', removable:false},
    {id:'name', label:'Name', field:'name', removable:false},
    {id:'cat', label:'Category', field:'cat', removable:true},
    {id:'brand', label:'Brand', field:'brand', removable:true},
    {id:'unitType', label:'Unit Type', field:'unitType', removable:true},
    {id:'unitWt', label:'Per Weight', field:'unitWt', removable:true},
    {id:'minStock', label:'Min Stock', field:'minStock', removable:true},
    {id:'storage', label:'Storage', field:'storage', removable:true},
    {id:'actions', label:'Actions', field:'actions', removable:false}
  ],
  rawmats: [
    {id:'id', label:'Item ID', field:'id', removable:false},
    {id:'name', label:'Name', field:'name', removable:false},
    {id:'cat', label:'Category', field:'cat', removable:true},
    {id:'unit', label:'Unit', field:'unit', removable:true},
    {id:'minStock', label:'Min Stock', field:'minStock', removable:true},
    {id:'perishable', label:'Perishable', field:'perishable', removable:true},
    {id:'shelfLife', label:'Shelf Life', field:'shelfLife', removable:true},
    {id:'storage', label:'Storage', field:'storage', removable:true},
    {id:'actions', label:'Actions', field:'actions', removable:false}
  ],
  purchases: [
    {id:'sno',        label:'S.No.',        field:'sno',        removable:false},
    {id:'id',         label:'Purchase ID',  field:'id',         removable:false},
    {id:'date',       label:'Date',         field:'date',       removable:true},
    {id:'vendor',     label:'Vendor',       field:'vendorName', removable:true},
    {id:'item',       label:'Item',         field:'itemName',   removable:false},
    {id:'qty',        label:'Qty',          field:'qty',        removable:true},
    {id:'perWeight',  label:'Per Weight',   field:'unitWt',     removable:true},
    {id:'totalWt',    label:'Total Weight', field:'totalWt',    removable:true},
    {id:'price',      label:'Unit Price',   field:'price',      removable:true},
    {id:'amount',     label:'Amount (₹)',   field:'total',      removable:true},
    {id:'payment',    label:'Pay Mode',     field:'payMode',    removable:true},
    {id:'status',     label:'Pay Status',   field:'payStatus',  removable:true},
    {id:'batch',      label:'HRN / Batch',  field:'batch',      removable:true},
    {id:'mfgDate',    label:'Mfg Date',     field:'mfgDate',    removable:true},
    {id:'expDate',    label:'Exp Date',     field:'expDate',    removable:true},
    {id:'bill',       label:'Bill',         field:'billNo',     removable:true},
    {id:'receivedBy', label:'Received By',  field:'receivedBy', removable:true},
    {id:'actions',    label:'Actions',      field:'actions',    removable:false}
  ],
  stock: [
    {id:'name', label:'Item', field:'name', removable:false},
    {id:'type', label:'Type', field:'type', removable:true},
    {id:'qty', label:'Current Stock', field:'qty', removable:false},
    {id:'unit', label:'Unit', field:'unit', removable:true},
    {id:'min', label:'Min Level', field:'min', removable:true},
    {id:'status', label:'Status', field:'status', removable:false},
    {id:'lastUpdated', label:'Last Updated', field:'lastUpdated', removable:true}
  ],
  customers: [
    {id:'name', label:'Name', field:'name', removable:false},
    {id:'mobile', label:'Mobile', field:'mobile', removable:true},
    {id:'email', label:'Email', field:'email', removable:true},
    {id:'orders', label:'Orders', field:'orders', removable:true},
    {id:'spent', label:'Total Spent', field:'spent', removable:true},
    {id:'class', label:'Class', field:'class', removable:true},
    {id:'status', label:'Status', field:'status', removable:true},
    {id:'action', label:'Action', field:'action', removable:false}
  ],
  reservations: [
    {id:'date', label:'Date', field:'date', removable:true},
    {id:'time', label:'Time', field:'time', removable:true},
    {id:'guest', label:'Guest', field:'name', removable:false},
    {id:'phone', label:'Phone', field:'phone', removable:true},
    {id:'table', label:'Table', field:'table', removable:true},
    {id:'guests', label:'Guests', field:'guests', removable:true},
    {id:'status', label:'Status', field:'status', removable:false},
    {id:'notes', label:'Notes', field:'notes', removable:true},
    {id:'actions', label:'Actions', field:'actions', removable:false}
  ]
};

// Keyword mapping dictionary for auto-mapping
const FIELD_KEYWORDS = {
  name:        ['name','full name','customer','guest','name','client name','passenger','member'],
  mobile:      ['mobile','phone','contact','number','mob','tel','telephone','ph'],
  email:       ['email','mail','e-mail','gmail'],
  id:          ['order id','order no','bill no','id','booking id','reservation id','ref'],
  items:       ['items','products','dishes','food','order items'],
  grandTotal:  ['total','amount','bill','price','cost','grand total','subtotal'],
  type:        ['type','order type','category','mode'],
  status:      ['status','state','condition'],
  date:        ['date','booking date','order date','reservation date'],
  time:        ['time','slot','booking time'],
  guests:      ['guests','people','persons','pax','covers'],
  notes:       ['notes','remarks','special','instructions','comment'],
  table:       ['table','seat','section'],
  itemSizes:   ['size','sizes','size variant','item size','portion'],
  address:     ['delivery address','delivery','shipping address'],
  permanentAddress: ['permanent address','home address','residence'],
  orders:      ['orders','order count','total orders'],
  spent:       ['spent','total spent','revenue','spending'],
  class:       ['class','classification','category','tier','level'],
  company:     ['company','firm','business','organization'],
  contact:     ['contact','phone','mobile','number'],
  gst:         ['gst','gstin','gst no','tax id'],
  rating:      ['rating','stars','score'],
  cat:         ['category','cat','type','group'],
  brand:       ['brand','make','manufacturer'],
  unitType:    ['unit type','package','pack type'],
  unitWt:      ['per weight','unit weight','weight per unit','pkg weight'],
  minStock:    ['min stock','minimum','reorder','threshold'],
  storage:     ['storage','store','keep'],
  unit:        ['unit','measure','uom'],
  perishable:  ['perishable','expiry','expire'],
  shelfLife:   ['shelf life','days','expiry days'],
  vendorName:  ['vendor','supplier','party'],
  itemName:    ['item','product name','material'],
  perWeight:   ['per weight','unit wt','per unit'],
  totalWt:     ['total weight','total wt','gross weight'],
  payMode:     ['payment mode','pay mode','payment method'],
  payStatus:   ['pay status','payment status','paid'],
  billNo:      ['bill no','invoice','bill number'],
  qty:         ['qty','quantity','amount','nos'],
  lastUpdated: ['last updated','updated','modified']
};

function getColumns(section) {
  const saved = (_settingsCache['sg_columns_'+section])||null;
  let cols = saved ? JSON.parse(JSON.stringify(saved)) : JSON.parse(JSON.stringify(DEFAULT_COLUMNS[section]||[]));
  // One-time migration: inject "Internal Status" column for existing orders configs that predate this feature
  if(section === 'orders' && !cols.some(c => c.field === 'internalStatus')) {
    const statusIdx = cols.findIndex(c => c.field === 'status');
    const insertAt = statusIdx >= 0 ? statusIdx : Math.max(0, cols.length - 1);
    cols.splice(insertAt, 0, {id:'internalStatus', label:'Internal Status', field:'internalStatus', removable:true});
    saveColumns(section, cols);
  }
  return cols;
}

function saveColumns(section, cols) {
  _settingsCache['sg_columns_'+section]=cols; setSetting('sg_columns_'+section, cols);
}

function resetColumns(section) {
  delete _settingsCache['sg_columns_'+section]; setSetting('sg_columns_'+section, null);
}

// Auto-detect field from column label
function autoDetectField(label, section) {
  const lower = label.toLowerCase().trim();
  // Context-aware address mapping
  if(section === 'orders' && (lower.includes('address') || lower.includes('delivery'))) return 'address';
  if(section === 'orders' && lower.includes('size')) return 'itemSizes';
  if(section === 'customers' && lower.includes('address')) return 'permanentAddress';
  
  for(const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    if(keywords.some(k => lower.includes(k) || k.includes(lower))) return field;
  }
  return null; // Unknown - need to ask user
}

// Section-aware field options for Column Manager
const _colFieldOptions = {
  vendors: `<option value="">-- Map to field --</option><optgroup label="Vendor Fields"><option value="id">Vendor ID</option><option value="name">Name</option><option value="company">Company</option><option value="contact">Contact</option><option value="email">Email</option><option value="gst">GST No</option><option value="rating">Rating</option><option value="payTerms">Pay Terms</option><option value="address">Address</option><option value="notes">Notes</option></optgroup><option value="custom">Custom/New Field</option>`,
  products: `<option value="">-- Map to field --</option><optgroup label="Product Fields"><option value="id">Product ID</option><option value="name">Name</option><option value="cat">Category</option><option value="brand">Brand</option><option value="unitType">Unit Type</option><option value="unitWt">Per Weight</option><option value="wtUnit">Weight Unit</option><option value="minStock">Min Stock</option><option value="storage">Storage</option><option value="location">Location</option><option value="hsn">HSN Code</option><option value="status">Status</option><option value="notes">Notes</option></optgroup><option value="custom">Custom/New Field</option>`,
  rawmats: `<option value="">-- Map to field --</option><optgroup label="Raw Material Fields"><option value="id">Item ID</option><option value="name">Name</option><option value="cat">Category</option><option value="unit">Unit</option><option value="minStock">Min Stock</option><option value="perishable">Perishable</option><option value="shelfLife">Shelf Life</option><option value="storage">Storage</option><option value="notes">Notes</option></optgroup><option value="custom">Custom/New Field</option>`,
  purchases: `<option value="">-- Map to field --</option><optgroup label="Purchase Fields"><option value="id">Purchase ID</option><option value="date">Date</option><option value="vendorName">Vendor Name</option><option value="itemName">Item Name</option><option value="itemType">Item Type</option><option value="qty">Quantity</option><option value="perWeight">Per Weight</option><option value="totalWt">Total Weight</option><option value="price">Unit Price</option><option value="discount">Discount</option><option value="gstPct">GST %</option><option value="total">Total Amount</option><option value="payMode">Payment Mode</option><option value="payStatus">Pay Status</option><option value="billNo">Bill No</option><option value="batch">Batch No</option><option value="mfgDate">Mfg Date</option><option value="expDate">Exp Date</option><option value="receivedBy">Received By</option><option value="notes">Notes</option></optgroup><option value="custom">Custom/New Field</option>`,
  stock: `<option value="">-- Map to field --</option><optgroup label="Stock Fields"><option value="name">Item Name</option><option value="type">Type</option><option value="qty">Current Stock</option><option value="unit">Unit</option><option value="min">Min Level</option><option value="status">Status</option><option value="lastUpdated">Last Updated</option></optgroup><option value="custom">Custom/New Field</option>`,
  orders: `<option value="">-- Map to field --</option><optgroup label="Order Fields"><option value="id">Order ID</option><option value="name">Customer Name</option><option value="mobile">Mobile</option><option value="items">Items</option><option value="itemSizes">Item Size(s)</option><option value="grandTotal">Total Amount</option><option value="type">Order Type</option><option value="date">Date</option><option value="time">Time</option><option value="status">Status</option><option value="address">Delivery Address</option><option value="notes">Notes</option></optgroup><option value="custom">Custom/New Field</option>`,
  customers: `<option value="">-- Map to field --</option><optgroup label="Customer Fields"><option value="name">Name</option><option value="mobile">Mobile</option><option value="email">Email</option><option value="orders">Order Count</option><option value="spent">Total Spent</option><option value="class">Classification</option><option value="status">Status</option><option value="permanentAddress">Permanent Address</option></optgroup><option value="custom">Custom/New Field</option>`,
  reservations: `<option value="">-- Map to field --</option><optgroup label="Reservation Fields"><option value="date">Date</option><option value="time">Time</option><option value="name">Guest Name</option><option value="phone">Phone</option><option value="table">Table</option><option value="guests">Guests</option><option value="status">Status</option><option value="notes">Notes</option></optgroup><option value="custom">Custom/New Field</option>`,
  consumlog: `<option value="">-- Map to field --</option><optgroup label="Consumption Log Fields"><option value="date">Date</option><option value="time">Time</option><option value="orderid">Order ID</option><option value="purchaseids">Purchase IDs</option><option value="dishname">Dish</option><option value="ingredientname">Ingredient</option><option value="ingredienttype">Type</option><option value="qty">Qty</option><option value="unit">Unit</option><option value="unitcost">Unit Cost</option><option value="totalcost">Total Cost</option><option value="servedby">Served By</option></optgroup>`
};

// Open column manager
function openColumnManager(section) {
  try {
  const cols = getColumns(section);
  const sectionNames = {
    orders:'Order Management', customers:'Customer Records', reservations:'Reservations',
    vendors:'Vendors', products:'Products', rawmats:'Raw Materials',
    purchases:'Purchases', stock:'Stock'
  };
  
  const modal = document.createElement('div');
  modal.id = 'colMgrModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  
  modal.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:560px;width:90%;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;">⚙️ ${sectionNames[section]} Columns</h3>
        <button onclick="document.getElementById('colMgrModal').remove()" 
          style="background:#fce4ec;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:1rem;">✕</button>
      </div>
      
      <div style="font-size:0.82rem;color:#666;margin-bottom:16px;background:#f9f7f5;padding:10px;border-radius:8px;">
        ✅ Tick = Show | ❌ Untick = Hide | Drag to reorder | + Add custom column
      </div>

      <div id="colList" style="margin-bottom:16px;">
        ${cols.map((c,i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f9f9f9;border-radius:8px;margin-bottom:6px;border:1px solid #eee;">
            <span style="cursor:move;color:#aaa;">☰</span>
            <input type="checkbox" ${!c.hidden?'checked':''} 
              ${!c.removable?'disabled title="Required column"':''}
              onchange="toggleColVisibility('${section}',${i},this.checked)"
              style="width:16px;height:16px;">
            <input type="text" value="${c.label}" 
              onchange="updateColLabel('${section}',${i},this.value)"
              style="flex:1;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-family:inherit;font-size:0.88rem;">
            <span style="font-size:0.75rem;color:#aaa;min-width:80px;">→ ${c.field}</span>
            <button onclick="editColDescription('${section}',${i})" title="${c.description ? 'Note: '+c.description.replace(/"/g,'&quot;') : 'Add a client note'}"
              style="background:${c.description?'#fff8e1':'#f0f0f0'};border:none;padding:5px 8px;border-radius:6px;cursor:pointer;font-size:0.9rem;">💬</button>
            ${c.removable && !c.required ? `<button onclick="removeCol('${section}',${i})" 
              style="background:#fce4ec;color:#c62828;border:none;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.75rem;">Remove</button>` : ''}
          </div>`).join('')}
      </div>

      <!-- Add new column -->
      <div style="background:#e8f5e9;border-radius:10px;padding:14px;margin-bottom:16px;">
        <div style="font-weight:700;margin-bottom:10px;font-size:0.88rem;">+ Add New Column</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input type="text" id="newColLabel" placeholder="Column name (e.g. Zone)" 
            style="padding:8px;border:1px solid #ddd;border-radius:6px;font-family:inherit;">
          <select id="newColField" onchange="toggleCustomFieldKeyInput()" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-family:inherit;">
            ${(_colFieldOptions[section]||'<option value="">-- Map to field --</option><option value="custom">Custom/New Field</option>')}
          </select>
        </div>
        <div id="newColCustomKeyWrap" style="display:none;margin-top:8px;">
          <input type="text" id="newColCustomKey" placeholder="Name of the new field (e.g. zone, table_pref)"
            style="width:100%;padding:8px;border:2px solid #2e7d32;border-radius:6px;font-family:inherit;box-sizing:border-box;">
          <div style="font-size:0.72rem;color:#2e7d32;margin-top:3px;margin-bottom:8px;">This column will appear as an editable text box in every order row.</div>
          <label style="font-size:0.8rem;font-weight:700;display:block;margin-bottom:5px;color:#333;">💬 Client Note (optional)</label>
          <textarea id="newColDescription" rows="3" placeholder="Write here exactly what should be shown/done in this column... (e.g. 'Enter the customer&#39;s birthday here so we can send a special offer')"
            style="width:100%;padding:8px;border:2px solid #ddd;border-radius:6px;font-family:inherit;box-sizing:border-box;resize:vertical;font-size:0.85rem;"></textarea>
          <div style="font-size:0.7rem;color:#1565c0;margin-top:3px;background:#e3f2fd;padding:6px 8px;border-radius:6px;">
            🤖 <b>Smart:</b> If words like "size", "address", "mobile", "status", "total" are written — the system will find and show the real data on its own (no manual entry needed)! Even for a completely new/manual field, this note will show on hover.
          </div>
        </div>
        <button onclick="addNewCol('${section}')" 
          style="margin-top:8px;background:#2e7d32;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer;width:100%;">
          + Add Column
        </button>
      </div>

      <div style="display:flex;gap:8px;">
        <button onclick="resetColumns('${section}');document.getElementById('colMgrModal').remove();refreshSection('${section}');"
          style="flex:1;padding:10px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;border-radius:8px;font-weight:700;cursor:pointer;">
          🔄 Reset Default
        </button>
        <button onclick="document.getElementById('colMgrModal').remove();refreshSection('${section}');"
          style="flex:1;padding:10px;background:var(--fire);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
          ✅ Save & Close
        </button>
      </div>
    </div>`;
  
  document.body.appendChild(modal);
  } catch(_e) { console.error("[SG] openColumnManager:", _e); }
}

function toggleColVisibility(section, idx, visible) {
  try {
  const cols = getColumns(section);
  cols[idx].hidden = !visible;
  saveColumns(section, cols);
  // Just refresh the table — don't close/reopen modal (it resets scroll & breaks UX)
  refreshSection(section);
  updateTableHeaders();
  } catch(_e) { console.error("[SG] toggleColVisibility:", _e); }
}

function updateColLabel(section, idx, newLabel) {
  try {
  const cols = getColumns(section);
  cols[idx].label = newLabel;
  
  // Auto-detect field mapping if label changed
  const detectedField = autoDetectField(newLabel, section);
  if(detectedField && detectedField !== cols[idx].field) {
    askFieldMapping(section, idx, newLabel, detectedField, cols[idx].field);
  }
  saveColumns(section, cols);
  updateTableHeaders();
  refreshSection(section);
  } catch(_e) { console.error("[SG] updateColLabel:", _e); }
}

function askFieldMapping(section, idx, label, suggestedField, currentField) {
  try {
  const fieldNames = {
    name:'Customer Name', mobile:'Mobile Number', email:'Email',
    address:'Delivery Address', permanentAddress:'Permanent Address',
    id:'Order ID', grandTotal:'Total Amount', type:'Order Type',
    status:'Status', date:'Date', time:'Time', notes:'Notes',
    items:'Items', orders:'Order Count', spent:'Total Spent',
    class:'Classification', table:'Table', guests:'Guests'
  };
  
  const suggested = fieldNames[suggestedField] || suggestedField;
  const current = fieldNames[currentField] || currentField;
  
  if(confirm(`Column "${label}" detected as "${suggested}".

Change mapping from "${current}" to "${suggested}"?`)) {
    const cols = getColumns(section);
    cols[idx].field = suggestedField;
    saveColumns(section, cols);
  }
  } catch(_e) { console.error("[SG] askFieldMapping:", _e); }
}

function editColDescription(section, idx) {
  try {
  const cols = getColumns(section);
  const c = cols[idx];
  if(!c) return;
  const note = prompt('💬 Write a client note for the "'+c.label+'" column — describe exactly what should be shown/saved here:', c.description||'');
  if(note === null) return; // cancelled
  cols[idx].description = note.trim();
  saveColumns(section, cols);
  updateTableHeaders();
  refreshSection(section);
  _refreshColMgrList(section);
  showToast('✅ Note saved for "'+c.label+'"!');
  } catch(_e) { console.error("[SG] editColDescription:", _e); }
}

function toggleCustomFieldKeyInput() {
  try {
  const sel  = document.getElementById('newColField');
  const wrap = document.getElementById('newColCustomKeyWrap');
  if(!sel || !wrap) return;
  wrap.style.display = (sel.value === 'custom') ? 'block' : 'none';
  if(sel.value === 'custom') {
    const keyInp = document.getElementById('newColCustomKey');
    if(keyInp) keyInp.focus();
  }
  } catch(_e) { console.error("[SG] toggleCustomFieldKeyInput:", _e); }
}

function addNewCol(section) {
  try {
  const label = document.getElementById('newColLabel').value.trim();
  const field = document.getElementById('newColField').value;

  if(!label) { showToast('Column name required','error'); return; }

  let mappedField = field;
  let description = '';

  // "Custom/New Field" explicitly selected — read the new field key from the inline input
  if(mappedField === 'custom') {
    const keyInp = document.getElementById('newColCustomKey');
    const key = keyInp ? keyInp.value.trim() : '';
    if(!key) {
      showToast('Enter a name for the new field!','error');
      if(keyInp) keyInp.focus();
      return;
    }
    mappedField = 'custom:' + key.replace(/\s+/g,'_');
    const descInp = document.getElementById('newColDescription');
    description = descInp ? descInp.value.trim() : '';
  } else if(!mappedField) {
    const detected = autoDetectField(label, section);
    if(detected) {
      mappedField = detected;
    } else {
      // Unknown field - ask user
      showUnknownFieldDialog(label, section);
      return;
    }
  }

  const cols = getColumns(section);
  cols.splice(cols.length-1, 0, { // Add before Actions
    id: 'custom_'+Date.now(),
    label,
    field: mappedField,
    removable: true,
    custom: true,
    description
  });
  saveColumns(section, cols);

  // Refresh modal list in-place
  _refreshColMgrList(section);
  // Clear inputs
  document.getElementById('newColLabel').value = '';
  document.getElementById('newColField').value = '';
  const keyInpClear = document.getElementById('newColCustomKey');
  if(keyInpClear) keyInpClear.value = '';
  const descInpClear = document.getElementById('newColDescription');
  if(descInpClear) descInpClear.value = '';
  const wrapClear = document.getElementById('newColCustomKeyWrap');
  if(wrapClear) wrapClear.style.display = 'none';
  updateTableHeaders();
  refreshSection(section);
  showToast('✅ Column "'+label+'" added!');
  } catch(_e) { console.error("[SG] addNewCol:", _e); }
}

// Save a per-row value for a fully-custom column (field starts with 'custom:')
function updateOrderCustomField(orderId, key, value) {
  try {
  const o = orders.find(o=>o.id===orderId);
  if(!o) return;
  o.customData = o.customData || {};
  o.customData[key] = value;
  if(typeof sbUpdateOrder === 'function') {
    sbUpdateOrder(o.id, { customData: o.customData }).catch(e=>console.error('[SG] custom field save fail:', e));
  }
  } catch(_e) { console.error("[SG] updateOrderCustomField:", _e); }
}

function showUnknownFieldDialog(label, section) {
  try {
  const fieldOptions = [
    {value:'name', label:'Customer Name'},
    {value:'mobile', label:'Mobile Number'},
    {value:'email', label:'Email'},
    {value:'address', label:'Delivery Address'},
    {value:'permanentAddress', label:'Permanent Address'},
    {value:'id', label:'Order ID'},
    {value:'grandTotal', label:'Total Amount'},
    {value:'type', label:'Order Type'},
    {value:'status', label:'Status'},
    {value:'date', label:'Date'},
    {value:'notes', label:'Notes'},
    {value:'custom', label:'New Custom Field'}
  ];
  
  const dialog = document.createElement('div');
  dialog.id = 'unknownFieldDialog';
  dialog.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;';
  dialog.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;max-width:420px;width:90%;">
      <h3 style="margin:0 0 12px;">❓ "${label}" — What is this?</h3>
      <p style="font-size:0.85rem;color:#666;margin-bottom:16px;">
        System could not detect this automatically.<br>
        Please select what data this column represents:
      </p>
      <select id="unknownFieldSelect" onchange="document.getElementById('unknownCustomKeyWrap').style.display=(this.value==='custom')?'block':'none'" style="width:100%;padding:10px;border:2px solid #e8d5c8;border-radius:8px;font-family:inherit;margin-bottom:12px;">
        ${fieldOptions.map(o=>`<option value="${o.value}">${o.label}</option>`).join('')}
      </select>
      <div id="unknownCustomKeyWrap" style="display:none;margin-bottom:16px;">
        <input type="text" id="unknownCustomKey" placeholder="Name of the new field (e.g. zone, table_pref)"
          style="width:100%;padding:9px;border:2px solid var(--fire);border-radius:8px;font-family:inherit;box-sizing:border-box;">
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('unknownFieldDialog').remove()"
          style="flex:1;padding:10px;background:#f5f5f5;border:none;border-radius:8px;cursor:pointer;">Cancel</button>
        <button onclick="confirmUnknownField('${label}','${section}')"
          style="flex:1;padding:10px;background:var(--fire);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">
          ✅ Confirm
        </button>
      </div>
    </div>`;
  document.body.appendChild(dialog);
  } catch(_e) { console.error("[SG] showUnknownFieldDialog:", _e); }
}

function confirmUnknownField(label, section) {
  try {
  let field = document.getElementById('unknownFieldSelect').value;

  if(field === 'custom') {
    const keyInp = document.getElementById('unknownCustomKey');
    const key = keyInp ? keyInp.value.trim() : '';
    if(!key) { showToast('Enter a name for the new field!','error'); if(keyInp) keyInp.focus(); return; }
    field = 'custom:' + key.replace(/\s+/g,'_');
  }
  document.getElementById('unknownFieldDialog').remove();

  const cols = getColumns(section);
  cols.splice(cols.length-1, 0, {
    id: 'custom_'+Date.now(),
    label,
    field,
    removable: true,
    custom: true
  });
  saveColumns(section, cols);

  // Refresh modal list in-place
  if(document.getElementById('colMgrModal')) {
    _refreshColMgrList(section);
  }
  updateTableHeaders();
  refreshSection(section);
  showToast('✅ Column "'+label+'" mapped to field!');
  } catch(_e) { console.error("[SG] confirmUnknownField:", _e); }
}

function removeCol(section, idx) {
  try {
  if(!confirm('Remove this column?')) return;
  const cols = getColumns(section);
  cols.splice(idx, 1);
  saveColumns(section, cols);
  // Refresh modal content in-place
  _refreshColMgrList(section);
  refreshSection(section);
  updateTableHeaders();
  } catch(_e) { console.error("[SG] removeCol:", _e); }
}

// Refresh only the colList inside the modal (without closing/reopening)
function _refreshColMgrList(section) {
  const listEl = document.getElementById('colList');
  if (!listEl) return;
  const cols = getColumns(section);
  listEl.innerHTML = cols.map((c, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f9f9f9;border-radius:8px;margin-bottom:6px;border:1px solid #eee;">
      <span style="cursor:move;color:#aaa;">☰</span>
      <input type="checkbox" ${!c.hidden ? 'checked' : ''}
        ${!c.removable ? 'disabled title="Required column"' : ''}
        onchange="toggleColVisibility('${section}',${i},this.checked)"
        style="width:16px;height:16px;">
      <input type="text" value="${c.label.replace(/"/g,'&quot;')}"
        onchange="updateColLabel('${section}',${i},this.value)"
        style="flex:1;padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-family:inherit;font-size:0.88rem;">
      <span style="font-size:0.75rem;color:#aaa;min-width:80px;">→ ${c.field}</span>
      ${c.removable && !c.required ? `<button onclick="removeCol('${section}',${i})"
        style="background:#fce4ec;color:#c62828;border:none;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.75rem;">Remove</button>` : ''}
    </div>`).join('');
}

function refreshSection(section) {
  try {
  updateTableHeaders();
  if(section==='orders') renderOrders();
  if(section==='customers') renderCustomers();
  if(section==='reservations') renderReservations();
  if(section==='vendors') renderVendors();
  if(section==='products') renderProducts();
  if(section==='rawmats') renderRawmats();
  if(section==='purchases') renderPurchases();
  if(section==='stock') renderStock();
  } catch(_e) { console.error("[SG] refreshSection:", _e); }
}

// Get cell value from order/customer/reservation object
function getFieldValue(obj, field, section) {
  try {
  if(typeof field === 'string' && field.indexOf('custom:') === 0) {
    const rawKey = field.slice(7);
    // Pull the column's client description (chat-box note) so we can scan it too
    let description = '';
    try {
      const colsForLookup = typeof getColumns === 'function' ? getColumns(section) : [];
      const colDef = colsForLookup.find(c => c.field === field);
      description = (colDef && colDef.description) || '';
    } catch(_e2) {}
    // Combine the field key + client's note — match against EITHER
    const searchText = (rawKey + ' ' + description).toLowerCase();
    // Smart fallback: if the key/note matches a known concept,
    // resolve to the real data instead of showing a blank manual-entry box.
    if(/size/.test(searchText))               return getFieldValue(obj, 'itemSizes', section);
    if(/address|delivery/.test(searchText))   return obj.address || obj.deliveryAddress || '—';
    if(/mobile|phone|contact/.test(searchText)) return obj.mobile || obj.phone || '—';
    if(/email/.test(searchText))              return obj.email || '—';
    if(/status/.test(searchText))             return obj.status || '—';
    if(/total|amount|bill|price/.test(searchText)) return obj.grandTotal || obj.total || 0;
    if(/note|remark|instruction/.test(searchText)) return obj.notes || obj.note || '—';
    if(/time|timing|booking|booked/.test(searchText)) {
      // obj.time stores full date+time string — extract only the time part
      if(obj.time) {
        const m = String(obj.time).match(/(\d{1,2}:\d{2}(:\d{2})?\s*(am|pm|AM|PM)?)/);
        if(m) return m[1].toUpperCase().replace(/\s+/g,' ').trim();
        const d = new Date(obj.time);
        if(!isNaN(d)) return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
        return obj.time;
      }
      if(obj.created_at) return new Date(obj.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
      return '—';
    }
    // True custom field — manually entered per row
    return (obj.customData && obj.customData[rawKey]) || '';
  }
  switch(field) {
    case 'itemSizes': {
      if(!obj.items || !obj.items.length) return '—';
      const sizes = obj.items.map(i => {
        const m = (i.name||'').match(/\(([^)]+)\)\s*$/);
        return m ? m[1] : null;
      }).filter(Boolean);
      return sizes.length ? sizes.join(', ') : '—';
    }
    case 'name':
      // Smart name: combine firstName+lastName or use name
      if(obj.firstName || obj.lastName) return ((obj.firstName||'') + ' ' + (obj.lastName||'')).trim();
      return obj.name || obj.guest || '—';
    case 'mobile': return obj.mobile || obj.phone || '—';
    case 'email': return obj.email || '—';
    case 'address': return obj.address || obj.deliveryAddress || '—';
    case 'permanentAddress': return obj.permanentAddress || obj.address || '—';
    case 'id': return obj.id || '—';
    case 'grandTotal': return obj.grandTotal || obj.total || obj.spent || 0;
    case 'type': return obj.type || '—';
    case 'status': return obj.status || '—';
    case 'date': return obj.date || '—';
    case 'time': return obj.time || '—';
    case 'notes': return obj.notes || obj.note || '—';
    case 'items': return obj.items ? obj.items.map(i=>i.name+' x'+i.qty).join(', ') : '—';
    case 'orders': return obj.orders || 0;
    case 'spent': return obj.spent || 0;
    case 'class': return obj.class || '—';
    case 'table': return obj.table || obj.tableNum || '—';
    case 'guests': return obj.guests || '—';
    case 'phone': return obj.phone || obj.mobile || '—';
    default: return obj[field] || '—';
  }
  } catch(_e) { console.error("[SG] getFieldValue:", _e); }
}



// ── Smart custom-field cell renderer (used by Vendors/Products/Rawmats/Purchases/Stock) ──
function renderInvCustomCell(rowObj, col, section, rowId) {
  const field = (typeof col === 'string') ? col : col.field;
  const description = (typeof col === 'object' && col) ? (col.description||'') : '';
  if(typeof field !== 'string' || field.indexOf('custom:') !== 0) return null;
  const rawKey = field.slice(7);
  const key = (rawKey + ' ' + description).toLowerCase();
  let resolved;
  if(/size/.test(key))                          resolved = rowObj.size || rowObj.unitWt || rowObj.unitVol;
  else if(/address/.test(key))                  resolved = rowObj.address;
  else if(/mobile|phone|^contact$/.test(key))   resolved = rowObj.mobile || rowObj.phone || rowObj.contact;
  else if(/email/.test(key))                    resolved = rowObj.email;
  else if(/gst/.test(key))                      resolved = rowObj.gst;
  else if(/rating/.test(key))                   resolved = rowObj.rating;
  else if(/note|remark/.test(key))               resolved = rowObj.notes;
  else if(/status/.test(key))                   resolved = rowObj.status;
  else if(/categ|^cat$/.test(key))              resolved = rowObj.cat;
  else if(/price|cost|amount|^total$/.test(key)) resolved = rowObj.price || rowObj.total;
  else if(/company|firm|business/.test(key))    resolved = rowObj.company;
  else if(/brand/.test(key))                    resolved = rowObj.brand;
  else if(/storage|^store$/.test(key))          resolved = rowObj.storage;
  else if(/^unit$|measure/.test(key))           resolved = rowObj.unit;
  else if(/stock|qty|quantity/.test(key))       resolved = rowObj.currentStock || rowObj.qty;
  else if(/shelf|expiry|expire/.test(key))      resolved = rowObj.shelfLife;
  if(resolved !== undefined && resolved !== null && resolved !== '') {
    return '<td style="font-size:0.82rem;">'+resolved+'</td>';
  }
  // No real-data match — treat as truly manual custom field (editable per row)
  const cval = (rowObj.customData && rowObj.customData[rawKey]) || '';
  const safeId = String(rowId).replace(/'/g,"\\'");
  const safeKey = rawKey.replace(/'/g,"\\'");
  return '<td><input type="text" value="'+(cval+'').replace(/"/g,'&quot;')+'" placeholder="—" '+
    'onchange="updateSectionCustomField(\''+section+'\',\''+safeId+'\',\''+safeKey+'\',this.value)" '+
    'style="width:100%;min-width:90px;padding:4px 6px;border:1px solid #e8d5c8;border-radius:6px;font-size:0.8rem;background:#fffdf9;"></td>';
}

// Generic dispatcher: persists a manual custom-field value back to its section's storage
function updateSectionCustomField(section, rowId, key, value) {
  try {
  if(section === 'vendors') {
    getVendors().then(arr => {
      const row = arr.find(x => String(x.id) === String(rowId));
      if(row) { row.customData = row.customData||{}; row.customData[key] = value; setInvData('vendors', arr); }
    });
  } else if(section === 'products') {
    getProducts().then(arr => {
      const row = arr.find(x => String(x.id) === String(rowId));
      if(row) { row.customData = row.customData||{}; row.customData[key] = value; setInvData('products', arr); }
    });
  } else if(section === 'rawmats') {
    getRawmats().then(arr => {
      const row = arr.find(x => String(x.id) === String(rowId));
      if(row) { row.customData = row.customData||{}; row.customData[key] = value; setInvData('rawmats', arr); }
    });
  } else if(section === 'purchases') {
    getPurchases().then(arr => {
      const row = arr.find(x => String(x.id) === String(rowId));
      if(row) { row.customData = row.customData||{}; row.customData[key] = value; setInvData('purchases', arr); }
    });
  } else if(section === 'stock') {
    getInvData('stock').then(arr => {
      const list = Array.isArray(arr) ? arr : Object.values(arr||{});
      const row = list.find(x => String(x.stock_key||(x.type+'_'+x.itemId)) === String(rowId));
      if(row) { row.customData = row.customData||{}; row.customData[key] = value; setInvData('stock', list); }
    });
  } else if(section === 'customers') {
    const row = customers.find(x => x.mobile === rowId);
    if(row) {
      row.customData = row.customData||{}; row.customData[key] = value;
      if(typeof sbUpdateCustomer === 'function') {
        sbUpdateCustomer(rowId, { customData: row.customData }).catch(e=>console.error('[SG] custom field save fail:', e));
      }
    }
  } else if(section === 'orders') {
    updateOrderCustomField(rowId, key, value);
  }
  } catch(_e) { console.error("[SG] updateSectionCustomField:", _e); }
}

// Update table headers dynamically based on saved columns
function updateTableHeaders() {
  try {
    if(typeof getColumns !== 'function') return;
    const headerHtml = c => `<th>${c.label}${c.description ? ' <span title="'+c.description.replace(/"/g,'&quot;')+'" style="cursor:help;font-size:0.78rem;opacity:0.7;">ℹ️</span>' : ''}</th>`;
    // Orders — the S.No. sticky column always comes first, then the rest of the columns
    const orderCols = getColumns('orders');
    const orderHead = document.getElementById('ordersTableHead');
    if(orderHead) {
      const snoTh = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;min-width:50px;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>';
      orderHead.innerHTML = '<tr>' + snoTh + orderCols.filter(c=>!c.hidden).map(headerHtml).join('') + '</tr>';
    }
    // Customers — the S.No. sticky column always comes first
    const custCols = getColumns('customers');
    const custHead = document.getElementById('customersTableHead');
    if(custHead) {
      const snoTh = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;min-width:55px;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>';
      custHead.innerHTML = '<tr>' + snoTh + custCols.filter(c=>!c.hidden).map(headerHtml).join('') + '</tr>';
    }
    // Reservations
    const resCols = getColumns('reservations');
    const resHead = document.getElementById('reservTableHead');
    if(resHead) {
      const snoTh = '<th style="position:sticky;left:0;z-index:4;background:#faf7f4;min-width:55px;border-right:2px solid #e8d5c8;text-align:center;">S.No.</th>';
      resHead.innerHTML = '<tr>' + snoTh + resCols.filter(c=>!c.hidden).map(headerHtml).join('') + '</tr>';
    }
    // Inventory sections — update thead directly (render functions also do this, belt-and-suspenders)
    ['vendors','products','rawmats','purchases','stock'].forEach(function(sec) {
      const secId = {vendors:'inv-vendors',products:'inv-products',rawmats:'inv-rawmat',purchases:'inv-purchases',stock:'inv-stock'}[sec];
      const el = document.querySelector('#'+secId+' table thead tr');
      if(el) el.innerHTML = getColumns(sec).filter(c=>!c.hidden).map(headerHtml).join('');
    });
  } catch(e) { console.warn('updateTableHeaders:', e); }
}


// ============================================================
// TASK LOAD — ENHANCED WITH THRESHOLDS, CALENDAR & DATE FILTER
// ============================================================

// Initialize Task Load defaults
function initTaskLoad() {
  try {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekDate = document.getElementById('tlWeekDate');
  if(weekDate && !weekDate.value) weekDate.value = today;
  const monthDate = document.getElementById('tlMonthDate');
  if(monthDate && !monthDate.value) monthDate.value = today.substring(0,7);
  const singleDate = document.getElementById('tlSingleDate');
  if(singleDate && !singleDate.value) singleDate.value = today;
  // Populate year select
  const yearSel = document.getElementById('tlYearDate');
  if(yearSel && !yearSel.options.length) {
    for(let y=now.getFullYear(); y>=now.getFullYear()-5; y--) {
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      yearSel.appendChild(o);
    }
  }
  // Thresholds loaded by loadTaskThresholdsUI in renderSettingsSection
  window._tlPeriod = window._tlPeriod || 'weekly';
  } catch(_e) { console.error("[SG] initTaskLoad:", _e); }
}

function saveTaskThresholds() {
  try {
  const uEl = document.getElementById('thUnderloaded');
  const nEl = document.getElementById('thNormal');
  const aEl = document.getElementById('thAverage');
  const oEl = document.getElementById('thOverloaded');
  
  const u = uEl ? (parseInt(uEl.value) || 0) : 2;
  const n = nEl ? (parseInt(nEl.value) || 0) : 5;
  const a = aEl ? (parseInt(aEl.value) || 0) : 8;
  const o = oEl ? (parseInt(oEl.value) || 0) : 9;
  
  const data = {underloaded:u, normal:n, average:a, overloaded:o};
  setSetting('sg_task_thresholds', data); _settingsCache['sg_task_thresholds']=data;
  
  // Show confirmation
  showToast('✅ Task thresholds saved! U:'+u+' N:'+n+' A:'+a+' O:'+o);
  } catch(_e) { console.error("[SG] saveTaskThresholds:", _e); }
}

function getTaskThresholds(period) {
  try {
  const base = (_settingsCache['sg_task_thresholds'])||{underloaded:2, normal:5, average:8, overloaded:9};
  const mult = period==='weekly'?7 : period==='monthly'?30 : period==='yearly'?365 : 1;
  return {
    underloaded: (base.underloaded||2) * mult,
    normal: (base.normal||5) * mult,
    average: (base.average||8) * mult,
    overloaded: (base.overloaded||9) * mult
  };
  } catch(_e) { console.error("[SG] getTaskThresholds:", _e); }
}

function getTaskStatus(taskCount, thresholds) {
  try {
  // >= logic: underloaded=0, normal=5, average=10, overloaded=15
  if(taskCount === 0) return {status:'No Tasks', color:'#95a5a6', icon:'⚪'};
  if(taskCount >= thresholds.overloaded) return {status:'Overloaded', color:'#c62828', icon:'🔴'};
  if(taskCount >= thresholds.average) return {status:'Average', color:'#2e7d32', icon:'🟢'};
  if(taskCount >= thresholds.normal) return {status:'Normal', color:'#1565c0', icon:'🔵'};
  return {status:'Underloaded', color:'#f9a825', icon:'🟡'};
  } catch(_e) { console.error("[SG] getTaskStatus:", _e); }
}

function setTLPeriod(period) {
  try {
  window._tlPeriod = period;
  // Update button styles
  ['daily','weekly','monthly','yearly'].forEach(p => {
    const btn = document.getElementById('tlBtn_'+p);
    if(!btn) return;
    const active = p === period;
    btn.style.background = active ? 'var(--fire)' : '#fff';
    btn.style.color = active ? '#fff' : '#333';
    btn.style.borderColor = active ? 'var(--fire)' : '#e8d5c8';
  });
  // Show/hide date selectors
  ['daily','weekly','monthly','yearly'].forEach(p => {
    const el = document.getElementById('tlDate'+p.charAt(0).toUpperCase()+p.slice(1));
    if(el) el.style.display = p===period ? 'flex' : 'none';
  });
  // Show calendar for weekly/monthly/yearly
  const calWrap = document.getElementById('tlCalendarWrap');
  if(calWrap) calWrap.style.display = period!=='daily' ? 'block' : 'none';
  renderTaskLoad();
  } catch(_e) { console.error("[SG] setTLPeriod:", _e); }
}

function getTLDateRange() {
  try {
  const period = window._tlPeriod || 'weekly';
  const now = new Date();
  let from, to;
  if(period === 'daily') {
    const d = document.getElementById('tlSingleDate')?.value || now.toISOString().split('T')[0];
    from = to = d;
  } else if(period === 'weekly') {
    const d = new Date(document.getElementById('tlWeekDate')?.value || now.toISOString().split('T')[0]);
    const day = d.getDay();
    const diff = d.getDate() - day + (day===0?-6:1);
    const mon = new Date(d.setDate(diff));
    const sun = new Date(mon); sun.setDate(sun.getDate()+6);
    from = mon.toISOString().split('T')[0];
    to = sun.toISOString().split('T')[0];
  } else if(period === 'monthly') {
    const m = document.getElementById('tlMonthDate')?.value || now.toISOString().substring(0,7);
    from = m+'-01';
    const last = new Date(m.split('-')[0], parseInt(m.split('-')[1]), 0);
    to = m+'-'+String(last.getDate()).padStart(2,'0');
  } else {
    const y = document.getElementById('tlYearDate')?.value || now.getFullYear();
    from = y+'-01-01';
    to = y+'-12-31';
  }
  return {from, to, period};
  } catch(_e) { console.error("[SG] getTLDateRange:", _e); }
}

function getTLTasksInRange(staffId, from, to) {
  try {
  const tasks = getTasks().filter(t => {
    if(t.assignedTo !== staffId) return false;
    const d = t.date || '';
    return d >= from && d <= to;
  });
  const allOrders = getOrders();
  const assignments = getOrderAssignments();
  const orderTasks = allOrders.filter(o => {
    const a = assignments[o.id];
    if(!a) return false;
    const isAssigned = a.cookId===staffId || a.assignedTo===staffId ||
                       a.handedTo===staffId || a.waiterId===staffId ||
                       a.deliveryBoyId===staffId;
    if(!isAssigned) return false;
    let d = '';
    if(o.date) d = o.date.substring(0,10);
    else if(o.time) {
      try {
        const parts = o.time.split(',')[0].split('/');
        if(parts.length===3) d = parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0');
      } catch(e) {}
    }
    return d >= from && d <= to;
  });
  return [...tasks, ...orderTasks.map(o=>({
    id:'ord_'+o.id, title:'Order #'+o.id+' - '+o.type,
    status: ['Delivered','Collected','Served'].includes(o.status)?'completed':'pending',
    date: (()=>{
      if(o.date) return o.date.substring(0,10);
      if(o.time){try{const p=o.time.split(',')[0].split('/');return p.length===3?p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'):'';} catch(e){return '';}}
      return '';
    })(),
    assignedTo: staffId
  }))];
  } catch(_e) { console.error("[SG] getTLTasksInRange:", _e); }
}

function renderTLCalendar() {
  try {
  const {from, to, period} = getTLDateRange();
  const staffList = getStaffList().filter(s=>s.active!==false);
  const selEmp = document.getElementById('tlCalEmp')?.value || '';
  const thresholds = getTaskThresholds('daily'); // Daily threshold for per-day coloring

  // Populate employee select
  const calEmpSel = document.getElementById('tlCalEmp');
  if(calEmpSel && calEmpSel.options.length<=1) {
    staffList.forEach(s => {
      const o = document.createElement('option');
      o.value = s.id; o.textContent = s.name;
      calEmpSel.appendChild(o);
    });
  }

  const grid = document.getElementById('tlCalendarGrid');
  if(!grid) return;

  // Generate all dates in range
  const dates = [];
  let cur = new Date(from);
  const end = new Date(to);
  while(cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate()+1);
  }

  // Count tasks per date
  const filteredStaff = selEmp ? staffList.filter(s=>s.id===selEmp) : staffList;

  let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">';
  // Day headers
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d => {
    html += '<div style="text-align:center;font-weight:700;font-size:0.75rem;color:var(--muted);padding:4px;">' + d + '</div>';
  });

  // Add empty cells for first week
  if(dates.length > 0) {
    const firstDay = new Date(dates[0]).getDay();
    const emptyCount = firstDay === 0 ? 6 : firstDay - 1;
    for(let i=0; i<emptyCount; i++) {
      html += '<div></div>';
    }
  }

  dates.forEach(date => {
    let totalTasks = 0;
    filteredStaff.forEach(s => {
      totalTasks += getTLTasksInRange(s.id, date, date).length;
    });
    const st = getTaskStatus(totalTasks, thresholds);
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    const dayNum = new Date(date).getDate();

    html += '<div onclick="showTLDayDetail(\'' + date + '\')" style="cursor:pointer;border-radius:10px;padding:8px 4px;text-align:center;' +
      'background:' + st.color + '22;border:2px solid ' + (isToday?'var(--fire)':st.color+'55') + ';' +
      (isToday?'box-shadow:0 0 0 2px var(--fire);':'') + '">' +
      '<div style="font-weight:700;font-size:0.9rem;">' + dayNum + '</div>' +
      '<div style="font-size:0.7rem;font-weight:700;color:' + st.color + ';">' + totalTasks + ' tasks</div>' +
      '<div style="font-size:0.65rem;">' + st.icon + '</div>' +
      '</div>';
  });

  html += '</div>';
  grid.innerHTML = html;
  } catch(_e) { console.error("[SG] renderTLCalendar:", _e); }
}

function showTLDayDetail(date) {
  try {
  const staffList = getStaffList().filter(s=>s.active!==false);
  const selEmp = document.getElementById('tlCalEmp')?.value || '';
  const filteredStaff = selEmp ? staffList.filter(s=>s.id===selEmp) : staffList;

  const wrap = document.getElementById('tlDayDetailWrap');
  const title = document.getElementById('tlDayDetailTitle');
  const content = document.getElementById('tlDayDetailContent');

  if(!wrap || !content) return;

  const displayDate = new Date(date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  if(title) title.textContent = '📋 Tasks on ' + displayDate;

  let html = '';
  let totalCount = 0;

  filteredStaff.forEach(s => {
    const myTasks = getTLTasksInRange(s.id, date, date);
    if(!myTasks.length) return;
    totalCount += myTasks.length;
    html += '<div style="margin-bottom:12px;padding:12px;background:#f9f7f5;border-radius:10px;">';
    html += '<div style="font-weight:700;margin-bottom:8px;">👤 ' + s.name + ' (' + s.role + ') — ' + myTasks.length + ' tasks</div>';
    myTasks.forEach(t => {
      const done = t.status==='completed';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px;background:#fff;border-radius:8px;margin-bottom:4px;">' +
        '<span>' + (done?'✅':'⏳') + '</span>' +
        '<span style="font-size:0.85rem;flex:1;">' + (t.title||t.desc||'Task') + '</span>' +
        '<span style="font-size:0.75rem;background:' + (done?'#e8f5e9':'#fff8e1') + ';color:' + (done?'#2e7d32':'#e65100') + ';padding:2px 8px;border-radius:8px;font-weight:700;">' + (done?'Done':'Pending') + '</span>' +
        '</div>';
    });
    html += '</div>';
  });

  if(!html) html = '<div style="text-align:center;padding:20px;color:var(--muted);">No tasks on this date</div>';

  content.innerHTML = html;
  wrap.style.display = 'block';
  wrap.scrollIntoView({behavior:'smooth'});
  } catch(_e) { console.error("[SG] showTLDayDetail:", _e); }
}


// ============================================================
// KPI DASHBOARD
// ============================================================

function canViewKPI() {
  try {
  return currentUser?.role==='Admin' || 
         currentUser?.perms?.includes('KPI - View');
  } catch(_e) { console.error("[SG] canViewKPI:", _e); }
}

function canSetKPITargets() {
  try {
  return currentUser?.role==='Admin' || 
         currentUser?.perms?.includes('KPI - Set Targets');
  } catch(_e) { console.error("[SG] canSetKPITargets:", _e); }
}

function getKPITargets(period) {
  try {
  const saved = (_settingsCache['sg_kpi_targets'])||{};
  return saved[period] || {revenue:0, orders:0, completion:90, newCustomers:0};
  } catch(_e) { console.error("[SG] getKPITargets:", _e); }
}

function saveKPITargets() {
  try {
  const period = window._kpiPeriod || 'weekly';
  const targets = {
    revenue: parseInt(document.getElementById('kpiTargetRevenue')?.value)||0,
    orders: parseInt(document.getElementById('kpiTargetOrders')?.value)||0,
    completion: parseInt(document.getElementById('kpiTargetCompletion')?.value)||90,
    newCustomers: parseInt(document.getElementById('kpiTargetNewCust')?.value)||0,
    attendance: parseInt(document.getElementById('kpiTargetAttendance')?.value)||90
  };
  const saved = (_settingsCache['sg_kpi_targets'])||{};
  saved[period] = targets;
  _settingsCache['sg_kpi_targets']=saved; setSetting('sg_kpi_targets', saved);
  closeModal('kpiTargetsModal');
  showToast('✅ KPI Targets saved!');
  renderKPI();
  } catch(_e) { console.error("[SG] saveKPITargets:", _e); }
}

function openKPITargets() {
  try {
  const period = window._kpiPeriod || 'weekly';
  const t = getKPITargets(period);
  const r=document.getElementById('kpiTargetRevenue'); if(r) r.value=t.revenue||'';
  const o=document.getElementById('kpiTargetOrders'); if(o) o.value=t.orders||'';
  const c=document.getElementById('kpiTargetCompletion'); if(c) c.value=t.completion||90;
  const n=document.getElementById('kpiTargetNewCust'); if(n) n.value=t.newCustomers||'';
  const at=document.getElementById('kpiTargetAttendance'); if(at) at.value=t.attendance||90;
  document.getElementById('kpiTargetsModal').classList.add('open');
  } catch(_e) { console.error("[SG] openKPITargets:", _e); }
}

function setKPIPeriod(period) {
  try {
  window._kpiPeriod = period;
  ['daily','weekly','monthly','yearly'].forEach(p => {
    const btn = document.getElementById('kpiBtn_'+p);
    if(!btn) return;
    const active = p===period;
    btn.style.background = active?'var(--fire)':'#fff';
    btn.style.color = active?'#fff':'#333';
    btn.style.borderColor = active?'var(--fire)':'#e8d5c8';
  });
  // Set date range — use IST date (not UTC)
  const today = getTodayIST();
  const now = new Date(today); // IST date as local
  let from = today, to = today, label = '';
  if(period==='daily') {
    from = to = today; label = '📅 Today';
  } else if(period==='weekly') {
    const wr = getWeekRange(now);
    from = wr.from; to = wr.to;
    label = '📆 This Week';
  } else if(period==='monthly') {
    from = today.substring(0,7)+'-01';
    const last = new Date(now.getFullYear(), now.getMonth()+1, 0);
    to = today.substring(0,7)+'-'+String(last.getDate()).padStart(2,'0');
    label = '🗓️ This Month';
  } else {
    from = now.getFullYear()+'-01-01';
    to = now.getFullYear()+'-12-31';
    label = '📈 This Year';
  }
  const fromEl=document.getElementById('kpiDateFrom'); if(fromEl) fromEl.value=from;
  const toEl=document.getElementById('kpiDateTo'); if(toEl) toEl.value=to;
  const labelEl=document.getElementById('kpiDateLabel'); if(labelEl) labelEl.textContent=label;
  renderKPI();
  } catch(_e) { console.error("[SG] setKPIPeriod:", _e); }
}

function getKPIDateRange() {
  try {
  const from = document.getElementById('kpiDateFrom')?.value || new Date().toISOString().split('T')[0];
  const to = document.getElementById('kpiDateTo')?.value || from;
  return {from, to};
  } catch(_e) { console.error("[SG] getKPIDateRange:", _e); }
}

async function renderKPI() {
  try {
  if(!canViewKPI()) {
    const wrap = document.getElementById('sec-kpi');
    if(wrap) wrap.innerHTML = '<div style="text-align:center;padding:40px;"><div style="font-size:3rem;">🔒</div><p>You do not have access to the KPI Dashboard.</p></div>';
    return;
  }

  // Show Set Targets button if permission
  const targetsBtn = document.getElementById('kpiSetTargetsBtn');
  if(targetsBtn) targetsBtn.style.display = canSetKPITargets() ? 'inline-block' : 'none';

  const {from, to} = getKPIDateRange();
  const period = window._kpiPeriod || 'weekly';
  const targets = getKPITargets(period);

  // Get data — use global parseAnyDate for consistent date handling
  const orders = getOrders().filter(o => {
    const d = parseAnyDate(o);
    return d && d >= from && d <= to;
  });

  const customers = window.customers||[];
  const stock = (await invGet('stock')) || [];
  const waste = (await invGet('waste')) || [];
  const products = (await invGet('products')) || [];
  const rawmats = (await invGet('rawmats')) || [];
  const staff = getStaffList();

  // Calculate metrics
  const totalRevenue = orders.reduce((s,o)=>s+(o.grandTotal||o.total||0),0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o=>['Delivered','Collected','Served'].includes(o.status)).length;
  const cancelledOrders = orders.filter(o=>o.status==='Cancelled').length;
  const completionRate = totalOrders ? Math.round((completedOrders/totalOrders)*100) : 0;
  const cancellationRate = totalOrders ? Math.round((cancelledOrders/totalOrders)*100) : 0;
  const avgOrderValue = totalOrders ? Math.round(totalRevenue/totalOrders) : 0;

  // New customers in period (by first order date)
  const newCusts = customers.filter(c => {
    const d = parseAnyDate({created_at: c.created_at, createdAt: c.createdAt, date: c.date, time: c.time});
    return d && d >= from && d <= to;
  }).length;

  // Order types
  const dineIn = orders.filter(o=>o.type==='Dine-In').length;
  const takeaway = orders.filter(o=>o.type==='Takeaway').length;
  const delivery = orders.filter(o=>o.type==='Home Delivery').length;
  const walkIn = orders.filter(o=>o.type==='Walk-In').length;

  // Waste value
  const wasteItems = waste.filter(w => {
    const d = parseAnyDate(w.date);
    return d && d >= from && d <= to;
  });
  const wasteValue = wasteItems.reduce((s,w)=>s+(parseFloat(w.cost)||0),0);

  // Low stock count — build proper item lookup from products+rawmats, since inv_stock only has qty
  const lowStock = stock.filter(s => {
    const qty = parseFloat(s.qty)||0;
    const thresh = getEffectiveThreshold(s.type, s.itemId);
    return qty <= thresh.min;
  }).length;

  // ===== RENDER KPI CARDS =====
  function kpiCard(icon, label, actual, target, format, color) {
    try {
    const pct = target>0 ? Math.min(100,Math.round((actual/target)*100)) : null;
    const barColor = pct===null?color : pct>=100?'#2e7d32':pct>=75?'#f9a825':'#c62828';
    const formatted = format==='currency'?'₹'+actual.toLocaleString('en-IN'):
                      format==='pct'?actual+'%':actual.toLocaleString('en-IN');
    const targetFormatted = target>0?(format==='currency'?'₹'+target.toLocaleString('en-IN'):
                            format==='pct'?target+'%':target.toLocaleString('en-IN')):'Not set';
    return '<div style="background:#fff;border-radius:14px;padding:18px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border-top:4px solid '+color+';">'+
      '<div style="font-size:1.5rem;margin-bottom:4px;">'+icon+'</div>'+
      '<div style="font-size:0.78rem;color:var(--muted);font-weight:600;">'+label+'</div>'+
      '<div style="font-size:1.6rem;font-weight:800;color:'+color+';margin:4px 0;">'+formatted+'</div>'+
      (target>0?
        '<div style="font-size:0.72rem;color:var(--muted);">Target: '+targetFormatted+' ('+pct+'%)</div>'+
        '<div style="background:#f0f0f0;border-radius:20px;height:6px;margin-top:6px;overflow:hidden;">'+
          '<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:20px;transition:width 0.5s;"></div>'+
        '</div>' :
        '<div style="font-size:0.72rem;color:var(--muted);">No target set</div>')+
    '</div>';
    } catch(_e) { console.error("[SG] kpiCard:", _e); }
}

  // Staff Attendance %
  const totalStaff = staff.filter(s=>s.active!==false).length;
  const attendance = JSON.parse(localStorage.getItem('sg_attendance')||'[]');
  const attendanceInRange = attendance.filter(a => a.date >= from && a.date <= to);
  const presentCount = attendanceInRange.filter(a=>a.status==='present'||a.status==='Present').length;
  const attendancePct = totalStaff > 0 && attendanceInRange.length > 0
    ? Math.round((presentCount / attendanceInRange.length) * 100) : 0;

  // Returning vs New Customers
  const allCustMobiles = new Set(customers.map(c=>c.mobile));
  const orderMobiles = orders.map(o=>o.mobile).filter(Boolean);
  const uniqueOrderMobiles = [...new Set(orderMobiles)];
  const returningCusts = uniqueOrderMobiles.filter(m => {
    const c = customers.find(x=>x.mobile===m);
    return c && (c.orders||0) > 1;
  }).length;

  // Complaints Count
  const complaints = JSON.parse(localStorage.getItem('sg_complaints')||'[]'); // complaints stay in localStorage
  const complaintsInRange = complaints.filter(c => {
    const d = c.date||c.createdAt||'';
    return d >= from && d <= to;
  }).length;
  // Also count orders with complaints/issues from notes
  const orderComplaints = orders.filter(o =>
    o.notes && ((o.notes||'').toLowerCase().includes('complaint') ||
    (o.notes||'').toLowerCase().includes('issue') ||
    (o.notes||'').toLowerCase().includes('problem'))
  ).length;
  const totalComplaints = complaintsInRange + orderComplaints;

  // Waste % — industry-standard metric: how much of this period's SALES
  // REVENUE was lost to waste. (Using current stock value as the denominator
  // was misleading — it penalized lean/efficient stock management and let
  // restaurants dilute their real waste ratio simply by hoarding stock.)
  const wastePct = totalRevenue > 0 ? Math.round((wasteValue/totalRevenue)*10000)/100 : 0;

  const cardsHtml =
    kpiCard('💰','Total Revenue', totalRevenue, targets.revenue, 'currency','#e65100') +
    kpiCard('📦','Total Orders', totalOrders, targets.orders, 'number','#1565c0') +
    kpiCard('✅','Completion Rate', completionRate, targets.completion, 'pct','#2e7d32') +
    kpiCard('❌','Cancellation Rate', cancellationRate, 0, 'pct','#c62828') +
    kpiCard('💵','Avg Order Value', avgOrderValue, 0, 'currency','#6a1b9a') +
    kpiCard('👤','New Customers', newCusts, targets.newCustomers, 'number','#00838f') +
    kpiCard('🔄','Returning Customers', returningCusts, 0, 'number','#0277bd') +
    kpiCard('📢','Complaints', totalComplaints, 0, 'number', totalComplaints>0?'#c62828':'#2e7d32') +
    kpiCard('👥','Staff Attendance', attendancePct, targets.attendance||90, 'pct', attendancePct>=90?'#2e7d32':attendancePct>=75?'#f9a825':'#c62828') +
    kpiCard('🗑️','Waste Value', Math.round(wasteValue), 0, 'currency','#ef6c00') +
    kpiCard('📊','Waste %', wastePct, 0, 'pct', wastePct>10?'#c62828':'#2e7d32') +
    kpiCard('⚠️','Low Stock Items', lowStock, 0, 'number', lowStock>0?'#c62828':'#2e7d32');

  const cardsEl = document.getElementById('kpiCards');
  if(cardsEl) cardsEl.innerHTML = cardsHtml;

  // ===== ORDER TYPE BREAKDOWN =====
  const typesEl = document.getElementById('kpiOrderTypes');
  if(typesEl) {
    const total = dineIn+takeaway+delivery+walkIn||1;
    typesEl.innerHTML =
      '<div style="margin-bottom:12px;">'+
        ['🪑 Dine-In:'+dineIn+':var(--fire)', '🥡 Takeaway:'+takeaway+':#1565c0', '🚴 Delivery:'+delivery+':#2e7d32', '🚶 Walk-In:'+walkIn+':#6a1b9a'].map(t=>{
          const [lbl,cnt,clr] = t.split(':');
          const pct = Math.round(parseInt(cnt)/total*100);
          return '<div style="margin-bottom:10px;">'+
            '<div style="display:flex;justify-content:space-between;font-size:0.85rem;font-weight:700;margin-bottom:4px;">'+
              '<span>'+lbl+'</span><span>'+cnt+' ('+pct+'%)</span>'+
            '</div>'+
            '<div style="background:#f0f0f0;border-radius:20px;height:10px;overflow:hidden;">'+
              '<div style="height:100%;width:'+pct+'%;background:'+clr+';border-radius:20px;"></div>'+
            '</div></div>';
        }).join('')+
      '</div>';
  }

  // ===== REVENUE TREND (daily breakdown) =====
  const trendEl = document.getElementById('kpiRevenueTrend');
  if(trendEl && period!=='yearly') {
    // Get daily revenue
    const dateMap = {};
    orders.forEach(o => {
      const d = parseAnyDate(o);
      if(d) dateMap[d] = (dateMap[d]||0)+(o.grandTotal||o.total||0);
    });
    const dates = Object.keys(dateMap).sort();
    if(dates.length) {
      const maxRev = Math.max(...Object.values(dateMap))||1;
      trendEl.innerHTML = '<div style="display:flex;align-items:flex-end;gap:4px;height:80px;">'+
        dates.map(d=>{
          const rev = dateMap[d];
          const h = Math.round((rev/maxRev)*80);
          const day = new Date(d).getDate();
          return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">'+
            '<div style="font-size:0.6rem;color:var(--fire);font-weight:700;">₹'+Math.round(rev/1000)+'k</div>'+
            '<div style="width:100%;height:'+h+'px;background:var(--fire);border-radius:4px 4px 0 0;min-height:4px;"></div>'+
            '<div style="font-size:0.6rem;color:var(--muted);">'+day+'</div>'+
          '</div>';
        }).join('')+
      '</div>';
    } else {
      trendEl.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px;">No revenue data</div>';
    }
  }

  // ===== TOP CUSTOMERS + NEW vs RETURNING =====
  const topCustEl = document.getElementById('kpiTopCustomers');
  if(topCustEl) {
    const custOrders = {};
    orders.forEach(o => {
      if(!o.mobile) return;
      if(!custOrders[o.mobile]) custOrders[o.mobile] = {name:o.name, mobile:o.mobile, orders:0, revenue:0};
      custOrders[o.mobile].orders++;
      custOrders[o.mobile].revenue += (o.grandTotal||o.total||0);
    });
    const top5 = Object.values(custOrders).sort((a,b)=>b.revenue-a.revenue).slice(0,5);
    // New vs Returning summary
    const newVsReturning = '<div style="display:flex;gap:12px;margin-bottom:12px;">'+
      '<div style="flex:1;background:#e8f5e9;border-radius:10px;padding:10px;text-align:center;">'+
        '<div style="font-size:1.4rem;font-weight:800;color:#2e7d32;">'+newCusts+'</div>'+
        '<div style="font-size:0.75rem;color:#2e7d32;font-weight:700;">🆕 New</div>'+
      '</div>'+
      '<div style="flex:1;background:#e3f2fd;border-radius:10px;padding:10px;text-align:center;">'+
        '<div style="font-size:1.4rem;font-weight:800;color:#1565c0;">'+returningCusts+'</div>'+
        '<div style="font-size:0.75rem;color:#1565c0;font-weight:700;">🔄 Returning</div>'+
      '</div>'+
    '</div>';
    topCustEl.innerHTML = newVsReturning + (top5.length ? top5.map((c,i)=>
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;">'+
        '<div style="width:24px;height:24px;border-radius:50%;background:var(--fire);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;">'+(i+1)+'</div>'+
        '<div style="flex:1;"><div style="font-weight:700;font-size:0.85rem;">'+c.name+'</div><div style="font-size:0.72rem;color:var(--muted);">'+c.orders+' orders</div></div>'+
        '<div style="font-weight:700;color:var(--fire);">₹'+c.revenue.toLocaleString('en-IN')+'</div>'+
      '</div>'
    ).join('') : '') + (top5.length ? '' : '<div style="text-align:center;color:var(--muted);padding:20px;">No customer data</div>');
  }

  // ===== STAFF PERFORMANCE =====
  const staffEl = document.getElementById('kpiStaffPerf');
  if(staffEl) {
    const assignments = getOrderAssignments();
    const allTasks = getTasks();
    const staffPerf = staff.filter(s=>s.active!==false).map(s => {
      const handled = orders.filter(o => {
        const a = assignments[o.id];
        return a && (a.cookId===s.id||a.assignedTo===s.id||a.handedTo===s.id||a.waiterId===s.id||a.deliveryBoyId===s.id);
      }).length;
      // Task completion
      const myTasks = allTasks.filter(t=>t.assignedTo===s.id && t.date>=from && t.date<=to);
      const doneTasks = myTasks.filter(t=>t.status==='completed').length;
      const taskRate = myTasks.length ? Math.round((doneTasks/myTasks.length)*100) : 0;
      // Attendance
      const myAttendance = attendanceInRange.filter(a=>a.staffId===s.id||a.name===s.name);
      const myPresent = myAttendance.filter(a=>a.status==='present'||a.status==='Present').length;
      const attPct = myAttendance.length ? Math.round((myPresent/myAttendance.length)*100) : null;
      return {name:s.name, role:s.role, handled, taskRate, attPct, myTasks:myTasks.length};
    }).sort((a,b)=>b.handled-a.handled).slice(0,8);

    staffEl.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">'+
      '<thead><tr style="background:#f9f7f5;">'+
        '<th style="padding:8px;text-align:left;">Staff</th>'+
        '<th style="padding:8px;text-align:center;">Orders</th>'+
        '<th style="padding:8px;text-align:center;">Tasks Done</th>'+
        '<th style="padding:8px;text-align:center;">Attendance</th>'+
      '</tr></thead><tbody>'+
      (staffPerf.length ? staffPerf.map(s=>
        '<tr style="border-bottom:1px solid #f0f0f0;">'+
          '<td style="padding:8px;"><div style="font-weight:700;">'+s.name+'</div><div style="font-size:0.72rem;color:var(--muted);">'+s.role+'</div></td>'+
          '<td style="padding:8px;text-align:center;font-weight:700;color:#1565c0;">'+s.handled+'</td>'+
          '<td style="padding:8px;text-align:center;font-weight:700;color:'+(s.taskRate>=80?'#2e7d32':s.taskRate>=50?'#f9a825':'#c62828')+';">'+s.taskRate+'%</td>'+
          '<td style="padding:8px;text-align:center;font-weight:700;color:'+(s.attPct===null?'#aaa':s.attPct>=90?'#2e7d32':s.attPct>=75?'#f9a825':'#c62828')+';">'+(s.attPct===null?'N/A':s.attPct+'%')+'</td>'+
        '</tr>'
      ).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted);">No staff data</td></tr>')+
      '</tbody></table>';
  }

  // ===== INVENTORY =====
  const invEl = document.getElementById('kpiInventory');
  if(invEl) {
    const lowItems = stock.filter(s => {
      const qty = parseFloat(s.qty)||0;
      const thresh = getEffectiveThreshold(s.type, s.itemId);
      return qty <= thresh.min;
    });
    invEl.innerHTML = lowItems.length ?
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">'+
        lowItems.map(s=>{
          const name = getItemName(s.type, s.itemId, products, rawmats);
          const unit = getItemUnit(s.type, s.itemId, products, rawmats);
          return '<div style="background:#fff8e1;border-radius:8px;padding:10px;border:1px solid #ffe082;">'+
            '<div style="font-weight:700;font-size:0.85rem;">⚠️ '+name+'</div>'+
            '<div style="font-size:0.75rem;color:#e65100;">'+(parseFloat(s.qty)||0)+' '+unit+' left</div>'+
          '</div>';
        }).join('')+
      '</div>' :
      '<div style="color:#2e7d32;font-weight:700;padding:10px;">✅ All stock levels normal</div>';
  }
  } catch(_e) { console.error("[SG] renderKPI:", _e); }
}


// ============================================================
// STAFF SCHEDULING
// ============================================================
// getShiftTypes/saveShiftTypes/getSchedule/saveSchedule/getLeaveRequests/saveLeaveRequests/getSwapRequests/saveSwapRequests defined above with Supabase sync

function initDefaultShifts(){
  try {
  if(getShiftTypes().length) return;
  saveShiftTypes([
    {id:'sh1',name:'Morning Shift',start:'09:00',end:'17:00',color:'#e65100'},
    {id:'sh2',name:'Afternoon Shift',start:'13:00',end:'21:00',color:'#1565c0'},
    {id:'sh3',name:'Night Shift',start:'21:00',end:'05:00',color:'#4a148c'},
  ]);
  } catch(_e) { console.error("[SG] initDefaultShifts:", _e); }
}

function showSchedTab(tab){
  try {
  ['weekly','shifts','leave','swap','reminders'].forEach(function(t){
    var btn=document.getElementById('schedTab_'+t);
    var ct=document.getElementById('schedContent_'+t);
    if(btn){btn.style.background=t===tab?'var(--fire)':'#fff';btn.style.color=t===tab?'#fff':'#333';btn.style.borderColor=t===tab?'var(--fire)':'#e8d5c8';}
    if(ct) ct.style.display=t===tab?'block':'none';
  });
  if(tab==='weekly') renderWeeklySchedule();
  else if(tab==='shifts') renderShiftTypes();
  else if(tab==='leave') renderLeaveRequests();
  else if(tab==='swap') renderSwapRequests();
  else if(tab==='reminders') renderReminders();
  } catch(_e) { console.error("[SG] showSchedTab:", _e); }
}

function getWeekDates(dateStr){
  try {
  var d=new Date(dateStr),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);
  var mon=new Date(d); mon.setDate(diff);
  var dates=[];
  for(var i=0;i<7;i++){var dd=new Date(mon);dd.setDate(mon.getDate()+i);dates.push(dd.toISOString().split('T')[0]);}
  return dates;
  } catch(_e) { console.error("[SG] getWeekDates:", _e); }
}

function renderWeeklySchedule(){
  try {
  initDefaultShifts();
  var dateInput=document.getElementById('schedWeekDate');
  if(!dateInput) return;
  if(!dateInput.value) dateInput.value=new Date().toISOString().split('T')[0];
  var dates=getWeekDates(dateInput.value);
  var lbl=document.getElementById('schedWeekLabel');
  if(lbl) lbl.textContent=dates[0]+' → '+dates[6];
  var staff=getStaffList().filter(function(s){return s.active!==false;});
  var schedule=getSchedule();
  var leaves=getLeaveRequests().filter(function(l){return l.status==='approved';});
  var shiftTypes=getShiftTypes();
  var dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var today=new Date().toISOString().split('T')[0];
  var html='<table style="width:100%;border-collapse:collapse;min-width:700px;"><thead><tr><th style="padding:10px;background:#f9f7f5;text-align:left;border:1px solid #e8d5c8;min-width:130px;">Staff</th>';
  dates.forEach(function(d,i){
    var isT=d===today;
    html+='<th style="padding:10px;background:'+(isT?'var(--fire)':'#f9f7f5')+';color:'+(isT?'#fff':'var(--dark)')+';text-align:center;border:1px solid #e8d5c8;min-width:90px;">'+dayNames[i]+'<br><span style="font-size:0.72rem;font-weight:400;">'+new Date(d).getDate()+'/'+(new Date(d).getMonth()+1)+'</span></th>';
  });
  html+='</tr></thead><tbody>';
  staff.forEach(function(s){
    html+='<tr><td style="padding:10px;border:1px solid #e8d5c8;font-weight:700;font-size:0.85rem;"><div>'+s.name+'</div><div style="font-size:0.72rem;color:var(--muted);">'+s.role+'</div></td>';
    dates.forEach(function(d){
      var onLeave=leaves.some(function(l){return l.staffId===s.id&&d>=l.from&&d<=l.to;});
      var entry=schedule.find(function(e){return e.staffId===s.id&&e.date===d;});
      var shift=entry?shiftTypes.find(function(st){return st.id===entry.shiftId;}):null;
      var cellContent='',cellBg='#fff';
      if(onLeave){
        cellContent='<div style="background:#fce4ec;color:#c62828;padding:4px 6px;border-radius:6px;font-size:0.72rem;font-weight:700;text-align:center;">🏖️ Leave</div>';
        cellBg='#fff8f8';
      } else if(entry&&entry.shiftId==='off'){
        cellContent='<div style="background:#f5f5f5;color:#aaa;padding:4px 6px;border-radius:6px;font-size:0.72rem;font-weight:700;text-align:center;">🔴 Off</div>';
        cellBg='#fafafa';
      } else if(shift){
        cellContent='<div style="background:'+shift.color+'22;color:'+shift.color+';padding:4px 6px;border-radius:6px;font-size:0.72rem;font-weight:700;text-align:center;border:1px solid '+shift.color+'44;">'+shift.name+'<br>'+to12hr(shift.start)+'-'+to12hr(shift.end)+'</div>';
        cellBg=shift.color+'08';
      } else {
        cellContent='<div data-sid="'+s.id+'" data-date="'+d+'" onclick="quickAssignShift(this)" style="cursor:pointer;color:#ccc;text-align:center;font-size:1.4rem;line-height:2;" title="Click to assign">+</div>';
      }
      html+='<td style="padding:6px;border:1px solid #e8d5c8;background:'+cellBg+';text-align:center;">'+cellContent+'</td>';
    });
    html+='</tr>';
  });
  html+='</tbody></table>';
  var grid=document.getElementById('weeklyScheduleGrid');
  if(grid) grid.innerHTML=html;
  } catch(_e) { console.error("[SG] renderWeeklySchedule:", _e); }
}

function quickAssignShift(el){
  try {
  openAssignShiftModal();
  var staffSel=document.getElementById('asStaff');
  if(staffSel) staffSel.value=el.dataset.sid;
  var dateFld=document.getElementById('asDate');
  if(dateFld) dateFld.value=el.dataset.date;
  } catch(_e) { console.error("[SG] quickAssignShift:", _e); }
}

function renderShiftTypes(){
  try {
  initDefaultShifts();
  var shifts=getShiftTypes();
  var el=document.getElementById('shiftTypesList');
  if(!el) return;
  el.innerHTML=shifts.length?shifts.map(function(s){
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border-radius:10px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:4px solid '+s.color+';">'+
      '<div style="width:20px;height:20px;border-radius:50%;background:'+s.color+';flex-shrink:0;"></div>'+
      '<div style="flex:1;"><div style="font-weight:700;">'+s.name+'</div><div style="font-size:0.78rem;color:var(--muted);">'+to12hr(s.start)+' – '+to12hr(s.end)+'</div></div>'+
      '<button onclick="editShiftType(\''+s.id+'\')" style="background:#e3f2fd;color:#1565c0;border:none;padding:5px 12px;border-radius:8px;cursor:pointer;font-size:0.78rem;">✏️ Edit</button>'+
      '<button onclick="deleteShiftType(\''+s.id+'\')" style="background:#fce4ec;color:#c62828;border:none;padding:5px 12px;border-radius:8px;cursor:pointer;font-size:0.78rem;">🗑️</button>'+
    '</div>';
  }).join(''):'<div style="text-align:center;padding:20px;color:var(--muted);">No shift types. Click "+ Add Shift".</div>';
  } catch(_e) { console.error("[SG] renderShiftTypes:", _e); }
}

function openShiftTypeModal(id){
  try {
  document.getElementById('editShiftTypeId').value=id||'';
  document.getElementById('shiftTypeModalTitle').textContent=id?'✏️ Edit Shift':'⏰ Add Shift Type';
  if(id){var s=getShiftTypes().find(function(x){return x.id===id;});if(s){document.getElementById('stName').value=s.name;document.getElementById('stStart').value=s.start;document.getElementById('stEnd').value=s.end;document.getElementById('stColor').value=s.color||'#e65100';}}
  else{['stName','stStart','stEnd'].forEach(function(f){var el=document.getElementById(f);if(el)el.value='';});document.getElementById('stColor').value='#e65100';}
  document.getElementById('shiftTypeModal').classList.add('open');
  } catch(_e) { console.error("[SG] openShiftTypeModal:", _e); }
}

function editShiftType(id){
  try {openShiftTypeModal(id);
  } catch(_e) { console.error("[SG] editShiftType:", _e); }
}

function saveShiftType(){
  try {
  var name=document.getElementById('stName').value.trim();
  var start=document.getElementById('stStart').value;
  var end=document.getElementById('stEnd').value;
  var color=document.getElementById('stColor').value||'#e65100';
  if(!name||!start||!end){showToast('Please fill all fields','error');return;}
  var id=document.getElementById('editShiftTypeId').value||'sh'+Date.now();
  var shifts=getShiftTypes();
  var idx=shifts.findIndex(function(s){return s.id===id;});
  var obj={id:id,name:name,start:start,end:end,color:color};
  if(idx>=0) shifts[idx]=obj; else shifts.push(obj);
  saveShiftTypes(shifts);
  closeModal('shiftTypeModal');
  renderShiftTypes();
  showToast('✅ Shift type saved!');
  } catch(_e) { console.error("[SG] saveShiftType:", _e); }
}

function deleteShiftType(id){
  try {
  if(!confirm('Delete this shift type?')) return;
  saveShiftTypes(getShiftTypes().filter(function(s){return s.id!==id;}));
  renderShiftTypes();
  showToast('Shift type deleted');
  } catch(_e) { console.error("[SG] deleteShiftType:", _e); }
}

function openAssignShiftModal(){
  try {
  var staffSel=document.getElementById('asStaff');
  if(staffSel){
    var staff=getStaffList().filter(function(s){return s.active!==false;});
    staffSel.innerHTML=staff.map(function(s){return '<option value="'+s.id+'">'+s.name+' ('+s.role+')</option>';}).join('');
  }
  var shiftSel=document.getElementById('asShift');
  if(shiftSel){
    shiftSel.innerHTML='<option value="off">🔴 Day Off</option>'+getShiftTypes().map(function(s){return '<option value="'+s.id+'">'+s.name+' ('+to12hr(s.start)+'-'+to12hr(s.end)+')</option>';}).join('');
  }
  var dateFld=document.getElementById('asDate');
  if(dateFld&&!dateFld.value) dateFld.value=new Date().toISOString().split('T')[0];
  document.getElementById('assignShiftModal').classList.add('open');
  } catch(_e) { console.error("[SG] openAssignShiftModal:", _e); }
}

function saveShiftAssignment(){
  try {
  var staffId=document.getElementById('asStaff').value;
  var date=document.getElementById('asDate').value;
  var shiftId=document.getElementById('asShift').value;
  var note=document.getElementById('asNote').value||'';
  if(!staffId||!date||!shiftId){showToast('Please fill all fields','error');return;}
  var schedule=getSchedule();
  var idx=schedule.findIndex(function(e){return e.staffId===staffId&&e.date===date;});
  var entry={id:'sch'+Date.now(),staffId:staffId,date:date,shiftId:shiftId,note:note,assignedBy:currentUser&&currentUser.name,assignedAt:new Date().toLocaleString('en-IN')};
  if(idx>=0) schedule[idx]=entry; else schedule.push(entry);
  saveSchedule(schedule);
  closeModal('assignShiftModal');
  renderWeeklySchedule();
  checkShiftReminders();
  showToast('✅ Shift assigned!');
  } catch(_e) { console.error("[SG] saveShiftAssignment:", _e); }
}

function renderLeaveRequests(){
  try {
  var leaves=getLeaveRequests();
  var el=document.getElementById('leaveRequestsList');
  if(!el) return;
  var isAdmin=currentUser&&currentUser.role==='Admin';
  var typeLabels={sick:'🤒 Sick Leave',casual:'🏖️ Casual Leave',planned:'📅 Planned Leave'};
  var statusColors={pending:'#f9a825',approved:'#2e7d32',rejected:'#c62828'};
  if(!leaves.length){el.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);">No leave requests yet.</div>';return;}
  var html='';
  leaves.sort(function(a,b){return b.id>a.id?-1:1;}).forEach(function(l){
    var sc=statusColors[l.status]||'#ccc';
    html+='<div style="background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:4px solid '+sc+';display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
    html+='<div style="flex:1;min-width:150px;"><div style="font-weight:700;">'+l.staffName+'</div>';
    html+='<div style="font-size:0.78rem;color:var(--muted);">'+(typeLabels[l.type]||l.type)+' | '+l.from+' → '+l.to+'</div>';
    if(l.reason) html+='<div style="font-size:0.75rem;color:var(--muted);">📝 '+l.reason+'</div>';
    html+='</div>';
    html+='<span style="background:'+sc+'22;color:'+sc+';padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">'+(l.status||'').toUpperCase()+'</span>';
    if(isAdmin&&l.status==='pending'){
      html+='<button data-lid="'+l.id+'" onclick="approveLeave(this.dataset.lid)" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;padding:5px 12px;border-radius:8px;font-size:0.78rem;cursor:pointer;font-weight:700;">✅ Approve</button>';
      html+='<button data-lid="'+l.id+'" onclick="rejectLeave(this.dataset.lid)" style="background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;padding:5px 12px;border-radius:8px;font-size:0.78rem;cursor:pointer;font-weight:700;">❌ Reject</button>';
    }
    html+='</div>';
  });
  el.innerHTML=html;
  } catch(_e) { console.error("[SG] renderLeaveRequests:", _e); }
}

function openLeaveRequestModal(){
  try {
  var staffSel=document.getElementById('lrStaff');
  if(staffSel){var staff=getStaffList().filter(function(s){return s.active!==false;});staffSel.innerHTML=staff.map(function(s){return '<option value="'+s.id+'" data-name="'+s.name+'">'+s.name+' ('+s.role+')</option>';}).join('');}
  var today=new Date().toISOString().split('T')[0];
  var f=document.getElementById('lrFrom');if(f) f.value=today;
  var t=document.getElementById('lrTo');if(t) t.value=today;
  document.getElementById('leaveRequestModal').classList.add('open');
  } catch(_e) { console.error("[SG] openLeaveRequestModal:", _e); }
}

function saveLeaveRequest(){
  try {
  var staffSel=document.getElementById('lrStaff');
  var staffId=staffSel&&staffSel.value;
  var staffName=staffSel&&staffSel.options[staffSel.selectedIndex]&&staffSel.options[staffSel.selectedIndex].dataset.name||'';
  var type=document.getElementById('lrType').value;
  var from=document.getElementById('lrFrom').value;
  var to=document.getElementById('lrTo').value;
  var reason=document.getElementById('lrReason').value||'';
  if(!staffId||!type||!from||!to){showToast('Please fill all fields','error');return;}
  if(from>to){showToast('From date cannot be after To date','error');return;}
  var leaves=getLeaveRequests();
  leaves.push({id:'lv'+Date.now(),staffId:staffId,staffName:staffName,type:type,from:from,to:to,reason:reason,status:'pending',createdAt:new Date().toLocaleString('en-IN')});
  saveLeaveRequests(leaves);
  closeModal('leaveRequestModal');
  renderLeaveRequests();
  showToast('✅ Leave request submitted!');
  } catch(_e) { console.error("[SG] saveLeaveRequest:", _e); }
}

function approveLeave(id){
  try {
  var leaves=getLeaveRequests();
  var l=leaves.find(function(x){return x.id===id;});
  if(l){l.status='approved';l.approvedBy=currentUser&&currentUser.name;l.approvedAt=new Date().toLocaleString('en-IN');}
  saveLeaveRequests(leaves);renderLeaveRequests();showToast('✅ Leave approved!');
  } catch(_e) { console.error("[SG] approveLeave:", _e); }
}

function rejectLeave(id){
  try {
  var leaves=getLeaveRequests();
  var l=leaves.find(function(x){return x.id===id;});
  if(l){l.status='rejected';l.rejectedBy=currentUser&&currentUser.name;}
  saveLeaveRequests(leaves);renderLeaveRequests();showToast('Leave rejected');
  } catch(_e) { console.error("[SG] rejectLeave:", _e); }
}

function renderSwapRequests(){
  try {
  var swaps=getSwapRequests();
  var el=document.getElementById('swapRequestsList');
  if(!el) return;
  var isAdmin=currentUser&&currentUser.role==='Admin';
  var statusColors={pending:'#f9a825',approved:'#2e7d32',rejected:'#c62828','staff-approved':'#1565c0'};
  var shiftTypes=getShiftTypes();
  var schedule=getSchedule();
  if(!swaps.length){el.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);">No swap requests yet.</div>';return;}
  var html='';
  swaps.sort(function(a,b){return b.id>a.id?-1:1;}).forEach(function(sw){
    var sc=statusColors[sw.status]||'#ccc';
    var fe=schedule.find(function(e){return e.staffId===sw.fromStaffId&&e.date===sw.fromDate;});
    var te=schedule.find(function(e){return e.staffId===sw.toStaffId&&e.date===sw.toDate;});
    var fSN=fe?(shiftTypes.find(function(s){return s.id===fe.shiftId;})||{name:'Off'}).name:'Not set';
    var tSN=te?(shiftTypes.find(function(s){return s.id===te.shiftId;})||{name:'Off'}).name:'Not set';
    html+='<div style="background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:4px solid '+sc+';">';
    html+='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
    html+='<div style="flex:1;min-width:200px;"><div style="font-weight:700;font-size:0.88rem;">🔄 '+sw.fromStaffName+' ↔ '+sw.toStaffName+'</div>';
    html+='<div style="font-size:0.75rem;color:var(--muted);margin-top:4px;">'+sw.fromStaffName+': '+sw.fromDate+' ('+fSN+') ↔ '+sw.toStaffName+': '+sw.toDate+' ('+tSN+')</div>';
    if(sw.reason) html+='<div style="font-size:0.72rem;color:var(--muted);">📝 '+sw.reason+'</div>';
    html+='</div>';
    html+='<span style="background:'+sc+'22;color:'+sc+';padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">'+(sw.status||'').toUpperCase()+'</span>';
    if(sw.status==='pending') html+='<button data-sid="'+sw.id+'" onclick="staffApproveSwap(this.dataset.sid)" style="background:#e3f2fd;color:#1565c0;border:1px solid #90caf9;padding:5px 12px;border-radius:8px;font-size:0.78rem;cursor:pointer;font-weight:700;">👤 Staff Approve</button>';
    if(isAdmin&&sw.status==='staff-approved'){
      html+='<button data-sid="'+sw.id+'" onclick="adminApproveSwap(this.dataset.sid)" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;padding:5px 12px;border-radius:8px;font-size:0.78rem;cursor:pointer;font-weight:700;">✅ Admin Approve</button>';
      html+='<button data-sid="'+sw.id+'" onclick="rejectSwap(this.dataset.sid)" style="background:#fce4ec;color:#c62828;border:1px solid #ef9a9a;padding:5px 12px;border-radius:8px;font-size:0.78rem;cursor:pointer;font-weight:700;">❌ Reject</button>';
    }
    html+='</div></div>';
  });
  el.innerHTML=html;
  } catch(_e) { console.error("[SG] renderSwapRequests:", _e); }
}

function openSwapRequestModal(){
  try {
  var staff=getStaffList().filter(function(s){return s.active!==false;});
  var opts=staff.map(function(s){return '<option value="'+s.id+'" data-name="'+s.name+'">'+s.name+'</option>';}).join('');
  var f=document.getElementById('swFrom');if(f) f.innerHTML=opts;
  var t=document.getElementById('swTo');if(t) t.innerHTML=opts;
  var today=new Date().toISOString().split('T')[0];
  var fd=document.getElementById('swFromDate');if(fd) fd.value=today;
  var td=document.getElementById('swToDate');if(td) td.value=today;
  document.getElementById('swapRequestModal').classList.add('open');
  } catch(_e) { console.error("[SG] openSwapRequestModal:", _e); }
}

function saveSwapRequest(){
  try {
  var fromSel=document.getElementById('swFrom');
  var toSel=document.getElementById('swTo');
  var fromStaffId=fromSel&&fromSel.value;
  var fromStaffName=fromSel&&fromSel.options[fromSel.selectedIndex]&&fromSel.options[fromSel.selectedIndex].dataset.name||'';
  var toStaffId=toSel&&toSel.value;
  var toStaffName=toSel&&toSel.options[toSel.selectedIndex]&&toSel.options[toSel.selectedIndex].dataset.name||'';
  var fromDate=document.getElementById('swFromDate').value;
  var toDate=document.getElementById('swToDate').value;
  var reason=document.getElementById('swReason').value||'';
  if(!fromStaffId||!toStaffId||!fromDate||!toDate){showToast('Please fill all fields','error');return;}
  if(fromStaffId===toStaffId){showToast('Cannot swap with same staff','error');return;}
  var swaps=getSwapRequests();
  swaps.push({id:'sw'+Date.now(),fromStaffId:fromStaffId,fromStaffName:fromStaffName,fromDate:fromDate,toStaffId:toStaffId,toStaffName:toStaffName,toDate:toDate,reason:reason,status:'pending',createdAt:new Date().toLocaleString('en-IN')});
  saveSwapRequests(swaps);
  closeModal('swapRequestModal');
  renderSwapRequests();
  showToast('✅ Swap request submitted!');
  } catch(_e) { console.error("[SG] saveSwapRequest:", _e); }
}

function staffApproveSwap(id){
  try {
  var swaps=getSwapRequests();
  var sw=swaps.find(function(x){return x.id===id;});
  if(sw) sw.status='staff-approved';
  saveSwapRequests(swaps);renderSwapRequests();showToast('✅ Staff approved! Waiting for admin.');
  } catch(_e) { console.error("[SG] staffApproveSwap:", _e); }
}

function adminApproveSwap(id){
  try {
  var swaps=getSwapRequests();
  var sw=swaps.find(function(x){return x.id===id;});
  if(!sw) return;
  var schedule=getSchedule();
  var fe=schedule.find(function(e){return e.staffId===sw.fromStaffId&&e.date===sw.fromDate;});
  var te=schedule.find(function(e){return e.staffId===sw.toStaffId&&e.date===sw.toDate;});
  if(fe&&te){var tmp=fe.shiftId;fe.shiftId=te.shiftId;te.shiftId=tmp;fe.swapped=true;te.swapped=true;saveSchedule(schedule);}
  sw.status='approved';sw.approvedBy=currentUser&&currentUser.name;
  saveSwapRequests(swaps);renderSwapRequests();showToast('✅ Swap approved and applied!');
  } catch(_e) { console.error("[SG] adminApproveSwap:", _e); }
}

function rejectSwap(id){
  try {
  var swaps=getSwapRequests();
  var sw=swaps.find(function(x){return x.id===id;});
  if(sw) sw.status='rejected';
  saveSwapRequests(swaps);renderSwapRequests();showToast('Swap request rejected');
  } catch(_e) { console.error("[SG] rejectSwap:", _e); }
}

function checkShiftReminders(){
  try {
  var now=new Date();
  var today=now.toISOString().split('T')[0];
  var tomorrow=new Date(now);tomorrow.setDate(tomorrow.getDate()+1);
  var tomorrowStr=tomorrow.toISOString().split('T')[0];
  var schedule=getSchedule();
  var shiftTypes=getShiftTypes();
  var staff=getStaffList();
  var reminders=[];
  schedule.forEach(function(entry){
    if(entry.shiftId==='off') return;
    var shift=shiftTypes.find(function(s){return s.id===entry.shiftId;});
    if(!shift) return;
    var sm=staff.find(function(s){return s.id===entry.staffId;});
    if(!sm) return;
    var shiftStart=new Date(entry.date+'T'+shift.start);
    var diffMs=shiftStart-now;
    var diffHours=diffMs/(1000*60*60);
    var base={staffId:entry.staffId,staffName:sm.name,staffMobile:sm.mobile||'',staffEmail:sm.email||'',shiftName:shift.name,date:entry.date,start:shift.start,end:shift.end};
    if(entry.date===tomorrowStr){
      reminders.push(Object.assign({},base,{type:'1day',msg:'Your '+shift.name+' shift is tomorrow: '+to12hr(shift.start)+' – '+to12hr(shift.end)}));
    }
    if(entry.date===today&&diffHours>0&&diffHours<=2){
      reminders.push(Object.assign({},base,{type:'2hr',msg:'Your '+shift.name+' shift starts in 2 hours: '+to12hr(shift.start)+' – '+to12hr(shift.end)}));
    }
    if(entry.date===today&&diffMs>=0&&diffMs<=15*60*1000){
      reminders.push(Object.assign({},base,{type:'now',msg:'Your '+shift.name+' shift has started now! '+to12hr(shift.start)+' – '+to12hr(shift.end)}));
    }
  });
  _sbSync('sg_pending_reminders', reminders);
  return reminders;
  } catch(_e) { console.error("[SG] checkShiftReminders:", _e); }
}

function renderReminders(){
  try {
  var reminders=checkShiftReminders();
  var el=document.getElementById('remindersList');
  if(!el) return;
  var typeLabels={'1day':'📅 1 Day Before','2hr':'⏰ 2 Hours Before','now':'🚨 Shift Starting Now!'};
  var typeColor={'1day':'#1565c0','2hr':'#e65100','now':'#c62828'};
  el.innerHTML='<div style="margin-bottom:16px;background:#f9f7f5;border-radius:10px;padding:12px 16px;font-size:0.82rem;color:var(--muted);">💡 Click WhatsApp/Email to send reminder to staff.</div>'+
  (reminders.length?reminders.map(function(r){
    var wa=r.staffMobile?'<a href="https://wa.me/91'+r.staffMobile+'?text='+encodeURIComponent('SpiceGarden: '+r.msg)+'" target="_blank" style="background:#25D366;color:#fff;padding:6px 14px;border-radius:8px;font-size:0.78rem;font-weight:700;text-decoration:none;">💬 WhatsApp</a>':'';
    var em=r.staffEmail?'<a href="mailto:'+r.staffEmail+'?subject=Shift+Reminder&body='+encodeURIComponent('SpiceGarden: '+r.msg)+'" style="background:#1565c0;color:#fff;padding:6px 14px;border-radius:8px;font-size:0.78rem;font-weight:700;text-decoration:none;">📧 Email</a>':'';
    return '<div style="background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:4px solid '+typeColor[r.type]+';"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><div style="flex:1;"><div style="font-weight:700;font-size:0.88rem;color:'+typeColor[r.type]+';">'+typeLabels[r.type]+'</div><div style="font-weight:700;margin-top:2px;">'+r.staffName+'</div><div style="font-size:0.78rem;color:var(--muted);">'+r.msg+'</div></div>'+wa+' '+em+'</div></div>';
  }).join(''):'<div style="text-align:center;padding:30px;color:var(--muted);">✅ No pending reminders right now.</div>');
  } catch(_e) { console.error("[SG] renderReminders:", _e); }
}

setInterval(function(){
  var reminders=checkShiftReminders();
  if(reminders.some(function(r){return r.type==='now';})){
    showToast('🚨 Shift starting now! Check Reminders.','warning');
  }
},15*60*1000);


// ============================================================
// BUDGET CONTROL
// ============================================================
// getBudgets/saveBudgets/getExpenses/saveExpenses defined above with Supabase sync

var BUDGET_CATS = [
  {id:'staff',    label:'👥 Staff Salary',   color:'#1565c0'},
  {id:'inventory',label:'📦 Inventory/Stock', color:'#2e7d32'},
  {id:'utilities',label:'💡 Utilities',       color:'#e65100'},
  {id:'marketing',label:'📢 Marketing',       color:'#6a1b9a'},
  {id:'maintenance',label:'🔧 Maintenance',   color:'#00838f'},
  {id:'misc',     label:'📋 Miscellaneous',   color:'#795548'},
];

function canViewBudget(){return currentUser&&(currentUser.role==='Admin'||currentUser.perms&&currentUser.perms.includes('Budget - View'));}
function canManageBudget(){return currentUser&&(currentUser.role==='Admin'||currentUser.perms&&currentUser.perms.includes('Budget - Manage'));}

function setBudgetPeriod(period){
  try {
  window._budgetPeriod = period;
  ['monthly','yearly'].forEach(function(p){
    var btn=document.getElementById('budgetBtn_'+p);
    if(!btn) return;
    btn.style.background = p===period?'var(--fire)':'#fff';
    btn.style.color = p===period?'#fff':'#333';
    btn.style.borderColor = p===period?'var(--fire)':'#e8d5c8';
  });
  var mp = document.getElementById('budgetMonthPicker');
  if(mp){
    if(!mp.value) mp.value = getTodayIST().substring(0,7);
    mp.style.display = period==='monthly'?'inline-block':'none';
  }
  renderBudget();
  } catch(_e) { console.error("[SG] setBudgetPeriod:", _e); }
}

function getBudgetKey(){
  try {
  var period = window._budgetPeriod||'monthly';
  if(period==='monthly'){
    var mp = document.getElementById('budgetMonthPicker');
    return mp&&mp.value ? mp.value : getTodayIST().substring(0,7);
  }
  return getTodayIST().substring(0,4);
  } catch(_e) { console.error("[SG] getBudgetKey:", _e); }
}

function getBudgetForKey(key){
  try {
  var budgets = getBudgets();
  return budgets.find(function(b){return b.key===key;})||{key:key, cats:{}};
  } catch(_e) { console.error("[SG] getBudgetForKey:", _e); }
}

function getExpensesForKey(key){
  try {
  var expenses = getExpenses();
  var period = window._budgetPeriod||'monthly';
  return expenses.filter(function(e){
    if(period==='monthly') return e.date&&e.date.substring(0,7)===key;
    return e.date&&e.date.substring(0,4)===key;
  });
  } catch(_e) { console.error("[SG] getExpensesForKey:", _e); }
}

function renderBudget(){
  try {
  if(!canViewBudget()){
    var wrap=document.getElementById('sec-budget');
    if(wrap) wrap.innerHTML='<div style="text-align:center;padding:40px;"><div style="font-size:3rem;">🔒</div><p>You do not have access to Budget.</p></div>';
    return;
  }
  var setBtn = document.getElementById('budgetSetBtn');
  if(setBtn) setBtn.style.display = canManageBudget()?'inline-block':'none';

  var key = getBudgetKey();
  var period = window._budgetPeriod||'monthly';
  var budget = getBudgetForKey(key);
  var expenses = getExpensesForKey(key);

  // Period label
  var lbl = document.getElementById('budgetPeriodLabel');
  if(lbl) lbl.textContent = period==='monthly'?'📅 '+key:'📈 Year '+key;

  // Calculate totals
  var totalBudget=0, totalSpent=0;
  BUDGET_CATS.forEach(function(cat){
    totalBudget += parseFloat(budget.cats[cat.id]||0);
    totalSpent += expenses.filter(function(e){return e.category===cat.id;}).reduce(function(s,e){return s+(parseFloat(e.amount)||0);},0);
  });
  // Auto-add order revenue as income — use global parseAnyDate
  var orders = getOrders().filter(function(o){
    var d = parseAnyDate(o);
    if(!d) return false;
    if(period==='monthly') return d.substring(0,7)===key;
    return d.substring(0,4)===key;
  });
  var totalRevenue = orders.reduce(function(s,o){return s+(parseFloat(o.grandTotal||o.total)||0);},0);
  var profitLoss = totalRevenue - totalSpent;

  // Summary cards
  function summaryCard(icon,label,val,color,sub){
    try {
    return '<div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.07);border-top:4px solid '+color+';">'+
      '<div style="font-size:1.4rem;">'+icon+'</div>'+
      '<div style="font-size:0.78rem;color:var(--muted);font-weight:600;margin-top:2px;">'+label+'</div>'+
      '<div style="font-size:1.5rem;font-weight:800;color:'+color+';margin:4px 0;">₹'+Math.round(val).toLocaleString('en-IN')+'</div>'+
      (sub?'<div style="font-size:0.72rem;color:var(--muted);">'+sub+'</div>':'')+
    '</div>';
    } catch(_e) { console.error("[SG] summaryCard:", _e); }
}

  var cardsEl = document.getElementById('budgetSummaryCards');
  if(cardsEl){
    cardsEl.innerHTML =
      summaryCard('💰','Total Budget',totalBudget,'#1565c0',period==='monthly'?'This month':'This year') +
      summaryCard('💸','Total Spent',totalSpent,'#c62828',Math.round(totalBudget>0?(totalSpent/totalBudget*100):0)+'% used') +
      summaryCard('💵','Revenue',totalRevenue,'#2e7d32','From orders') +
      summaryCard(profitLoss>=0?'📈':'📉','Profit/Loss',Math.abs(profitLoss),profitLoss>=0?'#2e7d32':'#c62828',profitLoss>=0?'Profit':'Loss');
  }

  // Category breakdown
  var catEl = document.getElementById('budgetCategoryList');
  if(catEl){
    var html='';
    BUDGET_CATS.forEach(function(cat){
      var budgeted = parseFloat(budget.cats[cat.id]||0);
      var spent = expenses.filter(function(e){return e.category===cat.id;}).reduce(function(s,e){return s+(parseFloat(e.amount)||0);},0);
      var pct = budgeted>0?Math.min(100,Math.round(spent/budgeted*100)):0;
      var barColor = pct>=100?'#c62828':pct>=80?'#f9a825':'#2e7d32';
      html+='<div style="margin-bottom:16px;padding:14px;background:#f9f7f5;border-radius:10px;border-left:4px solid '+cat.color+';">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">'+
          '<div style="font-weight:700;">'+cat.label+'</div>'+
          '<div style="display:flex;gap:12px;align-items:center;">'+
            '<span style="font-size:0.82rem;color:var(--muted);">Budget: <b>₹'+budgeted.toLocaleString('en-IN')+'</b></span>'+
            '<span style="font-size:0.82rem;color:'+barColor+';">Spent: <b>₹'+Math.round(spent).toLocaleString('en-IN')+'</b></span>'+
            (budgeted>0?'<span style="background:'+barColor+'22;color:'+barColor+';padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:700;">'+pct+'%</span>':'')+
          '</div>'+
        '</div>'+
        (budgeted>0?
          '<div style="background:#e8e8e8;border-radius:20px;height:8px;overflow:hidden;">'+
            '<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:20px;transition:width 0.5s;"></div>'+
          '</div>':
          '<div style="font-size:0.75rem;color:var(--muted);">No budget set for this category</div>')+
      '</div>';
    });
    catEl.innerHTML=html||'<div style="text-align:center;padding:20px;color:var(--muted);">No budget data. Click "Set Budget" to start.</div>';
  }

  // Expense entries
  var expEl = document.getElementById('expenseEntriesList');
  if(expEl){
    if(!expenses.length){
      expEl.innerHTML='<div style="text-align:center;padding:20px;color:var(--muted);">No expenses recorded yet.</div>';
    } else {
      var pmLabels={cash:'💵 Cash',bank:'🏦 Bank',upi:'📱 UPI',card:'💳 Card',cheque:'📃 Cheque'};
      var html='<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
      html+='<thead><tr style="background:#f9f7f5;"><th style="padding:10px;text-align:left;border-bottom:2px solid #e8d5c8;">Date</th><th style="padding:10px;text-align:left;border-bottom:2px solid #e8d5c8;">Category</th><th style="padding:10px;text-align:left;border-bottom:2px solid #e8d5c8;">Description</th><th style="padding:10px;text-align:right;border-bottom:2px solid #e8d5c8;">Amount</th><th style="padding:10px;text-align:left;border-bottom:2px solid #e8d5c8;">Payment</th><th style="padding:10px;border-bottom:2px solid #e8d5c8;">Action</th></tr></thead><tbody>';
      expenses.sort(function(a,b){return b.date>a.date?1:-1;}).forEach(function(e){
        var cat=BUDGET_CATS.find(function(c){return c.id===e.category;})||{label:e.category,color:'#666'};
        html+='<tr style="border-bottom:1px solid #f0f0f0;">'+
          '<td style="padding:10px;">'+e.date+'</td>'+
          '<td style="padding:10px;"><span style="background:'+cat.color+'22;color:'+cat.color+';padding:2px 8px;border-radius:8px;font-size:0.75rem;font-weight:700;">'+cat.label+'</span></td>'+
          '<td style="padding:10px;">'+e.desc+(e.billNo?'<div style="font-size:0.72rem;color:var(--muted);">Bill: '+e.billNo+'</div>':'')+
          (e.notes?'<div style="font-size:0.72rem;color:var(--muted);">'+e.notes+'</div>':'')+
          '</td>'+
          '<td style="padding:10px;text-align:right;font-weight:700;color:#c62828;">₹'+parseFloat(e.amount).toLocaleString('en-IN')+'</td>'+
          '<td style="padding:10px;font-size:0.78rem;">'+(pmLabels[e.payment]||e.payment)+'</td>'+
          '<td style="padding:10px;text-align:center;">'+
            (canManageBudget()?'<button data-eid="'+e.id+'" onclick="editExpense(this.dataset.eid)" style="background:#e3f2fd;color:#1565c0;border:none;padding:4px 8px;border-radius:6px;font-size:0.72rem;cursor:pointer;margin-right:4px;">✏️</button>'+
            '<button data-eid="'+e.id+'" onclick="deleteExpense(this.dataset.eid)" style="background:#fce4ec;color:#c62828;border:none;padding:4px 8px;border-radius:6px;font-size:0.72rem;cursor:pointer;">🗑️</button>':'')+
          '</td>'+
        '</tr>';
      });
      html+='</tbody></table>';
      expEl.innerHTML=html;
    }
  }

  // Alerts
  var alerts=[];
  BUDGET_CATS.forEach(function(cat){
    var budgeted=parseFloat(budget.cats[cat.id]||0);
    if(!budgeted) return;
    var spent=expenses.filter(function(e){return e.category===cat.id;}).reduce(function(s,e){return s+(parseFloat(e.amount)||0);},0);
    var pct=Math.round(spent/budgeted*100);
    if(pct>=100) alerts.push('<div>🔴 <b>'+cat.label+'</b>: Budget exceeded! Spent ₹'+Math.round(spent).toLocaleString('en-IN')+' of ₹'+budgeted.toLocaleString('en-IN')+'</div>');
    else if(pct>=80) alerts.push('<div>🟡 <b>'+cat.label+'</b>: '+pct+'% used (₹'+Math.round(spent).toLocaleString('en-IN')+' of ₹'+budgeted.toLocaleString('en-IN')+')</div>');
  });
  var alertBanner=document.getElementById('budgetAlertBanner');
  var alertContent=document.getElementById('budgetAlertContent');
  if(alertBanner&&alertContent){
    if(alerts.length){alertBanner.style.display='block';alertContent.innerHTML=alerts.join('');}
    else alertBanner.style.display='none';
  }
  } catch(_e) { console.error("[SG] renderBudget:", _e); }
}

function openSetBudgetModal(){
  try {
  var key=getBudgetKey();
  var period=window._budgetPeriod||'monthly';
  var budget=getBudgetForKey(key);
  var sub=document.getElementById('setBudgetSubtitle');
  if(sub) sub.textContent='Period: '+(period==='monthly'?key:'Year '+key);
  var fields=document.getElementById('setBudgetFields');
  if(!fields) return;
  var html='';
  BUDGET_CATS.forEach(function(cat){
    var val=budget.cats[cat.id]||'';
    html+='<div class="form-group"><label style="color:'+cat.color+';font-weight:700;">'+cat.label+'</label>'+
      '<input type="number" id="budgetCat_'+cat.id+'" class="form-input" value="'+val+'" placeholder="₹ Budget amount" min="0"></div>';
  });
  fields.innerHTML=html;
  document.getElementById('setBudgetModal').classList.add('open');
  } catch(_e) { console.error("[SG] openSetBudgetModal:", _e); }
}

function saveBudget(){
  try {
  var key=getBudgetKey();
  var budgets=getBudgets();
  var idx=budgets.findIndex(function(b){return b.key===key;});
  var cats={};
  BUDGET_CATS.forEach(function(cat){
    var el=document.getElementById('budgetCat_'+cat.id);
    if(el&&el.value) cats[cat.id]=parseFloat(el.value)||0;
  });
  var obj={key:key,cats:cats,updatedAt:new Date().toLocaleString('en-IN'),updatedBy:currentUser&&currentUser.name};
  if(idx>=0) budgets[idx]=obj; else budgets.push(obj);
  saveBudgets(budgets);
  closeModal('setBudgetModal');
  renderBudget();
  showToast('✅ Budget saved!');
  } catch(_e) { console.error("[SG] saveBudget:", _e); }
}

function openAddExpenseModal(id){
  try {
  document.getElementById('editExpenseId').value=id||'';
  document.getElementById('expenseModalTitle').textContent=id?'✏️ Edit Expense':'📝 Add Expense';
  if(id){
    var e=getExpenses().find(function(x){return x.id===id;});
    if(e){
      document.getElementById('expCategory').value=e.category||'misc';
      document.getElementById('expDesc').value=e.desc||'';
      document.getElementById('expAmount').value=e.amount||'';
      document.getElementById('expDate').value=e.date||'';
      document.getElementById('expPayment').value=e.payment||'cash';
      document.getElementById('expBillNo').value=e.billNo||'';
      document.getElementById('expNotes').value=e.notes||'';
    }
  } else {
    ['expDesc','expAmount','expBillNo','expNotes'].forEach(function(f){var el=document.getElementById(f);if(el)el.value='';});
    document.getElementById('expCategory').value='misc';
    document.getElementById('expPayment').value='cash';
    var d=document.getElementById('expDate');if(d) d.value=new Date().toISOString().split('T')[0];
  }
  document.getElementById('addExpenseModal').classList.add('open');
  } catch(_e) { console.error("[SG] openAddExpenseModal:", _e); }
}

function editExpense(id){
  try {openAddExpenseModal(id);
  } catch(_e) { console.error("[SG] editExpense:", _e); }
}

function saveExpense(){
  try {
  var category=document.getElementById('expCategory').value;
  var desc=document.getElementById('expDesc').value.trim();
  var amount=document.getElementById('expAmount').value;
  var date=document.getElementById('expDate').value;
  var payment=document.getElementById('expPayment').value;
  var billNo=document.getElementById('expBillNo').value.trim();
  var notes=document.getElementById('expNotes').value.trim();
  if(!category||!desc||!amount||!date){showToast('Please fill required fields','error');return;}
  var id=document.getElementById('editExpenseId').value||'exp'+Date.now();
  var expenses=getExpenses();
  var idx=expenses.findIndex(function(e){return e.id===id;});
  var obj={id:id,category:category,desc:desc,amount:parseFloat(amount),date:date,payment:payment,billNo:billNo,notes:notes,addedBy:currentUser&&currentUser.name,addedAt:new Date().toLocaleString('en-IN')};
  if(idx>=0) expenses[idx]=obj; else expenses.push(obj);
  saveExpenses(expenses);
  closeModal('addExpenseModal');
  renderBudget();
  showToast('✅ Expense saved!');
  } catch(_e) { console.error("[SG] saveExpense:", _e); }
}

function deleteExpense(id){
  try {
  if(!confirm('Delete this expense?')) return;
  saveExpenses(getExpenses().filter(function(e){return e.id!==id;}));
  renderBudget();
  showToast('Expense deleted');
  } catch(_e) { console.error("[SG] deleteExpense:", _e); }
}


// ============================================================
// AUTO REPORTS
// ============================================================
function canViewReports(){return currentUser&&(currentUser.role==='Admin'||currentUser.perms&&currentUser.perms.includes('Reports - View'));}
function canExportReports(){return currentUser&&(currentUser.role==='Admin'||currentUser.perms&&currentUser.perms.includes('Reports - Export'));}

function setReportPeriod(period){
  try {
  window._repPeriod = period;
  ['daily','weekly','monthly','yearly'].forEach(function(p){
    var btn=document.getElementById('repBtn_'+p);
    if(!btn) return;
    btn.style.background=p===period?'var(--fire)':'#fff';
    btn.style.color=p===period?'#fff':'#333';
    btn.style.borderColor=p===period?'var(--fire)':'#e8d5c8';
  });
  // Use IST date
  var today=getTodayIST();
  var now=new Date(today);
  var from=today,to=today,label='';
  var toWrap=document.getElementById('repDateToWrap');

  if(period==='daily'){
    from=to=today; label='📅 Today';
    if(toWrap) toWrap.style.display='none';
  } else if(period==='weekly'){
    var wr=getWeekRange(now);
    from=wr.from; to=wr.to;
    label='📆 This Week';
    if(toWrap) toWrap.style.display='inline';
  } else if(period==='monthly'){
    from=today.substring(0,7)+'-01';
    var last=new Date(now.getFullYear(),now.getMonth()+1,0);
    to=today.substring(0,7)+'-'+String(last.getDate()).padStart(2,'0');
    label='🗓️ This Month';
    if(toWrap) toWrap.style.display='inline';
  } else {
    from=now.getFullYear()+'-01-01';
    to=now.getFullYear()+'-12-31';
    label='📈 This Year';
    if(toWrap) toWrap.style.display='inline';
  }
  var fromEl=document.getElementById('repDateFrom'); if(fromEl) fromEl.value=from;
  var toEl=document.getElementById('repDateTo'); if(toEl) toEl.value=to;
  var lbl=document.getElementById('repDateLabel'); if(lbl) lbl.textContent=label;
  renderAutoReport();
  } catch(_e) { console.error("[SG] setReportPeriod:", _e); }
}

function getRepDateRange(){
  try {
  var period=window._repPeriod||'daily';
  var from=document.getElementById('repDateFrom')?.value||getTodayIST();
  var to=period==='daily'?from:(document.getElementById('repDateTo')?.value||from);
  return {from:from, to:to, period:period};
  } catch(_e) { console.error("[SG] getRepDateRange:", _e); }
}

// getOrderDate: alias to global parseAnyDate for backward compat
function getOrderDate(o){ return parseAnyDate(o); }

async function renderAutoReport(){
  try {
  var el=document.getElementById('reportContent');
  if(!el) return;
  if(!canViewReports()){el.innerHTML='<div style="text-align:center;padding:40px;"><div style="font-size:3rem;">🔒</div><p>You do not have access to Reports.</p></div>';return;}

  var {from,to,period}=getRepDateRange();
  var orders=getOrders().filter(function(o){var d=parseAnyDate(o);return d&&d>=from&&d<=to;});
  var customers = window.customers||[];
  var staff=getStaffList().filter(function(s){return s.active!==false;});
  var expenses=getExpenses().filter(function(e){return e.date>=from&&e.date<=to;});
  var attendance=getAttendance().filter(function(a){return a.date>=from&&a.date<=to;});
  var wasteData = (await invGet('waste')) || [];
  var waste=wasteData.filter(function(w){var d=parseAnyDate(w.date);return d&&d>=from&&d<=to;});
  var tasks=getTasks().filter(function(t){return (t.date||'')>=from&&(t.date||'')<=to;});

  // Calculations
  var totalRevenue=orders.reduce(function(s,o){return s+(parseFloat(o.grandTotal||o.total)||0);},0);
  var completedOrders=orders.filter(function(o){return ['Delivered','Collected','Served'].includes(o.status);}).length;
  var cancelledOrders=orders.filter(function(o){return o.status==='Cancelled';}).length;
  var completionRate=orders.length?Math.round(completedOrders/orders.length*100):0;
  var avgOrderVal=orders.length?Math.round(totalRevenue/orders.length):0;
  var dineIn=orders.filter(function(o){return o.type==='Dine-In';}).length;
  var takeaway=orders.filter(function(o){return o.type==='Takeaway';}).length;
  var delivery=orders.filter(function(o){return o.type==='Home Delivery';}).length;
  var walkIn=orders.filter(function(o){return o.type==='Walk-In';}).length;
  var totalExpenses=expenses.reduce(function(s,e){return s+(parseFloat(e.amount)||0);},0);
  var profitLoss=totalRevenue-totalExpenses;
  var presentCount=attendance.filter(function(a){return a.status==='present'||a.status==='Present';}).length;
  var attendancePct=attendance.length?Math.round(presentCount/attendance.length*100):0;
  var completedTasks=tasks.filter(function(t){return t.status==='completed';}).length;
  var taskRate=tasks.length?Math.round(completedTasks/tasks.length*100):0;
  var wasteVal=waste.reduce(function(s,w){return s+(parseFloat(w.cost)||0);},0);

  // New customers in period
  var newCusts=customers.filter(function(c){
    var d='';if(c.createdAt){try{var p=c.createdAt.split(',')[0].split('/');if(p.length===3) d=p[2].trim()+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0');}catch(e){}}
    return d>=from&&d<=to;
  }).length;

  // Top 5 items
  var itemCount={};
  orders.forEach(function(o){(o.items||[]).forEach(function(i){itemCount[i.name]=(itemCount[i.name]||0)+i.qty;});});
  var topItems=Object.entries(itemCount).sort(function(a,b){return b[1]-a[1];}).slice(0,5);

  // Top 5 customers
  var custRev={};
  orders.forEach(function(o){if(o.mobile){if(!custRev[o.mobile]) custRev[o.mobile]={name:o.name,rev:0,cnt:0};custRev[o.mobile].rev+=(parseFloat(o.grandTotal||o.total)||0);custRev[o.mobile].cnt++;}});
  var topCusts=Object.values(custRev).sort(function(a,b){return b.rev-a.rev;}).slice(0,5);

  // Period label
  var periodLabel = period==='daily'?'Daily Report: '+from:
                    period==='weekly'?'Weekly Report: '+from+' to '+to:
                    period==='monthly'?'Monthly Report: '+from.substring(0,7):
                    'Yearly Report: '+from.substring(0,4);

  function statCard(icon,label,val,color){
    try {
    return '<div style="background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,0.07);border-top:4px solid '+color+';text-align:center;">'+
      '<div style="font-size:1.3rem;">'+icon+'</div>'+
      '<div style="font-size:0.75rem;color:var(--muted);font-weight:600;margin:2px 0;">'+label+'</div>'+
      '<div style="font-size:1.3rem;font-weight:800;color:'+color+';">'+val+'</div>'+
    '</div>';
    } catch(_e) { console.error("[SG] statCard:", _e); }
}

  function section(title, content2){
    try {
    return '<div style="background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">'+
      '<h3 style="margin:0 0 14px;font-size:0.95rem;border-bottom:2px solid #f0f0f0;padding-bottom:8px;">'+title+'</h3>'+
      content2+'</div>';
    } catch(_e) { console.error("[SG] section:", _e); }
}

  function row(label,val,color){
    try {
    return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f9f7f5;">'+
      '<span style="color:var(--muted);font-size:0.85rem;">'+label+'</span>'+
      '<span style="font-weight:700;color:'+(color||'var(--dark)')+';">'+val+'</span>'+
    '</div>';
    } catch(_e) { console.error("[SG] row:", _e); }
}

  var reportHTML='<div id="reportPrintArea">'+
    // Header
    '<div style="background:linear-gradient(135deg,#e65100,#bf360c);color:#fff;border-radius:14px;padding:20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'+
      '<div><div style="font-size:1.2rem;font-weight:800;">🍽️ SpiceGarden Restaurant</div><div style="font-size:0.85rem;opacity:0.9;margin-top:4px;">'+periodLabel+'</div><div style="font-size:0.75rem;opacity:0.8;margin-top:2px;">Generated: '+new Date().toLocaleString('en-IN')+'</div></div>'+
      '<div style="text-align:right;"><div style="font-size:1.8rem;font-weight:800;">₹'+Math.round(totalRevenue).toLocaleString('en-IN')+'</div><div style="font-size:0.78rem;opacity:0.9;">Total Revenue</div></div>'+
    '</div>'+

    // KPI Cards
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px;">'+
      statCard('📦','Total Orders',orders.length,'#1565c0')+
      statCard('✅','Completion',completionRate+'%','#2e7d32')+
      statCard('❌','Cancelled',cancelledOrders,'#c62828')+
      statCard('💵','Avg Order','₹'+avgOrderVal.toLocaleString('en-IN'),'#6a1b9a')+
      statCard('👤','New Customers',newCusts,'#00838f')+
      statCard('👥','Attendance',attendancePct+'%','#e65100')+
      statCard('📋','Task Rate',taskRate+'%','#1565c0')+
      statCard(profitLoss>=0?'📈':'📉','Profit/Loss',(profitLoss>=0?'+':'')+'₹'+Math.round(Math.abs(profitLoss)).toLocaleString('en-IN'),profitLoss>=0?'#2e7d32':'#c62828')+
    '</div>'+

    // 2 column layout
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">'+
      section('💰 Revenue & Orders',
        row('Total Revenue','₹'+Math.round(totalRevenue).toLocaleString('en-IN'),'#2e7d32')+
        row('Total Orders',orders.length)+
        row('Completed',completedOrders,'#2e7d32')+
        row('Cancelled',cancelledOrders,'#c62828')+
        row('Avg Order Value','₹'+avgOrderVal.toLocaleString('en-IN'),'#6a1b9a')+
        row('Dine-In',dineIn)+
        row('Takeaway',takeaway)+
        row('Delivery',delivery)+
        row('Walk-In',walkIn)
      )+
      section('📊 Operations',
        row('Total Expenses','₹'+Math.round(totalExpenses).toLocaleString('en-IN'),'#c62828')+
        row('Net Profit/Loss',(profitLoss>=0?'+':'')+' ₹'+Math.round(Math.abs(profitLoss)).toLocaleString('en-IN'),profitLoss>=0?'#2e7d32':'#c62828')+
        row('Staff Attendance',attendancePct+'%',attendancePct>=80?'#2e7d32':'#c62828')+
        row('Present / Total',presentCount+' / '+(staff.length||'—'))+
        row('Tasks Completed',completedTasks+' / '+tasks.length)+
        row('Task Rate',taskRate+'%',taskRate>=80?'#2e7d32':'#c62828')+
        row('Waste Value','₹'+Math.round(wasteVal).toLocaleString('en-IN'),'#ef6c00')+
        row('New Customers',newCusts,'#00838f')
      )+
    '</div>'+

    // Top Items + Top Customers
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">'+
      section('🍽️ Top Selling Items',
        topItems.length?topItems.map(function(item,i){
          return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f9f7f5;">'+
            '<span style="font-size:0.85rem;">'+(i+1)+'. '+item[0]+'</span>'+
            '<span style="font-weight:700;color:var(--fire);">'+item[1]+' sold</span></div>';
        }).join(''):'<div style="text-align:center;padding:10px;color:var(--muted);font-size:0.85rem;">No data</div>'
      )+
      section('👥 Top Customers',
        topCusts.length?topCusts.map(function(c,i){
          return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f9f7f5;">'+
            '<span style="font-size:0.85rem;">'+(i+1)+'. '+c.name+'<div style="font-size:0.72rem;color:var(--muted);">'+c.cnt+' orders</div></span>'+
            '<span style="font-weight:700;color:#2e7d32;">₹'+Math.round(c.rev).toLocaleString('en-IN')+'</span></div>';
        }).join(''):'<div style="text-align:center;padding:10px;color:var(--muted);font-size:0.85rem;">No data</div>'
      )+
    '</div>'+

    // Expenses breakdown
    section('💸 Expenses by Category',
      (function(){
        var BUDGET_CATS_LOCAL=[
          {id:'staff',label:'👥 Staff Salary',color:'#1565c0'},
          {id:'inventory',label:'📦 Inventory',color:'#2e7d32'},
          {id:'utilities',label:'💡 Utilities',color:'#e65100'},
          {id:'marketing',label:'📢 Marketing',color:'#6a1b9a'},
          {id:'maintenance',label:'🔧 Maintenance',color:'#00838f'},
          {id:'misc',label:'📋 Miscellaneous',color:'#795548'},
        ];
        var rows='';
        BUDGET_CATS_LOCAL.forEach(function(cat){
          var amt=expenses.filter(function(e){return e.category===cat.id;}).reduce(function(s,e){return s+(parseFloat(e.amount)||0);},0);
          if(amt>0) rows+=row(cat.label,'₹'+Math.round(amt).toLocaleString('en-IN'),cat.color);
        });
        return rows||'<div style="text-align:center;padding:10px;color:var(--muted);font-size:0.85rem;">No expenses recorded</div>';
      })()
    )+

  '</div>';

  el.innerHTML=reportHTML;
  } catch(_e) { console.error("[SG] renderAutoReport:", _e); }
}

function downloadReportPDF(){
  try {
  if(!canExportReports()){showToast('No permission to export','error');return;}
  var printArea=document.getElementById('reportPrintArea');
  if(!printArea){showToast('Generate report first','error');return;}
  var {from,to,period}=getRepDateRange();
  var w=window.open('','_blank');
  w.document.write('<!DOCTYPE html><html><head><title>SpiceGarden Report</title>'+
    '<style>body{font-family:Arial,sans-serif;padding:20px;color:#333;}'+
    'h3{margin:0 0 10px;font-size:14px;}'+
    'table{width:100%;border-collapse:collapse;}'+
    'th,td{padding:8px;border:1px solid #ddd;font-size:12px;}'+
    'th{background:#f5f5f5;}</style></head><body>'+
    printArea.innerHTML+'</body></html>');
  w.document.close();
  setTimeout(function(){w.print();},500);
  } catch(_e) { console.error("[SG] downloadReportPDF:", _e); }
}

function getReportSummaryText(){
  try {
  var {from,to,period}=getRepDateRange();
  var orders=getOrders().filter(function(o){var d=getOrderDate(o);return d>=from&&d<=to;});
  var totalRevenue=orders.reduce(function(s,o){return s+(parseFloat(o.grandTotal||o.total)||0);},0);
  var completedOrders=orders.filter(function(o){return ['Delivered','Collected','Served'].includes(o.status);}).length;
  var expenses=getExpenses().filter(function(e){return e.date>=from&&e.date<=to;});
  var totalExpenses=expenses.reduce(function(s,e){return s+(parseFloat(e.amount)||0);},0);
  var profitLoss=totalRevenue-totalExpenses;
  var periodLabel=period==='daily'?'Daily ('+from+')':period==='weekly'?'Weekly ('+from+' to '+to+')':period==='monthly'?'Monthly ('+from.substring(0,7)+')':'Yearly ('+from.substring(0,4)+')';
  return 'SpiceGarden Restaurant Report - '+periodLabel+
    ' | Revenue: Rs.'+Math.round(totalRevenue)+
    ' | Orders: '+orders.length+
    ' | Completed: '+completedOrders+
    ' | Expenses: Rs.'+Math.round(totalExpenses)+
    ' | Profit/Loss: '+(profitLoss>=0?'+':'')+Math.round(profitLoss);
  } catch(_e) { console.error("[SG] getReportSummaryText:", _e); }
}

function shareReportWhatsApp(){
  try {
  if(!canExportReports()){showToast('No permission to export','error');return;}
  var text=getReportSummaryText();
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  } catch(_e) { console.error("[SG] shareReportWhatsApp:", _e); }
}

function shareReportEmail(){
  try {
  if(!canExportReports()){showToast('No permission to export','error');return;}
  var text=getReportSummaryText();
  window.open('mailto:?subject=SpiceGarden+Report&body='+encodeURIComponent(text));
  } catch(_e) { console.error("[SG] shareReportEmail:", _e); }
}

// ===== PHASE 5: SUPPORT INBOX SYSTEM =====

// --- Data helpers --- (getTickets/setTickets defined above with Supabase sync)

function genTicketId(type) {
  try {
  var prefix = type==='complaint' ? 'CMP' : 'INQ';
  return prefix + '-' + Date.now().toString().slice(-6);
  } catch(_e) { console.error("[SG] genTicketId:", _e); }
}

// --- Customer-side tab switcher ---
async function showCustSupportTab(tab) {
  try {
  document.querySelectorAll('.p5-tab[id^="custTab"]').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('#supportPage .p5-sub').forEach(function(s){ s.classList.remove('active'); });
  var btn = document.getElementById('custTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if(btn) btn.classList.add('active');
  var sub = document.getElementById('custSub-' + tab);
  if(sub) sub.classList.add('active');
  if(tab === 'complaint') populateOrderDropdown();
  if(tab === 'mytickets') {
    // Load fresh tickets from Supabase
    try {
      const fresh = await sbGetSetting('sg_tickets', null);
      if(fresh && Array.isArray(fresh)) localStorage.setItem('sg_tickets', JSON.stringify(fresh));
    } catch(e) {}
    renderCustMyTickets();
  }
  } catch(_e) { console.error("[SG] showCustSupportTab:", _e); }
}

function populateOrderDropdown() {
  try {
  var sel = document.getElementById('compOrderId');
  if(!sel) return;
  var myOrders = orders
    .filter(function(o){ return currentCustomer && (o.mobile===currentCustomer.mobile || o.email===currentCustomer.email); })
    .slice(0,20);
  sel.innerHTML = '<option value="">-- No specific order --</option>' +
    myOrders.map(function(o){ return '<option value="'+o.id+'">'+o.id+' — '+o.items.map(function(i){return i.name;}).join(', ')+'</option>'; }).join('');
  } catch(_e) { console.error("[SG] populateOrderDropdown:", _e); }
}

// --- Submit ticket from customer side ---
function submitCustomerTicket(type) {
  try {
  if(!currentCustomer) { showToast('Please sign in first','error'); openAuthModal('signin'); return; }

  var subject, desc, subType, priority='medium', orderId='';
  if(type==='complaint') {
    subType = document.getElementById('compType').value;
    subject = document.getElementById('compSubject').value.trim();
    desc    = document.getElementById('compDesc').value.trim();
    priority= document.getElementById('compPriority').value;
    orderId = document.getElementById('compOrderId').value;
    if(!subType || !subject || !desc) { showToast('Please fill all required fields','error'); return; }
  } else {
    subType = document.getElementById('inqType').value;
    subject = document.getElementById('inqSubject').value.trim();
    desc    = document.getElementById('inqDesc').value.trim();
    if(!subType || !subject || !desc) { showToast('Please fill all required fields','error'); return; }
  }

  var ticket = {
    id: genTicketId(type),
    type: type,
    channel: 'web',
    custName: _cleanText(currentCustomer.name),
    custMobile: currentCustomer.mobile || '',
    custEmail: _cleanText(currentCustomer.email || ''),
    custId: currentCustomer.mobile || currentCustomer.email,
    subType: _cleanText(subType),
    subject: _cleanText(subject),
    desc: _cleanText(desc),
    priority: priority,
    status: 'Open',
    assignedTo: '',
    orderId: orderId,
    resNotes: '',
    createdAt: new Date().toLocaleString('en-IN'),
    updatedAt: new Date().toLocaleString('en-IN'),
    messages: [{ from:'customer', name: _cleanText(currentCustomer.name), text: _cleanText(desc), time: new Date().toLocaleString('en-IN') }]
  };

  var tickets = getTickets();
  tickets.unshift(ticket);
  setTickets(tickets);
  updateSupportBadge();

  // Clear form
  if(type==='complaint') {
    ['compType','compSubject','compDesc','compPriority','compOrderId'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.value='';
    });
  } else {
    ['inqType','inqSubject','inqDesc'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.value='';
    });
  }

  showToast('✅ Ticket created! ID: ' + ticket.id);
  showCustSupportTab('mytickets');
  } catch(_e) { console.error("[SG] submitCustomerTicket:", _e); }
}

// --- Customer: My Tickets ---
function renderCustMyTickets() {
  try {
  if(!currentCustomer) {
    document.getElementById('custTicketsList').innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">Please sign in to view your tickets.</div>';
    return;
  }
  var myId = currentCustomer.mobile || currentCustomer.email;
  var tickets = getTickets().filter(function(t){ return t.custId === myId || t.custMobile===currentCustomer.mobile; });
  var el = document.getElementById('custTicketsList');
  if(!tickets.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;"><div style="font-size:2.5rem;margin-bottom:10px;">🎫</div><p style="color:var(--muted);">No tickets yet. Submit a complaint or inquiry above!</p></div>';
    return;
  }
  el.innerHTML = tickets.map(function(t){ return renderTicketCard(t, true); }).join('');
  } catch(_e) { console.error("[SG] renderCustMyTickets:", _e); }
}

// --- Ticket Card HTML ---
function renderTicketCard(t, isCustView) {
  try {
  var priClass = 'pri-'+t.priority;
  var stClass = 'tkt-'+(t.status||'open').toLowerCase().replace(' ','');
  var chClass = 'ch-'+(t.channel||'web');
  var lastMsg = t.messages && t.messages.length ? t.messages[t.messages.length-1] : null;
  return '<div class="ticket-card" onclick="openTicketDetail(\''+t.id+'\',' +(isCustView?'true':'false')+')">' +
    '<div class="ticket-header">' +
      '<div>' +
        '<div class="ticket-id">' + t.id + '</div>' +
        '<div class="ticket-title">' + escHtml(t.subject) + '</div>' +
        '<div class="ticket-meta">' + escHtml(t.custName) + ' &bull; ' + escHtml(t.subType||t.type) + ' &bull; ' + (t.createdAt||'') + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end;">' +
        '<span class="' + stClass + '">' + (t.status||'Open') + '</span>' +
        '<span class="' + priClass + '">' + (t.priority||'medium').toUpperCase() + '</span>' +
        '<span class="' + chClass + '">' + (t.channel||'web') + '</span>' +
      '</div>' +
    '</div>' +
    (lastMsg ? '<div style="font-size:0.78rem;color:var(--muted);margin-top:8px;border-top:1px solid #f0e6dc;padding-top:6px;">💬 ' + escHtml(lastMsg.text.slice(0,80)) + (lastMsg.text.length>80?'...':'') + '</div>' : '') +
    (t.assignedTo && !isCustView ? '<div style="font-size:0.76rem;color:var(--muted);margin-top:4px;">👤 Assigned: ' + escHtml(t.assignedTo) + '</div>' : '') +
  '</div>';
  } catch(_e) { console.error("[SG] renderTicketCard:", _e); }
}

function escHtml(str) {
  return String(str==null?'':str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;');
}

// --- Open Ticket Detail Modal ---
var _currentTicketId = null;
function openTicketDetail(id, isCustView) {
  try {
  var tickets = getTickets();
  var t = tickets.find(function(x){ return x.id===id; });
  if(!t) return;
  _currentTicketId = id;

  document.getElementById('tdTicketId').textContent = t.id;
  document.getElementById('tdSubject').textContent = t.subject;

  // Badges
  var priClass = 'pri-'+t.priority;
  var stClass = 'tkt-'+(t.status||'open').toLowerCase().replace(' ','');
  document.getElementById('tdBadges').innerHTML =
    '<span class="'+stClass+'">'+t.status+'</span>' +
    '<span class="'+priClass+'">'+(t.priority||'').toUpperCase()+'</span>' +
    '<span class="ch-'+(t.channel||'web')+'">'+t.channel+'</span>' +
    (t.type==='complaint'?'<span style="background:#fde8e8;color:#c0392b;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;">😤 Complaint</span>':'<span style="background:#e8f4fd;color:#1a6fa8;padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;">💬 Inquiry</span>');

  // Info grid
  document.getElementById('tdInfoGrid').innerHTML =
    infoRow('Customer', t.custName) +
    infoRow('Mobile', t.custMobile||'—') +
    infoRow('Type', t.subType||t.type) +
    infoRow('Order ID', t.orderId||'—') +
    infoRow('Created', t.createdAt||'—') +
    infoRow('Updated', t.updatedAt||'—');

  // Messages
  var thread = document.getElementById('tdMsgThread');
  thread.innerHTML = (t.messages||[]).map(function(m){
    var isSt = m.from==='staff';
    return '<div style="display:flex;flex-direction:column;align-items:'+(isSt?'flex-end':'flex-start')+'">' +
      '<div class="msg-bubble '+(isSt?'msg-staff':'msg-cust')+'">' +
        escHtml(m.text) +
        '<div class="msg-meta">'+(m.name||'')+ ' — '+(m.time||'')+'</div>' +
      '</div>' +
    '</div>';
  }).join('');
  thread.scrollTop = thread.scrollHeight;

  // Set dropdowns
  if(!isCustView) {
    var stSel = document.getElementById('tdStatus');
    for(var i=0;i<stSel.options.length;i++) stSel.options[i].selected = stSel.options[i].text===t.status;
    var prSel = document.getElementById('tdPriority');
    for(var i=0;i<prSel.options.length;i++) prSel.options[i].selected = prSel.options[i].value===t.priority;
    // Populate assign dropdown
    var asSel = document.getElementById('tdAssign');
    var staffList = JSON.parse(localStorage.getItem('sg_staff')||'[]');
    asSel.innerHTML = '<option value="">-- Unassigned --</option>' +
      staffList.map(function(s){ return '<option value="'+s.name+'"'+(t.assignedTo===s.name?' selected':'')+'>'+s.name+'</option>'; }).join('');
    document.getElementById('tdResNotes').value = t.resNotes||'';
  }

  // Hide/show reply section based on view
  document.getElementById('tdReply').value = '';
  if(isCustView) {
    document.getElementById('tdStatus').closest('div').parentElement.style.display='none';
  } else {
    document.getElementById('tdStatus').closest('div').parentElement.style.display='grid';
  }

  document.getElementById('ticketDetailModal').classList.add('open');
  } catch(_e) { console.error("[SG] openTicketDetail:", _e); }
}

function infoRow(label, val) {
  return '<div style="background:#f9f5f0;border-radius:8px;padding:8px 12px;"><div style="font-size:0.72rem;color:var(--muted);font-weight:600;">'+label+'</div><div style="font-weight:700;font-size:0.85rem;">'+escHtml(val)+'</div></div>';
}

// --- Save & Reply from admin ---
function saveTicketDetail() {
  try {
  var tickets = getTickets();
  var idx = tickets.findIndex(function(t){ return t.id===_currentTicketId; });
  if(idx<0) return;
  var t = tickets[idx];

  var replyText = document.getElementById('tdReply').value.trim();
  var newStatus = document.getElementById('tdStatus').value;
  var newPri = document.getElementById('tdPriority').value;
  var assign = document.getElementById('tdAssign').value;
  var resNotes = document.getElementById('tdResNotes').value.trim();

  if(replyText) {
    if(!t.messages) t.messages = [];
    t.messages.push({ from:'staff', name: currentUser ? currentUser.name : 'Staff', text: _cleanText(replyText), time: new Date().toLocaleString('en-IN') });
  }
  t.status = newStatus;
  t.priority = newPri;
  t.assignedTo = assign;
  t.resNotes = _cleanText(resNotes);
  t.updatedAt = new Date().toLocaleString('en-IN');

  tickets[idx] = t;
  setTickets(tickets);
  updateSupportBadge();
  closeModal('ticketDetailModal');
  renderAdminTickets();
  showToast('✅ Ticket updated!');
  } catch(_e) { console.error("[SG] saveTicketDetail:", _e); }
}

// --- Convert Inquiry to Order ---
function convertTicketToOrder() {
  try {
  var tickets = getTickets();
  var t = tickets.find(function(x){ return x.id===_currentTicketId; });
  if(!t) return;
  showToast('🛒 Open order modal — Customer: ' + t.custName + ' | Note: ' + t.subject);
  closeModal('ticketDetailModal');
  // Open customer order modal with pre-filled note
  showCustomerSite();
  showPage('order');
  } catch(_e) { console.error("[SG] convertTicketToOrder:", _e); }
}

// --- Admin Tabs ---
async function showSupportTab(tab) {
  try {
  document.querySelectorAll('.p5-tab[id^="spTab"]').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('#sec-support .p5-sub').forEach(function(s){ s.classList.remove('active'); });
  var btn = document.getElementById('spTab'+tab.charAt(0).toUpperCase()+tab.slice(1));
  if(btn) btn.classList.add('active');
  var sub = document.getElementById('sp-sub-'+tab);
  if(sub) sub.classList.add('active');

  // Load tickets from Supabase first
  try {
    const fresh = await sbGetSetting('sg_tickets', null);
    if(fresh && Array.isArray(fresh)) {
      localStorage.setItem('sg_tickets', JSON.stringify(fresh));
    }
  } catch(e) {}

  if(tab==='tickets') renderAdminTickets();
  else if(tab==='complaints') renderAdminTicketsByType('complaint');
  else if(tab==='inquiries') renderAdminTicketsByType('inquiry');
  else if(tab==='reports') renderSupportReports();
  else if(tab==='inbox') renderPhoneTickets();
  } catch(_e) { console.error("[SG] showSupportTab:", _e); }
}

function renderAdminTickets() {
  try {
  var filterStatus = (document.getElementById('spFilterStatus')||{}).value || '';
  var filterType   = (document.getElementById('spFilterType')||{}).value || '';
  var filterPri    = (document.getElementById('spFilterPri')||{}).value || '';
  var tickets = getTickets().filter(function(t){
    if(filterStatus && t.status!==filterStatus) return false;
    if(filterType && t.type!==filterType) return false;
    if(filterPri && t.priority!==filterPri) return false;
    return true;
  });
  var el = document.getElementById('adminTicketsList');
  if(!el) return;
  if(!tickets.length) { el.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted);">No tickets found.</div>'; return; }
  el.innerHTML = tickets.map(function(t){ return renderTicketCard(t, false); }).join('');
  } catch(_e) { console.error("[SG] renderAdminTickets:", _e); }
}

function renderAdminTicketsByType(type) {
  try {
  var key = type==='complaint' ? 'adminComplaintsList' : 'adminInquiriesList';
  var tickets = getTickets().filter(function(t){ return t.type===type; });
  var el = document.getElementById(key);
  if(!el) return;
  if(!tickets.length) { el.innerHTML='<div style="text-align:center;padding:40px;color:var(--muted);">No '+(type==='complaint'?'complaints':'inquiries')+' yet.</div>'; return; }
  el.innerHTML = tickets.map(function(t){ return renderTicketCard(t, false); }).join('');
  } catch(_e) { console.error("[SG] renderAdminTicketsByType:", _e); }
}

function renderPhoneTickets() {
  try {
  var tickets = getTickets().filter(function(t){ return t.channel==='phone'; });
  var el = document.getElementById('phoneTicketsList');
  if(!el) return;
  if(!tickets.length) { el.innerHTML='<div style="color:var(--muted);font-size:0.85rem;padding:12px;">No phone tickets yet.</div>'; return; }
  el.innerHTML = tickets.map(function(t){ return renderTicketCard(t, false); }).join('');
  } catch(_e) { console.error("[SG] renderPhoneTickets:", _e); }
}

// --- Manual Ticket ---
function openManualTicketModal(channel) {
  try {
  var modal = document.getElementById('manualTicketModal');
  if(!modal) { alert('Manual Ticket modal not found!'); return; }
  var fields = ['mtCustName','mtMobile','mtSubject','mtDesc','mtSubType','mtOrderId'];
  fields.forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
  // reset selects
  var typeEl = document.getElementById('mtType');
  if(typeEl) typeEl.selectedIndex = 0;
  var priEl = document.getElementById('mtPriority');
  if(priEl) priEl.selectedIndex = 0;
  if(channel) {
    var sel = document.getElementById('mtChannel');
    if(sel) for(var i=0;i<sel.options.length;i++) if(sel.options[i].value===channel) { sel.selectedIndex=i; break; }
  } else {
    var sel2 = document.getElementById('mtChannel');
    if(sel2) sel2.selectedIndex = 0;
  }
  modal.style.display = 'flex';
  modal.classList.add('open');
  } catch(_e) { console.error("[SG] openManualTicketModal:", _e); }
}
window.openManualTicketModal = openManualTicketModal;

function saveManualTicket() {
  try {
  var custName = document.getElementById('mtCustName').value.trim();
  var subject  = document.getElementById('mtSubject').value.trim();
  var desc     = document.getElementById('mtDesc').value.trim();
  if(!custName||!subject||!desc) { showToast('Name, subject, description required','error'); return; }

  var type    = document.getElementById('mtType').value;
  var channel = document.getElementById('mtChannel').value;
  var ticket = {
    id: genTicketId(type),
    type: type, channel: channel,
    custName: _cleanText(custName),
    custMobile: document.getElementById('mtMobile').value.trim(),
    custEmail: '', custId: document.getElementById('mtMobile').value.trim(),
    subType: _cleanText(document.getElementById('mtSubType').value.trim()),
    subject: _cleanText(subject), desc: _cleanText(desc),
    priority: document.getElementById('mtPriority').value,
    status: 'Open', assignedTo: '',
    orderId: document.getElementById('mtOrderId').value.trim(),
    resNotes: '',
    createdAt: new Date().toLocaleString('en-IN'),
    updatedAt: new Date().toLocaleString('en-IN'),
    messages: [{ from:'customer', name: _cleanText(custName), text: _cleanText(desc), time: new Date().toLocaleString('en-IN') }]
  };
  var tickets = getTickets();
  tickets.unshift(ticket);
  setTickets(tickets);
  updateSupportBadge();
  var modal = document.getElementById('manualTicketModal');
  if(modal) { modal.classList.remove('open'); modal.style.display=''; }
  renderAdminTickets();
  showToast('✅ Ticket created: ' + ticket.id);
  } catch(_e) { console.error("[SG] saveManualTicket:", _e); }
}
window.saveManualTicket = saveManualTicket;

// --- Support Badge (open tickets count) ---
function updateSupportBadge() {
  try {
  var open = getTickets().filter(function(t){ return t.status==='Open' || t.status==='In Progress'; }).length;
  var badge = document.getElementById('supportBadge');
  if(!badge) return;
  if(open > 0) { badge.textContent = open; badge.style.display='inline'; }
  else { badge.style.display='none'; }
  } catch(_e) { console.error("[SG] updateSupportBadge:", _e); }
}

// --- Reports ---
function renderSupportReports() {
  try {
  var tickets = getTickets();
  var total = tickets.length;
  var resolved = tickets.filter(function(t){ return t.status==='Resolved'||t.status==='Closed'; }).length;
  var open = tickets.filter(function(t){ return t.status==='Open'; }).length;
  var inProgress = tickets.filter(function(t){ return t.status==='In Progress'; }).length;
  var resRate = total ? Math.round(resolved/total*100) : 0;
  var complaints = tickets.filter(function(t){ return t.type==='complaint'; }).length;
  var inquiries  = tickets.filter(function(t){ return t.type==='inquiry'; }).length;

  var statsEl = document.getElementById('p5StatsGrid');
  if(statsEl) statsEl.innerHTML = [
    ['Total Tickets', total, '🎫'],
    ['Open', open, '🔴'],
    ['In Progress', inProgress, '🟠'],
    ['Resolved/Closed', resolved, '✅'],
    ['Resolution Rate', resRate+'%', '📈'],
    ['Complaints', complaints, '😤'],
    ['Inquiries', inquiries, '💬'],
  ].map(function(s){
    return '<div class="p5-stat"><div style="font-size:1.4rem;">'+s[2]+'</div><div class="p5-stat-num">'+s[1]+'</div><div class="p5-stat-lbl">'+s[0]+'</div></div>';
  }).join('');

  // Complaint type breakdown
  var typeCount = {};
  tickets.filter(function(t){ return t.type==='complaint'; }).forEach(function(t){
    var k = t.subType||'Other'; typeCount[k]=(typeCount[k]||0)+1;
  });
  var typeEl = document.getElementById('p5CompTypeChart');
  if(typeEl) {
    var maxT = Math.max.apply(null, Object.values(typeCount).concat([1]));
    typeEl.innerHTML = Object.keys(typeCount).sort(function(a,b){ return typeCount[b]-typeCount[a]; }).map(function(k){
      var pct = Math.round(typeCount[k]/maxT*100);
      return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:3px;"><span>'+escHtml(k)+'</span><span style="font-weight:700;">'+typeCount[k]+'</span></div><div class="p5-chart-bar"><div class="p5-chart-fill" style="width:'+pct+'%"></div></div></div>';
    }).join('') || '<div style="color:var(--muted);font-size:0.85rem;">No complaints yet.</div>';
  }

  // Channel breakdown
  var chanCount = {};
  tickets.forEach(function(t){ var k=t.channel||'web'; chanCount[k]=(chanCount[k]||0)+1; });
  var chanEl = document.getElementById('p5ChannelChart');
  var chanIcons = {whatsapp:'📱',facebook:'👍',twitter:'🐦',email:'✉️',phone:'📞',web:'🌐'};
  if(chanEl) {
    var maxC = Math.max.apply(null, Object.values(chanCount).concat([1]));
    chanEl.innerHTML = Object.keys(chanCount).sort(function(a,b){ return chanCount[b]-chanCount[a]; }).map(function(k){
      var pct = Math.round(chanCount[k]/maxC*100);
      return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:3px;"><span>'+(chanIcons[k]||'📬')+' '+k+'</span><span style="font-weight:700;">'+chanCount[k]+'</span></div><div class="p5-chart-bar"><div class="p5-chart-fill" style="width:'+pct+'%;background:#3498db;"></div></div></div>';
    }).join('') || '<div style="color:var(--muted);font-size:0.85rem;">No data yet.</div>';
  }

  // Resolution status breakdown
  var statusCount = { Open: open, 'In Progress': inProgress, Resolved: resolved };
  var resEl = document.getElementById('p5ResolutionChart');
  if(resEl) {
    var maxR = Math.max.apply(null, Object.values(statusCount).concat([1]));
    var colors = { Open:'#e74c3c', 'In Progress':'#f39c12', Resolved:'#2ecc71' };
    resEl.innerHTML = Object.keys(statusCount).map(function(k){
      var pct = Math.round(statusCount[k]/maxR*100);
      return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:3px;"><span>'+k+'</span><span style="font-weight:700;">'+statusCount[k]+'</span></div><div class="p5-chart-bar"><div class="p5-chart-fill" style="width:'+pct+'%;background:'+colors[k]+';"></div></div></div>';
    }).join('');
  }
  } catch(_e) { console.error("[SG] renderSupportReports:", _e); }
}

// Hook into showDash for support
var _origShowDash = (typeof showDash === 'function') ? showDash : function(){};
showDash = function(s) {
  _origShowDash(s);
  if(s==='support') {
    showSupportTab('tickets');
    updateSupportBadge();
    document.querySelector('.main-content').classList.add('support-mode');
  } else {
    document.querySelector('.main-content').classList.remove('support-mode');
  }
};

// Hook into setupDashboard to show siSupport and siMyTeam
var _origSetupDash = (typeof setupDashboard === 'function') ? setupDashboard : function(){};
setupDashboard = function(t) {
  _origSetupDash(t);
  // Support
  var si = document.getElementById('siSupport');
  if(si) si.style.display=(currentUser&&(currentUser.role==='Admin'||currentUser.perms.includes('Support - View')))?'flex':'none';
  updateSupportBadge();
  // My Team
  var siMT = document.getElementById('siMyTeam');
  if(siMT && currentUser) {
    var isAdm = currentUser.role==='Admin';
    var myTeam = getStaffList().filter(function(s){
      return s.reportingTo===currentUser.username || s.reportingTo===currentUser.id;
    });
    siMT.style.display = (isAdm || myTeam.length > 0) ? 'flex' : 'none';
  }
};

// Add support to showPage & title map
var _origShowPage = (typeof showPage === 'function') ? showPage : function(){};
showPage = function(p) {
  _origShowPage(p);
  if(p==='support') {
    if(!currentCustomer) { openAuthModal('signin'); return; }
    showCustSupportTab('complaint');
    populateOrderDropdown();
  }
};

// Add dashboard title for support
var _origTitles_support_patch = true;

// ===== WEB CHAT SYSTEM =====

// getWebChats/setWebChats defined above with Supabase sync

function getOrCreateSession() {
  try {
  var chats = getWebChats();
  var custId = currentCustomer ? (currentCustomer.mobile || currentCustomer.email) : 'guest_' + Date.now();
  var custName = currentCustomer ? (currentCustomer.firstName || currentCustomer.name || 'Guest') : 'Guest';
  if(!chats[custId]) {
    chats[custId] = {
      id: custId, name: _cleanText(custName),
      email: _cleanText(currentCustomer ? currentCustomer.email : ''),
      messages: [], unread: 0,
      createdAt: new Date().toLocaleString('en-IN'),
      lastAt: new Date().toLocaleString('en-IN')
    };
    // Welcome message from staff
    chats[custId].messages.push({
      from: 'staff', text: 'Hello! 🌶️ Welcome to SpiceGarden. How can we help you today?',
      time: new Date().toLocaleString('en-IN')
    });
    setWebChats(chats);
  }
  return custId;
  } catch(_e) { console.error("[SG] getOrCreateSession:", _e); }
}

function toggleWebChat() {
  try {
  var win = document.getElementById('webchatWindow');
  if(!win) return;
  var isOpen = win.classList.contains('open');
  if(isOpen) {
    win.classList.remove('open');
  } else {
    win.classList.add('open');
    // Clear badge
    var badge = document.getElementById('webchatBadge');
    if(badge) { badge.classList.remove('show'); badge.textContent=''; }
    renderWebChatMessages();
    setTimeout(function(){ var inp=document.getElementById('webchatInput'); if(inp) inp.focus(); }, 200);
  }
  } catch(_e) { console.error("[SG] toggleWebChat:", _e); }
}

function renderWebChatMessages() {
  try {
  var msgEl = document.getElementById('webchatMessages');
  if(!msgEl) return;

  if(!currentCustomer) {
    msgEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:0.85rem;">' +
      '🔐 Please <b style="color:var(--fire);cursor:pointer;" onclick="closeWebChat();openAuthModal(\'signin\')">Sign In</b> to start chatting</div>';
    var inputRow = document.getElementById('webchatInputRow');
    if(inputRow) inputRow.style.display = 'none';
    return;
  }

  var inputRow = document.getElementById('webchatInputRow');
  if(inputRow) inputRow.style.display = 'flex';

  var custId = getOrCreateSession();
  var chats = getWebChats();
  var session = chats[custId];
  if(!session) return;

  // Mark as read by customer
  session.custUnread = 0;
  setWebChats(chats);

  msgEl.innerHTML = session.messages.map(function(m) {
    var isSt = m.from==='staff';
    return '<div style="display:flex;flex-direction:column;align-items:'+(isSt?'flex-start':'flex-end')+'">' +
      '<div class="wchat-bubble '+(isSt?'wchat-staff':'wchat-cust')+'">' +
        escHtml(m.text) +
        '<div class="wchat-time">'+(m.time||'')+'</div>' +
      '</div></div>';
  }).join('');
  msgEl.scrollTop = msgEl.scrollHeight;
  } catch(_e) { console.error("[SG] renderWebChatMessages:", _e); }
}

function closeWebChat() {
  try {
  var win = document.getElementById('webchatWindow');
  if(win) win.classList.remove('open');
  } catch(_e) { console.error("[SG] closeWebChat:", _e); }
}

function sendWebChat() {
  try {
  if(!currentCustomer) { openAuthModal('signin'); return; }
  var inp = document.getElementById('webchatInput');
  var text = inp ? inp.value.trim() : '';
  if(!text) return;
  inp.value = '';

  var custId = getOrCreateSession();
  var chats = getWebChats();
  var session = chats[custId];
  session.messages.push({ from:'customer', text: _cleanText(text), time: new Date().toLocaleString('en-IN') });
  session.lastAt = new Date().toLocaleString('en-IN');
  session.unread = (session.unread||0) + 1; // admin unread
  setWebChats(chats);
  renderWebChatMessages();
  updateWebChatAdminBadge();
  } catch(_e) { console.error("[SG] sendWebChat:", _e); }
}

function updateWebChatAdminBadge() {
  try {
  var chats = getWebChats();
  var total = Object.values(chats).reduce(function(s,c){ return s+(c.unread||0); }, 0);
  var el = document.getElementById('webchatUnreadCount');
  if(el) el.textContent = total > 0 ? total + ' unread message' + (total>1?'s':'') : '';
  } catch(_e) { console.error("[SG] updateWebChatAdminBadge:", _e); }
}

// Admin: Show web chat sessions
async function showWebChatSessions() {
  try {
  var panel = document.getElementById('webchatSessionsPanel');
  if(!panel) return;
  panel.style.display = panel.style.display==='none' ? 'block' : 'none';
  // Refresh webchat data from Supabase before rendering
  try {
    const freshChats = await sbGetSetting('sg_webchats', null);
    if(freshChats) localStorage.setItem('sg_webchats', JSON.stringify(freshChats));
  } catch(e) {}
  renderAdminWebChat();
  } catch(_e) { console.error("[SG] showWebChatSessions:", _e); }
}

function renderAdminWebChat() {
  try {
  var el = document.getElementById('adminWebChatList');
  if(!el) return;
  var chats = getWebChats();
  var keys = Object.keys(chats);
  if(!keys.length) { el.innerHTML='<div style="color:var(--muted);font-size:0.85rem;padding:12px;">No web chat sessions yet.</div>'; return; }
  el.innerHTML = keys.sort(function(a,b){ return (chats[b].lastAt||'').localeCompare(chats[a].lastAt||''); }).map(function(k){
    var s = chats[k];
    var last = s.messages.length ? s.messages[s.messages.length-1] : null;
    return '<div class="webchat-session-card'+(s.unread>0?' unread':'')+'" onclick="openAdminWebChatSession(\''+k+'\')">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="font-weight:700;font-size:0.9rem;">'+escHtml(s.name)+'</div>' +
        (s.unread>0?'<span style="background:var(--fire);color:#fff;font-size:0.7rem;font-weight:800;padding:2px 7px;border-radius:10px;">'+s.unread+' new</span>':'') +
      '</div>' +
      '<div style="font-size:0.75rem;color:var(--muted);">'+(s.email||s.id)+'</div>' +
      (last?'<div style="font-size:0.8rem;color:var(--dark);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escHtml(last.text.slice(0,60))+'</div>':'') +
      '<div style="font-size:0.72rem;color:var(--muted);margin-top:4px;">'+(s.lastAt||'')+'</div>' +
    '</div>';
  }).join('');
  } catch(_e) { console.error("[SG] renderAdminWebChat:", _e); }
}

var _adminChatSession = null;
function openAdminWebChatSession(custId) {
  try {
  _adminChatSession = custId;
  var chats = getWebChats();
  var s = chats[custId];
  if(!s) return;

  // Mark as read by admin
  s.unread = 0;
  setWebChats(chats);
  renderAdminWebChat();
  updateWebChatAdminBadge();

  // Show in ticket detail modal repurposed — or simple alert + inline
  var html = '<div style="max-height:300px;overflow-y:auto;padding:10px;background:#f9f5f0;border-radius:10px;display:flex;flex-direction:column;gap:8px;" id="adminChatThread">' +
    s.messages.map(function(m){
      var isSt = m.from==='staff';
      return '<div style="display:flex;flex-direction:column;align-items:'+(isSt?'flex-end':'flex-start')+'">' +
        '<div style="max-width:80%;padding:9px 13px;border-radius:14px;font-size:0.85rem;background:'+(isSt?'var(--fire)':'#fff')+';color:'+(isSt?'#fff':'var(--dark)')+';border:'+(isSt?'none':'1px solid #e8d5c8')+';">' +
          escHtml(m.text)+'<div style="font-size:0.65rem;opacity:0.65;margin-top:3px;">'+(m.time||'')+'</div>' +
        '</div></div>';
    }).join('') +
  '</div>' +
  '<div style="display:flex;gap:8px;margin-top:10px;">' +
    '<input type="text" id="adminChatReply" class="form-input" placeholder="Type a reply..." style="flex:1;" onkeydown="if(event.key===\'Enter\')sendAdminWebChatReply()">' +
    '<button onclick="sendAdminWebChatReply()" style="background:var(--fire);color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;">Send</button>' +
  '</div>';

  // Use ticket detail modal to show it
  document.getElementById('tdTicketId').textContent = 'WEB-CHAT: ' + custId;
  document.getElementById('tdSubject').textContent = '💬 Chat with ' + s.name;
  document.getElementById('tdBadges').innerHTML = '<span class="ch-web">web chat</span>';
  document.getElementById('tdInfoGrid').innerHTML =
    infoRow('Customer', s.name) + infoRow('Contact', s.email||custId) +
    infoRow('Messages', s.messages.length) + infoRow('Last Active', s.lastAt||'—');
  document.getElementById('tdMsgThread').innerHTML = '';
  document.getElementById('tdMsgThread').parentElement.innerHTML =
    '<div style="font-weight:700;font-size:0.82rem;margin-bottom:6px;">💬 Chat History</div>' + html +
    '<div class="form-group" style="margin-top:12px;"><label style="font-size:0.78rem;">Resolution Notes</label>' +
    '<textarea id="tdResNotes" class="form-input" rows="2" style="width:100%;resize:vertical;" placeholder="Internal notes..."></textarea></div>' +
    '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:10px;">' +
    '<button onclick="var m=document.getElementById(\'ticketDetailModal\');m.classList.remove(\'open\');m.style.display=\'none\';" class="btn-cancel">Close</button>' +
    '<button onclick="convertWebChatToTicket()" style="background:#3498db;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;">🎫 Convert to Ticket</button>' +
    '</div>';
  var modal = document.getElementById('ticketDetailModal');
  modal.style.display = '';
  modal.classList.add('open');
  } catch(_e) { console.error("[SG] openAdminWebChatSession:", _e); }
}

function sendAdminWebChatReply() {
  try {
  if(!_adminChatSession) return;
  var inp = document.getElementById('adminChatReply');
  var text = inp ? inp.value.trim() : '';
  if(!text) return;
  inp.value = '';
  var chats = getWebChats();
  var s = chats[_adminChatSession];
  if(!s) return;
  s.messages.push({ from:'staff', text: _cleanText(text), time: new Date().toLocaleString('en-IN') });
  s.lastAt = new Date().toLocaleString('en-IN');
  s.custUnread = (s.custUnread||0)+1;
  setWebChats(chats);
  // Update admin badge on customer side
  var badge = document.getElementById('webchatBadge');
  if(badge && s.custUnread>0) { badge.textContent=s.custUnread; badge.classList.add('show'); }
  openAdminWebChatSession(_adminChatSession);
  } catch(_e) { console.error("[SG] sendAdminWebChatReply:", _e); }
}

function convertWebChatToTicket() {
  try {
  if(!_adminChatSession) return;
  var chats = getWebChats();
  var s = chats[_adminChatSession];
  if(!s) return;
  var transcript = s.messages.map(function(m){ return (m.from==='staff'?'Staff':'Customer')+': '+m.text; }).join('\n');
  var ticket = {
    id: genTicketId('inquiry'),
    type: 'inquiry', channel: 'web',
    custName: s.name, custMobile: '', custEmail: s.email||'', custId: _adminChatSession,
    subType: 'Web Chat', subject: 'Web Chat — ' + s.name,
    desc: transcript, priority: 'medium', status: 'Open', assignedTo: '',
    orderId: '', resNotes: '',
    createdAt: s.createdAt||new Date().toLocaleString('en-IN'),
    updatedAt: new Date().toLocaleString('en-IN'),
    messages: s.messages.map(function(m){ return { from: m.from==='staff'?'staff':'customer', name: m.from==='staff'?'Staff':s.name, text: m.text, time: m.time }; })
  };
  var tickets = getTickets();
  tickets.unshift(ticket);
  setTickets(tickets);
  updateSupportBadge();
  closeModal('ticketDetailModal');
  showToast('✅ Chat converted to ticket: ' + ticket.id);
  showSupportTab('tickets');
  } catch(_e) { console.error("[SG] convertWebChatToTicket:", _e); }
}

// Poll for new admin replies (customer side)
setInterval(function() {
  if(!currentCustomer) return;
  var custId = currentCustomer.mobile || currentCustomer.email;
  var chats = getWebChats();
  var s = chats[custId];
  if(!s) return;
  var unread = s.custUnread||0;
  var badge = document.getElementById('webchatBadge');
  if(badge) {
    if(unread>0) { badge.textContent=unread; badge.classList.add('show'); }
    else { badge.classList.remove('show'); }
  }
  var win = document.getElementById('webchatWindow');
  if(win && win.classList.contains('open')) renderWebChatMessages();
}, 3000);


// DATA INJECT FUNCTION
function injectCSVData() {
  try {
  var purchases = [{"id": "PUR0001", "date": "2026-03-10", "vendorId": "V002", "vendorName": "Spice Kingdom", "itemType": "solid", "itemId": "P001", "itemName": "Paneer 1kg", "qty": 20, "unitWt": "", "totalWt": "20 packet", "mfgDate": "", "expDate": "", "batch": "BILL0001", "mrp": "", "price": 100, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 2000, "total": 2000, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0001", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0002", "date": "2026-05-02", "vendorId": "V003", "vendorName": "Meat Masters", "itemType": "rawmat", "itemId": "R002", "itemName": "Cabbage", "qty": 10, "unitWt": "", "totalWt": "10 kg", "mfgDate": "", "expDate": "", "batch": "BILL0002", "mrp": "", "price": 35, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 350, "total": 350, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0002", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0003", "date": "2026-03-16", "vendorId": "V007", "vendorName": "Veggie World", "itemType": "solid", "itemId": "P003", "itemName": "Cooking Oil 5L", "qty": 18, "unitWt": "", "totalWt": "18 bottle", "mfgDate": "", "expDate": "", "batch": "BILL0003", "mrp": "", "price": 500, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 9000, "total": 9000, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0003", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0004", "date": "2026-05-01", "vendorId": "V009", "vendorName": "Packaging Plus", "itemType": "rawmat", "itemId": "R002", "itemName": "Cabbage", "qty": 17, "unitWt": "", "totalWt": "17 kg", "mfgDate": "", "expDate": "", "batch": "BILL0004", "mrp": "", "price": 35, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 595, "total": 595, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0004", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0005", "date": "2026-03-08", "vendorId": "V009", "vendorName": "Packaging Plus", "itemType": "solid", "itemId": "P004", "itemName": "Basmati Rice 25kg", "qty": 42, "unitWt": "", "totalWt": "42 bag", "mfgDate": "", "expDate": "", "batch": "BILL0005", "mrp": "", "price": 2500, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 105000, "total": 105000, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0005", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0006", "date": "2026-04-25", "vendorId": "V001", "vendorName": "Fresh Farm Supplies", "itemType": "rawmat", "itemId": "R005", "itemName": "Tomato", "qty": 49, "unitWt": "", "totalWt": "49 kg", "mfgDate": "", "expDate": "", "batch": "BILL0006", "mrp": "", "price": 25, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 1225, "total": 1225, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0006", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0007", "date": "2026-04-06", "vendorId": "V006", "vendorName": "Oil & Essentials", "itemType": "solid", "itemId": "P006", "itemName": "Soy Sauce 750ml", "qty": 26, "unitWt": "", "totalWt": "26 bottle", "mfgDate": "", "expDate": "", "batch": "BILL0007", "mrp": "", "price": 75, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 1950, "total": 1950, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0007", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0008", "date": "2026-05-17", "vendorId": "V002", "vendorName": "Spice Kingdom", "itemType": "solid", "itemId": "P007", "itemName": "Mozzarella 500g", "qty": 27, "unitWt": "", "totalWt": "27 packet", "mfgDate": "", "expDate": "", "batch": "BILL0008", "mrp": "", "price": 50, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 1350, "total": 1350, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0008", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0009", "date": "2026-03-14", "vendorId": "V005", "vendorName": "Grain Gate", "itemType": "rawmat", "itemId": "R008", "itemName": "Cream", "qty": 39, "unitWt": "", "totalWt": "39 L", "mfgDate": "", "expDate": "", "batch": "BILL0009", "mrp": "", "price": 180, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 7020, "total": 7020, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0009", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0010", "date": "2026-05-15", "vendorId": "V007", "vendorName": "Veggie World", "itemType": "solid", "itemId": "P001", "itemName": "Paneer 1kg", "qty": 45, "unitWt": "", "totalWt": "45 packet", "mfgDate": "", "expDate": "", "batch": "BILL0010", "mrp": "", "price": 100, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 4500, "total": 4500, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0010", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0011", "date": "2026-03-12", "vendorId": "V006", "vendorName": "Oil & Essentials", "itemType": "rawmat", "itemId": "R009", "itemName": "Fish (Rohu)", "qty": 7, "unitWt": "", "totalWt": "7 kg", "mfgDate": "", "expDate": "", "batch": "BILL0011", "mrp": "", "price": 180, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 1260, "total": 1260, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0011", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0012", "date": "2026-03-07", "vendorId": "V004", "vendorName": "Dairy Direct", "itemType": "rawmat", "itemId": "R009", "itemName": "Fish (Rohu)", "qty": 19, "unitWt": "", "totalWt": "19 kg", "mfgDate": "", "expDate": "", "batch": "BILL0012", "mrp": "", "price": 180, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 3420, "total": 3420, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0012", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0013", "date": "2026-05-18", "vendorId": "V007", "vendorName": "Veggie World", "itemType": "solid", "itemId": "P010", "itemName": "Salt 1kg", "qty": 28, "unitWt": "", "totalWt": "28 packet", "mfgDate": "", "expDate": "", "batch": "BILL0013", "mrp": "", "price": 100, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 2800, "total": 2800, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0013", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0014", "date": "2026-05-10", "vendorId": "V006", "vendorName": "Oil & Essentials", "itemType": "solid", "itemId": "P010", "itemName": "Salt 1kg", "qty": 22, "unitWt": "", "totalWt": "22 packet", "mfgDate": "", "expDate": "", "batch": "BILL0014", "mrp": "", "price": 100, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 2200, "total": 2200, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0014", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0015", "date": "2026-03-02", "vendorId": "V002", "vendorName": "Spice Kingdom", "itemType": "rawmat", "itemId": "R005", "itemName": "Tomato", "qty": 39, "unitWt": "", "totalWt": "39 kg", "mfgDate": "", "expDate": "", "batch": "BILL0015", "mrp": "", "price": 25, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 975, "total": 975, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0015", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0016", "date": "2026-04-29", "vendorId": "V003", "vendorName": "Meat Masters", "itemType": "solid", "itemId": "P001", "itemName": "Paneer 1kg", "qty": 45, "unitWt": "", "totalWt": "45 packet", "mfgDate": "", "expDate": "", "batch": "BILL0016", "mrp": "", "price": 100, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 4500, "total": 4500, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0016", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0017", "date": "2026-03-03", "vendorId": "V009", "vendorName": "Packaging Plus", "itemType": "solid", "itemId": "P007", "itemName": "Mozzarella 500g", "qty": 8, "unitWt": "", "totalWt": "8 packet", "mfgDate": "", "expDate": "", "batch": "BILL0017", "mrp": "", "price": 50, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 400, "total": 400, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0017", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0018", "date": "2026-05-01", "vendorId": "V001", "vendorName": "Fresh Farm Supplies", "itemType": "rawmat", "itemId": "R011", "itemName": "Milk (Fresh)", "qty": 22, "unitWt": "", "totalWt": "22 L", "mfgDate": "", "expDate": "", "batch": "BILL0018", "mrp": "", "price": 55, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 1210, "total": 1210, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0018", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0019", "date": "2026-05-22", "vendorId": "V004", "vendorName": "Dairy Direct", "itemType": "rawmat", "itemId": "R012", "itemName": "Carrot", "qty": 50, "unitWt": "", "totalWt": "50 kg", "mfgDate": "", "expDate": "", "batch": "BILL0019", "mrp": "", "price": 45, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 2250, "total": 2250, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0019", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0020", "date": "2026-04-20", "vendorId": "V004", "vendorName": "Dairy Direct", "itemType": "rawmat", "itemId": "R011", "itemName": "Milk (Fresh)", "qty": 46, "unitWt": "", "totalWt": "46 L", "mfgDate": "", "expDate": "", "batch": "BILL0020", "mrp": "", "price": 55, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 2530, "total": 2530, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0020", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0021", "date": "2026-04-02", "vendorId": "V003", "vendorName": "Meat Masters", "itemType": "solid", "itemId": "P006", "itemName": "Soy Sauce 750ml", "qty": 40, "unitWt": "", "totalWt": "40 bottle", "mfgDate": "", "expDate": "", "batch": "BILL0021", "mrp": "", "price": 75, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 3000, "total": 3000, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0021", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0022", "date": "2026-03-23", "vendorId": "V005", "vendorName": "Grain Gate", "itemType": "rawmat", "itemId": "R013", "itemName": "Curd", "qty": 42, "unitWt": "", "totalWt": "42 kg", "mfgDate": "", "expDate": "", "batch": "BILL0022", "mrp": "", "price": 70, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 2940, "total": 2940, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0022", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0023", "date": "2026-04-09", "vendorId": "V006", "vendorName": "Oil & Essentials", "itemType": "solid", "itemId": "P014", "itemName": "Tomato Ketchup 1kg", "qty": 37, "unitWt": "", "totalWt": "37 bottle", "mfgDate": "", "expDate": "", "batch": "BILL0023", "mrp": "", "price": 100, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 3700, "total": 3700, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0023", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0024", "date": "2026-03-28", "vendorId": "V002", "vendorName": "Spice Kingdom", "itemType": "rawmat", "itemId": "R015", "itemName": "Prawns", "qty": 14, "unitWt": "", "totalWt": "14 kg", "mfgDate": "", "expDate": "", "batch": "BILL0024", "mrp": "", "price": 450, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 6300, "total": 6300, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0024", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0025", "date": "2026-03-11", "vendorId": "V003", "vendorName": "Meat Masters", "itemType": "rawmat", "itemId": "R013", "itemName": "Curd", "qty": 43, "unitWt": "", "totalWt": "43 kg", "mfgDate": "", "expDate": "", "batch": "BILL0025", "mrp": "", "price": 70, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 3010, "total": 3010, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0025", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0026", "date": "2026-05-22", "vendorId": "V007", "vendorName": "Veggie World", "itemType": "solid", "itemId": "P004", "itemName": "Basmati Rice 25kg", "qty": 38, "unitWt": "", "totalWt": "38 bag", "mfgDate": "", "expDate": "", "batch": "BILL0026", "mrp": "", "price": 2500, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 95000, "total": 95000, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0026", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0027", "date": "2026-04-28", "vendorId": "V009", "vendorName": "Packaging Plus", "itemType": "rawmat", "itemId": "R016", "itemName": "Chicken (Fresh)", "qty": 48, "unitWt": "", "totalWt": "48 kg", "mfgDate": "", "expDate": "", "batch": "BILL0027", "mrp": "", "price": 280, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 13440, "total": 13440, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0027", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0028", "date": "2026-05-16", "vendorId": "V009", "vendorName": "Packaging Plus", "itemType": "rawmat", "itemId": "R017", "itemName": "Coriander Leaves", "qty": 600, "unitWt": "", "totalWt": "600 g", "mfgDate": "", "expDate": "", "batch": "BILL0028", "mrp": "", "price": 0.4, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 240, "total": 240, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0028", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0029", "date": "2026-04-23", "vendorId": "V007", "vendorName": "Veggie World", "itemType": "solid", "itemId": "P018", "itemName": "Amul Butter 500g", "qty": 21, "unitWt": "", "totalWt": "21 packet", "mfgDate": "", "expDate": "", "batch": "BILL0029", "mrp": "", "price": 500, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 10500, "total": 10500, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0029", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}, {"id": "PUR0030", "date": "2026-03-27", "vendorId": "V003", "vendorName": "Meat Masters", "itemType": "rawmat", "itemId": "R015", "itemName": "Prawns", "qty": 45, "unitWt": "", "totalWt": "45 kg", "mfgDate": "", "expDate": "", "batch": "BILL0030", "mrp": "", "price": 450, "discount": 0, "gstPct": 0, "gstAmt": 0, "subtotal": 20250, "total": 20250, "payMode": "Cash", "payStatus": "Paid", "billNo": "BILL0030", "billFile": "", "receivedBy": "Admin", "notes": "", "addedBy": "CSV Import", "addedAt": "02/06/2026"}];
  var stock = {"solid_P001": {"type": "solid", "itemId": "P001", "qty": 110, "lastUpdated": "02/06/2026"}, "rawmat_R002": {"type": "rawmat", "itemId": "R002", "qty": 27, "lastUpdated": "02/06/2026"}, "solid_P003": {"type": "solid", "itemId": "P003", "qty": 18, "lastUpdated": "02/06/2026"}, "solid_P004": {"type": "solid", "itemId": "P004", "qty": 80, "lastUpdated": "02/06/2026"}, "rawmat_R005": {"type": "rawmat", "itemId": "R005", "qty": 88, "lastUpdated": "02/06/2026"}, "solid_P006": {"type": "solid", "itemId": "P006", "qty": 66, "lastUpdated": "02/06/2026"}, "solid_P007": {"type": "solid", "itemId": "P007", "qty": 35, "lastUpdated": "02/06/2026"}, "rawmat_R008": {"type": "rawmat", "itemId": "R008", "qty": 39, "lastUpdated": "02/06/2026"}, "rawmat_R009": {"type": "rawmat", "itemId": "R009", "qty": 26, "lastUpdated": "02/06/2026"}, "solid_P010": {"type": "solid", "itemId": "P010", "qty": 50, "lastUpdated": "02/06/2026"}, "rawmat_R011": {"type": "rawmat", "itemId": "R011", "qty": 68, "lastUpdated": "02/06/2026"}, "rawmat_R012": {"type": "rawmat", "itemId": "R012", "qty": 50, "lastUpdated": "02/06/2026"}, "rawmat_R013": {"type": "rawmat", "itemId": "R013", "qty": 85, "lastUpdated": "02/06/2026"}, "solid_P014": {"type": "solid", "itemId": "P014", "qty": 37, "lastUpdated": "02/06/2026"}, "rawmat_R015": {"type": "rawmat", "itemId": "R015", "qty": 59, "lastUpdated": "02/06/2026"}, "rawmat_R016": {"type": "rawmat", "itemId": "R016", "qty": 48, "lastUpdated": "02/06/2026"}, "rawmat_R017": {"type": "rawmat", "itemId": "R017", "qty": 12, "lastUpdated": "02/06/2026"}, "solid_P018": {"type": "solid", "itemId": "P018", "qty": 21, "lastUpdated": "02/06/2026"}};
  sbUpsertInv('inv_purchases', purchases).catch(e=>console.error('inject purchases fail:',e));
  Object.entries(stock).forEach(([k,v])=>{ v.stock_key=k; sbUpsertInv('inv_stock',[v],'stock_key').catch(()=>{}); });
  invInvalidate('purchases'); invInvalidate('stock');
  if(typeof renderPurchases === 'function') renderPurchases();
  if(typeof renderStock === 'function') renderStock();
  showToast('✅ 30 purchases + 18 stock items loaded!');
  var btn = document.getElementById('injectDataBtn');
  if(btn) btn.parentElement.removeChild(btn);
  } catch(_e) { console.error("[SG] injectCSVData:", _e); }
}

// ===== MY TEAM =====
function renderMyTeam() {
  try {
  if(!currentUser) return;
  var isAdm = currentUser.role === 'Admin';
  var allStaff = getStaffList();

  // Get team members
  var team = isAdm ? allStaff : allStaff.filter(function(s){
    return s.reportingTo === currentUser.username || s.reportingTo === currentUser.id;
  });

  // Stats
  var statsEl = document.getElementById('myTeamStats');
  if(statsEl) {
    var active = team.filter(function(s){ return s.status!=='inactive'; }).length;
    statsEl.innerHTML = [
      ['👥', 'Total Team', team.length, '#3498db'],
      ['✅', 'Active', active, '#27ae60'],
      ['💤', 'Inactive', team.length - active, '#e74c3c'],
    ].map(function(s){
      return '<div style="background:#fff;border-radius:12px;padding:16px;border:2px solid #f0e6dc;text-align:center;">' +
        '<div style="font-size:1.4rem;">'+s[0]+'</div>' +
        '<div style="font-size:1.6rem;font-weight:800;color:'+s[3]+';">'+s[2]+'</div>' +
        '<div style="font-size:0.78rem;color:var(--muted);">'+s[1]+'</div>' +
      '</div>';
    }).join('');
  }

  // Team list
  var listEl = document.getElementById('myTeamList');
  if(listEl) {
    if(!team.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">No team members reporting to you yet.</div>';
      return;
    }
    listEl.innerHTML = '<div style="display:grid;gap:10px;">' +
      team.map(function(s){
        return '<div style="background:#fff;border-radius:12px;padding:14px 18px;border:2px solid #f0e6dc;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:40px;height:40px;border-radius:50%;background:'+(s.color||'#3498db')+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1rem;">'+(s.name||'?')[0].toUpperCase()+'</div>' +
            '<div>' +
              '<div style="font-weight:700;font-size:0.95rem;">'+(s.name||'')+'</div>' +
              '<div style="font-size:0.78rem;color:var(--muted);">'+(s.role||'')+(s.dept?' — '+s.dept:'')+'</div>' +
              '<div style="font-size:0.75rem;color:var(--muted);">@'+(s.username||'')+'</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<span style="background:'+(s.status==='inactive'?'#fde8e8':'#d4edda')+';color:'+(s.status==='inactive'?'#c0392b':'#155724')+';padding:3px 10px;border-radius:10px;font-size:0.75rem;font-weight:700;">'+(s.status==='inactive'?'Inactive':'Active')+'</span>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  // Team attendance today
  var attEl = document.getElementById('myTeamAttendance');
  if(attEl) {
    var today = new Date().toISOString().split('T')[0];
    var att = getAttendance();
    var todayAtt = att.filter(function(a){ return a.date===today; });

    if(!team.length) { attEl.innerHTML='<p style="color:var(--muted);font-size:0.85rem;">No team members.</p>'; }
    else {
      attEl.innerHTML = '<div style="display:grid;gap:8px;">' +
        team.map(function(s){
          var rec = todayAtt.find(function(a){ return a.userId===s.username||a.userId===s.id; });
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f9f5f0;border-radius:10px;">' +
            '<div style="font-weight:600;font-size:0.88rem;">'+(s.name||s.username)+'</div>' +
            '<div style="font-size:0.82rem;">' +
              (rec ? '<span style="color:#27ae60;">✅ In: '+(rec.checkIn||'—')+(rec.checkOut?' | Out: '+rec.checkOut:'')+'</span>' :
                     '<span style="color:#e74c3c;">❌ Not checked in</span>') +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }
  }

  // Team tasks
  var taskEl = document.getElementById('myTeamTasks');
  if(taskEl) {
    var tasks = getTasks();
    var teamIds = team.map(function(s){ return s.id||s.username; });
    var myTasks = tasks.filter(function(t){ return teamIds.includes(t.assignedTo); }).slice(0,10);

    if(!myTasks.length) { taskEl.innerHTML='<p style="color:var(--muted);font-size:0.85rem;">No tasks assigned.</p>'; }
    else {
      taskEl.innerHTML = '<div style="display:grid;gap:8px;">' +
        myTasks.map(function(t){
          var priColor = {critical:'#c0392b',high:'#e67e22',medium:'#3498db',low:'#27ae60'}[t.priority]||'#3498db';
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f9f5f0;border-radius:10px;">' +
            '<div>' +
              '<div style="font-weight:600;font-size:0.88rem;">'+(t.title||'')+'</div>' +
              '<div style="font-size:0.75rem;color:var(--muted);">Assigned to: '+(t.assignedToName||t.assignedTo||'')+'</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;align-items:center;">' +
              '<span style="background:'+priColor+'20;color:'+priColor+';padding:2px 8px;border-radius:8px;font-size:0.72rem;font-weight:700;">'+(t.priority||'medium').toUpperCase()+'</span>' +
              '<span style="font-size:0.78rem;color:var(--muted);">'+(t.status||'pending')+'</span>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }
  }
  } catch(_e) { console.error("[SG] renderMyTeam:", _e); }
}
