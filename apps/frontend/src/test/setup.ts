/**
 * 测试环境全局设置
 * 用于配置测试环境中的全局 mock 和设置
 */

import { vi } from 'vitest'
import * as Vue from 'vue'
import { createI18n } from 'vue-i18n'

// 全局注册 Vue API
Object.assign(global, Vue)

// Mock Worker for tests
global.Worker = class Worker {
  constructor(url: string | URL) {
    this.url = url
  }

  url: string | URL
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null
  onerror: ((this: Worker, ev: ErrorEvent) => any) | null = null
  onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null = null

  postMessage(_message: any): void {
    // Mock implementation - do nothing
  }

  terminate(): void {
    // Mock implementation - do nothing
  }

  addEventListener(_type: string, _listener: EventListener): void {
    // Mock implementation - do nothing
  }

  removeEventListener(_type: string, _listener: EventListener): void {
    // Mock implementation - do nothing
  }

  dispatchEvent(_event: Event): boolean {
    return true
  }
}

// 创建测试用的 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh: {
      configureApiKey: '请先配置 API Key',
      networkConnectionError: '网络连接错误',
      todoList: '待办事项',
      addTodo: '添加待办事项',
      completed: '已完成',
      active: '进行中',
      all: '全部',
      clear: '清除',
      search: '搜索',
      statistics: '统计',
      close: '关闭',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      save: '保存',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
    },
    en: {
      configureApiKey: 'Please configure API Key first',
      networkConnectionError: 'Network connection error',
      todoList: 'Todo List',
      addTodo: 'Add Todo',
      completed: 'Completed',
      active: 'Active',
      all: 'All',
      clear: 'Clear',
      search: 'Search',
      statistics: 'Statistics',
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
    },
  },
})

// 全局注册 useI18n
global.useI18n = () => ({
  t: (key: string) => i18n.global.t(key),
  locale: i18n.global.locale,
})

// Mock vue-i18n 模块
const messages: Record<string, string> = {
  configureApiKey: '请先配置 API Key',
  networkConnectionError: '网络连接错误',
  todoList: '待办事项',
  addTodo: '添加待办事项',
  completed: '已完成',
  active: '进行中',
  all: '全部',
  clear: '清除',
  search: '搜索',
  statistics: '统计',
  close: '关闭',
  cancel: '取消',
  confirm: '确认',
  delete: '删除',
  edit: '编辑',
  save: '保存',
  loading: '加载中...',
  error: '错误',
  success: '成功',
  warning: '警告',
  info: '信息',
  newConversation: '新对话',
  productivityInsights: '生产力洞察',
  totalTasks: '总任务',
  completedTasks: '已完成',
  pendingTasks: '待完成',
  openCharts: '打开统计图表',
  toggleTheme: '切换主题',
  searchTodos: '搜索待办事项',
  pending: '待完成',
  completionRate: '完成率',
  completedTodos: '已完成任务',
  completionTrend: '完成趋势',
  task: '任务',
  tasks: '任务',
  locale: 'zh-CN',
  closeSearch: '关闭搜索',
  openSearch: '打开搜索',
  closeCharts: '关闭图表',
  aiAssistant: 'AI 助手',
  appTitle: '待办事项',
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => messages[key] || key,
    locale: { value: 'zh' },
  }),
  createI18n: vi.fn(() => ({
    global: {
      t: (key: string) => messages[key] || key,
      locale: { value: 'zh' },
    },
    install: vi.fn(),
  })),
}))

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),

    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    getLineDash: vi.fn(() => []),
    setLineDash: vi.fn(),
    lineDashOffset: 0,
  })),
})

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  value: 800,
  writable: true,
})

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  value: 600,
  writable: true,
})

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
})

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
})

// Mock Sortable.js
vi.mock('sortablejs', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    option: vi.fn(),
    toArray: vi.fn(() => []),
  })),
}))

// Mock DOM methods for testing
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  value: vi.fn(() => ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
  })),
  writable: true,
})
