import { atom } from 'nanostores'
import { collectFollowing } from '@/content/collect-following'
import { disableScroll, enableScroll } from '@/content/utils/scroll'
import { createLoadingSpinner } from '@/content/utils/utils'
import { $following, $followingCount } from './persistent'

export const $collectFollowingState = atom<ButtonState>('ready')

export function handleCollectBtn() {
    const collectBtn = getCollectBtn()
    if (collectBtn) {
        switch ($collectFollowingState.get()) {
            case 'ready':
            case 'done':
                $collectFollowingState.set('running')
                break
            case 'resumed':
            case 'running':
                $collectFollowingState.set('paused')
                break
            case 'paused':
                $collectFollowingState.set('resumed')
                break
            default:
                break
        }
    }
}

export const getCollectBtn = () =>
    document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null

export const getNoticeDiv = () =>
    document.getElementById('su-notice') as HTMLDivElement | null

$collectFollowingState.listen(async (state) => {
    console.log('collect following button state changed:', state)
    await updateFollowingStats(state)
})

export const updateFollowingStats = async (state: ButtonState) => {
    state = state ?? 'ready'
    const notice = document.getElementById('su-notice') as HTMLDivElement | null
    const collectBtn = getCollectBtn()
    const collected = $following.get().size
    const total = $followingCount.get()
    if (!collectBtn || !notice) {
        return
    }
    switch (state) {
        case 'ready':
            collectBtn.innerHTML = 'Collect'
            collectBtn.classList.remove('running')
            notice.textContent = 'Run Collect Following to get started'
            break
        case 'running':
        case 'resumed':
            collectBtn.classList.add('running')
            collectBtn.innerHTML = 'Pause'
            disableScroll()
            setNoticeLoading(notice)
            await collectFollowing()
            break
        case 'paused':
            collectBtn.innerHTML = 'Resume'
            collectBtn.classList.remove('running')
            notice.textContent = `Need to collect ${
                total - collected
            } more accounts`
            enableScroll()
            break
        case 'done':
            collectBtn.innerHTML = 'Collect'
            collectBtn.classList.remove('running')
            notice.classList.add('complete')
            notice.innerHTML =
                collected === total
                    ? 'Collected all accounts you follow!'
                    : collected > total
                    ? "Collected more than expected, is there something you didn't tell me?!"
                    : 'Collected less than expected 😔<br>You can refresh the page and try again to start over.'
            enableScroll()
            break
        default:
            break
    }
}

const setNoticeLoading = (notice: HTMLElement) => {
    console.log('setting loading state for notice')
    const loader = createLoadingSpinner()
    notice.innerHTML = `${loader.outerHTML} Collecting accounts you follow...`

    return notice
}
