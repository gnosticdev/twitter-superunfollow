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
    setNoticeText('ready', 'collect', notice)
    return notice
}

// TODO: Change based on whether collectFollowing or superUnfollow is running
export async function setNoticeText(
    state: ButtonState,
    noticeFor: 'collect' | 'unfollow',
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
                unfollowingSize - unfollowedSize
            } profiles left to unfollow`
            break
        case 'done':
            if (noticeFor === 'collect') {
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
            }
            if (noticeFor === 'unfollow') {
                notice.classList.add('complete')
                notice.innerHTML =
                    unfollowingSize === 0
                        ? `Unfollowed ${unfollowedSize} profiles!`
                        : unfollowingSize > 0
                        ? `Unfollowed ${unfollowedSize} profiles! Only ${unfollowingSize} profiles to go...`
                        : 'Unfollowed 0 profiles... weird...'
            }
            break
    }
}
