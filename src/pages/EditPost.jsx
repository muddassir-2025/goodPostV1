import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import postService from "../appwrite/post";

export default function EditPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const [oldImageId, setOldImageId] = useState(null);

  useEffect(() => {
    postService.getPostById(id).then((post) => {
      setTitle(post.title);
      setContent(post.content);
      setOldImageId(post.featuredImg);
    });
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      let newFileId = oldImageId;

      if (image) {
        const file = await postService.uploadImage(image);
        newFileId = file.$id;

        if (oldImageId) {
          await postService.deleteFile(oldImageId);
        }
      }

      await postService.updatePost(id, {
        title,
        content,
        featuredImg: newFileId,
      });

      navigate("/");
    } catch (error) {
      console.log("UPDATE ERROR:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <form
        onSubmit={handleUpdate}
        className="w-full max-w-xl bg-white dark:bg-slate-900 
        border border-slate-200 dark:border-slate-800 
        rounded-xl shadow-sm p-6 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Edit Post
        </h2>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md 
          bg-slate-50 dark:bg-slate-800 
          border border-slate-200 dark:border-slate-700 
          text-slate-800 dark:text-slate-100 
          focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Title"
        />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-md 
          bg-slate-50 dark:bg-slate-800 
          border border-slate-200 dark:border-slate-700 
          text-slate-800 dark:text-slate-100 
          focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          placeholder="Content"
        />

        {/* File */}
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          className="w-full text-sm text-slate-600 dark:text-slate-300
          file:mr-4 file:py-2 file:px-4 
          file:rounded-md file:border-0
          file:bg-indigo-100 file:text-indigo-700
          dark:file:bg-indigo-500/20 dark:file:text-indigo-300
          hover:file:bg-indigo-200 dark:hover:file:bg-indigo-500/30"
        />

        {/* Button */}
        <button
          type="submit"
          className="w-full py-2 rounded-md 
          bg-emerald-500 text-white 
          hover:bg-emerald-600 
          active:scale-[0.98] transition"
        >
          Update Post
        </button>
      </form>
    </div>
  );
}