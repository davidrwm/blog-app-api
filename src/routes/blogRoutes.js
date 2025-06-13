import express from 'express'
import db from '../db.js'
import checkJsonData from '../middlewares/checkJsonDataMiddleware.js'
import validatePostInput from '../middlewares/validatePostInputMiddleware.js'
import validateCommentInput from '../middlewares/validateCommentInputMiddleware.js'
import validatePost from '../middlewares/validatePostMiddleware.js'
import checkAuth from '../middlewares/authMiddleware.js'
import getUserId from '../middlewares/getUserIdMiddleware.js'

const blogRoutes = express.Router()

// Get all blog posts
blogRoutes.get('/', getUserId, (req, res) => {
    // Pagination
    const size = req.query.size || 10
    const page = req.query.page || 1

    // Get the posts
    // const getPostsQuery = db.prepare('SELECT * FROM posts LIMIT ? OFFSET ?')
    // const posts = getPostsQuery.all(size, (page - 1) * size)

    // const getPostsQuery = db.prepare(
    //     `
    //         SELECT posts.id, posts.title, posts.body, posts.user_id, users.username
    //         FROM posts
    //         LEFT JOIN users ON posts.user_id = users.id LIMIT ? OFFSET ?
    //     `
    // )

    const getPostsQuery = db.prepare(
        `
            SELECT
                posts.id,
                posts.title,
                posts.body,
                posts.user_id,
                users.username,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.is_like = TRUE
                ), 0) AS likes,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.is_like = FALSE
                ), 0) AS dislikes,
                IFNULL((
                    SELECT COUNT(comments.id)
                    FROM comments
                    WHERE comments.post_id = posts.id
                ), 0) AS comments,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.user_id = ? AND post_votes.is_like = TRUE
                ), 0) AS is_liked,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.user_id = ? AND post_votes.is_like = FALSE
                ), 0) AS is_disliked
            FROM posts
            LEFT JOIN users ON posts.user_id = users.id
            ORDER BY posts.id DESC
            LIMIT ? OFFSET ?
        `
    )

    const posts = getPostsQuery.all(req.userId, req.userId, size, (page - 1) * size)

    res.send({
        status: 200,
        data: posts || null,
        message: ''
    })
})

// Create new blog post
blogRoutes.post('/', checkAuth, checkJsonData, validatePostInput, (req, res) => {
    // Create the blog post
    const createPostQuery = db.prepare(
        `
            INSERT INTO posts (
                title, body, user_id
            ) VALUES (?, ?, ?)
        `
    )

    // const createdPost = createPostQuery.run(req.body.title, req.body.body, req.userId)
    createPostQuery.run(req.body.title, req.body.body, req.userId)

    res.send({
        status: 200,
        data: null,
        message: 'Post created successfully'
    })
})

// Get saved blog posts
blogRoutes.get('/savedPosts', checkAuth, (req, res) => {
    // const postsQuery = db.prepare('SELECT * FROM saved_posts WHERE user_id=?')

    // Pagination
    const size = req.query.size || 10
    const page = req.query.page || 1

    const postsQuery = db.prepare(
        `
            SELECT
                saved_posts.id, saved_posts.post_id,
                posts.title, posts.user_id, users.username,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.is_like = TRUE
                    GROUP BY post_votes.post_id
                ), 0) AS likes,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.is_like = FALSE
                    GROUP BY post_votes.post_id
                ), 0) AS dislikes,
                IFNULL((
                    SELECT COUNT(comments.id)
                    FROM comments
                    WHERE comments.post_id = posts.id
                    GROUP BY comments.post_id
                ), 0) AS comments,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = saved_posts.post_id AND post_votes.user_id = ? AND post_votes.is_like = TRUE
                ), 0) AS is_liked,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = saved_posts.post_id AND post_votes.user_id = ? AND post_votes.is_like = FALSE
                ), 0) AS is_disliked
            FROM saved_posts
            LEFT JOIN posts ON saved_posts.post_id = posts.id
            LEFT JOIN users ON saved_posts.user_id = users.id
            WHERE saved_posts.user_id = ?
            ORDER BY saved_posts.id DESC
            LIMIT ? OFFSET ?
        `
    )

    const posts = postsQuery.all(req.userId, req.userId, req.userId, size, (page - 1) * size)

    res.send({
        status: 200,
        data: posts,
        message: ''
    })
})

