import { processProfile } from './profiles'
import { addSearchDialog } from './dialog'
import { Selectors } from '@/content/utils/utils'
import { superUnfollow } from './unfollow'
import { $superUnfollowButtonState } from '@/content/stores/unfollow-button'
import { waitForElement } from './utils/wait-promise'
import { $followingCount } from '@/content/stores/persistent'
import { atom } from 'nanostores'
import { prettyConsole } from '@/content/utils/console'
import { sendMessageToBg } from '@/shared/messaging'

export const $needToCollect = atom<boolean>(true)
export const $username = atom<string | null>(null)

// 1) send message to background.ts -> receive the response and start init()
// TODO: add this as an option
// export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'

// 1) send message to background.ts -> receive the response and start init()
;(async () => {
    const scripts = document.querySelectorAll('script')
    const script = Array.from(scripts).find((script) =>
        script.innerHTML.includes('__INITIAL_STATE__')
    )
    if (!script) {
        throw 'script has not loaded yet'
    }

    const userDataMessage: FromCsToBg = {
        from: 'content',
        to: 'background',
        type: 'userData',
        data: script.innerHTML,
    }

    prettyConsole('sending userData to background script')
    // send the userData as a string to the backgrounds cript, which then sends it to the newTab
    await sendMessageToBg(userDataMessage)

    chrome.runtime.onMessage.addListener(async (msg: FromBgToCs) => {
        try {
            prettyConsole(
                `content script received msg from ${msg.from}: ${msg.type}`,
                'green',
                msg
            )
            if (
                msg.from === 'background' &&
                msg.to === 'content' &&
                msg.type === 'userData' &&
                msg.data
            ) {
                // store the followingCount = friends_count, and the entire userData object for later use
                $followingCount.set(msg.data.friends_count)
                // start observer on /following page after getting message from bg script
            } else if (msg.from === 'background' && msg.type === 'addDialog') {
                console.log(
                    'content script received start message from background script, adding search dialog & show dialog button...'
                )
                await addSearchDialog()
                const innerProfiles = document.querySelectorAll(
                    Selectors.PROFILE_INNER
                ) as NodeListOf<ProfileInner>
                console.log('inner profiles', innerProfiles)
                for (const profile of Array.from(innerProfiles)) {
                    await processProfile(profile)
                }
                await startObserver()
            } else if (
                msg.from === 'background' &&
                msg.type === 'removeDialog'
            ) {
                removeDialogButton()
            }
        } catch (e) {
            console.log(e)
        }
    })
})()

// Start the observer after the userData has been received, and we are on the /following page
async function startObserver() {
    prettyConsole('starting observer on /following page')
    const profileObserver = new MutationObserver(async (mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length === 0) {
                continue
            }
            for (const node of Array.from(mutation.addedNodes)) {
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
            }
        }
    })
    // first make sure the following section is in the DOM, then observe for new profiles added to it
    const section = await getFollowingSection()
    profileObserver.observe(section, {
        childList: true,
        subtree: true,
    })
}

function removeDialogButton() {
    const showDialogBtn = document.getElementById('su-show-modal-button')
    if (showDialogBtn) {
        showDialogBtn.remove()
    }
}

async function getFollowingSection() {
    const section = await waitForElement(
        Selectors.FOLLOWING_CONTAINER,
        8000,
        'getFollowingSection - main.ts:'
    )
    if (!section) {
        throw 'following section not found'
    }
    return section
}
