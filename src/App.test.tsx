import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const progressKey = 'tonight-not-delivered-progress'
const waitingOrderKey = 'tonight-not-delivered-waiting-order'
const introKey = 'tonight-not-delivered-has-seen-intro'
const savedAddressKey = 'tonight-not-delivered-saved-address'
const orderHistoryKey = 'tonight-not-delivered-order-history'

describe('App entry and browsing flow', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the welcome screen on first launch', () => {
    render(<App />)

    expect(screen.getByText('今晚不送达')).toBeInTheDocument()
    expect(screen.getByText('先把这份想点夜宵的冲动，安全地走完一遍。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始点外卖' })).toBeInTheDocument()
  })

  it('enters the app shell from the welcome screen', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: '开始点外卖' }))

    expect(screen.getByText('今晚吃点什么？')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '首页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '分类' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '我的' })).toBeInTheDocument()
  })

  it('skips the welcome screen after it has already been seen', () => {
    window.localStorage.setItem(introKey, 'true')

    render(<App />)

    expect(screen.getByText('今晚吃点什么？')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '开始点外卖' })).not.toBeInTheDocument()
  })

  it('restores the waiting screen before the welcome screen when an order is in progress', () => {
    window.localStorage.setItem(waitingOrderKey, JSON.stringify({
      startedAt: new Date('2026-08-08T19:59:52Z').getTime(),
      totalSeconds: 7,
      displayMinutes: 24,
      totalDistanceKm: 3.6,
      merchantName: '深夜脆脆炸鸡屋',
      addressLabel: '家',
      addressLine: '福田区深南大道 1008 号 9 楼',
      remark: '别按门铃',
      riderName: '阿宇',
      riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      riderRating: 4.9,
      routeStops: [
        { id: 'merchant', label: '商家出餐', status: 'done' },
        { id: 'pickup', label: '骑手取餐', status: 'current' },
        { id: 'delivery', label: '正在送达', status: 'upcoming' },
        { id: 'arrive', label: '即将到达', status: 'upcoming' },
      ],
    }))

    render(<App />)

    expect(screen.getByText('等待配送中')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '开始点外卖' })).not.toBeInTheDocument()
  })

  it('switches between home, categories, and profile tabs', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')

    render(<App />)

    expect(screen.getByText('今晚吃点什么？')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '分类' }))
    expect(screen.getByText('夜宵分类')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '我的' }))
    expect(screen.getByText('我的战绩')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '首页' }))
    expect(screen.getByText('今晚吃点什么？')).toBeInTheDocument()
  })

  it('shows recommended merchants and richer home modules on the home screen', () => {
    window.localStorage.setItem(introKey, 'true')

    render(<App />)

    expect(screen.getByText('今晚不送达')).toBeInTheDocument()
    expect(screen.getByText('今晚吃点什么？')).toBeInTheDocument()
    expect(screen.getByText('深夜脆脆炸鸡屋')).toBeInTheDocument()
    expect(screen.getByText('失眠奶茶研究所')).toBeInTheDocument()
    expect(screen.getByText('今晚推荐')).toBeInTheDocument()
    expect(screen.getByText('限时活动')).toBeInTheDocument()
    expect(screen.getByText('热门分类入口')).toBeInTheDocument()
    expect(screen.getByText('满 50 减 8')).toBeInTheDocument()
  })

  it('shows the achievement dashboard on the profile tab', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')
    window.localStorage.setItem(progressKey, JSON.stringify({
      totalInterceptedOrders: 5,
      totalAvoidedCalories: 3860,
      totalSavedAmount: 132,
      streakDays: 3,
      lastCompletedDate: '2026-08-08',
      todayInterceptedCount: 2,
      todayInterceptedDate: '2026-08-08',
    }))

    vi.setSystemTime(new Date('2026-08-08T20:00:00Z'))

    render(<App />)
    await user.click(screen.getByRole('button', { name: '我的' }))

    expect(screen.getByText('连续守住')).toBeInTheDocument()
    expect(screen.getByText('今日已拦截')).toBeInTheDocument()
    expect(screen.getByText('3 天')).toBeInTheDocument()
    expect(screen.getByText('2 单')).toBeInTheDocument()
  })

  it('filters merchants when entering a category', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')

    render(<App />)
    await user.click(screen.getByRole('button', { name: '分类' }))
    await user.click(screen.getByRole('button', { name: '奶茶甜品' }))

    expect(screen.getByText('失眠奶茶研究所')).toBeInTheDocument()
    expect(screen.getByText('夜航茉莉冰铺')).toBeInTheDocument()
    expect(screen.getByText('24h 甜饮续命所')).toBeInTheDocument()
    expect(screen.queryByText('深夜脆脆炸鸡屋')).not.toBeInTheDocument()
  })

  it('shows at least three merchants in each category', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')

    render(<App />)
    await user.click(screen.getByRole('button', { name: '分类' }))

    const categories = [
      '炸鸡夜宵',
      '奶茶甜品',
      '烧烤碳水',
      '汉堡快餐',
      '蛋糕治愈',
      '粉面主食',
      '汤面暖胃',
      '零食加单',
    ]

    for (const category of categories) {
      await user.click(screen.getByRole('button', { name: category }))
      expect(document.querySelectorAll('.merchant-card')).toHaveLength(3)
      await user.click(screen.getByRole('button', { name: '分类' }))
    }
  })

  it('lets the profile save a default delivery address', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')

    render(<App />)
    await user.click(screen.getByRole('button', { name: '我的' }))
    await user.clear(screen.getByLabelText('常用地址标签'))
    await user.type(screen.getByLabelText('常用地址标签'), '公司')
    await user.type(screen.getByLabelText('常用详细地址'), '南山区科技园科苑路 15 号')
    await user.click(screen.getByRole('button', { name: '保存常用地址' }))

    expect(screen.getByText('已保存，下次结算会自动带入。')).toBeInTheDocument()
    expect(window.localStorage.getItem(savedAddressKey)).toContain('南山区科技园科苑路 15 号')
  })

  it('prefills checkout with the saved address from profile settings', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')
    window.localStorage.setItem(savedAddressKey, JSON.stringify({
      addressLabel: '公司',
      addressLine: '南山区科技园科苑路 15 号',
      remark: '放前台',
    }))

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))

    expect(screen.getByDisplayValue('公司')).toBeInTheDocument()
    expect(screen.getByDisplayValue('南山区科技园科苑路 15 号')).toBeInTheDocument()
    expect(screen.getByDisplayValue('放前台')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认并进入模拟支付' })).toBeEnabled()
  })

  it('opens a merchant page and updates the cart after adding an item', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))

    expect(screen.getByText('已选 1 件')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '去结算' })).toBeInTheDocument()
  })

  it('shows richer product card information on the merchant screen', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))

    expect(screen.getByAltText('香辣炸鸡双拼套餐')).toBeInTheDocument()
    expect(screen.getByText('今晚最危险')).toBeInTheDocument()
    expect(screen.getByText(/约 860 kcal/)).toBeInTheDocument()
  })
})

