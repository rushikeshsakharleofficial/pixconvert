import React from "react";
import { useParams } from "react-router-dom";
import { blogData } from "../data/blogData";

const BlogPost = () => {
  const { id } = useParams();
  const post = blogData.find((post) => post.id === parseInt(id));

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <img src={post.imageUrl} alt={post.title} className="w-full h-96 object-cover mb-8" />
      <div className="prose max-w-none">
        <p>{post.content}</p>
      </div>
    </div>
  );
};

export default BlogPost;
