// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict";

let socialMediaKeys = {
  facebook: true,
  github: true,
  google: true,
  instagram: true,
  jobscore: true,
  keybase: true,
  linkedin: true,
  stackoverflow: true,
  twitter: true
};

// Media Site URLs and their Suffixes
const facebookURL = "https://www.facebook.com/search/people/?q=";
const googleURL = "http://www.google.com/search?q=";

const linkedinURL = "https://www.linkedin.com/search/results/all/?keywords=";
const linkedinGlobalFlag = "&origin=GLOBAL_SEARCH_HEADER";

const twitterURL = "https://twitter.com/search?q=";
const twitterLang = "&src=typd&lang=en";

const instagramURL = "https://web.stagram.com/search?query=";

const jobscoreURL =
  "https://hire.jobscore.com/employer/search/extended?keywords=";

const stackoverflow = "https://stackoverflow.com/users";
const keybase = "https://keybase.io/";

const github = "https://github.com/search?q=";
const githubSuffix = "&type=Users";

chrome.runtime.onInstalled.addListener(function() {
  // Init the Extension to show
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: ".com" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);

    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: ".net" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);

    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: ".io" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);

    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: ".org" }
          })
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
      }
    ]);
  });

  // Initialize chrome.storage.
  chrome.storage.sync.get(["mediaKeys"], function(data) {
    if (Object.keys(data).length === 0) {
      //Then we need to put the keys in
      chrome.storage.sync.set({ ["mediaKeys"]: socialMediaKeys }, function() {
        console.log("The keys were successfully inserted.");

        // Check to see if the keys are inside:
        chrome.storage.sync.get(["mediaKeys"], function(data) {
          console.log("Keys were retrieved: ", data);
        });
      });
    }
  });
});

// Open Tab logic for each social media site.
function openSocialMediaSites(selectedText) {
  //Get the stored values:
  chrome.storage.sync.get(["mediaKeys"], function(data) {
    let mediaKeys = data.mediaKeys;

    for (let key in mediaKeys) {
      if (mediaKeys.hasOwnProperty(key)) {
        if (mediaKeys[key] === true) {
          // Open URL tab for that key.
          switch (key) {
            case "facebook":
              searchURL(selectedText, facebookURL, "");
              break;
            case "github":
              searchURL(selectedText, github, githubSuffix);
              break;
            case "google":
              searchURL(selectedText, googleURL, "");
              break;
            case "instagram":
              searchURL(selectedText, instagramURL, "");
              break;
            case "jobscore":
              searchURL(selectedText, jobscoreURL, "");
              break;
            case "keybase":
              searchURL(selectedText, keybase, "");
              break;
            case "linkedin":
              searchURL(selectedText, linkedinURL, linkedinGlobalFlag);
              break;
            case "stackoverflow":
              searchStackOverflow(selectedText, stackoverflow, "");
              break;
            case "twitter":
              searchURL(selectedText, twitterURL, twitterLang);
              break;
            default:
              console.log("Safe Space");
          }
        }
      }
    }
  });
}

function searchURL(name, address, suffix) {
  chrome.tabs.create({ url: address + name + suffix });
}

function searchStackOverflow(name, address) {
  chrome.storage.sync.set({ ["selectionValue"]: name }, function() {
    // Now Create the Tab, and insert the script.
    chrome.tabs.create({ url: address }, tab => {
      //Logic in here to insert script.
      //stackoverflow input field id: userfilter  && f-input s-filter-input
      chrome.tabs.executeScript(tab.id, {
        code: `(function(){
                // Since we can't pass in values into here, then we need to retrieve the highlighted text value From Local storage. =)
                chrome.storage.sync.get(['selectionValue'], function(data){
                    var count = 20; 
                    
                    function addTextToUserField(){
                        var inputField = document.getElementsByClassName('f-input s-filter-input')[0];
                        
                        if( inputField ){
                            // Focus on the inputField and set its value. 
                            inputField.focus();
                            inputField.value = data.selectionValue;
                            
                            // Invoke a tab press so it can start searching. 
                            var e = new KeyboardEvent('keydown',{'keyCode':32,'which':32});
                            inputField.dispatchEvent(e);
                        } else {
                            if(count-- > 0 ){
                                //The elements we need don't exist yet, wait a bit to try again.
                                setTimeout(addTextToUserField,250);
                            }
                        }
                    }
                    addTextToUserField();
                });
            })();`
      });
    });
  });
}

// Create the right-click menu on initialization
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "mediaContextMenu",
    title: "Search Social Media Sites",
    contexts: ["selection"]
  });
});

// Add EventListener for the Right-Clicked contextMenu.
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  openSocialMediaSites(info.selectionText);
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === "super-creep") {
    chrome.tabs.executeScript(
      {
        code: `(${getSelectionText.toString()})()`,
        // We should inject into all frames, because the user could have made their
        // selection within any frame (like an iFrame), or in multiple frames on the same page.
        allFrames: true,
        matchAboutBlank: true
      },
      function(results) {
        let selectedText = results.reduce(function(sum, value) {
          if (value) {
            if (sum) {
              // Alert the user that things are selected in more than one frame.
              // And show them what we are searching on.
              alert(`Multiple things have been selected. 
                        Opening super creep search on selection "${value}"`);
            }
            return value;
          }
          return sum;
        }, "");
        openSocialMediaSites(selectedText);
      }
    );
  }
});

// This seems like we should just be able to use window.getSelection().toString();
// But this won't work in the case where we are pulling the selection from an input or text area
// See https://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text & https://stackoverflow.com/questions/46752567/how-to-get-selected-text-in-the-background-script-from-the-active-tab-after-a-h?rq=1
function getSelectionText() {
  let text = "";
  let activeEl = document.activeElement;
  let activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
  if (
    activeElTagName == "textarea" ||
    (activeElTagName == "input" &&
      /^(?:text|search|password|tel|url)$/i.test(activeEl.type) &&
      typeof activeEl.selectionStart == "number")
  ) {
    text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
  } else if (window.getSelection) {
    text = window.getSelection().toString();
  }
  return text;
}
