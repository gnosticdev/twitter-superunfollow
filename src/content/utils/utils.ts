import { Selectors } from '@/shared/shared'

export const delay = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

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
