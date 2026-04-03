// this is an autocomplete code snippet for a simple todo app in JavaScript
// todo app with add, remove, and list functionality
const todoList = [];

function addTodo(item) {
  todoList.push(item);
  console.log(`Added: "${item}"`);
}

function removeTodo(index) {
  if (index >= 0 && index < todoList.length) {
    const removedItem = todoList.splice(index, 1);
    console.log(`Removed: "${removedItem}"`);
  } else {
    console.log("Invalid index. No item removed.");
  }
}

function listTodos() {
  if (todoList.length === 0) {
    console.log("No todos found.");
  } else {
    console.log("Todo List:");
    todoList.forEach((item, index) => {
      console.log(`${index}: ${item}`);
    });
  }
}