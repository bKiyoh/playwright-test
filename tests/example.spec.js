// @ts-check
import { test, expect } from "@playwright/test";

const STORAGE_KEY = "playwright-practice-todos";

function todoInput(page) {
  return page.locator('input[type="text"]').first();
}

function editTodoInput(page) {
  return page.locator(".todo-edit-form").locator('input[type="text"]');
}

async function addTodo(page, title) {
  await todoInput(page).fill(title);
  await page.getByTestId("add-todo-button").click();
}

test("初期表示では空のTodo一覧と件数が表示される", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Todo App")).toBeVisible();
  await expect(todoInput(page)).toBeVisible();
  await expect(page.getByTestId("add-todo-button")).toBeDisabled();
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 0 件 / 未完了 0 件 / 完了済み 0 件",
  );
  await expect(page.getByTestId("empty-message")).toContainText(
    "Todo がありません",
  );
  await expect(page.getByTestId("clear-all-button")).toBeHidden();
});

test("Todoを追加すると一覧と件数が更新される", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "買い物に行く");

  await expect(page.getByTestId("todo-item")).toHaveCount(1);
  await expect(page.getByTestId("todo-item")).toContainText("買い物に行く");
  await expect(todoInput(page)).toHaveValue("");
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 1 件 / 未完了 1 件 / 完了済み 0 件",
  );
  await expect(page.getByTestId("clear-all-button")).toBeVisible();
});

test("空白のみのTodoは追加できない", async ({ page }) => {
  await page.goto("/");

  await todoInput(page).fill("   ");

  await expect(page.getByTestId("add-todo-button")).toBeDisabled();
  await todoInput(page).press("Enter");
  await expect(page.getByTestId("todo-item")).toHaveCount(0);
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 0 件 / 未完了 0 件 / 完了済み 0 件",
  );
});

test("Todoの完了状態を切り替えられる", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "テストを書く");
  await page.getByTestId("todo-checkbox").click();

  await expect(page.getByTestId("todo-item")).toHaveClass(
    /todo-item--completed/,
  );
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 1 件 / 未完了 0 件 / 完了済み 1 件",
  );
});

test("未完了と完了済みでTodoを絞り込める", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "未完了のTodo");
  await addTodo(page, "完了済みのTodo");
  await page
    .getByTestId("todo-item")
    .filter({ hasText: "完了済みのTodo" })
    .getByTestId("todo-checkbox")
    .click();

  await page.getByTestId("filter-active-button").click();
  await expect(page.getByTestId("todo-item")).toHaveCount(1);
  await expect(page.getByTestId("todo-item")).toContainText("未完了のTodo");
  await expect(page.getByText("完了済みのTodo")).toBeHidden();

  await page.getByTestId("filter-completed-button").click();
  await expect(page.getByTestId("todo-item")).toHaveCount(1);
  await expect(page.getByTestId("todo-item")).toContainText("完了済みのTodo");
  await expect(page.getByText("未完了のTodo")).toBeHidden();

  await page.getByTestId("filter-all-button").click();
  await expect(page.getByTestId("todo-item")).toHaveCount(2);
});

test("個別削除と全削除ができる", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "残すTodo");
  await addTodo(page, "消すTodo");

  await page.getByRole("button", { name: "消すTodo を削除" }).click();

  await expect(page.getByTestId("todo-item")).toHaveCount(1);
  await expect(page.getByTestId("todo-item")).toContainText("残すTodo");
  await expect(page.getByText("消すTodo")).toBeHidden();
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 1 件 / 未完了 1 件 / 完了済み 0 件",
  );

  await page.getByTestId("clear-all-button").click();

  await expect(page.getByTestId("todo-item")).toHaveCount(0);
  await expect(page.getByTestId("empty-message")).toContainText(
    "Todo がありません",
  );
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 0 件 / 未完了 0 件 / 完了済み 0 件",
  );
});

test("Todoの編集を開始できる", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "編集するTodo");
  await page.getByRole("button", { name: "編集するTodo を編集" }).click();

  await expect(page.locator(".todo-edit-form")).toBeVisible();
  await expect(editTodoInput(page)).toHaveValue("編集するTodo");
  await expect(
    page.getByRole("button", { name: "編集するTodo の編集を保存" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "編集するTodo の編集をキャンセル" }),
  ).toBeVisible();
});

test("Todoのタイトルを保存ボタンで編集できる", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "編集前のTodo");
  await page.getByRole("button", { name: "編集前のTodo を編集" }).click();
  await editTodoInput(page).fill("編集後のTodo");
  await page.getByRole("button", { name: "編集前のTodo の編集を保存" }).click();

  await expect(page.getByTestId("todo-item")).toContainText("編集後のTodo");
  await expect(page.getByText("編集前のTodo")).toBeHidden();
  await expect(page.locator(".todo-edit-form")).toBeHidden();
});

