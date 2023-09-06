import { action, atom, computed, onSet } from 'nanostores'
import {
    $unfollowedProfiles,
    showUnfollowed,
    startSuperUnfollow,
} from '@/content/unfollow'
import { setUnfollowNoticeText } from '@/content/ui/metrics'
import {
    getCollectButton,
    getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import {
    $collectFollowingState,
    ButtonState,
} from '@/content/stores/collect-button'
import { $unfollowing } from '@/content/stores/persistent'
import { get } from 'https'
import { disableScroll, enableScroll } from '@/content/utils/scroll'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<ButtonState>('ready')

const setRunning = action($superUnfollowButtonState, 'setRunning', (store) => {
    store.set('running')
})

const setPaused = action($superUnfollowButtonState, 'setPaused', (store) => {
    store.set('paused')
})

const setResumed = action($superUnfollowButtonState, 'setResumed', (store) => {
    store.set('resumed')
})

export const setUnfollowDone = action(
    $superUnfollowButtonState,
    'setDone',
    (store) => {
        store.set('done')
    }
)

// start superunfollow process
export async function handleUnfollowButton() {
    console.log('superunfollow button clicked')
    switch ($superUnfollowButtonState.get()) {
        case 'done':
        case 'ready':
            setRunning()
            break
        case 'resumed':
        case 'running':
            setPaused()
            break
        case 'paused':
            setResumed()
            break
        // 'done' doesnt get set by the button click, use a computed store for that...
        default:
            break
    }
}

// Runs before new values are set
onSet($superUnfollowButtonState, async ({ newValue }) => {
    console.log('superunfollow button state changed:', newValue)
    const unfollowButton = getSuperUnfollowButton()
    const collectButton = getCollectButton()
    await setUnfollowNoticeText(newValue)
    switch (newValue) {
        case 'running':
        case 'resumed':
            unfollowButton.innerText = 'Pause'
            unfollowButton.classList.add('running')
            collectButton.disabled = true
            disableScroll()
            showUnfollowed($unfollowedProfiles.get())
            await startSuperUnfollow()
            break
        case 'paused':
            unfollowButton.innerText = 'Resume'
            unfollowButton.classList.remove('running')
            collectButton.disabled = false
            enableScroll()
            break
        case 'done':
            unfollowButton.innerText = 'Unfollow'
            unfollowButton.classList.remove('running')
            collectButton.disabled = false
            enableScroll()
            break
        default:
            break
    }
})

let lastRun: 'unfollowing' | 'collecting' | 'none' = 'none'
export const $runningState = computed(
    [$superUnfollowButtonState, $collectFollowingState],
    (unfollowButton, collectButton) => {
        const unfollowing = ['running', 'resumed'].includes(unfollowButton)
        const collecting = ['running', 'resumed'].includes(collectButton)
        if (unfollowing) {
            lastRun = 'unfollowing'
        } else if (collecting) {
            lastRun = 'collecting'
        }
        return {
            running: unfollowing || collecting,
            isUnfollowing: unfollowing,
            isCollecting: collecting,
            lastRun,
        }
    }
)