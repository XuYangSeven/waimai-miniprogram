import { useEffect, useMemo, useState } from 'react'
import { categories } from './data/categories'
import { mockMerchants } from './data/mockMerchants'
import {
  addCartItem,
  decrementCartItemQuantity,
  getCartItemCount,
  getCartSubtotal,
  incrementCartItemQuantity,
  removeCartItem,
} from './lib/cart'
import { getActiveTab, getDisplayedMerchants, getInitialScreen, shouldShowCartBar, shouldShowTabBar } from './lib/appState'
import { buildResultStats, createWaitingOrder } from './lib/orderFlow'
import { calculatePricing } from './lib/pricing'
import {
  loadHasSeenIntro,
  loadOrderHistory,
  loadProgress,
  loadSavedAddress,
  loadWaitingOrder,
  saveHasSeenIntro,
  saveOrderHistory,
  saveProgress,
  saveSavedAddress,
  saveWaitingOrder,
} from './lib/storage'
import { getWaitingStage, getWaitingStatus } from './lib/waiting'
import type { AppTab, CartItem, CategoryId, CheckoutDraft, Merchant, OrderHistoryItem, Product, ProgressStats, SavedAddress, Screen, SelectedOption, WaitingOrder } from './types'
import './App.css'

type ProductModalState = {
  merchant: Merchant
  product: Product
  selectedChoices: Record<string, string[]>
  quantity: number
} | null

type ResultState = {
  avoidedCalories: number
  savedAmount: number
  waitedSeconds: number
}

const PACKAGING_FEE = 3
const WAITING_SECONDS = 24 * 60
const DISPLAY_WAITING_MINUTES = 24
const DELIVERY_DISTANCE_KM = 3.6
const DEFAULT_CHECKOUT_DRAFT = {
  addressLabel: '家',
  addressLine: '',
  deliveryEta: '预计 24 分钟送达',
  remark: '别按门铃'
}
const HOME_RECOMMENDATIONS = [
  { title: '今晚推荐', description: '先看最容易让人手滑下单的高危店铺。', badge: '冲动高发' },
  { title: '限时活动', description: '把“满减”和“第二份半价”留在屏幕里就好。', badge: '满 50 减 8' },
  { title: '热门分类入口', description: '炸鸡、奶茶、烧烤都在，先点进去逛完再说。', badge: '8 个分类' },
]
const RIDER_PROFILE = {
  riderName: '阿宇',
  riderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  riderRating: 4.9,
}

function formatPrice(amount: number) {
  return `¥${amount}`
}

const BROKEN_IMG_FALLBACK = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%238d5cf6%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23ff8e6e%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22url(%23g)%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%22108%22%20text-anchor%3D%22middle%22%20fill%3D%22rgba(255%2C255%2C255%2C0.6)%22%20font-size%3D%2214%22%20font-family%3D%22sans-serif%22%3E%F0%9F%8D%B4%3C%2Ftext%3E%3C%2Fsvg%3E'

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget
  if (target.src !== BROKEN_IMG_FALLBACK) {
    target.src = BROKEN_IMG_FALLBACK
    target.classList.add('img-fallback')
  }
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getTodayLabel() {
  return formatDate(new Date())
}

function getRemainingSeconds(order: WaitingOrder | null) {
  if (!order) {
    return 0
  }

  const elapsedSeconds = Math.floor((Date.now() - order.startedAt) / 1000)
  return Math.max(order.totalSeconds - elapsedSeconds, 0)
}

