import { persistentAtom } from '@nanostores/persistent'
import { setButtonText } from '../utils'

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
    setButtonText()
})

export const $following = persistentAtom(
    'following',
    new Map<string, FollowingUser>(),
    {
        encode: (value) => {
            return JSON.stringify(Array.from(value.entries()))
        },
        decode: (value) => {
            return new Map(JSON.parse(value))
        },
    }
)

export const $followingCount = persistentAtom('followingCount', 0, {
    encode: (value) => value.toString(),
    decode: (value) => parseInt(value),
})

export const addUnfollowing = (handle: string) => {
    return $unfollowing.set(new Set([...$unfollowing.get().add(handle)]))
}

export const removeUnfollowing = (handle: string) => {
    const unfollowing = $unfollowing.get()
    unfollowing.delete(handle)
    return $unfollowing.set(new Set([...unfollowing]))
}

export const addFollowing = (handle: string, user: FollowingUser) => {
    return $following.set(new Map([...$following.get().set(handle, user)]))
}

export const removeFollowing = (handle: string) => {
    const following = $following.get()
    following.delete(handle)
    return $following.set(new Map([...Array.from(following)]))
}
