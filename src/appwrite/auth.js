import { Client, ID, Account } from "appwrite";

class Authservice {
  client = new Client();
  account;

  constructor() {
    this.client
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

    this.account = new Account(this.client);
  }

  // 🔐 Signup
  async signup({ email, password, name }) {
    try {
      const user = await this.account.create(
        ID.unique(),
        email,
        password,
        name
      );
      return user;
    } catch (error) {
      console.error("signup error:", error);
      throw error;
    }
  }

  // 🔐 Login
  async login({ email, password }) {
    try {
      return await this.account.createEmailPasswordSession(
        email,
        password
      );
    } catch (error) {
      if (
        error?.code === 401 ||
        error?.type === "user_session_already_exists"
      ) {
        await this.logout();
        return await this.account.createEmailPasswordSession(
          email,
          password
        );
      }
      console.error("login error:", error);
      throw error;
    }
  }

  // 👤 Current User
  async getCurrentUser() {
    try {
      return await this.account.get();
    } catch {
      return null;
    }
  }

  // 🚪 Logout
  async logout() {
    try {
      return await this.account.deleteSession("current");
    } catch (error) {
      console.error("logout error:", error);
      throw error;
    }
  }
}

// singleton
const authService = new Authservice();
export default authService;