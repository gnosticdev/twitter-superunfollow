import { $following, addFollowing } from '@/store/persistent'
import { $collectFollowingState } from '@/store/collect-button'
import { delay } from './utils/utils'
import { scrollDownFollowingPage } from './utils/scroll'
import { atom } from 'nanostores'
import { Selectors } from '@/shared/shared'
import { getProfileDetails } from './profiles'

const $firstRun = atom<boolean>(true)
$firstRun.subscribe((firstCollection) => {
    console.log('firstCollection', firstCollection)
})

/**
 * Scrolls down the page collecting a list of all profiles
 * Profiles are collected automatically, so this function just keeps scrolling down until it reaches the end
 */
export async function collectFollowing(): Promise<
    Map<string, FollowingProfile> | undefined
> {
    try {
        while (shouldContinue()) {
            // scroll to top on first run
            if ($firstRun.get()) {
                console.log('first run, scrolling to top')
                // reset following to 0, scroll tot top and process the profiles at the top
                await startFollowingAtTop()
                $firstRun.set(false)
            }
            // scroll to the last entry only if collect following is resuming from a paused state
            if ($collectFollowingState.get() === 'resumed') {
                await scrollToLastEntry()
                $collectFollowingState.set('running')
                await delay(3000)
            }
            // will only return true if the end of the following section has been reached
            const isDone = await scrollDownFollowingPage()

            if (isDone) {
                console.log('done collecting following')
                console.log('following:', $following.get())
                $collectFollowingState.set('done')
                debugger
                return $following.get()
            } else {
                return await collectFollowing()
            }
        }
    } catch (error) {
        console.error(error)
    }
}

const waitForScrollTop = async () => {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (window.scrollY === 0) {
                clearInterval(interval)
                resolve(true)
            }
        }, 500)
    })
}

const startFollowingAtTop = async () => {
    // reset the persistent store then reprocess the visible profiles while at the top of the page:
    $following.set(new Map())
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    })
    await waitForScrollTop()
    if (shouldContinue()) {
        await delay(2000)
    } else {
        return
    }
    const profiles = document.querySelectorAll(
        Selectors.PROFILE_INNER
    ) as NodeListOf<ProfileInner>

    for (const profile of Array.from(profiles)) {
        const profileDetails = await getProfileDetails(profile)
        addFollowing(profileDetails.handle, profileDetails)
    }
}

const scrollToLastEntry = async () => {
    const lastEntry = [...$following.get().entries()].pop()
    const scrollHeight = lastEntry?.[1].scrollHeight ?? 0
    console.log(`scrolling to last entry: ${lastEntry?.[0]}: ${scrollHeight}`)
    window.scrollTo({
        top: scrollHeight,
        behavior: 'smooth',
    })
}

const shouldContinue = () => {
    const state = $collectFollowingState.get()
    return state === 'running' || state === 'resumed'
}
