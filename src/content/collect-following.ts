import { atom } from 'nanostores'
import { $following, $followingCount } from '../storage/persistent'
import { $collectFollowingState } from '../storage/collection'
import { delay, scrollDownFollowingPage } from './utils'

/** allows us to scroll to the last entry in the $following list and start collecting from there  */
export const $started = atom(false)
/**
 * Scrolls down the page collecting a list of all profiles
 * Profiles are collected automatically, so this function just keeps scrolling down until it reaches the end
 */
export async function collectFollowing(): Promise<
    Map<string, FollowingProfile> | undefined
> {
    try {
        if ($collectFollowingState.get() === 'stopped') {
            console.log('stopping collect following')
            $started.set(false)
            return $following.get()
        }
        if ($following.get().size === $followingCount.get()) {
            console.log('collected following count matches following count')
            $collectFollowingState.set('stopped')
            $started.set(false)
            return $following.get()
        }
        // scroll to the last entry
        if (!$started.get()) {
            const lastEntry = [...$following.get().entries()].pop()
            const scrollHeight = lastEntry?.[1].scrollHeight ?? 0
            console.log(
                'last entry in following list:',
                lastEntry,
                `scrolling to ${scrollHeight}`
            )
            $started.set(true)
            window.scrollTo({
                top: scrollHeight,
                behavior: 'smooth',
            })
            await delay(3000)
        }

        const isDone = await scrollDownFollowingPage()
        if (isDone) {
            console.log('following:', $following.get())
            console.log('done collecting following')
            $collectFollowingState.set('stopped')
            $started.set(false)
            return $following.get()
        } else {
            return await collectFollowing()
        }
    } catch (error) {
        console.error(error)
    }
}
