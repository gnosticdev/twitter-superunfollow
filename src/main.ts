import { processProfile } from './profiles'
import { addSearchDialog } from './dialog'
import { atom } from 'nanostores'
import { displayUnfollowed, superUnfollow } from './unfollow'
import { $collectedFollowingState } from './stores/collection'
import { $superUnfollowButtonState } from './stores/unfollowing'
import { setButtonText, waitForElement } from './utils'

// Stores (not persisted)
export const $unfollowedProfiles = atom<Set<string>>(new Set())
export const $profileIndex = atom<number>(0)

$unfollowedProfiles.listen((unfollowed) => {
    displayUnfollowed(unfollowed)
})

export const PROFILES_SECTION =
    'section > div[aria-label="Timeline: Following"]'
export const PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]'
// TODO: add a test for this
// export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'

export async function init() {
    await addSearchDialog()
    setButtonText()
    startObserver()
}

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

// Send message to Background script, which will send back a message and trigger the listener above
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

function startObserver() {
    const profileObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length === 0) {
                continue
            }
            mutation.addedNodes.forEach(async (node) => {
                if (node instanceof HTMLElement) {
                    const profile = node.querySelector(
                        '[data-testid="UserCell"]'
                    ) as HTMLElement | null
                    if (node.matches(PROFILES_SIBLINGS) && profile) {
                        const processedProfile = await processProfile(profile)
                        if (
                            $superUnfollowButtonState.get() === 'running' &&
                            processedProfile
                        ) {
                            await superUnfollow(processedProfile)
                        }
                    }
                }
            })
        }
    })
    // first make sure the following section is in the DOM, then observe for new profiles added to it
    getFollowingSection().then((section) => {
        profileObserver.observe(section, {
            childList: true,
            subtree: true,
        })
    })
}

export const getFollowingSection = async () => {
    const section = await waitForElement(
        PROFILES_SECTION,
        8000,
        'following section'
    )
    if (!section) {
        throw 'following section not found'
    }
    return section
}
