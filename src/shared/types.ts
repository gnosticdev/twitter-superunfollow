export type ProfileDetail = {
    index: number
    handle: string
    username: string
    scrollHeight: number
    image?: string
    description?: string
}

/** Map of profile details for the Unfollowing or Following lists */
export type ProfilesMap = Map<string, ProfileDetail>

export interface ProfileContainer extends HTMLElement {
    readonly dataset: {
        testid: 'cellInnerDiv'
    }
}
export interface ProfileInner extends HTMLElement {
    readonly dataset: {
        testid: 'UserCell'
        handle?: string
    }
}

export interface FollowingContainer extends HTMLElement {
    readonly ariaLabel: 'Timeline: Following'
}

// ------- MESSAGES -------f
export type From = 'content' | 'background' | 'newTab'
export type To = 'content' | 'background' | 'newTab'
export type RequestType = 'userData' | 'addDialog' | 'removeDialog'

export interface BaseMessage {
    from: From
    to: To
    type: RequestType
}

export interface FromBgToCsData extends BaseMessage {
    from: 'background'
    to: 'content'
    type: 'userData'
    data: TwitterUserData
}

export interface FromBgToCsStart extends BaseMessage {
    from: 'background'
    to: 'content'
    type: 'addDialog'
}

export interface FromBgToCsRemove extends BaseMessage {
    from: 'background'
    to: 'content'
    type: 'removeDialog'
}

export type FromBgToCs = FromBgToCsData | FromBgToCsStart | FromBgToCsRemove

export interface FromBgToTab extends BaseMessage {
    from: 'background'
    to: 'newTab'
    type: 'userData'
    data: string
}

export interface FromCsToBg extends BaseMessage {
    from: 'content'
    to: 'background'
    type: 'userData'
    data: string
}

export interface FromTabToBg extends BaseMessage {
    from: 'newTab'
    to: 'background'
    type: 'userData'
    data: TwitterUserData
}

export type ExtMessage = FromBgToCs | FromBgToTab | FromCsToBg | FromTabToBg

export type WindowMessage = {
    source: {
        window: WindowProxy
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
}

export interface TwitterUserData {
    can_dm: boolean
    can_media_tag: boolean
    default_profile: boolean
    default_profile_image: boolean
    description: string
    entities: Entities
    fast_followers_count: number
    favourites_count: number
    followers_count: number
    friends_count: number
    has_custom_timelines: boolean
    is_translator: boolean
    listed_count: number
    location: string
    media_count: number
    name: string
    needs_phone_verification: boolean
    normal_followers_count: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pinned_tweet_ids_str: any[]
    possibly_sensitive: boolean
    profile_banner_url: string
    profile_image_url_https: string
    profile_interstitial_type: string
    screen_name: string
    statuses_count: number
    translator_type: string
    verified: boolean
    want_retweets: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withheld_in_countries: any[]
    id_str: string
    is_profile_translatable: boolean
    profile_image_shape: string
    is_blue_verified: boolean
    birthdate: Birthdate
    has_graduated_access: boolean
    created_at: string
    blocked_by: boolean
    muting: boolean
    blocking: boolean
}

export interface Birthdate {
    day: number
    month: number
    year: number
    visibility: string
    year_visibility: string
}

export interface Entities {
    description: Description
}

export interface Description {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    urls: any[]
}
