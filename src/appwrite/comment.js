import { Client, ID, Databases, Query, Permission, Role } from "appwrite";
import postService from "./post";

class CommentService {
  client = new Client(); // ✅ FIX
  databases;

  constructor() {
    this.client
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

    this.databases = new Databases(this.client);
  }

  // ✅ Create Comment
  async createComment({ postId, userId, userName, content }) {
    try {
      const res = await this.databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMMENTS_ID, // ✅ FIX
        ID.unique(),
        {
          postId,    
          userId,     
          userName,
          content,
        },
        [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),   // 👈 only owner
        Permission.delete(Role.user(userId))    // 👈 only owner
    ]
      );

       // ✅ UPDATE POST COMMENT COUNT
        const post = await postService.getPostById(postId);

        await postService.updatePost(postId, {
            commentCount: (post.commentCount || 0) + 1
        });

        return res;

    } catch (error) {
      console.log("create comment error ", error);
    }
  }

  // ✅ Get Comments
  async getComments(postId) {
    try {
      const res = await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMMENTS_ID, 
        [Query.equal("postId", postId)]
      );

      return res.documents; // ✅ return only documents
    } catch (error) {
      console.log("get comments error ", error);
    }
  }
  //update comment 
  async updateComment(commentId, data) {
    try {
      return await this.databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMMENTS_ID,
        commentId,
        data
      );
    } catch (error) {
      console.log("update Comment error: ", error);
    }
  }

  //delete comment
   async deleteComment(commentId) {
    try {
      const res = await this.databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_COMMENTS_ID,
        commentId
      );

      const post = await postService.getPostById(commentId);

      await postService.updatePost(commentId, {
            commentCount: Math.max((post.commentCount || 0) - 1, 0) //commentCount is variable in postService
        });

        return res;
          
    } catch (error) {
      console.log("delete comment error: ", error);
    }
  }


}

// ✅ export
const commentService = new CommentService();
export default commentService;