import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import favoriteService from "../appwrite/favorite";
import postService from "../appwrite/post";

export default function Favorites() {
  const user = useSelector((state) => state.auth.userData);

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!user) return;

   const fetchFavorites = async () => {
  try {
    const favRes = await favoriteService.getUSerAllFavorites(user.$id);

    const postIds = favRes.documents.map(f => f.postId);

    if (!postIds.length) {
      setPosts([]);
      return;
    }

    const postsData = await Promise.all(
      postIds.map(id => postService.getPostById(id))
    );

    setPosts(postsData.filter(Boolean));
  } catch (err) {
    console.log("Fav page error:", err);
  }
};

    fetchFavorites();
  }, [user]);

  if (!posts.length) {
    return (
      <div className="text-center mt-10 text-gray-400">
        No favorites yet ❤️
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
      {posts.map(post => (
        <div
          key={post.$id}
          className="bg-[#181818] p-4 rounded-xl hover:bg-[#202020] transition"
        >
          <h3 className="text-white font-semibold">{post.title}</h3>
          <h3 className="text-white font-semibold">{post.content}</h3>


          {post.featuredImg && (
            <img
              src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${post.featuredImg}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
              className="mt-2 w-full h-40 object-cover rounded-md"
            />
          )}

          {post.audioId && (
            <audio
              controls
              className="mt-2 w-full"
              src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${post.audioId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}