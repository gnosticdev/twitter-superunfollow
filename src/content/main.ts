import { processProfile } from './profiles'
import { addDialogToDom } from './ui/dialog'
import { superUnfollow } from './unfollow'
// import { waitForElement } from './utils/wait-promise'
import { $following, $followingCount } from '@/content/stores/persistent'
import { $superUnfollowButtonState } from '@/content/stores/unfollow-button'
import { Selectors } from '@/content/utils/ui-elements'
import { getInnerProfiles } from '@/content/utils/ui-elements'
import { sendMessageToBg } from '@/shared/messaging'
import { $$twitterSyncStorage } from '@/shared/storage'
import { FromCsToBg, FromBgToCs, ProfileInner } from '@/shared/types'
import { atom } from 'nanostores'

const $needToCollect = atom<boolean>(true)

// 1) send message to background.ts -> receive the response and start init()
// TODO: add this as an option
// export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'
init().then(() => {
    console.log('done')
})
// 1) send message to background.ts -> receive the response and start init()
async function init() {
    const scripts = document.querySelectorAll('script')
    const script = Array.from(scripts).find((script) =>
        script.innerHTML.includes('__INITIAL_STATE__'),
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
    console.log('sending userData to background script')
    // send the userData as a string to the backgrounds cript, which then sends it to the newTab
    await sendMessageToBg(userDataMessage)
    $$twitterSyncStorage.watch(
        'friends_count',
        ({ key, newValue, oldValue }) => {
            console.log(
                `$$twitterSyncStorage: ${key} changed from ${oldValue} to ${newValue}`,
            )
        },
    )
    $$twitterSyncStorage.watch('screen_name', ({ key, newValue, oldValue }) => {
        console.log(
            `$$twitterSyncStorage: ${key} changed from ${oldValue} to ${newValue}`,
        )
    })
    chrome.runtime.onMessage.addListener(async (msg: FromBgToCs) => {
        try {
            if (msg.from !== 'background' || msg.to !== 'content') {
                return
            }
            if (msg.type === 'userData' && msg.data) {
                // store the followingCount = friends_count, and the entire userData object for later use
                $followingCount.set(msg.data.friends_count)
                console.log(
                    `followingCount: ${msg.data.friends_count}, collected: ${
                        $following.get().size
                    }, needToCollect: ${$needToCollect.get()}`,
                )
                // start observer on /following page after getting message from bg script
            } else if (msg.type === 'addDialog') {
                await addDialogToDom()
                const innerProfiles = getInnerProfiles()
                for (const profile of Array.from(innerProfiles)) {
                    await processProfile(profile)
                }
                await startObserver()
            } else if (msg.type === 'removeDialog') {
                removeDialogButton()
            }
        } catch (e) {
            console.log(e)
        }
    })
}

// Start the observer after the userData has been received, and we are on the /following page
async function startObserver() {
    const profileObserver = new MutationObserver(async (mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length === 0) {
                continue
            }
            for (const node of Array.from(mutation.addedNodes)) {
                if (node instanceof HTMLElement) {
                    const profileInner = node.querySelector(
                        Selectors.PROFILE_INNER,
                    ) as ProfileInner | null
                    if (
                        node.matches(Selectors.PROFILE_CONTAINER) &&
                        profileInner
                    ) {
                        const processedProfile =
                            await processProfile(profileInner)
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
    const section = (await getFollowingSection()) as HTMLElement
    console.log('following section:', section)
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
    const section = () =>
        document.querySelector(
            '[aria-label="Timeline: Following"]',
        ) as HTMLElement | null

    if (!section()) {
        return new Promise((resolve) => {
            let tries = 0
            const interval = setInterval(() => {
                console.log('waiting for following section -> ' + tries)
                if (tries > 10) {
                    clearInterval(interval)
                    return resolve(null)
                }
                const el = section()
                if (el) {
                    clearInterval(interval)
                    return resolve(el)
                }
                tries++
            }, 1000)
        })
    }
    return section()
}
