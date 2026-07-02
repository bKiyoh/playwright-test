export function normalizeDueDate(dueDate) {
  return dueDate || null;
}

export function isOverdue(todo, today) {
  return Boolean(
    !todo.completed && todo.dueDate && todo.dueDate < today,
  );
}

export function isDueToday(todo, today) {
  return Boolean(
    !todo.completed && todo.dueDate && todo.dueDate === today,
  );
}

export function getDueDateLabel(todo, today) {
  if (!todo.dueDate) {
    return "";
  }

  if (isOverdue(todo, today)) {
    return `期限切れ: ${todo.dueDate}`;
  }

  if (isDueToday(todo, today)) {
    return "今日まで";
  }

  return `${todo.dueDate} まで`;
}

export function sortTodosByDueDate(todos) {
  return todos
    .map((todo, index) => ({ todo, index }))
    .sort((left, right) => {
      const leftCompleted = left.todo.completed ? 1 : 0;
      const rightCompleted = right.todo.completed ? 1 : 0;

      if (leftCompleted !== rightCompleted) {
        return leftCompleted - rightCompleted;
      }

      const leftDueDate = left.todo.dueDate;
      const rightDueDate = right.todo.dueDate;

      if (leftDueDate && rightDueDate && leftDueDate !== rightDueDate) {
        return leftDueDate.localeCompare(rightDueDate);
      }

      if (leftDueDate && !rightDueDate) {
        return -1;
      }

      if (!leftDueDate && rightDueDate) {
        return 1;
      }

      return left.index - right.index;
    })
    .map(({ todo }) => todo);
}
