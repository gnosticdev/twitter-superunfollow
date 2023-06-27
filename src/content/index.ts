import { processProfile } from './profiles'
import { addSearchDialog } from './dialog'
import { atom } from 'nanostores'
import { displayUnfollowed, superUnfollow } from './unfollow'
import { $collectFollowingState } from './stores/collection'
import { $superUnfollowButtonState } from './stores/unfollowing'
import { prettyConsole, setButtonText, waitForElement } from './utils'
import { $followingCount } from './stores'

export const $userData = atom<string>('')
// 1) send message to popup.ts -> receive the response via chrome.runtime.onConnect.addListener
;(async () => {
    // 1) send message to background.ts -> receive the response and start init()
    chrome.runtime.sendMessage<IMessage<'content', 'background'>>(
        { from: 'content', to: 'background', request: 'start' },
        async () => {
            try {
                prettyConsole('recieved response from background', 'blue')
                await init()
                const scripts = document.querySelectorAll('script')
                const script = Array.from(scripts).find((script) =>
                    script.innerHTML.includes('__INITIAL_STATE__')
                )
                console.log('script found', script)
                if (!script) {
                    throw 'no script tag found'
                }
                // WORKS BUT LETS TRY EVAL
                // send the userData as a string to the popup window
                // const userData = script.innerHTML
                //     .split('__INITIAL_STATE__=')[1]
                //     .split(';')[0]
                // $userData.set(userData)
            } catch (e) {
                console.log(e)
            }
        }
    )

    // 2) Receive message from popup.ts
    chrome.runtime.onMessage.addListener(
        (msg: IMessage<'popup', 'content'>, sender) => {
            prettyConsole('content received message', 'blue')
            console.log(msg)
        }
    )
})()

// Stores (not persisted)
export const $unfollowedProfiles = atom<Set<string>>(new Set())
export const $profileIndex = atom<number>(0)

$unfollowedProfiles.listen((unfollowed) => {
    displayUnfollowed(unfollowed)
})

export const Selectors = {
    /**  The inner div with the profile details */
    PROFILE_INNER: '[data-testid="UserCell"]',
    /**  The outermost div that contains a profile for each profile */
    PROFILE_CONTAINER: '[data-testid="cellInnerDiv"]',
    /**  The div that contains the profile divs */
    FOLLOWING_CONTAINER: 'section > div[aria-label="Timeline: Following"]',
    /** The main unfollow button - opens a confirmation window */
    UF_BUTTON: '[role="button"][data-testid $= "-unfollow"]',
    /** The confirm unfollow button in the confirmation window */
    UF_CONFIRM: '[role="button"][data-testid="confirmationSheetConfirm"]',
} as const

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
// window.postMessage('startRunning', '*')

// close dialog if open when navigating away
window.addEventListener('beforeunload', () => {
    console.log('unloading')
    $collectFollowingState.set('stopped')
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
                    const profileInner = node.querySelector(
                        Selectors.PROFILE_INNER
                    ) as ProfileInner | null
                    if (
                        node.matches(Selectors.PROFILE_CONTAINER) &&
                        profileInner
                    ) {
                        const processedProfile = await processProfile(
                            profileInner
                        )
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
        Selectors.FOLLOWING_CONTAINER,
        8000,
        'following section'
    )
    if (!section) {
        throw 'following section not found'
    }
    return section
}
