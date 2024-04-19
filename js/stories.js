// This is the global list of all stories (an instance of StoryList)
import {
  $allStoriesList,
  $storiesLoadingMsg,
  $storySubmitForm
} from "./dom";
import { Story, StoryList } from "./models";
import { currentUser } from "./user";

export let currStoryList;

/******************************************************************************
 * Generating HTML for a story
 *****************************************************************************/

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns DOM object for the story.
 */

export function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // if a user is logged in, show favorite/not-favorite star
  const showStar = Boolean(currentUser);
  const $li = document.createElement("li");
  $li.id = story.storyId;
  $li.classList.add("Story", "mt-2");
  $li.innerHTML = `
      <a href="${story.url}" target="a_blank" class="Story-link">
        ${story.title}
      </a>
      <small class="Story-hostname text-muted">(${hostName})</small>
      <small class="Story-author">by ${story.author}</small>
      <small class="Story-user d-block">posted by ${story.username}</small>
    `;
  return $li;
}


/******************************************************************************
 * List all stories
 *****************************************************************************/

/** For in-memory list of stories, generates markup & put on page. */

export function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.innerHTML = "";

  for (const story of currStoryList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.classList.remove("d-none");
}


/******************************************************************************
 * Start: show stories
 *****************************************************************************/

/** Get and show stories when site first loads. */

export async function fetchAndShowStoriesOnStart() {
  currStoryList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}


/**
 * Get data from Submit story form and add it to website.
 * After, display story list with new articles added on the page.
 */

export async function handleSubmitStory(evt) {
  console.debug("handleSubmitStory", evt);
  evt.preventDefault();

  const qs = $storySubmitForm.querySelector.bind($storySubmitForm);

  const submittedStoryAuthor = qs("#StorySubmitForm-author").value;
  const submittedStoryTitle = qs("#StorySubmitForm-title").value;
  const submittedStoryUrl = qs("#StorySubmitForm-url").value;

  const submittedStoryData = {
    author: submittedStoryAuthor,
    title: submittedStoryTitle,
    url: submittedStoryUrl
  };

  await currStoryList.addStory(currentUser, submittedStoryData);

  // currStoryList = await StoryList.getStories();
  // TODO: can save currStoryList.addStory variable, and prepend that using
  //generateStoryMarkup to the beginning of Story List part of the DOM
  putStoriesOnPage();
  $storySubmitForm.classList.add('d-none');
}

// add event listener that uses handle submit story
$storySubmitForm.addEventListener("submit", handleSubmitStory);