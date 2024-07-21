import type { ButtonState } from '@/content/stores/collect-button'
import { setUnfollowNoticeText } from '@/content/ui/metrics'
import {
	$unfollowedProfiles,
	showUnfollowed,
	startSuperUnfollow,
} from '@/content/unfollow'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import {
	getCollectButton,
	getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import { action, atom, computed, onSet } from 'nanostores'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<ButtonState>('ready')

const setRunning = action($superUnfollowButtonState, 'setRunning', (store) => {
	store.set('running')
})

export const setUnfollowPaused = action(
	$superUnfollowButtonState,
	'setPaused',
	(store) => {
		store.set('paused')
	},
)

const setResumed = action($superUnfollowButtonState, 'setResumed', (store) => {
	store.set('resumed')
})

export const setUnfollowDone = action(
	$superUnfollowButtonState,
	'setDone',
	(store) => {
		store.set('done')
	},
)

// start superunfollow process
export async function handleUnfollowButton() {
	console.log('superunfollow button clicked')
	switch ($superUnfollowButtonState.get()) {
		case 'done':
		case 'ready':
			setRunning()
			break
		case 'resumed':
		case 'running':
			setUnfollowPaused()
			break
		case 'paused':
			setResumed()
			break
		// 'done' doesnt get set by the button click, use a computed store for that...
		default:
			break
	}
}

// Runs before new values are set
onSet($superUnfollowButtonState, async ({ newValue, changed }) => {
	console.log(
		'superunfollow button state changed:',
		`${changed} -> ${newValue}`,
	)
	const unfollowButton = getSuperUnfollowButton()
	const collectButton = getCollectButton()
	setUnfollowNoticeText(newValue)
	switch (newValue) {
		case 'running':
		case 'resumed':
			unfollowButton.innerText = 'Pause'
			unfollowButton.classList.add('running')
			collectButton.disabled = true
			disableScroll()
			showUnfollowed($unfollowedProfiles.get())
			await startSuperUnfollow()
			break
		case 'paused':
			unfollowButton.innerText = 'Resume'
			unfollowButton.classList.remove('running')
			collectButton.disabled = false
			enableScroll()
			break
		case 'done':
			unfollowButton.innerText = 'Unfollow'
			unfollowButton.classList.remove('running')
			collectButton.disabled = false
			enableScroll()
			break
		default:
			break
	}
})

export const $unfollowingRunning = computed(
	$superUnfollowButtonState,
	(state) => state === 'running' || state === 'resumed',
)
