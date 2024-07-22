import type { ButtonState } from '@/content/stores/collect-button'
import { setUnfollowNoticeText } from '@/content/ui/metrics'
import { showUnfollowed, startSuperUnfollow } from '@/content/unfollow'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import {
	getCollectButton,
	getSuperUnfollowButton,
} from '@/content/utils/ui-elements'
import { logger, buildLogger } from '@nanostores/logger'
import { action, atom, onSet } from 'nanostores'

// Create a new store for the button state
export const $superUnfollowButtonState = atom<ButtonState>('ready')

const _log = buildLogger($superUnfollowButtonState, 'superunfollow-button', {})

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
	const state = $superUnfollowButtonState.get()
	console.log('superunfollow button state:', state)
	switch (state) {
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
	await setUnfollowNoticeText(newValue)
	switch (newValue) {
		case 'running':
		case 'resumed':
			unfollowButton.innerText = 'Pause'
			unfollowButton.classList.add('running')
			collectButton.disabled = true
			disableScroll()
			showUnfollowed()
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

export const isUnfollowing = () => {
	const state = $superUnfollowButtonState.get()
	return state === 'running' || state === 'resumed'
}

const stopLogging = logger({ $superUnfollowButtonState })
