type FollowingProfile = {
    index: number
    handle: string
    username: string
    scrollHeight: number
    description?: string
}

type ProfileData = Omit<FollowingProfile, 'index'>

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
type From = 'content' | 'background' | 'newTab'
type To = 'content' | 'background' | 'newTab'
type RequestType = 'userData' | 'start'
type Data = string | unknown
type ExtMessage<
    From extends 'content' | 'newTab' | 'background',
    To extends 'background' | 'content' | 'newTab',
    RequestType extends From extends 'content'
        ? 'userData'
        : From extends 'background'
        ? 'userData'
        : From extends 'newTab'
        ? 'userData'
        : never = never,
    Data extends To extends 'content'
        ? TwitterUserData | undefined
        : To extends 'background'
        ? string | unknown
        : To extends 'newTab'
        ? string
        : never = never
> = {
    from: From
    to: To
    type: RequestType
    data?: Data
}
type BGtoCSMessage = ExtMessage<
    'background',
    'content',
    'userData',
    TwitterUserData
>
type BGtoTabMessage = ExtMessage<'background', 'newTab', 'userData', string>
type CStoBGMessage = ExtMessage<'content', 'background', 'userData', string>
type TabToBGMessage = ExtMessage<
    'newTab',
    'background',
    'userData',
    TwitterUserData
>
type ChromeMessage =
    | BGtoTabMessage
    | BGtoCSMessage
    | CStoBGMessage
    | TabToBGMessage
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
