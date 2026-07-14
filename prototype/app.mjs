import {
  createItem,
  findItem,
  getDirectChildren,
  getGoalPath,
  getProgress,
  isOverdue,
  scheduleItem,
  setStatus,
} from "./model.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" });
const compactDateFormatter = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" });

function localISO(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function addDays(isoDate, amount) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localISO(date);
}

function startOfWeek(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return localISO(date);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const today = localISO();
const yesterday = addDays(today, -1);
const tomorrow = addDays(today, 1);
const weekStart = startOfWeek(today);

const state = {
  screen: "today",
  plannerView: "week",
  anchorDate: today,
  selectedGoalId: "web-mvp",
  editingGoalId: null,
  editingTaskId: null,
  collapsedGoals: new Set(),
  weekFocus: "完成可点击原型，并让目标与执行真正连起来。",
  draggedId: null,
  undo: null,
  items: [
    item("life", "成为一名独立创造者", null, "life", "doing", null, { description: "拥有持续创造产品的能力，让工作、学习与生活形成自己的节奏。" }),
    item("stage", "发布自己的第一款产品", "life", "stage", "doing", null, { description: "从产品定义、原型到可使用版本，完整走过一次独立产品开发。" }),
    item("web-mvp", "完成计划软件 Web MVP", "stage", "project", "doing", null, { important: true, description: "打通目标规划、日常排期、延期处理与复盘闭环。" }),
    item("analysis", "完成产品分析文档", "web-mvp", "task", "done", { granularity: "day", date: yesterday }),
    item("prd", "完成 Web MVP PRD", "web-mvp", "task", "done", { granularity: "day", date: today }),
    item("prototype", "制作可点击的低保真原型", "web-mvp", "task", "doing", { granularity: "day", date: today }, { focus: true, important: true }),
    item("home-layout", "完成今日首页布局", "prototype", "task", "todo", { granularity: "day", date: today }, { focus: true }),
    item("read-prd", "阅读 PRD 并标注疑问", "prototype", "task", "todo", { granularity: "time", date: today, start: "09:30" }, { duration: 60 }),
    item("drag-flow", "验证拖拽排期是否顺手", "prototype", "task", "todo", { granularity: "time", date: today, start: "14:00" }, { duration: 90, focus: true }),
    item("walk", "散步，让脑子慢下来", null, "task", "todo", { granularity: "time", date: today, start: "17:30" }, { duration: 30 }),
    item("data-model", "设计本地数据结构", "web-mvp", "task", "todo", { granularity: "week", start: weekStart, end: addDays(weekStart, 6) }),
    item("reschedule-copy", "梳理延期原因选项", "prototype", "task", "todo", { granularity: "day", date: yesterday }, { history: [{ from: { date: addDays(today, -3) }, to: { date: yesterday }, reason: "任务比预计大", changedAt: new Date().toISOString() }] }),
    item("inbox-1", "整理几款日历产品的交互参考", null, null, "todo", null),
    item("inbox-2", "想一个更适合产品的名字", null, null, "todo", null, { important: true }),
    item("repeat-review", "周日晚做本周复盘", null, "task", "todo", { granularity: "day", date: addDays(weekStart, 6) }),
  ],
};

function item(id, title, parentId, role, status, schedule, extra = {}) {
  return {
    id,
    title,
    parentId,
    role,
    status,
    schedule,
    description: "",
    important: false,
    focus: false,
    duration: null,
    history: [],
    createdAt: new Date().toISOString(),
    completedAt: status === "done" ? new Date().toISOString() : null,
    ...extra,
  };
}

const roleLabels = { life: "人生方向", stage: "阶段目标", annual: "年度目标", project: "项目", task: "普通任务" };
const statusLabels = { todo: "待办", doing: "进行中", done: "已完成", abandoned: "已放弃" };

function takeSnapshot(message) {
  state.undo = { items: structuredClone(state.items), message };
  $("#undo-button").disabled = false;
}

function toast(message) {
  const region = $("#toast-region");
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  region.append(node);
  setTimeout(() => node.remove(), 2800);
}

function inboxItems() {
  return state.items.filter((entry) => !entry.parentId && !entry.schedule && entry.status === "todo" && entry.role !== "life");
}

function overdueItems() {
  return state.items.filter((entry) => isOverdue(entry, today));
}

function itemsOnDate(date, timed = null) {
  return state.items.filter((entry) => {
    if (entry.schedule?.date !== date || ["abandoned"].includes(entry.status)) return false;
    if (timed === true) return Boolean(entry.schedule.start);
    if (timed === false) return !entry.schedule.start;
    return true;
  });
}

function render() {
  $$(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.screen === state.screen));
  const root = $("#main-content");
  const renderers = { today: renderToday, goals: renderGoals, planner: renderPlanner, review: renderReview, settings: renderSettings };
  root.innerHTML = `<div class="page-enter">${renderers[state.screen]()}</div>${renderTaskEditor()}`;
  bindDragTargets(root);
}

function renderPageHeading(title, subtitle, actions = "") {
  return `<header class="page-heading">
    <div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></div>
    ${actions ? `<div class="heading-actions">${actions}</div>` : ""}
  </header>`;
}

