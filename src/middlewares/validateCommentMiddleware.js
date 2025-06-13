import db from "../db.js"

export default function validateComment(req, res, next) {
    const query = db.prepare('SELECT * FROM comments WHERE id=?')
    const comment = query.get(req.params.id)

    if (!comment) {
        return res.send({
            status: 404,
            data: null,
            message: 'Comment not found'
        })
    }

    next()
}