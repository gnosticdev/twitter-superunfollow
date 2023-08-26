import { persistentAtom } from '@nanostores/persistent'
import { enableDisableUnfollowBtn } from '@/content/stores/unfollow-button'
import { createMetrics } from '@/content/metrics'
import { $needToCollect } from '@/content/main'

export const $unfollowing = persistentAtom(
    'unfollowing',
    new Map<string, ProfileDetails>(),
    {
        encode: (value) => {
            return JSON.stringify(Array.from(value.entries()))
        },
        decode: (value) => {
            return new Map(JSON.parse(value))
        },
    }
)

// Subscriptions
$unfollowing.listen((unfollow) => {
    console.log(`now unfollowing ${unfollow.size.toString()} profiles`)
    enableDisableUnfollowBtn(unfollow.size)
    const followingSize = $following.get().size
    const unfollowingSize = unfollow.size
    updateMetrics(followingSize, unfollowingSize)
})

export const $following = persistentAtom(
    'following',
    new Map<string, ProfileDetails>(),
    {
        encode: (value) => {
            return JSON.stringify(Array.from(value.entries()))
        },
        decode: (value) => {
            return new Map(JSON.parse(value))
        },
    }
)

// listen to the $following store and update the metrics when it changes
$following.listen((following) => {
    const followingSize = following.size
    const unfollowingSize = $unfollowing.get().size
    updateMetrics(followingSize, unfollowingSize)
})

const updateMetrics = (followingSize: number, unfollowingSize: number) => {
    console.log('updating metrics')
    const count = $followingCount.get()
    const metricsContainer = createMetrics(
        count,
        followingSize,
        unfollowingSize
    )
    // remove the current metrics and replace with the updated metrics
    const currentMetrics = document.getElementById('su-metrics')
    currentMetrics?.replaceWith(metricsContainer)
}

export const $followingCount = persistentAtom('followingCount', 0, {
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

export const addUnfollowing = (handle: string, profileData: ProfileDetails) => {
    if ($unfollowing.get().has(handle)) {
        return
    }
    // get the index from the length of the map
    const index = $unfollowing.get().size
    // add the index to the user
    const profile = { ...profileData, index }
    $unfollowing.set(new Map([...$unfollowing.get().set(handle, profile)]))

    return $unfollowing.get().get(handle)!
}

export const removeUnfollowing = (handle: string) => {
    const unfollowing = $unfollowing.get()
    unfollowing.delete(handle)
    $unfollowing.set(new Map([...Array.from(unfollowing)]))

    return $unfollowing.get()
}

export const addFollowing = (
    handle: string,
    profileData: Omit<ProfileDetails, 'index'>
) => {
    if ($following.get().has(handle)) {
        return $following.get().get(handle)!
    }
    // get the index from the length of the map
    const index = $following.get().size
    // add the index to the user
    const profile = { ...profileData, index }
    $following.set(new Map([...$following.get().set(handle, profile)]))

    return $following.get().get(handle)!
}

export const removeFollowing = (handle: string) => {
    const following = $following.get()
    following.delete(handle)
    $following.set(new Map([...Array.from(following)]))

    return $following.get()
}
