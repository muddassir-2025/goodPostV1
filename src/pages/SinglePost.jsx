import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import postService from "../appwrite/post";
import commentService from "../appwrite/comment";
import likeService from "../appwrite/like";
import favoriteService from "../appwrite/favorite";

export default function SinglePost() {
  const { slug } = useParams();

  const [post, setPost] = useState(null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [likeLoading, setLikeLoading] = useState(false);

  const [fav, setFav] = useState(false);
  const [favId, setFavId] = useState(null);

  const user = useSelector((state) => state.auth.userData);

  // 🔹 Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await postService.getPost(slug);
        if (res) setPost(res);
      } catch (err) {
        console.log("Post fetch error:", err);
      }
    };

    fetchPost();
  }, [slug]);

  // 🔹 Fetch comments
  useEffect(() => {
    if (!post) return;

    const fetchComments = async () => {
      try {
        const res = await commentService.getComments(post.$id);
        setComments(res || []);
      } catch (err) {
        console.log("Comments error:", err);
      }
    };

    fetchComments();
  }, [post]);

  // 🔹 Fetch likes
  useEffect(() => {
    if (!post) return;

    const fetchLikes = async () => {
      try {
        const res = await likeService.countLikes(post.$id);
        setLikeCount(res?.total || 0);

        if (user) {
          const check = await likeService.getUserLike(post.$id, user.$id);
          setLiked(check?.total > 0);
        }
      } catch (err) {
        console.log("Likes fetch error:", err);
      }
    };

    fetchLikes();
  }, [post, user]);

  // favorite check :
  useEffect(() => {
    if (!user || !post) return;

    const checkFav = async () => {
      const res = await favoriteService.getUserFavorite(user.$id, post.$id);

      if (res.total > 0) {
        setFav(true);
        setFavId(res.documents[0].$id);
      }
    };

    checkFav();
  }, [user, post]);

  // favorite toggle :
  const handleFavorite = async () => {
  console.log("CLICKED");

  if (!user) return alert("Login first");

  // 🔥 TEMP: force toggle
  setFav((prev) => !prev);

  try {
    if (fav) {
      await favoriteService.removeFavorite(favId);
      setFavId(null);
    } else {
      const res = await favoriteService.addFavorite(user.$id, post.$id);
      console.log("RES:", res);
      setFavId(res?.$id);
    }
  } catch (err) {
    console.log("Favorite error:", err);
  }
};


  // 🔹 Add comment
  const handleAddComment = async () => {
    if (!user) return alert("Please login first");
    if (!newComment.trim()) return;

    try {
      await commentService.createComment({
        postId: post.$id,
        userId: user.$id,
        userName: user.name,
        content: newComment,
      });

      setNewComment("");

      const updated = await commentService.getComments(post.$id);
      setComments(updated || []);
    } catch (err) {
      console.log("Add comment error:", err);
    }
  };

  // 🔹 Like / Unlike
  const handleLike = async () => {
    if (likeLoading) return;
    if (!user) return alert("Please login first");

    setLikeLoading(true);

    try {
      const existing = await likeService.getUserLike(post.$id, user.$id);

      if (existing?.total > 0 && existing.documents.length > 0) {
        await likeService.deleteLike(existing.documents[0].$id);
        setLiked(false);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      } else {
        await likeService.createLike({
          postId: post.$id,
          userId: user.$id,
        });
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.log("Like error:", err);
    }

    setLikeLoading(false);
  };

  // 🔹 Edit comment
  const handleEdit = (comment) => {
    setEditingId(comment.$id);
    setEditText(comment.content);
  };

  const handleSave = async () => {
    if (!editText.trim()) return;

    try {
      await commentService.updateComment(editingId, {
        content: editText,
      });

      const updated = await commentService.getComments(post.$id);
      setComments(updated || []);

      setEditingId(null);
      setEditText("");
    } catch (err) {
      console.log("Edit error:", err);
    }
  };

  // 🔹 Delete comment
  const handleDelete = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);

      const updated = await commentService.getComments(post.$id);
      setComments(updated || []);
    } catch (err) {
      console.log("Delete error:", err);
    }
  };

  // 🔹 Loading
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        Loading post...
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-6">
      {/* Post Card */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 
        border border-slate-200 dark:border-slate-800 
        rounded-xl p-6 shadow-sm"
      >
        <p className="text-sm text-green-600 dark:text-green-400 mb-2">
          By: {post.authorName}
        </p>

        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {post.title}
        </h1>

        <p className="mt-3 text-slate-600 dark:text-slate-300">
          {post.content}
        </p>

        {post.featuredImg && (
          <img
            src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${post.featuredImg}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
            alt="post"
            className="mt-4 rounded-lg max-w-sm border border-slate-200 dark:border-slate-700"
          />
        )}

        {/* AUDIO */}
        <audio
          controls
          className="mt-2 w-full"
          src={`https://fra.cloud.appwrite.io/v1/storage/buckets/${import.meta.env.VITE_APPWRITE_BUCKET_ID}/files/${post.audioId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
        />

        {/* Like */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-rose-500 transition"
          >
            <span className="text-base">
              {liked ? "👍🏼" : "👎🏼"}
            </span>
            <span>{likeCount}</span>
          </button>
        </div>

        {/* <button onClick={handleFavorite} className="text-xl">
          {fav ? "❤️" : "🤍"}
        </button> */}

        <button
          onClick={() => {
            console.log("FAV CLICKED");   // 👈 add this
            handleFavorite();
          }}
          className="text-xl"
        >
          {fav ? "❤️" : "🤍"}
        </button>

      </div>

      {/* Comment Box */}
      <div className="max-w-3xl mx-auto mt-6">
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 rounded-md 
            bg-white dark:bg-slate-900 
            border border-slate-200 dark:border-slate-800 
            text-slate-800 dark:text-slate-100 
            focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <button
            onClick={handleAddComment}
            className="px-4 py-2 rounded-md 
            bg-indigo-500 text-white 
            hover:bg-indigo-600 transition"
          >
            Post
          </button>
        </div>

        {/* Comments */}
        <div className="mt-6 space-y-3">
          {comments.map((c) => (
            <div
              key={c.$id}
              className="p-3 rounded-md bg-white dark:bg-slate-900 
              border border-slate-200 dark:border-slate-800"
            >
              <b className="text-slate-800 dark:text-slate-100">
                {c.userName}
              </b>

              {editingId === c.$id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 px-2 py-1 rounded-md 
                    bg-slate-50 dark:bg-slate-800 
                    border border-slate-200 dark:border-slate-700"
                  />

                  <button
                    onClick={handleSave}
                    className="px-3 py-1 rounded-md bg-green-500 text-white"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 rounded-md bg-slate-300 dark:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">
                    {c.content}
                  </p>

                  {user && user.$id === c.userId && (
                    <div className="flex gap-2 mt-2 text-sm">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-indigo-500"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(c.$id)}
                        className="text-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}