"use strict";
(() => {
  // src/utils.ts
  async function inifiniteScrollDown(delayMS = 3e3) {
    let lastHeight = document.body.scrollHeight;
    window.scrollTo(0, lastHeight);
    await delay(delayMS);
    let newHeight = document.body.scrollHeight;
    console.log(
      `%c scrolling down: lastHeight: ${lastHeight}, newHeight: ${newHeight}`,
      `color: var(--su-green);`
    );
    if (newHeight === lastHeight) {
      return true;
    } else {
      return false;
    }
  }
  var updateFollowing = (followingMap) => {
    localStorage.setItem(
      "followingMap",
      JSON.stringify(Array.from(followingMap.entries()))
    );
  };
  var updateUnfollowing = (unfollowList) => {
    localStorage.setItem(
      "unfollowList",
      JSON.stringify(Array.from(unfollowList))
    );
  };
  var getFollowingMap = () => {
    const followingMapString = localStorage.getItem("followingMap");
    if (!followingMapString) {
      return /* @__PURE__ */ new Map();
    }
    const followingMap = new Map(
      JSON.parse(followingMapString)
    );
    return followingMap;
  };
  var getUnfollowList = () => {
    const unfollowListString = localStorage.getItem("unfollowList");
    if (!unfollowListString) {
      return /* @__PURE__ */ new Set();
    }
    const unfollowList = new Set(JSON.parse(unfollowListString));
    return unfollowList;
  };
  var timeout;
  function prettyConsole(message, object = null) {
    const error = new Error();
    const lineNumber = error.stack?.split("\n")[2].split(":")[2];
    const functionName = error.stack?.split("\n")[2].split(" ")[5];
    const style = "color: hsl(350, 79%, 74%); background-color: hsl(219, 100%, 39%); font-weight: bold; font-size: 1; padding: 5px;";
    if (object) {
      console.log(
        `%c ${message} %c ${functionName}():${lineNumber}`,
        style,
        "color: hsl(70, 16.20%, 71.00%); font-size: 10px; padding: 5px;"
      );
      console.log(object);
    } else {
      console.log(
        `%c ${message} %c ${functionName}():${lineNumber}`,
        style,
        "color: hsl(70, 16.20%, 71.00%); font-size: 10px; padding: 5px;"
      );
    }
  }
  function waitForElement(selector, timout = 4e3) {
    return new Promise(function(resolve, reject) {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      const observer2 = new MutationObserver(function(records) {
        records.forEach(function(mutation) {
          const nodes = Array.from(mutation.addedNodes);
          console.log("mutation nodes", "yellow", nodes);
          nodes.forEach(function(node) {
            if (node instanceof HTMLElement) {
              const innerElement = node.querySelector(
                selector
              );
              if (node.matches(selector) || innerElement) {
                console.log(selector + " -> found");
                observer2.disconnect();
                resolve(
                  node.matches(selector) ? node : innerElement
                );
              }
            }
          });
        });
        setTimeout(function() {
          observer2.disconnect();
          reject(new Error(selector + " -> not found after 4 seconds"));
        }, timeout);
      });
      observer2.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }
  function delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // src/profiles.ts
  async function processProfiles(profile) {
    try {
      profile = await waitForData(profile);
      if (!profile.hasAttribute("data-unfollow")) {
        await saveFollowing(profile);
        await addCheckbox(profile);
      }
      if (!document.getElementById("superUnfollow-anchor")) {
        const anchor = document.createElement("div");
        anchor.id = "superUnfollow-anchor";
        document.querySelector('[aria-label="Timeline: Following"]')?.firstElementChild?.before(anchor);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
  async function waitForData(profile, maxRetries = 10) {
    let links = profile.getElementsByTagName("a");
    if ((links.length < 3 || !links[2]?.textContent?.includes("@")) && maxRetries > 0) {
      await delay(250);
      return await waitForData(profile, maxRetries - 1);
    }
    if (maxRetries === 0) {
      throw new Error("Maximum retries reached, required elements not found");
    }
    return profile;
  }
  async function getProfileDetails(profile) {
    const links = profile.getElementsByTagName("a");
    const username = links[1].textContent?.trim();
    const handle = links[2].textContent?.trim();
    const description = profile.querySelector(
      '[data-testid="cellInnerDiv"] [role="button"] [dir="auto"]:nth-of-type(2)'
    )?.textContent?.trim();
    if (!username || !handle) {
      throw "missing username, handle, or description";
    }
    return { username, handle, description };
  }
  async function saveFollowing(profiles) {
    try {
      const followingMap = getFollowingMap();
      if (Array.isArray(profiles)) {
        profiles.forEach(async (profile) => {
          const entry = await getProfileDetails(profile);
          followingMap.set(entry.handle, entry);
        });
      } else {
        const entry = await getProfileDetails(profiles);
        followingMap.set(entry.handle, entry);
      }
      updateFollowing(followingMap);
    } catch (error) {
      console.error(error);
    }
  }

  // src/add-elements.ts
  function addSuperUnfollowButton() {
    prettyConsole("adding superUnfollow button");
    const container = document.createElement("div");
    container.classList.add("superUnfollow", "su-button-container");
    container.id = "superUnfollow";
    const startUnfollowButton = document.createElement("button");
    const unfollowList = getUnfollowList();
    if (unfollowList.size > 0) {
      startUnfollowButton.classList.add("su-button--active");
      startUnfollowButton.innerText = `SuperUnfollow ${unfollowList.size} Users`;
    } else {
      startUnfollowButton.classList.remove("su-button--active");
      startUnfollowButton.innerText = "No Users Selected";
    }
    startUnfollowButton.classList.add("su-button");
    startUnfollowButton.addEventListener("click", superUnfollow);
    container.appendChild(startUnfollowButton);
    document.body.appendChild(container);
  }
  async function addCheckbox(profile) {
    const unfollowButton = profile.querySelector('[data-testid *= "unfollow"]');
    if (!unfollowButton) {
      throw "no unfollow button found";
    }
    const { handle } = await getProfileDetails(profile);
    if (!handle) {
      throw "no handle found";
    }
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", handleChange);
    const unfollowList = getUnfollowList();
    checkbox.checked = unfollowList.has(handle);
    const container = document.createElement("div");
    container.classList.add("superUnfollow", "su-checkbox-container");
    container.appendChild(checkbox);
    unfollowButton.parentElement?.before(container);
    profile.setAttribute("data-unfollow", checkbox.checked.toString());
    profile.setAttribute("data-handle", handle);
    checkbox.value = handle;
  }
  var handleChange = (event) => {
    const target = event.target;
    if (!target) {
      throw "no target found";
    }
    const handle = target.value;
    if (!handle) {
      throw "no handle found for profile";
    }
    const unfollowList = getUnfollowList();
    if (target.checked && !unfollowList.has(handle)) {
      console.log(`adding ${handle} to unfollowList`);
      unfollowList.add(handle);
      if (!document.getElementById("superUnfollow")) {
        addSuperUnfollowButton();
      }
    } else {
      console.log(`removing ${handle} from unfollowList`);
      unfollowList.delete(handle);
    }
    const profile = document.querySelector(`[data-handle="${handle}"]`);
    if (!profile) {
      console.log(`profile for ${handle} not in view`);
    } else {
      const cb = profile.querySelector(
        'input[type="checkbox"]'
      );
      if (!cb) {
        throw "no checkbox found";
      }
      cb.checked = target.checked;
      profile.setAttribute("data-unfollow", target.checked.toString());
    }
    updateUnfollowing(unfollowList);
    prettyConsole("unfollowList updated:", Array.from(unfollowList.keys()));
  };

  // src/search.ts
  async function addSearchDialog() {
    console.log("adding search dialog");
    const dialog = document.createElement("dialog");
    dialog.classList.add("superUnfollow", "su-search-dialog");
    const dialogContainer = document.createElement("div");
    dialogContainer.classList.add("superUnfollow", "su-search-dialog-container");
    dialogContainer.role = "dialog";
    dialog.appendChild(dialogContainer);
    const modalButton = document.createElement("button");
    modalButton.id = "su-search-button";
    modalButton.textContent = "SuperUnfollow";
    modalButton.classList.add("superUnfollow", "su-button", "su-modal", "small");
    modalButton.addEventListener("click", () => {
      dialog.showModal();
    });
    const heading = document.createElement("p");
    heading.textContent = "Search usernames, handles and bios";
    heading.classList.add("superUnfollow", "su-heading");
    const subheading = document.createElement("p");
    subheading.textContent = "searches all usernames, handles and bios";
    subheading.classList.add("superUnfollow", "su-subheading");
    const headingsContainer = document.createElement("div");
    headingsContainer.classList.add("superUnfollow", "su-headings-container");
    headingsContainer.append(heading, subheading);
    const input = document.createElement("input");
    input.type = "text";
    input.id = "su-search-input";
    const closeButton = document.createElement("button");
    const closeSVG = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z"></path></svg>';
    closeButton.innerHTML = closeSVG;
    closeButton.classList.add("superUnfollow", "su-close-button");
    closeButton.addEventListener("click", () => {
      dialog.close();
    });
    const searchButton = document.createElement("button");
    searchButton.textContent = "Search";
    searchButton.classList.add("su-search-button");
    const inputContainer = document.createElement("div");
    inputContainer.classList.add("su-search-input-container");
    inputContainer.id = "su-search-input-container";
    inputContainer.append(input, searchButton);
    const resultsContainer = document.createElement("div");
    resultsContainer.id = "su-search-results";
    resultsContainer.classList.add("superUnfollow", "su-search-results");
    dialogContainer.append(
      closeButton,
      headingsContainer,
      inputContainer,
      resultsContainer
    );
    document.body.appendChild(dialog);
    document.body.appendChild(modalButton);
    prettyConsole("search dialog created");
    searchButton.addEventListener("click", async () => {
      const input2 = document.getElementById(
        "su-search-input"
      );
      const inputValue = input2.value === "" ? ".*" : input2.value;
      console.log(`searching for ${inputValue}`);
      const resultDiv = document.getElementById(
        "su-search-results"
      );
      const following = localStorage.getItem("followingCount");
      resultDiv.innerHTML = `<div class="su-loader"><span class="su-spinner"></span>Scanning ${following} profiles. Search term: 
 ${inputValue}</div>`;
      let followingMap = await getFollowingAutoScroll();
      if (!followingMap) {
        followingMap = await getFollowingMap();
      }
      const searchResults = searchFollowingList(inputValue, followingMap);
      resultDiv.innerHTML = `
        <h3>Search results for: <span>${inputValue}</span></h3>
        <p>Click on a profile to add to the unfollow list</p>`;
      const resultsContainer2 = displaySearchResults(searchResults);
      resultDiv.appendChild(resultsContainer2);
      dialogContainer.appendChild(resultDiv);
    });
  }
  function searchFollowingList(searchTerm, followingMap) {
    let results = /* @__PURE__ */ new Set();
    const following = followingMap;
    following.forEach((entry) => {
      const { username, handle, description } = entry;
      const wordRegex = new RegExp(`\\b${searchTerm}\\b`, "i");
      const allRegex = new RegExp(searchTerm, "i");
      if (allRegex.test(username) || allRegex.test(handle) || description && wordRegex.test(description)) {
        results.add(handle);
      }
    });
    return results;
  }
  function displaySearchResults(searchResults) {
    const resultsContainer = document.createElement("div");
    resultsContainer.classList.add(
      "superUnfollow",
      "su-search-results-container"
    );
    if (searchResults.size === 0) {
      resultsContainer.innerHTML = `<p class="su-error">No results found</p>`;
      return resultsContainer;
    }
    const selectAll = document.createElement("input");
    selectAll.type = "checkbox";
    selectAll.id = "su-search-select-all";
    selectAll.addEventListener("change", handleSelectAll);
    const selectAllLabel = document.createElement("label");
    selectAllLabel.textContent = "Select All";
    selectAllLabel.htmlFor = "su-search-select-all";
    const selectAllContainer = document.createElement("div");
    selectAllContainer.classList.add(
      "superUnfollow",
      "su-search-result",
      "su-select-all"
    );
    selectAllLabel.appendChild(selectAll);
    selectAllContainer.appendChild(selectAllLabel);
    resultsContainer.appendChild(selectAllContainer);
    const unfollowList = getUnfollowList();
    searchResults.forEach((result) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `su-search-${result}`;
      checkbox.value = result;
      checkbox.checked = unfollowList.has(result);
      checkbox.addEventListener("change", handleChange);
      const label = document.createElement("label");
      label.textContent = result;
      label.htmlFor = `su-search-${result}`;
      const container = document.createElement("div");
      container.classList.add("superUnfollow", "su-search-result");
      label.appendChild(checkbox);
      container.appendChild(label);
      resultsContainer.appendChild(container);
    });
    return resultsContainer;
  }
  function handleSelectAll() {
    const selectAll = document.getElementById(
      "su-search-select-all"
    );
    const checkboxes = document.querySelectorAll(
      '.su-search-result input[type="checkbox"]:not(#su-search-select-all)'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAll.checked;
      checkbox.dispatchEvent(new Event("change"));
    });
  }

  // src/main.ts
  var __SU__ = {
    collectedFollowing: true,
    followingMap: /* @__PURE__ */ new Map(),
    unfollowList: /* @__PURE__ */ new Set(),
    totalUnfollowed: 0
  };
  var PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]';
  async function getFollowingAutoScroll() {
    try {
      let followingMap = getFollowingMap();
      if (__SU__.collectedFollowing && followingMap.size > 0) {
        return followingMap;
      }
      const isDone = await inifiniteScrollDown();
      if (isDone) {
        console.log("followingMap", followingMap);
        console.log("done scrolling");
        __SU__.collectedFollowing = true;
        followingMap = getFollowingMap();
        return followingMap;
      } else {
        return await getFollowingAutoScroll();
      }
    } catch (error) {
      console.error(error);
    }
  }
  var observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(async (node) => {
          if (node instanceof HTMLElement) {
            const profile = node.querySelector(
              '[data-testid="UserCell"]'
            );
            if (node.matches(PROFILES_SIBLINGS) && profile) {
              await processProfiles(profile);
            }
          }
        });
      }
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  function superUnfollow() {
    prettyConsole("starting superUnfollow");
    window.scrollTo(0, 0);
    const anchor = document.getElementById("superUnfollow-anchor");
    if (!anchor) {
      return;
    }
    const profiles = document.querySelectorAll(
      '[data-unfollow="true"]'
    );
    if (!profiles) {
      return;
    }
    let unfollowList = getUnfollowList();
    profiles.forEach(async (profile) => {
      const unfollowButton = profile.querySelector(
        '[data-testid *= "unfollow"]'
      );
      if (unfollowButton) {
        unfollowButton.click();
        profile.style.filter = "blur(1px) grayscale(100%) brightness(0.5)";
      }
      const { handle } = await getProfileDetails(profile);
      if (!handle)
        throw "no handle for profile";
      unfollowList = await unfollow(handle);
    });
    if (unfollowList.size > 0) {
      inifiniteScrollDown().then((isBottom) => {
        if (isBottom) {
          console.log("done unfollowing");
          return;
        }
        superUnfollow();
      });
    }
  }
  var unfollow = async (handle) => {
    await delay(500);
    const confirmUnfollow = await waitForElement(
      '[data-testid="confirmationSheetConfirm"]'
    );
    const unfollowList = getUnfollowList();
    if (confirmUnfollow) {
      await delay(500);
      confirmUnfollow.click();
      unfollowList.delete(handle);
      __SU__.totalUnfollowed++;
    }
    return unfollowList;
  };
  window.addEventListener(
    "startRunning",
    async function() {
      try {
        const count = document.getElementById("su-following-count")?.dataset.followingCount;
        if (!count) {
          throw "no following count found";
        }
        addSearchDialog();
        const unfollowList = getUnfollowList();
        if (unfollowList.size > 0) {
          addSuperUnfollowButton();
        }
      } catch (err) {
        console.error(err);
      }
    },
    { once: true }
  );
  window.postMessage("startRunning", "*");
})();
