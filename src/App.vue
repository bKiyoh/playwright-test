<script setup>
import { computed, ref, watch } from "vue";
import {
  getDueDateLabel,
  normalizeDueDate,
  sortTodosByDueDate,
} from "./todoLogic";

const STORAGE_KEY = "playwright-practice-todos";
const todoText = ref("");
const todoDueDate = ref("");
const todos = ref(loadTodos());
const currentFilter = ref("all");
const nextId = ref(getNextId(todos.value));
const editingTodoId = ref(null);
const editingTodoText = ref("");
const editingTodoDueDate = ref("");
const today = getTodayString();

const filters = [
  { label: "すべて", value: "all", testId: "filter-all-button" },
  { label: "未完了", value: "active", testId: "filter-active-button" },
  { label: "完了済み", value: "completed", testId: "filter-completed-button" },
];

const filteredTodos = computed(() => {
  const sortedTodos = sortTodosByDueDate(todos.value);

  if (currentFilter.value === "active") {
    return sortedTodos.filter((todo) => !todo.completed);
  }

  if (currentFilter.value === "completed") {
    return sortedTodos.filter((todo) => todo.completed);
  }

  return sortedTodos;
});

const todoCountText = computed(() => {
  const total = todos.value.length;
  const active = todos.value.filter((todo) => !todo.completed).length;
  const completed = total - active;

  return `合計 ${total} 件 / 未完了 ${active} 件 / 完了済み ${completed} 件`;
});

watch(
  todos,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true },
);

function loadTodos() {
  const savedTodos = localStorage.getItem(STORAGE_KEY);

  if (!savedTodos) {
    return [];
  }

  try {
    const parsedTodos = JSON.parse(savedTodos);
    if (!Array.isArray(parsedTodos)) {
      return [];
    }

    return parsedTodos.map((todo) => ({
      ...todo,
      dueDate: normalizeDueDate(todo.dueDate),
    }));
  } catch {
    return [];
  }
}

function getTodayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextId(todoItems) {
  if (todoItems.length === 0) {
    return 1;
  }

  return Math.max(...todoItems.map((todo) => todo.id)) + 1;
}

function addTodo() {
  const title = todoText.value.trim();

  if (!title) {
    return;
  }

  todos.value.push({
    id: nextId.value,
    title,
    completed: false,
    dueDate: normalizeDueDate(todoDueDate.value),
  });
  nextId.value += 1;
  todoText.value = "";
  todoDueDate.value = "";
}

function deleteTodo(id) {
  todos.value = todos.value.filter((todo) => todo.id !== id);

  if (editingTodoId.value === id) {
    cancelEditingTodo();
  }
}

function clearAllTodos() {
  todos.value = [];
  cancelEditingTodo();
}

function startEditingTodo(todo) {
  editingTodoId.value = todo.id;
  editingTodoText.value = todo.title;
  editingTodoDueDate.value = todo.dueDate || "";
}

function saveEditingTodo(todo) {
  const title = editingTodoText.value.trim();

  if (!title) {
    return;
  }

  todo.title = title;
  todo.dueDate = normalizeDueDate(editingTodoDueDate.value);
  cancelEditingTodo();
}

function cancelEditingTodo() {
  editingTodoId.value = null;
  editingTodoText.value = "";
  editingTodoDueDate.value = "";
}
</script>

