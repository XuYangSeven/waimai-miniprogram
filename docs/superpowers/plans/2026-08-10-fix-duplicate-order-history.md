# Fix Duplicate Order History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure a completed mock order is written to order history exactly once, even if the waiting-screen completion effect re-runs around the countdown boundary.

**Architecture:** Keep the current waiting-screen flow in `src/App.tsx`, but extract the order-completion side effects into a single completion path guarded by an idempotency check tied to the current `waitingOrder`. The fix should make “complete this waiting order” a one-time action while preserving existing progress, result-screen, and localStorage behavior.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, localStorage

## Global Constraints

- Follow TDD: no production code before a failing test.
- Keep the fix scoped to the duplicate-history bug; do not do unrelated refactors.
- Preserve the existing waiting flow UI, result screen copy, progress updates, and storage keys.
- Keep the implementation aligned with existing code style in `src/App.tsx` and `src/App.test.tsx`.

---

## File Structure

- Modify `src/App.test.tsx`
  - Add a regression test that proves one completed order yields one history entry.
  - Keep the test focused on the user-visible bug: one checkout flow should not create two history records.
- Modify `src/App.tsx`
  - Extract the waiting-order completion logic from the countdown timer callback into a single helper.
  - Add a one-time completion guard for the active `waitingOrder` so duplicate history writes cannot happen.
  - Preserve all existing side effects (result screen, progress stats, order history, cart clearing, waiting order clearing).

### Task 1: Reproduce the duplicate history bug with a failing regression test

