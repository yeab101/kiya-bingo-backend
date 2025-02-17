require('dotenv').config()
const jwt = require('jsonwebtoken')
const jwtPrivateKey = "your_secret_key"

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token')
    if (!token) return res.status(401).send('you need to login and acquire token') 
    try {
        const decoded = jwt.verify(token, jwtPrivateKey)
        req.user = decoded
        next()
    } catch (error) {
        res.status(400).send('Invalid Token!')
    }
}