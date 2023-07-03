import { atom } from 'nanostores'
import { startSuperUnfollow } from '@/content/unfollow'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<
    'ready' | 'running' | 'paused' | 'resumed' | 'done'
>('paused')

// start superunfollow process
export async function handleSuperUnfollowBtn() {
    console.log('superunfollow button clicked')
    switch ($superUnfollowButtonState.get()) {
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
        case 'done':
            $superUnfollowButtonState.set('running')
            break
        default:
            break
    }
}

// Subscribe to changes in the button state
$superUnfollowButtonState.listen(async (state) => {
    console.log('superunfollow button state changed:', state)
    const suButton = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement | null
    if (suButton) {
        switch (state) {
            case 'paused':
            case 'done':
                suButton.classList.remove('running')
                // text updated by listener in unfollow.ts
                break
            case 'running':
                suButton.innerText = 'Click to Pause'
                suButton.classList.add('running')
                await startSuperUnfollow()
                break
        }
    }
})

/**
 * Updates the unfollow button with the number of users selected
 */
export const setUnfollowBtn = (
    unfollowingSize: number,
    button?: HTMLButtonElement
) => {
    button =
        button ??
        (document.getElementById('superUnfollow-button') as HTMLButtonElement)

    if (unfollowingSize > 0) {
        button.disabled = false
    } else {
        button.disabled = true
    }
}
