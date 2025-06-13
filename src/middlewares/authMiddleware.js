import jwt from 'jsonwebtoken'

export default function checkAuth(req, res, next) {
    try {
        const decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET)
        req.userId = decoded.id
    } catch {
        return res.send({
            status: 403,
            data: null,
            message: 'Invalid token'
        })
    }
    
    next()
}