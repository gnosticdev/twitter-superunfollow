import type { ButtonState } from '@/content/stores/collect-button'
import { setUnfollowNoticeText } from '@/content/ui/metrics'
import { showUnfollowed, startSuperUnfollow } from '@/content/unfollow'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import {
	getCollectButton,
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
	await setUnfollowNoticeText(newValue)
	switch (newValue) {
		case 'running':
			if (!unfollowButton) return
			unfollowButton.innerText = 'Pause'
			unfollowButton.classList.add('running')
			collectButton.disabled = true
			disableScroll()
			showUnfollowed()
			await startSuperUnfollow()
			break
		case 'paused':
			if (!unfollowButton) return
			unfollowButton.innerText = 'Resume'
			unfollowButton.classList.remove('running')
			collectButton.disabled = false
			enableScroll()
			break
		case 'done':
			if (!unfollowButton) return
			unfollowButton.innerText = 'Unfollow'
			unfollowButton.classList.remove('running')
			collectButton.disabled = false
			enableScroll()
			break
		default:
			break
	}
})

export const isUnfollowing = () => $superUnfollowButtonState.get() === 'running'
