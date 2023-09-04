import { $following, addFollowing } from '@/content/stores/persistent'
import {
    $collectFollowingState,
    $isCollecting,
} from '@/content/stores/collect-button'
import { getInnerProfiles, randomDelay } from './utils/ui-elements'
import { scrollToLastChild, waitForScrollTo } from './utils/scroll'
import { atom } from 'nanostores'
import { getProfileDetails } from './profiles'

/**
 * Check if profiles have been collected yet
 */
const $firstRun = atom<boolean>(true)
/**
 * Scrolls down the page collecting a list of all profiles
 * Profiles are collected automatically, so this function just keeps scrolling down until it reaches the end
 */
export async function collectFollowing(): Promise<
    Map<string, ProfileDetail> | undefined
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
                await randomDelay(3000, 3500)
            }
            // will only return true if the end of the following section has been reached
            const isDone = await scrollToLastChild()

            if (isDone) {
                console.log('done collecting following')
                console.log('following:', $following.get())
                $collectFollowingState.set('done')
                return $following.get()
            } else {
                await randomDelay(1000, 2000)
                return await collectFollowing()
            }
        }
    } catch (error) {
        console.error(error)
    }
}

async function startFollowingAtTop() {
    console.log('starting following at top')
    // reset the persistent store then reprocess the visible profiles while at the top of the page:
    $following.set(new Map())
    // scroll to top and wait fo the scroll to complete
    const scrolled = await waitForScrollTo(0)
    // check if collection has been paused/finished while waiting for the profiles to load
    if (scrolled && $isCollecting.get()) {
        await randomDelay(2000, 2500)
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
    const profiles = getInnerProfiles()
    for (const profile of Array.from(profiles)) {
        const profileDetails = await getProfileDetails(profile)
        addFollowing(profileDetails.handle, profileDetails)
    }
}

async function scrollToLastEntry() {
    const lastEntry = [...$following.get().entries()].pop()
    const scrollHeight = lastEntry?.[1].scrollHeight ?? 0
    console.log(`scrolling to last entry: ${lastEntry?.[0]}: ${scrollHeight}`)
    await waitForScrollTo(scrollHeight)
}
