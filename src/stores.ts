import { persistentAtom } from '@nanostores/persistent'
import { atom } from 'nanostores'
import { $profilesProcessing } from './main'

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

// Create a new store for the button state
export const $buttonState = atom<'idle' | 'running' | 'done'>('idle')
export const $stopFlag = atom(false)

//
export async function handleButtonState() {
    switch ($buttonState.get()) {
        case 'idle':
            $buttonState.set('running')
            break
        case 'running':
            $buttonState.set('done')
            break
        case 'done':
            $buttonState.set('idle')
            break

        default:
            break
    }
}

// Subscribe to changes in the button state
$buttonState.subscribe((state) => {
    const suButton = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement | null
    if (suButton) {
        switch (state) {
            case 'idle':
                setButtonText()
                suButton.disabled = false
                break
            case 'running':
                suButton.innerText = 'Running...'
                suButton.disabled = true
                $profilesProcessing.set(true)
                break
            case 'done':
                suButton.innerText = 'Done'
                suButton.disabled = true
                $stopFlag.set(true)
                break
        }
    }
})

/**
 * Updates the unfollow button with the number of users selected
 */
export const setButtonText = () => {
    const superUnfollowBtn = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement
    const { size } = $unfollowing.get()
    if (size > 0) {
        superUnfollowBtn.classList.add('active')
        superUnfollowBtn.innerText = `SuperUnfollow ${size} Users`
    } else {
        superUnfollowBtn.classList.remove('active')
        superUnfollowBtn.innerText = 'No Users Selected'
    }
}

export const waitForProfilesProcessing = async () => {
    console.log('waiting for profiles to finish processing')
    return new Promise((resolve) => {
        if (!$profilesProcessing.get()) {
            console.log('profiles not processing')
            resolve(true)
        }
        const unsubscribe = $profilesProcessing.listen((isProcessing) => {
            if (!isProcessing) {
                unsubscribe()
                resolve(true)
                console.log('profiles finished processing')
            }
        })
    })
}
