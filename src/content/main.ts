import { processProfile } from './profiles'
import { addSearchDialog } from './dialog'
import { Selectors } from '../shared/shared'
import { atom } from 'nanostores'
import { displayUnfollowed, superUnfollow } from './unfollow'
import { $collectFollowingState } from '../storage/collection'
import { $superUnfollowButtonState } from '../storage/unfollowing'
import { prettyConsole, setButtonText, waitForElement } from './utils'

const $userDataRaw = atom<string>('')
// 1) send message to popup.ts -> receive the response via chrome.runtime.onConnect.addListener
;(async () => {
    // 1) send message to background.ts -> receive the response and start init()
    try {
        const startResponse: BGtoCSMessage =
            await chrome.runtime.sendMessage<CStoBGMessage>({
                from: 'content',
                to: 'background',
                type: 'start',
            })
        if (startResponse.type !== 'start') {
            throw 'start response not received'
        }
        prettyConsole('received response from background', 'blue')
        // initialize the dialog
        await init()

        const sendBGResponse = await sendUserData()
        if (sendBGResponse && sendBGResponse.data) {
        }

        // wait for the background script to send the userData
        chrome.runtime.onMessage.addListener(
            async (msg: BGtoCSMessage, sender) => {
                try {
                    console.log('content received message', msg, sender)
                    if (msg.from === 'background' && msg.type === 'userData') {
                        console.log(msg)
                        const dataString = msg.data
                        if (!dataString) {
                            throw 'no data string found'
                        }
                    }
                } catch (e) {
                    console.log(e)
                }
            }
        )
    } catch (e) {
        console.log(e)
    }
})()

async function sendUserData() {
    try {
        const scripts = document.querySelectorAll('script')
        const script = Array.from(scripts).find((script) =>
            script.innerHTML.includes('__INITIAL_STATE__')
        )
        if (!script) {
            throw 'no script tag found'
        }
        $userDataRaw.set(script.innerHTML)
        // send the userData as a string to the backgrounds cript, which then sends it to the popup
        prettyConsole('sending user data to background', 'blue')
        const popupResponse: BGtoCSMessage =
            await chrome.runtime.sendMessage<CStoBGMessage>({
                from: 'content',
                to: 'background',
                type: 'userData',
                data: script.innerHTML,
            })

        return popupResponse
        // WORKS BUT EVAL WILL GET ALL OF THE DATA, NOT JUST THE FOLLOWING
        // send the userData as a string to the popup window
        // const userData = script.innerHTML
        //     .split('__INITIAL_STATE__=')[1]
        //     .split(';')[0]
        // $userData.set(userData)
    } catch (e) {
        console.log(e)
    }
}

// Stores (not persisted)
export const $unfollowedProfiles = atom<Set<string>>(new Set())
export const $profileIndex = atom<number>(0)

$unfollowedProfiles.listen((unfollowed) => {
    displayUnfollowed(unfollowed)
})

// TODO: add a test for this
// export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'

export async function init() {
    await addSearchDialog()
    setButtonText()
    startObserver()
}

// Wait for message from Background script, abort after received
// window.addEventListener(
//     'startRunning',
//     async function () {
//         try {
//             const count =
//                 document.getElementById('su-following-count')?.dataset
//                     .followingCount
//             if (!count) {
//                 throw 'no following count found'
//             }

//             // start the content script
//             await init()
//         } catch (err) {
//             console.error(err)
//         }
//     },
//     { once: true }
// )

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
        'getFollowingSection - main.ts: following section'
    )
    if (!section) {
        throw 'following section not found'
    }
    return section
}