describe('App checkout and completion flow', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(introKey, 'true')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('requires a delivery address before allowing mock payment', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))

    expect(screen.getByLabelText('详细地址')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认并进入模拟支付' })).toBeDisabled()

    await user.type(screen.getByLabelText('详细地址'), '天河区体育西路 88 号 1602')

    expect(screen.getByRole('button', { name: '确认并进入模拟支付' })).toBeEnabled()
  })

  it('hides the floating cart bar after entering checkout', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))

    expect(screen.getByText('确认订单')).toBeInTheDocument()
    expect(screen.queryByText('已选 1 件')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '去结算' })).not.toBeInTheDocument()
  })

  it('shows the checkout summary after proceeding from the cart', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))

    expect(screen.getByText('确认订单')).toBeInTheDocument()
    expect(screen.getByText(/香辣炸鸡双拼套餐/)).toBeInTheDocument()
    expect(screen.getByText('本次为模拟点单，不会产生真实交易。')).toBeInTheDocument()
  })

  it('updates quantity and pricing when editing items in checkout', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))
    await user.click(screen.getByRole('button', { name: '增加 香辣炸鸡双拼套餐 数量' }))

    expect(screen.getByText('香辣炸鸡双拼套餐 x 2')).toBeInTheDocument()
    expect(screen.getAllByText('¥64')[0]).toBeInTheDocument()
    expect(screen.getByText('¥63')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '减少 香辣炸鸡双拼套餐 数量' }))

    expect(screen.getByText('香辣炸鸡双拼套餐 x 1')).toBeInTheDocument()
    expect(screen.getByText('¥36')).toBeInTheDocument()
  })

  it('disables checkout when the last item is removed from the cart', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))
    await user.click(screen.getByRole('button', { name: '删除 香辣炸鸡双拼套餐' }))

    expect(screen.getByRole('button', { name: '确认并进入模拟支付' })).toBeDisabled()
    expect(screen.getAllByText('¥0')).toHaveLength(4)
  })

  it('shows a real-time countdown in seconds on the waiting screen', async () => {
    window.localStorage.setItem(waitingOrderKey, JSON.stringify({
      startedAt: new Date('2026-08-08T20:00:00Z').getTime(),
      totalSeconds: 1500,
      displayMinutes: 25,
      totalDistanceKm: 3.6,
      merchantName: '深夜脆脆炸鸡屋',
      addressLabel: '家',
      addressLine: '海珠区新港中路 168 号 22 楼',
      remark: '别按门铃',
      riderName: '阿宇',
      riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      riderRating: 4.9,
      routeStops: [
        { id: 'merchant', label: '商家出餐', status: 'done' },
        { id: 'pickup', label: '骑手取餐', status: 'current' },
        { id: 'delivery', label: '正在送达', status: 'upcoming' },
        { id: 'arrive', label: '即将到达', status: 'upcoming' },
      ],
    }))

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T20:00:00Z'))

    render(<App />)

    expect(screen.getByText('25:00')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText('24:59')).toBeInTheDocument()
  })

  it('shows a delivery eta countdown that decreases by minute over time', async () => {
    window.localStorage.setItem(waitingOrderKey, JSON.stringify({
      startedAt: new Date('2026-08-08T20:00:00Z').getTime(),
      totalSeconds: 1500,
      displayMinutes: 25,
      totalDistanceKm: 3.6,
      merchantName: '深夜脆脆炸鸡屋',
      addressLabel: '家',
      addressLine: '海珠区新港中路 168 号 22 楼',
      remark: '别按门铃',
      riderName: '阿宇',
      riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      riderRating: 4.9,
      routeStops: [
        { id: 'merchant', label: '商家出餐', status: 'done' },
        { id: 'pickup', label: '骑手取餐', status: 'current' },
        { id: 'delivery', label: '正在送达', status: 'upcoming' },
        { id: 'arrive', label: '即将到达', status: 'upcoming' },
      ],
    }))

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T20:00:00Z'))

    render(<App />)

    expect(screen.getByText('还剩 25 分钟')).toBeInTheDocument()
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getAllByText('预计 25 分钟')).toHaveLength(2)

    await act(async () => {
      vi.advanceTimersByTime(3_000)
    })

    expect(screen.getByText('24:57')).toBeInTheDocument()
    expect(screen.getAllByText('预计 25 分钟')).toHaveLength(2)

    await act(async () => {
      vi.advanceTimersByTime(57_000)
    })

    expect(screen.getByText('还剩 24 分钟')).toBeInTheDocument()
    expect(screen.getByText('24:00')).toBeInTheDocument()
    expect(screen.getAllByText('预计 24 分钟')).toHaveLength(2)
  })

  it('uses food and drink images that match the displayed product names', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')

    render(<App />)

    await user.click(screen.getByRole('button', { name: /失眠奶茶研究所/ }))
    expect(screen.getByAltText('黑糖珍珠鲜奶')).toHaveAttribute('src', expect.stringContaining('text_to_image'))
    expect(screen.getByAltText('黑糖珍珠鲜奶')).toHaveAttribute('src', expect.stringContaining('brown%20sugar%20boba'))
    expect(screen.getByAltText('抹茶云顶拿铁')).toHaveAttribute('src', expect.stringContaining('text_to_image'))
    expect(screen.getByAltText('抹茶云顶拿铁')).toHaveAttribute('src', expect.stringContaining('matcha%20latte'))
    expect(screen.getByAltText('榴莲千层切块盒')).toHaveAttribute('src', expect.stringContaining('text_to_image'))
    expect(screen.getByAltText('榴莲千层切块盒')).toHaveAttribute('src', expect.stringContaining('durian%20crepe'))

    await user.click(screen.getByRole('button', { name: '分类' }))
    await user.click(screen.getByRole('button', { name: '烧烤碳水' }))
    await user.click(screen.getByRole('button', { name: /楼下炭火烧烤档/ }))
    expect(screen.getByAltText('蒜蓉锡纸金针菇')).toHaveAttribute('src', expect.stringContaining('text_to_image'))
    expect(screen.getByAltText('蒜蓉锡纸金针菇')).toHaveAttribute('src', expect.stringContaining('garlic%20enoki%20mushrooms'))
    expect(screen.getByAltText('韩式辣酱年糕串')).toHaveAttribute('src', expect.stringContaining('text_to_image'))
    expect(screen.getByAltText('韩式辣酱年糕串')).toHaveAttribute('src', expect.stringContaining('korean%20rice%20cake%20skewers'))

    await user.click(screen.getByRole('button', { name: '分类' }))
    await user.click(screen.getByRole('button', { name: '粉面主食' }))
    await user.click(screen.getByRole('button', { name: /凌晨拌粉计划/ }))
    expect(screen.getByAltText('酸豆角小食盒')).toHaveAttribute('src', expect.stringContaining('text_to_image'))
    expect(screen.getByAltText('酸豆角小食盒')).toHaveAttribute('src', expect.stringContaining('pickled%20green%20beans'))
  })

  it('shows order history in the profile tab', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(introKey, 'true')
    window.localStorage.setItem(orderHistoryKey, JSON.stringify([
      {
        id: 'history-1',
        merchantName: '深夜脆脆炸鸡屋',
        orderedAt: '2026-08-08T20:25:00.000Z',
        addressLabel: '家',
        addressLine: '福田区深南大道 1008 号 9 楼',
        totalAmount: 36,
        totalItems: 1,
        itemsSummary: '香辣炸鸡双拼套餐 x 1',
      },
      {
        id: 'history-2',
        merchantName: '失眠奶茶研究所',
        orderedAt: '2026-08-07T21:10:00.000Z',
        addressLabel: '公司',
        addressLine: '南山区科技园科苑路 15 号',
        totalAmount: 24,
        totalItems: 2,
        itemsSummary: '茉莉葡萄冰茶等 2 件',
      },
    ]))

    render(<App />)
    await user.click(screen.getByRole('button', { name: '我的' }))

    expect(screen.getByText('历史订单')).toBeInTheDocument()
    const historySection = screen.getByRole('region', { name: '历史订单' })

    expect(within(historySection).getByText('深夜脆脆炸鸡屋')).toBeInTheDocument()
    expect(within(historySection).getByText('失眠奶茶研究所')).toBeInTheDocument()
    expect(within(historySection).getByText('香辣炸鸡双拼套餐 x 1')).toBeInTheDocument()
    expect(within(historySection).getByText('茉莉葡萄冰茶等 2 件')).toBeInTheDocument()
    expect(within(historySection).getByText('送达至 家 · 福田区深南大道 1008 号 9 楼')).toBeInTheDocument()
    expect(within(historySection).getByText('送达至 公司 · 南山区科技园科苑路 15 号')).toBeInTheDocument()
  })

  it('shows richer delivery tracking details on the waiting screen', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))
    await user.type(screen.getByLabelText('详细地址'), '海珠区新港中路 168 号 22 楼')
    await user.click(screen.getByRole('button', { name: '确认并进入模拟支付' }))
    await user.click(screen.getByRole('button', { name: '确认模拟支付' }))

    expect(screen.getByText('等待配送中')).toBeInTheDocument()
    expect(screen.getByText('预计送达')).toBeInTheDocument()
    expect(screen.getByText(/还剩 .* 分钟/)).toBeInTheDocument()
    expect(screen.getByText(/骑手距你还有 .* km/)).toBeInTheDocument()
    expect(screen.getByText('配送路线')).toBeInTheDocument()
    expect(screen.getByText('送达地址')).toBeInTheDocument()
    expect(screen.getByText('海珠区新港中路 168 号 22 楼')).toBeInTheDocument()
  })

  it('shows the mock payment screen after confirming checkout details', async () => {
    const user = userEvent.setup()

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getAllByRole('button', { name: '选规格' })[0])
    await user.click(screen.getByRole('button', { name: '加入购物车 · ¥32' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))
    await user.type(screen.getByLabelText('详细地址'), '越秀区中山五路 68 号')
    await user.click(screen.getByRole('button', { name: '确认并进入模拟支付' }))

    expect(screen.getByText('模拟支付')).toBeInTheDocument()
    expect(screen.getByText('不会产生真实扣款，也不会向真实商家下单。')).toBeInTheDocument()
  })

  it('completes the waiting flow and shows the result page with updated progress', async () => {
    window.localStorage.setItem(waitingOrderKey, JSON.stringify({
      startedAt: new Date('2026-08-08T19:59:52Z').getTime(),
      totalSeconds: 7,
      displayMinutes: 24,
      totalDistanceKm: 3.6,
      merchantName: '深夜脆脆炸鸡屋',
      addressLabel: '家',
      addressLine: '福田区深南大道 1008 号 9 楼',
      remark: '别按门铃',
      riderName: '阿宇',
      riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      riderRating: 4.9,
      routeStops: [
        { id: 'merchant', label: '商家出餐', status: 'done' },
        { id: 'pickup', label: '骑手取餐', status: 'current' },
        { id: 'delivery', label: '正在送达', status: 'upcoming' },
        { id: 'arrive', label: '即将到达', status: 'upcoming' },
      ],
    }))

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T20:00:00Z'))

    render(<App />)

    expect(screen.getByText('等待配送中')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText('今晚成功拦住了这单')).toBeInTheDocument()
    expect(screen.getByText(/累计拦截/)).toBeInTheDocument()
    expect(screen.getByText(/累计少吃/)).toBeInTheDocument()
  }, 10000)

  it('shows updated today intercepted stats after completing an order and returning home', async () => {
    window.localStorage.setItem(waitingOrderKey, JSON.stringify({
      startedAt: new Date('2026-08-08T19:59:52Z').getTime(),
      totalSeconds: 7,
      displayMinutes: 24,
      totalDistanceKm: 3.6,
      merchantName: '深夜脆脆炸鸡屋',
      addressLabel: '家',
      addressLine: '南山区科技园科苑路 15 号',
      remark: '别按门铃',
      riderName: '阿宇',
      riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      riderRating: 4.9,
      routeStops: [
        { id: 'merchant', label: '商家出餐', status: 'done' },
        { id: 'pickup', label: '骑手取餐', status: 'current' },
        { id: 'delivery', label: '正在送达', status: 'upcoming' },
        { id: 'arrive', label: '即将到达', status: 'upcoming' },
      ],
    }))

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T20:00:00Z'))

    render(<App />)

    expect(screen.getByText('等待配送中')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    cleanup()
    render(<App />)

    vi.useRealTimers()
    await userEvent.setup().click(screen.getByRole('button', { name: '我的' }))

    expect(screen.getByText('今日已拦截')).toBeInTheDocument()
    expect(screen.getAllByText('1 单')[0]).toBeInTheDocument()
  }, 10000)
})
