import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftIcon, 
  PlusIcon, 
  HeartIcon, 
  HeartIcon as HeartIconSolid,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconFilled } from '@heroicons/react/24/solid';
import { discussionService, Discussion, Comment, DiscussionCreateRequest, CommentCreateRequest } from '../services/discussionService';
import toast from 'react-hot-toast';

interface DiscussionPanelProps {
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const DiscussionPanel: React.FC<DiscussionPanelProps> = ({
  courseId,
  moduleId,
  lessonId,
  isOpen,
  onClose
}) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState<DiscussionCreateRequest>({
    title: '',
    content: '',
    discussion_type: lessonId ? 'lesson' : moduleId ? 'module' : 'course',
    course_id: courseId,
    module_id: moduleId,
    lesson_id: lessonId,
    tags: []
  });
  const [newComment, setNewComment] = useState<CommentCreateRequest>({
    content: '',
    parent_comment_id: undefined
  });
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'discussions' | 'comments'>('discussions');
  
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadDiscussions();
    }
  }, [isOpen, courseId, moduleId, lessonId]);

  useEffect(() => {
    if (selectedDiscussion) {
      loadComments(selectedDiscussion.discussion_id);
      setActiveTab('comments');
    }
  }, [selectedDiscussion]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const response = await discussionService.getDiscussions({
        course_id: courseId,
        module_id: moduleId,
        lesson_id: lessonId,
        limit: 20
      });
      setDiscussions(response.discussions);
    } catch (error) {
      console.error('Failed to load discussions:', error);
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (discussionId: string) => {
    try {
      setCommentsLoading(true);
      const response = await discussionService.getDiscussionComments(discussionId, { limit: 50 });
      setComments(response);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const discussion = await discussionService.createDiscussion(newDiscussion);
      setDiscussions(prev => [discussion, ...prev]);
      setNewDiscussion({
        title: '',
        content: '',
        discussion_type: lessonId ? 'lesson' : moduleId ? 'module' : 'course',
        course_id: courseId,
        module_id: moduleId,
        lesson_id: lessonId,
        tags: []
      });
      setShowCreateForm(false);
      toast.success('Discussion created successfully!');
    } catch (error) {
      console.error('Failed to create discussion:', error);
      toast.error('Failed to create discussion');
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.content.trim() || !selectedDiscussion) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const comment = await discussionService.createComment(selectedDiscussion.discussion_id, {
        ...newComment,
        parent_comment_id: replyingTo?.comment_id
      });
      
      setComments(prev => [...prev, comment]);
      setNewComment({ content: '', parent_comment_id: undefined });
      setReplyingTo(null);
      setShowCommentForm(false);
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error('Failed to create comment');
    }
  };

  const handleToggleDiscussionLike = async (discussion: Discussion) => {
    try {
      const result = await discussionService.toggleDiscussionLike(discussion.discussion_id);
      setDiscussions(prev => prev.map(d => 
        d.discussion_id === discussion.discussion_id 
          ? { ...d, is_liked_by_user: result.liked, like_count: result.like_count }
          : d
      ));
      if (selectedDiscussion?.discussion_id === discussion.discussion_id) {
        setSelectedDiscussion(prev => prev ? { ...prev, is_liked_by_user: result.liked, like_count: result.like_count } : null);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleToggleCommentLike = async (comment: Comment) => {
    try {
      const result = await discussionService.toggleCommentLike(comment.comment_id);
      setComments(prev => prev.map(c => 
        c.comment_id === comment.comment_id 
          ? { ...c, is_liked_by_user: result.liked, like_count: result.like_count }
          : c
      ));
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleReplyToComment = (comment: Comment) => {
    setReplyingTo(comment);
    setNewComment({ content: '', parent_comment_id: comment.comment_id });
    setShowCommentForm(true);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredDiscussions = discussions.filter(discussion =>
    discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    discussion.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Discussions</h2>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
              {discussions.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>New Discussion</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-gray-500">✕</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Discussions List */}
          <div className={`w-1/2 border-r border-gray-200 flex flex-col ${activeTab === 'discussions' ? 'block' : 'hidden md:block'}`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Discussions */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredDiscussions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <ChatBubbleLeftIcon className="h-12 w-12 mb-2" />
                  <p>No discussions yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredDiscussions.map((discussion) => (
                    <div
                      key={discussion.discussion_id}
                      onClick={() => setSelectedDiscussion(discussion)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedDiscussion?.discussion_id === discussion.discussion_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {discussion.is_pinned && (
                            <BookmarkIcon className="h-4 w-4 text-yellow-500" />
                          )}
                          {discussion.is_locked && (
                            <LockClosedIcon className="h-4 w-4 text-gray-400" />
                          )}
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {discussion.title}
                          </h3>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(discussion.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {discussion.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>by {discussion.author_name}</span>
                          <span>{discussion.comment_count} comments</span>
                          <span>{discussion.view_count} views</span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDiscussionLike(discussion);
                          }}
                          className="flex items-center space-x-1 text-sm hover:text-red-500 transition-colors"
                        >
                          {discussion.is_liked_by_user ? (
                            <HeartIconFilled className="h-4 w-4 text-red-500" />
                          ) : (
                            <HeartIcon className="h-4 w-4" />
                          )}
                          <span>{discussion.like_count}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className={`w-1/2 flex flex-col ${activeTab === 'comments' ? 'block' : 'hidden md:block'}`}>
            {selectedDiscussion ? (
              <>
                {/* Discussion Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{selectedDiscussion.title}</h3>
                    <button
                      onClick={() => setSelectedDiscussion(null)}
                      className="md:hidden p-1 hover:bg-gray-100 rounded"
                    >
                      <span className="text-gray-500">✕</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{selectedDiscussion.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>by {selectedDiscussion.author_name} • {formatTimeAgo(selectedDiscussion.created_at)}</span>
                    <div className="flex items-center space-x-4">
                      <span>{selectedDiscussion.comment_count} comments</span>
                      <span>{selectedDiscussion.view_count} views</span>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4">
                  {commentsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <ChatBubbleLeftIcon className="h-12 w-12 mb-2" />
                      <p>No comments yet</p>
                      <p className="text-sm">Be the first to comment!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.comment_id} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {comment.author_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900">{comment.author_name}</span>
                                <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                                {comment.is_edited && (
                                  <span className="text-xs text-gray-400">(edited)</span>
                                )}
                              </div>
                              
                              <p className="text-gray-700 mb-2">{comment.content}</p>
                              
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => handleToggleCommentLike(comment)}
                                  className="flex items-center space-x-1 text-sm hover:text-red-500 transition-colors"
                                >
                                  {comment.is_liked_by_user ? (
                                    <HeartIconFilled className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <HeartIcon className="h-4 w-4" />
                                  )}
                                  <span>{comment.like_count}</span>
                                </button>
                                
                                <button
                                  onClick={() => handleReplyToComment(comment)}
                                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                  Reply
                                </button>
                              </div>
                              
                              {/* Replies */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-3 ml-4 space-y-3">
                                  {comment.replies.map((reply) => (
                                    <div key={reply.comment_id} className="flex items-start space-x-3">
                                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-600">
                                          {reply.author_name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="font-medium text-gray-900 text-sm">{reply.author_name}</span>
                                          <span className="text-xs text-gray-500">{formatTimeAgo(reply.created_at)}</span>
                                        </div>
                                        
                                        <p className="text-gray-700 text-sm mb-2">{reply.content}</p>
                                        
                                        <button
                                          onClick={() => handleToggleCommentLike(reply)}
                                          className="flex items-center space-x-1 text-xs hover:text-red-500 transition-colors"
                                        >
                                          {reply.is_liked_by_user ? (
                                            <HeartIconFilled className="h-3 w-3 text-red-500" />
                                          ) : (
                                            <HeartIcon className="h-3 w-3" />
                                          )}
                                          <span>{reply.like_count}</span>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={commentsEndRef} />
                    </div>
                  )}
                </div>

                {/* Comment Form */}
                <div className="border-t border-gray-200 p-4">
                  {replyingTo && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Replying to <span className="font-medium">{replyingTo.author_name}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{replyingTo.content}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleCreateComment} className="space-y-3">
                    <textarea
                      value={newComment.content}
                      onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {replyingTo && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setNewComment({ content: '', parent_comment_id: undefined });
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Cancel reply
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCommentForm(false);
                            setReplyingTo(null);
                            setNewComment({ content: '', parent_comment_id: undefined });
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newComment.content.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {replyingTo ? 'Reply' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ChatBubbleLeftIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a discussion to view comments</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Discussion Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create New Discussion</h3>
              </div>
              
              <form onSubmit={handleCreateDiscussion} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter discussion title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="What would you like to discuss?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    value={newDiscussion.tags?.join(', ') || ''}
                    onChange={(e) => setNewDiscussion(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    }))}
                    placeholder="Enter tags separated by commas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newDiscussion.title.trim() || !newDiscussion.content.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Discussion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionPanel;
