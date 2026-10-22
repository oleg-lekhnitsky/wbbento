import type { Ref } from 'vue'

/** Measure at the preset size, then shrink without splitting words. */
export function useFittedCopy(root: Ref<HTMLElement | undefined>, content: () => unknown) {
  let observer: ResizeObserver | undefined
  let frame = 0
  let disposed = false
  const fit = () => {
    const canvas = root.value
    if (!canvas) return
    for (const heading of canvas.querySelectorAll<HTMLElement>('.headline h2, .benefit h3')) {
      heading.style.removeProperty('font-size')
      const tile = heading.closest<HTMLElement>('.tile')!
      const group = heading.closest<HTMLElement>('.headline-copy')
      if (!tile.clientWidth || !tile.clientHeight) continue
      const style = getComputedStyle(heading)
      const tileStyle = getComputedStyle(tile)
      const number = (value: string) => parseFloat(value) || 0
      const base = number(style.fontSize)
      const lineRatio = number(style.lineHeight) / base || 1.02
      let available: number
      if (style.position === 'absolute') {
        // Fixed Figma positions define a text region, not the whole card.
        const top = heading.offsetTop
        let bottom = tile.clientHeight - number(tileStyle.paddingBottom)
        for (const sibling of Array.from(tile.children).flatMap(el => el === group ? Array.from(el.children) : [el])) {
          if (sibling === heading || !(sibling instanceof HTMLElement)) continue
          const siblingStyle = getComputedStyle(sibling)
          if (siblingStyle.display === 'none' || siblingStyle.position !== 'absolute') continue
          if (sibling.offsetTop > top) {
            const gap = Math.max(2, number(siblingStyle.fontSize) * .4)
            bottom = Math.min(bottom, sibling.offsetTop - gap)
          }
        }
        available = bottom - top
      } else {
        available = tile.clientHeight - number(tileStyle.paddingTop) - number(tileStyle.paddingBottom)
        for (const sibling of Array.from(tile.children).flatMap(el => el === group ? Array.from(el.children) : [el])) {
          if (sibling === heading || !(sibling instanceof HTMLElement)) continue
          const siblingStyle = getComputedStyle(sibling)
          if (siblingStyle.display === 'none' || ['absolute', 'fixed'].includes(siblingStyle.position)) continue
          available -= sibling.getBoundingClientRect().height + number(siblingStyle.marginTop) + number(siblingStyle.marginBottom)
        }
        available -= number(style.marginTop) + number(style.marginBottom)
        if (group && group.children.length > 1) available -= number(getComputedStyle(group).rowGap)
      }
      const width = heading.getBoundingClientRect().width
      if (width <= 0 || available <= 0) continue
      const probe = heading.cloneNode(true) as HTMLElement
      Object.assign(probe.style, {
        position: 'fixed', visibility: 'hidden', pointerEvents: 'none',
        width: `${width}px`, maxWidth: 'none', height: 'auto', minHeight: '0',
        maxHeight: 'none', margin: '0', padding: '0', border: '0',
        fontFamily: style.fontFamily, fontWeight: style.fontWeight,
        fontStyle: style.fontStyle, letterSpacing: style.letterSpacing,
        whiteSpace: 'pre-wrap', overflowWrap: 'normal', wordBreak: 'normal',
        fontSynthesis: 'none', left: '-100000px', top: '0',
      })
      document.body.appendChild(probe)
      const fits = (size: number) => {
        probe.style.fontSize = `${size}px`
        probe.style.lineHeight = `${size * lineRatio}px`
        return probe.scrollWidth <= width + 0.5 && probe.getBoundingClientRect().height <= available + 0.5
      }
      let low = Math.min(1, base), high = base
      if (!fits(base)) {
        for (let i = 0; i < 16; i++) {
          const middle = (low + high) / 2
          if (fits(middle)) low = middle
          else high = middle
        }
        heading.style.fontSize = `${Math.floor(low * 100) / 100}px`
      }
      probe.remove()
    }
  }
  const schedule = () => {
    if (disposed) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(fit)
  }
  watch(content, schedule, { deep: true, flush: 'post' })
  onMounted(() => {
    observer = new ResizeObserver(schedule)
    if (root.value) {
      observer.observe(root.value)
      root.value.querySelectorAll('.headline, .benefit').forEach(tile => observer!.observe(tile))
    }
    document.fonts.ready.then(schedule)
    document.fonts.addEventListener('loadingdone', schedule)
    schedule()
  })
  onBeforeUnmount(() => {
    disposed = true
    cancelAnimationFrame(frame)
    observer?.disconnect()
    document.fonts.removeEventListener('loadingdone', schedule)
  })
  return fit
}