function buildCheckoutDraft(savedAddress: SavedAddress): CheckoutDraft {
  return {
    ...DEFAULT_CHECKOUT_DRAFT,
    addressLabel: savedAddress.addressLabel,
    addressLine: savedAddress.addressLine,
    remark: savedAddress.remark,
  }
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatOrderHistoryTime(value: string) {
  const date = new Date(value)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${month}月${day}日 ${hours}:${minutes}`
}

function buildOrderHistorySummary(cart: CartItem[]) {
  if (cart.length === 0) {
    return ''
  }

  const totalItems = getCartItemCount(cart)
  const firstItem = cart[0]

  if (totalItems <= 1) {
    return `${firstItem.name} x 1`
  }

  return `${firstItem.name}等 ${totalItems} 件`
}

function buildOrderHistoryItem({
  cart,
  merchantName,
  addressLabel,
  addressLine,
  totalAmount,
}: {
  cart: CartItem[]
  merchantName: string
  addressLabel: string
  addressLine: string
  totalAmount: number
}): OrderHistoryItem {
  return {
    id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    merchantName,
    orderedAt: new Date().toISOString(),
    addressLabel,
    addressLine,
    totalAmount,
    totalItems: getCartItemCount(cart),
    itemsSummary: buildOrderHistorySummary(cart),
  }
}

function App() {
  const initialWaitingOrder = loadWaitingOrder()
  const initialHasSeenIntro = loadHasSeenIntro()
  const initialSavedAddress = loadSavedAddress()
  const [hasSeenIntro, setHasSeenIntro] = useState(initialHasSeenIntro)
  const [screen, setScreen] = useState<Screen>(() => getInitialScreen({
    hasSeenIntro: initialHasSeenIntro,
    waitingOrder: initialWaitingOrder,
  }))
  const [cart, setCart] = useState<CartItem[]>(() => [])
  const [selectedProduct, setSelectedProduct] = useState<ProductModalState>(null)
  const [progress, setProgress] = useState<ProgressStats>(() => loadProgress())
  const [waitingOrder, setWaitingOrder] = useState<WaitingOrder | null>(() => initialWaitingOrder)
  const [result, setResult] = useState<ResultState | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(initialWaitingOrder))
  const [savedAddress, setSavedAddress] = useState<SavedAddress>(initialSavedAddress)
  const [savedAddressNotice, setSavedAddressNotice] = useState('')
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft>(() => buildCheckoutDraft(initialSavedAddress))
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>(() => loadOrderHistory())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    saveHasSeenIntro(hasSeenIntro)
  }, [hasSeenIntro])

  useEffect(() => {
    saveWaitingOrder(waitingOrder)
  }, [waitingOrder])

  useEffect(() => {
    saveOrderHistory(orderHistory)
  }, [orderHistory])

  useEffect(() => {
    if (screen.name !== 'checkout') {
      return
    }

    setCheckoutDraft((current) => ({
      ...current,
      addressLabel: current.addressLine ? current.addressLabel : savedAddress.addressLabel,
      addressLine: current.addressLine ? current.addressLine : savedAddress.addressLine,
      remark: current.remark === DEFAULT_CHECKOUT_DRAFT.remark ? savedAddress.remark : current.remark,
    }))
  }, [savedAddress, screen])

  const todayLabel = getTodayLabel()
  const todayInterceptedCount = progress.todayInterceptedDate === todayLabel ? progress.todayInterceptedCount : 0
  const activeTab = getActiveTab(screen)
  const selectedCategory = screen.name === 'categories' ? screen.categoryId ?? null : null
  const activeMerchant = screen.name === 'merchant'
    ? mockMerchants.find((merchant) => merchant.id === screen.merchantId) ?? null
    : null
  const currentMerchant = cart[0]?.merchantId
    ? mockMerchants.find((merchant) => merchant.id === cart[0].merchantId) ?? null
    : null

  const displayedMerchants = useMemo(() => {
    return getDisplayedMerchants({ screen, merchants: mockMerchants })
  }, [screen])

  const pricingSummary = useMemo(() => {
    if (cart.length === 0) {
      return calculatePricing({ items: [], packagingFee: 0, deliveryFee: 0 })
    }

    return calculatePricing({
      items: cart.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
      packagingFee: PACKAGING_FEE,
      deliveryFee: currentMerchant?.deliveryFee ?? 0,
    })
  }, [cart, currentMerchant])

  const resultScreenState = screen.name === 'result'
    ? {
      avoidedCalories: screen.avoidedCalories,
      savedAmount: screen.savedAmount,
      waitedSeconds: screen.waitedSeconds,
    }
    : result

  const isAddressReady = checkoutDraft.addressLine.trim().length > 0

  useEffect(() => {
    if (screen.name !== 'waiting' || !waitingOrder) {
      return undefined
    }

    setRemainingSeconds(getRemainingSeconds(waitingOrder))

    const timer = window.setInterval(() => {
      setRemainingSeconds((currentRemainingSeconds) => {
        const nextRemainingSeconds = currentRemainingSeconds - 1

        if (nextRemainingSeconds > 0) {
          return nextRemainingSeconds
        }

        window.clearInterval(timer)

        const nextOrderHistoryItem = buildOrderHistoryItem({
          cart,
          merchantName: waitingOrder.merchantName,
          addressLabel: waitingOrder.addressLabel,
          addressLine: waitingOrder.addressLine,
          totalAmount: currentMerchant ? calculatePricing({
            items: cart.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
            packagingFee: PACKAGING_FEE,
            deliveryFee: currentMerchant.deliveryFee,
          }).total : 0,
        })

        const completed = buildResultStats({
          cart,
          progress,
          completedOn: getTodayLabel(),
          packagingFee: PACKAGING_FEE,
          deliveryFee: cart[0]?.merchantId ? (mockMerchants.find((merchant) => merchant.id === cart[0].merchantId)?.deliveryFee ?? 0) : 0,
          waitedSeconds: waitingOrder.totalSeconds,
        })

        setProgress(completed.progress)
        setResult(completed.session)
        setOrderHistory((currentHistory) => [nextOrderHistoryItem, ...currentHistory].slice(0, 12))
        setWaitingOrder(null)
        setCart([])
        setScreen({
          name: 'result',
          avoidedCalories: completed.session.avoidedCalories,
          savedAmount: completed.session.savedAmount,
          waitedSeconds: completed.session.waitedSeconds,
        })

        return 0
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cart, progress, screen, waitingOrder])

  function handleEnterApp() {
    setHasSeenIntro(true)
    setScreen({ name: 'home' })
  }

  function handleTabChange(tab: AppTab) {
    if (tab === 'home') {
      setScreen({ name: 'home' })
      return
    }

    if (tab === 'categories') {
      setScreen({ name: 'categories' })
      return
    }

    setScreen({ name: 'profile' })
  }

  function handleBackToBrowsing() {
    if (activeTab === 'categories') {
      setScreen({ name: 'categories', categoryId: selectedCategory ?? undefined })
      return
    }

    if (activeTab === 'profile') {
      setScreen({ name: 'profile' })
      return
    }

    setScreen({ name: 'home' })
  }

  function handleSelectCategory(categoryId: CategoryId) {
    setScreen({ name: 'categories', categoryId })
  }

  function handleOpenMerchant(merchantId: string) {
    setScreen({ name: 'merchant', merchantId })
  }

  function handleOpenCheckout() {
    setCheckoutDraft(buildCheckoutDraft(savedAddress))
    setScreen({ name: 'checkout' })
  }

  function handleSaveAddress() {
    saveSavedAddress(savedAddress)
    setSavedAddressNotice('已保存，下次结算会自动带入。')
  }

  function getProductOptionPriceDelta(product: Product, selectedOptions?: SelectedOption[]): number {
    if (!selectedOptions || !product.options) return 0
    return selectedOptions.reduce((sum, so) => {
      const option = product.options?.find((o) => o.id === so.optionId)
      const choice = option?.choices.find((c) => c.label === so.choiceLabel)
      return sum + (choice?.priceDelta ?? 0)
    }, 0)
  }

  function handleAddProduct(merchant: Merchant, product: Product, selectedOptions: SelectedOption[] | undefined, quantity: number) {
    const priceDelta = getProductOptionPriceDelta(product, selectedOptions)
    const nextItem: CartItem = {
      productId: product.id,
      merchantId: merchant.id,
      name: product.name,
      description: product.description,
      image: product.image,
      unitPrice: product.price + priceDelta,
      estimatedCalories: product.estimatedCalories,
      quantity,
      selectedOptions,
    }

    setCart((currentCart) => addCartItem(currentCart, nextItem))
  }

  function renderBottomTabBar() {
    const tabs: { id: AppTab, label: string }[] = [
      { id: 'home', label: '首页' },
      { id: 'categories', label: '分类' },
      { id: 'profile', label: '我的' },
    ]

    return (
      <nav className="bottom-tab-bar" aria-label="底部导航">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className={`bottom-tab-bar__button${isActive ? ' bottom-tab-bar__button--active' : ''}`}
              aria-pressed={isActive}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
    )
  }

  function renderCategories() {
    return (
      <section className="flow-screen">
        <div className="section-block">
          <div className="section-heading">
            <h2>夜宵分类</h2>
          </div>
          <p className="section-copy">按冲动类型逛一圈，看看今晚最容易失守的是哪一类。</p>
          <div className="category-row">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id

              return (
                <button
                  key={category.id}
                  type="button"
                  className={`chip${isActive ? ' active' : ''}`}
                  onClick={() => handleSelectCategory(category.id)}
                >
                  {category.label}
                </button>
              )
            })}
          </div>
        </div>

        <section className="merchant-list">
          {displayedMerchants.map((merchant) => (
            <button
              key={merchant.id}
              type="button"
              className="merchant-card"
              onClick={() => handleOpenMerchant(merchant.id)}
            >
              <img src={merchant.coverImage} alt={`${merchant.name}封面`} className="merchant-card__image" onError={handleImgError} />              <div className="merchant-card__meta">
                <div className="merchant-card__header">
                  <p className="merchant-card__title">{merchant.name}</p>
                  <div className="tag-row merchant-card__tags">
                    {merchant.featuredTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="merchant-card__desc merchant-card__desc--meta">
                  <span className="merchant-card__meta-pill">{merchant.rating} 分</span>
                  <span className="merchant-card__meta-pill">月售 {merchant.monthlySales}</span>
                  <span className="merchant-card__meta-pill">{merchant.deliveryTime}</span>
                </p>
              </div>
            </button>
          ))}
        </section>
      </section>
    )
  }

  function renderProfile() {
    return (
      <section className="flow-screen">
        <div className="section-block success-card">
          <h2>我的战绩</h2>
          <p className="section-copy">每次没有真的下单，都是在帮明天的自己留点轻松。</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><span>连续守住</span><strong>{progress.streakDays} 天</strong></div>
          <div className="stat-card"><span>今日已拦截</span><strong>{todayInterceptedCount} 单</strong></div>
          <div className="stat-card"><span>累计拦截</span><strong>{progress.totalInterceptedOrders} 单</strong></div>
          <div className="stat-card"><span>累计少吃</span><strong>{progress.totalAvoidedCalories} kcal</strong></div>
        </div>
        <div className="section-block">
          <p className="section-label">累计战绩</p>
          <div className="summary-list">
            <div className="summary-row"><span>累计省下</span><strong>{formatPrice(progress.totalSavedAmount)}</strong></div>
            <div className="summary-row"><span>上次守住</span><strong>{progress.lastCompletedDate ?? '今晚还没开始'}</strong></div>
          </div>
        </div>
        <div className="section-block checkout-address-card">
          <div className="section-heading">
            <div>
              <h2>历史订单</h2>
              <p className="section-copy">看看自己最近都拦住了哪些夜宵冲动。</p>
            </div>
            <span className="tag-pill">最近 {orderHistory.length} 单</span>
          </div>
          <section aria-label="历史订单" className="summary-list">
            {orderHistory.length > 0 ? orderHistory.map((order) => (
              <article key={order.id} className="section-block order-history-card">
                <div className="summary-row">
                  <strong>{order.merchantName}</strong>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
                <p className="section-copy">{order.itemsSummary}</p>
                <p className="section-copy">送达至 {order.addressLabel} · {order.addressLine}</p>
                <p className="section-copy">{formatOrderHistoryTime(order.orderedAt)} · 共 {order.totalItems} 件</p>
              </article>
            )) : <p className="section-copy">还没有历史订单，今晚先成功拦住第一单。</p>}
          </section>
        </div>
        <div className="section-block checkout-address-card">
          <div className="section-heading">
            <div>
              <h2>常用地址</h2>
              <p className="section-copy">保存一次，下次结算直接带入。</p>
            </div>
            <span className="tag-pill">个人设置</span>
          </div>
          <div className="checkout-address-grid">
            <label className="checkout-field">
              <span>常用地址标签</span>
              <input
                aria-label="常用地址标签"
                value={savedAddress.addressLabel}
                onChange={(event) => {
                  setSavedAddressNotice('')
                  setSavedAddress((current) => ({ ...current, addressLabel: event.target.value }))
                }}
              />
            </label>
            <label className="checkout-field checkout-field--full">
              <span>常用详细地址</span>
              <input
                aria-label="常用详细地址"
                value={savedAddress.addressLine}
                onChange={(event) => {
                  setSavedAddressNotice('')
                  setSavedAddress((current) => ({ ...current, addressLine: event.target.value }))
                }}
                placeholder="比如：南山区科技园科苑路 15 号"
              />
            </label>
            <label className="checkout-field checkout-field--full">
              <span>常用备注</span>
              <input
                aria-label="常用备注"
                value={savedAddress.remark}
                onChange={(event) => {
                  setSavedAddressNotice('')
                  setSavedAddress((current) => ({ ...current, remark: event.target.value }))
                }}
                placeholder="比如：放前台、别按门铃"
              />
            </label>
          </div>
          <div className="profile-address-actions">
            <button type="button" className="primary-button" onClick={handleSaveAddress}>
              保存常用地址
            </button>
            {savedAddressNotice ? <p className="section-copy">{savedAddressNotice}</p> : null}
          </div>
        </div>
      </section>
    )
  }

  function renderWelcome() {
    return (
      <section className="flow-screen welcome-screen">
        <div className="section-block success-card">
          <p className="eyebrow">夜间冲动拦截实验</p>
          <h1>今晚不送达</h1>
          <p className="hero-copy">先把这份想点夜宵的冲动，安全地走完一遍。</p>
          <p className="section-copy">你可以像真的一样浏览、加购、结算、等待配送，但不会产生真实交易。</p>
        </div>
        <button type="button" className="primary-button primary-button--block" onClick={handleEnterApp}>
          开始点外卖
        </button>
      </section>
    )
  }

  function renderHome() {
    return (
      <>
        <section className="section-block success-card">
          <p className="eyebrow">夜间冲动拦截实验</p>
          <h1>今晚不送达</h1>
          <p className="hero-copy">把这份夜宵冲动留在屏幕里，别真的送到胃里。</p>
        </section>
        <section className="home-feature-grid">
          {HOME_RECOMMENDATIONS.map((item) => (
            <article key={item.title} className="stat-card home-feature-card">
              <span>{item.title}</span>
              <strong>{item.badge}</strong>
              <p className="section-copy">{item.description}</p>
            </article>
          ))}
        </section>
        <section className="section-block">
          <div className="section-heading">
            <h2>今晚吃点什么？</h2>
          </div>
          <p className="section-copy">先逛一圈高危夜宵，把冲动安全地消耗掉。</p>
          <div className="category-row home-category-shortcuts">
            {categories.slice(0, 4).map((category) => (
              <button
                key={category.id}
                type="button"
                className="chip"
                onClick={() => handleSelectCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="merchant-list">
          {displayedMerchants.map((merchant) => (
            <button
              key={merchant.id}
              type="button"
              className="merchant-card"
              onClick={() => handleOpenMerchant(merchant.id)}
            >
              <img src={merchant.coverImage} alt={`${merchant.name}封面`} className="merchant-card__image" onError={handleImgError} />              <div className="merchant-card__meta">
                <div className="merchant-card__header">
                  <p className="merchant-card__title">{merchant.name}</p>
                  <div className="tag-row merchant-card__tags">
                    {merchant.featuredTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="merchant-card__desc merchant-card__desc--meta">
                  <span className="merchant-card__meta-pill">{merchant.rating} 分</span>
                  <span className="merchant-card__meta-pill">月售 {merchant.monthlySales}</span>
                  <span className="merchant-card__meta-pill">{merchant.deliveryTime}</span>
                </p>
                <p className="merchant-card__desc merchant-card__desc--meta">
                  <span className="merchant-card__meta-pill">起送 {formatPrice(merchant.minimumOrderPrice)}</span>
                  <span className="merchant-card__meta-pill">配送 {formatPrice(merchant.deliveryFee)}</span>
                </p>
                <p className="merchant-card__promo">{merchant.promotionText}</p>
              </div>
            </button>
          ))}
        </section>
      </>
    )
  }

  function renderMerchant() {
    if (!activeMerchant) {
      return null
    }

    return (
      <section className="merchant-screen">
        <button type="button" className="link-button" onClick={handleBackToBrowsing}>
          返回
        </button>
        <div className="merchant-hero">
          <h2>{activeMerchant.name}</h2>
          <p>{activeMerchant.announcement}</p>
          <div className="tag-row">
            {activeMerchant.featuredTags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="product-list">
          {activeMerchant.products.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-card__body">
                <div className="product-card__content">
                  {product.tag ? <span className="product-card__tag">{product.tag}</span> : null}
                  <p className="product-card__name">{product.name}</p>
                  <p className="product-card__description">{product.description}</p>
                  <p className="product-card__meta">约 {product.estimatedCalories} kcal · 月售 {product.monthlySales}</p>
                  <div className="product-card__footer">
                    <strong className="product-card__price">{formatPrice(product.price)}</strong>
                    <div className="product-card__actions">
                      {product.options && product.options.length > 0 ? (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => {
                            const defaultChoices: Record<string, string[]> = {}
                            product.options!.forEach((opt) => {
                              defaultChoices[opt.id] = [opt.choices[0].label]
                            })
                            setSelectedProduct({ merchant: activeMerchant, product, selectedChoices: defaultChoices, quantity: 1 })
                          }}
                        >
                          选规格
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleAddProduct(activeMerchant, product, undefined, 1)}
                        >
                          加入购物车（{formatPrice(product.price)}）
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <img src={product.image} alt={product.name} className="product-card__image" onError={handleImgError} />
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  function renderCheckout() {
    return (
      <section className="flow-screen">
        <div className="section-block checkout-hero">
          <div>
            <p className="eyebrow">模拟确认页</p>
            <h2>确认订单</h2>
            <p className="section-copy">本次为模拟点单，不会产生真实交易。</p>
          </div>
          <div className="checkout-hero__badges">
            <span className="tag-pill">{checkoutDraft.deliveryEta}</span>
            <span className="tag-pill">夜间下单高发时段</span>
          </div>
        </div>
        <div className="section-block checkout-address-card">
          <div className="section-heading">
            <div>
              <p className="section-label">配送信息</p>
              <strong>{checkoutDraft.addressLabel || '配送地址'}</strong>
            </div>
            <span className="tag-pill">极速送达（模拟）</span>
          </div>
          <div className="checkout-address-grid">
            <label className="checkout-field">
              <span>地址标签</span>
              <input
                value={checkoutDraft.addressLabel}
                onChange={(event) => setCheckoutDraft((current) => ({ ...current, addressLabel: event.target.value }))}
              />
            </label>
            <label className="checkout-field checkout-field--full">
              <span>详细地址</span>
              <input
                aria-label="详细地址"
                value={checkoutDraft.addressLine}
                onChange={(event) => setCheckoutDraft((current) => ({ ...current, addressLine: event.target.value }))}
                placeholder="请输入配送地址"
              />
            </label>
            <label className="checkout-field checkout-field--full">
              <span>备注</span>
              <input
                value={checkoutDraft.remark}
                onChange={(event) => setCheckoutDraft((current) => ({ ...current, remark: event.target.value }))}
                placeholder="比如：放门口、别按门铃"
              />
            </label>
          </div>
          <p className="section-copy">{checkoutDraft.deliveryEta} · 地址未填写前无法进入模拟支付</p>
        </div>
        <div className="section-block checkout-summary-card">
          <div className="summary-row">
            <div>
              <p className="section-label">下单商家</p>
              <strong>{currentMerchant?.name ?? '模拟商家'}</strong>
            </div>
            <div className="checkout-summary-card__meta">
              <span className="merchant-card__meta-pill">起送 {formatPrice(currentMerchant?.minimumOrderPrice ?? 0)}</span>
              <span className="merchant-card__meta-pill">配送 {formatPrice(currentMerchant?.deliveryFee ?? 0)}</span>
            </div>
          </div>
          <div className="summary-list checkout-summary-card__rows">
            <div className="summary-row"><span>夜宵件数</span><strong>{getCartItemCount(cart)} 件</strong></div>
            <div className="summary-row"><span>预计少吃</span><strong>{cart.reduce((sum, item) => sum + item.estimatedCalories * item.quantity, 0)} kcal</strong></div>
            <div className="summary-row"><span>冲动指数</span><strong>{pricingSummary.subtotal >= 50 ? '非常危险' : pricingSummary.subtotal >= 30 ? '正在上头' : '还能撤回'}</strong></div>
          </div>
        </div>
        <div className="section-block">
          <div className="section-heading">
            <div>
              <p className="section-label">商品明细</p>
              <strong>{currentMerchant?.name ?? '已选商品'}</strong>
            </div>
            <span className="tag-pill">共 {cart.length} 种</span>
          </div>
          <div className="summary-list">
            {cart.map((item) => {
              const optionsLabel = item.selectedOptions && item.selectedOptions.length > 0
                ? item.selectedOptions.map((so) => so.choiceLabel).join(' / ')
                : ''
              return (
              <div key={`${item.productId}-${optionsLabel || 'default'}`} className="checkout-item">
                <div className="checkout-item__info">
                  <p className="checkout-item__name">{item.name} x {item.quantity}</p>
                  <p className="section-copy">{optionsLabel ? `规格：${optionsLabel}` : item.description}</p>
                </div>
                <div className="checkout-item__controls">
                  <strong className="checkout-item__amount">{formatPrice(item.unitPrice * item.quantity)}</strong>
                  <div className="stepper">
                    <button
                      type="button"
                      className="secondary-button stepper__button"
                      aria-label={`减少 ${item.name} 数量`}
                      onClick={() => setCart((currentCart) => decrementCartItemQuantity(currentCart, item))}
                    >
                      -
                    </button>
                    <span className="stepper__value">{item.quantity}</span>
                    <button
                      type="button"
                      className="secondary-button stepper__button"
                      aria-label={`增加 ${item.name} 数量`}
                      onClick={() => setCart((currentCart) => incrementCartItemQuantity(currentCart, item))}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="link-button checkout-item__remove"
                    aria-label={`删除 ${item.name}`}
                    onClick={() => setCart((currentCart) => removeCartItem(currentCart, item))}
                  >
                    删除
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        </div>
        <div className="section-block checkout-fee-card">
          <div className="section-heading">
            <div>
              <p className="section-label">费用明细</p>
              <strong>到手前最后一步</strong>
            </div>
            {pricingSummary.nextDiscountLabel ? <span className="tag-pill">再买 {formatPrice(pricingSummary.amountToNextDiscount)} 可达 {pricingSummary.nextDiscountLabel}</span> : null}
          </div>
          <div className="summary-list">
            <div className="summary-row"><span>商品小计</span><strong>{formatPrice(pricingSummary.subtotal)}</strong></div>
            <div className="summary-row"><span>打包费</span><strong>{formatPrice(cart.length === 0 ? 0 : PACKAGING_FEE)}</strong></div>
            <div className="summary-row"><span>配送费</span><strong>{formatPrice(cart.length === 0 ? 0 : (currentMerchant?.deliveryFee ?? 0))}</strong></div>
            <div className="summary-row accent"><span>优惠</span><strong>-{formatPrice(pricingSummary.discount)}</strong></div>
            <div className="summary-row total"><span>合计</span><strong>{formatPrice(pricingSummary.total)}</strong></div>
          </div>
        </div>
        <button
          type="button"
          className="primary-button primary-button--block"
          disabled={cart.length === 0 || !isAddressReady}
          onClick={() => setScreen({ name: 'mock-pay' })}
        >
          确认并进入模拟支付
        </button>
      </section>
    )
  }

  function renderMockPay() {
    return (
      <section className="flow-screen">
        <div className="section-block">
          <h2>模拟支付</h2>
          <p className="section-copy">不会产生真实扣款，也不会向真实商家下单。</p>
        </div>
        <div className="payment-card">
          <p className="section-label">应付金额</p>
          <strong className="payment-amount">{formatPrice(pricingSummary.total)}</strong>
          <p className="section-copy">支付方式：夜间克制账户（模拟）</p>
        </div>
        <button
          type="button"
          className="primary-button primary-button--block"
          onClick={() => {
            const nextWaitingOrder = createWaitingOrder({
              ...RIDER_PROFILE,
              totalSeconds: WAITING_SECONDS,
              displayMinutes: DISPLAY_WAITING_MINUTES,
              totalDistanceKm: DELIVERY_DISTANCE_KM,
              merchantName: currentMerchant?.name ?? '模拟商家',
              addressLabel: checkoutDraft.addressLabel,
              addressLine: checkoutDraft.addressLine,
              remark: checkoutDraft.remark,
              routeStops: [
                { id: 'merchant', label: '商家出餐', status: 'done' },
                { id: 'pickup', label: '骑手取餐', status: 'current' },
                { id: 'delivery', label: '正在送达', status: 'upcoming' },
                { id: 'arrive', label: '即将到达', status: 'upcoming' },
              ],
            })

            setWaitingOrder(nextWaitingOrder)
            setRemainingSeconds(nextWaitingOrder.totalSeconds)
            setScreen({ name: 'waiting' })
          }}
        >
          确认模拟支付
        </button>
      </section>
    )
  }

  function renderWaiting() {
    const stage = waitingOrder
      ? getWaitingStage({ totalSeconds: waitingOrder.totalSeconds, remainingSeconds })
      : 'preparing'

    const status = waitingOrder
      ? getWaitingStatus({
        totalSeconds: waitingOrder.totalSeconds,
        remainingSeconds,
        totalDistanceKm: waitingOrder.totalDistanceKm,
      })
      : {
        stage: 'preparing' as const,
        progress: 0,
        remainingMinutes: 0,
        remainingDistanceKm: 0,
        stageLabel: '商家正在备餐',
        routeStatus: '骑手即将出发',
      }

    const riderLeft = `${Math.max(8, Math.min(88, status.progress * 100))}%`

    const stageCopy = {
      preparing: '商家正在假装备餐，给冲动一点冷静时间。',
      rider_assigned: '骑手已接模拟订单，冲动正在路上被稀释。',
      delivering: '骑手正在靠近，你也正在离热量更远。',
      arriving: '马上送达，但这单会在最后一刻安全消失。',
    }[stage]

    return (
      <section className="flow-screen">
        <div className="section-block">
          <h2>等待配送中</h2>
          <p className="section-copy">{stageCopy}</p>
        </div>
        <div className="rider-card">
          <img src={RIDER_PROFILE.riderAvatar} alt="模拟骑手头像" className="rider-avatar" onError={handleImgError} />
          <div>
            <strong>{RIDER_PROFILE.riderName}</strong>
            <p className="section-copy">骑手评分 {RIDER_PROFILE.riderRating} · {status.stageLabel}</p>
          </div>
        </div>
        <div className="countdown-card">
          <p className="section-label">预计送达</p>
          <strong className="countdown-time">还剩 {status.remainingMinutes} 分钟</strong>
          <p className="countdown-seconds">{formatCountdown(remainingSeconds)}</p>
          <p className="section-copy">预计 {status.remainingMinutes} 分钟</p>
          <p className="section-copy">{status.routeStatus}</p>
          <div className="waiting-progress-strip" aria-hidden="true">
            <div className="waiting-progress-strip__fill" style={{ width: `${Math.round(status.progress * 100)}%` }} />
          </div>
        </div>
        <div className="section-block waiting-delivery-grid">
          <div className="waiting-delivery-tile">
            <p className="section-label">骑手距你还有</p>
            <strong>{status.remainingDistanceKm} km</strong>
          </div>
          <div className="waiting-delivery-tile">
            <p className="section-label">当前阶段</p>
            <strong>{status.stageLabel}</strong>
          </div>
        </div>
        <div className="section-block">
          <p className="section-label">送达地址</p>
          <strong>{waitingOrder?.addressLine}</strong>
          <p className="section-copy">{waitingOrder?.addressLabel} · 备注：{waitingOrder?.remark}</p>
        </div>
        <div className="section-block waiting-map-card">
          <div className="section-heading">
            <h2>配送路线</h2>
            <span className="tag-pill">{Math.round(status.progress * 100)}%</span>
          </div>
          <div className="waiting-map">
            <div className="waiting-map__grid" />
            <div className="waiting-map__scan" />
            <div className="waiting-map__glow waiting-map__glow--a" />
            <div className="waiting-map__glow waiting-map__glow--b" />
            <div className="waiting-map__line waiting-map__line--main" />
            <div className="waiting-map__line waiting-map__line--branch" />
            <div className="waiting-map__pulse waiting-map__pulse--start" />
            <div className="waiting-map__pulse waiting-map__pulse--end" />
            <div className="waiting-map__pulse waiting-map__pulse--rider" style={{ left: riderLeft }} />
            <div className="waiting-map__marker waiting-map__marker--start">商家</div>
            <div className="waiting-map__marker waiting-map__marker--rider" style={{ left: riderLeft }}>
              骑手
            </div>
            <div className="waiting-map__marker waiting-map__marker--end">你的位置</div>
            <div className="waiting-map__eta-card">
              <span>预计 {status.remainingMinutes} 分钟</span>
              <strong>{status.remainingDistanceKm} km</strong>
            </div>
          </div>
          <div className="waiting-route-list">
            {waitingOrder?.routeStops.map((stop) => (
              <div key={stop.id} className={`waiting-route-stop waiting-route-stop--${stop.status}`}>
                <span>{stop.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  function renderResult(resultState: ResultState | null) {
    if (!resultState) {
      return null
    }

    return (
      <section className="flow-screen">
        <div className="section-block success-card">
          <h2>今晚成功拦住了这单</h2>
          <p className="section-copy">你完成了一次“像点外卖一样”的冲动过渡，但没有真的下单。</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><span>本次少吃</span><strong>{resultState.avoidedCalories} kcal</strong></div>
          <div className="stat-card"><span>本次省下</span><strong>{formatPrice(resultState.savedAmount)}</strong></div>
          <div className="stat-card"><span>等待时长</span><strong>{resultState.waitedSeconds}s</strong></div>
          <div className="stat-card"><span>连续守住</span><strong>{progress.streakDays} 天</strong></div>
        </div>
        <div className="section-block">
          <p className="section-label">累计战绩</p>
          <div className="summary-list">
            <div className="summary-row"><span>累计拦截</span><strong>{progress.totalInterceptedOrders} 单</strong></div>
            <div className="summary-row"><span>累计少吃</span><strong>{progress.totalAvoidedCalories} kcal</strong></div>
            <div className="summary-row"><span>累计省下</span><strong>{formatPrice(progress.totalSavedAmount)}</strong></div>
          </div>
        </div>
        <button type="button" className="primary-button primary-button--block" onClick={() => setScreen({ name: 'home' })}>
          再逛一圈
        </button>
      </section>
    )
  }

  return (
    <div className="app-shell">
      {screen.name === 'welcome' ? renderWelcome() : null}
      {screen.name === 'home' ? renderHome() : null}
      {screen.name === 'categories' ? renderCategories() : null}
      {screen.name === 'profile' ? renderProfile() : null}
      {screen.name === 'merchant' ? renderMerchant() : null}
      {screen.name === 'checkout' ? renderCheckout() : null}
      {screen.name === 'mock-pay' ? renderMockPay() : null}
      {screen.name === 'waiting' ? renderWaiting() : null}
      {screen.name === 'result' ? renderResult(resultScreenState) : null}

      {selectedProduct ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={selectedProduct.product.name} onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null) }}>
          <div className="modal-card modal-card--product">
            <div className="modal-card__scroll">
              <div className="modal-card__header">
                <h3>{selectedProduct.product.name}</h3>
                <p>{selectedProduct.product.description}</p>
              </div>
              {selectedProduct.product.options?.map((option) => {
                const currentChoices = selectedProduct.selectedChoices[option.id] ?? []
                const isMulti = option.multiSelect === true
                return (
                  <div key={option.id} className="option-group">
                    <p className="option-group__name">
                      {option.name}
                      {isMulti ? <span className="option-group__hint">可多选</span> : <span className="option-group__hint">必选</span>}
                    </p>
                    <div className="option-group__choices">
                      {option.choices.map((choice) => {
                        const isSelected = currentChoices.includes(choice.label)
                        return (
                          <button
                            key={choice.label}
                            type="button"
                            className={isSelected ? 'option-choice option-choice--active' : 'option-choice'}
                            onClick={() => {
                              setSelectedProduct((prev) => {
                                if (!prev) return prev
                                const prevChoices = prev.selectedChoices[option.id] ?? []
                                let nextChoices: string[]
                                if (isMulti) {
                                  if (choice.label === option.choices[0].label) {
                                    // "不加" / first choice clears everything
                                    nextChoices = [choice.label]
                                  } else if (prevChoices.includes(choice.label)) {
                                    // toggle off
                                    nextChoices = prevChoices.filter((l) => l !== choice.label && l !== option.choices[0].label)
                                    if (nextChoices.length === 0) nextChoices = [option.choices[0].label]
                                  } else {
                                    // toggle on, remove "不加"
                                    nextChoices = [...prevChoices.filter((l) => l !== option.choices[0].label), choice.label]
                                  }
                                } else {
                                  nextChoices = [choice.label]
                                }
                                return {
                                  ...prev,
                                  selectedChoices: { ...prev.selectedChoices, [option.id]: nextChoices },
                                }
                              })
                            }}
                          >
                            {choice.label}
                            {choice.priceDelta > 0 ? ` +${formatPrice(choice.priceDelta)}` : ''}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {(() => {
              const product = selectedProduct.product
              const selectedOptions: SelectedOption[] = product.options
                ? product.options.flatMap((opt) =>
                    (selectedProduct.selectedChoices[opt.id] ?? []).map((label) => ({
                      optionId: opt.id,
                      choiceLabel: label,
                    })),
                  )
                : []
              const priceDelta = getProductOptionPriceDelta(product, selectedOptions)
              const unitPrice = product.price + priceDelta
              const totalPrice = unitPrice * selectedProduct.quantity
              const allOptionsSelected = product.options?.every((opt) => (selectedProduct.selectedChoices[opt.id] ?? []).length > 0) ?? true
              return (
                <div className="modal-actions modal-actions--sticky">
                  <div className="modal-actions__left">
                    <div className="stepper">
                      <button
                        type="button"
                        className="secondary-button stepper__button"
                        aria-label="减少数量"
                        disabled={selectedProduct.quantity <= 1}
                        onClick={() => setSelectedProduct((prev) => prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : prev)}
                      >
                        -
                      </button>
                      <span className="stepper__value">{selectedProduct.quantity}</span>
                      <button
                        type="button"
                        className="secondary-button stepper__button"
                        aria-label="增加数量"
                        onClick={() => setSelectedProduct((prev) => prev ? { ...prev, quantity: prev.quantity + 1 } : prev)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="primary-button modal-actions__add"
                    disabled={!allOptionsSelected}
                    onClick={() => {
                      handleAddProduct(selectedProduct.merchant, selectedProduct.product, selectedOptions.length > 0 ? selectedOptions : undefined, selectedProduct.quantity)
                      setSelectedProduct(null)
                    }}
                  >
                    {allOptionsSelected ? `加入购物车 · ${formatPrice(totalPrice)}` : '请选择规格'}
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      ) : null}

      {cart.length > 0 && shouldShowCartBar(screen) ? (
        <footer className="cart-bar">
          <div>
            <p className="cart-bar__count">已选 {getCartItemCount(cart)} 件</p>
            <strong>{formatPrice(getCartSubtotal(cart))}</strong>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={handleOpenCheckout}
          >
            去结算
          </button>
        </footer>
      ) : null}

      {shouldShowTabBar(screen) ? renderBottomTabBar() : null}
    </div>
  )
}

export default App
