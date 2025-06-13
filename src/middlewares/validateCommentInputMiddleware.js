export default function validateCommentInput(req, res, next) {
    if (typeof req.body.body !== 'string' || req.body.body === '') {
        return res.send({
            status: 400,
            data: null,
            message: 'Invalid comment body'
        })
    }
    
    next()
}