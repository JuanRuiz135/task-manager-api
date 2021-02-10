const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail, sendByeByeEmail} = require('../emails/account')

// User endpoints

router.get('/users/me', auth, async (req, res) => {
    // Get all users
    res.send(req.user)
})


router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token})
    }catch(err) {
        res.status(400).send()
    }
})


router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e){
        res.status(500).send()
    }
})


router.post('/users/signup', async (req, res) => {
    // Create user
    const user = new User(req.body)
    try{
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token})
    } catch (e){
        res.status(400).send(e)
    }
})

router.patch('/users/me', auth, async (req, res) => {
    // Update user by ID
    const updates = Object.keys(req.body)
    const allowUpdates = ['name', 'email', 'password', 'age']
    const isValidUpdate = updates.every((update) => allowUpdates.includes(update))

    if (!isValidUpdate){
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try{
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
       await req.user.remove()
       sendByeByeEmail(req.user.email, req.user.name)
       res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res) =>{
    const buffer = await sharp(req.file.buffer).resize({width:200, height:200}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send({Success: 'The avatar was deleted.'})
})

router.get('/users/me/avatar', auth, async (req, res) =>{
    try {
        if (!req.user.avatar){
            throw new Error('Avatar not found')
        }

        res.set('Content-Type', 'image/png')
        res.send(req.user.avatar)

    } catch(e) {
        res.status(404).send()
    }
})

module.exports = router