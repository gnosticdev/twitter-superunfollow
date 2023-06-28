import { Selectors } from '../shared/shared'
import { $unfollowing } from '../storage/persistent'
import { $collectFollowingState } from '../storage/collection'
import { $superUnfollowButtonState } from '../storage/unfollowing'

export const delay = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
/**
 * Brings the last child to the top of the page, triggering the loading of the next section of profiles
 * @param {number} delayMS - number of milliseconds to wait before scrolling down
 * @returns {boolean} - returns true if the end of the following section has been reached, false if not
 */
export async function scrollDownFollowingPage(delayMS = 3000) {
    // container holding all of the following profiles
    const followingSection = document.querySelector(
        Selectors.FOLLOWING_CONTAINER
    ) as HTMLElement
    const lastChildHeight = getLastChildHeight()
    const scrollHeightBefore = followingSection.scrollHeight

    if (
        $collectFollowingState.get() === 'stopped' ||
        $superUnfollowButtonState.get() === 'stopped'
    ) {
        console.log('stopping scroll down')
        return true
    }
    // scroll down the page
    window.scrollTo({
        top: lastChildHeight,
        behavior: 'smooth',
    })

    await delay(delayMS) // wait for new content to load

    const newScrollHeight = followingSection.scrollHeight
    console.log(
        `%c scrolling down: lastHeight: ${lastChildHeight}, newHeight: ${newScrollHeight}`,
        'color: dodgerblue;'
    )
    if (newScrollHeight === scrollHeightBefore) {
        return true // Reached the end of the document
    } else {
        return false // Not yet at the end of the document
    }
}

/**
 * Gets the scroll height of the last profile div on the following page, which is used to determine how far down the page to scroll and trigger the loading of more profiles
 */
export const getLastChildHeight = () => {
    const lastChild = document.querySelector(
        Selectors.PROFILE_CONTAINER + ':last-child'
    ) as ProfileContainer
    const translateY = getScrollHeight(lastChild)

    return translateY
}

/**
 * Each profile has a 'transform: translateY()' style applied to it. This function extracts the scroll height from that style and returns it
 * @param profileContainer  - the profile div from the following page
 * @returns {number} - the scroll height (distance down the page) of the profile div
 */
export const getScrollHeight = (profileContainer: ProfileContainer) => {
    const translateYString = profileContainer.style.transform
    const translateYRegex = /translateY\((\d+(\.\d+)?)px\)/
    const match = translateYRegex.exec(translateYString)
    const translateY = match ? parseFloat(match[1]) : 0

    return translateY
}

/**
 * Updates the unfollow button with the number of users selected
 */
export const setButtonText = () => {
    const button = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement
    const { size } = $unfollowing.get()
    if (size > 0) {
        button.classList.add('active')
        button.innerText = `SuperUnfollow ${size} Accounts`
    } else {
        button.classList.remove('active')
        button.innerText = 'No Accounts Selected'
    }
}

export function waitForElement(
    selector: string,
    timeout = 5000,
    label = selector
): Promise<HTMLElement | null> {
    return new Promise(function (resolve, reject) {
        const element = document.querySelector(selector) as HTMLElement
        if (element) {
            resolve(element)
            return
        }
        const observer = new MutationObserver(function (records) {
            records.forEach(function (mutation) {
                const nodes = Array.from(mutation.addedNodes)
                nodes.forEach(function (node) {
                    if (node instanceof HTMLElement) {
                        const innerElement = node.querySelector(
                            selector
                        ) as HTMLElement
                        // success if the element itself matches the selector, or if an inner element matches the selector
                        if (node.matches(selector) || innerElement) {
                            prettyConsole('Found ' + label, 'green')

                            observer.disconnect()
                            resolve(
                                node.matches(selector) ? node : innerElement
                            )
                        }
                    }
                })
            })
            // disconnect after
            setTimeout(function () {
                observer.disconnect()
                reject(new Error(selector + ' -> not found after 4 seconds'))
            }, timeout)
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })
    })
}

export const prettyConsole = (
    message: string,
    color?: 'blue' | 'red' | 'green',
    object?: any
) => {
    color = color ?? 'blue'
    message = `%c🏄‍♂️ SuperUnfollow: %c${message}`
    const messageStyle = {
        blue: 'color: dodgerblue;',
        red: 'color: coral;',
        green: 'color: lightgreen;',
    }

    const titleStyle =
        'color: mediumpurple; font-variant-caps: petite-caps; font-size: 1.1rem;'
    const logArgs = object
        ? [message, titleStyle, messageStyle[color], object]
        : [message, titleStyle, messageStyle[color]]
    console.log(...logArgs)
}
