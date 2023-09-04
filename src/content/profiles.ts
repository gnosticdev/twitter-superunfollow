import { addCheckbox } from './ui/checkboxes'
import { Selectors } from '@/content/utils/ui-elements'
import { addFollowing } from '@/content/stores/persistent'
import { randomDelay, getProfileTranslateY } from './utils/ui-elements'

export async function processProfile(profile: ProfileInner) {
    try {
        if (profile.hasAttribute('data-unfollow')) {
            return profile
        }
        const profileDetails = await getProfileDetails(profile)
        const fullProfileData = addFollowing(
            profileDetails.handle,
            profileDetails
        )
        await addCheckbox(profile, fullProfileData)

        return profile
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
): Promise<Omit<ProfileDetail, 'index'>> {
    // wait for the profile data to load
    profile = await waitForProfileData(profile)
    // get the username, handle, and description from the profile div
    const links = profile.getElementsByTagName('a')
    const image = links[0].querySelector('img')?.src
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
        username = links[1].innerHTML
    }
    const profileContainer = profile.closest(
        Selectors.PROFILE_CONTAINER
    ) as ProfileContainer | null
    if (!profileContainer) {
        throw new Error(`missing profile container for profile`)
    }
    const scrollHeight = getProfileTranslateY(profileContainer)

    return { image, username, handle, description, scrollHeight }
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
    return new Promise(async (resolve, reject) => {
        // use a live HTMLCollection to get the links, as the profile div is updated when the profile data loads
        let links = profile.getElementsByTagName('a')
        if (links.length < 3 || !links[2]?.textContent?.includes('@')) {
            if (timeout <= 0) {
                reject(new Error('Timeout waiting for profile data'))
            } else {
                console.log('waiting for profile data', timeout)
                await randomDelay(100)
                setTimeout(async () => {
                    resolve(await waitForProfileData(profile, timeout - 100))
                }, 100)
            }
        } else {
            resolve(profile)
        }
    })
}
