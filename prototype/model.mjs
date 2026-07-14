export const VALID_STATUSES = new Set(["todo", "doing", "done", "abandoned"]);

export function findItem(state, id) {
  return state.items.find((item) => item.id === id) ?? null;
}

export function createItem(state, title, overrides = {}) {
  const cleanTitle = String(title ?? "").trim();
  if (!cleanTitle) throw new Error("标题不能为空");

  const item = {
    id: overrides.id ?? `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: cleanTitle,
    description: "",
    parentId: null,
    role: null,
    status: "todo",
    important: false,
    focus: false,
    schedule: null,
    duration: null,
    history: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
    title: cleanTitle,
  };

  state.items.push(item);
  return item;
}

export function setStatus(state, id, status) {
  if (!VALID_STATUSES.has(status)) throw new Error("无效状态");
  const item = findItem(state, id);
  if (!item) throw new Error("计划项不存在");

  item.status = status;
  item.completedAt = status === "done" ? new Date().toISOString() : null;
  return item;
}

export function scheduleItem(state, id, schedule, reason = "") {
  const item = findItem(state, id);
  if (!item) throw new Error("计划项不存在");

  const previous = item.schedule ? structuredClone(item.schedule) : null;
  item.schedule = schedule ? structuredClone(schedule) : null;
  item.history.push({
    from: previous,
    to: item.schedule ? structuredClone(item.schedule) : null,
    reason,
    changedAt: new Date().toISOString(),
  });
  return item;
}

export function getDirectChildren(state, parentId) {
  return state.items.filter((item) => item.parentId === parentId);
}

export function getProgress(state, parentId) {
  const children = getDirectChildren(state, parentId).filter((item) => item.status !== "abandoned");
  if (!children.length) return null;
  const completed = children.filter((item) => item.status === "done").length;
  return Math.round((completed / children.length) * 100);
}

export function isOverdue(item, today) {
  if (!["todo", "doing"].includes(item.status) || !item.schedule) return false;
  const endDate = item.schedule.date ?? item.schedule.end ?? item.schedule.start;
  return Boolean(endDate && endDate < today);
}

export function getGoalPath(state, id) {
  const path = [];
  const visited = new Set();
  let current = findItem(state, id);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = current.parentId ? findItem(state, current.parentId) : null;
  }
  return path;
}

