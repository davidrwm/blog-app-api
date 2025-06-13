import express from 'express'

import checkJsonData from '../middlewares/checkJsonDataMiddleware.js'
import validateCommentInput from '../middlewares/validateCommentInputMiddleware.js'
import validateComment from '../middlewares/validateCommentMiddleware.js'
import checkAuth from '../middlewares/authMiddleware.js'

import db from '../db.js'

const commentRoutes = express.Router()

// Update a comment
commentRoutes.put('/:id', checkAuth, checkJsonData, validateCommentInput, (req, res) => {
    const updateCommentQuery = db.prepare('UPDATE comments SET body=? WHERE id=? AND user_id=?')
    const updateComment = updateCommentQuery.run(req.body.body, req.params.id, req.userId)

    res.send({
        status: updateComment.changes ? 200 : 404,
        data: null,
        message: updateComment.changes ? 'Comment updated successfully' : 'Comment not found'
    })
})

// Delete a comment
commentRoutes.delete('/:id', checkAuth, (req, res) => {
    const deleteCommentQuery = db.prepare('DELETE FROM comments WHERE id=? AND user_id=?')
    const deleteComment = deleteCommentQuery.run(req.params.id, req.userId)

    res.send({
        status: deleteComment.changes ? 200 : 404,
        data: null,
        message: deleteComment.changes ? 'Comment deleted successfully' : 'Comment not found'
    })
})

// Like a comment
commentRoutes.get('/:id/like', checkAuth, validateComment, (req, res) => {
    // Delete already existing vote
    const deleteLikeQuery = db.prepare('DELETE FROM comment_votes WHERE user_id=? AND comment_id=?')
    deleteLikeQuery.run(req.userId, req.params.id)

    // Create like vote
    const createLikeQuery = db.prepare(
        `
            INSERT INTO comment_votes (
                is_like, user_id, comment_id
            ) VALUES (TRUE, ?, ?)
        `
    )

    const createLike = createLikeQuery.run(req.userId, req.params.id)

    res.send({
        status: createLike.changes ? 200 : 404,
        data: null,
        message: createLike.changes ? '' : 'Comment not found'
    })
})

// Dislike a comment
commentRoutes.get('/:id/dislike', checkAuth, validateComment, (req, res) => {
    // Delete already existing vote
    const deleteLikeQuery = db.prepare('DELETE FROM comment_votes WHERE user_id=? AND comment_id=?')
    deleteLikeQuery.run(req.userId, req.params.id)

    // Create dislike vote
    const createDislikeQuery = db.prepare(
        `
            INSERT INTO comment_votes (
                is_like, user_id, comment_id
            ) VALUES (FALSE, ?, ?)
        `
    )

    const createDislike = createDislikeQuery.run(req.userId, req.params.id)

    res.send({
        status: createDislike.changes ? 200 : 404,
        data: null,
        message: createDislike.changes ? '' : 'Comment not found'
    })
})

// Clear vote for a comment
commentRoutes.get('/:id/clearVote', checkAuth, validateComment, (req, res) => {
    const deleteQuery = db.prepare('DELETE FROM comment_votes WHERE user_id=? AND comment_id=?')
    const deleteVote = deleteQuery.run(req.userId, req.params.id)

    res.send({
        status: deleteVote.changes ? 200 : 404,
        data: null,
        message: deleteVote.changes ? '' : 'Comment not found'
    })
})

// Get like count for comment
commentRoutes.get('/:id/likes', (req, res) => {
    const query = db.prepare('SELECT COUNT(id) AS count FROM comment_votes WHERE comment_id=? AND is_like=TRUE')
    const count = query.get(req.params.id)

    res.send({
        status: 200,
        data: count.count,
        message: ''
    })
})

// Get dislike count for comment
commentRoutes.get('/:id/dislikes', (req, res) => {
    const query = db.prepare('SELECT COUNT(id) AS count FROM comment_votes WHERE comment_id=? AND is_like=FALSE')
    const count = query.get(req.params.id)

    res.send({
        status: 200,
        data: count.count,
        message: ''
    })
})

export default commentRoutes