import { $collectFollowingState } from '../storage/collection'
import { $superUnfollowButtonState } from '../storage/unfollowing'

/**
 * Creates window click listener that aborts the superUnfollow or collect following process
 */
export const addRunningOverlay = () => {
    const overlay = addOverlay()
    overlay.addEventListener(
        'click',
        (e) => {
            // prevent clicks that occur in the dev tools from stopping the process (devtools is at bottom)
            if (e.clientY > 0 && e.clientY <= window.innerHeight) {
                console.log('click occured, stopping process...')
                if ($superUnfollowButtonState.get() === 'running') {
                    $superUnfollowButtonState.set('stopped')
                }
                if ($collectFollowingState.get() === 'running') {
                    $collectFollowingState.set('stopped')
                }
                // gets removed from the listeners
                // removeOverlay()
            }
        },
        { once: true }
    )
}

/**
 * Adds an overlay to the opened dialog to prevent user interaction with the dialog and to highlight the cancel button
 */
export const addOverlay = () => {
    console.log('adding overlay')
    const overlay = document.createElement('div')
    overlay.id = 'su-overlay'
    overlay.classList.add('su-overlay')
    document.getElementById('su-dialog')?.appendChild(overlay)

    return overlay
}

export const removeOverlay = () => {
    console.log('removing overlay')
    const overlay = document.getElementById('su-overlay')
    if (overlay) {
        overlay.remove()
    }
}
