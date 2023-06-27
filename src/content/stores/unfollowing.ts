import { atom } from 'nanostores'
import { setButtonText } from '../utils'
import { startSuperUnfollow } from '../unfollow'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<'stopped' | 'running'>('stopped')

// start superunfollow process
export async function handleSuperUnfollowBtn() {
    console.log('superunfollow button clicked')
    switch ($superUnfollowButtonState.get()) {
        case 'stopped':
            $superUnfollowButtonState.set('running')
            break
        case 'running':
            $superUnfollowButtonState.set('stopped')
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
            case 'stopped':
                setButtonText()
                suButton.classList.remove('running')
                break
            case 'running':
                suButton.innerText = 'Click to Stop'
                suButton.classList.add('running')
                // addRunningOverlay()
                await startSuperUnfollow()
                // removeOverlay()
                break
        }
    }
})
