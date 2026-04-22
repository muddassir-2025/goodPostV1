import { Client, Databases, ID, Query } from "appwrite";
import postService from "./post"; //to filter posts based on likes

class LikeService {
    client = new Client();
    databases;

    constructor() {
        this.client
            .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
            .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

        this.databases = new Databases(this.client);
    }

    // async createLike({ postId, userId }) {
    //     try {
    //         return await this.databases.createDocument(
    //             import.meta.env.VITE_APPWRITE_DATABASE_ID,
    //             import.meta.env.VITE_APPWRITE_LIKES_ID,
    //             ID.unique(),
    //             { postId, userId }
    //         );
    //     } catch (error) {
    //         console.log("createLike error", error);
    //     }
    // }

    async createLike({ postId, userId }) {
    try {
        const res = await this.databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_LIKES_ID,
            ID.unique(),
            { postId, userId }
        );

        // ✅ UPDATE POST LIKE COUNT
        const post = await postService.getPostById(postId);

        await postService.updatePost(postId, {
            likeCount: (post.likeCount || 0) + 1
        });

        return res;

    } catch (error) {
        console.log("createLike error", error);
    }
}

    // async deleteLike(likeId) {
    //     try {
    //         return await this.databases.deleteDocument(
    //             import.meta.env.VITE_APPWRITE_DATABASE_ID,
    //             import.meta.env.VITE_APPWRITE_LIKES_ID,
    //             likeId
    //         );
    //     } catch (error) {
    //         console.log("deleteLike error", error);
    //     }
    // }

    async deleteLike(likeId) {
    try {
        await this.databases.deleteDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            import.meta.env.VITE_APPWRITE_LIKES_ID,
            likeId
        );

        // // ✅ UPDATE POST LIKE COUNT
        // const post = await postService.getPostById(postId);

        // await postService.updatePost(postId, {
        //     likeCount: Math.max((post.likeCount || 0) - 1, 0) //likeCount is variable in postService
        // });

    } catch (error) {
        console.log("deleteLike error", error);
    }
}

    async getUserLike(postId, userId) {
        try {
            return await this.databases.listDocuments(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_LIKES_ID,
                [
                    Query.equal("postId", postId),
                    Query.equal("userId", userId)
                ]
            );
        } catch (error) {
            console.log("getUserLike error", error);
        }
    }

    async countLikes(postId) { //we are not using it for filter - but just to display count of likes 
        try {
            return await this.databases.listDocuments(
                import.meta.env.VITE_APPWRITE_DATABASE_ID,
                import.meta.env.VITE_APPWRITE_LIKES_ID,
                [
                    Query.equal("postId", postId)
                ]
            );
        } catch (error) {
            console.log("countLikes error", error);
        }
    }
}

const likeService = new LikeService();
export default likeService;