<script setup>
import { computed, ref, watch } from "vue";

const STORAGE_KEY = "playwright-practice-todos";
const todoText = ref("");
const todos = ref(loadTodos());
const currentFilter = ref("all");
const nextId = ref(getNextId(todos.value));

const filters = [
  { label: "すべて", value: "all", testId: "filter-all-button" },
  { label: "未完了", value: "active", testId: "filter-active-button" },
  { label: "完了済み", value: "completed", testId: "filter-completed-button" },
];

const filteredTodos = computed(() => {
  if (currentFilter.value === "active") {
    return todos.value.filter((todo) => !todo.completed);
  }

  if (currentFilter.value === "completed") {
    return todos.value.filter((todo) => todo.completed);
  }

  return todos.value;
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
    return Array.isArray(parsedTodos) ? parsedTodos : [];
  } catch {
    return [];
  }
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
  });
  nextId.value += 1;
  todoText.value = "";
}

function deleteTodo(id) {
  todos.value = todos.value.filter((todo) => todo.id !== id);
}

function clearAllTodos() {
  todos.value = [];
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
                  {{ todo.title }}
                </v-list-item-title>

                <template #append>
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
