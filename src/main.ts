import { addStartButton } from './add-elements'
import { processProfiles } from './profiles'
import { addSearchDialog } from './dialog'
import { scrollDownFollowingPage } from './utils'
import { atom } from 'nanostores'
import { $following, $unfollowing, setButtonText } from './stores'

// Stores (not persisted)
export const $totalUnfollowed = atom(0)
export const $collectedFollowing = atom(false)
export const $profilesProcessing = atom(false)
export const $suIsRunning = atom(false)
export const $collectFollowingStopFlag = atom(false)

// Subscriptions
$unfollowing.listen((unfollow) => {
    console.log(`now unfollowing ${unfollow.size.toString()} profiles`)
    setButtonText()
})

export const PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]'
// TODO: add a test for this
// export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'
/**
 * Scrolls down the page collecting a list of all profiles
 */

export async function init() {
    const dialog = await addSearchDialog()
    addStartButton(dialog)
    setButtonText()
}

export async function collectFollowing(): Promise<
    Map<string, FollowingUser> | undefined
> {
    try {
        if ($collectFollowingStopFlag.get()) {
            console.log('stopping collect following')
            $collectFollowingStopFlag.set(false)
            return
        }
        if ($collectedFollowing && $following.get().size > 0) {
            return $following.get()
        }
        const isDone = await scrollDownFollowingPage()
        if (isDone) {
            console.log('following:', $following)
            console.log('done scrolling')
            $collectedFollowing.set(true)
            return $following.get()
        } else {
            return await collectFollowing()
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
                        $profilesProcessing.set(true)
                        await processProfiles(profile)
                        $profilesProcessing.set(false)
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

// Wait for message from TamperMonkey, abort after received
window.addEventListener(
    'startRunning',
    async function () {
        try {
            console.log('starting SuperUnfollow')
            const count =
                document.getElementById('su-following-count')?.dataset
                    .followingCount
            if (!count) {
                throw 'no following count found'
            }

            // start the content script
            await init()
        } catch (err) {
            console.error(err)
        }
    },
    { once: true }
)

// Send message to Tampermonkey, which will send back a message and trigger the listener above
window.postMessage('startRunning', '*')
