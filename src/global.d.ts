type FollowingProfile = {
    index: number
    handle: string
    username: string
    scrollHeight: number
    description?: string
}

type ProfileData = Omit<FollowingProfile, 'index'>

interface ProfileContainer extends HTMLElement {
    readonly dataset: {
        testid: 'cellInnerDiv'
    }
}

interface ProfileInner extends HTMLElement {
    readonly dataset: {
        testid: 'UserCell'
    }
}

interface FollowingContainer extends HTMLElement {
    readonly ariaLabel: 'Timeline: Following'
}

type ISender = 'content' | 'background' | 'popup'
type IReceiver = 'content' | 'background' | 'popup'
type IMessage<S = ISender, R = IReceiver> = {
    from: S
    to: R
    data?: S extends 'content' ? string : unknown
    request?: S extends 'content'
        ? R extends 'background'
            ? 'start' | 'userData'
            : 'userData'
        : unknown
}

type WindowMessage = {
    source: {
        window: WindowProxy
    }
    data: any
}
