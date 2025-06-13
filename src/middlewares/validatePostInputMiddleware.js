export default function validatePostInput(req, res, next) {
    if (typeof req.body.title !== 'string' || req.body.title === '') {
        return res.send({
            status: 400,
            data: null,
            message: 'Invalid title'
        })
    }

    if (typeof req.body.body !== 'string' || req.body.body === '') {
        return res.send({
            status: 400,
            data: null,
            message: 'Invalid body'
        })
    }

    next()
}