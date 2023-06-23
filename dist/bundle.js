"use strict";
(() => {
  // node_modules/.pnpm/nanostores@0.9.2/node_modules/nanostores/clean-stores/index.js
  var clean = Symbol("clean");

  // node_modules/.pnpm/nanostores@0.9.2/node_modules/nanostores/atom/index.js
  var listenerQueue = [];
  var atom = (initialValue, level) => {
    let listeners = [];
    let store = {
      get() {
        if (!store.lc) {
          store.listen(() => {
          })();
        }
        return store.value;
      },
      l: level || 0,
      lc: 0,
      listen(listener, listenerLevel) {
        store.lc = listeners.push(listener, listenerLevel || store.l) / 2;
        return () => {
          let index = listeners.indexOf(listener);
          if (~index) {
            listeners.splice(index, 2);
            store.lc--;
            if (!store.lc)
              store.off();
          }
        };
      },
      notify(changedKey) {
        let runListenerQueue = !listenerQueue.length;
        for (let i = 0; i < listeners.length; i += 2) {
          listenerQueue.push(
            listeners[i],
            store.value,
            changedKey,
            listeners[i + 1]
          );
        }
        if (runListenerQueue) {
          for (let i = 0; i < listenerQueue.length; i += 4) {
            let skip = false;
            for (let j = i + 7; j < listenerQueue.length; j += 4) {
              if (listenerQueue[j] < listenerQueue[i + 3]) {
                skip = true;
                break;
              }
            }
            if (skip) {
              listenerQueue.push(
                listenerQueue[i],
                listenerQueue[i + 1],
                listenerQueue[i + 2],
                listenerQueue[i + 3]
              );
            } else {
              listenerQueue[i](listenerQueue[i + 1], listenerQueue[i + 2]);
            }
          }
          listenerQueue.length = 0;
        }
      },
      off() {
      },
      set(data) {
        if (store.value !== data) {
          store.value = data;
          store.notify();
        }
      },
      subscribe(cb, listenerLevel) {
        let unbind = store.listen(cb, listenerLevel);
        cb(store.value);
        return unbind;
      },
      value: initialValue
      /* It will be called on last listener unsubscribing.
      We will redefine it in onMount and onStop. */
    };
    if (true) {
      store[clean] = () => {
        listeners = [];
        store.lc = 0;
        store.off();
      };
    }
    return store;
  };

  // node_modules/.pnpm/nanostores@0.9.2/node_modules/nanostores/lifecycle/index.js
  var MOUNT = 5;
  var UNMOUNT = 6;
  var REVERT_MUTATION = 10;
  var on = (object, listener, eventKey, mutateStore) => {
    object.events = object.events || {};
    if (!object.events[eventKey + REVERT_MUTATION]) {
      object.events[eventKey + REVERT_MUTATION] = mutateStore((eventProps) => {
        object.events[eventKey].reduceRight((event, l) => (l(event), event), {
          shared: {},
          ...eventProps
        });
      });
    }
    object.events[eventKey] = object.events[eventKey] || [];
    object.events[eventKey].push(listener);
    return () => {
      let currentListeners = object.events[eventKey];
      let index = currentListeners.indexOf(listener);
      currentListeners.splice(index, 1);
      if (!currentListeners.length) {
        delete object.events[eventKey];
        object.events[eventKey + REVERT_MUTATION]();
        delete object.events[eventKey + REVERT_MUTATION];
      }
    };
  };
  var STORE_UNMOUNT_DELAY = 1e3;
  var onMount = (store, initialize) => {
    let listener = (payload) => {
      let destroy = initialize(payload);
      if (destroy)
        store.events[UNMOUNT].push(destroy);
    };
    return on(store, listener, MOUNT, (runListeners) => {
      let originListen = store.listen;
      store.listen = (...args) => {
        if (!store.lc && !store.active) {
          store.active = true;
          runListeners();
        }
        return originListen(...args);
      };
      let originOff = store.off;
      store.events[UNMOUNT] = [];
      store.off = () => {
        originOff();
        setTimeout(() => {
          if (store.active && !store.lc) {
            store.active = false;
            for (let destroy of store.events[UNMOUNT])
              destroy();
            store.events[UNMOUNT] = [];
          }
        }, STORE_UNMOUNT_DELAY);
      };
      if (true) {
        let originClean = store[clean];
        store[clean] = () => {
          for (let destroy of store.events[UNMOUNT])
            destroy();
          store.events[UNMOUNT] = [];
          store.active = false;
          originClean();
        };
      }
      return () => {
        store.listen = originListen;
        store.off = originOff;
      };
    });
  };

  // node_modules/.pnpm/@nanostores+persistent@0.9.0_nanostores@0.9.2/node_modules/@nanostores/persistent/index.js
  var identity = (a) => a;
  var storageEngine = {};
  var eventsEngine = { addEventListener() {
  }, removeEventListener() {
  } };
  function testSupport() {
    try {
      return typeof localStorage !== "undefined";
    } catch {
      return false;
    }
  }
  if (testSupport()) {
    storageEngine = localStorage;
  }
  var windowPersistentEvents = {
    addEventListener(key, listener) {
      window.addEventListener("storage", listener);
    },
    removeEventListener(key, listener) {
      window.removeEventListener("storage", listener);
    }
  };
  if (typeof window !== "undefined") {
    eventsEngine = windowPersistentEvents;
  }
  function persistentAtom(name, initial = void 0, opts = {}) {
    let encode = opts.encode || identity;
    let decode = opts.decode || identity;
    let store = atom(initial);
    let set = store.set;
    store.set = (newValue) => {
      if (typeof newValue === "undefined") {
        delete storageEngine[name];
      } else {
        storageEngine[name] = encode(newValue);
      }
      set(newValue);
    };
    function listener(e) {
      if (e.key === name) {
        if (e.newValue === null) {
          set(void 0);
        } else {
          set(decode(e.newValue));
        }
      } else if (!storageEngine[name]) {
        set(void 0);
      }
    }
    onMount(store, () => {
      store.set(storageEngine[name] ? decode(storageEngine[name]) : initial);
      if (opts.listen !== false) {
        eventsEngine.addEventListener(name, listener);
        return () => {
          eventsEngine.removeEventListener(name, listener);
        };
      }
    });
    return store;
  }

  // src/utils.ts
  var delay = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  async function scrollDownFollowingPage(delayMS = 3e3) {
    const followingSection = document.querySelector(
      'section > div[aria-label="Timeline: Following"]'
    );
    const lastHeight = followingSection.scrollHeight;
    window.scrollTo({
      top: followingSection.scrollHeight,
      behavior: "smooth"
    });
    await delay(delayMS);
    let newHeight = followingSection.scrollHeight;
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
  var setButtonText = () => {
    const button = document.getElementById(
      "superUnfollow-button"
    );
    const { size } = $unfollowing.get();
    if (size > 0) {
      button.classList.add("active");
      button.innerText = `SuperUnfollow ${size} Users`;
    } else {
      button.classList.remove("active");
      button.innerText = "No Users Selected";
    }
  };
  function waitForElement(selector, timeout = 4e3) {
    return new Promise(function(resolve, reject) {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      const observer = new MutationObserver(function(records) {
        records.forEach(function(mutation) {
          const nodes = Array.from(mutation.addedNodes);
          nodes.forEach(function(node) {
            if (node instanceof HTMLElement) {
              const innerElement = node.querySelector(
                selector
              );
              if (node.matches(selector) || innerElement) {
                console.log(selector + " -> found");
                observer.disconnect();
                resolve(
                  node.matches(selector) ? node : innerElement
                );
              }
            }
          });
        });
        setTimeout(function() {
          observer.disconnect();
          reject(new Error(selector + " -> not found after 4 seconds"));
        }, timeout);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  // src/stores/index.ts
  var $unfollowing = persistentAtom("unfollowing", /* @__PURE__ */ new Set(), {
    encode: (value) => {
      return JSON.stringify(Array.from(value));
    },
    decode: (value) => {
      return new Set(JSON.parse(value));
    }
  });
  $unfollowing.listen((unfollow2) => {
    console.log(`now unfollowing ${unfollow2.size.toString()} profiles`);
    setButtonText();
  });
  var $following = persistentAtom(
    "following",
    /* @__PURE__ */ new Map(),
    {
      encode: (value) => {
        return JSON.stringify(Array.from(value.entries()));
      },
      decode: (value) => {
        return new Map(JSON.parse(value));
      }
    }
  );
  var $followingCount = persistentAtom("followingCount", 0, {
    encode: (value) => value.toString(),
    decode: (value) => parseInt(value)
  });
  var addUnfollowing = (handle) => {
    return $unfollowing.set(/* @__PURE__ */ new Set([...$unfollowing.get().add(handle)]));
  };
  var removeUnfollowing = (handle) => {
    const unfollowing = $unfollowing.get();
    unfollowing.delete(handle);
    return $unfollowing.set(/* @__PURE__ */ new Set([...unfollowing]));
  };
  var addFollowing = (handle, user) => {
    return $following.set(new Map([...$following.get().set(handle, user)]));
  };

  // src/checkboxes.ts
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
    checkbox.checked = $unfollowing.get().has(handle);
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
    if (target.checked) {
      console.log(`adding ${handle} to unfollowing`);
      addUnfollowing(handle);
    } else {
      console.log(`removing ${handle} from unfollowing`);
      removeUnfollowing(handle);
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
  };

  // src/profiles.ts
  async function processProfiles(profile) {
    try {
      profile = await waitForProfileData(profile);
      if (!profile.hasAttribute("data-unfollow")) {
        await saveFollowing(profile);
        await addCheckbox(profile);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
  async function waitForProfileData(profile, timeout = 1e4) {
    let links = profile.getElementsByTagName("a");
    if (links.length < 3 || !links[2]?.textContent?.includes("@")) {
      console.log("waiting for profile data", profile);
      const linksObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(async (node) => {
              if (node instanceof HTMLElement) {
                if (links.length > 2 && links[2]?.textContent?.includes("@")) {
                  linksObserver.disconnect();
                  return node;
                }
              }
            });
          }
        });
        setTimeout(() => {
          console.log("profile data timed out", profile);
          linksObserver.disconnect();
          return profile;
        }, timeout);
      });
      linksObserver.observe(profile, {
        childList: true,
        subtree: true
      });
    }
    return profile;
  }
  async function getProfileDetails(profile) {
    const links = profile.getElementsByTagName("a");
    let username = links[1].textContent?.trim();
    const handle = links[2].textContent?.trim();
    const description = profile.querySelector(
      '[data-testid="cellInnerDiv"] [role="button"] [dir="auto"]:nth-of-type(2)'
    )?.textContent?.trim();
    if (!handle) {
      throw new Error(`missing handle for profile`);
    }
    if (!username) {
      console.log(`missing username for ${handle}`);
      username = "<missing>";
    }
    return { username, handle, description };
  }
  async function saveFollowing(profiles) {
    try {
      if (Array.isArray(profiles)) {
        profiles.forEach(async (profile) => {
          const entry = await getProfileDetails(profile);
          addFollowing(entry.handle, entry);
        });
      } else {
        const entry = await getProfileDetails(profiles);
        addFollowing(entry.handle, entry);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // src/search.ts
  async function handleSearch() {
    const input = document.getElementById("su-search-input");
    const inputValue = input.value === "" ? ".*" : input.value;
    console.log(`searching for ${inputValue}`);
    const resultDiv = getResultsDiv();
    const following = localStorage.getItem("followingCount");
    resultDiv.innerHTML = `<div class="su-loader"><span class="su-spinner"></span>Scanning ${following} profiles. Search term: 
 ${inputValue}</div>`;
    const searchResults = searchFollowingList(inputValue);
    resultDiv.innerHTML = `<h3>Search results for: <span>${inputValue === ".*" ? "all profiles" : inputValue}</span></h3>`;
    const resultsContainer = displaySearchResults(searchResults);
    resultDiv.appendChild(resultsContainer);
  }
  function searchFollowingList(searchTerm) {
    let results = /* @__PURE__ */ new Set();
    $following.get().forEach((entry) => {
      const { username, handle, description } = entry;
      const wordRegex = new RegExp(`\\b${searchTerm}\\b`, "i");
      const allRegex = new RegExp(searchTerm, "i");
      if (allRegex.test(username) || allRegex.test(handle) || description && wordRegex.test(description)) {
        results.add(handle);
      }
    });
    return results;
  }
  async function viewUnfollowingList() {
    const resultDiv = document.getElementById("su-results");
    resultDiv.innerHTML = `<h3>Unfollowing List</h3>`;
    const resultsContainer = displaySearchResults($unfollowing.get());
    resultDiv.appendChild(resultsContainer);
  }
  function displaySearchResults(searchResults) {
    const resultsContainer = document.createElement("div");
    resultsContainer.classList.add("superUnfollow", "su-results-container");
    if (searchResults.size === 0) {
      resultsContainer.innerHTML = `<p class="su-error">No results found</p>`;
      return resultsContainer;
    }
    const selectAllContainer = createSelectAll();
    resultsContainer.appendChild(selectAllContainer);
    searchResults.forEach((result) => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `su-search-${result}`;
      checkbox.value = result;
      checkbox.checked = $unfollowing.get().has(result);
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
  function createSelectAll() {
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
    return selectAllContainer;
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
  var getResultsDiv = () => {
    return document.getElementById("su-results");
  };

  // src/unfollow.ts
  async function superUnfollow() {
    if ($superUnfollowButtonState.get() === "stopped") {
      console.log("stopping super unfollow");
      return;
    }
    await waitForProfilesProcessing();
    const profilesToUnfollow = document.querySelectorAll(
      '[data-unfollow="true"]'
    );
    if (!profilesToUnfollow) {
      throw new Error("no profiles to have the data-unfollow attribute set");
    }
    debugger;
    if (profilesToUnfollow?.length === 0) {
      console.log("no profiles to unfollow in this section");
      const isBottom = await scrollDownFollowingPage(3e3);
      if (isBottom) {
        console.log("done scrolling");
        return;
      } else {
        console.log("scrolling again");
        return await superUnfollow();
      }
    }
    for (let i = 0; i < profilesToUnfollow.length; i++) {
      if ($superUnfollowButtonState.get() === "stopped") {
        console.log("stopping super unfollow");
        return;
      }
      const profile = profilesToUnfollow[i];
      await unfollow(profile);
      if ($unfollowing.get().size === 0) {
        console.log("no profiles to unfollow");
        return;
      }
      debugger;
      return await superUnfollow();
    }
  }
  var unfollow = async (profile) => {
    const { handle } = profile.dataset;
    const unfollowButton = profile.querySelector(
      '[aria-label ^= "Following"][role="button"]'
    );
    debugger;
    if (!unfollowButton || !handle) {
      throw new Error(
        !handle ? "no handle found" : "no unfollow button for " + handle
      );
    }
    unfollowButton.click();
    await delay(1e3);
    profile.style.filter = "blur(1px) grayscale(100%) brightness(0.5)";
    const confirmUnfollow = await waitForElement(
      '[role="button"] [data-testid="confirmationSheetConfirm"]'
    );
    if (!confirmUnfollow) {
      throw new Error("no confirm unfollow button found");
    }
    await delay(1e3);
    confirmUnfollow.click();
    removeUnfollowing(handle);
    $totalUnfollowed.set($totalUnfollowed.get().add(handle));
    debugger;
    return true;
  };
  var displayUnfollowed = (unfollowed) => {
    const resultsDiv = document.getElementById("su-results");
    if (!resultsDiv) {
      throw new Error("no results div found");
    }
    const unfollowedContainer = document.createElement("div");
    unfollowedContainer.id = "su-unfollowed-container";
    unfollowedContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    `;
    const unfollowedHeader = document.createElement("h2");
    resultsDiv.innerHTML = `<div class="su-loader"><span class="su-spinner"></span>Running SuperUnfollow...
 ${$totalUnfollowed.get().size} profiles remaining</div>`;
    unfollowed.forEach((handle) => {
      const unfollowedHandle = document.createElement("p");
      unfollowedHandle.textContent = handle;
      unfollowedContainer.appendChild(unfollowedHandle);
    });
    resultsDiv.appendChild(unfollowedHeader);
    resultsDiv.appendChild(unfollowedContainer);
  };
  var waitForProfilesProcessing = async () => {
    console.log("waiting for profiles to finish processing");
    return new Promise((resolve) => {
      if (!$profilesProcessing.get()) {
        console.log("profiles not processing");
        resolve(true);
      }
      const unsubscribe = $profilesProcessing.listen((isProcessing) => {
        if (!isProcessing) {
          unsubscribe();
          resolve(true);
          console.log("profiles finished processing");
        }
      });
    });
  };

  // src/stores/unfollowing.ts
  var $superUnfollowButtonState = atom("stopped");
  async function handleSuperUnfollowBtn() {
    console.log("superunfollow button clicked");
    switch ($superUnfollowButtonState.get()) {
      case "stopped":
        $superUnfollowButtonState.set("running");
        break;
      case "running":
        $superUnfollowButtonState.set("stopped");
        break;
      default:
        break;
    }
  }
  $superUnfollowButtonState.subscribe(async (state) => {
    console.log("superunfollow button state changed:", state);
    const suButton = document.getElementById(
      "superUnfollow-button"
    );
    if (suButton) {
      switch (state) {
        case "stopped":
          setButtonText();
          suButton.classList.remove("running");
          break;
        case "running":
          suButton.innerText = "Click to Abort";
          suButton.classList.add("running");
          addRunningOverlay();
          await superUnfollow();
          break;
      }
    }
  });

  // src/collect-following.ts
  async function collectFollowing() {
    try {
      if ($collectedFollowingState.get() === "stopped") {
        console.log("stopping collect following");
        return;
      }
      if ($following.get().size === $followingCount.get()) {
        console.log("collected following count matches following count");
        return $following.get();
      }
      const isDone = await scrollDownFollowingPage();
      if (isDone) {
        console.log("following:", $following);
        console.log("done collecting following");
        $collectedFollowingState.set("stopped");
        return $following.get();
      } else {
        return await collectFollowing();
      }
    } catch (error) {
      console.error(error);
    }
  }
  var addRunningOverlay = () => {
    addOverlay();
    document.body.addEventListener(
      "click",
      (e) => {
        if (e.clientY > 0 && e.clientY <= window.innerHeight) {
          console.log("click occured, stopping process...");
          if ($superUnfollowButtonState.get() === "running") {
            $superUnfollowButtonState.set("stopped");
          }
          if ($collectedFollowingState.get() === "running") {
            $collectedFollowingState.set("stopped");
          }
          removeOverlay();
        }
      },
      { once: true }
    );
  };
  var addOverlay = () => {
    console.log("adding overlay");
    const overlay = document.createElement("div");
    overlay.id = "su-overlay";
    overlay.classList.add("su-overlay");
    document.getElementById("su-dialog")?.appendChild(overlay);
  };
  var removeOverlay = () => {
    console.log("removing overlay");
    const overlay = document.getElementById("su-overlay");
    if (overlay) {
      overlay.remove();
    }
  };

  // src/stores/collection.ts
  var $collectedFollowingState = atom("stopped");
  var handleCollectBtn = () => {
    const collectBtn = document.getElementById(
      "su-collect-following-button"
    );
    if (collectBtn) {
      switch ($collectedFollowingState.get()) {
        case "stopped":
          $collectedFollowingState.set("running");
          break;
        case "running":
          $collectedFollowingState.set("stopped");
          break;
        default:
          break;
      }
    }
  };
  $collectedFollowingState.subscribe(async (state) => {
    const collectBtn = document.getElementById(
      "su-collect-following-button"
    );
    if (collectBtn) {
      switch (state) {
        case "stopped":
          collectBtn.innerText = "Collect Following";
          collectBtn.classList.remove("running");
          break;
        case "running":
          collectBtn.innerText = "Collecting...";
          collectBtn.classList.add("running");
          addRunningOverlay();
          await collectFollowing();
          break;
        default:
          break;
      }
    }
  });

  // src/dialog.ts
  async function addSearchDialog() {
    const dialog = document.createElement("dialog");
    dialog.classList.add("superUnfollow", "su-search-dialog");
    dialog.id = "su-dialog";
    dialog.role = "dialog";
    const dialogContainer = document.createElement("div");
    dialogContainer.classList.add("superUnfollow", "su-search-dialog-container");
    dialog.appendChild(dialogContainer);
    const heading = document.createElement("p");
    heading.textContent = "Search usernames, handles and bios";
    heading.classList.add("superUnfollow", "su-heading");
    const headingsContainer = document.createElement("div");
    headingsContainer.classList.add("superUnfollow", "su-headings-container");
    headingsContainer.append(heading);
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
    searchButton.addEventListener("click", handleSearch);
    const inputContainer = document.createElement("div");
    inputContainer.classList.add("su-search-input-container");
    inputContainer.id = "su-search-input-container";
    inputContainer.append(input, searchButton);
    const resultsContainer = document.createElement("div");
    resultsContainer.id = "su-results";
    resultsContainer.classList.add("superUnfollow", "su-results");
    const modalButton = createModalButton(dialog);
    const collectBtn = createModalBtns();
    const buttons = createButtons();
    dialogContainer.append(
      closeButton,
      headingsContainer,
      inputContainer,
      collectBtn,
      resultsContainer,
      buttons
    );
    document.body.appendChild(dialog);
    document.body.appendChild(modalButton);
    return dialog;
  }
  function createButtons() {
    const container = document.createElement("div");
    container.classList.add("superUnfollow", "su-button-container");
    container.id = "superUnfollow-button-container";
    const superUnfollowBtn = document.createElement("button");
    superUnfollowBtn.classList.add("su-button", "large");
    superUnfollowBtn.addEventListener("click", handleSuperUnfollowBtn);
    superUnfollowBtn.id = "superUnfollow-button";
    container.append(superUnfollowBtn);
    return container;
  }
  var createModalButton = (dialog) => {
    const modalButton = document.createElement("button");
    modalButton.id = "su-search-modal-button";
    modalButton.textContent = "SuperUnfollow";
    modalButton.classList.add(
      "superUnfollow",
      "su-button",
      "su-modal",
      "small",
      "active"
    );
    modalButton.addEventListener("click", () => {
      dialog.showModal();
    });
    return modalButton;
  };
  function createModalBtns() {
    const collectBtn = document.createElement("button");
    collectBtn.classList.add("su-button", "small", "active", "outline", "alt");
    collectBtn.id = "su-collect-following-button";
    collectBtn.textContent = "Collect Following";
    collectBtn.addEventListener("click", handleCollectBtn);
    const viewUnfollowing = document.createElement("button");
    viewUnfollowing.classList.add("su-button", "small", "active", "outline");
    viewUnfollowing.id = "su-view-unfollowing-button";
    viewUnfollowing.textContent = "View Unfollowing";
    viewUnfollowing.addEventListener("click", viewUnfollowingList);
    const container = document.createElement("div");
    container.classList.add("su-modal-buttons-container");
    container.id = "su-modal-buttons-container";
    container.append(collectBtn, viewUnfollowing);
    return container;
  }

  // src/main.ts
  var $profilesProcessing = atom(false);
  var $totalUnfollowed = atom(/* @__PURE__ */ new Set());
  $totalUnfollowed.listen((unfollowed) => {
    console.log(`unfollowed ${unfollowed.size.toString()} profiles`);
    displayUnfollowed(unfollowed);
  });
  var PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]';
  async function init() {
    await addSearchDialog();
    setButtonText();
  }
  var profileObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(async (node) => {
          if (node instanceof HTMLElement) {
            const profile = node.querySelector(
              '[data-testid="UserCell"]'
            );
            if (node.matches(PROFILES_SIBLINGS) && profile) {
              $profilesProcessing.set(true);
              await processProfiles(profile);
              $profilesProcessing.set(false);
            }
          }
        });
      }
    });
  });
  profileObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  window.addEventListener(
    "startRunning",
    async function() {
      try {
        console.log("starting SuperUnfollow");
        const count = document.getElementById("su-following-count")?.dataset.followingCount;
        if (!count) {
          throw "no following count found";
        }
        await init();
      } catch (err) {
        console.error(err);
      }
    },
    { once: true }
  );
  window.postMessage("startRunning", "*");
  window.addEventListener("beforeunload", () => {
    console.log("unloading");
    $collectedFollowingState.set("stopped");
    $superUnfollowButtonState.set("stopped");
    const dialog = document.getElementById(
      "su-dialog"
    );
    if (dialog?.open) {
      dialog.close();
    }
  });
})();
//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/bundle.js.map