**Files:**
- Modify: `src/App.test.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: existing `App` render flow, existing localStorage keys `introKey`, `orderHistoryKey`, and `waitingOrderKey`
- Produces: a failing regression test proving exactly one history entry is created for one completed order

- [ ] **Step 1: Write the failing test**

Add this test near the existing order-history and waiting-flow tests in `src/App.test.tsx`:

```tsx
  it('adds exactly one history entry after completing a single order', async () => {
    const user = userEvent.setup()

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T20:00:00Z'))

    render(<App />)
    await user.click(screen.getByRole('button', { name: /深夜脆脆炸鸡屋/ }))
    await user.click(screen.getByRole('button', { name: '加入购物车（¥32）' }))
    await user.click(screen.getByRole('button', { name: '去结算' }))
    await user.type(screen.getByLabelText('详细地址'), '福田区深南大道 1008 号 9 楼')
    await user.click(screen.getByRole('button', { name: '确认并进入模拟支付' }))
    await user.click(screen.getByRole('button', { name: '确认模拟支付' }))

    expect(screen.getByText('等待配送中')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(7_000)
    })

    expect(screen.getByText('今晚成功拦住了这单')).toBeInTheDocument()

    cleanup()
    render(<App />)
    await userEvent.setup().click(screen.getByRole('button', { name: '我的' }))

    const historySection = screen.getByRole('region', { name: '历史订单' })
    expect(within(historySection).getAllByText('深夜脆脆炸鸡屋')).toHaveLength(1)

    const storedHistory = JSON.parse(window.localStorage.getItem(orderHistoryKey) ?? '[]')
    expect(storedHistory).toHaveLength(1)
    expect(storedHistory[0]).toMatchObject({
      merchantName: '深夜脆脆炸鸡屋',
      addressLine: '福田区深南大道 1008 号 9 楼',
      totalItems: 1,
    })
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx -t "adds exactly one history entry after completing a single order"
```

Expected: FAIL because the completed order is recorded twice, so the section or stored history length is `2` instead of `1`.

- [ ] **Step 3: Verify the failure is the right one**

Confirm the failure is specifically about duplicate history entries, not about:

- missing `历史订单` region
- navigation not reaching the profile tab
- timing not reaching the result screen

If the test fails for one of those reasons, fix the test setup before touching production code.

- [ ] **Step 4: Commit the red test**

```bash
git add src/App.test.tsx
git commit -m "test: reproduce duplicate order history entry"
```

### Task 2: Make waiting-order completion idempotent

**Files:**
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `WaitingOrder`, `buildOrderHistoryItem(...)`, `buildResultStats(...)`, `calculatePricing(...)`, `setOrderHistory(...)`, `setProgress(...)`, `setResult(...)`, `setWaitingOrder(...)`, `setCart(...)`, `setScreen(...)`
- Produces:
  - `completeWaitingOrder(order: WaitingOrder): void`
  - a one-time completion guard that prevents the same waiting order from being processed twice

- [ ] **Step 1: Add `useRef` import for the completion guard**

Change the React import at the top of `src/App.tsx` from:

```tsx
import { useEffect, useMemo, useState } from 'react'
```

to:

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
```

- [ ] **Step 2: Add a ref that tracks the waiting order currently being completed**

In `App()`, near the other state declarations, add:

```tsx
  const completedWaitingOrderRef = useRef<string | null>(null)
```

- [ ] **Step 3: Add a stable key builder for a waiting order**

Place this helper near the other top-level helper functions in `src/App.tsx`:

```tsx
function getWaitingOrderCompletionKey(order: WaitingOrder) {
  return [
    order.startedAt,
    order.merchantName,
    order.addressLine,
    order.totalSeconds,
  ].join('::')
}
```

- [ ] **Step 4: Reset the completion guard when a different waiting order arrives or waiting clears**

Add this effect inside `App()` after the `remainingSeconds` state setup and before the waiting countdown effect:

```tsx
  useEffect(() => {
    if (!waitingOrder) {
      completedWaitingOrderRef.current = null
      return
    }

    const nextKey = getWaitingOrderCompletionKey(waitingOrder)

    if (completedWaitingOrderRef.current !== nextKey) {
      completedWaitingOrderRef.current = null
    }
  }, [waitingOrder])
```

- [ ] **Step 5: Extract the order-completion side effects into a helper**

Inside `App()`, above the waiting countdown effect, add:

```tsx
  function completeWaitingOrder(order: WaitingOrder) {
    const nextOrderHistoryItem = buildOrderHistoryItem({
      cart,
      merchantName: order.merchantName,
      addressLabel: order.addressLabel,
      addressLine: order.addressLine,
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
      deliveryFee: cart[0]?.merchantId
        ? (mockMerchants.find((merchant) => merchant.id === cart[0].merchantId)?.deliveryFee ?? 0)
        : 0,
      waitedSeconds: order.totalSeconds,
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
  }
```

- [ ] **Step 6: Guard the helper so the same waiting order completes only once**

At the top of `completeWaitingOrder(order)`, add:

```tsx
    const completionKey = getWaitingOrderCompletionKey(order)

    if (completedWaitingOrderRef.current === completionKey) {
      return
    }

    completedWaitingOrderRef.current = completionKey
```

The full beginning of the function should read:

```tsx
  function completeWaitingOrder(order: WaitingOrder) {
    const completionKey = getWaitingOrderCompletionKey(order)

    if (completedWaitingOrderRef.current === completionKey) {
      return
    }

    completedWaitingOrderRef.current = completionKey

    const nextOrderHistoryItem = buildOrderHistoryItem({
      // existing body continues...
```

- [ ] **Step 7: Replace the inline completion block in the timer callback**

In the waiting countdown effect, replace this block:

```tsx
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
```

with:

```tsx
        window.clearInterval(timer)
        completeWaitingOrder(waitingOrder)
```

- [ ] **Step 8: Run the focused regression test**

Run:

```bash
npm test -- src/App.test.tsx -t "adds exactly one history entry after completing a single order"
```

Expected: PASS

- [ ] **Step 9: Run the broader waiting/history tests**

Run:

```bash
npm test -- src/App.test.tsx -t "order history|waiting flow|updated today intercepted stats"
```

Expected: PASS, confirming the fix did not break the result screen, stats, or history rendering.

- [ ] **Step 10: Commit the fix**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "fix: prevent duplicate order history entries"
```

### Task 3: Final verification

**Files:**
- Modify: none
- Test: `src/App.test.tsx`, full Vitest suite

**Interfaces:**
- Consumes: completed implementation from Tasks 1-2
- Produces: verified green test suite for the bug fix

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: PASS with the full suite green.

- [ ] **Step 2: Manually verify the stored history shape in the browser path**

Run the app and complete one order. In DevTools, inspect localStorage key `tonight-not-delivered-order-history`.

Expected value shape:

```json
[
  {
    "merchantName": "深夜脆脆炸鸡屋",
    "addressLine": "福田区深南大道 1008 号 9 楼",
    "totalItems": 1
  }
]
```

The array should contain exactly one newly added object for one completed order.

- [ ] **Step 3: Commit if the manual verification required any tiny follow-up adjustment**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "test: verify duplicate order history fix"
```

If no follow-up adjustment was needed after `npm test`, skip this commit.
