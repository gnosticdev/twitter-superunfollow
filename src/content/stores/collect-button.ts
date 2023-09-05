import { atom, computed } from 'nanostores'
import { collectFollowing } from '@/content/collect-following'
import {
    createLoadingSpinner,
    getInnerProfiles,
} from '@/content/utils/ui-elements'
import { $following, $followingCount } from './persistent'
import { getProfileDetails } from '@/content/profiles'
import { disableStuff, enableStuff } from '@/content/utils/scroll'
import { $isUnfollowing } from './unfollow-button'
import { setNoticeText } from '@/content/ui/metrics'

export type ButtonState = 'ready' | 'running' | 'paused' | 'resumed' | 'done'

export const $collectFollowingState = atom<ButtonState>('ready')

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

export function getCollectButton() {
    return document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null
}

$collectFollowingState.listen(async (state) => {
    console.log('collect following button state changed:', state)
    await updateCollectButton(state)
})

export const $isCollecting = computed($collectFollowingState, (state) =>
    ['running', 'resumed'].includes(state)
)

export async function updateCollectButton(state: ButtonState = 'ready') {
    const collectBtn = getCollectButton()
    if (!collectBtn) {
        console.error('collect button or notice div not found')
        return
    }
    switch (state) {
        case 'ready':
            collectBtn.innerHTML = 'Collect'
            collectBtn.classList.remove('running')
            break
        case 'running':
        case 'resumed':
            collectBtn.classList.add('running')
            collectBtn.innerHTML = 'Pause'
            disableStuff('collecting')
            await collectFollowing()
            break
        case 'paused':
            collectBtn.innerHTML = 'Resume'
            collectBtn.classList.remove('running')
            enableStuff('collecting')
            break
        case 'done':
            collectBtn.innerHTML = 'Collect'
            collectBtn.classList.remove('running')
            enableStuff('collecting')
            break
        default:
            break
    }
    await setNoticeText(state, 'collect')
}
/**
 * Only run at top of the page where new profiles are loaded
 * @returns true if the user has followed any new profiles since the last time
 */
export async function shouldCollect() {
    if ($followingCount.get() === 0) return true
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
    for (const profile of Array.from(newProfiles)) {
        const profileDetails = await getProfileDetails(profile)
        if (!$following.get().has(profileDetails.handle)) {
            console.log('new profile found:', profileDetails.handle)
            return true
        }
    }
    console.log('no new profiles found')
    return false
}

export function setNoticeLoading(notice: HTMLElement) {
    console.log('setting loading state for notice')
    const loader = createLoadingSpinner()
    notice.innerHTML = loader.outerHTML
    if ($isCollecting.get()) {
        notice.innerHTML +=
            'Collecting accounts you follow. Do not navigate away from this tab until complete.'
    } else if ($isUnfollowing.get()) {
        notice.innerHTML +=
            "Unfollowing accounts...Don't navigate away from this tab until complete."
    }

    return notice
}

export function disableCollectButton(unfollowing?: boolean) {
    const collectBtn = getCollectButton()
    if (!collectBtn) {
        return
    }
    collectBtn.disabled = unfollowing ?? false
}
