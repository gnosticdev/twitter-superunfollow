import {
	type ButtonState,
	isCollecting,
	shouldCollect,
} from '@/content/stores/collect-button'
import {
	$collectedFollowing,
	$followingCount,
	// $followingCount,
	$unfollowingList,
} from '@/content/stores/persistent'
import { isUnfollowing } from '@/content/stores/unfollow-button'
import { $unfollowedProfiles } from '@/content/unfollow'
import {
	createLoadingSpinner,
	getNoticeDiv,
	getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import { $userData } from '@/shared/storage'
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
	setCollectNoticeText('ready', notice)
	return notice
}

export function setNoticeLoading(notice: HTMLElement) {
	console.log('setting loading state for notice')
	const loader = createLoadingSpinner()
	notice.innerHTML = loader.outerHTML
	if (isCollecting()) {
		notice.innerHTML += 'Collecting accounts you follow...'
	} else if (isUnfollowing()) {
		notice.innerHTML += 'Unfollowing accounts...'
	}
	notice.innerHTML += `<div style="margin-block: 0.5rem;">
                Don't navigate away from the page
                </div>
                `
	return notice
}

export async function setCollectNoticeText(
	state: ButtonState,
	notice: HTMLDivElement | null = null,
) {
	// biome-ignore lint: confusing but works
	notice ??= getNoticeDiv()
	const followingCount = await $userData.getValue('friends_count')
	if (!followingCount) {
		notice.textContent = 'No accounts to collect'
		return
	}
	const followingCollected = $collectedFollowing.get().size
	switch (state) {
		case 'ready':
			// state = ready on page load only, so only need to show collect notice
			notice.textContent = (await shouldCollect())
				? 'Run Collect Following to get started'
				: 'You have no new accounts to collect'
			break
		case 'running':
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
				notice.textContent = 'Something went wrong... Re-run Collect Following'
			}
			break
		default:
			break
	}
}

export async function setUnfollowNoticeText(state: ButtonState) {
	const notice = getNoticeDiv()
	const unfollowingSize = $unfollowingList.get().size
	const unfollowedSize = $unfollowedProfiles.get().size
	switch (state) {
		case 'running':
			setNoticeLoading(notice)
			break
		case 'paused':
			notice.textContent = `${
				unfollowingSize - unfollowedSize
			} profiles left to unfollow`
			break
		case 'done': {
			const followingCount = await $followingCount()
			if (
				followingCount === 0 ||
				$collectedFollowing.get().size === followingCount
			) {
				notice.classList.add('complete')
				notice.textContent = `Unfollowed ${unfollowedSize} accounts!`
			} else {
				notice.classList.add('error')
				notice.textContent = 'Might want to re-run Collect Following'
			}
			break
		}
		default:
			break
	}
}
