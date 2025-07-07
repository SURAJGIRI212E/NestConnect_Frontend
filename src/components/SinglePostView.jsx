import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPostQuery, useGetCommentsQuery } from '../hooks/usePostCalls';
import { Tweet } from '../minicomponents/Tweet';
import { CreatePost } from '../minicomponents/CreatePost'; // Reusing for reply input
import { SpinnerShimmer } from "./LoadingShimmer";

export const SinglePostView = () => {
  const { postId: rawPostId } = useParams();
  // Ensure postId is a valid string, not "undefined" or null/undefined
  const postId = rawPostId === 'undefined' || !rawPostId ? null : rawPostId;

  const { data: post, isLoading: isPostLoading, isError: isPostError} = useGetPostQuery(postId);
  const { data: commentsData, isLoading: areCommentsLoading, isError: areCommentsError, error: commentsError } = useGetCommentsQuery(postId);
 
  const navigate = useNavigate();

  const [expandedComments, setExpandedComments] = useState(new Set());

  const toggleReplies = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  if (isPostLoading) return <div className="text-white text-center mt-8"><SpinnerShimmer/></div>;
 
  if (!post) return <div className="text-zinc-800 text-center mt-8">Post not found.</div>;
  // if (isPostError) return <div className="p-4 text-center text-red-800">Error loading post or Post not found.</div>;
  

  const comments = commentsData?.comments || [];

  // Helper to build a nested comment tree
  const buildCommentTree = (comments, parentId = null) => {
    const nestedComments = [];
    comments.forEach(comment => {
      // Check if this comment's parentPost matches the current parentId
      // And ensure the comment is not the main post itself
      if ((comment.parentPost?._id || null) === parentId) {
        nestedComments.push({
          ...comment,
          replies: buildCommentTree(comments, comment._id)
        });
      }
    });
    return nestedComments;
  };

  // Helper to sort comments: owner's comments first, then by createdAt
  const sortComments = (comments, postOwnerId) => {
    return [...comments].sort((a, b) => {
      const aIsOwner = a.ownerid?._id === postOwnerId;
      const bIsOwner = b.ownerid?._id === postOwnerId;

      if (aIsOwner && !bIsOwner) return -1; // a (owner) comes before b (non-owner)
      if (!aIsOwner && bIsOwner) return 1;  // b (owner) comes before a (non-owner)

      // If both are owner/non-owner, sort by createdAt (latest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    }).map(comment => ({
      ...comment,
      replies: comment.replies ? sortComments(comment.replies, postOwnerId) : []
    }));
  };

  const allComments = buildCommentTree(comments, postId);
  const sortedComments = sortComments(allComments, post.ownerid._id);

  const renderComments = (commentsToRender, depth = 0) => {
    return commentsToRender.map((comment) => (
      <div key={comment._id} className={`flex flex-col ${depth > 0 ? `ml-${depth * 4}` : ''}`}>
        <Tweet
          tweet={comment}
          isComment={true}
          isBookmarked={false}
          depth={depth} // Pass depth to Tweet component
          postOwnerId={post.ownerid._id} // Pass original post owner ID
        />
        {comment.replies && comment.replies.length > 0 &&  (
          <div className="ml-2 pl-2">
            <button
              onClick={() => toggleReplies(comment._id)}
              className="text-blue-500 hover:underline text-sm mt-1 mb-1 px-2 py-1 rounded-md bg-blue-100 hover:bg-blue-200"
            >
              {expandedComments.has(comment._id) ? 'Hide Replies' : `View ${comment.replies.length} Replies`}
            </button>
            {expandedComments.has(comment._id) && (
              <div className="border-l-2 border-gray-300 ">
                {renderComments(comment.replies, depth + 1)}
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col min-h-screen text-zinc-800 ">
      <div className="sticky top-0 z-10 bg-blue-200   px-4 py-3 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Post</h1>
      </div>
     {isPostError? <div className="p-4 text-center text-red-800">Post missing or deleted, please go back .</div>
     :(<div className="w-full max-w-2xl  backdrop-blur-lg rounded-xl shadow-lg ">
        {/* Main Post */}
        <Tweet tweet={post} isBookmarked={false} /> {/* Assuming isBookmarked will be passed if needed */}
        
        {/* Post Details edited or created*/}
        <div className="text-gray-600 text-xs px-4">
          <p>Posted on: {post?.createdAt ? new Date(post.createdAt).toLocaleString() : "N/A"}</p>
          {post?.edits?.editedAt && <p>Last edited: {new Date(post.edits.editedAt).toLocaleString()}</p>}
        </div>

        {/* Reply Input Section */}
        <div className="mt-2 px-4  border-t border-white border-opacity-20">
          <h2 className="text-base font-semibold ">Reply to post</h2>
          <CreatePost parentPost={postId} />
        </div>

        {/* Comments Section */}
        <div className=" px-4   border-t border-white border-opacity-20">
          <h2 className="text-base font-semibold ">{comments.length} Comments</h2>
          {areCommentsLoading && <div className="text-zinc-800 text-center">Loading comments...</div>}
          {areCommentsError && <div className="text-red-700 text-center">Error loading comments: {commentsError.message}</div>}
          {comments.length === 0 && !areCommentsLoading && (
            <p className="text-gray-600 text-center">No comments yet. Be the first to reply!</p>
          )}
          <div className="">
            {renderComments(sortedComments)} {/* Render comments using the recursive function */}
          </div>
        </div>
      </div>)}
    </div>
  );
}; 