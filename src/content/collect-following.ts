import { $following, addFollowing } from '@/store/persistent'
import { $collectFollowingState, $isCollecting } from '@/store/collect-button'
import { randomDelay } from './utils/utils'
import { scrollToLastChild, waitForScrollTo } from './utils/scroll'
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
    Map<string, ProfileDetails> | undefined
> {
    try {
        while ($isCollecting.get()) {
            // scroll to top on first run
            if ($firstRun.get()) {
                // reset following to 0, scroll tot top and process the profiles at the top
                await startFollowingAtTop()
                $firstRun.set(false)
            }
            // scroll to the last entry only if collect following is resuming from a paused state
            if ($collectFollowingState.get() === 'resumed') {
                await scrollToLastEntry()
                $collectFollowingState.set('running')
                await randomDelay(3000)
            }
            // will only return true if the end of the following section has been reached
            const isDone = await scrollToLastChild()

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

const startFollowingAtTop = async () => {
    // reset the persistent store then reprocess the visible profiles while at the top of the page:
    $following.set(new Map())
    // scroll to top and wait fo the scroll to complete
    const scrolled = await waitForScrollTo(0)
    // check if collection has been paused/finished while waiting for the profiles to load
    if (scrolled && $isCollecting.get()) {
        await randomDelay(2000)
    } else {
        console.log(
            'collection paused/finished while waiting for profiles to load',
            'scrolled:',
            scrolled,
            'isCollecting:',
            $isCollecting.get()
        )
        return
    }
    // process the profiles at the top of the page
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
    await waitForScrollTo(scrollHeight)
}
