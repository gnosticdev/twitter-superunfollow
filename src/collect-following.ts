import { $following, $followingCount } from './stores'
import { $collectedFollowingState } from './stores/collection'
import { $superUnfollowButtonState } from './stores/unfollowing'
import { scrollDownFollowingPage } from './utils'

/**
 * Scrolls down the page collecting a list of all profiles
 */
export async function collectFollowing(): Promise<
    Map<string, FollowingUser> | undefined
> {
    try {
        if ($collectedFollowingState.get() === 'stopped') {
            console.log('stopping collect following')
            return
        }
        if ($following.get().size === $followingCount.get()) {
            console.log('collected following count matches following count')
            return $following.get()
        }
        const isDone = await scrollDownFollowingPage()
        if (isDone) {
            console.log('following:', $following)
            console.log('done collecting following')
            $collectedFollowingState.set('stopped')
            return $following.get()
        } else {
            return await collectFollowing()
        }
    } catch (error) {
        console.error(error)
    }
}

/**
 * Creates window click listener that aborts the superUnfollow or collect following process
 */
export const addRunningOverlay = () => {
    addOverlay()
    document.body.addEventListener(
        'click',
        (e) => {
            // prevent clicks that occur in the dev tools from stopping the process (devtools is at bottom)
            if (e.clientY > 0 && e.clientY <= window.innerHeight) {
                console.log('click occured, stopping process...')
                if ($superUnfollowButtonState.get() === 'running') {
                    $superUnfollowButtonState.set('stopped')
                }
                if ($collectedFollowingState.get() === 'running') {
                    $collectedFollowingState.set('stopped')
                }
                removeOverlay()
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
}

export const removeOverlay = () => {
    console.log('removing overlay')
    const overlay = document.getElementById('su-overlay')
    if (overlay) {
        overlay.remove()
    }
}
