import {
  $loginForm,
  $signupForm,
  $allStoriesList,
} from "./dom";

import { fetchAndShowStoriesOnStart } from "./stories"; //add currStoryList for test
import {
  checkForRememberedUser,
  currentUser,
  updateUIOnUserLogin,
} from "./user";

//IMPORTS FOR TESTS

import {
  User,
  StoryList
} from './models';




/** To make it easier for individual components to show just themselves, this
 * is a useful function that hides pretty much everything on the page. After
 * calling this, individual components can re-show just what they want.
 */

export function hidePageComponents() {
  const components = [
    $allStoriesList,
    $loginForm,
    $signupForm,
  ];
  for (const $c of components) $c.classList.add("d-none");
}

/** Overall function to kick off the app. */

export async function start() {
  console.debug("start");

  console.log("currentUser=", currentUser);

  // "Remember logged-in user" and log in, if credentials in localStorage
  await checkForRememberedUser();
  await fetchAndShowStoriesOnStart();

  // if we got a logged-in user
  if (currentUser) await updateUIOnUserLogin();

  //TEST FOR NEW STORY
  // let newStory = await currStoryList.addStory(currentUser,
  //   { title: "Test", author: "Me", url: "http://meow.com" });

  // console.log("newStory=", newStory);
  // console.log("currentUser=", currentUser);

  //TEST FOR ADD FAVORITE AND REMOVE FAVORITE
  // let storyList = await StoryList.getStories();
  // let stories = storyList.stories;

  // console.log('added favorite:', await currentUser.addFavorite(stories[0]));
  // console.log('user favorites saved locally: ', currentUser.favorites);

  // console.log('removed favorite: ', await currentUser.removeFavorite(stories[0]));

}

// Once the DOM is entirely loaded, begin the app

console.warn(
  "HEY STUDENT: This program sends many debug messages to" +
  " the console. If you don't see the message 'start' below this, you're not" +
  " seeing those helpful debug messages. In your browser console, click on" +
  " menu 'Default Levels' and add Verbose",
);
