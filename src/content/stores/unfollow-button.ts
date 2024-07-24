import type { ButtonState } from '@/content/stores/collect-button'
import {
	$collectedFollowing,
	$followingCount,
	$unfollowingList,
} from '@/content/stores/persistent'
import {
	$unfollowedProfiles,
	showUnfollowed,
	startSuperUnfollow,
} from '@/content/unfollow'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import {
	createLoadingSpinner,
	getCollectButton,
	getNoticeDiv,
	getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import { atom } from 'nanostores'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<ButtonState>('ready')

// Runs before new values are set
$superUnfollowButtonState.listen(async (newValue) => {
	console.log('superunfollow button state changed:', ` -> ${newValue}`)
	const unfollowButton = getSuperUnfollowButton()
	const collectButton = getCollectButton()
	const notice = getNoticeDiv()

	switch (newValue) {
		case 'running': {
			if (!unfollowButton) return
			notice.innerHTML += `${createLoadingSpinner().outerHTML} Unfollowing accounts...
			<div style="margin-block: 0.5rem;">
                Don't navigate away from the page
                </div>
                `
			unfollowButton.innerText = 'Abort'
			unfollowButton.classList.add('running')
			collectButton.disabled = true
			disableScroll()
			showUnfollowed()
			await startSuperUnfollow()
			break
		}
		case 'paused': {
			if (!unfollowButton) return
			unfollowButton.innerText = 'Resume'
			unfollowButton.classList.remove('running')
			collectButton.disabled = false
			notice.textContent = `${
				$unfollowingList.get().size - $unfollowedProfiles.get().size
			} profiles left to unfollow`
			enableScroll()
			break
		}
		case 'done': {
			if (!unfollowButton) return
			unfollowButton.innerText = 'Start Unfollowing'
			unfollowButton.classList.remove('running')
			collectButton.disabled = false
			const totalFollowing = await $followingCount()
			if (
				totalFollowing === 0 ||
				$collectedFollowing.get().size === totalFollowing
			) {
				notice.classList.add('complete')
				notice.textContent = `Unfollowed ${$unfollowedProfiles.get().size} accounts!`
			} else {
				notice.classList.add('error')
				notice.textContent = 'Run Collect Following before unfollowing'
			}
			enableScroll()
			break
		}
		default:
			if (unfollowButton) {
				unfollowButton.disabled = $unfollowingList.get().size === 0
			}
			break
	}
})

export const isUnfollowing = () => $superUnfollowButtonState.get() === 'running'
