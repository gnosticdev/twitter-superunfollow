import {
    ButtonState,
    setNoticeLoading,
    shouldCollect,
} from '@/content/stores/collect-button'
import {
    $following,
    $followingCount,
    $unfollowing,
} from '@/content/stores/persistent'
import { $unfollowedProfiles } from '@/content/unfollow'
import { getNoticeDiv } from '@/content/utils/ui-elements'

export function createMetrics(
    followingCount: number,
    followingSize: number,
    unfollowingSize: number
) {
    // section that tells user that they should collect their following list. Shown when $followingCount > $following.get().size
    const metrics = document.createElement('div')
    metrics.classList.add('su-metrics')
    metrics.id = 'su-metrics'
    const followingNumber = document.createElement('span')
    followingNumber.classList.add('su-highlight')
    followingNumber.textContent = followingCount.toString()
    const lastCollected = document.createElement('span')
    lastCollected.classList.add('su-highlight')
    lastCollected.textContent = followingSize.toString()
    const unfollowing = document.createElement('span')
    unfollowing.classList.add('su-highlight')
    unfollowing.textContent = unfollowingSize.toString()
    metrics.innerHTML = `<div>Following: ${followingNumber.outerHTML}</div><div>Collected: ${lastCollected.outerHTML}</div><div>Unfollowing: ${unfollowing.outerHTML}</div>`

    // only show notice if collectFollowing has been run on the current session
    return metrics
}

// Notice updated by collectFollowing button state
export async function createNotice() {
    const notice = document.createElement('div')
    notice.classList.add('su-notice')
    notice.id = 'su-notice'
    setNoticeText('ready', notice)
    return notice
}

// TODO: Change based on whether collectFollowing or superUnfollow is running
export async function setNoticeText(
    state: ButtonState,
    notice: HTMLDivElement | null = null
) {
    notice ??= getNoticeDiv()
    if (!notice) {
        console.error('notice div not found')
        return
    }
    const unfollowingSize = $unfollowing.get().size
    const unfollowedSize = $unfollowedProfiles.get().size
    switch (state) {
        case 'ready':
            const needsToCollect = await shouldCollect()
            notice.textContent = needsToCollect
                ? 'Run Collect Following to get started'
                : 'You have no new accounts to collect'
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
            notice.classList.add('complete')
            notice.innerHTML =
                $following.get().size === $followingCount.get()
                    ? 'Collected all accounts you follow!'
                    : $following.get().size > $followingCount.get()
                    ? "Collected more than expected, is there something you didn't tell me?!"
                    : 'Collected less than expected 😔<br>You can refresh the page and try again to start over.'
            break
    }
}
