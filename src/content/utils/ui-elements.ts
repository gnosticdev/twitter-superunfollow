/**
 * Wait a random amount of time between ms and msHigh, then and return a promise
 * If msHigh is not provided, it defaults to ms
 * an ms of 2000 would wait between 0 and 2 seconds.
 * an ms of 2000 and an msHigh of 4000 would wait between 2 and 4 seconds
 * @param ms {number} - minimum milliseconds to delay (1000 = 1 second)
 * @param msHigh {number} - maximum milliseconds to delay (1000 = 1 second). Defaults to value of ms
 * @returns {Promise<void>}
 */
export function randomDelay(ms: number, msHigh = ms) {
    // ms of 2000 and msHigh of 2500 would wait between 2 and 2.5 seconds.
    // ms of 2000 and msHigh of 2000 would wait exactly 2 seconds.
    const delay = msHigh <= ms ? ms : Math.random() * (msHigh - ms) + ms
    return new Promise((resolve) => {
        setTimeout(resolve, delay)
    })
}

/**
 * Creates a loading spinner element
 * @returns {HTMLElement} - a loading spinner element
 */
export function createLoadingSpinner() {
    const loader = document.createElement('span')
    loader.classList.add('su-loader')
    const spinner = document.createElement('span')
    spinner.classList.add('su-spinner')
    loader.appendChild(spinner)
    return loader
}

/**
 * Gets the scroll height of the last profile div on the following page, which is used to determine how far down the page to scroll and trigger the loading of more profiles
 */
export function getLastChildHeight() {
    const lastChild = document.querySelector(
        Selectors.PROFILE_CONTAINER + ':last-child'
    ) as ProfileContainer
    const translateY = getProfileTranslateY(lastChild)

    return translateY
}

/**
 * Each profile container has a 'transform: translateY()' inline style applied to it. This function extracts the scroll height from that style and returns it
 * @param profileContainer  - the profile div from the following page
 * @returns {number} - the scroll height (distance down the page) of the profile div
 */
export function getProfileTranslateY(profileContainer: ProfileContainer) {
    const translateYString = profileContainer.style.transform
    const translateYRegex = /translateY\((\d+(\.\d+)?)px\)/
    const match = translateYRegex.exec(translateYString)
    const translateY = match ? parseFloat(match[1]) : 0

    return translateY
}

export function generateSelector(context: HTMLElement) {
    // call getIndex function
    let index = getIndex(context)
    let pathSelector = ''

    while (context.tagName) {
        // selector path
        pathSelector =
            context.localName + (pathSelector ? '>' + pathSelector : '')
        context = context.parentNode as HTMLElement
    }
    // selector path for nth of type
    pathSelector = pathSelector + `:nth-of-type(${index})`
    return pathSelector
}

// get index for nth of type element
function getIndex(node: HTMLElement) {
    let i = 1
    let tagName = node.tagName

    while (node.previousSibling) {
        node = node.previousSibling as HTMLElement
        if (
            node.nodeType === 1 &&
            tagName.toLowerCase() === node.tagName.toLowerCase()
        ) {
            i++
        }
    }
    return i
}

export const Selectors = {
    /**  The inner div with the profile details */
    PROFILE_INNER:
        'div[aria-label="Timeline: Following"] [data-testid="UserCell"]',
    /**  The outermost div that contains a profile for each profile */
    PROFILE_CONTAINER:
        'div[aria-label="Timeline: Following"] [data-testid="cellInnerDiv"]',
    /**  The div that contains the profile divs */
    FOLLOWING_CONTAINER: 'section > div[aria-label="Timeline: Following"]',
    /** The main unfollow button - opens a confirmation window */
    UF_BUTTON: '[role="button"][data-testid $= "-unfollow"]',
    /** The confirm unfollow button in the confirmation window */
    UF_CONFIRM: '[role="button"][data-testid="confirmationSheetConfirm"]',
    /** SuperUnfollow show dialog button */
    DIALOG_CHECKBOXES:
        '.su-search-result input[type="checkbox"]:not(#su-search-select-all)',
} as const

export function getInnerProfile(profileContainer?: ProfileContainer) {
    if (profileContainer) {
        return profileContainer.querySelector(
            Selectors.PROFILE_INNER
        ) as ProfileInner | null
    }
    return document.querySelector(
        Selectors.PROFILE_INNER
    ) as ProfileInner | null
}

export function getInnerProfiles() {
    return document.querySelectorAll(
        Selectors.PROFILE_INNER
    ) as NodeListOf<ProfileInner>
}

export function getProfileContainer(profile?: ProfileInner) {
    if (profile) {
        return profile.closest(
            Selectors.PROFILE_CONTAINER
        ) as ProfileContainer | null
    }
    return document.querySelector(
        Selectors.PROFILE_CONTAINER
    ) as ProfileContainer | null
}

export function getFollowingContainer() {
    const container = document.querySelector(
        Selectors.FOLLOWING_CONTAINER
    ) as FollowingContainer | null
    if (!container) {
        throw new Error('following container not found')
    }
    return container
}

export function getProfileUnfollowButton(profile?: ProfileInner) {
    if (profile) {
        return profile.querySelector(Selectors.UF_BUTTON) as HTMLElement | null
    }
    return document.querySelector(Selectors.UF_BUTTON) as HTMLElement | null
}

export function getConfirmUnfollowButton() {
    const confirmBtn = document.querySelector(
        Selectors.UF_CONFIRM
    ) as HTMLElement | null
    if (!confirmBtn) {
        throw new Error('confirm button not found')
    }
    return confirmBtn
}

export function getDialogCheckboxes() {
    return document.querySelectorAll(
        Selectors.DIALOG_CHECKBOXES
    ) as NodeListOf<HTMLInputElement>
}

export function getNoticeDiv() {
    const div = document.getElementById('su-notice') as HTMLDivElement | null
    if (!div) {
        throw new Error('notice div not found')
    }
    return div
}

export const getSuperUnfollowButton = () => {
    const unfollowButton = document.getElementById(
        'superUnfollow-button'
    ) as HTMLButtonElement | null
    if (!unfollowButton) {
        throw new Error('superunfollow button not found')
    }
    return unfollowButton
}

export function getCollectButton() {
    const collectButton = document.getElementById(
        'su-collect-following-button'
    ) as HTMLButtonElement | null
    if (!collectButton) {
        throw new Error('collect button not found')
    }
    return collectButton
}
