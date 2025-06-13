import express from 'express'
import cors from 'cors'

import authRoutes from './routes/authRoutes.js'
import blogRoutes from './routes/blogRoutes.js'
import commentRoutes from './routes/commentRoutes.js'

const app = express()

// Get port number
const PORT = process.env.PORT || 8989

// Use CORS
app.use(cors())

// Accept JSON data
app.use(express.json())

// Use routes
app.use('/auth', authRoutes)
app.use('/post', blogRoutes)
app.use('/comment', commentRoutes)

// Run the server
app.listen(PORT, (error) => {
    if (!error) {
        console.log('Server started on port', PORT)
    } else {
        console.log(error)
    }
})