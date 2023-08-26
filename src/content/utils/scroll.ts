import { Selectors } from '@/content/utils/utils'
import { getLastChildHeight, randomDelay } from './utils'
import { disableCollectBtn } from '@/content/stores/collect-button'
import { enableDisableUnfollowBtn } from '@/content/stores/unfollow-button'
import { $unfollowing } from '@/content/stores/persistent'

/**
 * scrolls to the top of the page and waits for the scroll to complete
 * @param {number} top - the top distance to scroll to
 * @returns {Promise<boolean>} true if the top has been reached
 */
export async function waitForScrollTo(top: number) {
    return new Promise((resolve) => {
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
 * @param {number} delayMS - number of milliseconds to wait before scrolling down
 * @returns {boolean} - returns true if the end of the following section has been reached, false if not
 */
export async function scrollToLastChild(): Promise<boolean> {
    // NEED TO CHECK THIS BEFORE AND AFTER SCROLLING

    // use the translate property within the profile container to determine the height of the last profile
    const lastChildHeight = getLastChildHeight()
    const scrollHeightBefore = document.scrollingElement?.scrollTop

    // scroll down the page
    window.scrollTo({
        top: lastChildHeight,
        behavior: 'smooth',
    })

    // wait for data to load and scroll to complete
    await randomDelay(1000)

    const newScrollHeight = document.scrollingElement?.scrollTop
    if (newScrollHeight === scrollHeightBefore) {
        console.log(
            'scrollHeightBefore === newScrollHeight, stopping scroll down...'
        )
        return true // Reached the end of the document
    } else {
        return false // Not yet at the end of the document
    }
}

export const enableStuff = (running: 'unfollowing' | 'collecting') => {
    if (running === 'unfollowing') {
        disableCollectBtn(false)
        enableScroll()
    } else {
        enableDisableUnfollowBtn($unfollowing.get().size, undefined)
        enableScroll()
    }
}

export const disableStuff = (running: 'unfollowing' | 'collecting') => {
    if (running === 'unfollowing') {
        disableCollectBtn(true)
        disableScroll()
    } else {
        const unfollowBtn = document.getElementById(
            'superUnfollow-button'
        ) as HTMLButtonElement
        unfollowBtn.disabled = true
        disableScroll()
    }
}

export const getFollowingContainer = () =>
    document.querySelector(Selectors.FOLLOWING_CONTAINER) as HTMLElement

const disableScroll = () => {
    window.addEventListener('wheel', preventDefault, { passive: false })
    window.addEventListener('touchmove', preventDefault, { passive: false })
}

const enableScroll = () => {
    window.removeEventListener('wheel', preventDefault)
    window.removeEventListener('touchmove', preventDefault)
}

const preventDefault = (e: Event) => {
    e.preventDefault()
}
