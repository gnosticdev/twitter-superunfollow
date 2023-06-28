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
} as const

export const parseInititalState = (initialStateObj: any) => {
    const userData = JSON.parse(JSON.stringify(initialStateObj))

    const key = Object.keys(userData.entities.users.entities)[0]
    const accountData = userData.entities.users.entities[key]

    const followingCount = accountData.friends_count as number
    return { followingCount, ...accountData } as TwitterUserData
}
