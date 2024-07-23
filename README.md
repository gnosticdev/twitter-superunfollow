# Twitter SuperUnfollow

Unfollow accounts by keyword, get details of accounts you follow without endless scrolling. Life evolves, but your feed does not unless you clean it every so often. Unfollowing accounts is painfully slow, especially if you follow a few hundred/1000+. I wrote this extension to solve that issue.

There are other extensions out there that do similar things, but they require you to know the account username in advance. This will collect all profile information first, then allow you to select which accounts to unfollow. You can also filter by keyword, so you can unfollow all of those crypto accounts until the next bull run 🙈

Script to be used in Chrome Extension or Arc Boost:

## Features

- Programmatically unfollow accounts without expensive API calls.
- Unfollows people slowly so as to not trigger captchas.
- Collects all profile details from the [Twitter Following](https://x.com/following) page.
- Stores details in local storage so data is persistent (no need to re-collect on reload/tab change).
- Filter your following list by keyword - which searches the username, handle and description.
- Adds a small button to the top right hand corner of the page, which opens a modal when clicked.
- Uses localstorage (nanostores) to save the following/unfollowing information so minimal auto scrolling is needed.

_Use at your own risk, I make no guarantee that Twitter will not flag your account._