function renderToday() {
  const focus = state.items.filter((entry) => entry.focus && entry.schedule?.date === today && !["done", "abandoned"].includes(entry.status));
  const untimed = itemsOnDate(today, false).filter((entry) => entry.status !== "done");
  const timed = itemsOnDate(today, true).filter((entry) => entry.status !== "done");
  const inbox = inboxItems();
  const overdue = overdueItems();

  return `${renderPageHeading("今天，慢慢来。", `${dateFormatter.format(new Date(`${today}T12:00:00`))} · 先把最重要的一小步走完`, `
    <button class="button" data-action="open-review">写日复盘</button>
    <button class="button primary" data-action="focus-capture">＋ 新计划</button>`)}
    <div class="today-grid">
      <section class="today-main">
        <div class="focus-strip">
          <div class="focus-title"><span>今日重点 · ${focus.length}/3</span><button class="button small ghost" data-action="show-focus-help">为什么只选三件？</button></div>
          <div class="focus-list">
            ${focus.map((entry) => `<article class="focus-item is-clickable" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}"><small>${escapeHTML(goalLabel(entry))}</small><p>${escapeHTML(entry.title)}</p></article>`).join("")}
            ${Array.from({ length: Math.max(0, 3 - focus.length) }, () => `<article class="focus-item"><small>留一点空白</small><p>把注意力留给真正重要的事</p></article>`).join("")}
          </div>
        </div>

        <section class="card calendar-card">
          <div class="calendar-toolbar"><strong>今天的时间</strong><span class="calendar-hint">把右侧任务拖进时间轴，或点击任务安排时间</span></div>
          <div class="timeline-wrap"><div class="timeline" data-drop-zone="timeline" data-date="${today}">
            ${renderHourRows()}
            ${timed.map(renderTimeBlock).join("")}
          </div></div>
        </section>
      </section>

      <aside class="today-rail">
        <section class="card untimed-rail" data-drop-zone="untimed" data-date="${today}">
          <div class="card-header"><h2>未规划时间</h2><span class="count-badge">${untimed.length}</span></div>
          <p class="rail-hint">今天要做，但还没决定几点。可拖进左侧时间轴。</p>
          <div class="task-list">${untimed.length ? untimed.map(renderTaskCard).join("") : renderEmpty("都已安排时间", "也可以把时间轴任务拖回这里。")}</div>
        </section>
        <section class="card">
          <div class="card-header"><h2>收集箱</h2><span class="count-badge">${inbox.length}</span></div>
          <div class="task-list">${inbox.length ? inbox.map(renderTaskCard).join("") : renderEmpty("都安排好了", "想到新事情时，先记在这里。")}</div>
        </section>
        <section class="card">
          <div class="card-header"><h2>待重新安排</h2><span class="count-badge">${overdue.length}</span></div>
          <div class="task-list">${overdue.length ? overdue.map(renderRescheduleCard).join("") : renderEmpty("没有积压", "计划变化时，这里会帮你重新决定。")}</div>
        </section>
      </aside>
    </div>`;
}

function goalLabel(entry) {
  const parent = entry.parentId ? findItem(state, entry.parentId) : null;
  return parent?.title ?? roleLabels[entry.role] ?? "独立事项";
}

function renderTaskChip(entry) {
  return `<div class="task-chip" draggable="true" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}" data-drag-id="${entry.id}" title="点击编辑，或拖入小时日历">${entry.important ? "◆ " : ""}${escapeHTML(entry.title)}</div>`;
}

function renderTaskCard(entry) {
  return `<article class="task-card is-clickable" draggable="true" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}" data-drag-id="${entry.id}">
    <div class="task-row">
      <button class="check-button ${entry.status === "done" ? "is-done" : ""}" data-action="toggle-done" data-id="${entry.id}" aria-label="${entry.status === "done" ? "恢复" : "完成"} ${escapeHTML(entry.title)}">${entry.status === "done" ? "✓" : ""}</button>
      <div class="task-copy"><strong>${entry.important ? "◆ " : ""}${escapeHTML(entry.title)}</strong><small>${entry.parentId ? escapeHTML(goalLabel(entry)) : "尚未归入目标"}</small></div>
    </div>
    <div class="task-actions">
      <button class="mini-action" data-action="schedule-today" data-id="${entry.id}">今天</button>
      <button class="mini-action" data-action="select-goal" data-id="${entry.id}">归入目标</button>
      <button class="mini-action" data-action="toggle-important" data-id="${entry.id}">${entry.important ? "取消重要" : "重要"}</button>
    </div>
  </article>`;
}

function renderRescheduleCard(entry) {
  const count = entry.history?.length ?? 0;
  return `<article class="reschedule-card is-clickable" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}">
    <strong>${escapeHTML(entry.title)}</strong>
    <p>原定 ${escapeHTML(entry.schedule?.date ?? "过去")} · 已调整 ${count} 次</p>
    <div class="task-actions">
      <button class="mini-action" data-action="schedule-today" data-id="${entry.id}">今天做</button>
      <button class="mini-action" data-action="schedule-week" data-id="${entry.id}">本周</button>
      <button class="mini-action" data-action="split-task" data-id="${entry.id}">拆小一点</button>
      <button class="mini-action" data-action="abandon" data-id="${entry.id}">放弃</button>
    </div>
  </article>`;
}

function renderHourRows() {
  return Array.from({ length: 13 }, (_, index) => {
    const hour = index + 8;
    const now = new Date();
    const isNow = localISO(now) === today && now.getHours() === hour;
    return `<div class="hour-row ${isNow ? "is-now" : ""}" data-hour="${hour}"><time>${String(hour).padStart(2, "0")}:00</time></div>`;
  }).join("");
}

function renderTimeBlock(entry, index) {
  const [hour, minute] = entry.schedule.start.split(":").map(Number);
  const top = (hour - 8 + minute / 60) * 66;
  const height = Math.max(36, (entry.duration ?? 30) / 60 * 66 - 4);
  const color = index % 3 === 1 ? "blue" : index % 3 === 2 ? "amber" : "";
  const endMinutes = hour * 60 + minute + (entry.duration ?? 30);
  const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  return `<article class="time-block ${color}" draggable="true" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}" data-drag-id="${entry.id}" style="top:${top}px;height:${height}px">
    <strong>${escapeHTML(entry.title)}</strong><small>${entry.schedule.start}—${end} · ${escapeHTML(goalLabel(entry))}</small>
    <span class="resize-handle" data-action="extend-duration" data-id="${entry.id}" title="点击增加 15 分钟"></span>
  </article>`;
}

function renderGoals() {
  const selected = findItem(state, state.selectedGoalId) ?? state.items[0];
  return `${renderPageHeading("目标不是梯子，是方向。", "把想做的事情放进一棵能随时调整的树", `<button class="button primary" data-action="add-child" data-id="${selected.id}">＋ 添加子计划</button>`)}
    <div class="goal-layout">
      <section class="card goal-tree" aria-label="目标树">
        <div class="goal-tree-toolbar"><strong>我的目标</strong><button class="button small primary" data-action="add-root-goal">＋ 新目标</button></div>
        ${state.items.filter((entry) => !entry.parentId && entry.role).map((entry) => renderTreeNode(entry)).join("")}
      </section>
      <section class="card detail-panel">${renderGoalDetail(selected)}</section>
    </div>`;
}

