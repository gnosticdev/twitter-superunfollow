type ProfileDetails = {
    index: number
    handle: string
    username: string
    scrollHeight: number
    image?: string
    description?: string
}

/** Map of profile details for the Unfollowing or Following lists */
type ProfilesMap = Map<string, ProfileDetails>

type ButtonState = 'ready' | 'running' | 'paused' | 'done' | 'resumed'

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
interface Window {
    __INITIAL_STATE__: any
}
interface FollowingContainer extends HTMLElement {
    readonly ariaLabel: 'Timeline: Following'
}

// ------- MESSAGES -------f
type From = 'content' | 'background' | 'newTab'
type To = 'content' | 'background' | 'newTab'
type RequestType = 'userData' | 'start'

interface BaseMessage {
    from: From
    to: To
    type: RequestType
}

interface FromBgToCsData extends BaseMessage {
    from: 'background'
    to: 'content'
    type: 'userData'
    data: TwitterUserData
}

interface FromBgToCsStart extends BaseMessage {
    from: 'background'
    to: 'content'
    type: 'start'
}

type FromBgToCs = FromBgToCsData | FromBgToCsStart

interface FromBgToTab extends BaseMessage {
    from: 'background'
    to: 'newTab'
    type: 'userData'
    data: string
}

interface FromCsToBg extends BaseMessage {
    from: 'content'
    to: 'background'
    type: 'userData'
    data: string
}

interface FromTabToBg extends BaseMessage {
    from: 'newTab'
    to: 'background'
    type: 'userData'
    data: TwitterUserData
}

type ExtMessage = FromBgToCs | FromBgToTab | FromCsToBg | FromTabToBg

type WindowMessage = {
    source: {
        window: WindowProxy
    }
    data: any
}

interface TwitterUserData {
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

interface Birthdate {
    day: number
    month: number
    year: number
    visibility: string
    year_visibility: string
}

interface Entities {
    description: Description
}

interface Description {
    urls: any[]
}