test("TodoのタイトルをEnterで編集保存できる", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "Enter保存前のTodo");
  await page.getByRole("button", { name: "Enter保存前のTodo を編集" }).click();
  await editTodoInput(page).fill("Enter保存後のTodo");
  await editTodoInput(page).press("Enter");

  await expect(page.getByTestId("todo-item")).toContainText(
    "Enter保存後のTodo",
  );
  await expect(page.getByText("Enter保存前のTodo")).toBeHidden();
  await expect(page.locator(".todo-edit-form")).toBeHidden();
});

test("Todoの編集をキャンセルボタンで取り消せる", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "元のTodo");
  await page.getByRole("button", { name: "元のTodo を編集" }).click();
  await editTodoInput(page).fill("保存しないTodo");
  await page.getByRole("button", { name: "元のTodo の編集をキャンセル" }).click();

  await expect(page.getByTestId("todo-item")).toContainText("元のTodo");
  await expect(page.getByText("保存しないTodo")).toBeHidden();
  await expect(page.locator(".todo-edit-form")).toBeHidden();
});

test("Todoの編集をEscで取り消せる", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "Esc前のTodo");
  await page.getByRole("button", { name: "Esc前のTodo を編集" }).click();
  await editTodoInput(page).fill("Escで保存しないTodo");
  await editTodoInput(page).press("Escape");

  await expect(page.getByTestId("todo-item")).toContainText("Esc前のTodo");
  await expect(page.getByText("Escで保存しないTodo")).toBeHidden();
  await expect(page.locator(".todo-edit-form")).toBeHidden();
});

test("空白のみのタイトルではTodoを編集保存できない", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "空白にしないTodo");
  await page.getByRole("button", { name: "空白にしないTodo を編集" }).click();
  await editTodoInput(page).fill("   ");

  await expect(
    page.getByRole("button", { name: "空白にしないTodo の編集を保存" }),
  ).toBeDisabled();
  await editTodoInput(page).press("Enter");
  await expect(page.locator(".todo-edit-form")).toBeVisible();
  await page
    .getByRole("button", { name: "空白にしないTodo の編集をキャンセル" })
    .click();
  await expect(page.getByTestId("todo-item")).toContainText("空白にしないTodo");
});

test("編集中のTodoを削除すると編集状態も解除される", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "削除する編集中Todo");
  await page.getByRole("button", { name: "削除する編集中Todo を編集" }).click();
  await page.getByRole("button", { name: "削除する編集中Todo を削除" }).click();

  await expect(page.getByTestId("todo-item")).toHaveCount(0);
  await expect(page.locator(".todo-edit-form")).toBeHidden();
});

test("編集中に全削除すると編集状態も解除される", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "編集中に全削除するTodo");
  await page
    .getByRole("button", { name: "編集中に全削除するTodo を編集" })
    .click();
  await page.getByTestId("clear-all-button").click();

  await expect(page.getByTestId("todo-item")).toHaveCount(0);
  await expect(page.locator(".todo-edit-form")).toBeHidden();
});

test("完了済みTodoの編集中フォームには取り消し線が付かない", async ({
  page,
}) => {
  await page.goto("/");

  await addTodo(page, "完了済みを編集するTodo");
  await page.getByTestId("todo-checkbox").click();
  await page
    .getByRole("button", { name: "完了済みを編集するTodo を編集" })
    .click();

  await expect(page.locator(".todo-edit-form")).toHaveCSS(
    "text-decoration-line",
    "none",
  );
});

test("Todoはリロード後もlocalStorageから復元される", async ({ page }) => {
  await page.goto("/");

  await addTodo(page, "保存されるTodo");
  await page.getByTestId("todo-checkbox").click();
  await page.reload();

  await expect(page.getByTestId("todo-item")).toHaveCount(1);
  await expect(page.getByTestId("todo-item")).toContainText("保存されるTodo");
  await expect(page.getByTestId("todo-item")).toHaveClass(
    /todo-item--completed/,
  );
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 1 件 / 未完了 0 件 / 完了済み 1 件",
  );
});

test("localStorageに不正な値が入っていても空の一覧で表示される", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    localStorage.setItem(storageKey, "{invalid json");
  }, STORAGE_KEY);

  await page.goto("/");

  await expect(page.getByTestId("todo-item")).toHaveCount(0);
  await expect(page.getByTestId("empty-message")).toContainText(
    "Todo がありません",
  );
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 0 件 / 未完了 0 件 / 完了済み 0 件",
  );
});

test("localStorageに配列以外の値が入っていても空の一覧で表示される", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    localStorage.setItem(storageKey, JSON.stringify({ title: "not array" }));
  }, STORAGE_KEY);

  await page.goto("/");

  await expect(page.getByTestId("todo-item")).toHaveCount(0);
  await expect(page.getByTestId("empty-message")).toContainText(
    "Todo がありません",
  );
  await expect(page.getByTestId("todo-count")).toHaveText(
    "合計 0 件 / 未完了 0 件 / 完了済み 0 件",
  );
});
