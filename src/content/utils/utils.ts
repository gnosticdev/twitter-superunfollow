/**
 * Wait a random amount of time between ms and msHigh, then and return a promise
 * @param ms {number} - minimum milliseconds to delay (1000 = 1 second)
 * @param msHigh {number} - maximum milliseconds to delay (1000 = 1 second)
 * @returns {Promise<void>}
 */
export const randomDelay = (ms: number, msHigh = ms) => {
    // delay random amount of time between ms and msHigh. if ms = 2000, msHigh = 4000, then delay between 2 and 4 seconds. if ms = 2000 and msHigh = 0, then delay between 0 and 2 seconds
    const delay = Math.random() * (msHigh - ms) + ms
    return new Promise((resolve) => {
        setTimeout(resolve, delay)
    })
}

console.log(randomDelay(0))

/**
 *
 * @returns {HTMLElement} -
 */
export const createLoadingSpinner = () => {
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
export const getLastChildHeight = () => {
    const lastChild = document.querySelector(
        Selectors.PROFILE_CONTAINER + ':last-child'
    ) as ProfileContainer
    const translateY = getProfileTranslateY(lastChild)

    return translateY
}

/**
 * Each profile has a 'transform: translateY()' style applied to it. This function extracts the scroll height from that style and returns it
 * @param profileContainer  - the profile div from the following page
 * @returns {number} - the scroll height (distance down the page) of the profile div
 */
export const getProfileTranslateY = (profileContainer: ProfileContainer) => {
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
    PROFILE_INNER: '[data-testid="UserCell"]',
    /**  The outermost div that contains a profile for each profile */
    PROFILE_CONTAINER: '[data-testid="cellInnerDiv"]',
    /**  The div that contains the profile divs */
    FOLLOWING_CONTAINER: 'section > div[aria-label="Timeline: Following"]',
    /** The main unfollow button - opens a confirmation window */
    UF_BUTTON: '[role="button"][data-testid $= "-unfollow"]',
    /** The confirm unfollow button in the confirmation window */
    UF_CONFIRM: '[role="button"][data-testid="confirmationSheetConfirm"]',
    /** SuperUnfollow show dialog button */
} as const
