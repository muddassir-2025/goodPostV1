import { useSelector } from "react-redux";
import { useState } from "react";
import postService from "../appwrite/post";
import { useNavigate } from "react-router-dom";

export default function Createpost() {
  const user = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) return;

    if (!image && !audio) {
      alert("Please upload image or audio");
      return;
    }

    setLoading(true);

    try {
      let imageId = null;
      let audioId = null;

      if (image) {
        const uploaded = await postService.uploadImage(image, user.$id);
        imageId = uploaded?.$id;
      }

      if (audio) {
        const uploaded = await postService.uploadAudio(audio, user.$id);
        audioId = uploaded?.$id;
      }

      const slug = title.toLowerCase().trim().replaceAll(" ", "-");

      await postService.createPost({
        title,
        content,
        slug,
        userId: user.$id,
        userName: user.name,
        imageId,
        audioId,
      });

      navigate("/");
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

 return (
  <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
    
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl bg-[#121212] rounded-2xl p-6 space-y-6 shadow-2xl"
    >
      {/* HEADER */}
      <h2 className="text-3xl font-bold tracking-tight">
        Create Post
      </h2>

      {/* TITLE */}
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-[#1f1f1f] border border-[#2a2a2a] 
        rounded-lg px-4 py-3 text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {/* CONTENT */}
      <textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full bg-[#1f1f1f] border border-[#2a2a2a] 
        rounded-lg px-4 py-3 text-white placeholder-gray-400
        focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />

      {/* MEDIA SECTION */}
      <div className="grid grid-cols-2 gap-4">
        
       {/* IMAGE CARD */}
<label className="cursor-pointer bg-[#181818] border border-[#2a2a2a] 
  rounded-xl p-4 flex flex-col items-center gap-3 
  hover:bg-[#202020] transition w-40">

  {/* IMAGE PREVIEW BOX */}
  <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#121212] flex items-center justify-center">
    
    {image ? (
      <img
        src={URL.createObjectURL(image)}
        alt="preview"
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-3xl">🖼</span>
    )}

  </div>

  <span className="text-sm text-gray-400 text-center">
    {image ? image.name : "Upload Image"}
  </span>

  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => setImage(e.target.files[0])}
  />
</label>

        {/* AUDIO CARD */}
        <label className="cursor-pointer bg-[#181818] border border-[#2a2a2a] 
          rounded-xl p-4 flex flex-col items-center justify-center 
          hover:bg-[#202020] transition">

          <span className="text-2xl mb-2">🎧</span>
          <span className="text-sm text-gray-400">Upload Audio</span>

          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => setAudio(e.target.files[0])}
          />
        </label>
      </div>

      {/* PREVIEW */}
      <div className="space-y-3">
        {image && (
          <div className="bg-[#181818] p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Image Preview</p>
            <img
              src={URL.createObjectURL(image)}
              className="rounded-lg max-h-48 object-cover"
            />
          </div>
        )}

        {audio && (
          <div className="bg-[#181818] p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Audio Preview</p>
            <audio
              controls
              className="w-full"
              src={URL.createObjectURL(audio)}
            />
          </div>
        )}
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-500 hover:bg-green-400 
        text-black font-semibold py-3 rounded-full 
        transition active:scale-95 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Create Post"}
      </button>
    </form>
  </div>
);
}