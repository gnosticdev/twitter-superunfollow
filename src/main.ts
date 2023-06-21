import { addSuperUnfollowButton, updateUnfollowButton } from './add-elements'
import { processProfiles } from './profiles'
import { addSearchDialog } from './search'
import {
    waitForElement,
    getFollowingMap,
    getUnfollowList,
    scrollDownFollowingPage,
    prettyConsole,
    delay,
    updateUnfollowing,
    updateFollowing,
} from './utils'
import { atom } from 'nanostores'
import { $following, $unfollowing } from './stores'

export const $followingMap = atom(new Map<string, FollowingUser>())
export const $unfollowList = atom(getUnfollowList())
export const $totalUnfollowed = atom(0)
export const $collectedFollowing = atom(false)
export const $isRunning = atom(false)

// Subscriptions
$following.listen((following) => {
    updateFollowing(following)
})

$unfollowing.listen((unfollow) => {
    updateUnfollowing(unfollow)
    updateUnfollowButton()
})

export type FollowingUser = {
    handle: string
    username: string
    description?: string
}

export type FollowingUserMap = Map<string, FollowingUser>

export const PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]'
export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'
/**
 * Scrolls down the page collecting a list of all profiles
 */
export async function getFollowing(): Promise<FollowingUserMap | undefined> {
    try {
        let followingMap = getFollowingMap()
        if ($collectedFollowing && followingMap.size > 0) {
            return followingMap
        }
        const isDone = await scrollDownFollowingPage()
        if (isDone) {
            console.log('followingMap', followingMap)
            console.log('done scrolling')
            $collectedFollowing.set(true)
            followingMap = getFollowingMap()
            return followingMap
        } else {
            return await getFollowing()
        }
    } catch (error) {
        console.error(error)
    }
}

const profileObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(async (node) => {
                if (node instanceof HTMLElement) {
                    const profile = node.querySelector(
                        '[data-testid="UserCell"]'
                    ) as HTMLElement | null
                    if (node.matches(PROFILES_SIBLINGS) && profile) {
                        await processProfiles(profile)
                        if ($isRunning.get()) {
                            await superUnfollow()
                        }
                    }
                }
            })
        }
    })
})

// add mutation observer and run watcher for new nodes
profileObserver.observe(document.body, {
    childList: true,
    subtree: true,
})

let shouldCancel = false
let isRunning = false
export async function superUnfollow(): Promise<void> {
    prettyConsole('starting superUnfollow')

    if (!isRunning) {
        window.scrollTo(0, 0)
        isRunning = true
    }

    await delay(3000)

    const profilesToUnfollow = document.querySelectorAll(
        '[data-unfollow="true"]'
    ) as NodeListOf<HTMLElement> | null

    if (!profilesToUnfollow || profilesToUnfollow.length === 0) {
        const isDone = await scrollDownFollowingPage(3000)

        debugger

        if (isDone) {
            console.log('done scrolling')
            return
        } else {
            console.log('scrolling again')
            return await superUnfollow()
        }
    }

    for (let i = 0; i < profilesToUnfollow.length; i++) {
        if (shouldCancel) {
            console.log('superUnfollow cancelled')
            return
        }

        const profile = profilesToUnfollow[i]
        await unfollow(profile)

        if ($unfollowing.get().size === 0) {
            console.log('no profiles to unfollow')
            return
        }

        return await superUnfollow()
    }
}

const unfollow = async (profile: HTMLElement) => {
    const { handle } = profile.dataset
    // click the unfollow button
    const unfollowButton = profile.querySelector(
        '[aria-label ^= "Following"][role="button"]'
    ) as HTMLElement | null

    debugger

    if (!unfollowButton || !handle) {
        throw new Error(
            !handle ? 'no handle found' : 'no unfollow button for ' + handle
        )
    }

    unfollowButton.click()
    await delay(1000)
    // blue and gray out unfollowed profiles
    profile.style.filter = 'blur(1px) grayscale(100%) brightness(0.5)'
    const confirmUnfollow = await waitForElement(
        '[role="button"] [data-testid="confirmationSheetConfirm"]'
    )

    if (!confirmUnfollow) {
        throw new Error('no confirm unfollow button found')
    }
    await delay(1000)
    confirmUnfollow.click()
    // remove profile from unfollowList
    $unfollowing.get().delete(handle)

    $totalUnfollowed.set($totalUnfollowed.get() + 1)

    debugger

    return true
}

// Wait for message from TamperMonkey, abort after received
window.addEventListener(
    'startRunning',
    async function () {
        try {
            prettyConsole('starting superUnfollow')
            const count =
                document.getElementById('su-following-count')?.dataset
                    .followingCount
            if (!count) {
                throw 'no following count found'
            }
            const dialog = await addSearchDialog()

            if ($unfollowing.get().size > 0) {
                addSuperUnfollowButton(dialog)
            }
        } catch (err) {
            console.error(err)
        }
    },
    { once: true }
)

// Send message to Tampermonkey, which will send back a message and trigger the listener above
window.postMessage('startRunning', '*')
