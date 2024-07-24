import { shouldCollect } from '@/content/stores/collect-button'
import {
	$collectedFollowing,
	$followingCount,
	// $followingCount,
	$unfollowingList,
} from '@/content/stores/persistent'
import {
	createLoadingSpinner,
	getNoticeDiv,
	getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import cc from 'kleur'

export function updateTotalFollowingText(number: number) {
	const followingSpan = document.getElementById('su-following-count')
	if (followingSpan) {
		followingSpan.textContent = number.toString()
	}
}

$collectedFollowing.listen((collected) => {
	const followingSpan = document.getElementById('su-collected-count')
	if (!followingSpan) return

	followingSpan.textContent = collected.size.toString()
})

$unfollowingList.listen((unfollowing) => {
	const unfollowingSpan = document.getElementById('su-unfollowing-count')
	if (unfollowingSpan) unfollowingSpan.textContent = unfollowing.size.toString()
	const superUnfollowButton = getSuperUnfollowButton()
	if (superUnfollowButton) {
		superUnfollowButton.disabled = unfollowing.size === 0
	}
})

export async function createMetrics() {
	// if already exists, remove it
	const existingMetrics = document.getElementById('su-metrics')
	if (existingMetrics) {
		existingMetrics.remove()
	}

	// section that tells user that they should collect their following list. Shown when $followingCount > $following.get().size
	const metrics = document.createElement('div')
	metrics.classList.add('su-metrics')
	metrics.id = 'su-metrics'
	const totalFollowing = await $followingCount()
	console.log(cc.bgBlue(`followingNumber -> ${totalFollowing}`))

	const followingSpan = document.createElement('span')
	followingSpan.id = 'su-following-count'
	followingSpan.classList.add('su-highlight')
	followingSpan.textContent = `${totalFollowing}`

	const collectedFollowing = $collectedFollowing.get()
	const collectedSize = collectedFollowing.size
	console.log(cc.bgBlue(`collectedSize -> ${collectedSize}`))
	const collectedSpan = document.createElement('span')
	collectedSpan.id = 'su-collected-count'
	collectedSpan.classList.add('su-highlight')
	collectedSpan.textContent = collectedSize.toString()

	const unfollowing = document.createElement('span')
	unfollowing.id = 'su-unfollowing-count'
	unfollowing.classList.add('su-highlight')
	unfollowing.textContent = $unfollowingList.get().size.toString()
	metrics.innerHTML = `
    <div>Following: ${followingSpan.outerHTML}</div>
	<div>Collected: ${collectedSpan.outerHTML}</div>
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
	notice.textContent = (await shouldCollect())
		? 'Run Collect Following to get started'
		: 'You have no new accounts to collect'
	return notice
}

export function setNoticeLoading(state: 'collecting' | 'unfollowing') {
	console.log('setting loading state for notice')
	const notice = getNoticeDiv()
	const loader = createLoadingSpinner()
	notice.innerHTML = loader.outerHTML
	if (state === 'collecting') {
		notice.innerHTML += 'Collecting accounts you follow...'
	}
	if (state === 'unfollowing') {
		notice.innerHTML += 'Unfollowing accounts...'
	}
	notice.innerHTML += `<div style="margin-block: 0.5rem;">
                Don't navigate away from the page
                </div>
                `
	return notice
}
