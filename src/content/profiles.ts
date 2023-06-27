import { addCheckbox } from './checkboxes'
import { Selectors } from '.'
import { addFollowing } from './stores'
import { delay, getScrollHeight } from './utils'

export async function processProfile(profile: ProfileInner) {
    try {
        profile = await waitForProfileData(profile, 5000)

        if (!profile.hasAttribute('data-unfollow')) {
            const profileDetails = await addCheckbox(profile)
            addFollowing(profileDetails.handle, profileDetails)

            return profile
        }
    } catch (error) {
        console.error(error)
    }
}

/**
 * TODO: convert to waitForElement function
 * @param {HTMLElement} profile - the profile div from the following page
 * @param {number} timeout - the number of milliseconds to wait for the profile data to load
 * @returns {Promise<HTMLElement>} - the profile div from the following page
 */
async function waitForProfileData(
    profile: ProfileInner,
    timeout = 10_000
): Promise<ProfileInner> {
    let links = profile.getElementsByTagName('a')

    if (links.length < 3 || !links[2]?.textContent?.includes('@')) {
        console.log('waiting for profile data', timeout)
        await delay(100)
        return await waitForProfileData(profile, timeout - 100)
    }

    return profile
}

/**
 * get the profile details (handle, username, description if available) from the profile div on the following page)
 * @param {HTMLElement} profile - the profile div from the following page
 * @returns {Promise<ProfileData>} - at minimum, the handle and username is returned, and description if available
 */
export async function getProfileDetails(
    profile: ProfileInner
): Promise<ProfileData> {
    const links = profile.getElementsByTagName('a')

    let username = links[1].textContent?.trim()
    const handle = links[2].textContent?.trim()
    const description = profile
        .querySelector(
            '[data-testid="cellInnerDiv"] [role="button"] [dir="auto"]:nth-of-type(2)'
        )
        ?.textContent?.trim()
    if (!handle) {
        throw new Error(`missing handle for profile`)
    }
    if (!username) {
        console.log(`missing username for ${handle}`)
        username = '<missing>'
    }
    const profileContainer = profile.closest(
        Selectors.PROFILE_CONTAINER
    ) as ProfileContainer
    const scrollHeight = getScrollHeight(profileContainer)

    return { username, handle, description, scrollHeight }
}
