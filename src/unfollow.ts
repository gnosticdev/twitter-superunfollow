import { $profilesProcessing, $totalUnfollowed } from './main'
import { $unfollowing, removeUnfollowing } from './stores'
import { $superUnfollowButtonState } from './stores/unfollowing'
import { delay, scrollDownFollowingPage, waitForElement } from './utils'

/**
 * Unfollows all profiles on the page, then scrolls down and repeats until the unfollowing list is empty
 */
export async function superUnfollow(): Promise<void> {
    if ($superUnfollowButtonState.get() === 'stopped') {
        console.log('stopping super unfollow')
        return
    }

    // Wait for profiles to finish processing
    await waitForProfilesProcessing()

    const profilesToUnfollow = document.querySelectorAll(
        '[data-unfollow="true"]'
    ) as NodeListOf<HTMLElement> | null

    if (!profilesToUnfollow) {
        throw new Error('no profiles to have the data-unfollow attribute set')
    }

    debugger

    // No profiles to unfollow in this section -> scroll down and try again
    if (profilesToUnfollow?.length === 0) {
        console.log('no profiles to unfollow in this section')
        const isBottom = await scrollDownFollowingPage(3000)

        if (isBottom) {
            console.log('done scrolling')
            return
        } else {
            console.log('scrolling again')
            return await superUnfollow()
        }
    }

    for (let i = 0; i < profilesToUnfollow.length; i++) {
        if ($superUnfollowButtonState.get() === 'stopped') {
            console.log('stopping super unfollow')
            return
        }
        const profile = profilesToUnfollow[i]
        await unfollow(profile)

        if ($unfollowing.get().size === 0) {
            console.log('no profiles to unfollow')
            return
        }
        debugger
        return await superUnfollow()
    }
}

const unfollow = async (profile: HTMLElement) => {
    const { handle } = profile.dataset
    // click the unfollow button
    const unfollowButton = profile.querySelector(
        '[aria-label ^= "Following"][role="button"]'
    ) as HTMLElement | null

    debugger

    if (!unfollowButton || !handle) {
        throw new Error(
            !handle ? 'no handle found' : 'no unfollow button for ' + handle
        )
    }

    unfollowButton.click()
    await delay(1000)
    // blue and gray out unfollowed profiles
    profile.style.filter = 'blur(1px) grayscale(100%) brightness(0.5)'
    const confirmUnfollow = await waitForElement(
        '[role="button"] [data-testid="confirmationSheetConfirm"]'
    )

    if (!confirmUnfollow) {
        throw new Error('no confirm unfollow button found')
    }
    await delay(1000)
    confirmUnfollow.click()
    // remove profile from unfollowing store
    removeUnfollowing(handle)

    $totalUnfollowed.set($totalUnfollowed.get().add(handle))

    debugger

    return true
}

// display the unfollowed handles in the results section of the dialog while superUnfollow is running
export const displayUnfollowed = (unfollowed: Readonly<Set<string>>) => {
    const resultsDiv = document.getElementById('su-results')
    if (!resultsDiv) {
        throw new Error('no results div found')
    }
    const unfollowedContainer = document.createElement('div')
    unfollowedContainer.id = 'su-unfollowed-container'
    unfollowedContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    `
    const unfollowedHeader = document.createElement('h2')
    resultsDiv.innerHTML = `<div class="su-loader"><span class="su-spinner"></span>Running SuperUnfollow...\n ${
        $totalUnfollowed.get().size
    } profiles remaining</div>`
    unfollowed.forEach((handle) => {
        const unfollowedHandle = document.createElement('p')
        unfollowedHandle.textContent = handle
        unfollowedContainer.appendChild(unfollowedHandle)
    })
    resultsDiv.appendChild(unfollowedHeader)
    resultsDiv.appendChild(unfollowedContainer)
}

export const waitForProfilesProcessing = async () => {
    console.log('waiting for profiles to finish processing')
    return new Promise((resolve) => {
        if (!$profilesProcessing.get()) {
            console.log('profiles not processing')
            resolve(true)
        }
        const unsubscribe = $profilesProcessing.listen((isProcessing) => {
            if (!isProcessing) {
                unsubscribe()
                resolve(true)
                console.log('profiles finished processing')
            }
        })
    })
}
