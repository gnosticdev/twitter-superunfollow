import { processProfile } from './profiles'
import { addSearchDialog } from './dialog'
import { Selectors } from '@/shared/shared'
import { superUnfollow } from './unfollow'
import { $superUnfollowButtonState } from '@/store/unfollow-button'
import { waitForElement } from './utils/wait-promise'
import { $followingCount } from '@/store/persistent'

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

    const userDataMessage: CStoBGMessage = {
        from: 'content',
        to: 'background',
        type: 'userData',
        data: script.innerHTML,
    }
    console.log(
        'content script sending userData to background script',
        userDataMessage
    )
    // send the userData as a string to the backgrounds cript, which then sends it to the newTab
    await chrome.runtime.sendMessage<CStoBGMessage>(userDataMessage)

    chrome.runtime.onMessage.addListener(async (msg: BGtoCSMessage) => {
        try {
            console.log('content received message', msg)
            if (
                msg.from === 'background' &&
                msg.type === 'userData' &&
                msg.to === 'content' &&
                msg.data
            ) {
                // store the followingCount = friends_count, and the entttire userData object for later use
                $followingCount.set(msg.data.friends_count)
                await addSearchDialog()
                startObserver()
            }
        } catch (e) {
            console.log(e)
        }
    })
})()

async function startObserver() {
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
    const section = await getFollowingSection()
    profileObserver.observe(section, {
        childList: true,
        subtree: true,
    })
}

export const getFollowingSection = async () => {
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
