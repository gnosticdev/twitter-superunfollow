"use strict";
(() => {
  // node_modules/.pnpm/nanostores@0.9.2/node_modules/nanostores/task/index.js
  var tasks = 0;
  var resolves = [];
  function startTask() {
    tasks += 1;
    return () => {
      tasks -= 1;
      if (tasks === 0) {
        let prevResolves = resolves;
        resolves = [];
        for (let i of prevResolves)
          i();
      }
    };
  }

  // node_modules/.pnpm/nanostores@0.9.2/node_modules/nanostores/action/index.js
  var lastAction = Symbol();
  var actionId = Symbol();
  var uid = 0;
  var doAction = (store, actionName, cb, args) => {
    let id = ++uid;
    let tracker = { ...store };
    tracker.set = (...setArgs) => {
      store[lastAction] = actionName;
      store[actionId] = id;
      store.set(...setArgs);
      delete store[lastAction];
      delete store[actionId];
    };
    if (store.setKey) {
      tracker.setKey = (...setArgs) => {
        store[lastAction] = actionName;
        store[actionId] = id;
        store.setKey(...setArgs);
        delete store[lastAction];
        delete store[actionId];
      };
    }
    let result = cb(tracker, ...args);
    if (result instanceof Promise) {
      let [err, end] = typeof store.action !== "undefined" ? store.action(id, actionName, args) : [];
      let endTask = startTask();
      return result.catch((error) => {
        err && err(error);
        throw error;
      }).finally(() => {
        endTask();
        end && end();
      });
    }
    return result;
  };
  var action = (store, actionName, cb) => (...args) => doAction(store, actionName, cb, args);

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
      PROFILES_SECTION
    );
    const lastHeight = getLastChildHeight();
    const { scrollHeight: oldScrollHeight } = followingSection;
    window.scrollTo({
      top: lastHeight,
      behavior: "smooth"
    });
    await delay(delayMS);
    const newScrollHeight = followingSection.scrollHeight;
    console.log(
      `%c scrolling down: lastHeight: ${lastHeight}, newHeight: ${newScrollHeight}`,
      "color: dodgerblue;"
    );
    if (newScrollHeight === oldScrollHeight) {
      return true;
    } else {
      return false;
    }
  }
  var getLastChildHeight = () => {
    const lastChild = document.querySelector(
      PROFILES_SIBLINGS + ":last-child"
    );
    const translateYString = lastChild.style.transform;
    const translateYRegex = /translateY\((\d+(\.\d+)?)px\)/;
    const match = translateYRegex.exec(translateYString);
    const translateY = match ? parseFloat(match[1]) : 0;
    return translateY;
  };
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
  function waitForElement(selector, timeout = 5e3, label = selector) {
    return new Promise(function(resolve, reject) {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      const observer = new MutationObserver(function(records) {
        prettyConsole("waiting for " + label);
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
  function prettyConsole(message, object = null) {
    const messageStyle = "color: hsl(350, 79%, 74%); background-color: hsl(219, 100%, 39%); font-weight: bold; font-size: 1; padding: 5px;";
    console.log(`%c ${message}`, messageStyle);
    object && console.log(object);
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
    const index = $following.get().size;
    const profile = { ...user, index };
    return $following.set(new Map([...$following.get().set(handle, profile)]));
  };
  var $setFollowingIndex = atom(/* @__PURE__ */ new Map());
  var addFollowingIndexes = action(
    $setFollowingIndex,
    "following",
    (store, handle) => {
      store.set(new Map([...store.get().set(handle, store.get().size)]));
    }
  );

  // src/checkboxes.ts
  async function addCheckbox(profile) {
    const unfollowButton = profile.querySelector(
      '[role="button"][data-testid $= "-unfollow"]'
    );
    if (!unfollowButton) {
      throw "no unfollow button found";
    }
    const profileDetails = await getProfileDetails(profile);
    const { handle } = profileDetails;
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
    return profileDetails;
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
  async function processProfile(profile) {
    try {
      profile = await waitForProfileData(profile, 5e3);
      if (!profile.hasAttribute("data-unfollow")) {
        const profileDetails = await addCheckbox(profile);
        addFollowing(profileDetails.handle, profileDetails);
        return profile;
      }
    } catch (error) {
      console.error(error);
    }
  }
  async function waitForProfileData(profile, timeout = 1e4) {
    let links = profile.getElementsByTagName("a");
    if (links.length < 3 || !links[2]?.textContent?.includes("@")) {
      console.log("waiting for profile data", timeout);
      await delay(100);
      return await waitForProfileData(profile, timeout - 100);
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

  // src/search.ts
  var $searchResults = atom(/* @__PURE__ */ new Set());
  var $viewResults = atom("none");
  var $searchInput = atom("");
  $searchResults.listen((results) => console.log("search results:", results));
  async function handleSearch() {
    const input = document.getElementById("su-search-input");
    const inputValue = input.value === "" ? ".*" : input.value;
    $searchInput.set(inputValue);
    console.log(`searching for ${inputValue}`);
    const resultDiv = getResultsDiv();
    const following = localStorage.getItem("followingCount");
    resultDiv.innerHTML = `<div class="su-loader"><span class="su-spinner"></span>Scanning ${following} profiles. Search term: 
 ${inputValue}</div>`;
    $searchResults.set(searchFollowingList(inputValue));
    resultDiv.innerHTML = `<h3>Search results for: <span>${inputValue === ".*" ? "all profiles" : inputValue}</span></h3>`;
    const resultsContainer = displayResults($searchResults.get());
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
  function handleViewButton() {
    const resultsDiv = getResultsDiv();
    console.log(
      "viewResults: ",
      $viewResults.get(),
      "searchResults size: ",
      $searchResults.get().size
    );
    const viewButton = document.getElementById("su-view-button");
    if (!viewButton)
      return;
    const viewResults = $viewResults.get();
    if (viewResults === "none") {
      viewButton.textContent = "Hide Unfollowing";
      $viewResults.set("unfollowing");
      resultsDiv.innerHTML = "<h3>Unfollowing List</h3>";
      resultsDiv.append(displayResults($unfollowing.get()));
    } else if (viewResults === "unfollowing" && $searchResults.get().size > 0) {
      viewButton.textContent = "View Unfollowing";
      $viewResults.set("search");
      resultsDiv.innerHTML = `<h3>Search results for: <span>${$searchInput.get() === ".*" ? "all profiles" : $searchInput.get()}</span></h3>`;
      resultsDiv.append(displayResults($searchResults.get()));
    } else {
      viewButton.textContent = "View Unfollowing";
      $viewResults.set("none");
      resultsDiv.innerHTML = "";
    }
  }
  function displayResults(searchResults) {
    const resultsContainer = document.createElement("div");
    resultsContainer.classList.add("superUnfollow", "su-results-container");
    resultsContainer.id = "su-results-container";
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
          await collectFollowing();
          break;
        default:
          break;
      }
    }
  });

  // src/unfollow.ts
  async function startSuperUnfollow() {
    const profiles = document.querySelectorAll(
      '[data-unfollow="true"]'
    );
    profiles.forEach(async (profile) => {
      await superUnfollow(profile);
      await delay(1e3);
    });
    await scrollUnfollow();
  }
  var scrollUnfollow = async () => {
    if ($superUnfollowButtonState.get() === "stopped") {
      console.log("stopping super unfollow");
      return;
    }
    try {
      await scrollDownFollowingPage(2e3);
      await delay(1e3);
      await scrollUnfollow();
    } catch (error) {
      console.error(error);
      return;
    }
  };
  async function superUnfollow(profile) {
    if ($superUnfollowButtonState.get() === "stopped") {
      console.log("stopping super unfollow");
      return;
    }
    try {
      const { handle } = profile.dataset;
      if (handle && $unfollowing.get().has(handle)) {
        const unfollowed = await unfollow(profile);
        if (!unfollowed) {
          $superUnfollowButtonState.set("stopped");
          throw new Error("unfollow failed");
        }
        if ($unfollowing.get().size === 0) {
          prettyConsole("no more profiles to unfollow");
          $superUnfollowButtonState.set("stopped");
          return;
        }
      }
    } catch (error) {
      console.error(error);
      return;
    }
  }
  var unfollow = async (profile) => {
    try {
      const { handle } = profile.dataset;
      const unfollowButton = profile.querySelector(
        '[aria-label ^= "Following"][role="button"]'
      );
      if (!unfollowButton || !handle) {
        throw new Error(
          !handle ? "no handle found" : "no unfollow button for " + handle
        );
      }
      unfollowButton.click();
      await delay(1500);
      profile.style.filter = "blur(1px) grayscale(100%) brightness(0.5)";
      const confirmUnfollow = await waitForElement(
        '[role="button"][data-testid="confirmationSheetConfirm"]'
      );
      if (!confirmUnfollow) {
        throw new Error("no confirm unfollow button found");
      }
      confirmUnfollow.click();
      await delay(1500);
      removeUnfollowing(handle);
      $unfollowedProfiles.set($unfollowedProfiles.get().add(handle));
      debugger;
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };
  var displayUnfollowed = (unfollowed) => {
    const resultsDiv = getResultsDiv();
    const unfollowedContainer = document.createElement("div");
    unfollowedContainer.id = "su-unfollowed-container";
    unfollowedContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    `;
    resultsDiv.innerHTML = `<h3 class="su-loader"><span class="su-spinner"></span>Running SuperUnfollow...</h3><p> ${$unfollowedProfiles.get().size} profiles remaining</p>`;
    unfollowed.forEach((handle) => {
      const unfollowedHandle = document.createElement("p");
      unfollowedHandle.textContent = handle;
      unfollowedContainer.appendChild(unfollowedHandle);
    });
    resultsDiv.appendChild(unfollowedContainer);
    console.log("appending unfollowed list to results div", unfollowed);
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
  $superUnfollowButtonState.listen(async (state) => {
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
          await startSuperUnfollow();
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
    const modalButton = createShowModalButon(dialog);
    const collectBtn = createModalButtons();
    const buttons = createSuperUnfollowBtn();
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
  function createSuperUnfollowBtn() {
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
  var createShowModalButon = (dialog) => {
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
  function createModalButtons() {
    const collectBtn = document.createElement("button");
    collectBtn.classList.add("su-button", "small", "active", "outline", "alt");
    collectBtn.id = "su-collect-following-button";
    collectBtn.textContent = "Collect Following";
    collectBtn.addEventListener("click", handleCollectBtn);
    const viewUnfollowing = document.createElement("button");
    viewUnfollowing.classList.add("su-button", "small", "active", "outline");
    viewUnfollowing.id = "su-view-button";
    viewUnfollowing.textContent = "View Unfollowing";
    viewUnfollowing.addEventListener("click", handleViewButton);
    const container = document.createElement("div");
    container.classList.add("su-modal-buttons-container");
    container.id = "su-modal-buttons-container";
    container.append(collectBtn, viewUnfollowing);
    return container;
  }

  // src/main.ts
  var $unfollowedProfiles = atom(/* @__PURE__ */ new Set());
  var $profileIndex = atom(0);
  $unfollowedProfiles.listen((unfollowed) => {
    displayUnfollowed(unfollowed);
  });
  var PROFILES_SECTION = 'section > div[aria-label="Timeline: Following"]';
  var PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]';
  async function init() {
    await addSearchDialog();
    setButtonText();
    startObserver();
  }
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
  function startObserver() {
    const profileObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length === 0) {
          continue;
        }
        mutation.addedNodes.forEach(async (node) => {
          if (node instanceof HTMLElement) {
            const profile = node.querySelector(
              '[data-testid="UserCell"]'
            );
            if (node.matches(PROFILES_SIBLINGS) && profile) {
              const processedProfile = await processProfile(profile);
              if ($superUnfollowButtonState.get() === "running" && processedProfile) {
                await superUnfollow(processedProfile);
              }
            }
          }
        });
      }
    });
    getFollowingSection().then((section) => {
      profileObserver.observe(section, {
        childList: true,
        subtree: true
      });
    });
  }
  var getFollowingSection = async () => {
    const section = await waitForElement(
      PROFILES_SECTION,
      8e3,
      "following section"
    );
    if (!section) {
      throw "following section not found";
    }
    return section;
  };
})();
//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/bundle.js.map
