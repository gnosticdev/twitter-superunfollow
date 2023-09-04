import { atom, computed } from 'nanostores'
import {
    $unfollowedProfiles,
    displayUnfollowed,
    startSuperUnfollow,
} from '@/content/unfollow'
import { disableStuff, enableStuff } from '@/content/utils/scroll'
import { ButtonState } from './collect-button'
import { setNoticeText } from '@/content/ui/metrics'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<ButtonState>('ready')

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
            // notice.classList.add('complete')
            // notice.innerHTML =
            //     unfollowingSize === 0
            //         ? `Unfollowed ${unfollowedSize} profiles!`
            //         : unfollowingSize > 0
            //         ? `Unfollowed ${unfollowedSize} profiles! Only ${unfollowingSize} profiles to go...`
            //         : 'Unfollowed 0 profiles... weird...'
            displayUnfollowed($unfollowedProfiles.get())
            break
    }
    await setNoticeText(state)
})

export const getSuperUnfollowButton = () => {
    const unfollowButton = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement | null
    if (!unfollowButton) {
        throw new Error('superunfollow button not found')
    }
    return unfollowButton
}

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
    button =
        button ??
        (document.getElementById('superUnfollow-button') as HTMLButtonElement)
    button.disabled = unfollowingSize === 0
}
