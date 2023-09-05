import {
    $isCollecting,
    ButtonState,
    shouldCollect,
} from '@/content/stores/collect-button'
import {
    $following,
    $followingCount,
    $unfollowing,
} from '@/content/stores/persistent'
import { $isUnfollowing } from '@/content/stores/unfollow-button'
import { $unfollowedProfiles } from '@/content/unfollow'
import { createLoadingSpinner, getNoticeDiv } from '@/content/utils/ui-elements'

export function createMetrics(followingCount: number, unfollowingSize: number) {
    // section that tells user that they should collect their following list. Shown when $followingCount > $following.get().size
    const metrics = document.createElement('div')
    metrics.classList.add('su-metrics')
    metrics.id = 'su-metrics'
    const followingNumber = document.createElement('span')
    followingNumber.classList.add('su-highlight')
    followingNumber.textContent = followingCount.toString()
    const unfollowing = document.createElement('span')
    unfollowing.classList.add('su-highlight')
    unfollowing.textContent = unfollowingSize.toString()
    metrics.innerHTML = `
    <div>Following: ${followingNumber.outerHTML}</div>
    <div>Unfollowing: ${unfollowing.outerHTML}</div>
    `
    // only show notice if collectFollowing has been run on the current session
    return metrics
}

// Notice updated by collectFollowing button state
export async function createNotice() {
    const notice = document.createElement('div')
    notice.classList.add('su-notice')
    notice.id = 'su-notice'
    setCollectNoticeText('ready', notice)
    return notice
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

// TODO: Change based on whether collectFollowing or superUnfollow is running
export async function setCollectNoticeText(
    state: ButtonState,
    notice: HTMLDivElement | null = null
) {
    notice ??= getNoticeDiv()
    if (!notice) {
        console.error('notice div not found')
        return
    }
    const followingCount = $followingCount.get()
    const followingCollected = $following.get().size
    switch (state) {
        case 'ready':
            // state = ready on page load only, so only need to show collect notice
            notice.textContent = (await shouldCollect())
                ? 'Run Collect Following to get started'
                : 'You have no new accounts to collect'
            break
        case 'running':
        case 'resumed':
            setNoticeLoading(notice)
            break
        case 'paused':
            notice.textContent = `${
                followingCount - followingCollected
            } profiles left to collect`
            break
        case 'done':
            if (followingCollected === followingCount || followingCount === 0) {
                notice.classList.add('complete')
                notice.textContent = 'Collected all accounts you follow!'
            } else {
                notice.classList.add('error')
                notice.textContent =
                    'Something went wrong... Re-run Collect Following'
            }

            break
    }
}

export async function setUnfollowNoticeText(state: ButtonState) {
    const notice = getNoticeDiv()
    if (!notice) {
        console.error('notice div not found')
        return
    }
    const unfollowingSize = $unfollowing.get().size
    const unfollowedSize = $unfollowedProfiles.get().size
    switch (state) {
        case 'ready':
            break
        case 'running':
        case 'resumed':
            setNoticeLoading(notice)
            break
        case 'paused':
            notice.textContent = `${
                unfollowingSize - unfollowedSize
            } profiles left to unfollow`
            break
        case 'done':
            if (
                $following.get().size === $followingCount.get() ||
                $followingCount.get() === 0
            ) {
                notice.classList.add('complete')
                notice.textContent = 'Collected all accounts you follow!'
            } else {
                notice.classList.add('error')
                notice.textContent =
                    'Something went wrong... Re-run Collect Following'
            }

            break
    }
}
