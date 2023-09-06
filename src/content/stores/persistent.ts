import { persistentAtom } from '@nanostores/persistent'
import { createMetrics } from '@/content/ui/metrics'
import { $needToCollect } from '@/content/main'
import { action } from 'nanostores'
import { getSuperUnfollowButton } from '@/content/utils/ui-elements'

/**
 * Map of profiles that are selected to be unfollowed by the user. Can be added/removed by checking the checkbox next to the profile, or from the dialog
 * The key is the user's handle, and the value is the profile details.
 */
export const $unfollowing = persistentAtom(
    'unfollowing',
    new Map<string, ProfileDetail>(),
    {
        encode: (value) => {
            return JSON.stringify(Array.from(value.entries()))
        },
        decode: (value) => {
            return new Map(JSON.parse(value))
        },
    }
)

$unfollowing.listen((unfollow) => {
    getSuperUnfollowButton().disabled = unfollow.size === 0
    const unfollowingSize = unfollow.size
    updateMetrics({ unfollowingSize })
})

/**
 * Disables or enables the unfollow button based on the number of profiles being unfollowed
 */
export function enableUnfollowButton(
    unfollowingSize: number,
    button?: HTMLButtonElement
) {
    button ??= getSuperUnfollowButton()
    button.disabled = unfollowingSize === 0
}

/**
 * Map of profiles that are being followed by the user. The key is the user's handle, and the value is the profile details.
 * Populated as the user scrolls through down following page, and profiles are added to the DOM. Also populated by using the Collect button.
 */
export const $following = persistentAtom(
    'following',
    new Map<string, ProfileDetail>(),
    {
        encode: (value) => {
            return JSON.stringify(Array.from(value.entries()))
        },
        decode: (value) => {
            return new Map(JSON.parse(value))
        },
    }
)

function updateMetrics({ unfollowingSize }: { unfollowingSize: number }) {
    const count = $followingCount.get()
    const metricsContainer = createMetrics(count, unfollowingSize)
    // remove the current metrics and replace with the updated metrics
    const currentMetrics = document.getElementById('su-metrics')
    currentMetrics?.replaceWith(metricsContainer)
}

/**
 * the total number of accounts that are being followed by the user, according to the Twitter __INITIAL_STATE__ object, recorded at page load.
 */
export const $followingCount = persistentAtom<number>('followingCount', 0, {
    encode: (value) => value.toString(),
    decode: (value) => parseInt(value),
})

$followingCount.listen((count) => {
    const oldValue = $followingCount.get()
    if (oldValue !== count && count > 0) {
        console.log(`following count changed from ${oldValue} to ${count}`)
        $needToCollect.set(true)
    }
})

/**
 * Adds a profile to the $unfollowing store
 * @param handle
 * @param profileData
 * @returns {ProfileDetail}
 */
export function addUnfollowing(handle: string, profileData: ProfileDetail) {
    const unfollowingMap = $unfollowing.get()
    if (unfollowingMap.has(handle)) {
        return
    }
    // get the index from the length of the map
    const index = unfollowingMap.size
    // add the index to the user
    const profile = { ...profileData, index }
    $unfollowing.set(new Map([...unfollowingMap.set(handle, profile)]))

    return $unfollowing.get().get(handle)!
}

export const removeUnfollowing = action(
    $unfollowing,
    'removeUnfollowing',
    async (store, handle: string) => {
        console.log('removing unfollowing', handle)
        const currentUnfollowing = store.get()
        currentUnfollowing.delete(handle)
        store.set(new Map([...Array.from(currentUnfollowing)]))

        return store.get()
    }
)

// export function removeUnfollowing(handle: string) {
//     const unfollowing = $unfollowing.get()
//     unfollowing.delete(handle)
//     $unfollowing.set(new Map([...Array.from(unfollowing)]))

//     return $unfollowing.get()
// }

/**
 * Adds a profile to the $following store
 * @param handle
 * @param profileData
 * @returns {ProfileDetail}
 */
export function addFollowing(
    handle: string,
    profileData: Omit<ProfileDetail, 'index'>
) {
    const followingMap = $following.get()
    if (followingMap.has(handle)) {
        return followingMap.get(handle)!
    }
    // get the index from the length of the map
    const index = followingMap.size
    // add the index to the user
    const profile = { ...profileData, index }
    $following.set(new Map([...followingMap.set(handle, profile)]))

    return followingMap.get(handle)!
}

/**
 * Removes a profile from the $following store
 * @param handle
 * @returns {Map<string, ProfileDetail>}
 */
export function removeFollowing(handle: string) {
    const following = $following.get()
    following.delete(handle)
    $following.set(new Map([...Array.from(following)]))

    return $following.get()
}
