import { ref, computed } from 'vue'
import { useSwipe } from '@vueuse/core'
import type { Ref } from 'vue'

interface SwipeActionOptions {
  threshold: number
  guard?: () => boolean
  onLeft?: () => void
  onRight?: () => void
}

export function useSwipeAction(target: Ref<HTMLElement | null>, options: SwipeActionOptions) {
  const { threshold, guard, onLeft, onRight } = options
  const MAX_FACTOR = 1.4

  const swipeOffset = ref(0)

  const { isSwiping, direction, lengthX } = useSwipe(target, {
    threshold: 10,
    onSwipe() {
      if (guard && !guard()) return
      if (direction.value === 'left' && onLeft) {
        swipeOffset.value = Math.max(-lengthX.value, -(threshold * MAX_FACTOR))
      } else if (direction.value === 'right' && onRight) {
        swipeOffset.value = Math.min(-lengthX.value, threshold * MAX_FACTOR)
      }
    },
    onSwipeEnd() {
      if (guard && !guard()) return
      if (swipeOffset.value <= -threshold) onLeft?.()
      else if (swipeOffset.value >= threshold) onRight?.()
      swipeOffset.value = 0
    },
  })

  const style = computed(() => ({
    transform: swipeOffset.value !== 0 ? `translateX(${swipeOffset.value}px)` : '',
    transition: isSwiping.value ? 'none' : 'transform 0.2s ease',
  }))

  const leftProgress  = computed(() => Math.max(0, Math.min(-swipeOffset.value / threshold, 1)))
  const rightProgress = computed(() => Math.max(0, Math.min( swipeOffset.value / threshold, 1)))

  return { isSwiping, style, leftProgress, rightProgress }
}
