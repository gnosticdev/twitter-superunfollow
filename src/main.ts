import { addSuperUnfollowButton } from './add-elements'
import { processProfiles, getProfileDetails } from './profiles'
import { addSearchDialog } from './search'
import {
    waitForElement,
    getFollowingMap,
    getUnfollowList,
    inifiniteScrollDown,
    prettyConsole,
    delay,
} from './utils'

export type FollowingUser = {
    handle: string
    username: string
    description?: string
}

export const __SU__ = {
    collectedFollowing: true,
    followingMap: new Map<string, FollowingUser>(),
    unfollowList: new Set<string>(),
    totalUnfollowed: 0,
}

export const PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]'
/**
 * Scrolls down the page collecting a list of all profiles
 */
export async function getFollowingAutoScroll(): Promise<
    Map<string, FollowingUser> | undefined
> {
    try {
        let followingMap = getFollowingMap()
        if (__SU__.collectedFollowing && followingMap.size > 0) {
            return followingMap
        }
        const isDone = await inifiniteScrollDown()
        if (isDone) {
            console.log('followingMap', followingMap)
            console.log('done scrolling')
            __SU__.collectedFollowing = true
            followingMap = getFollowingMap()
            return followingMap
        } else {
            return await getFollowingAutoScroll()
        }
    } catch (error) {
        console.error(error)
    }
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(async (node) => {
                if (node instanceof HTMLElement) {
                    const profile = node.querySelector(
                        '[data-testid="UserCell"]'
                    ) as HTMLElement | null
                    if (node.matches(PROFILES_SIBLINGS) && profile) {
                        await processProfiles(profile)
                    }
                }
            })
        }
    })
})

// add mutation observer and run watcher for new nodes
observer.observe(document.body, {
    childList: true,
    subtree: true,
})

export function superUnfollow() {
    prettyConsole('starting superUnfollow')
    window.scrollTo(0, 0)
    const anchor = document.getElementById('superUnfollow-anchor')
    if (!anchor) {
        return
    }
    const profiles = document.querySelectorAll(
        '[data-unfollow="true"]'
    ) as NodeListOf<HTMLElement> | null

    if (!profiles) {
        return
    }

    let unfollowList = getUnfollowList()

    profiles.forEach(async (profile) => {
        // click the unfollow button
        const unfollowButton = profile.querySelector(
            '[data-testid *= "unfollow"]'
        ) as HTMLButtonElement
        if (unfollowButton) {
            unfollowButton.click()
            // blue and gray out unfollowed profiles
            profile.style.filter = 'blur(1px) grayscale(100%) brightness(0.5)'
        }
        const { handle } = await getProfileDetails(profile)
        if (!handle) throw 'no handle for profile'
        // unfollow confirmation button

        unfollowList = await unfollow(handle)
    })
    // if there are still profiles in the unfollowList, scroll one page down and repeat
    if (unfollowList.size > 0) {
        inifiniteScrollDown().then((isBottom) => {
            if (isBottom) {
                console.log('done unfollowing')
                return
            }
            superUnfollow()
        })
    }
}

const unfollow = async (handle: string) => {
    await delay(500)
    const confirmUnfollow = await waitForElement(
        '[data-testid="confirmationSheetConfirm"]'
    )

    const unfollowList = getUnfollowList()

    if (confirmUnfollow) {
        await delay(500)
        confirmUnfollow.click()
        // remove profile from unfollowList
        unfollowList.delete(handle)
        __SU__.totalUnfollowed++
    }

    return unfollowList
}

// Wait for message from TamperMonkey, abort after received
window.addEventListener(
    'startRunning',
    async function () {
        try {
            const count =
                document.getElementById('su-following-count')?.dataset
                    .followingCount
            if (!count) {
                throw 'no following count found'
            }
            addSearchDialog()
            const unfollowList = getUnfollowList()
            if (unfollowList.size > 0) {
                addSuperUnfollowButton()
            }
        } catch (err) {
            console.error(err)
        }
    },
    { once: true }
)

// Send message to Tampermonkey, which will send back a message and trigger the listener above
window.postMessage('startRunning', '*')

export {}
