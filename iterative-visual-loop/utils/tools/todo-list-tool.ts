import { readFile, writeFile } from 'fs/promises';

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    timestamp: number;
}

export const loadTodoList = async (filePath: string = './todo-list.json'): Promise<TodoItem[]> => {
    try {
        const data = await readFile(filePath, 'utf-8');
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
};

export const saveTodoList = async (todos: TodoItem[], filePath?: string) => {
    const file = filePath || './todo-list.json';
    await writeFile(file, JSON.stringify(todos, null, 2));
};

export interface AddTodoResult {
    success: boolean;
    item?: TodoItem;
    error?: string;
}

export const addTodo = async (
    text: string,
    filePath?: string
): Promise<AddTodoResult> => {
    const todos = await loadTodoList(filePath);
    const id = Date.now().toString();
    const newItem: TodoItem = {
        id,
        text,
        completed: false,
        timestamp: Date.now()
    };
    
    todos.push(newItem);
    await saveTodoList(todos, filePath);
    
    return { success: true, item: newItem };
};

export interface MarkCompleteResult {
    success: boolean;
    completedCount: number;
    error?: string;
}

export const completeTodo = async (
    itemId: string,
    filePath?: string
): Promise<MarkCompleteResult> => {
    const todos = await loadTodoList(filePath);
    const index = todos.findIndex((t) => t.id === itemId);
    
    if (index === -1) {
        return { success: false, completedCount: 0, error: 'Todo not found' };
    }
    
    todos[index].completed = true;
    await saveTodoList(todos, filePath);
    
    const completed = todos.filter((t) => t.completed).length;
    return { success: true, completedCount: completed };
};

export interface GetTodosResult {
    success: boolean;
    todos: TodoItem[];
    pending: number;
    completed: number;
    error?: string;
}

export const getTodos = async (filePath?: string): Promise<GetTodosResult> => {
    const todos = await loadTodoList(filePath);
    const pending = todos.filter((t) => !t.completed).length;
    const completed = todos.filter((t) => t.completed).length;
    
    return { success: true, todos, pending, completed };
};

export const clearCompleted = async (filePath?: string) => {
    const todos = await loadTodoList(filePath);
    const remaining = todos.filter((t) => !t.completed);
    await saveTodoList(remaining, filePath);
    return remaining.length;
};

export const todo_list = (filePath?: string) => ({
    add: async (text: string) => await addTodo(text, filePath),
    complete: async (id: string) => await completeTodo(id, filePath),
    load: async () => await getTodos(filePath),
    clearCompleted: async () => await clearCompleted(filePath)
});

export default {
    add: addTodo,
    complete: completeTodo,
    load: getTodos,
    clearCompleted: clearCompleted
};
