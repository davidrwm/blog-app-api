import jwt from 'jsonwebtoken'

export default function getUserId(req, res, next) {
    req.userId = 0

    try {
        const decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET)
        req.userId = decoded.id
    } catch (err) {
    }

    next()
}