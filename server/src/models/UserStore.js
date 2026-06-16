/**
 * In-memory user store.
 *
 * Provides O(1) lookups by email and by session token using two co-indexed
 * Maps.  In a production system this would be backed by a database; the
 * in-memory approach is intentional for this assignment to keep the focus on
 * architecture rather than persistence plumbing.
 */

import { v4 as uuidv4 } from 'uuid';

class UserStore {
  constructor() {
    /** @type {Map<string, Object>} email → user object */
    this._byEmail = new Map();

    /** @type {Map<string, Object>} sessionToken → user object */
    this._byToken = new Map();
  }

  /**
   * Authenticate (or register) a user by email.
   *
   * If the email already exists a fresh session token is issued, invalidating
   * the previous one.  This mirrors a simple stateless-session login flow.
   *
   * @param {string} email
   * @returns {{ id: string, email: string, token: string, subscriptions: string[] }}
   */
  loginOrCreate(email) {
    const normalised = email.trim().toLowerCase();
    let user = this._byEmail.get(normalised);

    if (user) {
      // Invalidate old token
      this._byToken.delete(user.token);
    } else {
      user = {
        id: uuidv4(),
        email: normalised,
        subscriptions: [],
        createdAt: new Date().toISOString(),
      };
      this._byEmail.set(normalised, user);
    }

    // Issue new session token
    const token = uuidv4();
    user.token = token;
    this._byToken.set(token, user);

    return {
      id: user.id,
      email: user.email,
      token: user.token,
      subscriptions: [...user.subscriptions],
    };
  }

  /**
   * Validate a session token and return the associated user.
   *
   * @param {string} token
   * @returns {Object|null}
   */
  getByToken(token) {
    return this._byToken.get(token) ?? null;
  }

  /**
   * Look up a user by their unique ID.
   *
   * @param {string} userId
   * @returns {Object|null}
   */
  getById(userId) {
    for (const user of this._byEmail.values()) {
      if (user.id === userId) return user;
    }
    return null;
  }

  /**
   * Invalidate a session.
   *
   * @param {string} token
   */
  logout(token) {
    const user = this._byToken.get(token);
    if (user) {
      this._byToken.delete(token);
      user.token = null;
    }
  }

  /**
   * Update the subscription list for a user.
   *
   * @param {string} userId
   * @param {string[]} subscriptions
   */
  setSubscriptions(userId, subscriptions) {
    const user = this.getById(userId);
    if (user) {
      user.subscriptions = [...subscriptions];
    }
  }

  /**
   * Get count of currently active sessions (users with valid tokens).
   *
   * @returns {number}
   */
  get activeSessionCount() {
    return this._byToken.size;
  }
}

// Singleton — shared across routes and socket handlers.
const userStore = new UserStore();
export default userStore;