function renderTreeNode(entry) {
  const children = getDirectChildren(state, entry.id);
  const progress = getProgress(state, entry.id);
  const collapsed = state.collapsedGoals.has(entry.id);
  return `<div class="tree-node">
    <div class="tree-row">
      ${children.length ? `<button class="tree-toggle" data-action="toggle-goal" data-id="${entry.id}" aria-expanded="${!collapsed}" aria-label="${collapsed ? "展开" : "收起"} ${escapeHTML(entry.title)}">${collapsed ? "›" : "⌄"}</button>` : `<span class="tree-toggle-placeholder"></span>`}
      <button class="tree-button ${entry.id === state.selectedGoalId ? "is-selected" : ""}" data-action="select-goal-node" data-id="${entry.id}">
        <span class="tree-dot ${entry.role ?? "task"}"></span>
        <span class="tree-label"><strong>${escapeHTML(entry.title)}</strong><small>${roleLabels[entry.role] ?? "计划项"} · ${statusLabels[entry.status]}${entry.schedule ? ` · ${escapeHTML(formatSchedule(entry.schedule))}` : ""}</small></span>
        <span class="tree-progress">${progress === null ? "" : `${progress}%`}</span>
      </button>
      <button class="tree-add" data-action="add-child" data-id="${entry.id}" aria-label="给 ${escapeHTML(entry.title)} 添加子计划" title="添加子计划">＋</button>
    </div>
    ${children.length && !collapsed ? children.map((child) => renderTreeNode(child)).join("") : ""}
  </div>`;
}

function renderGoalDetail(entry) {
  if (state.editingGoalId === entry.id) return renderGoalEditForm(entry);
  const path = getGoalPath(state, entry.id);
  const children = getDirectChildren(state, entry.id);
  const progress = getProgress(state, entry.id) ?? (entry.status === "done" ? 100 : 0);
  return `<div class="detail-topline">
      <div class="detail-breadcrumb">${path.map((node) => `<span>${escapeHTML(node.title)}</span>`).join("")}</div>
      <div class="detail-actions"><button class="button small" data-action="edit-goal" data-id="${entry.id}">编辑说明</button><button class="button small soft" data-action="edit-task" data-id="${entry.id}">角色与排期</button><button class="button small danger" data-action="delete-item" data-id="${entry.id}">删除</button></div>
    </div>
    <h2 class="detail-title">${escapeHTML(entry.title)}</h2>
    <p class="detail-description">${escapeHTML(entry.description || "还没有写说明。可以先从一句“为什么想做这件事”开始。")}</p>
    <div class="meta-grid">
      <div class="meta-card"><small>角色</small><strong>${roleLabels[entry.role] ?? "未设置"}</strong></div>
      <div class="meta-card"><small>状态</small><strong>${statusLabels[entry.status]}</strong></div>
      <div class="meta-card"><small>当前排期</small><strong>${formatSchedule(entry.schedule)}</strong></div>
      <div class="meta-card"><small>子计划</small><strong>${children.length} 项</strong></div>
    </div>
    <div class="card-header" style="padding-inline:0"><h3>自动进度</h3><span>${progress}%</span></div>
    <div class="progress-track"><span style="width:${progress}%"></span></div>
    <div class="subtask-table">
      ${children.length ? children.map((child) => `<div class="subtask-line is-clickable" role="button" tabindex="0" data-action="edit-task" data-id="${child.id}"><span class="status-dot ${child.status}"></span><span>${escapeHTML(child.title)}</span><small>${statusLabels[child.status]}</small></div>`).join("") : renderEmpty("还没有子计划", "把下一步拆得足够小，就更容易开始。")}
    </div>`;
}

