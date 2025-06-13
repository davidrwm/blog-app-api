import express from 'express'

import checkAuth from '../middlewares/authMiddleware.js'
import checkJsonData from '../middlewares/checkJsonDataMiddleware.js'
import validateAuthInput from '../middlewares/validateAuthInputMiddleware.js'

import db from '../db.js'
import { compareSync, hashSync } from 'bcrypt'
import jwt from 'jsonwebtoken'

const authRoutes = express.Router()

// Login route
authRoutes.post('/login', checkJsonData, validateAuthInput, (req, res) => {
    // Get the user
    const userQuery = db.prepare('SELECT * FROM users WHERE username=?')
    const user = userQuery.get(req.body.username)

    // Make sure user exists and passwords match
    if (!user || compareSync(req.body.password, user.password) == false) {
        return res.send({
            status: 401,
            data: null,
            message: 'Invalid credentials'
        })
    }

    // Return JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: 3600 })

    res.send({
        status: 200,
        data: {
            id: user.id,
            username: user.username,
            token: token
        },
        message: 'Logged in successfully!'
    })
})

// Register route
authRoutes.post('/register', checkJsonData, validateAuthInput, (req, res) => {
    // Check if username is already taken
    const userQuery = db.prepare('SELECT * FROM users WHERE username=?')
    const user = userQuery.get(req.body.username)

    if (user) {
        return res.send({
            status: 401,
            data: null,
            message: 'Username is already taken'
        })
    }

    // Hash the password
    const passwordHash = hashSync(req.body.password, 1)

    // Create the user
    const createUserQuery = db.prepare(
        `
            INSERT INTO users (username, password) VALUES (?, ?)
        `
    )

    const createdUser = createUserQuery.run(req.body.username, passwordHash)

    // Return JWT token
    const token = jwt.sign(
        {
            id: createdUser.lastInsertRowid,
            username: req.body.username
        }, process.env.JWT_SECRET, { expiresIn: 3600 })

    res.send({
        status: 200,
        data: token,
        message: 'User created successfully!'
    })
})

authRoutes.post('/changePassword', checkJsonData, checkAuth, (req, res) => {
    // Validate input
    if (typeof req.body.currentPassword !== 'string' || req.body.currentPassword === '' ) {
        return res.send({
            status: 400,
            data: null,
            message: 'Invalid current password'
        })
    }

    if (typeof req.body.newPassword !== 'string' || req.body.newPassword === '' ) {
        return res.send({
            status: 400,
            data: null,
            message: 'Invalid new password'
        })
    }

    // Get the user's password
    const getUserQuery = db.prepare('SELECT * FROM users WHERE id=?')
    const user = getUserQuery.get(req.userId)

    // Make sure entered current password matches the user's current password
    if (compareSync(req.body.currentPassword, user.password) == false) {
        return res.send({
            status: 401,
            data: null,
            message: 'Incorrect current password'
        })
    }

    // Create new password hash
    const passwordHash = hashSync(req.body.newPassword, 1)

    // Update user data
    const updateQuery = db.prepare('UPDATE users SET password=? WHERE id=?')
    updateQuery.run(passwordHash, req.userId)

    res.send({
        status: 200,
        data: null,
        message: 'Password changed successfully'
    })
})

authRoutes.get('/userInfo', checkAuth, (req, res) => {
    const getUserQuery = db.prepare('SELECT id, username FROM users WHERE id = ?')
    const user = getUserQuery.get(req.userId)

    res.send({
        status: 200,
        data: user,
        message: ''
    })
})

export default authRoutes