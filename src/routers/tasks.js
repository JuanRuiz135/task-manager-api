const express = require('express')
const Task = require('../models/task')
const router = new express.Router()
const auth = require('../middleware/auth')

// Tasks endpoints 

router.post('/tasks', auth, async (req, res) => {
    // Create task
    const task = new Task({
        ...req.body,
        userId: req.user._id
    })

    try {
        const newTask = await task.save()
        res.status(201).send(newTask)
    } catch (e) {
        res.status(400).send(e)
    }
})


// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=CreatedAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.completed ) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ?  -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.status(200).send(req.user.tasks) 
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    // Get tasks by id
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, userId: req.user._id })
        if (!task){
            return res.status(400).send()
        }
        res.status(200).send(task)
    } catch (e) {
        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    // Update tasks by ID
    const updates = Object.keys(req.body)
    const allowUpdates = ['description', 'completed']
    // Check if update objects are valid
    const isValidUpdate = updates.every((update) => allowUpdates.includes(update))

    if (!isValidUpdate){
        return res.status(400).send({error: 'Invalid updates!'})
    }
    try{
        const task = await Task.findOne({_id: req.params.id, userId: req.user._id})

        if (!task){
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)

    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    // Delete task by id
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, userId: req.user._id})
        if (!task){
            res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router