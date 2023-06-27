import { atom } from 'nanostores'
import { collectFollowing } from '../collect-following'
import { $following, $followingCount } from '.'

export const $collectFollowingState = atom<
    'ready' | 'stopped' | 'running' | 'done'
>('ready')

export const handleCollectBtn = () => {
    const collectBtn = document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null
    if (collectBtn) {
        switch ($collectFollowingState.get()) {
            case 'ready':
                $collectFollowingState.set('running')
                break
            case 'running':
                if ($following.get().size === $followingCount.get()) {
                    $collectFollowingState.set('done')
                } else {
                    $collectFollowingState.set('stopped')
                }
                break
            default:
                break
        }
    }
}

$collectFollowingState.listen(async (state) => {
    console.log('collect following button state changed:', state)
    const collectBtn = document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null
    if (collectBtn) {
        switch (state) {
            case 'ready':
                collectBtn.innerText = 'Collect Following'
                collectBtn.classList.remove('running')
                break
            case 'running':
                collectBtn.innerText = 'Click to Stop.'
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
