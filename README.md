# Twitter/X SuperUnfollow

Unfollow accounts by keyword, get details of accounts you follow without endless scrolling. Life evolves, but your feed does not unless you clean it every so often. Unfollowing accounts is painfully slow, especially if you follow a few hundred/1000+.

There are other extensions out there that do similar things, but they require you to know the account username in advance. This will collect all profile information first, then allow you to select which accounts to unfollow. You can also filter by keyword, so you can unfollow all of those crypto accounts until the next bull run 🙈

## Features

- unfollow accounts without expensive API calls.
- unfollows using the `unfollow` button for an account on the `x.com/<your_username>/following` page.
- naturally scrolls down the page with a random delay to (hopefully) avoid rate limiting or bot detection.
- Collects all profile details from the [Twitter/X Following](https://x.com/following) page.
- Stores details in local storage so data is persistent (no need to re-collect on reload/tab change).
- Filter your following list by keyword - which searches the username, handle and description.
- Uses localstorage [https://github.com/nanostores/nanostores](nanostores) to save the following/unfollowing information so minimal auto scrolling is needed.

## Extension

- The service-worker.ts file is used to tell the content script when the user has arrived to the `/following` page.
- The content script appends a modal to the page, with a `Collect` and `SuperUnfollow` button.
- Must start by clicking `Collect` to gather all the profile information on the page.
- The `SuperUnfollow` button will then be enabled, allowing you to filter and unfollow accounts.
- When using the `SuperUnfollow` button, the extension will click the `unfollow` button for each account that is selected.
- The extension will then store the unfollowed accounts in local storage, so you can refresh the page and continue where you left off.

_Use at your own risk, I make no guarantee that Twitter will not flag your account._
