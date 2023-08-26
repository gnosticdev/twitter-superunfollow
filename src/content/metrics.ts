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
export const createNotice = () => {
    const notice = document.createElement('div')
    notice.classList.add('su-notice')
    notice.id = 'su-notice'
    notice.textContent = 'Click Collect to get all accounts you follow'
    return notice
}
