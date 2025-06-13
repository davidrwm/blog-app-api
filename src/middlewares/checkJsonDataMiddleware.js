const checkJsonData = (req, res, next) => {
    if (req.headers['content-type'] !== 'application/json') {
        return res.send({
            status: 400,
            data: null,
            message: 'Only JSON data is accepted'
        })
    }
    
    next()
}

export default checkJsonData