import { $following, $followingCount } from './stores'
import { $collectedFollowingState } from './stores/collection'
import { scrollDownFollowingPage } from './utils'

/**
 * Scrolls down the page collecting a list of all profiles
 * Profiles are collected automatically, so this function just keeps scrolling down until it reaches the end
 */
export async function collectFollowing(): Promise<
    Map<string, FollowingProfile> | undefined
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
