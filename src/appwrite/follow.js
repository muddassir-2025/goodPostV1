import { databases } from "./config"; // your Appwrite config
import { Query } from "appwrite";

const VITE_APPWRITE_DATABASE_ID="69d832fc0035a264b35b"
const VITE_APPWRITE_FOLLOWS_ID="follows"

const followService = {
  // ✅ Follow user
  async followUser(followerId, followingId) {
    try {
      return await databases.createDocument(
        VITE_APPWRITE_DATABASE_ID,
        VITE_APPWRITE_FOLLOWS_ID,
        "unique()", // auto id
        {
          followerId,
          followingId,
        }
      );
    } catch (err) {
      // prevent duplicate follow crash
      if (err.code === 409) return null;
      throw err;
    }
  },

  // ✅ Unfollow user
  async unfollowUser(followerId, followingId) {
    try {
      const res = await databases.listDocuments(
        VITE_APPWRITE_DATABASE_ID,
        VITE_APPWRITE_FOLLOWS_ID,
        [
          Query.equal("followerId", followerId),
          Query.equal("followingId", followingId),
        ]
      );

      if (res.documents.length === 0) return;

      const docId = res.documents[0].$id;

      return await databases.deleteDocument(
        VITE_APPWRITE_DATABASE_ID,
        VITE_APPWRITE_FOLLOWS_ID,
        docId
      );
    } catch (err) {
      throw err;
    }
  },

  // ✅ Check if following
  async isFollowing(followerId, followingId) {
    const res = await databases.listDocuments(
     VITE_APPWRITE_DATABASE_ID,
     VITE_APPWRITE_FOLLOWS_ID,
      [
        Query.equal("followerId", followerId),
        Query.equal("followingId", followingId),
        Query.limit(1),
      ]
    );

    return res.documents.length > 0;
  },

  // ✅ Get followers count
  async getFollowersCount(userId) {
    const res = await databases.listDocuments(
     VITE_APPWRITE_DATABASE_ID,
      VITE_APPWRITE_FOLLOWS_ID,
      [Query.equal("followingId", userId)]
    );

    return res.total;
  },

  // ✅ Get following count
  async getFollowingCount(userId) {
    const res = await databases.listDocuments(
      VITE_APPWRITE_DATABASE_ID,
      VITE_APPWRITE_FOLLOWS_ID,
      [Query.equal("followerId", userId)]
    );

    return res.total;
  },

  // ✅ Get all users I follow
  async getFollowing(userId) {
    const res = await databases.listDocuments(
      VITE_APPWRITE_DATABASE_ID,
      VITE_APPWRITE_FOLLOWS_ID,
      [Query.equal("followerId", userId)]
    );

    return res.documents.map((doc) => doc.followingId);
  },

  // ✅ Get followers list (optional)
  async getFollowers(userId) {
    const res = await databases.listDocuments(
      VITE_APPWRITE_DATABASE_ID,
      VITE_APPWRITE_FOLLOWS_ID,
      [Query.equal("followingId", userId)]
    );

    return res.documents.map((doc) => doc.followerId);
  },
};

export default followService;

