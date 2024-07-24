import { collectFollowing } from '@/content/collect-following'
import { getProfileDetails } from '@/content/profiles'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import {
	createLoadingSpinner,
	getCollectButton,
	getInnerProfiles,
	getNoticeDiv,
	getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import { atom } from 'nanostores'
import { $collectedFollowing, $followingCount } from './persistent'

export type ButtonState = 'ready' | 'running' | 'paused' | 'done'

export const $collectFollowingState = atom<ButtonState>('ready')

// gotta use `listen` bc `subscribe` will call before the elements are connected to DOM
$collectFollowingState.listen(async (state) => {
	console.log('collect following button state changed:', state)
	const collectButton = getCollectButton()
	const unfollowButton = getSuperUnfollowButton()
	const totalFollowingCount = await $followingCount()

	const notice = getNoticeDiv()
	if (totalFollowingCount === 0) {
		notice.textContent = 'No accounts to collect'
		return
	}
	if (!unfollowButton) return
	switch (state) {
		case 'ready':
			collectButton.innerHTML = 'Collect'
			collectButton.classList.remove('running')
			unfollowButton.disabled = false
			enableScroll()
			notice.textContent = (await shouldCollect())
				? 'Run Collect Following to get started'
				: 'You have no new accounts to collect'
			break
		case 'running': {
			collectButton.classList.add('running')
			collectButton.innerHTML = 'Pause'
			unfollowButton.disabled = true
			notice.innerHTML += `${createLoadingSpinner().outerHTML} Collecting accounts you follow...
			<div style="margin-block: 0.5rem;">
                Don't navigate away from the page
                </div>
                `
			disableScroll()
			await collectFollowing()
			break
		}
		case 'paused': {
			collectButton.innerHTML = 'Resume'
			collectButton.classList.remove('running')
			unfollowButton.disabled = false
			const followingCount = await $followingCount()
			notice.textContent = `${
				followingCount - $collectedFollowing.get().size
			} profiles left to collect`
			enableScroll()
			break
		}
		case 'done': {
			collectButton.innerHTML = 'Collect'
			collectButton.classList.remove('running')
			unfollowButton.disabled = false
			enableScroll()
			const followingCollected = $collectedFollowing.get().size
			if (
				followingCollected === totalFollowingCount ||
				totalFollowingCount === 0
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
})

export const isCollecting = () => {
	const state = $collectFollowingState.get()
	return state === 'running'
}
/**
 * Only run at top of the page where new profiles are loaded
 * @returns true if the number of following is different, or user has followed any new profiles since the last time
 */
export async function shouldCollect() {
	const totalFollowingCount = await $followingCount()
	if (totalFollowingCount === 0) {
		return false
	}
	if ($collectedFollowing.get().size !== totalFollowingCount) {
		console.log('following count mismatch, user should collect')
		return true
	}
	const hasNewProfiles = await isFollowingNewProfiles()
	return hasNewProfiles === true
}

/**
 * Check if the user has followed any new profiles since the last time
 */
async function isFollowingNewProfiles() {
	const newProfiles = getInnerProfiles()
	for await (const profile of Array.from(newProfiles)) {
		const profileDetails = await getProfileDetails(profile)
		if (!$collectedFollowing.get().has(profileDetails.handle)) {
			console.log('new profile found:', profileDetails.handle)
			return true
		}
	}
	console.log('no new profiles found')
	return false
}
