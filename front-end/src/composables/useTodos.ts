import { ref, computed, watch } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
}

interface HistoryItem {
  date: string
  todos: Todo[]
}

export function useTodos() {
  const todos = ref<Todo[]>([])
  const history = ref<HistoryItem[]>([])

  const loadTodos = () => {
    const storedTodos = localStorage.getItem('todos')
    if (storedTodos) {
      todos.value = JSON.parse(storedTodos)
    }
    const storedHistory = localStorage.getItem('todoHistory')
    if (storedHistory) {
      history.value = JSON.parse(storedHistory)
    }
  }

  const saveTodos = () => {
    localStorage.setItem('todos', JSON.stringify(todos.value))
    saveToHistory()
  }

  const saveHistory = () => {
    localStorage.setItem('todoHistory', JSON.stringify(history.value))
  }

  const saveToHistory = () => {
    const today = new Date().toISOString().split('T')[0]
    const todosClone = JSON.parse(JSON.stringify(todos.value))
    const existingIndex = history.value.findIndex(item => item.date === today)

    if (existingIndex !== -1) {
      history.value[existingIndex].todos = todosClone
    } else {
      history.value.push({
        date: today,
        todos: todosClone
      })
    }
  }

  const addTodo = (text: string) => {
    const newId = Math.max(0, ...todos.value.map(todo => todo.id)) + 1
    todos.value.push({
      id: newId,
      text,
      completed: false
    })
  }

  // 新增：批量添加待办事项的函数
  const addMultipleTodos = (texts: string[]): string[] => {
    let maxId = Math.max(0, ...todos.value.map(todo => todo.id))
    const duplicates: string[] = []
    const newTodos = texts
      .filter(text => {
        if (todos.value.some(todo => todo.text === text)) {
          duplicates.push(text)
          return false
        }
        return true
      })
      .map(text => ({
        id: ++maxId,
        text,
        completed: false
      }))
    todos.value.push(...newTodos)
    return duplicates
  }

  const toggleTodo = (id: number) => {
    const todo = todos.value.find(todo => todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter(todo => todo.id !== id)
  }

  const clearActiveTodos = () => {
    todos.value = todos.value.filter(todo => todo.completed)
  }

  const restoreHistory = (date: string) => {
    const historyItem = history.value.find(item => item.date === date)
    if (historyItem) {
      todos.value = JSON.parse(JSON.stringify(historyItem.todos))
    }
  }

  const deleteHistoryItem = (date: string) => {
    history.value = history.value.filter(item => item.date !== date)
  }

  const deleteAllHistory = () => {
    history.value = []
  }

  watch(todos, saveTodos, { deep: true })
  watch(history, saveHistory, { deep: true })

  loadTodos() // 在初始化时加载数据

  return {
    todos,
    history,
    addTodo,
    addMultipleTodos, // 记得在返回对象中添加这个新函数
    toggleTodo,
    removeTodo,
    clearActiveTodos,
    restoreHistory,
    deleteHistoryItem,
    deleteAllHistory
  }
}
