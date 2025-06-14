import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChartsDialog from '../ChartsDialog.vue'
import { createI18n } from 'vue-i18n'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

vi.mock('../../../composables/useTodos', () => ({
  useTodos: () => ({
    todos: { value: [] },
    getCompletedTodosByDate: () => ({})
  })
}))

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  messages: {
    zh: {
      close: '关闭',
      productivityInsights: '生产力洞察',
      completionTrend: '完成趋势（过去7天）',
      completedTodos: '已完成任务',
      totalTasks: '总任务',
      completed: '已完成',
      pending: '待完成',
      completionRate: '完成率',
      task: '个任务',
      tasks: '个任务',
      locale: 'zh-CN'
    }
  }
})

describe('ChartsDialog', () => {
  const defaultProps = {
    show: true
  }

  it('应该在 show 为 true 时渲染对话框', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('.charts-dialog').exists()).toBe(true)
    expect(wrapper.find('.charts-content').exists()).toBe(true)
  })

  it('应该在 show 为 false 时不渲染对话框', () => {
    const wrapper = mount(ChartsDialog, {
      props: { show: false },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('.charts-dialog').exists()).toBe(false)
  })

  it('应该显示正确的标题', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('h2').text()).toBe('生产力洞察')
  })

  it('应该包含关闭按钮', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    const closeBtn = wrapper.find('.close-btn')
    expect(closeBtn.exists()).toBe(true)
    expect(closeBtn.find('svg').exists()).toBe(true)
  })

  it('应该包含 TodoCompletionChart 组件', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.findComponent({ name: 'TodoCompletionChart' }).exists()).toBe(true)
  })

  it('点击关闭按钮应该触发 close 事件', async () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('点击对话框背景应该触发 close 事件', async () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.find('.charts-dialog').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('点击对话框内容区域不应该触发 close 事件', async () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.find('.charts-content').trigger('click')
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('应该具有正确的 aria-label 属性', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    const closeBtn = wrapper.find('.close-btn')
    expect(closeBtn.attributes('aria-label')).toBe('关闭')
  })

  it('应该具有正确的CSS类和样式', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('.charts-dialog').exists()).toBe(true)
    expect(wrapper.find('.charts-content').exists()).toBe(true)
    expect(wrapper.find('.close-btn').exists()).toBe(true)
  })
})
