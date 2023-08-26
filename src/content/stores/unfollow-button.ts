import { atom, computed } from 'nanostores'
import {
    $unfollowedProfiles,
    displayUnfollowed,
    startSuperUnfollow,
} from '@/content/unfollow'
import { disableStuff, enableStuff } from '@/content/utils/scroll'
import { setNoticeLoading } from './collect-button'
import { $unfollowing } from './persistent'

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
    const unfollowButton = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement | null
    const notice = document.getElementById('su-notice') as HTMLDivElement | null

    if (!unfollowButton || !notice) {
        throw new Error('superunfollow button or notice not found')
    }
    const unfollowingSize = $unfollowing.get().size
    const unfollowedSize = $unfollowedProfiles.get().size
    switch (state) {
        case 'paused':
            unfollowButton.innerText = 'Unfollow'
            unfollowButton.classList.remove('running')
            notice.textContent = `${unfollowingSize} profiles left to unfollow`
            enableStuff('unfollowing')
            break
        case 'running':
        case 'resumed':
            unfollowButton.innerText = 'Pause'
            unfollowButton.classList.add('running')
            disableStuff('unfollowing')
            setNoticeLoading(notice)
            displayUnfollowed($unfollowedProfiles.get())
            await startSuperUnfollow()
            break
        case 'done':
            unfollowButton.innerText = 'Unfollow'
            unfollowButton.classList.remove('running')
            enableStuff('unfollowing')
            notice.classList.add('complete')
            notice.innerHTML =
                unfollowingSize === 0
                    ? `Unfollowed ${unfollowedSize} profiles!`
                    : unfollowingSize > 0
                    ? `Unfollowed ${unfollowedSize} profiles! Only ${unfollowingSize} profiles to go...`
                    : 'Unfollowed 0 profiles... weird...'
            displayUnfollowed($unfollowedProfiles.get())
            break
    }
})

export const $isUnfollowing = computed($superUnfollowButtonState, (state) =>
    ['running', 'resumed'].includes(state)
)
/**
 * Disables or enables the unfollow button based on the number of profiles being unfollowed
 */
export const enableDisableUnfollowBtn = (
    unfollowingSize: number,
    button?: HTMLButtonElement
) => {
    button =
        button ??
        (document.getElementById('superUnfollow-button') as HTMLButtonElement)
    button.disabled = unfollowingSize === 0
}
