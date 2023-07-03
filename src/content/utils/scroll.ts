import { Selectors } from '@/shared/shared'
import { getLastChildHeight, delay } from './utils'

/**
 * Brings the last child to the top of the page, triggering the loading of the next section of profiles
 * @param {number} delayMS - number of milliseconds to wait before scrolling down
 * @returns {boolean} - returns true if the end of the following section has been reached, false if not
 */
export async function scrollDownFollowingPage(): Promise<boolean> {
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
    // delay a random number from 2000 - 3000 ms
    const delayMS = Math.floor(Math.random() * 3000) + 4000
    await delay(delayMS)

    const newScrollHeight = document.scrollingElement?.scrollTop
    const newLastChildHeight = getLastChildHeight()
    console.table({
        scrollHeightBefore,
        newScrollHeight,
        lastChildHeight,
        newLastChildHeight,
    })
    if (newScrollHeight === scrollHeightBefore) {
        console.log(
            'scrollHeightBefore === newScrollHeight, stopping scroll down...'
        )
        return true // Reached the end of the document
    } else {
        return false // Not yet at the end of the document
    }
}

export const getFollowingContainer = () =>
    document.querySelector(Selectors.FOLLOWING_CONTAINER) as HTMLElement

export const disableScroll = () => {
    window.addEventListener('wheel', preventDefault, { passive: false })
    window.addEventListener('touchmove', preventDefault, { passive: false })
}

export const enableScroll = () => {
    window.removeEventListener('wheel', preventDefault)
    window.removeEventListener('touchmove', preventDefault)
}

export const preventDefault = (e: Event) => {
    e.preventDefault()
}
