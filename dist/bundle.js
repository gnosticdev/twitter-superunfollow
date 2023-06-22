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

  // src/stores.ts
  var $unfollowing = persistentAtom("unfollowing", /* @__PURE__ */ new Set(), {
    encode: (value) => {
      return JSON.stringify(Array.from(value));
    },
    decode: (value) => {
      return new Set(JSON.parse(value));
    }
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
  var $buttonState = atom("idle");
  var $stopFlag = atom(false);
  async function handleButtonState() {
    switch ($buttonState.get()) {
      case "idle":
        $buttonState.set("running");
        break;
      case "running":
        $buttonState.set("done");
        break;
      case "done":
        $buttonState.set("idle");
        break;
      default:
        break;
    }
  }
  $buttonState.subscribe((state) => {
    const suButton = document.getElementById(
      "superUnfollow-button"
    );
    if (suButton) {
      switch (state) {
        case "idle":
          setButtonText();
          suButton.disabled = false;
          break;
        case "running":
          suButton.innerText = "Running...";
          suButton.disabled = true;
          $profilesProcessing.set(true);
          break;
        case "done":
          suButton.innerText = "Done";
          suButton.disabled = true;
          $stopFlag.set(true);
          break;
      }
    }
  });
  var setButtonText = () => {
    const superUnfollowBtn = document.getElementById(
      "superUnfollow-button"
    );
    const { size } = $unfollowing.get();
    if (size > 0) {
      superUnfollowBtn.classList.add("active");
      superUnfollowBtn.innerText = `SuperUnfollow ${size} Users`;
    } else {
      superUnfollowBtn.classList.remove("active");
      superUnfollowBtn.innerText = "No Users Selected";
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
                links = node.getElementsByTagName("a");
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
    const username = links[1].textContent?.trim();
    const handle = links[2].textContent?.trim();
    const description = profile.querySelector(
      '[data-testid="cellInnerDiv"] [role="button"] [dir="auto"]:nth-of-type(2)'
    )?.textContent?.trim();
    if (!username || !handle) {
      throw `missing ${username ? "handle for " + username : "username for " + handle} for profile:`;
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
  function prettyConsole(message, object = null) {
    const messageStyle = "color: hsl(350, 79%, 74%); background-color: hsl(219, 100%, 39%); font-weight: bold; font-size: 1; padding: 5px;";
    console.log(`%c ${message}`, messageStyle);
    object && console.log(object);
  }

  // src/add-elements.ts
  function addStartButton(dialog) {
    prettyConsole("adding superUnfollow button");
    const container = document.createElement("div");
    container.classList.add("superUnfollow", "su-button-container");
    container.id = "superUnfollow-button-container";
    const superUnfollowBtn = document.createElement("button");
    superUnfollowBtn.classList.add("su-button", "large");
    superUnfollowBtn.addEventListener("click", handleButtonState);
    superUnfollowBtn.id = "superUnfollow-button";
    container.append(superUnfollowBtn);
    dialog.appendChild(container);
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
    const unfollowing = $unfollowing.get();
    checkbox.checked = unfollowing.has(handle);
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

  // src/search.ts
  async function handleSearch() {
    const input = document.getElementById("su-search-input");
    const inputValue = input.value === "" ? ".*" : input.value;
    console.log(`searching for ${inputValue}`);
    const resultDiv = document.getElementById(
      "su-search-results"
    );
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

  // src/dialog.ts
  async function addSearchDialog() {
    console.log("adding search dialog");
    const dialog = document.createElement("dialog");
    dialog.classList.add("superUnfollow", "su-search-dialog");
    const dialogContainer = document.createElement("div");
    dialogContainer.classList.add("superUnfollow", "su-search-dialog-container");
    dialogContainer.role = "dialog";
    dialog.appendChild(dialogContainer);
    const modalButton = createModalButton(dialog);
    const collectFollowingBtn = createCollectBtn();
    dialogContainer.appendChild(collectFollowingBtn);
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
    console.log("added search dialog");
    return dialog;
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
  function createCollectBtn() {
    const button = document.createElement("button");
    button.classList.add("su-button", "small", "active");
    button.id = "su-collect-following-button";
    button.textContent = "Get All Following";
    button.addEventListener("click", collectFollowing);
    return button;
  }

  // src/main.ts
  var $totalUnfollowed = atom(0);
  var $collectedFollowing = atom(false);
  var $profilesProcessing = atom(false);
  var $suIsRunning = atom(false);
  var $collectFollowingStopFlag = atom(false);
  $unfollowing.listen((unfollow) => {
    console.log(`now unfollowing ${unfollow.size.toString()} profiles`);
    setButtonText();
  });
  var PROFILES_SIBLINGS = '[data-testid="cellInnerDiv"]';
  async function init() {
    const dialog = await addSearchDialog();
    addStartButton(dialog);
    setButtonText();
  }
  async function collectFollowing() {
    try {
      if ($collectFollowingStopFlag.get()) {
        console.log("stopping collect following");
        $collectFollowingStopFlag.set(false);
        return;
      }
      if ($collectedFollowing && $following.get().size > 0) {
        return $following.get();
      }
      const isDone = await scrollDownFollowingPage();
      if (isDone) {
        console.log("following:", $following);
        console.log("done scrolling");
        $collectedFollowing.set(true);
        return $following.get();
      } else {
        return await collectFollowing();
      }
    } catch (error) {
      console.error(error);
    }
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
})();
//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/bundle.js.map
