import { atom, computed } from 'nanostores'
import { collectFollowing } from '@/content/collect-following'
import { createLoadingSpinner } from '@/content/utils/utils'
import { $following, $followingCount } from './persistent'
import { Selectors } from '@/shared/shared'
import { getProfileDetails } from '@/content/profiles'
import { disableStuff, enableStuff } from '@/content/utils/scroll'
import { $isUnfollowing } from './unfollow-button'

export const $collectFollowingState = atom<ButtonState>('ready')

export function handleCollectBtn() {
    const collectBtn = getCollectBtn()
    if (collectBtn) {
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
}

export const getCollectBtn = () =>
    document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null

export const getNoticeDiv = () =>
    document.getElementById('su-notice') as HTMLDivElement | null

$collectFollowingState.listen(async (state) => {
    console.log('collect following button state changed:', state)
    await updateCollect(state)
})

export const $isCollecting = computed($collectFollowingState, (state) =>
    ['running', 'resumed'].includes(state)
)

export const updateCollect = async (state: ButtonState) => {
    state = state ?? 'ready'
    const notice = document.getElementById('su-notice') as HTMLDivElement | null
    const collectBtn = getCollectBtn()
    const collected = $following.get().size
    const total = $followingCount.get()
    if (!collectBtn || !notice) {
        return
    }
    switch (state) {
        case 'ready':
            collectBtn.innerHTML = 'Collect'
            collectBtn.classList.remove('running')
            const needsToCollect = await shouldCollect()
            notice.textContent = needsToCollect
                ? 'Run Collect Following to get started'
                : 'You have no new accounts to collect'
            break
        case 'running':
        case 'resumed':
            collectBtn.classList.add('running')
            collectBtn.innerHTML = 'Pause'
            disableStuff('collecting')
            setNoticeLoading(notice)
            await collectFollowing()
            break
        case 'paused':
            collectBtn.innerHTML = 'Resume'
            collectBtn.classList.remove('running')
            notice.textContent = `Need to collect ${
                total - collected
            } more accounts`
            enableStuff('collecting')
            break
        case 'done':
            collectBtn.innerHTML = 'Collect'
            collectBtn.classList.remove('running')
            notice.classList.add('complete')
            notice.innerHTML =
                collected === total
                    ? 'Collected all accounts you follow!'
                    : collected > total
                    ? "Collected more than expected, is there something you didn't tell me?!"
                    : 'Collected less than expected 😔<br>You can refresh the page and try again to start over.'
            enableStuff('collecting')
            break
        default:
            break
    }
}

/**
 * Only run at top of the page where new profiles are loaded
 * @returns true if the user has followed any new profiles since the last time
 */
export const shouldCollect = async () => {
    const following = $following.get().size
    const total = $followingCount.get()
    const changed = await followingChanged()
    return following !== total || changed
}

/**
 * Check if the user has followed any new profiles since the last time
 */
const followingChanged = async () => {
    const existingProfiles = $following.get()
    const newProfiles = document.querySelectorAll(
        Selectors.PROFILE_INNER
    ) as NodeListOf<ProfileInner>

    for (const profile of Array.from(newProfiles)) {
        const profileDetails = await getProfileDetails(profile)
        if (!existingProfiles.has(profileDetails.handle)) {
            return true
        }
    }
    return false
}

export const setNoticeLoading = (notice: HTMLElement) => {
    console.log('setting loading state for notice')
    const loader = createLoadingSpinner()
    notice.innerHTML = loader.outerHTML
    if ($isCollecting.get()) {
        notice.innerHTML += 'Collecting accounts you follow...'
    } else if ($isUnfollowing.get()) {
        notice.innerHTML += 'Unfollowing accounts...'
    }

    return notice
}

export const disableCollectBtn = (unfollowing?: boolean) => {
    const collectBtn = getCollectBtn()
    if (!collectBtn) {
        return
    }
    collectBtn.disabled = unfollowing ?? false
}
