import { describe, expect, test } from "vitest";
import {
  getDueDateLabel,
  isDueToday,
  isOverdue,
  normalizeDueDate,
  sortTodosByDueDate,
} from "./todoLogic";

const TODAY = "2026-07-01";

describe("normalizeDueDate", () => {
  test("空文字を期限なしとしてnullに変換する", () => {
    expect(normalizeDueDate("")).toBeNull();
  });

  test("日付文字列はそのまま返す", () => {
    expect(normalizeDueDate("2026-07-10")).toBe("2026-07-10");
  });
});

describe("isOverdue", () => {
  test("未完了で期限日が今日より前なら期限切れになる", () => {
    expect(
      isOverdue({ dueDate: "2026-06-30", completed: false }, TODAY),
    ).toBe(true);
  });

  test("今日が期限なら期限切れではない", () => {
    expect(
      isOverdue({ dueDate: "2026-07-01", completed: false }, TODAY),
    ).toBe(false);
  });

  test("期限なしなら期限切れではない", () => {
    expect(isOverdue({ dueDate: null, completed: false }, TODAY)).toBe(false);
  });

  test("完了済みなら期限日が過ぎていても期限切れではない", () => {
    expect(
      isOverdue({ dueDate: "2026-06-30", completed: true }, TODAY),
    ).toBe(false);
  });
});

describe("isDueToday", () => {
  test("未完了で期限日が今日ならtrueになる", () => {
    expect(
      isDueToday({ dueDate: "2026-07-01", completed: false }, TODAY),
    ).toBe(true);
  });

  test("完了済みなら今日が期限でもfalseになる", () => {
    expect(
      isDueToday({ dueDate: "2026-07-01", completed: true }, TODAY),
    ).toBe(false);
  });
});

describe("getDueDateLabel", () => {
  test("期限切れの表示ラベルを返す", () => {
    expect(
      getDueDateLabel({ dueDate: "2026-06-30", completed: false }, TODAY),
    ).toBe("期限切れ: 2026-06-30");
  });

  test("今日が期限の表示ラベルを返す", () => {
    expect(
      getDueDateLabel({ dueDate: "2026-07-01", completed: false }, TODAY),
    ).toBe("今日まで");
  });

  test("未来の期限日の表示ラベルを返す", () => {
    expect(
      getDueDateLabel({ dueDate: "2026-07-10", completed: false }, TODAY),
    ).toBe("2026-07-10 まで");
  });

  test("期限なしなら空文字を返す", () => {
    expect(getDueDateLabel({ dueDate: null, completed: false }, TODAY)).toBe(
      "",
    );
  });
});

describe("sortTodosByDueDate", () => {
  test("未完了を期限が近い順、期限なし、完了済みの順に並べる", () => {
    const todos = [
      { id: 1, title: "期限なし", dueDate: null, completed: false },
      { id: 2, title: "完了済み", dueDate: "2026-06-29", completed: true },
      { id: 3, title: "来週", dueDate: "2026-07-08", completed: false },
      { id: 4, title: "明日", dueDate: "2026-07-02", completed: false },
    ];

    expect(sortTodosByDueDate(todos).map((todo) => todo.id)).toEqual([
      4, 3, 1, 2,
    ]);
  });

  test("同じ期限日や期限なしのTodoは元の順序を維持する", () => {
    const todos = [
      { id: 1, title: "A", dueDate: "2026-07-02", completed: false },
      { id: 2, title: "B", dueDate: "2026-07-02", completed: false },
      { id: 3, title: "C", dueDate: null, completed: false },
      { id: 4, title: "D", dueDate: null, completed: false },
    ];

    expect(sortTodosByDueDate(todos).map((todo) => todo.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  test("元の配列を破壊しない", () => {
    const todos = [
      { id: 1, title: "後", dueDate: "2026-07-10", completed: false },
      { id: 2, title: "先", dueDate: "2026-07-02", completed: false },
    ];

    sortTodosByDueDate(todos);

    expect(todos.map((todo) => todo.id)).toEqual([1, 2]);
  });
});
