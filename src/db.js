import { hashSync } from 'bcrypt'
import { DatabaseSync } from 'node:sqlite'

// Create local database
const db = new DatabaseSync(':memory:')

// Create users table
db.exec(
    `
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username STRING NOT NULL,
            password STRING NOT NULL
        )
    `
)

// Create default administrator user
const passwordHash = hashSync('password', 1)
const createAdminQuery = db.prepare("INSERT INTO users (username, password) VALUES ('admin', ?)")
createAdminQuery.run(passwordHash)

// Create posts table
db.exec(
    `
        CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title STRING NOT NULL,
            body STRING NOT NULL,
            user_id INTEGER NOT NULL,

            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `
)

// Create comments table
db.exec(
    `
        CREATE TABLE comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            body STRING NOT NULL,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,

            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        )
    `
)

// Create post votes table
db.exec(
    `
        CREATE TABLE post_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            is_like BOOLEAN NOT NULL DEFAULT FALSE,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,

            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        )
    `
)

// Create comment votes table
db.exec(
    `
        CREATE TABLE comment_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            is_like BOOLEAN NOT NULL DEFAULT FALSE,
            user_id INTEGER NOT NULL,
            comment_id INTEGER NOT NULL,

            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
        )
    `
)

// Create saved posts table
db.exec(
    `
        CREATE TABLE saved_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,

            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        )
    `
)

// Create sample posts
for (let i = 0; i < 20; i++) {
    const query = db.prepare(
        `
            INSERT INTO posts (
                title, body, user_id
            ) VALUES (?, ?, ?)
        `
    )

    query.run(`Blog Post ${i + 1}`, 'Lorem ipsum dolor sit amet', 1)
}

export default db