let cleanTwitterState = {
   removeRetweet: true,
   removeLikedTweet: true,
   removeReplyTweet: true,
}

window.addEventListener('load', () => {
   getAppState().then(res => {
      cleanTwitterState = res;
      setTimeout(() => {
         const observeTarget = document.querySelector('[aria-label="Timeline: Your Home Timeline"]');
   
         if (observeTarget) {
            initializeDOMChangeListener(observeTarget);
         }
      }, 4000);
   });

});

chrome.storage.onChanged.addListener((changes, namespace) => {
   for (let key in changes) {
      const storageChange = changes[key];

      if (key === 'cleanTwitterState') {
         cleanTwitterState = storageChange.newValue;
      }
   }
});

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

function initializeDOMChangeListener(observeTarget) {
   const config = {
      attributes: false,
      childList: true,
      subtree: true,
      characterData: false,
      characterDataOldValue: false,
      attributeOldValue: false,
   };

   const mutationObserverCallback = function(mutations, observer) {
      for (let i = 0; i < mutations.length; i++) {
         if (mutations[i].target.lastElementChild && Number(mutations[i].target.lastElementChild.innerText)) {
            return;
         } else {
            filterTweets();
         }
      }
   };
  
   const observer = new MutationObserver(mutationObserverCallback);
   observer.observe(observeTarget, config);
   //console.log('Mutation Observer init');
}

function findMainTweetRecursively(element, tweetType) {
   let mainTweetElement = element.parentElement;
   
   if (mainTweetElement.nodeName === 'ARTICLE') {
      if (tweetType === 'RETWEET' && cleanTwitterState.removeRetweet) {
         mainTweetElement.parentElement.removeChild(mainTweetElement);
      } else if (tweetType === 'LIKED' && cleanTwitterState.removeLikedTweet) {
         mainTweetElement.parentElement.removeChild(mainTweetElement);
      } else if (tweetType === 'REPLY' && cleanTwitterState.removeReplyTweet) {
         setTimeout(() => {
            if (mainTweetElement.parentNode.parentNode.parentNode.nextElementSibling) {
               //console.log(mainTweetElement);
               mainTweetElement.parentNode.parentNode.parentNode.nextElementSibling.style.display = 'none';
               mainTweetElement.parentElement.removeChild(mainTweetElement);
            }
         }, 1000);
      }
      
      return mainTweetElement;
   }

   findMainTweetRecursively(mainTweetElement, tweetType);
}

function filterTweets() {
   let tweets = document.querySelectorAll('[data-testid="socialContext"]');
   let tweetType = '';

   if (tweets.length > 0) {
      tweets.forEach(x => {
         if (x.getAttribute('data-tweetStatus') !== 'filtered') {
            if (x.innerText.toLowerCase().includes('liked')) {
               x.setAttribute('data-tweetid', 'likedTweet');
               //console.log('LIKED TWEET: ', x.innerText.toLowerCase());
               tweetType = 'LIKED';
            } else if (x.innerText.toLowerCase().includes('retweeted')) {
               x.setAttribute('data-tweetid', 'retweeted');
               //console.log('RETWEETED TWEET: ', x.innerText.toLowerCase());
               tweetType = 'RETWEET';
            } else if (x.innerText.toLowerCase().includes('received a reply')) {
               x.setAttribute('data-tweetid', 'replyTweet');
               //console.log('RANDOM REPLY TWEET: ', x.innerText.toLowerCase());
               tweetType = 'REPLY';
            }

            if (
               x.innerText.toLowerCase().includes('liked') ||
               x.innerText.toLowerCase().includes('retweeted') ||
               x.innerText.toLowerCase().includes('received a reply')
            ) {
               x.setAttribute('data-tweetStatus', 'filtered');
               setTimeout(() => {
                  findMainTweetRecursively(x, tweetType);
               }, 3000);
            }

         }
      })
   }
}

