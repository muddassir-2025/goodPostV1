import {Client,ID,Databases,Query} from "appwrite"

class FavoriteService {
    client = new Client();
    databases;


constructor(){
    this.client
      .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
      .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

      this.databases = new Databases(this.client);
}

//Add 
async addFavorite(userId,postId){
    return await this.databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_FAVORITES_ID,
        ID.unique(),
        {userId,postId}
    );
}

//delete
async deleteFavorite(favId){
    return await this.databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_FAVORITES_ID,
        favId
    )
}

//check : user favorite for this post - toggle ?
async getUserFavorite(userId,postId){
    return await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_FAVORITES_ID,
        [
            Query.equal("userId",userId),
            Query.equal("postId",postId)
        ]
    )
}

//get all users favorites 
async getUSerAllFavorites(userId){
     return await this.databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_FAVORITES_ID,
        [ Query.equal("userId",userId) ]
    )
}

}

export default new FavoriteService();