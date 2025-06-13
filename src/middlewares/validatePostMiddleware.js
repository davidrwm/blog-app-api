import db from "../db.js"

export default function validatePost(req, res, next) {
    // Get the post
    const postQuery = db.prepare('SELECT * FROM posts WHERE id=?')
    const post = postQuery.get(req.params.id)

    if (!post) {
        return res.send({
            status: 404,
            data: null,
            message: 'Post not found'
        })
    }

    next()
}