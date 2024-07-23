import { collectFollowing } from '@/content/collect-following'
import { getProfileDetails } from '@/content/profiles'
import { setCollectNoticeText } from '@/content/ui/metrics'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import {
	getCollectButton,
	getInnerProfiles,
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
	if (!unfollowButton) return
	switch (state) {
		case 'ready':
			collectButton.innerHTML = 'Collect'
			collectButton.classList.remove('running')
			unfollowButton.disabled = false
			enableScroll()
			await setCollectNoticeText(state)
			break
		case 'running':
			collectButton.classList.add('running')
			collectButton.innerHTML = 'Pause'
			unfollowButton.disabled = true
			disableScroll()
			await setCollectNoticeText(state)
			await collectFollowing()
			break
		case 'paused':
			collectButton.innerHTML = 'Resume'
			collectButton.classList.remove('running')
			unfollowButton.disabled = false
			await setCollectNoticeText(state)
			enableScroll()
			break
		case 'done':
			collectButton.innerHTML = 'Collect'
			collectButton.classList.remove('running')
			unfollowButton.disabled = false
			enableScroll()
			await setCollectNoticeText(state)
			break
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
 * @returns true if the user has followed any new profiles since the last time
 */
export async function shouldCollect() {
	const followingCount = await $followingCount()
	if (followingCount === 0) {
		return true
	}
	if ($collectedFollowing.get().size !== followingCount) {
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
