import { isCollecting } from '@/content/stores/collect-button'
import { isUnfollowing } from '@/content/stores/unfollow-button'

import { atom } from 'nanostores'

export const $lastOperation = atom<'unfollowing' | 'collecting' | null>(null)

export const runningState = () => {
	if (isCollecting()) {
		return 'collecting'
	}
	if (isUnfollowing()) {
		return 'unfollowing'
	}
	return null
}
