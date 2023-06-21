import { persistentAtom } from '@nanostores/persistent'
import { FollowingUser } from './main'

export const $unfollowing = persistentAtom('unfollowing', new Set<string>(), {
    encode: (value) => {
        return JSON.stringify(Array.from(value))
    },
    decode: (value) => {
        return new Set(JSON.parse(value))
    },
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

export const addUnfollowing = (handle: string) => {
    return $unfollowing.set(new Set([...$unfollowing.get().add(handle)]))
}

export const removeUnfollowing = (handle: string) => {
    return $unfollowing.set(new Set([...$unfollowing.get().add(handle)]))
}

export const addFollowing = (handle: string, user: FollowingUser) => {
    return $following.set(new Map([...$following.get().set(handle, user)]))
}

export const removeFollowing = (handle: string) => {
    const following = $following.get()
    following.delete(handle)
    return $following.set(new Map([...Array.from(following)]))
}