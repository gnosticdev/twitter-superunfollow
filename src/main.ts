import { addSuperUnfollowButton, updateUnfollowButton } from './add-elements'
import { processProfiles } from './profiles'
import { addSearchDialog } from './search'
import {
    waitForElement,
    scrollDownFollowingPage,
    prettyConsole,
    delay,
} from './utils'
import { atom } from 'nanostores'
import { $following, $unfollowing, removeUnfollowing } from './stores'

export const $totalUnfollowed = atom(0)
export const $collectedFollowing = atom(false)
export const $isRunning = atom(false)

// Subscriptions
$following.listen((following) => {
    localStorage.setItem('followingCount', following.size.toString())
})

$unfollowing.listen((unfollow) => {
    console.log('unfollowing listener fired. updating button...', unfollow.size)
    updateUnfollowButton()
})

export type FollowingUser = {
    handle: string
    username: string
    description?: string
}

export const PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]'
export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'
/**
 * Scrolls down the page collecting a list of all profiles
 */
export async function collectFollowing(): Promise<
    Map<string, FollowingUser> | undefined
> {
    try {
        if ($collectedFollowing && $following.get().size > 0) {
            return $following.get()
        }
        const isDone = await scrollDownFollowingPage()
        if (isDone) {
            console.log('followingMap', $following)
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

// Create a new store for the button state
export const $buttonState = atom<'idle' | 'running' | 'done'>('idle')

// Subscribe to changes in the button state
const unsubscribe = $buttonState.subscribe((state) => {
    const suButton = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement | null
    if (suButton) {
        switch (state) {
            case 'idle':
                suButton.innerText = `SuperUnfollow ${$unfollowing.get().size}`
                suButton.disabled = false
                break
            case 'running':
                suButton.innerText = 'Running...'
                suButton.disabled = true
                break
            case 'done':
                suButton.innerText = 'Done'
                suButton.disabled = true
                break
        }
    }
})

// Add an event listener to the button
const button = document.getElementById('superUnfollow-button')
button?.addEventListener('click', async () => {
    if ($buttonState.get() === 'idle') {
        $buttonState.set('running')
        await superUnfollow()
        $buttonState.set('done')
    }
})

// Unsubscribe from changes when you're done
unsubscribe()

export async function superUnfollow(): Promise<void> {
    prettyConsole('starting superUnfollow')

    if (!$isRunning.get()) {
        window.scrollTo({
            behavior: 'smooth',
            top: 0,
        })
        $isRunning.set(true)
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
    removeUnfollowing(handle)

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
