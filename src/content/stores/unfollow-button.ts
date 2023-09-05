import { atom, computed } from 'nanostores'
import {
    $unfollowedProfiles,
    displayUnfollowed,
    startSuperUnfollow,
} from '@/content/unfollow'
import { disableStuff, enableStuff } from '@/content/utils/scroll'

import { setNoticeText } from '@/content/ui/metrics'
import { ButtonState } from '@/content/stores/collect-button'
import { getSuperUnfollowButton } from '@/content/utils/ui-elements'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<ButtonState>('ready')
export const $lastActiveFunction = atom<'collecting' | 'unfollowing' | null>(
    null
)

// start superunfollow process
export async function handleSuperUnfollowBtn() {
    console.log('superunfollow button clicked')
    switch ($superUnfollowButtonState.get()) {
        case 'done':
        case 'ready':
            $superUnfollowButtonState.set('running')
            break
        case 'resumed':
        case 'running':
            $superUnfollowButtonState.set('paused')
            break
        case 'paused':
            $superUnfollowButtonState.set('resumed')
            break
        default:
            break
    }
}

// Subscribe to changes in the button state
$superUnfollowButtonState.listen(async (state) => {
    console.log('superunfollow button state changed:', state)

    const unfollowButton = getSuperUnfollowButton()
    if (!unfollowButton) {
        throw new Error('superunfollow button or notice not found')
    }

    switch (state) {
        case 'paused':
            unfollowButton.innerText = 'Unfollow'
            unfollowButton.classList.remove('running')
            enableStuff('unfollowing')
            break
        case 'running':
        case 'resumed':
            unfollowButton.innerText = 'Pause'
            unfollowButton.classList.add('running')
            disableStuff('unfollowing')
            displayUnfollowed($unfollowedProfiles.get())
            await startSuperUnfollow()
            break
        case 'done':
            unfollowButton.innerText = 'Unfollow'
            unfollowButton.classList.remove('running')
            enableStuff('unfollowing')
            break
    }
    await setNoticeText(state, 'unfollow')
})

export const $isUnfollowing = computed($superUnfollowButtonState, (state) =>
    ['running', 'resumed'].includes(state)
)
/**
 * Disables or enables the unfollow button based on the number of profiles being unfollowed
 */
export function enableUnfollowButton(
    unfollowingSize: number,
    button?: HTMLButtonElement
) {
    button ??= getSuperUnfollowButton()
    button.disabled = unfollowingSize === 0
}
