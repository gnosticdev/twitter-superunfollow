import { $collectingRunning } from '@/content/stores/collect-button'
import { $unfollowingRunning } from '@/content/stores/unfollow-button'

import { atom } from 'nanostores'

export const $lastOperation = atom<'unfollowing' | 'collecting' | null>(null)

export const $runningState = () => {
	if ($collectingRunning.get()) {
		return 'collecting'
	}
	if ($unfollowingRunning.get()) {
		return 'unfollowing'
	}
	return null
}
