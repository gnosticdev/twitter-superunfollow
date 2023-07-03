import { persistentAtom } from '@nanostores/persistent'
import { setUnfollowBtn } from '@/store/unfollow-button'
import { createMetrics } from '@/content/dialog'
import { atom } from 'nanostores'

export const $unfollowing = persistentAtom('unfollowing', new Set<string>(), {
    encode: (value) => {
        return JSON.stringify(Array.from(value))
    },
    decode: (value) => {
        return new Set(JSON.parse(value))
    },
})

// Subscriptions
$unfollowing.listen((unfollow) => {
    console.log(`now unfollowing ${unfollow.size.toString()} profiles`)
    setUnfollowBtn(unfollow.size)
})

export const $following = persistentAtom(
    'following',
    new Map<string, FollowingProfile>(),
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
    const count = $followingCount.get()
    const metricsContainer = createMetrics(count, followingSize)
    // remove the current metrics and replace with the updated metrics
    const currentMetrics = document.getElementById('su-metrics-container')
    currentMetrics?.replaceWith(metricsContainer)
})

export const $followingCount = persistentAtom('followingCount', 0, {
    encode: (value) => value.toString(),
    decode: (value) => parseInt(value),
})

$followingCount.listen((count) => {
    console.log(
        `following count changed from ${$followingCount.get()} to ${count}`
    )
    if ($followingCount.get() !== count && count > 0) {
        debugger
        needsToCollect.set(true)
    }
})

export const needsToCollect = atom<boolean>(false)

export const addUnfollowing = (handle: string) => {
    return $unfollowing.set(new Set([...$unfollowing.get().add(handle)]))
}

export const removeUnfollowing = (handle: string) => {
    const unfollowing = $unfollowing.get()
    unfollowing.delete(handle)
    return $unfollowing.set(new Set([...unfollowing]))
}

export const addFollowing = (handle: string, user: ProfileData) => {
    if ($following.get().has(handle)) {
        return
    }
    // get the index from the length of the map
    const index = $following.get().size
    // add the index to the user
    const profile = { ...user, index }
    return $following.set(new Map([...$following.get().set(handle, profile)]))
}

export const removeFollowing = (handle: string) => {
    const following = $following.get()
    following.delete(handle)
    return $following.set(new Map([...Array.from(following)]))
}
