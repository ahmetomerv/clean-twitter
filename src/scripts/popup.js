let appState;
let checkboxList;

document.addEventListener('DOMContentLoaded', function() {
    setupAnchorLinks();
    checkboxList = document.querySelectorAll("input[class=checkbox__input]");
    checkboxList.forEach(checkbox => {    
        checkbox.addEventListener('change', (event) => {
            saveChanges(appState, event);
        });
    })

    setDefaultState()
        .then(res => {
            if (res) {
                appState = res;
                updateCheckboxState(checkboxList, appState);
            }
        })
        .catch(err => {})
        .finally(() => {})

}, false);

function updateCheckboxState(checkboxList, state) {
    if (checkboxList && state) {
        for (let i = 0; i < checkboxList.length; i++) {
            checkboxList[i].checked = state[checkboxList[i].name];
        }
    }
}

function saveChanges(state, event) {
    if (event && state) {
        const { name, checked } = event.target;
        const newState = state;
        newState[name] = checked;
        chrome.storage.sync.set({ 'cleanTwitterState': newState });
    }
}

async function setDefaultState() {
    const defaultState = {
        removeRetweet: true,
        removeLikedTweet: true,
        removeReplyTweet: true,
    }

    const promise = new Promise((resolve, reject) => {
        chrome.storage.sync.get(['cleanTwitterState'], data => {
            if (!data.cleanTwitterState) {
                chrome.storage.sync.set({ 'cleanTwitterState': defaultState }, (res) => {
                    if (res) {
                        resolve(res.cleanTwitterState);
                    } else {
                        reject();
                    }
                });
            } else {
                resolve(data.cleanTwitterState);
            }
        })
    });

    const state = await promise;
    return state;
}

async function getAppState() {
    const promise = new Promise((resolve, reject) => {
        chrome.storage.sync.get(['cleanTwitterState'], (res) => {
            if (res.cleanTwitterState) {
                resolve(res.cleanTwitterState);
            } else {
                reject();
            }
        })
    });

    const state = await promise;
    return state;
}

function setupAnchorLinks() {
    const links = document.getElementsByTagName('a');
    
    for (let i = 0; i < links.length; i++) {
        (function () {
            const ln = links[i];
            const location = ln.href;
            ln.onclick = function () {
                chrome.tabs.create({ active: true, url: location });
            };
        })();
    }
}