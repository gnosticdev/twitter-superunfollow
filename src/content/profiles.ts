import { addCheckbox } from './checkboxes'
import { Selectors } from '@/shared/shared'
import { addFollowing } from '@/store/persistent'
import { delay, getProfileTranslateY } from './utils/utils'

export async function processProfile(profile: ProfileInner) {
    try {
        if (!profile.hasAttribute('data-unfollow')) {
            const profileDetails = await getProfileDetails(profile)
            await addCheckbox(profile, profileDetails)
            addFollowing(profileDetails.handle, profileDetails)

            return profile
        }
    } catch (error) {
        console.error(error)
    }
}

/**
 * get the profile details (handle, username, description if available) from the profile div on the following page)
 * @param {HTMLElement} profile - the profile div from the following page
 * @returns {Promise<ProfileData>} - at minimum, the handle and username is returned, and description if available
 */
export async function getProfileDetails(
    profile: ProfileInner
): Promise<ProfileData> {
    // wait for the profile data to load
    profile = await waitForProfileData(profile, 5000)
    // get the username, handle, and description from the profile div
    const links = profile.getElementsByTagName('a')
    // some usernames do not have any text content, (emojis, etc)
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
        console.log(`missing text username for ${handle}`)
        username = links[1].innerHTML
            ? '{{' + links[1].innerHTML + '}}'
            : '<missing>'
    }
    const profileContainer = profile.closest(
        Selectors.PROFILE_CONTAINER
    ) as ProfileContainer
    const scrollHeight = getProfileTranslateY(profileContainer)

    return { username, handle, description, scrollHeight }
}

/**
 * TODO: convert to waitForElement function
 * @param {HTMLElement} profile - the profile div from the following page
 * @param {number} timeout - the number of milliseconds to wait for the profile data to load
 * @returns {Promise<HTMLElement>} - the profile div from the following page
 */
async function waitForProfileData(
    profile: ProfileInner,
    timeout = 5_000
): Promise<ProfileInner> {
    // use a live HTMLCollection to get the links, as the profile div is updated when the profile data loads
    let links = profile.getElementsByTagName('a')

    if (links.length < 3 || !links[2]?.textContent?.includes('@')) {
        console.log('waiting for profile data', timeout)
        await delay(100)
        return await waitForProfileData(profile, timeout - 100)
    }

    return profile
}
