const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOne, userOneId, populateDB } = require('./fixtures/db')

beforeEach(populateDB)


test('Should signup a new user', async () => {
    const response = await request(app).post('/users/signup').send({
        name: 'Andrew',
        email: 'andrew@exm.com',
        password: 'dsadada223'
    }).expect(201)

    // fetch user from db
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    //expect(response.body.user.name).toBe('Andrew')
    expect(response.body).toMatchObject({
        user: {
            name: 'Andrew',
            email: 'andrew@exm.com'
        }, 
        token: user.tokens[0].token
    })
})

test('Should login a user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(response.body.user._id)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login non-existent user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email,
        password: 'sdaddadasdasd'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set(`Authorization`, `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async() => [
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
])

test('Should delete account for user', async () => {
    const response = await request(app)
        .delete('/users/me')
        .set(`Authorization`, `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(response.body._id)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set(`Authorization`, `Bearer ${userOne.tokens[0].token}`)
        .attach('upload', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

        const user = await User.findById(userOneId)
        expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async() => {
    await request(app)
        .patch('/users/me')
        .set(`Authorization`, `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Juan'
        })
        .expect(200)
    
    const user = await User.findById(userOneId)
    expect(user.name).toBe('Juan')
})

test('Should not update invalid user fields', async() => {
    await request(app)
        .patch('/users/me')
        .set(`Authorization`, `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Tijuana'
        })
        .expect(400)
})