// Show posts created by the current user
blogRoutes.get('/myPosts', checkAuth, (req, res) => {
    // Pagination
    const size = req.query.size || 10
    const page = req.query.page || 1

    const query = db.prepare(
        `
            SELECT
                posts.id,
                posts.title,
                posts.body,
                posts.user_id,
                users.username,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.is_like = TRUE
                ), 0) AS likes,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.is_like = FALSE
                ), 0) AS dislikes,
                IFNULL((
                    SELECT COUNT(comments.id)
                    FROM comments
                    WHERE comments.post_id = posts.id
                ), 0) AS comments,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.user_id = ? AND post_votes.is_like = TRUE
                ), 0) AS is_liked,
                IFNULL((
                    SELECT COUNT(post_votes.id)
                    FROM post_votes
                    WHERE post_votes.post_id = posts.id AND post_votes.user_id = ? AND post_votes.is_like = FALSE
                ), 0) AS is_disliked
            FROM posts
            LEFT JOIN users ON posts.user_id = users.id
            WHERE posts.user_id = ?
            ORDER BY posts.id DESC
            LIMIT ? OFFSET ?
        `
    )

    const posts = query.all(req.userId, req.userId, req.userId, size, (page - 1) * size)

    res.send({
        status: 200,
        data: posts,
        message: ''
    })
})

// Get a blog post
blogRoutes.get('/:id', getUserId, (req, res) => {
    // Get the post
    // const getPostQuery = db.prepare('SELECT * FROM posts WHERE id=?')

    const getPostQuery = db.prepare(
        `
            SELECT 
            posts.id,
            posts.title,
            posts.body,
            posts.user_id,
            users.username,
            IFNULL((
                SELECT COUNT(post_votes.id)
                FROM post_votes
                WHERE post_votes.post_id = posts.id AND post_votes.is_like = TRUE
                GROUP BY post_votes.post_id
            ), 0) AS likes,
            IFNULL((
                SELECT COUNT(post_votes.id)
                FROM post_votes
                WHERE post_votes.post_id = posts.id AND post_votes.is_like = FALSE
                GROUP BY post_votes.post_id
            ), 0) AS dislikes,
            IFNULL((
                    SELECT COUNT(comments.id)
                    FROM comments
                    WHERE comments.post_id = posts.id
                    GROUP BY comments.post_id
                ), 0) AS comments,
            IFNULL((
                SELECT COUNT(post_votes.id)
                FROM post_votes
                WHERE post_votes.post_id = posts.id AND post_votes.user_id = ? AND post_votes.is_like = TRUE
            ), 0) AS is_liked,
            IFNULL((
                SELECT COUNT(post_votes.id)
                FROM post_votes
                WHERE post_votes.post_id = posts.id AND post_votes.user_id = ? AND post_votes.is_like = FALSE
            ), 0) AS is_disliked
            FROM posts
            LEFT JOIN users ON posts.user_id = users.id
            WHERE posts.id = ?
        `
    )

    const post = getPostQuery.get(req.userId, req.userId, req.params.id)

    res.send({
        status: post ? 200 : 404,
        data: post || null,
        message: post ? '' : 'Post not found'
    })
})

// Update a blog post
blogRoutes.put('/:id', checkAuth, checkJsonData, validatePostInput, (req, res) => {
    const updatePostQuery = db.prepare('UPDATE posts SET title=?, body=? WHERE id=? AND user_id=?')
    const updatePost = updatePostQuery.run(req.body.title, req.body.body, req.params.id, req.userId)

    res.send({
        status: updatePost.changes ? 200 : 404,
        data: null,
        message: updatePost.changes ? 'Post updated successfully' : 'Post not found'
    })
})

// Delete a blog post
blogRoutes.delete('/:id', checkAuth, (req, res) => {
    const deletePostQuery = db.prepare('DELETE FROM posts WHERE id=? AND user_id=?')
    const deletePost = deletePostQuery.run(req.params.id, req.userId)

    res.send({
        status: deletePost.changes ? 200 : 404,
        data: null,
        message: deletePost.changes ? 'Post deleted successfully' : 'Post not found'
    })
})

// Get all comments for a blog post
blogRoutes.get('/:id/comments', (req, res) => {
    // Pagination
    const size = req.query.size || 20
    const page = req.query.page || 1

    // const getCommentsQuery = db.prepare('SELECT * FROM comments WHERE post_id=? LIMIT ? OFFSET ?')
    const getCommentsQuery = db.prepare(
        `
            SELECT
                comments.id,
                comments.body,
                comments.user_id,
                users.username,
                IFNULL((
                    SELECT COUNT(comment_votes.id)
                    FROM comment_votes
                    WHERE comment_votes.comment_id = comments.id AND comment_votes.is_like = TRUE
                    GROUP BY comment_votes.comment_id
                ), 0) AS likes,
                IFNULL((
                    SELECT COUNT(comment_votes.id)
                    FROM comment_votes
                    WHERE comment_votes.comment_id = comments.id AND comment_votes.is_like = FALSE
                    GROUP BY comment_votes.comment_id
                ), 0) AS dislikes
            FROM comments
            LEFT JOIN users on comments.user_id = users.id
            WHERE comments.post_id=?
            ORDER BY comments.id DESC
            LIMIT ? OFFSET ?
        `
    )
    const comments = getCommentsQuery.all(req.params.id, size, (page - 1) * size)

    res.send({
        status: 200,
        data: comments || null,
        message: ''
    })
})

