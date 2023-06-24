import { addCheckbox } from './checkboxes'
import { addFollowing } from './stores'
import { delay } from './utils'

export async function processProfile(profile: HTMLElement) {
    try {
        profile = await waitForProfileData(profile, 5_000)

        if (!profile.hasAttribute('data-unfollow')) {
            const profileDetails = await addCheckbox(profile)
            addFollowing(profileDetails.handle, profileDetails)

            return profile
        }
    } catch (error) {
        console.error(error)
    }
}

async function waitForProfileData(
    profile: HTMLElement,
    timeout = 10_000
): Promise<HTMLElement> {
    let links = profile.getElementsByTagName('a')

    if (links.length < 3 || !links[2]?.textContent?.includes('@')) {
        console.log('waiting for profile data', timeout)
        await delay(100)
        return await waitForProfileData(profile, timeout - 100)
    }

    return profile
}

export type ProfileDetails = Omit<FollowingProfile, 'index'>
/**
 * get the profile details (handle, username, description if available) from the profile div on the following page)
 * @param {HTMLElement} profile - the profile div from the following page
 * @returns {Promise<ProfileDetails>} - at minimum, the handle and username is returned, and description if available
 * */
export async function getProfileDetails(
    profile: HTMLElement
): Promise<ProfileDetails> {
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

    return { username, handle, description }
}

// export async function saveFollowing(
//     profileDetails: HTMLElement | HTMLElement[]
// ) {
//     try {
//         if (Array.isArray(profileDetails)) {
//             profileDetails.forEach(async (profile) => {
//                 const entry = await getProfileDetails(profile)
//                 addFollowing(entry.handle, entry)
//             })
//         } else {
//             const entry = await getProfileDetails(profileDetails)
//             addFollowing(entry.handle, entry)
//         }
//     } catch (error) {
//         console.error(error)
//     }
// }
