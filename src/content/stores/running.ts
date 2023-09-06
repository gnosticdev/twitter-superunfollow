import { action, atom, computed } from 'nanostores'
import { $collectFollowingState } from '@/content/stores/collect-button'
import { $superUnfollowButtonState } from './unfollow-button'
import { logger } from '@nanostores/logger'

export const $lastOperation = atom<'unfollowing' | 'collecting' | null>(null)
const setLastOperation = action(
    $lastOperation,
    'setLastOperation',
    (store, operation: 'unfollowing' | 'collecting') => {
        store.set(operation)
    }
)

export const $runningState = computed(
    [$superUnfollowButtonState, $collectFollowingState],
    (unfollowingState, collectingState) => {
        const unfollowing =
            unfollowingState === 'running' || unfollowingState === 'resumed'
        const collecting =
            collectingState === 'running' || collectingState === 'resumed'
        const running = unfollowing || collecting
        // keep track of the last operation to run
        if (running) {
            setLastOperation(unfollowing ? 'unfollowing' : 'collecting')
        }

        return {
            unfollowing,
            collecting,
            running,
        }
    }
)

const l = logger({
    'running state': $runningState,
    'unfollow button state': $superUnfollowButtonState,
    'collect button state': $collectFollowingState,
})
l()
