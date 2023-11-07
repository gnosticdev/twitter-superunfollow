import { $following, $followingCount } from './persistent'
import { collectFollowing } from '@/content/collect-following'
import { getProfileDetails } from '@/content/profiles'
import { setCollectNoticeText } from '@/content/ui/metrics'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import {
    getCollectButton,
    getInnerProfiles,
    getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import { action, atom } from 'nanostores'

export type ButtonState = 'ready' | 'running' | 'paused' | 'resumed' | 'done'

export const $collectFollowingState = atom<ButtonState>('ready')

export const setCollectDone = action(
    $collectFollowingState,
    'setDone',
    (store) => {
        store.set('done')
    },
)

export function handleCollectButton() {
    const collectBtn = getCollectButton()
    if (!collectBtn) {
        throw new Error('collect button or notice div not found')
    }
    switch ($collectFollowingState.get()) {
        case 'ready':
        case 'done':
            $collectFollowingState.set('running')
            break
        case 'resumed':
        case 'running':
            $collectFollowingState.set('paused')
            break
        case 'paused':
            $collectFollowingState.set('resumed')
            break
        default:
            break
    }
}

$collectFollowingState.listen(async (state) => {
    console.log('collect following button state changed:', state)
    const collectButton = getCollectButton()
    const unfollowButton = getSuperUnfollowButton()
    switch (state) {
        case 'ready':
            collectButton.innerHTML = 'Collect'
            collectButton.classList.remove('running')
            unfollowButton.disabled = false
            enableScroll()
            await setCollectNoticeText(state)
            break
        case 'running':
        case 'resumed':
            collectButton.classList.add('running')
            collectButton.innerHTML = 'Pause'
            unfollowButton.disabled = true
            disableScroll()
            await setCollectNoticeText(state)
            await collectFollowing()
            break
        case 'paused':
            collectButton.innerHTML = 'Resume'
            collectButton.classList.remove('running')
            unfollowButton.disabled = false
            await setCollectNoticeText(state)
            enableScroll()
            break
        case 'done':
            collectButton.innerHTML = 'Collect'
            collectButton.classList.remove('running')
            unfollowButton.disabled = false
            enableScroll()
            await setCollectNoticeText(state)
            break
        default:
            break
    }
})
/**
 * Only run at top of the page where new profiles are loaded
 * @returns true if the user has followed any new profiles since the last time
 */
export async function shouldCollect() {
    if ($followingCount.get() === 0) {
        return true
    }
    if ($following.get().size !== $followingCount.get()) {
        console.log('following count mismatch, user should collect')
        return true
    }
    return await followingChanged()
}

/**
 * Check if the user has followed any new profiles since the last time
 */
async function followingChanged() {
    const newProfiles = getInnerProfiles()
    for await (const profile of Array.from(newProfiles)) {
        const profileDetails = await getProfileDetails(profile)
        if (!$following.get().has(profileDetails.handle)) {
            console.log('new profile found:', profileDetails.handle)
            return true
        }
    }
    console.log('no new profiles found')
    return false
}
