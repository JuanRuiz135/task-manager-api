const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const {
    userOne,
    userOneId,
    userTwoId,
    userTwo,
    taskOne,
    populateDB
} = require('./fixtures/db')

beforeEach(populateDB)

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set(`Authorization`, `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'test'
        }).expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
})

test('Should get all task from user 1', async () => {
    const response = await request(app)
        .get('/tasks')
        .set(`Authorization`, `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'test', 
            userId: userOneId
        }).expect(200)

    expect(response.body.length).toBe(1)
})

test('Should not let user 2 delete tasks from user 1', async () => {
    const response = await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set(`Authorization`, `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)

        const task = Task.findById(taskOne._id)
        expect(task).not.toBeNull()

})