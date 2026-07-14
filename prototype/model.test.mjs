import test from "node:test";
import assert from "node:assert/strict";
import {
  createItem,
  findItem,
  getGoalPath,
  getProgress,
  isOverdue,
  scheduleItem,
  setStatus,
} from "./model.mjs";

function stateWithItems(items = []) {
  return { items: structuredClone(items) };
}

test("quick capture trims a title and creates an inbox item", () => {
  const state = stateWithItems();
  const item = createItem(state, "  写下产品想法  ", { id: "new" });
  assert.equal(item.title, "写下产品想法");
  assert.equal(item.parentId, null);
  assert.equal(item.schedule, null);
  assert.equal(item.status, "todo");
});

test("quick capture rejects an empty title", () => {
  assert.throws(() => createItem(stateWithItems(), "   "), /标题不能为空/);
});

test("status transition records completion and can reopen", () => {
  const state = stateWithItems([{ id: "a", title: "A", status: "todo" }]);
  setStatus(state, "a", "done");
  assert.equal(findItem(state, "a").status, "done");
  assert.ok(findItem(state, "a").completedAt);
  setStatus(state, "a", "todo");
  assert.equal(findItem(state, "a").completedAt, null);
});

test("rescheduling preserves goal parent and records history", () => {
  const state = stateWithItems([{
    id: "a",
    title: "A",
    parentId: "goal",
    status: "todo",
    schedule: { granularity: "day", date: "2026-07-13" },
    history: [],
  }]);
  scheduleItem(state, "a", { granularity: "day", date: "2026-07-14" }, "时间不足");
  const item = findItem(state, "a");
  assert.equal(item.parentId, "goal");
  assert.equal(item.schedule.date, "2026-07-14");
  assert.equal(item.history.length, 1);
  assert.equal(item.history[0].from.date, "2026-07-13");
});

test("automatic progress counts completed direct children and excludes abandoned", () => {
  const state = stateWithItems([
    { id: "goal", parentId: null, status: "doing" },
    { id: "a", parentId: "goal", status: "done" },
    { id: "b", parentId: "goal", status: "todo" },
    { id: "c", parentId: "goal", status: "abandoned" },
  ]);
  assert.equal(getProgress(state, "goal"), 50);
});

test("overdue ignores completed items", () => {
  const due = { status: "todo", schedule: { date: "2026-07-13" } };
  const done = { status: "done", schedule: { date: "2026-07-13" } };
  assert.equal(isOverdue(due, "2026-07-14"), true);
  assert.equal(isOverdue(done, "2026-07-14"), false);
});

test("goal path follows parent links", () => {
  const state = stateWithItems([
    { id: "root", title: "人生方向", parentId: null },
    { id: "project", title: "项目", parentId: "root" },
    { id: "task", title: "任务", parentId: "project" },
  ]);
  assert.deepEqual(getGoalPath(state, "task").map((item) => item.id), ["root", "project", "task"]);
});

