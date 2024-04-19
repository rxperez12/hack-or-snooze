const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

class Story {
  /** Make instance of Story from data object about story:
   *   - {storyId, title, author, url, username, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.updatedAt = "";
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Static method to fetch a story from the API.
   *
   * Accepts:
   *  - storyId: string
   *
   * Returns: new Story instance of the fetched story.
   */
  static async getStory(storyId) {
    const response = await fetch(`${BASE_URL}/stories/${storyId}`);
    const data = await response.json();
    const storyData = data.story;
    return new Story(storyData);
  }

  /** Parses hostname out of URL and returns it.
   *
   * http://
   *foo.com/bar => foo.com
   www.foo.com => www.foo.com
   */

  getHostName() {
    let currentUrl = new URL(this.url);
    return currentUrl.hostname;
  }
}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 *****************************************************************************/

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await fetch(`${BASE_URL}/stories`);
    const data = await response.json();

    // turn plain old story objects from API into instances of Story class
    const stories = data.stories.map((s) => new Story(s));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Send story data to API, make a Story instance, and add it as the first
   * item to this StoryList.
   *
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {

    const newStoryInfoForAPI = {
      token: user.loginToken,
      story: newStory
    };

    const response = await fetch(`${BASE_URL}/stories`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStoryInfoForAPI)
      }
    );

    const addedStoryData = await response.json();

    const newStoryInstance = new Story(addedStoryData.story);
    this.stories.unshift(newStoryInstance);
    return newStoryInstance;
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 *****************************************************************************/

class User {
  constructor(
    {
      username,
      name,
      createdAt,
      favorites = [],
      ownStories = [],
    },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store login token on the user so that it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const body = JSON.stringify({ user: { username, password, name } });
    const resp = await fetch(`${BASE_URL}/signup`, { method: "POST", body });
    if (!resp.ok) {
      throw new Error("Signup failed");
    }
    const data = await resp.json();
    const { user, token } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /** Login in user with API, make User instance & return it.


     * - username: an existing user's username
     * - password: an existing user's password
     */

  static async login(username, password) {
    const body = JSON.stringify({ user: { username, password } });
    const resp = await fetch(`${BASE_URL}/login`, { method: "POST", body });
    if (!resp.ok) throw new Error("Login failed");
    const data = await resp.json();
    const { user, token } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   *   Returns new user (or null if login failed).
   */

  static async loginViaStoredCredentials(token, username) {
    const qs = new URLSearchParams({ token });
    const response = await fetch(`${BASE_URL}/users/${username}?${qs}`);
    if (!response.ok) {
      console.error("loginViaStoredCredentials failed");
      return null;
    }
    const data = await response.json();
    const { user } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }


  /** Given a Story instance, send POST request to API with favorited story.
   *  Once data is added to API, update user instance's list of favorites.
   *  If already present in Favorites, a story cannot be added again.
   */

  async addFavorite(story) {
    console.debug('addFavorite', 'input: ', story);

    const favoritesIds = this.favorites.map(story => story.storyId);

    if (!favoritesIds.includes(story.storyId)) {

      const bodyDataForAPI = {
        token: this.loginToken
      };

      const response = await fetch(
        `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(bodyDataForAPI)
        }
      );

      const userDocumentFromAPI = await response.json();

      console.log('userDoc from Added Favorite:', userDocumentFromAPI);

      if ("message" in userDocumentFromAPI) {
        if (userDocumentFromAPI.message === "Favorite Added!") {
          this.favorites.push(story);
          //TODO: Use return for adding to DOM with styling: return story;
        }
      }
    }
  }

  // TODO: Write a method for un-favoriting a story; move up on doc if needed
  // take a story instance
  // look for above in favorites array
  // if present, remove
  // make API DELETE request: sending

  /** Given a Story instance, send POST request to API with favorited story.
   *  Once data is added to API, update user instance's list of favorites.
   *  If already present in Favorites, a story cannot be added again. TODO: change
   */
  async removeFavorite(story) {
    console.debug('removeFavorite', 'input: ', story);

    const favoritesIds = this.favorites.map(story => story.storyId);

    if (favoritesIds.includes(story.storyId)) {

      const bodyDataForAPI = {
        token: this.loginToken
      };

      const response = await fetch(
        `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
        {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(bodyDataForAPI)
        }
      );

      const userDocumentFromAPI = await response.json();

      console.log('userDoc from removeFavorite:', userDocumentFromAPI);

      if ("message" in userDocumentFromAPI) {
        if (userDocumentFromAPI.message === "Favorite Removed!") {
          this.favorites = this.favorites
            .filter(favoriteStory => favoriteStory.storyId !== story.storyId);

          console.log('local favorites post delete: ', this.favorites);
        }
      }
    }
  }

}

export { Story, StoryList, User, BASE_URL };