function renderGoalEditForm(entry) {
  const path = getGoalPath(state, entry.id);
  return `<form class="detail-edit-form" data-goal-edit-form data-id="${entry.id}">
    <div class="detail-topline">
      <div class="detail-breadcrumb">${path.map((node) => `<span>${escapeHTML(node.title)}</span>`).join("")}</div>
      <span class="count-badge">编辑中</span>
    </div>
    <p class="edit-kicker">编辑计划项</p>
    <div class="edit-field">
      <label for="edit-title-${entry.id}">标题</label>
      <input id="edit-title-${entry.id}" name="title" value="${escapeHTML(entry.title)}" maxlength="120" required autofocus />
    </div>
    <div class="edit-field">
      <label for="edit-description-${entry.id}">说明</label>
      <textarea id="edit-description-${entry.id}" name="description" placeholder="可以先写一句：为什么想做这件事？">${escapeHTML(entry.description)}</textarea>
    </div>
    <div class="edit-grid">
      <div class="edit-field">
        <label for="edit-role-${entry.id}">角色</label>
        <select id="edit-role-${entry.id}" name="role">
          <option value="">未设置</option>
          ${Object.entries(roleLabels).map(([value, label]) => `<option value="${value}" ${entry.role === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>
      <div class="edit-field">
        <label for="edit-status-${entry.id}">状态</label>
        <select id="edit-status-${entry.id}" name="status">
          ${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${entry.status === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </div>
    </div>
    <p class="edit-help">目标归属和执行排期仍然彼此独立。这里修改标题、说明、角色或状态，不会改变它安排在哪一天。</p>
    <div class="edit-actions">
      <button type="button" class="button" data-action="cancel-edit-goal" data-id="${entry.id}">取消</button>
      <button type="submit" class="button primary">保存修改</button>
    </div>
  </form>`;
}

function getDescendantIds(id, collected = new Set()) {
  for (const child of getDirectChildren(state, id)) {
    if (collected.has(child.id)) continue;
    collected.add(child.id);
    getDescendantIds(child.id, collected);
  }
  return collected;
}

function scheduleBaseDate(schedule) {
  return schedule?.date ?? schedule?.start ?? today;
}

function isoWeekValue(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));
  const isoYear = date.getFullYear();
  const yearStart = new Date(isoYear, 0, 1, 12, 0, 0);
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

function weekStartFromValue(value) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return startOfWeek(today);
  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(year, 0, 4, 12, 0, 0);
  const firstMonday = addDays(localISO(januaryFourth), 1 - (januaryFourth.getDay() || 7));
  return addDays(firstMonday, (week - 1) * 7);
}

function scheduleHelpText(granularity) {
  return {
    none: "先保留在待安排区，之后再决定时间。",
    month: "只确定月份，不固定哪一周或哪一天。",
    week: "只确定这一周，具体哪天可以之后再排。",
    day: "确定哪一天，但暂时不指定开始时间。",
    time: "确定日期、开始时间和预计用时。",
  }[granularity] ?? "";
}

function scheduleField(entryId, name, type, label, value, visibleFor, granularity, extra = "") {
  const visible = visibleFor.includes(granularity);
  return `<div class="edit-field schedule-option" data-schedule-for="${visibleFor.join(" ")}" ${visible ? "" : "hidden"}><label for="task-${name}-${entryId}">${label}</label><input id="task-${name}-${entryId}" name="${name}" type="${type}" value="${value}" ${visible ? "" : "disabled"} ${extra} /></div>`;
}

function renderTaskEditor() {
  const entry = state.editingTaskId ? findItem(state, state.editingTaskId) : null;
  if (!entry) return "";

  const descendants = getDescendantIds(entry.id);
  const parentOptions = state.items.filter((candidate) => candidate.id !== entry.id && !descendants.has(candidate.id) && candidate.status !== "abandoned");
  const granularity = entry.schedule?.granularity ?? "none";
  const baseDate = scheduleBaseDate(entry.schedule);
  const month = baseDate.slice(0, 7);
  const week = isoWeekValue(baseDate);
  const time = entry.schedule?.start && entry.schedule?.granularity === "time" ? entry.schedule.start : "09:00";

  return `<div class="modal-backdrop" data-modal-backdrop>
    <section class="task-editor" role="dialog" aria-modal="true" aria-labelledby="task-editor-title">
      <header class="task-editor-header">
        <div><span class="eyebrow">统一计划项编辑器</span><h2 id="task-editor-title">编辑计划项</h2></div>
        <button class="modal-close" data-action="close-task-editor" aria-label="关闭编辑器" title="关闭">×</button>
      </header>
      <form class="task-editor-form" data-task-edit-form data-id="${entry.id}">
        <div class="edit-field task-title-field"><label for="task-title-${entry.id}">标题</label><input id="task-title-${entry.id}" name="title" value="${escapeHTML(entry.title)}" required maxlength="120" /></div>
        <div class="edit-field"><label for="task-description-${entry.id}">说明</label><textarea id="task-description-${entry.id}" name="description" placeholder="为什么做？做到什么程度算完成？">${escapeHTML(entry.description)}</textarea></div>
        <div class="editor-grid three">
          <div class="edit-field"><label for="task-role-${entry.id}">它是什么</label><select id="task-role-${entry.id}" name="role"><option value="">普通事项</option>${Object.entries(roleLabels).map(([value,label]) => `<option value="${value}" ${entry.role === value ? "selected" : ""}>${label}</option>`).join("")}</select></div>
          <div class="edit-field"><label for="task-parent-${entry.id}">归属目标</label><select id="task-parent-${entry.id}" name="parentId"><option value="">无上级 / 收集箱</option>${parentOptions.map((candidate) => `<option value="${candidate.id}" ${entry.parentId === candidate.id ? "selected" : ""}>${escapeHTML(candidate.title)}</option>`).join("")}</select></div>
          <div class="edit-field"><label for="task-status-${entry.id}">状态</label><select id="task-status-${entry.id}" name="status">${Object.entries(statusLabels).map(([value,label]) => `<option value="${value}" ${entry.status === value ? "selected" : ""}>${label}</option>`).join("")}</select></div>
        </div>
        <div class="schedule-editor">
          <div class="schedule-editor-title"><strong>执行排期</strong><span>目标归属与时间安排彼此独立</span></div>
          <div class="editor-grid schedule">
            <div class="edit-field"><label for="task-granularity-${entry.id}">安排到</label><select id="task-granularity-${entry.id}" name="granularity"><option value="none" ${granularity === "none" ? "selected" : ""}>暂不安排</option><option value="month" ${granularity === "month" ? "selected" : ""}>某个月</option><option value="week" ${granularity === "week" ? "selected" : ""}>某一周</option><option value="day" ${granularity === "day" ? "selected" : ""}>某一天</option><option value="time" ${granularity === "time" ? "selected" : ""}>具体时间</option></select></div>
            ${scheduleField(entry.id, "month", "month", "选择月份", month, ["month"], granularity)}
            ${scheduleField(entry.id, "week", "week", "选择周", week, ["week"], granularity)}
            ${scheduleField(entry.id, "date", "date", "选择日期", baseDate, ["day", "time"], granularity)}
            ${scheduleField(entry.id, "time", "time", "开始时间", time, ["time"], granularity)}
            ${scheduleField(entry.id, "duration", "number", "预计分钟", entry.duration ?? 30, ["day", "time"], granularity, 'min="15" max="480" step="15"')}
          </div>
          <p class="schedule-choice-help" data-schedule-help>${scheduleHelpText(granularity)}</p>
        </div>
        <div class="editor-checks">
          <label><input type="checkbox" name="important" ${entry.important ? "checked" : ""} /> 标记为重要</label>
          <label><input type="checkbox" name="focus" ${entry.focus ? "checked" : ""} /> 设为今日重点</label>
        </div>
        <footer class="task-editor-footer">
          <button type="button" class="button danger" data-action="delete-item" data-id="${entry.id}">删除</button>
          <div><button type="button" class="button" data-action="close-task-editor">取消</button><button type="submit" class="button primary">保存修改</button></div>
        </footer>
      </form>
    </section>
  </div>`;
}

function formatSchedule(schedule) {
  if (!schedule) return "未安排";
  if (schedule.granularity === "time") return `${schedule.date} ${schedule.start}`;
  if (schedule.granularity === "day") return schedule.date;
  if (schedule.granularity === "week") return `${schedule.start} 所在周`;
  if (schedule.granularity === "month") return `${schedule.start?.slice(0, 7) ?? "某月"}`;
  return "已安排";
}

function renderPlanner() {
  const pool = state.items.filter((entry) => entry.status === "todo" && !entry.schedule);
  return `${renderPageHeading("把以后，放到看得见的地方。", "先安排到一个大概周期，再慢慢具体到某一天", renderPlannerTabs())}
    <div class="planner-shell">
      <aside class="card planning-pool">
        <div class="card-header"><h2>待安排</h2><span class="count-badge">${pool.length}</span></div>
        <div class="task-list">${pool.map(renderTaskCard).join("") || renderEmpty("没有待安排事项", "从收集箱记录一件新事情吧。")}</div>
      </aside>
      <section class="card planning-board">${renderPlannerBoard()}</section>
    </div>`;
}

function renderPlannerTabs() {
  return `<div class="view-tabs" aria-label="计划视图">
    ${[["month","月"],["week","周"],["day","日"]].map(([value,label]) => `<button class="view-tab ${state.plannerView === value ? "is-active" : ""}" data-action="planner-view" data-view="${value}">${label}</button>`).join("")}
  </div>`;
}

function renderPlannerBoard() {
  if (state.plannerView === "month") return renderMonthBoard();
  if (state.plannerView === "day") return renderDayBoard();
  return renderWeekBoard();
}

function renderPeriodNavigator(label) {
  return `<div class="period-navigator"><button class="button small" data-action="move-period" data-direction="-1" aria-label="上一个周期">‹</button><button class="period-current" data-action="reset-period">${escapeHTML(label)}</button><button class="button small" data-action="move-period" data-direction="1" aria-label="下一个周期">›</button></div>`;
}

function renderMonthBoard() {
  const anchor = state.anchorDate;
  const monthName = monthFormatter.format(new Date(`${anchor}T12:00:00`));
  const date = new Date(`${anchor.slice(0, 7)}-01T12:00:00`);
  const mondayOffset = ((date.getDay() || 7) - 1);
  const first = addDays(localISO(date), -mondayOffset);
  const cells = Array.from({ length: 42 }, (_, index) => addDays(first, index));
  return `<div class="board-head">${renderPeriodNavigator(monthName)}<div class="coarse-drop" data-drop-zone="coarse-month">拖到这里，仅安排到这个月</div></div>
    ${renderCoarsePlans("month")}
    <div class="month-weekdays">${["周一","周二","周三","周四","周五","周六","周日"].map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="period-grid month">${cells.map((day) => renderPeriodCell(day, day.slice(0, 7) !== anchor.slice(0, 7))).join("")}</div>`;
}

function renderWeekBoard() {
  const anchorWeekStart = startOfWeek(state.anchorDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(anchorWeekStart, index));
  const label = `${compactDateFormatter.format(new Date(`${anchorWeekStart}T12:00:00`))} — ${compactDateFormatter.format(new Date(`${addDays(anchorWeekStart, 6)}T12:00:00`))}`;
  return `<div class="board-head">${renderPeriodNavigator(label)}<div class="coarse-drop" data-drop-zone="coarse-week">拖到这里，仅安排到这周</div></div>
    ${renderCoarsePlans("week")}
    <label class="week-focus-card"><span><strong>本周重点</strong><small>由你自己填写，不使用 AI</small></span><input id="week-focus-input" value="${escapeHTML(state.weekFocus)}" placeholder="这一周最想推进什么？" /></label>
    <div class="period-grid week">${days.map((day) => renderPeriodCell(day, false, true)).join("")}</div>`;
}

function renderDayBoard() {
  const activeDate = state.anchorDate;
  const groups = [
    ["未定时间", itemsOnDate(activeDate, false)],
    ["上午", itemsOnDate(activeDate, true).filter((entry) => Number(entry.schedule.start.slice(0,2)) < 12)],
    ["下午与晚上", itemsOnDate(activeDate, true).filter((entry) => Number(entry.schedule.start.slice(0,2)) >= 12)],
  ];
  return `<div class="board-head">${renderPeriodNavigator(dateFormatter.format(new Date(`${activeDate}T12:00:00`)))}${activeDate === today ? `<button class="button small" data-action="go-today">打开完整小时日历</button>` : ""}</div>
    <div class="period-grid day">${groups.map(([label, entries], index) => `<section class="period-cell" data-drop-zone="day-part" data-part="${index}" data-date="${activeDate}"><div class="period-label"><strong>${label}</strong><span>${entries.length} 项</span></div>${entries.map((entry) => `<div class="period-task is-clickable ${entry.important ? "coral" : ""}" draggable="true" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}" data-drag-id="${entry.id}">${escapeHTML(entry.title)}${entry.schedule?.start ? `<br><small>${entry.schedule.start}</small>` : ""}</div>`).join("")}</section>`).join("")}</div>`;
}

function renderCoarsePlans(granularity) {
  const activeStart = granularity === "week" ? startOfWeek(state.anchorDate) : `${state.anchorDate.slice(0, 7)}-01`;
  const entries = state.items.filter((entry) => entry.status !== "done" && entry.schedule?.granularity === granularity && entry.schedule.start === activeStart);
  const label = granularity === "week" ? "本周计划" : "本月计划";
  const hint = granularity === "week" ? "拖到下方某一天，继续细化" : "拖到下方日期，确定执行日";
  return `<section class="coarse-plan-shelf">
    <div class="coarse-plan-heading"><div><strong>${label}</strong><span>${entries.length} 项</span></div><small>${hint}</small></div>
    <div class="coarse-plan-list">${entries.length ? entries.map((entry) => `<div class="coarse-plan-item is-clickable" draggable="true" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}" data-drag-id="${entry.id}"><span>${escapeHTML(entry.title)}</span><small>${escapeHTML(goalLabel(entry))}</small></div>`).join("") : `<p>还没有只安排到${granularity === "week" ? "本周" : "本月"}的计划。可以从左侧拖进来。</p>`}</div>
  </section>`;
}

function renderPeriodCell(day, muted = false, weekly = false) {
  const entries = itemsOnDate(day).filter((entry) => entry.status !== "done");
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(new Date(`${day}T12:00:00`));
  return `<section class="period-cell ${muted ? "is-muted" : ""} ${day === today ? "is-today" : ""}" data-drop-zone="date" data-date="${day}">
    <div class="period-label"><strong>${weekly ? `${weekday} ${Number(day.slice(-2))}` : Number(day.slice(-2))}</strong><span>${weekly ? "" : weekday}</span><button data-action="add-on-date" data-date="${day}" aria-label="在 ${day} 添加任务">＋</button></div>
    ${entries.map((entry, index) => `<div class="period-task is-clickable ${index % 3 === 1 ? "coral" : index % 3 === 2 ? "amber" : ""}" draggable="true" role="button" tabindex="0" data-action="edit-task" data-id="${entry.id}" data-drag-id="${entry.id}">${escapeHTML(entry.title)}</div>`).join("")}
  </section>`;
}

function renderReview() {
  const todayEntries = itemsOnDate(today);
  const completed = todayEntries.filter((entry) => entry.status === "done").length;
  const delayed = overdueItems().length;
  return `${renderPageHeading("复盘不是审判，是重新看见。", "系统只呈现事实，答案由你自己写", `<button class="button primary" data-action="save-review">保存今天的复盘</button>`)}
    <div class="review-grid">
      <section>
        <div class="stats-grid">
          <article class="card stat-card"><strong>${todayEntries.length}</strong><small>今天安排</small></article>
          <article class="card stat-card"><strong>${completed}</strong><small>已经完成</small></article>
          <article class="card stat-card"><strong>${delayed}</strong><small>待重新安排</small></article>
          <article class="card stat-card"><strong>${state.items.filter((entry) => entry.focus && entry.status === "done").length}/3</strong><small>重点完成</small></article>
        </div>
        <article class="card review-form" style="margin-top:14px">
          <div class="review-question"><label for="review-win">今天完成了什么，值得肯定？</label><textarea id="review-win" placeholder="哪怕只是开始，也可以记下来。"></textarea></div>
          <div class="review-question"><label for="review-block">什么阻碍了你？</label><textarea id="review-block" placeholder="任务太大、时间不足，还是状态不对？"></textarea></div>
          <div class="review-question"><label for="review-next">明天最重要的一件事是什么？</label><textarea id="review-next" placeholder="只写一件也可以。"></textarea></div>
        </article>
      </section>
      <aside>
        <div class="gentle-insight"><h3>一个温和的发现</h3><p>“梳理延期原因选项”已经调整过一次。它可能不是不重要，只是还不够小。要不要把第一步改成“先列出 3 个常见原因”？</p></div>
        <article class="card" style="padding:22px;margin-top:14px">
          <div class="card-header" style="padding:0"><h3>本周完成节奏</h3><small>不追求每天一样</small></div>
          <div class="mini-bars">${[35,62,44,76,50,18,8].map((height,index) => `<div class="mini-bar ${index === 3 ? "is-strong" : ""}" style="height:${height}%"><span>${"一二三四五六日"[index]}</span></div>`).join("")}</div>
        </article>
      </aside>
    </div>`;
}

function renderSettings() {
  return `${renderPageHeading("设置", "首版所有数据仅保存在当前浏览器", "")}
    <div class="settings-grid">
      <section class="card settings-card"><h2>数据与备份</h2><p>原型不会真正保存文件，这里用于验证入口和提示是否清楚。</p>
        ${settingRow("导出完整备份", "JSON · 包含计划、排期、延期和复盘", `<button class="button small" data-action="demo-export">导出</button>`)}
        ${settingRow("恢复备份", "导入前先校验，不静默覆盖", `<button class="button small" data-action="demo-import">选择文件</button>`)}
        ${settingRow("备份提醒", "超过 7 天未备份时温和提醒", `<button class="toggle" aria-label="关闭备份提醒"></button>`)}
      </section>
      <section class="card settings-card"><h2>计划偏好</h2><p>这些默认值会在真实使用后继续调整。</p>
        ${settingRow("一周从哪天开始", "影响周视图与复盘", `<select aria-label="一周开始日"><option>周一</option><option>周日</option></select>`)}
        ${settingRow("默认时间块", "拖入小时日历后的预计时长", `<select aria-label="默认时间块"><option>30 分钟</option><option>45 分钟</option><option>60 分钟</option></select>`)}
        ${settingRow("时间调整粒度", "拖动任务时吸附的分钟数", `<select aria-label="时间调整粒度"><option>15 分钟</option><option>30 分钟</option></select>`)}
      </section>
      <section class="card settings-card"><h2>关于本地数据</h2><p>清除浏览器数据、重装系统或更换设备都可能造成数据丢失。正式 MVP 会在这里显示最近备份时间。</p><button class="button danger" data-action="demo-clear">清空全部数据…</button></section>
      <section class="card settings-card"><h2>当前原型</h2><p>版本 0.1 · 用于验证信息架构、拖拽排期和延期处理，不代表最终视觉或技术架构。</p><button class="button soft" data-action="reset-demo">恢复演示数据</button></section>
    </div>`;
}

function settingRow(title, subtitle, control) {
  return `<div class="setting-row"><div><strong>${title}</strong><small>${subtitle}</small></div>${control}</div>`;
}

function renderEmpty(title, subtitle) {
  return `<div class="empty-state"><strong>${title}</strong>${subtitle}</div>`;
}

function performAction(action, id, element) {
  const entry = id ? findItem(state, id) : null;
  switch (action) {
    case "edit-task": state.editingTaskId = id; break;
    case "close-task-editor": state.editingTaskId = null; break;
    case "delete-item": {
      if (!entry) return;
      const descendants = getDescendantIds(id);
      const total = descendants.size + 1;
      if (!window.confirm(total > 1 ? `将同时删除这项计划和 ${descendants.size} 个子项，继续吗？` : "确定删除这项计划吗？")) return;
      takeSnapshot("恢复已删除的计划项");
      state.items = state.items.filter((candidate) => candidate.id !== id && !descendants.has(candidate.id));
      state.editingTaskId = null;
      if (!findItem(state, state.selectedGoalId)) state.selectedGoalId = "life";
      toast(`已删除 ${total} 项，可使用顶部撤销。`);
      break;
    }
    case "focus-capture": $("#quick-title").focus(); return;
    case "open-review": state.screen = "review"; break;
    case "go-today": state.screen = "today"; state.anchorDate = today; break;
    case "show-focus-help": toast("今日重点只是温和建议，不会限制你安排更多事项。"); return;
    case "toggle-done":
      takeSnapshot("恢复完成状态");
      setStatus(state, id, entry.status === "done" ? "todo" : "done");
      toast(entry.status === "done" ? "已完成，今天向前走了一点。" : "已恢复为待办。");
      break;
    case "toggle-important":
      takeSnapshot("恢复重要标记"); entry.important = !entry.important; break;
    case "schedule-today":
      takeSnapshot("恢复原排期"); scheduleItem(state, id, { granularity: "day", date: today }, "重新安排到今天"); toast("已安排到今天，原来的计划仍被保留在历史中。"); break;
    case "schedule-week":
      takeSnapshot("恢复原排期"); scheduleItem(state, id, { granularity: "week", start: weekStart, end: addDays(weekStart, 6) }, "重新安排到本周"); toast("已放回本周，什么时候做可以以后再决定。"); break;
    case "abandon":
      takeSnapshot("恢复计划状态"); setStatus(state, id, "abandoned"); toast("已放弃。放下不再重要的事，也是一种前进。"); break;
    case "split-task": {
      takeSnapshot("删除新拆出的子项");
      const child = createItem(state, `先做：${entry.title.slice(0, 14)}`, { parentId: id, role: "task" });
      scheduleItem(state, child.id, { granularity: "day", date: today }, "从延期事项拆分");
      toast("已经拆出一个更小的第一步，并安排到今天。");
      break;
    }
    case "select-goal":
      state.selectedGoalId = "web-mvp"; state.editingGoalId = null; state.screen = "goals"; toast("原型中先带你查看目标树；正式版会打开归属选择器。"); break;
    case "select-goal-node": state.selectedGoalId = id; state.editingGoalId = null; break;
    case "toggle-goal":
      state.collapsedGoals.has(id) ? state.collapsedGoals.delete(id) : state.collapsedGoals.add(id);
      break;
    case "edit-goal": state.editingGoalId = id; break;
    case "cancel-edit-goal": state.editingGoalId = null; break;
    case "add-child":
      takeSnapshot("删除新子计划");
      state.selectedGoalId = createItem(state, "新的下一步", { parentId: id, role: "task" }).id;
      state.editingGoalId = state.selectedGoalId;
      toast("已添加子计划，请直接填写内容。 ");
      break;
    case "add-root-goal":
      takeSnapshot("删除新目标");
      state.selectedGoalId = createItem(state, "新的目标", { role: "direction" }).id;
      state.editingGoalId = state.selectedGoalId;
      state.collapsedGoals.delete(state.selectedGoalId);
      toast("已新建一棵独立目标，请写下它的方向。 ");
      break;
    case "planner-view": state.plannerView = element.dataset.view; break;
    case "move-period": {
      const direction = Number(element.dataset.direction) || 0;
      if (state.plannerView === "day") state.anchorDate = addDays(state.anchorDate, direction);
      if (state.plannerView === "week") state.anchorDate = addDays(state.anchorDate, direction * 7);
      if (state.plannerView === "month") {
        const anchor = new Date(`${state.anchorDate}T12:00:00`);
        anchor.setDate(1);
        anchor.setMonth(anchor.getMonth() + direction);
        state.anchorDate = localISO(anchor);
      }
      break;
    }
    case "reset-period": state.anchorDate = today; break;
    case "add-on-date": {
      takeSnapshot("删除新建的日期任务");
      const created = createItem(state, "新的计划", { role: "task" });
      scheduleItem(state, created.id, { granularity: "day", date: element.dataset.date || state.anchorDate }, "从日期格新建");
      state.editingTaskId = created.id;
      break;
    }
    case "save-review": toast("复盘已保存。写多少都算数。 "); return;
    case "demo-export": toast("正式 MVP 会在这里下载 JSON 备份。 "); return;
    case "demo-import": toast("正式 MVP 会先校验文件，再提供合并或替换。 "); return;
    case "demo-clear": toast("这是原型，不会真的删除数据。正式版会要求输入确认文字。 "); return;
    case "reset-demo": location.reload(); return;
    case "extend-duration":
      takeSnapshot("恢复预计时长"); entry.duration = Math.min(240, (entry.duration ?? 30) + 15); toast(`预计时长调整为 ${entry.duration} 分钟。`); break;
    default: return;
  }
  render();
}

function bindDragTargets(root) {
  $$('[draggable="true"]', root).forEach((node) => {
    node.addEventListener("dragstart", (event) => {
      state.draggedId = node.dataset.dragId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", state.draggedId);
      requestAnimationFrame(() => node.classList.add("is-dragging"));
    });
    node.addEventListener("dragend", () => {
      node.classList.remove("is-dragging");
      state.draggedId = null;
      $$('[data-drop-zone]').forEach((target) => target.classList.remove("is-drop-target"));
    });
  });

  $$('[data-drop-zone]', root).forEach((zone) => {
    zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.classList.add("is-drop-target"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("is-drop-target"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-drop-target");
      const id = event.dataTransfer.getData("text/plain") || state.draggedId;
      if (!id) return;
      takeSnapshot("撤销排期变化");
      const kind = zone.dataset.dropZone;
      if (kind === "timeline") {
        const rect = zone.getBoundingClientRect();
        const minutesFromEight = Math.max(0, Math.min(12 * 60, ((event.clientY - rect.top) / 66) * 60));
        const rounded = Math.round(minutesFromEight / 15) * 15;
        const hour = 8 + Math.floor(rounded / 60);
        const minute = rounded % 60;
        scheduleItem(state, id, { granularity: "time", date: zone.dataset.date, start: `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}` }, "拖入小时日历");
        findItem(state, id).duration ??= 30;
      } else if (kind === "untimed") {
        scheduleItem(state, id, { granularity: "day", date: zone.dataset.date }, "取消具体时间");
      } else if (kind === "date") {
        scheduleItem(state, id, { granularity: "day", date: zone.dataset.date }, "拖入日期");
      } else if (kind === "coarse-week") {
        const activeWeekStart = startOfWeek(state.anchorDate);
        scheduleItem(state, id, { granularity: "week", start: activeWeekStart, end: addDays(activeWeekStart, 6) }, "拖入当前周");
      } else if (kind === "coarse-month") {
        const monthStart = `${state.anchorDate.slice(0,7)}-01`;
        const monthDate = new Date(`${monthStart}T12:00:00`);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12, 0, 0);
        scheduleItem(state, id, { granularity: "month", start: monthStart, end: localISO(monthEnd) }, "拖入当前月");
      } else if (kind === "day-part") {
        const starts = [null, "09:00", "14:00"];
        const start = starts[Number(zone.dataset.part)];
        const activeDate = zone.dataset.date || state.anchorDate;
        scheduleItem(state, id, start ? { granularity: "time", date: activeDate, start } : { granularity: "day", date: activeDate }, "拖入日计划");
        if (start) findItem(state, id).duration ??= 30;
      }
      toast("排期已更新；目标归属没有改变。 ");
      render();
    });
  });
}

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-modal-backdrop]")) { state.editingTaskId = null; render(); return; }
  const nav = event.target.closest(".nav-item");
  if (nav) { state.screen = nav.dataset.screen; render(); return; }
  const actionNode = event.target.closest("[data-action]");
  if (actionNode) performAction(actionNode.dataset.action, actionNode.dataset.id, actionNode);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.editingTaskId) { state.editingTaskId = null; render(); return; }
  const editable = event.target.closest('[data-action="edit-task"]');
  if (editable && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    state.editingTaskId = editable.dataset.id;
    render();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "week-focus-input") state.weekFocus = event.target.value;
});

document.addEventListener("change", (event) => {
  if (!event.target.matches('[data-task-edit-form] [name="granularity"]')) return;
  const form = event.target.closest("[data-task-edit-form]");
  const granularity = event.target.value;
  $$('[data-schedule-for]', form).forEach((field) => {
    const visible = field.dataset.scheduleFor.split(" ").includes(granularity);
    field.hidden = !visible;
    $("input", field).disabled = !visible;
  });
  $("[data-schedule-help]", form).textContent = scheduleHelpText(granularity);
});

$("#week-note-button").addEventListener("click", () => {
  const note = $("#week-note-text");
  const next = window.prompt("写下你的本周一句话", note.textContent.trim());
  if (next?.trim()) {
    note.textContent = next.trim();
    toast("本周一句话已更新。这句话由你自己写。 ");
  }
});

$("#quick-capture").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#quick-title");
  try {
    takeSnapshot("删除刚刚记录的事项");
    createItem(state, input.value);
    input.value = "";
    toast("已放进收集箱，什么时候整理都可以。 ");
    render();
  } catch (error) {
    toast(error.message);
    input.focus();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-task-edit-form]");
  if (!form) return;
  event.preventDefault();
  const entry = findItem(state, form.dataset.id);
  if (!entry) return;

  const data = new FormData(form);
  const title = String(data.get("title") ?? "").trim();
  if (!title) {
    toast("标题不能为空。 ");
    form.elements.title.focus();
    return;
  }

  takeSnapshot("恢复计划项修改");
  entry.title = title;
  entry.description = String(data.get("description") ?? "").trim();
  entry.role = String(data.get("role") ?? "") || null;
  entry.parentId = String(data.get("parentId") ?? "") || null;
  entry.important = data.get("important") === "on";
  entry.focus = data.get("focus") === "on";
  if (data.has("duration")) entry.duration = Math.max(15, Number(data.get("duration")) || 30);
  setStatus(state, entry.id, String(data.get("status") ?? "todo"));

  const granularity = String(data.get("granularity") ?? "none");
  const date = String(data.get("date") ?? today) || today;
  let nextSchedule = null;
  if (granularity === "day") nextSchedule = { granularity, date };
  if (granularity === "time") nextSchedule = { granularity, date, start: String(data.get("time") ?? "09:00") || "09:00" };
  if (granularity === "week") {
    const start = weekStartFromValue(String(data.get("week") ?? isoWeekValue(today)));
    nextSchedule = { granularity, start, end: addDays(start, 6) };
  }
  if (granularity === "month") {
    const selectedMonth = String(data.get("month") ?? today.slice(0, 7));
    const monthStart = `${selectedMonth}-01`;
    const monthDate = new Date(`${monthStart}T12:00:00`);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 12, 0, 0);
    nextSchedule = { granularity, start: monthStart, end: localISO(monthEnd) };
  }
  if (JSON.stringify(entry.schedule) !== JSON.stringify(nextSchedule)) scheduleItem(state, entry.id, nextSchedule, "从编辑器调整排期");

  state.editingTaskId = null;
  toast("计划项已更新。 ");
  render();
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-goal-edit-form]");
  if (!form) return;
  event.preventDefault();
  const entry = findItem(state, form.dataset.id);
  if (!entry) return;

  const data = new FormData(form);
  const title = String(data.get("title") ?? "").trim();
  if (!title) {
    toast("标题不能为空。 ");
    form.elements.title.focus();
    return;
  }

  takeSnapshot("恢复计划修改");
  entry.title = title;
  entry.description = String(data.get("description") ?? "").trim();
  entry.role = String(data.get("role") ?? "") || null;
  setStatus(state, entry.id, String(data.get("status") ?? "todo"));
  state.editingGoalId = null;
  toast("计划内容已更新。 ");
  render();
});

$("#undo-button").addEventListener("click", () => {
  if (!state.undo) return;
  state.items = state.undo.items;
  toast(state.undo.message);
  state.undo = null;
  $("#undo-button").disabled = true;
  render();
});

$("#today-chip").addEventListener("click", () => { state.screen = "today"; render(); });
$("#today-chip").textContent = compactDateFormatter.format(new Date(`${today}T12:00:00`));

render();
