import { describe, it, expect, beforeEach } from 'vitest'
import { useTodos } from '../useTodos'

describe('useTodos', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
  })

  it('should add a todo', () => {
    const { todos, addTodo } = useTodos()
    expect(todos.value.length).toBe(0)
    addTodo('Test todo')
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('Test todo')
  })

  it('should toggle a todo', () => {
    const { todos, addTodo, toggleTodo } = useTodos()
    addTodo('Test todo')
    expect(todos.value[0].completed).toBe(false)
    toggleTodo(todos.value[0].id)
    expect(todos.value[0].completed).toBe(true)
  })

  it('should remove a todo', () => {
    const { todos, addTodo, removeTodo } = useTodos()
    addTodo('Test todo')
    expect(todos.value.length).toBe(1)
    removeTodo(todos.value[0].id)
    expect(todos.value.length).toBe(0)
  })

  it('should clear completed todos', () => {
    const { todos, addTodo, toggleTodo, clearActiveTodos } = useTodos()
    addTodo('Todo 1')
    addTodo('Todo 2')
    toggleTodo(todos.value[0].id)
    clearActiveTodos()
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('Todo 1')
  })

  it('should not add duplicate todos', () => {
    const { todos, addTodo } = useTodos()
    addTodo('Test todo')
    expect(todos.value.length).toBe(1)
    const result = addTodo('Test todo')
    expect(result).toBe(false)
    expect(todos.value.length).toBe(1)
  })

  it('should add multiple todos', () => {
    const { todos, addMultipleTodos } = useTodos()
    const newTodos = ['Todo 1', 'Todo 2', 'Todo 3']
    const duplicates = addMultipleTodos(newTodos)
    expect(todos.value.length).toBe(3)
    expect(duplicates.length).toBe(0)
  })

  it('should update todos order', () => {
    const { todos, addTodo, updateTodosOrder } = useTodos()
    addTodo('Todo 1')
    addTodo('Todo 2')
    addTodo('Todo 3')
    const newOrder = [2, 0, 1]
    updateTodosOrder(newOrder)

    // 检查新的顺序是否正确
    expect(todos.value[0].text).toBe('Todo 3')
    expect(todos.value[1].text).toBe('Todo 1')
    expect(todos.value[2].text).toBe('Todo 2')
  })
})
