import { Selectors, getProfileTranslateY } from '@/content/utils/ui-elements'
import type { ProfileContainer, ProfileDetail } from '@/shared/types'
import { getLastChildHeight, randomDelay } from './ui-elements'

/**
 * scrolls to the top of the page and waits for the scroll to complete
 * @param {number} top - the top distance to scroll to
 * @returns {Promise<boolean>} true if the top has been reached
 */
export async function waitForScrollTo(top: number) {
	return new Promise<boolean>((resolve) => {
		window.scrollTo({
			top,
			behavior: 'smooth',
		})
		const MAX_WAIT = 5_000
		const INTERVAL = 100
		let waited = 0
		const interval = setInterval(() => {
			if (window.scrollY === top) {
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
 * @returns {boolean} - returns true if the end of the following section has been reached, false if not
 */
export async function scrollToLastChild() {
	// use the translate property within the profile container to get height of last profile
	const lastChildHeight = getLastChildHeight()
	const scrollHeightBefore = document.scrollingElement?.scrollTop
	// scroll down the page
	window.scrollTo({
		top: lastChildHeight,
		behavior: 'smooth',
	})
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

export async function scrollToProfile(profileDetails: ProfileDetail) {
	// check if the profile is already visible
	const profile = document.querySelector(
		`[data-handle="${profileDetails.handle}"]`,
	) as HTMLElement
	if (profile) {
		return profile
	}
	// scroll to the profile if not in DOM
	const lastChildHeight = getLastChildHeight()
	const firstChildHeight = getProfileTranslateY(
		document.querySelector(Selectors.PROFILE_CONTAINER) as ProfileContainer,
	)
	const profileHeight = profileDetails.scrollHeight
	// if the profile is above the first child, scroll to the top of the page
	if (profileHeight < firstChildHeight) {
		await waitForScrollTo(0)
	}
	// if the profile is below the last child, scroll to the bottom of the page
	else if (profileHeight > lastChildHeight) {
		await waitForScrollTo(lastChildHeight)
	}
	// if the profile is between the first and last child, scroll to the profile
	else {
		await waitForScrollTo(profileHeight)
	}
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
