import { atom } from 'nanostores'
import { collectFollowing } from '../collect-following'

export const $collectedFollowingState = atom<'stopped' | 'running'>('stopped')

export const handleCollectBtn = () => {
    const collectBtn = document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null
    if (collectBtn) {
        switch ($collectedFollowingState.get()) {
            case 'stopped':
                $collectedFollowingState.set('running')
                break
            case 'running':
                $collectedFollowingState.set('stopped')
                break
            default:
                break
        }
    }
}

$collectedFollowingState.subscribe(async (state) => {
    const collectBtn = document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null
    if (collectBtn) {
        switch (state) {
            case 'stopped':
                collectBtn.innerText = 'Collect Following'
                collectBtn.classList.remove('running')
                break
            case 'running':
                collectBtn.innerText = 'Collecting...'
                collectBtn.classList.add('running')
                // addRunningOverlay()
                await collectFollowing()
                // removeOverlay()
                break
            default:
                break
        }
    }
})