<template>
  <v-app>
    <v-main class="app-main">
      <v-container class="todo-container" fluid>
        <v-card class="todo-card" elevation="8">
          <v-card-title class="todo-title">Todo App</v-card-title>

          <v-card-text>
            <form class="todo-form" @submit.prevent="addTodo">
              <v-text-field
                v-model="todoText"
                :input-props="{ 'data-testid': 'todo-input' }"
                label="Todo 名"
                placeholder="例: 買い物に行く"
                variant="outlined"
                density="comfortable"
                hide-details
                autofocus
              />
              <v-text-field
                v-model="todoDueDate"
                :input-props="{ 'data-testid': 'todo-due-date-input' }"
                type="date"
                label="期限日"
                variant="outlined"
                density="comfortable"
                hide-details
              />
              <v-btn
                data-testid="add-todo-button"
                color="primary"
                size="large"
                type="submit"
                :disabled="!todoText.trim()"
              >
                追加
              </v-btn>
            </form>

            <div class="todo-toolbar">
              <v-btn-toggle
                v-model="currentFilter"
                class="filter-toggle"
                color="primary"
                density="comfortable"
                mandatory
                divided
              >
                <v-btn
                  v-for="filter in filters"
                  :key="filter.value"
                  :data-testid="filter.testId"
                  :value="filter.value"
                >
                  {{ filter.label }}
                </v-btn>
              </v-btn-toggle>

              <v-btn
                v-if="todos.length > 0"
                data-testid="clear-all-button"
                color="error"
                variant="tonal"
                @click="clearAllTodos"
              >
                全削除
              </v-btn>
            </div>

            <p data-testid="todo-count" class="todo-count">
              {{ todoCountText }}
            </p>

            <v-list
              v-if="filteredTodos.length > 0"
              data-testid="todo-list"
              class="todo-list"
              lines="one"
            >
              <v-list-item
                v-for="todo in filteredTodos"
                :key="todo.id"
                data-testid="todo-item"
                class="todo-item"
                :class="{ 'todo-item--completed': todo.completed }"
              >
                <template #prepend>
                  <v-checkbox
                    v-model="todo.completed"
                    data-testid="todo-checkbox"
                    color="secondary"
                    density="compact"
                    hide-details
                  />
                </template>

                <v-list-item-title class="todo-item-title">
                  <form
                    v-if="editingTodoId === todo.id"
                    class="todo-edit-form"
                    @submit.prevent="saveEditingTodo(todo)"
                  >
                    <v-text-field
                      v-model="editingTodoText"
                      label="Todo 名"
                      variant="outlined"
                      density="compact"
                      hide-details
                      autofocus
                      @keyup.esc="cancelEditingTodo"
                    />
                    <v-text-field
                      v-model="editingTodoDueDate"
                      type="date"
                      label="期限日"
                      variant="outlined"
                      density="compact"
                      hide-details
                      @keyup.esc="cancelEditingTodo"
                    />
                  </form>
                  <div v-else class="todo-display">
                    <span>{{ todo.title }}</span>
                    <span
                      v-if="todo.dueDate"
                      data-testid="todo-due-date"
                      class="todo-due-date"
                    >
                      {{ getDueDateLabel(todo, today) }}
                    </span>
                  </div>
                </v-list-item-title>

                <template #append>
                  <v-btn
                    v-if="editingTodoId === todo.id"
                    icon="mdi-check"
                    color="primary"
                    variant="text"
                    :aria-label="`${todo.title} の編集を保存`"
                    :disabled="!editingTodoText.trim()"
                    @click="saveEditingTodo(todo)"
                  />
                  <v-btn
                    v-if="editingTodoId === todo.id"
                    icon="mdi-close"
                    color="default"
                    variant="text"
                    :aria-label="`${todo.title} の編集をキャンセル`"
                    @click="cancelEditingTodo"
                  />
                  <v-btn
                    v-else
                    icon="mdi-pencil-outline"
                    color="primary"
                    variant="text"
                    :aria-label="`${todo.title} を編集`"
                    @click="startEditingTodo(todo)"
                  />
                  <v-btn
                    data-testid="delete-todo-button"
                    icon="mdi-delete-outline"
                    color="error"
                    variant="text"
                    :aria-label="`${todo.title} を削除`"
                    @click="deleteTodo(todo.id)"
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-alert
              v-else
              data-testid="empty-message"
              class="empty-message"
              type="info"
              variant="tonal"
            >
              Todo がありません
            </v-alert>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
