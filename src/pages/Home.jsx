import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import postService from "../appwrite/post";
import { useSelector } from "react-redux";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("latest");

  const user = useSelector((state) => state.auth.userData);

  const fetchPosts = async () => {
    const res = await postService.getPosts(search);

    if (!res) return;

    let data = res.documents;

    // 🔍 search (if using frontend filter also)
    if (search.trim()) {
      data = data.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 🔽 FILTER LOGIC
    if (filter === "latest") {
      data.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
    }

    if (filter === "likes") {
      data.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }

    if (filter === "comments") {
      data.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    }

    setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, [search, filter]);

  const handleDelete = async (postId, fileId) => {
    try {
      if (!window.confirm("Delete this post?")) return;

      if (fileId) {
        await postService.deleteFile(fileId);
      }

      await postService.deletePost(postId);
      fetchPosts();
    } catch (error) {
      console.log("delete error ", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-6">
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
        All Posts
      </h2>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded w-72 border-2 border-amber-50 text-amber-50"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded w-72 border-2 border-amber-50 bg-gray-900 text-white p-2"
        >
          <option value="latest" className="bg-gray-900 text-white">
            Latest
          </option>
          <option value="likes" className="bg-gray-900 text-white">
            Most Liked ❤️
          </option>
          <option value="comments" className="bg-gray-900 text-white">
            Most Commented 💬
          </option>
        </select>

      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.$id}
            className="bg-white dark:bg-slate-900 
            border border-slate-200 dark:border-slate-800 
            rounded-xl p-4 shadow-sm hover:shadow-md transition"
          >
            {/* Title */}
            <h3
              onClick={() => navigate(`/post/${post.slug}`)}
              className="text-lg font-semibold text-slate-800 dark:text-slate-100 
              cursor-pointer hover:text-indigo-500 transition"
            >
              {post.title}
            </h3>

            {/* Content */}
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              {post.content}
            </p>

            {/* Image */}
            {post.featuredImg && (
              <div className="mt-3 w-48 aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${post.featuredImg}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
                  alt="post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Actions */}
            {user?.$id === post.authorID && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => navigate(`/edit/${post.$id}`)}
                  className="px-3 py-1 rounded-md 
                  bg-amber-100 text-amber-700 
                  dark:bg-amber-500/20 dark:text-amber-300 
                  hover:bg-amber-200 dark:hover:bg-amber-500/30 
                  transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(post.$id, post.featuredImg)}
                  className="px-3 py-1 rounded-md 
                  bg-rose-100 text-rose-600 
                  dark:bg-rose-500/20 dark:text-rose-300 
                  hover:bg-rose-200 dark:hover:bg-rose-500/30 
                  transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}