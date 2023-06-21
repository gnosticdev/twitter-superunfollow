# Twitter SuperUnfollow

Script to be used in Chrome Extension or Arc Boost that automatically scrolls through twitter.com/user/following page, collects all of the profiles that a user is following, thena allows them to programmatically unfollow ones they choose. Adds a dialog element to the top corner of the page, that has a search input which searches for keywords within the profiles usernames, handles and bios.

Uses localstorage (nanostores) to save the following/unfollowing information so minimal auto scrolling is needed.

TODO:
Need to use eval() to get user following count, so currently uses Tampermonkey to get this in the background in a sandboxed mode. Will add to background script before deployment.