// Post a comment on a blog post
blogRoutes.post('/:id/comment', checkAuth, validatePost, checkJsonData, validateCommentInput, (req, res) => {
    const postCommentQuery = db.prepare(
        `
            INSERT INTO comments (
                body, user_id, post_id
            ) VALUES (?, ?, ?)
        `
    )

    const postComment = postCommentQuery.run(req.body.body, req.userId, req.params.id)

    res.send({
        status: postComment.changes ? 200 : 404,
        data: postComment.lastInsertRowid,
        message: postComment.changes ? 'Comment posted successfully' : 'Post not found'
    })
})

// Like a blog post
blogRoutes.get('/:id/like', checkAuth, validatePost, (req, res) => {
    // Delete current user's vote for the blog post
    const deleteVoteQuery = db.prepare('DELETE FROM post_votes WHERE user_id=? AND post_id=?')
    deleteVoteQuery.run(req.userId, req.params.id)

    // Create the like vote
    const createVoteQuery = db.prepare(
        `
            INSERT INTO post_votes (
                is_like, user_id, post_id
            ) VALUES (TRUE, ?, ?)
        `
    )

    const createVote = createVoteQuery.run(req.userId, req.params.id)

    res.send({
        status: createVote.changes ? 200 : 404,
        data: null,
        message: createVote.changes ? '' : 'Post not found'
    })
})

// Dislike a blog post
blogRoutes.get('/:id/dislike', checkAuth, validatePost, (req, res) => {
    // Delete current user's vote for the blog post
    const deleteVoteQuery = db.prepare('DELETE FROM post_votes WHERE user_id=? AND post_id=?')
    deleteVoteQuery.run(req.userId, req.params.id)

    // Create the dislike vote
    const createVoteQuery = db.prepare(
        `
            INSERT INTO post_votes (
                is_like, user_id, post_id
            ) VALUES (FALSE, ?, ?)
        `
    )

    const createVote = createVoteQuery.run(req.userId, req.params.id)

    res.send({
        status: createVote.changes ? 200 : 404,
        data: null,
        message: createVote.changes ? '' : 'Post not found'
    })
})

// Clear vote for a blog post
blogRoutes.get('/:id/clearVote', checkAuth, validatePost, (req, res) => {
    // Delete current user's vote for the blog post
    const deleteVoteQuery = db.prepare('DELETE FROM post_votes WHERE user_id=? AND post_id=?')
    const deleteVote = deleteVoteQuery.run(req.userId, req.params.id)

    res.send({
        status: deleteVote.changes ? 200 : 404,
        data: null,
        message: deleteVote.changes ? '' : 'Post not found'
    })
})

// Get a blog post's like count
blogRoutes.get('/:id/likes', validatePost, (req, res) => {
    const countQuery = db.prepare('SELECT COUNT(id) AS count FROM post_votes WHERE post_id=? AND is_like=TRUE')
    const count = countQuery.get(req.params.id)

    res.send({
        status: 200,
        data: count.count,
        message: ''
    })
})

// Get a blog post's dislike count
blogRoutes.get('/:id/dislikes', validatePost, (req, res) => {
    const countQuery = db.prepare('SELECT COUNT(id) AS count FROM post_votes WHERE post_id=? AND is_like=FALSE')
    const count = countQuery.get(req.params.id)

    res.send({
        status: 200,
        data: count.count,
        message: ''
    })
})

// Save a blog post
blogRoutes.get('/:id/save', checkAuth, validatePost, (req, res) => {
    // Make sure post is not already saved
    const checkSavedPostQuery = db.prepare('SELECT * FROM saved_posts WHERE user_id=? AND post_id=?')
    const savedPost = checkSavedPostQuery.get(req.userId, req.params.id)

    if (savedPost) {
        return res.send({
            status: 200,
            data: null,
            message: 'Post is already in saved posts list'
        })
    }

    const createSavedPostQuery = db.prepare(
        `
            INSERT INTO saved_posts (
                user_id, post_id
            ) VALUES (?, ?)
        `
    )

    const createSavedPost = createSavedPostQuery.run(req.userId, req.params.id)

    res.send({
        status: createSavedPost.changes ? 200 : 404,
        data: null,
        message: createSavedPost.changes ? 'Post added to saved posts list successfully' : 'Post not found'
    })
})

// Remove a blog post from saved posts list
blogRoutes.get('/:id/unsave', checkAuth, validatePost, (req, res) => {
    const unsavePostQuery = db.prepare('DELETE FROM saved_posts WHERE user_id=? AND post_id=?')

    const unsavePost = unsavePostQuery.run(req.userId, req.params.id)

    res.send({
        status: unsavePost.changes ? 200 : 404,
        data: null,
        message: unsavePost.changes ? 'Post removed from saved posts list successfully' : 'Post not found'
    })
})

export default blogRoutes