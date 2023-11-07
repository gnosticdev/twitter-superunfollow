import { action, atom, computed } from 'nanostores'
import { $collectFollowingState } from '@/content/stores/collect-button'
import { $superUnfollowButtonState } from './unfollow-button'

export const $lastOperation = atom<'unfollowing' | 'collecting' | null>(null)

const setLastOperation = action(
    $lastOperation,
    'setLastOperation',
    (store, operation: 'unfollowing' | 'collecting') => {
        store.set(operation)
    }
)

export const $unfollowingRunning = computed(
    $superUnfollowButtonState,
    (state) => state === 'running' || state === 'resumed'
)
console.log('collect following state:', $collectFollowingState.get())
export const $collectingRunning = computed(
    $collectFollowingState,
    (state) => state === 'running' || state === 'resumed'
)

export const $runningState = computed(
    [$unfollowingRunning, $collectingRunning],
    (unfollowingRunning, collectingRunning) => {
        console.log('unfollowing running:', unfollowingRunning)
        console.log('collecting running:', collectingRunning)
        if (unfollowingRunning) {
            setLastOperation('unfollowing')
            return 'unfollowing'
        } else if (collectingRunning) {
            setLastOperation('collecting')
            return 'collecting'
        } else {
            return null
        }
    }
)
