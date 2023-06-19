import { FollowingUser } from './main'

// scroll down the page every 1 second until the bottom is reached
export async function inifiniteScrollDown(delayMS = 3000) {
    let lastHeight = document.body.scrollHeight
    window.scrollTo(0, lastHeight)
    await delay(delayMS) // wait for new content to load

    let newHeight = document.body.scrollHeight
    console.log(
        `%c scrolling down: lastHeight: ${lastHeight}, newHeight: ${newHeight}`,
        `color: var(--su-green);`
    )
    if (newHeight === lastHeight) {
        return true // Reached the end of the document
    } else {
        return false // Not yet at the end of the document
    }
}

/** Updates the following map in local storage
 *  @param {Map<string, FollowingUser>} followingMap - map of usernames to FollowingUser objects
 * */
export const updateFollowing = (followingMap: Map<string, FollowingUser>) => {
    localStorage.setItem(
        'followingMap',
        JSON.stringify(Array.from(followingMap.entries()))
    )
}

/**
 * Updates the unfollow list in local storage
 * @param {Set<string>} unfollowList - set of usernames to unfollow
 */
export const updateUnfollowing = (unfollowList: Set<string>) => {
    localStorage.setItem(
        'unfollowList',
        JSON.stringify(Array.from(unfollowList))
    )
}

/**
 * Gets the following map from local storage
 * @returns {Promise<Map<string, FollowingUser> | null>} followingMap - map of usernames to FollowingUser objects
 */
export const getFollowingMap = () => {
    // retrieve from local storage as string, then parse to get the map
    const followingMapString = localStorage.getItem('followingMap')
    if (!followingMapString) {
        return new Map<string, FollowingUser>()
    }
    const followingMap = new Map<string, FollowingUser>(
        JSON.parse(followingMapString)
    )
    return followingMap
}

/**
 * Gets the unfollow list from local storage
 * @returns {Promise<Set<string> | null>} unfollowList - set of usernames to unfollow
 */
export const getUnfollowList = () => {
    // retrieve from local storage as string, then parse to get the map
    const unfollowListString = localStorage.getItem('unfollowList')
    if (!unfollowListString) {
        return new Set<string>()
    }
    const unfollowList = new Set<string>(JSON.parse(unfollowListString))
    return unfollowList
}

// setTimeout function
let timeout: number | undefined
export const debounce = (func: Function, wait: number) => {
    return function executedFunction(...args: string[]) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

export function prettyConsole(
    message: string,
    object: Element | Record<string, any> | null = null
) {
    const error = new Error()
    const lineNumber = error.stack?.split('\n')[2].split(':')[2]
    const functionName = error.stack?.split('\n')[2].split(' ')[5]
    const style =
        'color: hsl(350, 79%, 74%); background-color: hsl(219, 100%, 39%); font-weight: bold; font-size: 1; padding: 5px;'
    if (object) {
        console.log(
            `%c ${message} %c ${functionName}():${lineNumber}`,
            style,
            'color: hsl(70, 16.20%, 71.00%); font-size: 10px; padding: 5px;'
        )
        console.log(object)
    } else {
        console.log(
            `%c ${message} %c ${functionName}():${lineNumber}`,
            style,
            'color: hsl(70, 16.20%, 71.00%); font-size: 10px; padding: 5px;'
        )
    }
}

export function isJsonString(str: string) {
    try {
        JSON.parse(str)
    } catch (e) {
        return false
    }
    return true
}

export function waitForElement(
    selector: string,
    timout = 4000
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
                console.log('mutation nodes', 'yellow', nodes)
                nodes.forEach(function (node) {
                    if (node instanceof HTMLElement) {
                        const innerElement = node.querySelector(
                            selector
                        ) as HTMLElement
                        if (node.matches(selector) || innerElement) {
                            console.log(selector + ' -> found')
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

export function delay(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
