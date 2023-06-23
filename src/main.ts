import { processProfiles } from './profiles'
import { addSearchDialog } from './dialog'
import { atom } from 'nanostores'
import { displayUnfollowed } from './unfollow'
import { $collectedFollowingState } from './stores/collection'
import { $superUnfollowButtonState } from './stores/unfollowing'
import { setButtonText } from './utils'

// Stores (not persisted)
export const $profilesProcessing = atom(false)
export const $totalUnfollowed = atom<Set<string>>(new Set())

$totalUnfollowed.listen((unfollowed) => {
    console.log(`unfollowed ${unfollowed.size.toString()} profiles`)
    displayUnfollowed(unfollowed)
})

export const PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]'
// TODO: add a test for this
// export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'

export async function init() {
    await addSearchDialog()
    setButtonText()
}

// Adds profiles from the following page as they are added to the DOM (infinite scroll)
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

// Wait for message from Background script, abort after received
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

// close dialog if open when navigating away
window.addEventListener('beforeunload', () => {
    console.log('unloading')
    $collectedFollowingState.set('stopped')
    $superUnfollowButtonState.set('stopped')

    const dialog = document.getElementById(
        'su-dialog'
    ) as HTMLDialogElement | null
    if (dialog?.open) {
        dialog.close()
    }
})
