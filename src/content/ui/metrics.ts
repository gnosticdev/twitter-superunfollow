import {
	shouldCollect,
	type ButtonState,
} from '@/content/stores/collect-button'
import {
	$collectedFollowing,
	$followingCount,
	// $followingCount,
	$unfollowingList,
} from '@/content/stores/persistent'
import { $unfollowedProfiles } from '@/content/unfollow'
import { createLoadingSpinner, getNoticeDiv } from '@/content/utils/ui-elements'
import { $syncStorage } from '@/shared/storage'
import cc from 'kleur'
import { runningState } from '../stores/running'

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
	followingSpan.classList.add('su-highlight')
	followingSpan.textContent = `${totalFollowing}`

	const collectedFollowing = $collectedFollowing.get()
	const collectedSize = collectedFollowing.size
	console.log(cc.bgBlue(`collectedSize -> ${collectedSize}`))
	const collectedSpan = document.createElement('span')
	collectedSpan.classList.add('su-highlight')
	collectedSpan.textContent = collectedSize.toString()

	$collectedFollowing.listen((collected) => {
		followingSpan.textContent = collected.size.toString()
	})

	const unfollowing = document.createElement('span')
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
	if (runningState() === 'collecting') {
		notice.innerHTML += 'Collecting accounts you follow...'
	} else if (runningState() === 'unfollowing') {
		notice.innerHTML += 'Unfollowing accounts...'
	}
	notice.innerHTML += `<div class="sub-notice">
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
	const followingCount = await $syncStorage.getValue('friends_count')
	const followingCollected = $collectedFollowing.get().size
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
		case 'resumed':
			setNoticeLoading(notice)
			break
		case 'paused':
			notice.textContent = `${
				unfollowingSize - unfollowedSize
			} profiles left to unfollow`
			break
		case 'done': {
			const followingCount = await $syncStorage.getValue('friends_count')
			if (
				followingCount === 0 ||
				$collectedFollowing.get().size === followingCount
			) {
				notice.classList.add('complete')
				notice.textContent = 'Collected all accounts you follow!'
			} else {
				notice.classList.add('error')
				notice.textContent = 'Something went wrong... Re-run Collect Following'
			}
			break
		}
		default:
			break
	}
}
