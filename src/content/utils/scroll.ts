import { getLastChildHeight, randomDelay } from './ui-elements'

/**
 * scrolls to a position on the page waits for the scroll to complete. If left blank scrolls to top of page.
 * @param {number} top - the top distance to scroll to
 * @default 0
 */
export async function waitForSmoothScroll(top = 0): Promise<boolean> {
	return new Promise<boolean>((resolve) => {
		window.scrollTo({
			top,
			behavior: 'smooth',
		})
		const MAX_WAIT = 5000
		const INTERVAL = 100
		const THRESHOLD = 100 // Define a threshold
		let waited = 0
		const interval = setInterval(() => {
			if (Math.abs(window.scrollY - top) <= THRESHOLD) {
				clearInterval(interval)
				resolve(true)
			} else if (waited >= MAX_WAIT) {
				clearInterval(interval)
				resolve(false)
			}
			waited += INTERVAL
		}, INTERVAL)
	})
}
/**
 * Brings the last child to the top of the page, triggering the loading of the next section of profiles
 * @returns true if the end of the page has been reached, false if not
 */
export async function scrollToInfiniteBottom(): Promise<boolean> {
	// use the translate property within the profile container to get height of last profile
	const lastChildHeight = getLastChildHeight()
	const scrollHeightBefore = document.scrollingElement?.scrollTop
	// scroll down the page
	window.scrollTo({
		top: lastChildHeight,
		behavior: 'smooth',
	})
	console.log('scrolled to last child', lastChildHeight)
	// wait for data to load and scroll to complete
	await randomDelay(1000, 2000)
	const newScrollHeight = document.scrollingElement?.scrollTop
	if (newScrollHeight === scrollHeightBefore) {
		console.log(
			'scrollHeightBefore === newScrollHeight, stopping scroll down...',
		)
		return true // Reached the end of the document
	}
	return false // Not yet at the end of the document
}

export function disableScroll() {
	window.addEventListener('wheel', preventDefault, { passive: false })
	window.addEventListener('touchmove', preventDefault, { passive: false })
}

export function enableScroll() {
	window.removeEventListener('wheel', preventDefault)
	window.removeEventListener('touchmove', preventDefault)
}

export function preventDefault(e: Event) {
	e.preventDefault()
}
