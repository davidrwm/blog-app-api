export default function validateAuthInput(req, res, next) {
    if (typeof req.body.username !== 'string' || req.body.username === '') {
        return res.send({
            status: 400,
            data: null,
            message: 'Invalid username'
        })
    }

    if (typeof req.body.password !== 'string' || req.body.password === '') {
        return res.send({
            status: 400,
            data: null,
            message: 'Invalid password'
        })
    }
    
    next()
}